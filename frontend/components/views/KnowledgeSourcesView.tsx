"use client";

import React, { useState } from "react";
import { KnowledgeSourceItem } from "../../lib/types";
import { ExternalLink, Search, Filter, BookOpen } from "lucide-react";

// Curated metadata records mirroring corpus/metadata.csv
const METADATA_SOURCES: KnowledgeSourceItem[] = [
  {
    document_name: "Patents Act, 1970",
    jurisdiction: "india",
    year: 1970,
    source_url: "https://ipindia.gov.in/patents.htm",
    file_path: "corpus/india/patents_act_1970.txt",
  },
  {
    document_name: "Biological Diversity Act, 2002",
    jurisdiction: "india",
    year: 2002,
    source_url: "https://nbaindia.org/act/",
    file_path: "corpus/india/biological_diversity_act_2002.txt",
  },
  {
    document_name: "Drugs and Cosmetics Act, 1940",
    jurisdiction: "india",
    year: 1940,
    source_url: "https://cdsco.gov.in/opencms/opencms/en/Drugs/Ayurveda-Siddha-Unani/",
    file_path: "corpus/india/drugs_and_cosmetics_act_1940.txt",
  },
  {
    document_name: "Geographical Indications of Goods Act, 1999",
    jurisdiction: "india",
    year: 1999,
    source_url: "https://ipindia.gov.in/gi.htm",
    file_path: "corpus/india/geographical_indications_act_1999.txt",
  },
  {
    document_name: "Trade Marks Act, 1999",
    jurisdiction: "india",
    year: 1999,
    source_url: "https://ipindia.gov.in/trade-marks.htm",
    file_path: "corpus/india/trade_marks_act_1999.txt",
  },
  {
    document_name: "FSSAI Ayurveda Aahar Regulations, 2022",
    jurisdiction: "india",
    year: 2022,
    source_url: "https://fssai.gov.in/",
    file_path: "corpus/india/fssai_ayurveda_aahar_regulations_2022.txt",
  },
  {
    document_name: "Phytopharmaceutical Drugs Rules, 2015",
    jurisdiction: "india",
    year: 2015,
    source_url: "https://cdsco.gov.in/",
    file_path: "corpus/india/phytopharmaceutical_drugs_rules_2015.txt",
  },
  {
    document_name: "Biological Diversity (Amendment) Act, 2023",
    jurisdiction: "india",
    year: 2023,
    source_url: "https://nbaindia.org/",
    file_path: "corpus/india/biological_diversity_amendment_act_2023.txt",
  },
  {
    document_name: "Patents (Amendment) Rules, 2024",
    jurisdiction: "india",
    year: 2024,
    source_url: "https://ipindia.gov.in/",
    file_path: "corpus/india/patents_amendment_rules_2024.txt",
  },
  {
    document_name: "TRIPS Agreement (WTO)",
    jurisdiction: "international",
    year: 1994,
    source_url: "https://www.wto.org/english/docs_e/legal_e/27-trips_04_e.htm",
    file_path: "corpus/international/trips_agreement_1994.txt",
  },
  {
    document_name: "Nagoya Protocol on ABS",
    jurisdiction: "international",
    year: 2010,
    source_url: "https://www.cbd.int/abs/text/",
    file_path: "corpus/international/nagoya_protocol_2010.txt",
  },
  {
    document_name: "Convention on Biological Diversity (CBD)",
    jurisdiction: "international",
    year: 1992,
    source_url: "https://www.cbd.int/convention/text/",
    file_path: "corpus/international/cbd_convention_1992.txt",
  },
  {
    document_name: "WIPO PCT Guidelines",
    jurisdiction: "international",
    year: 2020,
    source_url: "https://www.wipo.int/pct/en/texts/",
    file_path: "corpus/international/wipo_pct_overview.txt",
  },
  {
    document_name: "WIPO GRATK Treaty (2024)",
    jurisdiction: "international",
    year: 2024,
    source_url: "https://www.wipo.int/meetings/en/doc_details.jsp?doc_id=634599",
    file_path: "corpus/international/wipo_gratk_treaty_2024.txt",
  },
  {
    document_name: "Case Study: Turmeric Patent Revocation",
    jurisdiction: "case_studies",
    year: 1997,
    source_url: "https://www.csir.res.in/tkdl",
    file_path: "corpus/case_studies/turmeric_patent_revocation_1997.txt",
  },
  {
    document_name: "Case Study: Neem Patent Revocation",
    jurisdiction: "case_studies",
    year: 2000,
    source_url: "https://www.epo.org/",
    file_path: "corpus/case_studies/neem_patent_revocation_2000.txt",
  },
  {
    document_name: "Case Study: Novartis v. Union of India",
    jurisdiction: "india",
    year: 2013,
    source_url: "https://main.sci.gov.in/judgment/judis/40212.pdf",
    file_path: "corpus/case_studies/novartis_v_union_of_india_2013.txt",
  },
];

export const KnowledgeSourcesView: React.FC = () => {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filteredSources = METADATA_SOURCES.filter((src) => {
    const matchesFilter =
      filter === "all" ||
      src.jurisdiction.toLowerCase() === filter.toLowerCase() ||
      (filter === "case_studies" && src.file_path.includes("case_studies"));
    const matchesSearch =
      src.document_name.toLowerCase().includes(search.toLowerCase()) ||
      src.jurisdiction.toLowerCase().includes(search.toLowerCase()) ||
      src.year.toString().includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text">
          Ingested Legal Corpus & Knowledge Sources
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          All statutory texts, international treaties, and landmark case studies indexed in IP-SAKTI Sahayak's vector database.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-bg-surface w-full sm:w-auto">
          {[
            { id: "all", label: "All Sources" },
            { id: "india", label: "India" },
            { id: "international", label: "International" },
            { id: "case_studies", label: "Case Studies" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === f.id
                  ? "bg-bg-elevated text-text font-semibold shadow-sm border border-border"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search statute or year..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-bg-surface border border-border text-text placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-turmeric"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-bg-surface shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated/70 text-text-muted font-mono uppercase text-[11px] border-b border-border">
              <tr>
                <th className="py-3 px-4">Document / Statute Name</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4 text-right">Official Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSources.map((item, idx) => {
                const isIndia = item.jurisdiction === "india";
                const badgeColor = isIndia
                  ? "bg-turmeric/10 text-turmeric-light border-turmeric/30"
                  : "bg-teal/10 text-teal-light border-teal/30";

                return (
                  <tr
                    key={idx}
                    className="hover:bg-bg-elevated/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-text">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        <span>{item.document_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono border ${badgeColor}`}
                      >
                        {item.jurisdiction}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">
                      {item.year}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-turmeric hover:text-turmeric-light transition-colors font-mono"
                      >
                        <span>View Official Text</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
