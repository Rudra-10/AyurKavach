"""
Legal Chunker: Implements section-boundary preserving parent-child chunking.
Child ~200-300 tokens for precise vector retrieval; parent = full statutory section returned as context.
Never splits across a section boundary.
"""
import re
import hashlib
from typing import List, Dict, Any


def estimate_tokens(text: str) -> int:
    """Approximate token count based on whitespace and punctuation splits."""
    words = re.findall(r"\w+|[^\w\s]", text, re.UNICODE)
    return len(words)


def split_text_into_child_chunks(
    text: str,
    max_tokens: int = 250,
    overlap_tokens: int = 40
) -> List[str]:
    """
    Splits a single section body into child chunks of ~200-300 tokens without splitting sentences.
    If section text is within max_tokens, returns the text as a single child.
    """
    sentences = re.split(r"(?<=[.!?;\n])\s+", text)
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return [text] if text.strip() else []

    chunks: List[str] = []
    current_sentences: List[str] = []
    current_token_count = 0

    for sent in sentences:
        sent_tokens = estimate_tokens(sent)

        # If a single sentence is exceptionally long, chunk by words
        if sent_tokens > max_tokens:
            if current_sentences:
                chunks.append(" ".join(current_sentences))
                current_sentences = []
                current_token_count = 0
            
            words = sent.split()
            step = max_tokens - overlap_tokens
            for i in range(0, len(words), max(1, step)):
                sub_chunk = " ".join(words[i:i + max_tokens])
                chunks.append(sub_chunk)
            continue

        if current_token_count + sent_tokens > max_tokens and current_sentences:
            chunks.append(" ".join(current_sentences))
            # Keep overlap if possible
            overlap_sentences = []
            overlap_count = 0
            for prev_sent in reversed(current_sentences):
                s_tok = estimate_tokens(prev_sent)
                if overlap_count + s_tok <= overlap_tokens:
                    overlap_sentences.insert(0, prev_sent)
                    overlap_count += s_tok
                else:
                    break
            current_sentences = overlap_sentences + [sent]
            current_token_count = overlap_count + sent_tokens
        else:
            current_sentences.append(sent)
            current_token_count += sent_tokens

    if current_sentences:
        chunks.append(" ".join(current_sentences))

    return chunks if chunks else [text]


def create_chunk_id(source: str, section: str, index: int) -> str:
    """Generates a stable, reproducible chunk ID."""
    clean_src = re.sub(r"[^a-zA-Z0-9]+", "_", source.lower()).strip("_")
    clean_sec = re.sub(r"[^a-zA-Z0-9]+", "_", section.lower()).strip("_")
    return f"{clean_src}__sec_{clean_sec}__c{index}"


def chunk_sections(
    sections: List[Dict[str, Any]],
    target_child_tokens: int = 250,
    overlap_tokens: int = 40
) -> List[Dict[str, Any]]:
    """
    Processes structured sections into parent-child chunks.
    Each chunk payload strictly contains:
    - chunk_id: Unique string identifier
    - source: Document name
    - section: Section/Article identifier
    - jurisdiction: 'india' or 'international'
    - year: Year of enactment/adoption
    - parent_text: Full section text
    - child_text: Specific chunk text used for embedding & retrieval
    - source_url: Reference URL
    """
    all_chunks: List[Dict[str, Any]] = []

    for sec in sections:
        source = sec["source"]
        section_id = sec["section"]
        parent_text = f"{sec['section_title']}\n\n{sec['body']}".strip()
        jurisdiction = sec["jurisdiction"]
        year = sec["year"]
        source_url = sec.get("source_url", "")

        child_snippets = split_text_into_child_chunks(
            sec["body"],
            max_tokens=target_child_tokens,
            overlap_tokens=overlap_tokens
        )

        for idx, child_text in enumerate(child_snippets, start=1):
            # Prepend section title context to child text for higher semantic matching
            enriched_child_text = f"{source} - {sec['section_title']}:\n{child_text}".strip()
            chunk_id = create_chunk_id(source, section_id, idx)

            all_chunks.append({
                "chunk_id": chunk_id,
                "source": source,
                "section": section_id,
                "section_title": sec["section_title"],
                "jurisdiction": jurisdiction,
                "year": year,
                "parent_text": parent_text,
                "child_text": enriched_child_text,
                "source_url": source_url,
            })

    return all_chunks
