from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.deps import get_current_business_owner
from app.services.dashboard_service import dashboard_service
from app.services.chat_service import chat_service
from app.database.mongo import db_manager
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    AnalyticsResponse,
    UnansweredQuestionResponse,
    ResolveQuestionRequest
)

router = APIRouter(prefix="/dashboard", tags=["Owner Dashboard"])

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    return dashboard_service.get_overview(business_id)

@router.get("/analytics", response_model=AnalyticsResponse)
def get_dashboard_analytics(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    return dashboard_service.get_analytics(business_id)

@router.get("/conversations")
def get_dashboard_conversations(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    conv_col = db_manager.get_collection("conversations")
    msg_col = db_manager.get_collection("messages")

    convs = list(conv_col.find({"business_id": business_id}))
    convs.sort(key=lambda x: x.get("started_at", ""), reverse=True)

    results = []
    for c in convs[:limit]:
        cid = c["_id"]
        msgs = list(msg_col.find({"business_id": business_id, "conversation_id": cid}))
        msgs.sort(key=lambda x: x.get("created_at", ""))
        first_q = next((m.get("message") for m in msgs if m.get("sender") == "customer"), "Conversation started")
        results.append({
            "id": cid,
            "customer_id": c.get("customer_id"),
            "status": c.get("conversation_status", "active"),
            "started_at": c.get("started_at"),
            "message_count": len(msgs),
            "preview": first_q,
            "messages": msgs
        })

    return results

@router.get("/conversations/{conversation_id}/summary")
def get_conversation_summary(
    conversation_id: str,
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    summary = chat_service.generate_conversation_summary(business_id, conversation_id)
    return {"conversation_id": conversation_id, "summary": summary}

@router.get("/unanswered-questions", response_model=List[UnansweredQuestionResponse])
def get_unanswered_questions(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    return dashboard_service.get_unanswered_questions(business_id)

@router.put("/unanswered-questions/{question_id}/resolve")
def resolve_question(
    question_id: str,
    req: ResolveQuestionRequest,
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    success = dashboard_service.resolve_unanswered_question(
        business_id=business_id,
        question_id=question_id,
        notes=req.resolution_notes,
        status=req.status
    )
    if not success:
        raise HTTPException(status_code=404, detail="Question not found or already resolved.")
    return {"message": "Question successfully updated."}

@router.get("/feedback")
def get_customer_feedback(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    feed_col = db_manager.get_collection("feedback")
    records = list(feed_col.find({"business_id": business_id}))
    records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [
        {
            "id": r["_id"],
            "business_id": r.get("business_id"),
            "conversation_id": r.get("conversation_id"),
            "rating": r.get("rating", 5),
            "comment": r.get("comment", ""),
            "created_at": r.get("created_at", "")
        }
        for r in records
    ]

@router.get("/sentiment")
def get_sentiment_analysis(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    msg_col = db_manager.get_collection("messages")
    msgs = list(msg_col.find({"business_id": business_id, "sender": "customer"}))
    
    from collections import Counter
    counts = Counter([m.get("sentiment", "neutral") for m in msgs])
    total = len(msgs) or 1
    
    negative_msgs = [
        {
            "id": m.get("_id"),
            "conversation_id": m.get("conversation_id"),
            "message": m.get("message"),
            "created_at": m.get("created_at")
        }
        for m in msgs if m.get("sentiment") == "negative"
    ][:20]

    return {
        "total_analyzed": len(msgs),
        "distribution": {
            "positive": counts.get("positive", 0),
            "neutral": counts.get("neutral", 0),
            "negative": counts.get("negative", 0)
        },
        "percentages": {
            "positive": round((counts.get("positive", 0) / total) * 100, 1),
            "neutral": round((counts.get("neutral", 0) / total) * 100, 1),
            "negative": round((counts.get("negative", 0) / total) * 100, 1)
        },
        "flagged_negative_queries": negative_msgs
    }

