-- =====================================================
-- PERFORMANCE INDEXES FOR CHICK-FIL-A ALUMNI VECTOR TABLE
-- =====================================================
-- Run these indexes BEFORE creating the vector-first function
-- to ensure optimal performance and prevent timeouts

-- 1. VECTOR INDEX (Most Important for Performance)
-- This enables fast vector similarity search using IVFFlat algorithm
CREATE INDEX IF NOT EXISTS chick_fil_a_alumni_vector_embedding_idx 
ON chick_fil_a_alumni_vector 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Note: You may need to adjust 'lists' parameter based on your data size
-- Rule of thumb: lists = sqrt(number_of_rows), but generally 100 is good for up to 1M rows

-- 2. METADATA INDEXES FOR FILTERING
-- These enable fast filtering on commonly used metadata fields

-- Basic filter indexes
CREATE INDEX IF NOT EXISTS idx_chick_fil_a_company_filter 
ON chick_fil_a_alumni_vector(post_company_current_company) 
WHERE post_company_current_company IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_industry_filter 
ON chick_fil_a_alumni_vector(post_company_current_industry) 
WHERE post_company_current_industry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_title_filter 
ON chick_fil_a_alumni_vector 
USING gin(to_tsvector('english', post_company_current_title));

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_location_filter 
ON chick_fil_a_alumni_vector(post_company_current_location) 
WHERE post_company_current_location IS NOT NULL;

-- Enhanced filter indexes
CREATE INDEX IF NOT EXISTS idx_chick_fil_a_job_level 
ON chick_fil_a_alumni_vector(current_job_level) 
WHERE current_job_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_job_function 
ON chick_fil_a_alumni_vector(current_job_function) 
WHERE current_job_function IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_career_stage 
ON chick_fil_a_alumni_vector(career_stage) 
WHERE career_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_degree_level 
ON chick_fil_a_alumni_vector(highest_degree_level) 
WHERE highest_degree_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_school_tier 
ON chick_fil_a_alumni_vector(school_ranking_tier) 
WHERE school_ranking_tier IS NOT NULL;

-- Boolean field indexes (for fast boolean filtering)
CREATE INDEX IF NOT EXISTS idx_chick_fil_a_leadership 
ON chick_fil_a_alumni_vector(is_current_leader) 
WHERE is_current_leader = true;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_management_exp 
ON chick_fil_a_alumni_vector(management_experience) 
WHERE management_experience = true;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_technical_bg 
ON chick_fil_a_alumni_vector(technical_background) 
WHERE technical_background = true;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_sales_exp 
ON chick_fil_a_alumni_vector(sales_experience) 
WHERE sales_experience = true;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_startup_exp 
ON chick_fil_a_alumni_vector(has_startup_experience) 
WHERE has_startup_experience = true;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_enterprise_exp 
ON chick_fil_a_alumni_vector(has_enterprise_experience) 
WHERE has_enterprise_experience = true;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_remote_worker 
ON chick_fil_a_alumni_vector(is_remote_worker) 
WHERE is_remote_worker = true;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_mentor_potential 
ON chick_fil_a_alumni_vector(mentor_potential) 
WHERE mentor_potential = true;

-- Range filter indexes
CREATE INDEX IF NOT EXISTS idx_chick_fil_a_exit_year 
ON chick_fil_a_alumni_vector(chick_fil_a_exit_year) 
WHERE chick_fil_a_exit_year IS NOT NULL;

-- School/Education indexes (for array fields using GIN)
CREATE INDEX IF NOT EXISTS idx_chick_fil_a_undergrad_schools 
ON chick_fil_a_alumni_vector 
USING gin(undergraduate_school);

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_grad_schools 
ON chick_fil_a_alumni_vector 
USING gin(graduate_school);

-- 3. COMPOSITE INDEXES FOR COMMON FILTER COMBINATIONS
-- These help when multiple filters are applied together

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_job_level_function 
ON chick_fil_a_alumni_vector(current_job_level, current_job_function) 
WHERE current_job_level IS NOT NULL AND current_job_function IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_industry_location 
ON chick_fil_a_alumni_vector(post_company_current_industry, post_company_current_location) 
WHERE post_company_current_industry IS NOT NULL AND post_company_current_location IS NOT NULL;

-- 4. ENSURE STATISTICS ARE UP TO DATE
-- This helps PostgreSQL choose optimal query plans
ANALYZE chick_fil_a_alumni_vector;

-- 5. VERIFY INDEX CREATION
-- Run this to check that all indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'chick_fil_a_alumni_vector'
ORDER BY indexname;

-- Expected output should show all the indexes created above
-- The vector index should show: USING ivfflat (embedding vector_cosine_ops) 