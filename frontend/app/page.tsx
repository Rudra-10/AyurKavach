"use client";

import React, { useState, useRef, useEffect } from "react";
import { Header } from "../components/Header";
import { ChatWindow } from "../components/ChatWindow";
import { SourceLedger } from "../components/SourceLedger";
import { SuggestedQuestions } from "../components/SuggestedQuestions";
import { InputBar } from "../components/InputBar";
import { DisclaimerFooter } from "../components/DisclaimerFooter";
import { ChatTurn, Citation, Jurisdiction, Language } from "../lib/types";
import { streamQuery } from "../lib/api";
import { BookOpen, Sparkles } from "lucide-react";

export default function Home() {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("both");
  const [language, setLanguage] = useState<Language>("en");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMobileLedgerOpen, setIsMobileLedgerOpen] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window when new turns or tokens arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // Derive active citations based on selected turn, defaulting to latest turn
  const activeTurn = turns.find((t) => t.id === selectedTurnId) || turns[turns.length - 1];
  const activeCitations: Citation[] = activeTurn?.response?.citations || [];

  const handleSendQuery = async (
    questionText: string,
    targetJurisdiction = jurisdiction,
    targetLang = language
  ) => {
    const turnId = `turn-${Date.now()}`;
    const newTurn: ChatTurn = {
      id: turnId,
      question: questionText,
      jurisdiction: targetJurisdiction,
      lang: targetLang,
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
        // Trigger reflow to restart CSS keyframe animation
        void element.offsetWidth;
        element.classList.add("flash-highlight");
      }
    }, 150);
  };

  return (
    <div className="flex h-screen flex-col bg-bg text-text bg-ledger-texture overflow-hidden">
      {/* Top Header */}
      <Header
        jurisdiction={jurisdiction}
        onJurisdictionChange={setJurisdiction}
        language={language}
        onLanguageChange={setLanguage}
        disabled={isLoading}
      />

      {/* Main Workspace: Left Chat Pane, Right Ledger Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Answers & Chat Column */}
        <main className="flex flex-1 flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {turns.length === 0 ? (
              /* Clean Default / Empty State */
              <div className="mx-auto max-w-2xl py-8 sm:py-12 space-y-8">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-turmeric/10 border border-turmeric/30 text-turmeric-light text-xs font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-turmeric" />
                    <span>Multilingual • Source-Cited • Cross-Regime RAG</span>
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-text">
                    Ayurveda IP & Regulatory Intelligence
                  </h2>
                  <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                    Ask questions across Indian statutes (Patents Act, Biological Diversity Act, Drugs & Cosmetics Act) and International treaties (TRIPS, Nagoya Protocol, WIPO GRATK).
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
      </div>

      {/* Mobile Bottom-Sheet Source Ledger */}
      {isMobileLedgerOpen && (
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

      {/* Single Persistent Disclaimer Footer */}
      <DisclaimerFooter />
    </div>
  );
}
