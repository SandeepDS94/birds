"""BirdNET Bioacoustic Machine Learning Service.

Loads the Cornell Lab BirdNET deep learning model once at startup,
validates incoming audio, executes local bioacoustic inference,
aggregates interval predictions, filters by confidence threshold,
and returns structured top predictions.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import soundfile as sf
import librosa
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer

from app.config import settings

logger = logging.getLogger(__name__)

# Global singleton analyzer instance
_analyzer_instance: Optional[Analyzer] = None


def get_analyzer() -> Analyzer:
    """Retrieves or initializes the singleton BirdNET Analyzer model.

    Ensures the deep learning model weights and metadata are loaded
    into memory exactly once during application lifecycle.

    Returns:
        Analyzer: Initialized BirdNET Analyzer instance.
    """
    global _analyzer_instance
    if _analyzer_instance is None:
        logger.info("Loading BirdNET deep learning model into memory (singleton)...")
        _analyzer_instance = Analyzer()
        logger.info("BirdNET deep learning model loaded successfully.")
    return _analyzer_instance


def is_model_loaded() -> bool:
    """Checks whether the BirdNET model is initialized in memory.

    Returns:
        bool: True if loaded, False otherwise.
    """
    return _analyzer_instance is not None


def validate_audio_file(file_path: str | Path) -> Tuple[bool, float, str]:
    """Validates that the given file exists, is non-empty, and has valid audio.

    Args:
        file_path: Path to the audio file.

    Returns:
        Tuple[bool, float, str]: (is_valid, duration_in_seconds, error_or_success_message)
    """
    path = Path(file_path)
    if not path.exists():
        return False, 0.0, "Audio file does not exist on disk."

    file_size = path.stat().st_size
    if file_size == 0:
        return False, 0.0, "Uploaded audio file is empty (0 bytes)."

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if file_size > max_bytes:
        return False, 0.0, f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_MB} MB."

    try:
        # Check audio header and duration using soundfile or librosa
        info = sf.info(str(path))
        duration = float(info.duration)
        if duration < 0.5:
            return False, duration, "Recording is too short (minimum duration is 1 second)."
        return True, duration, "Audio file is valid."
    except Exception:
        # Fallback inspection with librosa for compressed formats like mp3/ogg
        try:
            duration = float(librosa.get_duration(path=str(path)))
            if duration < 0.5:
                return False, duration, "Recording is too short (minimum duration is 1 second)."
            return True, duration, "Audio file is valid."
        except Exception as exc:
            return False, 0.0, f"Corrupted or unsupported audio format: {str(exc)}"


def analyze_audio(
    file_path: str | Path,
    min_confidence: float = 0.05,
    custom_threshold: Optional[float] = None,
) -> Dict[str, Any]:
    """Runs local BirdNET bioacoustic inference on an audio file.

    Args:
        file_path: Absolute or relative path to the audio file.
        min_confidence: Lower bound for raw candidate extraction (default 0.05).
        custom_threshold: Confidence threshold to classify as 'identified' vs 'low_confidence'.
                          Defaults to settings.BIRD_CONFIDENCE_THRESHOLD (0.50).

    Returns:
        Dict[str, Any]: Structured inference results containing:
            - status: 'identified', 'low_confidence', or 'no_detection'
            - common_name: Best detected common name (or None)
            - scientific_name: Best detected scientific name (or None)
            - confidence: Confidence float between 0.0 and 1.0 (or 0.0)
            - recording_duration: Duration in seconds
            - top_predictions: List of top 5 species with confidence
            - message: User-friendly identification summary
    """
    threshold = custom_threshold if custom_threshold is not None else settings.BIRD_CONFIDENCE_THRESHOLD

    # 1. Validate audio integrity
    is_valid, duration, validation_msg = validate_audio_file(file_path)
    if not is_valid:
        raise ValueError(validation_msg)

    # 2. Get singleton analyzer
    analyzer = get_analyzer()

    try:
        # 3. Instantiate Recording and run analysis
        recording = Recording(
            analyzer,
            str(file_path),
            min_conf=min_confidence,
        )
        recording.analyze()
        raw_detections = recording.detections

        # 4. Aggregate detections across time intervals
        # Group by species and record the maximum confidence observed
        species_map: Dict[str, Dict[str, Any]] = {}
        for d in raw_detections:
            sci_name = d.get("scientific_name", "").strip()
            com_name = d.get("common_name", "").strip()
            conf = float(d.get("confidence", 0.0))

            if not sci_name:
                continue

            if sci_name not in species_map or conf > species_map[sci_name]["confidence"]:
                species_map[sci_name] = {
                    "common_name": com_name,
                    "scientific_name": sci_name,
                    "confidence": round(conf, 4),
                    "start_time": d.get("start_time"),
                    "end_time": d.get("end_time"),
                }

        # Sort species descending by highest confidence score
        sorted_species = sorted(
            species_map.values(),
            key=lambda x: x["confidence"],
            reverse=True,
        )

        top_5_predictions = sorted_species[:5]

        # 5. Determine identification classification
        if not sorted_species:
            return {
                "status": "no_detection",
                "common_name": None,
                "scientific_name": None,
                "confidence": 0.0,
                "recording_duration": round(duration, 2),
                "top_predictions": [],
                "message": "No bird species could be detected in this recording. Try a clearer recording with less background noise.",
            }

        best = sorted_species[0]
        best_conf = best["confidence"]

        if best_conf < threshold:
            return {
                "status": "low_confidence",
                "common_name": best["common_name"],
                "scientific_name": best["scientific_name"],
                "confidence": best_conf,
                "recording_duration": round(duration, 2),
                "top_predictions": top_5_predictions,
                "message": (
                    f"Unable to confidently identify the bird (detected {best['common_name']} "
                    f"with {best_conf * 100:.1f}% confidence, threshold is {threshold * 100:.0f}%). "
                    "Try a clearer recording with less background noise."
                ),
            }

        return {
            "status": "identified",
            "common_name": best["common_name"],
            "scientific_name": best["scientific_name"],
            "confidence": best_conf,
            "recording_duration": round(duration, 2),
            "top_predictions": top_5_predictions,
            "message": f"Successfully identified {best['common_name']} ({best['scientific_name']}) with {best_conf * 100:.1f}% confidence.",
        }

    except Exception as exc:
        logger.error(f"Error during BirdNET inference: {exc}", exc_info=True)
        raise RuntimeError(f"BirdNET inference failed: {str(exc)}")
