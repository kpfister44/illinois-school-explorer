# ABOUTME: Detailed workflow for computing historical trend metrics
# ABOUTME: Documents file placement, importer usage, and verification process

# Trend Data Workflow

This document explains how to generate 1/3/5-year trend metrics using local Illinois Report Card archives. The importer now builds time series directly from `data/historical-report-cards/` so no external APIs are required.

## 1. Prepare Historical Files

1. Download the public Report Card workbooks/text files listed below and place them in `<repo>/data/historical-report-cards/`:
   - 2019-2024 Excel files (`*-Report-Card-Public-Data-Set.xlsx`, `23-RC-Pub-Data-Set.xlsx`, `24-RC-Pub-Data-Set.xlsx`)
   - `rc15/rc16/rc17` ACT assessment TXT exports
2. Keep the filenames intact. The loader detects years by scanning stem names, so avoid renaming.
3. For tests, use the lightweight fixtures plan under `backend/tests/data/historical/` instead of the 40MB originals.

## 2. Run the Importer

```bash
cd backend
uv sync --all-extras
uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx
```

- The importer instantiates a `HistoricalDataLoader` once, builds trend series for each school, and writes them into the new `*_trend_{1,3,5}yr` columns.
- **Important:** Drop `data/schools.db` (or run a schema migration) before importing so SQLite picks up the added columns.
- The loader caches per-year data; reruns within the same process are fast.

## 3. Verify Trend Columns

After the import, spot-check a few schools:

1. Open `sqlite3 data/schools.db` and run queries such as:
   ```sql
   SELECT rcdts, enrollment_trend_1yr, enrollment_trend_5yr, act_trend_3yr
   FROM schools WHERE rcdts = '05-016-2140-17-0002';
   ```
2. Confirm deltas match expectations (current enrollment minus prior year, etc.).
3. Hit the API (`/api/schools/{rcdts}`) and ensure the `metrics.trends` object contains the windows you observed in the database.

## 4. Troubleshooting

- **Loader finds no files:** Confirm `HistoricalDataLoader().base_path` exists and contains the downloads. The default path resolves to `<repo>/data/historical-report-cards`.
- **Trends missing for a school:** Check that at least two years of data exist for that metric. The importer only emits deltas when both current and historical values are present.
- **Stale schema:** If API responses lack `metrics.trends`, drop `data/schools.db`, rerun the importer, and restart the FastAPI server so the ORM reflects the new columns.

## 5. Relevant Tests

- `tests/test_historical_loader.py` validates file parsing and the default path.
- `tests/test_import_data.py::test_prepare_school_records_adds_trend_fields_with_loader` proves the importer writes trend fields.
- `tests/test_schools_api.py` asserts the API surfaces trend windows in both detail and compare responses.
