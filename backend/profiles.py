"""
Formulation Profile Management: Stores and retrieves session profiles to scope downstream chat queries.
"""
from typing import Dict, Any, Optional
import uuid
import time
from models.schemas import FormulationCategory, Citation


# In-memory session store (resilient for demo & deployment sessions)
_PROFILES_STORE: Dict[str, Dict[str, Any]] = {}


def create_or_update_profile(
    category: FormulationCategory,
    category_name: str,
    answers: Dict[str, Any],
    ip_posture_summary: str,
    citations: list,
    abs_requirement: Optional[str] = None,
    tkdl_prior_art_pointer: Optional[str] = None,
    profile_id: Optional[str] = None
) -> Dict[str, Any]:
    """Saves or updates a Formulation Profile."""
    pid = profile_id if profile_id and profile_id in _PROFILES_STORE else f"prof_{uuid.uuid4().hex[:8]}"
    
    profile_record = {
        "profile_id": pid,
        "category": category,
        "category_name": category_name,
        "answers": answers,
        "ip_posture_summary": ip_posture_summary,
        "citations": [c.model_dump() if hasattr(c, "model_dump") else c for c in citations],
        "abs_requirement": abs_requirement,
        "tkdl_prior_art_pointer": tkdl_prior_art_pointer,
        "updated_at": time.time()
    }
    
    _PROFILES_STORE[pid] = profile_record
    return profile_record


def get_profile(profile_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a Formulation Profile by ID."""
    if not profile_id:
        return None
    return _PROFILES_STORE.get(profile_id)


def list_all_profiles() -> Dict[str, Dict[str, Any]]:
    """Returns all session profiles."""
    return _PROFILES_STORE
