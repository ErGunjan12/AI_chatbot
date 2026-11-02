from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class FAQItem(BaseModel):
    question: str
    count: int

class DashboardOverviewResponse(BaseModel):
    total_conversations: int
    total_questions: int
    answered_questions: int
    unanswered_questions: int
    answer_success_rate: float
    customer_satisfaction_avg: float
    total_documents: int
    recent_conversations: List[Dict[str, Any]]
    frequently_asked_questions: List[FAQItem]
    recent_documents: List[Dict[str, Any]]

class DailyAnalyticsPoint(BaseModel):
    date: str
    total_chats: int
    total_questions: int
    answered_count: int
    unanswered_count: int
    satisfaction: float

class SentimentDistribution(BaseModel):
    positive: int
    neutral: int
    negative: int

class AnalyticsResponse(BaseModel):
    daily_stats: List[DailyAnalyticsPoint]
    sentiment_distribution: SentimentDistribution
    total_tickets: int
    open_tickets: int
    avg_response_time_ms: float

class UnansweredQuestionResponse(BaseModel):
    id: str
    business_id: str
    conversation_id: str
    question: str
    resolution_status: str  # pending, resolved
    resolution_notes: Optional[str] = None
    created_at: str

class ResolveQuestionRequest(BaseModel):
    resolution_notes: Optional[str] = None
    status: str = "resolved"
