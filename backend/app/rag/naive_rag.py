from typing import List, Dict, Any, Optional
from app.rag.vector_store import vector_store

class NaiveRAGPipeline:
    """
    Baseline Naive RAG implementation for benchmark evaluation and comparative testing:
    Query -> Vector Embedding -> Vector Top-K -> Context Formulation.
    """
    def retrieve(
        self,
        query: str,
        business_id: str,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        # Naive vector retrieval without BM25 fusion, reranking, or query routing
        return vector_store.search_semantic(
            query=query,
            business_id=business_id,
            top_k=top_k
        )

naive_rag = NaiveRAGPipeline()
