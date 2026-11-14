import { useCallback } from "react";
import OptionChip from "@/components/checklist/OptionChip";
import QuickAddInput from "@/components/checklist/QuickAddInput";
import { QUESTION_TYPE_SELECT_MULTIPLE } from "@/constants/checklistConstants";
import type { IStandardQuestion } from "@/types/config";
import styles from "./QuestionBlock.module.css";

export interface IQuestionBlockProps {
  question: IStandardQuestion;
  currentResponse: string | string[] | undefined;
  temporaryOptions?: string[];
  onSelectOption: (
    questionId: string,
    option: string,
    isMultiple: boolean,
  ) => void;
  onQuickAdd: (questionId: string, option: string) => void;
  onSavePermanent?: (questionId: string, option: string) => void;
}

/**
 * Renders an individual questionnaire block with question prompt, option chips, and quick-add.
 */
export function QuestionBlock({
  question,
  currentResponse,
  temporaryOptions = [],
  onSelectOption,
  onQuickAdd,
  onSavePermanent,
}: IQuestionBlockProps) {
  const isMultiple = question.type === QUESTION_TYPE_SELECT_MULTIPLE;

  const isOptionSelected = useCallback(
    (option: string): boolean => {
      if (currentResponse === undefined) {
        return false;
      }
      return isMultiple && Array.isArray(currentResponse)
        ? currentResponse.includes(option)
        : currentResponse === option;
    },
    [currentResponse, isMultiple],
  );

  const handleChipToggle = useCallback(
    (option: string): void => {
      onSelectOption(question.id, option, isMultiple);
    },
    [isMultiple, onSelectOption, question.id],
  );

  const handleQuickAddOption = useCallback(
    (option: string): void => {
      onQuickAdd(question.id, option);
    },
    [onQuickAdd, question.id],
  );

  const handlePermanentSave = useCallback(
    (option: string): void => {
      onSavePermanent?.(question.id, option);
    },
    [onSavePermanent, question.id],
  );

  return (
    <section className={styles.questionBlock} aria-labelledby={`q-${question.id}`}>
      <h3 id={`q-${question.id}`} className={styles.questionTitle}>
        {question.question}
      </h3>

      <div className={styles.chipGroup} role="group" aria-label={question.question}>
        {question.options.map((opt) => (
          <OptionChip
            key={opt}
            label={opt}
            isSelected={isOptionSelected(opt)}
            onToggle={() => handleChipToggle(opt)}
          />
        ))}

        {temporaryOptions.map((opt) => (
          <OptionChip
            key={`temp-${opt}`}
            label={opt}
            isSelected={isOptionSelected(opt)}
            isTemporary={true}
            onToggle={() => handleChipToggle(opt)}
            onSavePermanent={() => handlePermanentSave(opt)}
          />
        ))}
      </div>

      <QuickAddInput
        onAdd={handleQuickAddOption}
        ariaLabel={`Add custom option for ${question.question}`}
      />
    </section>
  );
}

export default QuestionBlock;
