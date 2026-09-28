"use client";

import React, { useState } from "react";
import { ClassifyResponse, FormulationCategory, NavTab } from "../../lib/types";
import { classifyFormulation } from "../../lib/api";
import { ScaleIcon } from "../icons/ScaleIcon";
import { AnswerBlock } from "../AnswerBlock";
import {
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";

interface AssessmentViewProps {
  onProfileCreated: (profile: ClassifyResponse) => void;
  onNavigateToChat: () => void;
  activeProfile?: ClassifyResponse | null;
}

const QUESTIONS = [
  {
    id: "q1_intended_use",
    title: "1. Primary Intended Use & Regulatory Classification",
    question: "What is the primary intended use and regulatory classification of your formulation?",
    options: [
      "Internal medicine for treating/curing diseases (Classical/Proprietary Drug)",
      "Dietary food supplement or wellness nutrition (Ayurveda-Aahar)",
      "Standardized purified plant fraction with 4+ bio-markers (Phytopharmaceutical)",
      "Topical skin, hair, or beauty care (Cosmetic)",
      "Synthetic chemical compound or novel non-traditional entity (New Drug)",
    ],
    helper: "Under Drugs & Cosmetics Act vs. FSSAI Regulations vs. Cosmetics Rules.",
  },
  {
    id: "q2_ingredients_source",
    title: "2. Formulation Ingredients & Compendia Source",
    question: "Are all ingredients and manufacturing recipes taken from authoritative Ayurvedic compendia (First Schedule)?",
    options: [
      "Yes, 100% classical recipe and traditional name (e.g., Triphala, Chyawanprash, Trikatu)",
      "Yes, classical ingredients, but modified proportions/dosage form under a brand name",
      "Contains newly isolated active fractions or non-classical botanicals",
      "Culinary herbs and foods prepared per Ayurvedic dietary principles",
    ],
    helper: "Authoritative books listed under First Schedule of Drugs and Cosmetics Act, 1940 (Charaka, Sushruta, Bhavaprakasha).",
  },
  {
    id: "q3_geographic_filing",
    title: "3. Target Filing Geography & Commercialization",
    question: "Where do you intend to manufacture and file for intellectual property (patents/trademarks)?",
    options: [
      "India only",
      "Both India and International patent offices (PCT / US / EU / WIPO)",
      "No patent intended; seeking commercial branding and trademark only",
    ],
    helper: "Foreign filing triggers mandatory Section 6(1) NBA prior approval under the Biological Diversity Act, 2002.",
  },
  {
    id: "q4_applicant_entity",
    title: "4. Applicant Entity & Ownership Structure",
    question: "What is the legal status and ownership of your manufacturing/filing entity?",
    options: [
      "Indian citizen or 100% Indian-owned company",
      "Entity with foreign shareholding, foreign management, or Non-Resident Indian participation",
      "Individual traditional practitioner (Vaid/Hakim) or local cultivator",
    ],
    helper: "Non-Indian shareholding requires Section 3(1) NBA prior approval before accessing biological resources in India.",
  },
];

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  onProfileCreated,
  onNavigateToChat,
  activeProfile,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [result, setResult] = useState<ClassifyResponse | null>(activeProfile || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleNext = async () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Submit for classification
      setIsLoading(true);
      setError(null);
      try {
        const response = await classifyFormulation({
          answers,
          profile_id: result?.profile_id || null,
        });
        setResult(response);
        onProfileCreated(response);
      } catch (err: any) {
        setError(err.message || "Failed to classify formulation");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
    setError(null);
  };

  const q = QUESTIONS[currentStep];
  const selectedOption = answers[q?.id];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-turmeric/10 border border-turmeric/30 text-turmeric-light text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-turmeric" />
          <span>Statutory Formulation Classifier & ABS Engine</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text">
          Product Regulatory & IP Assessment
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
          Classify your formulation into its statutory category, determine your patent posture, and generate your rule-based ABS compliance tree.
        </p>
      </div>

      {result ? (
        /* Result View: Formulation Profile Display */
        <div className="rounded-xl bg-bg-surface border border-border p-6 space-y-6 shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <span className="text-[10px] font-mono uppercase text-turmeric tracking-wider block mb-1">
                Formulation Profile Created • ID: {result.profile_id}
              </span>
              <h2 className="font-heading text-xl font-bold text-text">
                {result.category_name || result.category?.toUpperCase()}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-turmeric/15 border border-turmeric/40 text-turmeric-light text-xs font-mono font-semibold">
                {result.category?.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-muted hover:text-text rounded border border-border bg-bg transition-colors"
                title="Re-classify formulation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Re-assess</span>
              </button>
            </div>
          </div>

          {/* IP Posture Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase text-text-muted tracking-wide flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-turmeric" />
              <span>Grounded IP & Regulatory Posture:</span>
            </h3>
            <div className="p-4 rounded-lg bg-bg border border-border-subtle">
              <AnswerBlock content={result.ip_posture_summary} />
            </div>
          </div>

          {/* ABS Requirement Helper */}
          {result.abs_requirement && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase text-text-muted tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-turmeric" />
                <span>ABS Compliance Tree & Form Requirement:</span>
              </h3>
              <div className="p-4 rounded-lg bg-turmeric/10 border border-turmeric/30 text-xs text-text font-sans leading-relaxed">
                {result.abs_requirement}
              </div>
            </div>
          )}

          {/* TKDL Defensive Pointer */}
          {result.tkdl_prior_art_pointer && (
            <div className="p-3.5 rounded-lg bg-brick/10 border-l-4 border-l-brick border-y border-r border-border space-y-1">
              <div className="flex items-center gap-2 text-brick-light text-xs font-semibold uppercase font-mono">
                <ScaleIcon className="w-4 h-4 text-brick" />
                <span>TKDL Prior-Art Pointer</span>
              </div>
              <p className="text-xs text-text leading-relaxed font-sans">
                {result.tkdl_prior_art_pointer}
              </p>
            </div>
          )}

          {/* Action to launch scoped chat */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToChat}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-turmeric text-bg font-semibold text-sm hover:bg-turmeric-light transition-all shadow-md focus:ring-2 focus:ring-turmeric"
            >
              <span>Ask IP-SAKTI Chat (Scoped to this Profile)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Guided Questionnaire Step Card */
        <div className="rounded-xl bg-bg-surface border border-border p-6 space-y-6 shadow-lg">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-text-muted">
              <span>Step {currentStep + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}% Completed</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-bg overflow-hidden border border-border">
              <div
                className="h-full bg-turmeric transition-all duration-300"
                style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Title & Prompt */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-turmeric uppercase tracking-wider">
              {q.title}
            </span>
            <h2 className="font-heading text-lg font-bold text-text">
              {q.question}
            </h2>
            {q.helper && (
              <p className="text-xs text-text-muted font-sans flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-text-muted/70 flex-shrink-0" />
                <span>{q.helper}</span>
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(q.id, opt)}
                  className={`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 focus:outline-none focus:ring-1 focus:ring-turmeric ${
                    isSelected
                      ? "bg-turmeric/15 border-turmeric text-text shadow-sm"
                      : "bg-bg border-border text-text-muted hover:text-text hover:bg-bg-elevated hover:border-border"
                  }`}
                >
                  <span>{opt}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "border-turmeric bg-turmeric" : "border-border"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-bg" />}
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3 rounded bg-brick/15 border border-brick/40 text-brick-light text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0 || isLoading}
              className="px-4 py-2 rounded text-xs font-mono text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedOption || isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-turmeric text-bg font-semibold text-xs hover:bg-turmeric-light transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2 focus:ring-turmeric"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Profile...</span>
                </>
              ) : currentStep === QUESTIONS.length - 1 ? (
                <>
                  <span>Complete & Generate Profile</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
