import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HistoryDashboard from "@/components/history/HistoryDashboard";
import {
  DriveSyncContext,
  type IDriveSyncContextValue,
} from "@/context/DriveSyncContext";
import type { DriveService } from "@/services/DriveService";
import type { IAppConfig } from "@/types/config";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { ISummaryIndex } from "@/types/summaryIndex";

describe("HistoryDashboard", () => {
  const mockConfig: IAppConfig = {
    version: "1.0",
    standard_questions: [
      {
        id: "energy_level",
        question: "Energy Level",
        type: "select_one",
        options: ["High", "Moderate", "Low"],
        default: "Moderate",
      },
    ],
    custom_saved_questions: [],
  };

  const mockIndex: ISummaryIndex = [
    {
      date: "2026-11-14",
      location: "San Francisco",
      weather_summary: "16C, Sunny",
      aqi_summary: "Good",
      mcq_responses: { energy_level: "High" },
      custom_entries_exist: false,
    },
    {
      date: "2025-10-10",
      location: "Oakland",
      weather_summary: "22C, Clear",
      aqi_summary: "Moderate",
      mcq_responses: { energy_level: "Low" },
      custom_entries_exist: false,
    },
  ];

  const mockPayload: IDailyPayload = {
    date: "2026-11-14",
    location: "San Francisco",
    environmental_data: {
      temperature: "16C",
      condition: "Sunny",
      aqi: "Good",
      aqi_numeric: 1,
      pm25: 8.2,
      source: "api",
    },
    standard_responses: { energy_level: "High" },
    custom_additions: { custom_questions: [] },
    free_form_notes: "Morning jog was great.",
  };

  function renderWithDriveSync(overrides?: Partial<IDriveSyncContextValue>) {
    const mockDriveService = {
      readDailyPayload: vi.fn().mockResolvedValue(mockPayload),
      writeDailyPayload: vi.fn().mockResolvedValue("file-id"),
      writeSummaryIndexFile: vi.fn().mockResolvedValue("idx-id"),
    } as unknown as DriveService;

    const mockSaveIndex = vi.fn().mockResolvedValue(undefined);

    const contextValue: IDriveSyncContextValue = {
      appFolderId: "app-folder-id",
      logsFolderId: "logs-folder-id",
      config: mockConfig,
      summaryIndex: mockIndex,
      isBootSyncing: false,
      syncError: null,
      driveService: mockDriveService,
      saveConfig: vi.fn().mockResolvedValue(undefined),
      saveSummaryIndex: mockSaveIndex,
      retryBootSync: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };

    const utils = render(
      <DriveSyncContext.Provider value={contextValue}>
        <HistoryDashboard />
      </DriveSyncContext.Provider>,
    );

    return { ...utils, mockDriveService, mockSaveIndex };
  }

  it("should render dashboard title, entries count, and timeline groups", () => {
    renderWithDriveSync();

    expect(screen.getByRole("heading", { name: "History Timeline" })).toBeInTheDocument();
    expect(screen.getByText("2 entries recorded")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2026" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2025" })).toBeInTheDocument();
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
    expect(screen.getByText("Oakland")).toBeInTheDocument();
  });

  it("should filter timeline entries when year or MCQ chips are clicked", () => {
    renderWithDriveSync();

    fireEvent.click(screen.getByRole("button", { name: "2026" }));
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
    expect(screen.queryByText("Oakland")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
    expect(screen.getByText("Oakland")).toBeInTheDocument();
  });

  it("should open day detail modal on card click, fetch payload, and support environmental edit", async () => {
    const { mockDriveService, mockSaveIndex } = renderWithDriveSync();

    fireEvent.click(
      screen.getByRole("button", { name: /log entry for 2026-11-14/i }),
    );

    expect(await screen.findByText("Log: 2026-11-14")).toBeInTheDocument();
    expect(screen.getByText("Morning jog was great.")).toBeInTheDocument();
    expect(mockDriveService.readDailyPayload).toHaveBeenCalledWith(
      "2026-11-14",
      "logs-folder-id",
    );

    fireEvent.click(
      screen.getByRole("button", { name: /edit environmental data/i }),
    );
    expect(
      screen.getByRole("dialog", { name: "Edit Environmental Data" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/temperature/i), {
      target: { value: "19C" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockDriveService.writeDailyPayload).toHaveBeenCalledWith(
        "2026-11-14",
        "logs-folder-id",
        expect.objectContaining({
          environmental_data: expect.objectContaining({
            temperature: "19C",
            source: "manual",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockSaveIndex).toHaveBeenCalled();
    });
  });
});
