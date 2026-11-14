import { describe, expect, it } from "vitest";
import {
  FILTER_MODE_AND,
  FILTER_MODE_OR,
} from "@/constants/filterConstants";
import FilterEngineService from "@/services/FilterEngineService";
import type { ISummaryIndex } from "@/types/summaryIndex";

describe("FilterEngineService", () => {
  const service = new FilterEngineService();

  const mockEntries: ISummaryIndex = [
    {
      date: "2026-11-10",
      location: "City A",
      weather_summary: "Sunny",
      aqi_summary: "Good",
      mcq_responses: {
        energy_level: "High",
        symptoms: ["Fatigue", "Headache"],
      },
      custom_entries_exist: false,
    },
    {
      date: "2026-11-01",
      location: "City B",
      weather_summary: "Rainy",
      aqi_summary: "Moderate",
      mcq_responses: {
        energy_level: "Moderate",
        symptoms: ["Fatigue"],
      },
      custom_entries_exist: false,
    },
    {
      date: "2026-10-15",
      location: "City C",
      weather_summary: "Cloudy",
      aqi_summary: "Good",
      mcq_responses: {
        energy_level: "High",
        symptoms: [],
      },
      custom_entries_exist: false,
    },
    {
      date: "2025-11-05",
      location: "City D",
      weather_summary: "Snow",
      aqi_summary: "Unhealthy",
      mcq_responses: {
        energy_level: "Low",
      },
      custom_entries_exist: false,
    },
  ];

  it("should return all entries when all filters are empty", () => {
    const result = service.filter(
      mockEntries,
      { years: [], months: [] },
      { selections: {}, mode: FILTER_MODE_AND },
    );
    expect(result).toHaveLength(4);
  });

  it("should filter entries by selected year", () => {
    const result = service.filter(
      mockEntries,
      { years: [2025], months: [] },
      { selections: {}, mode: FILTER_MODE_AND },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.date).toBe("2025-11-05");
  });

  it("should filter entries by selected month", () => {
    const result = service.filter(
      mockEntries,
      { years: [], months: [10] },
      { selections: {}, mode: FILTER_MODE_AND },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.date).toBe("2026-10-15");
  });

  it("should filter entries by combined year and month", () => {
    const result = service.filter(
      mockEntries,
      { years: [2026], months: [11] },
      { selections: {}, mode: FILTER_MODE_AND },
    );
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.date)).toEqual(["2026-11-10", "2026-11-01"]);
  });

  it("should filter in AND mode matching all active criteria", () => {
    const result = service.filter(
      mockEntries,
      { years: [], months: [] },
      {
        selections: {
          energy_level: ["High"],
          symptoms: ["Headache"],
        },
        mode: FILTER_MODE_AND,
      },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.date).toBe("2026-11-10");
  });

  it("should filter in OR mode matching any active criterion", () => {
    const result = service.filter(
      mockEntries,
      { years: [], months: [] },
      {
        selections: {
          energy_level: ["Moderate"],
          symptoms: ["Headache"],
        },
        mode: FILTER_MODE_OR,
      },
    );
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.date)).toEqual(["2026-11-10", "2026-11-01"]);
  });

  it("should handle empty selection arrays in criteria cleanly", () => {
    const result = service.filter(
      mockEntries,
      { years: [], months: [] },
      {
        selections: {
          energy_level: [],
        },
        mode: FILTER_MODE_AND,
      },
    );
    expect(result).toHaveLength(4);
  });

  it("should return empty array when no entries match the criteria", () => {
    const result = service.filter(
      mockEntries,
      { years: [2024], months: [] },
      { selections: {}, mode: FILTER_MODE_AND },
    );
    expect(result).toHaveLength(0);
  });
});
