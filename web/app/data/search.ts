import { db } from './db';
import { llm } from '../config/llm';

/**
 * Profile search against Postgres.
 *
 * Replaces LinkedInProfileSearchEngine, which had three methods --
 * standardSearch, searchChronological, searchTemporal -- each building an RPC
 * name by interpolating the customer into it
 * (`standard_search_function_${organizationName}`). One SQL function serves
 * all three now, so there is one method here.
 *
 * The tenant arrives as a slug and is resolved to an id by the query. It is
 * never interpolated into an identifier.
 */

const EMBEDDING_MODEL = process.env.ALUMLO_EMBED_MODEL ?? 'baai/bge-m3';

export interface SearchFilters {
  [key: string]: string | number | null | undefined;
}

export interface ProfileResult {
  profile_id: number;
  name: string | null;
  headline: string | null;
  profile_url: string | null;
  picture_url: string | null;
  home_location: string | null;
  current_company: string | null;
  current_title: string | null;
  exit_year: number | null;
  total_years_tenure: number | null;
  pre_company_companies: string[] | null;
  pre_company_titles: string[] | null;
  post_company_companies: string[] | null;
  post_company_titles: string[] | null;
  undergraduate_school: string[] | null;
  graduate_school: string[] | null;
  similarity: number | null;
}

/** Embed a query so results can be ordered by semantic distance. */
async function embedQuery(text: string): Promise<string | null> {
  if (!text?.trim() || !process.env.OPENROUTER_API_KEY) return null;
  try {
    const res = await llm.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return `[${res.data[0].embedding.map((x) => x.toFixed(6)).join(',')}]`;
  } catch (err) {
    // Ordering degrades to most-recent-exit; the filters still apply, so a
    // failure here returns worse-ranked results rather than none.
    console.error('[search] embedding failed, falling back to unranked:', err);
    return null;
  }
}

export async function searchProfiles(opts: {
  tenantSlug: string;
  filters?: SearchFilters;
  query?: string;
  limit?: number;
}): Promise<ProfileResult[]> {
  const { tenantSlug, filters = {}, query, limit = 50 } = opts;

  // Drop empty values so an absent filter is absent rather than matching "".
  const active = Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    )
  );

  const embedding = query ? await embedQuery(query) : null;

  const { rows } = await db().query<ProfileResult>(
    `SELECT s.*
       FROM tenants t
       JOIN LATERAL search_profiles(t.id, $2::jsonb, $3::vector, $4::int) s ON true
      WHERE t.slug = $1`,
    [tenantSlug, JSON.stringify(active), embedding, limit]
  );
  return rows;
}
