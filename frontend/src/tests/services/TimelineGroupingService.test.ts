import { describe, expect, it } from "vitest";
import TimelineGroupingService from "@/services/TimelineGroupingService";
import type { ISummaryIndex } from "@/types/summaryIndex";

describe("TimelineGroupingService", () => {
  const service = new TimelineGroupingService();

  const mockIndex: ISummaryIndex = [
    {
      date: "2026-11-14",
      location: "Paris",
      weather_summary: "12C, Rain",
      aqi_summary: "Good",
      mcq_responses: { energy_level: "High" },
      custom_entries_exist: false,
    },
    {
      date: "2026-11-05",
      location: "Lyon",
      weather_summary: "15C, Clear",
      aqi_summary: "Moderate",
      mcq_responses: { energy_level: "Moderate" },
      custom_entries_exist: true,
    },
    {
      date: "2026-10-20",
      location: "Paris",
      weather_summary: null,
      aqi_summary: null,
      mcq_responses: {},
      custom_entries_exist: false,
    },
    {
      date: "2025-12-31",
      location: "Nice",
      weather_summary: "18C, Sunny",
      aqi_summary: "Good",
      mcq_responses: { energy_level: "High" },
      custom_entries_exist: false,
    },
  ];

  it("should return empty array when entries list is empty", () => {
    const result = service.groupEntries([]);
    expect(result).toEqual([]);
  });

  it("should group entries chronologically descending across years and months", () => {
    const result = service.groupEntries(mockIndex);

    expect(result).toHaveLength(2);
    expect(result[0]?.year).toBe(2026);
    expect(result[1]?.year).toBe(2025);

    const year2026 = result[0];
    expect(year2026?.months).toHaveLength(2);
    expect(year2026?.months[0]?.month).toBe(11);
    expect(year2026?.months[0]?.monthName).toBe("November");
    expect(year2026?.months[0]?.entries).toHaveLength(2);
    expect(year2026?.months[0]?.entries[0]?.date).toBe("2026-11-14");
    expect(year2026?.months[0]?.entries[1]?.date).toBe("2026-11-05");

    expect(year2026?.months[1]?.month).toBe(10);
    expect(year2026?.months[1]?.monthName).toBe("October");
    expect(year2026?.months[1]?.entries).toHaveLength(1);

    const year2025 = result[1];
    expect(year2025?.months).toHaveLength(1);
    expect(year2025?.months[0]?.month).toBe(12);
    expect(year2025?.months[0]?.monthName).toBe("December");
    expect(year2025?.months[0]?.entries[0]?.date).toBe("2025-12-31");
  });

  it("should extract unique available years and months sorted descending", () => {
    const map = service.extractAvailableYearsAndMonths(mockIndex);

    expect(Array.from(map.keys())).toEqual([2026, 2025]);
    expect(map.get(2026)).toEqual([11, 10]);
    expect(map.get(2025)).toEqual([12]);
  });

  it("should handle empty index when extracting years and months", () => {
    const map = service.extractAvailableYearsAndMonths([]);
    expect(map.size).toBe(0);
  });
});
