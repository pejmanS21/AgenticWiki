import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import init_db
from app.routers import chat, documents, graph, ingest, search, settings, upload
from app.schemas.common import HealthResponse
from app.services.embedding_service import EmbeddingService

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    EmbeddingService()
    yield


settings_obj = get_settings()
app = FastAPI(title=settings_obj.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings_obj.frontend_origin, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(ingest.router)
app.include_router(search.router)
app.include_router(graph.router)
app.include_router(chat.router)
app.include_router(settings.router)
app.include_router(documents.router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", app=settings_obj.app_name)

