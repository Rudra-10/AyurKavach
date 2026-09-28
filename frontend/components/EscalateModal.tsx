"use client";

import React, { useState } from "react";
import { UserCheck, X, Send, CheckCircle2 } from "lucide-react";

interface EscalateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  isOpen,
  onClose,
  initialQuestion = "",
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialQuestion);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-bg-surface border border-border p-6 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 text-turmeric font-heading text-lg font-bold">
          <UserCheck className="w-5 h-5 text-turmeric" />
          <span>Escalate to Human Legal Facilitator</span>
        </div>

        <p className="text-xs text-text-muted font-sans leading-relaxed">
          When statutory grounding is low or complex patent drafting is required, your query can be escalated to the <strong>Ayush Patent Facilitation Cell (APFC)</strong> or a certified Patent Agent.
        </p>

        {submitted ? (
          <div className="p-6 text-center space-y-2 bg-sage/15 border border-sage/40 rounded-lg text-sage-light font-mono text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-sage" />
            <p className="font-bold">Inquiry Forwarded Successfully!</p>
            <p className="text-[11px] text-text-muted">An Ayush IP facilitator will contact you at your provided email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">
                Your Name / Organization
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. A. Sharma / Herbals Ltd."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-bg border border-border text-text focus:outline-none focus:ring-1 focus:ring-turmeric"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">
                Official Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="innovator@ayurveda.org"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-bg border border-border text-text focus:outline-none focus:ring-1 focus:ring-turmeric"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">
                Query / Formulation Details
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-bg border border-border text-text focus:outline-none focus:ring-1 focus:ring-turmeric resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded text-xs font-mono text-text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-turmeric text-bg font-semibold text-xs hover:bg-turmeric-light transition-all focus:ring-2 focus:ring-turmeric"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Escalation</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
