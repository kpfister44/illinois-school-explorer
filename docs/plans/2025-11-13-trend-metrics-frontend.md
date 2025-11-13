# Trend Metrics Frontend Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display historical trend metrics (1/3/5-year deltas) in the SchoolDetailView component using expandable sections with structured tables showing absolute and percentage changes.

**Architecture:** Create reusable TrendDisplay and TrendTable components that integrate below existing metrics in SchoolDetailView. Use utility functions for percentage calculation with metric-specific thresholds. Frontend-only implementation, no backend changes required.

**Tech Stack:** React, TypeScript, shadcn/ui (Button, Tooltip), lucide-react (icons), Vitest

---

## Task 1: Add TypeScript Trend Types

**Files:**
- Modify: `frontend/src/lib/api/types.ts`

**Step 1: Add trend type definitions**

Add after the `Diversity` interface (around line 39):

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
  pacific_islander?: TrendWindow;
  native_american?: TrendWindow;
  two_or_more?: TrendWindow;
  mena?: TrendWindow;
}
```

**Step 2: Update SchoolMetrics interface**

Modify the `SchoolMetrics` interface (around line 41) to add trends field:

```typescript
export interface SchoolMetrics {
  enrollment: number | null;
  act: ACTScores;
  demographics: Demographics;
  diversity: Diversity;
  trends?: TrendMetrics;  // Add this line
}
```

**Step 3: Commit type definitions**

```bash
cd frontend
git add src/lib/api/types.ts
git commit -m "feat(types): add trend metrics type definitions"
```

---

## Task 2: Create Trend Utility Functions

**Files:**
- Create: `frontend/src/lib/trendUtils.ts`
- Create: `frontend/src/lib/trendUtils.test.ts`

**Step 1: Write failing tests for getTrendArrow**

Create `frontend/src/lib/trendUtils.test.ts`:

```typescript
// ABOUTME: Unit tests for trend utility functions
// ABOUTME: Tests percentage calculation, formatting, and thresholds

import { describe, it, expect } from 'vitest';
import {
  getTrendArrow,
  formatTrendValue,
  formatPercentage,
  shouldShowPercentage,
  calculatePercentageChange,
} from './trendUtils';

describe('getTrendArrow', () => {
  it('returns up arrow for positive delta', () => {
    expect(getTrendArrow(5)).toBe('↑');
  });

  it('returns down arrow for negative delta', () => {
    expect(getTrendArrow(-5)).toBe('↓');
  });

  it('returns right arrow for zero delta', () => {
    expect(getTrendArrow(0)).toBe('→');
  });

  it('returns right arrow for near-zero positive delta', () => {
    expect(getTrendArrow(0.03)).toBe('→');
  });

  it('returns right arrow for near-zero negative delta', () => {
    expect(getTrendArrow(-0.04)).toBe('→');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend
npm test src/lib/trendUtils.test.ts
```

Expected: FAIL with "Cannot find module './trendUtils'"

**Step 3: Implement getTrendArrow**

Create `frontend/src/lib/trendUtils.ts`:

```typescript
// ABOUTME: Utility functions for trend metric calculations and formatting
// ABOUTME: Handles percentage calculation, thresholds, and display formatting

const ZERO_THRESHOLD = 0.05;

export function getTrendArrow(delta: number): string {
  if (Math.abs(delta) < ZERO_THRESHOLD) {
    return '→';
  }
  return delta > 0 ? '↑' : '↓';
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: PASS (5 tests)

**Step 5: Write failing tests for formatTrendValue**

Add to `trendUtils.test.ts`:

```typescript
describe('formatTrendValue', () => {
  it('formats positive integer with plus sign and unit', () => {
    expect(formatTrendValue(50, 'students')).toBe('+50 students');
  });

  it('formats negative integer with minus sign and unit', () => {
    expect(formatTrendValue(-50, 'students')).toBe('-50 students');
  });

  it('formats positive decimal with one decimal place', () => {
    expect(formatTrendValue(2.5, 'points')).toBe('+2.5 points');
  });

  it('formats negative decimal with one decimal place', () => {
    expect(formatTrendValue(-2.5, 'points')).toBe('-2.5 points');
  });

  it('formats zero', () => {
    expect(formatTrendValue(0, 'students')).toBe('0 students');
  });

  it('rounds to one decimal place', () => {
    expect(formatTrendValue(2.567, 'points')).toBe('+2.6 points');
  });
});
```

**Step 6: Run test to verify it fails**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: FAIL with "formatTrendValue is not a function"

**Step 7: Implement formatTrendValue**

Add to `trendUtils.ts`:

```typescript
export function formatTrendValue(delta: number, unit: string): string {
  const roundedDelta = Math.round(delta * 10) / 10;
  const sign = roundedDelta > 0 ? '+' : '';
  return `${sign}${roundedDelta} ${unit}`;
}
```

**Step 8: Run test to verify it passes**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: PASS (11 tests)

**Step 9: Write failing tests for formatPercentage**

Add to `trendUtils.test.ts`:

```typescript
describe('formatPercentage', () => {
  it('formats positive percentage with plus sign', () => {
    expect(formatPercentage(12.3)).toBe('+12.3%');
  });

  it('formats negative percentage with minus sign', () => {
    expect(formatPercentage(-12.3)).toBe('-12.3%');
  });

  it('formats zero percentage', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('returns em dash for null', () => {
    expect(formatPercentage(null)).toBe('—');
  });

  it('rounds to one decimal place', () => {
    expect(formatPercentage(12.367)).toBe('+12.4%');
  });
});
```

**Step 10: Run test to verify it fails**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: FAIL

**Step 11: Implement formatPercentage**

Add to `trendUtils.ts`:

```typescript
export function formatPercentage(percent: number | null): string {
  if (percent === null) {
    return '—';
  }
  const rounded = Math.round(percent * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toFixed(1)}%`;
}
```

**Step 12: Run test to verify it passes**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: PASS (16 tests)

**Step 13: Write failing tests for shouldShowPercentage**

Add to `trendUtils.test.ts`:

```typescript
describe('shouldShowPercentage', () => {
  describe('enrollment (count)', () => {
    it('returns true when current >= 50', () => {
      expect(shouldShowPercentage(50, 'count')).toBe(true);
      expect(shouldShowPercentage(100, 'count')).toBe(true);
    });

    it('returns false when current < 50', () => {
      expect(shouldShowPercentage(49, 'count')).toBe(false);
      expect(shouldShowPercentage(10, 'count')).toBe(false);
    });
  });

  describe('ACT scores (score)', () => {
    it('returns true when current >= 10.0', () => {
      expect(shouldShowPercentage(10.0, 'score')).toBe(true);
      expect(shouldShowPercentage(20.5, 'score')).toBe(true);
    });

    it('returns false when current < 10.0', () => {
      expect(shouldShowPercentage(9.9, 'score')).toBe(false);
      expect(shouldShowPercentage(5.0, 'score')).toBe(false);
    });
  });

  describe('demographics/diversity (percentage)', () => {
    it('returns true when current >= 5.0', () => {
      expect(shouldShowPercentage(5.0, 'percentage')).toBe(true);
      expect(shouldShowPercentage(25.5, 'percentage')).toBe(true);
    });

    it('returns false when current < 5.0', () => {
      expect(shouldShowPercentage(4.9, 'percentage')).toBe(false);
      expect(shouldShowPercentage(1.0, 'percentage')).toBe(false);
    });
  });
});
```

**Step 14: Run test to verify it fails**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: FAIL

**Step 15: Implement shouldShowPercentage**

Add to `trendUtils.ts`:

```typescript
const THRESHOLDS = {
  count: 50,
  score: 10.0,
  percentage: 5.0,
};

export function shouldShowPercentage(current: number, metricType: 'count' | 'score' | 'percentage'): boolean {
  return current >= THRESHOLDS[metricType];
}
```

**Step 16: Run test to verify it passes**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: PASS (26 tests)

**Step 17: Write failing tests for calculatePercentageChange**

Add to `trendUtils.test.ts`:

```typescript
describe('calculatePercentageChange', () => {
  it('calculates positive percentage change', () => {
    const result = calculatePercentageChange(100, 10, 'count');
    expect(result).toBeCloseTo(11.11, 1);
  });

  it('calculates negative percentage change', () => {
    const result = calculatePercentageChange(100, -10, 'count');
    expect(result).toBeCloseTo(-9.09, 1);
  });

  it('returns null when current value below threshold', () => {
    expect(calculatePercentageChange(40, 5, 'count')).toBe(null);
    expect(calculatePercentageChange(8.0, 1.0, 'score')).toBe(null);
    expect(calculatePercentageChange(3.0, 0.5, 'percentage')).toBe(null);
  });

  it('returns null when historical value would be zero', () => {
    expect(calculatePercentageChange(10, 10, 'count')).toBe(null);
  });

  it('returns null when historical value would be negative', () => {
    expect(calculatePercentageChange(10, 15, 'count')).toBe(null);
  });

  it('handles delta of zero', () => {
    const result = calculatePercentageChange(100, 0, 'count');
    expect(result).toBe(0);
  });
});
```

**Step 18: Run test to verify it fails**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: FAIL

**Step 19: Implement calculatePercentageChange**

Add to `trendUtils.ts`:

```typescript
export function calculatePercentageChange(
  current: number,
  delta: number,
  metricType: 'count' | 'score' | 'percentage'
): number | null {
  // Check if current value meets threshold
  if (!shouldShowPercentage(current, metricType)) {
    return null;
  }

  // Handle zero delta
  if (delta === 0) {
    return 0;
  }

  // Calculate historical value
  const historical = current - delta;

  // Can't calculate percentage if historical was zero or negative
  if (historical <= 0) {
    return null;
  }

  // Calculate percentage change
  return (delta / historical) * 100;
}
```

**Step 20: Run test to verify it passes**

```bash
npm test src/lib/trendUtils.test.ts
```

Expected: PASS (32 tests)

**Step 21: Commit utility functions**

```bash
git add src/lib/trendUtils.ts src/lib/trendUtils.test.ts
git commit -m "feat(utils): add trend calculation and formatting utilities"
```

---

## Task 3: Create TrendTable Component

**Files:**
- Create: `frontend/src/components/TrendTable.tsx`
- Create: `frontend/src/components/TrendTable.test.tsx`

**Step 1: Write failing tests for TrendTable**

Create `frontend/src/components/TrendTable.test.tsx`:

```typescript
// ABOUTME: Tests for TrendTable component
// ABOUTME: Verifies trend data display and formatting

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrendTable from './TrendTable';
import type { TrendWindow } from '@/lib/api/types';

describe('TrendTable', () => {
  const mockTrendData: TrendWindow = {
    one_year: 50,
    three_year: 125,
    five_year: 200,
  };

  it('renders all three time windows', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText('1 Year')).toBeInTheDocument();
    expect(screen.getByText('3 Year')).toBeInTheDocument();
    expect(screen.getByText('5 Year')).toBeInTheDocument();
  });

  it('displays formatted trend values with units', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText('+50 students')).toBeInTheDocument();
    expect(screen.getByText('+125 students')).toBeInTheDocument();
    expect(screen.getByText('+200 students')).toBeInTheDocument();
  });

  it('displays percentage changes when above threshold', () => {
    render(
      <TrendTable
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText(/\+2\.9%/)).toBeInTheDocument(); // 50/1725 = 2.9%
  });

  it('displays N/A for null trend windows', () => {
    const partialData: TrendWindow = {
      one_year: 50,
      three_year: null,
      five_year: null,
    };

    render(
      <TrendTable
        currentValue={1775}
        trendData={partialData}
        metricType="count"
        unit="students"
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements).toHaveLength(4); // 2 for change, 2 for percent
  });

  it('displays arrows based on trend direction', () => {
    const mixedData: TrendWindow = {
      one_year: 50,
      three_year: -25,
      five_year: 0,
    };

    render(
      <TrendTable
        currentValue={100}
        trendData={mixedData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText(/↑.*\+50/)).toBeInTheDocument();
    expect(screen.getByText(/↓.*-25/)).toBeInTheDocument();
    expect(screen.getByText(/→.*0/)).toBeInTheDocument();
  });

  it('suppresses percentage when below threshold', () => {
    render(
      <TrendTable
        currentValue={30}
        trendData={{ one_year: 5, three_year: null, five_year: null }}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByText('+5 students')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument(); // Em dash for suppressed percentage
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/components/TrendTable.test.tsx
```

Expected: FAIL with "Cannot find module './TrendTable'"

**Step 3: Implement TrendTable component**

Create `frontend/src/components/TrendTable.tsx`:

```typescript
// ABOUTME: Presentational component for displaying trend data
// ABOUTME: Shows 1/3/5-year windows with absolute and percentage changes

import type { TrendWindow } from '@/lib/api/types';
import {
  getTrendArrow,
  formatTrendValue,
  formatPercentage,
  calculatePercentageChange,
} from '@/lib/trendUtils';

interface TrendTableProps {
  currentValue: number;
  trendData: TrendWindow;
  metricType: 'count' | 'score' | 'percentage';
  unit: string;
}

interface TrendRow {
  label: string;
  delta: number | null;
}

export default function TrendTable({ currentValue, trendData, metricType, unit }: TrendTableProps) {
  const rows: TrendRow[] = [
    { label: '1 Year', delta: trendData.one_year },
    { label: '3 Year', delta: trendData.three_year },
    { label: '5 Year', delta: trendData.five_year },
  ];

  return (
    <div className="mt-2 text-sm">
      <table className="w-full">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-2">Period</th>
            <th className="text-left font-medium pb-2">Change</th>
            <th className="text-left font-medium pb-2">Percent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.delta === null) {
              return (
                <tr key={row.label} className="border-t border-border">
                  <td className="py-2">{row.label}</td>
                  <td className="py-2 text-muted-foreground">N/A</td>
                  <td className="py-2 text-muted-foreground">N/A</td>
                </tr>
              );
            }

            const arrow = getTrendArrow(row.delta);
            const changeText = formatTrendValue(row.delta, unit);
            const percentage = calculatePercentageChange(currentValue, row.delta, metricType);
            const percentText = formatPercentage(percentage);

            return (
              <tr key={row.label} className="border-t border-border">
                <td className="py-2">{row.label}</td>
                <td className="py-2">
                  {arrow} {changeText}
                </td>
                <td className="py-2">
                  {arrow} {percentText}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/components/TrendTable.test.tsx
```

Expected: PASS (6 tests)

**Step 5: Commit TrendTable component**

```bash
git add src/components/TrendTable.tsx src/components/TrendTable.test.tsx
git commit -m "feat(components): add TrendTable component"
```

---

## Task 4: Create TrendDisplay Component

**Files:**
- Create: `frontend/src/components/TrendDisplay.tsx`
- Create: `frontend/src/components/TrendDisplay.test.tsx`

**Step 1: Write failing tests for TrendDisplay**

Create `frontend/src/components/TrendDisplay.test.tsx`:

```typescript
// ABOUTME: Tests for TrendDisplay component
// ABOUTME: Verifies expand/collapse behavior and data handling

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrendDisplay from './TrendDisplay';
import type { TrendWindow } from '@/lib/api/types';

describe('TrendDisplay', () => {
  const mockTrendData: TrendWindow = {
    one_year: 50,
    three_year: 125,
    five_year: 200,
  };

  it('renders show trends button by default', () => {
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.getByRole('button', { name: /show trends/i })).toBeInTheDocument();
  });

  it('does not render trend table initially', () => {
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    expect(screen.queryByText('1 Year')).not.toBeInTheDocument();
  });

  it('shows trend table when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    await user.click(button);

    expect(screen.getByText('1 Year')).toBeInTheDocument();
    expect(screen.getByText('3 Year')).toBeInTheDocument();
    expect(screen.getByText('5 Year')).toBeInTheDocument();
  });

  it('changes button text to hide trends when expanded', async () => {
    const user = userEvent.setup();
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    await user.click(button);

    expect(screen.getByRole('button', { name: /hide trends/i })).toBeInTheDocument();
  });

  it('hides trend table when hide button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={mockTrendData}
        metricType="count"
        unit="students"
      />
    );

    const showButton = screen.getByRole('button', { name: /show trends/i });
    await user.click(showButton);

    const hideButton = screen.getByRole('button', { name: /hide trends/i });
    await user.click(hideButton);

    expect(screen.queryByText('1 Year')).not.toBeInTheDocument();
  });

  it('renders disabled button when trend data is null', () => {
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={null}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    expect(button).toBeDisabled();
  });

  it('renders disabled button when trend data is undefined', () => {
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={undefined}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    expect(button).toBeDisabled();
  });

  it('does not expand when clicking disabled button', async () => {
    const user = userEvent.setup();
    render(
      <TrendDisplay
        label="Enrollment"
        currentValue={1775}
        trendData={null}
        metricType="count"
        unit="students"
      />
    );

    const button = screen.getByRole('button', { name: /show trends/i });
    await user.click(button);

    expect(screen.queryByText('1 Year')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/components/TrendDisplay.test.tsx
```

Expected: FAIL with "Cannot find module './TrendDisplay'"

**Step 3: Implement TrendDisplay component**

Create `frontend/src/components/TrendDisplay.tsx`:

```typescript
// ABOUTME: Expandable trend display component
// ABOUTME: Handles expand/collapse state and conditional rendering

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TrendTable from './TrendTable';
import type { TrendWindow } from '@/lib/api/types';

interface TrendDisplayProps {
  label: string;
  currentValue: number;
  trendData: TrendWindow | null | undefined;
  metricType: 'count' | 'score' | 'percentage';
  unit: string;
}

export default function TrendDisplay({
  label,
  currentValue,
  trendData,
  metricType,
  unit,
}: TrendDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasTrendData = trendData !== null && trendData !== undefined;

  const handleToggle = () => {
    if (hasTrendData) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="mt-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={!hasTrendData}
              className="h-8 px-2 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-1 h-3 w-3" />
                  Hide trends
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-3 w-3" />
                  Show trends
                </>
              )}
            </Button>
          </TooltipTrigger>
          {!hasTrendData && (
            <TooltipContent>
              <p>Trend data unavailable</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {isExpanded && hasTrendData && (
        <TrendTable
          currentValue={currentValue}
          trendData={trendData}
          metricType={metricType}
          unit={unit}
        />
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/components/TrendDisplay.test.tsx
```

Expected: PASS (8 tests)

**Step 5: Check if Tooltip component exists**

```bash
ls src/components/ui/tooltip.tsx
```

If file doesn't exist, install it:

```bash
npx shadcn@latest add tooltip
```

**Step 6: Run all component tests**

```bash
npm test src/components/TrendDisplay.test.tsx src/components/TrendTable.test.tsx
```

Expected: PASS (14 tests total)

**Step 7: Commit TrendDisplay component**

```bash
git add src/components/TrendDisplay.tsx src/components/TrendDisplay.test.tsx
git commit -m "feat(components): add TrendDisplay component with expand/collapse"
```

---

## Task 5: Integrate TrendDisplay into SchoolDetailView - Overview Tab

**Files:**
- Modify: `frontend/src/components/SchoolDetailView.tsx`
- Modify: `frontend/src/components/SchoolDetailView.test.tsx`

**Step 1: Write failing test for enrollment trend display**

Add to `frontend/src/components/SchoolDetailView.test.tsx` (after existing tests):

```typescript
import userEvent from '@testing-library/user-event';

describe('Trend Display', () => {
  it('displays trend button for enrollment', () => {
    const schoolWithTrends: SchoolDetail = {
      ...mockSchool,
      metrics: {
        ...mockSchool.metrics,
        trends: {
          enrollment: {
            one_year: 50,
            three_year: 125,
            five_year: 200,
          },
        },
      },
    };

    render(<SchoolDetailView school={schoolWithTrends} />);
    expect(screen.getByRole('button', { name: /show trends/i })).toBeInTheDocument();
  });

  it('shows enrollment trend data when expanded', async () => {
    const user = userEvent.setup();
    const schoolWithTrends: SchoolDetail = {
      ...mockSchool,
      metrics: {
        ...mockSchool.metrics,
        enrollment: 1775,
        trends: {
          enrollment: {
            one_year: 50,
            three_year: 125,
            five_year: 200,
          },
        },
      },
    };

    render(<SchoolDetailView school={schoolWithTrends} />);

    const button = screen.getByRole('button', { name: /show trends/i });
    await user.click(button);

    expect(screen.getByText('+50 students')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/components/SchoolDetailView.test.tsx
```

Expected: FAIL with "Unable to find role button with name /show trends/i"

**Step 3: Import TrendDisplay in SchoolDetailView**

Add import at top of `frontend/src/components/SchoolDetailView.tsx` (around line 11):

```typescript
import TrendDisplay from '@/components/TrendDisplay';
```

**Step 4: Add TrendDisplay to enrollment card**

Modify the enrollment card in the Overview tab (around line 94-104) to add TrendDisplay after CardContent:

```typescript
<TabsContent value="overview" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>Enrollment</CardTitle>
      <CardDescription>Total student population</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-bold">
        {formatNumber(school.metrics.enrollment)}
      </p>
      {school.metrics.enrollment !== null && (
        <TrendDisplay
          label="Enrollment"
          currentValue={school.metrics.enrollment}
          trendData={school.metrics.trends?.enrollment}
          metricType="count"
          unit="students"
        />
      )}
    </CardContent>
  </Card>
</TabsContent>
```

**Step 5: Run test to verify it passes**

```bash
npm test src/components/SchoolDetailView.test.tsx
```

Expected: PASS

**Step 6: Run dev server and manually verify**

```bash
npm run dev
```

Navigate to a school detail page and verify the "Show trends" button appears below enrollment.

**Step 7: Commit Overview tab integration**

```bash
git add src/components/SchoolDetailView.tsx src/components/SchoolDetailView.test.tsx
git commit -m "feat(school-detail): add trend display to enrollment metric"
```

---

## Task 6: Integrate TrendDisplay into SchoolDetailView - Academics Tab

**Files:**
- Modify: `frontend/src/components/SchoolDetailView.tsx`
- Modify: `frontend/src/components/SchoolDetailView.test.tsx`

**Step 1: Write failing test for ACT trend displays**

Add to the 'Trend Display' describe block in `SchoolDetailView.test.tsx`:

```typescript
it('shows ACT ELA trend button in academics tab', async () => {
  const user = userEvent.setup();
  const schoolWithTrends: SchoolDetail = {
    ...mockSchool,
    metrics: {
      ...mockSchool.metrics,
      act: {
        ela_avg: 17.7,
        math_avg: 18.2,
        science_avg: 18.9,
        overall_avg: 17.95,
      },
      trends: {
        act_ela: {
          one_year: -0.5,
          three_year: -1.2,
          five_year: 0.8,
        },
      },
    },
  };

  render(<SchoolDetailView school={schoolWithTrends} />);

  // Click academics tab
  const academicsTab = screen.getByRole('tab', { name: /academics/i });
  await user.click(academicsTab);

  // Find trend button (there may be multiple)
  const trendButtons = screen.getAllByRole('button', { name: /show trends/i });
  expect(trendButtons.length).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/components/SchoolDetailView.test.tsx
```

Expected: FAIL

**Step 3: Add TrendDisplay to ACT ELA section**

Modify the ACT ELA section in the Academics tab (around line 114-124):

```typescript
{school.metrics.act.ela_avg !== null && (
  <div>
    <div className="flex justify-between mb-2">
      <span className="text-sm font-medium">ELA</span>
      <span className="text-sm font-bold">
        {school.metrics.act.ela_avg.toFixed(1)}
      </span>
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

**Step 4: Add TrendDisplay to ACT Math section**

Modify the ACT Math section (around line 125-135):

```typescript
{school.metrics.act.math_avg !== null && (
  <div>
    <div className="flex justify-between mb-2">
      <span className="text-sm font-medium">Math</span>
      <span className="text-sm font-bold">
        {school.metrics.act.math_avg.toFixed(1)}
      </span>
    </div>
    <Progress value={(school.metrics.act.math_avg / 36) * 100} />
    <TrendDisplay
      label="ACT Math"
      currentValue={school.metrics.act.math_avg}
      trendData={school.metrics.trends?.act_math}
      metricType="score"
      unit="points"
    />
  </div>
)}
```

**Step 5: Add TrendDisplay to ACT Science section**

Modify the ACT Science section (around line 136-146):

```typescript
{school.metrics.act.science_avg !== null && (
  <div>
    <div className="flex justify-between mb-2">
      <span className="text-sm font-medium">Science</span>
      <span className="text-sm font-bold">
        {school.metrics.act.science_avg.toFixed(1)}
      </span>
    </div>
    <Progress value={(school.metrics.act.science_avg / 36) * 100} />
    <TrendDisplay
      label="ACT Science"
      currentValue={school.metrics.act.science_avg}
      trendData={school.metrics.trends?.act_science}
      metricType="score"
      unit="points"
    />
  </div>
)}
```

**Step 6: Add TrendDisplay to ACT Overall section**

Modify the ACT Overall section (around line 147-157):

```typescript
{school.metrics.act.overall_avg !== null && (
  <div>
    <div className="flex justify-between mb-2">
      <span className="text-sm font-medium">Overall</span>
      <span className="text-sm font-bold">
        {school.metrics.act.overall_avg.toFixed(1)}
      </span>
    </div>
    <Progress value={(school.metrics.act.overall_avg / 36) * 100} />
    <TrendDisplay
      label="ACT Overall"
      currentValue={school.metrics.act.overall_avg}
      trendData={school.metrics.trends?.act_overall}
      metricType="score"
      unit="points"
    />
  </div>
)}
```

**Step 7: Run test to verify it passes**

```bash
npm test src/components/SchoolDetailView.test.tsx
```

Expected: PASS

**Step 8: Commit Academics tab integration**

```bash
git add src/components/SchoolDetailView.tsx src/components/SchoolDetailView.test.tsx
git commit -m "feat(school-detail): add trend displays to ACT metrics"
```

---

## Task 7: Integrate TrendDisplay into SchoolDetailView - Demographics Tab

**Files:**
- Modify: `frontend/src/components/SchoolDetailView.tsx`
- Modify: `frontend/src/components/SchoolDetailView.test.tsx`

**Step 1: Write failing test for demographics trend displays**

Add to the 'Trend Display' describe block in `SchoolDetailView.test.tsx`:

```typescript
it('shows demographic trend buttons in demographics tab', async () => {
  const user = userEvent.setup();
  const schoolWithTrends: SchoolDetail = {
    ...mockSchool,
    metrics: {
      ...mockSchool.metrics,
      demographics: {
        el_percentage: 29.0,
        low_income_percentage: 38.4,
      },
      trends: {
        el_percentage: {
          one_year: 2.0,
          three_year: 5.0,
          five_year: null,
        },
        low_income_percentage: {
          one_year: -1.5,
          three_year: -3.0,
          five_year: -5.0,
        },
      },
    },
  };

  render(<SchoolDetailView school={schoolWithTrends} />);

  // Click demographics tab
  const demographicsTab = screen.getByRole('tab', { name: /demographics/i });
  await user.click(demographicsTab);

  // Should have trend buttons for demographics
  const trendButtons = screen.getAllByRole('button', { name: /show trends/i });
  expect(trendButtons.length).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/components/SchoolDetailView.test.tsx
```

Expected: FAIL

**Step 3: Add TrendDisplay after English Learners**

Modify the Demographics card (around line 168-181) to add TrendDisplay after the English Learners section:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Demographics</CardTitle>
    <CardDescription>Student support indicators</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">English Learners</span>
        <span className="text-lg font-semibold">
          {formatPercent(school.metrics.demographics.el_percentage)}
        </span>
      </div>
      {school.metrics.demographics.el_percentage !== null && (
        <TrendDisplay
          label="English Learners"
          currentValue={school.metrics.demographics.el_percentage}
          trendData={school.metrics.trends?.el_percentage}
          metricType="percentage"
          unit="percentage points"
        />
      )}
    </div>
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Low Income</span>
        <span className="text-lg font-semibold">
          {formatPercent(school.metrics.demographics.low_income_percentage)}
        </span>
      </div>
      {school.metrics.demographics.low_income_percentage !== null && (
        <TrendDisplay
          label="Low Income"
          currentValue={school.metrics.demographics.low_income_percentage}
          trendData={school.metrics.trends?.low_income_percentage}
          metricType="percentage"
          unit="percentage points"
        />
      )}
    </div>
  </CardContent>
</Card>
```

**Step 4: Run test to verify it passes**

```bash
npm test src/components/SchoolDetailView.test.tsx
```

Expected: PASS

**Step 5: Add TrendDisplay to diversity metrics**

Modify each diversity section in the Racial Diversity card (around line 190-245). For White:

```typescript
{school.metrics.diversity.white !== null && (
  <div>
    <div className="flex justify-between mb-2 text-sm">
      <span>White</span>
      <span className="font-medium">
        {formatPercent(school.metrics.diversity.white)}
      </span>
    </div>
    <Progress value={school.metrics.diversity.white} />
    <TrendDisplay
      label="White"
      currentValue={school.metrics.diversity.white}
      trendData={school.metrics.trends?.white}
      metricType="percentage"
      unit="percentage points"
    />
  </div>
)}
```

Apply the same pattern for Hispanic:

```typescript
{school.metrics.diversity.hispanic !== null && (
  <div>
    <div className="flex justify-between mb-2 text-sm">
      <span>Hispanic</span>
      <span className="font-medium">
        {formatPercent(school.metrics.diversity.hispanic)}
      </span>
    </div>
    <Progress value={school.metrics.diversity.hispanic} />
    <TrendDisplay
      label="Hispanic"
      currentValue={school.metrics.diversity.hispanic}
      trendData={school.metrics.trends?.hispanic}
      metricType="percentage"
      unit="percentage points"
    />
  </div>
)}
```

Apply the same pattern for Asian:

```typescript
{school.metrics.diversity.asian !== null && (
  <div>
    <div className="flex justify-between mb-2 text-sm">
      <span>Asian</span>
      <span className="font-medium">
        {formatPercent(school.metrics.diversity.asian)}
      </span>
    </div>
    <Progress value={school.metrics.diversity.asian} />
    <TrendDisplay
      label="Asian"
      currentValue={school.metrics.diversity.asian}
      trendData={school.metrics.trends?.asian}
      metricType="percentage"
      unit="percentage points"
    />
  </div>
)}
```

Apply the same pattern for Black:

```typescript
{school.metrics.diversity.black !== null && (
  <div>
    <div className="flex justify-between mb-2 text-sm">
      <span>Black</span>
      <span className="font-medium">
        {formatPercent(school.metrics.diversity.black)}
      </span>
    </div>
    <Progress value={school.metrics.diversity.black} />
    <TrendDisplay
      label="Black"
      currentValue={school.metrics.diversity.black}
      trendData={school.metrics.trends?.black}
      metricType="percentage"
      unit="percentage points"
    />
  </div>
)}
```

Apply the same pattern for Two or More Races:

```typescript
{school.metrics.diversity.two_or_more !== null && (
  <div>
    <div className="flex justify-between mb-2 text-sm">
      <span>Two or More Races</span>
      <span className="font-medium">
        {formatPercent(school.metrics.diversity.two_or_more)}
      </span>
    </div>
    <Progress value={school.metrics.diversity.two_or_more} />
    <TrendDisplay
      label="Two or More Races"
      currentValue={school.metrics.diversity.two_or_more}
      trendData={school.metrics.trends?.two_or_more}
      metricType="percentage"
      unit="percentage points"
    />
  </div>
)}
```

**Step 6: Run all tests**

```bash
npm test
```

Expected: PASS for all tests

**Step 7: Commit Demographics tab integration**

```bash
git add src/components/SchoolDetailView.tsx src/components/SchoolDetailView.test.tsx
git commit -m "feat(school-detail): add trend displays to demographics and diversity metrics"
```

---

## Task 8: End-to-End Manual Testing

**Files:**
- None (manual testing)

**Step 1: Start backend with trend data**

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

Verify backend is running and has imported data with trends.

**Step 2: Start frontend dev server**

```bash
cd frontend
npm run dev
```

**Step 3: Test with school that has full trend data**

Navigate to a high school (e.g., Elk Grove High School RCDTS: `05-016-2140-17-0002`)

Verify:
- [ ] Enrollment shows "Show trends" button
- [ ] Clicking button expands to show 1/3/5 year data
- [ ] All four ACT metrics show trend buttons
- [ ] Demographics (EL%, Low Income%) show trend buttons
- [ ] Diversity metrics show trend buttons
- [ ] Arrows display correctly (↑↓→)
- [ ] Percentages calculate and display
- [ ] "Hide trends" collapses sections
- [ ] Multiple sections can be open simultaneously

**Step 4: Test with school with no trend data**

Navigate to a school with no historical data (new school)

Verify:
- [ ] "Show trends" buttons are disabled
- [ ] Tooltip shows "Trend data unavailable"
- [ ] Buttons cannot be clicked

**Step 5: Test edge cases**

Find schools with:
- Very small enrollment (< 50 students)
- Low ACT scores (< 10.0)
- Small diversity percentages (< 5%)

Verify:
- [ ] Absolute changes still display
- [ ] Percentages are suppressed (show "—")
- [ ] Arrows still appear correctly

**Step 6: Test responsive layout**

Resize browser window to mobile size

Verify:
- [ ] Trend tables remain readable
- [ ] Buttons don't overflow
- [ ] Text wraps appropriately

**Step 7: Test keyboard navigation**

Using only keyboard:
- [ ] Can tab to trend buttons
- [ ] Enter/Space expands/collapses
- [ ] Focus indicators are visible

**Step 8: Document any issues**

If any issues found, create follow-up tasks. Otherwise, mark testing complete.

**Step 9: Final commit**

If any documentation or README updates are needed, add them now:

```bash
git add <any-final-files>
git commit -m "docs: update SchoolDetailView with trend metrics documentation"
```

---

## Summary

**Implementation complete:**
- ✓ TypeScript types for trend data
- ✓ Utility functions with full test coverage
- ✓ TrendTable component (presentational)
- ✓ TrendDisplay component (stateful)
- ✓ Integration into all three tabs of SchoolDetailView
- ✓ Comprehensive unit and integration tests
- ✓ Manual testing of all scenarios

**Test Coverage:**
- trendUtils: 32 tests
- TrendTable: 6 tests
- TrendDisplay: 8 tests
- SchoolDetailView: 3+ new tests
- Total: 49+ tests

**Files Created:**
- `frontend/src/lib/trendUtils.ts`
- `frontend/src/lib/trendUtils.test.ts`
- `frontend/src/components/TrendTable.tsx`
- `frontend/src/components/TrendTable.test.tsx`
- `frontend/src/components/TrendDisplay.tsx`
- `frontend/src/components/TrendDisplay.test.tsx`

**Files Modified:**
- `frontend/src/lib/api/types.ts`
- `frontend/src/components/SchoolDetailView.tsx`
- `frontend/src/components/SchoolDetailView.test.tsx`

**Git Commits:** 8 commits (one per task)
