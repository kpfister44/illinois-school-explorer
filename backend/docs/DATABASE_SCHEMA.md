# ABOUTME: Complete database schema documentation for the Illinois School Explorer
# ABOUTME: Reference for understanding table structure, fields, types, and relationships

# Database Schema Documentation

Complete schema reference for the Illinois School Explorer SQLite database.

---

## Overview

**Database:** SQLite 3
**File Location:** `backend/data/schools.db`
**ORM:** SQLAlchemy 2.0
**Model Definition:** `backend/app/database.py`

**Key Features:**
- Single `schools` table with 270+ columns
- FTS5 virtual table for full-text search
- Automatic triggers for search index synchronization
- Historical data spanning **2010-2026** (17 years)
- Trend calculations for 1, 3, 5, 10, and 15-year windows

---

## Schools Table

### Primary Information Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal database ID |
| `rcdts` | VARCHAR(20) | UNIQUE, NOT NULL, INDEXED | Illinois state school identifier (format: "05-016-2140-17-0002") |
| `school_name` | TEXT | NOT NULL | Official school name |
| `district` | TEXT | NULL | School district name |
| `city` | TEXT | NOT NULL, INDEXED | City location |
| `county` | TEXT | NULL | County name |
| `school_type` | TEXT | NULL | Original school type from source data (e.g., "High School", "Elementary School") |
| `level` | VARCHAR(20) | NOT NULL, INDEXED | Normalized school level: "high", "middle", "elementary", "other" |
| `grades_served` | TEXT | NULL | Grade range (e.g., "9-12", "K-8") |
| `created_at` | DATETIME | NOT NULL | Timestamp of record creation (UTC) |

**Notes:**
- `rcdts` is the primary identifier for schools across all API endpoints
- `level` is computed during import from `school_type` for filtering/categorization
- City and level are indexed for query performance

---

### Current Metrics (2026 Report Card, 2025-26 School Year)

#### Enrollment & Demographics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `student_enrollment` | INTEGER | NULL | Total student count |
| `el_percentage` | FLOAT | NULL | English Learner percentage (0-100) |
| `low_income_percentage` | FLOAT | NULL | Low-income student percentage (0-100) |

#### ACT Scores (High Schools)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `act_ela_avg` | FLOAT | NULL | ACT English/Language Arts average |
| `act_math_avg` | FLOAT | NULL | ACT Math average |
| `act_science_avg` | FLOAT | NULL | ACT Science average |

**Note:** `act.overall_avg` is computed in the API layer as `(act_ela_avg + act_math_avg) / 2`

#### IAR Proficiency (Elementary/Middle Schools)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `iar_ela_proficiency_pct` | FLOAT | NULL | IAR English/Language Arts proficiency percentage |
| `iar_math_proficiency_pct` | FLOAT | NULL | IAR Math proficiency percentage |
| `iar_overall_proficiency_pct` | FLOAT | NULL | IAR overall proficiency percentage |

#### Diversity Percentages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `pct_white` | FLOAT | NULL | White student percentage (0-100) |
| `pct_black` | FLOAT | NULL | Black/African American student percentage |
| `pct_hispanic` | FLOAT | NULL | Hispanic/Latino student percentage |
| `pct_asian` | FLOAT | NULL | Asian student percentage |
| `pct_pacific_islander` | FLOAT | NULL | Native Hawaiian/Pacific Islander percentage |
| `pct_native_american` | FLOAT | NULL | Native American/Alaska Native percentage |
| `pct_two_or_more` | FLOAT | NULL | Two or more races percentage |
| `pct_mena` | FLOAT | NULL | Middle Eastern/North African percentage |

**Notes:**
- All percentages are 0-100 (not decimals)
- `NULL` indicates suppressed data (privacy protection for small student counts)
- Percentages may not sum to 100 due to rounding or suppression

---

### Trend Metrics (Year-over-Year Changes)

Trend columns store the change (current value minus the value in the window's base year). Percentage metrics change in percentage points; enrollment changes in students. Format: `{metric}_trend_{window}`

**Windows:**
- `1yr`: 1-year change (2025 → 2026)
- `3yr`: 3-year change (2023 → 2026)
- `5yr`: 5-year change (2021 → 2026, falls back to 2020 if 2021 is missing)
- `10yr`: 10-year change (2016 → 2026)
- `15yr`: 15-year change (2011 → 2026)

#### Enrollment Trends

| Column | Type | Description |
|--------|------|-------------|
| `enrollment_trend_1yr` | FLOAT | 1-year enrollment change (students) |
| `enrollment_trend_3yr` | FLOAT | 3-year enrollment change (students) |
| `enrollment_trend_5yr` | FLOAT | 5-year enrollment change (students) |
| `enrollment_trend_10yr` | FLOAT | 10-year enrollment change (students) |
| `enrollment_trend_15yr` | FLOAT | 15-year enrollment change (students) |

#### Demographics Trends

| Column | Type | Description |
|--------|------|-------------|
| `low_income_trend_1yr` | FLOAT | 1-year low-income % change |
| `low_income_trend_3yr` | FLOAT | 3-year low-income % change |
| `low_income_trend_5yr` | FLOAT | 5-year low-income % change |
| `low_income_trend_10yr` | FLOAT | 10-year low-income % change |
| `low_income_trend_15yr` | FLOAT | 15-year low-income % change |
| `el_trend_1yr` | FLOAT | 1-year English Learner % change |
| `el_trend_3yr` | FLOAT | 3-year English Learner % change |
| `el_trend_5yr` | FLOAT | 5-year English Learner % change |
| `el_trend_10yr` | FLOAT | 10-year English Learner % change |
| `el_trend_15yr` | FLOAT | 15-year English Learner % change |

#### Diversity Trends

Each diversity category has five trend columns following the pattern `{category}_trend_{window}`:

**Categories:** white, black, hispanic, asian, pacific_islander, native_american, two_or_more, mena

**Example columns:**
- `white_trend_1yr`, `white_trend_3yr`, `white_trend_5yr`, `white_trend_10yr`, `white_trend_15yr`
- `black_trend_1yr`, `black_trend_3yr`, `black_trend_5yr`, `black_trend_10yr`, `black_trend_15yr`
- (40 total diversity trend columns)

#### ACT Trends

| Column | Type | Description |
|--------|------|-------------|
| `act_trend_1yr` | FLOAT | 1-year ACT composite change |
| `act_trend_3yr` | FLOAT | 3-year ACT composite change |
| `act_trend_5yr` | FLOAT | 5-year ACT composite change |
| `act_trend_10yr` | FLOAT | 10-year ACT composite change |
| `act_trend_15yr` | FLOAT | 15-year ACT composite change |

**Total Trend Columns:** 60 (12 metrics × 5 windows)

**Calculation:** Trends are computed during data sync (`_calculate_trend` in `backend/app/utils/sync_from_api.py`) as current value minus the base-year value.

---

### Historical Yearly Data (2010-2026)

Historical columns store actual values for each year. Format: `{metric}_hist_{year}`

**Years Available:** 2010 through 2026 (17 years). The current year (2026) is also stored in its `*_hist_2026` columns.

#### Enrollment History

| Column | Type | Description |
|--------|------|-------------|
| `enrollment_hist_2026` | INTEGER | 2026 enrollment |
| `enrollment_hist_2025` | INTEGER | 2025 enrollment |
| ... | INTEGER | (continues for all years) |
| `enrollment_hist_2010` | INTEGER | 2010 enrollment |

**Total:** 17 columns (2010-2026)

#### ACT Composite History

| Column | Type | Description |
|--------|------|-------------|
| `act_hist_2026` | FLOAT | 2026 ACT composite average |
| `act_hist_2025` | FLOAT | 2025 ACT composite average |
| ... | FLOAT | (continues for all years) |
| `act_hist_2010` | FLOAT | 2010 ACT composite average |

**Total:** 17 columns (2010-2026)

**Note:** 2018 and 2020 are NULL (no ACT/SAT data in those years' Report Cards)

#### ACT Subject Scores History

Each ACT subject has 17 yearly columns: `{subject}_hist_{year}`

**Subjects:**
- `act_ela_hist_2026` through `act_ela_hist_2010` (17 columns)
- `act_math_hist_2026` through `act_math_hist_2010` (17 columns)
- `act_science_hist_2026` through `act_science_hist_2010` (17 columns)

**Total ACT Historical Columns:** 68 (4 metrics × 17 years)

**Coverage:**
- **2010-2017**: Direct ACT composite and subject scores
- **2019, 2021-2024**: SAT scores converted to ACT composite using the concordance table (no subject scores)
- **2025-2026**: ACT ELA/Math/Science grade 11 averages; composite = (ELA + Math) / 2

#### Demographics History

| Metric | Columns | Type |
|--------|---------|------|
| English Learners | `el_hist_2026` ... `el_hist_2010` | FLOAT |
| Low Income | `low_income_hist_2026` ... `low_income_hist_2010` | FLOAT |

**Total Demographics Historical Columns:** 34 (2 metrics × 17 years)

#### Diversity History

Each diversity category has 17 yearly columns: `{category}_hist_{year}`

**Categories:** white, black, hispanic, asian, pacific_islander, native_american, two_or_more, mena

**Example columns:**
- `white_hist_2026` through `white_hist_2010` (17 columns)
- `black_hist_2026` through `black_hist_2010` (17 columns)
- (8 categories × 17 years = 136 total diversity historical columns)

**Total Historical Columns:** 255 (17 enrollment + 68 ACT + 34 demographics + 136 diversity)

**Data Source:** ReportCardAPI per-year tables, fetched by `backend/app/utils/sync_from_api.py`

---

## Full-Text Search (FTS5)

### schools_fts Virtual Table

**Type:** SQLite FTS5 Virtual Table
**Purpose:** Fast full-text search across school names, cities, and districts

**Columns:**
- `school_name` (TEXT)
- `city` (TEXT)
- `district` (TEXT)

**Configuration:**
```sql
CREATE VIRTUAL TABLE schools_fts USING fts5(
    school_name,
    city,
    district,
    content=schools,
    content_rowid=id
);
```

**Synchronization:** Automatic via triggers (insert, update, delete)

**Search Function:** `search_schools(db, query, limit)` in `backend/app/database.py`

**Features:**
- Tokenized search (searches individual words)
- Ranked results by relevance
- Case-insensitive
- Special character sanitization

---

## Indexes

### Primary Indexes

| Index | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| Primary Key | `id` | AUTOINCREMENT | Unique row identifier |
| Unique Index | `rcdts` | UNIQUE | State school identifier lookup |

### Performance Indexes

| Index | Column(s) | Purpose |
|-------|-----------|---------|
| City Index | `city` | Location-based queries |
| Level Index | `level` | School level filtering (elementary/middle/high) |

### FTS5 Index

| Index | Columns | Purpose |
|-------|---------|---------|
| `schools_fts` | `school_name`, `city`, `district` | Full-text search |

---

## Data Types & Constraints

### NULL Handling

**NULL values indicate:**
1. **Suppressed data** - Privacy protection when student count < 10
2. **Not applicable** - ACT scores for elementary schools, IAR scores for high schools
3. **Data unavailable** - Historical years before school opened or before data collection began

**Examples:**
- Elementary school: `act_ela_avg = NULL` (no ACT testing)
- Small school: `pct_pacific_islander = NULL` (suppressed for privacy)
- New school (2023): `enrollment_hist_2019 = NULL` (didn't exist)

### Value Ranges

| Field Type | Range | Format |
|------------|-------|--------|
| Percentages | 0-100 | Float (not decimal) |
| Enrollment | 0-9999+ | Integer |
| ACT Scores | 1-36 | Float |
| IAR Proficiency | 0-100 | Float |
| Trends | Unbounded | Float (difference from base year) |

---

## Relationships & Computed Fields

### Computed in API Layer

These fields are **not** stored in the database but computed when serving API responses:

| Field | Computation | Location |
|-------|-------------|----------|
| `act.overall_avg` | `(act_ela_avg + act_math_avg) / 2` | `backend/app/models.py:ACTScores.overall_avg` |

### Derived During Sync

These fields are computed once during data sync:

| Field | Source | Logic |
|-------|--------|-------|
| `level` | `school_type` | Normalized to "high", "middle", "elementary", "other" |
| `*_trend_*` | Historical data | `current - historical` |

---

## Table Statistics

**Total Columns:** 294+
- Primary info: 10 columns
- Current metrics: 19 columns
- Trend metrics: 60 columns
- Historical data: 255 columns (17 years × 15 metrics)
- Metadata: 1 column (`created_at`)

**Total Schools:** 3,828 (2026 dataset)

**Database Size:** ~7 MB (with full historical data)

**Historical Coverage:** 17-year time series (2010-2026) for:
- Enrollment (15 years complete)
- ACT scores (15 years, missing 2018 and 2020)
- Demographics (14-15 years)
- Diversity (15 years)

---

## Schema Evolution

### Adding Historical Years

When adding a new year (e.g., 2027):

1. **Add new historical columns:**
   - `enrollment_hist_2027`
   - `act_hist_2027`
   - All subject and demographic `*_hist_2027` columns

2. **Update trend calculations** to use new base year

3. **Drop oldest year** if maintaining fixed window (optional)

See "Loading a new Report Card year" in the root `CLAUDE.md` for the full workflow.

**Important:** Drop `data/schools.db` before re-syncing to allow SQLAlchemy to recreate schema with new columns.

### Schema Migrations

**Current approach:** Drop and recreate database

For production, consider:
- Alembic for migrations
- Preserve user-generated data (favorites, notes, etc.)
- Backward compatibility for API clients

---

## Related Documentation

- **Model Implementation:** `backend/app/database.py`
- **API Models:** `backend/app/models.py` (Pydantic schemas)
- **Data Sync:** `backend/app/utils/sync_from_api.py`
- **API Reference:** `backend/docs/API_ENDPOINTS.md`

---

## Expected Data Coverage Notes

Based on verification with real schools in the database:

**Complete Coverage (16-17 years)**:
- Enrollment: 2010-2026
- Low Income %: 2010-2026
- All Diversity %: 2010-2026

**Partial Coverage**:
- ACT Composite: 2010-2026, missing 2018 and 2020
- ACT ELA/Math: 2010-2017 and 2025-2026 (SAT years have no subject scores)
- EL %: 2010-2026 (not reported for some early years)

**Limited Coverage**:
- ACT Science: 9-10 years (not all years included science testing)
- MENA %: Limited (category added in recent years)

**Data Quality Notes**:
- NULL values indicate either suppressed data (privacy) or unavailable data (school didn't exist, testing not conducted)
- 2020 has widespread NULL values for test scores due to COVID-19
- Older schools (opened before 2010) generally have a complete 17-year history
- Newer schools have NULL for years before they opened

---

## Query Examples

### Find school by RCDTS
```sql
SELECT * FROM schools WHERE rcdts = '05-016-2140-17-0002';
```

### Full-text search
```sql
SELECT s.* FROM schools s
JOIN schools_fts ON s.id = schools_fts.rowid
WHERE schools_fts MATCH 'elk grove'
ORDER BY rank
LIMIT 10;
```

### Schools with enrollment trends
```sql
SELECT school_name, city,
       enrollment_trend_1yr,
       enrollment_trend_3yr,
       enrollment_trend_5yr
FROM schools
WHERE enrollment_trend_5yr IS NOT NULL
ORDER BY enrollment_trend_5yr DESC
LIMIT 20;
```

### Top ACT scores by level
```sql
SELECT school_name, city, act_ela_avg, act_math_avg
FROM schools
WHERE level = 'high'
  AND act_ela_avg IS NOT NULL
  AND act_math_avg IS NOT NULL
ORDER BY (act_ela_avg + act_math_avg) / 2 DESC
LIMIT 100;
```

### Historical enrollment for a school (17-year time series)
```sql
SELECT school_name,
       enrollment_hist_2026, enrollment_hist_2025, enrollment_hist_2024, enrollment_hist_2023,
       enrollment_hist_2022, enrollment_hist_2021, enrollment_hist_2020,
       enrollment_hist_2019, enrollment_hist_2018, enrollment_hist_2017,
       enrollment_hist_2016, enrollment_hist_2015, enrollment_hist_2014,
       enrollment_hist_2013, enrollment_hist_2012, enrollment_hist_2011,
       enrollment_hist_2010
FROM schools
WHERE rcdts = '05-016-2140-17-0002';
```

### ACT historical trends for a school
```sql
SELECT school_name,
       act_hist_2026, act_hist_2025, act_hist_2024, act_hist_2023,
       act_hist_2022, act_hist_2021, act_hist_2020,
       act_hist_2019, act_hist_2018, act_hist_2017,
       act_hist_2016, act_hist_2015, act_hist_2014,
       act_hist_2013, act_hist_2012, act_hist_2011,
       act_hist_2010
FROM schools
WHERE rcdts = '05-016-2140-17-0002'
  AND level = 'high';
```
