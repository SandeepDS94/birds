"""Unit tests for the health check endpoint."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_returns_success():
    """Verify that /api/health responds with 200 and standard envelope."""
    response = client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["message"] == "System health check completed"
    assert "data" in data
    assert data["data"]["api"]["status"] == "ok"
    assert "birdnet_model" in data["data"]
    assert "supabase" in data["data"]
