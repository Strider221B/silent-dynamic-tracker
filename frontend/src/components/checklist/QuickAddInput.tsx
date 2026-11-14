import {
  useCallback,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  QUICK_ADD_BUTTON_TEXT,
  QUICK_ADD_PLACEHOLDER,
} from "@/constants/checklistConstants";
import styles from "./QuickAddInput.module.css";

export interface IQuickAddInputProps {
  onAdd: (option: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

const EMPTY_VALUE = "" as const;
const ENTER_KEY = "Enter" as const;

/**
 * Text input and submission button for adding ad-hoc checklist options on the fly.
 */
export function QuickAddInput({
  onAdd,
  placeholder = QUICK_ADD_PLACEHOLDER,
  ariaLabel = QUICK_ADD_PLACEHOLDER,
}: IQuickAddInputProps) {
  const [value, setValue] = useState<string>(EMPTY_VALUE);

  const handleSubmit = useCallback(
    (e?: FormEvent): void => {
      e?.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onAdd(trimmed);
        setValue(EMPTY_VALUE);
      }
    },
    [onAdd, value],
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === ENTER_KEY) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isAddDisabled = value.trim().length === 0;

  return (
    <form className={styles.quickAddContainer} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.inputField}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      <button
        type="submit"
        className={styles.addButton}
        disabled={isAddDisabled}
      >
        {QUICK_ADD_BUTTON_TEXT}
      </button>
    </form>
  );
}

export default QuickAddInput;
