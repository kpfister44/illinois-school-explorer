# Feature: Display Historical Yearly Data in Trend Dropdowns

## Overview

Add a historical yearly data table to all metric trend dropdowns, showing the actual metric values for each of the last 5 years. This table should appear between the metric bar and the trend calculations (1yr, 3yr, 5yr).

## Current State

Currently, when users click "Show trends" on any metric, they see:
- Trend calculations (1 Year, 3 Year, 5 Year)
- Change in points/percentage points
- Percent change

**Missing:** The actual historical values that these trends are calculated from.

## Desired State

When users click "Show trends", they should see:

```
[Metric Bar - e.g., "ELA 17.7"]

[Historical Data Table]
Year    | Value
--------|-------
2025    | 17.9
2024    | 17.8
2023    | 17.7
2022    | 17.9
2021    | 18.6
2020    | N/A
2019    | 19.6

[Trend Calculations Table]
Period  | Change        | Percent
--------|---------------|--------
1 Year  | ↑ +0.2 points | ↑ +0.9%
3 Year  | ↑ +0.1 points | ↑ +0.3%
5 Year  | ↓ -1.6 points | ↓ -8.5%
```

## Requirements

### 1. Apply to ALL Metrics

This feature should work for:
- **ACT Scores:** ELA, Math, Science, Overall (composite)
- **Demographics:** English Learners %, Low Income %
- **Enrollment:** Total student count
- **Diversity:** White %, Black %, Hispanic %, Asian %, Pacific Islander %, Native American %, Two or More %, MENA %

### 2. Data to Display

For each metric, show the last 5 years of available data:
- **Years:** 2024, 2023, 2022, 2021, 2020, 2019 (going back from current 2025)
- **Values:** The actual metric value for that year
- **Missing Data:** Display "N/A" for years with no data (e.g., 2020 SAT scores, or 2021 if file missing)

### 3. Data Source: Backend API

The backend should include historical yearly data in the school detail API response.

#### Current Response Structure (app/models.py):

```python
class TrendWindow(BaseModel):
    yr_1: Optional[float] = None
    yr_3: Optional[float] = None
    yr_5: Optional[float] = None

class TrendMetrics(BaseModel):
    enrollment?: TrendWindow
    act?: TrendWindow
    el?: TrendWindow
    low_income?: TrendWindow
    # ... diversity metrics
```

#### Proposed New Structure:

Add a `HistoricalData` model to represent yearly values:

```python
class HistoricalYearlyData(BaseModel):
    """Historical values by year for a single metric."""
    yr_2024: Optional[float] = None
    yr_2023: Optional[float] = None
    yr_2022: Optional[float] = None
    yr_2021: Optional[float] = None
    yr_2020: Optional[float] = None
    yr_2019: Optional[float] = None

class SchoolMetrics(BaseModel):
    enrollment: Optional[int]
    act: Optional[ACTScores]
    demographics: Demographics
    diversity: Diversity
    trends: Optional[TrendMetrics]
    historical: Optional[HistoricalMetrics]  # NEW FIELD

class HistoricalMetrics(BaseModel):
    """Historical yearly data for all metrics."""
    enrollment: Optional[HistoricalYearlyData]
    act: Optional[HistoricalYearlyData]  # Overall ACT composite
    act_ela: Optional[HistoricalYearlyData]
    act_math: Optional[HistoricalYearlyData]
    act_science: Optional[HistoricalYearlyData]
    el: Optional[HistoricalYearlyData]
    low_income: Optional[HistoricalYearlyData]
    white: Optional[HistoricalYearlyData]
    black: Optional[HistoricalYearlyData]
    hispanic: Optional[HistoricalYearlyData]
    asian: Optional[HistoricalYearlyData]
    pacific_islander: Optional[HistoricalYearlyData]
    native_american: Optional[HistoricalYearlyData]
    two_or_more: Optional[HistoricalYearlyData]
    mena: Optional[HistoricalYearlyData]
```

### 4. Backend Implementation

#### Where to Get Historical Data

The historical data is already being loaded in `app/utils/import_historical_trends.py`:

- **HistoricalDataExtractor** class loads data from Excel files for years 2019-2024
- **TrendCalculator** builds time series for each metric

#### What Needs to Change

**File:** `app/utils/import_data.py` - `prepare_school_records()` function

Currently, the function:
1. Builds current school record
2. Calls `calculator.calculate_trends_for_school()` to get trend deltas
3. Updates record with trend fields

**Needs to also:**
1. Extract historical yearly values from the TrendCalculator
2. Store them in new database columns OR
3. Return them as part of the API response (computed on-the-fly)

#### Option A: Store in Database (Recommended)

Add new columns to the `School` model in `app/database.py`:

```python
# Historical yearly data (for last 5 years)
# ACT Overall
act_hist_2024 = Column(Float)
act_hist_2023 = Column(Float)
act_hist_2022 = Column(Float)
act_hist_2021 = Column(Float)
act_hist_2020 = Column(Float)
act_hist_2019 = Column(Float)

# ACT ELA
act_ela_hist_2024 = Column(Float)
# ... repeat for each ACT metric

# Enrollment
enrollment_hist_2024 = Column(Integer)
# ... repeat for each year

# Demographics
el_hist_2024 = Column(Float)
low_income_hist_2024 = Column(Float)
# ... repeat for each year

# Diversity (8 metrics × 6 years = 48 columns)
white_hist_2024 = Column(Float)
# ... etc
```

Then update `prepare_school_records()` to populate these fields using the TrendCalculator's internal series data.

#### Option B: Compute On-The-Fly (Simpler, but slower)

In `app/api/schools.py`, when building the response:
1. Instantiate HistoricalDataExtractor and TrendCalculator
2. Load historical data for the requested school
3. Build yearly series
4. Include in API response

**Trade-off:** Option B is simpler but requires re-reading Excel files on every API call. Option A stores data once during import.

### 5. Frontend Implementation

#### Files to Modify

1. **`frontend/src/lib/api/types.ts`**
   - Add `HistoricalYearlyData` interface
   - Add `HistoricalMetrics` interface
   - Update `SchoolMetrics` to include `historical` field

2. **`frontend/src/components/TrendDisplay.tsx`**
   - Add historical data table rendering
   - Show table between metric bar and trends
   - Handle N/A values for missing years

#### Example Frontend Code

```typescript
// types.ts
export interface HistoricalYearlyData {
  yr_2024?: number | null;
  yr_2023?: number | null;
  yr_2022?: number | null;
  yr_2021?: number | null;
  yr_2020?: number | null;
  yr_2019?: number | null;
}

export interface HistoricalMetrics {
  enrollment?: HistoricalYearlyData;
  act?: HistoricalYearlyData;
  act_ela?: HistoricalYearlyData;
  act_math?: HistoricalYearlyData;
  act_science?: HistoricalYearlyData;
  el?: HistoricalYearlyData;
  low_income?: HistoricalYearlyData;
  white?: HistoricalYearlyData;
  // ... other diversity metrics
}

export interface SchoolMetrics {
  enrollment: number | null;
  act: ACTScores | null;
  demographics: Demographics;
  diversity: Diversity;
  trends?: TrendMetrics;
  historical?: HistoricalMetrics;  // NEW
}
```

```tsx
// TrendDisplay.tsx - Example rendering
interface TrendDisplayProps {
  label: string;
  currentValue: number | null;
  trendData?: TrendWindow;
  historicalData?: HistoricalYearlyData;  // NEW
  metricType: 'score' | 'percentage' | 'count';
  unit: string;
}

function TrendDisplay({ label, currentValue, trendData, historicalData, metricType, unit }: TrendDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <MetricBar label={label} value={currentValue} />

      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide trends' : 'Show trends'}
      </button>

      {isOpen && (
        <div>
          {/* NEW: Historical Data Table */}
          {historicalData && (
            <HistoricalDataTable
              data={historicalData}
              metricType={metricType}
            />
          )}

          {/* Existing: Trend Calculations */}
          {trendData && (
            <TrendCalculationsTable
              data={trendData}
              currentValue={currentValue}
              unit={unit}
            />
          )}
        </div>
      )}
    </div>
  );
}

function HistoricalDataTable({ data, metricType }: { data: HistoricalYearlyData; metricType: string }) {
  const years = [2024, 2023, 2022, 2021, 2020, 2019];

  return (
    <table className="historical-data">
      <thead>
        <tr>
          <th>Year</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {years.map(year => {
          const key = `yr_${year}` as keyof HistoricalYearlyData;
          const value = data[key];

          return (
            <tr key={year}>
              <td>{year}</td>
              <td>
                {value !== null && value !== undefined
                  ? formatValue(value, metricType)
                  : 'N/A'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatValue(value: number, metricType: string): string {
  switch (metricType) {
    case 'score':
      return value.toFixed(1);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'count':
      return value.toLocaleString();
    default:
      return value.toString();
  }
}
```

### 6. Data Flow Summary

```
1. Historical Excel Files (2019-2024)
   ↓
2. HistoricalDataExtractor (import_historical_trends.py)
   - Reads files
   - Normalizes data
   - Builds yearly series
   ↓
3. Database (schools.db)
   - Stores historical yearly values
   - One row per school, multiple columns per metric/year
   ↓
4. API Response (/api/schools/{rcdts})
   - Returns current values
   - Returns trends (deltas)
   - Returns historical yearly data (NEW)
   ↓
5. Frontend (SchoolDetailView.tsx)
   - Displays metric bars
   - Shows historical table when expanded
   - Shows trend calculations below historical table
```

## Implementation Steps

### Phase 1: Backend - Database Schema

1. Update `app/database.py`:
   - Add historical yearly columns for all metrics
   - Run migration or recreate database

2. Update `app/utils/import_data.py`:
   - Modify `prepare_school_records()` to extract yearly values
   - Store them in the new columns

3. Test import:
   ```bash
   rm data/schools.db
   uv run python -m app.utils.import_data ../2025-Report-Card-Public-Data-Set.xlsx
   ```

4. Verify database:
   ```python
   from app.database import SessionLocal, School
   db = SessionLocal()
   school = db.query(School).filter(School.rcdts == '05-016-2140-17-0002').first()
   print(school.act_hist_2024, school.act_hist_2023, ...)
   ```

### Phase 2: Backend - API Response

1. Update `app/models.py`:
   - Add `HistoricalYearlyData` model
   - Add `HistoricalMetrics` model
   - Update `SchoolMetrics` to include `historical` field

2. Update `app/api/schools.py`:
   - Modify `get_school` endpoint to include historical data in response
   - Build `HistoricalMetrics` from database columns

3. Test API:
   ```bash
   curl http://localhost:8000/api/schools/05-016-2140-17-0002 | jq '.metrics.historical.act'
   ```

### Phase 3: Frontend - Types

1. Update `frontend/src/lib/api/types.ts`:
   - Add `HistoricalYearlyData` interface
   - Add `HistoricalMetrics` interface
   - Update `SchoolMetrics` interface

### Phase 4: Frontend - UI Component

1. Create `frontend/src/components/HistoricalDataTable.tsx`:
   - Component to render the yearly data table
   - Handle N/A values
   - Format based on metric type

2. Update `frontend/src/components/TrendDisplay.tsx`:
   - Accept `historicalData` prop
   - Render `HistoricalDataTable` when expanded
   - Place between metric bar and trends

3. Update `frontend/src/components/SchoolDetailView.tsx`:
   - Pass `school.metrics.historical.act` to ACT trends
   - Pass `school.metrics.historical.enrollment` to enrollment trends
   - Pass demographic and diversity historical data to respective components

### Phase 5: Testing

1. **Elk Grove High School (05-016-2140-17-0002)**
   - Verify ACT historical data shows: 2024: 17.8, 2023: 17.7, 2022: 17.9, 2021: 18.6, 2020: N/A, 2019: 19.6
   - Verify enrollment shows proper values for all years
   - Verify demographics show proper values

2. **Edge Cases**
   - School with missing data for multiple years
   - Elementary school (no ACT data at all)
   - New school (only 1-2 years of data)

## Technical Notes

### ACT Score Considerations

- **Overall ACT:** Should show the composite (ELA + Math) / 2 for historical years
- **Individual ACT Metrics:** ELA, Math, Science are separate
- **SAT Conversion:** Historical ACT values come from SAT-to-ACT conversion (see `sat_to_act_precise` in `import_historical_trends.py`)
- **Decimal Precision:** Values like 17.8, 18.6, 19.6 (not whole numbers)

### Data Availability by Year

| Year | Demographics | SAT | ACT (Direct) |
|------|--------------|-----|--------------|
| 2024 | ✓ | ✓ | - |
| 2023 | ✓ | ✓ | - |
| 2022 | ✓ | ✓ | - |
| 2021 | ✓ | ✓ | - |
| 2020 | ✓ | ✗ (COVID) | - |
| 2019 | ✓ | ✓ | - |
| 2017 | - | - | ✓ |
| 2016 | - | - | ✓ |
| 2015 | - | - | ✓ |

For ACT display, show 2024-2019 (converted from SAT where available).

### Formatting by Metric Type

| Metric Type | Format | Example |
|-------------|--------|---------|
| ACT Score | 1 decimal | 17.8 |
| Percentage | 1 decimal + % | 38.4% |
| Enrollment | Comma separated | 1,775 |

### Column Naming Convention

For database columns, use pattern: `{metric}_hist_{year}`

Examples:
- `act_hist_2024`
- `enrollment_hist_2024`
- `el_hist_2024`
- `low_income_hist_2024`
- `white_hist_2024`

This matches the existing trend column pattern: `{metric}_trend_{N}yr`

## Related Files

### Backend
- `app/database.py` - Add historical columns
- `app/models.py` - Add historical response models
- `app/api/schools.py` - Include historical data in API response
- `app/utils/import_data.py` - Populate historical data during import
- `app/utils/import_historical_trends.py` - Source of historical yearly data

### Frontend
- `frontend/src/lib/api/types.ts` - TypeScript interfaces
- `frontend/src/components/TrendDisplay.tsx` - Display component
- `frontend/src/components/HistoricalDataTable.tsx` - New component (create)
- `frontend/src/components/SchoolDetailView.tsx` - Pass historical data to children

## Example: Full ACT Display (Expanded)

```
ACT Scores
Average Grade 11 performance (out of 36)

ELA                                                           17.7
[========================================                    ]

▲ Hide trends

Historical Data
Year    | Score
--------|------
2024    | 17.8
2023    | 17.7
2022    | 17.9
2021    | 18.6
2020    | N/A
2019    | 19.6

Trends
Period  | Change        | Percent
--------|---------------|--------
1 Year  | ↑ +0.2 points | ↑ +0.9%
3 Year  | ↑ +0.1 points | ↑ +0.3%
5 Year  | ↓ -1.6 points | ↓ -8.5%
```

## Success Criteria

✅ All metrics show historical yearly data when trends are expanded
✅ Data displays for last 5 available years (2024, 2023, 2022, 2021, 2019)
✅ Missing years (like 2020 SAT) show "N/A"
✅ Values are formatted correctly (decimals, percentages, commas)
✅ Historical table appears BETWEEN metric bar and trend calculations
✅ Backend includes historical data in API response
✅ No performance degradation (data should be pre-computed during import)

## Questions for Implementation

If you encounter ambiguity during implementation:

1. **Database vs. On-the-Fly:** Should historical data be stored in database or computed on each API call?
   - **Recommendation:** Store in database (Option A) for performance

2. **ACT Sub-Metrics:** Should ACT ELA, Math, Science each have their own historical data?
   - **Answer:** Yes, each should have separate historical yearly values

3. **Styling:** Should historical table use same styling as trend table?
   - **Answer:** Yes, consistent styling for both tables

4. **Mobile View:** How should this display on mobile?
   - **Answer:** Follow existing responsive patterns for trend tables
