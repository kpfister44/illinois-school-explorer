# ABOUTME: FastAPI application entry point with CORS and route configuration
# ABOUTME: Initializes app, registers routers, and configures middleware

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.search import router as search_router

app = FastAPI(
    title="Illinois School Explorer API",
    description="REST API for searching and comparing Illinois schools",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
