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
- Historical data spanning **2010-2025** (16 years)
- Trend calculations for 1, 3, and 5-year windows

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

### Current Metrics (2025 School Year)

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

Trend columns store percentage change relative to prior years. Format: `{metric}_trend_{window}`

**Windows:**
- `1yr`: 1-year change (2024 → 2025)
- `3yr`: 3-year change (2022 → 2025)
- `5yr`: 5-year change (2020 → 2025)

#### Enrollment Trends

| Column | Type | Description |
|--------|------|-------------|
| `enrollment_trend_1yr` | FLOAT | 1-year enrollment change (%) |
| `enrollment_trend_3yr` | FLOAT | 3-year enrollment change (%) |
| `enrollment_trend_5yr` | FLOAT | 5-year enrollment change (%) |

#### Demographics Trends

| Column | Type | Description |
|--------|------|-------------|
| `low_income_trend_1yr` | FLOAT | 1-year low-income % change |
| `low_income_trend_3yr` | FLOAT | 3-year low-income % change |
| `low_income_trend_5yr` | FLOAT | 5-year low-income % change |
| `el_trend_1yr` | FLOAT | 1-year English Learner % change |
| `el_trend_3yr` | FLOAT | 3-year English Learner % change |
| `el_trend_5yr` | FLOAT | 5-year English Learner % change |

#### Diversity Trends

Each diversity category has three trend columns following the pattern `{category}_trend_{window}`:

**Categories:** white, black, hispanic, asian, pacific_islander, native_american, two_or_more, mena

**Example columns:**
- `white_trend_1yr`, `white_trend_3yr`, `white_trend_5yr`
- `black_trend_1yr`, `black_trend_3yr`, `black_trend_5yr`
- (24 total diversity trend columns)

#### ACT Trends

| Column | Type | Description |
|--------|------|-------------|
| `act_trend_1yr` | FLOAT | 1-year ACT composite change |
| `act_trend_3yr` | FLOAT | 3-year ACT composite change |
| `act_trend_5yr` | FLOAT | 5-year ACT composite change |

**Total Trend Columns:** 30

**Calculation:** Trends are computed during data import by comparing current year values to historical values. See `docs/trend-data-workflow.md` for details.

---

### Historical Yearly Data (2010-2025)

Historical columns store actual values for each year. Format: `{metric}_hist_{year}`

**Years Available:** 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025 (16 years)

#### Enrollment History

| Column | Type | Description |
|--------|------|-------------|
| `enrollment_hist_2025` | INTEGER | 2025 enrollment |
| `enrollment_hist_2024` | INTEGER | 2024 enrollment |
| `enrollment_hist_2023` | INTEGER | 2023 enrollment |
| ... | INTEGER | (continues for all years) |
| `enrollment_hist_2012` | INTEGER | 2012 enrollment |
| `enrollment_hist_2011` | INTEGER | 2011 enrollment |
| `enrollment_hist_2010` | INTEGER | 2010 enrollment |

**Total:** 16 columns (2010-2025)

#### ACT Composite History

| Column | Type | Description |
|--------|------|-------------|
| `act_hist_2025` | FLOAT | 2025 ACT composite average |
| `act_hist_2024` | FLOAT | 2024 ACT composite average |
| `act_hist_2023` | FLOAT | 2023 ACT composite average |
| ... | FLOAT | (continues for all years) |
| `act_hist_2012` | FLOAT | 2012 ACT composite average |
| `act_hist_2011` | FLOAT | 2011 ACT composite average |
| `act_hist_2010` | FLOAT | 2010 ACT composite average |

**Total:** 16 columns (2010-2025)

**Note:** 2020 often NULL due to COVID-19 testing disruptions

#### ACT Subject Scores History

Each ACT subject has 16 yearly columns: `{subject}_hist_{year}`

**Subjects:**
- `act_ela_hist_2025` through `act_ela_hist_2010` (16 columns)
- `act_math_hist_2025` through `act_math_hist_2010` (16 columns)
- `act_science_hist_2025` through `act_science_hist_2010` (16 columns)

**Total ACT Historical Columns:** 64 (4 metrics × 16 years)

**Coverage:**
- **2010-2017**: Direct ACT scores from converted TXT files
- **2018**: Native XLSX file (may have mixed data)
- **2019-2024**: SAT scores converted to ACT using concordance table
- **2025**: Current year ACT scores

#### Demographics History

| Metric | Columns | Type |
|--------|---------|------|
| English Learners | `el_hist_2025` ... `el_hist_2010` | FLOAT |
| Low Income | `low_income_hist_2025` ... `low_income_hist_2010` | FLOAT |

**Total Demographics Historical Columns:** 32 (2 metrics × 16 years)

#### Diversity History

Each diversity category has 16 yearly columns: `{category}_hist_{year}`

**Categories:** white, black, hispanic, asian, pacific_islander, native_american, two_or_more, mena

**Example columns:**
- `white_hist_2025` through `white_hist_2010` (16 columns)
- `black_hist_2025` through `black_hist_2010` (16 columns)
- `hispanic_hist_2025` through `hispanic_hist_2010` (16 columns)
- (8 categories × 16 years = 128 total diversity historical columns)

**Total Historical Columns:** 240 (16 enrollment + 64 ACT + 32 demographics + 128 diversity)

**Data Sources:**
- **2010-2017**: Legacy TXT files converted to XLSX via `backend/app/utils/convert_txt_to_xlsx.py`
- **2018-2024**: Native XLSX files in `data/historical-report-cards/`
- **2025**: Current year from main dataset
- See `data/historical-report-cards/HISTORICAL_MAPPING.md` for complete import documentation

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
| Trends | -100 to +∞ | Float (percentage change) |

---

## Relationships & Computed Fields

### Computed in API Layer

These fields are **not** stored in the database but computed when serving API responses:

| Field | Computation | Location |
|-------|-------------|----------|
| `act.overall_avg` | `(act_ela_avg + act_math_avg) / 2` | `backend/app/models.py:ACTScores.overall_avg` |

### Derived During Import

These fields are computed once during data import:

| Field | Source | Logic |
|-------|--------|-------|
| `level` | `school_type` | Normalized to "high", "middle", "elementary", "other" |
| `*_trend_*` | Historical data | `((current - historical) / historical) * 100` |

---

## Table Statistics

**Total Columns:** 270+
- Primary info: 10 columns
- Current metrics: 19 columns
- Trend metrics: 30 columns
- Historical data: 240 columns (16 years × 15 metrics)
- Metadata: 1 column (`created_at`)

**Total Schools:** ~3,827 (as of 2025 dataset)

**Database Size:** ~50-100 MB (with full historical data)

**Historical Coverage:** Complete 16-year time series (2010-2025) for:
- Enrollment (15 years complete)
- ACT scores (14 years, missing 2020 due to COVID)
- Demographics (14-15 years)
- Diversity (15 years)

---

## Schema Evolution

### Adding Historical Years

When adding a new year (e.g., 2026):

1. **Add new historical columns:**
   - `enrollment_hist_2026`
   - `act_hist_2026`
   - All subject and demographic `*_hist_2026` columns

2. **Update trend calculations** to use new base year

3. **Drop oldest year** if maintaining fixed window (optional)

**Important:** Drop `data/schools.db` before re-importing to allow SQLAlchemy to recreate schema with new columns.

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
- **Data Import:** `backend/app/utils/import_data.py`
- **Historical Import System:** `data/historical-report-cards/HISTORICAL_MAPPING.md` (complete documentation)
- **Trend Workflow:** `docs/trend-data-workflow.md`
- **API Reference:** `backend/README.md`

---

## Expected Data Coverage Notes

Based on verification with real schools in the database:

**Complete Coverage (15-16 years)**:
- Enrollment: 2010-2025 (15 years for most schools)
- Low Income %: 2010-2025 (15 years)
- All Diversity %: 2010-2025 (15 years)

**Nearly Complete Coverage (14 years)**:
- ACT Composite: 2010-2025, missing 2020 (COVID-19 testing disruption)
- ACT ELA: 2010-2025, missing 2020
- ACT Math: 2010-2025, missing 2020
- EL %: 2010-2025 (14 years for most schools)

**Partial Coverage**:
- ACT Science: 9-10 years (not all years included science testing)
- MENA %: Limited (category added in recent years)

**Data Quality Notes**:
- NULL values indicate either suppressed data (privacy) or unavailable data (school didn't exist, testing not conducted)
- 2020 has widespread NULL values for test scores due to COVID-19
- Older schools (opened before 2010) generally have complete 16-year history
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

### Historical enrollment for a school (16-year time series)
```sql
SELECT school_name,
       enrollment_hist_2025, enrollment_hist_2024, enrollment_hist_2023,
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
       act_hist_2025, act_hist_2024, act_hist_2023,
       act_hist_2022, act_hist_2021, act_hist_2020,
       act_hist_2019, act_hist_2018, act_hist_2017,
       act_hist_2016, act_hist_2015, act_hist_2014,
       act_hist_2013, act_hist_2012, act_hist_2011,
       act_hist_2010
FROM schools
WHERE rcdts = '05-016-2140-17-0002'
  AND level = 'high';
```
