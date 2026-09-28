"""
Reranker: Cross-encoder reranking (BGE-reranker-v2-m3) returning top-5 scored chunks.
"""
from typing import List, Dict, Any


class CrossEncoderReranker:
    """Placeholder for CrossEncoderReranker (Phase 2)."""
    async def rerank(self, query: str, chunks: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
        return chunks[:top_n]
