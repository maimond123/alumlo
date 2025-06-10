-- =====================================================
-- MINIMAL VECTOR INDEX CREATION
-- =====================================================
-- This creates ONLY the essential vector index with minimal memory usage

-- Check current memory setting
SHOW maintenance_work_mem;

-- Increase memory temporarily 
SET maintenance_work_mem = '128MB';

-- Check your table size first
SELECT 
    COUNT(*) as total_rows,
    pg_size_pretty(pg_total_relation_size('chick_fil_a_alumni_vector')) as table_size
FROM chick_fil_a_alumni_vector;

-- Create the vector index with minimal lists parameter
-- Start with lists=25 (requires ~32MB)
CREATE INDEX IF NOT EXISTS chick_fil_a_alumni_vector_embedding_idx 
ON chick_fil_a_alumni_vector 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 25);

-- Verify it was created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'chick_fil_a_alumni_vector'
  AND indexname LIKE '%embedding%';

-- Update statistics
ANALYZE chick_fil_a_alumni_vector;

-- Test the index works
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name, 1 - (embedding <=> '[0,0,0,0,0,0,0,0,0,0]'::vector(1536)) as similarity
FROM chick_fil_a_alumni_vector 
ORDER BY embedding <=> '[0,0,0,0,0,0,0,0,0,0]'::vector(1536)
LIMIT 5;

/*
TROUBLESHOOTING:

If this still fails, try even smaller lists:
- WITH (lists = 10)  -- requires ~16MB
- WITH (lists = 5)   -- requires ~8MB

The trade-off:
- Smaller lists = less memory needed, but slightly slower searches
- For testing purposes, even lists=10 will work fine
*/ 