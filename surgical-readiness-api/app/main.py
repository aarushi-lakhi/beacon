from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router

app = FastAPI(
    title="Surgical Readiness Agent API",
    version="1.0.0",
    description=(
        "Hackathon demo backend with synthetic data for pre-op readiness monitoring, "
        "tasking, and notifications."
    ),
)

# Local frontend-friendly CORS defaults for hackathon demos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
