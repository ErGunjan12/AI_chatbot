from pydantic import BaseModel, Field
from typing import Optional, List

class ChatbotSettingsRequest(BaseModel):
    chatbot_name: Optional[str] = Field("AI Business Assistant", min_length=1, max_length=100)
    welcome_message: Optional[str] = Field("Hello! How can I assist you with our services today?", max_length=500)
    theme_color: Optional[str] = "#4f46e5"
    logo: Optional[str] = None
    greeting_text: Optional[str] = "We're here to help you 24/7"
    fallback_message: Optional[str] = "I don't have this information in the available business documents. Please contact the business support team."
    supported_languages: Optional[List[str]] = ["en", "hi", "mr"]
    enable_voice: Optional[bool] = True
    enable_suggestions: Optional[bool] = True

class ChatbotSettingsResponse(BaseModel):
    id: str
    business_id: str
    chatbot_name: str
    welcome_message: str
    theme_color: str
    logo: Optional[str] = None
    greeting_text: str
    fallback_message: str
    supported_languages: List[str]
    enable_voice: bool
    enable_suggestions: bool
    updated_at: str
