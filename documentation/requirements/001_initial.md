# Product Requirements Document (PRD)

## Project Title: Silent Dynamic Tracker (SDT)
**Core Value Proposition:** A frictionless, completely silent, and dynamic journaling web app designed for late-night use on mobile and desktop. It utilizes a rapid-tap checklist interface that adapts to the user's day, automatically attaches localized environmental data, and securely syncs directly to the user's personal Google Drive with a lightweight sync footprint.

---

## 1. System Architecture & State Management

### 1.1 Stateless Architecture
* **Zero Local State:** The application must not maintain any persistent local database (e.g., IndexedDB, LocalStorage, SQLite).
* **Session Memory Only:** Active state exists purely in-memory during an active browser session. Refreshing or closing the app wipes all uncommitted data.

### 1.2 Google Drive Integration
* **Authentication Barrier:** A mandatory Google Sign-In prompt acts as the application gateway. If the user is logged out, the dashboard is completely empty, and no features are accessible.
* **Storage Protocol:** All user data is stored within a dedicated app folder in the user's personal Google Drive account (e.g., as structured JSON files).
* **Lightweight Sync Mechanism:**
  * To maximize speed and minimize data costs, the app **must not** download historical text notes during initial boot sync.
  * On login, the app downloads a single, lightweight **Summary Index File** (`summary_index.json`).
  * The Summary Index contains only the Date, standard MCQ responses, location text, weather/AQI summaries, and a boolean flag (`custom_entries_exist: true/false`).
  * Full text notes or custom layout definitions for specific days are only fetched on-demand if the user explicitly opens that historical day's log.

### 1.3 Master Configuration Management
* **Global Configuration File (`config.json`):** Because the application maintains zero local state, it relies on a central configuration file stored in the user's Google Drive. 
* **Dynamic Schema Resolution:** This file acts as the single source of truth for the current layout schema, storing all standard questions, permanently saved custom questions/options, and their respective system default values.

---

## 2. Core Functional Requirements

### 2.1 The Dynamic Checklist Interface
* **Rapid-Tap Layout:** The UI must be optimized for late-night, low-light viewing featuring large touch targets (chips/buttons) for silent tapping. The app supports Day Mode and Night Mode, with **Day Mode acting as the system default**.
* **Dynamic Customization (Quick Add):**
  * A "Quick Add" input field must be present within every category/question block.
  * Typing a novel option and pressing enter instantly generates a temporary checklist chip for the current logging session.
  * **Permanent Persistence Logic:** If a user chooses to save a new MCQ option permanently, it is written to the global `config.json` and will automatically feature in the default daily checklist and summary index moving forward. If an entirely new question block is added, the user must specify a default value to maintain database consistency.
  * **System Flag Triggering:** Adding any custom free-form note or a novel question/option automatically flags the current day's record as `custom_entries_exist: true` within the summary index (assuming the question/option was not saved permanently above).
* **Optional Text Field:** A single text area at the bottom of the checklist for free-form thoughts. Leaving it empty is perfectly valid, allowing a 100% tap-only submission.

### 2.2 Environmental Data Enrichment
* **Manual Location Input:** To protect privacy and prevent passive battery drain from GPS background loops, the user manually types their city/location into a session field (e.g., "Mumbai, India").
* **API Ingestion:** Upon hitting "Save Log", the app requests real-time weather metrics and Air Quality Index (AQI) values via lightweight APIs using the manual location string.
* **Automatic Metadata Attachment:** The fetched Weather (temperature, conditions) and AQI numerical data are silently appended to that day's JSON payload before being committed to Google Drive.

### 2.3 Cross-Platform & Layout Pacing
* **Responsive Web App (RWA):** Built to run seamlessly within web browsers on both laptops (desktop layout) and smartphones. **The smartphone layout is the primary design target**.
* **Design Considerations:** The interface stacks vertically on mobile screens while utilizing a multi-column dashboard grid on desktop screens to reduce scrolling.
* **Smart Midnight Rollover Handler:** Because the primary usage window occurs late at night, sessions initiated between 12:00 AM and 5:00 AM will lock the logging date to the previous calendar day, or explicitly prompt the user to confirm the target entry date. User can always log an entry/update an for any previous day.
* **Data Integrity (Merge vs Overwrite):** If a payload file already exists for the selected date (e.g., a brief entry made during the day), saving a new log triggers a shallow merge on Google Drive, preserving existing daytime selections while appending new nighttime notes.

### 2.4 Chronological Grouping & Advanced Filtering Controls
* **Hierarchical Time Grouping:** Saved historical logs and entries must be naturally grouped by Year and Month within the UI view.
* **Compound Time Filters:**
  * Users can filter their timeline view using a chronological dropdown/selector positioned above or alongside the MCQ filters.
  * The default scope is "All Time".
  * The selector supports granular multiple selections: multiple discrete years, multiple combinations of years and months within those years, or a single year focused across one or more chosen months.
* **MCQ Response Matrix Filters:**
  * Users can filter and retrieve historical logs based on selections made inside the standard MCQ summary registry.
  * The user can choose one or many targets and apply logical operators: `OR` matching, `AND` matching, or trigger a full criteria `Reset` to clear active parameters.
* **Lazy-Loading Data Hydration:** Applying filters operates entirely on the metadata inside `summary_index.json`. The full descriptive text notes are asynchronously retrieved on-demand from the corresponding daily payload file (`logs/YYYY-MM-DD.json`) only when an individual item from the filtered results is explicitly expanded or tapped by the user.

### 2.5 Bulk Data Portability
* **Export Engine:** To ensure data sovereignty within a stateless file-per-day architecture, the app provides a one-click data exporter. Users can download a zipped archive containing all isolated daily JSON logs
* **Summary Index** export the compiled `summary_index.json` into a flat, downloadable `.CSV` spreadsheet file.

---

## 3. Data Schema Specifications

### 3.1 Global Configuration File (`config.json`)
```json
{
  "version": "1.0",
  "standard_questions": [
    {
      "id": "energy_level",
      "question": "How was your energy today?",
      "type": "select_one",
      "options": ["High", "Moderate", "Exhausted"],
      "default": "Moderate"
    }
  ],
  "custom_saved_questions": [
    {
      "id": "custom_symptoms",
      "question": "Symptoms",
      "type": "select_multiple",
      "options": ["Headache", "Fatigue"],
      "default": []
    }
  ]
}
```

### 3.2 The Summary Index File (`summary_index.json`)
```json
[
  {
    "date": "2026-11-09",
    "location": "Mumbai",
    "weather_summary": "31°C, Clear",
    "aqi_summary": 105,
    "mcq_responses": {
      "energy_level": "Moderate",
      "interacted_with": ["Family", "Pets"]
    },
    "custom_entries_exist": true
  }
]
```

### 3.3 Individual Day Detailed Payload (`logs/2026-11-09.json`)
```json
{
  "date": "2026-11-09",
  "location": "Mumbai",
  "environmental_data": {
    "temperature": "31C",
    "condition": "Clear",
    "aqi": 105,
    "pm25": 36.4
  },
  "standard_responses": {
    "energy_level": "Moderate",
    "interacted_with": ["Family", "Pets"],
    "habits_completed": ["Exercised", "Drank Water"]
  },
  "custom_additions": {
    "custom_questions": [
      {
        "question": "Symptoms",
        "type": "checkbox",
        "selections": ["Headache"]
      }
    ]
  },
  "free_form_notes": "Had a weird argument with Max, need to resolve tomorrow."
}
```

---

## 4. Technical Constraints & Stack Guidelines

* **Deployment Platform:** Built and deployed natively using Anti-gravity environments.
* **Core Engine:** Logic, UI generation, and layout rendering orchestrated via Gemini models.
* **Authentication:** Google OAuth 2.0 scoped strictly to `drive.file` (allowing the app to read and write only the specific files it creates).
* **Network Operations:** The app must elegantly display a loading spinner while downloading the small index file or config file on boot, and during the evening data merge/upload phase.
