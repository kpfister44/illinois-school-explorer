# Illinois School Explorer

A web application for searching and comparing Illinois schools using the 2025 Report Card Public Dataset.

## Project Status

**Current Phase:** Design Complete, Ready for Implementation

## Quick Links

- 📋 **[Design Document](docs/plans/2025-11-05-illinois-school-explorer-design.md)** - Full technical design
- 🗺️ **[Implementation Roadmap](docs/plans/IMPLEMENTATION-ROADMAP.md)** - High-level phases and deliverables
- 💬 **[Prompt Templates](docs/PROMPTS.md)** - Copy/paste prompts for Claude Code sessions

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLite with FTS5 (full-text search)
- SQLAlchemy (ORM)
- pytest (testing)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- shadcn/ui + Tailwind CSS (UI components)
- TanStack Query (data fetching)
- Vitest + Playwright (testing)

## Features

- 🔍 **Search schools** by name or city with autocomplete
- 📊 **View key metrics**: Enrollment, ACT scores, EL %, Low Income %, Diversity breakdown
- ⚖️ **Compare schools** side-by-side (2-5 at a time)
- 📱 **Responsive design** for mobile and desktop
- ✅ **Full test coverage** (TDD approach)

## Project Structure

```
illinois-school-explorer/
├── backend/               # FastAPI backend (to be created)
├── frontend/              # React frontend (to be created)
├── data/                  # Excel source data
│   └── 2025-Report-Card-Public-Data-Set.xlsx
├── docs/
│   ├── plans/            # Design documents and detailed plans
│   │   ├── 2025-11-05-illinois-school-explorer-design.md
│   │   └── IMPLEMENTATION-ROADMAP.md
│   └── PROMPTS.md        # Prompt templates for Claude Code
└── README.md             # This file
```

### For Running

```bash
# Backend
cd backend
uv venv
uv pip install -r requirements.txt
uv run python -m app.utils.import_data ../data/2025-Report-Card-Public-Data-Set.xlsx
uv run uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

## Development Approach

**Test-Driven Development (TDD):**
- Write tests FIRST (Red)
- Implement minimal code to pass (Green)
- Refactor while keeping tests green (Refactor)

**Why TDD?**
- Ensures code works as expected
- Catches bugs early
- Makes refactoring safe
- Serves as documentation

## Data Source

- **File:** `data/2025-Report-Card-Public-Data-Set.xlsx`
- **Size:** 39MB, 4,692 school records
- **Sheets Used:** "General" (demographics, enrollment) + "ACT" (test scores)
- **Source:** Illinois State Board of Education (Report Cards)

## Future Enhancements

Post-MVP features (not in initial scope):
- Additional metrics (graduation rates, teacher stats, etc.)
- Advanced search filters and sorting
- Export comparison to PDF/CSV
- Map view with geographic search
- Deployment to cloud (Vercel + Railway/Render)

## Contributing

This is a personal project, but contributions are welcome! Please:
1. Follow TDD approach
2. Ensure all tests pass
3. Update documentation as needed

## License

[Add your license here]

---

**Questions?** See the [Design Document](docs/plans/2025-11-05-illinois-school-explorer-design.md) for full technical details.
