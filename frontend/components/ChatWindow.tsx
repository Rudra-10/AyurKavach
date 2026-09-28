"use client";

import React from "react";
import { ChatTurn } from "../lib/types";
import { AnswerBlock } from "./AnswerBlock";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ConflictCallout } from "./ConflictCallout";
import { TurnDivider } from "./TurnDivider";
import { AlertCircle, Bot, User, UserCheck } from "lucide-react";

interface ChatWindowProps {
  turns: ChatTurn[];
  selectedTurnId?: string | null;
  onSelectTurn?: (turnId: string) => void;
  onFootnoteClick?: (citationId: number, turnId: string) => void;
  onEscalate?: (question: string) => void;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  turns,
  selectedTurnId,
  onSelectTurn,
  onFootnoteClick,
  onEscalate,
  className = "",
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {turns.map((turn, index) => {
        const isSelected = selectedTurnId === turn.id || (!selectedTurnId && index === turns.length - 1);
        const isLowConfidence = turn.response?.confidence === "low";
        const isInsufficientGrounding =
          turn.response?.answer?.toLowerCase().includes("does not provide sufficient grounding") ||
          turn.response?.answer?.toLowerCase().includes("scope of ayurveda ip");

        return (
          <div
            key={turn.id}
            onClick={() => onSelectTurn && onSelectTurn(turn.id)}
            className={`space-y-4 rounded-xl p-2 sm:p-3 transition-colors ${
              isSelected ? "bg-bg-elevated/25 ring-1 ring-border" : "hover:bg-bg-surface/40"
            }`}
          >
            {/* User Query Bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-[85%] rounded-lg bg-bg-surface border border-border p-3.5 shadow-sm">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-bg text-text-muted">
                    {turn.jurisdiction} • {turn.lang.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-text flex items-center gap-1">
                    You <User className="w-3.5 h-3.5 text-turmeric" />
                  </span>
                </div>
                <p className="text-sm text-text font-sans leading-relaxed text-right">
                  {turn.question}
                </p>
              </div>
            </div>

            {/* Assistant Response */}
            <div className="flex items-start gap-3">
              <div className="w-full rounded-lg bg-bg-surface border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-turmeric/10 border border-turmeric/30 text-turmeric">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-text">
                      IP-SAKTI Sahayak
                    </span>
                  </div>
                  {turn.response?.confidence && (
                    <ConfidenceBadge confidence={turn.response.confidence} />
                  )}
                </div>

                {/* Streaming or Final Prose Content */}
                {turn.response?.answer ? (
                  <AnswerBlock
                    content={turn.response.answer}
                    onFootnoteClick={(citId) => onFootnoteClick && onFootnoteClick(citId, turn.id)}
                  />
                ) : turn.streamedText ? (
                  <AnswerBlock
                    content={turn.streamedText}
                    onFootnoteClick={(citId) => onFootnoteClick && onFootnoteClick(citId, turn.id)}
                  />
                ) : turn.isLoading ? (
                  <div className="flex items-center gap-2 py-4 text-xs font-mono text-text-muted">
                    <span className="inline-block w-2 h-2 rounded-full bg-turmeric animate-ping" />
                    <span>Retrieving legal statutes & synthesizing answer...</span>
                  </div>
                ) : null}

                {/* Cross-Regime Conflict Callout */}
                {turn.response?.conflict_flag && turn.response.conflict_note && (
                  <ConflictCallout note={turn.response.conflict_note} />
                )}

                {/* Escalate to Human Facilitator CTA (shown on low confidence or safe abstention) */}
                {(isLowConfidence || isInsufficientGrounding) && onEscalate && (
                  <div className="mt-4 p-3 rounded-lg bg-bg border border-turmeric/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="text-text-muted font-sans">
                      Need custom patent drafting or registered attorney assistance?
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEscalate(turn.question);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-turmeric/15 border border-turmeric/40 text-turmeric-light font-mono font-semibold hover:bg-turmeric hover:text-bg transition-colors flex-shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Escalate to Human Facilitator</span>
                    </button>
                  </div>
                )}

                {/* Error State */}
                {turn.error && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded bg-brick/15 border border-brick/40 text-brick-light text-xs font-mono">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-brick mt-0.5" />
                    <div>
                      <span className="font-semibold block mb-0.5">Error:</span>
                      {turn.error}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Turn Divider if not the last turn */}
            {index < turns.length - 1 && <TurnDivider />}
          </div>
        );
      })}
    </div>
  );
};
