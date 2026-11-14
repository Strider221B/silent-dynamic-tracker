import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HistoryDashboard from "@/components/history/HistoryDashboard";
import { useDriveSync } from "@/hooks/useDriveSync";
import { DriveService } from "@/services/DriveService";
import type { IAppConfig } from "@/types/config";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { ISummaryIndex, ISummaryIndexEntry } from "@/types/summaryIndex";

vi.mock("@/hooks/useDriveSync");

const TARGET_DATE = "2026-11-09" as const;
const APP_FOLDER_ID = "app-id" as const;
const LOGS_FOLDER_ID = "logs-id" as const;
const YEAR_2026 = 2026 as const;
const FULL_NOTES_TEXT = "In-depth reflections: completed full workout and finished project audit." as const;

const MOCK_CONFIG: IAppConfig = {
  version: "1.0",
  standard_questions: [
    {
      id: "energy_level",
      question: "Energy Level",
      type: "select_one",
      options: ["High", "Medium", "Low"],
      default: "High",
    },
  ],
  custom_saved_questions: [],
};

function generate100SummaryEntries(): ISummaryIndex {
  const list: ISummaryIndexEntry[] = [
    {
      date: TARGET_DATE,
      location: "Mumbai, India",
      weather_summary: "26C, Clear",
      aqi_summary: "Good",
      mcq_responses: { energy_level: "High" },
      custom_entries_exist: true,
    },
    {
      date: "2026-11-08",
      location: "Mumbai, India",
      weather_summary: "25C, Clouds",
      aqi_summary: "Moderate",
      mcq_responses: { energy_level: "Low" },
      custom_entries_exist: false,
    },
  ];

  const startDate = new Date(2024, 0, 1);
  for (let i = 0; i < 100; i++) {
    const cur = new Date(startDate.getTime() + i * 86400000);
    const dateStr = cur.toISOString().slice(0, 10);
    if (dateStr !== TARGET_DATE && dateStr !== "2026-11-08") {
      list.push({
        date: dateStr,
        location: "City",
        weather_summary: "20C, Clear",
        aqi_summary: "Good",
        mcq_responses: { energy_level: i % 2 === 0 ? "High" : "Medium" },
        custom_entries_exist: false,
      });
    }
  }
  return list;
}

const MOCK_DETAIL_PAYLOAD: IDailyPayload = {
  date: TARGET_DATE,
  location: "Mumbai, India",
  environmental_data: {
    temperature: "26C",
    condition: "Clear",
    aqi: "Good",
    source: "manual",
    pm25: null,
  },
  standard_responses: { energy_level: "High" },
  custom_additions: { custom_questions: [] },
  free_form_notes: FULL_NOTES_TEXT,
};

describe("E2E Integration: Compound Filtering & Lazy Hydration", () => {
  let mockDriveService: DriveService;
  const mockIndex = generate100SummaryEntries();

  beforeEach(() => {
    vi.clearAllMocks();

    mockDriveService = {
      readDailyPayload: vi.fn().mockResolvedValue(MOCK_DETAIL_PAYLOAD),
      writeDailyPayload: vi.fn(),
      writeSummaryIndexFile: vi.fn(),
      ensureAppFolder: vi.fn().mockResolvedValue(APP_FOLDER_ID),
    } as unknown as DriveService;

    vi.mocked(useDriveSync).mockReturnValue({
      appFolderId: APP_FOLDER_ID,
      logsFolderId: LOGS_FOLDER_ID,
      config: MOCK_CONFIG,
      summaryIndex: mockIndex,
      isBootSyncing: false,
      syncError: null,
      driveService: mockDriveService,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });
  });

  it("should load 100+ entries instantly, filter by Year 2026 & High energy, and lazy-hydrate day details", async () => {
    render(<HistoryDashboard />);

    expect(screen.getByText("History Timeline")).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${mockIndex.length} entries recorded`, "i")),
    ).toBeInTheDocument();
    expect(mockDriveService.readDailyPayload).not.toHaveBeenCalled();

    const yearBtn = screen.getByRole("button", { name: String(YEAR_2026) });
    fireEvent.click(yearBtn);

    const andModeBtn = screen.getByRole("button", { name: "AND" });
    fireEvent.click(andModeBtn);

    const highChip = screen.getByRole("button", { name: "High" });
    fireEvent.click(highChip);

    const matchingCard = screen.getByText(TARGET_DATE);
    expect(matchingCard).toBeInTheDocument();
    expect(screen.queryByText("2026-11-08")).toBeNull();

    fireEvent.click(matchingCard);

    expect(mockDriveService.readDailyPayload).toHaveBeenCalledWith(
      TARGET_DATE,
      LOGS_FOLDER_ID,
    );

    expect(await screen.findByText(FULL_NOTES_TEXT)).toBeInTheDocument();
    expect(screen.getByText("26C")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });
});
