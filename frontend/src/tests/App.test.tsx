import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { useAuth } from "@/hooks/useAuth";
import { useDriveSync } from "@/hooks/useDriveSync";
import type { GoogleAuthService } from "@/services/GoogleAuthService";

vi.mock("@/hooks/useAuth");
vi.mock("@/hooks/useDriveSync");

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDriveSync).mockReturnValue({
      appFolderId: null,
      logsFolderId: null,
      config: null,
      summaryIndex: null,
      isBootSyncing: false,
      syncError: null,
      driveService: {} as never,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });
  });

  it("should render AuthBarrier displaying sign in prompt when unauthenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      isAuthenticated: false,
      isLoading: false,
      authService: {} as GoogleAuthService,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(
      screen.getByRole("heading", { name: /silent dynamic tracker/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with google/i }),
    ).toBeInTheDocument();
  });

  it("should render tabs and allow switching between Checklist and History when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      token: "valid-token",
      isAuthenticated: true,
      isLoading: false,
      authService: {} as GoogleAuthService,
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(useDriveSync).mockReturnValue({
      appFolderId: "app-id",
      logsFolderId: "logs-id",
      config: {
        version: "1.0",
        standard_questions: [],
        custom_saved_questions: [],
      },
      summaryIndex: [],
      isBootSyncing: false,
      syncError: null,
      driveService: {} as never,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("tab", { name: "Checklist" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "History" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Daily Tracker" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "History" }));
    expect(
      screen.getByRole("heading", { name: "History Timeline" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Checklist" }));
    expect(screen.getByRole("heading", { name: "Daily Tracker" })).toBeInTheDocument();
  });
});
