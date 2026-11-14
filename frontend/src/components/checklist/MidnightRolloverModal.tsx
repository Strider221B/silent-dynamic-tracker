import {
  useState,
  type ChangeEvent,
} from "react";
import {
  CONFIRM_TODAY_TEXT,
  CONFIRM_YESTERDAY_TEXT,
  MIDNIGHT_MODAL_SUBTITLE,
  MIDNIGHT_MODAL_TITLE,
  OVERRIDE_DATE_LABEL,
} from "@/constants/checklistConstants";
import styles from "./MidnightRolloverModal.module.css";

export interface IMidnightRolloverModalProps {
  isOpen: boolean;
  yesterdayDateStr: string;
  todayDateStr: string;
  onConfirmYesterday: () => void;
  onConfirmToday: () => void;
  onOverrideDate: (date: string) => void;
  onDismiss?: () => void;
}

const MODAL_TITLE_ID = "midnight-modal-title" as const;
const DATE_PICKER_ID = "midnight-date-picker" as const;

/**
 * Late-night dialog asking the user whether they intend to log for yesterday (default) or today.
 */
export function MidnightRolloverModal({
  isOpen,
  yesterdayDateStr,
  todayDateStr,
  onConfirmYesterday,
  onConfirmToday,
  onOverrideDate,
}: IMidnightRolloverModalProps) {
  const [customDate, setCustomDate] = useState<string>("");

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setCustomDate(val);
    if (val) {
      onOverrideDate(val);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={MODAL_TITLE_ID}
    >
      <div className={styles.modalCard}>
        <h2 id={MODAL_TITLE_ID} className={styles.modalTitle}>
          {MIDNIGHT_MODAL_TITLE}
        </h2>
        <p className={styles.modalSubtitle}>{MIDNIGHT_MODAL_SUBTITLE}</p>

        <div className={styles.actionStack}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onConfirmYesterday}
          >
            {`${CONFIRM_YESTERDAY_TEXT} (${yesterdayDateStr})`}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onConfirmToday}
          >
            {`${CONFIRM_TODAY_TEXT} (${todayDateStr})`}
          </button>
        </div>

        <section className={styles.overrideSection}>
          <label htmlFor={DATE_PICKER_ID} className={styles.overrideLabel}>
            {OVERRIDE_DATE_LABEL}
          </label>
          <input
            id={DATE_PICKER_ID}
            type="date"
            className={styles.dateInput}
            value={customDate}
            onChange={handleDateChange}
          />
        </section>
      </div>
    </div>
  );
}

export default MidnightRolloverModal;
