import { MONTH_NAMES } from "@/constants/filterConstants";
import type { ISummaryIndex, ISummaryIndexEntry } from "@/types/summaryIndex";
import type { ITimelineMonthGroup, ITimelineYearGroup } from "@/types/timeline";

/**
 * Pure service organizing flat summary entries into a hierarchical Year/Month tree.
 */
export class TimelineGroupingService {
  private static readonly _MONTH_NAMES: readonly string[] = MONTH_NAMES;
  private static readonly _DATE_DELIMITER = "-";
  private static readonly _RADIX_TEN = 10;
  private static readonly _FIRST_MONTH_INDEX = 1;

  public constructor() {}

  /**
   * Transforms flat summary entries into chronological descending Year and Month groups.
   */
  public groupEntries(entries: ISummaryIndex): ITimelineYearGroup[] {
    if (entries.length === 0) {
      return [];
    }

    const sortedEntries = [...entries].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    const yearMap = this._buildYearMap(sortedEntries);
    return this._convertYearMapToGroups(yearMap);
  }

  /**
   * Identifies all distinct years and their corresponding months present in the summary index.
   */
  public extractAvailableYearsAndMonths(
    entries: ISummaryIndex,
  ): Map<number, number[]> {
    const rawMap = new Map<number, Set<number>>();
    for (const entry of entries) {
      const { year, month } = this._parseYearAndMonth(entry.date);
      if (!rawMap.has(year)) {
        rawMap.set(year, new Set());
      }
      rawMap.get(year)?.add(month);
    }

    const sortedYears = Array.from(rawMap.keys()).sort((a, b) => b - a);
    const finalMap = new Map<number, number[]>();
    for (const year of sortedYears) {
      const sortedMonths = Array.from(rawMap.get(year) || []).sort(
        (a, b) => b - a,
      );
      finalMap.set(year, sortedMonths);
    }
    return finalMap;
  }

  /**
   * Assembles a nested map keyed by year and month from sorted entries.
   */
  private _buildYearMap(
    sortedEntries: ISummaryIndexEntry[],
  ): Map<number, Map<number, ISummaryIndexEntry[]>> {
    const yearMap = new Map<number, Map<number, ISummaryIndexEntry[]>>();
    for (const entry of sortedEntries) {
      const { year, month } = this._parseYearAndMonth(entry.date);
      if (!yearMap.has(year)) {
        yearMap.set(year, new Map());
      }
      const monthMap = yearMap.get(year);
      if (monthMap && !monthMap.has(month)) {
        monthMap.set(month, []);
      }
      monthMap?.get(month)?.push(entry);
    }
    return yearMap;
  }

  /**
   * Converts a nested year-month map into a structured array of year groups.
   */
  private _convertYearMapToGroups(
    yearMap: Map<number, Map<number, ISummaryIndexEntry[]>>,
  ): ITimelineYearGroup[] {
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);
    return sortedYears.map((year) => {
      const monthMap = yearMap.get(year);
      const sortedMonths = Array.from(monthMap?.keys() || []).sort(
        (a, b) => b - a,
      );
      const months: ITimelineMonthGroup[] = sortedMonths.map((month) => ({
        month,
        monthName: this._formatMonthName(month),
        entries: monthMap?.get(month) || [],
      }));
      return { year, months };
    });
  }

  /**
   * Parses standard YYYY-MM-DD date string into numeric year and 1-based month.
   */
  private _parseYearAndMonth(dateStr: string): {
    year: number;
    month: number;
  } {
    const segments = dateStr.split(TimelineGroupingService._DATE_DELIMITER);
    const year = Number.parseInt(
      segments[0] || "0",
      TimelineGroupingService._RADIX_TEN,
    );
    const month = Number.parseInt(
      segments[1] || "1",
      TimelineGroupingService._RADIX_TEN,
    );
    return { year, month };
  }

  /**
   * Converts a 1-based numeric month to its full English string representation.
   */
  private _formatMonthName(monthNumber: number): string {
    const monthIdx = monthNumber - TimelineGroupingService._FIRST_MONTH_INDEX;
    return TimelineGroupingService._MONTH_NAMES[monthIdx] || "";
  }
}

export default TimelineGroupingService;
