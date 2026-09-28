"""
Confidence Gate: Maps top reranker score to high/medium/low based on threshold configuration.
"""
from typing import Literal, List, Dict, Any
from config import settings


def compute_confidence(
    top_score: float,
    retrieved_chunks: List[Dict[str, Any]] = None
) -> Literal["high", "medium", "low"]:
    """
    Computes confidence level based on reranker top relevance score and chunk availability.
    - 'high': top score >= CONFIDENCE_HIGH_THRESHOLD (0.75) and has relevant chunks
    - 'medium': CONFIDENCE_MEDIUM_THRESHOLD (0.45) <= top score < CONFIDENCE_HIGH_THRESHOLD
    - 'low': top score < CONFIDENCE_MEDIUM_THRESHOLD or empty chunks
    """
    if not retrieved_chunks or top_score < settings.CONFIDENCE_MEDIUM_THRESHOLD:
        return "low"
    elif top_score >= settings.CONFIDENCE_HIGH_THRESHOLD:
        return "high"
    else:
        return "medium"
