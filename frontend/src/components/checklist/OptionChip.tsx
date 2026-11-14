import type { MouseEvent } from "react";
import { SAVE_PERMANENT_LABEL } from "@/constants/checklistConstants";
import styles from "./OptionChip.module.css";

export interface IOptionChipProps {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
  isTemporary?: boolean;
  onSavePermanent?: () => void;
}

const TEMPORARY_BADGE_TEXT = "📌" as const;

/**
 * Rapid-tap option chip button with 48x48 min touch target and ARIA switch semantics.
 */
export function OptionChip({
  label,
  isSelected,
  onToggle,
  isTemporary = false,
  onSavePermanent,
}: IOptionChipProps) {
  const chipClasses = `${styles.chipButton} ${
    isSelected ? styles.selected : ""
  } ${isTemporary ? styles.temporary : ""}`;

  const handlePermanentClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    onSavePermanent?.();
  };

  return (
    <div className={styles.chipWrapper}>
      <button
        type="button"
        role="switch"
        aria-checked={isSelected}
        className={chipClasses}
        onClick={onToggle}
      >
        <span>{label}</span>
      </button>

      {isTemporary && onSavePermanent && (
        <button
          type="button"
          className={styles.savePermanentButton}
          aria-label={`${SAVE_PERMANENT_LABEL}: ${label}`}
          title={`${SAVE_PERMANENT_LABEL}: ${label}`}
          onClick={handlePermanentClick}
        >
          <span aria-hidden="true">{TEMPORARY_BADGE_TEXT}</span>
        </button>
      )}
    </div>
  );
}

export default OptionChip;
