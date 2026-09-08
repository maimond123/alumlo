# Deploying

The app is a Next.js frontend plus five API routes, backed by Postgres 16 with
pgvector. Vercel can host the first part and not the second, so a deployment is
always two services unless you self-host both on one box.

## What the schema needs

`docker-compose.yml` mounts `db/migrations` at `/docker-entrypoint-initdb.d`,
which Postgres runs once when its data volume is empty. That is a Docker
mechanism and does nothing for a managed database.

`db/migrate.py` applies the same files anywhere:

```
DATABASE_URL=postgresql://... python db/migrate.py --dry-run
DATABASE_URL=postgresql://... python db/migrate.py
```

It records applied files in `schema_migrations`, so re-running is a no-op and a
run that fails halfway resumes rather than starting over. Each file runs in its
own transaction.

`001_extensions.sql` is `CREATE EXTENSION IF NOT EXISTS vector`. The host must
offer pgvector — Neon and Supabase do; a bare VPS needs the extension installed
first.

## Environment

Two variables. Both drivers already handle TLS: `pg` 8.23 parses `sslmode` out
of the connection string, and `psycopg2` hands the DSN to libpq, so a managed
URL ending in `?sslmode=require` works with no code change.

```
DATABASE_URL        postgresql://user:pass@host/db?sslmode=require
OPENROUTER_API_KEY  serves both the chat models and query embeddings
```

Locally these live in the repo-root `.env`, which `web/next.config.js` loads
because Next only looks inside `web/`. On Vercel that file is absent, the loader
no-ops, and Vercel's own environment variables apply.

## Data

The 6,470-profile corpus is real LinkedIn-derived data. It is gitignored and
does not go to a public host. A hosted instance gets the pseudonymized sample:

```
DATABASE_URL=... python db/migrate.py
DATABASE_URL=... python ingest/seed.py --tenant demo --name "Chick-fil-A" \
    --pseudonymize --limit 500
DATABASE_URL=... python ingest/embed.py --tenant demo
```

`embed.py` calls OpenRouter once per profile, so seeding 500 profiles costs 500
embedding calls and takes a few minutes. Run it from a laptop against the remote
database, not from the deployed app.

## Vercel

The build does **not** touch Postgres — `/` , `/search` and `/learn` prerender
as static shells and fetch at runtime, and every `/api/*` route is dynamic. So
the app deploys and builds green before a database exists; it just returns
errors until `DATABASE_URL` is set.

**Root Directory must be `web`.** `package.json` moved there in `341ba0c`, and
the setting still points at the repo root, which is why deployments since then
fail at `Error: No Next.js version detected` two seconds in. This is a project
setting; it cannot be changed through the API tokens available here or by any
file in the repo.

`web/vercel.json` sets `maxDuration: 60` on the API routes. `/api/search-pipeline`
takes 9-24 seconds on its LLM calls, which is longer than the default allows.
Whether Hobby honours 60 is worth checking on the first real search.

### Connection pooling

`web/app/data/db.ts` uses `max: 10`. That is sized for the widest in-request
fan-out, not picked arbitrarily: `getTenantInsights` issues eight queries
through `Promise.all`, so a smaller pool would serialise `/learn`.

Each serverless instance is a separate process with its own pool, so N instances
hold up to N x 10 connections. **Use the host's pooled connection string** —
Neon's `-pooler` endpoint, pgbouncer in transaction mode — and the multiplexing
happens server-side. Against a direct endpoint with a ~100-connection cap, ten
warm instances exhaust it.

## The one-box alternative

A VPS running `docker compose` removes three problems and adds one.

Gone: the function duration limit that the 24-second pipeline brushes against;
the pooling question, since `max: 10` against a local Postgres is simply
correct; and cold starts on a database that scaled to zero. Production also
becomes the same `docker compose up` as local development.

Added: TLS certificates, a reverse proxy, a process manager, OS patching, and
backups. Backups are the real one — managed Postgres does point-in-time
recovery and here you would be writing a `pg_dump` cron.

For an app whose defining trait is a slow LLM pipeline in front of a vector
index, the trade is favourable. Vercel's model suits fast, stateless, bursty
requests; this app is slow, stateful and infrequent.

Sizing: the HNSW index is 52 MB and the whole database is 140 MB with both
tenants, ~20 MB with the demo tenant alone. Postgres wants the index resident
alongside Node, so 2 GB of RAM is comfortable and 1 GB is tight.
