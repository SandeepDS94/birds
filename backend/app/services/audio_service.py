"""Audio processing and bioacoustic visualization service.

Uses librosa, soundfile, and matplotlib to validate audio streams,
extract audio metadata, and compute authentic Mel-spectrogram images.
"""

import base64
import io
import logging
from pathlib import Path
from typing import Any, Dict, Tuple

import librosa
import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend
import matplotlib.pyplot as plt
import numpy as np

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"}
ALLOWED_MIME_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg",
    "audio/vorbis",
    "audio/flac",
    "audio/x-flac",
    "audio/mp4",
    "audio/x-m4a",
    "audio/webm",
    "application/octet-stream",  # Fallback for some browsers recording PCM
}


def is_allowed_audio_format(filename: str, content_type: str = "") -> bool:
    """Verifies whether an uploaded file is an allowed audio format."""
    ext = Path(filename).suffix.lower()
    if ext in ALLOWED_EXTENSIONS:
        return True
    if content_type and content_type.lower() in ALLOWED_MIME_TYPES:
        return True
    return False


def generate_spectrogram_base64(file_path: str | Path) -> str:
    """Computes a Mel-spectrogram from the real audio and returns a base64 PNG data URI.

    Args:
        file_path: Path to the audio file on disk.

    Returns:
        str: Data URI string formatted as 'data:image/png;base64,...'
    """
    path = str(file_path)
    try:
        # Load audio at native or standard bioacoustic rate (32kHz / 48kHz)
        y, sr = librosa.load(path, sr=32000, mono=True)
        if len(y) == 0:
            return ""

        # Compute log-mel spectrogram
        n_mels = 128
        n_fft = 2048
        hop_length = 512
        s = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mels=n_mels)
        s_db = librosa.power_to_db(s, ref=np.max)

        # Plot into buffer
        fig, ax = plt.subplots(figsize=(8, 3), dpi=100)
        fig.patch.set_facecolor("#0f172a")  # Dark slate background matching UI
        ax.set_facecolor("#0f172a")

        img = librosa.display.specshow(
            s_db,
            sr=sr,
            hop_length=hop_length,
            x_axis="time",
            y_axis="mel",
            ax=ax,
            cmap="viridis",
        )

        ax.tick_params(colors="#94a3b8", labelsize=8)
        ax.yaxis.label.set_color("#94a3b8")
        ax.xaxis.label.set_color("#94a3b8")
        ax.set_title("Audio Mel-Spectrogram (Frequency vs Time)", color="#f8fafc", fontsize=10, pad=8)

        # Colorbar
        cbar = fig.colorbar(img, ax=ax, format="%+2.0f dB")
        cbar.ax.yaxis.set_tick_params(color="#94a3b8", labelcolor="#94a3b8")

        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor="none")
        plt.close(fig)

        buf.seek(0)
        encoded = base64.b64encode(buf.read()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

    except Exception as exc:
        logger.error(f"Failed to generate Mel-spectrogram: {exc}", exc_info=True)
        return ""


def get_audio_metadata(file_path: str | Path) -> Dict[str, Any]:
    """Extracts duration, sample rate, and channels from audio file."""
    path = str(file_path)
    try:
        duration = float(librosa.get_duration(path=path))
        return {
            "duration": round(duration, 2),
            "valid": True,
        }
    except Exception as exc:
        logger.warning(f"Failed to read audio metadata: {exc}")
        return {"duration": 0.0, "valid": False}
