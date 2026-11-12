# Execution Plan 04 — Dynamic Checklist & Logging Engine

**Phase:** 04  
**Document:** `04_checklist_and_logging_engine.md`  
**Prerequisites:** `01_project_foundation.md`, `02_auth_and_drive_service.md`, `03_environmental_service_and_weather_proxy.md`  
**References:**  
- [001_high_level_design.md §2.3, §3.4, §4.3, §4.4, §4.6, §5](../design/high_level/001_high_level_design.md)  
- [001_initial.md §1.1, §2.1, §2.2, §2.3, §3.1, §3.2, §3.3](../requirements/001_initial.md)  
- [frontend_coding_standards.md §1, §4, §5, §6, §7, §8, §9, §10, §14, §15](../coding_standards/frontend_coding_standards.md)  

---

## 1. Objectives & Scope

1. Build the mobile-first, rapid-tap Dynamic Checklist UI with large touch targets (min 48×48 dp) optimized for silent, low-light late-night logging.
2. Render question blocks dynamically from the in-memory schema (`config.json`), supporting both single-select (`select_one`) and multi-select (`select_multiple`) chip groups.
3. Implement the "Quick Add" workflow: typing a new option generates an in-memory temporary chip for the current session. Provide an action to save temporary options permanently to `config.json`.
4. Trigger the `custom_entries_exist: true` index flag when ad-hoc options or free-form notes are logged.
5. Implement the Midnight Rollover logic: sessions between 00:00 and 04:59 local time prompt the user to confirm logging for yesterday (default) or today, with a date-picker override.
6. Implement the end-to-end `SaveLogOrchestrator` service that coordinates weather enrichment, shallow payload merging on Drive, index upsert, and user feedback.

---

## 2. Directory & File Plan

```
frontend/src/
├── constants/
│   └── checklistConstants.ts
├── services/
│   ├── DateResolutionService.ts
│   ├── SessionStateService.ts
│   └── SaveLogOrchestrator.ts
├── hooks/
│   ├── useChecklist.ts
│   └── useMidnightRollover.ts
├── components/
│   └── checklist/
│       ├── ChecklistDashboard.tsx
│       ├── QuestionBlock.tsx
│       ├── OptionChip.tsx
│       ├── QuickAddInput.tsx
│       ├── FreeFormNotes.tsx
│       ├── LocationInput.tsx
│       ├── MidnightRolloverModal.tsx
│       └── SaveButton.tsx
└── tests/
    ├── services/
    │   ├── DateResolutionService.test.ts
    │   ├── SessionStateService.test.ts
    │   └── SaveLogOrchestrator.test.ts
    ├── hooks/
    │   ├── useChecklist.test.ts
    │   └── useMidnightRollover.test.ts
    └── components/
        ├── ChecklistDashboard.test.tsx
        ├── QuestionBlock.test.tsx
        ├── OptionChip.test.tsx
        ├── QuickAddInput.test.tsx
        ├── FreeFormNotes.test.tsx
        ├── LocationInput.test.tsx
        └── MidnightRolloverModal.test.tsx
```

---

## 3. Detailed Component & Service Architecture

### 3.1 Constants (`frontend/src/constants/checklistConstants.ts`)
- `QUESTION_TYPE_SELECT_ONE = "select_one"`
- `QUESTION_TYPE_SELECT_MULTIPLE = "select_multiple"`
- `MIDNIGHT_START_HOUR = 0`
- `MIDNIGHT_END_HOUR = 5`
- `MIN_TOUCH_TARGET_SIZE_PX = 48`
- `SAVE_BUTTON_TEXT = "Save Log"`
- `LOCATION_PLACEHOLDER = "Enter city/location (e.g. Mumbai, India)"`
- `NOTES_PLACEHOLDER = "Optional thoughts or reflections..."`

### 3.2 Services (Pure TypeScript Classes)

#### 3.2.1 `DateResolutionService.ts`
Encapsulates date resolution and midnight rollover checking.
- **Member Ordering:**
  1. Private static constants (`_HOUR_THRESHOLD = 5`)
  2. Constructor
  3. Public methods:
     - `isInMidnightWindow(currentTime: Date): boolean`: Returns `true` if hour is 0, 1, 2, 3, or 4.
     - `getDefaultTargetDate(currentTime: Date): string`: Returns yesterday's ISO date string if in midnight window, otherwise today's ISO date string.
     - `getTodayDate(currentTime: Date): string`: Returns today's ISO date string.
     - `getYesterdayDate(currentTime: Date): string`: Returns yesterday's ISO date string.
  4. Private methods:
     - `_formatDate(date: Date): string`
- **Constraints:** Methods ≤ 20 lines. File ≤ 300 lines. Pure date math with no external date library dependencies.

#### 3.2.2 `SessionStateService.ts`
Manages the in-memory draft state for the current logging session (zero local database persistence).
- **Member Ordering:**
  1. Private static constants
  2. Constructor: accepts initial question defaults from `IAppConfig`
  3. Public methods:
     - `initDraft(config: IAppConfig, defaultDate: string): void`
     - `setResponse(questionId: string, value: string | string[]): void`
     - `addTemporaryOption(questionId: string, option: string): void`
     - `getTemporaryOptions(questionId: string): string[]`
     - `setLocation(location: string): void`
     - `setNotes(notes: string): void`
     - `setDate(date: string): void`
     - `hasCustomEntries(): boolean`: Returns `true` if notes non-empty or any temporary option was selected.
     - `getDraftPayload(): Partial<IDailyPayload>`
     - `reset(): void`
  4. Private methods:
     - `_cloneDraft(): void`
- **Constraints:** State held strictly in memory. Discarded on browser tab close or refresh.

#### 3.2.3 `SaveLogOrchestrator.ts`
Coordinates the complete commit sequence when the user taps "Save Log".
- **Member Ordering:**
  1. Private static constants
  2. Constructor: accepts `driveService: DriveService`, `weatherService: WeatherService`, `mergeService: PayloadMergeService`, `sessionState: SessionStateService` (Dependency Inversion)
  3. Public methods:
     - `executeSave(targetDate: string, location: string, logsFolderId: string, currentSummaryIndex: ISummaryIndex): Promise<{ updatedIndex: ISummaryIndex }>`:
       - Step 1: Query environmental data via `weatherService` (or `null` if past date / failure).
       - Step 2: Build daily payload JSON from session state.
       - Step 3: Check Drive for existing `logs/YYYY-MM-DD.json`. If exists, call `mergeService.merge(existing, draft)`; otherwise use draft.
       - Step 4: Write merged payload to Drive via `driveService.writeDailyPayload()`.
       - Step 5: Upsert entry in `summary_index.json` with date, location, weather summary, aqi summary, mcq responses, and `custom_entries_exist`.
       - Step 6: Write updated index to Drive via `driveService.writeSummaryIndexFile()`.
       - Step 7: Return updated index for memory hydration.
  4. Private methods:
     - `_createIndexEntry(date: string, location: string, envData: IEnvironmentalData | null, mcqResponses: Record<string, string | string[]>, hasCustom: boolean): ISummaryIndexEntry`
     - `_upsertSummaryIndex(existingIndex: ISummaryIndex, newEntry: ISummaryIndexEntry): ISummaryIndex`

### 3.3 Custom Hooks

#### 3.3.1 `useMidnightRollover.ts`
- Detects if `new Date()` is within 00:00–04:59.
- State: `showRolloverModal: boolean`, `selectedDate: string`.
- Handlers: `confirmYesterday()`, `confirmToday()`, `overrideDate(customDate: string)`.

#### 3.3.2 `useChecklist.ts`
- Consumes `SessionStateService` and `DriveSyncContext`.
- State: `responses: Record<string, string | string[]>`, `temporaryOptions: Record<string, string[]>`, `location: string`, `notes: string`, `isSaving: boolean`.
- Handlers:
  - `handleSelectOption(questionId: string, option: string, isMultiple: boolean)`
  - `handleQuickAdd(questionId: string, option: string)`
  - `handleSaveOptionPermanently(questionId: string, option: string): Promise<void>`
  - `handleSaveLog(): Promise<void>`

### 3.4 UI Components

#### 3.4.1 `OptionChip.tsx`
- Renders an accessible, tap-friendly chip button (`min-height: 48px`, `min-width: 48px`).
- Props: `label: string`, `isSelected: boolean`, `onToggle: () => void`, `isTemporary?: boolean`, `onSavePermanent?: () => void`.
- Semantic HTML `<button role="switch">` with ARIA checked status.

#### 3.4.2 `QuickAddInput.tsx`
- Renders a clean text input with an "Add" button and keyboard "Enter" listener to add ad-hoc chips.

#### 3.4.3 `QuestionBlock.tsx`
- Renders a question label, the list of option chips (including any session temporary chips), and the inline `<QuickAddInput />`.

#### 3.4.4 `MidnightRolloverModal.tsx`
- Accessible dialog asking the user: *"It's late night (12 AM - 5 AM). Are you logging for Yesterday (Nov 8) or Today (Nov 9)?"*.
- Default action: Yesterday.

#### 3.4.5 `ChecklistDashboard.tsx`
- Main view composing:
  1. Date header & Midnight rollover prompt trigger.
  2. Map of `config.standard_questions` and `config.custom_saved_questions` → `<QuestionBlock />`.
  3. `<LocationInput />`
  4. `<FreeFormNotes />`
  5. Sticky bottom-anchored `<SaveButton />`

---

## 4. Testing & Verification Plan

### Test Scenarios (Vitest & React Testing Library) — Coverage ≥ 90%
1. **`DateResolutionService.test.ts`:**
   - 02:30 AM returns `isInMidnightWindow === true`, default date is yesterday.
   - 05:01 AM returns `isInMidnightWindow === false`, default date is today.
   - 23:59 PM returns `isInMidnightWindow === false`.
2. **`SessionStateService.test.ts`:**
   - Single select updates value cleanly, replacing previous choice.
   - Multi-select toggles options in/out of array.
   - Quick Add appends temporary option; triggers `hasCustomEntries() === true`.
3. **`SaveLogOrchestrator.test.ts`:**
   - End-to-end save with new file: writes daily payload and appends summary index.
   - End-to-end save with existing daytime file: executes shallow merge, preserving earlier responses.
   - Sets `custom_entries_exist: true` in summary index entry if temp option or notes present.
4. **`QuestionBlock.test.tsx` & `OptionChip.test.tsx`:**
   - Renders chips with accessible ARIA attributes.
   - Clicking chip triggers `handleSelectOption`.
   - "Save permanently" button on temp chip calls `handleSaveOptionPermanently`.
5. **`MidnightRolloverModal.test.tsx`:**
   - Modal renders in late-night window; selecting "Yesterday" assigns yesterday's date.

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
| Single component/hook/service per file | Frontend §8 | [ ] |
| File name matches export name | Frontend §8 | [ ] |
| Member ordering in components & services | Frontend §5 | [ ] |
| Touch targets min 48×48 dp | PRD §2.1 | [ ] |
| Functions ≤ 30 lines logic, JSX ≤ 50 lines | Frontend §6 | [ ] |
| File ≤ 300 lines | Frontend §7 | [ ] |
| Strict TypeScript (no `any`) | Frontend §12 | [ ] |
| No magic strings/numbers | Frontend §10 | [ ] |
| Midnight rollover prompt (00:00–04:59) | HLD §4.6 | [ ] |
| Shallow merge on existing log | HLD §4.2.3 | [ ] |
| Test coverage ≥ 90% | Frontend §9, §14 | [ ] |

