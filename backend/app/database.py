# ABOUTME: SQLAlchemy database models and session configuration
# ABOUTME: Defines School model with base metadata and session helpers

from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class School(Base):
    """School model with demographic and academic metrics."""

    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rcdts = Column(String(20), unique=True, nullable=False, index=True)
    school_name = Column(Text, nullable=False)
    district = Column(Text)
    city = Column(Text, nullable=False, index=True)
    county = Column(Text)
    school_type = Column(Text)
    level = Column(String(20), nullable=False, index=True)
    grades_served = Column(Text)

    # Core Metrics
    student_enrollment = Column(Integer)
    el_percentage = Column(Float)
    low_income_percentage = Column(Float)

    # ACT Scores
    act_ela_avg = Column(Float)
    act_math_avg = Column(Float)
    act_science_avg = Column(Float)

    # Diversity Percentages
    pct_white = Column(Float)
    pct_black = Column(Float)
    pct_hispanic = Column(Float)
    pct_asian = Column(Float)
    pct_pacific_islander = Column(Float)
    pct_native_american = Column(Float)
    pct_two_or_more = Column(Float)
    pct_mena = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<School(rcdts='{self.rcdts}', name='{self.school_name}', city='{self.city}')>"


SQLALCHEMY_DATABASE_URL = "sqlite:///./data/schools.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
