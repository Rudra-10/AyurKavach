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
  const options: { id: Language; label: string }[] = [
    { id: "en", label: "English" },
    { id: "hi", label: "हिन्दी" },
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
            className={`px-3 py-1 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-turmeric ${
              isActive
                ? "bg-bg-elevated text-text font-semibold shadow-sm border border-border"
                : "text-text-muted hover:text-text hover:bg-bg/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
