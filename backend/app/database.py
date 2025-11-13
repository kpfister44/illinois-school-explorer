# ABOUTME: SQLAlchemy database models and session configuration
# ABOUTME: Defines School model with base metadata and session helpers

from datetime import UTC, datetime
import re
from typing import List, Optional

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

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

    # IAR Proficiency Rates
    iar_ela_proficiency_pct = Column(Float)
    iar_math_proficiency_pct = Column(Float)
    iar_overall_proficiency_pct = Column(Float)

    # Diversity Percentages
    pct_white = Column(Float)
    pct_black = Column(Float)
    pct_hispanic = Column(Float)
    pct_asian = Column(Float)
    pct_pacific_islander = Column(Float)
    pct_native_american = Column(Float)
    pct_two_or_more = Column(Float)
    pct_mena = Column(Float)

    # Trend Metrics (delta relative to prior years)
    enrollment_trend_1yr = Column(Float)
    enrollment_trend_3yr = Column(Float)
    enrollment_trend_5yr = Column(Float)
    low_income_trend_1yr = Column(Float)
    low_income_trend_3yr = Column(Float)
    low_income_trend_5yr = Column(Float)
    el_trend_1yr = Column(Float)
    el_trend_3yr = Column(Float)
    el_trend_5yr = Column(Float)
    white_trend_1yr = Column(Float)
    white_trend_3yr = Column(Float)
    white_trend_5yr = Column(Float)
    black_trend_1yr = Column(Float)
    black_trend_3yr = Column(Float)
    black_trend_5yr = Column(Float)
    hispanic_trend_1yr = Column(Float)
    hispanic_trend_3yr = Column(Float)
    hispanic_trend_5yr = Column(Float)
    asian_trend_1yr = Column(Float)
    asian_trend_3yr = Column(Float)
    asian_trend_5yr = Column(Float)
    pacific_islander_trend_1yr = Column(Float)
    pacific_islander_trend_3yr = Column(Float)
    pacific_islander_trend_5yr = Column(Float)
    native_american_trend_1yr = Column(Float)
    native_american_trend_3yr = Column(Float)
    native_american_trend_5yr = Column(Float)
    two_or_more_trend_1yr = Column(Float)
    two_or_more_trend_3yr = Column(Float)
    two_or_more_trend_5yr = Column(Float)
    mena_trend_1yr = Column(Float)
    mena_trend_3yr = Column(Float)
    mena_trend_5yr = Column(Float)
    act_trend_1yr = Column(Float)
    act_trend_3yr = Column(Float)
    act_trend_5yr = Column(Float)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

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
    create_fts_index(engine)


def create_fts_index(target_engine):
    """Create and sync FTS5 virtual table for School search."""
    with target_engine.connect() as conn:
        conn.execute(text("DROP TRIGGER IF EXISTS schools_fts_insert"))
        conn.execute(text("DROP TRIGGER IF EXISTS schools_fts_delete"))
        conn.execute(text("DROP TRIGGER IF EXISTS schools_fts_update"))
        conn.execute(text("DROP TABLE IF EXISTS schools_fts"))
        conn.execute(
            text(
                """
                CREATE VIRTUAL TABLE schools_fts USING fts5(
                    school_name,
                    city,
                    district,
                    content=schools,
                    content_rowid=id
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TRIGGER schools_fts_insert AFTER INSERT ON schools BEGIN
                    INSERT INTO schools_fts(rowid, school_name, city, district)
                    VALUES (new.id, new.school_name, new.city, new.district);
                END
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TRIGGER schools_fts_delete AFTER DELETE ON schools BEGIN
                    DELETE FROM schools_fts WHERE rowid = old.id;
                END
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TRIGGER schools_fts_update AFTER UPDATE ON schools BEGIN
                    UPDATE schools_fts
                    SET school_name = new.school_name,
                        city = new.city,
                        district = new.district
                    WHERE rowid = new.id;
                END
                """
            )
        )
        conn.commit()


def search_schools(db: Session, query: str, limit: int = 10) -> List[School]:
    """Search schools via FTS5 index and return ordered School objects."""
    if not query:
        return []

    cleaned_query = re.sub(r"[^\w\s]", " ", query)
    cleaned_query = re.sub(r"\s+", " ", cleaned_query).strip()

    if not cleaned_query:
        return []

    limit = max(1, min(limit, 50))

    stmt = text(
        """
        SELECT s.id FROM schools s
        JOIN schools_fts ON s.id = schools_fts.rowid
        WHERE schools_fts MATCH :query
        ORDER BY rank
        LIMIT :limit
        """
    )

    rows = db.execute(stmt, {"query": cleaned_query, "limit": limit}).fetchall()
    school_ids = [row.id for row in rows]

    results: List[School] = []
    for school_id in school_ids:
        school = db.get(School, school_id)
        if school:
            results.append(school)

    return results


def get_school_by_rcdts(db: Session, rcdts: str) -> Optional[School]:
    """Retrieve a single School by its RCDTS identifier."""
    if not rcdts:
        return None

    return db.query(School).filter(School.rcdts == rcdts).first()
