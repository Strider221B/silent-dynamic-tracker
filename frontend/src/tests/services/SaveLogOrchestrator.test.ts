import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DriveService } from "@/services/DriveService";
import { PayloadMergeService } from "@/services/PayloadMergeService";
import { SaveLogOrchestrator } from "@/services/SaveLogOrchestrator";
import { SessionStateService } from "@/services/SessionStateService";
import type { WeatherService } from "@/services/WeatherService";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { IEnvironmentalData } from "@/types/environmental";
import type { ISummaryIndex } from "@/types/summaryIndex";

describe("SaveLogOrchestrator", () => {
  let mockDriveService: DriveService;
  let mockWeatherService: WeatherService;
  let mergeService: PayloadMergeService;
  let sessionState: SessionStateService;
  let orchestrator: SaveLogOrchestrator;

  beforeEach(() => {
    mockDriveService = {
      readDailyPayload: vi.fn().mockResolvedValue(null),
      writeDailyPayload: vi.fn().mockResolvedValue("new-log-id"),
      ensureAppFolder: vi.fn().mockResolvedValue("app-folder-id"),
      writeSummaryIndexFile: vi.fn().mockResolvedValue("index-id"),
    } as unknown as DriveService;

    mockWeatherService = {
      fetchEnvironmentalData: vi.fn().mockResolvedValue({
        temperature: "28C",
        condition: "Partly Cloudy",
        aqi: "Moderate",
        aqi_numeric: 2,
        pm25: 18.5,
        source: "api",
      } as IEnvironmentalData),
    } as unknown as WeatherService;

    mergeService = new PayloadMergeService();
    sessionState = new SessionStateService();

    orchestrator = new SaveLogOrchestrator(
      mockDriveService,
      mockWeatherService,
      mergeService,
      sessionState,
    );
  });

  it("should perform end-to-end save when no existing daily file exists", async () => {
    sessionState.setResponse("mood", "Peaceful");
    sessionState.setNotes("Night reflection");

    const initialIndex: ISummaryIndex = [
      {
        date: "2026-11-13",
        location: "Mumbai",
        weather_summary: "30C, Sunny",
        aqi_summary: "Good",
        mcq_responses: { mood: "Energetic" },
        custom_entries_exist: false,
      },
    ];

    const result = await orchestrator.executeSave(
      "2026-11-14",
      "Mumbai",
      "logs-folder-id",
      initialIndex,
      "app-folder-id",
    );

    // Weather was fetched
    expect(mockWeatherService.fetchEnvironmentalData).toHaveBeenCalledWith(
      "Mumbai",
      "2026-11-14",
    );

    // Daily payload written
    expect(mockDriveService.writeDailyPayload).toHaveBeenCalledWith(
      "2026-11-14",
      "logs-folder-id",
      expect.objectContaining({
        date: "2026-11-14",
        location: "Mumbai",
        free_form_notes: "Night reflection",
        standard_responses: { mood: "Peaceful" },
        environmental_data: expect.objectContaining({
          temperature: "28C",
          condition: "Partly Cloudy",
          aqi: "Moderate",
        }),
      }),
    );

    // Summary index updated and saved
    expect(result.updatedIndex).toHaveLength(2);
    const newEntry = result.updatedIndex.find((e) => e.date === "2026-11-14");
    expect(newEntry).toBeDefined();
    expect(newEntry?.weather_summary).toBe("28C, Partly Cloudy");
    expect(newEntry?.aqi_summary).toBe("Moderate");
    expect(newEntry?.custom_entries_exist).toBe(true);

    expect(mockDriveService.writeSummaryIndexFile).toHaveBeenCalledWith(
      "app-folder-id",
      result.updatedIndex,
    );
  });

  it("should execute shallow merge when daytime log already exists on Drive", async () => {
    const existingDaytimePayload: IDailyPayload = {
      date: "2026-11-14",
      location: "Pune",
      environmental_data: {
        temperature: "25C",
        condition: "Sunny",
        aqi: "Good",
        source: "api",
      },
      standard_responses: {
        energy: "High",
        habits: ["Morning run"],
      },
      custom_additions: { custom_questions: [] },
      free_form_notes: "",
    };

    vi.mocked(mockDriveService.readDailyPayload).mockResolvedValue(
      existingDaytimePayload,
    );

    sessionState.setResponse("habits", ["Reading"]);
    sessionState.setNotes("Added night routine");

    const result = await orchestrator.executeSave(
      "2026-11-14",
      "Pune",
      "logs-folder-id",
      [],
    );

    expect(mockDriveService.ensureAppFolder).toHaveBeenCalled();

    // Verify merged standard_responses preserved 'energy' while updating 'habits'
    expect(mockDriveService.writeDailyPayload).toHaveBeenCalledWith(
      "2026-11-14",
      "logs-folder-id",
      expect.objectContaining({
        standard_responses: {
          energy: "High",
          habits: ["Reading"],
        },
        free_form_notes: "Added night routine",
      }),
    );

    expect(result.updatedIndex[0].custom_entries_exist).toBe(true);
  });

  it("should handle null environmental data gracefully (e.g. past dates)", async () => {
    vi.mocked(mockWeatherService.fetchEnvironmentalData).mockResolvedValue(null);

    const result = await orchestrator.executeSave(
      "2026-11-10",
      "Delhi",
      "logs-folder-id",
      [],
      "app-folder-id",
    );

    expect(result.updatedIndex[0].weather_summary).toBeNull();
    expect(result.updatedIndex[0].aqi_summary).toBeNull();
    expect(result.updatedIndex[0].custom_entries_exist).toBe(false);
  });

  it("should format weather summary when only temperature or condition is available", async () => {
    vi.mocked(mockWeatherService.fetchEnvironmentalData).mockResolvedValue({
      temperature: "20C",
      condition: null,
      aqi: null,
      source: "api",
    } as IEnvironmentalData);

    const result = await orchestrator.executeSave(
      "2026-11-14",
      "Berlin",
      "logs-folder-id",
      [],
      "app-folder-id",
    );

    expect(result.updatedIndex[0].weather_summary).toBe("20C");
  });

  it("should mark custom_entries_exist true if merged existing log contains custom questions", async () => {
    const existingWithCustom: IDailyPayload = {
      date: "2026-11-14",
      location: "Kyoto",
      environmental_data: null,
      standard_responses: {},
      custom_additions: {
        custom_questions: [
          {
            question: "custom_q",
            type: "select_one",
            selections: ["Option 1"],
          },
        ],
      },
      free_form_notes: "",
    };

    vi.mocked(mockDriveService.readDailyPayload).mockResolvedValue(
      existingWithCustom,
    );
    vi.mocked(mockWeatherService.fetchEnvironmentalData).mockResolvedValue(null);

    const result = await orchestrator.executeSave(
      "2026-11-14",
      "Kyoto",
      "logs-folder-id",
      [],
      "app-folder-id",
    );

    expect(result.updatedIndex[0].custom_entries_exist).toBe(true);
  });
});
