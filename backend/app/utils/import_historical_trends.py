# ABOUTME: Historical trend data importer with improved SAT-to-ACT conversion
# ABOUTME: Replaces historical_loader.py with comprehensive Excel parsing and trend calculation

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import School, SessionLocal, init_db

# Historical file configuration
HISTORICAL_DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "historical-report-cards"

# Years to process (2025 is current, looking back 15 years to 2010)
CURRENT_YEAR = 2025
DEMOGRAPHIC_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010]
SAT_YEARS = [2024, 2023, 2022, 2021, 2019]  # Skip 2020 (no SAT data)
ACT_YEARS = [2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010]  # Years with direct ACT data (pre-SAT era)

# Trend windows
TREND_WINDOWS = [1, 3, 5]

# SAT to ACT concordance table with ranges
SAT_TO_ACT_RANGES = [
    (1570, 1600, 36), (1530, 1560, 35), (1490, 1520, 34), (1450, 1480, 33),
    (1420, 1440, 32), (1390, 1410, 31), (1360, 1380, 30), (1330, 1350, 29),
    (1300, 1320, 28), (1260, 1290, 27), (1230, 1250, 26), (1200, 1220, 25),
    (1160, 1190, 24), (1130, 1150, 23), (1100, 1120, 22), (1060, 1090, 21),
    (1030, 1050, 20), (990, 1020, 19), (960, 980, 18), (920, 950, 17),
    (880, 910, 16), (830, 870, 15), (780, 820, 14), (730, 770, 13),
    (690, 720, 12), (650, 680, 11), (620, 640, 10), (590, 610, 9),
]


def sat_to_act_precise(sat_composite: float) -> Optional[float]:
    """
    Convert SAT composite (out of 1600) to ACT composite with decimal precision.

    Uses linear interpolation within ranges for more accurate conversion.
    For scores in gaps between ranges, interpolates between adjacent ACT scores.
    """
    if sat_composite is None:
        return None

    try:
        score = float(sat_composite)
    except (TypeError, ValueError):
        return None

    # Handle out-of-range scores
    if score >= SAT_TO_ACT_RANGES[0][1]:
        return float(SAT_TO_ACT_RANGES[0][2])
    if score <= SAT_TO_ACT_RANGES[-1][0]:
        return float(SAT_TO_ACT_RANGES[-1][2])

    # First check if score falls in a gap between ranges
    # Ranges are in descending SAT order, so we check if score is between adjacent ranges
    for i in range(len(SAT_TO_ACT_RANGES) - 1):
        current_min = SAT_TO_ACT_RANGES[i][0]
        current_max = SAT_TO_ACT_RANGES[i][1]
        next_min = SAT_TO_ACT_RANGES[i + 1][0]
        next_max = SAT_TO_ACT_RANGES[i + 1][1]

        # Check if score falls in the gap between this range and the next
        # Since ranges descend: current is higher SAT, next is lower SAT
        if next_max < score < current_min:
            # In gap between ranges
            lower_act = SAT_TO_ACT_RANGES[i + 1][2]  # Lower SAT → Lower ACT
            upper_act = SAT_TO_ACT_RANGES[i][2]      # Higher SAT → Higher ACT

            gap_width = current_min - next_max
            position = score - next_max
            progress = position / gap_width

            interpolated = lower_act + (progress * (upper_act - lower_act))
            return round(interpolated, 1)

    # Find the range this score falls into
    for i, (min_sat, max_sat, act_score) in enumerate(SAT_TO_ACT_RANGES):
        if min_sat <= score <= max_sat:
            # Within a defined range - interpolate within the range
            range_width = max_sat - min_sat
            position = score - min_sat

            # Determine adjacent ACT scores for interpolation
            if i == 0:
                # Highest range
                lower_act = act_score
                upper_act = act_score
            elif i == len(SAT_TO_ACT_RANGES) - 1:
                # Lowest range
                lower_act = act_score
                upper_act = act_score
            else:
                # Middle ranges - interpolate toward next ACT score
                lower_act = act_score
                upper_act = SAT_TO_ACT_RANGES[i - 1][2]  # Higher ACT score

            # Linear interpolation within range
            if upper_act != lower_act:
                progress = position / range_width
                interpolated = lower_act + (progress * (upper_act - lower_act))
                return round(interpolated, 1)
            else:
                return float(act_score)

    return None


def clean_percentage(value: Any) -> Optional[float]:
    """Convert percentage-like values to float, handling asterisks and empty values."""
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


def clean_enrollment(value: Any) -> Optional[int]:
    """Convert enrollment strings with commas to ints, handling asterisks."""
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


def normalize_rcdts(rcdts: str) -> str:
    """Remove hyphens from RCDTS for consistent lookups."""
    return rcdts.replace("-", "")


def normalize_column_name(col: str) -> str:
    """Normalize column names to lowercase without extra whitespace."""
    return col.strip().lower()


class HistoricalDataExtractor:
    """Extract and normalize data from historical Report Card Excel files."""

    def __init__(self, base_path: Path = HISTORICAL_DATA_PATH):
        self.base_path = base_path
        self._cache: Dict[int, Dict[str, Dict[str, Any]]] = {}

    def load_year(self, year: int) -> Dict[str, Dict[str, Any]]:
        """
        Load all data for a given year, keyed by normalized RCDTS.
        Returns dict of {rcdts: {metric: value, ...}}
        """
        if year in self._cache:
            return self._cache[year]

        file_path = self._find_file_for_year(year)
        if not file_path:
            self._cache[year] = {}
            return {}

        data = self._extract_from_excel(file_path)
        self._cache[year] = data
        return data

    def _find_file_for_year(self, year: int) -> Optional[Path]:
        """Find the Excel file for a given year."""
        if not self.base_path.exists():
            return None

        year_str = str(year)
        year_short = year_str[-2:]  # e.g., "24" for 2024

        # Collect all candidate files, excluding temp/layout files
        candidates = []
        for file_path in self.base_path.glob("*.xlsx"):
            filename = file_path.stem.lower()

            # Skip temp files and layout files
            if filename.startswith('~$') or 'layout' in filename or filename.startswith('school_'):
                continue

            # Check for year match
            if year_str in filename:
                # Prioritize files starting with the 4-digit year
                if filename.startswith(year_str):
                    return file_path  # Exact match at start - return immediately
                candidates.append(file_path)
            elif year >= 2023 and f'{year_short}-' in filename:
                # For recent years, match "YY-RC" pattern (e.g., "24-RC-Pub-Data-Set.xlsx")
                candidates.append(file_path)

        # Return first candidate if any found
        return candidates[0] if candidates else None

    def _extract_from_excel(self, file_path: Path) -> Dict[str, Dict[str, Any]]:
        """Extract all relevant data from an Excel file."""
        schools_data: Dict[str, Dict[str, Any]] = {}

        try:
            excel = pd.ExcelFile(file_path)

            for sheet_name in excel.sheet_names:
                # Read completely raw to handle column shift
                df_raw = pd.read_excel(excel, sheet_name=sheet_name, header=None)

                if len(df_raw) == 0:
                    continue

                # Extract headers from first row
                headers = list(df_raw.iloc[0])

                # Check if there's a column shift (column 1 all NaN in data rows)
                has_shift = False
                if len(df_raw.columns) > 1 and len(df_raw) > 1:
                    if df_raw.iloc[1:11, 1].isna().all():  # Check first 10 data rows
                        has_shift = True

                if has_shift:
                    # Drop the unnamed data column (index 1)
                    df_raw = df_raw.drop(df_raw.columns[1], axis=1)
                    # Also remove the header for that column
                    headers = [headers[i] for i in range(len(headers)) if i != 1]

                # Now create dataframe with corrected headers
                df = df_raw.iloc[1:].copy()  # Skip header row
                df.columns = headers
                df = df.reset_index(drop=True)

                if 'RCDTS' not in df.columns:
                    continue

                # Normalize column names
                df.columns = [normalize_column_name(col) for col in df.columns]

                for _, row in df.iterrows():
                    rcdts = self._extract_rcdts(row)
                    if not rcdts:
                        continue

                    # Initialize school data dict
                    if rcdts not in schools_data:
                        schools_data[rcdts] = {}

                    school = schools_data[rcdts]

                    # Extract data based on sheet content
                    self._extract_demographics(row, school)
                    self._extract_diversity(row, school)
                    self._extract_sat(row, school)
                    self._extract_act(row, school)

        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return {}

        return schools_data

    def _extract_rcdts(self, row: pd.Series) -> Optional[str]:
        """Extract and normalize RCDTS from a row."""
        rcdts = row.get('rcdts')
        if rcdts is None or (isinstance(rcdts, float) and pd.isna(rcdts)):
            return None
        return normalize_rcdts(str(rcdts).strip())

    def _extract_demographics(self, row: pd.Series, school: Dict[str, Any]) -> None:
        """Extract enrollment and demographic percentages."""
        # Enrollment
        enrollment_cols = ['# student enrollment', 'student enrollment']
        for col in enrollment_cols:
            if col in row.index:
                val = clean_enrollment(row[col])
                if val is not None:
                    school['enrollment'] = val
                    break

        # Low income percentage (try both new and old formats)
        low_income_cols = [
            '% student enrollment - low income',  # 2019+ format
            '% low-income',  # 2010-2017 format
            '% low income',  # Alternative old format
        ]
        for col in low_income_cols:
            if col in row.index:
                val = clean_percentage(row[col])
                if val is not None:
                    school['low_income_percentage'] = val
                    break

        # English Learner percentage (try both new and old formats)
        el_cols = [
            '% student enrollment - el',  # 2019+ format
            '% el',  # 2010-2017 format (if exists)
            '% english learners',  # Alternative old format
        ]
        for col in el_cols:
            if col in row.index:
                val = clean_percentage(row[col])
                if val is not None:
                    school['el_percentage'] = val
                    break

    def _extract_diversity(self, row: pd.Series, school: Dict[str, Any]) -> None:
        """Extract racial/ethnic diversity percentages."""
        # Map: [(column_name_variants, key), ...]
        diversity_cols = [
            (['% student enrollment - white', '% white'], 'white'),
            (['% student enrollment - black or african american', '% black'], 'black'),
            (['% student enrollment - hispanic or latino', '% hispanic'], 'hispanic'),
            (['% student enrollment - asian', '% asian'], 'asian'),
            (['% student enrollment - native hawaiian or other pacific islander', '% native hawaiian or other pacific islander'], 'pacific_islander'),
            (['% student enrollment - american indian or alaska native', '% native american', '% american indian or alaska native'], 'native_american'),
            (['% student enrollment - two or more races', '% two or more races'], 'two_or_more'),
            (['% student enrollment - middle eastern or north african', '% mena'], 'mena'),
        ]

        for col_variants, key in diversity_cols:
            for col in col_variants:
                if col in row.index:
                    val = clean_percentage(row[col])
                    if val is not None:
                        school[key] = val
                        break

    def _extract_sat(self, row: pd.Series, school: Dict[str, Any]) -> None:
        """Extract SAT scores and compute composite."""
        # Try multiple column name variations
        reading_cols = [
            'sat reading average score',
            'sat ebrw average score',
            'sat reading average',  # 2019 format
        ]
        math_cols = [
            'sat math average score',
            'sat math average',  # 2019 format
        ]

        reading = None
        math = None

        for col in reading_cols:
            if col in row.index:
                reading = clean_percentage(row[col])
                if reading is not None:
                    break

        for col in math_cols:
            if col in row.index:
                math = clean_percentage(row[col])
                if math is not None:
                    break

        if reading is not None:
            school['sat_reading'] = reading
        if math is not None:
            school['sat_math'] = math
        if reading is not None and math is not None:
            school['sat_composite'] = reading + math

    def _extract_act(self, row: pd.Series, school: Dict[str, Any]) -> None:
        """Extract direct ACT scores (composite, ELA, Math, Science for older years)."""
        # ACT Composite
        composite_cols = [
            'act composite score - grade 11',  # Newer format
            'act average composite score',
            'average act composite score',
            'act composite',  # 2010-2017 format
        ]
        for col in composite_cols:
            if col in row.index:
                val = clean_percentage(row[col])
                if val is not None:
                    school['act_composite'] = val
                    break

        # ACT ELA/Reading
        ela_cols = [
            'act ela average score - grade 11',
            'act ela',  # 2010-2017 format
            'act reading',  # Alternative old format
        ]
        for col in ela_cols:
            if col in row.index:
                val = clean_percentage(row[col])
                if val is not None:
                    if 'act_scores' not in school:
                        school['act_scores'] = {}
                    school['act_scores']['ela'] = val
                    break

        # ACT Math
        math_cols = [
            'act math average score - grade 11',
            'act math',  # 2010-2017 format
        ]
        for col in math_cols:
            if col in row.index:
                val = clean_percentage(row[col])
                if val is not None:
                    if 'act_scores' not in school:
                        school['act_scores'] = {}
                    school['act_scores']['math'] = val
                    break

        # ACT Science
        science_cols = [
            'act science average score - grade 11',
            'act science',  # 2010-2017 format
        ]
        for col in science_cols:
            if col in row.index:
                val = clean_percentage(row[col])
                if val is not None:
                    if 'act_scores' not in school:
                        school['act_scores'] = {}
                    school['act_scores']['science'] = val
                    break

    def clear_cache(self) -> None:
        """Clear cached data."""
        self._cache.clear()


class TrendCalculator:
    """Calculate trend deltas for schools using historical data."""

    def __init__(self, extractor: HistoricalDataExtractor):
        self.extractor = extractor

    def calculate_trends_for_school(
        self,
        rcdts: str,
        current_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Calculate trend deltas for all metrics.
        Returns dict of {metric_trend_Nyr: delta, ...}
        """
        normalized_rcdts = normalize_rcdts(rcdts)
        trends = {}

        # Calculate ACT trends
        act_trends = self._calculate_act_trends(normalized_rcdts, current_data)
        trends.update(act_trends)

        # Calculate demographic trends
        demo_trends = self._calculate_demographic_trends(normalized_rcdts, current_data)
        trends.update(demo_trends)

        # Calculate diversity trends
        diversity_trends = self._calculate_diversity_trends(normalized_rcdts, current_data)
        trends.update(diversity_trends)

        return trends

    def _calculate_act_trends(
        self,
        rcdts: str,
        current_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate ACT composite trends with SAT-to-ACT conversion."""
        # Current ACT composite (from ELA + Math / 2)
        current_ela = current_data.get('act_ela_avg')
        current_math = current_data.get('act_math_avg')

        if current_ela is None or current_math is None:
            return {}

        current_act = (current_ela + current_math) / 2.0

        # Build historical ACT series
        historical_act = self._build_act_series(rcdts)

        # Calculate trends for each window
        trends = {}
        for window in TREND_WINDOWS:
            target_year = CURRENT_YEAR - window

            # Find closest available year
            historical_value = self._find_closest_historical_act(historical_act, target_year)

            if historical_value is not None:
                delta = current_act - historical_value
                trends[f'act_trend_{window}yr'] = round(delta, 2)

        return trends

    def _build_act_series(self, rcdts: str) -> Dict[int, float]:
        """Build ACT composite series from SAT conversions and direct ACT scores."""
        series = {}

        # Process SAT years (convert to ACT)
        for year in SAT_YEARS:
            year_data = self.extractor.load_year(year)
            school = year_data.get(rcdts, {})

            sat_composite = school.get('sat_composite')
            if sat_composite is not None:
                act_value = sat_to_act_precise(sat_composite)
                if act_value is not None:
                    series[year] = act_value

        # Process direct ACT years
        for year in ACT_YEARS:
            year_data = self.extractor.load_year(year)
            school = year_data.get(rcdts, {})

            act_composite = school.get('act_composite')
            if act_composite is not None:
                series[year] = float(act_composite)

        return series

    def _find_closest_historical_act(
        self,
        series: Dict[int, float],
        target_year: int
    ) -> Optional[float]:
        """
        Find the closest available historical ACT value.
        For 5-year (2020), fallback to 2019 if 2020 is missing.
        """
        if target_year in series:
            return series[target_year]

        # Fallback logic for 5-year trend
        if target_year == 2020 and 2019 in series:
            return series[2019]

        return None

    def _calculate_demographic_trends(
        self,
        rcdts: str,
        current_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate enrollment, low_income, and EL trends."""
        trends = {}

        metrics = {
            'enrollment': 'student_enrollment',
            'low_income': 'low_income_percentage',
            'el': 'el_percentage',
        }

        for metric, field in metrics.items():
            current_value = current_data.get(field)
            if current_value is None:
                continue

            historical_series = self._build_demographic_series(rcdts, metric)

            for window in TREND_WINDOWS:
                target_year = CURRENT_YEAR - window

                if target_year in historical_series:
                    historical_value = historical_series[target_year]
                    delta = float(current_value) - float(historical_value)
                    trends[f'{metric}_trend_{window}yr'] = round(delta, 2)

        return trends

    def _build_demographic_series(self, rcdts: str, metric: str) -> Dict[int, float]:
        """Build historical series for a demographic metric."""
        series = {}

        metric_map = {
            'enrollment': 'enrollment',
            'low_income': 'low_income_percentage',
            'el': 'el_percentage',
        }

        field = metric_map.get(metric)
        if not field:
            return series

        for year in DEMOGRAPHIC_YEARS:
            year_data = self.extractor.load_year(year)
            school = year_data.get(rcdts, {})

            value = school.get(field)
            if value is not None:
                series[year] = float(value)

        return series

    def _calculate_diversity_trends(
        self,
        rcdts: str,
        current_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate racial/ethnic diversity trends."""
        trends = {}

        diversity_metrics = [
            'white', 'black', 'hispanic', 'asian',
            'pacific_islander', 'native_american', 'two_or_more', 'mena'
        ]

        for metric in diversity_metrics:
            field = f'pct_{metric}'
            current_value = current_data.get(field)

            if current_value is None:
                continue

            historical_series = self._build_diversity_series(rcdts, metric)

            for window in TREND_WINDOWS:
                target_year = CURRENT_YEAR - window

                if target_year in historical_series:
                    historical_value = historical_series[target_year]
                    delta = float(current_value) - float(historical_value)
                    trends[f'{metric}_trend_{window}yr'] = round(delta, 2)

        return trends

    def _build_diversity_series(self, rcdts: str, metric: str) -> Dict[int, float]:
        """Build historical series for a diversity metric."""
        series = {}

        for year in DEMOGRAPHIC_YEARS:
            year_data = self.extractor.load_year(year)
            school = year_data.get(rcdts, {})

            value = school.get(metric)
            if value is not None:
                series[year] = float(value)

        return series

    def extract_historical_yearly_data(
        self,
        rcdts: str,
        current_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract historical yearly values for all metrics (2019-2025).
        Returns dict with keys like enrollment_hist_2024, act_hist_2023, etc.
        Year 2025 is the current year from current_data.
        """
        normalized_rcdts = normalize_rcdts(rcdts)
        historical = {}

        # Years to extract (excluding current year 2025) - 15 years total (2010-2024)
        historical_years = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010]

        # Add current year (2025) data
        self._add_current_year_historical(historical, current_data)

        # Extract enrollment historical data
        enrollment_series = self._build_demographic_series(normalized_rcdts, 'enrollment')
        for year in historical_years:
            if year in enrollment_series:
                historical[f'enrollment_hist_{year}'] = int(enrollment_series[year])

        # Extract ACT historical data (composite, ELA, Math, Science)
        self._extract_act_historical_data(normalized_rcdts, historical, historical_years)

        # Extract demographics historical data (EL, Low Income)
        el_series = self._build_demographic_series(normalized_rcdts, 'el')
        low_income_series = self._build_demographic_series(normalized_rcdts, 'low_income')

        for year in historical_years:
            if year in el_series:
                historical[f'el_hist_{year}'] = round(el_series[year], 1)
            if year in low_income_series:
                historical[f'low_income_hist_{year}'] = round(low_income_series[year], 1)

        # Extract diversity historical data
        diversity_metrics = [
            'white', 'black', 'hispanic', 'asian',
            'pacific_islander', 'native_american', 'two_or_more', 'mena'
        ]

        for metric in diversity_metrics:
            diversity_series = self._build_diversity_series(normalized_rcdts, metric)
            for year in historical_years:
                if year in diversity_series:
                    historical[f'{metric}_hist_{year}'] = round(diversity_series[year], 1)

        return historical

    def _add_current_year_historical(self, historical: Dict, current_data: Dict[str, Any]) -> None:
        """Add current year (2025) data to historical dict."""
        # Enrollment
        if current_data.get('student_enrollment') is not None:
            historical['enrollment_hist_2025'] = current_data['student_enrollment']

        # ACT scores
        if current_data.get('act_ela_avg') is not None:
            historical['act_ela_hist_2025'] = round(current_data['act_ela_avg'], 1)
        if current_data.get('act_math_avg') is not None:
            historical['act_math_hist_2025'] = round(current_data['act_math_avg'], 1)
        if current_data.get('act_science_avg') is not None:
            historical['act_science_hist_2025'] = round(current_data['act_science_avg'], 1)

        # ACT composite
        if current_data.get('act_ela_avg') is not None and current_data.get('act_math_avg') is not None:
            act_composite = (current_data['act_ela_avg'] + current_data['act_math_avg']) / 2.0
            historical['act_hist_2025'] = round(act_composite, 1)

        # Demographics
        if current_data.get('el_percentage') is not None:
            historical['el_hist_2025'] = round(current_data['el_percentage'], 1)
        if current_data.get('low_income_percentage') is not None:
            historical['low_income_hist_2025'] = round(current_data['low_income_percentage'], 1)

        # Diversity
        diversity_metrics = [
            'white', 'black', 'hispanic', 'asian',
            'pacific_islander', 'native_american', 'two_or_more', 'mena'
        ]
        for metric in diversity_metrics:
            field = f'pct_{metric}'
            if current_data.get(field) is not None:
                historical[f'{metric}_hist_2025'] = round(current_data[field], 1)

    def _extract_act_historical_data(
        self,
        rcdts: str,
        historical: Dict,
        years: List[int]
    ) -> None:
        """Extract ACT composite, ELA, Math, Science for historical years."""
        for year in years:
            year_data = self.extractor.load_year(year)
            school = year_data.get(rcdts, {})

            # First, try to extract direct ACT scores (for years with native ACT data)
            act_composite = school.get('act_composite')
            if act_composite is not None:
                historical[f'act_hist_{year}'] = round(float(act_composite), 1)

            # Extract ACT ELA/Math/Science from act_scores dict (if present)
            act_scores = school.get('act_scores', {})
            if act_scores:
                if 'ela' in act_scores:
                    historical[f'act_ela_hist_{year}'] = round(float(act_scores['ela']), 1)
                if 'math' in act_scores:
                    historical[f'act_math_hist_{year}'] = round(float(act_scores['math']), 1)
                if 'science' in act_scores:
                    historical[f'act_science_hist_{year}'] = round(float(act_scores['science']), 1)

            # If no direct ACT data, try SAT and convert to ACT
            if act_composite is None:
                sat_composite = school.get('sat_composite')
                if sat_composite is not None:
                    act_value = sat_to_act_precise(sat_composite)
                    if act_value is not None:
                        historical[f'act_hist_{year}'] = round(act_value, 1)

            # Extract individual SAT scores and convert to ACT (only if no direct ACT scores)
            if not act_scores:
                sat_reading = school.get('sat_reading')
                sat_math = school.get('sat_math')

                if sat_reading is not None:
                    # SAT reading maps to ACT ELA
                    act_ela = sat_to_act_precise(sat_reading * 2)  # Convert section score to composite scale
                    if act_ela is not None:
                        historical[f'act_ela_hist_{year}'] = round(act_ela, 1)

                if sat_math is not None:
                    # SAT math maps to ACT Math
                    act_math = sat_to_act_precise(sat_math * 2)  # Convert section score to composite scale
                    if act_math is not None:
                        historical[f'act_math_hist_{year}'] = round(act_math, 1)

                # Note: SAT doesn't have Science, so act_science_hist will be None for SAT years


def update_school_trends(db: Session, excel_path: str) -> int:
    """
    Update trend fields for all schools in the database.
    Reads current school data from DB, calculates trends from historical files,
    and updates the trend columns.
    """
    extractor = HistoricalDataExtractor()
    calculator = TrendCalculator(extractor)

    schools = db.query(School).all()
    updated_count = 0
    batch_size = 100
    updates = []

    for i, school in enumerate(schools):
        # Build current data dict from school model
        current_data = {
            'act_ela_avg': school.act_ela_avg,
            'act_math_avg': school.act_math_avg,
            'student_enrollment': school.student_enrollment,
            'low_income_percentage': school.low_income_percentage,
            'el_percentage': school.el_percentage,
            'pct_white': school.pct_white,
            'pct_black': school.pct_black,
            'pct_hispanic': school.pct_hispanic,
            'pct_asian': school.pct_asian,
            'pct_pacific_islander': school.pct_pacific_islander,
            'pct_native_american': school.pct_native_american,
            'pct_two_or_more': school.pct_two_or_more,
            'pct_mena': school.pct_mena,
        }

        # Calculate trends
        trends = calculator.calculate_trends_for_school(school.rcdts, current_data)

        if trends:
            update_record = {'rcdts': school.rcdts}
            update_record.update(trends)
            updates.append(update_record)

        updated_count += 1

        # Execute batch updates using raw SQL
        if (i + 1) % batch_size == 0 and updates:
            _execute_batch_updates(db, updates)
            updates = []
            print(f"Updated {updated_count} schools...")

    # Final batch
    if updates:
        _execute_batch_updates(db, updates)

    extractor.clear_cache()
    return updated_count


def _execute_batch_updates(db: Session, updates: List[Dict[str, Any]]) -> None:
    """Execute trend updates using raw SQL for reliability."""
    for record in updates:
        rcdts = record.pop('rcdts')

        if not record:
            continue

        # Build SET clause
        set_clauses = [f"{field} = :{field}" for field in record.keys()]
        sql = f"UPDATE schools SET {', '.join(set_clauses)} WHERE rcdts = :rcdts"

        params = record.copy()
        params['rcdts'] = rcdts

        db.execute(text(sql), params)

    db.commit()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m app.utils.import_historical_trends <path_to_2025_excel>")
        sys.exit(1)

    excel_path = sys.argv[1]

    # Ensure database is initialized
    init_db()

    # Update trends
    db = SessionLocal()
    try:
        count = update_school_trends(db, excel_path)
        print(f"Successfully updated trends for {count} schools")
    finally:
        db.close()
