"""Database seeding script for the Bird Sound Identification System.

Reads data/birds.json and idempotently upserts all species into the Supabase 'birds' table.
Safe to run repeatedly.

Usage:
    python database/seed_birds.py
"""

import json
import logging
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.database import get_supabase_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_birds")


def seed_birds():
    """Reads data/birds.json and upserts into Supabase 'birds' table."""
    birds_file = Path(__file__).resolve().parent.parent / "data" / "birds.json"
    if not birds_file.exists():
        logger.error(f"Cannot find birds.json at {birds_file}")
        sys.exit(1)

    with open(birds_file, "r", encoding="utf-8") as f:
        birds = json.load(f)

    logger.info(f"Loaded {len(birds)} bird species from {birds_file.name}.")

    client = get_supabase_client()
    if not client:
        logger.error("Supabase client is not available. Check backend/.env.")
        sys.exit(1)

    logger.info("Upserting species into Supabase 'birds' table...")

    upsert_count = 0
    for bird in birds:
        payload = {
            "common_name": bird["common_name"],
            "scientific_name": bird["scientific_name"],
            "family": bird.get("family"),
            "order": bird.get("order"),
            "description": bird.get("description"),
            "habitat": bird.get("habitat"),
            "diet": bird.get("diet"),
            "distribution": bird.get("distribution"),
            "conservation_status": bird.get("conservation_status"),
            "interesting_facts": bird.get("interesting_facts", []),
            "image_url": bird.get("image_url"),
        }
        try:
            client.table("birds").upsert(payload, on_conflict="scientific_name").execute()
            upsert_count += 1
            logger.info(f"  [✓] Upserted: {bird['common_name']} ({bird['scientific_name']})")
        except Exception as exc:
            logger.error(f"  [✗] Failed to upsert {bird['common_name']}: {exc}")

    logger.info(f"Seeding completed successfully! {upsert_count}/{len(birds)} species processed.")


if __name__ == "__main__":
    seed_birds()
