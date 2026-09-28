import React from "react";
import { Language } from "../lib/types";

interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
  disabled?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const options: { id: Language; label: string; badge?: string }[] = [
    { id: "en", label: "English" },
    { id: "hi", label: "हिन्दी", badge: "Bhashini" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Language selector"
      className="inline-flex p-0.5 rounded border border-border bg-bg-surface"
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            title={opt.badge ? `Bilingual synthesis via Bhashini NMT / LLM native fallback` : "English language response"}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-turmeric ${
              isActive
                ? "bg-bg-elevated text-text font-semibold shadow-sm border border-border"
                : "text-text-muted hover:text-text hover:bg-bg/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span>{opt.label}</span>
            {opt.badge && (
              <span className="text-[8px] uppercase font-mono px-1 py-0.2 rounded bg-turmeric/20 text-turmeric-light font-bold">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
