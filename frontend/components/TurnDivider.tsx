import React from "react";

export const TurnDivider: React.FC = () => {
  return (
    <div className="relative my-8" role="separator" aria-orientation="horizontal">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-bg px-3 text-[11px] font-mono uppercase tracking-widest text-text-muted/60">
          Turn Completed
        </span>
      </div>
    </div>
  );
};
