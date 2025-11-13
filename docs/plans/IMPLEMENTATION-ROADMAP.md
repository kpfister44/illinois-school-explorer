# Illinois School Explorer - Implementation Roadmap

**Project:** Illinois School Explorer
**Design Doc:** [2025-11-05-illinois-school-explorer-design.md](./2025-11-05-illinois-school-explorer-design.md)
**Estimated Timeline:** 12 days
**Approach:** Test-Driven Development (TDD) throughout

---

## Overview

This roadmap breaks down the project into 5 manageable phases. Each phase should have its own detailed implementation plan created using `/superpowers:write-plan` before starting work.

**Key Principles:**
- ✅ One phase at a time
- ✅ TDD for all code (Red-Green-Refactor)
- ✅ All tests passing before moving to next phase
- ✅ Review deliverables at end of each phase

---

## Phase 1: Backend Foundation ✅ **COMPLETE**
**Duration:** Days 1-3 (Completed: 2025-11-06)
**Focus:** Testing infrastructure, database, and data import

### Tasks
- ✅ Set up project structure (`backend/` directory)
- ✅ Configure pytest with fixtures (in-memory SQLite)
- ✅ Create SQLAlchemy models for `schools` table
- ✅ Implement FTS5 search index
- ✅ Build Excel → SQLite import script with data cleaning
- ✅ Write comprehensive tests for all above

### Deliverables
- ✅ Working SQLite database with FTS5 index
- ✅ Import script successfully loads 3,827 schools
- ✅ All backend tests passing (97% coverage, 33/33 tests)
- ✅ Can query database and search schools

### Dependencies
- None (starting point)

### Detailed Plan
Plan: `docs/plans/2025-11-06-phase1-backend-foundation.md` ✅ **EXECUTED**

---

## Phase 2: Backend API
**Duration:** Days 4-5
**Focus:** FastAPI REST endpoints

### Tasks
- Set up FastAPI application with CORS
- Implement `/api/search` endpoint with FTS5 integration
- Implement `/api/schools/{rcdts}` endpoint
- Implement `/api/schools/compare` endpoint
- Add Pydantic models for request/response validation
- Error handling and edge cases
- Write API tests using FastAPI TestClient

### Deliverables
- ✅ Working REST API with 3 endpoints
- ✅ API documentation at `/docs` (Swagger)
- ✅ All API tests passing
- ✅ Can query API via `curl` or Postman
- ✅ Trend metrics sourced locally (historical files + importer)

### Dependencies
- Phase 1 complete (database and models ready)

### Detailed Plan
Create with: `/superpowers:write-plan` (see PROMPTS.md)

---

## Phase 3: Frontend Foundation ✅ **COMPLETE**
**Duration:** Days 6-7 (Completed: 2025-11-08)
**Focus:** React setup, routing, testing infrastructure

### Tasks
- ✅ Initialize React + TypeScript + Vite project
- ✅ Set up shadcn/ui with Tailwind CSS 3
- ✅ Configure Vitest for unit testing
- ✅ Configure Playwright for E2E testing
- ✅ Create API client library (axios + TanStack Query)
- ✅ Set up React Router
- ✅ Create basic app shell with navigation
- ✅ Write sample tests to verify setup
- ✅ Create SchoolCount component with full integration
- ✅ Add environment configuration
- ✅ Create comprehensive README

### Deliverables
- ✅ React app running on localhost:5173
- ✅ shadcn/ui components available and styled
- ✅ Test infrastructure working (16 unit tests, 4 E2E tests passing)
- ✅ API client successfully fetches from backend (SchoolCount component)
- ✅ Basic routing structure in place
- ✅ Environment configuration complete
- ✅ Comprehensive documentation

### Dependencies
- Phase 2 complete (API endpoints available)

### Detailed Plan
Plan: `docs/plans/2025-11-07-phase3-frontend-foundation.md` ✅ **EXECUTED**

---

## Phase 4: Core Components
**Duration:** Days 8-10
**Focus:** Search and school detail views

### Tasks
- Build SearchBar component (shadcn/ui Command)
  - Autocomplete with debouncing
  - Keyboard navigation
  - API integration
- Build SchoolCard component
  - Display basic school info
  - Click to view details
- Build SchoolDetail component
  - Tabbed interface (Overview, Academics, Demographics)
  - Display all 5 metric groups
  - Visualizations for ACT scores and diversity
- Add loading states (Skeleton components)
- Add error handling (Toast notifications)
- Write unit tests for all components
- Write E2E test for search → detail flow

### Deliverables
- ✅ Users can search for schools by name or city
- ✅ Search results appear in <100ms
- ✅ Users can view full school details
- ✅ All core components tested (unit + E2E)
- ✅ Responsive design (mobile + desktop)

### Dependencies
- Phase 3 complete (frontend foundation ready)

### Detailed Plan
Create with: `/superpowers:write-plan` (see PROMPTS.md)

---

## Phase 5: Comparison Feature
**Duration:** Days 11-12
**Focus:** Side-by-side school comparison

### Tasks
- Create comparison state management (Context or Zustand)
  - Add/remove schools to comparison basket
  - Persist to localStorage
  - Max 5 schools validation
- Build ComparisonView component
  - Side-by-side table (shadcn/ui Table)
  - Color coding for best/worst values
  - Responsive horizontal scroll on mobile
- Add "Add to Compare" button to SchoolDetail
- Add comparison basket UI (bottom bar with badges)
- Update routing for `/compare` page
- Write comparison component tests
- Write E2E test for full comparison flow
- Final integration testing

### Deliverables
- ✅ Users can compare 2-5 schools side-by-side
- ✅ Comparison persists across page refreshes
- ✅ All comparison features tested
- ✅ **MVP complete and ready for use**

### Dependencies
- Phase 4 complete (core components ready)

### Detailed Plan
Create with: `/superpowers:write-plan` (see PROMPTS.md)

---

## Post-MVP Enhancements (Future)

These are out of scope for the initial implementation but can be added later:

### Enhancement 1: Additional Metrics
- Add graduation rates, chronic absenteeism, teacher stats
- Progressive disclosure UI (show more/less buttons)
- Estimated effort: 2-3 days

### Enhancement 2: Advanced Search
- Filter by school type, city, grades served
- Sort results by enrollment, ACT scores, etc.
- Map view with geographic search
- Estimated effort: 3-4 days

### Enhancement 3: Export & Sharing
- Export comparison to PDF/CSV
- Shareable comparison URLs
- Estimated effort: 2 days

### Enhancement 4: Deployment
- Backend: Railway/Render/AWS
- Frontend: Vercel/Netlify
- Database: Migrate to PostgreSQL
- CI/CD pipeline
- Estimated effort: 2-3 days

---

## Success Criteria

### Technical Quality
- [ ] 100% of tests passing (backend + frontend)
- [ ] >90% code coverage on backend
- [ ] >80% code coverage on frontend components
- [ ] No console errors or warnings
- [ ] All API responses <100ms (local development)

### Feature Completeness
- [ ] Search works by school name and city
- [ ] All 5 metric groups display correctly
- [ ] Side-by-side comparison of 2-5 schools works
- [ ] Error states handled gracefully
- [ ] Mobile responsive design

### Code Quality
- [ ] TDD followed throughout (test written first)
- [ ] All edge cases handled
- [ ] Clean, readable code
- [ ] Proper error handling and logging

---

## Phase Transition Checklist

Before moving to the next phase:

1. [ ] All tests for current phase passing
2. [ ] Deliverables verified and working
3. [ ] Code reviewed (or self-reviewed)
4. [ ] Git commits clean and descriptive
5. [ ] Ready to create next phase's detailed plan

---

## Notes

- **TDD is mandatory:** Write tests first, watch them fail, then implement
- **Small batches:** Work in small increments with frequent commits
- **Review often:** Use `/superpowers:request-code-review` at phase boundaries
- **Stay focused:** Resist temptation to add features not in current phase
- **Document learnings:** Update this roadmap if you discover better phase breakdown

---

**Last Updated:** 2025-11-05
**Status:** Ready to begin Phase 1
