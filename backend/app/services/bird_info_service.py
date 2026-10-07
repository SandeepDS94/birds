"""Bird Information Service.

Retrieves bird species information from Supabase (or local fallback)
and performs fuzzy/case-insensitive matching between BirdNET predictions
and the species catalog.
"""

import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import settings
from app.database import get_supabase_client

logger = logging.getLogger(__name__)

# Cache catalog to reduce database round-trips
_birds_cache: Optional[List[Dict[str, Any]]] = None


def _load_local_birds() -> List[Dict[str, Any]]:
    """Loads bird records from local data/birds.json fallback."""
    json_path = settings.DATA_DIR / "birds.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.error(f"Error loading local birds.json: {exc}")
    return []


def get_all_birds(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """Retrieves all species from the Supabase 'birds' table (with cache).

    Args:
        force_refresh: Whether to bypass memory cache and reload from DB.

    Returns:
        List[Dict[str, Any]]: List of all bird records.
    """
    global _birds_cache

    if _birds_cache is not None and not force_refresh:
        return _birds_cache

    client = get_supabase_client()
    if client:
        try:
            response = client.table("birds").select("*").order("common_name").execute()
            if response.data and len(response.data) > 0:
                _birds_cache = response.data
                return _birds_cache
        except Exception as exc:
            logger.warning(f"Failed to fetch birds from Supabase, using local fallback: {exc}")

    # Fallback to local birds.json
    _birds_cache = _load_local_birds()
    return _birds_cache


def get_bird_by_scientific_name(scientific_name: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single bird species by its scientific name.

    Args:
        scientific_name: Scientific binomial name (e.g. 'Pavo cristatus').

    Returns:
        Optional[Dict[str, Any]]: Bird dictionary or None if not found.
    """
    if not scientific_name:
        return None

    cleaned_name = scientific_name.strip().lower()
    birds = get_all_birds()

    for bird in birds:
        if bird.get("scientific_name", "").strip().lower() == cleaned_name:
            return bird
    return None


def _normalize_name(name: str) -> str:
    """Strips hyphens, spaces, and punctuation for flexible name matching."""
    return re.sub(r"[^a-zA-Z0-9]", "", name).lower()


def match_bird_info(
    common_name: Optional[str],
    scientific_name: Optional[str],
) -> Dict[str, Any]:
    """Matches a BirdNET prediction to a database species record.

    Tries scientific name exact and normalized match, then common name
    exact and normalized match. If no match is found, returns the raw
    BirdNET identification with a transparent notice rather than fabricating facts.

    Args:
        common_name: Common name reported by BirdNET.
        scientific_name: Scientific name reported by BirdNET.

    Returns:
        Dict[str, Any]: Detailed bird record or safe fallback representation.
    """
    birds = get_all_birds()

    # 1. Match by scientific name (highest accuracy)
    if scientific_name:
        norm_sci = _normalize_name(scientific_name)
        for bird in birds:
            if _normalize_name(bird.get("scientific_name", "")) == norm_sci:
                matched = dict(bird)
                matched["in_database"] = True
                return matched

    # 2. Match by common name
    if common_name:
        norm_com = _normalize_name(common_name)
        for bird in birds:
            db_norm = _normalize_name(bird.get("common_name", ""))
            if db_norm == norm_com or db_norm in norm_com or norm_com in db_norm:
                matched = dict(bird)
                matched["in_database"] = True
                return matched

    # 3. Transparent fallback when species is not present in local catalog
    return {
        "common_name": common_name or "Unknown Species",
        "scientific_name": scientific_name or "Unknown Taxonomy",
        "family": "Uncataloged",
        "order": "Uncataloged",
        "description": "Detailed ecological information is not available in the local database.",
        "habitat": "Information not available.",
        "diet": "Information not available.",
        "distribution": "Information not available.",
        "conservation_status": "Information not available.",
        "interesting_facts": [],
        "image_url": None,
        "in_database": False,
    }
