"""
Confidence Gate: Maps top reranker score to high/medium/low based on threshold configuration.
"""
from typing import Literal
from config import settings


def compute_confidence(top_score: float) -> Literal["high", "medium", "low"]:
    """
    Map top score to confidence badge level based on settings thresholds.
    """
    if top_score >= settings.CONFIDENCE_HIGH_THRESHOLD:
        return "high"
    elif top_score >= settings.CONFIDENCE_MEDIUM_THRESHOLD:
        return "medium"
    return "low"
