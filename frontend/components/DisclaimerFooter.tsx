import React from "react";

export const DisclaimerFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-bg/95 py-2 px-4 text-center space-y-0.5">
      {/* <p className="text-[11px] font-mono text-text-muted/80 tracking-wide">
        Information, not legal advice. Verify against the cited source before filing.
      </p> */}
      <p className="text-[10px] font-mono text-text-muted/60 tracking-wider">
        DPDP Alignment: No personal or proprietary formulation data is retained beyond this session.
      </p>
    </footer>
  );
};
