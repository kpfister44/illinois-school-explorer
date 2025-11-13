# ABOUTME: Tests for loading historical report card files
# ABOUTME: Validates Excel and legacy TXT parsing for trend metrics

from pathlib import Path

import pandas as pd

from app.utils.historical_loader import HistoricalDataLoader, _default_base_path


def _write_excel_fixture(base_dir: Path, filename: str, general_rows, assessment_rows=None) -> Path:
    path = base_dir / filename
    with pd.ExcelWriter(path) as writer:
        pd.DataFrame(general_rows).to_excel(writer, sheet_name="General", index=False)
        if assessment_rows is not None:
            pd.DataFrame(assessment_rows).to_excel(writer, sheet_name="ACT", index=False)
    return path


def test_load_year_from_excel_returns_normalized_metrics(tmp_path):
    historical_dir = tmp_path / "data" / "historical-report-cards"
    historical_dir.mkdir(parents=True)

    rcdts = "11-111-1111-11-0001"
    general_rows = [
        {
            "DestinationTable": "General",
            "RCDTS": rcdts,
            "Level": "School",
            "# Student Enrollment": "525",
            "% Student Enrollment - Low Income": "52.3%",
            "% Student Enrollment - EL": "15.2%",
            "% Student Enrollment - White": "60.0%",
            "% Student Enrollment - Black or African American": "12.5%",
            "% Student Enrollment - Hispanic or Latino": "20.0%",
            "% Student Enrollment - Asian": "5.0%",
            "% Student Enrollment - Native Hawaiian or Other Pacific Islander": "0.3%",
            "% Student Enrollment - American Indian or Alaska Native": "0.2%",
            "% Student Enrollment - Two or More Races": "2.0%",
            "% Student Enrollment - Middle Eastern or North African": "0.0%",
        }
    ]
    assessment_rows = [
        {
            "RCDTS": rcdts,
            "Average SAT Composite Score": 1010,
        }
    ]

    _write_excel_fixture(
        historical_dir,
        "2022-Report-Card-Public-Data-Set.xlsx",
        general_rows,
        assessment_rows,
    )

    loader = HistoricalDataLoader(base_path=historical_dir)

    year_data = loader.load_year(2022)
    assert rcdts in year_data

    metrics = year_data[rcdts]
    assert metrics["enrollment"] == 525
    assert metrics["low_income_percentage"] == 52.3
    assert metrics["el_percentage"] == 15.2
    assert metrics["sat_composite"] == 1010
    assert metrics["diversity"]["white"] == 60.0
    assert metrics["diversity"]["black"] == 12.5
    assert metrics["diversity"]["hispanic"] == 20.0
    assert metrics["diversity"]["asian"] == 5.0
    assert metrics["diversity"]["pacific_islander"] == 0.3
    assert metrics["diversity"]["native_american"] == 0.2
    assert metrics["diversity"]["two_or_more"] == 2.0
    assert metrics["diversity"]["mena"] == 0.0


def test_load_year_from_txt_includes_act_scores(tmp_path):
    historical_dir = tmp_path / "data" / "historical-report-cards"
    historical_dir.mkdir(parents=True)

    txt_path = historical_dir / "rc15_assessment.txt"
    txt_path.write_text(
        "|".join(
            [
                "RCDTS",
                "School Name",
                "ACT ELA Average Score - Grade 11",
                "ACT Math Average Score - Grade 11",
                "ACT Science Average Score - Grade 11",
                "ACT Composite Score - Grade 11",
            ]
        )
        + "\n"
        + "|".join([
            "11-111-1111-11-0002",
            "Historical High",
            "17.1",
            "18.2",
            "19.3",
            "18.2",
        ])
        + "\n",
        encoding="utf-8",
    )

    loader = HistoricalDataLoader(base_path=historical_dir)
    data = loader.load_year(2015)

    metrics = data["11-111-1111-11-0002"]
    assert metrics["act_scores"]["ela"] == 17.1
    assert metrics["act_scores"]["math"] == 18.2
    assert metrics["act_scores"]["science"] == 19.3
    assert metrics["act_scores"]["composite"] == 18.2


def test_load_year_merges_metrics_from_multiple_files(tmp_path):
    historical_dir = tmp_path / "data" / "historical-report-cards"
    historical_dir.mkdir(parents=True)

    rcdts = "11-111-1111-11-0003"
    general_rows = [
        {
            "DestinationTable": "General",
            "RCDTS": rcdts,
            "Level": "School",
            "# Student Enrollment": "600",
            "% Student Enrollment - Low Income": "40%",
            "% Student Enrollment - EL": "10%",
            "% Student Enrollment - White": "50%",
            "% Student Enrollment - Black or African American": "20%",
            "% Student Enrollment - Hispanic or Latino": "20%",
            "% Student Enrollment - Asian": "5%",
            "% Student Enrollment - Two or More Races": "5%",
            "% Student Enrollment - Middle Eastern or North African": "0%",
            "% Student Enrollment - American Indian or Alaska Native": "0%",
            "% Student Enrollment - Native Hawaiian or Other Pacific Islander": "0%",
        }
    ]
    assessment_rows = [
        {
            "RCDTS": rcdts,
            "Average SAT Composite Score": 990,
        }
    ]
    _write_excel_fixture(
        historical_dir,
        "23-RC-Pub-Data-Set.xlsx",
        general_rows,
        assessment_rows,
    )

    txt_path = historical_dir / "rc23_assessment.txt"
    txt_path.write_text(
        "RCDTS\tACT Composite Score - Grade 11\n"
        "{rcdts}\t19.1\n".format(rcdts=rcdts),
        encoding="utf-8",
    )

    loader = HistoricalDataLoader(base_path=historical_dir)
    metrics = loader.load_year(2023)[rcdts]

    assert metrics["enrollment"] == 600
    assert metrics["sat_composite"] == 990
    assert metrics["act_scores"]["composite"] == 19.1


def test_default_base_path_points_to_repo_root():
    loader = HistoricalDataLoader()
    expected = _default_base_path()
    assert loader.base_path == expected
    assert loader.base_path.exists()
