# Execution Plan 05 — History Timeline, Compound Filtering & Lazy Hydration

**Phase:** 05  
**Document:** `05_history_timeline_and_filtering.md`  
**Prerequisites:** `01_project_foundation.md`, `02_auth_and_drive_service.md`, `04_checklist_and_logging_engine.md`  
**References:**  
- [001_high_level_design.md §4.5.5, §4.7](../design/high_level/001_high_level_design.md)  
- [001_initial.md §2.4, §3.2, §3.3](../requirements/001_initial.md)  
- [frontend_coding_standards.md §1, §4, §5, §6, §7, §8, §9, §10, §14, §15](../coding_standards/frontend_coding_standards.md)  

---

## 1. Objectives & Scope

1. Build the historical timeline view that naturally groups saved logs by Year and Month, rendered entirely in-memory from `summary_index.json` without requiring any network calls during browsing.
2. Implement compound filtering controls:
   - Chronological dropdown filter (Year and Month multi-select, defaulting to "All Time").
   - MCQ matrix filter over standard responses supporting `AND` and `OR` logical operators and a complete `Reset` action.
3. Implement lazy-loading data hydration: tapping an entry card asynchronously fetches the full daily payload (`logs/YYYY-MM-DD.json`) on-demand from Google Drive.
4. Implement the manual environmental data editing modal (HLD §4.5.5): allowing users to add or edit temperature, condition, AQI (Good → Hazardous dropdown), and PM2.5 on any log, setting `source: "manual"` and updating both the daily payload and the summary index on Google Drive.

---

## 2. Directory & File Plan

```
frontend/src/
├── constants/
│   └── filterConstants.ts
├── services/
│   ├── TimelineGroupingService.ts
│   └── FilterEngineService.ts
├── hooks/
│   ├── useHistoryFilter.ts
│   └── useDayDetail.ts
├── components/
│   └── history/
│       ├── HistoryDashboard.tsx
│       ├── TimelineView.tsx
│       ├── TimelineMonthGroup.tsx
│       ├── TimelineEntryCard.tsx
│       ├── FilterBar.tsx
│       ├── DayDetailModal.tsx
│       └── EnvironmentalEditModal.tsx
└── tests/
    ├── services/
    │   ├── TimelineGroupingService.test.ts
    │   └── FilterEngineService.test.ts
    ├── hooks/
    │   ├── useHistoryFilter.test.ts
    │   └── useDayDetail.test.ts
    └── components/
        ├── HistoryDashboard.test.tsx
        ├── TimelineView.test.tsx
        ├── TimelineEntryCard.test.tsx
        ├── FilterBar.test.tsx
        ├── DayDetailModal.test.tsx
        └── EnvironmentalEditModal.test.tsx
```

---

## 3. Detailed Component & Service Architecture

### 3.1 Constants (`frontend/src/constants/filterConstants.ts`)
- `FILTER_MODE_AND = "AND"`
- `FILTER_MODE_OR = "OR"`
- `ALL_TIME_LABEL = "All Time"`
- `RESET_FILTERS_LABEL = "Reset"`
- `EMPTY_TIMELINE_MESSAGE = "No entries found matching active filters."`

### 3.2 Services (Pure TypeScript Classes)

#### 3.2.1 `TimelineGroupingService.ts`
Groups flat `summary_index.json` records into a nested Year → Month → Entries hierarchy.
- **Member Ordering:**
  1. Private static constants (`_MONTH_NAMES = ["January", "February", ...]`)
  2. Constructor
  3. Public methods:
     - `groupEntries(entries: ISummaryIndex): ITimelineYearGroup[]`:
       - Sorts entries chronologically descending (newest first).
       - Groups by Year (e.g. 2026), then by Month (e.g. November).
       - Returns structured array of `ITimelineYearGroup`.
     - `extractAvailableYearsAndMonths(entries: ISummaryIndex): Map<number, number[]>`
  4. Private methods:
     - `_parseYearAndMonth(dateStr: string): { year: number; month: number }`
     - `_formatMonthName(monthNumber: number): string`
- **Constraints:** Logic ≤ 30 lines. File ≤ 300 lines. Pure transformation without side effects.

#### 3.2.2 `FilterEngineService.ts`
Executes multi-criteria in-memory filtering against `summary_index.json`.
- **Member Ordering:**
  1. Private static constants
  2. Constructor
  3. Public methods:
     - `filter(entries: ISummaryIndex, timeFilter: ITimeFilterCriteria, mcqFilter: IMcqFilterCriteria): ISummaryIndex`:
       - Applies chronological filter (selected years and months).
       - Applies MCQ filter according to selected mode (`AND` or `OR`).
       - Returns filtered subset of entries.
  4. Private methods:
     - `_matchesTime(entry: ISummaryIndexEntry, criteria: ITimeFilterCriteria): boolean`
     - `_matchesMcq(entry: ISummaryIndexEntry, criteria: IMcqFilterCriteria): boolean`
     - `_matchMcqAnd(entry: ISummaryIndexEntry, selections: Map<string, string[]>): boolean`
     - `_matchMcqOr(entry: ISummaryIndexEntry, selections: Map<string, string[]>): boolean`
- **Constraints:** Strict adherence to AND / OR logic as specified in HLD §4.7.3.

### 3.3 Custom Hooks

#### 3.3.1 `useHistoryFilter.ts`
- State:
  - `selectedYears: number[]`
  - `selectedMonths: number[]`
  - `mcqSelections: Record<string, string[]>`
  - `matchMode: "AND" | "OR"`
- Computed:
  - `filteredEntries: ISummaryIndexEntry[]`
  - `groupedTimeline: ITimelineYearGroup[]`
  - `hasActiveFilters: boolean`
- Handlers:
  - `setTimeFilter(years: number[], months: number[]): void`
  - `toggleMcqFilter(questionId: string, value: string): void`
  - `setMatchMode(mode: "AND" | "OR"): void`
  - `resetFilters(): void`

#### 3.3.2 `useDayDetail.ts`
- State:
  - `activeEntryDate: string | null`
  - `cachedPayloads: Map<string, IDailyPayload>` (in-memory cache for session)
  - `isLoadingPayload: boolean`
  - `payloadError: string | null`
  - `isEditingEnvironmental: boolean`
- Actions:
  - `openDayDetail(date: string): Promise<void>`: checks cache; if miss, fetches `logs/YYYY-MM-DD.json` via `DriveService`.
  - `closeDayDetail(): void`
  - `openEnvironmentalEdit(): void`
  - `closeEnvironmentalEdit(): void`
  - `saveEnvironmentalEdit(data: IEnvironmentalData): Promise<void>`:
    - Sets `source: "manual"`.
    - Updates daily payload file on Drive.
    - Updates `weather_summary` and `aqi_summary` in `summary_index.json` on Drive.
    - Updates local in-memory cache and summary index state.

### 3.4 UI Components

#### 3.4.1 `TimelineEntryCard.tsx`
- Renders summary row: Date, Location, Weather summary badge, AQI summary badge (color-coded by severity), and Custom Entries indicator icon.
- Tap triggers `openDayDetail(date)`.

#### 3.4.2 `FilterBar.tsx`
- Controls:
  - Time Dropdown (Years & Months multi-select).
  - MCQ Filter matrix (collapsible chip selector).
  - Mode toggle: AND / OR buttons.
  - "Reset" button (disabled when no active filters).

#### 3.4.3 `DayDetailModal.tsx`
- Slide-over / modal displaying full lazy-loaded day log:
  - Date & Location header.
  - Environmental section: temperature, condition, AQI, PM2.5, source badge ("API" vs "Manual"), and Edit icon ✏️.
  - Standard MCQ responses.
  - Custom questions / ad-hoc additions.
  - Free-form notes (displayed in full).

#### 3.4.4 `EnvironmentalEditModal.tsx`
- Inline form allowing user to manually enter or override:
  - Temperature (text field).
  - Condition (text field).
  - AQI dropdown (Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, Hazardous) — automatically updates numeric value 1–6.
  - PM2.5 (number input).
  - Save button triggers `saveEnvironmentalEdit`.

---

## 4. Testing & Verification Plan

### Test Scenarios (Vitest & React Testing Library) — Coverage ≥ 90%
1. **`TimelineGroupingService.test.ts`:**
   - Correctly groups entries from multiple years and months into chronological tree.
   - Sorts newest date first.
   - Handles empty index array cleanly.
2. **`FilterEngineService.test.ts`:**
   - Time filtering: matches only entries from selected year/month.
   - MCQ AND mode: returns only entries satisfying ALL selected criteria.
   - MCQ OR mode: returns entries satisfying ANY selected criterion.
   - Reset: returns all entries.
3. **`useDayDetail.test.ts`:**
   - Tapping entry triggers lazy load from Drive; subsequent open uses in-memory cache.
   - Saving manual environmental data commits updated payload and summary index with `source: "manual"`.
4. **`FilterBar.test.tsx`:**
   - Renders dropdowns and chips; toggles AND/OR mode; fires reset.
5. **`EnvironmentalEditModal.test.tsx`:**
   - Dropdown selection of "Unhealthy" maps to numeric index 4.
   - Submitting form invokes callback with valid `IEnvironmentalData` object.

### CI Verification Commands
```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run test -- --coverage
```

---

## 5. Verification Checklist

| Requirement | Rule | Verified |
|---|---|---|
| Single component/hook/service per file | Frontend §8 | [x] |
| File name matches export name | Frontend §8 | [x] |
| Member ordering in components & services | Frontend §5 | [x] |
| Functions ≤ 30 lines logic, JSX ≤ 50 lines | Frontend §6 | [x] |
| File ≤ 300 lines | Frontend §7 | [x] |
| Strict TypeScript (no `any`) | Frontend §12 | [x] |
| No magic strings/numbers | Frontend §10 | [x] |
| In-memory filtering (zero network on browse) | HLD §4.7.2 | [x] |
| Lazy payload hydration on tap | HLD §4.7.2 | [x] |
| Manual environmental editing (`source: "manual"`) | HLD §4.5.5 | [x] |
| Test coverage ≥ 90% | Frontend §9, §14 | [x] |

