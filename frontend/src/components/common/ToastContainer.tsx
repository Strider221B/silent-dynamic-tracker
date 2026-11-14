import ToastItem from "@/components/common/ToastItem";
import { useToast } from "@/hooks/useToast";
import styles from "./ToastContainer.module.css";

const CONTAINER_ARIA_LABEL = "Notifications" as const;

/**
 * Global non-blocking toast stack container positioned at the bottom of the viewport.
 */
export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={CONTAINER_ARIA_LABEL}
      className={styles.toastContainer}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </section>
  );
}

export default ToastContainer;
