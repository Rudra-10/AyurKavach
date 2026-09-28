"""
In-memory / Redis cache for demo queries and recurring queries.
"""
from typing import Optional, Dict, Any

_in_memory_cache: Dict[str, Any] = {}


def get_cached_response(key: str) -> Optional[Dict[str, Any]]:
    return _in_memory_cache.get(key)


def set_cached_response(key: str, value: Dict[str, Any]) -> None:
    _in_memory_cache[key] = value
