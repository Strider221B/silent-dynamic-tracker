import type { ChangeEvent } from "react";
import {
  NOTES_LABEL,
  NOTES_PLACEHOLDER,
} from "@/constants/checklistConstants";
import styles from "./FreeFormNotes.module.css";

export interface IFreeFormNotesProps {
  notes: string;
  onChange: (notes: string) => void;
  placeholder?: string;
}

const TEXTAREA_ID = "free-form-notes-input" as const;

/**
 * Textarea component for optional late-night reflections or free-form notes.
 */
export function FreeFormNotes({
  notes,
  onChange,
  placeholder = NOTES_PLACEHOLDER,
}: IFreeFormNotesProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(e.target.value);
  };

  return (
    <section className={styles.notesContainer}>
      <label htmlFor={TEXTAREA_ID} className={styles.notesLabel}>
        {NOTES_LABEL}
      </label>
      <textarea
        id={TEXTAREA_ID}
        className={styles.notesTextarea}
        value={notes}
        onChange={handleChange}
        placeholder={placeholder}
        rows={4}
      />
    </section>
  );
}

export default FreeFormNotes;
