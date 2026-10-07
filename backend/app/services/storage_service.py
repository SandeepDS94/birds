"""Storage Service managing private audio uploads and signed URLs via Supabase Storage.

Audio files are secured in the private 'bird-audio' bucket using tenant paths:
{user_id}/{uuid}.{ext}
Frontend clients stream or download recordings via time-limited signed URLs.
"""

import logging
import uuid
from pathlib import Path
from typing import Optional

from app.config import settings
from app.database import get_supabase_client

logger = logging.getLogger(__name__)

MIME_MAP = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".m4a": "audio/x-m4a",
    ".webm": "audio/webm",
}


def upload_audio_to_storage(
    user_id: str,
    local_file_path: Path,
    original_filename: str,
) -> Optional[str]:
    """Uploads an audio recording to the private 'bird-audio' bucket.

    Args:
        user_id: Unique Supabase user UUID.
        local_file_path: Path to the temporary local audio file.
        original_filename: Name of the uploaded file (for extension extraction).

    Returns:
        Optional[str]: Remote storage object path (e.g. '{user_id}/{uuid}.wav'), or None on failure.
    """
    client = get_supabase_client()
    if not client:
        logger.warning("Supabase client unavailable for audio storage upload.")
        return None

    ext = Path(original_filename).suffix.lower()
    if not ext:
        ext = ".wav"

    storage_filename = f"{uuid.uuid4()}{ext}"
    storage_path = f"{user_id}/{storage_filename}"
    content_type = MIME_MAP.get(ext, "application/octet-stream")

    try:
        bucket = settings.SUPABASE_STORAGE_BUCKET
        with open(local_file_path, "rb") as f:
            file_bytes = f.read()

        client.storage.from_(bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        logger.info(f"Audio file uploaded to Supabase Storage: {bucket}/{storage_path}")
        return storage_path

    except Exception as exc:
        logger.error(f"Failed to upload audio to Supabase Storage: {exc}", exc_info=True)
        return None


def get_signed_audio_url(storage_path: Optional[str], expires_in: int = 3600) -> Optional[str]:
    """Generates a time-limited signed URL for a private storage object.

    Args:
        storage_path: Object path in 'bird-audio' (e.g. '{user_id}/{uuid}.wav').
        expires_in: Expiration duration in seconds (default 3600 = 1 hour).

    Returns:
        Optional[str]: Signed URL string or None if generation failed.
    """
    if not storage_path:
        return None

    client = get_supabase_client()
    if not client:
        return None

    try:
        bucket = settings.SUPABASE_STORAGE_BUCKET
        res = client.storage.from_(bucket).create_signed_url(
            path=storage_path,
            expires_in=expires_in,
        )
        # Handle dict or string response across supabase-py versions
        if isinstance(res, dict) and "signedURL" in res:
            return res["signedURL"]
        elif isinstance(res, dict) and "signedUrl" in res:
            return res["signedUrl"]
        elif hasattr(res, "signed_url"):
            return res.signed_url
        elif isinstance(res, str):
            return res
        return None
    except Exception as exc:
        logger.warning(f"Could not generate signed URL for {storage_path}: {exc}")
        return None


def delete_audio_from_storage(storage_path: Optional[str]) -> bool:
    """Deletes an audio file from the private Supabase Storage bucket.

    Args:
        storage_path: Remote object path to delete.

    Returns:
        bool: True if deletion succeeded, False otherwise.
    """
    if not storage_path:
        return True

    client = get_supabase_client()
    if not client:
        return False

    try:
        bucket = settings.SUPABASE_STORAGE_BUCKET
        client.storage.from_(bucket).remove([storage_path])
        logger.info(f"Deleted audio file from storage: {bucket}/{storage_path}")
        return True
    except Exception as exc:
        logger.error(f"Failed to delete audio from storage ({storage_path}): {exc}")
        return False
