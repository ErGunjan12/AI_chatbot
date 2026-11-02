import os
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.rag.embeddings import embedding_service

class ChromaVectorStore:
    def __init__(self):
        os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
        chroma_settings = ChromaSettings(
            anonymized_telemetry=False,
            is_persistent=True
        )
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=chroma_settings
        )
        self.collection_name = "business_knowledge_base"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Multi-tenant business knowledge chunks"}
        )

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Adds extracted document chunks with vector embeddings and strict metadata.
        """
        if not chunks:
            return

        ids = [chunk["chunk_id"] for chunk in chunks]
        texts = [chunk["chunk_text"] for chunk in chunks]
        metadatas = []
        for c in chunks:
            metadatas.append({
                "business_id": str(c["business_id"]),
                "document_id": str(c["document_id"]),
                "document_name": str(c.get("document_name", "")),
                "page_number": int(c.get("page_number", 1)),
                "chunk_index": int(c.get("chunk_index", 0)),
                "upload_timestamp": str(c.get("upload_timestamp", ""))
            })

        embeddings = embedding_service.get_embeddings(texts)

        # Batch insert to ChromaDB
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=texts
        )

    def search_semantic(
        self,
        query: str,
        business_id: str,
        top_k: int = 5,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic similarity search isolated strictly to the target business_id.
        """
        query_vector = embedding_service.get_embedding(query)
        where_filter: Dict[str, Any] = {"business_id": str(business_id)}
        if document_id:
            where_filter = {"$and": [{"business_id": str(business_id)}, {"document_id": str(document_id)}]}

        count = self.collection.count()
        if count == 0:
            return []

        actual_k = min(top_k, count)
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=actual_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        output: List[Dict[str, Any]] = []
        if not results or not results["ids"] or not results["ids"][0]:
            return output

        ids = results["ids"][0]
        docs = results["documents"][0] if results.get("documents") else []
        metas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results["distances"][0] if results.get("distances") else []

        for i in range(len(ids)):
            dist = distances[i] if i < len(distances) else 1.0
            # Convert cosine distance to similarity score
            sim_score = max(0.0, 1.0 - (dist / 2.0))
            output.append({
                "chunk_id": ids[i],
                "chunk_text": docs[i] if i < len(docs) else "",
                "metadata": metas[i] if i < len(metas) else {},
                "similarity_score": round(sim_score, 4),
                "retrieval_method": "semantic"
            })

        return output

    def delete_document_chunks(self, business_id: str, document_id: str):
        """
        Removes all vector embeddings for a specific document belonging to a business.
        """
        try:
            self.collection.delete(
                where={"$and": [
                    {"business_id": str(business_id)},
                    {"document_id": str(document_id)}
                ]}
            )
        except Exception as e:
            print(f"[ChromaVectorStore] Delete warning: {e}")

    def delete_business_chunks(self, business_id: str):
        """
        Removes all vector embeddings for an entire business (tenant purge).
        """
        try:
            self.collection.delete(where={"business_id": str(business_id)})
        except Exception as e:
            print(f"[ChromaVectorStore] Purge warning: {e}")

vector_store = ChromaVectorStore()
