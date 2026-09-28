# Antigravity Instructions — IP-SAKTI Sahayak MVP

## How to use
1. Put `plan.md` in `docs/plan.md` in the repo root.
2. Paste the **Master Prompt** once at the start of the session (or save it as the workspace rules/agent instructions file).
3. Then run the **Phase Prompts** one at a time. Review and test each phase before starting the next.

---

## Master Prompt (paste first / save as workspace rules)

You are building the MVP of "IP-SAKTI Sahayak", a multilingual, source-cited RAG assistant for Ayurveda IP and regulatory guidance across Indian and international regimes. Read `docs/plan.md` fully before doing anything. It is the single source of truth for scope, file structure, API contract, UI requirements and acceptance criteria.

Rules:
1. Follow the file structure in plan.md Section 5 exactly. Do not invent new top-level folders.
2. Build ONLY the items under "MUST BUILD" and "SIMPLIFIED FOR MVP". Never build anything under "FUTURE / ROADMAP".
3. Never hardcode legal answers or citations. All citations must come from retrieved chunks. If retrieval is weak, the answer must say grounding is insufficient.
4. The API contract in Section 6 is fixed. If you believe it must change, stop and tell me why before changing it.
5. Keep the pipeline linear: retrieve -> rerank -> generate. No agent frameworks.
6. All secrets go in `.env` files, never in code. Maintain `.env.example` files.
7. After each phase, run the phase's verification steps and report results honestly, including failures. Do not claim something works without running it.
8. Keep code simple and readable; add short comments only where logic is non-obvious. Type everything (TypeScript types, Pydantic models).
9. Do not restyle the frontend beyond the requirements in plan.md Section 7.

---

## Phase 0 — Scaffold
Create the full folder structure from plan.md Section 5 with placeholder files. Set up:
- `frontend/`: Next.js App Router + TypeScript + Tailwind, design tokens from Section 7 as CSS variables in `globals.css`, Fraunces / IBM Plex Sans / IBM Plex Mono via `next/font`.
- `backend/`: FastAPI app with `/health` and a stub `/query` that streams SSE events (`token`, then `final`) with a hardcoded response matching the contract. CORS enabled for the frontend origin. `requirements.txt` and `.env.example`.
- `docker-compose.yml` running Qdrant.
- `.gitignore`, `README.md` with run instructions.
Verify: `docker compose up` starts Qdrant; `uvicorn` serves `/health`; frontend runs and can call the stub `/query`.

## Phase 1 — Corpus and ingestion
Files are in `corpus/` with `metadata.csv`. Implement in `backend/ingestion/`:
- `parse.py`: read text files, split into sections using the literal section headings.
- `chunk.py`: parent-child chunking. Child ~200-300 tokens for retrieval, parent = full section returned as context. Never split across a section boundary. Each chunk carries payload: `chunk_id, source, section, jurisdiction, year, parent_text, source_url`.
- `embed_and_upsert.py`: generate dense and sparse vectors (BGE-M3 via the hosted API configured in `.env`), upsert into a Qdrant collection with both vector types.
- `scripts/run_ingestion.py`: runs the whole pipeline, idempotent (safe to re-run).
Verify: print chunk counts per document and 5 random chunks with payload; confirm section numbers match the source text.

## Phase 2 — Retrieval
Implement `retrieval/retriever.py`: hybrid search (dense + sparse) fused with RRF, jurisdiction filter (`india` / `international` / `both`), top-15. Implement `retrieval/reranker.py` (BGE-reranker-v2-m3 via hosted API) returning top-5 with scores.
Then write `scripts/eval_demo_questions.py` that runs every question in plan.md Section 10 and prints the top-5 chunks (source, section, score).
Verify: for each demo question, the expected statutes/sections appear in the top-5. Report which questions fail and why (chunking, embedding, filter). Fix retrieval before moving on.

## Phase 3 — Generation
Implement `generation/`:
- `prompt_templates.py`: system prompt that (a) answers ONLY from provided chunks, (b) numbers citations [1], [2] mapped to chunk ids, (c) when `jurisdiction=both`, states any conflict or compliance gap between Indian and international requirements in a separate `conflict_note`, (d) responds in the requested language (`en`/`hi`) while keeping section numbers and act names in English, (e) says grounding is insufficient if chunks do not support an answer.
- `llm_client.py`: call the LLM with a JSON schema / tool call so output is `{answer, citations[], conflict_flag, conflict_note}`. Validate with Pydantic; reject any citation whose chunk_id was not in the retrieved set.
- `confidence.py`: map top reranker score to high/medium/low using thresholds in `config.py`; force `low` when no chunk passes the minimum threshold.
Wire everything into `/query` with SSE streaming (`token` events then `final`).
Verify: run all demo questions end to end; manually confirm each cited section supports its claim. Show me the outputs.

## Phase 4 — Frontend integration
Replace mocks with the real API using `lib/api.ts` (SSE client) and `lib/types.ts`. Implement the requirements in plan.md Section 7:
- Footnote-style citations in `AnswerBlock`, dedupe via `lib/citations.ts`, Source Ledger as compact rows with jurisdiction color bar and expandable snippet.
- Footnote click scrolls to and highlights the ledger entry.
- `ConflictCallout` with SVG icon, shown only when `conflict_flag` is true.
- `ConfidenceBadge` from `confidence`.
- Jurisdiction and language toggles sent with every request.
- `TurnDivider` between turns; single `DisclaimerFooter`.
- Loading, empty and error states; mobile bottom-sheet ledger.
Verify: run the frontend against the real backend on all demo questions; check the ledger never shows duplicates; check mobile width.

## Phase 5 — Hardening and deploy
- Add caching for the demo questions in `backend/cache.py`.
- Add request timeouts, retries for hosted APIs, and friendly error messages.
- Deploy the backend (Railway/Render) and frontend (Vercel); set `NEXT_PUBLIC_API_URL`.
- Run `eval_demo_questions.py` against production and confirm plan.md Section 11 acceptance criteria.
Verify: give me a checklist with pass/fail for each acceptance criterion and the measured time-to-first-token.

---

## Useful mid-build prompts
- "Audit the repo against plan.md Section 3. List anything built that is not in MUST BUILD, and anything in MUST BUILD that is missing."
- "Pick 10 random citations from a live answer and verify each cited chunk actually supports the claim. Report mismatches."
- "The retrieval for question N returns the wrong section. Diagnose whether the cause is chunking, embedding, filtering or reranking, and show evidence before fixing."
