import type { IAppConfig } from "@/types/config";

/**
 * Google Drive REST API v3 filenames, MIME types, and endpoints.
 */

export const APP_FOLDER_NAME = "SilentDynamicTracker" as const;
export const CONFIG_FILE_NAME = "config.json" as const;
export const INDEX_FILE_NAME = "summary_index.json" as const;
export const LOGS_DIR_NAME = "logs" as const;

export const MIME_TYPE_FOLDER = "application/vnd.google-apps.folder" as const;
export const MIME_TYPE_JSON = "application/json" as const;

export const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3" as const;
export const DRIVE_UPLOAD_BASE =
  "https://www.googleapis.com/upload/drive/v3" as const;

export const HTTP_STATUS_OK = 200 as const;
export const HTTP_STATUS_CREATED = 201 as const;
export const HTTP_STATUS_NO_CONTENT = 204 as const;
export const HTTP_STATUS_UNAUTHORIZED = 401 as const;
export const HTTP_STATUS_NOT_FOUND = 404 as const;

export const DEFAULT_APP_CONFIG: Readonly<IAppConfig> = Object.freeze({
  version: "1.0",
  standard_questions: [
    {
      id: "energy_level",
      question: "How was your energy today?",
      type: "select_one" as const,
      options: ["High", "Moderate", "Exhausted"],
      default: "Moderate",
    },
  ],
  custom_saved_questions: [],
});
