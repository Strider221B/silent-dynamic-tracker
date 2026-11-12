# Execution Plan 02 — Authentication & Google Drive Service

**Phase:** 02  
**Document:** `02_auth_and_drive_service.md`  
**Prerequisites:** `01_project_foundation.md`  
**References:**  
- [001_high_level_design.md §2, §3, §4.1, §4.2](../design/high_level/001_high_level_design.md)  
- [001_initial.md §1.1, §1.2, §1.3, §2.3](../requirements/001_initial.md)  
- [frontend_coding_standards.md §1, §4, §5, §6, §7, §8, §9, §10, §14](../coding_standards/frontend_coding_standards.md)  

---

## 1. Objectives & Scope

1. Implement client-side Google OAuth 2.0 authentication using Google Identity Services (GIS) scoped strictly to `https://www.googleapis.com/auth/drive.file`.
2. Ensure strict session-only authentication gating: if unauthenticated, the application dashboard is completely inaccessible, and tokens are stored in-memory only (zero local persistence).
3. Build the `DriveService` class for all Google Drive REST API v3 operations: app folder discovery/creation (`SilentDynamicTracker`), schema config management (`config.json`), summary index sync (`summary_index.json`), and daily payload logs (`logs/YYYY-MM-DD.json`).
4. Implement the `PayloadMergeService` class to execute shallow merges when a log file already exists for a given date (preserving earlier daytime entries while updating nighttime notes).
5. Build custom hooks (`useAuth`, `useDriveSync`) and UI boundary components (`AuthBarrier`, `SignInPrompt`, `LoadingSpinner`).

---

## 2. Directory & File Plan

```
frontend/src/
├── constants/
│   ├── authConstants.ts
│   └── driveConstants.ts
├── services/
│   ├── GoogleAuthService.ts
│   ├── DriveService.ts
│   └── PayloadMergeService.ts
├── context/
│   ├── AuthContext.tsx
│   └── DriveSyncContext.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useDriveSync.ts
├── components/
│   ├── auth/
│   │   ├── AuthBarrier.tsx
│   │   └── SignInPrompt.tsx
│   └── common/
│       └── LoadingSpinner.tsx
└── tests/
    ├── services/
    │   ├── GoogleAuthService.test.ts
    │   ├── DriveService.test.ts
    │   └── PayloadMergeService.test.ts
    ├── hooks/
    │   ├── useAuth.test.ts
    │   └── useDriveSync.test.ts
    └── components/
        ├── AuthBarrier.test.tsx
        ├── SignInPrompt.test.tsx
        └── LoadingSpinner.test.tsx
```

---

## 3. Detailed Component & Service Architecture

### 3.1 Constants
- `frontend/src/constants/authConstants.ts`:
  - `DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file"`
  - `DEFAULT_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"` (loaded from `import.meta.env.VITE_GOOGLE_CLIENT_ID`)
- `frontend/src/constants/driveConstants.ts`:
  - `APP_FOLDER_NAME = "SilentDynamicTracker"`
  - `CONFIG_FILE_NAME = "config.json"`
  - `INDEX_FILE_NAME = "summary_index.json"`
  - `LOGS_DIR_NAME = "logs"`
  - `MIME_TYPE_FOLDER = "application/vnd.google-apps.folder"`
  - `MIME_TYPE_JSON = "application/json"`
  - `DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"`
  - `DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"`

### 3.2 Services (Pure TypeScript Classes)

#### 3.2.1 `GoogleAuthService.ts`
Encapsulates GIS token client interaction.
- **Member Ordering:**
  1. Private static constants (`_TOKEN_EXPIRY_BUFFER_MS = 60000`)
  2. Constructor: accepts optional `clientId: string`
  3. Public methods:
     - `initClient(callback: (token: string) => void): void`
     - `requestAccessToken(): void`
     - `getAccessToken(): string | null`
     - `revokeToken(): Promise<void>`
     - `isAuthenticated(): boolean`
  4. Private methods:
     - `_setToken(token: string, expiresIn: number): void`
     - `_clearToken(): void`
- **Constraints:** Token held in private instance variable. Zero localStorage / sessionStorage / IndexedDB. Body methods ≤ 30 lines. File ≤ 300 lines.

#### 3.2.2 `DriveService.ts`
Encapsulates Google Drive REST API v3 HTTP calls.
- **Member Ordering:**
  1. Private static constants (`_FIELDS_QUERY = "files(id, name, mimeType, parents)"`)
  2. Constructor: accepts `authService: GoogleAuthService` (Dependency Inversion)
  3. Public methods:
     - `ensureAppFolder(): Promise<string>`: finds or creates `SilentDynamicTracker` folder.
     - `ensureLogsFolder(parentFolderId: string): Promise<string>`: finds or creates `logs` child folder.
     - `readJsonFile<T>(fileName: string, parentFolderId: string): Promise<T | null>`
     - `writeJsonFile<T>(fileName: string, parentFolderId: string, data: T, existingFileId?: string): Promise<string>`
     - `readDailyPayload(date: string, logsFolderId: string): Promise<IDailyPayload | null>`
     - `writeDailyPayload(date: string, logsFolderId: string, payload: IDailyPayload): Promise<string>`
     - `listAllLogFiles(logsFolderId: string): Promise<Array<{ id: string; name: string }>>`
  4. Private methods:
     - `_buildHeaders(contentType?: string): HeadersInit`
     - `_findFileByName(fileName: string, parentFolderId: string): Promise<string | null>`
     - `_createFile(fileName: string, parentFolderId: string, mimeType: string, content?: string): Promise<string>`
     - `_updateFileContent(fileId: string, content: string): Promise<string>`
- **Constraints:** Zero `any`. All API errors wrapped in typed custom error `DriveApiError`.

#### 3.2.3 `PayloadMergeService.ts`
Encapsulates shallow-merge logic between daytime and nighttime entries.
- **Member Ordering:**
  1. Private static constants
  2. Constructor
  3. Public methods:
     - `merge(existingPayload: IDailyPayload, newDraft: Partial<IDailyPayload>): IDailyPayload`
  4. Private methods:
     - `_mergeStandardResponses(existing: Record<string, string | string[]>, update: Record<string, string | string[]>): Record<string, string | string[]>`
     - `_mergeCustomAdditions(existing: ICustomQuestionAddition[], update: ICustomQuestionAddition[]): ICustomQuestionAddition[]`
- **Merge Rules:**
  - Date and location: overwrite if provided.
  - Environmental data: overwrite if non-null in new draft, else preserve existing.
  - Standard MCQ responses: overwrite updated keys, preserve un-updated keys.
  - Free-form notes: replace with new text (user sees existing notes in editor).

### 3.3 Context & Custom Hooks

#### 3.3.1 `AuthContext.tsx` & `useAuth.ts`
- Provides: `token`, `isAuthenticated`, `isLoading`, `login()`, `logout()`.
- Renders `GoogleAuthService` provider.

#### 3.3.2 `DriveSyncContext.tsx` & `useDriveSync.ts`
- State: `appFolderId`, `logsFolderId`, `config: IAppConfig | null`, `summaryIndex: ISummaryIndex | null`, `isBootSyncing: boolean`, `syncError: string | null`.
- Boot sequence:
  1. On authentication change to `true`, set `isBootSyncing = true`.
  2. Call `driveService.ensureAppFolder()` and `ensureLogsFolder()`.
  3. Load `config.json`. If missing, write default `config.json`.
  4. Load `summary_index.json`. If missing, write empty `[]`.
  5. Store in React state in memory. Set `isBootSyncing = false`.
- Method `saveConfig(newConfig: IAppConfig): Promise<void>`.
- Method `saveSummaryIndex(newIndex: ISummaryIndex): Promise<void>`.

### 3.4 UI Components

#### 3.4.1 `AuthBarrier.tsx`
- Consumes `useAuth()` and `useDriveSync()`.
- Guard sequence:
  - If `!isAuthenticated` → render `<SignInPrompt />`.
  - If `isLoading || isBootSyncing` → render `<LoadingSpinner text="Connecting to Google Drive..." />`.
  - If `isAuthenticated && !isBootSyncing` → render `children`.
- Strict ordering: destructuring → hooks → guard clauses → JSX return (≤ 50 lines).

#### 3.4.2 `SignInPrompt.tsx`
- Mobile-first card welcoming user, explaining privacy (`drive.file` scope only), and presenting the "Sign in with Google" button.

#### 3.4.3 `LoadingSpinner.tsx`
- Accessible SVG spinner with ARIA live region and customizable message.

---

## 4. Testing & Verification Plan

### Test Scenarios (Vitest & React Testing Library) — Coverage ≥ 90%
1. **`GoogleAuthService.test.ts`:**
   - Happy path: `initClient`, token callback receipt, `isAuthenticated() === true`.
   - Token expiration: returns `false` after expiry timestamp.
   - Revocation: clears in-memory token, calls Google revoke API.
2. **`DriveService.test.ts`:**
   - Folder creation: queries existing folder; creates new folder if not found.
   - File read: parses JSON correctly; handles 404 by returning `null`.
   - File write: calls upload endpoint with multipart/related payload.
   - Error handling: throws `DriveApiError` on 401 Unauthorized or 500 error.
3. **`PayloadMergeService.test.ts`:**
   - Merges scalar fields (overwrites existing values).
   - Preserves untouched question keys from daytime log.
   - Replaces free-form notes with latest submission.
4. **`useAuth.test.ts` & `useDriveSync.test.ts`:**
   - Boot sync initializes folders and loads both `config.json` and `summary_index.json`.
   - Handles network failure during boot sync by surfacing `syncError`.
5. **`AuthBarrier.test.tsx`:**
   - Renders sign-in prompt when unauthenticated.
   - Renders spinner during sync.
   - Renders dashboard children when authenticated and synced.

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
| Single class/component/hook per file | Frontend §8 | [ ] |
| File name matches export name | Frontend §8 | [ ] |
| Member ordering in components & services | Frontend §5 | [ ] |
| Functions ≤ 30 lines logic, JSX ≤ 50 lines | Frontend §6 | [ ] |
| File ≤ 300 lines | Frontend §7 | [ ] |
| Strict TypeScript (no `any`) | Frontend §12 | [ ] |
| No magic strings/numbers | Frontend §10 | [ ] |
| Zero local persistence (in-memory token only) | PRD §1.1 | [ ] |
| Test coverage ≥ 90% | Frontend §9, §14 | [ ] |

