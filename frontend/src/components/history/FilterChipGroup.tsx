import type { IStandardQuestion } from "@/types/config";
import styles from "./FilterChipGroup.module.css";

export interface IFilterChipGroupProps {
  question: IStandardQuestion;
  selectedValues: string[];
  onToggle: (questionId: string, value: string) => void;
}

/**
 * Renders an individual MCQ question with selectable filter chips for each option.
 */
export function FilterChipGroup({
  question,
  selectedValues,
  onToggle,
}: IFilterChipGroupProps) {
  return (
    <div className={styles.questionRow}>
      <span className={styles.questionLabel}>{question.question}</span>
      <div className={styles.chipRow} role="group" aria-label={question.question}>
        {question.options.map((option) => {
          const isSelected = selectedValues.includes(option);
          const chipClass = isSelected
            ? styles.activeOptionChip
            : styles.optionChip;

          return (
            <button
              key={option}
              type="button"
              className={chipClass}
              aria-pressed={isSelected}
              onClick={() => onToggle(question.id, option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FilterChipGroup;
