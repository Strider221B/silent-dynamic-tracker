import { describe, expect, it } from "vitest";
import {
  APP_NAME,
  APP_SHORT_NAME,
  CONFIG_FILE_NAME,
  DEFAULT_CONFIG_VERSION,
  DRIVE_FOLDER_NAME,
  LOGS_DIR_NAME,
  MAX_LOCATION_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_OPTION_TEXT_LENGTH,
  MIDNIGHT_ROLLOVER_END_HOUR,
  MIDNIGHT_ROLLOVER_START_HOUR,
  SUMMARY_INDEX_FILE_NAME,
} from "@/constants/appConstants";
import {
  EPA_INDEX_LABELS,
  EPA_INDEX_VALUES,
  EPA_UNKNOWN_LABEL,
} from "@/constants/epaConstants";

describe("appConstants", () => {
  it("should expose expected Drive folder and file names", () => {
    expect(APP_NAME).toBe("Silent Dynamic Tracker");
    expect(APP_SHORT_NAME).toBe("SDT");
    expect(DEFAULT_CONFIG_VERSION).toBe("1.0");
    expect(DRIVE_FOLDER_NAME).toBe("SilentDynamicTracker");
    expect(CONFIG_FILE_NAME).toBe("config.json");
    expect(SUMMARY_INDEX_FILE_NAME).toBe("summary_index.json");
    expect(LOGS_DIR_NAME).toBe("logs");
  });

  it("should define positive input limits and midnight rollover boundaries", () => {
    expect(MAX_NOTES_LENGTH).toBeGreaterThan(0);
    expect(MAX_OPTION_TEXT_LENGTH).toBeGreaterThan(0);
    expect(MAX_LOCATION_LENGTH).toBeGreaterThan(0);
    expect(MIDNIGHT_ROLLOVER_START_HOUR).toBe(0);
    expect(MIDNIGHT_ROLLOVER_END_HOUR).toBe(4);
  });
});

describe("epaConstants", () => {
  it("should map all six US EPA index values to descriptive labels", () => {
    expect(EPA_INDEX_VALUES).toEqual([1, 2, 3, 4, 5, 6]);
    expect(Object.keys(EPA_INDEX_LABELS)).toHaveLength(6);
    expect(EPA_INDEX_LABELS[1]).toBe("Good");
    expect(EPA_INDEX_LABELS[2]).toBe("Moderate");
    expect(EPA_INDEX_LABELS[3]).toBe("Unhealthy for Sensitive Groups");
    expect(EPA_INDEX_LABELS[4]).toBe("Unhealthy");
    expect(EPA_INDEX_LABELS[5]).toBe("Very Unhealthy");
    expect(EPA_INDEX_LABELS[6]).toBe("Hazardous");
    expect(EPA_UNKNOWN_LABEL).toBe("Unknown");
  });
});

