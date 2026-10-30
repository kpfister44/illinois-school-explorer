# ABOUTME: Pytest fixtures for in-memory test databases and the committed schools.db
# ABOUTME: Provides test database sessions and client instances

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.database import Base, create_fts_index, get_db
from app.main import app


@pytest.fixture(scope="function")
def test_engine():
    """Create in-memory SQLite engine for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False,
        poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    create_fts_index(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(scope="function")
def test_db(test_engine) -> Session:
    """Provide a test database session."""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine
    )
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


COMMITTED_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "schools.db"


@pytest.fixture
def committed_db() -> Session:
    """Provide a read-only session on the committed data/schools.db with real school data."""
    engine = create_engine(
        f"sqlite:///file:{COMMITTED_DB_PATH}?mode=ro&uri=true",
        connect_args={"check_same_thread": False},
    )
    db = sessionmaker(bind=engine)()
    try:
        yield db
    finally:
        db.close()
        engine.dispose()


@pytest.fixture
def client(test_db):
    """Provide FastAPI TestClient with test database."""
    app.dependency_overrides[get_db] = lambda: test_db
    yield TestClient(app)
    app.dependency_overrides.clear()
