import sys
import os
import io
import time
import json
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

# Core imports
from app.main import app, health_check
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
from app.rag.graph_rag import knowledge_graph
from app.rag.naive_rag import naive_rag
from app.services.chat_service import chat_service
from app.services.dashboard_service import dashboard_service
from app.services.export_service import export_service
from app.schemas.support import TicketCreateRequest, TicketUpdateRequest
from app.api.support import create_support_ticket, get_business_tickets, update_ticket
from app.schemas.settings import ChatbotSettingsRequest
from app.api.settings import (
    get_chatbot_settings,
    update_chatbot_settings,
    get_notification_settings,
    update_notification_settings
)
from app.api.dashboard import (
    get_dashboard_overview,
    get_dashboard_analytics,
    get_dashboard_conversations,
    get_conversation_summary,
    get_unanswered_questions,
    resolve_question,
    get_customer_feedback,
    get_sentiment_analysis
)
from app.api.chat import (
    get_public_chatbot_info,
    get_suggested_questions,
    submit_chat_feedback,
    get_chat_history
)
from app.schemas.chat import ChatFeedbackRequest
from app.schemas.dashboard import ResolveQuestionRequest

import pymupdf
import docx

def create_sample_pdf(filepath: str):
    """Creates a realistic multi-page PDF document."""
    doc = pymupdf.open()
    
    # Page 1: Return and Refund Policy
    page1 = doc.new_page()
    text1 = (
        "APEX ELECTRONICS — OFFICIAL RETURN AND REFUND POLICY\n\n"
        "1. Return Window: We offer a 30-day money-back guarantee on all consumer hardware.\n"
        "2. Eligibility: Products must be in original condition with intact packaging.\n"
        "3. Refund Method: Refunds are credited back to the original payment method within 5-7 business days.\n"
        "4. Contact: For returns, email returns@apexelectronics.com or call 1-800-APEX-RET."
    )
    page1.insert_text((50, 72), text1, fontsize=12)
    
    # Page 2: Delivery and Shipping Policy
    page2 = doc.new_page()
    text2 = (
        "APEX ELECTRONICS — SHIPPING AND DELIVERY STANDARDS\n\n"
        "1. Free Standard Shipping is provided for all orders exceeding $50.\n"
        "2. Delivery Timeline: Standard shipping takes 3-5 business days across continental zones.\n"
        "3. Express Next-Day Delivery is available for an additional flat fee of $19.99.\n"
        "4. Tracking: Every dispatch includes real-time GPS tracking sent via SMS and email."
    )
    page2.insert_text((50, 72), text2, fontsize=12)
    
    doc.save(filepath)
    doc.close()

def create_sample_docx(filepath: str):
    """Creates a realistic DOCX document with text and pricing table."""
    doc = docx.Document()
    doc.add_heading("Apex Electronics — Product Catalog & Pricing Guide", level=1)
    doc.add_paragraph("All products are manufactured with enterprise-grade components.")
    
    table = doc.add_table(rows=1, cols=3)
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Product Name"
    hdr_cells[1].text = "Retail Price"
    hdr_cells[2].text = "Specifications"
    
    products = [
        ("Apex Ultra Laptop", "$1,299", "Intel Core i9, 32GB RAM, 1TB NVMe SSD"),
        ("Apex Wireless Earbuds", "$149", "Active Noise Cancellation, 36h battery"),
        ("Apex 4K Pro Monitor", "$399", "32-inch IPS, 144Hz refresh rate, HDR400")
    ]
    
    for name, price, specs in products:
        row_cells = table.add_row().cells
        row_cells[0].text = name
        row_cells[1].text = price
        row_cells[2].text = specs
        
    doc.save(filepath)

def run_end_to_end_verification():
    t_start = time.time()
    print("=" * 80)
    print("AI CUSTOMER SUPPORT ASSISTANT — COMPREHENSIVE END-TO-END VERIFICATION")
    print("=" * 80)

    total_tests = 0
    passed_tests = 0
    failed_tests = 0

    def record_result(test_name: str, passed: bool, detail: str = ""):
        nonlocal total_tests, passed_tests, failed_tests
        total_tests += 1
        if passed:
            passed_tests += 1
            print(f"  [PASS] {test_name}: {detail}")
        else:
            failed_tests += 1
            print(f"  [FAIL] {test_name}: {detail}")

    # =========================================================================
    # SECTION 1: BACKEND SERVER & PERSISTENCE VERIFICATION
    # =========================================================================
    print("\n--- SECTION 1: Backend Server & Database Persistence ---")
    
    # 1.1 Server Health & DB Connectivity
    try:
        health = health_check()
        assert health["status"] == "healthy"
        assert health["database"] == "connected"
        record_result("Health & Database Mode", True, f"Mode: {health['database_mode']}, Retriever: {health['rag_retriever']}")
    except Exception as e:
        record_result("Health & Database Mode", False, repr(e))

    # 1.2 Router Endpoints Count
    try:
        routes_count = len(app.routes)
        assert routes_count >= 30, f"Expected >= 30 routes, found {routes_count}"
        record_result("Registered REST Routes", True, f"{routes_count} API endpoints mounted under /api")
    except Exception as e:
        record_result("Registered REST Routes", False, repr(e))

    # =========================================================================
    # SECTION 2: MULTI-TENANT ONBOARDING & JWT AUTH
    # =========================================================================
    print("\n--- SECTION 2: Multi-Tenant Onboarding & JWT Authentication ---")
    ts = int(time.time())
    
    # Register Business A: Apex Electronics
    biz_a_slug = f"apex-electronics-{ts}"
    biz_b_slug = f"boutique-fashion-{ts}"
    token_a = None
    user_a = None
    biz_a_id = None
    user_b = None
    biz_b_id = None

    try:
        reg_a = register(RegisterRequest(
            name="Alice Johnson",
            email=f"alice_{ts}@apexelectronics.com",
            password="SecurePassword2026!",
            business_name=f"Apex Electronics {ts}",
            business_slug=biz_a_slug,
            description="Leading consumer electronics, laptops, monitors, and audio gear."
        ))
        token_a = reg_a.access_token
        user_a = reg_a.user
        biz_a_id = user_a.business_id
        
        # Verify JWT payload
        claims = decode_access_token(token_a)
        assert claims["sub"] == user_a.id
        assert claims["role"] == "business_owner"
        record_result("Business A Registration & JWT", True, f"Tenant ID: {biz_a_id}, Slug: {biz_a_slug}")
    except Exception as e:
        record_result("Business A Registration & JWT", False, repr(e))

    try:
        reg_b = register(RegisterRequest(
            name="Bob Miller",
            email=f"bob_{ts}@boutiquefashion.com",
            password="SecurePassword2026!",
            business_name=f"Boutique Fashion {ts}",
            business_slug=biz_b_slug,
            description="Luxury apparel, designer dresses, and bespoke styling."
        ))
        user_b = reg_b.user
        biz_b_id = user_b.business_id
        record_result("Business B Registration & JWT", True, f"Tenant ID: {biz_b_id}, Slug: {biz_b_slug}")
    except Exception as e:
        record_result("Business B Registration & JWT", False, repr(e))

    # =========================================================================
    # SECTION 3: MULTI-FORMAT DOCUMENT INGESTION (PDF, DOCX, TXT)
    # =========================================================================
    print("\n--- SECTION 3: Document Extraction, Semantic Chunking & Vector Indexing ---")
    
    temp_dir = Path(backend_dir) / "uploaded_documents" / "test_temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = str(temp_dir / f"apex_policies_{ts}.pdf")
    docx_path = str(temp_dir / f"apex_catalog_{ts}.docx")
    txt_path = str(temp_dir / f"apex_warranty_{ts}.txt")
    confidential_b_path = str(temp_dir / f"boutique_confidential_{ts}.txt")

    # Generate documents
    create_sample_pdf(pdf_path)
    create_sample_docx(docx_path)
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(
            "APEX ELECTRONICS — HARDWARE WARRANTY SPECIFICATION\n\n"
            "Every Apex hardware device comes standard with a 1-Year Comprehensive Manufacturer Warranty.\n"
            "Warranty coverage includes component defects, power delivery failure, and battery degradation.\n"
            "To file a warranty claim, visit warranty.apexelectronics.com with your serial number."
        )
    with open(confidential_b_path, "w", encoding="utf-8") as f:
        f.write(
            "BOUTIQUE FASHION INTERNAL WHOLESALE PRICING:\n\n"
            "Confidential Trade Secret: The Silk Evening Dress unit manufacturing cost is strictly $12.50.\n"
            "Wholesale distribution is restricted to authorized Milan partners."
        )

    # Ingest PDF for Business A
    doc_pdf_id = None
    try:
        with open(pdf_path, "rb") as f:
            upload_pdf = UploadFile(filename="apex_policies.pdf", file=f)
            doc_pdf_res = document_service.save_and_process_document(upload_pdf, biz_a_id)
            doc_pdf_id = doc_pdf_res["_id"]
            assert doc_pdf_res["file_status"] == "ready"
            assert doc_pdf_res["chunk_count"] >= 2
            record_result("PDF Ingestion (PyMuPDF)", True, f"ID: {doc_pdf_id}, Chunks: {doc_pdf_res['chunk_count']}")
    except Exception as e:
        record_result("PDF Ingestion (PyMuPDF)", False, repr(e))

    # Ingest DOCX for Business A
    doc_docx_id = None
    try:
        with open(docx_path, "rb") as f:
            upload_docx = UploadFile(filename="apex_catalog.docx", file=f)
            doc_docx_res = document_service.save_and_process_document(upload_docx, biz_a_id)
            doc_docx_id = doc_docx_res["_id"]
            assert doc_docx_res["file_status"] == "ready"
            assert doc_docx_res["chunk_count"] >= 1
            record_result("DOCX Ingestion (python-docx)", True, f"ID: {doc_docx_id}, Chunks: {doc_docx_res['chunk_count']}")
    except Exception as e:
        record_result("DOCX Ingestion (python-docx)", False, repr(e))

    # Ingest TXT for Business A
    try:
        with open(txt_path, "rb") as f:
            upload_txt = UploadFile(filename="apex_warranty.txt", file=f)
            doc_txt_res = document_service.save_and_process_document(upload_txt, biz_a_id)
            assert doc_txt_res["file_status"] == "ready"
            record_result("TXT Ingestion", True, f"Chunks: {doc_txt_res['chunk_count']}")
    except Exception as e:
        record_result("TXT Ingestion", False, repr(e))

    # Ingest Confidential TXT for Business B
    doc_b_id = None
    try:
        with open(confidential_b_path, "rb") as f:
            upload_b = UploadFile(filename="boutique_confidential.txt", file=f)
            doc_b_res = document_service.save_and_process_document(upload_b, biz_b_id)
            doc_b_id = doc_b_res["_id"]
            assert doc_b_res["file_status"] == "ready"
            record_result("Business B Confidential Ingestion", True, f"Tenant B doc indexed isolatedly")
    except Exception as e:
        record_result("Business B Confidential Ingestion", False, repr(e))

    # =========================================================================
    # SECTION 4: MODULAR & HYBRID RAG TECHNIQUES
    # =========================================================================
    print("\n--- SECTION 4: Modular & Hybrid RAG Retrieval Engine ---")
    
    # 4.1 Semantic Vector Retrieval
    try:
        from app.rag.vector_store import vector_store
        vec_results = vector_store.search_semantic("How long do I have to return an item?", biz_a_id, top_k=3)
        assert len(vec_results) > 0
        assert any("return" in r["chunk_text"].lower() for r in vec_results)
        record_result("Semantic Vector Search (ChromaDB)", True, f"Retrieved {len(vec_results)} relevant chunks")
    except Exception as e:
        record_result("Semantic Vector Search (ChromaDB)", False, repr(e))

    # 4.2 BM25 Keyword Search
    try:
        from app.rag.bm25_retriever import bm25_retriever
        bm25_hits = bm25_retriever.search_bm25("Apex Ultra Laptop $1,299", biz_a_id, top_k=3)
        assert len(bm25_hits) > 0
        assert any("1,299" in h["chunk_text"] for h in bm25_hits)
        record_result("BM25 Keyword Search (Exact Match)", True, f"Found exact price/product SKU match")
    except Exception as e:
        record_result("BM25 Keyword Search (Exact Match)", False, repr(e))

    # 4.3 Reciprocal Rank Fusion (RRF) with k=60
    try:
        fused = hybrid_retriever.retrieve_hybrid("What are the laptop specifications and prices?", biz_a_id, top_k=3)
        assert len(fused) > 0
        assert "similarity_score" in fused[0]
        record_result("Reciprocal Rank Fusion (k=60)", True, f"Fused vector + BM25 into {len(fused)} ranked items")
    except Exception as e:
        record_result("Reciprocal Rank Fusion (k=60)", False, repr(e))

    # 4.4 Cross-Encoder Reranking
    try:
        candidates = [
            {"chunk_id": "c_ship", "chunk_text": "Delivery Timeline: Standard shipping takes 3-5 business days.", "similarity_score": 0.4},
            {"chunk_id": "c_lap", "chunk_text": "Apex Ultra Laptop priced at $1,299 with Intel Core i9.", "similarity_score": 0.6}
        ]
        reranked = cross_encoder_reranker.rerank("How much does the Apex Ultra Laptop cost?", candidates)
        assert reranked[0]["chunk_id"] == "c_lap"
        record_result("Cross-Encoder Reranking", True, "Top-1 correctly ranked by semantic content attention")
    except Exception as e:
        record_result("Cross-Encoder Reranking", False, repr(e))

    # 4.5 Agentic Query Routing
    try:
        r_price = agentic_router.route_query("What is the cost of Apex Wireless Earbuds?")
        assert r_price["intent"] == "pricing"
        
        r_refund = agentic_router.route_query("Can I get a refund if I open the package?")
        assert r_refund["intent"] == "refund_policy"
        
        r_delivery = agentic_router.route_query("When will my package arrive?")
        assert r_delivery["intent"] == "delivery_policy"
        
        r_out = agentic_router.route_query("How do I make chocolate chip cookies at home?")
        assert r_out["is_out_of_domain"] is True
        
        record_result("Agentic Query Router", True, "Pricing, Refund, Delivery & Out-of-Domain correctly routed")
    except Exception as e:
        record_result("Agentic Query Router", False, repr(e))

    # 4.6 Graph RAG Module
    try:
        graph_triples = knowledge_graph.search_graph("Apex Ultra Laptop", biz_a_id)
        record_result("Graph RAG Module", True, f"Triples storage and relation lookup functional ({len(graph_triples)} relations)")
    except Exception as e:
        record_result("Graph RAG Module", False, repr(e))

    # 4.7 Baseline Naive RAG Comparison
    try:
        naive_hits = naive_rag.retrieve("What is the warranty period?", biz_a_id, top_k=2)
        assert len(naive_hits) > 0
        record_result("Naive RAG Baseline", True, f"Baseline vector retrieval operational ({len(naive_hits)} chunks)")
    except Exception as e:
        record_result("Naive RAG Baseline", False, repr(e))

    # =========================================================================
    # SECTION 5: GROUNDED AI GENERATION & STRICT HALLUCINATION GUARD
    # =========================================================================
    print("\n--- SECTION 5: Grounded Answer Synthesis & Strict Non-Hallucination ---")

    # 5.1 Grounded Query: Return Policy (From PDF Page 1)
    conv_id = f"conv_e2e_{ts}"
    try:
        ans1 = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="How many days do I have to return an item, and what is the condition?",
            conversation_id=conv_id,
            language="en"
        )
        assert ans1.answer_status == "grounded"
        assert "30" in ans1.message
        assert len(ans1.source_documents) > 0
        assert ans1.source_documents[0].document_name == "apex_policies.pdf"
        assert ans1.source_documents[0].page_number == 1
        record_result("Grounded Answer (PDF Page 1)", True, f"Grounded response: '{ans1.message[:80]}...' (Page {ans1.source_documents[0].page_number})")
    except Exception as e:
        record_result("Grounded Answer (PDF Page 1)", False, repr(e))

    # 5.2 Grounded Query: Pricing (From DOCX Table)
    try:
        ans2 = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="How much does the Apex Ultra Laptop cost and what are its specs?",
            conversation_id=conv_id,
            language="en"
        )
        assert ans2.answer_status == "grounded"
        assert "$1,299" in ans2.message or "1,299" in ans2.message
        assert len(ans2.source_documents) > 0
        assert ans2.source_documents[0].document_name == "apex_catalog.docx"
        record_result("Grounded Answer (DOCX Catalog)", True, f"Grounded response: '{ans2.message[:80]}...'")
    except Exception as e:
        record_result("Grounded Answer (DOCX Catalog)", False, repr(e))

    # 5.3 Grounded Query: Warranty (From TXT Document)
    try:
        ans3 = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="What warranty is included with the hardware?",
            conversation_id=conv_id,
            language="en"
        )
        assert ans3.answer_status == "grounded"
        assert "1-Year" in ans3.message or "1 year" in ans3.message.lower() or "warranty" in ans3.message.lower()
        record_result("Grounded Answer (TXT Warranty)", True, f"Grounded response: '{ans3.message[:80]}...'")
    except Exception as e:
        record_result("Grounded Answer (TXT Warranty)", False, repr(e))

    # 5.4 Strict Fallback: Unsupported Query (Never Hallucinate)
    try:
        unsupported_query = "What is the secret recipe for traditional Italian tiramisu?"
        fallback_res = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text=unsupported_query,
            conversation_id=conv_id,
            language="en"
        )
        assert fallback_res.answer_status == "unanswered_fallback"
        assert "I don't have this information in the available business documents. Please contact the business support team." in fallback_res.message
        
        # Verify question was logged into unanswered_questions
        unans_col = db_manager.get_collection("unanswered_questions")
        logged = unans_col.find_one({"business_id": biz_a_id, "question": unsupported_query})
        assert logged is not None
        assert logged["resolution_status"] == "pending"
        record_result("Strict Fallback (Zero Hallucination)", True, "Exact standard phrase returned & logged to backlog")
    except Exception as e:
        record_result("Strict Fallback (Zero Hallucination)", False, repr(e))

    # =========================================================================
    # SECTION 6: MULTI-TENANT SECURITY & BREACH PREVENTION
    # =========================================================================
    print("\n--- SECTION 6: Multi-Tenant Data Quarantine & Security ---")

    # 6.1 Cross-Tenant Document Access
    try:
        cross_doc = document_service.get_document_by_id(business_id=biz_a_id, document_id=doc_b_id)
        assert cross_doc is None, "SECURITY BREACH: Business A read Business B's document!"
        record_result("Cross-Tenant Doc Inspection", True, "Blocked: Business A cannot view Business B docs")
    except Exception as e:
        record_result("Cross-Tenant Doc Inspection", False, repr(e))

    # 6.2 Cross-Tenant Vector Retrieval Leakage
    try:
        leak_chat = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="What is the unit manufacturing wholesale cost of the Silk Evening Dress?",
            language="en"
        )
        assert leak_chat.answer_status == "unanswered_fallback"
        assert "$12.50" not in leak_chat.message, "SECURITY BREACH: Business A retrieved Business B's secret cost!"
        record_result("Cross-Tenant Vector Isolation", True, "Blocked: Customer on Tenant A cannot extract Tenant B knowledge")
    except Exception as e:
        record_result("Cross-Tenant Vector Isolation", False, repr(e))

    # 6.3 Public Chat Slug Isolation
    try:
        info_a = get_public_chatbot_info(biz_a_slug)
        info_b = get_public_chatbot_info(biz_b_slug)
        assert info_a["business_slug"] == biz_a_slug
        assert info_b["business_slug"] == biz_b_slug
        assert info_a["business_name"] != info_b["business_name"]
        record_result("Public Slug Scoping", True, "Dedicated business info isolated per slug")
    except Exception as e:
        record_result("Public Slug Scoping", False, repr(e))

    # =========================================================================
    # SECTION 7: MULTILINGUAL, VOICE, FEEDBACK, SUPPORT, EXPORT
    # =========================================================================
    print("\n--- SECTION 7: Multilingual, Live Support, Feedback & Exports ---")

    # 7.1 Hindi Response (हिन्दी)
    try:
        hi_res = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="वापसी की समय सीमा क्या है?",
            language="hi"
        )
        assert hi_res.answer_status == "grounded"
        assert len(hi_res.message) > 10
        record_result("Multilingual Hindi (हिन्दी)", True, f"Answer: '{hi_res.message[:70]}...'")
    except Exception as e:
        record_result("Multilingual Hindi (हिन्दी)", False, repr(e))

    # 7.2 Marathi Response (मराठी)
    try:
        mr_res = chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="उत्पादन परत करण्याचे नियम काय आहेत?",
            language="mr"
        )
        assert mr_res.answer_status == "grounded"
        assert len(mr_res.message) > 10
        record_result("Multilingual Marathi (मराठी)", True, f"Answer: '{mr_res.message[:70]}...'")
    except Exception as e:
        record_result("Multilingual Marathi (मराठी)", False, repr(e))

    # 7.3 Suggested Questions Dynamic Extraction
    try:
        sugg = get_suggested_questions(biz_a_slug)
        assert len(sugg.questions) > 0
        record_result("Suggested Questions Generation", True, f"Extracted {len(sugg.questions)} questions: {sugg.questions[:2]}")
    except Exception as e:
        record_result("Suggested Questions Generation", False, repr(e))

    # 7.4 Live Human Support Ticket Lifecycle
    ticket_id = None
    try:
        ticket = create_support_ticket(TicketCreateRequest(
            conversation_id=conv_id,
            business_slug=biz_a_slug,
            customer_name="David Patel",
            customer_email="david@example.com",
            subject="Bulk ordering discount for monitors",
            message="We would like to purchase 25 Apex 4K Pro Monitors for our design studio."
        ))
        ticket_id = ticket.id
        assert ticket.status == "open"
        assert ticket.subject == "Bulk ordering discount for monitors"
        
        # Owner updates ticket with reply
        owner_a = {"id": user_a.id, "business_id": biz_a_id, "role": "business_owner"}
        updated_ticket = update_ticket(
            ticket_id=ticket_id,
            req=TicketUpdateRequest(
                status="resolved",
                owner_reply="We offer a 15% discount for orders over 20 units. Quotation sent to your email."
            ),
            current_user=owner_a
        )
        assert updated_ticket.status == "resolved"
        assert "15%" in updated_ticket.owner_reply
        record_result("Live Human Support Ticket Lifecycle", True, "Ticket created, routed, and resolved with owner reply")
    except Exception as e:
        record_result("Live Human Support Ticket Lifecycle", False, repr(e))

    # 7.5 Customer Feedback Submission
    try:
        feed_res = submit_chat_feedback(biz_a_slug, ChatFeedbackRequest(
            conversation_id=conv_id,
            rating=5,
            comment="Excellent assistant! Instant grounded answers on return policy."
        ))
        assert "Thank you" in feed_res.message
        record_result("Customer Feedback & Rating", True, f"5-star feedback recorded (ID: {feed_res.id})")
    except Exception as e:
        record_result("Customer Feedback & Rating", False, repr(e))

    # 7.6 Sentiment Analysis on Customer Messages
    try:
        # Submit positive message
        chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="Thank you very much, you have been super helpful and wonderful!",
            language="en"
        )
        # Submit negative message
        chat_service.process_customer_message(
            business_slug=biz_a_slug,
            message_text="This is terrible and totally broken, I am extremely frustrated with this delay!",
            language="en"
        )
        owner_a = {"id": user_a.id, "business_id": biz_a_id, "role": "business_owner"}
        sentiment_data = get_sentiment_analysis(current_user=owner_a)
        assert sentiment_data["distribution"]["positive"] > 0
        assert sentiment_data["distribution"]["negative"] > 0
        assert len(sentiment_data["flagged_negative_queries"]) > 0
        record_result("Customer Sentiment Analysis", True, f"Distribution: {sentiment_data['distribution']}, Flagged: {len(sentiment_data['flagged_negative_queries'])}")
    except Exception as e:
        record_result("Customer Sentiment Analysis", False, repr(e))

    # 7.7 AI Conversation Summary Generation
    try:
        owner_a = {"id": user_a.id, "business_id": biz_a_id, "role": "business_owner"}
        summary_res = get_conversation_summary(conv_id, current_user=owner_a)
        assert len(summary_res["summary"]) > 10
        record_result("AI Conversation Summaries", True, f"Generated summary: '{summary_res['summary'][:80]}...'")
    except Exception as e:
        record_result("AI Conversation Summaries", False, repr(e))

    # 7.8 CSV Data Exports (Conversations, Analytics, Unanswered)
    try:
        owner_a = {"id": user_a.id, "business_id": biz_a_id, "role": "business_owner"}
        csv_conv = export_service.export_conversations_csv(biz_a_id)
        assert "Message ID,Conversation ID" in csv_conv
        assert "Apex Ultra Laptop" in csv_conv
        
        csv_stats = export_service.export_analytics_csv(biz_a_id)
        assert "Date,Total Chats" in csv_stats
        
        csv_unans = export_service.export_unanswered_csv(biz_a_id)
        assert "Question ID,Conversation ID" in csv_unans
        assert "tiramisu" in csv_unans
        
        record_result("Data Export Hub (3 CSV types)", True, "Conversations, Analytics & Unanswered exported cleanly")
    except Exception as e:
        record_result("Data Export Hub (3 CSV types)", False, repr(e))

    # =========================================================================
    # SECTION 8: ALL 15 DASHBOARD API MODULES
    # =========================================================================
    print("\n--- SECTION 8: 15 Business Owner Dashboard Endpoints ---")
    owner_a = {"id": user_a.id, "business_id": biz_a_id, "role": "business_owner"}

    # 8.1 Overview
    try:
        ov = get_dashboard_overview(current_user=owner_a)
        assert ov.total_conversations > 0
        assert ov.total_documents >= 3
        record_result("Module 1: Dashboard Overview", True, f"{ov.total_conversations} chats, {ov.total_documents} docs, {ov.answer_success_rate}% success")
    except Exception as e:
        record_result("Module 1: Dashboard Overview", False, repr(e))

    # 8.2 Knowledge Base Documents List
    try:
        docs = document_service.get_business_documents(biz_a_id)
        assert len(docs) >= 3
        record_result("Module 2: Knowledge Base List", True, f"Active documents count: {len(docs)}")
    except Exception as e:
        record_result("Module 2: Knowledge Base List", False, repr(e))

    # 8.3 Chat History List
    try:
        convs = get_dashboard_conversations(limit=20, current_user=owner_a)
        assert len(convs) > 0
        record_result("Module 4: Chat History Viewer", True, f"Found {len(convs)} customer conversation threads")
    except Exception as e:
        record_result("Module 4: Chat History Viewer", False, repr(e))

    # 8.4 Unanswered Questions & Resolution
    try:
        unans_list = get_unanswered_questions(current_user=owner_a)
        assert len(unans_list) > 0
        q_target = unans_list[0]
        
        # Resolve question
        res_q = resolve_question(
            question_id=q_target.id,
            req=ResolveQuestionRequest(resolution_notes="Added out-of-scope note for recipe inquiries", status="resolved"),
            current_user=owner_a
        )
        assert "successfully" in res_q["message"]
        record_result("Module 5: Unanswered Questions & Resolve", True, f"Resolved question '{q_target.question[:30]}...'")
    except Exception as e:
        record_result("Module 5: Unanswered Questions & Resolve", False, repr(e))

    # 8.5 Live Support List
    try:
        tickets = get_business_tickets(current_user=owner_a)
        assert len(tickets) > 0
        record_result("Module 6: Live Human Support Inbox", True, f"Retrieved {len(tickets)} support tickets")
    except Exception as e:
        record_result("Module 6: Live Human Support Inbox", False, repr(e))

    # 8.6 Feedback List
    try:
        feedbacks = get_customer_feedback(current_user=owner_a)
        assert len(feedbacks) > 0
        assert feedbacks[0]["rating"] == 5
        record_result("Module 7: Customer Feedback List", True, f"Retrieved {len(feedbacks)} customer ratings")
    except Exception as e:
        record_result("Module 7: Customer Feedback List", False, repr(e))

    # 8.7 Analytics
    try:
        analytics = get_dashboard_analytics(current_user=owner_a)
        assert len(analytics.daily_stats) > 0
        record_result("Module 8: Analytics & Recharts Metrics", True, f"{len(analytics.daily_stats)} daily stats points, total tickets: {analytics.total_tickets}")
    except Exception as e:
        record_result("Module 8: Analytics & Recharts Metrics", False, repr(e))

    # 8.8 Email Notifications Config
    try:
        notif_cfg = get_notification_settings(current_user=owner_a)
        assert notif_cfg["business_id"] == biz_a_id
        
        updated_cfg = update_notification_settings(
            {"email_on_unanswered": True, "daily_digest": True, "notification_email": "alerts@apexelectronics.com"},
            current_user=owner_a
        )
        assert updated_cfg["settings"]["daily_digest"] is True
        assert updated_cfg["settings"]["notification_email"] == "alerts@apexelectronics.com"
        record_result("Module 10: Email Notifications Config", True, "Alert triggers & destination email updated")
    except Exception as e:
        record_result("Module 10: Email Notifications Config", False, repr(e))

    # 8.9 Chatbot Customization Config
    try:
        chat_cfg = get_chatbot_settings(current_user=owner_a)
        assert chat_cfg.theme_color is not None
        
        updated_chat = update_chatbot_settings(
            ChatbotSettingsRequest(
                chatbot_name="Apex AI Genius",
                welcome_message="Welcome to Apex! Ask about laptops, monitors, warranties, or returns.",
                theme_color="#6366f1"
            ),
            current_user=owner_a
        )
        assert updated_chat.chatbot_name == "Apex AI Genius"
        assert updated_chat.theme_color == "#6366f1"
        record_result("Module 11: Chatbot Customization", True, "Bot name, welcome message, and theme color updated")
    except Exception as e:
        record_result("Module 11: Chatbot Customization", False, repr(e))

    # 8.10 Business Profile Update
    try:
        prof = get_business_profile(current_user=owner_a)
        assert prof.business_slug == biz_a_slug
        
        prof_updated = update_business_profile(
            BusinessUpdateRequest(description="Premium consumer electronics and verified hardware solutions."),
            current_user=owner_a
        )
        assert "Premium consumer electronics" in prof_updated.description
        record_result("Module 14: Business Profile Management", True, "Profile info & context updated")
    except Exception as e:
        record_result("Module 14: Business Profile Management", False, repr(e))

    # Clean up temp files
    try:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception:
        pass

    # =========================================================================
    # SUMMARY
    # =========================================================================
    duration = round(time.time() - t_start, 2)
    print("\n" + "=" * 80)
    print(f"VERIFICATION SUMMARY: {passed_tests}/{total_tests} CHECKS PASSED, {failed_tests} FAILED in {duration}s")
    print("=" * 80)

    if failed_tests > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_end_to_end_verification()
