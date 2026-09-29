export type Jurisdiction = "india" | "international" | "both";
export type Language = "en" | "hi";
export type Confidence = "high" | "medium" | "low";
export type NavTab = "home" | "assessment" | "chat" | "sources" | "about";

export type FormulationCategory =
  | "classical"
  | "proprietary"
  | "new_drug"
  | "phytopharmaceutical"
  | "ayurveda_aahar"
  | "cosmetic";

export interface Citation {
  id: number;
  source: string;
  section: string;
  jurisdiction: "india" | "international";
  text_snippet: string;
  chunk_id: string;
}

export interface QueryResponse {
  answer: string;
  citations: Citation[];
  confidence: Confidence;
  conflict_flag: boolean;
  conflict_note: string | null;
}

export interface QueryRequest {
  question: string;
  jurisdiction: Jurisdiction;
  lang: Language;
  profile_id?: string | null;
}

export interface NextQuestion {
  id: string;
  question: string;
  options: string[];
  helper_text?: string | null;
}

export interface ClassifyRequest {
  answers: Record<string, any>;
  profile_id?: string | null;
}

export interface ClassifyResponse {
  profile_id: string;
  category?: FormulationCategory | null;
  category_name?: string | null;
  ip_posture_summary: string;
  citations: Citation[];
  abs_requirement?: string | null;
  tkdl_prior_art_pointer?: string | null;
  next_questions?: NextQuestion[] | null;
}

export interface FormulationProfile {
  profile_id: string;
  category: FormulationCategory;
  category_name: string;
  answers: Record<string, any>;
  ip_posture_summary: string;
  abs_requirement?: string | null;
  tkdl_prior_art_pointer?: string | null;
  citations: Citation[];
}

export interface ChatTurn {
  id: string;
  question: string;
  jurisdiction: Jurisdiction;
  lang: Language;
  profile_id?: string | null;
  response?: QueryResponse;
  streamedText?: string;
  isLoading: boolean;
  error?: string;
}

export interface KnowledgeSourceItem {
  document_name: string;
  jurisdiction: string;
  year: number;
  source_url: string;
  file_path: string;
}
