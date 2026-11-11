# ABOUTME: Tests for the ReportCardAPI sync pipeline
# ABOUTME: Covers field mapping, trend calculation, historical columns, and bulk insert

import pytest
from unittest.mock import MagicMock, patch

from app.utils.sync_from_api import (
    DataSync,
    display_name,
    normalize_level,
    sat_to_act,
    _get_field,
    _safe_float,
)


# ---------------------------------------------------------------------------
# normalize_level
# ---------------------------------------------------------------------------

def test_normalize_level_high():
    assert normalize_level("High School") == "high"

def test_normalize_level_elementary():
    assert normalize_level("Elementary School") == "elementary"

def test_normalize_level_middle():
    assert normalize_level("Middle School") == "middle"

def test_normalize_level_junior_high():
    assert normalize_level("Junior High School") == "middle"

def test_normalize_level_other():
    assert normalize_level("Alternative School") == "other"

def test_normalize_level_none():
    assert normalize_level(None) == "other"


# ---------------------------------------------------------------------------
# display_name
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "official, expected",
    [
        ("Clearmont Elem School", "Clearmont Elementary School"),
        ("Ridge Family Center for Learning Elem Sch", "Ridge Family Center for Learning Elementary School"),
        ("Margaret Mead JHS", "Margaret Mead Junior High School"),
        ("Lincoln Jr High School", "Lincoln Junior High School"),
        ("Washington Jr. High Sch", "Washington Junior High School"),
        ("Morton East HS", "Morton East High School"),
        ("Southland College Prep Charter Hs", "Southland College Prep Charter High School"),
        ("Central Jr-Sr HS", "Central Junior-Senior High School"),
        ("United Jr./Sr. High School", "United Junior/Senior High School"),
        ("Cerro Gordo Jr and Sr High School", "Cerro Gordo Junior and Senior High School"),
        ("Virginia Jr/ Sr High School", "Virginia Junior/ Senior High School"),
        ("Granite City Sr High School", "Granite City Senior High School"),
        ("Dakota Jr Sr High School", "Dakota Junior Senior High School"),
    ],
)
def test_display_name_expands_abbreviations(official, expected):
    assert display_name(official) == expected

@pytest.mark.parametrize(
    "official, expected",
    [
        ("M L King Jr Elem School", "M L King Jr Elementary School"),
        ("James Farmer Jr. Elementary", "James Farmer Jr. Elementary"),
        ("J Emmett Hinchcliffe Sr Elem Sch", "J Emmett Hinchcliffe Sr Elementary School"),
    ],
)
def test_display_name_keeps_jr_and_sr_in_a_persons_name(official, expected):
    assert display_name(official) == expected

def test_display_name_leaves_full_names_alone():
    assert display_name("Elk Grove High School") == "Elk Grove High School"

def test_display_name_only_expands_whole_words():
    assert display_name("Schaumburg Elementary") == "Schaumburg Elementary"
    assert display_name("Schneider Elem School") == "Schneider Elementary School"

def test_display_name_none():
    assert display_name(None) is None


# ---------------------------------------------------------------------------
# sat_to_act
# ---------------------------------------------------------------------------

def test_sat_to_act_converts_high_score():
    # SAT 1570+ → ACT 36
    result = sat_to_act(1580)
    assert result == 36.0

def test_sat_to_act_converts_mid_range():
    # 1200-1220 → ACT 25
    result = sat_to_act(1210)
    assert result is not None
    assert 24.0 <= result <= 26.0

def test_sat_to_act_returns_none_for_none():
    assert sat_to_act(None) is None

def test_sat_to_act_returns_none_for_non_numeric():
    assert sat_to_act("*") is None


# ---------------------------------------------------------------------------
# _get_field — multi-candidate field lookup
# ---------------------------------------------------------------------------

def test_get_field_returns_first_matching_candidate():
    row = {"pct_student_enrollment_low_income": 42.5}
    assert _get_field(row, "pct_low_income", "pct_student_enrollment_low_income") == 42.5

def test_get_field_skips_missing_candidates():
    row = {"pct_low_income": 30.0}
    assert _get_field(row, "pct_student_enrollment_low_income", "pct_low_income") == 30.0

def test_get_field_returns_none_when_all_missing():
    assert _get_field({}, "pct_low_income", "pct_student_enrollment_low_income") is None

def test_get_field_skips_none_values():
    row = {"pct_student_enrollment_low_income": None, "pct_low_income": 25.0}
    assert _get_field(row, "pct_student_enrollment_low_income", "pct_low_income") == 25.0


# ---------------------------------------------------------------------------
# _safe_float
# ---------------------------------------------------------------------------

def test_safe_float_converts_int():
    assert _safe_float(42) == 42.0

def test_safe_float_converts_string():
    assert _safe_float("3.14") == 3.14

def test_safe_float_returns_none_for_none():
    assert _safe_float(None) is None

def test_safe_float_returns_none_for_non_numeric():
    assert _safe_float("*") is None


# ---------------------------------------------------------------------------
# DataSync._build_current_record — field mapping from merged API row
# ---------------------------------------------------------------------------

@pytest.fixture
def sync(test_db):
    client = MagicMock()
    return DataSync(client)


def _general_row():
    return {
        "rcdts": "05-016-2140-17-0001",
        "school_name": "Lincoln High School",
        "district": "Township HSD 214",
        "city": "Elk Grove Village",
        "county": "Cook",
        "school_type": "High School",
        "grades_served": "9-12",
        "summative_designation": "Commendable",
        "student_enrollment": 1800,
        "pct_student_enrollment_low_income": 15.2,
        "pct_student_enrollment_el": 8.5,
        "pct_student_enrollment_white": 40.0,
        "pct_student_enrollment_black_or_african_american": 5.0,
        "pct_student_enrollment_hispanic_or_latino": 30.0,
        "pct_student_enrollment_asian": 20.0,
        "pct_student_enrollment_native_hawaiian_or_other_pacific_islander": 0.5,
        "pct_student_enrollment_american_indian_or_alaska_native": 0.3,
        "pct_student_enrollment_two_or_more_races": 4.2,
        "pct_student_enrollment_middle_eastern_or_north_african": None,
        # ACT fields merged in
        "act_ela_average_score_grade_11": 22.5,
        "act_math_average_score_grade_11": 21.3,
        "act_science_average_score_grade_11": 23.1,
        # IAR fields merged in
        "iar_ela_proficiency_rate_total": 65.0,
        "iar_math_proficiency_rate_total": 58.0,
    }


def test_build_current_record_maps_basic_fields(sync):
    record = sync._build_current_record(_general_row())
    assert record["rcdts"] == "05-016-2140-17-0001"
    assert record["school_name"] == "Lincoln High School"
    assert record["city"] == "Elk Grove Village"
    assert record["county"] == "Cook"
    assert record["district"] == "Township HSD 214"
    assert record["grades_served"] == "9-12"


def test_build_current_record_maps_designation(sync):
    record = sync._build_current_record(_general_row())
    assert record["designation"] == "Commendable"


def test_build_current_record_designation_none_when_not_designated(sync):
    row = _general_row()
    row["summative_designation"] = None
    assert sync._build_current_record(row)["designation"] is None


def test_build_current_record_designation_none_when_blank(sync):
    row = _general_row()
    row["summative_designation"] = "  "
    assert sync._build_current_record(row)["designation"] is None


def test_build_current_record_adds_display_name(sync):
    row = _general_row()
    row["school_name"] = "Lincoln Elem Sch"
    record = sync._build_current_record(row)
    assert record["school_name"] == "Lincoln Elem Sch"
    assert record["display_name"] == "Lincoln Elementary School"


def test_build_current_record_normalizes_level(sync):
    record = sync._build_current_record(_general_row())
    assert record["level"] == "high"


def test_build_current_record_maps_enrollment(sync):
    record = sync._build_current_record(_general_row())
    assert record["student_enrollment"] == 1800


def test_build_current_record_maps_demographics(sync):
    record = sync._build_current_record(_general_row())
    assert record["low_income_percentage"] == 15.2
    assert record["el_percentage"] == 8.5


def test_build_current_record_maps_diversity(sync):
    record = sync._build_current_record(_general_row())
    assert record["pct_white"] == 40.0
    assert record["pct_black"] == 5.0
    assert record["pct_hispanic"] == 30.0
    assert record["pct_asian"] == 20.0
    assert record["pct_pacific_islander"] == 0.5
    assert record["pct_native_american"] == 0.3
    assert record["pct_two_or_more"] == 4.2
    assert record["pct_mena"] is None


def test_build_current_record_maps_act_scores(sync):
    record = sync._build_current_record(_general_row())
    assert record["act_ela_avg"] == 22.5
    assert record["act_math_avg"] == 21.3
    assert record["act_science_avg"] == 23.1


def test_build_current_record_maps_iar_scores(sync):
    record = sync._build_current_record(_general_row())
    assert record["iar_ela_proficiency_pct"] == 65.0
    assert record["iar_math_proficiency_pct"] == 58.0
    assert record["iar_overall_proficiency_pct"] == pytest.approx(61.5, abs=0.01)


def test_build_current_record_iar_overall_none_when_missing(sync):
    row = _general_row()
    row["iar_ela_proficiency_rate_total"] = None
    row["iar_math_proficiency_rate_total"] = None
    record = sync._build_current_record(row)
    assert record["iar_overall_proficiency_pct"] is None


# ---------------------------------------------------------------------------
# DataSync._calculate_trend — delta math
# ---------------------------------------------------------------------------

def test_calculate_trend_computes_delta(sync):
    current = 1800.0
    series = {2024: 1700.0}
    delta = sync._calculate_trend(current, series, 2025, window=1)
    assert delta == pytest.approx(100.0, abs=0.01)


def test_calculate_trend_returns_none_when_year_missing(sync):
    delta = sync._calculate_trend(1800.0, {}, 2025, window=1)
    assert delta is None


def test_calculate_trend_fallback_to_2019_for_5yr(sync):
    # 5yr window targets 2020; if 2020 missing, falls back to 2019
    series = {2019: 1600.0}
    delta = sync._calculate_trend(1800.0, series, 2025, window=5)
    assert delta == pytest.approx(200.0, abs=0.01)


def test_calculate_trend_no_fallback_for_other_windows(sync):
    series = {2019: 1600.0}
    # 3yr window targets 2022, 2019 is not a valid fallback
    delta = sync._calculate_trend(1800.0, series, 2025, window=3)
    assert delta is None


# ---------------------------------------------------------------------------
# DataSync._extract_historical_value — multi-format field lookup per year
# ---------------------------------------------------------------------------

def test_extract_historical_value_enrollment(sync):
    row = {"student_enrollment": 1500}
    val = sync._extract_historical_value(row, "enrollment")
    assert val == 1500.0


def test_extract_historical_value_low_income_new_format(sync):
    row = {"pct_student_enrollment_low_income": 30.5}
    val = sync._extract_historical_value(row, "low_income")
    assert val == 30.5


def test_extract_historical_value_low_income_old_format(sync):
    row = {"pct_low_income": 25.0}
    val = sync._extract_historical_value(row, "low_income")
    assert val == 25.0


def test_extract_historical_value_act_composite_old(sync):
    row = {"act_composite": 21.5}
    val = sync._extract_historical_value(row, "act_composite")
    assert val == 21.5


def test_extract_historical_value_returns_none_for_missing(sync):
    val = sync._extract_historical_value({}, "enrollment")
    assert val is None


# ---------------------------------------------------------------------------
# DataSync._fetch_historical_year — supplementary SAT tables
# ---------------------------------------------------------------------------

def test_fetch_historical_year_merges_2019_sat_averages(sync):
    main_row = {"rcdts": "050162140170001", "student_enrollment": 1700}
    sat_row = {"rcdts": "050162140170001", "sat_reading_average": 600.0, "sat_math_average": 600.0}
    sync.client.query.return_value = {"data": [main_row]}

    def query_all_side_effect(year, entity_type, fields=None, table_suffix=None):
        if table_suffix == "sat":
            assert fields == ["rcdts", "sat_reading_average", "sat_math_average"]
            return [sat_row]
        return [dict(main_row)]

    sync.client.query_all.side_effect = query_all_side_effect

    year_data = sync._fetch_historical_year(2019)
    series = sync._build_act_series("050162140170001", {2019: year_data})

    # SAT composite 1200 converts to ACT 25
    assert series == {2019: 25}


# ---------------------------------------------------------------------------
# DataSync.sync — integration (mocked API, real DB)
# ---------------------------------------------------------------------------

def _make_client_for_sync():
    """Return a mock client that produces minimal but complete fake data."""
    client = MagicMock()
    client.get_years.return_value = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019,
                                      2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010]

    school_row = {
        "rcdts": "05-016-2140-17-0001",
        "school_name": "Lincoln High School",
        "district": "Township HSD 214",
        "city": "Elk Grove Village",
        "county": "Cook",
        "school_type": "High School",
        "grades_served": "9-12",
        "summative_designation": "Exemplary",
        "student_enrollment": 1800,
        "pct_student_enrollment_low_income": 15.2,
        "pct_student_enrollment_el": 8.5,
        "pct_student_enrollment_white": 40.0,
        "pct_student_enrollment_black_or_african_american": 5.0,
        "pct_student_enrollment_hispanic_or_latino": 30.0,
        "pct_student_enrollment_asian": 20.0,
        "pct_student_enrollment_native_hawaiian_or_other_pacific_islander": 0.5,
        "pct_student_enrollment_american_indian_or_alaska_native": 0.3,
        "pct_student_enrollment_two_or_more_races": 4.2,
        "pct_student_enrollment_middle_eastern_or_north_african": None,
    }
    act_row = {
        "rcdts": "05-016-2140-17-0001",
        "act_ela_average_score_grade_11": 22.5,
        "act_math_average_score_grade_11": 21.3,
        "act_science_average_score_grade_11": 23.1,
    }
    hist_act_row = {
        "rcdts": "05-016-2140-17-0001",
        "act_ela_average_score_grade_11": 21.0,
        "act_math_average_score_grade_11": 20.0,
        "act_science_average_score_grade_11": 22.0,
    }
    iar_row = {
        "rcdts": "05-016-2140-17-0001",
        "iar_ela_proficiency_rate_total": 65.0,
        "iar_math_proficiency_rate_total": 58.0,
    }
    hist_iar_row = {
        "rcdts": "05-016-2140-17-0001",
        "iar_ela_proficiency_rate_total": 60.5,
        "iar_math_proficiency_rate_total": 59.5,
    }
    hist_row = {
        "rcdts": "050162140170001",  # no hyphens in older data
        "student_enrollment": 1750,
        "pct_student_enrollment_low_income": 14.0,
        "pct_student_enrollment_el": 7.0,
        "pct_student_enrollment_white": 38.0,
        "pct_student_enrollment_black_or_african_american": 5.5,
        "pct_student_enrollment_hispanic_or_latino": 31.0,
        "pct_student_enrollment_asian": 21.0,
        "pct_student_enrollment_native_hawaiian_or_other_pacific_islander": 0.4,
        "pct_student_enrollment_american_indian_or_alaska_native": 0.3,
        "pct_student_enrollment_two_or_more_races": 3.8,
        "pct_student_enrollment_middle_eastern_or_north_african": None,
        "sat_reading_average_score": 580.0,
        "sat_math_average_score": 570.0,
        "act_composite": 21.0,
        "act_ela": 20.0,
        "act_math": 21.5,
        "act_science": 22.0,
    }

    def query_all_side_effect(year, entity_type, fields=None, table_suffix=None):
        if table_suffix == "act":
            return [act_row] if year == 2026 else [hist_act_row]
        if table_suffix == "iar":
            assert year in (2026, 2025), f"no comparable IAR totals for {year}"
            return [iar_row] if year == 2026 else [hist_iar_row]
        # Historical or current general data
        if year == 2026:
            return [school_row]
        return [hist_row]

    client.query_all.side_effect = query_all_side_effect
    return client


def test_sync_inserts_schools_into_db(test_db):
    from app.database import School
    client = _make_client_for_sync()
    ds = DataSync(client)

    count = ds.sync(test_db)

    assert count == 1
    assert test_db.query(School).count() == 1


def test_sync_populates_core_fields(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    assert school.rcdts == "05-016-2140-17-0001"
    assert school.school_name == "Lincoln High School"
    assert school.level == "high"
    assert school.student_enrollment == 1800
    assert school.act_ela_avg == 22.5
    assert school.iar_ela_proficiency_pct == 65.0


def test_sync_populates_historical_columns(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    assert school.enrollment_hist_2026 == 1800
    # Historical years come from hist_row
    assert school.enrollment_hist_2025 == 1750
    assert school.enrollment_hist_2024 == 1750


def test_sync_populates_current_year_act_history(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    assert school.act_ela_hist_2026 == 22.5
    assert school.act_math_hist_2026 == 21.3
    assert school.act_science_hist_2026 == 23.1
    assert school.act_hist_2026 == pytest.approx(21.9)


def test_sync_populates_2025_act_history_from_act_table(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    assert school.act_ela_hist_2025 == 21.0
    assert school.act_math_hist_2025 == 20.0
    assert school.act_science_hist_2025 == 22.0
    # Composite is the ELA/Math average, matching the current-year calculation
    assert school.act_hist_2025 == pytest.approx(20.5)


def test_sync_calculates_act_1yr_trend_against_2025(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    # 2026 composite (22.5 + 21.3) / 2 = 21.9 minus 2025 composite 20.5
    assert school.act_trend_1yr == pytest.approx(1.4)


def test_sync_requests_designation_from_the_current_year(test_db):
    client = _make_client_for_sync()
    DataSync(client).sync(test_db)

    current_general_calls = [
        call for call in client.query_all.call_args_list
        if call.args[0] == 2026 and call.kwargs.get("table_suffix") is None
    ]
    assert len(current_general_calls) == 1
    assert "summative_designation" in current_general_calls[0].args[2]


def test_sync_populates_designation_and_display_name(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    assert school.designation == "Exemplary"
    assert school.display_name == "Lincoln High School"


def test_sync_populates_current_year_iar_history(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    assert school.iar_ela_hist_2026 == 65.0
    assert school.iar_math_hist_2026 == 58.0
    assert school.iar_hist_2026 == pytest.approx(61.5)


def test_sync_populates_2025_iar_history_from_iar_table(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    assert school.iar_ela_hist_2025 == 60.5
    assert school.iar_math_hist_2025 == 59.5
    # Overall is the ELA/Math average, matching the current-year calculation
    assert school.iar_hist_2025 == pytest.approx(60.0)


def test_sync_calculates_iar_1yr_trends_against_2025(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())
    ds.sync(test_db)

    school = test_db.query(School).first()
    assert school.iar_ela_trend_1yr == pytest.approx(4.5)
    assert school.iar_math_trend_1yr == pytest.approx(-1.5)
    assert school.iar_trend_1yr == pytest.approx(1.5)


def test_sync_leaves_iar_trend_empty_without_2025_results(test_db):
    from app.database import School
    client = _make_client_for_sync()
    inner = client.query_all.side_effect

    def without_2025_iar(year, entity_type, fields=None, table_suffix=None):
        if table_suffix == "iar" and year == 2025:
            return []
        return inner(year, entity_type, fields, table_suffix=table_suffix)

    client.query_all.side_effect = without_2025_iar
    DataSync(client).sync(test_db)

    school = test_db.query(School).first()
    assert school.iar_hist_2025 is None
    assert school.iar_ela_trend_1yr is None
    assert school.iar_math_trend_1yr is None
    assert school.iar_trend_1yr is None


def test_sync_clears_existing_data(test_db):
    from app.database import School
    ds = DataSync(_make_client_for_sync())

    ds.sync(test_db)
    ds.sync(test_db)  # second run

    # Should still be exactly 1 school (not 2)
    assert test_db.query(School).count() == 1
