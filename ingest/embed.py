"""Generate profile embeddings through OpenRouter.

Uses baai/bge-m3, the same provider and key as the chat models, so there is
one credential and one bill for the whole pipeline. It emits 1024 dimensions,
which is what the embedding column in db/migrations/003_profiles.sql is sized
for.

Usage:
    python ingest/embed.py --tenant demo
    python ingest/embed.py --tenant chick_fil_a --batch 64
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

import psycopg2
import psycopg2.extras

DEFAULT_MODEL = "baai/bge-m3"
EXPECTED_DIM = 1024
ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_env() -> None:
    """Read .env if the variable is not already set."""
    if os.environ.get("OPENROUTER_API_KEY"):
        return
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def dsn() -> str:
    return os.environ.get(
        "DATABASE_URL", "postgresql://alumlo:alumlo@localhost:54322/alumlo")


def embedding_text(row: dict) -> str:
    """The text a query is matched against.

    Ordered most to least distinguishing: what they do now, then where, then
    the career and education history. The headline leads because it is the
    densest single field a recruiter-style query tends to match.
    """
    parts = [
        row.get("headline"),
        f"{row.get('current_title')} at {row.get('current_company')}"
        if row.get("current_title") else None,
        row.get("home_location"),
        row.get("natural_language_experiences"),
        row.get("natural_language_education"),
    ]
    return "\n".join(p for p in parts if p)


def embed_batch(texts: list[str], model: str, key: str, base: str) -> list[list[float]]:
    """One embeddings call, retrying on rate limits and transient failures."""
    payload = json.dumps({"model": model, "input": texts}).encode()
    req = urllib.request.Request(
        f"{base}/embeddings", data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})

    delay = 2.0
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                body = json.load(r)
            # The API may return items out of order; index carries the position.
            items = sorted(body["data"], key=lambda d: d.get("index", 0))
            return [it["embedding"] for it in items]
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < 5:
                time.sleep(delay)
                delay *= 2
                continue
            raise RuntimeError(f"{e.code}: {e.read()[:300].decode(errors='replace')}") from e
        except (urllib.error.URLError, TimeoutError):
            if attempt < 5:
                time.sleep(delay)
                delay *= 2
                continue
            raise
    raise RuntimeError("exhausted retries")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tenant", required=True, help="tenant slug")
    ap.add_argument("--model", default=os.environ.get("ALUMLO_EMBED_MODEL", DEFAULT_MODEL))
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--redo", action="store_true", help="re-embed rows that already have one")
    args = ap.parse_args()

    load_env()
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        print("set OPENROUTER_API_KEY (see .env.example)", file=sys.stderr)
        return 1
    base = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    conn = psycopg2.connect(dsn())
    with conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT id FROM tenants WHERE slug = %s", (args.tenant,))
        t = cur.fetchone()
        if not t:
            print(f"no tenant {args.tenant!r}", file=sys.stderr)
            return 1
        tenant_id = t["id"]
        cur.execute(
            f"""SELECT id, headline, current_title, current_company, home_location,
                       natural_language_experiences, natural_language_education
                  FROM profiles
                 WHERE tenant_id = %s {'' if args.redo else 'AND embedding IS NULL'}
                 ORDER BY id""",
            (tenant_id,))
        rows = cur.fetchall()

    # A profile with no headline, title, location, experience or education has
    # nothing to embed. Leave its embedding null rather than send an empty
    # string, which the API rejects, or a filler value, which would pollute
    # the vector space with a meaningless point every query could match.
    empty = [r for r in rows if not embedding_text(r).strip()]
    rows = [r for r in rows if embedding_text(r).strip()]
    if empty:
        print(f"skipping {len(empty)} profiles with no embeddable text")

    if not rows:
        print("nothing to embed")
        return 0
    print(f"embedding {len(rows)} profiles with {args.model}")

    done = 0
    for start in range(0, len(rows), args.batch):
        chunk = rows[start:start + args.batch]
        texts = [embedding_text(r) for r in chunk]
        vectors = embed_batch(texts, args.model, key, base)

        if len(vectors[0]) != EXPECTED_DIM:
            print(f"{args.model} returned {len(vectors[0])} dimensions, the schema "
                  f"expects {EXPECTED_DIM}. Change the embedding column in "
                  f"db/migrations/003_profiles.sql and recreate the database.",
                  file=sys.stderr)
            return 1

        # Commit per batch so an interruption keeps the work already paid for.
        with conn, conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                """UPDATE profiles p SET embedding = v.embedding::vector,
                                         embedding_text = v.txt
                     FROM (VALUES %s) AS v(id, embedding, txt)
                    WHERE p.id = v.id::bigint""",
                [(r["id"], "[" + ",".join(f"{x:.6f}" for x in vec) + "]", txt)
                 for r, vec, txt in zip(chunk, vectors, texts)],
                page_size=200)
        done += len(chunk)
        print(f"  {done}/{len(rows)}", flush=True)

    with conn, conn.cursor() as cur:
        cur.execute(
            "SELECT count(*) FROM profiles WHERE tenant_id = %s AND embedding IS NOT NULL",
            (tenant_id,))
        print(f"{cur.fetchone()[0]} profiles now have an embedding")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
