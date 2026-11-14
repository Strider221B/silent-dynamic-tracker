import { describe, expect, it } from "vitest";
import {
  BATCH_DOWNLOAD_CONCURRENCY,
  CSV_FILENAME_PREFIX,
  CSV_HEADERS,
  ZIP_FILENAME_PREFIX,
} from "@/constants/exportConstants";
import {
  DEFAULT_THEME,
  STORAGE_KEY_THEME,
  THEME_DAY,
  THEME_NIGHT,
} from "@/constants/themeConstants";

describe("exportConstants", () => {
  it("should define correct export prefixes and batch concurrency", () => {
    expect(ZIP_FILENAME_PREFIX).toBe("SDT_Daily_Logs_");
    expect(CSV_FILENAME_PREFIX).toBe("SDT_Summary_Index_");
    expect(BATCH_DOWNLOAD_CONCURRENCY).toBe(5);
  });

  it("should define CSV headers with base columns and standard MCQ fields", () => {
    expect(CSV_HEADERS).toContain("Date");
    expect(CSV_HEADERS).toContain("Location");
    expect(CSV_HEADERS).toContain("Weather Summary");
    expect(CSV_HEADERS).toContain("AQI Summary");
    expect(CSV_HEADERS).toContain("Custom Entries Exist");
    expect(CSV_HEADERS).toContain("Energy Level");
    expect(CSV_HEADERS).toContain("Interacted With");
  });
});

describe("themeConstants", () => {
  it("should define Day mode as default theme", () => {
    expect(DEFAULT_THEME).toBe(THEME_DAY);
    expect(THEME_DAY).toBe("day");
    expect(THEME_NIGHT).toBe("night");
  });

  it("should define storage key for theme persistence", () => {
    expect(STORAGE_KEY_THEME).toBe("sdt_theme_preference");
  });
});
