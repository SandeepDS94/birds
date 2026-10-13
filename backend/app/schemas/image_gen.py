"""Schemas for bird image generation."""

from typing import Optional
from pydantic import BaseModel, Field


class ImageGenerationRequest(BaseModel):
    """Request payload for generating an on-demand bird visual."""

    common_name: str = Field(..., description="Common name of the bird species")
    scientific_name: Optional[str] = Field(None, description="Scientific binomial name")
    custom_prompt: Optional[str] = Field(None, description="Optional extra prompt details")


class ImageGenerationData(BaseModel):
    """Response payload containing generated image information."""

    image_url: str = Field(..., description="Relative path or absolute URL of the image")
    provider: str = Field(..., description="Image provider: gemini, pollinations_ai, or wikimedia")
    common_name: str = Field(..., description="Common species name")
    scientific_name: Optional[str] = Field(None, description="Scientific name")
    gemini_status: str = Field(..., description="Status of Gemini API attempt (success, denied, quota, unconfigured)")
    gemini_error: Optional[str] = Field(None, description="Detailed error from Gemini API if any")
