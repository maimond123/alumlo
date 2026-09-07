"""Generate profile embeddings locally with BGE-M3.

OpenRouter serves chat completions only, so embeddings do not come from the
same provider as the rest of the pipeline. BGE-M3 (BAAI) runs on the machine
instead: no API key, no rate limit, no billing state to lapse, and the demo
keeps working offline. It emits 1024 dimensions, which is what the embedding
column in db/migrations/003_profiles.sql is sized for.

Usage:
    python ingest/embed.py --tenant chick_fil_a
    python ingest/embed.py --tenant demo --batch 64
"""
from __future__ import annotations

import argparse
import os
import sys

import psycopg2
import psycopg2.extras

DEFAULT_MODEL = "BAAI/bge-m3"
EXPECTED_DIM = 1024


def dsn() -> str:
    return os.environ.get(
        "DATABASE_URL", "postgresql://alumlo:alumlo@localhost:54322/alumlo")


def embedding_text(row: dict) -> str:
    """The text a query is matched against.

    Ordered most to least distinguishing: what they do now, then the career
    and education history. Headline first because it is the densest single
    field a recruiter-style query tends to match.
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


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tenant", required=True, help="tenant slug")
    ap.add_argument("--model", default=os.environ.get("ALUMLO_EMBED_MODEL", DEFAULT_MODEL))
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--redo", action="store_true", help="re-embed rows that already have one")
    args = ap.parse_args()

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("needs sentence-transformers:  pip install sentence-transformers",
              file=sys.stderr)
        return 1

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

    if not rows:
        print("nothing to embed")
        return 0
    print(f"embedding {len(rows)} profiles with {args.model}")

    model = SentenceTransformer(args.model)
    dim = model.get_sentence_embedding_dimension()
    if dim != EXPECTED_DIM:
        print(f"model emits {dim} dimensions, the schema expects {EXPECTED_DIM}. "
              f"Change the embedding column in db/migrations/003_profiles.sql "
              f"to vector({dim}) and recreate the database, or pick another model.",
              file=sys.stderr)
        return 1

    texts = [embedding_text(r) for r in rows]
    vectors = model.encode(
        texts, batch_size=args.batch, normalize_embeddings=True,
        show_progress_bar=True)

    with conn, conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """UPDATE profiles p SET embedding = v.embedding::vector,
                                     embedding_text = v.txt
                 FROM (VALUES %s) AS v(id, embedding, txt)
                WHERE p.id = v.id::bigint""",
            [(r["id"], "[" + ",".join(f"{x:.6f}" for x in vec) + "]", txt)
             for r, vec, txt in zip(rows, vectors, texts)],
            page_size=200)

    with conn, conn.cursor() as cur:
        cur.execute(
            "SELECT count(*) FROM profiles WHERE tenant_id = %s AND embedding IS NOT NULL",
            (tenant_id,))
        print(f"{cur.fetchone()[0]} profiles now have an embedding")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
