/**
 * Numeric US EPA Air Quality Index levels (1 through 6).
 */
export type EpaIndexNumeric = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Human-readable US EPA Air Quality Index text labels.
 */
export type EpaIndexText =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous"
  | "Unknown";

/**
 * Origin of environmental data attached to a daily log.
 */
export type EnvironmentalSource = "api" | "manual";

/**
 * Weather and air quality payload stored in daily log files.
 */
export interface IEnvironmentalData {
  temperature: string | null;
  condition: string | null;
  aqi: EpaIndexText | null;
  aqi_numeric?: EpaIndexNumeric | null;
  pm25?: number | null;
  source?: EnvironmentalSource | null;
}

