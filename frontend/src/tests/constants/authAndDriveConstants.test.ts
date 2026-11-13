import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLIENT_ID,
  DRIVE_FILE_SCOPE,
  GOOGLE_CLIENT_ID,
  TOKEN_EXPIRY_BUFFER_MS,
} from "@/constants/authConstants";
import {
  APP_FOLDER_NAME,
  CONFIG_FILE_NAME,
  DEFAULT_APP_CONFIG,
  DRIVE_API_BASE,
  DRIVE_UPLOAD_BASE,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  INDEX_FILE_NAME,
  LOGS_DIR_NAME,
  MIME_TYPE_FOLDER,
  MIME_TYPE_JSON,
} from "@/constants/driveConstants";

describe("authConstants", () => {
  it("should define drive.file scope and Google client ID values", () => {
    expect(DRIVE_FILE_SCOPE).toBe(
      "https://www.googleapis.com/auth/drive.file",
    );
    expect(DEFAULT_CLIENT_ID).toContain(".apps.googleusercontent.com");
    expect(GOOGLE_CLIENT_ID).toBeDefined();
    expect(TOKEN_EXPIRY_BUFFER_MS).toBe(60000);
  });
});

describe("driveConstants", () => {
  it("should define Drive folder structure, filenames, and MIME types", () => {
    expect(APP_FOLDER_NAME).toBe("SilentDynamicTracker");
    expect(CONFIG_FILE_NAME).toBe("config.json");
    expect(INDEX_FILE_NAME).toBe("summary_index.json");
    expect(LOGS_DIR_NAME).toBe("logs");
    expect(MIME_TYPE_FOLDER).toBe("application/vnd.google-apps.folder");
    expect(MIME_TYPE_JSON).toBe("application/json");
  });

  it("should define Drive REST API base endpoints and HTTP status codes", () => {
    expect(DRIVE_API_BASE).toBe("https://www.googleapis.com/drive/v3");
    expect(DRIVE_UPLOAD_BASE).toBe(
      "https://www.googleapis.com/upload/drive/v3",
    );
    expect(HTTP_STATUS_OK).toBe(200);
    expect(HTTP_STATUS_CREATED).toBe(201);
    expect(HTTP_STATUS_NO_CONTENT).toBe(204);
    expect(HTTP_STATUS_UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS_NOT_FOUND).toBe(404);
  });

  it("should export valid DEFAULT_APP_CONFIG conforming to schema", () => {
    expect(DEFAULT_APP_CONFIG.version).toBe("1.0");
    expect(DEFAULT_APP_CONFIG.standard_questions.length).toBeGreaterThan(0);
    expect(DEFAULT_APP_CONFIG.standard_questions[0].id).toBe("energy_level");
    expect(DEFAULT_APP_CONFIG.custom_saved_questions).toEqual([]);
  });
});

