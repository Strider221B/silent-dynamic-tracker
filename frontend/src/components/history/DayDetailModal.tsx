import { useEffect } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DayDetailEnvironmentalSection from "@/components/history/DayDetailEnvironmentalSection";
import type { IDailyPayload } from "@/types/dailyPayload";
import styles from "./DayDetailModal.module.css";

export interface IDayDetailModalProps {
  isOpen: boolean;
  date: string | null;
  payload: IDailyPayload | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onEditEnvironmental: () => void;
}

const KEY_ESCAPE = "Escape" as const;
const CLOSE_BUTTON_LABEL = "Close" as const;
const EMPTY_NOTES_TEXT = "No notes recorded for this date." as const;

function formatResponseValue(val: string | string[]): string {
  return Array.isArray(val) ? val.join(", ") : val;
}

/**
 * Slide-over / modal dialog displaying lazy-loaded day log metrics and notes.
 */
export function DayDetailModal({
  isOpen,
  date,
  payload,
  isLoading,
  error,
  onClose,
  onEditEnvironmental,
}: IDayDetailModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === KEY_ESCAPE) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !date) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Log Details for ${date}`}
      className={styles.overlay}
    >
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <h2 className={styles.modalTitle}>{`Log: ${date}`}</h2>
            <span className={styles.locationSubtitle}>
              {payload?.location ? `📍 ${payload.location}` : "No location"}
            </span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            {CLOSE_BUTTON_LABEL}
          </button>
        </header>

        {isLoading && (
          <div className={styles.loadingArea}>
            <LoadingSpinner size="medium" />
          </div>
        )}

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {payload && !isLoading && (
          <div>
            <DayDetailEnvironmentalSection
              data={payload.environmental_data}
              onEdit={onEditEnvironmental}
            />

            <section className={styles.section} aria-label="Standard Responses">
              <h3 className={styles.sectionTitle}>Responses</h3>
              {Object.entries(payload.standard_responses).map(([k, v]) => (
                <div key={k} className={styles.responseItem}>
                  <span className={styles.questionText}>{k}:</span>
                  <span className={styles.responseText}>
                    {formatResponseValue(v)}
                  </span>
                </div>
              ))}
            </section>

            <section className={styles.section} aria-label="Notes">
              <h3 className={styles.sectionTitle}>Notes</h3>
              <p className={styles.notesBlock}>
                {payload.free_form_notes?.trim() || EMPTY_NOTES_TEXT}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default DayDetailModal;
