import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChecklistDashboard from "@/components/checklist/ChecklistDashboard";
import {
  CONFIRM_YESTERDAY_TEXT,
  LOCATION_LABEL,
  MIDNIGHT_MODAL_TITLE,
  NOTES_LABEL,
  QUICK_ADD_BUTTON_TEXT,
  SAVE_BUTTON_TEXT,
  SAVE_SUCCESS_TOAST,
} from "@/constants/checklistConstants";
import { useDriveSync } from "@/hooks/useDriveSync";
import { DriveService } from "@/services/DriveService";
import { WeatherService } from "@/services/WeatherService";
import type { IAppConfig } from "@/types/config";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { IEnvironmentalData } from "@/types/environmental";
import type { ISummaryIndex } from "@/types/summaryIndex";

vi.mock("@/hooks/useDriveSync");

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
    {
      id: "symptoms",
      question: "Symptoms",
      type: "select_multiple",
      options: ["Headache", "Fatigue"],
      default: [],
    },
  ],
  custom_saved_questions: [],
};

const SIMULATED_LATE_NIGHT = new Date(2026, 10, 14, 2, 0, 0);
const TARGET_DATE = "2026-11-13" as const;
const LOCATION_VAL = "Mumbai, India" as const;
const NOTE_VAL = "Had trouble sleeping tonight." as const;
const QUICK_ADD_TEXT = "Insomnia" as const;
const APP_FOLDER_ID = "app-folder-id" as const;
const LOGS_FOLDER_ID = "logs-folder-id" as const;

const EXISTING_DAY_PAYLOAD: IDailyPayload = {
  date: TARGET_DATE,
  location: LOCATION_VAL,
  environmental_data: null,
  standard_responses: {
    energy_level: "High",
    symptoms: [],
  },
  custom_additions: { custom_questions: [] },
  free_form_notes: "Morning jog completed.",
};

const MOCK_ENV_DATA: IEnvironmentalData = {
  temperature: "28C",
  condition: "Haze",
  aqi: "Moderate",
  source: "api",
  pm25: 65,
};

describe("E2E Integration: Late-Night Rapid Logging & Shallow Merge", () => {
  let mockDriveService: DriveService;
  let savedDailyPayload: IDailyPayload | null = null;
  let savedSummaryIndex: ISummaryIndex | null = null;
  let saveSummaryIndexSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(SIMULATED_LATE_NIGHT);
    savedDailyPayload = null;
    savedSummaryIndex = null;

    mockDriveService = {
      readDailyPayload: vi.fn().mockResolvedValue(EXISTING_DAY_PAYLOAD),
      writeDailyPayload: vi.fn().mockImplementation(
        async (_date: string, _logsId: string, payload: IDailyPayload) => {
          savedDailyPayload = payload;
          return "payload-file-id";
        },
      ),
      writeSummaryIndexFile: vi.fn().mockImplementation(
        async (_appId: string, index: ISummaryIndex) => {
          savedSummaryIndex = index;
          return "index-file-id";
        },
      ),
      ensureAppFolder: vi.fn().mockResolvedValue(APP_FOLDER_ID),
    } as unknown as DriveService;

    saveSummaryIndexSpy = vi.fn().mockImplementation(async (idx: ISummaryIndex) => {
      savedSummaryIndex = idx;
    });

    vi.mocked(useDriveSync).mockReturnValue({
      appFolderId: APP_FOLDER_ID,
      logsFolderId: LOGS_FOLDER_ID,
      config: MOCK_CONFIG,
      summaryIndex: [],
      isBootSyncing: false,
      syncError: null,
      driveService: mockDriveService,
      saveConfig: vi.fn(),
      saveSummaryIndex: saveSummaryIndexSpy,
      retryBootSync: vi.fn(),
    });

    vi.spyOn(WeatherService.prototype, "fetchEnvironmentalData").mockResolvedValue(
      MOCK_ENV_DATA,
    );
  });

  it("should log at 02:00 AM, confirm yesterday, query weather, and shallow-merge with daytime log", async () => {
    render(<ChecklistDashboard />);

    expect(screen.getByText(MIDNIGHT_MODAL_TITLE)).toBeInTheDocument();
    const yesterdayBtn = screen.getByRole("button", {
      name: new RegExp(CONFIRM_YESTERDAY_TEXT, "i"),
    });
    fireEvent.click(yesterdayBtn);
    expect(screen.queryByText(MIDNIGHT_MODAL_TITLE)).toBeNull();

    const lowOption = screen.getByRole("switch", { name: "Low" });
    fireEvent.click(lowOption);
    expect(lowOption).toHaveAttribute("aria-checked", "true");

    const quickAddInputs = screen.getAllByPlaceholderText(/add custom option/i);
    const symptomsQuickAdd = quickAddInputs[1];
    fireEvent.change(symptomsQuickAdd, { target: { value: QUICK_ADD_TEXT } });
    const addButtons = screen.getAllByRole("button", { name: QUICK_ADD_BUTTON_TEXT });
    fireEvent.click(addButtons[1]);

    const tempChip = await screen.findByRole("switch", { name: QUICK_ADD_TEXT });
    expect(tempChip).toBeInTheDocument();

    const locationInput = screen.getByLabelText(LOCATION_LABEL);
    fireEvent.change(locationInput, { target: { value: LOCATION_VAL } });

    const notesTextarea = screen.getByLabelText(NOTES_LABEL);
    fireEvent.change(notesTextarea, { target: { value: NOTE_VAL } });

    const saveButton = screen.getByRole("button", { name: SAVE_BUTTON_TEXT });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(SAVE_SUCCESS_TOAST)).toBeInTheDocument();
    });

    expect(WeatherService.prototype.fetchEnvironmentalData).toHaveBeenCalledWith(
      LOCATION_VAL,
      TARGET_DATE,
    );

    expect(mockDriveService.readDailyPayload).toHaveBeenCalledWith(
      TARGET_DATE,
      LOGS_FOLDER_ID,
    );

    expect(savedDailyPayload).not.toBeNull();
    expect(savedDailyPayload?.date).toBe(TARGET_DATE);
    expect(savedDailyPayload?.location).toBe(LOCATION_VAL);
    expect(savedDailyPayload?.environmental_data).toEqual(MOCK_ENV_DATA);
    expect(savedDailyPayload?.standard_responses).toEqual({
      energy_level: "Low",
      symptoms: [],
    });
    expect(savedDailyPayload?.free_form_notes).toBe(NOTE_VAL);

    expect(saveSummaryIndexSpy).toHaveBeenCalled();
    expect(savedSummaryIndex).not.toBeNull();
    const entry = savedSummaryIndex?.find((item) => item.date === TARGET_DATE);
    expect(entry).toBeDefined();
    expect(entry?.weather_summary).toBe("28C, Haze");
    expect(entry?.aqi_summary).toBe("Moderate");
    expect(entry?.custom_entries_exist).toBe(true);

    vi.useRealTimers();
  });
});
