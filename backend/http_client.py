"""
Shared async HTTP client with retry logic, timeouts, and friendly error messages.
Used by LLM client, embeddings API, and reranker API.
"""
import asyncio
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEFAULT_TIMEOUT_SECONDS = 45.0      # generous for LLM APIs
CONNECT_TIMEOUT_SECONDS = 10.0
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 1.5            # exponential: 1.5, 2.25, 3.375 s

# HTTP status codes that are worth retrying
_RETRYABLE_STATUS = {429, 500, 502, 503, 504}

# ---------------------------------------------------------------------------
# Friendly error message map
# ---------------------------------------------------------------------------
_FRIENDLY_ERRORS: Dict[int, str] = {
    400: "The request was malformed. Check your query or API payload.",
    401: "Authentication failed — verify your API key in .env.",
    403: "Access denied — your API key may lack permissions for this resource.",
    429: "Rate limit reached. The request will be retried automatically.",
    500: "The upstream API returned an internal error. Retrying…",
    502: "Bad gateway from the upstream API. Retrying…",
    503: "The upstream API is temporarily unavailable. Retrying…",
    504: "The upstream API timed out. Retrying…",
}


def _friendly_message(status_code: Optional[int], exc: Optional[Exception] = None) -> str:
    if status_code and status_code in _FRIENDLY_ERRORS:
        return _FRIENDLY_ERRORS[status_code]
    if isinstance(exc, httpx.ConnectTimeout):
        return "Connection to the API timed out. Check network or increase CONNECT_TIMEOUT."
    if isinstance(exc, httpx.ReadTimeout):
        return "The API took too long to respond. The model may be under heavy load — try again shortly."
    if isinstance(exc, httpx.ConnectError):
        return "Could not reach the API. Check your internet connection and API URL in .env."
    return f"Unexpected error communicating with the API: {exc}"


# ---------------------------------------------------------------------------
# Core helper
# ---------------------------------------------------------------------------

async def post_with_retry(
    url: str,
    payload: Dict[str, Any],
    headers: Optional[Dict[str, str]] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    max_retries: int = MAX_RETRIES,
) -> Optional[Dict[str, Any]]:
    """
    POST *payload* to *url* with exponential-backoff retries on transient failures.

    Returns the parsed JSON dict on success, or None if all attempts fail.
    Logs a friendly error message on each failure.
    """
    timeout_config = httpx.Timeout(timeout, connect=CONNECT_TIMEOUT_SECONDS)
    last_error: Optional[str] = None

    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout_config) as client:
                response = await client.post(url, json=payload, headers=headers or {})

            if response.status_code == 200:
                return response.json()

            # Retryable status codes get another attempt
            msg = _friendly_message(response.status_code)
            last_error = f"HTTP {response.status_code}: {msg}"
            logger.warning("[Attempt %d/%d] %s — %s", attempt, max_retries, url, last_error)

            if response.status_code not in _RETRYABLE_STATUS or attempt == max_retries:
                logger.error("[API Error] %s after %d attempt(s): %s", url, attempt, last_error)
                return None

        except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as exc:
            msg = _friendly_message(None, exc)
            last_error = msg
            logger.warning("[Attempt %d/%d] %s — %s", attempt, max_retries, url, msg)
            if attempt == max_retries:
                logger.error("[API Error] %s: %s", url, msg)
                return None

        except Exception as exc:
            msg = _friendly_message(None, exc)
            last_error = msg
            logger.error("[API Error] %s — Unhandled: %s", url, msg)
            return None

        # Exponential backoff before next retry
        wait = RETRY_BACKOFF_BASE ** attempt
        logger.info("[Retry] Waiting %.1fs before attempt %d…", wait, attempt + 1)
        await asyncio.sleep(wait)

    logger.error("[API Error] All %d attempts failed for %s. Last error: %s", max_retries, url, last_error)
    return None
