# ABOUTME: Excel data import utilities for school database
# ABOUTME: Handles loading, cleaning, and merging Report Card datasets

from typing import Optional, Tuple

import pandas as pd


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


def load_excel_data(excel_path: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load General and ACT sheets from Excel workbook."""
    general_df = pd.read_excel(excel_path, sheet_name="General")
    act_df = pd.read_excel(excel_path, sheet_name="ACT")
    return general_df, act_df


def merge_school_data(general_df: pd.DataFrame, act_df: pd.DataFrame) -> pd.DataFrame:
    """Filter to school rows and join ACT scores."""
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
    return merged_df
