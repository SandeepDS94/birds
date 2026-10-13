"""Bird Image Generation Service.

Provides on-demand AI bird visual generation using Google Gemini / Imagen API,
with automatic local caching in backend/static/images/generated/ and resilient
fallback to AI image generation or Wikimedia species photography when external
quotas or permissions prevent direct Google Cloud generation.
"""

import base64
import json
import logging
import re
import urllib.parse
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Directory where generated images are persisted
GENERATED_DIR = settings.BASE_DIR / "static" / "images" / "generated"
BIRDS_DIR = settings.BASE_DIR / "static" / "images" / "birds"

GENERATED_DIR.mkdir(parents=True, exist_ok=True)


def _get_slug(name: str) -> str:
    """Creates a filesystem-safe filename slug."""
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", name.lower().strip()).strip("_")
    return slug or "unknown_bird"


def get_cached_image_url(common_name: str, scientific_name: Optional[str] = None) -> Optional[str]:
    """Checks whether an image already exists locally for this species."""
    names_to_check = [n for n in [scientific_name, common_name] if n]
    for n in names_to_check:
        slug = _get_slug(n)
        # Check standard catalog first
        catalog_file = BIRDS_DIR / f"{slug}.jpg"
        if catalog_file.exists():
            return f"/images/birds/{slug}.jpg"

        # Check previously generated directory
        for ext in [".jpg", ".png", ".webp"]:
            gen_file = GENERATED_DIR / f"{slug}{ext}"
            if gen_file.exists():
                return f"/images/generated/{slug}{ext}"

    return None


async def _generate_via_gemini(prompt: str, slug: str) -> Dict[str, Any]:
    """Attempts to generate an image using Google Gemini / Imagen 3 API."""
    api_key = settings.GEMINI_API_KEY.strip()
    if not api_key:
        return {
            "success": False,
            "status": "unconfigured",
            "error": "GEMINI_API_KEY is not configured in backend/.env",
        }

    headers = {"Content-Type": "application/json"}

    # 1. Try Imagen 3 predict endpoint
    imagen_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={api_key}"
    )
    imagen_payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "4:3",
            "personGeneration": "DONT_ALLOW",
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(imagen_url, json=imagen_payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                predictions = data.get("predictions", [])
                if predictions and "bytesBase64Encoded" in predictions[0]:
                    img_bytes = base64.b64decode(predictions[0]["bytesBase64Encoded"])
                    target_file = GENERATED_DIR / f"{slug}.jpg"
                    target_file.write_bytes(img_bytes)
                    logger.info(f"Generated bird image via Imagen 3 for slug {slug}")
                    return {
                        "success": True,
                        "status": "success",
                        "image_url": f"/images/generated/{slug}.jpg",
                        "provider": "gemini_imagen3",
                    }
            else:
                resp_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                err_msg = resp_data.get("error", {}).get("message", resp.text)
                logger.warning(f"Gemini Imagen 3 returned {resp.status_code}: {err_msg}")
                gemini_status = "permission_denied" if "denied" in err_msg.lower() else "quota_exceeded"
                last_error = f"Gemini Imagen error ({resp.status_code}): {err_msg}"
        except Exception as exc:
            logger.warning(f"Imagen 3 request error: {exc}")
            last_error = str(exc)
            gemini_status = "error"

        # 2. Try multimodal Gemini generateContent with responseModalities: ["IMAGE", "TEXT"]
        for model in ["gemini-2.5-flash-image", "gemini-3.1-flash-image", "gemini-3-pro-image"]:
            gemini_content_url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            )
            payload = {
                "contents": [{"parts": [{"text": f"Generate a high resolution photorealistic image of {prompt}"}]}],
                "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
            }
            try:
                resp = await client.post(gemini_content_url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    for cand in data.get("candidates", []):
                        for part in cand.get("content", {}).get("parts", []):
                            if "inlineData" in part and "data" in part["inlineData"]:
                                img_bytes = base64.b64decode(part["inlineData"]["data"])
                                target_file = GENERATED_DIR / f"{slug}.jpg"
                                target_file.write_bytes(img_bytes)
                                logger.info(f"Generated bird image via {model} for {slug}")
                                return {
                                    "success": True,
                                    "status": "success",
                                    "image_url": f"/images/generated/{slug}.jpg",
                                    "provider": f"gemini_{model}",
                                }
                else:
                    resp_data = (
                        resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                    )
                    err_msg = resp_data.get("error", {}).get("message", resp.text)
                    if "denied" in err_msg.lower():
                        gemini_status = "permission_denied"
                    elif "quota" in err_msg.lower():
                        gemini_status = "quota_exceeded"
                    last_error = f"{model} error ({resp.status_code}): {err_msg}"
            except Exception as exc:
                last_error = str(exc)

    return {
        "success": False,
        "status": gemini_status,
        "error": last_error,
    }


async def _generate_via_pollinations(prompt: str, slug: str) -> Optional[str]:
    """Generates an AI image via free Pollinations AI engine and caches it locally."""
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=533&nologo=true"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, headers={"User-Agent": "BirdNET-Visualizer/1.0"})
            if resp.status_code == 200 and len(resp.content) > 1000:
                target_file = GENERATED_DIR / f"{slug}.jpg"
                target_file.write_bytes(resp.content)
                logger.info(f"Successfully generated and cached AI visual via Pollinations for {slug}")
                return f"/images/generated/{slug}.jpg"
    except Exception as exc:
        logger.warning(f"Pollinations AI fallback generation failed: {exc}")

    return None


async def _fetch_wikipedia_image(common_name: str, scientific_name: Optional[str]) -> Optional[str]:
    """Fetches high-resolution species specimen photography from Wikipedia REST API."""
    queries = [q for q in [scientific_name, common_name] if q]
    async with httpx.AsyncClient(timeout=10.0) as client:
        for q in queries:
            try:
                url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(q)}"
                resp = await client.get(url, headers={"User-Agent": "BirdNET-Visualizer/1.0 (bioacoustics)"})
                if resp.status_code == 200:
                    data = resp.json()
                    thumb_url = data.get("thumbnail", {}).get("source")
                    original_url = data.get("originalimage", {}).get("source")
                    img_to_download = original_url or thumb_url
                    if img_to_download:
                        img_resp = await client.get(img_to_download)
                        if img_resp.status_code == 200:
                            slug = _get_slug(q)
                            target_file = GENERATED_DIR / f"{slug}.jpg"
                            target_file.write_bytes(img_resp.content)
                            return f"/images/generated/{slug}.jpg"
            except Exception as exc:
                logger.debug(f"Wikipedia lookup for '{q}' failed: {exc}")

    return None


async def generate_bird_visual(
    common_name: str,
    scientific_name: Optional[str] = None,
    custom_prompt: Optional[str] = None,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """Generates or retrieves a high-quality visual representation for a bird species.

    1. Checks local cache unless force_refresh is True.
    2. Prompts Google Gemini / Imagen 3 API using GEMINI_API_KEY.
    3. If Gemini is unavailable, denied, or over quota, transparently falls back
       to AI generation and Wikimedia nature photography so the user gets a working visual.
    """
    primary_name = scientific_name or common_name
    slug = _get_slug(primary_name)

    if not force_refresh:
        cached_url = get_cached_image_url(common_name, scientific_name)
        if cached_url:
            return {
                "image_url": cached_url,
                "provider": "cache",
                "common_name": common_name,
                "scientific_name": scientific_name,
                "gemini_status": "cached",
                "gemini_error": None,
            }

    # Construct rich nature photography prompt
    prompt = (
        f"Award-winning professional wildlife photography of a {common_name}"
        + (f" ({scientific_name})" if scientific_name else "")
        + " perched naturally in its authentic habitat. Sharp focus on feather texture, natural outdoor sunlight, bokeh woodland background, 8k resolution, authentic avian anatomy."
    )
    if custom_prompt:
        prompt = f"{prompt} Additional detail: {custom_prompt}"

    # Step 1: Attempt Gemini Image Generation
    gemini_result = await _generate_via_gemini(prompt, slug)
    if gemini_result.get("success"):
        return {
            "image_url": gemini_result["image_url"],
            "provider": gemini_result.get("provider", "gemini"),
            "common_name": common_name,
            "scientific_name": scientific_name,
            "gemini_status": "success",
            "gemini_error": None,
        }

    gemini_error = gemini_result.get("error")
    gemini_status = gemini_result.get("status", "failed")

    # Step 2: Resilient Fallback - Pollinations AI
    pollinations_url = await _generate_via_pollinations(prompt, slug)
    if pollinations_url:
        return {
            "image_url": pollinations_url,
            "provider": "pollinations_ai",
            "common_name": common_name,
            "scientific_name": scientific_name,
            "gemini_status": gemini_status,
            "gemini_error": gemini_error,
        }

    # Step 3: Resilient Fallback - Wikipedia Specimen Photography
    wiki_url = await _fetch_wikipedia_image(common_name, scientific_name)
    if wiki_url:
        return {
            "image_url": wiki_url,
            "provider": "wikimedia",
            "common_name": common_name,
            "scientific_name": scientific_name,
            "gemini_status": gemini_status,
            "gemini_error": gemini_error,
        }

    # Fallback placeholder if all networks fail
    return {
        "image_url": "/images/birds/pavo_cristatus.jpg",
        "provider": "default_catalog",
        "common_name": common_name,
        "scientific_name": scientific_name,
        "gemini_status": gemini_status,
        "gemini_error": gemini_error,
    }
