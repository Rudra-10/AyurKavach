# IP-SAKTI Sahayak (MVP)

**Problem Statement:** SIH26045 (Ministry of Ayush) — A multilingual, source-cited RAG assistant for Ayurveda Intellectual Property and regulatory compliance across Indian and international regimes.

---

## 🏛️ Architecture & Core Pipeline

```
[ User Query (en/hi) ]
         │
         ▼
[ Hybrid Retrieval ] ── (Dense BGE-M3 + Sparse SPLADE/BM25 + RRF + Jurisdiction Filter)
         │ Top 15
         ▼
[ Reranker ] ────────── (BGE-reranker-v2-m3)
         │ Top 5
         ▼
[ Citation-Grounded Generator ] ── (Structured JSON: Answer, Citations, Confidence, Conflict Synthesis)
         │
         ▼
[ SSE Streaming Response ] ──────> [ Next.js Frontend (Prose + Footnotes + Synced Source Ledger) ]
```

---

## 🚀 Quickstart Guide

### 1. Vector Database (Qdrant)
Start the local Qdrant instance via Docker Compose:
```bash
docker compose up -d
```
Qdrant web UI will be accessible at `http://localhost:6333/dashboard`.

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# Activate on Windows:
.venv\Scripts\activate
# Activate on Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your LLM & embedding API keys

# Run development server:
uvicorn main:app --reload --port 8000
```
- Health check: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
cp .env.local.example .env.local

# Run development server:
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📁 Repository Structure
```
ip-sakti-sahayak/
├── frontend/             # Next.js App Router (TypeScript, Tailwind, Source Ledger)
├── backend/              # FastAPI async server, linear RAG pipeline
├── corpus/               # Curated Indian & International legal statutes + case studies
├── docs/                 # Plan, Antigravity instructions, demo scripts
├── docker-compose.yml    # Qdrant service
└── README.md
```
