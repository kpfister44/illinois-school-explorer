# ABOUTME: Utilities for loading historical Illinois Report Card files
# ABOUTME: Converts Excel/TXT archives into normalized metric dictionaries

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping

import pandas as pd

EXCEL_GENERAL_COLUMNS: Dict[str, Iterable[str]] = {
    "enrollment": ["# student enrollment", "student enrollment"],
    "low_income_percentage": ["% student enrollment - low income"],
    "el_percentage": ["% student enrollment - el"],
}

DIVERSITY_COLUMNS: Dict[str, Iterable[str]] = {
    "white": ["% student enrollment - white"],
    "black": ["% student enrollment - black or african american"],
    "hispanic": ["% student enrollment - hispanic or latino"],
    "asian": ["% student enrollment - asian"],
    "pacific_islander": ["% student enrollment - native hawaiian or other pacific islander"],
    "native_american": ["% student enrollment - american indian or alaska native"],
    "two_or_more": ["% student enrollment - two or more races"],
    "mena": ["% student enrollment - middle eastern or north african"],
}

SAT_COLUMNS = [
    "average sat composite score",
    "sat composite score - grade 11",
    "sat total score",
]

ACT_COLUMNS: Dict[str, Iterable[str]] = {
    "ela": ["act ela average score - grade 11", "act english average score"],
    "math": ["act math average score - grade 11"],
    "science": ["act science average score - grade 11"],
    "composite": [
        "act composite score - grade 11",
        "act average composite score",
        "average act composite score",
    ],
}

TEXT_DELIMITERS = ("|", "\t", ",")


class HistoricalDataLoader:
    """Load normalized metrics from historical Excel/TXT sources."""

    def __init__(self, base_path: Path | str | None = None) -> None:
        self.base_path = Path(base_path) if base_path else Path("data/historical-report-cards")
        self._cache: Dict[int, Dict[str, Dict[str, Any]]] = {}

    def load_year(self, year: int) -> Dict[str, Dict[str, Any]]:
        """Return metrics for a given year keyed by RCDTS."""
        if year in self._cache:
            return self._cache[year]

        files = self._files_for_year(year)
        if not files:
            self._cache[year] = {}
            return {}

        merged: Dict[str, Dict[str, Any]] = {}
        for file_path in files:
            suffix = file_path.suffix.lower()
            if suffix in {".xlsx", ".xls", ".xlsm"}:
                parsed = self._parse_excel_file(file_path)
            else:
                parsed = self._parse_txt_file(file_path)
            self._merge_records(merged, parsed)

        finalized = self._finalize_records(merged)
        self._cache[year] = finalized
        return finalized

    def _files_for_year(self, year: int) -> list[Path]:
        if not self.base_path.exists():
            return []

        matches: list[Path] = []
        year_token = str(year)
        short_token = year_token[-2:]
        for path in self.base_path.iterdir():
            if not path.is_file():
                continue
            suffix = path.suffix.lower()
            if suffix not in {".xlsx", ".xls", ".xlsm", ".txt", ".tsv"}:
                continue
            stem = path.stem.lower()
            if year_token in stem or short_token in stem:
                matches.append(path)
        return sorted(matches)

    def _parse_excel_file(self, path: Path) -> Dict[str, Dict[str, Any]]:
        per_school: Dict[str, Dict[str, Any]] = {}
        excel = pd.ExcelFile(path)
        for sheet in excel.sheet_names:
            frame = pd.read_excel(excel, sheet_name=sheet)
            if "RCDTS" not in frame.columns:
                continue

            for _, row in frame.iterrows():
                normalized = self._normalize_row(row)
                rcdts_raw = normalized.get("rcdts")
                if rcdts_raw is None or (isinstance(rcdts_raw, float) and pd.isna(rcdts_raw)):
                    continue
                rcdts = str(rcdts_raw).strip()
                if not rcdts:
                    continue

                level_value = normalized.get("level")
                if level_value and str(level_value).strip().lower() != "school":
                    continue

                record = per_school.setdefault(rcdts, {})
                self._apply_general_metrics(normalized, record)
                self._apply_diversity(normalized, record)
                self._apply_sat(normalized, record)
                self._apply_act(normalized, record)

        return per_school

    def _parse_txt_file(self, path: Path) -> Dict[str, Dict[str, Any]]:
        with path.open("r", encoding="utf-8-sig") as handle:
            sample = handle.readline()
            delimiter = self._detect_delimiter(sample)
            handle.seek(0)
            reader = csv.DictReader(handle, delimiter=delimiter)
            per_school: Dict[str, Dict[str, Any]] = {}
            for row in reader:
                normalized = self._normalize_row(row)
                rcdts = normalized.get("rcdts")
                if not rcdts:
                    continue
                record = per_school.setdefault(str(rcdts).strip(), {})
                self._apply_act(normalized, record)

        return per_school

    def _apply_general_metrics(self, row: Mapping[str, Any], record: Dict[str, Any]) -> None:
        enrollment_value = self._pick_value(row, EXCEL_GENERAL_COLUMNS["enrollment"])
        if enrollment_value is not None:
            cleaned = _clean_enrollment(enrollment_value)
            if cleaned is not None:
                record["enrollment"] = cleaned

        low_income_value = self._pick_value(row, EXCEL_GENERAL_COLUMNS["low_income_percentage"])
        if low_income_value is not None:
            cleaned = _clean_percentage(low_income_value)
            if cleaned is not None:
                record["low_income_percentage"] = cleaned

        el_value = self._pick_value(row, EXCEL_GENERAL_COLUMNS["el_percentage"])
        if el_value is not None:
            cleaned = _clean_percentage(el_value)
            if cleaned is not None:
                record["el_percentage"] = cleaned

    def _apply_diversity(self, row: Mapping[str, Any], record: Dict[str, Any]) -> None:
        for metric, aliases in DIVERSITY_COLUMNS.items():
            value = self._pick_value(row, aliases)
            if value is None:
                continue
            cleaned = _clean_percentage(value)
            if cleaned is None:
                continue
            diversity = record.setdefault("diversity", {})
            diversity[metric] = cleaned

    def _apply_sat(self, row: Mapping[str, Any], record: Dict[str, Any]) -> None:
        value = self._pick_value(row, SAT_COLUMNS)
        if value is None:
            return
        cleaned = self._to_float(value)
        if cleaned is not None:
            record["sat_composite"] = cleaned

    def _apply_act(self, row: Mapping[str, Any], record: Dict[str, Any]) -> None:
        scores: Dict[str, float] = {}
        for metric, aliases in ACT_COLUMNS.items():
            value = self._pick_value(row, aliases)
            if value is None:
                continue
            cleaned = self._to_float(value)
            if cleaned is None:
                continue
            scores[metric] = cleaned

        if scores:
            bucket = record.setdefault("act_scores", {})
            bucket.update(scores)

    def _pick_value(self, row: Mapping[str, Any], aliases: Iterable[str]) -> Any:
        for alias in aliases:
            key = alias.lower()
            if key in row:
                value = row[key]
            else:
                continue
            if isinstance(value, float) and pd.isna(value):
                continue
            return value
        return None

    def _merge_records(
        self, existing: Dict[str, Dict[str, Any]], new_values: Dict[str, Dict[str, Any]]
    ) -> None:
        for rcdts, payload in new_values.items():
            record = existing.setdefault(rcdts, {})
            for key, value in payload.items():
                if key == "diversity":
                    bucket = record.setdefault("diversity", {})
                    bucket.update(value)
                elif key == "act_scores":
                    bucket = record.setdefault("act_scores", {})
                    bucket.update(value)
                else:
                    record[key] = value

    def _finalize_records(self, records: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        for record in records.values():
            if "diversity" in record and not record["diversity"]:
                record.pop("diversity")
            if "act_scores" in record and not record["act_scores"]:
                record.pop("act_scores")
        return records

    def close(self) -> None:
        """Release any cached data."""
        self._cache.clear()

    def _detect_delimiter(self, sample: str) -> str:
        for delimiter in TEXT_DELIMITERS:
            if delimiter in sample:
                return delimiter
        return ","

    def _normalize_row(self, row: Mapping[str, Any]) -> Dict[str, Any]:
        normalized: Dict[str, Any] = {}
        for key, value in row.items():
            if not isinstance(key, str):
                continue
            normalized[key.strip().lower()] = value
        return normalized

    def _to_float(self, value: Any) -> float | None:
        if value is None:
            return None
        if isinstance(value, float) and pd.isna(value):
            return None
        try:
            return float(str(value).strip())
        except (ValueError, TypeError):
            return None


_clean_percentage_fn = None
_clean_enrollment_fn = None


def _clean_percentage(value: Any) -> float | None:
    global _clean_percentage_fn
    if _clean_percentage_fn is None:
        from app.utils.import_data import clean_percentage as fn

        _clean_percentage_fn = fn
    return _clean_percentage_fn(value)


def _clean_enrollment(value: Any) -> int | None:
    global _clean_enrollment_fn
    if _clean_enrollment_fn is None:
        from app.utils.import_data import clean_enrollment as fn

        _clean_enrollment_fn = fn
    return _clean_enrollment_fn(value)
