import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DriveApiError } from "@/errors/DriveApiError";
import { DriveService } from "@/services/DriveService";
import type { GoogleAuthService } from "@/services/GoogleAuthService";
import type { IDailyPayload } from "@/types/dailyPayload";

describe("DriveService", () => {
  let mockAuthService: GoogleAuthService;
  let service: DriveService;

  beforeEach(() => {
    mockAuthService = {
      getAccessToken: vi.fn().mockReturnValue("mock-bearer-token"),
      isAuthenticated: vi.fn().mockReturnValue(true),
    } as unknown as GoogleAuthService;

    service = new DriveService(mockAuthService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw DriveApiError 401 if access token is missing", async () => {
    vi.mocked(mockAuthService.getAccessToken).mockReturnValue(null);

    await expect(service.ensureAppFolder()).rejects.toThrow(DriveApiError);
    await expect(service.ensureAppFolder()).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  describe("ensureAppFolder", () => {
    it("should return existing folder ID if folder is found", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            files: [{ id: "existing-app-folder-id", name: "SilentDynamicTracker" }],
          }),
          { status: 200 },
        ),
      );

      const folderId = await service.ensureAppFolder();
      expect(folderId).toBe("existing-app-folder-id");
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw DriveApiError if searching for file fails", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response("Search query error", { status: 500 }),
      );

      await expect(service.ensureAppFolder()).rejects.toThrow(DriveApiError);
    });

    it("should create folder if not found and return new ID", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ files: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "new-created-folder-id" }), {
            status: 200,
          }),
        );

      const folderId = await service.ensureAppFolder();
      expect(folderId).toBe("new-created-folder-id");
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("ensureLogsFolder", () => {
    it("should return existing logs folder ID if found in parent", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            files: [{ id: "existing-logs-id", name: "logs" }],
          }),
          { status: 200 },
        ),
      );

      const logsId = await service.ensureLogsFolder("parent-folder-id");
      expect(logsId).toBe("existing-logs-id");
    });

    it("should create logs folder inside parent if not found", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ files: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "new-logs-folder-id" }), {
            status: 200,
          }),
        );

      const logsId = await service.ensureLogsFolder("parent-folder-id");
      expect(logsId).toBe("new-logs-folder-id");
    });
  });

  describe("readJsonFile", () => {
    it("should return null if file is not found during search", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ files: [] }), { status: 200 }),
      );

      const result = await service.readJsonFile("missing.json", "parent-id");
      expect(result).toBeNull();
    });

    it("should return null if file read returns 404", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ files: [{ id: "f-123", name: "config.json" }] }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response("Not Found", { status: 404 }),
        );

      const result = await service.readJsonFile("config.json", "parent-id");
      expect(result).toBeNull();
    });

    it("should return parsed JSON content when found and read successfully", async () => {
      const mockData = { version: "1.0", enabled: true };
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ files: [{ id: "f-123", name: "config.json" }] }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockData), { status: 200 }),
        );

      const result = await service.readJsonFile<typeof mockData>(
        "config.json",
        "parent-id",
      );
      expect(result).toEqual(mockData);
    });

    it("should throw DriveApiError if download returns non-404 error", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ files: [{ id: "f-123", name: "config.json" }] }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response("Internal Server Error", { status: 500 }),
        );

      await expect(
        service.readJsonFile("config.json", "parent-id"),
      ).rejects.toThrow(DriveApiError);
    });
  });

  describe("writeJsonFile", () => {
    it("should update existing file when existingFileId is provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "explicit-file-id" }), { status: 200 }),
      );

      const fileId = await service.writeJsonFile(
        "config.json",
        "parent-id",
        { test: 1 },
        "explicit-file-id",
      );

      expect(fileId).toBe("explicit-file-id");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/files/explicit-file-id?uploadType=media"),
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    it("should update file when discovered via search", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ files: [{ id: "searched-file-id", name: "config.json" }] }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "searched-file-id" }), { status: 200 }),
        );

      const fileId = await service.writeJsonFile("config.json", "parent-id", { test: 1 });
      expect(fileId).toBe("searched-file-id");
    });

    it("should create file via multipart upload when file does not exist", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ files: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "newly-created-file-id" }), { status: 200 }),
        );

      const fileId = await service.writeJsonFile("new-file.json", "parent-id", { hello: "world" });
      expect(fileId).toBe("newly-created-file-id");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("uploadType=multipart"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should throw DriveApiError if creating folder fails", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ files: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response("Folder creation error", { status: 500 }),
        );

      await expect(service.ensureAppFolder()).rejects.toThrow(DriveApiError);
    });

    it("should throw DriveApiError if updating file content returns an error", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response("Failed to patch", { status: 500 }),
      );

      await expect(
        service.writeJsonFile("config.json", "parent-id", { test: 1 }, "existing-id"),
      ).rejects.toThrow(DriveApiError);
    });

    it("should throw DriveApiError if creating file returns an error", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ files: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response("Failed to upload multipart", { status: 500 }),
        );

      await expect(
        service.writeJsonFile("new.json", "parent-id", { test: 1 }),
      ).rejects.toThrow(DriveApiError);
    });
  });

  describe("dailyPayload operations", () => {
    it("should read daily payload by date", async () => {
      const mockPayload: IDailyPayload = {
        date: "2026-11-12",
        location: "Mumbai",
        environmental_data: null,
        standard_responses: {},
        custom_additions: { custom_questions: [] },
        free_form_notes: "Quiet day",
      };

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ files: [{ id: "payload-12", name: "2026-11-12.json" }] }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockPayload), { status: 200 }),
        );

      const payload = await service.readDailyPayload("2026-11-12", "logs-folder-id");
      expect(payload).toEqual(mockPayload);
    });

    it("should write daily payload by date", async () => {
      const mockPayload: IDailyPayload = {
        date: "2026-11-12",
        location: "Mumbai",
        environmental_data: null,
        standard_responses: {},
        custom_additions: { custom_questions: [] },
        free_form_notes: "Night update",
      };

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ files: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "created-payload-id" }), { status: 200 }),
        );

      const fileId = await service.writeDailyPayload("2026-11-12", "logs-folder-id", mockPayload);
      expect(fileId).toBe("created-payload-id");
    });
  });

  describe("listAllLogFiles", () => {
    it("should list all files in the logs folder", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            files: [
              { id: "id-1", name: "2026-11-01.json" },
              { id: "id-2", name: "2026-11-02.json" },
            ],
          }),
          { status: 200 },
        ),
      );

      const files = await service.listAllLogFiles("logs-folder-id");
      expect(files).toHaveLength(2);
      expect(files[0].name).toBe("2026-11-01.json");
      expect(files[1].name).toBe("2026-11-02.json");
    });

    it("should handle empty or null files list", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      const files = await service.listAllLogFiles("logs-folder-id");
      expect(files).toEqual([]);
    });

    it("should throw DriveApiError on list error response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response("Forbidden", { status: 403 }),
      );

      await expect(service.listAllLogFiles("logs-folder-id")).rejects.toThrow(
        DriveApiError,
      );
    });
  });
});
