import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from app.database.mongo import db_manager
from app.document_processing.extractor import extract_document, DocumentExtractionError
from app.document_processing.chunker import chunk_document_pages
from app.rag.vector_store import vector_store
from app.rag.graph_rag import knowledge_graph

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

class DocumentService:
    def _get_business_upload_dir(self, business_id: str) -> str:
        b_dir = os.path.join(settings.UPLOAD_DIR, str(business_id))
        os.makedirs(b_dir, exist_ok=True)
        return b_dir

    def save_and_process_document(
        self,
        file: UploadFile,
        business_id: str
    ) -> Dict[str, Any]:
        """
        Validates, saves, extracts, chunks, and indexes a single uploaded document.
        Guarantees tenant isolation and ChromaDB persistent synchronization.
        """
        filename = file.filename or "unknown_file.txt"
        ext = filename.split(".")[-1].lower() if "." in filename else ""

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type .{ext}. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        doc_id = str(uuid.uuid4())
        upload_dir = self._get_business_upload_dir(business_id)
        saved_filename = f"{doc_id}_{filename}"
        saved_path = os.path.join(upload_dir, saved_filename)

        # Save to disk and check file size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        size_bytes = 0

        with open(saved_path, "wb") as buffer:
            while chunk := file.file.read(1024 * 64):
                size_bytes += len(chunk)
                if size_bytes > max_bytes:
                    os.remove(saved_path)
                    raise HTTPException(
                        status_code=400,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                    )
                buffer.write(chunk)

        docs_col = db_manager.get_collection("documents")
        now_iso = datetime.now(timezone.utc).isoformat()

        doc_record = {
            "_id": doc_id,
            "business_id": str(business_id),
            "filename": filename,
            "file_type": ext,
            "file_status": "processing",
            "file_path": saved_path,
            "file_size_bytes": size_bytes,
            "chunk_count": 0,
            "uploaded_at": now_iso,
            "error_message": None
        }
        docs_col.insert_one(doc_record)

        try:
            # 1. Extract text per page
            pages = extract_document(saved_path, ext)
            if not pages:
                raise DocumentExtractionError("No readable text found in document.")

            # 2. Split into chunks with metadata
            chunks = chunk_document_pages(
                pages=pages,
                business_id=business_id,
                document_id=doc_id,
                document_name=filename
            )

            # 3. Store chunks in MongoDB
            chunks_col = db_manager.get_collection("document_chunks")
            if chunks:
                chunks_col.insert_many(chunks)

            # 4. Add vectors to ChromaDB
            vector_store.add_chunks(chunks)

            # 5. Extract knowledge graph triples (for Graph RAG)
            full_text = "\n".join([p["text"] for p in pages])
            triples = knowledge_graph.extract_triples_from_text(full_text, business_id, doc_id)
            if triples:
                knowledge_graph.store_triples(triples)

            # 6. Update document status to ready
            docs_col.update_one(
                {"_id": doc_id, "business_id": str(business_id)},
                {"$set": {
                    "file_status": "ready",
                    "chunk_count": len(chunks)
                }}
            )

            doc_record["file_status"] = "ready"
            doc_record["chunk_count"] = len(chunks)
            return doc_record

        except Exception as e:
            err_msg = str(e)
            docs_col.update_one(
                {"_id": doc_id, "business_id": str(business_id)},
                {"$set": {
                    "file_status": "failed",
                    "error_message": err_msg
                }}
            )
            doc_record["file_status"] = "failed"
            doc_record["error_message"] = err_msg
            return doc_record

    def get_business_documents(self, business_id: str) -> List[Dict[str, Any]]:
        docs_col = db_manager.get_collection("documents")
        return list(docs_col.find({"business_id": str(business_id)}))

    def get_document_by_id(self, business_id: str, document_id: str) -> Optional[Dict[str, Any]]:
        docs_col = db_manager.get_collection("documents")
        return docs_col.find_one({"_id": str(document_id), "business_id": str(business_id)})

    def get_document_chunks(self, business_id: str, document_id: str) -> List[Dict[str, Any]]:
        chunks_col = db_manager.get_collection("document_chunks")
        return list(chunks_col.find({"business_id": str(business_id), "document_id": str(document_id)}))

    def delete_document(self, business_id: str, document_id: str) -> bool:
        """
        Completely removes document, local file, Mongo chunks, ChromaDB vectors, and Graph triples.
        """
        docs_col = db_manager.get_collection("documents")
        doc = docs_col.find_one({"_id": str(document_id), "business_id": str(business_id)})
        if not doc:
            return False

        # 1. Remove file on disk
        if doc.get("file_path") and os.path.exists(doc["file_path"]):
            try:
                os.remove(doc["file_path"])
            except Exception as e:
                print(f"[DocumentService] File delete warning: {e}")

        # 2. Delete ChromaDB vectors
        vector_store.delete_document_chunks(business_id, document_id)

        # 3. Delete Graph triples
        knowledge_graph.delete_document_triples(business_id, document_id)

        # 4. Delete chunks from MongoDB
        chunks_col = db_manager.get_collection("document_chunks")
        chunks_col.delete_many({"business_id": str(business_id), "document_id": str(document_id)})

        # 5. Delete document record
        docs_col.delete_one({"_id": str(document_id), "business_id": str(business_id)})
        return True

    def reprocess_document(self, business_id: str, document_id: str) -> Dict[str, Any]:
        """
        Purges previous vector chunks and re-indexes the document from stored file.
        """
        docs_col = db_manager.get_collection("documents")
        doc = docs_col.find_one({"_id": str(document_id), "business_id": str(business_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        file_path = doc.get("file_path")
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=400, detail="Document source file missing on disk.")

        # 1. Purge old vector and chunk records
        vector_store.delete_document_chunks(business_id, document_id)
        knowledge_graph.delete_document_triples(business_id, document_id)
        chunks_col = db_manager.get_collection("document_chunks")
        chunks_col.delete_many({"business_id": str(business_id), "document_id": str(document_id)})

        # 2. Re-extract and re-index
        ext = doc.get("file_type", "txt")
        pages = extract_document(file_path, ext)
        chunks = chunk_document_pages(
            pages=pages,
            business_id=business_id,
            document_id=document_id,
            document_name=doc.get("filename", "")
        )

        if chunks:
            chunks_col.insert_many(chunks)
            vector_store.add_chunks(chunks)

        full_text = "\n".join([p["text"] for p in pages])
        triples = knowledge_graph.extract_triples_from_text(full_text, business_id, document_id)
        if triples:
            knowledge_graph.store_triples(triples)

        docs_col.update_one(
            {"_id": str(document_id), "business_id": str(business_id)},
            {"$set": {
                "file_status": "ready",
                "chunk_count": len(chunks),
                "error_message": None
            }}
        )

        doc["file_status"] = "ready"
        doc["chunk_count"] = len(chunks)
        return doc

document_service = DocumentService()
