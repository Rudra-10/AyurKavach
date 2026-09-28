import React from "react";

interface FootnoteProps {
  id: number;
  onClick?: (id: number) => void;
}

export const Footnote: React.FC<FootnoteProps> = ({ id, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(id);
    } else {
      const element = document.getElementById(`ledger-entry-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.remove("flash-highlight");
        // Force reflow
        void element.offsetWidth;
        element.classList.add("flash-highlight");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Jump to citation [${id}] in Source Ledger`}
      className="inline-flex items-center justify-center px-1 text-[11px] font-mono font-semibold text-turmeric hover:text-turmeric-light hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-turmeric rounded mx-0.5 align-super"
    >
      [{id}]
    </button>
  );
};
