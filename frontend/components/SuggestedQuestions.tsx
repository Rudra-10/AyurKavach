import React from "react";
import { Jurisdiction, Language } from "../lib/types";

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string, jurisdiction: Jurisdiction, lang: Language) => void;
  disabled?: boolean;
}

interface QuestionItem {
  id: number;
  label: string;
  question: string;
  jurisdiction: Jurisdiction;
  lang: Language;
}

const SUGGESTIONS: QuestionItem[] = [
  {
    id: 1,
    label: "Turmeric Patentability (Sec. 3(p)/3(d))",
    question: "Can I patent an Ayurvedic formulation using turmeric?",
    jurisdiction: "india",
    lang: "en",
  },
  {
    id: 2,
    label: "Foreign Filing & NBA Approvals",
    question: "What approvals do I need before filing abroad for a formulation using Indian medicinal plants?",
    jurisdiction: "both",
    lang: "en",
  },
  {
    id: 3,
    label: "India vs. EU Traditional Medicine",
    question: "How do India and the EU differ on patentability of traditional herbal medicine?",
    jurisdiction: "both",
    lang: "en",
  },
  {
    id: 4,
    label: "ABS Export Compliance",
    question: "Do I need ABS approval to export a herbal product?",
    jurisdiction: "india",
    lang: "en",
  },
  {
    id: 5,
    label: "Drugs & Cosmetics Act Classification",
    question: "How is my Ayurvedic formulation classified under the Drugs & Cosmetics Act?",
    jurisdiction: "india",
    lang: "en",
  },
  {
    id: 6,
    label: "हल्दी पेटेंट पात्रता (Hindi Demo)",
    question: "क्या मैं हल्दी का उपयोग करके आयुर्वेदिक फॉर्मूलेशन का पेटेंट करा सकता हूँ?",
    jurisdiction: "india",
    lang: "hi",
  },
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <div className="text-xs font-mono text-text-muted mb-2 tracking-wide uppercase">
        Suggested Inquiries:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(item.question, item.jurisdiction, item.lang)}
            className="text-left px-3 py-2 rounded bg-bg-surface border border-border hover:border-turmeric/60 hover:bg-bg-elevated transition-all text-xs text-text font-medium group focus:outline-none focus:ring-1 focus:ring-turmeric disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="font-semibold text-text group-hover:text-turmeric transition-colors">
                {item.label}
              </span>
              <span className="text-[10px] font-mono text-text-muted uppercase">
                {item.jurisdiction}
              </span>
            </div>
            <p className="text-text-muted text-[11px] line-clamp-1">
              "{item.question}"
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
