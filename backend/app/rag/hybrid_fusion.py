from typing import List, Dict, Any, Optional
from collections import defaultdict
from app.rag.vector_store import vector_store
from app.rag.bm25_retriever import bm25_retriever
from app.rag.reranker import cross_encoder_reranker

class HybridFusionRetriever:
    """
    Primary RAG Retrieval System combining Semantic Search and BM25 Lexical Search.
    Fuses rankings via Reciprocal Rank Fusion (RRF) and validates through Cross-Encoder Reranking.
    """
    def __init__(self, rrf_k: int = 60):
        self.rrf_k = rrf_k

    def retrieve(
        self,
        query: str,
        business_id: str,
        top_k: int = 5,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid search across vector and keyword engines, fusing them with RRF.
        Guarantees strict tenant isolation by passing business_id to both retrieval arms.
        """
        # 1. Fetch from Vector Store (Semantic)
        semantic_results = vector_store.search_semantic(
            query=query,
            business_id=business_id,
            top_k=top_k * 2,
            document_id=document_id
        )

        # 2. Fetch from BM25 (Keyword)
        bm25_results = bm25_retriever.search_keyword(
            query=query,
            business_id=business_id,
            top_k=top_k * 2,
            document_id=document_id
        )

        # If both are empty, return empty
        if not semantic_results and not bm25_results:
            return []

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores = defaultdict(float)
        chunk_lookup: Dict[str, Dict[str, Any]] = {}

        # Process Semantic ranks
        for rank, item in enumerate(semantic_results):
            cid = item["chunk_id"]
            rrf_scores[cid] += 1.0 / (self.rrf_k + rank + 1)
            if cid not in chunk_lookup:
                chunk_lookup[cid] = item

        # Process BM25 ranks
        for rank, item in enumerate(bm25_results):
            cid = item["chunk_id"]
            rrf_scores[cid] += 1.0 / (self.rrf_k + rank + 1)
            if cid not in chunk_lookup:
                chunk_lookup[cid] = item
            else:
                chunk_lookup[cid]["retrieval_method"] = "hybrid_fused"

        # 4. Normalize RRF scores and deduplicate
        fused_candidates: List[Dict[str, Any]] = []
        max_rrf = max(rrf_scores.values()) if rrf_scores else 1.0

        for cid, score in rrf_scores.items():
            candidate = dict(chunk_lookup[cid])
            candidate["similarity_score"] = round(score / max_rrf, 4)
            fused_candidates.append(candidate)

        # 5. Apply Cross-Encoder Reranking
        reranked_results = cross_encoder_reranker.rerank(
            query=query,
            candidates=fused_candidates,
            top_k=top_k
        )

        return reranked_results

    # Convenient alias for test suites and standard nomenclature
    retrieve_hybrid = retrieve

hybrid_retriever = HybridFusionRetriever()
