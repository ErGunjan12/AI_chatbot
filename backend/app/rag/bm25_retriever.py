import re
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Okapi
from app.database.mongo import db_manager

class BM25Retriever:
    """
    Lexical BM25 keyword search engine with strict tenant isolation.
    Finds exact SKUs, product names, price numbers, and specific policy terms.
    """
    def _tokenize(self, text: str) -> List[str]:
        # Lowercase, clean alphanumeric tokens
        tokens = re.findall(r'\b\w+\b', text.lower())
        return tokens if tokens else [text.lower()]

    def search_keyword(
        self,
        query: str,
        business_id: str,
        top_k: int = 5,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves matching chunks for a specific business using BM25 Okapi.
        """
        chunks_col = db_manager.get_collection("document_chunks")
        filter_q: Dict[str, Any] = {"business_id": str(business_id)}
        if document_id:
            filter_q["document_id"] = str(document_id)

        raw_chunks = list(chunks_col.find(filter_q))
        if not raw_chunks:
            return []

        tokenized_corpus = [self._tokenize(c.get("chunk_text", "")) for c in raw_chunks]
        tokenized_query = self._tokenize(query)

        if not tokenized_query:
            return []

        try:
            bm25 = BM25Okapi(tokenized_corpus)
            doc_scores = bm25.get_scores(tokenized_query)
        except Exception as e:
            print(f"[BM25Retriever] Scoring error: {e}")
            return []

        # Pair chunks with scores
        scored_pairs = []
        max_score = max(doc_scores) if len(doc_scores) > 0 and max(doc_scores) > 0 else 1.0

        for idx, score in enumerate(doc_scores):
            if score > 0.05:  # Filter out completely irrelevant scores
                chunk = raw_chunks[idx]
                norm_score = min(1.0, score / max_score)
                scored_pairs.append({
                    "chunk_id": chunk.get("chunk_id", chunk.get("_id")),
                    "chunk_text": chunk.get("chunk_text", ""),
                    "metadata": {
                        "business_id": chunk.get("business_id"),
                        "document_id": chunk.get("document_id"),
                        "document_name": chunk.get("document_name"),
                        "page_number": chunk.get("page_number", 1),
                        "chunk_index": chunk.get("chunk_index", 0),
                        "upload_timestamp": chunk.get("upload_timestamp", "")
                    },
                    "similarity_score": round(norm_score, 4),
                    "raw_bm25_score": round(float(score), 4),
                    "retrieval_method": "bm25"
                })

        scored_pairs.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_pairs[:top_k]

    # Convenient alias for test suites and standard nomenclature
    search_bm25 = search_keyword

bm25_retriever = BM25Retriever()
