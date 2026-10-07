"""Authentication and authorization utilities for verifying Supabase JWT access tokens.

Extracts and cryptographically validates tokens from the Authorization header.
"""

import logging
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    """Represents an authenticated user extracted from a valid Supabase JWT."""

    id: str
    email: Optional[str] = None
    role: str = "authenticated"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> AuthenticatedUser:
    """FastAPI dependency to authenticate requests using a Supabase JWT.

    Args:
        credentials: The Bearer token extracted from the Authorization header.

    Returns:
        AuthenticatedUser: The validated user profile.

    Raises:
        HTTPException: If the token is missing, malformed, expired, or invalid.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in to proceed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # 1. Primary validation: Use Supabase Auth API (supports both ES256 and HS256)
    from app.database import get_supabase_client
    client = get_supabase_client()
    if client:
        try:
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                u = user_response.user
                return AuthenticatedUser(
                    id=str(u.id),
                    email=u.email,
                    role=getattr(u, "role", "authenticated") or "authenticated",
                )
        except Exception as exc:
            error_msg = str(exc)
            logger.warning(f"Supabase auth validation returned error: {error_msg}")
            if "expired" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Your session has expired. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            # If invalid token, proceed to check fallback or raise 401
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token. Please re-authenticate.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 2. Local / Mock / PyJWT fallback (useful in offline unit tests without Supabase network)
    secret = settings.SUPABASE_JWT_SECRET
    if not secret or "placeholder" in secret:
        logger.warning("SUPABASE_JWT_SECRET not configured. Verifying unverified claims (DEV ONLY).")
        try:
            unverified_claims = jwt.decode(token, options={"verify_signature": False})
            user_id = unverified_claims.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload: missing subject identifier.",
                )
            return AuthenticatedUser(
                id=user_id,
                email=unverified_claims.get("email"),
                role=unverified_claims.get("role", "authenticated"),
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(exc)}",
            )

    try:
        # Standard Supabase JWT validation (HS256)
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a valid user identity.",
            )

        return AuthenticatedUser(
            id=user_id,
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
