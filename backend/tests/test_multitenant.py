import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_multitenant_strict_isolation():
    # 1. Register Business B
    email_b = "owner2@biopharm.com"
    reg_b = {
        "name": "Dr. Sarah Stone",
        "email": email_b,
        "password": "Password123!",
        "business_name": "BioPharm Labs",
        "business_slug": "biopharm-labs",
        "description": "Pharmaceutical clinical trials and vaccines"
    }
    client.post("/api/auth/register", json=reg_b)

    login_b = client.post("/api/auth/login", json={"email": email_b, "password": "Password123!"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Upload BioPharm exclusive document
    bio_content = b"BioPharm Vaccine Info: The BioVax-9 vaccine requires storage at -80 degrees Celsius."
    files = [("files", ("vaccine_specs.txt", io.BytesIO(bio_content), "text/plain"))]
    upload_b = client.post("/api/documents/upload", headers=headers_b, files=files)
    assert upload_b.status_code == 200
    doc_b_id = upload_b.json()["documents"][0]["id"]

    # 2. Login as Business A (TechCorp)
    login_a = client.post("/api/auth/login", json={"email": "owner1@techcorp.io", "password": "Password123!"})
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Business A attempts to read Business B's document directly by ID -> MUST return 404
    hack_res = client.get(f"/api/documents/{doc_b_id}", headers=headers_a)
    assert hack_res.status_code == 404

    # Business A attempts to delete Business B's document -> MUST return 404
    delete_hack = client.delete(f"/api/documents/{doc_b_id}", headers=headers_a)
    assert delete_hack.status_code == 404

    # 3. Public Chat Isolation:
    # A customer chatting with TechCorp should NEVER retrieve BioPharm's vaccine storage temperature!
    chat_req = {
        "message": "At what temperature must BioVax-9 be stored?",
        "language": "en"
    }
    cross_tenant_chat = client.post("/api/chat/techcorp-solutions/message", json=chat_req)
    assert cross_tenant_chat.status_code == 200
    res_data = cross_tenant_chat.json()
    # Must fallback because TechCorp has no knowledge about BioVax
    assert res_data["answer_status"] == "unanswered_fallback"
    assert "I don't have this information in the available business documents" in res_data["message"]
