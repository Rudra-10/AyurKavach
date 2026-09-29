"""
In-memory cache for demo queries and recurring RAG responses.
Supports TTL expiry, cache stats, and key normalization.
Redis can be dropped in by switching the backend (plan.md Section 2).
"""
import time
import hashlib
import unicodedata
import re
from typing import Optional, Dict, Any, Tuple

# ---------------------------------------------------------------------------
# Internal store: { normalized_key: (payload, expires_at_unix) }
# ---------------------------------------------------------------------------
_store: Dict[str, Tuple[Dict[str, Any], float]] = {}

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_TTL_SECONDS: int = 3600          # 1 h — long-lived for demo queries
DEMO_TTL_SECONDS: int = 86400           # 24 h — pre-baked demo answers survive restarts

_DEMO_QUESTIONS = [
    "can i patent an ayurvedic formulation using turmeric",
    "what approvals do i need before filing abroad for a formulation using indian medicinal plants",
    "how do india and the eu differ on patentability of traditional herbal medicine",
    "do i need abs approval to export a herbal product",
    "how is my ayurvedic formulation classified under the drugs cosmetics act",
    # Hindi variant (normalised below)
    "haldi ka patent",
]

# Cache hit / miss counters for demo diagnostics
_stats: Dict[str, int] = {"hits": 0, "misses": 0, "sets": 0, "evictions": 0}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _normalize_text(text: str) -> str:
    """Lower-case, unicode-normalise, strip punctuation, collapse whitespace."""
    text = unicodedata.normalize("NFKC", text.lower())
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _is_demo_query(question: str) -> bool:
    """Returns True when the question closely matches a known demo question."""
    q_norm = _normalize_text(question)
    for demo in _DEMO_QUESTIONS:
        demo_norm = _normalize_text(demo)
        # Substring match covers both English and abbreviated Hindi variants
        if demo_norm in q_norm or q_norm in demo_norm:
            return True
        # Word-overlap heuristic (≥60 % shared content words)
        q_words = set(q_norm.split())
        d_words = set(demo_norm.split())
        if q_words and d_words:
            overlap = len(q_words & d_words) / min(len(q_words), len(d_words))
            if overlap >= 0.6:
                return True
    return False


def _build_key(question: str, jurisdiction: str, lang: str, profile_id: Optional[str]) -> str:
    """Deterministic cache key from the request dimensions."""
    q_norm = _normalize_text(question)
    raw = f"q={q_norm}|jur={jurisdiction}|lang={lang}|prof={profile_id or 'none'}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _evict_expired() -> None:
    """Remove all entries whose TTL has elapsed."""
    now = time.time()
    expired = [k for k, (_, exp) in _store.items() if exp < now]
    for k in expired:
        del _store[k]
        _stats["evictions"] += 1


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def make_cache_key(question: str, jurisdiction: str, lang: str, profile_id: Optional[str] = None) -> str:
    """Expose the key builder so callers don't reproduce the logic."""
    return _build_key(question, jurisdiction, lang, profile_id)


def get_cached_response(key: str) -> Optional[Dict[str, Any]]:
    """
    Return the cached payload for *key*, or None if absent / expired.
    Lazy-evicts expired entries on every read.
    """
    _evict_expired()
    entry = _store.get(key)
    if entry is None:
        _stats["misses"] += 1
        return None
    payload, expires_at = entry
    if time.time() > expires_at:
        del _store[key]
        _stats["misses"] += 1
        return None
    _stats["hits"] += 1
    return payload


def set_cached_response(
    key: str,
    value: Dict[str, Any],
    question: str = "",
    ttl: Optional[int] = None,
) -> None:
    """
    Store *value* under *key*.
    Demo queries automatically receive a longer TTL (24 h).
    Explicit *ttl* overrides both defaults.
    """
    if ttl is None:
        ttl = DEMO_TTL_SECONDS if _is_demo_query(question) else DEFAULT_TTL_SECONDS
    _store[key] = (value, time.time() + ttl)
    _stats["sets"] += 1


def invalidate(key: str) -> bool:
    """Explicitly remove an entry. Returns True if the key existed."""
    if key in _store:
        del _store[key]
        return True
    return False


def clear_all() -> int:
    """Wipe the entire cache. Returns number of entries removed."""
    count = len(_store)
    _store.clear()
    return count


def get_stats() -> Dict[str, Any]:
    """Return current hit/miss/set/eviction counters and live entry count."""
    _evict_expired()
    return {
        **_stats,
        "live_entries": len(_store),
    }
