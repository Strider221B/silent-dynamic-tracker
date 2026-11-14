import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useDayDetail from "@/hooks/useDayDetail";
import type { DriveService } from "@/services/DriveService";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { IEnvironmentalData } from "@/types/environmental";
import type { ISummaryIndex } from "@/types/summaryIndex";

describe("useDayDetail", () => {
  const mockDailyPayload: IDailyPayload = {
    date: "2026-11-14",
    location: "Berlin",
    environmental_data: {
      temperature: "14C",
      condition: "Clear",
      aqi: "Good",
      aqi_numeric: 1,
      pm25: 10,
      source: "api",
    },
    standard_responses: { energy_level: "High" },
    custom_additions: { custom_questions: [] },
    free_form_notes: "Productive day.",
  };

  const mockIndex: ISummaryIndex = [
    {
      date: "2026-11-14",
      location: "Berlin",
      weather_summary: "14C, Clear",
      aqi_summary: "Good",
      mcq_responses: { energy_level: "High" },
      custom_entries_exist: true,
    },
  ];

  let mockDriveService: DriveService;
  let mockSaveSummaryIndex: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDriveService = {
      readDailyPayload: vi.fn().mockResolvedValue(mockDailyPayload),
      writeDailyPayload: vi.fn().mockResolvedValue("file-id-123"),
      writeSummaryIndexFile: vi.fn().mockResolvedValue("index-file-id"),
    } as unknown as DriveService;

    mockSaveSummaryIndex = vi.fn().mockResolvedValue(undefined);
  });

  it("should fetch payload on openDayDetail if not cached", async () => {
    const { result } = renderHook(() =>
      useDayDetail({
        driveService: mockDriveService,
        logsFolderId: "logs-folder-1",
        appFolderId: "app-folder-1",
        summaryIndex: mockIndex,
        saveSummaryIndex: mockSaveSummaryIndex,
      }),
    );

    await act(async () => {
      await result.current.openDayDetail("2026-11-14");
    });

    expect(mockDriveService.readDailyPayload).toHaveBeenCalledWith(
      "2026-11-14",
      "logs-folder-1",
    );
    expect(result.current.activeEntryDate).toBe("2026-11-14");
    expect(result.current.activePayload).toEqual(mockDailyPayload);
    expect(result.current.isLoadingPayload).toBe(false);
    expect(result.current.payloadError).toBeNull();
  });

  it("should reuse cached payload on subsequent open without refetching", async () => {
    const { result } = renderHook(() =>
      useDayDetail({
        driveService: mockDriveService,
        logsFolderId: "logs-folder-1",
        appFolderId: "app-folder-1",
        summaryIndex: mockIndex,
        saveSummaryIndex: mockSaveSummaryIndex,
      }),
    );

    await act(async () => {
      await result.current.openDayDetail("2026-11-14");
    });
    expect(mockDriveService.readDailyPayload).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.openDayDetail("2026-11-14");
    });
    expect(mockDriveService.readDailyPayload).toHaveBeenCalledTimes(1);
  });

  it("should set payloadError if daily log file is not found", async () => {
    vi.mocked(mockDriveService.readDailyPayload).mockResolvedValueOnce(null);

    const { result } = renderHook(() =>
      useDayDetail({
        driveService: mockDriveService,
        logsFolderId: "logs-folder-1",
      }),
    );

    await act(async () => {
      await result.current.openDayDetail("2026-11-10");
    });

    expect(result.current.payloadError).toBe("Daily log file not found.");
    expect(result.current.activePayload).toBeNull();
  });

  it("should set payloadError if reading throws an exception", async () => {
    vi.mocked(mockDriveService.readDailyPayload).mockRejectedValueOnce(
      new Error("Network timeout"),
    );

    const { result } = renderHook(() =>
      useDayDetail({
        driveService: mockDriveService,
        logsFolderId: "logs-folder-1",
      }),
    );

    await act(async () => {
      await result.current.openDayDetail("2026-11-10");
    });

    expect(result.current.payloadError).toBe("Network timeout");
  });

  it("should toggle day detail modal open and close", async () => {
    const { result } = renderHook(() =>
      useDayDetail({
        driveService: mockDriveService,
        logsFolderId: "logs-folder-1",
      }),
    );

    await act(async () => {
      await result.current.openDayDetail("2026-11-14");
    });
    expect(result.current.activeEntryDate).toBe("2026-11-14");

    act(() => {
      result.current.closeDayDetail();
    });
    expect(result.current.activeEntryDate).toBeNull();
  });

  it("should save manual environmental edits with source: manual and update summary index", async () => {
    const { result } = renderHook(() =>
      useDayDetail({
        driveService: mockDriveService,
        logsFolderId: "logs-folder-1",
        appFolderId: "app-folder-1",
        summaryIndex: mockIndex,
        saveSummaryIndex: mockSaveSummaryIndex,
      }),
    );

    await act(async () => {
      await result.current.openDayDetail("2026-11-14");
    });

    act(() => {
      result.current.openEnvironmentalEdit();
    });
    expect(result.current.isEditingEnvironmental).toBe(true);

    const manualEdit: IEnvironmentalData = {
      temperature: "28C",
      condition: "Partly Cloudy",
      aqi: "Moderate",
      aqi_numeric: 2,
      pm25: 18.5,
    };

    await act(async () => {
      await result.current.saveEnvironmentalEdit(manualEdit);
    });

    expect(result.current.isEditingEnvironmental).toBe(false);
    expect(mockDriveService.writeDailyPayload).toHaveBeenCalledWith(
      "2026-11-14",
      "logs-folder-1",
      expect.objectContaining({
        environmental_data: expect.objectContaining({
          temperature: "28C",
          condition: "Partly Cloudy",
          source: "manual",
        }),
      }),
    );

    expect(mockSaveSummaryIndex).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          date: "2026-11-14",
          weather_summary: "28C, Partly Cloudy",
          aqi_summary: "Moderate",
        }),
      ]),
    );
  });

  it("should throw error when saving environmental edit without active date or service", async () => {
    const { result } = renderHook(() => useDayDetail({}));

    await expect(
      result.current.saveEnvironmentalEdit({
        temperature: "20C",
        condition: "Sunny",
        aqi: "Good",
      }),
    ).rejects.toThrow("Drive service or logs folder is not available.");
  });

  it("should write summary index directly via driveService when saveSummaryIndex is not provided and append new entry", async () => {
    const { result } = renderHook(() =>
      useDayDetail({
        driveService: mockDriveService,
        logsFolderId: "logs-folder-1",
        appFolderId: "app-folder-1",
        summaryIndex: [],
      }),
    );

    // Open detail for a date that was not in summaryIndex
    await act(async () => {
      await result.current.openDayDetail("2026-11-20");
    });

    const manualEdit: IEnvironmentalData = {
      temperature: "22C",
      condition: "Clear",
      aqi: "Good",
    };

    await act(async () => {
      await result.current.saveEnvironmentalEdit(manualEdit);
    });

    expect(mockDriveService.writeSummaryIndexFile).toHaveBeenCalledWith(
      "app-folder-1",
      expect.arrayContaining([
        expect.objectContaining({
          date: "2026-11-20",
          weather_summary: "22C, Clear",
          aqi_summary: "Good",
        }),
      ]),
    );
  });

  it("should set error if openDayDetail is called without drive service or logs folder", async () => {
    const { result } = renderHook(() => useDayDetail({}));

    await act(async () => {
      await result.current.openDayDetail("2026-11-14");
    });

    expect(result.current.payloadError).toBe(
      "Drive service or logs folder is not available.",
    );
  });

  it("should close environmental edit modal when closeEnvironmentalEdit is invoked", () => {
    const { result } = renderHook(() => useDayDetail({}));

    act(() => {
      result.current.openEnvironmentalEdit();
    });
    expect(result.current.isEditingEnvironmental).toBe(true);

    act(() => {
      result.current.closeEnvironmentalEdit();
    });
    expect(result.current.isEditingEnvironmental).toBe(false);
  });
});
