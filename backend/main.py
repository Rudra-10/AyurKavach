"""
FastAPI application entry point.
Implements the linear RAG pipeline: retrieve -> rerank -> generate -> SSE streaming.
Strictly adheres to plan.md Section 6 API contract.
"""
import json
import asyncio
import re
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
from retrieval.retriever import HybridRetriever
from retrieval.reranker import CrossEncoderReranker
from generation.confidence import compute_confidence
from generation.llm_client import LLMClient
from cache import get_cached_response, set_cached_response

app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual, source-cited RAG assistant for Ayurveda IP & regulatory guidance."
)

# Global pipeline singletons
retriever = HybridRetriever()
reranker = CrossEncoderReranker()
llm_client = LLMClient()

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


async def sse_pipeline_generator(request: QueryRequest) -> AsyncGenerator[str, None]:
    """
    Linear RAG pipeline execution:
    1. Retrieve candidates (top-15) via dense + sparse search + RRF + jurisdiction filter
    2. Rerank to top-5 using CrossEncoder
    3. Compute confidence score
    4. Generate grounded structured response via LLMClient
    5. Stream tokens via SSE then yield final payload
    """
    cache_key = f"{request.question.strip().lower()}__jur_{request.jurisdiction}__lang_{request.lang}"
    cached_data = get_cached_response(cache_key)

    if cached_data:
        final_response = QueryResponse(**cached_data)
    else:
        # Step 1: Retrieval (Top-15)
        candidates = await retriever.retrieve(
            query=request.question,
            jurisdiction=request.jurisdiction,
            top_k=15
        )

        # Step 2: Rerank (Top-5)
        top_chunks = await reranker.rerank(
            query=request.question,
            chunks=candidates,
            top_n=5
        )

        top_score = top_chunks[0].get("rerank_score", 0.0) if top_chunks else 0.0

        # Step 3: Confidence computation
        confidence_level = compute_confidence(top_score, top_chunks)

        # Step 4: LLM Generation
        final_response = await llm_client.generate_response(
            question=request.question,
            retrieved_chunks=top_chunks,
            jurisdiction=request.jurisdiction,
            lang=request.lang,
            confidence_level=confidence_level
        )

        # Cache response
        set_cached_response(cache_key, final_response.model_dump())

    # Step 5: SSE Streaming
    # Stream prose answer tokens
    words = re.findall(r"\S+|\s+", final_response.answer)
    for word in words:
        token_payload = json.dumps({"text": word})
        yield f"event: token\ndata: {token_payload}\n\n"
        await asyncio.sleep(0.015)  # Natural token cadence

    # Stream final structured payload
    final_payload = json.dumps(final_response.model_dump())
    yield f"event: final\ndata: {final_payload}\n\n"


@app.post("/query")
async def query_endpoint(request: QueryRequest):
    """
    Query endpoint streaming Server-Sent Events (SSE).
    """
    return StreamingResponse(
        sse_pipeline_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
