from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.mongo import db_manager
from app.services.chat_service import chat_service
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatFeedbackRequest,
    FeedbackResponse,
    SuggestedQuestionsResponse
)

router = APIRouter(prefix="/chat", tags=["Public Customer Chat"])

@router.get("/{business_slug}/info")
def get_public_chatbot_info(business_slug: str):
    """
    Returns public branding, chatbot settings, and logo for customer interface.
    """
    biz_col = db_manager.get_collection("businesses")
    biz = biz_col.find_one({"business_slug": business_slug})
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")

    settings_col = db_manager.get_collection("chatbot_settings")
    settings_doc = settings_col.find_one({"business_id": str(biz["_id"])}) or {}

    return {
        "business_name": biz.get("business_name"),
        "business_slug": biz.get("business_slug"),
        "description": biz.get("description"),
        "logo": biz.get("logo"),
        "chatbot_name": settings_doc.get("chatbot_name", f"{biz.get('business_name')} Assistant"),
        "welcome_message": settings_doc.get("welcome_message", "Hello! How can I assist you with our services today?"),
        "theme_color": settings_doc.get("theme_color", "#4f46e5"),
        "greeting_text": settings_doc.get("greeting_text", "We're here to help you 24/7"),
        "supported_languages": settings_doc.get("supported_languages", ["en", "hi", "mr"]),
        "enable_voice": settings_doc.get("enable_voice", True),
        "enable_suggestions": settings_doc.get("enable_suggestions", True)
    }

@router.post("/{business_slug}/message", response_model=ChatMessageResponse)
def send_chat_message(business_slug: str, req: ChatMessageRequest):
    """
    Customer asks question. Response is strictly retrieved from the business knowledge base.
    """
    return chat_service.process_customer_message(
        business_slug=business_slug,
        message_text=req.message,
        conversation_id=req.conversation_id,
        customer_id=req.customer_id,
        language=req.language
    )

@router.get("/{business_slug}/history")
def get_chat_history(
    business_slug: str,
    conversation_id: str = Query(..., description="Active conversation session ID")
):
    return chat_service.get_conversation_history(business_slug, conversation_id)

@router.post("/{business_slug}/feedback", response_model=FeedbackResponse)
def submit_chat_feedback(business_slug: str, req: ChatFeedbackRequest):
    feedback_id = chat_service.record_feedback(
        business_slug=business_slug,
        conversation_id=req.conversation_id,
        rating=req.rating,
        comment=req.comment,
        message_id=req.message_id
    )
    return FeedbackResponse(
        message="Thank you! Your feedback has been received.",
        id=feedback_id
    )

@router.get("/{business_slug}/suggested-questions", response_model=SuggestedQuestionsResponse)
def get_suggested_questions(business_slug: str):
    """
    Extracts high-relevance suggested questions from uploaded business documents.
    """
    biz_col = db_manager.get_collection("businesses")
    biz = biz_col.find_one({"business_slug": business_slug})
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found.")

    business_id = str(biz["_id"])
    chunks_col = db_manager.get_collection("document_chunks")
    chunks = list(chunks_col.find({"business_id": business_id}))

    suggested = []
    import re
    for c in chunks:
        text = c.get("chunk_text", "")
        questions = re.findall(r'([A-Z][^\n\?]+\?)', text)
        for q in questions:
            q_clean = q.strip()
            if 15 < len(q_clean) < 80 and q_clean not in suggested:
                suggested.append(q_clean)
                if len(suggested) >= 5:
                    return SuggestedQuestionsResponse(questions=suggested)

    if not suggested:
        suggested = [
            "What products and services do you offer?",
            "What are your business hours and location?",
            "What is your pricing and payment policy?",
            "How does your return or refund policy work?",
            "How can I contact the human support team?"
        ]

    return SuggestedQuestionsResponse(questions=suggested)
