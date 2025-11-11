# Claude Journal

## 2025-11-09 – School detail view foundation
- Added SchoolDetailView component and tests following plan Task 8. Tabs structure is ready so ACT and diversity progress bars can slot in without rework.
- Format helpers (`formatNumber`, `formatPercent`) centralize formatting logic; reuse them instead of duplicating conversions elsewhere in the detail view.

## 2025-11-09 – School detail page API wiring
- SchoolDetail page now uses react-query directly with `getSchoolDetail` helper plus shadcn Alert for load/error states. Skeletons expose `data-testid` for reliable tests.
- Tests capture the axios interceptor error log, keeping vitest output clean while verifying the log occurs on failures.

## 2025-11-09 – ACT visualization tweaks
- Installed shadcn Progress component (remember it defaults to creating files under `@/components`, so move them into `src/components/ui`).
- SchoolDetailView now renders ACT scores as stacked progress bars capped at 36, matching Task 10 requirements.

## 2025-11-09 – Diversity visualization
- Added diversity progress bars sharing the same Progress component to keep visual language consistent; tests now click the Demographics tab and assert progressbars render.

## 2025-11-11 – Comparison view and route
- ComparisonView component renders shadcn Table metrics with min-value highlighting for lower-is-better metrics. Remember to reuse the `metrics` array when future attributes get added so formatting stays centralized.
- Compare route blocks on 0/1 selections via alerts and pipes TanStack Query errors through `useToast`. When adding new comparison states, keep the early returns so we never fetch with an invalid RCDTS list.
- Playwright coverage for the comparison flow uses helper functions (`addSchoolToComparison`, `getCompareButton`) to keep selectors resilient. The Compare button renders as a `role="button"` anchor because we wrap `<Link>` with shadcn `Button asChild`.

## 2025-11-10 – Phase 5 manual checklist
- Verified every manual hardening step with a Playwright-driven checklist script while the dev servers Kyle started stayed running (search/add/remove/clear/persist/guardrails/responsive all passed).
- Add from SchoolDetail, basket visibility, multi-select, compare-table navigation, and metric rendering behaved as expected (Enrollment + ACT ELA columns visible after navigating to `/compare`).
- Color highlighting surfaced green backgrounds for the best values, remove buttons updated the badge count, and Clear All fully unmounted the basket before reloading to confirm persistence.
- Guardrail tests covered the 6th-school disablement plus both `/compare` empty-state alerts (0 schools = "No Schools Selected", 1 school = "Not Enough Schools").
- Responsive spot-check at 390px width with five selections kept the comparison table accessible; the overflow container retained `overflow-x: auto`, so horizontal scrolling works on narrow devices.
