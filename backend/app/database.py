"""Database client module managing connection to Supabase via supabase-py.

Uses the server-side Service Role Key to manage storage and database operations.
"""

import logging
from typing import Optional
from supabase import Client, create_client
from app.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """Retrieves or initializes the singleton Supabase client.

    Returns:
        Client: Initialized Supabase client instance, or None if credentials are placeholder.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    # Check if credentials are still placeholder
    if (
        not settings.SUPABASE_URL
        or "placeholder" in settings.SUPABASE_URL
        or not settings.SUPABASE_SERVICE_ROLE_KEY
        or "placeholder" in settings.SUPABASE_SERVICE_ROLE_KEY
    ):
        logger.warning(
            "Supabase credentials not configured in backend/.env. Supabase operations will be skipped or mocked."
        )
        return None

    try:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        logger.info("Supabase client initialized successfully.")
        return _supabase_client
    except Exception as exc:
        logger.error(f"Failed to initialize Supabase client: {exc}")
        return None


def check_supabase_health() -> tuple[bool, str]:
    """Performs a lightweight connectivity check against Supabase.

    Returns:
        tuple[bool, str]: (is_healthy, detail_message)
    """
    client = get_supabase_client()
    if not client:
        return False, "Supabase client not configured or placeholder keys detected"

    try:
        # Perform lightweight query on birds table
        response = client.table("birds").select("id").limit(1).execute()
        return True, "Connected to Supabase PostgreSQL"
    except Exception as exc:
        return False, f"Supabase connection error: {str(exc)}"
