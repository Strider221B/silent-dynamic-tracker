# Execution Plan 01 — Project Foundation & Domain Schemas

**Phase:** 01  
**Document:** `01_project_foundation.md`  
**Prerequisites:** None  
**References:**  
- [001_high_level_design.md §3, §7](../design/high_level/001_high_level_design.md)  
- [001_initial.md §1, §3](../requirements/001_initial.md)  
- [python_coding_standards.md §5, §6, §7, §8, §9, §10, §14](../coding_standards/python_coding_standards.md)  
- [frontend_coding_standards.md §5, §6, §7, §8, §9, §10, §11, §14](../coding_standards/frontend_coding_standards.md)  

---

## 1. Objectives & Scope

Establish the foundational infrastructure for both the Python backend and React TypeScript frontend workspaces. This includes:
1. Setting up package managers, linting, type-checking, and test runners with mandatory 90%+ coverage configurations.
2. Defining strongly typed domain models and data schemas for Google Drive persistence (`config.json`, `summary_index.json`, `logs/YYYY-MM-DD.json`).
3. Implementing foundational constants and stateless utility functions with complete test coverage.

---

## 2. Directory & File Plan

```
silent-dynamic-tracker/
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── __init__.py
│   │   ├── constants/
│   │   │   ├── __init__.py
│   │   │   └── app_constants.py
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── environmental_model.py
│   │       ├── config_model.py
│   │       ├── summary_index_model.py
│   │       └── daily_payload_model.py
│   └── tests/
│       ├── __init__.py
│       ├── test_app_constants.py
│       ├── test_environmental_model.py
│       ├── test_config_model.py
│       ├── test_summary_index_model.py
│       └── test_daily_payload_model.py
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── .eslintrc.cjs
    ├── index.html
    └── src/
        ├── constants/
        │   ├── appConstants.ts
        │   └── epaConstants.ts
        ├── types/
        │   ├── environmental.ts
        │   ├── config.ts
        │   ├── summaryIndex.ts
        │   └── dailyPayload.ts
        ├── utils/
        │   ├── dateUtils.ts
        │   └── stringUtils.ts
        └── tests/
            ├── constants.test.ts
            ├── dateUtils.test.ts
            └── stringUtils.test.ts
```

---

## 3. Backend Implementation Specification

### 3.1 Workspace & Tooling Configuration (`backend/pyproject.toml`)
Must define:
- Project metadata: `name = "silent-dynamic-tracker-backend"`, `requires-python = ">=3.13"`.
- Dependencies: `fastapi>=0.115.0`, `uvicorn>=0.32.0`, `pydantic>=2.10.0`, `httpx>=0.28.0`.
- Dev dependencies: `ruff>=0.8.0`, `mypy>=1.13.0`, `pytest>=8.3.0`, `pytest-cov>=6.0.0`, `pytest-asyncio>=0.24.0`.
- Tool configs:
  - `[tool.ruff]`: line-length 100.
  - `[tool.ruff.lint]`: select `["E", "W", "F", "I"]`.
  - `[tool.mypy]`: `strict = true`, plugins `["pydantic.mypy"]`.
  - `[tool.pytest.ini_options]`: `addopts = "--cov=app --cov-report=term-missing --cov-report=xml --cov-fail-under=90"`.

### 3.2 Constants (`backend/app/constants/app_constants.py`)
Class `AppConstants`:
- `_DEFAULT_CONFIG_VERSION = "1.0"`
- `_DRIVE_FOLDER_NAME = "SilentDynamicTracker"`
- `_CONFIG_FILE_NAME = "config.json"`
- `_INDEX_FILE_NAME = "summary_index.json"`
- `_LOGS_DIR_NAME = "logs"`
- Public static getters or class-level constants conforming to OOP standards.

### 3.3 Domain Models (Strict Pydantic V2)
All models must have strict field validation and docstrings.

#### 3.3.1 `backend/app/models/environmental_model.py`
- Enums: `EpaIndexEnum` (1: Good, 2: Moderate, 3: Unhealthy for Sensitive Groups, 4: Unhealthy, 5: Very Unhealthy, 6: Hazardous).
- Enum: `EnvironmentalSourceEnum` ("api", "manual").
- Class `EnvironmentalModel(BaseModel)`:
  - `temperature: str | None = None`
  - `condition: str | None = None`
  - `aqi: str | None = None` (mapped text)
  - `aqi_numeric: int | None = Field(default=None, ge=1, le=6)`
  - `pm25: float | None = Field(default=None, ge=0.0)`
  - `source: EnvironmentalSourceEnum | None = None`

#### 3.3.2 `backend/app/models/config_model.py`
- Class `StandardQuestion(BaseModel)`:
  - `id: str`
  - `question: str`
  - `type: str = Field(pattern="^(select_one|select_multiple)$")`
  - `options: list[str]`
  - `default: str | list[str]`
- Class `SavedCustomQuestion(BaseModel)`:
  - `id: str`
  - `question: str`
  - `type: str = Field(pattern="^(select_one|select_multiple)$")`
  - `options: list[str]`
  - `default: str | list[str]`
- Class `ConfigModel(BaseModel)`:
  - `version: str = "1.0"`
  - `standard_questions: list[StandardQuestion] = Field(default_factory=list)`
  - `custom_saved_questions: list[SavedCustomQuestion] = Field(default_factory=list)`

#### 3.3.3 `backend/app/models/summary_index_model.py`
- Class `SummaryIndexEntry(BaseModel)`:
  - `date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")`
  - `location: str`
  - `weather_summary: str | None = None`
  - `aqi_summary: str | None = None`
  - `mcq_responses: dict[str, str | list[str]] = Field(default_factory=dict)`
  - `custom_entries_exist: bool = False`
- Class `SummaryIndexModel(BaseModel)`:
  - `entries: list[SummaryIndexEntry] = Field(default_factory=list)`

#### 3.3.4 `backend/app/models/daily_payload_model.py`
- Class `CustomQuestionAddition(BaseModel)`:
  - `question: str`
  - `type: str`
  - `selections: list[str]`
- Class `CustomAdditions(BaseModel)`:
  - `custom_questions: list[CustomQuestionAddition] = Field(default_factory=list)`
- Class `DailyPayloadModel(BaseModel)`:
  - `date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")`
  - `location: str`
  - `environmental_data: EnvironmentalModel | None = None`
  - `standard_responses: dict[str, str | list[str]] = Field(default_factory=dict)`
  - `custom_additions: CustomAdditions = Field(default_factory=CustomAdditions)`
  - `free_form_notes: str = ""`

---

## 4. Frontend Implementation Specification

### 4.1 Tooling & Configuration
- `frontend/package.json`:
  - Dependencies: `react@^18.3.1`, `react-dom@^18.3.1`.
  - DevDependencies: `typescript@^5.6.0`, `vite@^5.4.0`, `@vitejs/plugin-react@^4.3.0`, `vitest@^2.1.0`, `@testing-library/react@^16.0.0`, `@testing-library/jest-dom@^6.6.0`, `jsdom@^25.0.0`, `eslint@^9.0.0`.
- `frontend/tsconfig.json`:
  - `"compilerOptions"`: `"strict": true`, `"target": "ES2022"`, `"moduleResolution": "bundler"`, `"baseUrl": "."`, `"paths": { "@/*": ["src/*"] }`.
- `frontend/vitest.config.ts`:
  - Coverage provider: `v8`, `failUnder: 90`, `lines: 90`, `branches: 90`, `functions: 90`, `statements: 90`.

### 4.2 Type Definitions
- `frontend/src/types/environmental.ts`:
  - `EpaIndexNumeric = 1 | 2 | 3 | 4 | 5 | 6;`
  - `EpaIndexText = "Good" | "Moderate" | "Unhealthy for Sensitive Groups" | "Unhealthy" | "Very Unhealthy" | "Hazardous" | "Unknown";`
  - `EnvironmentalSource = "api" | "manual";`
  - `interface IEnvironmentalData { temperature: string | null; condition: string | null; aqi: EpaIndexText | null; aqi_numeric?: EpaIndexNumeric | null; pm25?: number | null; source?: EnvironmentalSource | null; }`
- `frontend/src/types/config.ts`:
  - `type QuestionType = "select_one" | "select_multiple";`
  - `interface IStandardQuestion { id: string; question: string; type: QuestionType; options: string[]; default: string | string[]; }`
  - `interface ISavedCustomQuestion extends IStandardQuestion {}`
  - `interface IAppConfig { version: string; standard_questions: IStandardQuestion[]; custom_saved_questions: ISavedCustomQuestion[]; }`
- `frontend/src/types/summaryIndex.ts`:
  - `interface ISummaryIndexEntry { date: string; location: string; weather_summary: string | null; aqi_summary: string | null; mcq_responses: Record<string, string | string[]>; custom_entries_exist: boolean; }`
  - `type ISummaryIndex = ISummaryIndexEntry[];`
- `frontend/src/types/dailyPayload.ts`:
  - `interface ICustomQuestionAddition { question: string; type: string; selections: string[]; }`
  - `interface IDailyPayload { date: string; location: string; environmental_data: IEnvironmentalData | null; standard_responses: Record<string, string | string[]>; custom_additions: { custom_questions: ICustomQuestionAddition[] }; free_form_notes: string; }`

### 4.3 Shared Constants
- `frontend/src/constants/appConstants.ts`:
  - App metadata, Google Drive folder name (`"SilentDynamicTracker"`), file names (`"config.json"`, `"summary_index.json"`), max line limits.
- `frontend/src/constants/epaConstants.ts`:
  - Map of `1..6` to EPA labels.

### 4.4 Utility Functions
- `frontend/src/utils/dateUtils.ts`:
  - `formatDateToISO(date: Date): string`
  - `isMidnightWindow(date: Date): boolean` (00:00 - 04:59)
  - `getYesterdayDate(date: Date): string`
  - `parseISODate(dateStr: string): Date`
- `frontend/src/utils/stringUtils.ts`:
  - `sanitizeText(input: string): string`
  - `truncateText(input: string, maxLength: number): string`

---

## 5. Testing & Verification Plan

### Backend Unit Tests (Target: 100%, Min: 90%)
- `test_config_model.py`: Valid schema serialization/deserialization, invalid types, empty arrays, default values.
- `test_summary_index_model.py`: Date regex validation, empty mcq_responses, invalid date formatting rejection.
- `test_daily_payload_model.py`: Valid payload, missing optional fields, nested custom questions.
- `test_environmental_model.py`: EPA index boundary validation (1–6), PM2.5 non-negative validation, source enum.

### Frontend Unit Tests (Target: 100%, Min: 90%)
- `dateUtils.test.ts`: Date formatting, rollover boundary tests (04:59 vs 05:00), yesterday calculation across month and year boundaries.
- `stringUtils.test.ts`: Sanitization of XSS characters (`<script>`, quotes), string truncation with ellipsis.
- `constants.test.ts`: EPA label mappings completeness.

### CI Verification Commands
```bash
# Backend CI verification
cd backend
source ~/python_envs/p313_llm/bin/activate
uv run --with ruff ruff check .
uv run --with mypy mypy app
uv run pytest

# Frontend CI verification
cd frontend
npm run lint
npx tsc --noEmit
npm run test -- --coverage
```

---

## 6. Verification Checklist

| Requirement | Rule | Verified |
|---|---|---|
| Single class per file | Python §8 / Frontend §8 | [ ] |
| File name matches class/export | Python §8 / Frontend §8 | [ ] |
| Member ordering respected | Python §5 / Frontend §5 | [ ] |
| Python methods ≤ 20 lines | Python §6 | [ ] |
| TypeScript logic ≤ 30 lines | Frontend §6 | [ ] |
| File length ≤ 500 lines (Py) / ≤ 300 lines (TS) | Python §7 / Frontend §7 | [ ] |
| No magic strings/numbers | Python §10 / Frontend §10 | [ ] |
| Type annotations / Strict TS | Python §12 / Frontend §12 | [ ] |
| Test coverage ≥ 90% | Python §9, §14 / Frontend §9, §14 | [ ] |

