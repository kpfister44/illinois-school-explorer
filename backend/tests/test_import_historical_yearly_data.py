# ABOUTME: Tests for importing historical yearly data into database
# ABOUTME: Validates that historical columns are populated during import

import pytest

from app.utils.import_historical_trends import TrendCalculator, HistoricalDataExtractor


def test_trend_calculator_extracts_historical_yearly_data():
    """Test TrendCalculator can extract historical yearly data for all metrics."""
    extractor = HistoricalDataExtractor()
    calculator = TrendCalculator(extractor)

    # Use Elk Grove High School as test case
    rcdts = "05-016-2140-17-0002"
    current_data = {
        "act_ela_avg": 17.7,
        "act_math_avg": 17.7,
        "student_enrollment": 1775,
        "low_income_percentage": 38.4,
        "el_percentage": 10.2,
        "pct_white": 35.0,
        "pct_black": 5.0,
        "pct_hispanic": 45.0,
        "pct_asian": 10.0,
        "pct_pacific_islander": 0.5,
        "pct_native_american": 0.1,
        "pct_two_or_more": 3.0,
        "pct_mena": 1.4,
    }

    try:
        historical_data = calculator.extract_historical_yearly_data(rcdts, current_data)

        # Should have historical data structure
        assert historical_data is not None
        assert isinstance(historical_data, dict)

        # Should have enrollment historical data
        assert "enrollment_hist_2024" in historical_data or "enrollment_hist_2023" in historical_data

        # Should have ACT historical data
        assert "act_hist_2024" in historical_data or "act_hist_2023" in historical_data

    finally:
        extractor.clear_cache()


def test_historical_yearly_data_has_correct_years():
    """Test that historical data includes years 2019-2024."""
    extractor = HistoricalDataExtractor()
    calculator = TrendCalculator(extractor)

    rcdts = "05-016-2140-17-0002"
    current_data = {
        "act_ela_avg": 17.7,
        "act_math_avg": 17.7,
    }

    try:
        historical_data = calculator.extract_historical_yearly_data(rcdts, current_data)

        # Check for at least some years present
        year_suffixes = ["2024", "2023", "2022", "2021", "2020", "2019"]
        act_years_found = [
            year for year in year_suffixes
            if f"act_hist_{year}" in historical_data
        ]

        # Should have data for some years (not all years may have data)
        assert len(act_years_found) > 0

    finally:
        extractor.clear_cache()
