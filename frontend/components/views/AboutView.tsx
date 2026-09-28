"use client";

import React from "react";
import { ShieldCheck, Lock, AlertCircle, Sparkles, MapPin } from "lucide-react";

export const AboutView: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-turmeric/10 border border-turmeric/30 text-turmeric-light text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-turmeric" />
          <span>Smart India Hackathon • SIH26045</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text">
          About IP-SAKTI Sahayak
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          A specialized sovereign AI assistant for Intellectual Property and regulatory guidance in Ayurveda, Siddha, and Unani systems.
        </p>
      </div>

      {/* DPDP Alignment Card */}
      <div className="p-4 rounded-xl bg-sage/10 border border-sage/40 flex items-start gap-3">
        <Lock className="w-5 h-5 text-sage-light flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-sage-light">
            DPDP Act Alignment (Session Privacy)
          </h3>
          <p className="text-xs text-text leading-relaxed font-sans">
            <strong>Digital Personal Data Protection (DPDP) Alignment:</strong> No personal, organizational, or proprietary formulation data is retained or stored beyond your active browser session. All session profiles and query states reside strictly in ephemeral memory.
          </p>
        </div>
      </div>

      {/* Problem Statement & Mission */}
      <div className="rounded-xl bg-bg-surface border border-border p-6 space-y-4 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-text">
          Ministry of Ayush Problem Statement (SIH26045)
        </h2>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
          Ayurvedic innovators, MSMEs, and researchers face a labyrinth of overlapping IP and regulatory hurdles spanning national statutes (Indian Patents Act 1970 exclusions under Section 3(p)/3(d), Biological Diversity Act 2002 NBA approvals, Drugs & Cosmetics Act 1940 Schedule T GMP) and international regimes (WIPO GRATK Treaty 2024, Nagoya Protocol, TRIPS).
        </p>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
          IP-SAKTI Sahayak acts as a sovereign compliance co-pilot: it classifies products via guided questions into a <strong>Formulation Profile</strong>, grounds all claims with verifiable footnotes in the <strong>Source Ledger</strong>, and highlights compliance traps via the <strong>Cross-Regime Conflict Synthesizer</strong>.
        </p>
      </div>

      {/* Acceptance Criteria & Known Limitations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-bg-surface border border-border p-5 space-y-3">
          <h3 className="font-heading text-base font-bold text-text flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-turmeric" />
            <span>Guaranteed Protections</span>
          </h3>
          <ul className="text-xs text-text-muted space-y-2 font-sans list-disc list-inside">
            <li>Strict retrieval grounding (no hallucinated law).</li>
            <li>Stable 1:1 numerical footnotes linked to Source Ledger.</li>
            <li>Safe abstention on out-of-scope inquiries.</li>
            <li>Bilingual English and Hindi output.</li>
          </ul>
        </div>

        <div className="rounded-xl bg-bg-surface border border-border p-5 space-y-3">
          <h3 className="font-heading text-base font-bold text-text flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brick" />
            <span>Scope & Limitations</span>
          </h3>
          <ul className="text-xs text-text-muted space-y-2 font-sans list-disc list-inside">
            <li>Curated statute & case study subset (MVP).</li>
            <li>Threshold-based confidence gate.</li>
            <li>Guidance tool, not a substitute for a registered Patent Agent.</li>
          </ul>
        </div>
      </div>

      {/* Staged Roadmap */}
      <div className="rounded-xl bg-bg-surface border border-border p-6 space-y-3">
        <h3 className="font-heading text-base font-bold text-text">
          Staged Roadmap (Future Enhancements)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-muted">
          <div className="p-3 rounded-lg bg-bg border border-border-subtle space-y-1">
            <span className="font-mono text-turmeric font-semibold block">Phase 2: TKDL Graph Connectors</span>
            <p>Direct API connectors to the Traditional Knowledge Digital Library and InPASS prior-art database.</p>
          </div>
          <div className="p-3 rounded-lg bg-bg border border-border-subtle space-y-1">
            <span className="font-mono text-turmeric font-semibold block">Phase 3: Multi-Indic & Voice</span>
            <p>Voice-enabled interfaces across all 22 scheduled Indian languages via Bhashini ASR and TTS.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
