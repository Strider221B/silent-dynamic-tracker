import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChecklistDashboard from "@/components/checklist/ChecklistDashboard";
import { useChecklist } from "@/hooks/useChecklist";
import { useDriveSync } from "@/hooks/useDriveSync";
import type { IAppConfig } from "@/types/config";

vi.mock("@/hooks/useDriveSync");
vi.mock("@/hooks/useChecklist");

const mockConfig: IAppConfig = {
  version: "1.0",
  standard_questions: [
    {
      id: "focus",
      question: "How was your focus?",
      type: "select_one",
      options: ["Distracted", "Focused"],
      default: "Focused",
    },
  ],
  custom_saved_questions: [
    {
      id: "creativity",
      question: "Creative output?",
      type: "select_one",
      options: ["Low", "High"],
      default: "High",
    },
  ],
};

describe("ChecklistDashboard", () => {
  let mockHandleSelectOption: ReturnType<typeof vi.fn>;
  let mockHandleQuickAdd: ReturnType<typeof vi.fn>;
  let mockHandleSaveOptionPermanently: ReturnType<typeof vi.fn>;
  let mockHandleSaveLog: ReturnType<typeof vi.fn>;
  let mockSetLocation: ReturnType<typeof vi.fn>;
  let mockSetNotes: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandleSelectOption = vi.fn();
    mockHandleQuickAdd = vi.fn();
    mockHandleSaveOptionPermanently = vi.fn();
    mockHandleSaveLog = vi.fn();
    mockSetLocation = vi.fn();
    mockSetNotes = vi.fn();

    vi.mocked(useDriveSync).mockReturnValue({
      config: mockConfig,
      summaryIndex: [],
      logsFolderId: "logs-id",
      appFolderId: "app-id",
      driveService: {} as never,
      isBootSyncing: false,
      syncError: null,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });

    vi.mocked(useChecklist).mockReturnValue({
      responses: { focus: "Focused", creativity: "High" },
      temporaryOptions: {},
      location: "Paris",
      notes: "Reflection text",
      isSaving: false,
      saveError: null,
      saveSuccess: false,
      handleSelectOption: mockHandleSelectOption,
      handleQuickAdd: mockHandleQuickAdd,
      handleSaveOptionPermanently: mockHandleSaveOptionPermanently,
      handleSaveLog: mockHandleSaveLog,
      setLocation: mockSetLocation,
      setNotes: mockSetNotes,
    });
  });

  it("should render header, question blocks, inputs, and save button", () => {
    render(<ChecklistDashboard />);

    expect(
      screen.getByRole("heading", { name: "Daily Tracker" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/logging for:/i)).toBeInTheDocument();

    expect(screen.getByText("How was your focus?")).toBeInTheDocument();
    expect(screen.getByText("Creative output?")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Save Log" }),
    ).toBeInTheDocument();
  });

  it("should open date selection modal when Change Date is tapped", () => {
    render(<ChecklistDashboard />);

    const changeDateBtn = screen.getByRole("button", { name: "Change Date" });
    fireEvent.click(changeDateBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should handle confirming yesterday, today, and overriding date from the date modal", () => {
    const { unmount } = render(<ChecklistDashboard />);

    // Test confirming yesterday
    fireEvent.click(screen.getByRole("button", { name: "Change Date" }));
    const yesterdayBtn = screen.getByRole("button", { name: /yesterday/i });
    fireEvent.click(yesterdayBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Test confirming today
    fireEvent.click(screen.getByRole("button", { name: "Change Date" }));
    const todayBtn = screen.getByRole("button", { name: /today/i });
    fireEvent.click(todayBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Test overriding date
    fireEvent.click(screen.getByRole("button", { name: "Change Date" }));
    const dateInput = screen.getByLabelText(/or pick specific date:/i);
    fireEvent.change(dateInput, { target: { value: "2026-10-31" } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Logging for: 2026-10-31")).toBeInTheDocument();

    unmount();
  });

  it("should display success banner when saveSuccess is true", () => {
    vi.mocked(useChecklist).mockReturnValue({
      responses: {},
      temporaryOptions: {},
      location: "",
      notes: "",
      isSaving: false,
      saveError: null,
      saveSuccess: true,
      handleSelectOption: mockHandleSelectOption,
      handleQuickAdd: mockHandleQuickAdd,
      handleSaveOptionPermanently: mockHandleSaveOptionPermanently,
      handleSaveLog: mockHandleSaveLog,
      setLocation: mockSetLocation,
      setNotes: mockSetNotes,
    });

    render(<ChecklistDashboard />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Log saved successfully.",
    );
  });

  it("should display error banner when saveError is set", () => {
    vi.mocked(useChecklist).mockReturnValue({
      responses: {},
      temporaryOptions: {},
      location: "",
      notes: "",
      isSaving: false,
      saveError: "Network failure while saving",
      saveSuccess: false,
      handleSelectOption: mockHandleSelectOption,
      handleQuickAdd: mockHandleQuickAdd,
      handleSaveOptionPermanently: mockHandleSaveOptionPermanently,
      handleSaveLog: mockHandleSaveLog,
      setLocation: mockSetLocation,
      setNotes: mockSetNotes,
    });

    render(<ChecklistDashboard />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Network failure while saving",
    );
  });

  it("should handle null config gracefully without crashing", () => {
    vi.mocked(useDriveSync).mockReturnValue({
      config: null,
      summaryIndex: [],
      logsFolderId: null,
      appFolderId: null,
      driveService: {} as never,
      isBootSyncing: false,
      syncError: null,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });

    render(<ChecklistDashboard />);
    expect(
      screen.getByRole("heading", { name: "Daily Tracker" }),
    ).toBeInTheDocument();
  });
});
