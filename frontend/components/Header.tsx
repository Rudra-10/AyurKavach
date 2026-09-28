"use client";

import React from "react";
import { Jurisdiction, Language } from "../lib/types";
import { JurisdictionToggle } from "./JurisdictionToggle";
import { LanguageToggle } from "./LanguageToggle";

interface HeaderProps {
  jurisdiction: Jurisdiction;
  onJurisdictionChange: (jurisdiction: Jurisdiction) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  disabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  jurisdiction,
  onJurisdictionChange,
  language,
  onLanguageChange,
  disabled = false,
}) => {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-bg/95 backdrop-blur px-4 py-3 sm:px-6">
      <div className="mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Branding & Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-turmeric/40 bg-bg-surface font-heading text-lg font-bold text-turmeric shadow-inner">
            IP
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-text">
              IP-SAKTI Sahayak
            </h1>
            <p className="text-[11px] font-sans text-text-muted">
              Ayurveda Intellectual Property & Regulatory Compliance Assistant
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <JurisdictionToggle
            value={jurisdiction}
            onChange={onJurisdictionChange}
            disabled={disabled}
          />
          <LanguageToggle
            value={language}
            onChange={onLanguageChange}
            disabled={disabled}
          />
        </div>
      </div>
    </header>
  );
};
