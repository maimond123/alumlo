import { db } from './db';

/**
 * Tenant-scoped aggregates over `profiles`.
 *
 * /learn used to answer from a hardcoded table of statistics -- an average
 * salary, an industry breakdown, an executive-attainment rate -- none of which
 * came from the corpus. Every column behind them is null in all 6,470 rows.
 *
 * These are the aggregates the data can actually support. `unavailable` is
 * computed from the coverage counts rather than written down, so a dimension
 * stops being disclaimed the moment enrichment populates it.
 */

export interface Bucket {
  name: string;
  count: number;
  pct: number;
}

export interface TenantInsights {
  tenantName: string;
  totalProfiles: number;
  /** Rows backing each dimension. A dimension at 0 cannot be discussed. */
  coverage: Record<string, number>;
  /** Dimensions with no data, derived from `coverage`. */
  unavailable: string[];
  topCurrentCompanies: Bucket[];
  topCurrentTitles: Bucket[];
  topLocations: Bucket[];
  topUndergraduateSchools: Bucket[];
  exitYears: Array<{ year: number; count: number }>;
  tenureYears: { mean: number | null; median: number | null; buckets: Bucket[] };
  positionsPerProfile: { mean: number | null };
}

/** Percentages are computed here so the model never has to divide. */
function toBuckets(
  rows: Array<{ name: string | null; count: string }>,
  denominator: number
): Bucket[] {
  return rows
    .filter((r) => r.name)
    .map((r) => ({
      name: r.name as string,
      count: Number(r.count),
      pct: denominator ? Math.round((Number(r.count) / denominator) * 1000) / 10 : 0,
    }));
}

const TOP_N = 12;

export async function getTenantInsights(
  tenantSlug: string
): Promise<TenantInsights | null> {
  const pool = db();

  const tenantRow = await pool.query<{ id: string; name: string }>(
    'SELECT id, name FROM tenants WHERE slug = $1',
    [tenantSlug]
  );
  if (!tenantRow.rows[0]) return null;
  const { id: tenantId, name: tenantName } = tenantRow.rows[0];

  const coverageQuery = pool.query<Record<string, string>>(
    `SELECT count(*)                                            AS total,
            count(current_company)                              AS current_company,
            count(current_title)                                AS current_title,
            count(current_job_location)                         AS location,
            count(exit_year)                                    AS exit_year,
            count(total_years_tenure)                           AS tenure,
            count(total_positions_count)                        AS positions,
            count(*) FILTER (WHERE cardinality(undergraduate_school) > 0)
                                                                AS undergraduate_school,
            count(current_estimated_salary)                     AS salary,
            count(current_job_level)                            AS job_level,
            count(career_stage)                                 AS career_stage,
            count(*) FILTER (WHERE cardinality(industry_expertise) > 0)
                                                                AS industry
       FROM profiles WHERE tenant_id = $1`,
    [tenantId]
  );

  const topOf = (column: string) =>
    pool.query<{ name: string | null; count: string }>(
      `SELECT ${column} AS name, count(*) AS count
         FROM profiles
        WHERE tenant_id = $1 AND ${column} IS NOT NULL
        GROUP BY 1 ORDER BY count(*) DESC LIMIT ${TOP_N}`,
      [tenantId]
    );

  const [cov, companies, titles, locations, schools, exits, tenure, positions] =
    await Promise.all([
      coverageQuery,
      topOf('current_company'),
      topOf('current_title'),
      topOf('current_job_location'),
      pool.query<{ name: string | null; count: string }>(
        `SELECT school AS name, count(*) AS count
           FROM profiles, unnest(undergraduate_school) AS school
          WHERE tenant_id = $1
          GROUP BY 1 ORDER BY count(*) DESC LIMIT ${TOP_N}`,
        [tenantId]
      ),
      pool.query<{ year: number; count: string }>(
        `SELECT exit_year AS year, count(*) AS count
           FROM profiles
          WHERE tenant_id = $1 AND exit_year IS NOT NULL
          GROUP BY 1 ORDER BY 1`,
        [tenantId]
      ),
      pool.query<{ mean: string | null; median: string | null }>(
        `SELECT avg(total_years_tenure)                                     AS mean,
                percentile_cont(0.5) WITHIN GROUP (ORDER BY total_years_tenure) AS median
           FROM profiles WHERE tenant_id = $1 AND total_years_tenure IS NOT NULL`,
        [tenantId]
      ),
      pool.query<{ mean: string | null }>(
        `SELECT avg(total_positions_count) AS mean
           FROM profiles WHERE tenant_id = $1 AND total_positions_count IS NOT NULL`,
        [tenantId]
      ),
    ]);

  const c = cov.rows[0];
  const coverage = Object.fromEntries(
    Object.entries(c).map(([k, v]) => [k, Number(v)])
  );
  const total = coverage.total;

  const tenureBuckets = await pool.query<{ name: string | null; count: string }>(
    `SELECT CASE WHEN total_years_tenure < 1 THEN 'under 1 year'
                 WHEN total_years_tenure < 3 THEN '1-2 years'
                 WHEN total_years_tenure < 6 THEN '3-5 years'
                 WHEN total_years_tenure < 11 THEN '6-10 years'
                 ELSE '11+ years' END AS name,
            count(*) AS count
       FROM profiles
      WHERE tenant_id = $1 AND total_years_tenure IS NOT NULL
      GROUP BY 1 ORDER BY min(total_years_tenure)`,
    [tenantId]
  );

  return {
    tenantName,
    totalProfiles: total,
    coverage,
    unavailable: ['salary', 'job_level', 'career_stage', 'industry'].filter(
      (dimension) => coverage[dimension] === 0
    ),
    topCurrentCompanies: toBuckets(companies.rows, coverage.current_company),
    topCurrentTitles: toBuckets(titles.rows, coverage.current_title),
    topLocations: toBuckets(locations.rows, coverage.location),
    topUndergraduateSchools: toBuckets(schools.rows, coverage.undergraduate_school),
    exitYears: exits.rows.map((r) => ({ year: r.year, count: Number(r.count) })),
    tenureYears: {
      mean: tenure.rows[0]?.mean ? Math.round(Number(tenure.rows[0].mean) * 10) / 10 : null,
      median: tenure.rows[0]?.median ? Number(tenure.rows[0].median) : null,
      buckets: toBuckets(tenureBuckets.rows, coverage.tenure),
    },
    positionsPerProfile: {
      mean: positions.rows[0]?.mean
        ? Math.round(Number(positions.rows[0].mean) * 10) / 10
        : null,
    },
  };
}
