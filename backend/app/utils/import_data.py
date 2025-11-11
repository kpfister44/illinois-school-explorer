# ABOUTME: Excel data import utilities for school database
# ABOUTME: Handles loading, cleaning, and merging Report Card datasets

from typing import List, Optional, Tuple

import pandas as pd
from sqlalchemy.orm import Session

from app.database import SessionLocal, School, init_db


def clean_percentage(value) -> Optional[float]:
    """Convert percentage-like values to float, blank/asterisk to None."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped or stripped == "*":
            return None
        if stripped.endswith("%"):
            stripped = stripped[:-1]
        try:
            return float(stripped)
        except ValueError:
            return None

    if isinstance(value, (int, float)):
        return float(value)

    return None


def clean_enrollment(value) -> Optional[int]:
    """Convert enrollment strings with commas to ints, asterisk to None."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped or stripped == "*":
            return None
        normalized = stripped.replace(",", "")
        try:
            return int(float(normalized))
        except ValueError:
            return None

    if isinstance(value, (int, float)):
        return int(value)

    return None


def load_excel_data(excel_path: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load General, ACT, and IAR sheets from Excel workbook."""
    general_df = pd.read_excel(excel_path, sheet_name="General")
    act_df = pd.read_excel(excel_path, sheet_name="ACT")
    iar_df = pd.read_excel(excel_path, sheet_name="IAR")
    return general_df, act_df, iar_df


def merge_school_data(
    general_df: pd.DataFrame, act_df: pd.DataFrame, iar_df: pd.DataFrame
) -> pd.DataFrame:
    """Filter to school rows and join ACT/IAR scores."""
    schools_df = general_df[general_df["Level"] == "School"].copy()

    act_subset = act_df[
        [
            "RCDTS",
            "ACT ELA Average Score - Grade 11",
            "ACT Math Average Score - Grade 11",
            "ACT Science Average Score - Grade 11",
        ]
    ].copy()

    merged_df = schools_df.merge(act_subset, on="RCDTS", how="left")

    iar_subset = iar_df[
        [
            "RCDTS",
            "IAR ELA Proficiency Rate - Total",
            "IAR Math Proficiency Rate - Total",
        ]
    ].copy()

    merged_df = merged_df.merge(iar_subset, on="RCDTS", how="left")
    return merged_df


def normalize_level(school_type: Optional[str]) -> str:
    """Normalize school type strings into level buckets."""
    if not school_type:
        return "other"

    normalized = school_type.lower()
    if "high" in normalized:
        return "high"
    if "middle" in normalized or "junior" in normalized or "intermediate" in normalized:
        return "middle"
    if "elementary" in normalized or "primary" in normalized:
        return "elementary"
    return "other"


def prepare_school_records(merged_df: pd.DataFrame) -> List[dict]:
    """Transform merged DataFrame rows into dictionaries aligned with School fields."""

    records: List[dict] = []
    for _, row in merged_df.iterrows():
        iar_ela = clean_percentage(row.get("IAR ELA Proficiency Rate - Total"))
        iar_math = clean_percentage(row.get("IAR Math Proficiency Rate - Total"))
        iar_overall = None
        if iar_ela is not None and iar_math is not None:
            iar_overall = (iar_ela + iar_math) / 2

        record = {
            "rcdts": row["RCDTS"],
            "school_name": row["School Name"],
            "district": row.get("District"),
            "city": row.get("City"),
            "county": row.get("County"),
            "school_type": row.get("School Type"),
            "level": normalize_level(row.get("School Type")),
            "grades_served": row.get("Grades Served"),
            "student_enrollment": clean_enrollment(row.get("# Student Enrollment")),
            "el_percentage": clean_percentage(row.get("% Student Enrollment - EL")),
            "low_income_percentage": clean_percentage(row.get("% Student Enrollment - Low Income")),
            "act_ela_avg": clean_percentage(row.get("ACT ELA Average Score - Grade 11")),
            "act_math_avg": clean_percentage(row.get("ACT Math Average Score - Grade 11")),
            "act_science_avg": clean_percentage(row.get("ACT Science Average Score - Grade 11")),
            "iar_ela_proficiency_pct": iar_ela,
            "iar_math_proficiency_pct": iar_math,
            "iar_overall_proficiency_pct": iar_overall,
            "pct_white": clean_percentage(row.get("% Student Enrollment - White")),
            "pct_black": clean_percentage(row.get("% Student Enrollment - Black or African American")),
            "pct_hispanic": clean_percentage(row.get("% Student Enrollment - Hispanic or Latino")),
            "pct_asian": clean_percentage(row.get("% Student Enrollment - Asian")),
            "pct_pacific_islander": clean_percentage(
                row.get("% Student Enrollment - Native Hawaiian or Other Pacific Islander")
            ),
            "pct_native_american": clean_percentage(
                row.get("% Student Enrollment - American Indian or Alaska Native")
            ),
            "pct_two_or_more": clean_percentage(row.get("% Student Enrollment - Two or More Races")),
            "pct_mena": clean_percentage(row.get("% Student Enrollment - Middle Eastern or North African")),
        }
        records.append(record)
    return records


def import_to_database(excel_path: str, db: Session) -> int:
    """Run full import pipeline: load, clean, and bulk insert to schools table."""

    general_df, act_df, iar_df = load_excel_data(excel_path)
    merged_df = merge_school_data(general_df, act_df, iar_df)
    records = prepare_school_records(merged_df)

    db.query(School).delete()
    db.commit()

    if records:
        db.bulk_insert_mappings(School, records)
        db.commit()

    return len(records)


def main() -> None:  # pragma: no cover
    """CLI entry point for import execution."""
    import argparse

    parser = argparse.ArgumentParser(description="Load Illinois Report Card data into SQLite")
    parser.add_argument("excel_path", help="Path to 2025 Report Card Excel file")
    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    try:
        count = import_to_database(args.excel_path, db)
        print(f"Imported {count} schools successfully")
    finally:
        db.close()


if __name__ == "__main__":  # pragma: no cover
    main()
