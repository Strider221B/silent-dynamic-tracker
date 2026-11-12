# Execution Plan 03 — Environmental Service & Weather Proxy

**Phase:** 03  
**Document:** `03_environmental_service_and_weather_proxy.md`  
**Prerequisites:** `01_project_foundation.md`  
**References:**  
- [001_high_level_design.md §4.5, §6](../design/high_level/001_high_level_design.md)  
- [001_initial.md §2.2, §3.2, §3.3](../requirements/001_initial.md)  
- [python_coding_standards.md §1, §4, §5, §6, §7, §8, §9, §10, §14](../coding_standards/python_coding_standards.md)  
- [frontend_coding_standards.md §1, §4, §5, §6, §7, §8, §9, §10, §14](../coding_standards/frontend_coding_standards.md)  

---

## 1. Objectives & Scope

1. Implement a secure backend proxy service in Python (FastAPI) that calls WeatherAPI.com using a server-side secret API key (resolving the security vulnerability flagged in HLD §6 regarding exposing API keys in client code).
2. Transform raw WeatherAPI.com responses into the normalized `EnvironmentalModel`, extracting temperature, condition, PM2.5, and converting the numeric `us-epa-index` (1–6) into human-readable text labels ("Good" ... "Hazardous").
3. Implement date eligibility checking: real-time weather is only queried for target dates within the current or previous calendar day (today or yesterday). Entries > 1 day in the past skip the API call and default to `null`.
4. Implement the frontend `WeatherService` class and `useWeather` hook with graceful error degradation (network failure / timeout does not block saving).

---

## 2. Directory & File Plan

```
backend/
├── app/
│   ├── main.py
│   ├── constants/
│   │   └── weather_constants.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── weather_service.py
│   └── controllers/
│       ├── __init__.py
│       └── weather_controller.py
└── tests/
    ├── test_weather_constants.py
    ├── test_weather_service.py
    ├── test_weather_controller.py
    └── test_main.py

frontend/src/
├── constants/
│   └── weatherConstants.ts
├── services/
│   └── WeatherService.ts
├── hooks/
│   └── useWeather.ts
└── tests/
    ├── services/
    │   └── WeatherService.test.ts
    └── hooks/
        └── useWeather.test.ts
```

---

## 3. Backend Implementation Specification (Python FastAPI)

### 3.1 Constants (`backend/app/constants/weather_constants.py`)
Class `WeatherConstants`:
- `_BASE_URL: str = "https://api.weatherapi.com/v1"`
- `_CURRENT_ENDPOINT: str = "/current.json"`
- `_DEFAULT_TIMEOUT_SECONDS: float = 5.0`
- `_EPA_LABELS: dict[int, str] = {1: "Good", 2: "Moderate", 3: "Unhealthy for Sensitive Groups", 4: "Unhealthy", 5: "Very Unhealthy", 6: "Hazardous"}`
- Public class methods/getters for label mapping and endpoints.

### 3.2 Service Class (`backend/app/services/weather_service.py`)
Class `WeatherService`:
- Strict OOP encapsulation of HTTP calls to WeatherAPI.com using `httpx.AsyncClient`.
- **Member Ordering:**
  1. Private constants (`_AQI_QUERY_PARAM = "yes"`)
  2. `__init__(self, api_key: str | None = None, http_client: httpx.AsyncClient | None = None)`
  3. Public methods:
     - `async def fetch_weather_and_aqi(self, location: str) -> EnvironmentalModel | None`:
       - Validates location non-empty.
       - Dispatches request to WeatherAPI.com.
       - Parses JSON response via private helper methods.
       - Catches timeouts and HTTP errors, returning `None` instead of raising uncaught exceptions.
     - `def map_epa_index_to_text(self, index: int | None) -> str`:
       - Maps index 1–6 to label; returns "Unknown" if missing or invalid.
  4. Private methods:
     - `def _build_request_url(self, location: str) -> str`
     - `def _parse_response_payload(self, data: dict[str, Any]) -> EnvironmentalModel`
- **Method length:** ≤ 20 logical lines per method.

### 3.3 Controller Class (`backend/app/controllers/weather_controller.py`)
Class `WeatherController`:
- Encapsulates FastAPI router for weather endpoints.
- **Member Ordering:**
  1. Private constants (`_ROUTE_PREFIX = "/api/weather"`)
  2. `__init__(self, weather_service: WeatherService)`
  3. Public methods:
     - `get_router(self) -> APIRouter`: Returns configured FastAPI router.
     - `async def get_weather(self, location: str = Query(..., min_length=1)) -> EnvironmentalModel`:
       - Injected endpoint handler. Calls `weather_service.fetch_weather_and_aqi(location)`.
       - If `None`, returns 404 or empty model with `status: "unavailable"`.
  4. Private methods:
     - `def _register_routes(self) -> None`

### 3.4 Application Entry Point (`backend/app/main.py`)
Class `ApplicationServer`:
- Encapsulates FastAPI app creation, CORS middleware setup, and router mounting.
- Public methods:
  - `get_app(self) -> FastAPI`
  - `run(self, host: str = "0.0.0.0", port: int = 8000) -> None`
- Invoked under `if __name__ == "__main__":` via `ApplicationServer().run()`.

---

## 4. Frontend Implementation Specification (TypeScript)

### 4.1 Constants (`frontend/src/constants/weatherConstants.ts`)
- `WEATHER_PROXY_ENDPOINT = "/api/weather"`
- `PAST_DATE_TOAST_MESSAGE = "Weather data unavailable for past dates. You can add it manually."`
- `API_FAILURE_TOAST_MESSAGE = "Weather data unavailable. You can add it manually."`
- `MAX_ELIGIBLE_DAYS_FOR_WEATHER = 1`

### 4.2 Service Class (`frontend/src/services/WeatherService.ts`)
Class `WeatherService`:
- **Member Ordering:**
  1. Private static constants (`_TIMEOUT_MS = 5000`)
  2. Constructor: accepts optional `baseUrl: string`
  3. Public methods:
     - `isDateEligibleForWeather(targetDate: string): boolean`:
       - Compares `targetDate` against today and yesterday.
       - Returns `true` if targetDate is today or yesterday; `false` if > 1 day in the past or in the future.
     - `fetchEnvironmentalData(location: string, targetDate: string): Promise<IEnvironmentalData | null>`:
       - Checks `isDateEligibleForWeather(targetDate)`. If `false`, returns `null` immediately.
       - Calls `/api/weather?location=${encodeURIComponent(location)}` with abort timeout.
       - Returns `IEnvironmentalData` with `source: "api"`.
       - On HTTP error or network failure, returns `null` (caller shows toast).
  4. Private methods:
     - `_buildFetchOptions(): RequestInit`
     - `_parseEnvironmentalResponse(data: unknown): IEnvironmentalData`
- **Constraints:** Logic ≤ 30 lines per method. File ≤ 300 lines. Strict typing.

### 4.3 Custom Hook (`frontend/src/hooks/useWeather.ts`)
Custom hook `useWeather`:
- Inputs: `weatherService: WeatherService`, `showToast: (msg: string) => void`.
- Returns:
  - `isLoadingWeather: boolean`
  - `getEnvironmentalDataForDate(location: string, targetDate: string): Promise<IEnvironmentalData | null>`
- Encapsulates toast notifications when weather is skipped due to past date or network failure.

---

## 5. Testing & Verification Plan

### Backend Unit Tests (Pytest) — Coverage ≥ 90%
1. **`test_weather_service.py`:**
   - Happy path: mock 200 response from WeatherAPI.com; verify extraction of temp, condition, aqi (text), aqi_numeric, and pm25.
   - EPA index boundary mapping: index 1 → "Good", index 6 → "Hazardous", index 7/null → "Unknown".
   - Network failure: mock `httpx.TimeoutException` and `httpx.HTTPStatusError`; assert service returns `None` without crashing.
2. **`test_weather_controller.py`:**
   - Endpoint `GET /api/weather?location=Mumbai`: verifies 200 OK and JSON structure matching `EnvironmentalModel`.
   - Empty/missing location: verifies 422 Unprocessable Entity.
3. **`test_main.py`:**
   - Health check endpoint `GET /api/health` returns 200 OK.
   - CORS middleware headers present.

### Frontend Unit Tests (Vitest) — Coverage ≥ 90%
1. **`WeatherService.test.ts`:**
   - Date eligibility: today and yesterday return `true`; 2 days ago returns `false`.
   - Happy path fetch: returns normalized `IEnvironmentalData` object with `source: "api"`.
   - Past date fetch: returns `null` immediately without network call.
   - Fetch failure: mock network error / 500 response; returns `null`.
2. **`useWeather.test.ts`:**
   - Triggers `PAST_DATE_TOAST_MESSAGE` when querying a date > 1 day in the past.
   - Triggers `API_FAILURE_TOAST_MESSAGE` when backend returns error.

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
| File name matches class name | Python §8 / Frontend §8 | [ ] |
| Member ordering in classes | Python §5 / Frontend §5 | [ ] |
| Python methods ≤ 20 lines | Python §6 | [ ] |
| TypeScript logic ≤ 30 lines | Frontend §6 | [ ] |
| File ≤ 500 lines (Py) / ≤ 300 lines (TS) | Python §7 / Frontend §7 | [ ] |
| No magic strings/numbers | Python §10 / Frontend §10 | [ ] |
| Strict type hints / No `any` | Python §12 / Frontend §12 | [ ] |
| Test coverage ≥ 90% | Python §9, §14 / Frontend §9, §14 | [ ] |
| API key kept secure server-side | HLD §6 | [ ] |

