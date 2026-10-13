"""Tests for the on-demand bird image generation API."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_generate_image_endpoint():
    """Verify that /api/birds/generate-image returns a valid image response envelope."""
    payload = {
        "common_name": "Indian Peafowl",
        "scientific_name": "Pavo cristatus",
    }
    response = client.post("/api/birds/generate-image", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "image_url" in data["data"]
    assert data["data"]["common_name"] == "Indian Peafowl"
    assert data["data"]["image_url"] is not None
