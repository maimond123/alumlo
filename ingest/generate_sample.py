"""Build the public demo from invented profiles, without reading scraped data.

Company and school names are used as example search terms. The people, dates,
and career histories are generated and do not describe those organizations'
actual alumni. Run from anywhere with: python ingest/generate_sample.py
"""
from __future__ import annotations

import json
from pathlib import Path
import random

FIRST = ["Avery", "Jordan", "Riley", "Casey", "Quinn", "Rowan", "Sage",
         "Emerson", "Harper", "Finley", "Reese", "Skyler", "Marlowe", "Ellis",
         "Devon", "Morgan", "Taylor", "Cameron", "Blair", "Drew"]
LAST = ["Hartley", "Vance", "Okafor", "Delgado", "Whitfield", "Nakamura",
        "Bran", "Ferreira", "Lindqvist", "Amari", "Castellan", "Yusuf",
        "Moreau", "Sandoval", "Bennett", "Brooks", "Chen", "Patel",
        "Reed", "Rivera", "Shaw", "Singh", "Stone", "Walker", "Wells"]
EMPLOYERS = [
    ("Google", "Software Engineer"),
    ("Microsoft", "Product Manager"),
    ("Amazon", "Operations Manager"),
    ("Deloitte", "Consultant"),
    ("Emory Healthcare", "Project Coordinator"),
    ("Delta Air Lines", "Business Analyst"),
    ("Salesforce", "Account Executive"),
    ("The Home Depot", "Supply Chain Analyst"),
    ("JPMorgan Chase", "Financial Analyst"),
    ("UPS", "Logistics Manager"),
    ("Marriott", "General Manager"),
    ("Target", "Human Resources Specialist"),
]
LOCATIONS = ["Atlanta, GA", "Chicago, IL", "Dallas, TX", "Denver, CO",
             "New York, NY", "Seattle, WA", "Boston, MA", "Austin, TX"]
SCHOOLS = ["Georgia State University", "University of Georgia", "Georgia Tech",
           "University of Texas", "Ohio State University", "Penn State"]


def position(company: str, title: str, location: str, start: int,
             end: int | None) -> dict:
    return {
        "company": company,
        "title": title,
        "location": location,
        "start_date": {"year": start, "month": "Jan"},
        "end_date": {"year": end, "month": "Dec"} if end else None,
        "is_current": end is None,
        "duration": f"{start}-{end}" if end else f"Since {start}",
    }


def generate_sample() -> list[dict]:
    rng = random.Random(20260914)
    profiles = []
    for index in range(500):
        first, last = FIRST[index // len(LAST)], LAST[index % len(LAST)]
        location = rng.choice(LOCATIONS)
        start = rng.randint(2007, 2017)
        exit_year = start + rng.randint(1, 7)
        before_company, before_title = rng.choice(EMPLOYERS)
        company, title = rng.choice(EMPLOYERS)
        experience = [
            position(before_company, before_title, location, start - 2, start - 1),
            position("Chick-fil-A", rng.choice(["Team Member", "Shift Leader",
                     "Restaurant Manager", "Training Coordinator"]), location,
                     start, exit_year),
        ]
        has_current = index % 10 != 0
        if has_current:
            experience.append(position(company, title, location, exit_year + 1, None))
        education = []
        if index % 5 != 0:
            education.append({"school": rng.choice(SCHOOLS),
                              "degree": "Bachelor of Science",
                              "start_date": {"year": start - 4},
                              "end_date": {"year": start}})
        if index % 4 == 0:
            education.append({"school": rng.choice(SCHOOLS),
                              "degree": "Master of Business Administration",
                              "start_date": {"year": exit_year},
                              "end_date": {"year": exit_year + 2}})
        profiles.append({
            "basic_info": {
                "fullname": f"{first} {last}",
                "first_name": first,
                "last_name": last,
                "headline": f"{title} at {company}" if has_current else "Exploring a new role",
                "location": {"full": location if index % 7 else None},
            },
            "experience": experience,
            "education": education,
        })
    return profiles


if __name__ == "__main__":
    output = Path(__file__).resolve().parent.parent / "data/sample/profiles.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(generate_sample(), indent=2) + "\n")
    print(f"Wrote 500 synthetic profiles to {output}")
