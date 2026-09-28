import React from "react";
import { parseFootnotes } from "../lib/citations";
import { Footnote } from "./Footnote";

interface AnswerBlockProps {
  content: string;
  onFootnoteClick?: (id: number) => void;
  className?: string;
}

export const AnswerBlock: React.FC<AnswerBlockProps> = ({
  content,
  onFootnoteClick,
  className = "",
}) => {
  const segments = parseFootnotes(content);

  return (
    <div className={`text-text text-sm leading-relaxed font-sans ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === "footnote" && segment.footnoteId !== undefined) {
          return (
            <Footnote
              key={index}
              id={segment.footnoteId}
              onClick={onFootnoteClick}
            />
          );
        }
        return <span key={index}>{segment.value}</span>;
      })}
    </div>
  );
};
