import styles from "./LoadingSpinner.module.css";

export interface ILoadingSpinnerProps {
  text?: string;
  size?: "small" | "medium" | "large";
}

const DEFAULT_SPINNER_TEXT = "Loading..." as const;
const DEFAULT_SPINNER_SIZE = "medium" as const;

/**
 * Accessible SVG loading indicator with customizable size and label.
 */
export function LoadingSpinner({
  text = DEFAULT_SPINNER_TEXT,
  size = DEFAULT_SPINNER_SIZE,
}: ILoadingSpinnerProps) {
  const spinnerSizeClass = styles[size] ?? styles.medium;

  return (
    <div
      className={styles.spinnerContainer}
      role="status"
      aria-live="polite"
    >
      <svg
        className={`${styles.spinner} ${spinnerSizeClass}`}
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle
          className={styles.circle}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      <p className={styles.spinnerText}>{text}</p>
    </div>
  );
}

export default LoadingSpinner;

