-- One profiles table, replacing two.
--
-- The previous schema had a *_alumni_vector table (87 columns) and a
-- *_alumni_standard_table (76 columns) per tenant. Every column of the second
-- existed in the first -- a strict subset -- so the same profile was written
-- twice by two separate ingest scripts with nothing reconciling them.
--
-- Columns that carried the tenant name are renamed to what they actually mean.
-- The company they referred to is the tenant, which is now a row value:
--   chick_fil_a_exit_year          -> exit_year
--   years_since_chick_fil_a        -> years_since_exit
--   post_chick_fil_a_companies     -> post_tenure_companies
--   total_years_at_chick_fil_a     -> total_years_tenure   (and 10 more)
CREATE TABLE profiles (
    id        bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id bigint NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_id bigint,
    name text,
    embedding vector(1024),   -- BGE-M3, generated locally by ingest/embed.py
    embedding_text text,
    
    -- Profile information
    profile_url text,
    picture_url text,
    headline text,
    home_location text,
    post_company_current_company text,
    post_company_current_title text,
    post_company_current_industry text,
    post_company_current_location text,
    -- Alias fields for easier frontend access
    current_company text, -- Alias for post_company_current_company
    current_title text,   -- Alias for post_company_current_title
    current_job_location text, -- Alias for post_company_current_location
    -- Tenure at the tenant company
    exit_year int,
    had_multiple_company_stints boolean,
    -- Arrays for comprehensive search capability
    post_company_companies text[],
    post_company_titles text[],
    post_company_industries text[],
    post_company_locations text[],
    -- Pre-company arrays for comprehensive search
    pre_company_companies text[],
    pre_company_titles text[],
    pre_company_industries text[],
    pre_company_locations text[],
    -- Education arrays for comprehensive search
    undergraduate_school text[],
    graduate_school text[],
    high_school text[],
    pre_company_education text[],
    during_company_education text[],
    post_company_education text[],
    -- NEW: Career Progression & Leadership
    current_job_level text,
    current_job_function text,
    is_current_leader boolean DEFAULT FALSE,
    management_experience boolean DEFAULT FALSE,
    revenue_responsibility boolean DEFAULT FALSE,
    years_since_exit integer,
    -- NEW: Company & Industry Intelligence
    current_company_size_category text,
    has_startup_experience boolean DEFAULT FALSE,
    has_enterprise_experience boolean DEFAULT FALSE,
    industry_transitions text[],
    -- NEW: Skills & Experience Patterns
    technical_background boolean DEFAULT FALSE,
    sales_experience boolean DEFAULT FALSE,
    consulting_experience boolean DEFAULT FALSE,
    restaurant_operations_experience boolean DEFAULT FALSE,
    is_remote_worker boolean DEFAULT FALSE,
    total_positions_count integer,
    average_tenure_months decimal,
    -- NEW: Educational Background
    highest_degree_level text,
    school_ranking_tier text,
    stem_education boolean DEFAULT FALSE,
    business_education boolean DEFAULT FALSE,
    continued_education boolean DEFAULT FALSE,
    executive_education boolean DEFAULT FALSE,
    technical_certifications boolean DEFAULT FALSE,
    -- NEW: Educational Context
    major_category text,
    undergraduate_major text,
    graduate_specialization text,
    education_geography text[],
    elite_education boolean DEFAULT FALSE,
    -- NEW: Derived Intelligence
    career_trajectory text,
    mentor_potential boolean DEFAULT FALSE,
    -- NEW: Salary Analysis Fields
    current_estimated_salary DECIMAL(10,2),
    highest_career_salary DECIMAL(10,2),
    pre_tenure_salary DECIMAL(10,2),
    first_post_tenure_salary DECIMAL(10,2),
    -- Outcome flags: did the tenure improve this person's trajectory?
    provided_salary_lift BOOLEAN DEFAULT FALSE,
    achieved_six_figure_post_tenure BOOLEAN DEFAULT FALSE,
    doubled_salary_post_tenure BOOLEAN DEFAULT FALSE,
    moved_to_leadership_post_tenure BOOLEAN DEFAULT FALSE,
    career_level_increase_post_tenure BOOLEAN DEFAULT FALSE,
    -- NEW: Enhanced Search Categories
    functional_expertise text[],
    industry_expertise text[],
    career_stage text,
    likely_job_seeking boolean DEFAULT FALSE,
    -- Enhanced natural language fields for vectorization (comprehensive only)
    natural_language_experiences text,
    natural_language_education text,
    -- Temporal analysis
    career_timeline jsonb,
    education_timeline jsonb,
    tenure_years integer[],
    post_tenure_timeline jsonb,
    total_years_tenure integer,
    post_tenure_functions text[],
    post_tenure_companies text[],
    created_at timestamp with time zone DEFAULT now()
);

-- Every query filters by tenant first, so it leads each composite index.
CREATE UNIQUE INDEX profiles_tenant_profile_idx ON profiles (tenant_id, profile_id);
CREATE INDEX profiles_tenant_exit_year_idx     ON profiles (tenant_id, exit_year);
CREATE INDEX profiles_tenant_job_level_idx     ON profiles (tenant_id, current_job_level);
CREATE INDEX profiles_tenant_career_stage_idx  ON profiles (tenant_id, career_stage);

-- Array containment filters (schools, companies, expertise) need GIN.
CREATE INDEX profiles_undergrad_gin   ON profiles USING gin (undergraduate_school);
CREATE INDEX profiles_post_co_gin     ON profiles USING gin (post_company_companies);
CREATE INDEX profiles_func_exp_gin    ON profiles USING gin (functional_expertise);
CREATE INDEX profiles_ind_exp_gin     ON profiles USING gin (industry_expertise);

-- Vector search. HNSW over cosine distance, matching the <=> operator the
-- search functions use.
CREATE INDEX profiles_embedding_hnsw ON profiles
    USING hnsw (embedding vector_cosine_ops);
