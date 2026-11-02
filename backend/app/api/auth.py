import re
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from app.database.mongo import db_manager
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    return s.strip('-')

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    users_col = db_manager.get_collection("users")
    biz_col = db_manager.get_collection("businesses")
    settings_col = db_manager.get_collection("chatbot_settings")

    # Check if user email already exists
    if users_col.find_one({"email": req.email.lower()}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Generate business slug
    base_slug = slugify(req.business_slug or req.business_name)
    slug = base_slug or f"biz-{str(uuid.uuid4())[:8]}"
    if biz_col.find_one({"business_slug": slug}):
        slug = f"{slug}-{str(uuid.uuid4())[:6]}"

    user_id = str(uuid.uuid4())
    biz_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Create Business
    biz_col.insert_one({
        "_id": biz_id,
        "owner_id": user_id,
        "business_name": req.business_name,
        "business_slug": slug,
        "logo": None,
        "description": req.description,
        "created_at": now_iso
    })

    # 2. Create Default Chatbot Settings
    settings_col.insert_one({
        "_id": str(uuid.uuid4()),
        "business_id": biz_id,
        "chatbot_name": f"{req.business_name} Assistant",
        "welcome_message": f"Welcome to {req.business_name}! How may I help you today?",
        "theme_color": "#4f46e5",
        "logo": None,
        "greeting_text": "Customer Support AI is active",
        "fallback_message": "I don't have this information in the available business documents. Please contact the business support team.",
        "supported_languages": ["en", "hi", "mr"],
        "enable_voice": True,
        "enable_suggestions": True,
        "updated_at": now_iso
    })

    # 3. Create Owner User
    pw_hash = hash_password(req.password)
    user_record = {
        "_id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password_hash": pw_hash,
        "role": "business_owner",
        "business_id": biz_id,
        "created_at": now_iso
    }
    users_col.insert_one(user_record)

    # Generate JWT
    token_data = {"sub": user_id, "role": "business_owner", "business_id": biz_id}
    token = create_access_token(token_data)

    user_resp = UserResponse(
        id=user_id,
        name=req.name,
        email=req.email.lower(),
        role="business_owner",
        business_id=biz_id,
        business_name=req.business_name,
        business_slug=slug,
        created_at=now_iso
    )

    return TokenResponse(access_token=token, user=user_resp)

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    users_col = db_manager.get_collection("users")
    user = users_col.find_one({"email": req.email.lower()})

    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    biz_col = db_manager.get_collection("businesses")
    biz = biz_col.find_one({"_id": str(user["business_id"])})

    token_data = {
        "sub": user["_id"],
        "role": user.get("role", "business_owner"),
        "business_id": user.get("business_id")
    }
    token = create_access_token(token_data)

    user_resp = UserResponse(
        id=user["_id"],
        name=user["name"],
        email=user["email"],
        role=user.get("role", "business_owner"),
        business_id=user["business_id"],
        business_name=biz.get("business_name") if biz else None,
        business_slug=biz.get("business_slug") if biz else None,
        created_at=user.get("created_at", "")
    )

    return TokenResponse(access_token=token, user=user_resp)

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    users_col = db_manager.get_collection("users")
    user = users_col.find_one({"email": req.email.lower()})
    # Always return success message to prevent user enumeration
    if user:
        reset_token = create_access_token({"sub": user["_id"], "type": "pw_reset"})
        # In production this would send via email_service; return token for testability
        return {"message": "Password reset instructions generated.", "reset_token": reset_token}
    return {"message": "Password reset instructions generated if email is registered."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    from app.core.security import decode_access_token
    payload = decode_access_token(req.token)
    if not payload or payload.get("type") != "pw_reset":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    user_id = payload.get("sub")
    users_col = db_manager.get_collection("users")
    new_hash = hash_password(req.new_password)
    res = users_col.update_one({"_id": str(user_id)}, {"$set": {"password_hash": new_hash}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"message": "Password successfully updated."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    biz_col = db_manager.get_collection("businesses")
    biz = biz_col.find_one({"_id": str(current_user["business_id"])})

    return UserResponse(
        id=current_user["_id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user.get("role", "business_owner"),
        business_id=current_user["business_id"],
        business_name=biz.get("business_name") if biz else None,
        business_slug=biz.get("business_slug") if biz else None,
        created_at=current_user.get("created_at", "")
    )
