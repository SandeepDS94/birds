"""Unit tests for bird information matching service."""

from app.services.bird_info_service import get_all_birds, get_bird_by_scientific_name, match_bird_info


def test_get_all_birds():
    """Verify that birds catalog loads at least 30 species."""
    birds = get_all_birds()
    assert len(birds) >= 30
    assert any(b["scientific_name"] == "Pavo cristatus" for b in birds)


def test_get_bird_by_scientific_name():
    """Verify lookup by exact and lowercased scientific name."""
    bird = get_bird_by_scientific_name("Pavo cristatus")
    assert bird is not None
    assert bird["common_name"] == "Indian Peafowl"

    bird_lower = get_bird_by_scientific_name("pavo cristatus")
    assert bird_lower is not None
    assert bird_lower["common_name"] == "Indian Peafowl"


def test_match_bird_info_existing():
    """Verify matching with case variations and punctuation."""
    matched = match_bird_info("Indian-Peafowl", "Pavo cristatus")
    assert matched["in_database"] is True
    assert matched["common_name"] == "Indian Peafowl"
    assert "Phasianidae" in matched["family"]


def test_match_bird_info_unmatched():
    """Verify graceful fallback for uncataloged species."""
    matched = match_bird_info("Exotic Toucan", "Ramphastos toco")
    assert matched["in_database"] is False
    assert "not available in the local database" in matched["description"]
    assert matched["image_url"] is None
