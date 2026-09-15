"""Checks that the public fixture is reproducible and contains only generated data."""
import json
from pathlib import Path
import unittest

from generate_sample import generate_sample
from seed import norm, pseudonymize, to_row
import random


class SampleTests(unittest.TestCase):
    def test_committed_sample_matches_generator(self):
        path = Path(__file__).resolve().parent.parent / "data/sample/profiles.json"
        profiles = json.loads(path.read_text())
        self.assertEqual(profiles, generate_sample())
        self.assertEqual(len(profiles), 500)
        self.assertEqual(len({p["basic_info"]["fullname"] for p in profiles}), 500)

    def test_generated_profiles_work_with_ingestion(self):
        rows = [to_row(p, 1, norm("Chick-fil-A"), i)
                for i, p in enumerate(generate_sample(), 1)]
        self.assertTrue(all(r["exit_year"] for r in rows))
        self.assertTrue(all(r["total_years_tenure"] > 0 for r in rows))
        self.assertTrue(all(r["profile_url"] is None and r["picture_url"] is None
                            for r in rows))
        self.assertGreater(len({r["current_company"] for r in rows}), 5)
        self.assertGreater(len({r["exit_year"] for r in rows}), 5)

    def test_pseudonymization_drops_unlisted_fields(self):
        raw = {
            "basic_info": {"fullname": "Private Person", "headline": "Contact private@example.test",
                           "background_picture_url": "https://example.test/photo"},
            "recommendations": {"recommender_name": "Someone", "text": "Private notes"},
            "projects": [{"url": "https://example.test/person"}],
            "experience": [{"company": "Example", "title": "Analyst",
                            "description": "Email private@example.test", "company_logo_url": "photo"}],
            "education": [{"school": "Example University", "description": "Private notes"}],
            "unknown_future_field": "Private notes",
        }
        cleaned = pseudonymize(raw, random.Random(1))
        text = json.dumps(cleaned)
        for private in ["Private Person", "private@example.test", "https://", "Private notes", "Someone"]:
            self.assertNotIn(private, text)
        self.assertEqual(cleaned["experience"][0]["company"], "Example")
        self.assertEqual(raw["basic_info"]["fullname"], "Private Person")


if __name__ == "__main__":
    unittest.main()
