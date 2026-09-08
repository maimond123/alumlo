import { llm } from '../../config/llm';
import { MODELS } from '../../config/models';
import { getTenantInsights, type TenantInsights } from '../../data/insights';

/**
 * /learn answers questions about a tenant's alumni corpus.
 *
 * It used to answer from a table of hardcoded statistics -- "the average salary
 * is $68,500", "32% reach executive positions" -- none of which came from the
 * database; every column behind them is null in all 6,470 rows. The fallback
 * path was no better: its system prompt announced "below is a JSON object
 * representing alumni data" and then supplied none, so the model was told to
 * answer from data it never received.
 *
 * Now the aggregates are computed in SQL and handed to the model, which writes
 * prose around numbers it did not produce.
 */

const HUMAN_LABELS: Record<string, string> = {
  salary: 'salary and compensation',
  job_level: 'job level or seniority',
  career_stage: 'career stage',
  industry: 'industry classification',
};

/** Render the aggregates as the only facts the model is allowed to use. */
function renderInsights(insights: TenantInsights): string {
  const list = (rows: Array<{ name: string; count: number; pct: number }>) =>
    rows.map((r) => `  - ${r.name}: ${r.count} (${r.pct}%)`).join('\n') || '  (none)';

  const missing = insights.unavailable
    .map((dimension) => HUMAN_LABELS[dimension] ?? dimension)
    .join(', ');

  return `Alumni corpus for ${insights.tenantName}: ${insights.totalProfiles} profiles.

Percentages are of the profiles that have that field, and the row count for each
is given so you can state coverage honestly.

CURRENT COMPANY (${insights.coverage.current_company} profiles have one)
${list(insights.topCurrentCompanies)}

CURRENT TITLE (${insights.coverage.current_title} profiles)
${list(insights.topCurrentTitles)}

CURRENT LOCATION (${insights.coverage.location} profiles)
${list(insights.topLocations)}

UNDERGRADUATE SCHOOL (${insights.coverage.undergraduate_school} profiles)
${list(insights.topUndergraduateSchools)}

YEAR THEY LEFT (${insights.coverage.exit_year} profiles)
${insights.exitYears.map((e) => `  - ${e.year}: ${e.count}`).join('\n') || '  (none)'}

TENURE BEFORE LEAVING (${insights.coverage.tenure} profiles)
  mean ${insights.tenureYears.mean ?? 'n/a'} years, median ${insights.tenureYears.median ?? 'n/a'} years
${list(insights.tenureYears.buckets)}

TOTAL POSITIONS PER PERSON (${insights.coverage.positions} profiles)
  mean ${insights.positionsPerProfile.mean ?? 'n/a'}

NO DATA COLLECTED FOR: ${missing || 'nothing -- every dimension has data'}`;
}

const SYSTEM_PROMPT = `You are Alumlo's assistant. You answer questions about one
organization's alumni corpus using the aggregates below, and nothing else.

Rules, in order of importance:

1. Every number you state must appear verbatim in the aggregates below. Never
   compute a new statistic, never estimate, never interpolate between figures.
2. If the aggregates do not answer the question, say so plainly and name what
   would be needed. The "NO DATA COLLECTED FOR" line lists dimensions that were
   never populated -- for those, say the data was not collected. Do not
   substitute a related figure and do not guess.
3. Never compare against an external benchmark (a national average, an industry
   norm). You have no such data.
4. State coverage when it matters. "5,114 of 6,470 profiles list a current
   employer" is more useful than a bare percentage.
5. Be brief and concrete. No marketing advice unless asked.

`;

export async function POST(req: Request) {
  try {
    const { message, organizationName, history } = await req.json();

    if (!message || !organizationName) {
      return new Response(
        JSON.stringify({ error: 'message and organizationName are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const insights = await getTenantInsights(organizationName);
    if (!insights) {
      return new Response(
        JSON.stringify({ error: `No tenant with slug "${organizationName}"` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await llm.chat.completions.create({
      model: MODELS.CHAT,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + renderInsights(insights) },
        ...(history ?? []).map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
    });

    return createStreamResponse(response);
  } catch (error) {
    console.error('[chat] error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function createStreamResponse(response: any) {
    // Create a new stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Send the content chunk
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
      controller.close();
    }
  });

    return new Response(stream, {
      headers: {
      'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
  });
}

