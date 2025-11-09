# Claude Journal

## 2025-11-09 – School detail view foundation
- Added SchoolDetailView component and tests following plan Task 8. Tabs structure is ready so ACT and diversity progress bars can slot in without rework.
- Format helpers (`formatNumber`, `formatPercent`) centralize formatting logic; reuse them instead of duplicating conversions elsewhere in the detail view.

## 2025-11-09 – School detail page API wiring
- SchoolDetail page now uses react-query directly with `getSchoolDetail` helper plus shadcn Alert for load/error states. Skeletons expose `data-testid` for reliable tests.
- Tests capture the axios interceptor error log, keeping vitest output clean while verifying the log occurs on failures.
