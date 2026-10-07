"""Schemas for bird sound identification requests and responses."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PredictionCandidate(BaseModel):
    """Candidate species prediction with confidence."""

    common_name: str
    scientific_name: str
    confidence: float


class IdentificationResultData(BaseModel):
    """Complete response payload for a bird identification event."""

    id: Optional[str] = None
    status: str = Field(..., description="'identified', 'low_confidence', or 'no_detection'")
    bird_name: Optional[str] = None
    scientific_name: Optional[str] = None
    confidence: float
    recording_duration: float
    audio_url: Optional[str] = Field(default=None, description="Time-limited signed audio URL")
    audio_path: Optional[str] = Field(default=None, description="Internal storage reference")
    spectrogram: Optional[str] = Field(default=None, description="Base64 Mel-spectrogram data URI")
    top_predictions: List[PredictionCandidate] = []
    bird_info: Optional[Dict[str, Any]] = None
    identified_at: str
    message: str
