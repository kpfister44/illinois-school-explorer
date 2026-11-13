# Design Revamp Plan

**Goal:** Redesign Illinois School Explorer for parents and families who mostly use phones. Give the site its own identity, replace hidden history tables with charts, put a yardstick next to every number, add browsing and filtering, and show ISBE's 2026 state designation.

**Visual proposal with mockups:** https://claude.ai/artifact/8jFf2MCFHUKjpvuUSj21pt (private to Kyle). This file is the source of truth where the two differ.

**How to use this plan:** One Claude Code session per phase, each on its own branch, merged to `main` when tested. Start a session with "read `docs/plans/2026-11-11-design-revamp.md` and implement phase N". Each phase updates the `CLAUDE.md` files, README and backend docs it makes stale. `frontend/CLAUDE.md` is gitignored, so it exists only on Kyle's machine.

---

## Decisions

| Topic | Decision |
|---|---|
| Audience | Parents and families, mostly on phones |
| Scope | Frontend plus new API endpoints. New data limited to the state designation and IAR 2025 history |
| Visual direction | Editorial data: "a report card gone over with a highlighter" |
| Dark mode | Yes, from phase 1 |
| Charts | Recharts for the large line chart. Plain SVG components for sparklines, dot plots and the composition bar |
| Benchmarks | State average, district average, percentile, similar schools |
| Similar schools | The 25 nearest same-level schools (definition below) |
| Suppressed EL share | Treated as zero for similar-school matching only |
| Leaderboard | Keep the ranking, add low-income share and enrollment to each row |
| State designation | Show the overall level and link to ISBE for the per-indicator breakdown |
| School names | Tidy for display only. Official ISBE name stays stored, searchable and shown on the school page |
| Data oddities | Draw as ISBE published them. No correction |
| Map | Out of scope |

---

## Problems being fixed

| Problem | Where |
|---|---|
| Stock shadcn theme, system font, no dark mode | `frontend/src/index.css` |
| 17 years of history hidden in two-column tables behind a "Show trends" button per metric | `TrendDisplay.tsx`, `HistoricalDataTable.tsx`, `TrendTable.tsx` |
| Numbers shown with no state, district or peer context | all pages |
| School page split into three tabs; Overview holds only enrollment; 3 of 8 race and ethnicity groups never shown | `SchoolDetailView.tsx` |
| Compare shows one school at a time on phones; list lives only in localStorage | `ComparisonView.tsx`, `ComparisonContext.tsx` |
| Search bar never reaches `/search`; results show no metrics; no filters | `SearchBar.tsx`, `SearchResults.tsx`, `SchoolCard.tsx` |
| ACT breakdown and SAT note are hover tooltips; several tap targets under 32px | `TopScoresTable.tsx`, `HistoricalDataTable.tsx`, `ComparisonBasket.tsx` |
| School count on Home is the number of schools matching the letter "a" | `SchoolCount.tsx` |
| Back button on the school page always goes to `/` | `SchoolDetailView.tsx` |

### Incorrect displays (fix in phase 1)

1. **ACT subject trends.** The ELA, Math and Science rows pass `trends.act` (the composite trend) to `TrendDisplay` under their own labels. `SchoolDetailView.tsx`, the three `trendData={school.metrics.trends?.act}` props on subject rows. The API has no subject trends; derive them from `historical.act_ela` / `act_math` / `act_science` or show none.
2. **Compare highlighting.** `higherIsBetter: false` on enrollment, EL %, low income % and each race percentage marks the lowest value green as "best". `ComparisonView.tsx`, the `metrics` array and `getColorClass`. Only test results get a better or worse reading.
3. **Top Scores explainer.** Says scores are "normalized to a 100-point scale". They are not. `routes/TopScores.tsx`.

---

## Design rules

1. **The answer comes first.** Each page opens with the headline number and one plain sentence. Detail is below on the same scroll, never behind a tab.
2. **Every number gets a yardstick.** One comparison component (the dot plot) is used everywhere.
3. **Show the direction.** History is a visible chart. Gaps and SAT-converted years are drawn on the chart.
4. **Phone layout is the layout.** Design at 360px, then widen. Tap targets 44px or more. Nothing depends on hover.
5. **Describe students, rank results.** Demographics are neutral. Only test results get a higher or lower reading, with income context alongside.

---

## Visual system

Highlighter yellow is reserved for "this school". It is never used for anything else, so a parent can find their school in any chart or list.

### Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| paper | `#F4F6F9` | `#0E1524` | Page background |
| sheet | `#FFFFFF` | `#172034` | Cards, sheets |
| ink | `#14213A` | `#E8ECF4` | Text, this school's line |
| ink-2 | `#4B5872` | `#A5B0C6` | Secondary text |
| rule | `#D5DBE6` | `#2B3651` | Borders, gridlines |
| wash | `#E9EDF3` | `#1E2940` | Bands, quiet fills |
| highlighter | `#FFD23F` | `#FFD23F` | This school only (text on it is `#14213A` in both themes) |
| benchmark | `#7C889F` | `#7F8BA4` | Averages, peers |
| link | `#1B6E7A` | `#63C4CF` | Links, focus rings |

Categorical series (composition bar, compare schools): `#14506B`, `#3F9AA5`, `#9CCBB8`, `#B98F12`, `#8C5A8F`, `#A3AEC4` in light; `#5AA9CC`, `#3F9AA5`, `#9CCBB8`, `#D4AE3A`, `#B487B7`, `#66728C` in dark.

Map these onto the existing shadcn CSS variables in `index.css` so `components/ui/` keeps working. Check contrast in both themes before finalising.

### Type

- **Newsreader** for school names and headlines.
- **Schibsted Grotesk** for interface text and all figures, with tabular numerals.
- Self-host both (for example `@fontsource`), with real fallback stacks.

### Components to build

| Component | What it is |
|---|---|
| Dot plot | Rows of label, track with a dot, value. Optional shaded band for where most schools fall. Used for benchmarks, compare and district pages |
| Line chart | 2010 to 2026, school line plus dashed state line, gaps for missing years, shaded and labelled SAT period, touch scrubbing |
| Sparkline | Small inline SVG trend with a highlighted endpoint. Tapping opens the full chart and year table in a bottom sheet |
| Composition bar | One stacked bar adding to 100% with a legend, for race and ethnicity. Shows every group with data |
| Designation scale | Five steps with the school's level highlighted |
| Bottom tab bar | Phone navigation: Search, Browse, Compare (with count badge), Top scores |

---

## Pages

### Navigation
- **Phone:** bottom tab bar with four destinations. Compare is a tab with a count badge; the floating button and sheet (`ComparisonBasket.tsx`) go away.
- **Desktop:** top navigation row with the search field in it on every page.

### Home
- Headline, search field accepting school, city or district. Enter opens the results list.
- Level chips (High, Middle, Elementary) and browse links (by district, by city, Top scores).
- School count from a real endpoint.

### School page
One scroll, in this order:
1. Name, city, district (linked), county.
2. Three facts: grades, students, low income.
3. State designation on the five-step scale, a one-line explanation, link to the school's profile on Illinois Report Card.
4. Add to compare.
5. **Test scores:** headline number (ACT average for high schools, IAR proficiency otherwise), one plain sentence with the percentile, dot plot against Illinois, district and similar schools with the "most schools" band, link to the list of 25 similar schools.
6. **Over time:** ACT line chart for high schools. Subject scores shown plainly beneath. For IAR, a one-year change only (see IAR history).
7. **Students:** English learners and low income with state figures and sparklines; composition bar.
8. **Enrollment:** current figure, change since 2010, sparkline.

A sticky row of section links handles jumping. Desktop uses two columns: summary and benchmarks left, chart right.

### Search and browse results
- Each row: name, district, grades, enrollment, the one score that applies to its level, designation label.
- Level chips always visible. Other filters (county, district, enrollment, low-income share, designation) in a sheet on phones, a left column on desktop.
- Filters and sort live in the URL.

### District page (new)
- Name, county, school count, total students.
- Dot plot of the headline score for every school in the district, with district and state averages.
- "Compare all" when the district has 2 to 5 schools of one level.

### Compare
- **Phone:** each metric is a short dot plot with every school in it. Each school keeps one colour down the page. No carousel.
- **Desktop:** table with schools as columns and a dot track per row.
- Designation is the first row.
- The list lives in the URL (shareable); localStorage still remembers the last list.
- Remove `framer-motion` once the carousel is gone.

### Top scores
- Keep the ranking by test score.
- Each row shows enrollment, low-income share and designation label, visible on phones.
- County or district filter, and a lookup for any school's rank.
- Filter state in the URL. Replace the explainer with an accurate one.

---

## Benchmarks

Computed with SQL from `schools.db` at server start and cached. The database is read-only in production, so no schema change is needed for benchmarks.

| Yardstick | Definition | Shown when |
|---|---|---|
| Illinois average | Simple mean across schools of the same level that report the metric | Always |
| District average | Simple mean across same-level schools in the district | District has 3 or more such schools (227 districts have one school) |
| Percentile | Share of same-level Illinois schools with a lower value | Test scores only |
| Similar schools | Average of the 25 nearest same-level schools | Test scores only |
| "Most schools" band | 10th to 90th percentile of same-level schools | On dot plots for test scores |

**Similar schools.** For each school, take the 25 same-level schools with the smallest Euclidean distance over three standardised values: low-income share, English learner share, and the natural log of enrollment. Each is divided by its standard deviation across same-level schools. A suppressed (null) English learner share counts as zero for matching only. The page lists the 25 schools.

Why not fixed windows: with income within 10 points, English learners within 10 points and enrollment between half and double, only 177 of 684 high schools keep 20 or more matches.

Reference values for Elk Grove High School (`05-016-2140-17-0002`), useful as test expectations to re-derive, not to hard-code blindly:
- ACT average 18.1; Illinois high school average 17.6; District 214 average 20.5 (6 schools); higher than 64% of Illinois high schools; 10th to 90th percentile 14.2 to 20.7.
- An exploratory nearest-25 run that excluded schools with suppressed EL gave an average of 18.3. The final rule (suppressed counts as zero) will give a different figure.

Averages are simple means across schools, not student-weighted, so they differ from ISBE's published state figures. The "How this works" page says so.

---

## State designation

ISBE's 2026 accountability system is called Profiles of Performance. ISBE says there are five performance levels and that the overall profile "is not an average or a score".

- **Source:** `summative_designation` and `summative_designation_student_groups` in ReportCardAPI's `schools_2026` table.
- **Values in the 2026 data:** Exemplary 1,024; Approaching Exemplary 731; Commendable 1,080; Developing 452; Comprehensive 272; Dually Designated 82; blank 187.
- **Not available:** the level for each Core and Elevating indicator (the "house"). It is on ISBE's site but not in the public data set. The app links to `https://www.illinoisreportcard.com/school.aspx?schoolid=<rcdts without hyphens>&source=accountability&source2=essadesignation`.
- **No history:** 2025 used different categories (Commendable, Targeted, Exemplary, Comprehensive, Intensive). The page says the system is new in 2026.

**Confirmed against ISBE documentation in phase 2:**
1. The order of the five levels. ISBE's "2026 Illinois Report Card: An Overview of Profiles of Performance" numbers them 1 Exemplary, 2 Approaching Exemplary, 3 Commendable, 4 Developing, 5 Comprehensive. A sixth level, Automatic Comprehensive, applies to single indicators only and never to a school's overall designation. ISBE's short descriptions: highest levels of performance; strong; typical or average; below average; low.
2. "Dually Designated" marks a school with a variant grade configuration. ISBE's ESSA plan (Amendment 5, April 2026): such schools "receive two designations using the data elements and thresholds applicable to the grade band". All 82 span bands, mostly 6-12 and 7-12. The public data set does not say which two designations, so the school page shows "Dually Designated" off the five-step scale with a link to the school's Illinois Report Card profile.
3. `summative_designation_student_groups` is "NA" for every school and is not synced.

---

## IAR history

ReportCardAPI has IAR tables for 2019 and 2021 to 2026. Only 2025 and 2026 form a comparable series.

- **2025, 2026:** have `iar_ela_proficiency_rate_total` and `iar_math_proficiency_rate_total`.
- **2024:** has the same fields but precedes a scoring change. Average school ELA proficiency was 38.5% in 2024 and 51.0% in 2025; math 27.3% and 37.9%.
- **2019 to 2023:** only per-grade, per-level percentages. No schoolwide total.

Store 2025 and 2026 and show a one-year change. No IAR chart yet.

---

## API changes

| Change | Returns | Phase |
|---|---|---|
| `SchoolDetail` gains `designation`, `display_name`, IAR history and one-year IAR trend | New fields from the rebuild | 2 |
| `GET /api/stats` | School, district and city counts | 2 |
| `GET /api/schools/{rcdts}` gains `benchmarks` | Per metric: state average, district average and school count, percentile, similar-schools average | 4 |
| `GET /api/schools/{rcdts}/similar` | The 25 similar schools | 4 |
| `GET /api/benchmarks/state` | State average by year per metric and level, plus the 10th to 90th percentile band | 4 |
| `GET /api/schools` | Filtered, sorted, paged list by level, county, district, city, enrollment range, low-income range, designation. Rows carry grades, enrollment, headline score, designation | 5 |
| `GET /api/districts/{id}` | District summary and its schools. Id is the district portion of the RCDTS code; confirm it is unique per district | 5 |
| `GET /api/top-scores` extended | Low-income share and designation per row, county or district filter, rank lookup for one school | 7 |

Follow "Adding a new API endpoint" and "Adding a new data field from the ReportCardAPI" in the root `CLAUDE.md`. Keep `frontend/src/lib/api/types.ts` in step with `backend/app/models.py`.

**Display names.** At sync time, store `display_name` beside the official `school_name`, expanding a short fixed list of unambiguous abbreviations as whole words: Elem, Sch, Hs/HS, JHS. Jr and Sr are expanded only in front of High or HS, because eight schools carry them as part of a person's name ("M L King Jr Elem School"). Search matches both. The school page shows the official name as secondary text when it differs.

---

## Phases

Each phase ships on its own. All work follows the TDD and testing rules in the root `CLAUDE.md`. Add a phone-sized project to `playwright.config.ts` in phase 1 so mobile layouts are tested from then on.

### Phase 1: Foundation (small, frontend only)
- Colour and type tokens in light and dark, self-hosted fonts.
- Header, desktop navigation, phone bottom tab bar with the Compare badge.
- Tap targets 44px or more; replace hover-only tooltips with visible text.
- Fix the three incorrect displays.
- School page back button returns to the previous page.
- **Done when:** every existing page renders in the new theme in both modes at 360px and desktop width, the three fixes have tests, and unit and E2E suites pass.

### Phase 2: New data, one rebuild (small, backend first)
- Confirm the two designation unknowns.
- Sync: designation, `display_name`, IAR ELA and math history for 2025 and 2026, one-year IAR trend.
- Rebuild `schools.db`; check 2026 values are unchanged for existing columns.
- Expose the new fields; add `GET /api/stats`; Home uses it.
- **Done when:** the rebuilt database is committed, new fields appear in the API and types, and backend tests cover the sync mapping.

### Phase 3: School page (large, frontend)
- Single-scroll layout with section links; designation scale; line chart; sparklines with detail sheet; composition bar with all groups; one-year IAR change; desktop two-column layout.
- Retire `TrendDisplay`, `TrendTable` and `HistoricalDataTable` once nothing uses them. Ask Kyle before deleting.
- **Done when:** high, middle and elementary schools all render correctly with nulls, gaps and suppressed values, on phone and desktop.

### Phase 4: Benchmarks (medium, backend then frontend)
- Benchmark service with caching; `benchmarks` on school detail; similar-schools and state endpoints.
- Dot plot component, state line on the chart, plain-language sentence, similar-schools list, "How this works" page.
- **Done when:** benchmark values are covered by tests against the committed database and appear on the school page.

**Notes from phase 3:**
- `SchoolDetail` does not return `level`. The school page (`SchoolDetailView.tsx`) shows ACT, IAR or both according to which data the school has. 69 schools report both, mostly grades 6-12 and 7-12, and get both blocks. Benchmarks are defined per level, so decide which level's benchmarks such a school gets for each test, and expose `level` if the page needs it.
- `HistoryChart.tsx` draws one series. The dashed state line needs a second one.
- Two pieces of text on the school page stand in for benchmarks. Under the headline score, the sentence is the one-year change ("Up 0.2 points since 2025."); the percentile sentence goes there. Under English learners and low income, the secondary line is the first reported year ("6.8% in 2010"); the mockup has the state figure there.
- The dot plot belongs in the Test scores section of `SchoolDetailView.tsx`, under the sentence.
- Recharts renders at zero size in jsdom. Unit tests cover what surrounds a chart; Playwright checks what is drawn.
- `npm run lint` reports 8 errors in files that predate phase 3 (`App.test.tsx`, `ui/badge.tsx`, `ui/button.tsx`, `ComparisonContext.tsx`, `use-toast.ts`, `Home.test.tsx`, `TopScores.test.tsx`).
- `docs/screenshots/` still shows the tabbed school page.

### Phase 5: Browse, results, districts (large)
- List and district endpoints; results rows with metrics; filter sheet and desktop filter column; district page; district and city names become links; URL-driven state.
- **Done when:** a parent can go from Home to a town or district and to a school without typing a school name.

**Notes from phase 4:**
- Each metric is compared with schools of one level, returned as `level` on its benchmark. Kyle chose "by test": the ACT is always compared with high schools; the IAR with the school's own level, or with middle schools when the school is neither elementary nor middle. `SchoolDetail` still does not return the school's own `level`; list rows will need it for "the one score that applies to its level".
- A district is the first 14 characters of the RCDTS code (`district_code` in `backend/app/services/benchmarks.py`), matching `/api/stats`. No district name maps to two codes or the reverse, so it is safe as the district id.
- Similar-school candidates are the schools of the compared level that report the test and have a low-income share and enrollment. Elk Grove's 25 average 18.27.
- `Benchmarks` holds every school in memory after the first request (`get_benchmarks`). The list and district endpoints can reuse its groups and `in_district` for district and state averages.
- `DotPlot` takes rows, a fixed `scale` and an optional `band`. Rows are not links yet; the district page needs each school's row to open the school. ACT uses a 10 to 32 scale (`ASSESSMENT_SCALES`), since school averages run from 11.9 to 29.9.
- The year-by-year sheet (`HistorySheet`) has no state column; the state line is on the chart only.
- `/api/schools/compare` returns `benchmarks` for each school; Compare does not show them yet.
- The school page drops the one-year change sentence under the headline score. The ACT change is visible on the chart and the IAR change in the Over time table.
- `npm run lint` still reports the same 8 errors in files that predate phase 3.
- `docs/screenshots/` still shows the tabbed school page.

### Phase 6: Compare (medium, frontend)
- Dot-plot comparison on phones, table on desktop, designation row, shareable URL, "compare all" from a district.
- Remove the carousel and `framer-motion`.
- **Done when:** five schools are comparable on a 360px screen with no swiping and a copied URL reproduces the comparison.

**Notes from phase 5:**
- `/search` is the one school list. Search, level, city, filters and sort live in its URL (`listPath` and `readFilters` in `frontend/src/lib/schoolList.ts`). A shareable Compare URL can follow the same pattern.
- The district page's "Compare all" (2 to 5 schools of one level) calls `replaceComparison` and opens `/compare`, so it replaces whatever was selected.
- Compare still shows the official `school_name` ("Friendship Jr High School"), while the district page and lists show `display_name` ("Friendship Junior High School"). `tests/e2e/browse-flow.spec.ts` asserts the official names on Compare for now.
- List rows (`SchoolListItem`) carry `level`, `assessment`, `score`, `low_income_percentage` and `designation`; Top scores can reuse them for its context columns.
- `GET /api/schools` sorts by score only within a level and answers 422 otherwise; the list drops the sort when no level is chosen.
- `display_name` leaves "Schl" unexpanded ("Devry Advantage Academy High Schl").
- `npm run lint` now reports 7 errors, all in files that predate phase 3.

### Phase 7: Top scores (small)
- Context columns, designation label, region filter, rank lookup, URL state, accurate explainer.
- **Done when:** enrollment and low-income share are visible on phones for every row.

---

## Known doc drift to fix along the way

- README test counts disagree with each other (79 vs 119 backend tests; 23 vs 25 frontend unit files).
- Column counts: `DATABASE_SCHEMA.md` says "270+" and "294+"; its own breakdown sums to about 345.
- `backend/CLAUDE.md` and `API_ENDPOINTS.md` link to `backend/README.md` and `frontend/README.md`, which do not exist.
- Docs say React 18; `package.json` has React 19.
- README links to `frontend/CLAUDE.md`, which is gitignored (`.gitignore:79`).
