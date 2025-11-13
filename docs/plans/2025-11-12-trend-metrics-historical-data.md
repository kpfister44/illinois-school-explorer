# Trend Metrics from Historical Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import multi-year enrollment, demographic, and SAT/ACT composites directly from local historical Report Card files (2015-2024) to compute 1/3/5-year trends for each school without calling external APIs.

**Architecture:** Extend the importer to read yearly workbooks/text files from `data/historical-report-cards/`, normalize the fields we care about, and aggregate them into per-school time series. Compute deltas relative to the most recent year and persist them in the existing `schools` table, surfaced via the school detail API. Use pandas for Excel parsing and a small custom parser for the legacy TXT files.

**Tech Stack:** Python 3.11, pandas, FastAPI backend, SQLAlchemy ORM, pytest, uv CLI.

---

## Task 1: Catalog Historical Sources & Provide Fixtures

**Files:**
- Modify: `backend/README.md`
- Create: `backend/tests/data/historical/README.md`
- Test: n/a (documentation task)

**Step 1:** Document the available files (2019/2020/2022/2023/2024 Excel, plus rc15/16/17 TXT) in `backend/README.md`, including the metrics each file contains (enrollment, low-income, EL, diversity, SAT/ACT) and their paths under `data/historical-report-cards/`.

**Step 2:** Add a `backend/tests/data/historical/README.md` describing the lightweight fixtures we’ll create for tests (e.g., small CSV/TXT snippets) so tests don’t rely on 40MB real files. No code yet—just note the plan for fixtures.

**Step 3:** Commit documentation changes.

```bash
cd backend
git add README.md tests/data/historical/README.md
git commit -m "docs: catalog historical report card sources"
```

---

## Task 2: Implement Historical File Parsers

**Files:**
- Create: `backend/app/utils/historical_loader.py`
- Modify: `backend/app/utils/__init__.py`
- Create: `backend/tests/test_historical_loader.py`

**Step 1: Write failing tests**

- Tests should cover:
  - Loading a small Excel fixture with the same column headers as the public dataset, returning dicts keyed by RCDTS with enrollment, low_income, el, diversity, and SAT composite (if available) for a given year.
  - Parsing the legacy TXT (pipe or tab delimited) into the same structure for ACT scores.
  - Deduplicating when multiple files describe the same year.

**Step 2:** Run the new tests (`uv run pytest tests/test_historical_loader.py`) to confirm they fail.

**Step 3: Implement loader**

- `HistoricalDataLoader` with `load_year(year: int) -> dict[str, dict[str, float]]` that reads from `data/historical-report-cards/`.
- Support `.xlsx` via pandas and `.txt` via csv module.
- Normalize column names with a mapping (e.g., `% Student Enrollment - EL` -> `el`).
- Cache results per year to avoid repeated filesystem reads.

**Step 4:** Re-run tests until green and commit.

```bash
cd backend
uv run pytest tests/test_historical_loader.py
git add app/utils/historical_loader.py app/utils/__init__.py tests/test_historical_loader.py
git commit -m "feat: add historical data loader"
```

---

## Task 3: Build Trend Aggregator

**Files:**
- Modify: `backend/app/utils/import_data.py`
- Modify: `backend/tests/test_import_data.py`

**Step 1: Write failing tests**

- Add tests for a new helper `build_trend_series(rcdts, loader)` that combines:
  - Enrollment/low-income/EL/diversity from historical years (latest five years available)
  - ACT composites from 2012-2016 (TXT) and SAT composites from 2017-2024 (Excel)
- Tests should supply fake loader outputs to verify the series dictionary contains numeric values for each metric.

**Step 2:** Run targeted tests to confirm failure.

```bash
cd backend
uv run pytest tests/test_import_data.py -k trend_series
```

**Step 3:** Implement the aggregator helpers inside `import_data.py` (or a new module) using the loader from Task 2. Provide functions:

- `_build_demographic_series(rcdts, loader)` returning `{metric: {year: value}}`
- `_build_act_series(rcdts, loader)` merging ACT and SAT data with SAT→ACT conversion (reuse `sat_to_act`).

**Step 4:** Re-run the focused tests and ensure they pass.

**Step 5:** Commit.

```bash
git add app/utils/import_data.py tests/test_import_data.py
git commit -m "feat: aggregate historical trend series"
```

---

## Task 4: Integrate Trends into Import Pipeline

**Files:**
- Modify: `backend/app/utils/import_data.py`
- Modify: `backend/tests/test_import_data.py`

**Step 1: Write failing tests**

- Update `prepare_school_records` tests to pass a mock loader and assert that trend fields (`enrollment_trend_1yr`, `act_trend_5yr`, diversity trends) are populated when historical data exists.
- Add tests for the `import_to_database` path ensuring the loader is instantiated once and closed, and that `TrendFetcher` no longer exists.

**Step 2:** Run the relevant tests (full file) expecting failures.

**Step 3:** Implementation updates:

- Remove the previous `TrendFetcher` references.
- Instantiate `HistoricalDataLoader` once per import and pass into `prepare_school_records`.
- Ensure we only compute trends when we have both current and prior-year data; use the helper from Task 3.

**Step 4:** Re-run all import tests.

```bash
cd backend
uv run pytest tests/test_import_data.py
```

**Step 5:** Commit.

```bash
git add app/utils/import_data.py tests/test_import_data.py
git commit -m "feat: compute trends during import from historical files"
```

---

## Task 5: Expose Trends via API Models

**Files:**
- Modify: `backend/app/models.py`
- Modify: `backend/app/api/schools.py`
- Modify: `backend/tests/test_models.py`
- Modify: `backend/tests/test_schools_api.py`

**Step 1: Write failing tests**

- Ensure `SchoolMetrics.trends` object is serialized with the new values by stubbing ORM objects.
- Update API tests to assert trend data is returned when database rows have them populated.

**Step 2:** Run tests to confirm failure.

```bash
cd backend
uv run pytest tests/test_models.py tests/test_schools_api.py
```

**Step 3:** Implementation

- Map the `*_trend_*` columns from `School` to `TrendMetrics` in `build_school_detail`.
- Keep naming consistent (one_year/three_year/five_year) and ensure diversity trends map correctly.

**Step 4:** Re-run the updated tests.

**Step 5:** Commit.

```bash
git add app/models.py app/api/schools.py tests/test_models.py tests/test_schools_api.py
git commit -m "feat: expose computed trend metrics in API"
```

---

## Task 6: Documentation & Verification

**Files:**
- Modify: `backend/README.md`
- Modify: `docs/plans/IMPLEMENTATION-ROADMAP.md`
- Create: `docs/trend-data-workflow.md`

**Step 1:** Update `backend/README.md` with instructions for placing historical files, running the importer, and verifying trend columns.

**Step 2:** Add a new `docs/trend-data-workflow.md` summarizing the process, assumptions (required years), and manual verification steps.

**Step 3:** Update the roadmap to note trend metrics are sourced locally.

**Step 4:** Commit.

```bash
git add backend/README.md docs/trend-data-workflow.md docs/plans/IMPLEMENTATION-ROADMAP.md
git commit -m "docs: describe historical trend workflow"
```

---

## Execution Options

Plan saved to `docs/plans/2025-11-12-trend-metrics-historical-data.md`.

Two ways to execute:

1. **Subagent-Driven (this session):** I can dispatch a fresh subagent per task using superpowers:subagent-driven-development.
2. **Parallel Session:** Open a new Codex session and run `/superpowers:executing-plans docs/plans/2025-11-12-trend-metrics-historical-data.md`.

Kyle, choose whichever approach fits your workflow.
