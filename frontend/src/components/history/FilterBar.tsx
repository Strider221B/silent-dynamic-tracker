import { useCallback, useMemo } from "react";
import FilterChipGroup from "@/components/history/FilterChipGroup";
import {
  ALL_TIME_LABEL,
  FILTER_MODE_AND,
  FILTER_MODE_OR,
  RESET_FILTERS_LABEL,
} from "@/constants/filterConstants";
import type { IStandardQuestion } from "@/types/config";
import type { FilterMode } from "@/types/filter";
import styles from "./FilterBar.module.css";

export interface IFilterBarProps {
  availableYearsAndMonths: Map<number, number[]>;
  selectedYears: number[];
  selectedMonths: number[];
  mcqQuestions?: IStandardQuestion[];
  mcqSelections: Record<string, string[]>;
  matchMode: FilterMode;
  hasActiveFilters: boolean;
  onTimeChange: (years: number[], months: number[]) => void;
  onMcqToggle: (questionId: string, value: string) => void;
  onModeChange: (mode: FilterMode) => void;
  onReset: () => void;
}

const EMPTY_SELECTIONS: readonly string[] = [] as const;

/**
 * Filter control bar facilitating Year, Mode (AND/OR), Reset, and MCQ matrix operations.
 */
export function FilterBar({
  availableYearsAndMonths,
  selectedYears,
  selectedMonths,
  mcqQuestions = [],
  mcqSelections,
  matchMode,
  hasActiveFilters,
  onTimeChange,
  onMcqToggle,
  onModeChange,
  onReset,
}: IFilterBarProps) {
  const isAllTime = useMemo(
    () => selectedYears.length === 0 && selectedMonths.length === 0,
    [selectedYears, selectedMonths],
  );

  const yearList = useMemo(
    () => Array.from(availableYearsAndMonths.keys()),
    [availableYearsAndMonths],
  );

  const handleAllTimeClick = useCallback((): void => {
    onTimeChange([], []);
  }, [onTimeChange]);

  const handleToggleYear = useCallback(
    (year: number): void => {
      const nextYears = selectedYears.includes(year)
        ? selectedYears.filter((y) => y !== year)
        : [...selectedYears, year];
      onTimeChange(nextYears, selectedMonths);
    },
    [selectedYears, selectedMonths, onTimeChange],
  );

  const handleSetAnd = useCallback((): void => {
    onModeChange(FILTER_MODE_AND);
  }, [onModeChange]);

  const handleSetOr = useCallback((): void => {
    onModeChange(FILTER_MODE_OR);
  }, [onModeChange]);

  return (
    <nav className={styles.filterBarContainer} aria-label="Timeline Filters">
      <div className={styles.topControlRow}>
        <div className={styles.timeFilterGroup}>
          <button
            type="button"
            className={isAllTime ? styles.activeFilterChip : styles.filterChip}
            onClick={handleAllTimeClick}
          >
            {ALL_TIME_LABEL}
          </button>
          {yearList.map((year) => {
            const isSelected = selectedYears.includes(year);
            const chipClass = isSelected
              ? styles.activeFilterChip
              : styles.filterChip;

            return (
              <button
                key={year}
                type="button"
                className={chipClass}
                onClick={() => handleToggleYear(year)}
              >
                {year}
              </button>
            );
          })}
        </div>

        <div className={styles.actionControls}>
          <div
            className={styles.modeToggleGroup}
            role="group"
            aria-label="Filter match mode"
          >
            <button
              type="button"
              className={
                matchMode === FILTER_MODE_AND
                  ? styles.activeModeBtn
                  : styles.modeBtn
              }
              onClick={handleSetAnd}
            >
              {FILTER_MODE_AND}
            </button>
            <button
              type="button"
              className={
                matchMode === FILTER_MODE_OR
                  ? styles.activeModeBtn
                  : styles.modeBtn
              }
              onClick={handleSetOr}
            >
              {FILTER_MODE_OR}
            </button>
          </div>

          <button
            type="button"
            className={styles.resetButton}
            disabled={!hasActiveFilters}
            onClick={onReset}
          >
            {RESET_FILTERS_LABEL}
          </button>
        </div>
      </div>

      {mcqQuestions.length > 0 && (
        <div className={styles.mcqMatrix}>
          {mcqQuestions.map((q) => (
            <FilterChipGroup
              key={q.id}
              question={q}
              selectedValues={mcqSelections[q.id] || (EMPTY_SELECTIONS as string[])}
              onToggle={onMcqToggle}
            />
          ))}
        </div>
      )}
    </nav>
  );
}

export default FilterBar;
