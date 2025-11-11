# ABOUTME: FastAPI application entry point with CORS and route configuration
# ABOUTME: Initializes app, registers routers, and configures middleware

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.api.search import router as search_router
from app.api.schools import router as schools_router
from app.api.top_scores import router as top_scores_router

app = FastAPI(
    title="Illinois School Explorer API",
    description="REST API for searching and comparing Illinois schools",
    version="1.0.0",
)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(schools_router)
app.include_router(top_scores_router)


@app.exception_handler(OperationalError)
async def database_exception_handler(request: Request, exc: OperationalError):
    """Handle database connection errors."""
    return JSONResponse(
        status_code=503,
        content={"detail": "Service temporarily unavailable"},
    )


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
