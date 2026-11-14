import type {
  FILTER_MODE_AND,
  FILTER_MODE_OR,
} from "@/constants/filterConstants";

/**
 * Supported logical evaluation modes for multi-criteria filtering.
 */
export type FilterMode = typeof FILTER_MODE_AND | typeof FILTER_MODE_OR;

/**
 * Chronological criteria for filtering summary entries by year and month.
 */
export interface ITimeFilterCriteria {
  years: number[];
  months: number[];
}

/**
 * Multiple-choice question response criteria and logical operator.
 */
export interface IMcqFilterCriteria {
  selections: Record<string, string[]>;
  mode: FilterMode;
}
