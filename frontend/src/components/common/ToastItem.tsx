import { useCallback } from "react";
import type { IToastItem, ToastType } from "@/context/ToastContext";
import styles from "./ToastItem.module.css";

export interface IToastItemProps {
  toast: IToastItem;
  onDismiss: (id: string) => void;
}

const DISMISS_ARIA_LABEL = "Dismiss notification" as const;
const DISMISS_ICON = "×" as const;
const ICON_INFO = "ℹ" as const;
const ICON_SUCCESS = "✓" as const;
const ICON_ERROR = "⚠" as const;

const TYPE_STYLE_MAP: Record<ToastType, string> = {
  info: styles.infoToast,
  success: styles.successToast,
  error: styles.errorToast,
};

const TYPE_ICON_MAP: Record<ToastType, string> = {
  info: ICON_INFO,
  success: ICON_SUCCESS,
  error: ICON_ERROR,
};

/**
 * Renders an accessible individual toast item with auto/manual dismissal.
 */
export function ToastItem({ toast, onDismiss }: IToastItemProps) {
  const handleDismiss = useCallback((): void => {
    onDismiss(toast.id);
  }, [onDismiss, toast.id]);

  const typeClass = TYPE_STYLE_MAP[toast.type] || styles.infoToast;
  const typeIcon = TYPE_ICON_MAP[toast.type] || ICON_INFO;
  const ariaRole = toast.type === "error" ? "alert" : "status";

  return (
    <div
      role={ariaRole}
      aria-live="polite"
      className={`${styles.toastItem} ${typeClass}`}
    >
      <div className={styles.toastContent}>
        <span className={styles.toastIcon} aria-hidden="true">
          {typeIcon}
        </span>
        <span className={styles.toastMessage}>{toast.message}</span>
      </div>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={handleDismiss}
        aria-label={DISMISS_ARIA_LABEL}
      >
        {DISMISS_ICON}
      </button>
    </div>
  );
}

export default ToastItem;
