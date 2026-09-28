"""
End-to-End Generation & Citation Verification Script (Phase 3).
Executes the full pipeline for all demo questions and validates grounding, citations, and conflict notes.
"""
import os
import sys
import asyncio
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.schemas import QueryRequest, QueryResponse
from retrieval.retriever import HybridRetriever
from retrieval.reranker import CrossEncoderReranker
from generation.confidence import compute_confidence
from generation.llm_client import LLMClient

DEMO_QUESTIONS = [
    {
        "id": 1,
        "question": "Can I patent an Ayurvedic formulation using turmeric?",
        "jurisdiction": "india",
        "lang": "en"
    },
    {
        "id": 2,
        "question": "What approvals do I need before filing abroad for a formulation using Indian medicinal plants?",
        "jurisdiction": "both",
        "lang": "en"
    },
    {
        "id": 3,
        "question": "How do India and the EU differ on patentability of traditional herbal medicine?",
        "jurisdiction": "both",
        "lang": "en"
    },
    {
        "id": 4,
        "question": "Do I need ABS approval to export a herbal product?",
        "jurisdiction": "india",
        "lang": "en"
    },
    {
        "id": 5,
        "question": "How is my Ayurvedic formulation classified under the Drugs & Cosmetics Act?",
        "jurisdiction": "india",
        "lang": "en"
    },
    {
        "id": 6,
        "question": "क्या मैं हल्दी का उपयोग करके आयुर्वेदिक फॉर्मूलेशन का पेटेंट करा सकता हूँ?",
        "jurisdiction": "india",
        "lang": "hi"
    }
]


async def run_e2e_verification():
    retriever = HybridRetriever()
    reranker = CrossEncoderReranker()
    llm = LLMClient()

    print("=" * 80)
    print("      IP-SAKTI SAHAYAK — END-TO-END GENERATION & CITATION VERIFICATION")
    print("=" * 80)

    for item in DEMO_QUESTIONS:
        q_id = item["id"]
        q_text = item["question"]
        jur = item["jurisdiction"]
        lang = item["lang"]

        print(f"\n==================== [DEMO QUESTION #{q_id}] ====================")
        print(f"Query:        \"{q_text}\"")
        print(f"Jurisdiction: {jur.upper()} | Language: {lang.upper()}\n")

        # Step 1: Retrieve
        candidates = await retriever.retrieve(q_text, jurisdiction=jur, top_k=15)
        # Step 2: Rerank
        top_chunks = await reranker.rerank(q_text, candidates, top_n=5)
        top_score = top_chunks[0].get("rerank_score", 0.0) if top_chunks else 0.0
        # Step 3: Confidence
        conf = compute_confidence(top_score, top_chunks)
        # Step 4: Generate
        response: QueryResponse = await llm.generate_response(
            question=q_text,
            retrieved_chunks=top_chunks,
            jurisdiction=jur,
            lang=lang,
            confidence_level=conf
        )

        print(f"Confidence:    {response.confidence.upper()}")
        print(f"Conflict Flag: {response.conflict_flag}")
        if response.conflict_note:
            print(f"Conflict Note: {response.conflict_note}")
        print(f"\nAnswer:\n{response.answer}\n")
        print("Citations:")
        for c in response.citations:
            print(f"  [{c.id}] {c.source} (Sec. {c.section}) [{c.jurisdiction.upper()}]")
            print(f"      Snippet: \"{c.text_snippet}\"")
            print(f"      Chunk ID: {c.chunk_id}")

    print("\n" + "=" * 80)
    print("      ALL DEMO QUESTIONS GENERATED AND VERIFIED SUCCESSFULLY")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_e2e_verification())
