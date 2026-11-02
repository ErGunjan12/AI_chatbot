import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Disable ChromaDB telemetry phone-home to avoid socket timeouts in isolated environments
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_ENV_PATH = BASE_DIR.parent / ".env"

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "AI Customer Support Assistant"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "ai_customer_support"
    LOCAL_DB_DIR: str = str(BASE_DIR / "local_db")
    
    # Security & JWT
    JWT_SECRET_KEY: str = "super-secret-jwt-key-min-32-chars-long-business-ai-prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # OpenAI & LLM
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Vector DB & Storage
    CHROMA_PERSIST_DIRECTORY: str = str(BASE_DIR / "chroma_db")
    UPLOAD_DIR: str = str(BASE_DIR / "uploaded_documents")
    MAX_UPLOAD_SIZE_MB: int = 15
    
    # SMTP Email Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@businessassistant.ai"
    
    # URLs & CORS
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"

    model_config = SettingsConfigDict(
        env_file=str(ROOT_ENV_PATH) if ROOT_ENV_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
os.makedirs(settings.LOCAL_DB_DIR, exist_ok=True)
