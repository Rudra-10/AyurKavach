import React from "react";
import { Confidence } from "../lib/types";

interface ConfidenceBadgeProps {
  confidence: Confidence;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  className = "",
}) => {
  const config = {
    high: {
      label: "High Confidence",
      border: "border-sage/40",
      bg: "bg-sage/10",
      text: "text-sage-light",
      indicator: "bg-sage",
    },
    medium: {
      label: "Medium Confidence",
      border: "border-turmeric/40",
      bg: "bg-turmeric/10",
      text: "text-turmeric-light",
      indicator: "bg-turmeric",
    },
    low: {
      label: "Low Confidence",
      border: "border-brick/40",
      bg: "bg-brick/10",
      text: "text-brick-light",
      indicator: "bg-brick",
    },
  }[confidence];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono border ${config.border} ${config.bg} ${config.text} ${className}`}
      title={`Retrieval grounding score indicates ${confidence} confidence`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.indicator}`} />
      <span>{config.label}</span>
    </div>
  );
};
