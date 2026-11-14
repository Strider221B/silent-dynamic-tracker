/**
 * Constants governing bulk export of daily logs (ZIP) and summary index (CSV).
 */

export const ZIP_FILENAME_PREFIX = "SDT_Daily_Logs_" as const;
export const CSV_FILENAME_PREFIX = "SDT_Summary_Index_" as const;

export const BASE_CSV_HEADERS: readonly string[] = [
  "Date",
  "Location",
  "Weather Summary",
  "AQI Summary",
  "Custom Entries Exist",
] as const;

export const CSV_HEADERS: readonly string[] = [
  ...BASE_CSV_HEADERS,
  "Energy Level",
  "Interacted With",
] as const;

export const BATCH_DOWNLOAD_CONCURRENCY = 5 as const;

export const CSV_MIME_TYPE = "text/csv;charset=utf-8;" as const;
export const ZIP_MIME_TYPE = "application/zip" as const;
export const CSV_FILE_EXTENSION = ".csv" as const;
export const ZIP_FILE_EXTENSION = ".zip" as const;
