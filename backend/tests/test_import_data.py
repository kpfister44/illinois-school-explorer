# ABOUTME: Tests for Excel data import and cleaning functions
# ABOUTME: Validates data parsing, cleaning, and database insertion

import pandas as pd
import pytest

from app.utils.import_data import (
    load_excel_data,
    clean_percentage,
    clean_enrollment,
    merge_school_data,
)


def test_clean_percentage_converts_string():
    """Percentage strings convert to floats."""
    assert clean_percentage("45.5%") == 45.5
    assert clean_percentage("0.0%") == 0.0
    assert clean_percentage("100%") == 100.0


def test_clean_percentage_handles_asterisk():
    """Asterisk and blanks become None."""
    assert clean_percentage("*") is None
    assert clean_percentage("* ") is None
    assert clean_percentage(" ") is None


def test_clean_percentage_handles_none():
    """None or NaN stays None."""
    assert clean_percentage(None) is None
    assert pd.isna(clean_percentage(float("nan")))


def test_clean_enrollment_converts_string():
    """Enrollment strings convert to ints."""
    assert clean_enrollment("1,234") == 1234
    assert clean_enrollment("567") == 567


def test_clean_enrollment_handles_asterisk():
    """Enrollment asterisks become None."""
    assert clean_enrollment("*") is None


@pytest.mark.slow
def test_load_excel_data_returns_dataframes():
    """Loading Excel file yields General/ACT dataframes."""
    general_df, act_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")

    assert not general_df.empty
    assert not act_df.empty
    assert "RCDTS" in general_df.columns
    assert "School Name" in general_df.columns


@pytest.mark.slow
def test_merge_school_data_filters_schools_only():
    """Merge filters to school-level rows."""
    general_df, act_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df)

    assert not merged_df.empty
    assert (merged_df["Level"] == "School").all()
    assert len(merged_df) < len(general_df)


@pytest.mark.slow
def test_merge_school_data_joins_act_scores():
    """ACT columns appear after merge."""
    general_df, act_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df)

    expected_columns = [
        "ACT ELA Average Score - Grade 11",
        "ACT Math Average Score - Grade 11",
        "ACT Science Average Score - Grade 11",
    ]
    for column in expected_columns:
        assert column in merged_df.columns
