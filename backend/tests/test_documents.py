import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.document_processing.cleaner import clean_text
from app.document_processing.chunker import chunk_document_pages

client = TestClient(app)

def test_text_cleaner_and_chunker():
    raw_text = "Hello\xa0World!\r\n\r\nThis has  multiple   spaces.\n\n\n\nNew paragraph."
    cleaned = clean_text(raw_text)
    assert "\xa0" not in cleaned
    assert "\r" not in cleaned
    assert "multiple spaces" in cleaned

    pages = [{"page_number": 1, "text": "TechCorp return policy: We accept returns within 30 days of purchase for a 100% full refund."}]
    chunks = chunk_document_pages(pages, "biz_123", "doc_456", "policy.txt", chunk_size=200, chunk_overlap=30)
    assert len(chunks) >= 1
    assert chunks[0]["business_id"] == "biz_123"
    assert chunks[0]["page_number"] == 1
    assert "30 days" in chunks[0]["chunk_text"]

def test_document_upload_and_lifecycle():
    # Login as owner
    login_res = client.post("/api/auth/login", json={"email": "owner1@techcorp.io", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload TXT file
    file_content = b"TechCorp Refund Policy:\nCustomers can request a refund within 30 business days. Shipping costs are non-refundable.\nTechCorp Support Phone: +1-800-555-0199."
    files = [("files", ("refund_policy.txt", io.BytesIO(file_content), "text/plain"))]

    upload_res = client.post("/api/documents/upload", headers=headers, files=files)
    assert upload_res.status_code == 200
    docs = upload_res.json()["documents"]
    assert len(docs) == 1
    doc_id = docs[0]["id"]
    assert docs[0]["file_status"] == "ready"

    # List documents
    list_res = client.get("/api/documents", headers=headers)
    assert list_res.status_code == 200
    assert any(d["id"] == doc_id for d in list_res.json())

    # Get document details
    detail_res = client.get(f"/api/documents/{doc_id}", headers=headers)
    assert detail_res.status_code == 200
    assert len(detail_res.json()["chunks"]) >= 1

    # Reprocess document
    reprocess_res = client.post(f"/api/documents/{doc_id}/reprocess", headers=headers)
    assert reprocess_res.status_code == 200
    assert reprocess_res.json()["document"]["file_status"] == "ready"
