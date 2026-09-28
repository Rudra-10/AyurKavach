"""
Corpus Ingestion Runner.
Executes parse -> chunk -> embed -> upsert pipeline across the entire legal corpus.
Prints chunk counts per document and 5 sample chunks with full payload for verification.
"""
import os
import sys
import csv
import json
import random
import asyncio

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ingestion.parse import parse_legal_file
from ingestion.chunk import chunk_sections
from ingestion.embed_and_upsert import embed_and_upsert_chunks


def run_ingestion_pipeline(dry_run: bool = False):
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    workspace_root = os.path.dirname(backend_dir)
    metadata_path = os.path.join(workspace_root, "corpus", "metadata.csv")

    if not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Metadata file not found: {metadata_path}")

    print("=" * 70)
    print("      IP-SAKTI SAHAYAK — CORPUS INGESTION PIPELINE")
    print("=" * 70)

    all_parsed_sections = []
    all_chunks = []
    doc_stats = []

    with open(metadata_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            doc_name = row["document_name"]
            jurisdiction = row["jurisdiction"]
            year = int(row["year"])
            source_url = row["source_url"]
            rel_file_path = row.get("file_path", "")

            full_file_path = os.path.join(workspace_root, rel_file_path)
            if not os.path.exists(full_file_path):
                print(f"[Warning] Skipping missing file: {full_file_path}")
                continue

            metadata = {
                "document_name": doc_name,
                "jurisdiction": jurisdiction,
                "year": year,
                "source_url": source_url,
            }

            sections = parse_legal_file(full_file_path, metadata)
            chunks = chunk_sections(sections)

            all_parsed_sections.extend(sections)
            all_chunks.extend(chunks)

            doc_stats.append({
                "document": doc_name,
                "jurisdiction": jurisdiction,
                "year": year,
                "sections": len(sections),
                "chunks": len(chunks)
            })

    print(f"\n--- INGESTION SUMMARY: {len(doc_stats)} DOCUMENTS PARSED ---")
    print(f"{'Document Name':<42} | {'Jurisdiction':<13} | {'Sections':<8} | {'Chunks':<6}")
    print("-" * 75)
    for stat in doc_stats:
        print(f"{stat['document']:<42} | {stat['jurisdiction']:<13} | {stat['sections']:<8} | {stat['chunks']:<6}")
    print("-" * 75)
    print(f"Total Sections: {len(all_parsed_sections)} | Total Chunks: {len(all_chunks)}\n")

    # Sample 5 chunks for payload verification
    print("=" * 70)
    print("       5 SAMPLE CHUNKS WITH COMPLETE PAYLOAD VERIFICATION")
    print("=" * 70)
    sample_indices = random.sample(range(len(all_chunks)), min(5, len(all_chunks)))
    for idx, sample_idx in enumerate(sample_indices, 1):
        c = all_chunks[sample_idx]
        print(f"\n[Sample Chunk #{idx}]")
        print(f"  • chunk_id:      {c['chunk_id']}")
        print(f"  • source:        {c['source']}")
        print(f"  • section:       {c['section']}")
        print(f"  • jurisdiction:  {c['jurisdiction']}")
        print(f"  • year:          {c['year']}")
        print(f"  • source_url:    {c['source_url']}")
        print(f"  • child_text:    {c['child_text'][:120]}...")
        print(f"  • parent_text:   {c['parent_text'][:140]}...")

    if not dry_run:
        print("\n" + "=" * 70)
        print("          VECTOR EMBEDDING & QDRANT UPSERTION")
        print("=" * 70)
        try:
            asyncio.run(embed_and_upsert_chunks(all_chunks))
        except Exception as e:
            print(f"[Notice] Qdrant upsertion skipped/deferred (e.g. if local daemon not started): {e}")

    return all_chunks, doc_stats


if __name__ == "__main__":
    run_ingestion_pipeline()
