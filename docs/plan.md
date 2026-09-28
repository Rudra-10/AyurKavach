# IP-SAKTI Sahayak — Build Plan

**Problem Statement:** SIH26045 (Ministry of Ayush) — A multilingual, RAG-based (source-cited) AI assistant for Intellectual Property and regulatory guidance in Ayurveda, across national and international regimes.

**Team:** 3 builders — Frontend (Next.js), Backend/RAG (FastAPI), RAG Logic/Data/X-Factor.
**Timeline:** 4 days. **Rule:** if a feature is not in Section 3 "MUST BUILD", do not build it.

---

## 1. Project Goal

A web app where a user asks a natural-language question about Ayurveda IP/regulatory matters and receives an answer that is:
1. Grounded strictly in retrieved legal source text (no invented law)
2. Cited inline with footnote numbers linked to the exact statute/section
3. Aware of both Indian and international regimes, flagging conflicts/gaps between them
4. Available in English and Hindi
5. Labeled with a confidence indicator

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel |
| Backend | FastAPI (Python 3.11), async, SSE streaming. Hosted on Railway/Render |
| Vector DB | Qdrant (Docker locally, Qdrant Cloud free tier for deploy), dense + sparse vectors |
| Embeddings | BGE-M3 via hosted inference API |
| Reranker | BGE-reranker-v2-m3 via hosted inference API |
| Orchestration | LlamaIndex (retrieval + node metadata). Keep pipeline linear: retrieve -> rerank -> generate. No agents |
| Generation LLM | Claude or Gemini API, structured JSON output |
| Cache | Redis (optional) or in-memory dict for demo queries |

---

## 3. Feature Scope

### MUST BUILD (MVP)
- [ ] Chat interface with streaming responses
- [ ] Ingestion: parse -> section-boundary chunking (parent-child) -> embed -> upsert to Qdrant
- [ ] Hybrid retrieval (dense + sparse + RRF fusion) with jurisdiction payload filter
- [ ] Rerank top-15 -> top-5
- [ ] Citation-grounded generation, structured JSON (`answer`, `citations[]`, `confidence`, `conflict_flag`, `conflict_note`)
- [ ] Inline footnote citations in the UI
- [ ] Source Ledger panel synced with footnotes (click footnote -> scroll + highlight entry)
- [ ] Jurisdiction toggle: India / International / Both
- [ ] **Cross-Regime Conflict Synthesizer** (prompt-engineered) shown as a distinct callout
- [ ] Confidence badge (High/Medium/Low) from reranker top-score thresholds
- [ ] English + Hindi toggle (via prompt parameter)
- [ ] Curated corpus (see Section 8)
- [ ] Loading, empty and error states
- [ ] Live deploy: Vercel (frontend) + hosted backend

### SIMPLIFIED FOR MVP
- Confidence gate: threshold-based, not an NLI model
- Conflict detection: prompt-based, not a multi-agent engine
- Multilingual: English + Hindi only

### FUTURE / ROADMAP (mention in pitch, do NOT build)
- Full Indic language support via IndicTrans2
- TKDL-backed prior-art similarity checker
- NLI entailment-based hallucination verification
- User accounts, saved history
- Admin panel for corpus/amendment updates
- Live NBA / IP India API integration
- Voice interface
- Full corpus of all AYUSH-relevant statutes and treaties

---

## 4. X-Factor / USP

**Primary: Cross-Regime Conflict & Gap Synthesizer.** Most assistants answer Indian OR international law separately. IP-SAKTI Sahayak cross-references both and surfaces specific compliance gaps (e.g. NBA approval under the Biological Diversity Act vs. disclosure duties under WIPO GRATK / Nagoya Protocol when filing abroad).

**Secondary: Verifiable Citation Trace.** Every claim maps to a retrieved chunk, shown as a footnote linked to a source ledger, plus a confidence indicator. When grounding is weak the system says so instead of guessing.

Pitch line: *"Not just a citation bot — a compliance-gap detector with a built-in lie detector."*

---

## 5. File Structure

```
ip-sakti-sahayak/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # main workspace (chat + ledger)
│   │   └── globals.css              # design tokens as CSS variables
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── TurnDivider.tsx
│   │   ├── AnswerBlock.tsx          # prose + superscript footnotes
│   │   ├── Footnote.tsx
│   │   ├── SourceLedger.tsx
│   │   ├── LedgerEntry.tsx
│   │   ├── ConflictCallout.tsx      # Cross-Regime Note
│   │   ├── ConfidenceBadge.tsx
│   │   ├── JurisdictionToggle.tsx
│   │   ├── LanguageToggle.tsx
│   │   ├── SuggestedQuestions.tsx
│   │   ├── InputBar.tsx
│   │   ├── DisclaimerFooter.tsx     # single persistent footer, not per-message
│   │   └── icons/ScaleIcon.tsx      # SVG, no emoji glyphs
│   ├── lib/
│   │   ├── api.ts                   # fetch + SSE client
│   │   ├── types.ts                 # mirrors backend schemas
│   │   └── citations.ts             # dedupe + numbering helpers
│   ├── public/
│   ├── .env.local.example           # NEXT_PUBLIC_API_URL
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/
│   ├── main.py                      # FastAPI app: /health, /query (SSE)
│   ├── config.py                    # env loading, thresholds
│   ├── models/
│   │   └── schemas.py               # Pydantic request/response
│   ├── ingestion/
│   │   ├── parse.py                 # raw text/PDF -> sections
│   │   ├── chunk.py                 # parent-child, split on section boundaries
│   │   └── embed_and_upsert.py      # embed + push to Qdrant
│   ├── retrieval/
│   │   ├── retriever.py             # hybrid search + RRF + jurisdiction filter
│   │   └── reranker.py
│   ├── generation/
│   │   ├── prompt_templates.py      # system prompt + cross-regime + language
│   │   ├── llm_client.py            # structured JSON output
│   │   └── confidence.py            # score -> high/medium/low
│   ├── cache.py                     # demo-query cache
│   ├── scripts/
│   │   ├── run_ingestion.py
│   │   └── eval_demo_questions.py   # runs demo questions, prints citations
│   ├── requirements.txt
│   └── .env.example
│
├── corpus/
│   ├── india/
│   ├── international/
│   ├── case_studies/
│   └── metadata.csv                 # document_name, jurisdiction, year, source_url
│
├── docs/
│   ├── plan.md
│   ├── antigravity_instructions.md
│   ├── architecture_diagram.png
│   └── demo_script.md
│
├── docker-compose.yml               # Qdrant (+ Redis if used)
├── .gitignore
└── README.md
```

---

## 6. API Contract

```
POST /query   (Server-Sent Events stream)

Request:
{ "question": "string",
  "jurisdiction": "india" | "international" | "both",
  "lang": "en" | "hi" }

Stream events:
  event: token      data: {"text": "..."}
  event: final      data: { full JSON below }

Final payload:
{
  "answer": "string with [1] [2] footnote markers",
  "citations": [
    { "id": 1, "source": "Patents Act, 1970", "section": "3(d)",
      "jurisdiction": "india", "text_snippet": "string", "chunk_id": "string" }
  ],
  "confidence": "high" | "medium" | "low",
  "conflict_flag": true | false,
  "conflict_note": "string | null"
}

GET /health -> {"status": "ok"}
```

Citation `id`s are stable per response and start at 1. The frontend must dedupe and never render the same source twice in the ledger.

---

## 7. UI Requirements

**Theme (current build is dark; keep it):**
- Background: near-black green `#0F1A14`; surface `#16241C`; hairline borders `#2A3B31`
- Text: `#E8EDE6`; muted `#9DB0A3`
- Accents: turmeric `#C98A2B` (India / verified citations), cool teal `#6FA8A0` (International), brick `#C0503F` (conflict only), sage `#5B8266` (high confidence)
- Fonts: Fraunces (headings/wordmark), IBM Plex Sans (body/UI), IBM Plex Mono (section numbers, citation IDs)
- Optional: faint ledger-rule background texture at 2-3% opacity

**Layout:** header (wordmark, jurisdiction toggle, language toggle) / two panes: answers (left), Source Ledger (right) / bottom input bar / thin persistent disclaimer footer.

**Required behaviors and fixes:**
- [ ] Source Ledger shows each source once (dedupe by `chunk_id`); scope it to citations of the selected/latest answer
- [ ] Ledger entries are compact rows (`1  Patents Act, 1970 — Sec. 3(d)`), snippet revealed on click/hover; left color bar by jurisdiction instead of a text pill
- [ ] Clicking a footnote scrolls to and briefly highlights its ledger entry (the only decorative motion in the app)
- [ ] Conflict callout: left brick border, SVG scale icon (no emoji), titled "Cross-Regime Note"
- [ ] Divider between conversation turns
- [ ] Disclaimer ("Information, not legal advice. Verify against the cited source before filing.") appears once in a footer, not under every answer
- [ ] Unselected toggles and suggestion chips have sufficient contrast (WCAG AA) for projector demos
- [ ] Suggestion chips styled as flat tabs, not generic pills
- [ ] Streaming text with visible loading state; error state names what failed
- [ ] Responsive to mobile; on mobile the ledger becomes a bottom sheet
- [ ] Visible keyboard focus; respect `prefers-reduced-motion`
- [ ] No test/junk messages left in the default state

---

## 8. Corpus (MVP subset)

**India:** Patents Act 1970 (Sec 3(d), 3(p), 10, 25, 64), Patent Rules 2003 (relevant parts), Biological Diversity Act 2002 + Rules 2004, Drugs & Cosmetics Act 1940 / Rules 1945 (Ayurveda, Siddha, Unani provisions, Schedule T), GI Act 1999 (summary sections), Trade Marks Act 1999 (summary sections).
**International:** TRIPS Art. 27, Nagoya Protocol, CBD 1992 (Arts. 8(j), 15), WIPO PCT overview, WIPO GRATK Treaty (2024) disclosure provisions.
**Case studies:** turmeric patent revocation (US 5,401,504), neem patent revocation (EP 0436257), Novartis v. Union of India (2013).

Every file must be tagged in `corpus/metadata.csv`. Preserve section numbers as literal headings so the chunker can split on them.

---

## 9. Day-by-Day Milestones

- **Day 1:** Repo scaffolded, API contract locked, stub `/query` deployed, frontend calling it, corpus collection underway
- **Day 2:** Ingestion done, hybrid retrieval + rerank returning correct chunks for all demo questions, ledger UI fixed
- **Day 3:** Generation with structured citations, confidence, conflict logic, Hindi toggle; end-to-end on all demo questions
- **Day 4:** Feature freeze by midday, bug bash, production verification, demo recording, handoff to PPT team

---

## 10. Demo Questions (test constantly)

1. Can I patent an Ayurvedic formulation using turmeric?
2. What approvals do I need before filing abroad for a formulation using Indian medicinal plants?
3. How do India and the EU differ on patentability of traditional herbal medicine?
4. Do I need ABS approval to export a herbal product?
5. How is my Ayurvedic formulation classified under the Drugs & Cosmetics Act?
6. (Hindi) Can I patent a turmeric formulation? — verify Hindi answer keeps citations intact

---

## 11. Acceptance Criteria

- Every citation in an answer resolves to a real chunk whose text supports the claim
- No answer cites a source that was not retrieved
- Low grounding -> answer states insufficient grounding instead of guessing
- p50 time-to-first-token under 1.5 s on demo questions
- Conflict callout appears on demo question 2 and 3 with `jurisdiction=both`
- Works on the deployed URL from a phone

## 12. Known Limitations (state honestly)

- Curated corpus subset only
- English/Hindi only
- Threshold-based confidence, not entailment verification
- Guidance tool, not a substitute for a registered patent agent
