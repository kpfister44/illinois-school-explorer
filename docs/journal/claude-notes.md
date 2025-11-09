# Claude Journal

## 2025-11-09 – School detail view foundation
- Added SchoolDetailView component and tests following plan Task 8. Tabs structure is ready so ACT and diversity progress bars can slot in without rework.
- Format helpers (`formatNumber`, `formatPercent`) centralize formatting logic; reuse them instead of duplicating conversions elsewhere in the detail view.
