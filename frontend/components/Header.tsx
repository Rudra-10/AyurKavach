"use client";

import React from "react";
import { Jurisdiction, Language, NavTab } from "../lib/types";
import { JurisdictionToggle } from "./JurisdictionToggle";
import { LanguageToggle } from "./LanguageToggle";
import { Sparkles, Layers, MessageSquare, BookOpen, Info, Home as HomeIcon } from "lucide-react";

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  jurisdiction: Jurisdiction;
  onJurisdictionChange: (jurisdiction: Jurisdiction) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeProfileName?: string | null;
  onClearProfile?: () => void;
  disabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  jurisdiction,
  onJurisdictionChange,
  language,
  onLanguageChange,
  activeProfileName,
  onClearProfile,
  disabled = false,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <HomeIcon className="w-3.5 h-3.5" /> },
    { id: "assessment", label: "Product Assessment", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "chat", label: "Ask IP-SAKTI", icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: "sources", label: "Knowledge Sources", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "about", label: "About", icon: <Info className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-bg/95 backdrop-blur px-3 py-2.5 sm:px-6">
      <div className="mx-auto flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand & Active Profile */}
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={() => onSelectTab("home")}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded border border-turmeric/40 bg-bg-surface font-heading text-base font-bold text-turmeric shadow-inner">
              IP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-base font-bold tracking-tight text-text">
                  IP-SAKTI Sahayak
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-turmeric/10 border border-turmeric/30 text-turmeric-light">
                  SIH26045
                </span>
              </div>
              <p className="text-[10px] font-sans text-text-muted hidden sm:block">
                Ayurveda IP & Regulatory Assistant
              </p>
            </div>
          </div>

          {/* Active Profile Pill (if configured) */}
          {activeProfileName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-surface border border-turmeric/40 text-[11px] font-mono text-text">
              <span className="w-1.5 h-1.5 rounded-full bg-turmeric animate-pulse" />
              <span className="max-w-[120px] sm:max-w-[180px] truncate">
                {activeProfileName}
              </span>
              {onClearProfile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearProfile();
                  }}
                  className="text-[10px] text-text-muted hover:text-brick ml-1"
                  title="Clear active profile"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav
          role="tablist"
          aria-label="Main Navigation"
          className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-turmeric ${
                  isActive
                    ? "bg-bg-elevated text-text font-semibold shadow-sm border border-border"
                    : "text-text-muted hover:text-text hover:bg-bg-surface/60"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Controls: Jurisdiction & Language */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
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
