/**
 * Shared application-wide metadata, Google Drive filenames, and boundary limits.
 */
export const APP_NAME = "Silent Dynamic Tracker" as const;
export const APP_SHORT_NAME = "SDT" as const;
export const DEFAULT_CONFIG_VERSION = "1.0" as const;

export const DRIVE_FOLDER_NAME = "SilentDynamicTracker" as const;
export const CONFIG_FILE_NAME = "config.json" as const;
export const SUMMARY_INDEX_FILE_NAME = "summary_index.json" as const;
export const LOGS_DIR_NAME = "logs" as const;

export const MAX_NOTES_LENGTH = 5000 as const;
export const MAX_OPTION_TEXT_LENGTH = 100 as const;
export const MAX_LOCATION_LENGTH = 120 as const;

export const MIDNIGHT_ROLLOVER_START_HOUR = 0 as const;
export const MIDNIGHT_ROLLOVER_END_HOUR = 4 as const;

