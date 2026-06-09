from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.db.init_db import init_db
from app.api import auth, requests, prescriptions, websocket, shops


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="MediFind API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for local uploads
if settings.STORAGE_BACKEND == "local":
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.LOCAL_UPLOAD_DIR), name="uploads")

# Register all routers
app.include_router(auth.router)
app.include_router(requests.router)
app.include_router(prescriptions.router)
app.include_router(websocket.router)
app.include_router(shops.router)


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
