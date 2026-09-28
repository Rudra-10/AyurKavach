"""
Corpus Parser: Parses raw legal texts and markdown/statute files into structured legal sections.
Splits strictly on section headings (e.g., '## Section 3(d)', '## Article 27', etc.) to maintain legal integrity.
"""
import re
import os
from typing import List, Dict, Any


def parse_legal_text(
    content: str,
    metadata: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Parses a single statute/document text into individual section records.
    Each record contains the section title, section identifier, section body, and document metadata.
    """
    lines = content.splitlines()
    document_title = metadata.get("document_name", "Unknown Statute")
    
    # Check if first line has a main title like '# Patents Act, 1970'
    first_heading_match = re.match(r"^#\s+(.+)$", lines[0].strip()) if lines else None
    if first_heading_match:
        document_title = first_heading_match.group(1).strip()

    sections: List[Dict[str, Any]] = []
    current_section_title = "Preamble"
    current_section_id = "preamble"
    current_lines: List[str] = []

    # Regex to capture section/article headers like '## Section 3(d)', '## Article 27.1', '## Schedule T'
    header_pattern = re.compile(r"^##\s+(.+)$")

    for line in lines:
        match = header_pattern.match(line.strip())
        if match:
            # Save previous section if it has content
            body = "\n".join(current_lines).strip()
            if body:
                sections.append({
                    "source": document_title,
                    "section": current_section_id,
                    "section_title": current_section_title,
                    "body": body,
                    "jurisdiction": metadata.get("jurisdiction", "india"),
                    "year": metadata.get("year", 2000),
                    "source_url": metadata.get("source_url", ""),
                })
            
            # Start new section
            raw_title = match.group(1).strip()
            current_section_title = raw_title
            
            # Extract clean section identifier, e.g. '3(d)', '6(1)', '27.1', 'Schedule T'
            id_match = re.search(r"(?:Section|Article|Schedule|Sec\.|Art\.)\s*([0-9a-zA-Z\(\)\.\s\-]+)", raw_title, re.IGNORECASE)
            if id_match:
                current_section_id = id_match.group(1).strip()
            else:
                current_section_id = raw_title
            
            current_lines = []
        else:
            if not line.startswith("# "):  # Skip document-level h1 header
                current_lines.append(line)

    # Add final section
    body = "\n".join(current_lines).strip()
    if body:
        sections.append({
            "source": document_title,
            "section": current_section_id,
            "section_title": current_section_title,
            "body": body,
            "jurisdiction": metadata.get("jurisdiction", "india"),
            "year": metadata.get("year", 2000),
            "source_url": metadata.get("source_url", ""),
        })

    return sections


def parse_legal_file(file_path: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Reads a file from disk and parses it into structured sections.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Corpus file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return parse_legal_text(content, metadata)
