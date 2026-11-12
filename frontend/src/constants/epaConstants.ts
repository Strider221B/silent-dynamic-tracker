import type { EpaIndexNumeric, EpaIndexText } from "@/types/environmental";

/**
 * Fallback label when an EPA AQI index is missing or out of range.
 */
export const EPA_UNKNOWN_LABEL: EpaIndexText = "Unknown";

/**
 * Ordered list of valid US EPA Air Quality Index numeric values.
 */
export const EPA_INDEX_VALUES: readonly EpaIndexNumeric[] = [1, 2, 3, 4, 5, 6] as const;

/**
 * Mapping from US EPA numeric index (1-6) to human-readable text label.
 */
export const EPA_INDEX_LABELS: Record<EpaIndexNumeric, EpaIndexText> = {
  1: "Good",
  2: "Moderate",
  3: "Unhealthy for Sensitive Groups",
  4: "Unhealthy",
  5: "Very Unhealthy",
  6: "Hazardous",
};

