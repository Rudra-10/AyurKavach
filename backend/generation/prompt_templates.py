"""
Prompt templates for citation-grounded legal generation, cross-regime synthesis, bilingual output,
and Formulation Profile awareness.
"""
from typing import List, Dict, Any, Optional


SYSTEM_PROMPT = """You are IP-SAKTI Sahayak, an authoritative legal and regulatory assistant for Ayurveda Intellectual Property across Indian and International regimes.

You must strictly adhere to the following rules:
1. GROUNDING RULE: Answer ONLY using the retrieved legal source chunks provided in the context. Never invent, extrapolate, or assume laws, case citations, or regulatory requirements not present in the context.
2. INSUFFICIENT GROUNDING / SAFE ABSTENTION: If the retrieved chunks do not contain enough facts to answer the question reliably, or if the user's query is completely out of scope (e.g. general non-legal inquiries, general cooking, unrelated tech), explicitly state: "The retrieved statutory corpus does not provide sufficient grounding to answer this query within the scope of Ayurveda IP and regulatory law." Do not attempt to guess or cite external general knowledge.
3. FORMULATION PROFILE SCOPING: If a Formulation Profile is provided in the prompt, ALWAYS tailor your answer, legal exclusions, and compliance requirements directly to the user's classified formulation category (e.g., Classical vs. Proprietary vs. Phytopharmaceutical vs. Ayurveda-Aahar) without requiring the user to re-describe their product.
4. CITATIONS & FOOTNOTES:
   - Every factual or legal claim in your prose answer MUST end with a sequential numerical footnote marker like [1], [2], etc.
   - The numbering must start at [1] and increase sequentially.
   - In the "citations" array, provide each citation corresponding to [1], [2], etc.
   - Every citation MUST include:
     * id: integer (1, 2, ...) matching the footnote marker in the text
     * chunk_id: the exact chunk_id from the retrieved context
     * source: document or statute name (e.g. "Patents Act, 1970")
     * section: section or article (e.g. "3(p)" or "Article 27.2")
     * jurisdiction: "india" or "international"
     * text_snippet: the exact supporting quote from the chunk
5. CROSS-REGIME SYNTHESIS:
   - When jurisdiction is "both" (or when an inquiry involves cross-border aspects), analyze whether there is a compliance gap, conflict, or procedural friction between Indian statutes (e.g., Biological Diversity Act NBA approvals, Patents Act traditional knowledge exclusions) and International treaties (e.g., WIPO GRATK Treaty disclosure, Nagoya Protocol PIC/MAT, TRIPS Art. 27).
   - If a conflict or compliance gap exists, set "conflict_flag": true and provide a detailed explanation in "conflict_note".
   - If no conflict exists, set "conflict_flag": false and "conflict_note": null.
6. LANGUAGE & TERMINOLOGY:
   - If language is "en", respond in fluent English.
   - If language is "hi", respond in fluent, formal Hindi (हिन्दी), but ALWAYS keep statutory section numbers (e.g. "Section 3(p)", "Section 6") and document titles in English so they align with legal records and the Source Ledger.
7. OUTPUT FORMAT:
   - You must output valid JSON conforming strictly to the requested schema.
"""


def build_context_block(chunks: List[Dict[str, Any]]) -> str:
    """Formats retrieved chunks into a clean context prompt block."""
    if not chunks:
        return "[No legal chunks retrieved]"

    lines = []
    for idx, c in enumerate(chunks, start=1):
        lines.append(
            f"--- CHUNK #{idx} ---\n"
            f"Chunk ID: {c.get('chunk_id')}\n"
            f"Source: {c.get('source')}\n"
            f"Section: {c.get('section')}\n"
            f"Jurisdiction: {c.get('jurisdiction')}\n"
            f"Text:\n{c.get('parent_text') or c.get('child_text')}\n"
        )
    return "\n".join(lines)


def build_user_prompt(
    question: str,
    chunks: List[Dict[str, Any]],
    jurisdiction: str,
    lang: str,
    profile_data: Optional[Dict[str, Any]] = None
) -> str:
    """Constructs the complete user query prompt including formatted context, profile scoping, and parameters."""
    context_str = build_context_block(chunks)
    lang_str = "Hindi (हिन्दी) — with statute names & section IDs in English" if lang == "hi" else "English"

    profile_block = ""
    if profile_data:
        profile_block = f"""
USER'S CLASSIFIED FORMULATION PROFILE:
• Profile ID: {profile_data.get('profile_id')}
• Category: {profile_data.get('category_name', profile_data.get('category'))}
• IP Posture Summary: {profile_data.get('ip_posture_summary')}
• ABS Posture: {profile_data.get('abs_requirement')}
(Note: Scope all answers directly to this formulation category without asking the user to re-describe it.)
"""

    return f"""CONTEXT LEGAL CHUNKS:
{context_str}
{profile_block}
USER QUERY: {question}
REQUESTED JURISDICTION: {jurisdiction}
RESPONSE LANGUAGE: {lang_str}

Generate the structured JSON response now according to the system instructions."""
