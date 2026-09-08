"""Apply db/migrations/*.sql to whatever DATABASE_URL points at.

docker-compose mounts db/migrations at /docker-entrypoint-initdb.d, which
Postgres runs once when its data volume is empty. That mechanism is Docker's,
so it does nothing for a managed database -- Neon, RDS, a Postgres on a VPS --
and until this script existed there was no way to create the schema anywhere
but locally.

Applied migrations are recorded in schema_migrations, so re-running is a no-op
and a partially-migrated database resumes where it stopped. Each file runs
inside its own transaction: a failure leaves that migration unapplied rather
than half-applied.

Usage:
    python db/migrate.py                     # local, from docker-compose
    DATABASE_URL=postgresql://... python db/migrate.py
    python db/migrate.py --dry-run           # list what would run
"""
from __future__ import annotations

import argparse
import os
import pathlib
import sys

import psycopg2

ROOT = pathlib.Path(__file__).resolve().parent
MIGRATION_DIR = ROOT / "migrations"


def dsn() -> str:
    return os.environ.get(
        "DATABASE_URL", "postgresql://alumlo:alumlo@localhost:54322/alumlo")


def migrations() -> list[pathlib.Path]:
    """Filename order is apply order, which is why they are numbered."""
    return sorted(MIGRATION_DIR.glob("*.sql"))


def applied(conn) -> set[str]:
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename   text PRIMARY KEY,
                applied_at timestamptz NOT NULL DEFAULT now()
            )
        """)
        conn.commit()
        cur.execute("SELECT filename FROM schema_migrations")
        return {row[0] for row in cur.fetchall()}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true",
                    help="list pending migrations without applying them")
    args = ap.parse_args()

    files = migrations()
    if not files:
        print(f"no .sql files in {MIGRATION_DIR}", file=sys.stderr)
        return 1

    conn = psycopg2.connect(dsn())
    done = applied(conn)
    pending = [f for f in files if f.name not in done]

    if not pending:
        print(f"up to date -- {len(done)} migrations already applied")
        return 0

    if args.dry_run:
        for f in pending:
            print(f"would apply {f.name}")
        return 0

    for f in pending:
        print(f"applying {f.name} ... ", end="", flush=True)
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(f.read_text())
                    cur.execute(
                        "INSERT INTO schema_migrations (filename) VALUES (%s)",
                        (f.name,))
        except psycopg2.Error as exc:
            print("failed")
            print(f"\n{f.name}: {exc}", file=sys.stderr)
            print("earlier migrations stay applied; fix and re-run.",
                  file=sys.stderr)
            return 1
        print("ok")

    print(f"applied {len(pending)} migration(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
