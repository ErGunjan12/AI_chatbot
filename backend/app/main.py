from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.business import router as business_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.dashboard import router as dashboard_router
from app.api.support import router as support_router
from app.api.settings import router as settings_router
from app.api.export import router as export_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Business Knowledge-Based AI Chatbot platform with Hybrid RAG, Tenant Isolation, and Multi-Business Management."
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows public widget access and local frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API routers under /api
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(business_router, prefix=settings.API_V1_PREFIX)
app.include_router(documents_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(support_router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_router, prefix=settings.API_V1_PREFIX)
app.include_router(export_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    from app.database.mongo import db_manager
    return {
        "status": "healthy",
        "database": "connected" if db_manager.is_connected else "disconnected",
        "database_mode": "local_persistent" if db_manager.is_local_fallback else "mongodb_atlas",
        "rag_retriever": "hybrid_semantic_bm25"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact support."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
