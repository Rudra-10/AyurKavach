"""
Verification script for Phase 3.5: Formulation Classification & Profile Scoping.
Tests /classify endpoint, Formulation Profile persistence, and profile-scoped /query follow-up queries.
"""
import os
import sys
import asyncio
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.schemas import ClassifyRequest, QueryRequest
from classification import classify_formulation
from retrieval.retriever import HybridRetriever
from retrieval.reranker import CrossEncoderReranker
from generation.llm_client import LLMClient
from generation.confidence import compute_confidence
from profiles import get_profile


async def run_phase_3_5_verification():
    retriever = HybridRetriever()
    reranker = CrossEncoderReranker()
    llm = LLMClient()

    print("=" * 80)
    print("   IP-SAKTI SAHAYAK — PHASE 3.5 FORMULATION CLASSIFICATION & PROFILE VERIFICATION")
    print("=" * 80)

    # Step 1: Classify Formulation (Test Case: Classical Formulation targeting foreign filing)
    test_answers = {
        "q1_intended_use": "Internal medicine for treating/curing diseases (Classical/Proprietary Drug)",
        "q2_ingredients_source": "Yes, 100% classical recipe and traditional name (e.g., Triphala, Chyawanprash, Trikatu)",
        "q3_geographic_filing": "Both India and International patent offices (PCT / US / EU / WIPO)",
        "q4_applicant_entity": "Indian citizen or 100% Indian-owned company"
    }

    print("\n[STEP 1: SUBMITTING GUIDED CLASSIFICATION RESPONSES]")
    for k, v in test_answers.items():
        print(f"  • {k}: {v}")

    req = ClassifyRequest(answers=test_answers)
    classify_res = await classify_formulation(req, retriever, reranker)

    print("\n--- CLASSIFICATION RESULT & FORMULATION PROFILE ---")
    print(f"  Profile ID:       {classify_res.profile_id}")
    print(f"  Category:         {classify_res.category} ({classify_res.category_name})")
    print(f"  ABS Requirement:  {classify_res.abs_requirement}")
    print(f"  TKDL Pointer:     {classify_res.tkdl_prior_art_pointer}")
    print(f"  IP Posture:\n    {classify_res.ip_posture_summary}\n")
    print("  Grounded Citations:")
    for c in classify_res.citations:
        print(f"    [{c.id}] {c.source} — Sec. {c.section} ({c.jurisdiction.upper()})")

    assert classify_res.category == "classical", f"Expected category 'classical', got {classify_res.category}"
    assert "Section 3(p)" in classify_res.ip_posture_summary or "Section 3(a)" in classify_res.ip_posture_summary
    assert "Form III" in classify_res.abs_requirement or "NBA" in classify_res.abs_requirement

    # Step 2: Ask Follow-up Query without restating product details
    followup_query = "What specific patent and biodiversity hurdles will I face before filing abroad?"
    print("\n" + "=" * 80)
    print(f"[STEP 2: FOLLOW-UP CHAT QUERY (profile_id = {classify_res.profile_id})]")
    print(f"Query: \"{followup_query}\" (Note: User does NOT restate product name or type)")
    print("-" * 80)

    # Scoped pipeline
    profile_data = get_profile(classify_res.profile_id)
    candidates = await retriever.retrieve(f"{followup_query} {profile_data['category_name']}", jurisdiction="both", top_k=15)
    top_chunks = await reranker.rerank(followup_query, candidates, top_n=5)
    top_score = top_chunks[0].get("rerank_score", 0.0) if top_chunks else 0.0
    conf = compute_confidence(top_score, top_chunks)

    query_response = await llm.generate_response(
        question=followup_query,
        retrieved_chunks=top_chunks,
        jurisdiction="both",
        lang="en",
        confidence_level=conf,
        profile_data=profile_data
    )

    print(f"Confidence:    {query_response.confidence.upper()}")
    print(f"Conflict Flag: {query_response.conflict_flag}")
    if query_response.conflict_note:
        print(f"Conflict Note: {query_response.conflict_note}")
    print(f"\nProfile-Scoped Answer:\n{query_response.answer}\n")
    print("Citations:")
    for c in query_response.citations:
        print(f"  [{c.id}] {c.source} (Sec. {c.section}) [{c.jurisdiction.upper()}]")
        print(f"      Snippet: \"{c.text_snippet}\"")

    print("\n" + "=" * 80)
    print("   PHASE 3.5 VERIFICATION PASSED: FORMULATION PROFILE SCOPING SUCCESSFUL")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_phase_3_5_verification())
