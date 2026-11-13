import {
  APP_FOLDER_NAME,
  DRIVE_API_BASE,
  DRIVE_UPLOAD_BASE,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNAUTHORIZED,
  LOGS_DIR_NAME,
  MIME_TYPE_FOLDER,
  MIME_TYPE_JSON,
} from "@/constants/driveConstants";
import { DriveApiError } from "@/errors/DriveApiError";
import type { GoogleAuthService } from "@/services/GoogleAuthService";
import type { IDailyPayload } from "@/types/dailyPayload";

interface IDriveFileListResponse {
  files?: Array<{ id: string; name: string; mimeType?: string }>;
}

interface IDriveFileResponse {
  id: string;
}

/**
 * Service encapsulating Google Drive REST API v3 operations.
 */
export class DriveService {
  private static readonly _FIELDS_QUERY = "files(id, name, mimeType, parents)";
  private static readonly _MULTIPART_BOUNDARY = "sdt_boundary_v3";
  private static readonly _PAGE_SIZE_MAX = 1000;
  private static readonly _JSON_INDENT = 2;

  private readonly _authService: GoogleAuthService;

  /**
   * Initializes DriveService with dependency-injected GoogleAuthService.
   */
  constructor(authService: GoogleAuthService) {
    this._authService = authService;
  }

  /**
   * Locates or creates the root SilentDynamicTracker app folder.
   */
  public async ensureAppFolder(): Promise<string> {
    const query = `name = '${APP_FOLDER_NAME}' and mimeType = '${MIME_TYPE_FOLDER}' and trashed = false`;
    const existing = await this._querySingleFile(query);
    if (existing) {
      return existing;
    }
    return this._createFolder(APP_FOLDER_NAME);
  }

  /**
   * Locates or creates the logs child folder inside the app folder.
   */
  public async ensureLogsFolder(parentFolderId: string): Promise<string> {
    const query = `'${parentFolderId}' in parents and name = '${LOGS_DIR_NAME}' and mimeType = '${MIME_TYPE_FOLDER}' and trashed = false`;
    const existing = await this._querySingleFile(query);
    if (existing) {
      return existing;
    }
    return this._createFolder(LOGS_DIR_NAME, parentFolderId);
  }

  /**
   * Reads and parses a JSON file from Google Drive, returning null if not found.
   */
  public async readJsonFile<T>(
    fileName: string,
    parentFolderId: string,
  ): Promise<T | null> {
    const fileId = await this._findFileByName(fileName, parentFolderId);
    if (!fileId) {
      return null;
    }

    const endpoint = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: this._buildHeaders(),
    });

    if (response.status === HTTP_STATUS_NOT_FOUND) {
      return null;
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(errorText, response.status, endpoint);
    }
    return (await response.json()) as T;
  }

  /**
   * Writes a JSON file to Google Drive, updating if it exists or creating anew.
   */
  public async writeJsonFile<T>(
    fileName: string,
    parentFolderId: string,
    data: T,
    existingFileId?: string,
  ): Promise<string> {
    const jsonContent = JSON.stringify(data, null, DriveService._JSON_INDENT);
    const targetFileId =
      existingFileId ?? (await this._findFileByName(fileName, parentFolderId));

    if (targetFileId) {
      return this._updateFileContent(targetFileId, jsonContent);
    }
    return this._createFile(
      fileName,
      parentFolderId,
      MIME_TYPE_JSON,
      jsonContent,
    );
  }

  /**
   * Reads a daily log payload by date from the logs folder.
   */
  public async readDailyPayload(
    date: string,
    logsFolderId: string,
  ): Promise<IDailyPayload | null> {
    const fileName = `${date}.json`;
    return this.readJsonFile<IDailyPayload>(fileName, logsFolderId);
  }

  /**
   * Writes a daily log payload by date into the logs folder.
   */
  public async writeDailyPayload(
    date: string,
    logsFolderId: string,
    payload: IDailyPayload,
  ): Promise<string> {
    const fileName = `${date}.json`;
    return this.writeJsonFile<IDailyPayload>(fileName, logsFolderId, payload);
  }

  /**
   * Lists all daily log files residing inside the logs folder.
   */
  public async listAllLogFiles(
    logsFolderId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    const query = `'${logsFolderId}' in parents and trashed = false`;
    const endpoint = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=${DriveService._PAGE_SIZE_MAX}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: this._buildHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(errorText, response.status, endpoint);
    }
    const data = (await response.json()) as IDriveFileListResponse;
    return (data.files || []).map((file) => ({ id: file.id, name: file.name }));
  }

  private _buildHeaders(contentType?: string): HeadersInit {
    const token = this._authService.getAccessToken();
    if (!token) {
      throw new DriveApiError(
        "Unauthenticated: No active access token",
        HTTP_STATUS_UNAUTHORIZED,
      );
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    return headers;
  }

  private async _querySingleFile(query: string): Promise<string | null> {
    const endpoint = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(DriveService._FIELDS_QUERY)}&spaces=drive`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: this._buildHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(errorText, response.status, endpoint);
    }
    const data = (await response.json()) as IDriveFileListResponse;
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  }

  private async _findFileByName(
    fileName: string,
    parentFolderId: string,
  ): Promise<string | null> {
    const query = `'${parentFolderId}' in parents and name = '${fileName}' and trashed = false`;
    return this._querySingleFile(query);
  }

  private async _createFolder(
    name: string,
    parentFolderId?: string,
  ): Promise<string> {
    const endpoint = `${DRIVE_API_BASE}/files`;
    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name,
      mimeType: MIME_TYPE_FOLDER,
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this._buildHeaders(MIME_TYPE_JSON),
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(errorText, response.status, endpoint);
    }
    const result = (await response.json()) as IDriveFileResponse;
    return result.id;
  }

  private async _createFile(
    fileName: string,
    parentFolderId: string,
    mimeType: string,
    content: string = "",
  ): Promise<string> {
    const endpoint = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
    const boundary = DriveService._MULTIPART_BOUNDARY;
    const metadata = JSON.stringify({
      name: fileName,
      parents: [parentFolderId],
      mimeType,
    });
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n--${boundary}--`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this._buildHeaders(`multipart/related; boundary=${boundary}`),
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(errorText, response.status, endpoint);
    }
    const result = (await response.json()) as IDriveFileResponse;
    return result.id;
  }

  private async _updateFileContent(
    fileId: string,
    content: string,
  ): Promise<string> {
    const endpoint = `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`;
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: this._buildHeaders(MIME_TYPE_JSON),
      body: content,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DriveApiError(errorText, response.status, endpoint);
    }
    const result = (await response.json()) as IDriveFileResponse;
    return result.id;
  }
}
