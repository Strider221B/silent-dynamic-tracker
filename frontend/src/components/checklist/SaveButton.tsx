import {
  SAVE_BUTTON_TEXT,
  SAVING_BUTTON_TEXT,
} from "@/constants/checklistConstants";
import styles from "./SaveButton.module.css";

export interface ISaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
  disabled?: boolean;
}

/**
 * Sticky bottom-anchored action button for committing daily log entries.
 */
export function SaveButton({
  onSave,
  isSaving,
  disabled = false,
}: ISaveButtonProps) {
  const isButtonDisabled = disabled || isSaving;
  const buttonText = isSaving ? SAVING_BUTTON_TEXT : SAVE_BUTTON_TEXT;

  return (
    <footer className={styles.stickyBar}>
      <button
        type="button"
        className={styles.saveButton}
        onClick={onSave}
        disabled={isButtonDisabled}
        aria-busy={isSaving}
      >
        {buttonText}
      </button>
    </footer>
  );
}

export default SaveButton;
