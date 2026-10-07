"""Integration and security tests for /api/identify and /api/birds endpoints."""

from pathlib import Path
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)
TEST_AUDIO_DIR = Path(__file__).resolve().parent.parent.parent / "test_audio"
PEAFOWL_FILE = TEST_AUDIO_DIR / "indian_peafowl.wav"


def _generate_test_jwt(user_id: str = "00000000-0000-0000-0000-000000000001") -> str:
    """Generates a valid test Supabase JWT signed with SUPABASE_JWT_SECRET."""
    payload = {
        "sub": user_id,
        "email": "student@example.com",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 253402300799,  # Far future
    }
    secret = settings.SUPABASE_JWT_SECRET
    return jwt.encode(payload, secret, algorithm="HS256")


def test_get_birds_list():
    """Verify GET /api/birds returns list of catalog species."""
    res = client.get("/api/birds")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) >= 30


def test_get_bird_by_scientific_name():
    """Verify GET /api/birds/{scientific_name} returns species detail."""
    res = client.get("/api/birds/Pavo cristatus")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["common_name"] == "Indian Peafowl"


def test_identify_rejects_missing_auth():
    """Verify POST /api/identify rejects unauthenticated requests with 401."""
    with open(PEAFOWL_FILE, "rb") as f:
        files = {"file": ("indian_peafowl.wav", f, "audio/wav")}
        res = client.post("/api/identify", files=files)
    assert res.status_code == 401
    assert "token is missing" in res.json()["message"].lower()


def test_identify_rejects_invalid_file_type():
    """Verify POST /api/identify rejects non-audio file types."""
    token = _generate_test_jwt()
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": ("document.txt", b"plain text content", "text/plain")}
    res = client.post("/api/identify", files=files, headers=headers)
    assert res.status_code == 400
    assert "unsupported audio format" in res.json()["message"].lower()


def test_identify_full_pipeline_with_real_audio():
    """Verify POST /api/identify executes BirdNET and returns complete result envelope."""
    token = _generate_test_jwt()
    headers = {"Authorization": f"Bearer {token}"}
    with open(PEAFOWL_FILE, "rb") as f:
        files = {"file": ("indian_peafowl.wav", f, "audio/wav")}
        res = client.post("/api/identify", files=files, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    result = data["data"]
    assert result["status"] == "identified"
    assert result["bird_name"] == "Indian Peafowl"
    assert result["scientific_name"] == "Pavo cristatus"
    assert result["confidence"] > 0.70
    assert result["spectrogram"].startswith("data:image/png;base64,")
    assert result["bird_info"] is not None
    assert result["bird_info"]["family"] == "Phasianidae"
    assert len(result["top_predictions"]) > 0
