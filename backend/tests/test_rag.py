import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.rag.agentic_router import agentic_router
from app.rag.bm25_retriever import bm25_retriever
from app.rag.vector_store import vector_store
from app.rag.reranker import cross_encoder_reranker
from app.rag.pipeline import rag_pipeline

client = TestClient(app)

def test_agentic_router():
    route1 = agentic_router.route_query("What is the cost of your premium plan?")
    assert route1["intent"] == "pricing"
    assert not route1["is_out_of_domain"]

    route2 = agentic_router.route_query("How can I return an item?")
    assert route2["intent"] == "refund_policy"

    route3 = agentic_router.route_query("Please write a python script to sort numbers")
    assert route3["is_out_of_domain"] is True
    assert route3["intent"] == "unknown_unsupported"

def test_reranker_and_hybrid_scoring():
    candidates = [
        {"chunk_id": "c1", "chunk_text": "TechCorp offers general consulting.", "similarity_score": 0.4},
        {"chunk_id": "c2", "chunk_text": "TechCorp refund policy allows returns within 30 days for full credit.", "similarity_score": 0.8}
    ]
    reranked = cross_encoder_reranker.rerank("What is the refund policy?", candidates, top_k=2)
    assert len(reranked) == 2
    assert reranked[0]["chunk_id"] == "c2"

def test_customer_chat_rag_and_fallback():
    # 1. Ask a question present in uploaded documents
    chat_req = {
        "message": "What is your refund policy timeframe?",
        "language": "en"
    }
    res = client.post("/api/chat/techcorp-solutions/message", json=chat_req)
    assert res.status_code == 200
    data = res.json()
    assert "conversation_id" in data
    # Answer should be grounded based on refund_policy.txt
    assert data["answer_status"] in ["grounded", "unanswered_fallback"]
    if data["answer_status"] == "grounded":
        assert len(data["source_documents"]) >= 1

    # 2. Ask an unsupported question NOT in business documents
    unsupported_req = {
        "message": "What is the secret recipe for strawberry chocolate cake?",
        "language": "en"
    }
    fallback_res = client.post("/api/chat/techcorp-solutions/message", json=unsupported_req)
    assert fallback_res.status_code == 200
    f_data = fallback_res.json()
    assert f_data["answer_status"] == "unanswered_fallback"
    assert "I don't have this information in the available business documents" in f_data["message"]
