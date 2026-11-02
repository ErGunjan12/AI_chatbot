from pydantic import BaseModel
from typing import Optional, List

class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: Optional[int] = None
    chunk_text: str
    token_count: Optional[int] = None

class DocumentResponse(BaseModel):
    id: str
    business_id: str
    filename: str
    file_type: str
    file_status: str  # processing, ready, failed
    file_size_bytes: Optional[int] = None
    chunk_count: int = 0
    uploaded_at: str
    error_message: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    message: str
    documents: List[DocumentResponse]
