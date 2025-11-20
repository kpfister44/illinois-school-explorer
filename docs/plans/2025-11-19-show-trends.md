# Show Trends Toggle Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Limit initial SchoolDetail historical tables to 2017–2025, add a Show More/Less control for 2010–2016, and match the TopScores load-more interaction.

**Architecture:** Extend `HistoricalDataTable` with local state that slices its static year list into “recent” (>=2017) and “legacy” years. Render the usual rows from the visible slice, append a footer row with the TopScores-style counter + button, and toggle visibility without altering parent components. Tests capture collapsed/expanded behavior using React Testing Library.

**Tech Stack:** React 18, TypeScript, shadcn/ui `Button`, React Testing Library, Vitest.

---

### Task 1: HistoricalDataTable tests for show more behavior

**Files:**
- Create: `frontend/src/components/HistoricalDataTable.test.tsx`

**Step 1: Write the failing test**

Add tests verifying (a) clicking “Show trends” reveals only 2017–2025 rows with "Show More (7 remaining)", and (b) clicking “Show More” reveals 2010–2016 rows and swaps the button text to “Show Less”. Reuse TopScores copy by asserting on button text and row counts via `within`.

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- HistoricalDataTable`

Expected: FAIL because component lacks toggle logic.

**Step 3: Commit new test file**

Run: `git add frontend/src/components/HistoricalDataTable.test.tsx && git commit -m "test: cover historical toggle"`

### Task 2: Implement Show More / Show Less UI in HistoricalDataTable

**Files:**
- Modify: `frontend/src/components/HistoricalDataTable.tsx`

**Step 1: Implement minimal code**

Add `useState` for `showAllYears`. Split the `years` array into `recentYears` (>=2017) and `legacyYears`. Render `const displayedYears = showAllYears ? years : recentYears`. Compute `hasLegacyYears`, `remainingCount = legacyYears.length`. After mapping `displayedYears`, conditionally render a new `<tr>` containing the TopScores-style counter text (`Showing ${displayedYears.length} of ${years.length} years`) and a button that toggles state. Button text: collapsed → `Show More (${remainingCount} remaining)`, expanded → `Show Less`. Hide the toggle row entirely if there are no legacy years.

**Step 2: Run focused tests**

Run: `cd frontend && npm run test -- HistoricalDataTable`

Expected: PASS (new tests green).

**Step 3: Commit implementation**

Run: `git add frontend/src/components/HistoricalDataTable.tsx && git commit -m "feat: add historical show more"`

### Task 3: Regression safety net for TrendDisplay + SchoolDetail

**Files:**
- Modify (if needed): `frontend/src/components/TrendDisplay.test.tsx`

**Step 1: Write optional integration test**

If necessary, add a test ensuring TrendDisplay renders the new toggle text when historical data exists (asserting that clicking “Show trends” surfaces the Show More button). Only add if Task 1’s coverage proves insufficient.

**Step 2: Run test suite**

Run: `cd frontend && npm run test -- TrendDisplay`

Expected: PASS.

**Step 3: Final commit**

Run: `git add frontend/src/components/TrendDisplay.test.tsx && git commit -m "test: assert historical toggle visibility"`

---

After all tasks: run `cd frontend && npm run test -- HistoricalDataTable TrendDisplay` to verify both suites together, then proceed with execution workflow.

