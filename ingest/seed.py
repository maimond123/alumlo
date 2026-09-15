"""Load raw LinkedIn-shaped profiles into the profiles table.

Reads data/profiles/*.json and derives every column that follows from the raw
document: identity, the current position, the education arrays, and the split
of a person's career into the periods before, during and after their tenure at
the tenant company.

Columns that the 2025 pipeline produced with LLM calls -- career_stage,
current_job_level, salary estimates, the expertise arrays -- are left null.
They require a separate enrichment stage, which is not included here.
The embedding column is also left null; it needs an embedding model.

Usage:
    python ingest/seed.py --tenant chick_fil_a --name "Chick-fil-A"
    python ingest/seed.py --tenant chick_fil_a --name "Chick-fil-A" \
        --pseudonymize --limit 500 --out data/sample/profiles.json
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import random
import re
import sys

import psycopg2
import psycopg2.extras

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROFILE_DIR = ROOT / "data" / "profiles"

MONTHS = {m: i for i, m in enumerate(
    "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), start=1)}


def dsn() -> str:
    return os.environ.get(
        "DATABASE_URL", "postgresql://alumlo:alumlo@localhost:54322/alumlo")


def norm(s: str | None) -> str:
    """Fold a company or school name for comparison."""
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


def normalize(v):
    """Make the raw scrape storable and honest about what it does not have.

    Two things, both once, at the trust boundary for external data:

    NUL bytes go, because Postgres text columns cannot store them; the scrape
    left \\u0000 inside some profile descriptions.

    The empty string becomes None, because that is what the scrape writes when
    a field is absent and Postgres counts \'\' as a value. count(current_job_
    location) read 397 where 273 profiles actually had one -- a 31% overstatement
    that reached /learn as a stated coverage figure. Storing NULL for absent
    makes every reader correct without each one remembering to ask.

    Arrays are unaffected: they are built with truthiness filters that already
    dropped the empty strings and drop None the same way.
    """
    if isinstance(v, str):
        v = v.replace("\x00", "")
        return v or None
    if isinstance(v, list):
        return [normalize(x) for x in v]
    if isinstance(v, dict):
        return {k: normalize(x) for k, x in v.items()}
    return v


def year_of(date: dict | None) -> int | None:
    if not isinstance(date, dict):
        return None
    y = date.get("year")
    return int(y) if isinstance(y, (int, str)) and str(y).isdigit() else None


def month_of(date: dict | None) -> int:
    if not isinstance(date, dict):
        return 0
    return MONTHS.get(str(date.get("month") or "")[:3], 0)


def sort_key(pos: dict) -> tuple[int, int]:
    """Chronological key. Undated positions sort last."""
    return (year_of(pos.get("start_date")) or 0, month_of(pos.get("start_date")))


def split_by_tenure(experience: list[dict], tenant_key: str):
    """Partition a career into the periods before, during and after the tenant.

    The tenant company is the anchor the whole product is built around: every
    outcome column ("did this tenure lift their salary", "what did they do
    next") is defined relative to it. Returns the tenure positions plus the
    positions that started before the first one and after the last one.
    """
    dated = sorted(experience, key=sort_key)
    during = [p for p in dated if tenant_key and tenant_key in norm(p.get("company"))]
    if not during:
        return [], [], dated  # no tenure found; treat everything as "post"

    first_start = sort_key(during[0])
    last_end = max(
        (year_of(p.get("end_date")) or 9999, month_of(p.get("end_date")))
        for p in during)

    pre, post = [], []
    for p in dated:
        if p in during:
            continue
        if sort_key(p) < first_start:
            pre.append(p)
        elif (year_of(p.get("start_date")) or 0, month_of(p.get("start_date"))) >= last_end:
            post.append(p)
        else:
            pre.append(p)  # overlapping; counts as prior context
    return during, pre, post


def degrees(education: list[dict]) -> tuple[list[str], list[str]]:
    """Split schools into undergraduate and graduate by the degree string."""
    grad_words = ("master", "mba", "phd", "doctor", "jd", "m.d", "mdiv", "m.s", "ms,")
    under, grad = [], []
    for e in education:
        school = (e.get("school") or "").strip()
        if not school:
            continue
        d = (e.get("degree") or "").lower()
        (grad if any(w in d for w in grad_words) else under).append(school)
    return under, grad


FIRST = ["Avery", "Jordan", "Riley", "Casey", "Quinn", "Rowan", "Sage", "Emerson",
         "Harper", "Finley", "Reese", "Skyler", "Marlowe", "Ellis", "Devon"]
LAST = ["Hartley", "Vance", "Okafor", "Delgado", "Whitfield", "Nakamura", "Bran",
        "Ferreira", "Lindqvist", "Amari", "Castellan", "Yusuf", "Moreau", "Sandoval"]


def pseudonymize(p: dict, rng: random.Random) -> dict:
    """Remove direct identifiers and free text using an explicit field allowlist.

    Career histories can still identify someone. This is for private analysis;
    generate_sample.py creates the public fixture independently of real records.
    """
    def date(value):
        if not isinstance(value, dict):
            return None
        return {"year": year_of(value),
                "month": value.get("month") if value.get("month") in MONTHS else None}

    experience = []
    for entry in p.get("experience") or []:
        if not isinstance(entry, dict):
            continue
        start, end = date(entry.get("start_date")), date(entry.get("end_date"))
        experience.append({
            **{key: entry.get(key) for key in ("company", "title", "location")},
            "start_date": start,
            "end_date": end,
            "is_current": bool(entry.get("is_current")),
            "duration": f"{year_of(start) or '?'}-{year_of(end) or 'present'}",
        })
    education = [
        {"school": e.get("school"), "degree": e.get("degree"),
         "start_date": date(e.get("start_date")), "end_date": date(e.get("end_date"))}
        for e in p.get("education") or [] if isinstance(e, dict)
    ]
    fake = f"{rng.choice(FIRST)} {rng.choice(LAST)}"
    current = next((e for e in experience if e["is_current"]), {})
    location = ((p.get("basic_info") or {}).get("location") or {}).get("full")
    return {
        "basic_info": {
            "fullname": fake,
            "first_name": fake.split()[0],
            "last_name": fake.split()[1],
            "headline": f"{current['title']} at {current['company']}"
                        if current.get("title") and current.get("company") else None,
            "location": {"full": location},
        },
        "experience": experience,
        "education": education,
    }


def to_row(p: dict, tenant_id: int, tenant_key: str, idx: int) -> dict:
    bi = p.get("basic_info") or {}
    exp = [e for e in (p.get("experience") or []) if isinstance(e, dict)]
    edu = [e for e in (p.get("education") or []) if isinstance(e, dict)]

    during, pre, post = split_by_tenure(exp, tenant_key)
    current = next((e for e in exp if e.get("is_current")), None)
    under, grad = degrees(edu)

    exit_year = None
    if during:
        ends = [year_of(e.get("end_date")) for e in during]
        exit_year = max((y for y in ends if y), default=None)

    tenure_years = sorted({
        y for e in during
        for y in range((year_of(e.get("start_date")) or 0),
                       (year_of(e.get("end_date")) or year_of(e.get("start_date")) or 0) + 1)
        if y})

    return {
        "tenant_id": tenant_id,
        "profile_id": idx,
        "name": bi.get("fullname"),
        "profile_url": p.get("original_url"),
        "picture_url": bi.get("profile_picture_url"),
        "headline": bi.get("headline"),
        "home_location": ((bi.get("location") or {}).get("full")),

        "current_company": (current or {}).get("company"),
        "current_title": (current or {}).get("title"),
        "current_job_location": (current or {}).get("location"),
        "post_company_current_company": (post[-1] if post else {}).get("company"),
        "post_company_current_title": (post[-1] if post else {}).get("title"),
        "post_company_current_location": (post[-1] if post else {}).get("location"),

        "exit_year": exit_year,
        "had_multiple_company_stints": len(during) > 1,
        "total_years_tenure": len(tenure_years) or None,
        "tenure_years": tenure_years or None,
        "total_positions_count": len(exp),

        "pre_company_companies": [e.get("company") for e in pre if e.get("company")],
        "pre_company_titles": [e.get("title") for e in pre if e.get("title")],
        "pre_company_locations": [e.get("location") for e in pre if e.get("location")],
        "post_company_companies": [e.get("company") for e in post if e.get("company")],
        "post_company_titles": [e.get("title") for e in post if e.get("title")],
        "post_company_locations": [e.get("location") for e in post if e.get("location")],
        "post_tenure_companies": [e.get("company") for e in post if e.get("company")],

        "undergraduate_school": under,
        "graduate_school": grad,
        "natural_language_experiences": " | ".join(
            f"{e.get('title')} at {e.get('company') or 'unknown'}"
            f" ({e.get('duration') or 'unknown'})"
            for e in exp if e.get("title")),
        "natural_language_education": " | ".join(
            f"{e.get('degree') or 'degree'} from {e.get('school')}"
            for e in edu if e.get("school")),

        "career_timeline": json.dumps(exp),
        "education_timeline": json.dumps(edu),
        "post_tenure_timeline": json.dumps(post),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tenant", required=True, help="slug, e.g. chick_fil_a")
    ap.add_argument("--name", required=True, help="display name, e.g. Chick-fil-A")
    ap.add_argument("--kind", default="company", choices=["company", "school"])
    ap.add_argument("--limit", type=int)
    ap.add_argument("--pseudonymize", action="store_true")
    ap.add_argument("--out", help="also write the loaded profiles here as JSON")
    ap.add_argument("--truncate", action="store_true", help="clear the tenant first")
    args = ap.parse_args()

    files = sorted(PROFILE_DIR.glob("*.json"))
    if not files:
        print(f"no profiles in {PROFILE_DIR}", file=sys.stderr)
        return 1

    raw = []
    for f in files:
        raw.extend(normalize(json.load(open(f))))
    print(f"read {len(raw)} profiles from {len(files)} files")

    rng = random.Random(20250731)  # fixed seed: the sample is reproducible
    if args.pseudonymize:
        raw = [pseudonymize(p, rng) for p in raw]
    if args.limit:
        rng.shuffle(raw)
        raw = raw[:args.limit]

    tenant_key = norm(args.name)
    conn = psycopg2.connect(dsn())
    conn.autocommit = False
    with conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO tenants (slug, name, kind) VALUES (%s, %s, %s)
               ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
               RETURNING id""",
            (args.tenant, args.name, args.kind))
        tenant_id = cur.fetchone()[0]

        if args.truncate:
            cur.execute("DELETE FROM profiles WHERE tenant_id = %s", (tenant_id,))

        rows = [to_row(p, tenant_id, tenant_key, i) for i, p in enumerate(raw, start=1)]
        cols = list(rows[0].keys())
        psycopg2.extras.execute_values(
            cur,
            f"INSERT INTO profiles ({','.join(cols)}) VALUES %s "
            f"ON CONFLICT (tenant_id, profile_id) DO NOTHING",
            [[r[c] for c in cols] for r in rows],
            page_size=500)

        cur.execute("SELECT count(*) FROM profiles WHERE tenant_id = %s", (tenant_id,))
        total = cur.fetchone()[0]
        cur.execute(
            "SELECT count(*) FROM profiles WHERE tenant_id = %s AND exit_year IS NOT NULL",
            (tenant_id,))
        with_exit = cur.fetchone()[0]

    print(f"tenant {args.tenant} (id={tenant_id}): {total} profiles, "
          f"{with_exit} with a detected tenure at {args.name}")

    if args.out:
        out = pathlib.Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(raw, indent=1))
        print(f"wrote {len(raw)} profiles to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
