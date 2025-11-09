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
