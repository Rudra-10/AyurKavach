"use client";

import React from "react";
import { NavTab } from "../../lib/types";
import { ScaleIcon } from "../icons/ScaleIcon";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Search,
  BookOpen,
  Layers,
  HelpCircle,
  Globe2,
  CheckCircle2,
} from "lucide-react";

interface HomeViewProps {
  onNavigate: (tab: NavTab) => void;
  activeProfileName?: string | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  activeProfileName,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-turmeric/10 border border-turmeric/30 text-turmeric-light text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-turmeric" />
          <span>SIH26045 • Ministry of Ayush • Multi-Regime Legal Intelligence</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-text leading-tight">
          Sovereign IP & Regulatory Clarity for <span className="text-turmeric">Ayurveda</span>
        </h1>

        <p className="text-base sm:text-lg text-text-muted leading-relaxed font-sans">
          A multilingual, citation-grounded RAG assistant navigating Indian statutes (Patents Act, Biological Diversity Act, Drugs & Cosmetics Act) and International regimes (WIPO GRATK Treaty, Nagoya Protocol, TRIPS).
        </p>

        {activeProfileName && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-turmeric/40 text-xs font-mono text-text">
            <span className="w-2 h-2 rounded-full bg-turmeric animate-pulse" />
            <span>Active Product Profile: <strong>{activeProfileName}</strong></span>
          </div>
        )}

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => onNavigate("assessment")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-turmeric text-bg font-semibold text-sm hover:bg-turmeric-light transition-all shadow-lg hover:shadow-turmeric/20 focus:outline-none focus:ring-2 focus:ring-turmeric"
          >
            <span>Start Product Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("chat")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-bg-surface border border-border text-text font-medium text-sm hover:bg-bg-elevated hover:border-turmeric/50 transition-all focus:outline-none focus:ring-1 focus:ring-turmeric"
          >
            <span>Ask IP-SAKTI Chat</span>
            <Search className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </section>

      {/* Core Architectural USPs Grid */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="font-heading text-xl font-bold text-text">
            Architectural X-Factors
          </h2>
          <p className="text-xs text-text-muted font-mono uppercase tracking-wider mt-1">
            Built for rigorous statutory compliance, not general knowledge guessing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* USP 1 */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border space-y-3 hover:border-turmeric/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-turmeric/10 border border-turmeric/30 text-turmeric">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-semibold text-text">
              1. The Formulation Profile
            </h3>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              Classify your formulation once via guided questions. That profile persists across the session, pre-scoping all downstream legal inquiries and ABS checks without re-describing your product.
            </p>
          </div>

          {/* USP 2 */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border space-y-3 hover:border-brick/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brick/10 border border-brick/30 text-brick-light">
              <ScaleIcon className="w-5 h-5 text-brick" />
            </div>
            <h3 className="font-heading text-base font-semibold text-text">
              2. Cross-Regime Conflict Engine
            </h3>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              Cross-references Indian mandates (e.g. NBA Section 6 approval before foreign filing) against International treaties (WIPO GRATK Treaty 2024, Nagoya Protocol), surfacing vital compliance traps.
            </p>
          </div>

          {/* USP 3 */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border space-y-3 hover:border-teal/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 border border-teal/30 text-teal-light">
              <ShieldCheck className="w-5 h-5 text-teal" />
            </div>
            <h3 className="font-heading text-base font-semibold text-text">
              3. Verifiable Citation Trace
            </h3>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              Every single claim maps to an exact retrieved section chunk in the Source Ledger. If statutory grounding is weak or query is out-of-scope, the engine safely abstains instead of hallucinating.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works 3-Step Pipeline */}
      <section className="p-6 sm:p-8 rounded-2xl bg-bg-surface border border-border space-y-6">
        <h2 className="font-heading text-xl font-bold text-text text-center">
          How IP-SAKTI Sahayak Operates
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-turmeric text-bg font-mono font-bold text-xs">
                1
              </span>
              <h4 className="font-semibold text-sm text-text">Classify & Scope</h4>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Answer 4 guided questions to identify your formulation as Classical, Proprietary, Phytopharmaceutical, Ayurveda-Aahar, Cosmetic, or New Drug.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-turmeric text-bg font-mono font-bold text-xs">
                2
              </span>
              <h4 className="font-semibold text-sm text-text">Hybrid RAG Retrieval</h4>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Dense BGE-M3 + sparse term-frequency vectors fused via Reciprocal Rank Fusion (RRF) and reranked to top-5 authoritative statutory chunks.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-turmeric text-bg font-mono font-bold text-xs">
                3
              </span>
              <h4 className="font-semibold text-sm text-text">Grounded Synthesis & Trace</h4>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Receive a structured, cited answer with interactive footnotes mapped to the Source Ledger, complete with cross-regime notes and confidence rating.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
