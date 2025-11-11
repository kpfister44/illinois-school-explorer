# ABOUTME: Tests for FastAPI application initialization and configuration
# ABOUTME: Validates app setup, CORS, and health check endpoint

from fastapi.testclient import TestClient


def test_app_exists():
    """FastAPI app instance is importable."""
    from app.main import app

    assert app is not None
    assert app.title == "Illinois School Explorer API"

def test_health_check(client):
    """GET /health returns 200 with status ok."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_cors_headers_present(client):
    """CORS middleware adds appropriate headers."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )

    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_cors_allows_loopback_alias(client):
    """CORS should also allow 127.0.0.1 origin used by Vite dev server."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://127.0.0.1:5173"


def test_openapi_includes_top_scores_route():
    """OpenAPI schema should document the top scores endpoint."""
    from app.main import app

    schema = app.openapi()
    assert "/api/top-scores" in schema["paths"]
