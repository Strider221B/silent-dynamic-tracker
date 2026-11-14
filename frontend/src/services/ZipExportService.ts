import JSZip from "jszip";
import {
  BATCH_DOWNLOAD_CONCURRENCY,
  ZIP_FILE_EXTENSION,
  ZIP_FILENAME_PREFIX,
  ZIP_MIME_TYPE,
} from "@/constants/exportConstants";
import type { DriveService } from "@/services/DriveService";

/**
 * Service orchestrating batch downloading of daily logs from Google Drive and client-side ZIP archive packaging.
 */
export class ZipExportService {
  private static readonly _MIME_TYPE = ZIP_MIME_TYPE;
  private static readonly _FILE_PREFIX = ZIP_FILENAME_PREFIX;
  private static readonly _EXTENSION = ZIP_FILE_EXTENSION;
  private static readonly _CONCURRENCY = BATCH_DOWNLOAD_CONCURRENCY;
  private static readonly _MAX_PERCENT = 100;
  private static readonly _EMPTY_FALLBACK_CONTENT = "{}";

  private readonly _driveService: DriveService;

  /**
   * Initializes ZipExportService with DriveService dependency.
   */
  constructor(driveService: DriveService) {
    this._driveService = driveService;
  }

  /**
   * Fetches daily logs in concurrent batches and compiles them into a ZIP archive Blob.
   */
  public async generateZip(
    logsFolderId: string,
    onProgress?: (percent: number) => void,
  ): Promise<Blob> {
    const files = await this._driveService.listAllLogFiles(logsFolderId);
    const totalFiles = files.length;

    if (totalFiles === 0) {
      if (onProgress) {
        onProgress(ZipExportService._MAX_PERCENT);
      }
      const emptyZip = new JSZip();
      return emptyZip.generateAsync({
        type: "blob",
        mimeType: ZipExportService._MIME_TYPE,
      });
    }

    const zip = new JSZip();
    let processedCount = 0;

    for (let i = 0; i < totalFiles; i += ZipExportService._CONCURRENCY) {
      const slice = files.slice(i, i + ZipExportService._CONCURRENCY);
      const batchResults = await this._fetchBatch(slice);

      for (const item of batchResults) {
        zip.file(item.name, item.content);
      }

      processedCount += slice.length;
      if (onProgress) {
        const percent = Math.min(
          ZipExportService._MAX_PERCENT,
          Math.round((processedCount / totalFiles) * ZipExportService._MAX_PERCENT),
        );
        onProgress(percent);
      }
    }

    return zip.generateAsync({
      type: "blob",
      mimeType: ZipExportService._MIME_TYPE,
    });
  }

  /**
   * Compiles daily logs into a ZIP file and triggers a browser download.
   */
  public async downloadZip(
    logsFolderId: string,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    const blob = await this.generateZip(logsFolderId, onProgress);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `${ZipExportService._FILE_PREFIX}${dateStamp}${ZipExportService._EXTENSION}`;
    this._triggerDownload(blob, fileName);
  }

  private async _fetchBatch(
    fileBatch: Array<{ id: string; name: string }>,
  ): Promise<Array<{ name: string; content: string }>> {
    const fetchPromises = fileBatch.map(async (file) => {
      const content = await this._driveService.readFileContent(file.id);
      return {
        name: file.name,
        content: content ?? ZipExportService._EMPTY_FALLBACK_CONTENT,
      };
    });

    return Promise.all(fetchPromises);
  }

  private _triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
