from pydantic import BaseModel, Field
from typing import Optional

class BusinessProfileResponse(BaseModel):
    id: str
    owner_id: str
    business_name: str
    business_slug: str
    logo: Optional[str] = None
    description: Optional[str] = None
    created_at: str

class BusinessUpdateRequest(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=150)
    logo: Optional[str] = None
    description: Optional[str] = None
