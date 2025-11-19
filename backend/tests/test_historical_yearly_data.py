# ABOUTME: Tests for historical yearly data storage and retrieval
# ABOUTME: Validates database columns for 2019-2025 historical metrics

import pytest

from app.database import School


def test_school_has_enrollment_historical_columns(test_db):
    """Test School model has historical enrollment columns for each year."""
    school = School(
        rcdts="TEST-RCDTS",
        school_name="Test School",
        city="Test City",
        level="School",
        enrollment_hist_2025=1000,
        enrollment_hist_2024=950,
        enrollment_hist_2023=900,
        enrollment_hist_2022=850,
        enrollment_hist_2021=800,
        enrollment_hist_2020=750,
        enrollment_hist_2019=700,
    )
    test_db.add(school)
    test_db.commit()

    result = test_db.query(School).filter_by(rcdts="TEST-RCDTS").first()
    assert result.enrollment_hist_2025 == 1000
    assert result.enrollment_hist_2024 == 950
    assert result.enrollment_hist_2023 == 900
    assert result.enrollment_hist_2022 == 850
    assert result.enrollment_hist_2021 == 800
    assert result.enrollment_hist_2020 == 750
    assert result.enrollment_hist_2019 == 700


def test_school_has_act_historical_columns(test_db):
    """Test School model has historical ACT columns for each year."""
    school = School(
        rcdts="TEST-ACT",
        school_name="Test ACT School",
        city="Test City",
        level="School",
        act_hist_2025=20.5,
        act_hist_2024=20.3,
        act_hist_2023=20.1,
        act_hist_2022=19.9,
        act_hist_2021=19.7,
        act_hist_2020=None,  # COVID year
        act_hist_2019=19.5,
        act_ela_hist_2025=19.0,
        act_ela_hist_2024=18.8,
        act_math_hist_2025=21.0,
        act_math_hist_2024=20.8,
        act_science_hist_2025=20.0,
        act_science_hist_2024=19.8,
    )
    test_db.add(school)
    test_db.commit()

    result = test_db.query(School).filter_by(rcdts="TEST-ACT").first()
    assert result.act_hist_2025 == 20.5
    assert result.act_hist_2024 == 20.3
    assert result.act_hist_2020 is None
    assert result.act_ela_hist_2025 == 19.0
    assert result.act_math_hist_2025 == 21.0
    assert result.act_science_hist_2025 == 20.0


def test_school_has_demographics_historical_columns(test_db):
    """Test School model has historical demographic columns."""
    school = School(
        rcdts="TEST-DEMO",
        school_name="Test Demo School",
        city="Test City",
        level="School",
        el_hist_2025=15.5,
        el_hist_2024=15.0,
        low_income_hist_2025=40.5,
        low_income_hist_2024=39.0,
    )
    test_db.add(school)
    test_db.commit()

    result = test_db.query(School).filter_by(rcdts="TEST-DEMO").first()
    assert result.el_hist_2025 == 15.5
    assert result.el_hist_2024 == 15.0
    assert result.low_income_hist_2025 == 40.5
    assert result.low_income_hist_2024 == 39.0


def test_school_has_diversity_historical_columns(test_db):
    """Test School model has historical diversity columns for all races."""
    school = School(
        rcdts="TEST-DIV",
        school_name="Test Diversity School",
        city="Test City",
        level="School",
        white_hist_2025=50.0,
        white_hist_2024=51.0,
        black_hist_2025=20.0,
        black_hist_2024=19.5,
        hispanic_hist_2025=15.0,
        hispanic_hist_2024=14.5,
        asian_hist_2025=10.0,
        asian_hist_2024=10.5,
        pacific_islander_hist_2025=1.0,
        pacific_islander_hist_2024=1.0,
        native_american_hist_2025=0.5,
        native_american_hist_2024=0.5,
        two_or_more_hist_2025=2.5,
        two_or_more_hist_2024=2.0,
        mena_hist_2025=1.0,
        mena_hist_2024=1.0,
    )
    test_db.add(school)
    test_db.commit()

    result = test_db.query(School).filter_by(rcdts="TEST-DIV").first()
    assert result.white_hist_2025 == 50.0
    assert result.black_hist_2025 == 20.0
    assert result.hispanic_hist_2025 == 15.0
    assert result.asian_hist_2025 == 10.0
    assert result.pacific_islander_hist_2025 == 1.0
    assert result.native_american_hist_2025 == 0.5
    assert result.two_or_more_hist_2025 == 2.5
    assert result.mena_hist_2025 == 1.0


def test_school_has_15_years_enrollment_historical_columns(test_db):
    """Test School model has enrollment columns for all 15 years (2010-2025)."""
    school = School(
        rcdts="TEST-15YR",
        school_name="Test 15 Year School",
        city="Test City",
        level="School",
        enrollment_hist_2025=1500,
        enrollment_hist_2024=1480,
        enrollment_hist_2023=1460,
        enrollment_hist_2022=1440,
        enrollment_hist_2021=1420,
        enrollment_hist_2020=1400,
        enrollment_hist_2019=1380,
        enrollment_hist_2018=1360,
        enrollment_hist_2017=1340,
        enrollment_hist_2016=1320,
        enrollment_hist_2015=1300,
        enrollment_hist_2014=1280,
        enrollment_hist_2013=1260,
        enrollment_hist_2012=1240,
        enrollment_hist_2011=1220,
        enrollment_hist_2010=1200,
    )
    test_db.add(school)
    test_db.commit()

    result = test_db.query(School).filter_by(rcdts="TEST-15YR").first()
    assert result.enrollment_hist_2025 == 1500
    assert result.enrollment_hist_2024 == 1480
    assert result.enrollment_hist_2023 == 1460
    assert result.enrollment_hist_2022 == 1440
    assert result.enrollment_hist_2021 == 1420
    assert result.enrollment_hist_2020 == 1400
    assert result.enrollment_hist_2019 == 1380
    assert result.enrollment_hist_2018 == 1360
    assert result.enrollment_hist_2017 == 1340
    assert result.enrollment_hist_2016 == 1320
    assert result.enrollment_hist_2015 == 1300
    assert result.enrollment_hist_2014 == 1280
    assert result.enrollment_hist_2013 == 1260
    assert result.enrollment_hist_2012 == 1240
    assert result.enrollment_hist_2011 == 1220
    assert result.enrollment_hist_2010 == 1200


def test_school_has_15_years_act_historical_columns(test_db):
    """Test School model has ACT columns for all 15 years (2010-2025)."""
    school = School(
        rcdts="TEST-15YR-ACT",
        school_name="Test 15 Year ACT School",
        city="Test City",
        level="School",
        act_hist_2025=21.5,
        act_hist_2024=21.3,
        act_hist_2023=21.1,
        act_hist_2022=20.9,
        act_hist_2021=20.7,
        act_hist_2020=None,
        act_hist_2019=20.5,
        act_hist_2018=20.3,
        act_hist_2017=20.1,
        act_hist_2016=19.9,
        act_hist_2015=19.7,
        act_hist_2014=19.5,
        act_hist_2013=19.3,
        act_hist_2012=19.1,
        act_hist_2011=18.9,
        act_hist_2010=18.7,
    )
    test_db.add(school)
    test_db.commit()

    result = test_db.query(School).filter_by(rcdts="TEST-15YR-ACT").first()
    assert result.act_hist_2025 == 21.5
    assert result.act_hist_2018 == 20.3
    assert result.act_hist_2015 == 19.7
    assert result.act_hist_2010 == 18.7
