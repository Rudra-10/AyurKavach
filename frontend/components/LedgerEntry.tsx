"use client";

import React, { useState } from "react";
import { Citation } from "../lib/types";

interface LedgerEntryProps {
  citation: Citation;
  isHighlighted?: boolean;
}

export const LedgerEntry: React.FC<LedgerEntryProps> = ({
  citation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Left color bar by jurisdiction
  const isIndia = citation.jurisdiction === "india";
  const barColor = isIndia ? "border-l-turmeric" : "border-l-teal";

  return (
    <div
      id={`ledger-entry-${citation.id}`}
      onClick={() => setIsExpanded((prev) => !prev)}
      className={`group relative p-2.5 rounded-r bg-bg-surface border-y border-r border-border border-l-4 ${barColor} cursor-pointer transition-all hover:bg-bg-elevated focus-within:ring-1 focus-within:ring-turmeric mb-2`}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`Citation ${citation.id}: ${citation.source} Section ${citation.section}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsExpanded((prev) => !prev);
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-semibold text-turmeric px-1.5 py-0.5 rounded bg-bg">
            [{citation.id}]
          </span>
          <span className="text-xs font-medium text-text truncate">
            {citation.source}
          </span>
          <span className="text-xs text-text-muted font-mono whitespace-nowrap">
            — Sec. {citation.section}
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono text-text-muted/70 tracking-wider hidden sm:inline">
          {citation.jurisdiction}
        </span>
      </div>

      {/* Expandable Snippet on Click or Hover */}
      <div
        className={`mt-2 text-xs text-text-muted font-mono leading-relaxed bg-bg/70 p-2 rounded border border-border-subtle transition-all duration-200 ${
          isExpanded ? "block opacity-100" : "hidden group-hover:block opacity-90"
        }`}
      >
        <span className="text-text font-semibold block mb-0.5">Excerpt:</span>
        "{citation.text_snippet}"
      </div>
    </div>
  );
};
