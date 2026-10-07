"""Configuration module using pydantic-settings.

Loads environment variables from backend/.env or system environment.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with defaults and environment variable overrides."""

    # Supabase Configuration
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder-service-role-key"
    SUPABASE_JWT_SECRET: str = "placeholder-jwt-secret"
    SUPABASE_STORAGE_BUCKET: str = "bird-audio"

    # BirdNET Inference Settings
    BIRD_CONFIDENCE_THRESHOLD: float = 0.50

    # Upload Settings
    MAX_UPLOAD_MB: int = 25

    # Security & CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    TMP_UPLOADS_DIR: Path = Path(__file__).resolve().parent.parent / "tmp_uploads"
    DATA_DIR: Path = Path(__file__).resolve().parent.parent.parent / "data"

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
