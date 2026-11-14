import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FILTER_MODE_AND,
  FILTER_MODE_OR,
} from "@/constants/filterConstants";
import useHistoryFilter from "@/hooks/useHistoryFilter";
import type { ISummaryIndex } from "@/types/summaryIndex";

describe("useHistoryFilter", () => {
  const mockEntries: ISummaryIndex = [
    {
      date: "2026-11-14",
      location: "Paris",
      weather_summary: "12C, Rain",
      aqi_summary: "Good",
      mcq_responses: { energy_level: "High" },
      custom_entries_exist: false,
    },
    {
      date: "2026-10-10",
      location: "Rome",
      weather_summary: "20C, Clear",
      aqi_summary: "Moderate",
      mcq_responses: { energy_level: "Low" },
      custom_entries_exist: false,
    },
  ];

  it("should initialize with default state and computed timeline", () => {
    const { result } = renderHook(() =>
      useHistoryFilter({ entries: mockEntries }),
    );

    expect(result.current.selectedYears).toEqual([]);
    expect(result.current.selectedMonths).toEqual([]);
    expect(result.current.mcqSelections).toEqual({});
    expect(result.current.matchMode).toBe(FILTER_MODE_AND);
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filteredEntries).toHaveLength(2);
    expect(result.current.groupedTimeline).toHaveLength(1);
  });

  it("should update time filters and recalculate filtered results", () => {
    const { result } = renderHook(() =>
      useHistoryFilter({ entries: mockEntries }),
    );

    act(() => {
      result.current.setTimeFilter([2026], [10]);
    });

    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0]?.date).toBe("2026-10-10");
  });

  it("should toggle MCQ filter values on and off", () => {
    const { result } = renderHook(() =>
      useHistoryFilter({ entries: mockEntries }),
    );

    act(() => {
      result.current.toggleMcqFilter("energy_level", "High");
    });
    expect(result.current.mcqSelections.energy_level).toEqual(["High"]);
    expect(result.current.filteredEntries).toHaveLength(1);

    act(() => {
      result.current.toggleMcqFilter("energy_level", "High");
    });
    expect(result.current.mcqSelections.energy_level).toEqual([]);
    expect(result.current.filteredEntries).toHaveLength(2);
  });

  it("should switch match modes between AND and OR", () => {
    const { result } = renderHook(() =>
      useHistoryFilter({ entries: mockEntries }),
    );

    act(() => {
      result.current.setMatchMode(FILTER_MODE_OR);
    });
    expect(result.current.matchMode).toBe(FILTER_MODE_OR);
  });

  it("should reset all active filters to default states", () => {
    const { result } = renderHook(() =>
      useHistoryFilter({ entries: mockEntries }),
    );

    act(() => {
      result.current.setTimeFilter([2026], [11]);
      result.current.toggleMcqFilter("energy_level", "High");
      result.current.setMatchMode(FILTER_MODE_OR);
    });
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.selectedYears).toEqual([]);
    expect(result.current.selectedMonths).toEqual([]);
    expect(result.current.mcqSelections).toEqual({});
    expect(result.current.matchMode).toBe(FILTER_MODE_AND);
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filteredEntries).toHaveLength(2);
  });
});
