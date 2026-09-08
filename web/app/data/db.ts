import { Pool } from 'pg';

/**
 * The Postgres connection pool.
 *
 * One pool per process. Next reuses module instances across requests, so a
 * client per request would exhaust connections under load.
 */

let pool: Pool | undefined;

export function db(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ??
        'postgresql://alumlo:alumlo@localhost:54322/alumlo',
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export interface Tenant {
  slug: string;
  name: string;
  profileCount: number;
}

/** Resolve a tenant slug to the row the UI and the search API both need. */
export async function getTenant(slug: string): Promise<Tenant | null> {
  const { rows } = await db().query<{
    slug: string;
    name: string;
    profile_count: string;
  }>(
    `SELECT t.slug, t.name, count(p.id) AS profile_count
       FROM tenants t
       LEFT JOIN profiles p ON p.tenant_id = t.id
      WHERE t.slug = $1
      GROUP BY t.slug, t.name`,
    [slug]
  );
  if (!rows[0]) return null;
  // count() comes back as a string; the UI formats it as a number.
  return {
    slug: rows[0].slug,
    name: rows[0].name,
    profileCount: Number(rows[0].profile_count),
  };
}
