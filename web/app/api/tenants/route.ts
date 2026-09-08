import { NextRequest, NextResponse } from 'next/server';
import { getTenant } from '../../data/db';

/**
 * Tenant lookup for the client.
 *
 * OrganizationContext is a client component and cannot reach Postgres, so the
 * slug -> name resolution it used to do against Supabase happens here.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? 'demo';

  const tenant = await getTenant(slug);
  if (!tenant) {
    return NextResponse.json(
      { error: `No tenant with slug "${slug}"` },
      { status: 404 }
    );
  }
  return NextResponse.json(tenant);
}
