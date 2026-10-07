"""Statistics and analytics API routes."""

from collections import Counter
from datetime import datetime
import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import AuthenticatedUser, get_current_user
from app.database import get_supabase_client
from app.schemas.common import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/statistics", tags=["Statistics"])


@router.get("", response_model=APIResponse[Dict[str, Any]])
async def get_user_statistics(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Computes identification analytics and chart data for the user dashboard."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable.",
        )

    try:
        res = (
            client.table("identifications")
            .select("bird_name, scientific_name, confidence, identified_at, status")
            .eq("user_id", current_user.id)
            .order("identified_at", desc=False)
            .execute()
        )

        records = res.data or []
        total_recordings = len(records)

        if total_recordings == 0:
            return APIResponse(
                success=True,
                message="No recordings yet",
                data={
                    "total_recordings": 0,
                    "successful_identifications": 0,
                    "average_confidence": 0.0,
                    "most_frequent_species": "None",
                    "distinct_species_count": 0,
                    "species_distribution": [],
                    "confidence_distribution": [],
                    "timeline": [],
                },
            )

        # 1. Basic counts
        successful = [r for r in records if r.get("status") == "identified"]
        confidences = [float(r.get("confidence") or 0.0) for r in records if r.get("confidence") is not None]
        avg_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 0.0

        # 2. Species frequency
        species_counts = Counter(
            r.get("bird_name") for r in records if r.get("bird_name") and r.get("status") == "identified"
        )
        most_frequent = species_counts.most_common(1)[0][0] if species_counts else "None"
        distinct_count = len(species_counts)

        # Species distribution for charts
        species_distribution = [
            {"name": name, "count": count}
            for name, count in species_counts.most_common(10)
        ]

        # 3. Confidence range distribution
        ranges = {"0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0}
        for c in confidences:
            if c < 0.25:
                ranges["0-25%"] += 1
            elif c < 0.50:
                ranges["25-50%"] += 1
            elif c < 0.75:
                ranges["50-75%"] += 1
            else:
                ranges["75-100%"] += 1

        confidence_distribution = [
            {"range": r, "count": count} for r, count in ranges.items()
        ]

        # 4. Activity timeline by date
        date_counts = Counter(
            (r.get("identified_at") or "")[:10] for r in records if r.get("identified_at")
        )
        timeline = [
            {"date": d, "count": date_counts[d]}
            for d in sorted(date_counts.keys())
        ]

        return APIResponse(
            success=True,
            message="Statistics computed successfully",
            data={
                "total_recordings": total_recordings,
                "successful_identifications": len(successful),
                "average_confidence": avg_confidence,
                "most_frequent_species": most_frequent,
                "distinct_species_count": distinct_count,
                "species_distribution": species_distribution,
                "confidence_distribution": confidence_distribution,
                "timeline": timeline,
            },
        )
    except Exception as exc:
        logger.error(f"Error computing statistics: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute statistics.",
        )
