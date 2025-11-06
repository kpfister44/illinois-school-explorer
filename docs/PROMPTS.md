# Claude Code Prompts for Implementation

This document contains prompt templates for using Claude Code's planning and execution skills throughout the Illinois School Explorer project.

---

## Creating Detailed Implementation Plans

Use these prompts with the `/superpowers:write-plan` slash command to create detailed, phase-specific implementation plans.

### Phase 1: Backend Foundation

```
I want to create a detailed implementation plan for Phase 1: Backend Foundation.

The design doc is at docs/plans/2025-11-05-illinois-school-explorer-design.md.
The roadmap is at docs/plans/IMPLEMENTATION-ROADMAP.md.

Focus only on:
- Backend project structure setup
- Pytest testing infrastructure with fixtures
- SQLAlchemy database models for schools table
- FTS5 full-text search index
- Excel → SQLite data import script with data cleaning
- Comprehensive tests for all components

Use TDD approach throughout. All tests must be written BEFORE implementation code.

Expected deliverables:
- Working SQLite database with FTS5 index
- Import script successfully loads 4,000+ schools from Excel
- All backend tests passing with >90% coverage
- Can query database and search schools

Timeline: 3 days
```

---

### Phase 2: Backend API

```
I want to create a detailed implementation plan for Phase 2: Backend API.

The design doc is at docs/plans/2025-11-05-illinois-school-explorer-design.md.
The roadmap is at docs/plans/IMPLEMENTATION-ROADMAP.md.
Phase 1 is complete - database and models are ready.

Focus only on:
- FastAPI application setup with CORS configuration
- /api/search endpoint with FTS5 integration
- /api/schools/{rcdts} endpoint
- /api/schools/compare endpoint
- Pydantic models for request/response validation
- Error handling and edge cases (404, 400, 503)
- API tests using FastAPI TestClient

Use TDD approach throughout. All tests must be written BEFORE implementation code.

Expected deliverables:
- Working REST API with 3 endpoints
- Interactive API documentation at /docs
- All API tests passing
- Can query API via curl or Postman

Timeline: 2 days
```

---

### Phase 3: Frontend Foundation

```
I want to create a detailed implementation plan for Phase 3: Frontend Foundation.

The design doc is at docs/plans/2025-11-05-illinois-school-explorer-design.md.
The roadmap is at docs/plans/IMPLEMENTATION-ROADMAP.md.
Phase 2 is complete - API endpoints are available and tested.

Focus only on:
- React + TypeScript + Vite project initialization
- shadcn/ui setup with Tailwind CSS
- Vitest configuration for unit testing
- Playwright configuration for E2E testing
- API client library (axios + TanStack Query)
- React Router setup
- Basic app shell with navigation structure
- Sample tests to verify testing infrastructure

Use TDD approach throughout. All tests must be written BEFORE implementation code.

Expected deliverables:
- React app running on localhost:5173
- shadcn/ui components available and styled
- Test infrastructure working (unit + E2E)
- API client can successfully fetch from backend
- Basic routing structure in place

Timeline: 2 days
```

---

### Phase 4: Core Components

```
I want to create a detailed implementation plan for Phase 4: Core Components.

The design doc is at docs/plans/2025-11-05-illinois-school-explorer-design.md.
The roadmap is at docs/plans/IMPLEMENTATION-ROADMAP.md.
Phase 3 is complete - frontend foundation is ready.

Focus only on:
- SearchBar component (shadcn/ui Command) with autocomplete and debouncing
- SchoolCard component for displaying search results
- SchoolDetail component with tabbed interface
  - Overview, Academics, Demographics tabs
  - Display all 5 metric groups
  - Visualizations for ACT scores and diversity
- Loading states using Skeleton components
- Error handling with Toast notifications
- Unit tests for all components
- E2E test for search → detail flow

Use TDD approach throughout. All tests must be written BEFORE implementation code.

Expected deliverables:
- Users can search for schools by name or city
- Search results appear in <100ms
- Users can view full school details with all metrics
- All core components tested (unit + E2E)
- Responsive design working on mobile and desktop

Timeline: 3 days
```

---

### Phase 5: Comparison Feature

```
I want to create a detailed implementation plan for Phase 5: Comparison Feature.

The design doc is at docs/plans/2025-11-05-illinois-school-explorer-design.md.
The roadmap is at docs/plans/IMPLEMENTATION-ROADMAP.md.
Phase 4 is complete - core components are ready.

Focus only on:
- Comparison state management (Context or Zustand)
  - Add/remove schools to comparison basket
  - Persist to localStorage
  - Max 5 schools validation
- ComparisonView component with side-by-side table
  - Color coding for best/worst values
  - Responsive design with horizontal scroll
- "Add to Compare" button integration in SchoolDetail
- Comparison basket UI (bottom bar with badges)
- Routing updates for /compare page
- Unit tests for comparison components
- E2E test for full comparison flow
- Final integration testing

Use TDD approach throughout. All tests must be written BEFORE implementation code.

Expected deliverables:
- Users can compare 2-5 schools side-by-side
- Comparison basket persists across page refreshes
- All comparison features fully tested
- MVP complete and ready for use

Timeline: 2 days
```

---

## Executing Implementation Plans

Use these prompts to execute a detailed plan that was created in a previous session.

### General Execution Prompt

```
Execute the implementation plan at docs/plans/[PLAN_FILE_NAME].md.

Use TDD approach:
- Write tests FIRST (Red)
- Implement minimal code to pass (Green)
- Refactor while keeping tests green (Refactor)

Work in small batches with review checkpoints. Stop for review after each major section of the plan.

Let me know when you need me to review before proceeding to the next batch.
```

### Example for Phase 1

```
Execute the implementation plan at docs/plans/phase1-backend-foundation-plan.md.

Use TDD approach throughout. Write tests first, then implement.

Work in small batches and pause for my review:
- Batch 1: Project structure + pytest setup
- Batch 2: Database models + tests
- Batch 3: Data import script + tests

Stop after each batch for my review before continuing.
```

---

## Code Review Prompts

Use these prompts to request code review at phase boundaries.

### Phase Completion Review

```
The implementor agent has completed Phase 4: Data Management.

Please review the implementation against:
- The original plan at docs/plans/2025-11-03-settings-menu-implementation.md
- The project overview at PROJECT_OVERVIEW.md

Check for:
- All tests passing
- TDD followed correctly
- Code quality and best practices
- Edge cases handled
- Deliverables complete

Use /superpowers:request-code-review
```

---

## Troubleshooting Prompts

### When Tests Fail

```
I'm seeing test failures in [TEST_FILE].

Current error:
[PASTE ERROR MESSAGE]

Please help debug using systematic-debugging skill:
1. Investigate root cause
2. Analyze patterns
3. Test hypothesis
4. Implement fix

Show me the fix and updated tests.
```

### When Stuck on Implementation

```
I'm stuck implementing [FEATURE_NAME] from the plan.

Current issue:
[DESCRIBE ISSUE]

The plan says to do [X], but I'm encountering [Y].

Please help me:
1. Understand what's going wrong
2. Suggest a solution that stays true to the plan
3. Update tests if needed
```

---

## Quick Reference Commands

```bash
# Create a new detailed plan
/superpowers:write-plan

# Execute an existing plan
/superpowers:execute-plan

# Request code review
/superpowers:request-code-review

# Get help with brainstorming
/superpowers:brainstorm

# Debug systematically
Use systematic-debugging skill (describe the problem in your prompt)
```

---

## Tips for Working with Plans

1. **Always reference the design doc:** Make sure Claude knows where the design is
2. **Specify phase boundaries clearly:** "Phase 1 only" or "Focus on backend API only"
3. **Emphasize TDD:** Always mention "Write tests FIRST before implementation"
4. **Request batch execution:** "Work in batches with review checkpoints"
5. **Be specific about deliverables:** Copy them from IMPLEMENTATION-ROADMAP.md

---

## Example Full Session Flow

```
Session 1: Planning
User: [Copy Phase 1 prompt from above]
Claude: Creates docs/plans/phase1-backend-foundation-plan.md

Session 2: Implementation Batch 1
User: "Execute batch 1 of docs/plans/phase1-backend-foundation-plan.md"
Claude: Implements project structure + pytest setup
User: Reviews, gives feedback

Session 3: Implementation Batch 2
User: "Continue with batch 2"
Claude: Implements database models + tests
User: Reviews, gives feedback

Session 4: Implementation Batch 3
User: "Continue with batch 3"
Claude: Implements data import + tests
User: Reviews, gives feedback

Session 5: Phase Review
User: [Copy Phase Completion Review prompt]
Claude: Reviews entire Phase 1
User: Approves, ready for Phase 2

Session 6: Next Phase Planning
User: [Copy Phase 2 prompt from above]
Claude: Creates docs/plans/phase2-backend-api-plan.md

... repeat ...
```

---

**Last Updated:** 2025-11-05
**Project:** Illinois School Explorer
