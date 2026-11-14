import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExportModal from "@/components/export/ExportModal";
import * as useDriveSyncModule from "@/hooks/useDriveSync";
import * as useToastModule from "@/hooks/useToast";
import type { CsvExportService } from "@/services/CsvExportService";
import type { DriveService } from "@/services/DriveService";
import type { ZipExportService } from "@/services/ZipExportService";

describe("ExportModal", () => {
  let mockShowToast: ReturnType<typeof vi.fn>;
  let mockCsvService: CsvExportService;
  let mockZipService: ZipExportService;

  beforeEach(() => {
    mockShowToast = vi.fn();
    vi.spyOn(useToastModule, "useToast").mockReturnValue({
      toasts: [],
      showToast: mockShowToast,
      dismissToast: vi.fn(),
    });

    vi.spyOn(useDriveSyncModule, "useDriveSync").mockReturnValue({
      appFolderId: "app-folder-id",
      logsFolderId: "logs-folder-id",
      config: null,
      summaryIndex: [{ date: "2026-11-14", location: "Mumbai", weather_summary: null, aqi_summary: null, custom_entries_exist: false, mcq_responses: {} }],
      isBootSyncing: false,
      syncError: null,
      driveService: {} as DriveService,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });

    mockCsvService = {
      generateCsv: vi.fn(),
      downloadCsv: vi.fn(),
    } as unknown as CsvExportService;

    mockZipService = {
      generateZip: vi.fn(),
      downloadZip: vi.fn(),
    } as unknown as ZipExportService;
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <ExportModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render modal with CSV and ZIP export buttons and trigger onClose", () => {
    const onCloseMock = vi.fn();
    render(<ExportModal isOpen={true} onClose={onCloseMock} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export Summary Spreadsheet (.csv)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export Daily Logs (.zip)" }),
    ).toBeInTheDocument();

    const closeButton = screen.getByRole("button", {
      name: "Close export dialog",
    });
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("should trigger CsvExportService and display success toast on CSV export click", () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        csvExportService={mockCsvService}
      />,
    );

    const csvButton = screen.getByRole("button", {
      name: "Export Summary Spreadsheet (.csv)",
    });
    fireEvent.click(csvButton);

    expect(mockCsvService.downloadCsv).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(
      "Summary CSV downloaded successfully",
      "success",
    );
  });

  it("should trigger ZipExportService with progress and display success toast", async () => {
    vi.mocked(mockZipService.downloadZip).mockImplementation(
      async (_folderId, onProgress) => {
        if (onProgress) {
          onProgress(50);
          onProgress(100);
        }
      },
    );

    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        zipExportService={mockZipService}
      />,
    );

    const zipButton = screen.getByRole("button", {
      name: "Export Daily Logs (.zip)",
    });
    fireEvent.click(zipButton);

    await waitFor(() => {
      expect(mockZipService.downloadZip).toHaveBeenCalledWith(
        "logs-folder-id",
        expect.any(Function),
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      "Daily logs ZIP downloaded successfully",
      "success",
    );
  });

  it("should display error if logsFolderId is missing when ZIP export is triggered", async () => {
    vi.spyOn(useDriveSyncModule, "useDriveSync").mockReturnValue({
      appFolderId: "app-folder-id",
      logsFolderId: null,
      config: null,
      summaryIndex: null,
      isBootSyncing: false,
      syncError: null,
      driveService: {} as DriveService,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });

    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        zipExportService={mockZipService}
      />,
    );

    const zipButton = screen.getByRole("button", {
      name: "Export Daily Logs (.zip)",
    });
    fireEvent.click(zipButton);

    expect(
      screen.getByText("Google Drive folder not initialized"),
    ).toBeInTheDocument();
    expect(mockZipService.downloadZip).not.toHaveBeenCalled();
  });

  it("should handle error thrown during CSV download", () => {
    vi.mocked(mockCsvService.downloadCsv).mockImplementation(() => {
      throw new Error("Disk write failed");
    });

    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        csvExportService={mockCsvService}
      />,
    );

    const csvButton = screen.getByRole("button", {
      name: "Export Summary Spreadsheet (.csv)",
    });
    fireEvent.click(csvButton);

    expect(screen.getByText("Disk write failed")).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith("Disk write failed", "error");
  });

  it("should handle error thrown during ZIP download", async () => {
    vi.mocked(mockZipService.downloadZip).mockRejectedValue(
      new Error("Network failed during zip"),
    );

    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        zipExportService={mockZipService}
      />,
    );

    const zipButton = screen.getByRole("button", {
      name: "Export Daily Logs (.zip)",
    });
    fireEvent.click(zipButton);

    await waitFor(() => {
      expect(
        screen.getByText("Network failed during zip"),
      ).toBeInTheDocument();
    });
    expect(mockShowToast).toHaveBeenCalledWith(
      "Network failed during zip",
      "error",
    );
  });
});
