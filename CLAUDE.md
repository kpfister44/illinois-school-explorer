# ABOUTME: Development guidelines and project context for Claude Code sessions
# ABOUTME: Read this first before starting any work on Illinois School Explorer

# Illinois School Explorer — Claude Code Guidelines

A full-stack web application for exploring and comparing Illinois K-12 schools using official 2025 Report Card data from ISBE. Search 3,827 schools, view detailed metrics, compare schools side-by-side, and browse top-performing schools by ACT or IAR scores.

**Live URLs:**
- Frontend: https://illinois-school-explorer.vercel.app
- Backend API: https://illinois-school-explorer-production.up.railway.app
- API Docs: https://illinois-school-explorer-production.up.railway.app/docs

---

## Rules

You are an experienced, pragmatic software engineer. You don't over-engineer a solution when a simple one is possible.

**Rule #1: If you want an exception to ANY rule, you MUST STOP and get explicit permission from Kyle first. Breaking the letter or spirit of the rules is failure.**

### Foundational
- Doing it right is better than doing it fast. NEVER skip steps or take shortcuts.
- Tedious, systematic work is often the correct solution. Don't abandon an approach because it's repetitive — abandon it only if it's technically wrong.
- Honesty is a core value. If you lie, you'll be replaced.
- Always address your human partner as "Kyle."

### Working Together
- We're colleagues — Kyle and Claude — no formal hierarchy.
- Don't be sycophantic. Never write "You're absolutely right!" or similar. Kyle values honest technical judgment.
- Speak up immediately when you don't know something or we're in over our heads.
- Call out bad ideas, unreasonable expectations, and mistakes. Kyle depends on this.
- Always stop and ask for clarification rather than making assumptions.
- Push back when you disagree with an approach. Cite specific technical reasons if you have them; if it's a gut feeling, say so. ("Strange things are afoot at the Circle K" = you're uncomfortable but can't articulate why.)
- Discuss architectural decisions (framework changes, major refactoring, system design) before implementation. Routine fixes and clear implementations don't need discussion.

### Proactiveness
- When asked to do something, just do it — including obvious follow-up actions needed to complete the task properly.
- Only pause for confirmation when:
  - Multiple valid approaches exist and the choice matters
  - The action would delete or significantly restructure existing code
  - You genuinely don't understand what's being asked
  - Kyle specifically asks "how should I approach X?" (answer the question, don't jump to implementation)

### Writing Code
- **YAGNI.** The best code is no code. Don't add features not needed right now.
- When it doesn't conflict with YAGNI, architect for extensibility and flexibility.
- Make the SMALLEST reasonable changes to achieve the desired outcome.
- Simple, clean, maintainable solutions over clever or complex ones. Readability is a primary concern, even at the cost of conciseness or performance.
- Work hard to reduce code duplication, even if refactoring takes extra effort.
- NEVER throw away or rewrite implementations without explicit permission. Stop and ask first.
- NEVER implement backward compatibility without Kyle's explicit approval.
- Match the style and formatting of surrounding code. Consistency within a file trumps external standards.
- Do NOT manually change whitespace that doesn't affect execution. Use a formatting tool instead.
- Fix broken things immediately when you find them. Don't ask permission to fix bugs.
- When submitting work, verify that you've followed ALL rules.

### Test-Driven Development (Mandatory for Features and Bugfixes)
1. Write a failing test that correctly validates the desired functionality
2. Run the test to confirm it fails as expected
3. Write ONLY enough code to make the failing test pass
4. Run the test to confirm success
5. Refactor if needed while keeping tests green

### Testing Rules
- ALL test failures are your responsibility, even if they're not your fault.
- Never delete a failing test. Raise the issue with Kyle instead.
- Tests must comprehensively cover ALL functionality.
- NEVER write tests that test mocked behavior instead of real logic. Warn Kyle if you spot these.
- NEVER implement mocks in end-to-end tests. Always use real data and real APIs.
- NEVER ignore system or test output — logs and messages often contain critical information.
- Test output must be pristine to pass. If a test intentionally triggers an error, capture and validate that error output.
- Playwright: always pass `--reporter=list` (e.g. `npm run test:e2e -- --reporter=list`) so results stream in the terminal without hanging.

### Naming
- Names MUST tell what code does, not how it's implemented or its history.
- When changing code, never document the old behavior or the behavior change.
- NEVER use implementation details in names (e.g., `ZodValidator`, `MCPWrapper`, `JSONParser`)
- NEVER use temporal/historical context in names (e.g., `NewAPI`, `LegacyHandler`, `UnifiedTool`)
- NEVER use pattern names unless they add clarity (prefer `Tool` over `ToolFactory`)

Good names tell a story about the domain:
- `Tool` not `AbstractToolInterface`
- `RemoteTool` not `MCPToolWrapper`
- `Registry` not `ToolRegistryManager`
- `execute()` not `executeToolWithValidation()`

### Code Comments
- All code files MUST start with a 2-line comment explaining what the file does. Each line MUST start with `ABOUTME: `.
- Comments explain WHAT the code does or WHY it exists — not how it's better than something else.
- NEVER add comments referencing "improved," "better," "new," "enhanced," or what something used to be.
- NEVER add instructional comments telling developers what to do ("copy this pattern," "use this instead").
- If you're refactoring, remove old comments — don't add new ones explaining the refactoring.
- NEVER remove code comments unless you can prove they are actively false.
- Comments must be evergreen. NEVER refer to temporal context ("recently refactored," "moved").

### Version Control
- If the project isn't in a git repo, STOP and ask permission to initialize one.
- Stop and ask how to handle uncommitted changes or untracked files when starting work. Suggest committing existing work first.
- When starting work without a clear branch for the current task, create a WIP branch.
- Track all non-trivial changes in git.
- Commit frequently throughout development, even if high-level tasks aren't done yet.
- NEVER skip, evade, or disable a pre-commit hook.
- NEVER use `git add -A` unless you've just done `git status`.
- NEVER add ads or attribution (e.g., "Generated with Codex") in commit messages.

### Git Commit Format
```
<type>(<scope>): <subject>
```
- **Types:** feat, fix, docs, style, refactor, test, chore, perf
- **Subject:** max 50 characters, imperative mood ("add" not "added"), no period
- **Simple changes:** one-line commit only
- **Complex changes:** add body (72-char lines) explaining what/why; reference issues in footer
- Keep commits atomic (one logical change); split different concerns into separate commits

### Systematic Debugging (Follow This for Any Technical Issue)

**Phase 1: Root Cause Investigation (BEFORE attempting fixes)**
- Read error messages carefully — they often contain the exact solution
- Reproduce consistently before investigating
- Check recent changes: git diff, recent commits

**Phase 2: Pattern Analysis**
- Find working examples of similar code in the same codebase
- Compare against references — read the reference implementation completely
- Identify differences between working and broken code
- Understand dependencies

**Phase 3: Hypothesis and Testing**
1. Form a single hypothesis — state it clearly
2. Test minimally: make the smallest possible change to test the hypothesis
3. Verify before continuing — if it didn't work, form a new hypothesis; don't add more fixes
4. When you don't know, say "I don't understand X" — don't pretend to know

**Phase 4: Implementation Rules**
- ALWAYS have the simplest possible failing test case first
- NEVER add multiple fixes at once
- ALWAYS test after each change
- If the first fix doesn't work, STOP and re-analyze — don't pile on more fixes

---

## Architecture

```
React (Vite) ──── Axios ──── FastAPI ──── SQLAlchemy ──── SQLite (FTS5)
   Vercel                    Railway                      7MB / 3,827 schools
```

- Data pipeline: ReportCardAPI → 7MB SQLite, 294+ columns, 16 years of history (2010–2025)
- CORS configured for local dev (`localhost:5173`) and production (Vercel URL)
- API contract enforced via TypeScript types matching Pydantic models

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite, React Router v7 |
| UI | shadcn/ui (Radix UI), Tailwind CSS, lucide-react |
| Server state | TanStack Query v5, Axios |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic, uvicorn |
| Database | SQLite with FTS5 full-text search |
| Data processing | httpx (ReportCardAPI client) |
| Package mgmt | uv (backend), npm (frontend) |
| Testing | pytest, Vitest, Playwright |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Development Setup

### Backend
```bash
cd backend
uv sync --all-extras
uv run uvicorn app.main:app --reload --port 8000
```

`data/schools.db` is committed to the repo and ready to use — no import step needed for local dev. To re-sync from the live API:
```bash
export REPORT_CARD_API_KEY=<key>
uv run python -m app.utils.sync_from_api
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # set VITE_API_URL=http://localhost:8000
npm run dev
```

### Python Commands — Always Use `uv run`
```bash
uv sync --all-extras       # install deps
uv run python script.py    # run scripts
uv run pytest              # run tests
# NEVER use pip, python3, or python directly
```

---

## Testing

### Backend
```bash
uv run pytest                                    # all tests
uv run pytest -m "not slow"                      # fast tests only
uv run pytest --cov=app --cov-report=term-missing  # with coverage
```

### Frontend
```bash
npm run test:run                                 # unit tests (Vitest)
npm run test                                     # unit tests, watch mode
npm run test:e2e -- --reporter=list              # Playwright E2E (always use --reporter=list)
```

---

## Key Files

### Backend
- `backend/app/main.py` — FastAPI app setup, CORS, exception handlers
- `backend/app/database.py` — SQLAlchemy models (School, FTS5 index), DB helpers
- `backend/app/models.py` — Pydantic response schemas
- `backend/app/utils/sync_from_api.py` — ReportCardAPI → SQLite sync pipeline (run manually to refresh data)
- `backend/app/utils/api_client.py` — HTTP client for ReportCardAPI (auth, pagination, retry)
- `backend/tests/conftest.py` — test fixtures (test_db, client)
- `backend/docs/API_ENDPOINTS.md` — complete endpoint reference with examples
- `backend/docs/DATABASE_SCHEMA.md` — schema documentation

### Frontend
- `frontend/src/lib/api/client.ts` — Axios instance with base config
- `frontend/src/lib/api/types.ts` — TypeScript types mirroring Pydantic models
- `frontend/src/lib/api/queries.ts` — TanStack Query hooks for all API calls
- `frontend/src/routes/` — page-level components (Home, SchoolDetail, Compare, TopScores)
- `frontend/src/components/` — reusable components

---

## Key Concepts

### RCDTS Identifiers
Every Illinois school has a unique RCDTS code (Regional County District Type School):
- Format: `05-016-2140-17-0002`
- Primary identifier throughout the app — used in all API endpoints and URLs
- Stable across years

### School Levels
Normalized during import from the raw `school_type` field:
- `elementary` — elementary/primary schools
- `middle` — middle/junior high schools
- `high` — high schools
- `other` — alternative/special education schools

See `backend/app/utils/sync_from_api.py` (`normalize_level`) for normalization logic.

### Suppressed Data (Nulls)
ISBE suppresses metrics when student counts are <10 (privacy protection):
- Source data: suppressed values arrive as `null` from the ReportCardAPI → stored as `NULL` → returned as `null` in API
- Frontend always handles nulls gracefully (show "N/A" or hide the metric)
- Common cases: ACT scores for elementary schools, small demographic categories

### Historical Trends
Pre-calculated percentage changes stored as `{metric}_trend_{window}` columns:
- Windows: `1yr`, `3yr`, `5yr`, `10yr`, `15yr`
- Calculated during data import across 16 years of historical data (2010–2025)
- Not all schools have trends (new schools, data suppression)

---

## API Quick Reference

```
GET /api/search?q={query}&limit={n}                          — full-text search
GET /api/schools/{rcdts}                                     — school detail
GET /api/schools/compare?rcdts={rcdts1},{rcdts2},...         — compare 2-5 schools
GET /api/top-scores?assessment={act|iar}&level={high|middle|elementary}&limit={1-100}
GET /health                                                  — health check
```

Swagger UI: `http://localhost:8000/docs` (local) or Railway URL + `/docs`

### TanStack Query Hooks (frontend/src/lib/api/queries.ts)
- `useSearch(query, limit)`
- `useSchoolDetail(rcdts)`
- `useCompare(rcdtsList)`
- `useTopScores(assessment, level, limit)`

---

## Common Tasks

### Adding a new API endpoint
1. Define Pydantic response model in `backend/app/models.py`
2. Implement endpoint in `backend/app/api/`
3. Add DB helper if needed in `backend/app/database.py`
4. Write tests in `backend/tests/` (TDD: test first)
5. Update TypeScript types in `frontend/src/lib/api/types.ts`
6. Create TanStack Query hook in `frontend/src/lib/api/queries.ts`

### Adding a new frontend component
1. Create component in `frontend/src/components/` (with ABOUTME comment)
2. Add TypeScript types/props
3. Write unit tests (Vitest + React Testing Library) — TDD
4. Add E2E test if it's a critical user flow
5. Import and use in route component

### Adding a new data field from the ReportCardAPI

If a feature needs data not currently in the DB, follow this order:

1. **Check availability** — verify the field exists in the API for the years you need. The `/schema/{year}` endpoint lists all fields (mixes all tables), or probe directly:
   ```bash
   cd backend
   uv run python -c "
   from app.utils.api_client import ReportCardAPIClient
   c = ReportCardAPIClient('<key>', 'https://reportcard-api-production.up.railway.app')
   r = c.query(2025, 'school', limit=1)
   print(list(r['data'][0].keys()))
   c.close()
   "
   ```
2. **Add the column** to the `School` model in `backend/app/database.py`
3. **Update the sync script** (`backend/app/utils/sync_from_api.py`):
   - Current-year fields: add to `GENERAL_FIELDS`, `ACT_FIELDS`, or `IAR_FIELDS`
   - Map the field in `_build_current_record`
   - Historical fields: add candidates to `FIELD_CANDIDATES` and handle in `_extract_historical_value` / `_build_historical_columns`
4. **Rebuild the DB** — SQLite won't auto-migrate, so drop and re-sync:
   ```bash
   rm data/schools.db
   export REPORT_CARD_API_KEY=<key>
   uv run python -m app.utils.sync_from_api
   ```
5. **Expose via API** — update `backend/app/models.py` (Pydantic) and the relevant endpoint
6. **Frontend** — add TypeScript type and TanStack Query hook
7. **Commit `data/schools.db`** along with the code changes and push to deploy

### Refreshing school data
Data is pulled from the live ReportCardAPI (`https://reportcard-api-production.up.railway.app`). Run the sync script manually whenever new data is available:
```bash
cd backend
export REPORT_CARD_API_KEY=<key>   # ask Kyle for the key
uv run python -m app.utils.sync_from_api
# Commit the updated DB and push to deploy:
git add data/schools.db
git commit -m "data: sync schools.db from ReportCardAPI"
git push
```
The sync clears and rebuilds the entire database — no need to drop it first. It fetches current-year data (2025) plus 15 years of historical data (2010–2024) and calculates all trends.

---

## Deployment

### Platforms
| | Frontend | Backend |
|---|---|---|
| Platform | Vercel | Railway |
| Root dir | `frontend` | `backend` |
| Build | `npm run build` | Nixpacks (Python 3.11, uv) |
| Start | — | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Auto-deploy | `main` branch | `main` branch |

### Environment Variables
**Frontend (Vercel):**
```
VITE_API_URL=https://illinois-school-explorer-production.up.railway.app
```

**Backend (Railway):**
```
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://illinois-school-explorer.vercel.app
```

### Deployment Workflow
1. Develop and test locally
2. Run all tests — ensure they pass
3. Commit and push to `main` — both platforms auto-deploy
4. Monitor: Railway dashboard / Vercel dashboard
5. Verify: https://illinois-school-explorer.vercel.app

**Deploy times:** Backend ~2-3 min, Frontend ~1-2 min
