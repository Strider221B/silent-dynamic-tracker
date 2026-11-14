import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChecklistDashboard from "@/components/checklist/ChecklistDashboard";
import {
  CONFIRM_TODAY_TEXT,
  CONFIRM_YESTERDAY_TEXT,
  MIDNIGHT_MODAL_TITLE,
} from "@/constants/checklistConstants";
import { useDriveSync } from "@/hooks/useDriveSync";
import type { IAppConfig } from "@/types/config";

vi.mock("@/hooks/useDriveSync");

const MOCK_CONFIG: IAppConfig = {
  version: "1.0",
  standard_questions: [
    {
      id: "mood",
      question: "How is your mood?",
      type: "select_one",
      options: ["Great", "Good", "Low"],
      default: "Good",
    },
  ],
  custom_saved_questions: [],
};

const SIMULATED_LATE_NIGHT = new Date(2026, 10, 14, 2, 0, 0);
const SIMULATED_DAYTIME = new Date(2026, 10, 14, 14, 0, 0);
const EXPECTED_YESTERDAY = "2026-11-13" as const;
const EXPECTED_TODAY = "2026-11-14" as const;
const CUSTOM_DATE = "2026-11-10" as const;
const CHANGE_DATE_TEXT = "Change Date" as const;

describe("E2E Integration: Midnight Rollover Modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDriveSync).mockReturnValue({
      appFolderId: "app-id",
      logsFolderId: "logs-id",
      config: MOCK_CONFIG,
      summaryIndex: [],
      isBootSyncing: false,
      syncError: null,
      driveService: {} as never,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });
  });

  it("should trigger rollover modal at 02:00 AM and confirm yesterday", () => {
    vi.setSystemTime(SIMULATED_LATE_NIGHT);
    render(<ChecklistDashboard />);

    expect(screen.getByText(MIDNIGHT_MODAL_TITLE)).toBeInTheDocument();
    const yesterdayBtn = screen.getByRole("button", {
      name: new RegExp(CONFIRM_YESTERDAY_TEXT, "i"),
    });
    fireEvent.click(yesterdayBtn);

    expect(screen.queryByText(MIDNIGHT_MODAL_TITLE)).toBeNull();
    expect(screen.getByText(`Logging for: ${EXPECTED_YESTERDAY}`)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("should allow confirming today at 02:00 AM", () => {
    vi.setSystemTime(SIMULATED_LATE_NIGHT);
    render(<ChecklistDashboard />);

    const todayBtn = screen.getByRole("button", {
      name: new RegExp(CONFIRM_TODAY_TEXT, "i"),
    });
    fireEvent.click(todayBtn);

    expect(screen.queryByText(MIDNIGHT_MODAL_TITLE)).toBeNull();
    expect(screen.getByText(`Logging for: ${EXPECTED_TODAY}`)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("should allow manual date change during daytime via Change Date button", () => {
    vi.setSystemTime(SIMULATED_DAYTIME);
    render(<ChecklistDashboard />);

    expect(screen.queryByText(MIDNIGHT_MODAL_TITLE)).toBeNull();
    expect(screen.getByText(`Logging for: ${EXPECTED_TODAY}`)).toBeInTheDocument();

    const changeDateBtn = screen.getByRole("button", { name: CHANGE_DATE_TEXT });
    fireEvent.click(changeDateBtn);

    expect(screen.getByText(MIDNIGHT_MODAL_TITLE)).toBeInTheDocument();
    const dateInput = screen.getByLabelText(/or pick specific date/i);
    fireEvent.change(dateInput, { target: { value: CUSTOM_DATE } });

    expect(screen.queryByText(MIDNIGHT_MODAL_TITLE)).toBeNull();
    expect(screen.getByText(`Logging for: ${CUSTOM_DATE}`)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
