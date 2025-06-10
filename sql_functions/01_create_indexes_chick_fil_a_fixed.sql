-- =====================================================
-- PERFORMANCE INDEXES FOR CHICK-FIL-A ALUMNI VECTOR TABLE
-- =====================================================
-- FIXED VERSION: Handles memory limitations for vector index creation

-- STEP 1: Temporarily increase memory for index creation
-- Save current setting and increase maintenance_work_mem
SET maintenance_work_mem = '128MB';  -- Increase from default 32MB to 128MB

-- Show current setting to confirm
SHOW maintenance_work_mem;

-- =====================================================
-- VECTOR INDEX CREATION (Most Important for Performance)
-- =====================================================

-- Create vector index with reduced lists parameter to use less memory
-- Using lists=50 instead of 100 to reduce memory requirements
CREATE INDEX IF NOT EXISTS chick_fil_a_alumni_vector_embedding_idx 
ON chick_fil_a_alumni_vector 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 50);

-- Note: lists=50 should work with 128MB maintenance_work_mem
-- If you still get memory errors, try lists=25

-- =====================================================
-- METADATA INDEXES FOR FILTERING
-- =====================================================
-- These are less memory-intensive

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

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON FILTER COMBINATIONS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_job_level_function 
ON chick_fil_a_alumni_vector(current_job_level, current_job_function) 
WHERE current_job_level IS NOT NULL AND current_job_function IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chick_fil_a_industry_location 
ON chick_fil_a_alumni_vector(post_company_current_industry, post_company_current_location) 
WHERE post_company_current_industry IS NOT NULL AND post_company_current_location IS NOT NULL;

-- =====================================================
-- FINALIZATION
-- =====================================================

-- Update table statistics
ANALYZE chick_fil_a_alumni_vector;

-- Reset maintenance_work_mem to default (optional)
-- RESET maintenance_work_mem;

-- =====================================================
-- VERIFY INDEX CREATION
-- =====================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'chick_fil_a_alumni_vector'
ORDER BY indexname;

-- Check specifically for the vector index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'chick_fil_a_alumni_vector'
  AND indexname LIKE '%embedding%';

-- =====================================================
-- TROUBLESHOOTING NOTES
-- =====================================================
/*
If you still get memory errors:

1. Further reduce lists parameter:
   WITH (lists = 25)  -- or even lists = 10

2. Increase memory even more:
   SET maintenance_work_mem = '256MB';

3. Check your data size:
   SELECT COUNT(*), pg_size_pretty(pg_total_relation_size('chick_fil_a_alumni_vector'))
   FROM chick_fil_a_alumni_vector;

4. If you have superuser access, you can modify postgresql.conf:
   maintenance_work_mem = 128MB
   Then restart PostgreSQL

MEMORY REQUIREMENTS BY LISTS PARAMETER:
- lists = 10:  ~16 MB
- lists = 25:  ~32 MB  
- lists = 50:  ~64 MB
- lists = 100: ~128 MB

Choose lists based on your available memory and data size.
*/ 