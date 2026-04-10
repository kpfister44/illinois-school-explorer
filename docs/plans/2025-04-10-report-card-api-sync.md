# ReportCardAPI Migration — Fix Remaining Test Failures

**Goal:** Fix the 2 failing tests in the new `sync_from_api` pipeline so the feature branch is clean and ready to merge.

**Architecture:** The previous session created `api_client.py` and `sync_from_api.py` to replace the Excel import pipeline. All 13 `test_api_client.py` tests pass. 2 tests in `test_sync_from_api.py` fail due to distinct bugs found below.

**CURRENT_YEAR = 2025** is confirmed correct — the live API has 2025 data.

**Old pipeline (import_data.py etc.) stays** — do not touch it.

---

## Context

### Pre-existing failures (ignore)
`test_convert_txt_to_xlsx.py` (8 tests) and `test_historical_loader.py` / `test_import_historical_yearly_data.py` (4 tests) all fail on `main` too — they're missing local data files. Not our concern.

### New failures to fix

#### Bug 1 — wrong fallback year in `_calculate_trend`

**File:** `backend/app/utils/sync_from_api.py` (line ~485)

```python
def _calculate_trend(self, current, series, current_year, window):
    target = current_year - window  # e.g. 2025-5=2020
    if target in series:
        return current - series[target]
    # BUG: current_year - window + 1 = 2021, NOT 2019
    if window == 5 and (current_year - window + 1) in series:
        return current - series[current_year - window + 1]
    return None
```

The fallback for a missing 2020 value should check 2019, which is `target - 1`, not `current_year - window + 1 = 2021`.

**Fix:**
```python
if window == 5 and (target - 1) in series:
    return current - series[target - 1]
```

**Failing test:** `test_calculate_trend_fallback_to_2019_for_5yr`

---

#### Bug 2 — wrong RCDTS in the mock's `hist_row`

**File:** `backend/tests/test_sync_from_api.py` (inside `_make_client_for_sync`)

The current `hist_row` has:
```python
"rcdts": "05016214017001",  # 14 chars — WRONG
```

But `_normalize_rcdts("05-016-2140-17-0001")` strips hyphens to `"050162140170001"` (15 chars). The lookup key never matches, so no historical columns are written.

```
"05-016-2140-17-0001" → strip hyphens → "050162140170001"  (15 chars)
```

**Fix:** change the mock value to the correctly-stripped string:
```python
"rcdts": "050162140170001",  # no hyphens, correctly matches normalized key
```

**Failing test:** `test_sync_populates_historical_columns`

---

## Implementation Steps

### Step 1 — Fix Bug 1 in `sync_from_api.py`

Edit `backend/app/utils/sync_from_api.py`, `_calculate_trend` method:

Change:
```python
if window == 5 and (current_year - window + 1) in series:
    return current - series[current_year - window + 1]
```
To:
```python
if window == 5 and (target - 1) in series:
    return current - series[target - 1]
```

Run:
```bash
cd backend
uv run pytest tests/test_sync_from_api.py::test_calculate_trend_fallback_to_2019_for_5yr -v
```
Expected: PASS

### Step 2 — Fix Bug 2 in `test_sync_from_api.py`

Edit `backend/tests/test_sync_from_api.py`, inside `_make_client_for_sync`, `hist_row` dict:

Change:
```python
"rcdts": "05016214017001",  # no hyphens in older data
```
To:
```python
"rcdts": "050162140170001",  # no hyphens in older data
```

Run:
```bash
uv run pytest tests/test_sync_from_api.py::test_sync_populates_historical_columns -v
```
Expected: PASS

### Step 3 — Run all new tests to confirm green

```bash
uv run pytest tests/test_api_client.py tests/test_sync_from_api.py -v
```
Expected: 52/52 PASS

### Step 4 — Commit the new files

The 4 new files are still untracked. Stage and commit them together with the fixes:

```bash
git add backend/app/utils/api_client.py \
        backend/app/utils/sync_from_api.py \
        backend/tests/test_api_client.py \
        backend/tests/test_sync_from_api.py \
        backend/pyproject.toml \
        backend/uv.lock
git commit -m "feat(sync): add ReportCardAPI client and sync pipeline"
```

Then commit the other staged changes (README, deleted files) separately if not already committed:
```bash
git status  # check what else is modified
```

### Step 5 — Full test suite sanity check

```bash
uv run pytest -m "not slow" -q
```

Expected: same pass/fail counts as `main` for pre-existing tests, plus all 52 new tests passing.

---

## Verification

The sync script is a CLI tool — no deployment changes needed yet.

To test the full pipeline locally against the live API (when you have an API key):
```bash
cd backend
export REPORT_CARD_API_KEY=<key>
uv run python -m app.utils.sync_from_api
```

Expected output:
```
Fetching current year school data...
Fetching historical data for trends and yearly columns...
Building N school records...
Clearing existing data and inserting...
Synced N schools.
Done. Synced N schools.
```
