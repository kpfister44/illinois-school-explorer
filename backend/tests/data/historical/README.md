# ABOUTME: Notes about lightweight historical fixtures for backend tests
# ABOUTME: Explains how we will mirror Report Card formats without large downloads

# Historical Fixture Plan

End-to-end tests should avoid the 40MB+ source files under `data/historical-report-cards/`. This folder will hold trimmed fixtures that mimic the format of each historical source so parsers and aggregators can run quickly inside pytest.

## Planned fixture types

- **Excel metrics:** Convert a handful of representative rows from each yearly workbook into CSV files that preserve the original column headers for enrollment, demographics, and SAT composites. These CSVs can be loaded with pandas just like the real Excel files.
- **Assessment TXT:** Extract 2-3 rows per year from `rc15`, `rc16`, and `rc17`, keeping the same pipe-delimited structure for ACT composite scores. Store them as short `.txt` fixtures to validate the legacy parser.
- **Metadata manifest:** Add a small JSON or YAML file describing which fixture rows correspond to which RCDTS codes so tests can assert expected time series outputs.

Fixtures will be added alongside the new tests introduced in the trend workflow so CI never needs the heavyweight public datasets.
