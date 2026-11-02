import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

def chunk_document_pages(
    pages: List[Dict[str, Any]],
    business_id: str,
    document_id: str,
    document_name: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Splits text across document pages into overlapping semantic chunks with full metadata.
    Preserves page_number, business_id, document_id, and chunk_index.
    """
    chunks: List[Dict[str, Any]] = []
    chunk_index = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for page_data in pages:
        page_num = page_data.get("page_number", 1)
        raw_text = page_data.get("text", "").strip()
        if not raw_text:
            continue

        # Split page text into overlapping windows
        start = 0
        text_len = len(raw_text)

        while start < text_len:
            end = min(start + chunk_size, text_len)

            # Try not to break words in the middle if possible
            if end < text_len:
                last_space = raw_text.rfind(' ', start, end)
                last_newline = raw_text.rfind('\n', start, end)
                break_point = max(last_space, last_newline)
                if break_point > start + (chunk_size // 2):
                    end = break_point

            chunk_text = raw_text[start:end].strip()

            if chunk_text:
                chunk_id = f"{document_id}_{chunk_index}"
                chunks.append({
                    "_id": str(uuid.uuid4()),
                    "chunk_id": chunk_id,
                    "business_id": business_id,
                    "document_id": document_id,
                    "document_name": document_name,
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "chunk_text": chunk_text,
                    "upload_timestamp": now_iso
                })
                chunk_index += 1

            if end >= text_len:
                break
            start = max(start + 1, end - chunk_overlap)

    return chunks
