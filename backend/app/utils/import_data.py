# ABOUTME: Excel data import utilities for school database
# ABOUTME: Handles loading, cleaning, and merging Report Card datasets

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from sqlalchemy.orm import Session

from app.database import SessionLocal, School, init_db
from app.utils.historical_loader import HistoricalDataLoader

MAX_TREND_YEARS = 5
LATEST_HISTORICAL_YEAR = 2024
EARLIEST_DEMOGRAPHIC_YEAR = 2015
EARLIEST_ACT_YEAR = 2012
SAT_START_YEAR = 2017

DEMOGRAPHIC_YEARS = list(
    range(LATEST_HISTORICAL_YEAR, EARLIEST_DEMOGRAPHIC_YEAR - 1, -1)
)
SAT_SCORE_YEARS = list(range(LATEST_HISTORICAL_YEAR, SAT_START_YEAR - 1, -1))
ACT_SCORE_YEARS = list(range(SAT_START_YEAR - 1, EARLIEST_ACT_YEAR - 1, -1))

DIVERSITY_FIELD_MAP = {
    "white": "pct_white",
    "black": "pct_black",
    "hispanic": "pct_hispanic",
    "asian": "pct_asian",
    "pacific_islander": "pct_pacific_islander",
    "native_american": "pct_native_american",
    "two_or_more": "pct_two_or_more",
    "mena": "pct_mena",
}

SAT_TO_ACT_RANGES = [
    (1570, 1600, 36),
    (1530, 1560, 35),
    (1490, 1520, 34),
    (1450, 1480, 33),
    (1420, 1440, 32),
    (1390, 1410, 31),
    (1360, 1380, 30),
    (1330, 1350, 29),
    (1300, 1320, 28),
    (1260, 1290, 27),
    (1230, 1250, 26),
    (1200, 1220, 25),
    (1160, 1190, 24),
    (1130, 1150, 23),
    (1100, 1120, 22),
    (1060, 1090, 21),
    (1030, 1050, 20),
    (990, 1020, 19),
    (960, 980, 18),
    (920, 950, 17),
    (880, 910, 16),
    (830, 870, 15),
    (780, 820, 14),
    (730, 770, 13),
    (690, 720, 12),
    (650, 680, 11),
    (620, 640, 10),
    (590, 610, 9),
]


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


def build_trend_series(rcdts: str, loader: HistoricalDataLoader) -> Dict[str, Dict[int, float]]:
    """Combine demographic and ACT history for a school."""

    demographics = _build_demographic_series(rcdts, loader)
    act_series = _build_act_series(rcdts, loader)

    combined: Dict[str, Dict[int, float]] = {}
    combined.update(demographics)
    combined.update(act_series)
    return {metric: values for metric, values in combined.items() if values}


def _build_demographic_series(
    rcdts: str, loader: HistoricalDataLoader, max_years: int = MAX_TREND_YEARS
) -> Dict[str, Dict[int, float]]:
    """Return latest demographic values per metric for a school."""

    series: Dict[str, Dict[int, float]] = {}
    for year in DEMOGRAPHIC_YEARS:
        year_data = loader.load_year(year)
        school_data = year_data.get(rcdts)
        if not school_data:
            continue

        _record_metric_value(series, "student_enrollment", year, school_data.get("enrollment"))
        _record_metric_value(
            series, "low_income_percentage", year, school_data.get("low_income_percentage")
        )
        _record_metric_value(series, "el_percentage", year, school_data.get("el_percentage"))

        diversity = school_data.get("diversity") or {}
        for source_key, target_key in DIVERSITY_FIELD_MAP.items():
            _record_metric_value(series, target_key, year, diversity.get(source_key))

    return {metric: _trim_series(values, max_years) for metric, values in series.items()}


def _build_act_series(rcdts: str, loader: HistoricalDataLoader) -> Dict[str, Dict[int, float]]:
    """Return ACT composite series including SAT conversions."""

    series: Dict[int, float] = {}

    for year in SAT_SCORE_YEARS:
        year_data = loader.load_year(year)
        school_data = year_data.get(rcdts)
        if not school_data:
            continue

        sat_score = school_data.get("sat_composite")
        act_value = sat_to_act(sat_score)
        if act_value is not None:
            series[year] = act_value

    for year in ACT_SCORE_YEARS:
        year_data = loader.load_year(year)
        school_data = year_data.get(rcdts)
        if not school_data:
            continue

        act_scores = school_data.get("act_scores") or {}
        composite = act_scores.get("composite")
        if composite is not None:
            series[year] = float(composite)

    if not series:
        return {}

    ordered = dict(sorted(series.items(), key=lambda item: item[0], reverse=True))
    return {"act_composite": ordered}


def _record_metric_value(
    series: Dict[str, Dict[int, float]], metric: str, year: int, value: Any
) -> None:
    if value is None:
        return

    metric_values = series.setdefault(metric, {})
    if isinstance(value, bool):
        return
    if isinstance(value, int):
        metric_values[year] = int(value)
        return
    try:
        metric_values[year] = float(value)
    except (TypeError, ValueError):
        return


def _trim_series(values: Dict[int, float], max_years: int) -> Dict[int, float]:
    ordered_years = sorted(values.items(), key=lambda item: item[0], reverse=True)
    limited = ordered_years[:max_years]
    return {year: value for year, value in limited}


def sat_to_act(sat_score: Any) -> Optional[float]:
    """Convert SAT composite totals to ACT composite equivalents."""

    if sat_score is None:
        return None

    try:
        score = float(sat_score)
    except (TypeError, ValueError):
        return None

    for minimum, maximum, act in SAT_TO_ACT_RANGES:
        if minimum <= score <= maximum:
            return float(act)

    if score > SAT_TO_ACT_RANGES[0][1]:
        return float(SAT_TO_ACT_RANGES[0][2])
    if score < SAT_TO_ACT_RANGES[-1][0]:
        return float(SAT_TO_ACT_RANGES[-1][2])
    return None


def normalize_level(school_type: Optional[str]) -> str:
    """Normalize school type strings into level buckets."""
    if not school_type:
        return "other"

    normalized = school_type.lower()
    if "middle" in normalized or "junior" in normalized or "intermediate" in normalized:
        return "middle"
    if "high" in normalized:
        return "high"
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
