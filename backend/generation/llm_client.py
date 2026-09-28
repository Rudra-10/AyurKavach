"""
LLM Client: Structured JSON generation for citation-grounded responses.
"""
from typing import Dict, Any, List
from models.schemas import QueryResponse


class LLMClient:
    """Placeholder for LLMClient (Phase 3)."""
    async def generate_response(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        jurisdiction: str,
        lang: str
    ) -> QueryResponse:
        pass
