import { describe, expect, it } from "vitest";
import {
  ALL_TIME_LABEL,
  AQI_LABEL_TO_NUMERIC,
  EMPTY_TIMELINE_MESSAGE,
  FILTER_MODE_AND,
  FILTER_MODE_OR,
  MONTH_NAMES,
  RESET_FILTERS_LABEL,
} from "@/constants/filterConstants";

describe("filterConstants", () => {
  it("should define filter modes and UI labels", () => {
    expect(FILTER_MODE_AND).toBe("AND");
    expect(FILTER_MODE_OR).toBe("OR");
    expect(ALL_TIME_LABEL).toBe("All Time");
    expect(RESET_FILTERS_LABEL).toBe("Reset");
    expect(EMPTY_TIMELINE_MESSAGE).toBe(
      "No entries found matching active filters.",
    );
  });

  it("should contain all 12 month names in order", () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe("January");
    expect(MONTH_NAMES[11]).toBe("December");
  });

  it("should map AQI labels to numeric values 1-6", () => {
    expect(AQI_LABEL_TO_NUMERIC.Good).toBe(1);
    expect(AQI_LABEL_TO_NUMERIC.Moderate).toBe(2);
    expect(AQI_LABEL_TO_NUMERIC["Unhealthy for Sensitive Groups"]).toBe(3);
    expect(AQI_LABEL_TO_NUMERIC.Unhealthy).toBe(4);
    expect(AQI_LABEL_TO_NUMERIC["Very Unhealthy"]).toBe(5);
    expect(AQI_LABEL_TO_NUMERIC.Hazardous).toBe(6);
    expect(AQI_LABEL_TO_NUMERIC.Unknown).toBeNull();
  });
});
