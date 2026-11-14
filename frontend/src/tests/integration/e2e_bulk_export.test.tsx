import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExportModal from "@/components/export/ExportModal";
import ToastContainer from "@/components/common/ToastContainer";
import {
  CSV_FILENAME_PREFIX,
  ZIP_FILENAME_PREFIX,
} from "@/constants/exportConstants";
import ToastProvider from "@/context/ToastContext";
import { useDriveSync } from "@/hooks/useDriveSync";
import { CsvExportService } from "@/services/CsvExportService";
import { DriveService } from "@/services/DriveService";
import { ZipExportService } from "@/services/ZipExportService";
import type { ISummaryIndex } from "@/types/summaryIndex";

vi.mock("@/hooks/useDriveSync");

const LOGS_FOLDER_ID = "logs-folder-123" as const;
const BTN_CSV = "Export Summary Spreadsheet (.csv)" as const;
const BTN_ZIP = "Export Daily Logs (.zip)" as const;
const TOAST_CSV = "Summary CSV downloaded successfully" as const;
const TOAST_ZIP = "Daily logs ZIP downloaded successfully" as const;

const MOCK_INDEX: ISummaryIndex = [
  {
    date: "2026-11-10",
    location: "Mumbai, India",
    weather_summary: "26C, Clear",
    aqi_summary: "Good",
    mcq_responses: { mood: "Great", energy_level: "High" },
    custom_entries_exist: false,
  },
  {
    date: "2026-11-09",
    location: "Mumbai, India",
    weather_summary: "27C, Sunny",
    aqi_summary: "Moderate",
    mcq_responses: { mood: "Good", energy_level: "Medium" },
    custom_entries_exist: true,
  },
];

describe("E2E Integration: Bulk Data Portability", () => {
  let mockDriveService: DriveService;
  let csvService: CsvExportService;
  let zipService: ZipExportService;
  let downloadedFileName: string | null = null;
  let downloadedBlob: Blob | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    downloadedFileName = null;
    downloadedBlob = null;

    mockDriveService = {
      listAllLogFiles: vi.fn().mockResolvedValue([
        { id: "file-1", name: "2026-11-09.json" },
        { id: "file-2", name: "2026-11-10.json" },
      ]),
      readFileContent: vi.fn().mockImplementation(async (fileId: string) => {
        return JSON.stringify({
          date: fileId === "file-1" ? "2026-11-09" : "2026-11-10",
          location: "Mumbai, India",
        });
      }),
    } as unknown as DriveService;

    csvService = new CsvExportService();
    zipService = new ZipExportService(mockDriveService);

    vi.spyOn(csvService as never, "_triggerDownload").mockImplementation(
      (_content: unknown, filename: unknown) => {
        downloadedFileName = String(filename);
      },
    );

    vi.spyOn(zipService as never, "_triggerDownload").mockImplementation(
      (blob: unknown, filename: unknown) => {
        downloadedBlob = blob as Blob;
        downloadedFileName = String(filename);
      },
    );

    vi.mocked(useDriveSync).mockReturnValue({
      appFolderId: "app-id",
      logsFolderId: LOGS_FOLDER_ID,
      config: null,
      summaryIndex: MOCK_INDEX,
      isBootSyncing: false,
      syncError: null,
      driveService: mockDriveService,
      saveConfig: vi.fn(),
      saveSummaryIndex: vi.fn(),
      retryBootSync: vi.fn(),
    });
  });

  it("should export RFC-4180 CSV and zipped JSON archive client-side", async () => {
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <ExportModal
          isOpen={true}
          onClose={handleClose}
          csvExportService={csvService}
          zipExportService={zipService}
        />
        <ToastContainer />
      </ToastProvider>,
    );

    expect(screen.getByText("Export Data")).toBeInTheDocument();

    const csvButton = screen.getByRole("button", { name: BTN_CSV });
    fireEvent.click(csvButton);

    expect(await screen.findByText(TOAST_CSV)).toBeInTheDocument();
    expect(downloadedFileName).toContain(CSV_FILENAME_PREFIX);
    expect(downloadedFileName?.endsWith(".csv")).toBe(true);

    const zipButton = screen.getByRole("button", { name: BTN_ZIP });
    fireEvent.click(zipButton);

    expect(await screen.findByText(TOAST_ZIP)).toBeInTheDocument();
    expect(mockDriveService.listAllLogFiles).toHaveBeenCalledWith(
      LOGS_FOLDER_ID,
    );
    expect(mockDriveService.readFileContent).toHaveBeenCalledTimes(2);
    expect(downloadedFileName).toContain(ZIP_FILENAME_PREFIX);
    expect(downloadedFileName?.endsWith(".zip")).toBe(true);
    expect(downloadedBlob).toBeInstanceOf(Blob);
  });
});
