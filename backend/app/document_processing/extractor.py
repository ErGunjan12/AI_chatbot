import os
import pymupdf  # PyMuPDF
import docx
from typing import List, Dict, Any
from app.document_processing.cleaner import clean_text

class DocumentExtractionError(Exception):
    pass

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text per page from a PDF file using PyMuPDF."""
    pages: List[Dict[str, Any]] = []
    try:
        doc = pymupdf.open(file_path)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_text = page.get_text()
            cleaned = clean_text(page_text)
            if cleaned:
                pages.append({
                    "page_number": page_idx + 1,
                    "text": cleaned
                })
        doc.close()
    except Exception as e:
        raise DocumentExtractionError(f"Failed to extract PDF: {str(e)}")
    return pages

def extract_text_from_docx(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text from a Word DOCX document."""
    try:
        doc = docx.Document(file_path)
        paragraphs_text = []
        for p in doc.paragraphs:
            if p.text.strip():
                paragraphs_text.append(p.text.strip())

        # Also extract table text if any
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs_text.append(row_text)

        full_text = "\n\n".join(paragraphs_text)
        cleaned = clean_text(full_text)
        if not cleaned:
            return []
        # In DOCX, exact pages are dynamic, so we treat it as 1 or virtual pages
        return [{"page_number": 1, "text": cleaned}]
    except Exception as e:
        raise DocumentExtractionError(f"Failed to extract DOCX: {str(e)}")

def extract_text_from_txt(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text from a plain TXT file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            raw_text = f.read()
        cleaned = clean_text(raw_text)
        if not cleaned:
            return []
        return [{"page_number": 1, "text": cleaned}]
    except Exception as e:
        raise DocumentExtractionError(f"Failed to extract TXT: {str(e)}")

def extract_document(file_path: str, file_type: str) -> List[Dict[str, Any]]:
    """Dispatches to the correct extractor based on extension/type."""
    file_type = file_type.lower().strip('.')
    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type in ["docx", "doc"]:
        return extract_text_from_docx(file_path)
    elif file_type in ["txt", "text", "md"]:
        return extract_text_from_txt(file_path)
    else:
        raise DocumentExtractionError(f"Unsupported document format: .{file_type}")
