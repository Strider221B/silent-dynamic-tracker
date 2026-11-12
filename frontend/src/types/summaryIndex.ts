/**
 * Single logged day metadata entry stored inside summary_index.json.
 */
export interface ISummaryIndexEntry {
  date: string;
  location: string;
  weather_summary: string | null;
  aqi_summary: string | null;
  mcq_responses: Record<string, string | string[]>;
  custom_entries_exist: boolean;
}

/**
 * Lightweight collection of all logged day entries (summary_index.json).
 */
export type ISummaryIndex = ISummaryIndexEntry[];

