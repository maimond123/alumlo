import { NextRequest, NextResponse } from 'next/server';
import { getTenantInsights } from '../../data/insights';

/**
 * Tenant aggregates for /data-insights.
 *
 * getTenantInsights already backed /api/chat, so Learn could describe these
 * numbers in prose while nothing could draw them. The page is a client
 * component and cannot reach Postgres, so it reads them through here.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('tenant') ?? 'demo';

  const insights = await getTenantInsights(slug);
  if (!insights) {
    return NextResponse.json(
      { error: `No tenant with slug "${slug}"` },
      { status: 404 }
    );
  }
  return NextResponse.json(insights);
}
