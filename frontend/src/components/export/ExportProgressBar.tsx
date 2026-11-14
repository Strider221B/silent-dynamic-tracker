import styles from "./ExportProgressBar.module.css";

export interface IExportProgressBarProps {
  percent: number;
  statusText?: string;
}

const MIN_PERCENT = 0 as const;
const MAX_PERCENT = 100 as const;
const DEFAULT_LABEL = "Exporting..." as const;

/**
 * Accessible progress bar displaying download and compression progress.
 */
export function ExportProgressBar({
  percent,
  statusText = DEFAULT_LABEL,
}: IExportProgressBarProps) {
  const clampedPercent = Math.min(
    MAX_PERCENT,
    Math.max(MIN_PERCENT, Math.round(percent)),
  );
  const percentText = `${clampedPercent}%`;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressLabelRow}>
        <span>{statusText}</span>
        <span>{percentText}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={MIN_PERCENT}
        aria-valuemax={MAX_PERCENT}
        className={styles.progressTrack}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}

export default ExportProgressBar;
