"use client";

import React, { useState, useRef, useEffect } from "react";
import { Header } from "../components/Header";
import { ChatWindow } from "../components/ChatWindow";
import { SourceLedger } from "../components/SourceLedger";
import { SuggestedQuestions } from "../components/SuggestedQuestions";
import { InputBar } from "../components/InputBar";
import { DisclaimerFooter } from "../components/DisclaimerFooter";
import { EscalateModal } from "../components/EscalateModal";
import { HomeView } from "../components/views/HomeView";
import { AssessmentView } from "../components/views/AssessmentView";
import { KnowledgeSourcesView } from "../components/views/KnowledgeSourcesView";
import { AboutView } from "../components/views/AboutView";
import {
  ChatTurn,
  Citation,
  ClassifyResponse,
  Jurisdiction,
  Language,
  NavTab,
} from "../lib/types";
import { streamQuery } from "../lib/api";
import { BookOpen, Sparkles, Layers, ShieldCheck } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("both");
  const [language, setLanguage] = useState<Language>("en");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMobileLedgerOpen, setIsMobileLedgerOpen] = useState<boolean>(false);

  // Formulation Profile state
  const [activeProfile, setActiveProfile] = useState<ClassifyResponse | null>(null);

  // Escalation Modal state
  const [isEscalateOpen, setIsEscalateOpen] = useState<boolean>(false);
  const [escalateQuery, setEscalateQuery] = useState<string>("");

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window when new turns or tokens arrive
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [turns, activeTab]);

  // Derive active citations based on selected turn, defaulting to latest turn
  const activeTurn =
    turns.find((t) => t.id === selectedTurnId) || turns[turns.length - 1];
  const activeCitations: Citation[] =
    activeTurn?.response?.citations || activeProfile?.citations || [];

  const handleSendQuery = async (
    questionText: string,
    targetJurisdiction = jurisdiction,
    targetLang = language
  ) => {
    // Switch to chat tab if query submitted from elsewhere
    setActiveTab("chat");

    const turnId = `turn-${Date.now()}`;
    const newTurn: ChatTurn = {
      id: turnId,
      question: questionText,
      jurisdiction: targetJurisdiction,
      lang: targetLang,
      profile_id: activeProfile?.profile_id || null,
      isLoading: true,
      streamedText: "",
    };

    setTurns((prev) => [...prev, newTurn]);
    setSelectedTurnId(turnId);
    setIsLoading(true);

    await streamQuery(
      {
        question: questionText,
        jurisdiction: targetJurisdiction,
        lang: targetLang,
        profile_id: activeProfile?.profile_id || null,
      },
      {
        onToken: (token) => {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId
                ? { ...t, streamedText: (t.streamedText || "") + token }
                : t
            )
          );
        },
        onFinal: (response) => {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId
                ? { ...t, isLoading: false, response, streamedText: undefined }
                : t
            )
          );
          setIsLoading(false);
        },
        onError: (err) => {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId
                ? {
                    ...t,
                    isLoading: false,
                    error: err.message || "Failed to retrieve grounded answer",
                  }
                : t
            )
          );
          setIsLoading(false);
        },
      }
    );
  };

  const handleFootnoteClick = (citationId: number, turnId: string) => {
    setSelectedTurnId(turnId);
    setIsMobileLedgerOpen(true);
    setTimeout(() => {
      const element = document.getElementById(`ledger-entry-${citationId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.remove("flash-highlight");
        void element.offsetWidth;
        element.classList.add("flash-highlight");
      }
    }, 150);
  };

  const handleEscalate = (query: string) => {
    setEscalateQuery(query);
    setIsEscalateOpen(true);
  };

  return (
    <div className="flex h-screen flex-col bg-bg text-text bg-ledger-texture overflow-hidden">
      {/* Top Header with Multi-Tab Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        jurisdiction={jurisdiction}
        onJurisdictionChange={setJurisdiction}
        language={language}
        onLanguageChange={setLanguage}
        activeProfileName={activeProfile?.category_name || activeProfile?.category}
        onClearProfile={() => setActiveProfile(null)}
        disabled={isLoading}
      />

      {/* Main Multi-Tab Viewport */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "home" && (
          <HomeView
            onNavigate={setActiveTab}
            activeProfileName={activeProfile?.category_name || activeProfile?.category}
          />
        )}

        {activeTab === "assessment" && (
          <AssessmentView
            onProfileCreated={(prof) => setActiveProfile(prof)}
            onNavigateToChat={() => setActiveTab("chat")}
            activeProfile={activeProfile}
          />
        )}

        {activeTab === "sources" && <KnowledgeSourcesView />}

        {activeTab === "about" && <AboutView />}

        {activeTab === "chat" && (
          <>
            {/* Left Answers & Chat Column */}
            <main className="flex flex-1 flex-col overflow-hidden relative">
              {/* Profile Scoping Banner if profile active */}
              {activeProfile && (
                <div className="bg-bg-elevated/80 border-b border-border px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-turmeric inline-block" />
                    <span className="text-turmeric-light font-semibold">
                      Answers scoped to Profile: {activeProfile.category_name}
                    </span>
                    <span className="text-text-muted hidden sm:inline">
                      (ID: {activeProfile.profile_id})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveProfile(null)}
                    className="text-[11px] text-text-muted hover:text-brick"
                  >
                    Clear Scope
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {turns.length === 0 ? (
                  /* Clean Default / Empty State */
                  <div className="mx-auto max-w-2xl py-6 sm:py-10 space-y-6">
                    <div className="text-center space-y-2.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-turmeric/10 border border-turmeric/30 text-turmeric-light text-xs font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-turmeric" />
                        <span>Source-Cited • Cross-Regime • Bilingual</span>
                      </div>
                      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-text">
                        Ask IP-SAKTI Legal Assistant
                      </h2>
                      <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                        Inquire about patent exclusions, foreign filings, TKDL prior art, FSSAI Ayurveda-Aahar, and ABS compliance.
                      </p>
                    </div>

                    <SuggestedQuestions
                      onSelectQuestion={(q, j, l) => {
                        setJurisdiction(j);
                        setLanguage(l);
                        handleSendQuery(q, j, l);
                      }}
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl">
                    <ChatWindow
                      turns={turns}
                      selectedTurnId={selectedTurnId}
                      onSelectTurn={setSelectedTurnId}
                      onFootnoteClick={handleFootnoteClick}
                      onEscalate={handleEscalate}
                    />
                    <div ref={chatBottomRef} />
                  </div>
                )}
              </div>

              {/* Bottom Fixed Query Input Bar */}
              <div className="border-t border-border bg-bg/95 backdrop-blur p-4">
                <div className="mx-auto max-w-3xl flex items-center gap-2">
                  <InputBar
                    onSubmit={(q) => handleSendQuery(q)}
                    isLoading={isLoading}
                  />
                  {/* Mobile button to toggle Source Ledger */}
                  <button
                    type="button"
                    onClick={() => setIsMobileLedgerOpen((prev) => !prev)}
                    className="md:hidden flex h-10 px-3 items-center gap-1.5 rounded-lg border border-border bg-bg-surface text-xs font-mono text-text-muted hover:text-text focus:ring-1 focus:ring-turmeric flex-shrink-0"
                    aria-label="Toggle Source Ledger"
                  >
                    <BookOpen className="w-4 h-4 text-turmeric" />
                    <span>Ledger ({activeCitations.length})</span>
                  </button>
                </div>
              </div>
            </main>

            {/* Right Source Ledger Column (Desktop) */}
            <div className="hidden md:block w-80 lg:w-96 flex-shrink-0">
              <SourceLedger citations={activeCitations} />
            </div>
          </>
        )}
      </div>

      {/* Mobile Bottom-Sheet Source Ledger (for chat tab) */}
      {isMobileLedgerOpen && activeTab === "chat" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-bg/80 backdrop-blur-sm md:hidden">
          <div
            className="flex-1"
            onClick={() => setIsMobileLedgerOpen(false)}
          />
          <div className="h-[70vh] w-full rounded-t-xl bg-bg-surface border-t border-border shadow-2xl overflow-hidden flex flex-col">
            <SourceLedger
              citations={activeCitations}
              isOpenMobile={true}
              onCloseMobile={() => setIsMobileLedgerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Escalate to Human Facilitator Modal */}
      <EscalateModal
        isOpen={isEscalateOpen}
        onClose={() => setIsEscalateOpen(false)}
        initialQuestion={escalateQuery}
      />

      {/* Single Persistent Disclaimer Footer with DPDP Note */}
      <DisclaimerFooter />
    </div>
  );
}
