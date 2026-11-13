import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type IAuthContextValue } from "@/context/AuthContext";
import {
  DriveSyncProvider,
  performBootSync,
} from "@/context/DriveSyncContext";
import { useDriveSync } from "@/hooks/useDriveSync";
import type { DriveService } from "@/services/DriveService";
import type { GoogleAuthService } from "@/services/GoogleAuthService";
import type { IAppConfig } from "@/types/config";
import type { ISummaryIndex } from "@/types/summaryIndex";

describe("DriveSyncContext", () => {
  let mockDriveService: DriveService;
  let mockAuthService: GoogleAuthService;
  let authContextValue: IAuthContextValue;

  const sampleConfig: IAppConfig = {
    version: "1.0",
    standard_questions: [],
    custom_saved_questions: [],
  };

  const sampleIndex: ISummaryIndex = [
    {
      date: "2026-11-12",
      location: "Mumbai",
      weather_summary: "Clear",
      aqi_summary: "Moderate",
      mcq_responses: {},
      custom_entries_exist: false,
    },
  ];

  beforeEach(() => {
    mockAuthService = {
      getAccessToken: vi.fn().mockReturnValue("valid-token"),
      isAuthenticated: vi.fn().mockReturnValue(true),
    } as unknown as GoogleAuthService;

    authContextValue = {
      token: "valid-token",
      isAuthenticated: true,
      isLoading: false,
      authService: mockAuthService,
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    mockDriveService = {
      ensureAppFolder: vi.fn().mockResolvedValue("mock-app-folder-id"),
      ensureLogsFolder: vi.fn().mockResolvedValue("mock-logs-folder-id"),
      readJsonFile: vi.fn().mockImplementation((fileName: string) => {
        if (fileName === "config.json") return Promise.resolve(sampleConfig);
        if (fileName === "summary_index.json") return Promise.resolve(sampleIndex);
        return Promise.resolve(null);
      }),
      writeJsonFile: vi.fn().mockResolvedValue("saved-file-id"),
    } as unknown as DriveService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("performBootSync", () => {
    it("should write default config and empty index when files do not exist", async () => {
      vi.mocked(mockDriveService.readJsonFile).mockResolvedValue(null);

      const result = await performBootSync(mockDriveService);

      expect(result.appFolderId).toBe("mock-app-folder-id");
      expect(result.logsFolderId).toBe("mock-logs-folder-id");
      expect(result.config.version).toBe("1.0");
      expect(result.summaryIndex).toEqual([]);
      expect(mockDriveService.writeJsonFile).toHaveBeenCalledTimes(2);
    });

    it("should return loaded config and index when they exist", async () => {
      const result = await performBootSync(mockDriveService);

      expect(result.appFolderId).toBe("mock-app-folder-id");
      expect(result.config).toEqual(sampleConfig);
      expect(result.summaryIndex).toEqual(sampleIndex);
      expect(mockDriveService.writeJsonFile).not.toHaveBeenCalled();
    });
  });

  describe("DriveSyncProvider lifecycle and actions", () => {
    it("should auto-sync upon mount when authenticated", async () => {
      const { result } = renderHook(() => useDriveSync(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={authContextValue}>
            <DriveSyncProvider driveService={mockDriveService}>
              {children}
            </DriveSyncProvider>
          </AuthContext.Provider>
        ),
      });

      await act(async () => {
        // wait for effects to resolve
      });

      expect(result.current.appFolderId).toBe("mock-app-folder-id");
      expect(result.current.logsFolderId).toBe("mock-logs-folder-id");
      expect(result.current.config).toEqual(sampleConfig);
      expect(result.current.summaryIndex).toEqual(sampleIndex);
      expect(result.current.isBootSyncing).toBe(false);
      expect(result.current.syncError).toBeNull();
    });

    it("should capture and surface syncError if boot sync throws", async () => {
      vi.mocked(mockDriveService.ensureAppFolder).mockRejectedValueOnce(
        new Error("Network disconnect"),
      );

      const { result } = renderHook(() => useDriveSync(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={authContextValue}>
            <DriveSyncProvider driveService={mockDriveService}>
              {children}
            </DriveSyncProvider>
          </AuthContext.Provider>
        ),
      });

      await act(async () => {});

      expect(result.current.syncError).toBe("Network disconnect");
      expect(result.current.isBootSyncing).toBe(false);
    });

    it("should save config and update state", async () => {
      const { result } = renderHook(() => useDriveSync(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={authContextValue}>
            <DriveSyncProvider driveService={mockDriveService}>
              {children}
            </DriveSyncProvider>
          </AuthContext.Provider>
        ),
      });

      await act(async () => {});

      const updatedConfig: IAppConfig = {
        version: "2.0",
        standard_questions: [],
        custom_saved_questions: [],
      };

      await act(async () => {
        await result.current.saveConfig(updatedConfig);
      });

      expect(mockDriveService.writeJsonFile).toHaveBeenCalledWith(
        "config.json",
        "mock-app-folder-id",
        updatedConfig,
      );
      expect(result.current.config).toEqual(updatedConfig);
    });

    it("should save summary index and update state", async () => {
      const { result } = renderHook(() => useDriveSync(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={authContextValue}>
            <DriveSyncProvider driveService={mockDriveService}>
              {children}
            </DriveSyncProvider>
          </AuthContext.Provider>
        ),
      });

      await act(async () => {});

      const updatedIndex: ISummaryIndex = [];
      await act(async () => {
        await result.current.saveSummaryIndex(updatedIndex);
      });

      expect(mockDriveService.writeJsonFile).toHaveBeenCalledWith(
        "summary_index.json",
        "mock-app-folder-id",
        updatedIndex,
      );
      expect(result.current.summaryIndex).toEqual(updatedIndex);
    });

    it("should throw error if save is attempted before appFolderId is set", async () => {
      authContextValue.isAuthenticated = false;

      const { result } = renderHook(() => useDriveSync(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={authContextValue}>
            <DriveSyncProvider driveService={mockDriveService}>
              {children}
            </DriveSyncProvider>
          </AuthContext.Provider>
        ),
      });

      await expect(result.current.saveConfig(sampleConfig)).rejects.toThrow(
        "Cannot save config: App folder not initialized",
      );
      await expect(result.current.saveSummaryIndex(sampleIndex)).rejects.toThrow(
        "Cannot save index: App folder not initialized",
      );
    });

    it("should instantiate default DriveService when not provided in props", () => {
      authContextValue.isAuthenticated = false;

      const { result } = renderHook(() => useDriveSync(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={authContextValue}>
            <DriveSyncProvider>{children}</DriveSyncProvider>
          </AuthContext.Provider>
        ),
      });

      expect(result.current.driveService).toBeDefined();
    });
  });
});
