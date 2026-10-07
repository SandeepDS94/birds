"""Integration test for BirdNET inference service using real test audio."""

from pathlib import Path
import pytest
from app.services.birdnet_service import analyze_audio, validate_audio_file, get_analyzer

TEST_AUDIO_DIR = Path(__file__).resolve().parent.parent.parent / "test_audio"
PEAFOWL_FILE = TEST_AUDIO_DIR / "indian_peafowl.wav"


def test_validate_audio_file_success():
    """Verify audio file validation correctly inspects duration."""
    assert PEAFOWL_FILE.exists(), f"Missing test audio file: {PEAFOWL_FILE}"
    is_valid, duration, msg = validate_audio_file(PEAFOWL_FILE)
    assert is_valid is True
    assert duration > 5.0
    assert "valid" in msg.lower()


def test_validate_audio_file_nonexistent():
    """Verify non-existent files are rejected."""
    is_valid, duration, msg = validate_audio_file("nonexistent.wav")
    assert is_valid is False
    assert "does not exist" in msg


def test_real_birdnet_inference_indian_peafowl():
    """Verify real local BirdNET inference correctly identifies Indian Peafowl."""
    assert PEAFOWL_FILE.exists()
    result = analyze_audio(PEAFOWL_FILE, min_confidence=0.1, custom_threshold=0.50)

    assert result["status"] == "identified"
    assert result["common_name"] == "Indian Peafowl"
    assert result["scientific_name"] == "Pavo cristatus"
    assert result["confidence"] > 0.70  # Real confidence is ~0.808
    assert len(result["top_predictions"]) > 0
    assert result["top_predictions"][0]["scientific_name"] == "Pavo cristatus"
