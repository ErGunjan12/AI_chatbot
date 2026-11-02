from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class TicketCreateRequest(BaseModel):
    conversation_id: str
    business_slug: Optional[str] = None
    customer_name: Optional[str] = "Anonymous Customer"
    customer_email: Optional[EmailStr] = None
    subject: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=5, max_length=2000)

class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None  # open, in_progress, resolved, closed
    owner_reply: Optional[str] = None
    assigned_to: Optional[str] = None

class TicketResponse(BaseModel):
    id: str
    business_id: str
    conversation_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    subject: str
    message: str
    owner_reply: Optional[str] = None
    status: str
    created_at: str
    updated_at: Optional[str] = None
