import { useCallback, useMemo, useState } from "react";
import ExportProgressBar from "@/components/export/ExportProgressBar";
import { useDriveSync } from "@/hooks/useDriveSync";
import { useToast } from "@/hooks/useToast";
import { CsvExportService } from "@/services/CsvExportService";
import { ZipExportService } from "@/services/ZipExportService";
import styles from "./ExportModal.module.css";

export interface IExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvExportService?: CsvExportService;
  zipExportService?: ZipExportService;
}

const MODAL_TITLE = "Export Data" as const;
const BTN_ZIP_LABEL = "Export Daily Logs (.zip)" as const;
const BTN_CSV_LABEL = "Export Summary Spreadsheet (.csv)" as const;
const CLOSE_ARIA_LABEL = "Close export dialog" as const;
const CLOSE_ICON = "×" as const;
const ERROR_DRIVE_DISCONNECTED = "Google Drive folder not initialized" as const;
const ERROR_CSV_FAILED = "Failed to export CSV" as const;
const ERROR_ZIP_FAILED = "Failed to export ZIP" as const;
const TOAST_CSV_SUCCESS = "Summary CSV downloaded successfully" as const;
const TOAST_ZIP_SUCCESS = "Daily logs ZIP downloaded successfully" as const;
const ZIP_PROGRESS_LABEL = "Compressing logs..." as const;

/**
 * Modal dialog enabling one-click bulk export of daily logs (ZIP) and summary index (CSV).
 */
export function ExportModal({
  isOpen,
  onClose,
  csvExportService: customCsvService,
  zipExportService: customZipService,
}: IExportModalProps) {
  const { summaryIndex, logsFolderId, driveService } = useDriveSync();
  const { showToast } = useToast();

  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const csvService = useMemo(
    () => customCsvService ?? new CsvExportService(),
    [customCsvService],
  );

  const zipService = useMemo(
    () => customZipService ?? new ZipExportService(driveService),
    [customZipService, driveService],
  );

  const handleExportCsv = useCallback((): void => {
    try {
      setExportError(null);
      csvService.downloadCsv(summaryIndex ?? []);
      showToast(TOAST_CSV_SUCCESS, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : ERROR_CSV_FAILED;
      setExportError(msg);
      showToast(msg, "error");
    }
  }, [csvService, summaryIndex, showToast]);

  const handleExportZip = useCallback(async (): Promise<void> => {
    if (!logsFolderId) {
      setExportError(ERROR_DRIVE_DISCONNECTED);
      return;
    }
    try {
      setExportError(null);
      setIsExportingZip(true);
      setZipProgress(0);
      await zipService.downloadZip(logsFolderId, (pct) => setZipProgress(pct));
      showToast(TOAST_ZIP_SUCCESS, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : ERROR_ZIP_FAILED;
      setExportError(msg);
      showToast(msg, "error");
    } finally {
      setIsExportingZip(false);
    }
  }, [logsFolderId, zipService, showToast]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className={styles.modalContent}
      >
        <header className={styles.modalHeader}>
          <h2 id="export-modal-title" className={styles.modalTitle}>
            {MODAL_TITLE}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={CLOSE_ARIA_LABEL}
          >
            {CLOSE_ICON}
          </button>
        </header>

        <div className={styles.optionsStack}>
          <button
            type="button"
            className={styles.exportOptionButton}
            onClick={handleExportCsv}
            disabled={isExportingZip}
          >
            {BTN_CSV_LABEL}
          </button>

          <button
            type="button"
            className={styles.exportOptionButton}
            onClick={handleExportZip}
            disabled={isExportingZip}
          >
            {BTN_ZIP_LABEL}
          </button>
        </div>

        {isExportingZip && (
          <ExportProgressBar
            percent={zipProgress}
            statusText={ZIP_PROGRESS_LABEL}
          />
        )}

        {exportError && (
          <p className={styles.errorMessage} role="alert">
            {exportError}
          </p>
        )}
      </div>
    </div>
  );
}

export default ExportModal;
