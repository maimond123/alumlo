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
    // No localhost fallback. One used to live here, and on Vercel it turned an
    // unset DATABASE_URL into "connect ECONNREFUSED 127.0.0.1:54322" -- an
    // error that reads as a network fault and sends you looking at the
    // database instead of at the configuration. Local runs get the value from
    // the repo-root .env, which web/next.config.js loads.
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. Locally it comes from the repo-root .env; ' +
          'on Vercel it is a project environment variable, and a deployment ' +
          'only picks one up if it was built after the variable was added.'
      );
    }

    pool = new Pool({
      connectionString,
      // Sized for the widest in-request fan-out: getTenantInsights issues eight
      // queries through Promise.all. Each serverless instance holds its own
      // pool, so use the host's pooled endpoint (Neon's -pooler) and let
      // pgbouncer multiplex rather than shrinking this.
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
