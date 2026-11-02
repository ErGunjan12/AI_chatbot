import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, base_url="http://127.0.0.1")

def test_registration_and_login_flow():
    print("[TEST] Starting registration flow...")
    email = "owner1@techcorp.io"
    reg_payload = {
        "name": "Alex Mercer",
        "email": email,
        "password": "Password123!",
        "business_name": "TechCorp Solutions",
        "business_slug": "techcorp-solutions",
        "description": "Enterprise cloud and AI services"
    }

    print("[TEST] Sending POST /api/auth/register...")
    reg_res = client.post("/api/auth/register", json=reg_payload)
    print(f"[TEST] Register response: {reg_res.status_code}")
    assert reg_res.status_code in [201, 400]
    if reg_res.status_code == 201:
        data = reg_res.json()
        assert "access_token" in data
        assert data["user"]["email"] == email
        assert data["user"]["business_slug"] == "techcorp-solutions"

    # 2. Login
    print("[TEST] Sending POST /api/auth/login...")
    login_payload = {
        "email": email,
        "password": "Password123!"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    print(f"[TEST] Login response: {login_res.status_code}")
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert token is not None

    # 3. Test Protected /me endpoint
    print("[TEST] Sending GET /api/auth/me...")
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    print(f"[TEST] Me response: {me_res.status_code}")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 4. Invalid Password
    bad_login = client.post("/api/auth/login", json={"email": email, "password": "WrongPassword"})
    assert bad_login.status_code == 401

    # 5. Unauthorized access
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401
    print("[TEST] All assertions in test_registration_and_login_flow passed!")

if __name__ == "__main__":
    test_registration_and_login_flow()
