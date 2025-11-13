# ABOUTME: Tests for Excel data import and cleaning functions
# ABOUTME: Validates data parsing, cleaning, and database insertion

import pandas as pd
import pytest

from app.database import School
import app.utils.import_data as import_data_module
from app.utils.import_data import (
    load_excel_data,
    clean_percentage,
    clean_enrollment,
    merge_school_data,
    prepare_school_records,
    import_to_database,
    build_trend_series,
)


class LoaderStub:
    """Simple loader stand-in for trend helper tests."""

    def __init__(self, responses):
        self.responses = responses

    def load_year(self, year):
        return self.responses.get(year, {})


def test_build_trend_series_demographics_cover_latest_years():
    """Demographic series keeps enough years for 5-year deltas and uses trend keys."""
    rcdts = "11-111-1111-11-0005"
    responses = {}
    enrollment = 700
    for year in range(2024, 2018, -1):
        responses[year] = {
            rcdts: {
                "enrollment": enrollment,
                "low_income_percentage": 40.0 + (2024 - year),
                "el_percentage": 10.0 + (2024 - year),
                "diversity": {
                    "white": 50.0,
                    "black": 20.0,
                },
            }
        }
        enrollment -= 20

    responses[2018] = {
        rcdts: {
            "enrollment": 500,
            "low_income_percentage": 55.0,
            "el_percentage": 15.0,
        }
    }

    loader = LoaderStub(responses)
    series = import_data_module._build_demographic_series(rcdts, loader)

    assert series["enrollment"] == {
        2024: 700,
        2023: 680,
        2022: 660,
        2021: 640,
        2020: 620,
        2019: 600,
    }
    assert series["low_income"][2024] == 40.0
    assert series["el"][2020] == 14.0
    assert series["white"][2024] == 50.0
    assert 2018 not in series["enrollment"]


def test_build_trend_series_act_helper_merges_sat_and_act_scores():
    """ACT series exposes the act key with SAT conversions + legacy scores."""
    rcdts = "11-111-1111-11-0006"
    responses = {
        2016: {rcdts: {"act_scores": {"composite": 20.0}}},
        2015: {rcdts: {"act_scores": {"composite": 19.5}}},
        2017: {rcdts: {"sat_composite": 1010}},
        2018: {rcdts: {"sat_composite": 980}},
    }

    loader = LoaderStub(responses)
    series = import_data_module._build_act_series(rcdts, loader)

    assert "act" in series
    act_series = series["act"]
    assert act_series[2018] == pytest.approx(18.0)
    assert act_series[2017] == pytest.approx(19.0)
    assert act_series[2016] == 20.0
    assert act_series[2015] == 19.5


def test_build_trend_series_combines_metrics():
    """build_trend_series exposes demographic and ACT/SAT trend data."""
    rcdts = "11-111-1111-11-0007"
    responses = {
        2024: {rcdts: {"enrollment": 800, "diversity": {"white": 55.0}}},
        2023: {rcdts: {"enrollment": 780, "low_income_percentage": 42.0}},
        2017: {rcdts: {"sat_composite": 1100}},
        2016: {rcdts: {"act_scores": {"composite": 21.0}}},
    }

    loader = LoaderStub(responses)
    trend_series = build_trend_series(rcdts, loader)

    assert "enrollment" in trend_series
    assert trend_series["enrollment"][2024] == 800
    assert trend_series["low_income"][2023] == 42.0
    assert trend_series["white"][2024] == 55.0
    assert trend_series["act"][2017] == pytest.approx(22.0)


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


def test_clean_percentage_invalid_string():
    """Non-numeric strings return None."""
    assert clean_percentage("not a number") is None


def test_clean_percentage_numeric_types():
    """Numeric inputs are passed through as floats."""
    assert clean_percentage(45) == 45.0
    assert clean_percentage(45.5) == 45.5


def test_clean_enrollment_converts_string():
    """Enrollment strings convert to ints."""
    assert clean_enrollment("1,234") == 1234
    assert clean_enrollment("567") == 567


def test_clean_enrollment_handles_asterisk():
    """Enrollment asterisks become None."""
    assert clean_enrollment("*") is None


def test_clean_enrollment_invalid_string():
    """Non-numeric enrollment strings return None."""
    assert clean_enrollment("not a number") is None


def test_clean_enrollment_numeric_types():
    """Numeric inputs remain ints."""
    assert clean_enrollment(1234) == 1234
    assert clean_enrollment(1234.5) == 1234


def test_clean_enrollment_float_string():
    """Float strings truncate to int."""
    assert clean_enrollment("1234.5") == 1234


def test_prepare_school_records_includes_iar_fields():
    """prepare_school_records should emit normalized level + IAR rates."""
    merged_df = pd.DataFrame(
        [
            {
                "RCDTS": "11-111-1111-11-0001",
                "School Name": "Sample Elementary",
                "District": "Unit 5",
                "City": "Normal",
                "County": "McLean",
                "School Type": "Elementary School",
                "Level": "School",
                "Grades Served": "K-5",
                "# Student Enrollment": "450",
                "% Student Enrollment - EL": "12.5%",
                "% Student Enrollment - Low Income": "40%",
                "ACT ELA Average Score - Grade 11": None,
                "ACT Math Average Score - Grade 11": None,
                "ACT Science Average Score - Grade 11": None,
                "IAR ELA Proficiency Rate - Total": "55.4%",
                "IAR Math Proficiency Rate - Total": "48.1%",
            }
        ]
    )

    records = prepare_school_records(merged_df)
    assert records[0]["level"] == "elementary"
    assert records[0]["iar_ela_proficiency_pct"] == 55.4
    assert records[0]["iar_math_proficiency_pct"] == 48.1
    assert records[0]["iar_overall_proficiency_pct"] == 51.75


def test_prepare_school_records_adds_trend_fields_with_loader():
    """Trend deltas populate when loader supplies historical data."""
    rcdts = "11-111-1111-11-0008"
    merged_df = pd.DataFrame(
        [
            {
                "RCDTS": rcdts,
                "School Name": "Trend High",
                "District": "District 1",
                "City": "Chicago",
                "County": "Cook",
                "School Type": "High School",
                "Level": "School",
                "Grades Served": "9-12",
                "# Student Enrollment": "500",
                "% Student Enrollment - EL": "12.0%",
                "% Student Enrollment - Low Income": "45.0%",
                "% Student Enrollment - White": "58.0%",
                "% Student Enrollment - Black or African American": "15.0%",
                "% Student Enrollment - Hispanic or Latino": "20.0%",
            }
        ]
    )

    loader = LoaderStub(
        {
            2024: {
                rcdts: {
                    "enrollment": 480,
                    "low_income_percentage": 40.0,
                    "el_percentage": 10.5,
                    "diversity": {
                        "white": 55.0,
                        "black": 14.5,
                    },
                }
            },
            2022: {
                rcdts: {
                    "enrollment": 450,
                    "low_income_percentage": 37.0,
                    "diversity": {
                        "white": 53.0,
                    },
                }
            },
            2020: {
                rcdts: {
                    "enrollment": 430,
                }
            },
        }
    )

    records = prepare_school_records(merged_df, loader=loader, current_year=2025)
    record = records[0]

    assert record["enrollment_trend_1yr"] == 20
    assert record["enrollment_trend_3yr"] == 50
    assert record["enrollment_trend_5yr"] == 70
    assert record["low_income_trend_1yr"] == pytest.approx(5.0)
    assert record["el_trend_1yr"] == pytest.approx(1.5)
    assert record["white_trend_1yr"] == pytest.approx(3.0)
    assert "white_trend_5yr" not in record


@pytest.mark.slow
def test_load_excel_data_returns_dataframes():
    """Loading Excel file yields General/ACT dataframes."""
    general_df, act_df, iar_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")

    assert not general_df.empty
    assert not act_df.empty
    assert "RCDTS" in general_df.columns
    assert "School Name" in general_df.columns


@pytest.mark.slow
def test_merge_school_data_filters_schools_only():
    """Merge filters to school-level rows."""
    general_df, act_df, iar_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df, iar_df)

    assert not merged_df.empty
    assert (merged_df["Level"] == "School").all()
    assert len(merged_df) < len(general_df)


@pytest.mark.slow
def test_merge_school_data_joins_act_scores():
    """ACT columns appear after merge."""
    general_df, act_df, iar_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df, iar_df)

    expected_columns = [
        "ACT ELA Average Score - Grade 11",
        "ACT Math Average Score - Grade 11",
        "ACT Science Average Score - Grade 11",
    ]
    for column in expected_columns:
        assert column in merged_df.columns


@pytest.mark.slow
def test_prepare_school_records_transforms_data():
    """Merged rows convert into dictionaries for bulk insert."""
    general_df, act_df, iar_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df, iar_df)

    records = prepare_school_records(merged_df)

    assert isinstance(records, list)
    assert len(records) > 0
    first = records[0]
    assert first["rcdts"]
    assert first["school_name"]
    assert "city" in first


@pytest.mark.slow
def test_prepare_school_records_includes_district():
    """District field should populate using dataset column."""
    general_df, act_df, iar_df = load_excel_data("../2025-Report-Card-Public-Data-Set.xlsx")
    merged_df = merge_school_data(general_df, act_df, iar_df)

    records = prepare_school_records(merged_df)

    assert any(record.get("district") for record in records)


def test_import_to_database_uses_historical_loader(monkeypatch, test_db):
    """Import path instantiates loader once and closes it."""

    loader_instances = []

    class LoaderDouble:
        def __init__(self):
            self.closed = False
            loader_instances.append(self)

        def load_year(self, year):
            return {}

        def close(self):
            self.closed = True

    monkeypatch.setattr(import_data_module, "HistoricalDataLoader", LoaderDouble)

    captured = {}

    def fake_prepare(merged_df, loader=None, current_year=None):
        captured["loader"] = loader
        captured["current_year"] = current_year
        return [
            {
                "rcdts": "11-111-1111-11-0010",
                "school_name": "Loader Test",
                "district": "Unit 5",
                "city": "Normal",
                "county": "McLean",
                "school_type": "High School",
                "level": "high",
            }
        ]

    monkeypatch.setattr(import_data_module, "prepare_school_records", fake_prepare)

    def fake_load_excel_data(path):
        general = pd.DataFrame(
            [
                {
                    "Level": "School",
                    "RCDTS": "11-111-1111-11-0010",
                    "School Name": "Loader Test",
                    "District": "Unit 5",
                    "City": "Normal",
                    "County": "McLean",
                    "School Type": "High School",
                    "Grades Served": "9-12",
                    "# Student Enrollment": "500",
                    "% Student Enrollment - EL": "10%",
                    "% Student Enrollment - Low Income": "40%",
                }
            ]
        )
        act = pd.DataFrame(
            [
                {
                    "RCDTS": "11-111-1111-11-0010",
                    "ACT ELA Average Score - Grade 11": 20,
                    "ACT Math Average Score - Grade 11": 21,
                    "ACT Science Average Score - Grade 11": 22,
                }
            ]
        )
        iar = pd.DataFrame(
            [
                {
                    "RCDTS": "11-111-1111-11-0010",
                    "IAR ELA Proficiency Rate - Total": 50,
                    "IAR Math Proficiency Rate - Total": 45,
                }
            ]
        )
        return general, act, iar

    monkeypatch.setattr(import_data_module, "load_excel_data", fake_load_excel_data)

    def fake_merge(general_df, act_df, iar_df):
        return pd.DataFrame(
            [
                {
                    "RCDTS": "11-111-1111-11-0010",
                    "School Name": "Loader Test",
                    "District": "Unit 5",
                    "City": "Normal",
                    "County": "McLean",
                    "School Type": "High School",
                    "Level": "School",
                    "Grades Served": "9-12",
                    "# Student Enrollment": "500",
                    "% Student Enrollment - EL": "10%",
                    "% Student Enrollment - Low Income": "40%",
                    "ACT ELA Average Score - Grade 11": 20,
                    "ACT Math Average Score - Grade 11": 21,
                    "ACT Science Average Score - Grade 11": 22,
                    "IAR ELA Proficiency Rate - Total": 50,
                    "IAR Math Proficiency Rate - Total": 45,
                }
            ]
        )

    monkeypatch.setattr(import_data_module, "merge_school_data", fake_merge)

    import_data_module.import_to_database(
        "../2025-Report-Card-Public-Data-Set.xlsx", test_db
    )

    assert len(loader_instances) == 1
    assert loader_instances[0].closed is True
    assert captured["loader"] is loader_instances[0]
    assert captured["current_year"] == 2025


@pytest.mark.slow
def test_import_to_database_inserts_schools(test_db):
    """Full import populates the schools table via bulk insert."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    count = test_db.query(School).count()
    assert count > 3800

    sample = test_db.query(School).filter_by(city="Elk Grove Village").first()
    assert sample is not None
    assert sample.school_name


@pytest.mark.slow
def test_import_handles_suppressed_data(test_db):
    """Suppressed ACT values store as NULL in the database."""
    import_to_database("../2025-Report-Card-Public-Data-Set.xlsx", test_db)

    school_with_null = test_db.query(School).filter(School.act_ela_avg.is_(None)).first()
    assert school_with_null is not None
