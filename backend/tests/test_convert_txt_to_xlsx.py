# ABOUTME: Tests txt-to-xlsx conversion for historical RC files
# ABOUTME: Ensures converted data loads into historical extractor

from pathlib import Path

import pandas as pd
import pytest

from app.utils.convert_txt_to_xlsx import convert_txt_to_xlsx
from app.utils.import_historical_trends import HistoricalDataExtractor


@pytest.fixture
def rc10_txt_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "historical-report-cards" / "rc10.txt"


@pytest.fixture
def rc11_txt_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "historical-report-cards" / "rc11u.txt"


@pytest.fixture
def rc12_txt_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "historical-report-cards" / "rc12.txt"


@pytest.fixture
def rc13_txt_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "historical-report-cards" / "rc13.txt"


@pytest.fixture
def rc14_txt_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "historical-report-cards" / "rc14.txt"


@pytest.fixture
def rc15_txt_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "historical-report-cards" / "rc15.txt"


@pytest.fixture
def rc16_txt_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "historical-report-cards" / "rc16.txt"


@pytest.fixture
def rc17_txt_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "historical-report-cards" / "rc17.txt"


def test_convert_rc10_general_supports_elk_grove(tmp_path, rc10_txt_path):
    output_path = tmp_path / "2010-Report-Card-Public-Data-Set.xlsx"
    convert_txt_to_xlsx(str(rc10_txt_path), str(output_path))

    df = pd.read_excel(output_path, sheet_name="General")
    elk_grove = df[df["RCDTS"] == "050162140170002"].iloc[0]

    assert elk_grove["# Student Enrollment"] == 2044
    assert elk_grove["% White"] == pytest.approx(59.4)
    assert elk_grove["% Black"] == pytest.approx(2.8)
    assert elk_grove["% Hispanic"] == pytest.approx(23.8)
    assert elk_grove["% Asian"] == pytest.approx(9.7)
    assert elk_grove["% Low-Income"] == pytest.approx(22.2)
    assert elk_grove["% EL"] == pytest.approx(6.8, rel=0, abs=0.05)
    assert elk_grove["ACT Composite"] == pytest.approx(22.5, rel=0, abs=0.05)
    assert elk_grove["ACT Math"] == pytest.approx(22.2, rel=0, abs=0.05)

    extractor = HistoricalDataExtractor(base_path=tmp_path)
    data_2010 = extractor.load_year(2010)
    elk = data_2010["050162140170002"]

    assert elk["enrollment"] == 2044
    assert elk["low_income_percentage"] == pytest.approx(22.2)
    assert elk["white"] == pytest.approx(59.4)
    assert elk["act_composite"] == pytest.approx(22.5, rel=0, abs=0.05)
    assert elk["el_percentage"] == pytest.approx(6.8, rel=0, abs=0.05)
    assert elk["act_scores"]["math"] == pytest.approx(22.2, rel=0, abs=0.05)


def test_convert_rc11_general_supports_elk_grove(tmp_path, rc11_txt_path):
    output_path = tmp_path / "2011-Report-Card-Public-Data-Set.xlsx"
    convert_txt_to_xlsx(str(rc11_txt_path), str(output_path))

    df = pd.read_excel(output_path, sheet_name="General")
    elk_grove = df[df["RCDTS"] == "050162140170002"].iloc[0]

    assert elk_grove["# Student Enrollment"] == 2074
    assert elk_grove["% White"] == pytest.approx(57.5)
    assert elk_grove["% Black"] == pytest.approx(2.9)
    assert elk_grove["% Hispanic"] == pytest.approx(28.4)
    assert elk_grove["% Asian"] == pytest.approx(9.1)
    assert elk_grove["% Low-Income"] == pytest.approx(26.0)
    assert elk_grove["% EL"] == pytest.approx(5.7, rel=0, abs=0.05)
    assert elk_grove["ACT Composite"] == pytest.approx(22.0)
    assert elk_grove["ACT Math"] == pytest.approx(22.3)

    extractor = HistoricalDataExtractor(base_path=tmp_path)
    data_2011 = extractor.load_year(2011)
    elk = data_2011["050162140170002"]

    assert elk["enrollment"] == 2074
    assert elk["low_income_percentage"] == pytest.approx(26.0)
    assert elk["white"] == pytest.approx(57.5)
    assert elk["act_composite"] == pytest.approx(22.0)
    assert elk["el_percentage"] == pytest.approx(5.7, rel=0, abs=0.05)
    assert elk["act_scores"]["math"] == pytest.approx(22.3)


def test_convert_rc12_general_supports_elk_grove(tmp_path, rc12_txt_path):
    output_path = tmp_path / "2012-Report-Card-Public-Data-Set.xlsx"
    convert_txt_to_xlsx(str(rc12_txt_path), str(output_path))

    df = pd.read_excel(output_path, sheet_name="General")
    elk_grove = df[df["RCDTS"] == "050162140170002"].iloc[0]

    assert elk_grove["# Student Enrollment"] == 2081
    assert elk_grove["% White"] == pytest.approx(54.1)
    assert elk_grove["% Black"] == pytest.approx(2.5)
    assert elk_grove["% Hispanic"] == pytest.approx(31.3)
    assert elk_grove["% Asian"] == pytest.approx(9.5)
    assert elk_grove["% Low-Income"] == pytest.approx(31.4)
    assert elk_grove["% EL"] == pytest.approx(6.2, rel=0, abs=0.05)
    assert elk_grove["ACT Composite"] == pytest.approx(22.6)
    assert elk_grove["ACT Math"] == pytest.approx(23.5)

    extractor = HistoricalDataExtractor(base_path=tmp_path)
    data_2012 = extractor.load_year(2012)
    elk = data_2012["050162140170002"]

    assert elk["enrollment"] == 2081
    assert elk["low_income_percentage"] == pytest.approx(31.4)
    assert elk["white"] == pytest.approx(54.1)
    assert elk["act_composite"] == pytest.approx(22.6)
    assert elk["el_percentage"] == pytest.approx(6.2, rel=0, abs=0.05)
    assert elk["act_scores"]["math"] == pytest.approx(23.5)


def test_convert_rc13_general_supports_elk_grove(tmp_path, rc13_txt_path):
    output_path = tmp_path / "2013-Report-Card-Public-Data-Set.xlsx"
    convert_txt_to_xlsx(str(rc13_txt_path), str(output_path))

    df = pd.read_excel(output_path, sheet_name="General")
    elk_grove = df[df["RCDTS"] == "050162140170002"].iloc[0]

    assert elk_grove["# Student Enrollment"] == 2061
    assert elk_grove["% White"] == pytest.approx(52.2)
    assert elk_grove["% Black"] == pytest.approx(2.8)
    assert elk_grove["% Hispanic"] == pytest.approx(33.5)
    assert elk_grove["% Asian"] == pytest.approx(8.7)
    assert elk_grove["% Low-Income"] == pytest.approx(36.1)
    assert elk_grove["% EL"] == pytest.approx(6.7, rel=0, abs=0.05)
    assert elk_grove["ACT Composite"] == pytest.approx(22.0)
    assert elk_grove["ACT Math"] == pytest.approx(23.2)

    extractor = HistoricalDataExtractor(base_path=tmp_path)
    data_2013 = extractor.load_year(2013)
    elk = data_2013["050162140170002"]

    assert elk["enrollment"] == 2061
    assert elk["low_income_percentage"] == pytest.approx(36.1)
    assert elk["white"] == pytest.approx(52.2)
    assert elk["act_composite"] == pytest.approx(22.0)
    assert elk["el_percentage"] == pytest.approx(6.7, rel=0, abs=0.05)
    assert elk["act_scores"]["math"] == pytest.approx(23.2)


def test_convert_rc14_general_supports_elk_grove(tmp_path, rc14_txt_path):
    output_path = tmp_path / "2014-Report-Card-Public-Data-Set.xlsx"
    convert_txt_to_xlsx(str(rc14_txt_path), str(output_path))

    df = pd.read_excel(output_path, sheet_name="General")
    elk_grove = df[df["RCDTS"] == "050162140170002"].iloc[0]

    assert elk_grove["# Student Enrollment"] == 2029
    assert elk_grove["% White"] == pytest.approx(49.0)
    assert elk_grove["% Black"] == pytest.approx(2.8)
    assert elk_grove["% Hispanic"] == pytest.approx(36.3)
    assert elk_grove["% Asian"] == pytest.approx(8.3)
    assert elk_grove["% Low-Income"] == pytest.approx(8.2)
    assert elk_grove["% EL"] == pytest.approx(5.5, rel=0, abs=0.05)
    assert elk_grove["ACT Composite"] == pytest.approx(22.3)
    assert elk_grove["ACT Math"] == pytest.approx(23.0)

    extractor = HistoricalDataExtractor(base_path=tmp_path)
    data_2014 = extractor.load_year(2014)
    elk = data_2014["050162140170002"]

    assert elk["enrollment"] == 2029
    assert elk["low_income_percentage"] == pytest.approx(8.2)
    assert elk["white"] == pytest.approx(49.0)
    assert elk["act_composite"] == pytest.approx(22.3)
    assert elk["el_percentage"] == pytest.approx(5.5, rel=0, abs=0.05)
    assert elk["act_scores"]["math"] == pytest.approx(23.0)


def test_convert_rc15_general_supports_elk_grove(tmp_path, rc15_txt_path):
    output_path = tmp_path / "2015-Report-Card-Public-Data-Set.xlsx"
    convert_txt_to_xlsx(str(rc15_txt_path), str(output_path))

    df = pd.read_excel(output_path, sheet_name="General")
    elk_grove = df[df["RCDTS"] == "050162140170002"].iloc[0]

    assert elk_grove["# Student Enrollment"] == 1993
    assert elk_grove["% White"] == pytest.approx(46.8)
    assert elk_grove["% Black"] == pytest.approx(3.0)
    assert elk_grove["% Hispanic"] == pytest.approx(39.0)
    assert elk_grove["% Asian"] == pytest.approx(8.3)
    assert elk_grove["% Low-Income"] == pytest.approx(42.2)
    assert elk_grove["ACT Composite"] == pytest.approx(22.3)
    assert elk_grove["ACT Math"] == pytest.approx(23.1)

    extractor = HistoricalDataExtractor(base_path=tmp_path)
    data_2015 = extractor.load_year(2015)
    elk = data_2015["050162140170002"]

    assert elk["enrollment"] == 1993
    assert elk["low_income_percentage"] == pytest.approx(42.2)
    assert elk["white"] == pytest.approx(46.8)
    assert elk["act_composite"] == pytest.approx(22.3)
    assert elk["act_scores"]["math"] == pytest.approx(23.1)


def test_convert_rc16_general_supports_elk_grove(tmp_path, rc16_txt_path):
    output_path = tmp_path / "2016-Report-Card-Public-Data-Set.xlsx"
    convert_txt_to_xlsx(str(rc16_txt_path), str(output_path))

    df = pd.read_excel(output_path, sheet_name="General")
    elk_grove = df[df["RCDTS"] == "050162140170002"].iloc[0]

    assert elk_grove["# Student Enrollment"] == 2000
    assert elk_grove["% White"] == pytest.approx(44.4)
    assert elk_grove["% Black"] == pytest.approx(3.2)
    assert elk_grove["% Hispanic"] == pytest.approx(41.4)
    assert elk_grove["% Asian"] == pytest.approx(8.2)
    assert elk_grove["% Low-Income"] == pytest.approx(36.3)
    assert elk_grove["% EL"] == pytest.approx(7.9, rel=0, abs=0.05)
    assert elk_grove["ACT Composite"] == pytest.approx(21.3)

    extractor = HistoricalDataExtractor(base_path=tmp_path)
    data_2016 = extractor.load_year(2016)
    elk = data_2016["050162140170002"]

    assert elk["enrollment"] == 2000
    assert elk["low_income_percentage"] == pytest.approx(36.3)
    assert elk["white"] == pytest.approx(44.4)
    assert elk["act_composite"] == pytest.approx(21.3)
    assert elk["el_percentage"] == pytest.approx(7.9, rel=0, abs=0.05)


def test_convert_rc17_general_supports_elk_grove(tmp_path, rc17_txt_path):
    output_path = tmp_path / "2017-Report-Card-Public-Data-Set.xlsx"
    convert_txt_to_xlsx(str(rc17_txt_path), str(output_path))

    df = pd.read_excel(output_path, sheet_name="General")
    elk_grove = df[df["RCDTS"] == "050162140170002"].iloc[0]

    assert elk_grove["# Student Enrollment"] == 1918
    assert elk_grove["% White"] == pytest.approx(42.9, rel=0, abs=0.05)
    assert elk_grove["% Black"] == pytest.approx(2.9, rel=0, abs=0.05)
    assert elk_grove["% Hispanic"] == pytest.approx(42.3, rel=0, abs=0.05)
    assert elk_grove["% Asian"] == pytest.approx(9.0, rel=0, abs=0.05)
    assert elk_grove["% Low-Income"] == pytest.approx(34.5, rel=0, abs=0.05)
    assert elk_grove["% EL"] == pytest.approx(8.0, rel=0, abs=0.05)
    assert elk_grove["ACT Composite"] == pytest.approx(21.4, rel=0, abs=0.05)
    assert elk_grove["ACT Math"] == pytest.approx(21.8, rel=0, abs=0.05)

    extractor = HistoricalDataExtractor(base_path=tmp_path)
    data_2017 = extractor.load_year(2017)
    elk = data_2017["050162140170002"]

    assert elk["enrollment"] == 1918
    assert elk["low_income_percentage"] == pytest.approx(34.5, rel=0, abs=0.05)
    assert elk["white"] == pytest.approx(42.9, rel=0, abs=0.05)
    assert elk["act_composite"] == pytest.approx(21.4, rel=0, abs=0.05)
    assert elk["act_scores"]["math"] == pytest.approx(21.8, rel=0, abs=0.05)
