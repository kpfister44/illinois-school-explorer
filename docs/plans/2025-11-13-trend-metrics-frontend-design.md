# Trend Metrics Frontend Display Design

**Date:** 2025-11-13
**Status:** Approved

## Overview

Display historical trend metrics (1/3/5-year deltas) in the SchoolDetailView component using expandable sections. Each metric that has trend data will get an independent "Show trends" button that reveals a structured table of changes over time.

## Design Decisions

### UI Pattern: Expandable Sections
- Each metric has its own "Show trends" button below the metric display
- Buttons expand/collapse independently (no accordion behavior)
- All three time windows (1/3/5 year) visible at once when expanded
- Disabled button with tooltip when no trend data available

### Visual Treatment
- **Directional indicators only**: Use arrows (↑↓→) without color coding to avoid value judgments
- **Dual metrics**: Show both absolute change ("+50 students") and percentage change ("↑ 2.9%")
- **Units explicit**: Always include units ("students", "points", "percentage points") for clarity

### Button Style
- Component: shadcn Button with `variant="ghost"` and `size="sm"`
- Text: "Show trends" / "Hide trends"
- Icon: ChevronDown/ChevronUp from lucide-react
- Position: Below each metric display

### Expanded Layout
Structured table format:
```
Period    Change            Percent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 Year    ↓ 2.5 points      ↓ 12%
3 Year    ↓ 1.2 points      ↓ 6%
5 Year    ↑ 0.8 points      ↑ 4%
```

## Component Architecture

### New Components

#### TrendDisplay
**Purpose:** Encapsulates expand/collapse state and conditional rendering
**Props:**
```typescript
interface TrendDisplayProps {
  label: string;              // "Enrollment", "ACT ELA", etc.
  currentValue: number;       // Current metric value
  trendData: TrendWindow;     // The three time windows
  metricType: 'count' | 'score' | 'percentage';
  unit: string;               // "students", "points", "percentage points"
}
```

#### TrendTable
**Purpose:** Pure presentational component for the trend table
**Props:**
```typescript
interface TrendTableProps {
  currentValue: number;
  trendData: TrendWindow;
  metricType: string;
  unit: string;
}
```

### Component Hierarchy
```
SchoolDetailView
├── Overview Tab
│   ├── Enrollment Card
│   │   └── TrendDisplay
├── Academics Tab
│   ├── ACT ELA
│   │   └── TrendDisplay
│   ├── ACT Math
│   │   └── TrendDisplay
│   ├── ACT Science
│   │   └── TrendDisplay
│   └── ACT Overall
│       └── TrendDisplay
└── Demographics Tab
    ├── English Learners
    │   └── TrendDisplay
    ├── Low Income
    │   └── TrendDisplay
    └── Diversity (each category)
        └── TrendDisplay
```

## Data Flow

### TypeScript Types
Add to `/frontend/src/lib/api/types.ts`:

```typescript
export interface TrendWindow {
  one_year: number | null;
  three_year: number | null;
  five_year: number | null;
}

export interface TrendMetrics {
  enrollment?: TrendWindow;
  act_ela?: TrendWindow;
  act_math?: TrendWindow;
  act_science?: TrendWindow;
  act_overall?: TrendWindow;
  el_percentage?: TrendWindow;
  low_income_percentage?: TrendWindow;
  white?: TrendWindow;
  black?: TrendWindow;
  hispanic?: TrendWindow;
  asian?: TrendWindow;
  two_or_more?: TrendWindow;
}

export interface SchoolMetrics {
  enrollment: number | null;
  act: ACTScores;
  demographics: Demographics;
  diversity: Diversity;
  trends?: TrendMetrics;
}
```

### Backend Integration
- Backend returns flat fields: `enrollment_trend_1yr`, `enrollment_trend_3yr`, etc.
- Map to nested `trends` object in API client or handle flat structure directly
- No backend changes required

## Utility Functions

Create `/frontend/src/lib/trendUtils.ts`:

### calculatePercentageChange(current: number, delta: number): number | null
- Formula: `delta / (current - delta) × 100`
- Returns null if calculation is invalid or misleading
- Handles division by zero

### shouldShowPercentage(current: number, metricType: string): boolean
Thresholds by metric type:
- **Enrollment**: current >= 50 students
- **ACT scores**: current >= 10.0 points
- **Demographics/Diversity**: current >= 5.0 percent

### formatTrendValue(delta: number, unit: string): string
- Returns "+50 students", "-2.5 points", etc.
- Includes sign prefix

### formatPercentage(percent: number | null): string
- Returns "+12.3%" or "—" if null/suppressed
- 1 decimal place

### getTrendArrow(delta: number): string
- Returns "↑" (positive), "↓" (negative), "→" (zero/near-zero)
- Threshold: < 0.05 considered zero

## Integration Points

### SchoolDetailView Changes
Minimal modifications - insert TrendDisplay components below existing metric displays.

**Example pattern:**
```tsx
{school.metrics.act.ela_avg !== null && (
  <div>
    <div className="flex justify-between mb-2">
      <span>ELA</span>
      <span>{school.metrics.act.ela_avg.toFixed(1)}</span>
    </div>
    <Progress value={(school.metrics.act.ela_avg / 36) * 100} />
    <TrendDisplay
      label="ACT ELA"
      currentValue={school.metrics.act.ela_avg}
      trendData={school.metrics.trends?.act_ela}
      metricType="score"
      unit="points"
    />
  </div>
)}
```

### Metrics Coverage
Every metric with backend trend data gets TrendDisplay:
- Enrollment (Overview tab)
- ACT scores: ELA, Math, Science, Overall (Academics tab)
- Demographics: EL %, Low Income % (Demographics tab)
- Diversity: all racial/ethnic percentages (Demographics tab)

## Edge Cases

### Missing Data Scenarios
1. **No trend data at all**: Show disabled button with tooltip "Trend data unavailable"
2. **Partial trend data**: Show available windows, display "N/A" for missing ones
3. **Null current value**: Don't render TrendDisplay component
4. **Zero historical value**: Suppress percentage, show absolute change only
5. **Very small base values**: Suppress percentage per thresholds
6. **Near-zero deltas**: Show → arrow (threshold: < 0.05)

## Testing Strategy

### Unit Tests

**trendUtils.test.ts:**
- Percentage calculation with various inputs
- Threshold checks for each metric type
- Edge cases: null, zero, very small values
- All formatting functions

**TrendDisplay.test.tsx:**
- Renders button when trend data exists
- Shows disabled button when no trend data
- Expands/collapses on click
- Doesn't render if current value is null

**TrendTable.test.tsx:**
- Displays all three windows correctly
- Shows "N/A" for missing windows
- Formats arrows and percentages
- Handles null/undefined gracefully

### Integration Tests

**SchoolDetailView.test.tsx updates:**
- TrendDisplay components render in correct locations
- Trend data flows through props correctly
- Multiple trend sections can be open simultaneously

### Manual Testing Checklist
- School with full trend data (all windows)
- School with partial trend data (only 1yr)
- School with no trend data
- Edge cases: very small enrollment, new schools
- Disabled button tooltips
- Responsive layout on mobile

## Formatting Rules

### By Metric Type

**Enrollment (count):**
- Format: whole numbers
- Unit: "students"
- Example: "+50 students"

**ACT Scores (score):**
- Format: 1 decimal place
- Unit: "points"
- Example: "-2.5 points"

**Demographics/Diversity (percentage):**
- Format: 1 decimal place
- Unit: "percentage points"
- Example: "+3.2 percentage points"

**Percentages:**
- Format: 1 decimal place with % symbol
- Display: "—" if suppressed or incalculable
- Example: "↑ 12.3%"

## Implementation Notes

### File Structure
```
frontend/src/
├── components/
│   ├── SchoolDetailView.tsx (modify)
│   ├── TrendDisplay.tsx (new)
│   └── TrendTable.tsx (new)
├── lib/
│   ├── api/types.ts (modify - add trend types)
│   └── trendUtils.ts (new)
└── tests/
    ├── components/
    │   ├── SchoolDetailView.test.tsx (modify)
    │   ├── TrendDisplay.test.tsx (new)
    │   └── TrendTable.test.tsx (new)
    └── lib/
        └── trendUtils.test.ts (new)
```

### Dependencies
- No new external dependencies required
- Uses existing shadcn/ui components (Button, Tooltip)
- Uses lucide-react icons (ChevronDown, ChevronUp)

## Success Criteria

1. ✓ All metrics with trend data display expandable trend sections
2. ✓ Trends show 1/3/5-year windows with absolute and percentage changes
3. ✓ Percentage calculations handle edge cases correctly
4. ✓ Missing data displays appropriately (disabled buttons, N/A values)
5. ✓ UI integrates seamlessly with existing SchoolDetailView design
6. ✓ All components have comprehensive test coverage
7. ✓ Responsive on mobile devices
