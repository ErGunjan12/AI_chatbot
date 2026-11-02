import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_business_owner
from app.database.mongo import db_manager
from app.schemas.support import TicketCreateRequest, TicketUpdateRequest, TicketResponse
from app.services.email_service import email_service

router = APIRouter(prefix="/support", tags=["Live Human Support"])

@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_support_ticket(req: TicketCreateRequest):
    """
    Public customer endpoint to request live human assistance.
    """
    conv_col = db_manager.get_collection("conversations")
    conv = conv_col.find_one({"_id": str(req.conversation_id)})
    
    if conv:
        business_id = str(conv["business_id"])
    elif req.business_slug:
        biz_col = db_manager.get_collection("businesses")
        biz = biz_col.find_one({"business_slug": req.business_slug})
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found.")
        business_id = str(biz["_id"])
        # initialize conversation session
        now_init = datetime.now(timezone.utc).isoformat()
        conv_col.insert_one({
            "_id": str(req.conversation_id),
            "business_id": business_id,
            "customer_id": "anon",
            "conversation_status": "escalated_to_human",
            "started_at": now_init
        })
    else:
        raise HTTPException(status_code=404, detail="Conversation session not found.")

    ticket_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    ticket_record = {
        "_id": ticket_id,
        "business_id": business_id,
        "conversation_id": req.conversation_id,
        "customer_name": req.customer_name or "Anonymous Customer",
        "customer_email": req.customer_email,
        "subject": req.subject,
        "message": req.message,
        "owner_reply": None,
        "status": "open",
        "assigned_to": None,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    tickets_col = db_manager.get_collection("support_tickets")
    tickets_col.insert_one(ticket_record)

    # Notify owner via email
    users_col = db_manager.get_collection("users")
    owner = users_col.find_one({"business_id": business_id, "role": "business_owner"})
    if owner and owner.get("email"):
        email_service.send_notification(
            to_email=owner["email"],
            subject=f"New Human Support Request: {req.subject}",
            body=f"A customer has requested human support.\n\nFrom: {req.customer_name} ({req.customer_email or 'No email'})\nSubject: {req.subject}\nMessage:\n{req.message}"
        )

    return TicketResponse(
        id=ticket_id,
        business_id=business_id,
        conversation_id=req.conversation_id,
        customer_name=ticket_record["customer_name"],
        customer_email=ticket_record["customer_email"],
        subject=ticket_record["subject"],
        message=ticket_record["message"],
        owner_reply=None,
        status="open",
        created_at=now_iso,
        updated_at=now_iso
    )

@router.get("/tickets", response_model=List[TicketResponse])
def get_business_tickets(current_user: dict = Depends(get_current_business_owner)):
    business_id = str(current_user["business_id"])
    tickets_col = db_manager.get_collection("support_tickets")
    records = list(tickets_col.find({"business_id": business_id}))
    records.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return [
        TicketResponse(
            id=r["_id"],
            business_id=r["business_id"],
            conversation_id=r["conversation_id"],
            customer_name=r.get("customer_name"),
            customer_email=r.get("customer_email"),
            subject=r.get("subject", "No subject"),
            message=r.get("message", ""),
            owner_reply=r.get("owner_reply"),
            status=r.get("status", "open"),
            created_at=r.get("created_at", ""),
            updated_at=r.get("updated_at")
        )
        for r in records
    ]

@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    req: TicketUpdateRequest,
    current_user: dict = Depends(get_current_business_owner)
):
    business_id = str(current_user["business_id"])
    tickets_col = db_manager.get_collection("support_tickets")
    ticket = tickets_col.find_one({"_id": str(ticket_id), "business_id": business_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if req.status:
        update_fields["status"] = req.status
    if req.owner_reply is not None:
        update_fields["owner_reply"] = req.owner_reply
    if req.assigned_to is not None:
        update_fields["assigned_to"] = req.assigned_to

    tickets_col.update_one(
        {"_id": str(ticket_id), "business_id": business_id},
        {"$set": update_fields}
    )

    updated = tickets_col.find_one({"_id": str(ticket_id), "business_id": business_id})
    return TicketResponse(
        id=updated["_id"],
        business_id=updated["business_id"],
        conversation_id=updated["conversation_id"],
        customer_name=updated.get("customer_name"),
        customer_email=updated.get("customer_email"),
        subject=updated.get("subject", ""),
        message=updated.get("message", ""),
        owner_reply=updated.get("owner_reply"),
        status=updated.get("status", "open"),
        created_at=updated.get("created_at", ""),
        updated_at=updated.get("updated_at")
    )
