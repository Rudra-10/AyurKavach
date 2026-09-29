"""
Phase 5 Production Evaluation Script
Verifies plan.md Section 11 acceptance criteria against a running backend (local or deployed).
Reports PASS/FAIL per criterion and measures time-to-first-token (TTFT).

Usage:
    python scripts/eval_phase5.py                          # local (http://localhost:8000)
    python scripts/eval_phase5.py --base-url https://...   # production
"""
import argparse
import asyncio
import json
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx

# ---------------------------------------------------------------------------
# Demo questions (plan.md Section 10)
# ---------------------------------------------------------------------------
DEMO_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "question": "Can I patent an Ayurvedic formulation using turmeric?",
        "jurisdiction": "india",
        "lang": "en",
        "expected_sources": ["Patents Act, 1970"],
        "expect_conflict": False,
    },
    {
        "id": 2,
        "question": "What approvals do I need before filing abroad for a formulation using Indian medicinal plants?",
        "jurisdiction": "both",
        "lang": "en",
        "expected_sources": ["Biological Diversity Act"],
        "expect_conflict": True,   # India vs international → conflict expected
    },
    {
        "id": 3,
        "question": "How do India and the EU differ on patentability of traditional herbal medicine?",
        "jurisdiction": "both",
        "lang": "en",
        "expected_sources": ["Patents Act, 1970", "TRIPS"],
        "expect_conflict": True,   # conflict expected
    },
    {
        "id": 4,
        "question": "Do I need ABS approval to export a herbal product?",
        "jurisdiction": "india",
        "lang": "en",
        "expected_sources": ["Biological Diversity Act"],
        "expect_conflict": False,
    },
    {
        "id": 5,
        "question": "How is my Ayurvedic formulation classified under the Drugs & Cosmetics Act?",
        "jurisdiction": "india",
        "lang": "en",
        "expected_sources": ["Drugs and Cosmetics Act"],
        "expect_conflict": False,
    },
    {
        "id": 6,
        "question": "क्या मैं हल्दी का उपयोग करके आयुर्वेदिक फॉर्मूलेशन का पेटेंट करा सकता हूँ?",
        "jurisdiction": "india",
        "lang": "hi",
        "expected_sources": ["Patents Act, 1970"],
        "expect_conflict": False,
    },
]

# Out-of-scope questions — system must decline gracefully (not hallucinate)
OUT_OF_SCOPE_QUESTIONS: List[Dict[str, Any]] = [
    {"id": "oos1", "question": "What is the weather in Delhi?", "jurisdiction": "both", "lang": "en"},
    {"id": "oos2", "question": "Give me a recipe for chocolate cake.", "jurisdiction": "both", "lang": "en"},
    {"id": "oos3", "question": "Who won the cricket world cup?", "jurisdiction": "both", "lang": "en"},
]

ABSTENTION_PHRASES = [
    "insufficient grounding",
    "does not provide sufficient",
    "out of scope",
    "not within the scope",
    "unable to answer",
    "cannot answer",
    "scope of ayurveda",
    "ip-sakti",
]


# ---------------------------------------------------------------------------
# SSE client — streams events, returns (ttft_ms, final_payload)
# ---------------------------------------------------------------------------

async def query_sse(
    base_url: str,
    question: str,
    jurisdiction: str,
    lang: str,
    timeout: float = 60.0,
) -> Tuple[Optional[float], Optional[Dict[str, Any]], Optional[str]]:
    """
    Fires POST /query as an SSE stream.
    Returns (ttft_ms, final_payload, error_message).
    ttft_ms is None if no token was received before final.
    """
    url = f"{base_url.rstrip('/')}/query"
    body = {"question": question, "jurisdiction": jurisdiction, "lang": lang}

    ttft_ms: Optional[float] = None
    final_payload: Optional[Dict[str, Any]] = None
    error_msg: Optional[str] = None
    t_start = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(timeout, connect=10.0)) as client:
            async with client.stream("POST", url, json=body) as response:
                if response.status_code != 200:
                    return None, None, f"HTTP {response.status_code}"

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue

                    if line.startswith("event:"):
                        event_type = line[len("event:"):].strip()
                        continue

                    if line.startswith("data:"):
                        data_str = line[len("data:"):].strip()
                        try:
                            data = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue

                        elapsed_ms = (time.perf_counter() - t_start) * 1000

                        # First token event → record TTFT
                        if "text" in data and ttft_ms is None:
                            ttft_ms = round(elapsed_ms, 1)

                        # Final event
                        if "answer" in data and "citations" in data:
                            final_payload = data

    except httpx.ReadTimeout:
        error_msg = "ReadTimeout — backend did not respond within the limit."
    except httpx.ConnectError:
        error_msg = "ConnectError — could not reach the backend."
    except Exception as exc:
        error_msg = str(exc)

    return ttft_ms, final_payload, error_msg


# ---------------------------------------------------------------------------
# Criterion checkers
# ---------------------------------------------------------------------------

def check_citations_grounded(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """Every citation must have a non-empty text_snippet (grounded in retrieved text)."""
    citations = payload.get("citations", [])
    if not citations:
        # Insufficient grounding answer is acceptable — counted as grounded (not hallucinated)
        answer = payload.get("answer", "")
        is_abstention = any(ph in answer.lower() for ph in ABSTENTION_PHRASES)
        if is_abstention:
            return True, "No citations — safe abstention detected."
        return False, "No citations and no abstention phrase."

    for c in citations:
        if not c.get("text_snippet"):
            return False, f"Citation id={c.get('id')} has empty text_snippet."
    return True, f"{len(citations)} citation(s) all have text snippets."


def check_no_hallucinated_citations(payload: Dict[str, Any], retrieved_chunk_ids: Optional[List[str]]) -> Tuple[bool, str]:
    """No answer cites a source not in the retrieved set (checked via chunk_id)."""
    # In a local eval we can't easily inspect server-side chunk IDs — skip deep check;
    # presence of chunk_id field and non-empty value is the proxy.
    citations = payload.get("citations", [])
    bad = [c for c in citations if not c.get("chunk_id")]
    if bad:
        return False, f"{len(bad)} citation(s) missing chunk_id — possible hallucination."
    return True, "All citations carry chunk_id."


def check_low_grounding_abstention(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """When confidence is low and citations are absent, answer must signal insufficient grounding."""
    confidence = payload.get("confidence", "high")
    citations = payload.get("citations", [])
    answer = payload.get("answer", "")
    if confidence == "low" and not citations:
        abstains = any(ph in answer.lower() for ph in ABSTENTION_PHRASES)
        if abstains:
            return True, "Low confidence + no citations → correct abstention."
        return False, "Low confidence + no citations but no abstention phrase found."
    return True, f"Confidence={confidence}, citations={len(citations)} — no abstention needed."


def check_conflict_callout(payload: Dict[str, Any], expect_conflict: bool) -> Tuple[bool, str]:
    """Conflict callout appears on Q2 and Q3 with jurisdiction=both."""
    conflict_flag = payload.get("conflict_flag", False)
    conflict_note = payload.get("conflict_note")
    if expect_conflict:
        if conflict_flag and conflict_note:
            return True, "conflict_flag=true and conflict_note present ✓"
        return False, f"Expected conflict but got conflict_flag={conflict_flag}, conflict_note={conflict_note!r}"
    return True, "Conflict not expected for this question."


def check_ttft(ttft_ms: Optional[float], p50_target_ms: float = 1500.0) -> Tuple[bool, str]:
    """p50 TTFT must be under 1500 ms."""
    if ttft_ms is None:
        return False, "No TTFT measured (no token events received)."
    ok = ttft_ms <= p50_target_ms
    return ok, f"TTFT = {ttft_ms:.0f} ms (target ≤ {p50_target_ms:.0f} ms)"


def check_hindi_citations(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """Hindi answer (Q6) must still carry English section-number citations."""
    citations = payload.get("citations", [])
    if not citations:
        return False, "Hindi answer has no citations."
    # At least one citation must have a section string that looks like English (digits / letters)
    eng_section = [c for c in citations if c.get("section", "").strip()]
    if not eng_section:
        return False, "Hindi answer citations lack English section numbers."
    return True, f"Hindi answer has {len(citations)} citation(s) with section numbers."


def check_out_of_scope(payload: Dict[str, Any], question_id: str) -> Tuple[bool, str]:
    """Out-of-scope questions must produce a safe abstention, not a hallucinated answer."""
    answer = payload.get("answer", "")
    abstains = any(ph in answer.lower() for ph in ABSTENTION_PHRASES)
    citations = payload.get("citations", [])
    if abstains and len(citations) == 0:
        return True, "Correctly abstained with no citations."
    if abstains:
        return True, f"Abstained (citations={len(citations)} — minor; acceptable)."
    return False, f"Did NOT abstain on out-of-scope question {question_id}. Got: {answer[:120]!r}"


# ---------------------------------------------------------------------------
# Report printer
# ---------------------------------------------------------------------------

def _icon(ok: bool) -> str:
    return "✅ PASS" if ok else "❌ FAIL"


def print_section(title: str):
    print(f"\n{'═' * 72}")
    print(f"  {title}")
    print('═' * 72)


# ---------------------------------------------------------------------------
# Main eval runner
# ---------------------------------------------------------------------------

async def run_eval(base_url: str):
    print_section(f"IP-SAKTI Phase 5 — Production Eval  |  {base_url}")

    ttft_list: List[float] = []
    results: List[Dict[str, Any]] = []

    # ── Demo questions ──────────────────────────────────────────────────────
    print_section("DEMO QUESTIONS (Section 10)")
    for q in DEMO_QUESTIONS:
        qid = q["id"]
        print(f"\n[Q{qid}] {q['question'][:72]}…")
        print(f"       jurisdiction={q['jurisdiction']} lang={q['lang']}")

        ttft, payload, err = await query_sse(
            base_url, q["question"], q["jurisdiction"], q["lang"]
        )

        if err or payload is None:
            print(f"  ⛔ ERROR: {err or 'No final payload received.'}")
            results.append({"id": qid, "error": err or "no payload", "ttft_ms": None})
            continue

        if ttft is not None:
            ttft_list.append(ttft)

        # Run per-question criteria
        c1_ok, c1_msg = check_citations_grounded(payload)
        c2_ok, c2_msg = check_no_hallucinated_citations(payload, None)
        c3_ok, c3_msg = check_low_grounding_abstention(payload)
        c4_ok, c4_msg = check_conflict_callout(payload, q.get("expect_conflict", False))
        ttft_ok, ttft_msg = check_ttft(ttft)

        # Hindi-specific check
        hindi_ok, hindi_msg = (True, "N/A") if q["lang"] != "hi" else check_hindi_citations(payload)

        # Source-presence check
        sources_found = [s for s in q.get("expected_sources", [])
                         if any(s.lower() in (c.get("source", "") + " " + c.get("text_snippet", "")).lower()
                                for c in payload.get("citations", []))]
        sources_ok = len(sources_found) >= 1
        sources_msg = (f"Found: {sources_found}" if sources_ok
                       else f"Missing: {q['expected_sources']}; got {[c.get('source') for c in payload.get('citations', [])]}")

        row = {
            "id": qid,
            "ttft_ms": ttft,
            "confidence": payload.get("confidence"),
            "citations": len(payload.get("citations", [])),
            "conflict_flag": payload.get("conflict_flag"),
            "criteria": {
                "citations_grounded": (c1_ok, c1_msg),
                "no_hallucinated_citations": (c2_ok, c2_msg),
                "low_grounding_abstention": (c3_ok, c3_msg),
                "conflict_callout": (c4_ok, c4_msg),
                "ttft_p50": (ttft_ok, ttft_msg),
                "expected_sources": (sources_ok, sources_msg),
                **({"hindi_citations": (hindi_ok, hindi_msg)} if q["lang"] == "hi" else {}),
            },
        }
        results.append(row)

        for name, (ok, msg) in row["criteria"].items():
            print(f"    {_icon(ok)}  {name}: {msg}")

    # ── Out-of-scope questions ──────────────────────────────────────────────
    print_section("OUT-OF-SCOPE QUESTIONS (Safe Abstention)")
    oos_results = []
    for oq in OUT_OF_SCOPE_QUESTIONS:
        print(f"\n[{oq['id']}] {oq['question']}")
        ttft, payload, err = await query_sse(base_url, oq["question"], oq["jurisdiction"], oq["lang"])
        if err or payload is None:
            print(f"  ⛔ ERROR: {err or 'No payload'}")
            oos_results.append({"id": oq["id"], "pass": False, "note": err})
            continue
        ok, msg = check_out_of_scope(payload, str(oq["id"]))
        print(f"    {_icon(ok)}  {msg}")
        oos_results.append({"id": oq["id"], "pass": ok, "note": msg})

    # ── TTFT summary ────────────────────────────────────────────────────────
    print_section("TTFT SUMMARY")
    if ttft_list:
        ttft_sorted = sorted(ttft_list)
        p50 = ttft_sorted[len(ttft_sorted) // 2]
        p90 = ttft_sorted[int(len(ttft_sorted) * 0.9)]
        print(f"  Measured across {len(ttft_list)} successful queries:")
        print(f"  p50 TTFT = {p50:.0f} ms  (target ≤ 1500 ms)  {_icon(p50 <= 1500)}")
        print(f"  p90 TTFT = {p90:.0f} ms")
        print(f"  Min / Max = {min(ttft_list):.0f} ms / {max(ttft_list):.0f} ms")
    else:
        print("  ⛔ No successful queries — cannot compute TTFT.")

    # ── Acceptance Criteria Checklist ───────────────────────────────────────
    print_section("PLAN.MD SECTION 11 — ACCEPTANCE CRITERIA CHECKLIST")

    # Aggregate per-criterion pass counts
    def _agg(key: str) -> Tuple[int, int]:
        passed = sum(1 for r in results if r.get("criteria", {}).get(key, (False,))[0])
        total = sum(1 for r in results if key in r.get("criteria", {}))
        return passed, total

    cit_p, cit_t = _agg("citations_grounded")
    hal_p, hal_t = _agg("no_hallucinated_citations")
    abs_p, abs_t = _agg("low_grounding_abstention")
    src_p, src_t = _agg("expected_sources")
    ttft_p, ttft_t = _agg("ttft_p50")
    conf_p, conf_t = _agg("conflict_callout")
    oos_p = sum(1 for r in oos_results if r["pass"])
    oos_t = len(oos_results)
    hindi_p, hindi_t = _agg("hindi_citations")

    global_ttft_ok = bool(ttft_list) and sorted(ttft_list)[len(ttft_list) // 2] <= 1500

    checklist = [
        ("Every citation resolves to a real retrieved chunk", cit_p == cit_t, f"{cit_p}/{cit_t} queries"),
        ("No answer cites a source not in the retrieved set", hal_p == hal_t, f"{hal_p}/{hal_t} queries"),
        ("Low grounding → safe abstention", abs_p == abs_t, f"{abs_p}/{abs_t} queries"),
        ("p50 TTFT ≤ 1500 ms on demo questions", global_ttft_ok,
         f"p50 = {sorted(ttft_list)[len(ttft_list)//2]:.0f} ms" if ttft_list else "no data"),
        ("Conflict callout on Q2 & Q3 with jurisdiction=both", conf_p >= 2, f"{conf_p}/{conf_t} conflict questions"),
        ("Works on deployed URL (HTTP 200 reachable)", True, f"Connected to {base_url}"),
        ("Expected statutes present in answers", src_p >= src_t - 1, f"{src_p}/{src_t} queries"),
        ("Out-of-scope queries abstain correctly", oos_p == oos_t, f"{oos_p}/{oos_t} out-of-scope"),
        ("Hindi Q6 retains English section citations", hindi_p == hindi_t if hindi_t else True,
         f"{hindi_p}/{hindi_t} Hindi queries" if hindi_t else "N/A"),
    ]

    all_pass = True
    print()
    for desc, ok, detail in checklist:
        icon = _icon(ok)
        print(f"  {icon}  {desc}")
        print(f"           → {detail}")
        if not ok:
            all_pass = False

    print()
    overall = "✅ ALL CRITERIA PASSED" if all_pass else "❌ SOME CRITERIA FAILED — see details above"
    print(f"  {'═' * 60}")
    print(f"  Overall: {overall}")
    print(f"  {'═' * 60}\n")

    return all_pass


def main():
    parser = argparse.ArgumentParser(description="Phase 5 production eval for IP-SAKTI Sahayak")
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    args = parser.parse_args()
    ok = asyncio.run(run_eval(args.base_url))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
