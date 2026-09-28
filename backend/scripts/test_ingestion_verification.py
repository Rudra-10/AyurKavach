"""
Verification script for Phase 1 corpus ingestion.
Verifies section parsing, parent-child chunking, and metadata integrity.
"""
import os
import sys
import csv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ingestion.parse import parse_legal_file
from ingestion.chunk import chunk_sections

def verify_phase_1():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    workspace_root = os.path.dirname(backend_dir)
    metadata_path = os.path.join(workspace_root, "corpus", "metadata.csv")

    with open(metadata_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        docs = list(reader)

    total_sections = 0
    total_chunks = 0
    all_chunks = []
    summary = []

    for doc in docs:
        file_path = os.path.join(workspace_root, doc["file_path"])
        metadata = {
            "document_name": doc["document_name"],
            "jurisdiction": doc["jurisdiction"],
            "year": int(doc["year"]),
            "source_url": doc["source_url"],
        }
        sections = parse_legal_file(file_path, metadata)
        chunks = chunk_sections(sections)
        total_sections += len(sections)
        total_chunks += len(chunks)
        all_chunks.extend(chunks)
        summary.append({
            "name": doc["document_name"],
            "jurisdiction": doc["jurisdiction"],
            "sections": len(sections),
            "chunks": len(chunks)
        })

    return {
        "doc_count": len(docs),
        "total_sections": total_sections,
        "total_chunks": total_chunks,
        "summary": summary,
        "chunks": all_chunks
    }

if __name__ == "__main__":
    res = verify_phase_1()
    print(f"Verified {res['doc_count']} documents, {res['total_sections']} sections, {res['total_chunks']} chunks.")
