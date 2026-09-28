"use client";

import React from "react";
import { Citation } from "../lib/types";
import { deduplicateCitations } from "../lib/citations";
import { LedgerEntry } from "./LedgerEntry";

interface SourceLedgerProps {
  citations: Citation[];
  className?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const SourceLedger: React.FC<SourceLedgerProps> = ({
  citations,
  className = "",
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const uniqueCitations = deduplicateCitations(citations);

  return (
    <aside
      aria-label="Source Ledger"
      className={`flex flex-col h-full bg-bg-surface border-l border-border p-4 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-base font-bold text-text tracking-wide">
            Source Ledger
          </h2>
          <span className="font-mono text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg border border-border">
            {uniqueCitations.length} {uniqueCitations.length === 1 ? "source" : "sources"}
          </span>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden text-xs text-text-muted hover:text-text px-2 py-1 rounded bg-bg border border-border"
          >
            Close
          </button>
        )}
      </div>

      {/* Citations List / Empty State */}
      <div className="flex-1 overflow-y-auto pr-1">
        {uniqueCitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-text-muted p-4">
            <span className="font-mono text-xs mb-1 text-text-muted/60">
              [No active citations]
            </span>
            <p className="text-xs">
              Retrieved legal statutes and statutory excerpts will appear here synchronized with answer footnotes.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 text-[10px] uppercase font-mono text-text-muted mb-2 px-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-turmeric inline-block" />
                India
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal inline-block" />
                International
              </span>
            </div>
            {uniqueCitations.map((citation) => (
              <LedgerEntry key={citation.chunk_id || citation.id} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
