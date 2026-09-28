"""
Pydantic models for API request and response validation.
Strictly mirrors plan.md Section 6.
"""
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field


FormulationCategory = Literal[
    "classical",
    "proprietary",
    "new_drug",
    "phytopharmaceutical",
    "ayurveda_aahar",
    "cosmetic"
]


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
    profile_id: Optional[str] = Field(
        default=None,
        description="Optional session Formulation Profile ID to scope answers"
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


class NextQuestion(BaseModel):
    id: str = Field(..., description="Question identifier")
    question: str = Field(..., description="Clarifying question prompt")
    options: List[str] = Field(..., description="List of selectable answer options")
    helper_text: Optional[str] = Field(None, description="Legal context or guidance")


class ClassifyRequest(BaseModel):
    answers: Dict[str, Any] = Field(default_factory=dict, description="Guided question responses")
    profile_id: Optional[str] = Field(None, description="Existing session profile ID or null")


class ClassifyResponse(BaseModel):
    profile_id: str = Field(..., description="Unique profile identifier")
    category: Optional[FormulationCategory] = Field(None, description="Determined formulation category")
    category_name: Optional[str] = Field(None, description="Human-readable category title")
    ip_posture_summary: str = Field(..., description="Detailed IP and ABS regulatory summary with citations")
    citations: List[Citation] = Field(default_factory=list, description="Statutory grounding citations")
    abs_requirement: Optional[str] = Field(None, description="Rule-based ABS compliance posture and form")
    tkdl_prior_art_pointer: Optional[str] = Field(None, description="Curated prior-art / defensive publication pointer")
    next_questions: Optional[List[NextQuestion]] = Field(None, description="Follow-up clarifying questions if needed")


class StreamTokenEvent(BaseModel):
    text: str = Field(..., description="Incremental streamed token")


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
