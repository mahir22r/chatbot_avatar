import requests
import json
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment
API_KEY = os.getenv("API_KEY")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME")
LLM_ENDPOINT = os.getenv("LLM_ENDPOINT")

# Enable/disable verbose debug logs
DEBUG = True

def chat_with_llm(user_messages, system_prompt=None, max_retries=3, backoff_base=5):
    """
    Robust LLM chat completion client.
    Handles transient errors, rate limits, and multiple response formats gracefully.

    Args:
        user_messages (str | list): User message(s) or full message list for LLM.
        system_prompt (str | None): Optional system-level prompt.
        max_retries (int): Retry attempts for 429 or 5xx errors.
        backoff_base (int): Seconds for exponential backoff base.
    Returns:
        str | None: LLM response text or None on failure.
    """

    # Validate environment variables
    if not API_KEY or not LLM_ENDPOINT or not LLM_MODEL_NAME:
        print("[LLM ERROR] Missing environment variables!")
        print(f"  API_KEY: {'SET' if API_KEY else 'MISSING'}")
        print(f"  LLM_ENDPOINT: {LLM_ENDPOINT if LLM_ENDPOINT else 'MISSING'}")
        print(f"  LLM_MODEL_NAME: {LLM_MODEL_NAME if LLM_MODEL_NAME else 'MISSING'}")
        return None

    url = LLM_ENDPOINT
    headers = {
        "api-key": API_KEY,
        "Content-Type": "application/json"
    }

    # Normalize input
    if isinstance(user_messages, str):
        messages = [{"role": "user", "content": user_messages}]
    else:
        messages = user_messages

    if system_prompt:
        messages = [{"role": "system", "content": system_prompt}] + messages

    payload = {
        "model": LLM_MODEL_NAME,
        "messages": messages,
        "max_tokens": 512,
        "temperature": 0.8,
        "top_p": 0.95
    }

    if DEBUG:
        print(f"\n[LLM] ===== REQUEST =====")
        print(f"[LLM] Endpoint: {url}")
        print(f"[LLM] Model: {LLM_MODEL_NAME}")
        print(f"[LLM] Messages count: {len(messages)}")
        print(f"[LLM] Last message: {messages[-1]['content'][:100]}...")

    for attempt in range(1, max_retries + 1):
        try:
            if DEBUG:
                print(f"[LLM] Attempt {attempt}/{max_retries}")

            resp = requests.post(url, headers=headers, json=payload, timeout=60)

            if DEBUG:
                print(f"[LLM] Response status: {resp.status_code}")

            # Handle rate limits
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", backoff_base * attempt))
                print(f"[LLM] Rate limit (429). Retry in {retry_after}s...")
                time.sleep(retry_after)
                continue

            # Handle server errors
            if resp.status_code >= 500:
                print(f"[LLM] Server error ({resp.status_code}). Retry in {backoff_base * attempt}s...")
                time.sleep(backoff_base * attempt)
                continue

            # Handle client errors
            if 400 <= resp.status_code < 500:
                print(f"[LLM ERROR] Client error {resp.status_code}")
                print(f"[LLM ERROR] Response: {resp.text[:500]}")
                return None

            resp.raise_for_status()
            data = resp.json()

            if DEBUG:
                print(f"[LLM] Response keys: {list(data.keys())}")

            # Parse response - Multiple formats supported
            response_text = None

            # Format 1: Standard OpenAI/Azure format
            if isinstance(data, dict) and "choices" in data:
                if data["choices"] and len(data["choices"]) > 0:
                    choice = data["choices"][0]
                    if "message" in choice:
                        response_text = choice["message"].get("content")
                    elif "text" in choice:
                        response_text = choice["text"]

            # Format 2: Custom "result" wrapper
            if not response_text and "result" in data:
                result = data["result"]
                if isinstance(result, dict):
                    response_text = result.get("output_text") or result.get("text") or result.get("content")
                elif isinstance(result, str):
                    response_text = result

            # Format 3: Direct text fields
            if not response_text:
                response_text = data.get("text") or data.get("output_text") or data.get("content")

            # Format 4: Nested response
            if not response_text and "response" in data:
                response_text = data["response"]

            if response_text:
                if DEBUG:
                    print(f"[LLM] ✅ Got response: {response_text[:100]}...")
                return response_text.strip()

            # Unexpected format
            print("[LLM ERROR] Could not parse response!")
            print(f"[LLM ERROR] Response structure: {json.dumps(data, indent=2)[:500]}")
            return None

        except requests.exceptions.Timeout:
            print(f"[LLM] Timeout on attempt {attempt}. Retrying...")
            time.sleep(backoff_base * attempt)
            continue

        except requests.exceptions.ConnectionError as e:
            print(f"[LLM] Connection error: {str(e)[:200]}")
            if attempt < max_retries:
                print(f"[LLM] Retrying in {backoff_base * attempt}s...")
                time.sleep(backoff_base * attempt)
                continue
            return None

        except requests.exceptions.HTTPError as e:
            print(f"[LLM] HTTP error {e.response.status_code}")
            print(f"[LLM] Response: {e.response.text[:300]}")
            if e.response.status_code == 429:
                continue  # Already handled above
            return None

        except Exception as e:
            print(f"[LLM ERROR] Unexpected error: {type(e).__name__}")
            print(f"[LLM ERROR] Details: {str(e)[:300]}")
            if attempt == max_retries:
                return None
            time.sleep(backoff_base * attempt)

    print("[LLM] ❌ Failed after all retries")
    return None
