import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HistoryDashboard from "@/components/history/HistoryDashboard";
import { useDriveSync } from "@/hooks/useDriveSync";
import { DriveService } from "@/services/DriveService";
import type { IAppConfig } from "@/types/config";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { ISummaryIndex } from "@/types/summaryIndex";

vi.mock("@/hooks/useDriveSync");

const TARGET_DATE = "2026-11-09" as const;
const APP_FOLDER_ID = "app-id" as const;
const LOGS_FOLDER_ID = "logs-id" as const;
const TEMP_INPUT_VAL = "26C" as const;
const CONDITION_INPUT_VAL = "Clear" as const;
const AQI_SELECT_VAL = "Good" as const;

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

const INITIAL_DAY_PAYLOAD: IDailyPayload = {
  date: TARGET_DATE,
  location: "Mumbai, India",
  environmental_data: null,
  standard_responses: { energy_level: "High" },
  custom_additions: { custom_questions: [] },
  free_form_notes: "Past date logged without live weather.",
};

const INITIAL_SUMMARY_INDEX: ISummaryIndex = [
  {
    date: TARGET_DATE,
    location: "Mumbai, India",
    weather_summary: null,
    aqi_summary: null,
    mcq_responses: { energy_level: "High" },
    custom_entries_exist: false,
  },
];

describe("E2E Integration: Past Date & Manual Environmental Editing", () => {
  let mockDriveService: DriveService;
  let writtenPayload: IDailyPayload | null = null;
  let updatedIndex: ISummaryIndex | null = null;
  let saveSummaryIndexSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    writtenPayload = null;
    updatedIndex = null;

    mockDriveService = {
      readDailyPayload: vi.fn().mockResolvedValue(INITIAL_DAY_PAYLOAD),
      writeDailyPayload: vi.fn().mockImplementation(
        async (_date: string, _logsId: string, payload: IDailyPayload) => {
          writtenPayload = payload;
          return "saved-file-id";
        },
      ),
      ensureAppFolder: vi.fn().mockResolvedValue(APP_FOLDER_ID),
    } as unknown as DriveService;

    saveSummaryIndexSpy = vi.fn().mockImplementation(async (idx: ISummaryIndex) => {
      updatedIndex = idx;
    });

    vi.mocked(useDriveSync).mockReturnValue({
      appFolderId: APP_FOLDER_ID,
      logsFolderId: LOGS_FOLDER_ID,
      config: MOCK_CONFIG,
      summaryIndex: INITIAL_SUMMARY_INDEX,
      isBootSyncing: false,
      syncError: null,
      driveService: mockDriveService,
      saveConfig: vi.fn(),
      saveSummaryIndex: saveSummaryIndexSpy,
      retryBootSync: vi.fn(),
    });
  });

  it("should open day detail, edit environmental fields, and persist manual source to Drive & index", async () => {
    render(<HistoryDashboard />);

    expect(screen.getByText("History Timeline")).toBeInTheDocument();
    expect(screen.getByText("1 entries recorded")).toBeInTheDocument();

    const entryCard = screen.getByText(TARGET_DATE);
    fireEvent.click(entryCard);

    expect(mockDriveService.readDailyPayload).toHaveBeenCalledWith(
      TARGET_DATE,
      LOGS_FOLDER_ID,
    );

    expect(await screen.findByText("Past date logged without live weather.")).toBeInTheDocument();
    expect(screen.getByText("No weather data — tap to add")).toBeInTheDocument();

    const addWeatherBtn = screen.getByRole("button", { name: "Add Weather" });
    fireEvent.click(addWeatherBtn);

    expect(screen.getByRole("dialog", { name: "Edit Environmental Data" })).toBeInTheDocument();

    const tempInput = screen.getByLabelText("Temperature");
    fireEvent.change(tempInput, { target: { value: TEMP_INPUT_VAL } });

    const conditionInput = screen.getByLabelText("Condition");
    fireEvent.change(conditionInput, { target: { value: CONDITION_INPUT_VAL } });

    const aqiSelect = screen.getByLabelText("Air Quality Index (AQI)");
    fireEvent.change(aqiSelect, { target: { value: AQI_SELECT_VAL } });

    const saveBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockDriveService.writeDailyPayload).toHaveBeenCalled();
    });

    expect(writtenPayload).not.toBeNull();
    expect(writtenPayload?.environmental_data).toEqual({
      temperature: TEMP_INPUT_VAL,
      condition: CONDITION_INPUT_VAL,
      aqi: AQI_SELECT_VAL,
      aqi_numeric: 1,
      pm25: null,
      source: "manual",
    });

    expect(saveSummaryIndexSpy).toHaveBeenCalled();
    expect(updatedIndex).not.toBeNull();
    const entry = updatedIndex?.find((item) => item.date === TARGET_DATE);
    expect(entry?.weather_summary).toBe("26C, Clear");
    expect(entry?.aqi_summary).toBe("Good");
  });
});
