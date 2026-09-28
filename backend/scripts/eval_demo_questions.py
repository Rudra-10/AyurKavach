"""
Evaluation runner for plan.md Section 10 demo questions.
Runs hybrid retrieval -> reranking pipeline on all demo questions and verifies that
the expected statutes/sections appear in the top-5 retrieved chunks.
"""
import os
import sys
import asyncio
from typing import List, Dict, Any

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from retrieval.retriever import HybridRetriever
from retrieval.reranker import CrossEncoderReranker

DEMO_EVAL_CASES = [
    {
        "id": 1,
        "question": "Can I patent an Ayurvedic formulation using turmeric?",
        "jurisdiction": "india",
        "lang": "en",
        "expected_statutes": ["Patents Act, 1970", "Case Study: Turmeric"],
        "expected_sections": ["3(p)", "3(d)"],
    },
    {
        "id": 2,
        "question": "What approvals do I need before filing abroad for a formulation using Indian medicinal plants?",
        "jurisdiction": "both",
        "lang": "en",
        "expected_statutes": ["Biological Diversity Act, 2002", "WIPO GRATK Treaty (2024)", "Nagoya Protocol on ABS"],
        "expected_sections": ["6(1)", "6", "3.1"],
    },
    {
        "id": 3,
        "question": "How do India and the EU differ on patentability of traditional herbal medicine?",
        "jurisdiction": "both",
        "lang": "en",
        "expected_statutes": ["Patents Act, 1970", "TRIPS Agreement (WTO)", "Case Study: Neem"],
        "expected_sections": ["3(p)", "27.1", "27.2", "27.3(b)"],
    },
    {
        "id": 4,
        "question": "Do I need ABS approval to export a herbal product?",
        "jurisdiction": "india",
        "lang": "en",
        "expected_statutes": ["Biological Diversity Act, 2002"],
        "expected_sections": ["40", "24(1)", "2(c)"],
    },
    {
        "id": 5,
        "question": "How is my Ayurvedic formulation classified under the Drugs & Cosmetics Act?",
        "jurisdiction": "india",
        "lang": "en",
        "expected_statutes": ["Drugs and Cosmetics Act, 1940"],
        "expected_sections": ["3(a)", "3(h)", "Schedule T"],
    },
    {
        "id": 6,
        "question": "क्या मैं हल्दी का उपयोग करके आयुर्वेदिक फॉर्मूलेशन का पेटेंट करा सकता हूँ?",
        "jurisdiction": "india",
        "lang": "hi",
        "expected_statutes": ["Patents Act, 1970"],
        "expected_sections": ["3(p)", "3(d)"],
    }
]


async def run_retrieval_evaluation():
    retriever = HybridRetriever()
    reranker = CrossEncoderReranker()

    print("=" * 80)
    print("        IP-SAKTI SAHAYAK — PHASE 2 RETRIEVAL EVALUATION")
    print("=" * 80)

    results_summary = []

    for item in DEMO_EVAL_CASES:
        q_id = item["id"]
        question = item["question"]
        jurisdiction = item["jurisdiction"]
        lang = item["lang"]

        print(f"\n[DEMO QUESTION #{q_id}]")
        print(f"Query:        \"{question}\"")
        print(f"Jurisdiction: {jurisdiction.upper()} | Language: {lang.upper()}")
        print("-" * 80)

        # 1. Retrieve top-15
        candidates = await retriever.retrieve(question, jurisdiction=jurisdiction, top_k=15)
        # 2. Rerank top-5
        top_chunks = await reranker.rerank(question, candidates, top_n=5)

        retrieved_sections = []
        retrieved_sources = []

        print(f"{'Rank':<5} | {'Score':<6} | {'Jurisdiction':<13} | {'Source Statute':<32} | {'Section'}")
        print("-" * 80)
        for rank, c in enumerate(top_chunks, start=1):
            score = c.get("rerank_score", 0.0)
            src = c.get("source", "")
            sec = c.get("section", "")
            jur = c.get("jurisdiction", "")
            retrieved_sources.append(src)
            retrieved_sections.append(sec)
            print(f"#{rank:<4} | {score:<6.3f} | {jur:<13} | {src:<32} | Sec. {sec}")

        # Verification check
        statute_match = any(
            any(exp.lower() in s.lower() for s in retrieved_sources)
            for exp in item["expected_statutes"]
        )
        section_match = any(
            any(exp.lower() in s.lower() for s in retrieved_sections)
            for exp in item["expected_sections"]
        )
        is_pass = statute_match and section_match

        results_summary.append({
            "id": q_id,
            "question": question[:45] + "...",
            "pass": is_pass,
            "top_source": retrieved_sources[0] if retrieved_sources else "None",
            "top_section": retrieved_sections[0] if retrieved_sections else "None",
            "top_score": top_chunks[0].get("rerank_score", 0.0) if top_chunks else 0.0,
        })

    print("\n" + "=" * 80)
    print("                    RETRIEVAL EVALUATION SUMMARY")
    print("=" * 80)
    print(f"{'Q#':<4} | {'Status':<6} | {'Top Score':<10} | {'Top Retrieved Source':<32} | {'Top Section'}")
    print("-" * 80)
    all_passed = True
    for res in results_summary:
        status = "PASS" if res["pass"] else "FAIL"
        if not res["pass"]:
            all_passed = False
        print(f"#{res['id']:<3} | {status:<6} | {res['top_score']:<10.3f} | {res['top_source']:<32} | Sec. {res['top_section']}")
    print("-" * 80)
    print(f"Overall Retrieval Status: {'ALL PASS (6/6)' if all_passed else 'SOME FAILED'}\n")

    return results_summary


def main():
    asyncio.run(run_retrieval_evaluation())


if __name__ == "__main__":
    main()
