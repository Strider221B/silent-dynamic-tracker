import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import {
  CONFIG_FILE_NAME,
  DEFAULT_APP_CONFIG,
  INDEX_FILE_NAME,
} from "@/constants/driveConstants";
import { THEME_LABEL_DAY } from "@/constants/themeConstants";
import { DriveService } from "@/services/DriveService";
import { GoogleAuthService } from "@/services/GoogleAuthService";

const APP_FOLDER_ID = "mock-app-folder-id" as const;
const LOGS_FOLDER_ID = "mock-logs-folder-id" as const;
const MOCK_TOKEN = "mock-gis-access-token" as const;
const HEADING_AUTH = "Silent Dynamic Tracker" as const;
const BTN_SIGN_IN = "Sign in with Google" as const;
const HEADING_DASHBOARD = "Daily Tracker" as const;

describe("E2E Integration: Initial Boot Sequence", () => {
  let authCallback: ((token: string) => void) | null = null;
  let writtenFiles: Record<string, unknown> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = null;
    writtenFiles = {};

    vi.spyOn(GoogleAuthService.prototype, "initClient").mockImplementation(
      (cb: (token: string) => void) => {
        authCallback = cb;
      },
    );

    vi.spyOn(GoogleAuthService.prototype, "requestAccessToken").mockImplementation(
      () => {
        if (authCallback) {
          authCallback(MOCK_TOKEN);
        }
      },
    );

    vi.spyOn(GoogleAuthService.prototype, "getAccessToken").mockReturnValue(MOCK_TOKEN);
    vi.spyOn(GoogleAuthService.prototype, "isAuthenticated").mockReturnValue(true);

    vi.spyOn(DriveService.prototype, "ensureAppFolder").mockResolvedValue(
      APP_FOLDER_ID,
    );
    vi.spyOn(DriveService.prototype, "ensureLogsFolder").mockResolvedValue(
      LOGS_FOLDER_ID,
    );

    vi.spyOn(DriveService.prototype, "readJsonFile").mockImplementation(
      async (fileName: string) => {
        return (writtenFiles[fileName] as never) ?? null;
      },
    );

    vi.spyOn(DriveService.prototype, "writeJsonFile").mockImplementation(
      async (fileName: string, _folderId: string, data: unknown) => {
        writtenFiles[fileName] = data;
        return `file-id-${fileName}`;
      },
    );
  });

  it("should guide first-time user from unauthenticated state to Day Mode dashboard", async () => {
    vi.spyOn(GoogleAuthService.prototype, "isAuthenticated").mockReturnValue(false);

    render(<App />);

    expect(screen.getByRole("heading", { name: HEADING_AUTH })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BTN_SIGN_IN })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: HEADING_DASHBOARD })).toBeNull();

    vi.spyOn(GoogleAuthService.prototype, "isAuthenticated").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: BTN_SIGN_IN }));

    expect(await screen.findByRole("heading", { name: HEADING_DASHBOARD })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Checklist" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "History" })).toBeInTheDocument();

    expect(writtenFiles[CONFIG_FILE_NAME]).toEqual(DEFAULT_APP_CONFIG);
    expect(writtenFiles[INDEX_FILE_NAME]).toEqual([]);

    const themeToggle = screen.getByRole("button", { name: THEME_LABEL_DAY });
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).toHaveTextContent("Day");
  });
});
