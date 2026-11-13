import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthBarrier } from "@/components/auth/AuthBarrier";
import { AuthContext, type IAuthContextValue } from "@/context/AuthContext";
import {
  DriveSyncContext,
  type IDriveSyncContextValue,
} from "@/context/DriveSyncContext";
import type { DriveService } from "@/services/DriveService";
import type { GoogleAuthService } from "@/services/GoogleAuthService";

describe("AuthBarrier", () => {
  let mockAuth: IAuthContextValue;
  let mockDriveSync: IDriveSyncContextValue;

  beforeEach(() => {
    mockAuth = {
      token: "mock-token",
      isAuthenticated: true,
      isLoading: false,
      authService: {} as GoogleAuthService,
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    mockDriveSync = {
      appFolderId: "folder-1",
      logsFolderId: "logs-1",
      config: { version: "1.0", standard_questions: [], custom_saved_questions: [] },
      summaryIndex: [],
      isBootSyncing: false,
      syncError: null,
      driveService: {} as DriveService,
      saveConfig: vi.fn().mockResolvedValue(undefined),
      saveSummaryIndex: vi.fn().mockResolvedValue(undefined),
      retryBootSync: vi.fn().mockResolvedValue(undefined),
    };
  });

  const renderWithProviders = (children: React.ReactNode) => {
    return render(
      <AuthContext.Provider value={mockAuth}>
        <DriveSyncContext.Provider value={mockDriveSync}>
          <AuthBarrier>{children}</AuthBarrier>
        </DriveSyncContext.Provider>
      </AuthContext.Provider>,
    );
  };

  it("should render SignInPrompt when user is unauthenticated", () => {
    mockAuth.isAuthenticated = false;

    renderWithProviders(<div data-testid="dashboard">Dashboard Content</div>);

    expect(
      screen.getByRole("heading", { name: /silent dynamic tracker/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("should render LoadingSpinner when auth is loading", () => {
    mockAuth.isLoading = true;

    renderWithProviders(<div data-testid="dashboard">Dashboard Content</div>);

    expect(
      screen.getByText("Connecting to Google Drive..."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("should render LoadingSpinner when boot sync is running", () => {
    mockDriveSync.isBootSyncing = true;

    renderWithProviders(<div data-testid="dashboard">Dashboard Content</div>);

    expect(
      screen.getByText("Connecting to Google Drive..."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("should render error message and retry button when syncError occurs", () => {
    mockDriveSync.syncError = "Network error connecting to Drive API";

    renderWithProviders(<div data-testid="dashboard">Dashboard Content</div>);

    expect(screen.getByText("Sync Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Network error connecting to Drive API"),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /retry connection/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(mockDriveSync.retryBootSync).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("should render protected dashboard children when authenticated and synced", () => {
    renderWithProviders(<div data-testid="dashboard">Dashboard Content</div>);

    expect(screen.getByTestId("dashboard")).toHaveTextContent(
      "Dashboard Content",
    );
  });
});

