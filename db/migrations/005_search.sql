-- One search function, replacing three.
--
-- The 2025 system had standard_search_function_<tenant>, chronological_search_
-- function_<tenant> and temporal_filter_search_<tenant>: three functions per
-- customer, each written separately, each with the tenant name in its
-- identifier. They did not do three different things. All three filter the
-- profile set and order it; they differed only in which filter keys they read,
-- so the standard one grew to accept 115 keys while the pipeline emitted 12.
--
-- Filters this reads, and nothing else. A key that is absent or null is not
-- applied. A key that names an empty column returns no rows rather than being
-- silently ignored: the 2025 pipeline emitted pre_company_role_filter, the SQL
-- read pre_company_title_filter, and the mismatch produced unfiltered results
-- with no error.
--
--   Career phase   pre_company_{company,title,location,school,industry}_filter
--                  post_company_{company,title,location,industry}_filter
--   Current        company_filter, title_filter, location_filter, school_filter
--   Tenure         exit_year_min, exit_year_max
--
-- Ordering is by cosine distance when an embedding is supplied, otherwise by
-- most recent exit.

-- Case-insensitive substring match against any element of a text[].
CREATE OR REPLACE FUNCTION array_matches(haystack text[], needle text)
RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
    SELECT needle IS NULL
        OR EXISTS (SELECT 1 FROM unnest(coalesce(haystack, '{}')) AS e
                    WHERE e ILIKE '%' || needle || '%')
$$;

CREATE OR REPLACE FUNCTION search_profiles(
    p_tenant_id bigint,
    p_filters   jsonb          DEFAULT '{}',
    p_embedding vector(1024)   DEFAULT NULL,
    p_limit     integer        DEFAULT 50
)
RETURNS TABLE (
    profile_id                   bigint,
    name                         text,
    headline                     text,
    profile_url                  text,
    picture_url                  text,
    home_location                text,
    current_company              text,
    current_title                text,
    exit_year                    integer,
    total_years_tenure           integer,
    pre_company_companies        text[],
    pre_company_titles           text[],
    post_company_companies       text[],
    post_company_titles          text[],
    undergraduate_school         text[],
    graduate_school              text[],
    similarity                   double precision
)
LANGUAGE sql STABLE AS $$
    SELECT p.profile_id, p.name, p.headline, p.profile_url, p.picture_url,
           p.home_location, p.current_company, p.current_title,
           p.exit_year, p.total_years_tenure,
           p.pre_company_companies, p.pre_company_titles,
           p.post_company_companies, p.post_company_titles,
           p.undergraduate_school, p.graduate_school,
           CASE WHEN p_embedding IS NULL THEN NULL
                ELSE 1 - (p.embedding <=> p_embedding) END AS similarity
      FROM profiles p
     WHERE p.tenant_id = p_tenant_id
       -- Career phase before the tenure at the tenant company
       AND array_matches(p.pre_company_companies,  p_filters->>'pre_company_company_filter')
       AND array_matches(p.pre_company_titles,     p_filters->>'pre_company_title_filter')
       AND array_matches(p.pre_company_locations,  p_filters->>'pre_company_location_filter')
       AND array_matches(p.pre_company_industries, p_filters->>'pre_company_industry_filter')
       -- Career phase after it
       AND array_matches(p.post_company_companies,  p_filters->>'post_company_company_filter')
       AND array_matches(p.post_company_titles,     p_filters->>'post_company_title_filter')
       AND array_matches(p.post_company_locations,  p_filters->>'post_company_location_filter')
       AND array_matches(p.post_company_industries, p_filters->>'post_company_industry_filter')
       -- Education, across both degree levels
       AND (p_filters->>'pre_company_school_filter' IS NULL
            OR array_matches(p.undergraduate_school, p_filters->>'pre_company_school_filter')
            OR array_matches(p.graduate_school,      p_filters->>'pre_company_school_filter'))
       AND (p_filters->>'school_filter' IS NULL
            OR array_matches(p.undergraduate_school, p_filters->>'school_filter')
            OR array_matches(p.graduate_school,      p_filters->>'school_filter'))
       -- Current position
       AND (p_filters->>'company_filter'  IS NULL OR p.current_company     ILIKE '%' || (p_filters->>'company_filter')  || '%')
       AND (p_filters->>'title_filter'    IS NULL OR p.current_title       ILIKE '%' || (p_filters->>'title_filter')    || '%')
       AND (p_filters->>'location_filter' IS NULL OR p.home_location       ILIKE '%' || (p_filters->>'location_filter') || '%')
       -- Tenure window
       AND (p_filters->>'exit_year_min' IS NULL OR p.exit_year >= (p_filters->>'exit_year_min')::int)
       AND (p_filters->>'exit_year_max' IS NULL OR p.exit_year <= (p_filters->>'exit_year_max')::int)
       -- A vector query only considers rows that have an embedding.
       AND (p_embedding IS NULL OR p.embedding IS NOT NULL)
     ORDER BY
       CASE WHEN p_embedding IS NULL THEN NULL ELSE p.embedding <=> p_embedding END
         ASC NULLS LAST,
       p.exit_year DESC NULLS LAST
     LIMIT p_limit
$$;

COMMENT ON FUNCTION search_profiles IS
'Tenant-scoped profile search. Filters by career phase, education, current
position and tenure window; orders by cosine distance when an embedding is
given. Sequence queries ("left, then moved into sales within six months")
need per-position rows with dates and are not supported here -- profiles
stores career phases as arrays, which cannot express ordering between two
post-tenure positions.';
