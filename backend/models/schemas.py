"""
Pydantic models for API request and response validation.
Strictly mirrors plan.md Section 6.
"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Natural-language query")
    jurisdiction: Literal["india", "international", "both"] = Field(
        default="both",
        description="Target legal jurisdiction"
    )
    lang: Literal["en", "hi"] = Field(
        default="en",
        description="Response language (en: English, hi: Hindi)"
    )


class Citation(BaseModel):
    id: int = Field(..., description="1-indexed stable footnote ID")
    source: str = Field(..., description="Document or statute name, e.g. 'Patents Act, 1970'")
    section: str = Field(..., description="Section or article, e.g. '3(d)' or 'Art. 27'")
    jurisdiction: Literal["india", "international"] = Field(
        ...,
        description="Jurisdiction of the cited source"
    )
    text_snippet: str = Field(..., description="Exact quoted excerpt supporting the claim")
    chunk_id: str = Field(..., description="Unique chunk identifier for deduplication")


class QueryResponse(BaseModel):
    answer: str = Field(..., description="Generated answer with [1], [2] footnote markers")
    citations: List[Citation] = Field(default_factory=list, description="List of deduplicated citations")
    confidence: Literal["high", "medium", "low"] = Field(..., description="Confidence rating")
    conflict_flag: bool = Field(..., description="True if cross-regime conflict/gap is detected")
    conflict_note: Optional[str] = Field(None, description="Detailed cross-regime synthesis or null")


class StreamTokenEvent(BaseModel):
    text: str = Field(..., description="Incremental streamed token")


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
