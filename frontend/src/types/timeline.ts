import type { ISummaryIndexEntry } from "@/types/summaryIndex";

/**
 * Group of daily entries occurring within a single month.
 */
export interface ITimelineMonthGroup {
  month: number;
  monthName: string;
  entries: ISummaryIndexEntry[];
}

/**
 * Group of month groups occurring within a single calendar year.
 */
export interface ITimelineYearGroup {
  year: number;
  months: ITimelineMonthGroup[];
}
