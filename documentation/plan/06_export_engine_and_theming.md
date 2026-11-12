# Execution Plan 06 — Bulk Export Engine, Day/Night Theming & Responsive Layout

**Phase:** 06  
**Document:** `06_export_engine_and_theming.md`  
**Prerequisites:** `01_project_foundation.md`, `02_auth_and_drive_service.md`, `04_checklist_and_logging_engine.md`, `05_history_timeline_and_filtering.md`  
**References:**  
- [001_high_level_design.md §4.3, §4.8, §7, §8](../design/high_level/001_high_level_design.md)  
- [001_initial.md §2.1, §2.3, §2.5](../requirements/001_initial.md)  
- [frontend_coding_standards.md §1, §4, §5, §6, §7, §8, §9, §10, §14, §15](../coding_standards/frontend_coding_standards.md)  

---

## 1. Objectives & Scope

1. Build the Bulk Export Engine allowing users to download:
   - A client-side generated `.zip` archive containing all isolated daily JSON logs (`logs/*.json`) fetched in batches from Google Drive using `jszip`.
   - A flattened, RFC-4180 compliant `.csv` spreadsheet generated client-side from the in-memory `summary_index.json`.
2. Implement Day/Night theme management with Day Mode as the system default, respecting system `prefers-color-scheme` while allowing manual user toggling.
3. Polish responsive layouts: ensure mobile-first layout (< 768px) with full-width touch targets (≥ 48×48 dp) stacks vertically, while desktop view (≥ 768px) renders a multi-column dashboard grid.
4. Implement an accessible, non-blocking toast notification system to inform users of weather availability, save status, and export completion.

---

## 2. Directory & File Plan

```
frontend/src/
├── constants/
│   ├── exportConstants.ts
│   └── themeConstants.ts
├── services/
│   ├── CsvExportService.ts
│   ├── ZipExportService.ts
│   └── ThemeService.ts
├── context/
│   └── ToastContext.tsx
├── hooks/
│   ├── useTheme.ts
│   └── useToast.ts
├── styles/
│   ├── theme.module.css
│   └── responsive.module.css
├── components/
│   ├── export/
│   │   ├── ExportModal.tsx
│   │   └── ExportProgressBar.tsx
│   ├── theme/
│   │   └── ThemeToggle.tsx
│   └── common/
│       ├── ToastContainer.tsx
│       └── ToastItem.tsx
└── tests/
    ├── services/
    │   ├── CsvExportService.test.ts
    │   ├── ZipExportService.test.ts
    │   └── ThemeService.test.ts
    ├── hooks/
    │   ├── useTheme.test.ts
    │   └── useToast.test.ts
    └── components/
        ├── ExportModal.test.tsx
        ├── ThemeToggle.test.tsx
        └── ToastContainer.test.tsx
```

---

## 3. Detailed Component & Service Architecture

### 3.1 Constants

#### 3.1.1 `frontend/src/constants/exportConstants.ts`
- `ZIP_FILENAME_PREFIX = "SDT_Daily_Logs_"`
- `CSV_FILENAME_PREFIX = "SDT_Summary_Index_"`
- `CSV_HEADERS = ["Date", "Location", "Weather Summary", "AQI Summary", "Custom Entries Exist", "Energy Level", "Interacted With"]`
- `BATCH_DOWNLOAD_CONCURRENCY = 5`

#### 3.1.2 `frontend/src/constants/themeConstants.ts`
- `THEME_DAY = "day"`
- `THEME_NIGHT = "night"`
- `DEFAULT_THEME = "day"` (Day mode is system default per PRD §2.1)
- `STORAGE_KEY_THEME = "sdt_theme_preference"`

### 3.2 Services (Pure TypeScript Classes)

#### 3.2.1 `CsvExportService.ts`
Transforms `summary_index.json` into a flat CSV string and triggers browser download.
- **Member Ordering:**
  1. Private static constants (`_CSV_MIME_TYPE = "text/csv;charset=utf-8;"`)
  2. Constructor
  3. Public methods:
     - `generateCsv(index: ISummaryIndex): string`:
       - Extracts dynamic headers from all unique MCQ question IDs.
       - Iterates over entries; formats each row with proper escaping (RFC-4180: quotes around values containing commas/quotes).
       - Returns CSV text content.
     - `downloadCsv(index: ISummaryIndex): void`:
       - Creates Blob, Object URL, and triggers `<a download>` click.
  4. Private methods:
     - `_escapeCsvValue(value: string | number | boolean | null): string`
- **Constraints:** Logic ≤ 30 lines per method. File ≤ 300 lines.

#### 3.2.2 `ZipExportService.ts`
Batch-fetches daily log JSON payloads from Google Drive, zips them in-memory with JSZip, and triggers browser download.
- **Member Ordering:**
  1. Private static constants (`_ZIP_MIME_TYPE = "application/zip"`)
  2. Constructor: accepts `driveService: DriveService`
  3. Public methods:
     - `generateZip(logsFolderId: string, onProgress?: (percent: number) => void): Promise<Blob>`:
       - Lists all log files in `logs/` via `driveService.listAllLogFiles()`.
       - Fetches file contents in batches of 5 to prevent browser throttling.
       - Adds each file to `JSZip` instance.
       - Generates compressed zip Blob.
     - `downloadZip(logsFolderId: string, onProgress?: (percent: number) => void): Promise<void>`
  4. Private methods:
     - `_fetchBatch(fileBatch: Array<{ id: string; name: string }>): Promise<Array<{ name: string; content: string }>>`
- **Constraints:** Fully client-side. Progress tracking provided via callback.

#### 3.2.3 `ThemeService.ts`
Encapsulates Day/Night mode state and CSS variable application.
- **Member Ordering:**
  1. Private static constants
  2. Constructor
  3. Public methods:
     - `getInitialTheme(): "day" | "night"`:
       - Returns `"day"` as default per design; if system `prefers-color-scheme: dark` is active and no explicit toggle, can honor dark.
     - `applyTheme(theme: "day" | "night"): void`:
       - Sets `data-theme="day"` or `data-theme="night"` attribute on `document.documentElement`.
  4. Private methods:
     - `_detectSystemPreference(): "day" | "night"`

### 3.3 Custom Hooks

#### 3.3.1 `useTheme.ts`
- State: `theme: "day" | "night"`.
- Actions: `toggleTheme(): void`, `setTheme(theme: "day" | "night"): void`.
- Effect: Calls `themeService.applyTheme(theme)`.

#### 3.3.2 `useToast.ts` & `ToastContext.tsx`
- State: `toasts: Array<{ id: string; message: string; type: "info" | "success" | "error"; durationMs: number }>`.
- Actions: `showToast(message: string, type?: "info" | "success" | "error"): void`, `dismissToast(id: string): void`.

### 3.4 UI Components

#### 3.4.1 `ThemeToggle.tsx`
- Accessible button with sun ☀️ and moon 🌙 icons toggling between Day Mode and Night Mode.

#### 3.4.2 `ExportModal.tsx`
- Dialog presenting two options:
  1. "Export Daily Logs (.zip)" with live progress bar.
  2. "Export Summary Spreadsheet (.csv)".
- Clean touch targets and error handling if Drive is disconnected.

#### 3.4.3 `ToastContainer.tsx` & `ToastItem.tsx`
- Fixed bottom-right toast stack presenting non-blocking auto-dismissing notifications.

---

## 4. Testing & Verification Plan

### Test Scenarios (Vitest & React Testing Library) — Coverage ≥ 90%
1. **`CsvExportService.test.ts`:**
   - Flattens summary index rows with comma-containing values into properly escaped CSV.
   - Extracts all MCQ response keys into column headers.
   - Handles empty index gracefully.
2. **`ZipExportService.test.ts`:**
   - Batches file downloads (5 at a time) from Drive mock.
   - Adds JSON files to zip archive; reports progress callbacks (0% → 100%).
3. **`ThemeService.test.ts`:**
   - Defaults to `"day"` mode.
   - Applies `data-theme` attribute to root document element.
4. **`useToast.test.ts` & `ToastContainer.test.tsx`:**
   - `showToast` pushes message to stack; auto-dismisses after duration.
   - Renders ARIA alert status for accessibility.
5. **`ExportModal.test.tsx`:**
   - Tapping CSV download triggers `CsvExportService`.
   - Tapping ZIP download displays progress bar and completes.

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
| Functions ≤ 30 lines logic, JSX ≤ 50 lines | Frontend §6 | [ ] |
| File ≤ 300 lines | Frontend §7 | [ ] |
| Strict TypeScript (no `any`) | Frontend §12 | [ ] |
| No magic strings/numbers | Frontend §10 | [ ] |
| Day mode is system default | PRD §2.1 | [ ] |
| Client-side ZIP export of daily logs | HLD §4.8 | [ ] |
| Client-side CSV export of summary index | HLD §4.8 | [ ] |
| Test coverage ≥ 90% | Frontend §9, §14 | [ ] |

