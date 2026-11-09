# High-Level Design Document — Silent Dynamic Tracker (SDT)

**Version:** 1.1  
**Date:** 2026-11-09  
**Based on:** [001_initial.md](../../requirements/001_initial.md)  
**Status:** Draft

---

## 1. Executive Summary

Silent Dynamic Tracker (SDT) is a stateless, mobile-first journaling web application designed for rapid, silent, late-night logging. It stores all data in the user's Google Drive — no server-side database, no local persistence. The system uses a tap-based checklist UI, enriches entries with weather and AQI data from a single WeatherAPI.com call, and supports powerful filtering over a lightweight summary index.

This document describes the system's architecture, component design, data flow, key interactions, and technical decisions derived from the requirements.

---

## 2. Architecture Overview

### 2.1 Guiding Principles

| Principle | Implication |
|---|---|
| **Zero local state** | No IndexedDB, LocalStorage, or SQLite. All persistent data lives in Google Drive. |
| **Lightweight boot** | On login, fetch only `config.json` + `summary_index.json` (~KBs). Full day payloads are lazy-loaded. |
| **Mobile-first** | Touch-optimized chip/button UI, vertical stacking on small screens, multi-column on desktop. |
| **Privacy by design** | No background GPS. Manual location input. OAuth scoped to `drive.file` only. |
| **Offline-tolerant, not offline-first** | Network is required for Google auth, Drive sync, and API calls. Graceful loading states cover latency. |

### 2.2 Logical Architecture Diagram

```mermaid
graph TD
    subgraph CLIENT["CLIENT (Browser)"]
        UI["UI Layer<br/>(Renderer)"]
        SS["Session State<br/>(In-Memory)"]
        SL["Service Layer<br/>(Auth, Drive, APIs)"]
        UI <--> SS <--> SL
    end

    SL -->|HTTPS| OAUTH["Google OAuth 2.0<br/>(Authentication)"]
    SL -->|HTTPS| DRIVE["Google Drive API<br/>(Data Persistence)"]
    SL -->|HTTPS| WEATHER["WeatherAPI.com<br/>(Weather + AQI)"]
```

### 2.3 Component Summary

| Component | Responsibility |
|---|---|
| **UI Layer** | Renders the checklist, filters, history timeline, and export controls. Handles Day/Night mode. |
| **Session State Manager** | Holds the in-memory working copy of config, summary index, and current log draft. Discarded on tab close/refresh. |
| **Auth Service** | Manages Google OAuth 2.0 flow, token lifecycle, and session gating. |
| **Drive Service** | CRUD operations against the app folder in Google Drive (config, index, daily logs). |
| **Environment Service** | Fetches weather + AQI data from WeatherAPI.com using the user-supplied location string. |
| **Sync Engine** | Orchestrates boot sync (download index + config) and save sync (merge + upload). |
| **Export Engine** | Generates ZIP archives of daily JSON logs and CSV exports of the summary index. |

---

## 3. Data Architecture

### 3.1 Google Drive Folder Structure

```
My Drive/
└── SilentDynamicTracker/          ← App-managed folder (drive.file scope)
    ├── config.json                ← Master layout/schema configuration
    ├── summary_index.json         ← Lightweight index of all logged days
    └── logs/
        ├── 2026-11-01.json        ← Full daily payload
        ├── 2026-11-02.json
        └── ...
```

### 3.2 File Roles & Access Patterns

| File | Size Profile | Read Pattern | Write Pattern |
|---|---|---|---|
| `config.json` | Small (< 50 KB) | Boot + on config change | User adds/saves permanent question/option |
| `summary_index.json` | Medium (grows ~200 bytes/day → ~70 KB/year) | Boot (full download) | Every log save appends/updates an entry |
| `logs/YYYY-MM-DD.json` | Small per file (1–5 KB) | On-demand (lazy) | Log save; shallow merge if exists |

### 3.3 Data Flow — Boot Sequence

```mermaid
sequenceDiagram
    actor User
    participant App as SDT App
    participant Auth as Google OAuth
    participant Drive as Google Drive API

    User->>App: Open app
    App->>App: Show sign-in prompt
    User->>App: Tap "Sign in with Google"
    App->>Auth: OAuth 2.0 authorization request (scope: drive.file)
    Auth-->>App: Access token (in-memory only)

    App->>App: Show loading spinner
    App->>Drive: GET config.json
    Drive-->>App: config.json payload
    App->>App: Hydrate question schema in-memory

    App->>Drive: GET summary_index.json
    Drive-->>App: summary_index.json payload
    App->>App: Hydrate history index in-memory

    App->>App: Hide spinner, render dashboard
```

### 3.4 Data Flow — Save Sequence

```mermaid
sequenceDiagram
    actor User
    participant App as SDT App
    participant API as WeatherAPI.com
    participant Drive as Google Drive API

    User->>App: Tap "Save Log"
    App->>App: Resolve target date (midnight rollover §4.6)

    App->>API: GET /current.json?q={location}&aqi=yes
    API-->>App: Weather + AQI response
    App->>App: Map us-epa-index → text label (§4.5)
    App->>App: Build daily JSON payload

    App->>Drive: Check if logs/YYYY-MM-DD.json exists
    alt File exists
        Drive-->>App: Existing payload
        App->>App: Shallow merge (existing ∪ new)
        App->>Drive: PUT merged payload
    else File does not exist
        App->>Drive: POST new payload
    end

    App->>App: Upsert entry in summary_index (in-memory)
    App->>Drive: PUT updated summary_index.json
    App-->>User: Success confirmation
```

---

## 4. Component Design

### 4.1 Authentication & Session Gating

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Authenticating : User taps Sign In
    Authenticating --> Authenticated : Token received
    Authenticating --> Unauthenticated : Auth failed / cancelled

    state Authenticated {
        [*] --> BootSync
        BootSync --> DashboardReady : Config + Index loaded
        DashboardReady --> Logging : User interacts
        Logging --> Saving : User taps Save
        Saving --> DashboardReady : Save complete
    }

    Authenticated --> Unauthenticated : Tab closed / Token expired
```

- **Mechanism:** Google OAuth 2.0 with `drive.file` scope.
- **Behaviour:** The entire app is behind the auth wall. If no valid token exists, the UI shows only a sign-in prompt — no dashboard, no data, no cached views.
- **Token Lifecycle:** Access token held in memory. Refresh handled via Google's JS SDK. Tab close = full logout for state purposes (token may persist in Google's session, but app state is wiped).

### 4.2 Sync Engine

#### 4.2.1 Boot Sync

1. Authenticate via Google OAuth.
2. Locate or create the `SilentDynamicTracker` app folder.
3. Download `config.json` → populate question schema in memory.
4. Download `summary_index.json` → populate history index in memory.
5. Show loading spinner during steps 2–4.
6. Render dashboard.

#### 4.2.2 Save Sync (Log Commit)

1. Resolve target date (apply midnight rollover logic — see §4.6).
2. Fire WeatherAPI.com call using user's location string.
3. Construct daily payload JSON from in-memory session selections.
4. Check if `logs/YYYY-MM-DD.json` exists on Drive:
   - **Exists →** Download, shallow-merge (preserve existing keys, overwrite/append updated keys), upload merged file.
   - **Does not exist →** Upload new file.
5. Upsert the corresponding entry in `summary_index.json`.
6. Upload updated `summary_index.json`.

#### 4.2.3 Merge Strategy (Shallow Merge)

```mermaid
graph LR
    subgraph Existing["Existing Payload"]
        E1["energy_level: High"]
        E2["habits_completed: [Exercised]"]
    end

    subgraph New["New Payload"]
        N1["energy_level: Moderate"]
        N2["free_form_notes: Late update"]
    end

    subgraph Merged["Merged Result"]
        M1["energy_level: Moderate ← overwritten"]
        M2["habits_completed: [Exercised] ← preserved"]
        M3["free_form_notes: Late update ← added"]
    end

    Existing --> Merged
    New --> Merged
```

- **Scalar fields:** new value overwrites old.
- **Array fields (multi-select):** union/replace based on the source question type.
- **`free_form_notes`:** recommend **replace** since the user sees the existing text in the editor during merge.

### 4.3 UI Layer

#### 4.3.1 Layout Modes

| Mode | Trigger | Characteristics |
|---|---|---|
| **Mobile (primary)** | Viewport < 768px | Single column, full-width chips, large touch targets (min 48×48 dp), bottom-anchored save button. |
| **Desktop** | Viewport ≥ 768px | Multi-column grid, sidebar for filters/history, inline question blocks. |

#### 4.3.2 Day / Night Theme

| Property | Day Mode (default) | Night Mode |
|---|---|---|
| Background | Light (#FAFAFA) | Dark (#121212) |
| Text | Dark (#212121) | Light (#E0E0E0) |
| Accent chips | Vibrant fill | Muted/dim fill |
| Activation | System default / toggle | Manual toggle or system `prefers-color-scheme` |

#### 4.3.3 Checklist Rendering Pipeline

```mermaid
flowchart TD
    CONFIG["config.json (schema)"] --> LOOP["For each question block"]

    LOOP --> QB["Question Block"]

    subgraph QB["Question Block"]
        QL["Question Label"]
        OC["Option Chips<br/>(pre-populated from config defaults)"]
        QA["Quick Add Input<br/>(text field for ad-hoc options)"]
    end

    QB --> FF["Free-form text area<br/>(optional — single textarea)"]
    FF --> LOC["Location input<br/>(manual city/location string)"]
    LOC --> SAVE["[ Save Log ]"]
```

### 4.4 Dynamic Customisation (Quick Add)

```mermaid
flowchart TD
    USER["User types new option"] --> ENTER["Presses Enter"]
    ENTER --> TEMP["Temporary chip created<br/>(in-memory, current session only)"]
    TEMP --> DECISION{Save permanently?}

    DECISION -->|No| FLAG["custom_entries_exist = true<br/>in summary index"]
    DECISION -->|Yes| CONFIG["Write to config.json"]
    CONFIG --> STANDARD["Becomes standard option<br/>in all future sessions"]

    NEWQ["User adds new question block"] --> DEFAULT["Must specify default value"]
    DEFAULT --> CONFIG
```

| Action | Scope | Persistence | Index Impact |
|---|---|---|---|
| Type new option → Enter | Current session chip | In-memory only (lost on refresh) | Sets `custom_entries_exist: true` |
| Tap "Save permanently" on a temp chip | Global schema | Written to `config.json` | No flag needed (becomes standard) |
| Add new question block + set default | Global schema | Written to `config.json` | No flag (becomes standard) |
| Free-form text note added | Current day | Written to daily payload | Sets `custom_entries_exist: true` |

### 4.5 Environment Service — WeatherAPI.com

SDT uses **WeatherAPI.com** as a single unified provider for both weather and air quality data. One GET request returns everything needed.

#### 4.5.1 API Integration

```mermaid
sequenceDiagram
    participant App as SDT App
    participant API as WeatherAPI.com

    App->>API: GET /v1/current.json?key={API_KEY}&q={location}&aqi=yes
    API-->>App: JSON response

    Note over App: Extract from response:
    Note over App: data.current.temp_c → temperature
    Note over App: data.current.condition.text → condition
    Note over App: data.current.air_quality.pm2_5 → PM2.5
    Note over App: data.current.air_quality["us-epa-index"] → AQI (1-6)
    Note over App: Map numeric EPA index → text label
```

**Endpoint:**
```
GET https://api.weatherapi.com/v1/current.json?key={API_KEY}&q={location}&aqi=yes
```

**Example call:**
```javascript
const location = "Mumbai, India";
const apiKey = "YOUR_FREE_WEATHERAPI_KEY";

fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=yes`)
  .then(response => response.json())
  .then(data => {
      const environmental_data = {
          temperature: `${data.current.temp_c}C`,
          condition: data.current.condition.text,
          aqi: mapEpaIndexToText(data.current.air_quality["us-epa-index"]),
          aqi_numeric: data.current.air_quality["us-epa-index"],
          pm25: data.current.air_quality.pm2_5
      };
  });
```

#### 4.5.2 US EPA Index — Text Mapping

The WeatherAPI.com `us-epa-index` field returns a numeric value (1–6). For human-readable summaries and the summary index, SDT maps this to descriptive text:

| Numeric Value | Text Label | Description |
|---|---|---|
| 1 | Good | Air quality is satisfactory, little or no risk. |
| 2 | Moderate | Acceptable; some pollutants may concern unusually sensitive individuals. |
| 3 | Unhealthy for Sensitive Groups | Sensitive groups may experience health effects. |
| 4 | Unhealthy | Everyone may begin to experience health effects. |
| 5 | Very Unhealthy | Health alert — significant health effects for everyone. |
| 6 | Hazardous | Emergency conditions — entire population is affected. |

**Mapping function:**
```javascript
function mapEpaIndexToText(epaIndex) {
    const EPA_LABELS = {
        1: "Good",
        2: "Moderate",
        3: "Unhealthy for Sensitive Groups",
        4: "Unhealthy",
        5: "Very Unhealthy",
        6: "Hazardous"
    };
    return EPA_LABELS[epaIndex] || "Unknown";
}
```

#### 4.5.3 Impact on Data Schema

With the EPA text mapping, the data stored in each file becomes:

**Daily payload** (`logs/YYYY-MM-DD.json`) — stores both raw and mapped values:
```json
{
  "environmental_data": {
    "temperature": "31C",
    "condition": "Clear",
    "aqi": "Moderate",
    "aqi_numeric": 2,
    "pm25": 36.4
  }
}
```

**Summary index** (`summary_index.json`) — stores human-readable text:
```json
{
  "date": "2026-11-09",
  "location": "Mumbai",
  "weather_summary": "31°C, Clear",
  "aqi_summary": "Moderate",
  "custom_entries_exist": true
}
```

> **Note:** `aqi_summary` is now a text string (e.g. `"Moderate"`) rather than a numeric value. The raw numeric `us-epa-index` is preserved in the daily payload as `aqi_numeric` for filtering and analytics purposes.

#### 4.5.4 Error Handling

```mermaid
flowchart TD
    SAVE["User taps Save Log"] --> CALL["Call WeatherAPI.com"]
    CALL --> CHECK{Response OK?}

    CHECK -->|200 OK| EXTRACT["Extract weather + AQI data"]
    EXTRACT --> MAP["Map us-epa-index → text label"]
    MAP --> ATTACH["Attach environmental_data to payload"]

    CHECK -->|Error / Timeout| NULL["Set environmental_data: null"]
    NULL --> TOAST["Show non-blocking toast:<br/>Weather data unavailable"]
    TOAST --> PROCEED["Save log anyway to Drive"]

    ATTACH --> PROCEED
```

- If the API call fails or times out, save the log anyway with `environmental_data: null`.
- Surface a non-blocking toast notification: *"Weather data unavailable — your log was saved without it."*

### 4.6 Midnight Rollover Logic

```mermaid
flowchart TD
    START["User taps Save Log"] --> TIME{"Current local time?"}

    TIME -->|"00:00 – 04:59"| PROMPT["Prompt user:<br/>Log for yesterday (default) or today?"]
    PROMPT --> YESTERDAY["Yesterday's date"]
    PROMPT --> TODAY_LATE["Today's date"]

    TIME -->|"05:00 – 23:59"| TODAY["Auto-assign today's date"]

    YESTERDAY --> OVERRIDE
    TODAY_LATE --> OVERRIDE
    TODAY --> OVERRIDE

    OVERRIDE["User can always override<br/>to any past date via date picker"]
    OVERRIDE --> RESOLVE["Resolved target date"]
```

### 4.7 History, Filtering & Timeline

#### 4.7.1 Hierarchical Grouping

```
Timeline View
├── 2026
│   ├── November (3 entries)
│   ├── October (28 entries)
│   └── ...
├── 2025
│   └── ...
```

Rendered from `summary_index.json` — no network calls needed for browsing.

#### 4.7.2 Compound Filter Architecture

```mermaid
flowchart TD
    subgraph FILTERS["Filter Control Bar"]
        TF["Time Filter<br/>Year(s) ▼ / Month(s) ▼"]
        MF["MCQ Filter<br/>Question ▼ / Value(s) ▼<br/>Mode: AND | OR<br/>[Reset]"]
    end

    INDEX["summary_index.json<br/>(in-memory)"] --> APPLY["Apply filters in-memory"]
    TF --> APPLY
    MF --> APPLY

    APPLY --> RESULTS["Matching entries rendered<br/>(metadata only — no payload fetch)"]
    RESULTS --> TAP{"User taps an entry?"}

    TAP -->|Yes| FETCH["Fetch logs/YYYY-MM-DD.json<br/>from Google Drive (on-demand)"]
    FETCH --> DETAIL["Render full day detail view"]

    TAP -->|No| RESULTS
```

#### 4.7.3 Filter Logic

```mermaid
flowchart LR
    subgraph OR_MODE["OR Mode"]
        OR1["energy = High"] -->|OR| OR2["mood = Happy"]
        OR2 --> ORR["Match if ANY criterion satisfied"]
    end

    subgraph AND_MODE["AND Mode"]
        AND1["energy = High"] -->|AND| AND2["mood = Happy"]
        AND2 --> ANDR["Match only if ALL criteria satisfied"]
    end

    RESET["Reset"] --> CLEAR["Clear all active filters<br/>Show full timeline"]
```

### 4.8 Export Engine

```mermaid
flowchart TD
    USER["User taps Export"] --> CHOICE{"Export type?"}

    CHOICE -->|"Full Archive"| BATCH["Batch download all<br/>logs/*.json from Drive"]
    BATCH --> ZIP["Client-side ZIP generation<br/>(e.g. JSZip)"]
    ZIP --> DL1["Download .zip file"]

    CHOICE -->|"Summary CSV"| TRANSFORM["Transform in-memory<br/>summary_index.json"]
    TRANSFORM --> CSV["Flatten to .csv format"]
    CSV --> DL2["Download .csv file"]
```

| Export Type | Source | Output Format | Mechanism |
|---|---|---|---|
| Full archive | All `logs/*.json` files | `.zip` containing individual JSON files | Batch download from Drive → client-side zip generation (e.g. JSZip) |
| Summary CSV | `summary_index.json` | Flat `.csv` file | Client-side transformation, no Drive reads needed beyond cached index |

---

## 5. End-to-End Flow — Complete Session

```mermaid
flowchart TD
    A["Open SDT in browser"] --> B["Google OAuth sign-in"]
    B --> C["Download config.json + summary_index.json"]
    C --> D["Render checklist dashboard"]

    D --> E["User taps option chips"]
    E --> F{"Add custom option?"}
    F -->|"Quick Add"| G["Temp chip created in-memory"]
    G --> E
    F -->|No| H["User types location string"]

    H --> I{"Optional free-form note?"}
    I -->|Yes| J["Type note in text area"]
    I -->|No| K["Tap Save Log"]
    J --> K

    K --> L["Resolve date (midnight rollover)"]
    L --> M["Call WeatherAPI.com<br/>GET /current.json?q=location&aqi=yes"]
    M --> N["Map us-epa-index → text label"]
    N --> O["Build daily payload JSON"]
    O --> P{"Existing log for this date?"}

    P -->|Yes| Q["Download existing → shallow merge"]
    P -->|No| R["Create new file"]
    Q --> S["Upload to Drive"]
    R --> S

    S --> T["Update summary_index.json"]
    T --> U["Upload index to Drive"]
    U --> V["✓ Done — show success"]
```

---

## 6. Security Considerations

| Concern | Mitigation |
|---|---|
| **Data at rest** | All data resides in user's Google Drive, encrypted by Google. |
| **OAuth scope** | Minimal `drive.file` scope — app can only access files it creates. |
| **Token storage** | Access tokens in memory only. No local persistence. |
| **WeatherAPI key** | API key should be proxied through a lightweight edge function to avoid client-side exposure. Consider environment-level secrets. |
| **XSS / Injection** | Sanitise all user inputs (Quick Add text, free-form notes, location string) before rendering and before building JSON payloads. |

---

## 7. Performance Budget & Constraints

| Metric | Target |
|---|---|
| **Boot to interactive** | < 3 seconds (after OAuth, on 4G) |
| **Boot data transfer** | < 100 KB (config + index for ~1 year of data) |
| **Save latency** | < 2 seconds (payload build + API call + Drive upload) |
| **WeatherAPI call** | < 500ms (single lightweight GET) |
| **Lighthouse mobile score** | > 90 (Performance) |

---

## 8. Key Technical Decisions & Trade-offs

| Decision | Rationale | Trade-off |
|---|---|---|
| **No local persistence** | Simplicity, privacy, no sync conflicts. | Requires network for every session. No offline mode. |
| **Single summary index file** | Enables instant in-memory filtering without downloading all logs. | Index file grows linearly (~70 KB/year). Acceptable for years of use. |
| **Shallow merge on save** | Supports partial logging (daytime + nighttime). | Cannot track granular field-level history or diffs. |
| **Manual location** | Privacy, no GPS battery drain. | Slight friction; user must type city name each session. |
| **WeatherAPI.com (single provider)** | One GET call returns both weather and AQI. Free tier available. Reduces integration complexity. | Single point of failure for environmental data. Mitigated by graceful fallback (save without env data). |
| **EPA text labels in index** | Human-readable summaries without needing a lookup table at read time. | Slightly larger index entries. Raw numeric value preserved in daily payload for filtering. |
| **Client-side zip/CSV export** | No server needed. Fully stateless. | Large archives may be slow on low-end mobile devices. |
| **Day Mode as default** | Broader usability across all times of day. | Late-night users must toggle to Night Mode (or rely on system `prefers-color-scheme`). |

---

## 9. Future Considerations (Out of Scope for v1)

- **PWA / Service Worker caching** for basic offline shell rendering.
- **Shared journals** (multi-user access to a Drive folder).
- **Data visualization** (charts/trends from summary index).
- **Reminders / notifications** (push notification at user-configured bedtime).
- **Voice input** as an alternative to free-form text typing.

---

## 10. Glossary

| Term | Definition |
|---|---|
| **SDT** | Silent Dynamic Tracker — this application. |
| **Summary Index** | `summary_index.json` — lightweight metadata file listing all logged days without full text content. |
| **Daily Payload** | `logs/YYYY-MM-DD.json` — complete log for a single day including all responses, environmental data, and notes. |
| **Quick Add** | In-line input allowing users to create ad-hoc checklist options during a session. |
| **Shallow Merge** | Field-level merge strategy where new values overwrite existing ones without deep recursive merging. |
| **Midnight Rollover** | Logic that assigns late-night sessions (00:00–04:59) to the previous calendar day by default. |
| **RWA** | Responsive Web App — a web application built with responsive design for cross-device compatibility. |
| **US EPA Index** | United States Environmental Protection Agency air quality scale (1–6) returned by WeatherAPI.com, mapped to text labels: Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, Hazardous. |
