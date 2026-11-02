import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_business_owner
from app.database.mongo import db_manager
from app.schemas.settings import ChatbotSettingsRequest, ChatbotSettingsResponse

router = APIRouter(prefix="/settings", tags=["Chatbot Settings"])

@router.get("/chatbot", response_model=ChatbotSettingsResponse)
def get_chatbot_settings(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    col = db_manager.get_collection("chatbot_settings")
    settings_doc = col.find_one({"business_id": business_id})

    if not settings_doc:
        # Default initialization
        biz_col = db_manager.get_collection("businesses")
        biz = biz_col.find_one({"_id": business_id}) or {}
        b_name = biz.get("business_name", "Business")
        now_iso = datetime.now(timezone.utc).isoformat()
        settings_doc = {
            "_id": str(uuid.uuid4()),
            "business_id": business_id,
            "chatbot_name": f"{b_name} Assistant",
            "welcome_message": f"Welcome! How can I assist you today with {b_name}?",
            "theme_color": "#4f46e5",
            "logo": None,
            "greeting_text": "We're here to help you 24/7",
            "fallback_message": "I don't have this information in the available business documents. Please contact the business support team.",
            "supported_languages": ["en", "hi", "mr"],
            "enable_voice": True,
            "enable_suggestions": True,
            "updated_at": now_iso
        }
        col.insert_one(settings_doc)

    return ChatbotSettingsResponse(
        id=settings_doc["_id"],
        business_id=settings_doc["business_id"],
        chatbot_name=settings_doc.get("chatbot_name", "AI Assistant"),
        welcome_message=settings_doc.get("welcome_message", ""),
        theme_color=settings_doc.get("theme_color", "#4f46e5"),
        logo=settings_doc.get("logo"),
        greeting_text=settings_doc.get("greeting_text", "We're here to help you"),
        fallback_message=settings_doc.get("fallback_message", "I don't have this information in the available business documents. Please contact the business support team."),
        supported_languages=settings_doc.get("supported_languages", ["en", "hi", "mr"]),
        enable_voice=settings_doc.get("enable_voice", True),
        enable_suggestions=settings_doc.get("enable_suggestions", True),
        updated_at=settings_doc.get("updated_at", "")
    )

@router.put("/chatbot", response_model=ChatbotSettingsResponse)
def update_chatbot_settings(
    req: ChatbotSettingsRequest,
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    col = db_manager.get_collection("chatbot_settings")
    now_iso = datetime.now(timezone.utc).isoformat()

    update_fields = {"updated_at": now_iso}
    for field, val in req.model_dump(exclude_unset=True).items():
        update_fields[field] = val

    col.update_one(
        {"business_id": business_id},
        {"$set": update_fields},
        upsert=True
    )

    updated = col.find_one({"business_id": business_id})
    return ChatbotSettingsResponse(
        id=updated["_id"],
        business_id=updated["business_id"],
        chatbot_name=updated.get("chatbot_name", "AI Assistant"),
        welcome_message=updated.get("welcome_message", ""),
        theme_color=updated.get("theme_color", "#4f46e5"),
        logo=updated.get("logo"),
        greeting_text=updated.get("greeting_text", ""),
        fallback_message=updated.get("fallback_message", ""),
        supported_languages=updated.get("supported_languages", ["en", "hi", "mr"]),
        enable_voice=updated.get("enable_voice", True),
        enable_suggestions=updated.get("enable_suggestions", True),
        updated_at=updated.get("updated_at", "")
    )

@router.get("/notifications")
def get_notification_settings(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    col = db_manager.get_collection("notification_settings")
    notif = col.find_one({"business_id": business_id})
    if not notif:
        biz_col = db_manager.get_collection("businesses")
        biz = biz_col.find_one({"_id": business_id}) or {}
        user_col = db_manager.get_collection("users")
        u = user_col.find_one({"_id": current_user["id"]}) or {}
        notif = {
            "business_id": business_id,
            "email_on_unanswered": True,
            "email_on_support_ticket": True,
            "notification_email": u.get("email", ""),
            "daily_digest": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        col.insert_one(notif)

    return {
        "business_id": notif.get("business_id"),
        "email_on_unanswered": notif.get("email_on_unanswered", True),
        "email_on_support_ticket": notif.get("email_on_support_ticket", True),
        "notification_email": notif.get("notification_email", ""),
        "daily_digest": notif.get("daily_digest", False),
        "updated_at": notif.get("updated_at", "")
    }

@router.put("/notifications")
def update_notification_settings(
    payload: dict,
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    col = db_manager.get_collection("notification_settings")
    now_iso = datetime.now(timezone.utc).isoformat()

    updates = {"updated_at": now_iso}
    for k in ["email_on_unanswered", "email_on_support_ticket", "notification_email", "daily_digest"]:
        if k in payload:
            updates[k] = payload[k]

    col.update_one({"business_id": business_id}, {"$set": updates}, upsert=True)
    updated = col.find_one({"business_id": business_id}) or {}
    return {
        "message": "Notification settings updated successfully.",
        "settings": {
            "business_id": business_id,
            "email_on_unanswered": updated.get("email_on_unanswered", True),
            "email_on_support_ticket": updated.get("email_on_support_ticket", True),
            "notification_email": updated.get("notification_email", ""),
            "daily_digest": updated.get("daily_digest", False),
            "updated_at": updated.get("updated_at", "")
        }
    }

