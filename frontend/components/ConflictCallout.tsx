import React from "react";
import { ScaleIcon } from "./icons/ScaleIcon";

interface ConflictCalloutProps {
  note: string | null;
  className?: string;
}

export const ConflictCallout: React.FC<ConflictCalloutProps> = ({
  note,
  className = "",
}) => {
  if (!note) return null;

  return (
    <div
      role="region"
      aria-label="Cross-Regime Conflict or Compliance Gap Note"
      className={`relative mt-4 p-3.5 rounded-r bg-brick/10 border-l-4 border-l-brick border-y border-r border-border ${className}`}
    >
      <div className="flex items-center gap-2 mb-1.5 text-brick-light font-semibold text-xs tracking-wide uppercase">
        <ScaleIcon className="w-4 h-4 text-brick" />
        <span>Cross-Regime Note</span>
      </div>
      <p className="text-sm text-text leading-relaxed font-sans">{note}</p>
    </div>
  );
};
