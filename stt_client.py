import requests
import time
from typing import Optional
from utils import STT_ENDPOINT, STT_MODEL_NAME, API_KEY


def transcription_from_wav(wav_bytes: bytes) -> Optional[str]:
    """
    Send WAV bytes to STT endpoint and return text.
    Handles rate limits silently with retry backoff.
    """

    url = f"{STT_ENDPOINT}/openai/deployments/{STT_MODEL_NAME}/audio/transcriptions?api-version=2025-01-01-preview"

    headers = {"api-key": API_KEY}
    files = {"file": ("audio.wav", wav_bytes, "audio/wav")}
    data = {"language": "en"}  # Force English transcription

    for attempt in range(3):
        try:
            resp = requests.post(url, headers=headers, files=files, data=data, timeout=90)

            # Handle rate limits gracefully
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", 6))
                time.sleep(retry_after)
                continue

            # Retry on transient server errors
            if resp.status_code >= 500:
                time.sleep(5 * (attempt + 1))
                continue

            # Other HTTP issues
            resp.raise_for_status()

            # Parse transcription
            payload = resp.json()
            text = payload.get("text") or payload.get("transcription") or payload.get("result")
            return text.strip() if text else None

        except requests.exceptions.Timeout:
            time.sleep(5)
            continue

        except Exception as e:
            # Silent fail, don't spam user
            return None

    # All retries failed
    return None
