import React from "react";
import { Jurisdiction } from "../lib/types";

interface JurisdictionToggleProps {
  value: Jurisdiction;
  onChange: (jurisdiction: Jurisdiction) => void;
  disabled?: boolean;
}

export const JurisdictionToggle: React.FC<JurisdictionToggleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const options: { id: Jurisdiction; label: string }[] = [
    { id: "india", label: "India" },
    { id: "international", label: "International" },
    { id: "both", label: "Both" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Jurisdiction selector"
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
