import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DriveService } from "@/services/DriveService";
import { ZipExportService } from "@/services/ZipExportService";

describe("ZipExportService", () => {
  let mockDriveService: DriveService;
  let service: ZipExportService;

  beforeEach(() => {
    mockDriveService = {
      listAllLogFiles: vi.fn(),
      readFileContent: vi.fn(),
    } as unknown as DriveService;

    service = new ZipExportService(mockDriveService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle empty log folder by reporting 100% progress and returning zip Blob", async () => {
    vi.mocked(mockDriveService.listAllLogFiles).mockResolvedValue([]);
    const progressSpy = vi.fn();

    const blob = await service.generateZip("logs-folder-id", progressSpy);

    expect(blob).toBeInstanceOf(Blob);
    expect(progressSpy).toHaveBeenCalledWith(100);
    expect(mockDriveService.readFileContent).not.toHaveBeenCalled();
  });

  it("should batch file downloads 5 at a time and report progress increments", async () => {
    const mockFiles = [
      { id: "id-1", name: "2026-11-01.json" },
      { id: "id-2", name: "2026-11-02.json" },
      { id: "id-3", name: "2026-11-03.json" },
      { id: "id-4", name: "2026-11-04.json" },
      { id: "id-5", name: "2026-11-05.json" },
      { id: "id-6", name: "2026-11-06.json" },
      { id: "id-7", name: "2026-11-07.json" },
    ];

    vi.mocked(mockDriveService.listAllLogFiles).mockResolvedValue(mockFiles);
    vi.mocked(mockDriveService.readFileContent).mockImplementation(
      async (fileId: string) => JSON.stringify({ fileId, logged: true }),
    );

    const progressUpdates: number[] = [];
    const blob = await service.generateZip("logs-folder-id", (p) => {
      progressUpdates.push(p);
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(mockDriveService.readFileContent).toHaveBeenCalledTimes(7);
    expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });

  it("should fallback to empty JSON string if readFileContent returns null", async () => {
    const mockFiles = [{ id: "missing-id", name: "2026-11-08.json" }];
    vi.mocked(mockDriveService.listAllLogFiles).mockResolvedValue(mockFiles);
    vi.mocked(mockDriveService.readFileContent).mockResolvedValue(null);

    const blob = await service.generateZip("logs-folder-id");
    expect(blob).toBeInstanceOf(Blob);
    expect(mockDriveService.readFileContent).toHaveBeenCalledWith("missing-id");
  });

  it("should trigger download when downloadZip is called", async () => {
    vi.mocked(mockDriveService.listAllLogFiles).mockResolvedValue([
      { id: "f1", name: "2026-11-01.json" },
    ]);
    vi.mocked(mockDriveService.readFileContent).mockResolvedValue('{"test":1}');

    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-zip-url");
    const revokeObjectURLMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    const realAnchor = document.createElement("a");
    const clickMock = vi.fn();
    realAnchor.click = clickMock;

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return realAnchor;
      }
      return document.createElement(tagName);
    });

    await service.downloadZip("logs-folder-id");

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-zip-url");
  });
});
