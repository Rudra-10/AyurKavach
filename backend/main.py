"""
FastAPI application entry point.
Exposes /health and SSE /query endpoints.
"""
import json
import asyncio
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from config import settings
from models.schemas import (
    QueryRequest,
    QueryResponse,
    Citation,
    HealthResponse,
    StreamTokenEvent
)

app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual, source-cited RAG assistant for Ayurveda IP & regulatory guidance."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


async def stub_sse_generator(request: QueryRequest) -> AsyncGenerator[str, None]:
    """
    Phase 0 stub SSE stream generator returning hardcoded data matching the contract.
    Will be replaced in Phase 3 with the full RAG generation pipeline.
    """
    stub_tokens = [
        "Under ", "the ", "Indian ", "Patents ", "Act, ", "1970, ",
        "a ", "mere ", "combination ", "or ", "known ", "traditional ", "knowledge ",
        "involving ", "Ayurvedic ", "formulations ", "(such ", "as ", "turmeric) ",
        "is ", "not ", "patentable ", "under ", "Section ", "3(p) ", "[1]",
        " and ", "Section ", "3(d) ", "[2]. ",
        "Additionally, ", "under ", "Section ", "6 ", "of ", "the ",
        "Biological ", "Diversity ", "Act, ", "2002, ", "prior ", "approval ", "from ",
        "the ", "National ", "Biodiversity ", "Authority ", "(NBA) ", "is ", "mandatory ",
        "before ", "applying ", "for ", "any ", "intellectual ", "property ", "rights ",
        "outside ", "India ", "[3]."
    ]

    # Stream token events
    for token in stub_tokens:
        token_payload = json.dumps({"text": token})
        yield f"event: token\ndata: {token_payload}\n\n"
        await asyncio.sleep(0.02)  # Simulate streaming delay

    # Construct final payload adhering strictly to Section 6 schema
    final_response = QueryResponse(
        answer=(
            "Under the Indian Patents Act, 1970, a mere combination or known traditional knowledge "
            "involving Ayurvedic formulations (such as turmeric) is not patentable under Section 3(p) [1] "
            "and Section 3(d) [2]. Additionally, under Section 6 of the Biological Diversity Act, 2002, "
            "prior approval from the National Biodiversity Authority (NBA) is mandatory before applying "
            "for any intellectual property rights outside India [3]."
        ),
        citations=[
            Citation(
                id=1,
                source="Patents Act, 1970",
                section="3(p)",
                jurisdiction="india",
                text_snippet="An invention which in effect is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components.",
                chunk_id="ind_patents_1970_sec_3p"
            ),
            Citation(
                id=2,
                source="Patents Act, 1970",
                section="3(d)",
                jurisdiction="india",
                text_snippet="The mere discovery of a new form of a known substance which does not result in the enhancement of the known efficacy of that substance.",
                chunk_id="ind_patents_1970_sec_3d"
            ),
            Citation(
                id=3,
                source="Biological Diversity Act, 2002",
                section="6",
                jurisdiction="india",
                text_snippet="No person shall apply for any intellectual property right, by whatever name called, in or outside India for any invention based on any research or information on a biological resource obtained from India without obtaining the previous approval of the National Biodiversity Authority.",
                chunk_id="ind_bda_2002_sec_6"
            ),
        ],
        confidence="high",
        conflict_flag=True if request.jurisdiction == "both" else False,
        conflict_note=(
            "Compliance Gap / Conflict: Filing for IP abroad using Indian biological resources without prior "
            "approval from the National Biodiversity Authority (NBA) violates Section 6 of the Biological "
            "Diversity Act, 2002, even if disclosure requirements under international regimes (e.g., WIPO "
            "GRATK Treaty 2024 / Nagoya Protocol) are fulfilled."
        ) if request.jurisdiction == "both" else None
    )

    final_payload = json.dumps(final_response.model_dump())
    yield f"event: final\ndata: {final_payload}\n\n"


@app.post("/query")
async def query_endpoint(request: QueryRequest):
    """
    Query endpoint streaming Server-Sent Events (SSE).
    """
    return StreamingResponse(
        stub_sse_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
