"""Bird Library API routes."""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status

from app.schemas.common import APIResponse
from app.schemas.image_gen import ImageGenerationData, ImageGenerationRequest
from app.services.bird_info_service import get_all_birds, get_bird_by_scientific_name
from app.services.image_generation_service import generate_bird_visual

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/birds", tags=["Birds"])


@router.post("/generate-image", response_model=APIResponse[ImageGenerationData])
async def generate_image(payload: ImageGenerationRequest):
    """Generates or retrieves an AI visual for a bird species using Gemini with resilient fallback."""
    result = await generate_bird_visual(
        common_name=payload.common_name,
        scientific_name=payload.scientific_name,
        custom_prompt=payload.custom_prompt,
    )
    provider_name = result.get("provider", "unknown")
    return APIResponse(
        success=True,
        message=f"Visual generated successfully via {provider_name}",
        data=ImageGenerationData(**result),
    )


@router.get("", response_model=APIResponse[List[Dict[str, Any]]])
async def list_birds():
    """Returns the catalog of all species with taxonomy, description, diet, and images."""
    birds = get_all_birds()
    return APIResponse(
        success=True,
        message=f"Retrieved {len(birds)} bird species",
        data=birds,
    )


@router.get("/{scientific_name}", response_model=APIResponse[Dict[str, Any]])
async def get_bird_details(scientific_name: str):
    """Retrieves detailed information for a specific bird by scientific name."""
    bird = get_bird_by_scientific_name(scientific_name)
    if not bird:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Species '{scientific_name}' was not found in the local database.",
        )
    return APIResponse(
        success=True,
        message=f"Retrieved details for {bird.get('common_name')}",
        data=bird,
    )
