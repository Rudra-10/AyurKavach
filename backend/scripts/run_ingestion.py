"""
Pipeline ingestion runner script (Phase 1).
Idempotently parses corpus, chunks, computes embeddings, and upserts into Qdrant.
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    print("Ingestion script placeholder (Phase 1).")


if __name__ == "__main__":
    main()
