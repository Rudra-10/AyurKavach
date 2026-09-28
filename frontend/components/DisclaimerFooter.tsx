import React from "react";

export const DisclaimerFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-bg/95 py-2 px-4 text-center">
      <p className="text-[11px] font-mono text-text-muted/70 tracking-wide">
        Information, not legal advice. Verify against the cited source before filing.
      </p>
    </footer>
  );
};
