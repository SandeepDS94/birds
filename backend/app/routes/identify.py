"""Bird identification API route.

Accepts audio uploads from authenticated users, executes local BirdNET
inference, generates Mel-spectrograms, uploads recordings to private Supabase
storage, and stores identification records.
"""

from datetime import datetime
import logging
import os
from pathlib import Path
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth import AuthenticatedUser, get_current_user
from app.config import settings
from app.database import get_supabase_client
from app.schemas.common import APIResponse
from app.schemas.identification import IdentificationResultData, PredictionCandidate
from app.services.audio_service import (
    generate_spectrogram_base64,
    is_allowed_audio_format,
    get_audio_metadata,
)
from app.services.bird_info_service import match_bird_info
from app.services.birdnet_service import analyze_audio
from app.services.storage_service import (
    get_signed_audio_url,
    upload_audio_to_storage,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Identification"])


@router.post("/identify", response_model=APIResponse[IdentificationResultData])
async def identify_bird_audio(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Processes an uploaded audio recording to identify the bird species.

    - Requires Supabase Bearer token authentication.
    - Runs Cornell BirdNET locally (zero external API keys).
    - Stores the recording securely in private Supabase Storage.
    - Generates dynamic base64 Mel-spectrogram.
    - Returns detailed taxonomy and ecological facts from local DB.
    """
    # 1. Validate file format
    filename = file.filename or "recording.wav"
    content_type = file.content_type or ""
    if not is_allowed_audio_format(filename, content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported audio format. Please upload WAV, MP3, OGG, FLAC, M4A, or WebM.",
        )

    # 2. Save to secure temporary file in tmp_uploads/
    ext = Path(filename).suffix.lower()
    if not ext:
        ext = ".wav"
    temp_filename = f"{uuid.uuid4()}{ext}"
    temp_path = settings.TMP_UPLOADS_DIR / temp_filename

    try:
        # Stream file to disk to enforce max size
        max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
        bytes_written = 0
        with open(temp_path, "wb") as buffer:
            while chunk := await file.read(1024 * 64):
                bytes_written += len(chunk)
                if bytes_written > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Uploaded file exceeds {settings.MAX_UPLOAD_MB} MB limit.",
                    )
                buffer.write(chunk)

        if bytes_written == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes).",
            )

        # 3. Bioacoustic BirdNET inference
        try:
            analysis = analyze_audio(temp_path)
        except ValueError as val_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(val_err),
            )
        except Exception as inf_err:
            logger.error(f"BirdNET inference failed: {inf_err}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI model inference failed while processing the audio recording.",
            )

        # 4. Generate dynamic Mel-spectrogram
        spectrogram_data_uri = generate_spectrogram_base64(temp_path)

        # 5. Retrieve species information from DB
        bird_info = None
        if analysis.get("scientific_name") or analysis.get("common_name"):
            bird_info = match_bird_info(
                common_name=analysis.get("common_name"),
                scientific_name=analysis.get("scientific_name"),
            )

        # 6. Upload audio to private Supabase Storage
        storage_path = None
        signed_url = None
        storage_warning = None

        try:
            storage_path = upload_audio_to_storage(
                user_id=current_user.id,
                local_file_path=temp_path,
                original_filename=filename,
            )
            if storage_path:
                signed_url = get_signed_audio_url(storage_path, expires_in=3600)
            else:
                storage_warning = "Audio identification succeeded, but audio file could not be saved to cloud storage."
        except Exception as stor_err:
            logger.warning(f"Cloud storage upload error: {stor_err}")
            storage_warning = "Audio file could not be saved to cloud storage."

        # 7. Insert record into Supabase 'identifications' table
        record_id = str(uuid.uuid4())
        identified_at = datetime.utcnow().isoformat() + "Z"

        client = get_supabase_client()
        if client:
            try:
                db_payload = {
                    "id": record_id,
                    "user_id": current_user.id,
                    "filename": filename,
                    "bird_name": analysis.get("common_name"),
                    "scientific_name": analysis.get("scientific_name"),
                    "confidence": analysis.get("confidence", 0.0),
                    "recording_duration": analysis.get("recording_duration", 0.0),
                    "top_predictions": analysis.get("top_predictions", []),
                    "audio_path": storage_path,
                    "status": analysis.get("status", "identified"),
                }
                client.table("identifications").insert(db_payload).execute()
                logger.info(f"Saved identification record {record_id} to Supabase.")
            except Exception as db_err:
                logger.error(f"Failed to record identification in database: {db_err}", exc_info=True)
                # Keep returning the AI result even if database insertion encounters error

        # 8. Structure final response
        candidates = [
            PredictionCandidate(
                common_name=p["common_name"],
                scientific_name=p["scientific_name"],
                confidence=p["confidence"],
            )
            for p in analysis.get("top_predictions", [])
        ]

        result_message = analysis.get("message", "Analysis completed.")
        if storage_warning:
            result_message = f"{result_message} ({storage_warning})"

        data = IdentificationResultData(
            id=record_id,
            status=analysis.get("status", "identified"),
            bird_name=analysis.get("common_name"),
            scientific_name=analysis.get("scientific_name"),
            confidence=analysis.get("confidence", 0.0),
            recording_duration=analysis.get("recording_duration", 0.0),
            audio_url=signed_url,
            audio_path=storage_path,
            spectrogram=spectrogram_data_uri,
            top_predictions=candidates,
            bird_info=bird_info,
            identified_at=identified_at,
            message=result_message,
        )

        return APIResponse(
            success=True,
            message=result_message,
            data=data,
        )

    finally:
        # 9. Clean up local temporary file
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception as clean_err:
                logger.warning(f"Could not remove temp file {temp_path}: {clean_err}")
