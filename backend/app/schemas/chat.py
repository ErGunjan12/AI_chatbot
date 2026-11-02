from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class SourceDocumentReference(BaseModel):
    document_id: str
    document_name: str
    page_number: Optional[int] = None
    similarity_score: Optional[float] = None
    snippet: Optional[str] = None

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    customer_id: Optional[str] = None
    language: str = "en"  # "en", "hi", "mr", etc.

class ChatMessageResponse(BaseModel):
    conversation_id: str
    message: str
    sender: str  # "assistant"
    source_documents: List[SourceDocumentReference] = []
    answer_status: str  # "grounded", "unanswered_fallback", "error"
    sentiment: Optional[str] = "neutral"
    suggested_followups: List[str] = []
    created_at: str

class ChatFeedbackRequest(BaseModel):
    conversation_id: str
    message_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)  # 1-5 or thumbs up/down
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    message: str
    id: str

class SuggestedQuestionsResponse(BaseModel):
    questions: List[str]
