# ABOUTME: Complete API endpoint reference for Illinois School Explorer backend
# ABOUTME: Detailed documentation for all REST endpoints with examples and error handling

# API Endpoints Reference

Complete endpoint documentation for the Illinois School Explorer REST API.

**Base URL (Development):** `http://localhost:8000`
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)

---

## Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| [`/health`](#health-check) | GET | Health check |
| [`/api/search`](#search-schools) | GET | Search schools by name, city, or district |
| [`/api/schools/{rcdts}`](#get-school-detail) | GET | Get complete school information |
| [`/api/schools/compare`](#compare-schools) | GET | Compare 2-5 schools side-by-side |
| [`/api/top-scores`](#get-top-scores) | GET | Ranked list of top schools by assessment |

---

## Endpoints

### Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Authentication:** None

**Parameters:** None

**Example Request:**
```bash
curl http://localhost:8000/health
```

**Example Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` - API is running

**Use Case:** Health monitoring, deployment verification

---

### Search Schools

Full-text search across school names, cities, and districts using SQLite FTS5.

**Endpoint:** `GET /api/search`

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `q` | string | Yes | - | min_length=1 | Search query |
| `limit` | integer | No | 10 | 1-50 | Maximum number of results |

**Example Request:**
```bash
curl "http://localhost:8000/api/search?q=elk+grove&limit=5"
```

**Example Response:**
```json
{
  "results": [
    {
      "id": 123,
      "rcdts": "05-016-2140-17-0002",
      "school_name": "Elk Grove High School",
      "city": "Elk Grove Village",
      "district": "Township HSD 214",
      "school_type": "High School"
    }
  ],
  "total": 1
}
```

**Response Schema:**

See [`../app/models.py`](../app/models.py) for `SearchResponse` and `SchoolSearchResult` definitions.

**Fields Returned:**
- `id` (int) - Internal database ID
- `rcdts` (string) - State school identifier
- `school_name` (string) - Official school name
- `city` (string) - City location
- `district` (string | null) - School district name
- `school_type` (string | null) - School type (e.g., "High School")

**Search Behavior:**
- Case-insensitive matching
- Tokenized search (matches individual words)
- Results ranked by FTS5 relevance
- Searches across: school name, city, district
- Special characters automatically sanitized
- Empty results if no matches found

**Status Codes:**
- `200 OK` - Successful search (may return empty results)
- `422 Unprocessable Entity` - Missing or invalid query parameter

**Error Examples:**
```json
// Missing query parameter
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "q"],
      "msg": "Field required"
    }
  ]
}
```

**Database Operations:**
- Uses FTS5 virtual table `schools_fts`
- See [`docs/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md#full-text-search-fts5) for index details

**Frontend Integration:**
```typescript
// See frontend/src/lib/api/queries.ts
const { data } = useSearch('elk grove', 10);
```

---

### Get School Detail

Retrieve complete information for a specific school including all metrics, trends, and historical data.

**Endpoint:** `GET /api/schools/{rcdts}`

**Authentication:** None

**Path Parameters:**

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| `rcdts` | string | Yes | "XX-XXX-XXXX-XX-XXXX" | Illinois state school identifier |

**Example Request:**
```bash
curl "http://localhost:8000/api/schools/05-016-2140-17-0002"
```

**Example Response:**
```json
{
  "id": 123,
  "rcdts": "05-016-2140-17-0002",
  "school_name": "Elk Grove High School",
  "city": "Elk Grove Village",
  "district": "Township HSD 214",
  "county": "Cook",
  "school_type": "High School",
  "grades_served": "9-12",
  "metrics": {
    "enrollment": 1775,
    "act": {
      "ela_avg": 17.7,
      "math_avg": 18.2,
      "science_avg": 18.9,
      "overall_avg": 17.95
    },
    "demographics": {
      "el_percentage": 29.0,
      "low_income_percentage": 38.4
    },
    "diversity": {
      "white": 36.8,
      "black": 1.9,
      "hispanic": 48.3,
      "asian": 8.7,
      "pacific_islander": null,
      "native_american": null,
      "two_or_more": 3.0,
      "mena": null
    },
    "iar_ela_proficiency_pct": null,
    "iar_math_proficiency_pct": null,
    "iar_overall_proficiency_pct": null,
    "trends": {
      "enrollment": {
        "one_year": -2.5,
        "three_year": -8.1,
        "five_year": -12.3
      },
      "act": {
        "one_year": 1.2,
        "three_year": 0.8,
        "five_year": null
      }
    },
    "historical": {
      "enrollment": {
        "yr_2025": 1775,
        "yr_2024": 1820,
        "yr_2023": 1850,
        "yr_2022": 1900,
        "yr_2021": 1950,
        "yr_2020": 2000,
        "yr_2019": 2050
      },
      "act": {
        "yr_2025": 17.95,
        "yr_2024": 17.74,
        "yr_2023": 17.50,
        "yr_2022": null,
        "yr_2021": null,
        "yr_2020": null,
        "yr_2019": null
      }
    }
  }
}
```

**Response Schema:**

See [`../app/models.py`](../app/models.py) for complete type definitions:
- `SchoolDetail` - Top-level response
- `SchoolMetrics` - Metrics container
- `ACTScores` - ACT scores with computed overall average
- `Demographics` - EL and low-income percentages
- `Diversity` - Racial/ethnic breakdown
- `TrendMetrics` - Year-over-year changes
- `HistoricalMetrics` - Yearly values 2019-2025

**Metrics Details:**

**Current Year (2025):**
- `enrollment` (int | null) - Total student count
- `act` (object | null) - ACT scores (null for elementary schools)
  - `ela_avg`, `math_avg`, `science_avg` (float | null)
  - `overall_avg` (float | null) - **Computed:** `(ela_avg + math_avg) / 2`
- `demographics` (object)
  - `el_percentage` (float | null) - English Learner percentage (0-100)
  - `low_income_percentage` (float | null) - Low-income percentage (0-100)
- `diversity` (object) - 8 racial/ethnic categories, all (float | null)
- `iar_*_proficiency_pct` (float | null) - IAR proficiency rates (null for high schools)

**Trends:**
- `trends` (object | null) - Percentage changes over 1/3/5 year windows
- Each metric has: `one_year`, `three_year`, `five_year` (float | null)
- Available for: enrollment, demographics, diversity, ACT
- See [`docs/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md#trend-metrics-year-over-year-changes) for calculation details

**Historical Data:**
- `historical` (object | null) - Actual values by year (2019-2025)
- Each metric has: `yr_2025` through `yr_2019` (number | null)
- Available for: enrollment, ACT (overall + subjects), demographics, diversity
- See [`docs/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md#historical-yearly-data-2019-2025) for data sources

**NULL Handling:**
- `null` indicates suppressed data (privacy protection) or not applicable
- Elementary schools: `act = null`, IAR scores present
- High schools: IAR scores = `null`, ACT present
- Small populations: diversity/demographic fields may be `null`

**Status Codes:**
- `200 OK` - School found and returned
- `404 Not Found` - School does not exist (invalid RCDTS)
- `503 Service Unavailable` - Database connection error

**Error Examples:**
```json
// School not found
{
  "detail": "School not found"
}

// Database unavailable
{
  "detail": "Service temporarily unavailable"
}
```

**Database Operations:**
- Direct lookup by RCDTS (indexed)
- Joins not required (denormalized schema)
- See [`docs/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md#schools-table) for complete schema

**Frontend Integration:**
```typescript
// See frontend/src/lib/api/queries.ts
const { data: school } = useSchoolDetail(rcdts);
```

**Related Endpoints:**
- Use [`/api/schools/compare`](#compare-schools) to compare multiple schools
- Use [`/api/search`](#search-schools) to find schools before fetching details

---

### Compare Schools

Compare 2-5 schools side-by-side with complete metrics.

**Endpoint:** `GET /api/schools/compare`

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| `rcdts` | string | Yes | "rcdts1,rcdts2,..." | Comma-separated RCDTS codes (2-5 schools) |

**Example Request:**
```bash
curl "http://localhost:8000/api/schools/compare?rcdts=05-016-2140-17-0001,05-016-2140-17-0002"
```

**Example Response:**
```json
{
  "schools": [
    {
      "id": 1,
      "rcdts": "05-016-2140-17-0001",
      "school_name": "School A",
      "city": "Chicago",
      "district": "District 1",
      "county": "Cook",
      "school_type": "High School",
      "grades_served": "9-12",
      "metrics": {
        "enrollment": 2000,
        "act": {
          "ela_avg": 18.5,
          "math_avg": 19.2,
          "science_avg": 19.8,
          "overall_avg": 18.85
        },
        "demographics": {
          "el_percentage": 15.0,
          "low_income_percentage": 42.0
        },
        "diversity": {
          "white": 45.0,
          "black": 12.0,
          "hispanic": 35.0,
          "asian": 6.0,
          "pacific_islander": null,
          "native_american": null,
          "two_or_more": 2.0,
          "mena": null
        },
        "iar_ela_proficiency_pct": null,
        "iar_math_proficiency_pct": null,
        "iar_overall_proficiency_pct": null,
        "trends": { /* ... */ },
        "historical": { /* ... */ }
      }
    },
    {
      "id": 2,
      "rcdts": "05-016-2140-17-0002",
      "school_name": "School B",
      "city": "Springfield",
      "metrics": { /* full metrics object */ }
    }
  ]
}
```

**Response Schema:**

See [`../app/models.py`](../app/models.py) for `CompareResponse` and `SchoolDetail` definitions.

**Response Structure:**
- `schools` (array) - Array of `SchoolDetail` objects
- Each school has identical structure to [`/api/schools/{rcdts}`](#get-school-detail) response
- Schools returned in the order specified in request

**Behavior:**
- Validates 2-5 RCDTS codes (fails if outside range)
- Silently skips non-existent schools (won't fail entire request)
- If all schools are invalid, returns empty `schools` array
- Useful for frontend: allows partial success rather than complete failure

**Status Codes:**
- `200 OK` - Successful comparison (may return 0-N schools if some don't exist)
- `400 Bad Request` - Less than 2 or more than 5 RCDTS codes provided
- `503 Service Unavailable` - Database connection error

**Error Examples:**
```json
// Too few schools
{
  "detail": "Must provide 2-5 school RCDTS codes"
}

// Too many schools
{
  "detail": "Must provide 2-5 school RCDTS codes"
}
```

**Use Cases:**
- Side-by-side school comparison
- Multi-district analysis
- Trend comparison across schools
- Historical performance tracking

**Frontend Integration:**
```typescript
// See frontend/src/lib/api/queries.ts
const { data } = useCompare(['rcdts1', 'rcdts2', 'rcdts3']);
```

**Performance Notes:**
- Each school requires one database query
- Not optimized for >5 schools (intentionally limited)
- Consider caching results client-side for repeated comparisons

---

### Get Top Scores

Retrieve ranked list of top 100 schools by ACT composite or IAR proficiency, filtered by school level.

**Endpoint:** `GET /api/top-scores`

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Required | Values | Default | Description |
|-----------|------|----------|--------|---------|-------------|
| `assessment` | string | Yes | `act`, `iar` | - | Assessment type to rank by |
| `level` | string | Yes | `high`, `middle`, `elementary` | - | School level filter |
| `limit` | integer | No | 1-100 | 100 | Maximum results to return |

**Parameter Details:**

**`assessment`:**
- `act` - Rank by ACT composite score `(ELA + Math) / 2`
- `iar` - Rank by IAR overall proficiency percentage

**`level`:**
- `high` - High schools (typically grades 9-12)
- `middle` - Middle/junior high schools (typically grades 6-8)
- `elementary` - Elementary schools (typically K-5)
- Note: Values are normalized during import from `school_type` field

**Example Requests:**
```bash
# Top 5 high schools by ACT
curl "http://localhost:8000/api/top-scores?assessment=act&level=high&limit=5"

# Top 100 elementary schools by IAR (default limit)
curl "http://localhost:8000/api/top-scores?assessment=iar&level=elementary"

# Top 20 middle schools by IAR
curl "http://localhost:8000/api/top-scores?assessment=iar&level=middle&limit=20"
```

**Example Response:**
```json
{
  "results": [
    {
      "rank": 1,
      "rcdts": "05-016-2140-17-0002",
      "school_name": "Elk Grove High School",
      "city": "Elk Grove Village",
      "district": "Township HSD 214",
      "school_type": "High School",
      "level": "high",
      "enrollment": 1775,
      "score": 25.1,
      "act_ela_avg": 24.5,
      "act_math_avg": 25.7
    },
    {
      "rank": 2,
      "rcdts": "15-016-3050-17-0003",
      "school_name": "Example High School",
      "city": "Chicago",
      "district": "CPS District 299",
      "school_type": "High School",
      "level": "high",
      "enrollment": 1520,
      "score": 24.8,
      "act_ela_avg": 24.2,
      "act_math_avg": 25.4
    }
  ]
}
```

**Response Schema:**

See [`../app/models.py`](../app/models.py) for `TopScoresResponse` and `TopScoreEntry` definitions.

**Fields Returned:**
- `rank` (int) - School's ranking (1-indexed)
- `rcdts` (string) - State school identifier
- `school_name` (string) - Official school name
- `city` (string) - City location
- `district` (string | null) - School district
- `school_type` (string | null) - Original school type
- `level` (string) - Normalized level (high/middle/elementary)
- `enrollment` (int | null) - Total student count
- `score` (float) - Ranking score (ACT composite or IAR proficiency)
- `act_ela_avg` (float | null) - ACT ELA average (only for ACT assessment)
- `act_math_avg` (float | null) - ACT Math average (only for ACT assessment)

**Ranking Logic:**

**Score Calculation:**
- ACT: `(act_ela_avg + act_math_avg) / 2` rounded to 2 decimals
- IAR: `iar_overall_proficiency_pct` rounded to 2 decimals

**Sorting:**
1. Primary: Score (descending)
2. Tie-breaker: School name (alphabetical)

**Exclusions:**
- Schools with `NULL` scores are excluded from results
- Elementary schools excluded from ACT rankings (no ACT data)
- High schools excluded from IAR rankings (no IAR data)
- Schools with suppressed assessment data excluded

**Status Codes:**
- `200 OK` - Successful ranking (may return fewer than `limit` results)
- `422 Unprocessable Entity` - Invalid `assessment` or `level` parameter
- `503 Service Unavailable` - Database connection error

**Error Examples:**
```json
// Invalid assessment
{
  "detail": "Invalid assessment"
}

// Invalid level
{
  "detail": "Invalid level"
}

// Missing required parameter
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "assessment"],
      "msg": "Field required"
    }
  ]
}
```

**Use Cases:**
- School performance leaderboards
- District benchmarking
- Identifying high-performing schools
- Data journalism and research

**Database Operations:**
- Filtered query on `level` field (indexed)
- Sorted by computed score + school name
- See [`docs/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md#schools-table) for relevant fields

**Frontend Integration:**
```typescript
// See frontend/src/lib/api/queries.ts
const { data } = useQuery({
  queryKey: topScoresQueryKey('act', 'high', 100),
  queryFn: () => getTopScores({ assessment: 'act', level: 'high', limit: 100 })
});
```

**Performance Notes:**
- Results cached client-side by TanStack Query
- Consider rate limiting for public deployments
- Limit capped at 100 to prevent excessive data transfer

---

## Common Patterns

### Error Handling

All endpoints return consistent error formats using FastAPI's standard error responses:

**Validation Errors (422):**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "parameter_name"],
      "msg": "Field required"
    }
  ]
}
```

**Business Logic Errors (400, 404):**
```json
{
  "detail": "Human-readable error message"
}
```

**Server Errors (503):**
```json
{
  "detail": "Service temporarily unavailable"
}
```

### Null Values

`null` in responses indicates:
1. **Suppressed data** - Privacy protection when student count < 10
2. **Not applicable** - ACT for elementary schools, IAR for high schools
3. **Data unavailable** - Historical years before data collection

Always handle nulls gracefully in client code.

### Pagination

Currently, only the search endpoint supports limiting results via the `limit` parameter. There is no offset-based pagination implemented.

For future pagination needs:
- Add `offset` parameter to search endpoint
- Return total count for client-side pagination logic
- Consider cursor-based pagination for large datasets

### Caching Recommendations

**Client-side (TanStack Query):**
- Search results: 5 minutes stale time
- School details: 10 minutes stale time
- Comparisons: 10 minutes stale time
- Top scores: Cache indefinitely (data changes rarely)

**Server-side:**
- Not currently implemented
- Consider Redis for production deployments
- Cache school details by RCDTS
- Invalidate on data imports

---

## Authentication & Rate Limiting

**Current Status:** None implemented

**Future Considerations:**
- API keys for tracking usage
- Rate limiting (per IP or per key)
- CORS configuration for production domains
- OAuth for user-specific features

---

## Versioning

**Current Version:** 1.0.0 (unversioned URLs)

**Future Strategy:**
- URL versioning: `/api/v2/search`
- Or header-based versioning: `Accept: application/vnd.api+json; version=2`
- Maintain backward compatibility for one major version

---

## Related Documentation

- **Database Schema:** [`docs/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md)
- **Response Models:** [`../app/models.py`](../app/models.py)
- **API Implementation:** [`../app/api/`](../app/api/)
- **Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)
- **Backend README:** [`../README.md`](../README.md)
- **Frontend Integration:** `../../frontend/README.md`
