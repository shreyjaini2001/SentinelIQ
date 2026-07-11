from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import settings
from src.storage.db import init_db
from src.storage import local_store
from src.routers import classify, nlq, action, session, suggestions, capabilities, persistence, connectors


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    local_store.init_local_store()
    yield


app = FastAPI(
    title="SentinelIQ API",
    version="0.2.0",
    description="AI-powered SIEM platform — Phase 2: Blast Radius, Documentation, Comparative Analysis, Rule Suggestion",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/api/v1", tags=["classify"])
app.include_router(nlq.router, prefix="/api/v1", tags=["nlq"])
app.include_router(action.router, prefix="/api/v1", tags=["action"])
app.include_router(session.router, prefix="/api/v1", tags=["session"])
app.include_router(suggestions.router, prefix="/api/v1", tags=["suggestions"])
app.include_router(capabilities.router, prefix="/api/v1", tags=["capabilities"])
app.include_router(persistence.router, prefix="/api/v1", tags=["persistence"])
app.include_router(connectors.router, prefix="/api/v1", tags=["connectors"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}
