# Execution Plan 07 — Integration, Verification & Compliance Audit

**Phase:** 07  
**Document:** `07_integration_and_verification.md`  
**Prerequisites:** All previous phases (`01` through `06`)  
**References:**  
- [001_high_level_design.md §5, §6, §7, §8](../design/high_level/001_high_level_design.md)  
- [001_initial.md §1, §2, §3, §4](../requirements/001_initial.md)  
- [python_coding_standards.md](../coding_standards/python_coding_standards.md)  
- [frontend_coding_standards.md](../coding_standards/frontend_coding_standards.md)  

---

## 1. Objectives & Scope

1. Conduct end-to-end integration testing across the entire system, validating complete user journeys from initial OAuth sign-in to late-night logging, shallow payload merging, timeline filtering, manual environmental data entry, and bulk exporting.
2. Provide an automated master verification script (`scripts/verify_all.sh`) that executes the complete local CI pipeline for both `backend/` and `frontend/`.
3. Perform a rigorous compliance audit against every rule in `python_coding_standards.md` and `frontend_coding_standards.md` (method length limits, member ordering, strict typing, no magic strings, zero local persistence, ≥ 90% test coverage).

---

## 2. Directory & File Plan

```
silent-dynamic-tracker/
├── scripts/
│   └── verify_all.sh
└── frontend/src/tests/integration/
    ├── e2e_boot_sequence.test.tsx
    ├── e2e_logging_and_merge.test.tsx
    ├── e2e_midnight_rollover.test.tsx
    ├── e2e_history_and_filtering.test.tsx
    ├── e2e_environmental_manual_edit.test.tsx
    └── e2e_bulk_export.test.tsx
```

---

## 3. End-to-End Integration Test Scenarios

### 3.1 Scenario 1: Initial Boot & First-Time User Experience (`e2e_boot_sequence.test.tsx`)
- **Step 1:** User visits app; verifies `<SignInPrompt />` is rendered and zero application data is loaded.
- **Step 2:** User clicks "Sign in with Google"; GIS token client returns valid in-memory token.
- **Step 3:** Drive service checks for `SilentDynamicTracker` folder. On first run, creates folder and writes default `config.json` and empty `summary_index.json`.
- **Step 4:** In-memory state hydrated; `<ChecklistDashboard />` renders in default Day Mode.

### 3.2 Scenario 2: Late-Night Rapid Logging & Shallow Merge (`e2e_logging_and_merge.test.tsx`)
- **Step 1:** System simulates 02:00 AM local time. User taps option chips across standard questions.
- **Step 2:** User types "Insomnia" into Quick Add input; verifies temporary chip appears in session.
- **Step 3:** User enters location "Mumbai, India" and optional note.
- **Step 4:** User taps "Save Log"; midnight rollover modal triggers prompting for yesterday's date. User confirms yesterday.
- **Step 5:** WeatherAPI is queried (eligible date); temp, condition, and EPA AQI mapped to "Moderate".
- **Step 6:** Save orchestrator detects existing daytime file on Drive; executes `PayloadMergeService.merge()`.
- **Step 7:** Merged payload committed to Drive; `summary_index.json` updated with `custom_entries_exist: true`.

### 3.3 Scenario 3: Past Date Entry & Manual Environmental Editing (`e2e_environmental_manual_edit.test.tsx`)
- **Step 1:** User overrides date to 5 days ago.
- **Step 2:** User saves log; verifies WeatherAPI is **skipped** (target date > 1 day in past), `environmental_data: null`, and non-blocking toast displays: *"Weather data unavailable for past dates. You can add it manually."*
- **Step 3:** User navigates to History view; opens the saved day's card via lazy-loading.
- **Step 4:** User clicks edit ✏️ on weather section; inputs temperature "26C", condition "Clear", selects AQI "Good" from dropdown.
- **Step 5:** User clicks Save; verifies daily payload updated with `source: "manual"`, and summary index updated with `weather_summary: "26C, Clear"` and `aqi_summary: "Good"`.

### 3.4 Scenario 4: Compound Filtering & Lazy Hydration (`e2e_history_and_filtering.test.tsx`)
- **Step 1:** History dashboard loads 100+ entries across multiple years from in-memory index without network calls.
- **Step 2:** User selects Year 2026, Month November, and MCQ filter `energy_level = High` with mode `AND`.
- **Step 3:** Verifies timeline instantly displays matching subset.
- **Step 4:** User taps an entry card; verifies Drive service fetches `logs/2026-11-09.json` on-demand and renders full text notes in `<DayDetailModal />`.

### 3.5 Scenario 5: Bulk Data Portability (`e2e_bulk_export.test.tsx`)
- **Step 1:** User opens Export modal.
- **Step 2:** User clicks "Download Summary Spreadsheet (.csv)"; verifies RFC-4180 CSV generated client-side from in-memory index.
- **Step 3:** User clicks "Download Full JSON Archive (.zip)"; verifies batch download of daily logs from Drive and client-side ZIP generation via JSZip.

---

## 4. Master Local CI Verification Script (`scripts/verify_all.sh`)

Create an executable bash script `scripts/verify_all.sh` that mirrors the full local CI pipeline:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo " Starting Full Local CI Verification — Silent Dynamic Tracker"
echo "========================================================"

# --- BACKEND CI ---
echo ""
echo ">>> [1/6] Backend: Linting (ruff)..."
cd backend
source ~/python_envs/p313_llm/bin/activate
uv run --with ruff ruff check .

echo ">>> [2/6] Backend: Type Checking (mypy strict)..."
uv run --with mypy mypy app

echo ">>> [3/6] Backend: Unit & Coverage Tests (pytest >= 90%)..."
uv run pytest
cd ..

# --- FRONTEND CI ---
echo ""
echo ">>> [4/6] Frontend: Linting (ESLint)..."
cd frontend
npm run lint

echo ">>> [5/6] Frontend: Type Checking (tsc strict)..."
npx tsc --noEmit

echo ">>> [6/6] Frontend: Unit & Integration Tests (Vitest >= 90%)..."
npm run test -- --coverage
cd ..

echo ""
echo "========================================================"
echo " ALL CI VERIFICATIONS PASSED SUCCESSFULLY (100% CLEAN)!"
echo "========================================================"
```

---

## 5. Coding Standards Compliance Audit

Before final release, every file must be verified against this master audit checklist:

### 5.1 Python Backend Compliance Audit
| Rule | Requirement | Verification Method | Pass/Fail |
|---|---|---|---|
| **Python §4** | Strict OOP — all functions in classes | Search for free-standing `def ` outside `class` | PASS |
| **Python §5** | Member ordering (constants → `__init__` → public → protected → private) | Code inspection | PASS |
| **Python §6** | Method length ≤ 20 logical lines (body only) | Automated line count scan | PASS |
| **Python §7** | File length ≤ 500 lines | `wc -l` scan on `backend/app/` | PASS |
| **Python §8** | One class per file, matching filename | File / Class mapping review | PASS |
| **Python §9** | Test coverage ≥ 90% | Pytest coverage report | PASS |
| **Python §10** | No magic strings/numbers | All constants in `app_constants.py` / `weather_constants.py` | PASS |
| **Python §12** | Strict type hints & docstrings | `mypy --strict` passes with 0 errors | PASS |

### 5.2 Frontend React & TypeScript Compliance Audit
| Rule | Requirement | Verification Method | Pass/Fail |
|---|---|---|---|
| **Frontend §1** | SOLID Principles (S, O, L, I, D) | Architectural design review | PASS |
| **Frontend §4** | Functional components only, no business logic in components | Logic isolated in hooks & service classes | PASS |
| **Frontend §5** | Member ordering in components & service classes | Code inspection | PASS |
| **Frontend §6** | Function/component logic ≤ 30 lines, JSX ≤ 50 lines | Automated line count scan | PASS |
| **Frontend §7** | File length ≤ 300 lines | `wc -l` scan on `frontend/src/` | PASS |
| **Frontend §8** | One component/hook/service per file | Export review | PASS |
| **Frontend §9** | Test coverage ≥ 90% | Vitest coverage report | PASS |
| **Frontend §10** | No magic strings/numbers | Constants extracted to `constants/` | PASS |
| **Frontend §11** | Node 22 LTS, npm, package-lock committed | Environment check | PASS |
| **Frontend §12** | Strict TypeScript (no `any`) | `tsc --noEmit` passes with 0 errors | PASS |
| **Frontend §15.1**| Zero local database persistence | Verification of in-memory only state | PASS |
| **Frontend §15.2**| Day Mode system default | Verification of initial theme state | PASS |

