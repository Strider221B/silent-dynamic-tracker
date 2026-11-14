import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChecklist } from "@/hooks/useChecklist";
import { useDriveSync } from "@/hooks/useDriveSync";
import type { SaveLogOrchestrator } from "@/services/SaveLogOrchestrator";
import { SessionStateService } from "@/services/SessionStateService";
import type { IAppConfig } from "@/types/config";

vi.mock("@/hooks/useDriveSync");

const mockConfig: IAppConfig = {
  version: "1.0",
  standard_questions: [
    {
      id: "energy",
      question: "Energy?",
      type: "select_one",
      options: ["Low", "High"],
      default: "Low",
    },
    {
      id: "habits",
      question: "Habits?",
      type: "select_multiple",
      options: ["Run", "Read"],
      default: ["Run"],
    },
  ],
  custom_saved_questions: [
    {
      id: "saved_q",
      question: "Saved?",
      type: "select_one",
      options: ["Yes", "No"],
      default: "No",
    },
  ],
};

describe("useChecklist", () => {
  let mockSaveConfig: ReturnType<typeof vi.fn>;
  let mockSaveSummaryIndex: ReturnType<typeof vi.fn>;
  let mockOrchestrator: SaveLogOrchestrator;
  let sessionState: SessionStateService;

  beforeEach(() => {
    mockSaveConfig = vi.fn().mockResolvedValue(undefined);
    mockSaveSummaryIndex = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useDriveSync).mockReturnValue({
      config: mockConfig,
      summaryIndex: [],
      logsFolderId: "logs-id",
      appFolderId: "app-id",
      driveService: {} as never,
      isBootSyncing: false,
      syncError: null,
      saveConfig: mockSaveConfig,
      saveSummaryIndex: mockSaveSummaryIndex,
      retryBootSync: vi.fn(),
    });

    sessionState = new SessionStateService();
    mockOrchestrator = {
      executeSave: vi.fn().mockResolvedValue({
        updatedIndex: [
          {
            date: "2026-11-14",
            location: "Goa",
            weather_summary: "Sunny",
            aqi_summary: "Good",
            mcq_responses: {},
            custom_entries_exist: false,
          },
        ],
      }),
    } as unknown as SaveLogOrchestrator;
  });

  it("should initialize default responses from config schema", () => {
    const { result } = renderHook(() =>
      useChecklist({ sessionState, targetDate: "2026-11-14" }),
    );

    expect(result.current.responses).toEqual({
      energy: "Low",
      habits: ["Run"],
      saved_q: "No",
    });
  });

  it("should update single select response", () => {
    const { result } = renderHook(() =>
      useChecklist({ sessionState, targetDate: "2026-11-14" }),
    );

    act(() => {
      result.current.handleSelectOption("energy", "High", false);
    });

    expect(result.current.responses.energy).toBe("High");
  });

  it("should toggle multi-select response on and off", () => {
    const { result } = renderHook(() =>
      useChecklist({ sessionState, targetDate: "2026-11-14" }),
    );

    // Add 'Read'
    act(() => {
      result.current.handleSelectOption("habits", "Read", true);
    });
    expect(result.current.responses.habits).toEqual(["Run", "Read"]);

    // Remove 'Run'
    act(() => {
      result.current.handleSelectOption("habits", "Run", true);
    });
    expect(result.current.responses.habits).toEqual(["Read"]);
  });

  it("should add temporary options via quick add", () => {
    const { result } = renderHook(() =>
      useChecklist({ sessionState, targetDate: "2026-11-14" }),
    );

    act(() => {
      result.current.handleQuickAdd("habits", "Yoga");
    });

    expect(result.current.temporaryOptions.habits).toEqual(["Yoga"]);
  });

  it("should update location and notes", () => {
    const { result } = renderHook(() =>
      useChecklist({ sessionState, targetDate: "2026-11-14" }),
    );

    act(() => {
      result.current.setLocation("Bangalore");
      result.current.setNotes("Great evening reflection.");
    });

    expect(result.current.location).toBe("Bangalore");
    expect(result.current.notes).toBe("Great evening reflection.");
  });

  it("should save option permanently to config", async () => {
    const { result } = renderHook(() =>
      useChecklist({ sessionState, targetDate: "2026-11-14" }),
    );

    await act(async () => {
      await result.current.handleSaveOptionPermanently("energy", "Medium");
    });

    expect(mockSaveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        standard_questions: expect.arrayContaining([
          expect.objectContaining({
            id: "energy",
            options: ["Low", "High", "Medium"],
          }),
        ]),
      }),
    );
  });

  it("should execute saveLog successfully", async () => {
    const onSaveSuccess = vi.fn();
    const { result } = renderHook(() =>
      useChecklist({
        sessionState,
        saveOrchestrator: mockOrchestrator,
        targetDate: "2026-11-14",
        onSaveSuccess,
      }),
    );

    act(() => {
      result.current.setLocation("Goa");
    });

    await act(async () => {
      await result.current.handleSaveLog();
    });

    expect(mockOrchestrator.executeSave).toHaveBeenCalledWith(
      "2026-11-14",
      "Goa",
      "logs-id",
      [],
      "app-id",
    );
    expect(mockSaveSummaryIndex).toHaveBeenCalled();
    expect(result.current.saveSuccess).toBe(true);
    expect(result.current.isSaving).toBe(false);
    expect(onSaveSuccess).toHaveBeenCalled();
  });

  it("should handle save error when logsFolderId is missing", async () => {
    vi.mocked(useDriveSync).mockReturnValue({
      config: mockConfig,
      summaryIndex: [],
      logsFolderId: null,
      appFolderId: null,
      driveService: {} as never,
      isBootSyncing: false,
      syncError: null,
      saveConfig: mockSaveConfig,
      saveSummaryIndex: mockSaveSummaryIndex,
      retryBootSync: vi.fn(),
    });

    const onSaveError = vi.fn();
    const { result } = renderHook(() =>
      useChecklist({
        sessionState,
        saveOrchestrator: mockOrchestrator,
        targetDate: "2026-11-14",
        onSaveError,
      }),
    );

    await act(async () => {
      await result.current.handleSaveLog();
    });

    expect(result.current.saveError).toBe(
      "Cannot save: logs folder is not ready.",
    );
    expect(result.current.isSaving).toBe(false);
    expect(onSaveError).toHaveBeenCalled();
  });

  it("should handle multi-select toggle when question is initially unselected", () => {
    const { result } = renderHook(() =>
      useChecklist({ sessionState, targetDate: "2026-11-14" }),
    );

    act(() => {
      result.current.handleSelectOption("uninitialized_multi", "New Item", true);
    });

    expect(result.current.responses.uninitialized_multi).toEqual(["New Item"]);
  });

  it("should save option permanently to a custom saved question", async () => {
    const { result } = renderHook(() =>
      useChecklist({ sessionState, targetDate: "2026-11-14" }),
    );

    await act(async () => {
      await result.current.handleSaveOptionPermanently("saved_q", "Maybe");
    });

    expect(mockSaveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        custom_saved_questions: expect.arrayContaining([
          expect.objectContaining({
            id: "saved_q",
            options: ["Yes", "No", "Maybe"],
          }),
        ]),
      }),
    );
  });

  it("should do nothing when handleSaveOptionPermanently is called without config", async () => {
    vi.mocked(useDriveSync).mockReturnValue({
      config: null,
      summaryIndex: [],
      logsFolderId: null,
      appFolderId: null,
      driveService: {} as never,
      isBootSyncing: false,
      syncError: null,
      saveConfig: mockSaveConfig,
      saveSummaryIndex: mockSaveSummaryIndex,
      retryBootSync: vi.fn(),
    });

    const { result } = renderHook(() => useChecklist());

    await act(async () => {
      await result.current.handleSaveOptionPermanently("energy", "Super");
    });

    expect(mockSaveConfig).not.toHaveBeenCalled();
  });
});
