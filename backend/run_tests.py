import sys
import os
import io
import time
from pathlib import Path
from starlette.datastructures import UploadFile

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.mongo import db_manager
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas.auth import RegisterRequest, LoginRequest
from app.api.auth import register, login
from app.api.business import get_business_profile, update_business_profile
from app.schemas.business import BusinessUpdateRequest
from app.document_processing.cleaner import clean_text
from app.document_processing.chunker import chunk_document_pages
from app.services.document_service import document_service
from app.rag.agentic_router import agentic_router
from app.rag.reranker import cross_encoder_reranker
from app.rag.hybrid_fusion import hybrid_retriever
from app.services.chat_service import chat_service
from app.services.dashboard_service import dashboard_service
from app.services.export_service import export_service
from app.schemas.support import TicketCreateRequest
from app.api.support import create_support_ticket, get_business_tickets
from app.schemas.settings import ChatbotSettingsRequest
from app.api.settings import get_chatbot_settings, update_chatbot_settings

def run_suite():
    t_start = time.time()
    print("=" * 70, flush=True)
    print("AI CUSTOMER SUPPORT ASSISTANT — MASTER TEST SUITE", flush=True)
    print("=" * 70, flush=True)

    passed = 0
    failed = 0

    # 1. Database Connection & Mode
    print("\n[TEST 1] Verifying Database Initialization & Persistence...", flush=True)
    try:
        assert db_manager.is_connected is True
        print(f"  [PASS]: Database initialized in mode: {'local_persistent' if db_manager.is_local_fallback else 'mongodb_atlas'}")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 2. Authentication & Security
    user_a = None
    biz_a_id = None
    ts0 = int(time.time())
    biz_a_slug = f"acme-cloud-{ts0}"
    token_a = None
    try:
        print("\n[TEST 2] Verifying User Registration, Bcrypt Hashing, and JWT...", flush=True)
        # Test password hashing
        raw_pw = "MasterSecret123!"
        hashed = hash_password(raw_pw)
        assert verify_password(raw_pw, hashed) is True
        assert verify_password("WrongSecret", hashed) is False

        # Register Business Owner
        reg_req = RegisterRequest(
            name="John Doe",
            email=f"john_{ts0}@acmecloud.io",
            password=raw_pw,
            business_name=f"Acme Cloud Technologies {ts0}",
            business_slug=biz_a_slug,
            description="Enterprise Cloud Infrastructure & SLA Support"
        )
        reg_res = register(reg_req)
        token_a = reg_res.access_token
        user_a = reg_res.user
        biz_a_id = user_a.business_id

        # Verify decoded token
        payload = decode_access_token(token_a)
        assert payload["sub"] == user_a.id
        assert payload["role"] == "business_owner"

        # Login
        log_res = login(LoginRequest(email=f"john_{ts0}@acmecloud.io", password=raw_pw))
        assert log_res.user.email == f"john_{ts0}@acmecloud.io"

        print("  [PASS]: Registration, Password Hashing, JWT Tokens verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 3. Business Profile
    try:
        print("\n[TEST 3] Verifying Business Profile & Updates...", flush=True)
        owner_dict = {"_id": user_a.id, "business_id": biz_a_id, "role": "business_owner"}
        prof = get_business_profile(current_user=owner_dict)
        assert "Acme Cloud Technologies" in prof.business_name

        updated = update_business_profile(
            BusinessUpdateRequest(description="Updated Global Cloud Infrastructure"),
            current_user=owner_dict
        )
        assert updated.description == "Updated Global Cloud Infrastructure"
        print("  [PASS]: Business Profile retrieval & update verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 4. Document Processing: Cleaner & Chunker
    try:
        print("\n[TEST 4] Verifying Text Cleaning & Semantic Chunking...", flush=True)
        dirty_text = "Acme\xa0Cloud Guarantee:\r\n\r\nAll refunds  processed  within 24 hours.\n\n\nContact support."
        clean = clean_text(dirty_text)
        assert "\xa0" not in clean
        assert "\r" not in clean
        assert "processed within 24 hours" in clean

        pages = [
            {"page_number": 1, "text": "Acme Cloud Enterprise SLA: 99.99% uptime guarantee with 24/7 dedicated engineering support."},
            {"page_number": 2, "text": "Acme Refund Policy: Customers can request a full refund within 30 days of subscription start."}
        ]
        chunks = chunk_document_pages(pages, biz_a_id, "doc_test_1", "sla_policy.txt", chunk_size=200, chunk_overlap=30)
        assert len(chunks) == 2
        assert chunks[0]["page_number"] == 1
        assert chunks[1]["page_number"] == 2
        assert chunks[0]["business_id"] == biz_a_id
        print("  [PASS]: Cleaner & Multi-Page Semantic Chunker with Metadata verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 5. Document Upload, ChromaDB Indexing & Reprocessing
    doc_a_id = None
    try:
        print("\n[TEST 5] Verifying Document Ingestion & ChromaDB Persistent Vector Indexing...", flush=True)
        kb_content = (
            "Acme Cloud Pricing & Products:\n"
            "The Acme Starter Tier is priced at $49 per month.\n"
            "The Acme Pro Tier costs $199 per month with automated backups.\n"
            "The Acme Enterprise Plan costs $899 per month with dedicated engineers.\n\n"
            "Acme Refund & Cancellation Policy:\n"
            "We offer a 30-day money-back guarantee for all new accounts.\n"
            "To request a refund, email support@acmecloud.io within 30 days.\n\n"
            "Acme Delivery and Deployment Policy:\n"
            "Cloud clusters are provisioned and delivered within 15 minutes of payment confirmation."
        )
        fake_file = UploadFile(
            filename="acme_knowledge_base.txt",
            file=io.BytesIO(kb_content.encode('utf-8'))
        )
        doc_record = document_service.save_and_process_document(fake_file, biz_a_id)
        assert doc_record["file_status"] == "ready"
        assert doc_record["chunk_count"] > 0
        doc_a_id = doc_record["_id"]

        # Check document retrieval
        all_docs = document_service.get_business_documents(biz_a_id)
        assert any(d["_id"] == doc_a_id for d in all_docs)

        # Check chunk retrieval
        chunks_stored = document_service.get_document_chunks(biz_a_id, doc_a_id)
        assert len(chunks_stored) == doc_record["chunk_count"]

        # Test reprocessing
        reprocessed = document_service.reprocess_document(biz_a_id, doc_a_id)
        assert reprocessed["file_status"] == "ready"

        print("  [PASS]: Upload, Extraction, Chunking, ChromaDB Vector Upsert & Reprocessing verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 6. RAG Modules: Agentic Router & Cross-Encoder Reranker
    try:
        print("\n[TEST 6] Verifying Modular RAG: Agentic Query Routing & Reranking...", flush=True)
        # Pricing query
        r1 = agentic_router.route_query("How much does the Pro Tier cost?")
        assert r1["intent"] == "pricing"
        assert r1["is_out_of_domain"] is False

        # Refund query
        r2 = agentic_router.route_query("What is the return and refund policy?")
        assert r2["intent"] == "refund_policy"

        # Out-of-domain query
        r3 = agentic_router.route_query("Please write a python script to calculate fibonacci")
        assert r3["is_out_of_domain"] is True
        assert r3["intent"] == "unknown_unsupported"

        # Reranker evaluation
        candidates = [
            {"chunk_id": "c1", "chunk_text": "Acme Cloud Delivery: Clusters deployed within 15 minutes.", "similarity_score": 0.5},
            {"chunk_id": "c2", "chunk_text": "The Acme Pro Tier costs $199 per month with automated backups.", "similarity_score": 0.75}
        ]
        reranked = cross_encoder_reranker.rerank("How much is the Pro tier?", candidates)
        assert reranked[0]["chunk_id"] == "c2"

        print("  [PASS]: Agentic Router & Cross-Encoder Reranker verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 7. Grounded AI Customer Chat & Source Attribution
    try:
        print("\n[TEST 7] Verifying Grounded Customer Chatbot & Source Attribution...", flush=True)
        # Query 1: Pricing
        res1 = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="What does the Acme Pro Tier cost?",
            language="en"
        )
        assert res1.answer_status == "grounded"
        assert "$199" in res1.message or "Pro Tier" in res1.message
        assert len(res1.source_documents) >= 1
        assert res1.source_documents[0].document_name == "acme_knowledge_base.txt"

        # Query 2: Refund
        res2 = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="What is the timeframe for refund requests?",
            conversation_id=res1.conversation_id,
            language="en"
        )
        assert res2.answer_status == "grounded"
        assert "30" in res2.message

        print("  [PASS]: Grounded AI Answers & Document Source Attribution verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 8. Strict Fallback for Unsupported Questions (Never Hallucinate)
    try:
        print("\n[TEST 8] Verifying Strict Fallback on Unsupported Information...", flush=True)
        unsupported_msg = "What is the secret recipe for Belgian dark chocolate?"
        un_res = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text=unsupported_msg,
            language="en"
        )
        assert un_res.answer_status == "unanswered_fallback"
        assert "I don't have this information in the available business documents" in un_res.message

        # Verify logged into unanswered_questions collection
        unans_col = db_manager.get_collection("unanswered_questions")
        logged = unans_col.find_one({"business_id": biz_a_id, "question": unsupported_msg})
        assert logged is not None
        assert logged["resolution_status"] == "pending"

        print("  [PASS]: Strict non-hallucination fallback & Unanswered Question logging verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 9. Multi-Tenant Strict Isolation
    try:
        print("\n[TEST 9] Verifying Multi-Tenant Strict Isolation (Cross-Business Breach Prevention)...", flush=True)
        # 1. Register Business B with unique email
        ts = int(time.time())
        reg_b = RegisterRequest(
            name="Dr. Sarah Connor",
            email=f"sarah_{ts}@nanotech.io",
            password="SecurePassword123!",
            business_name=f"NanoTech Labs {ts}",
            business_slug=f"nanotech-labs-{ts}",
            description="Nanotechnology and Advanced Polymers"
        )
        res_b = register(reg_b)
        biz_b_id = res_b.user.business_id

        # Business B uploads confidential document
        b_doc_content = "NanoTech Secret Specs: The Polymer-X melting point is strictly 3420 Kelvin."
        fake_b_file = UploadFile(
            filename="polymer_x_secret.txt",
            file=io.BytesIO(b_doc_content.encode('utf-8'))
        )
        doc_b_record = document_service.save_and_process_document(fake_b_file, biz_b_id)
        doc_b_id = doc_b_record["_id"]

        # Business A tries to read Business B's document by ID -> MUST return None / not found
        cross_read = document_service.get_document_by_id(business_id=biz_a_id, document_id=doc_b_id)
        assert cross_read is None, "SECURITY VIOLATION: Business A accessed Business B document!"

        # Business A attempts to delete Business B's document -> MUST return False
        cross_delete = document_service.delete_document(business_id=biz_a_id, document_id=doc_b_id)
        assert cross_delete is False, "SECURITY VIOLATION: Business A deleted Business B document!"

        # Customer on Acme Cloud asks about Polymer-X -> MUST return fallback, NEVER reveal 3420 Kelvin!
        cross_chat = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="What is the Polymer-X melting point?",
            language="en"
        )
        assert cross_chat.answer_status == "unanswered_fallback"
        assert "3420" not in cross_chat.message, "DATA LEAK: Cross-business confidential fact retrieved!"

        print("  [PASS]: Multi-Tenant Data Isolation strictly enforced across all operations")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 10. Live Human Support Ticket System
    try:
        print("\n[TEST 10] Verifying Live Human Support Ticket Lifecycle...", flush=True)
        conv_col = db_manager.get_collection("conversations")
        conv = conv_col.find_one({"business_id": biz_a_id})

        ticket_req = TicketCreateRequest(
            conversation_id=conv["_id"],
            customer_name="Alice Wang",
            customer_email="alice@customer.com",
            subject="Billing question for enterprise invoice",
            message="We would like to pay annual invoice via wire transfer."
        )
        t_res = create_support_ticket(ticket_req)
        assert t_res.status == "open"
        assert t_res.subject == "Billing question for enterprise invoice"

        # Owner retrieves tickets
        owner_dict = {"_id": user_a.id, "business_id": biz_a_id, "role": "business_owner"}
        tickets_list = get_business_tickets(current_user=owner_dict)
        assert any(t.id == t_res.id for t in tickets_list)

        print("  [PASS]: Live Human Support Ticket creation and management verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 11. Dashboard Overview & Analytics
    try:
        print("\n[TEST 11] Verifying Dashboard Overview & Recharts Analytics Aggregation...", flush=True)
        overview = dashboard_service.get_overview(biz_a_id)
        assert overview.total_conversations > 0
        assert overview.total_questions > 0
        assert overview.total_documents > 0
        assert 0.0 <= overview.answer_success_rate <= 100.0

        analytics = dashboard_service.get_analytics(biz_a_id)
        assert len(analytics.daily_stats) > 0
        assert analytics.sentiment_distribution is not None
        assert analytics.total_tickets >= 1

        print("  [PASS]: Dashboard KPIs, FAQ counter, and timeseries analytics verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    # 12. Settings & Data Export
    try:
        print("\n[TEST 12] Verifying Chatbot Customization & CSV Data Export...", flush=True)
        owner_dict = {"_id": user_a.id, "business_id": biz_a_id, "role": "business_owner"}
        s_current = get_chatbot_settings(current_user=owner_dict)
        assert s_current.theme_color is not None

        s_updated = update_chatbot_settings(
            ChatbotSettingsRequest(chatbot_name="Acme SuperBot", theme_color="#10b981"),
            current_user=owner_dict
        )
        assert s_updated.chatbot_name == "Acme SuperBot"
        assert s_updated.theme_color == "#10b981"

        # Export conversations CSV
        csv_convs = export_service.export_conversations_csv(biz_a_id)
        assert "Message ID,Conversation ID" in csv_convs
        assert "customer" in csv_convs

        # Export analytics CSV
        csv_stats = export_service.export_analytics_csv(biz_a_id)
        assert "Date,Total Chats" in csv_stats

        print("  [PASS]: Chatbot customization & CSV Data Exports verified")
        passed += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAIL]: {repr(e)}")
        failed += 1

    duration = round(time.time() - t_start, 2)
    print("\n" + "=" * 70, flush=True)
    print(f"SUMMARY: {passed} PASSED, {failed} FAILED in {duration}s", flush=True)
    print("=" * 70, flush=True)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_suite()
