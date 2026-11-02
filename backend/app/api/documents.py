from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.api.deps import get_current_business_owner
from app.services.document_service import document_service
from app.schemas.document import DocumentResponse, DocumentUploadResponse, DocumentChunkResponse

router = APIRouter(prefix="/documents", tags=["Documents & Knowledge Base"])

@router.post("/upload", response_model=DocumentUploadResponse)
def upload_documents(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    processed_docs = []

    for f in files:
        doc = document_service.save_and_process_document(f, business_id)
        processed_docs.append(DocumentResponse(
            id=doc["_id"],
            business_id=doc["business_id"],
            filename=doc["filename"],
            file_type=doc["file_type"],
            file_status=doc["file_status"],
            file_size_bytes=doc.get("file_size_bytes"),
            chunk_count=doc.get("chunk_count", 0),
            uploaded_at=doc["uploaded_at"],
            error_message=doc.get("error_message")
        ))

    return DocumentUploadResponse(
        message=f"Successfully processed {len(processed_docs)} document(s).",
        documents=processed_docs
    )

@router.get("", response_model=List[DocumentResponse])
def get_documents(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    raw_docs = document_service.get_business_documents(business_id)

    return [
        DocumentResponse(
            id=d["_id"],
            business_id=d["business_id"],
            filename=d["filename"],
            file_type=d["file_type"],
            file_status=d["file_status"],
            file_size_bytes=d.get("file_size_bytes"),
            chunk_count=d.get("chunk_count", 0),
            uploaded_at=d["uploaded_at"],
            error_message=d.get("error_message")
        )
        for d in raw_docs
    ]

@router.get("/{document_id}")
def get_document_details(
    document_id: str,
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    doc = document_service.get_document_by_id(business_id, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    raw_chunks = document_service.get_document_chunks(business_id, document_id)
    chunks_resp = [
        DocumentChunkResponse(
            id=c.get("_id", c.get("chunk_id")),
            chunk_index=c.get("chunk_index", 0),
            page_number=c.get("page_number", 1),
            chunk_text=c.get("chunk_text", ""),
            token_count=len(c.get("chunk_text", "").split())
        )
        for c in raw_chunks
    ]

    return {
        "document": DocumentResponse(
            id=doc["_id"],
            business_id=doc["business_id"],
            filename=doc["filename"],
            file_type=doc["file_type"],
            file_status=doc["file_status"],
            file_size_bytes=doc.get("file_size_bytes"),
            chunk_count=doc.get("chunk_count", 0),
            uploaded_at=doc["uploaded_at"],
            error_message=doc.get("error_message")
        ),
        "chunks": chunks_resp
    }

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    success = document_service.delete_document(business_id, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document and all corresponding vector embeddings successfully deleted."}

@router.post("/{document_id}/reprocess")
def reprocess_document(
    document_id: str,
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    doc = document_service.reprocess_document(business_id, document_id)
    return {
        "message": "Document reprocessed and vector embeddings refreshed.",
        "document": DocumentResponse(
            id=doc["_id"],
            business_id=doc["business_id"],
            filename=doc["filename"],
            file_type=doc["file_type"],
            file_status=doc["file_status"],
            file_size_bytes=doc.get("file_size_bytes"),
            chunk_count=doc.get("chunk_count", 0),
            uploaded_at=doc["uploaded_at"],
            error_message=doc.get("error_message")
        )
    }
