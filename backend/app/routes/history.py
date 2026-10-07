"""History API routes for browsing, inspecting, and deleting past recordings."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import AuthenticatedUser, get_current_user
from app.database import get_supabase_client
from app.schemas.common import APIResponse
from app.services.storage_service import delete_audio_from_storage, get_signed_audio_url

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("", response_model=APIResponse[Dict[str, Any]])
async def list_user_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retrieves paginated identification history for the authenticated user."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable.",
        )

    offset = (page - 1) * limit

    try:
        # Query total count
        count_res = client.table("identifications").select("id", count="exact").eq("user_id", current_user.id).execute()
        total_count = count_res.count or 0

        # Query paginated rows
        rows_res = (
            client.table("identifications")
            .select("*")
            .eq("user_id", current_user.id)
            .order("identified_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        items = rows_res.data or []

        # Generate fresh signed URLs for recordings
        for item in items:
            audio_path = item.get("audio_path")
            item["audio_url"] = get_signed_audio_url(audio_path, expires_in=3600) if audio_path else None

        return APIResponse(
            success=True,
            message="Identification history retrieved successfully",
            data={
                "items": items,
                "total": total_count,
                "page": page,
                "limit": limit,
                "pages": (total_count + limit - 1) // limit if limit > 0 else 1,
            },
        )
    except Exception as exc:
        logger.error(f"Failed to fetch user history: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recording history.",
        )


@router.get("/{identification_id}", response_model=APIResponse[Dict[str, Any]])
async def get_history_detail(
    identification_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retrieves a single identification record with a fresh signed audio URL."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable.",
        )

    try:
        res = (
            client.table("identifications")
            .select("*")
            .eq("id", identification_id)
            .eq("user_id", current_user.id)
            .limit(1)
            .execute()
        )

        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recording identification record not found.",
            )

        item = res.data[0]
        audio_path = item.get("audio_path")
        item["audio_url"] = get_signed_audio_url(audio_path, expires_in=3600) if audio_path else None

        return APIResponse(
            success=True,
            message="Record retrieved successfully",
            data=item,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error fetching record {identification_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve record detail.",
        )


@router.delete("/{identification_id}", response_model=APIResponse[Dict[str, Any]])
async def delete_history_item(
    identification_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Deletes an identification record from the database AND removes its audio file from cloud storage."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable.",
        )

    try:
        # Retrieve the record first to get the audio_path
        fetch_res = (
            client.table("identifications")
            .select("audio_path")
            .eq("id", identification_id)
            .eq("user_id", current_user.id)
            .limit(1)
            .execute()
        )

        if not fetch_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found or access denied.",
            )

        audio_path = fetch_res.data[0].get("audio_path")

        # 1. Delete audio from storage bucket
        if audio_path:
            delete_audio_from_storage(audio_path)

        # 2. Delete database row
        client.table("identifications").delete().eq("id", identification_id).eq("user_id", current_user.id).execute()

        logger.info(f"Deleted identification record {identification_id} and storage asset {audio_path}")
        return APIResponse(
            success=True,
            message="Recording and identification record successfully deleted.",
            data={"id": identification_id},
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to delete identification {identification_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete recording record.",
        )
