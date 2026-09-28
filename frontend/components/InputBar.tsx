"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

interface InputBarProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({
  onSubmit,
  isLoading,
  disabled = false,
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    onSubmit(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <div className="relative flex items-end rounded-lg border border-border bg-bg-surface p-2 shadow-lg focus-within:border-turmeric/70 focus-within:ring-1 focus-within:ring-turmeric/50 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question on Ayurveda IP, TKDL, patentability, NBA approvals, or export..."
          rows={1}
          disabled={isLoading || disabled}
          className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-text placeholder-text-muted/60 focus:outline-none disabled:opacity-50 font-sans"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          aria-label="Send Query"
          className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-turmeric text-bg font-semibold transition-all hover:bg-turmeric-light disabled:opacity-30 disabled:hover:bg-turmeric focus:outline-none focus:ring-1 focus:ring-turmeric"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-bg" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
};
