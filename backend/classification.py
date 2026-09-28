"""
Formulation Classifier & Regulatory Posture Engine.
Implements guided clarification flow, grounded statutory retrieval, rule-based ABS decision tree,
and TKDL defensive publication pointers.
"""
from typing import Dict, Any, List, Optional
from models.schemas import (
    ClassifyRequest,
    ClassifyResponse,
    NextQuestion,
    Citation,
    FormulationCategory
)
from profiles import create_or_update_profile, get_profile
from retrieval.retriever import HybridRetriever
from retrieval.reranker import CrossEncoderReranker


GUIDED_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "q1_intended_use",
        "question": "What is the primary intended use and regulatory classification of your product?",
        "options": [
            "Internal medicine for treating/curing diseases (Classical/Proprietary Drug)",
            "Dietary food supplement or wellness nutrition (Ayurveda-Aahar)",
            "Standardized purified plant fraction with 4+ bio-markers (Phytopharmaceutical)",
            "Topical skin, hair, or beauty care (Cosmetic)",
            "Synthetic chemical compound or novel non-traditional entity (New Drug)"
        ],
        "helper_text": "Determines primary jurisdiction between CDSCO (Drugs), FSSAI (Food), or Cosmetics Rules."
    },
    {
        "id": "q2_ingredients_source",
        "question": "Are all ingredients and recipes taken strictly from authoritative Ayurvedic compendia (First Schedule)?",
        "options": [
            "Yes, 100% classical recipe and traditional name (e.g., Triphala, Chyawanprash, Trikatu)",
            "Yes, classical ingredients, but modified proportions/dosage form under a brand name",
            "Contains newly isolated active fractions or non-classical botanicals",
            "Culinary herbs and foods prepared per Ayurvedic dietary principles"
        ],
        "helper_text": "First Schedule texts include Charaka Samhita, Sushruta Samhita, Bhavaprakasha, etc. under Drugs & Cosmetics Act Section 3(a)."
    },
    {
        "id": "q3_geographic_filing",
        "question": "Where do you intend to manufacture and file for intellectual property (patents/trademarks)?",
        "options": [
            "India only",
            "Both India and International patent offices (PCT / US / EU / WIPO)",
            "No patent intended; seeking commercial branding and trademark only"
        ],
        "helper_text": "Filing abroad triggers mandatory Section 6(1) NBA prior approval under the Biological Diversity Act, 2002."
    },
    {
        "id": "q4_applicant_entity",
        "question": "What is the legal status and ownership of your manufacturing/filing entity?",
        "options": [
            "Indian citizen or 100% Indian-owned company",
            "Entity with foreign shareholding, foreign management, or Non-Resident Indian participation",
            "Individual traditional practitioner (Vaid/Hakim) or local cultivator"
        ],
        "helper_text": "Entities with any foreign equity require Section 3(1) NBA prior approval for accessing Indian biological resources."
    }
]


def determine_category_and_abs(answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates guided questionnaire responses into one of six statutory formulation categories
    and computes the ABS compliance posture.
    """
    q1 = answers.get("q1_intended_use", "")
    q2 = answers.get("q2_ingredients_source", "")
    q3 = answers.get("q3_geographic_filing", "")
    q4 = answers.get("q4_applicant_entity", "")

    # Rule evaluation
    if "Dietary food supplement" in q1 or "Culinary herbs" in q2:
        cat: FormulationCategory = "ayurveda_aahar"
        cat_name = "Ayurveda-Aahar / Dietary Nutraceutical"
    elif "Phytopharmaceutical" in q1 or "purified plant fraction" in q1:
        cat: FormulationCategory = "phytopharmaceutical"
        cat_name = "Phytopharmaceutical Drug"
    elif "Cosmetic" in q1:
        cat: FormulationCategory = "cosmetic"
        cat_name = "Herbal / Ayurvedic Cosmetic"
    elif "Synthetic chemical" in q1 or "novel non-traditional" in q1:
        cat: FormulationCategory = "new_drug"
        cat_name = "New / Non-Classical Drug"
    elif "100% classical recipe" in q2 or "Triphala" in q2:
        cat: FormulationCategory = "classical"
        cat_name = "Classical / Generic Ayurvedic Medicine"
    else:
        cat: FormulationCategory = "proprietary"
        cat_name = "Patent or Proprietary Ayurvedic Medicine"

    # ABS Decision Tree
    is_foreign = "foreign shareholding" in q4 or "Non-Resident" in q4
    is_foreign_filing = "Both India and International" in q3
    is_practitioner = "traditional practitioner" in q4

    if is_foreign_filing:
        abs_posture = "MANDATORY NBA PRIOR APPROVAL (Form III): Before filing any patent application outside India, Section 6(1) of the Biological Diversity Act, 2002 mandates prior approval from the National Biodiversity Authority."
    elif is_foreign:
        abs_posture = "MANDATORY NBA PRIOR APPROVAL (Form I): Entities with non-Indian participation must obtain prior NBA approval under Section 3(1) before accessing any biological resource occurring in India for commercial utilization."
    elif is_practitioner:
        abs_posture = "STATUTORY EXEMPTION (2023 Amendment): Registered AYUSH practitioners (vaids/hakims) and local cultivators are exempt from SBB intimation when preparing medicines for patients."
    elif cat == "ayurveda_aahar":
        abs_posture = "COMMODITY EXEMPTION CHECK (Section 40): If all raw ingredients are notified as 'Normally Traded as Commodities' (NTAC), ABS provisions do not apply; otherwise prior intimation to SBB under Section 24(1) is required."
    else:
        abs_posture = "STATE BIODIVERSITY BOARD INTIMATION (Form I to SBB): Indian commercial manufacturers must submit prior intimation to the concerned State Biodiversity Board under Section 24(1) of the Biological Diversity Act, 2002."

    # TKDL Defensive Pointer
    tkdl_pointer = None
    if cat in ["classical", "proprietary"]:
        tkdl_pointer = "TKDL Defensive Publication Alert: Classical formulations (e.g. Turmeric, Neem, Ashwagandha, Triphala) are extensively cataloged in India's Traditional Knowledge Digital Library (TKDL) and PCT Rule 34 minimum documentation, preventing generic patent claims worldwide."

    return {
        "category": cat,
        "category_name": cat_name,
        "abs_requirement": abs_posture,
        "tkdl_prior_art_pointer": tkdl_pointer
    }


async def classify_formulation(
    request: ClassifyRequest,
    retriever: HybridRetriever,
    reranker: CrossEncoderReranker
) -> ClassifyResponse:
    """
    Executes guided classification, retrieves statutory grounding chunks for the category,
    and returns a persisted Formulation Profile.
    """
    answers = request.answers or {}

    # Check if more questions are needed
    if len(answers) < 2:
        unanswered = [
            NextQuestion(
                id=q["id"],
                question=q["question"],
                options=q["options"],
                helper_text=q.get("helper_text")
            )
            for q in GUIDED_QUESTIONS
            if q["id"] not in answers
        ]
        return ClassifyResponse(
            profile_id=request.profile_id or "pending",
            category=None,
            category_name=None,
            ip_posture_summary="Please answer the guided clarifying questions to determine your formulation's exact statutory category and IP/ABS posture.",
            citations=[],
            abs_requirement=None,
            tkdl_prior_art_pointer=None,
            next_questions=unanswered[:2]
        )

    # Determine category & ABS
    eval_result = determine_category_and_abs(answers)
    category: FormulationCategory = eval_result["category"]
    cat_name: str = eval_result["category_name"]
    abs_posture: str = eval_result["abs_requirement"]
    tkdl_pointer: Optional[str] = eval_result["tkdl_prior_art_pointer"]

    # Grounding retrieval for this category
    query_text = f"Classification IP posture and requirements for {cat_name} under Drugs and Cosmetics Act Patents Act Biological Diversity Act"
    raw_chunks = await retriever.retrieve(query_text, jurisdiction="both", top_k=10)
    top_chunks = await reranker.rerank(query_text, raw_chunks, top_n=3)

    citations: List[Citation] = []
    for idx, c in enumerate(top_chunks, start=1):
        citations.append(
            Citation(
                id=idx,
                source=c.get("source", "Statute"),
                section=c.get("section", "General"),
                jurisdiction=c.get("jurisdiction", "india"),
                text_snippet=c.get("child_text", "")[:180],
                chunk_id=c.get("chunk_id", f"cit_{idx}")
            )
        )

    # Build IP Posture Summary with citations
    if category == "classical":
        ip_summary = (
            f"Statutory Category: {cat_name}. "
            "Under Section 3(a) of the Drugs & Cosmetics Act, 1940, your formulation is a Classical Ayurvedic Drug manufactured exclusively per First Schedule compendia [1]. "
            "IP Posture: Per-se non-patentable under Section 3(p) of the Patents Act, 1970 as traditional knowledge [2]. "
            f"ABS Posture: {abs_posture} [3]."
        )
    elif category == "proprietary":
        ip_summary = (
            f"Statutory Category: {cat_name}. "
            "Under Section 3(h) of the Drugs & Cosmetics Act, 1940, your product is a Patent or Proprietary Ayurvedic Medicine [1]. "
            "IP Posture: Excluded from patenting unless unexpected synergistic efficacy is proven under Section 3(d) and Section 3(e) of the Patents Act, 1970 [2]. "
            f"ABS Posture: {abs_posture} [3]."
        )
    elif category == "phytopharmaceutical":
        ip_summary = (
            f"Statutory Category: {cat_name}. "
            "Regulated under Gazette Notification G.S.R. 918(E) (2015) as a purified standardized botanical fraction with defined bio-markers [1]. "
            "IP Posture: Patentable on composition and process under Section 2(1)(j) & 3(d) of the Patents Act, 1970 [2]. "
            f"ABS Posture: {abs_posture} [3]."
        )
    elif category == "ayurveda_aahar":
        ip_summary = (
            f"Statutory Category: {cat_name}. "
            "Regulated under FSSAI Ayurveda Aahar Regulations, 2022 as a traditional dietary food supplement with mandatory Ayurveda-Aahar logo [1]. "
            "IP Posture: Therapeutic claims and pharma patents are precluded under Section 3(p) of Patents Act; trademark and branding protection apply [2]. "
            f"ABS Posture: {abs_posture} [3]."
        )
    elif category == "cosmetic":
        ip_summary = (
            f"Statutory Category: {cat_name}. "
            "Regulated under Drugs and Cosmetics Rules for herbal cosmetics [1]. "
            "IP Posture: Formulation patentable only if specific novel synergy is proven; trade dress and trademark rights are key [2]. "
            f"ABS Posture: {abs_posture} [3]."
        )
    else:
        ip_summary = (
            f"Statutory Category: {cat_name}. "
            "Regulated under New Drugs and Clinical Trials Rules under CDSCO [1]. "
            "IP Posture: Standard patentability under Section 2(1)(j) of the Patents Act, 1970 [2]. "
            f"ABS Posture: {abs_posture} [3]."
        )

    # Persist in session Formulation Profile store
    profile_record = create_or_update_profile(
        category=category,
        category_name=cat_name,
        answers=answers,
        ip_posture_summary=ip_summary,
        citations=citations,
        abs_requirement=abs_posture,
        tkdl_prior_art_pointer=tkdl_pointer,
        profile_id=request.profile_id
    )

    return ClassifyResponse(
        profile_id=profile_record["profile_id"],
        category=category,
        category_name=cat_name,
        ip_posture_summary=ip_summary,
        citations=citations,
        abs_requirement=abs_posture,
        tkdl_prior_art_pointer=tkdl_pointer,
        next_questions=None
    )
