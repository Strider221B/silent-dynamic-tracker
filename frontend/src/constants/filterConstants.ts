import type { EpaIndexNumeric, EpaIndexText } from "@/types/environmental";

/**
 * Filter mode demanding all selected criteria must match.
 */
export const FILTER_MODE_AND = "AND" as const;

/**
 * Filter mode permitting any selected criterion to match.
 */
export const FILTER_MODE_OR = "OR" as const;

/**
 * UI label representing unfiltered chronological scope.
 */
export const ALL_TIME_LABEL = "All Time" as const;

/**
 * UI label for the action resetting all active filter criteria.
 */
export const RESET_FILTERS_LABEL = "Reset" as const;

/**
 * Fallback empty state message when filtering returns zero matching records.
 */
export const EMPTY_TIMELINE_MESSAGE =
  "No entries found matching active filters." as const;

/**
 * Human-readable English month names ordered January through December.
 */
export const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Mapping from human-readable EPA AQI text label to numeric index level (1-6).
 */
export const AQI_LABEL_TO_NUMERIC: Record<EpaIndexText, EpaIndexNumeric | null> = {
  Good: 1,
  Moderate: 2,
  "Unhealthy for Sensitive Groups": 3,
  Unhealthy: 4,
  "Very Unhealthy": 5,
  Hazardous: 6,
  Unknown: null,
};
