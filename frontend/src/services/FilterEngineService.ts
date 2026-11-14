import {
  FILTER_MODE_AND,
} from "@/constants/filterConstants";
import type {
  IMcqFilterCriteria,
  ITimeFilterCriteria,
} from "@/types/filter";
import type { ISummaryIndex, ISummaryIndexEntry } from "@/types/summaryIndex";

/**
 * Pure evaluation engine applying compound chronological and MCQ criteria in-memory.
 */
export class FilterEngineService {
  private static readonly _DATE_DELIMITER = "-";
  private static readonly _RADIX_TEN = 10;

  public constructor() {}

  /**
   * Evaluates summary index entries against chronological and MCQ filters.
   */
  public filter(
    entries: ISummaryIndex,
    timeFilter: ITimeFilterCriteria,
    mcqFilter: IMcqFilterCriteria,
  ): ISummaryIndex {
    return entries.filter(
      (entry) =>
        this._matchesTime(entry, timeFilter) &&
        this._matchesMcq(entry, mcqFilter),
    );
  }

  /**
   * Checks whether an entry falls within the selected years and months.
   */
  private _matchesTime(
    entry: ISummaryIndexEntry,
    criteria: ITimeFilterCriteria,
  ): boolean {
    const { years, months } = criteria;
    if (years.length === 0 && months.length === 0) {
      return true;
    }

    const segments = entry.date.split(FilterEngineService._DATE_DELIMITER);
    const entryYear = Number.parseInt(
      segments[0] || "0",
      FilterEngineService._RADIX_TEN,
    );
    const entryMonth = Number.parseInt(
      segments[1] || "1",
      FilterEngineService._RADIX_TEN,
    );

    if (years.length > 0 && !years.includes(entryYear)) {
      return false;
    }
    if (months.length > 0 && !months.includes(entryMonth)) {
      return false;
    }
    return true;
  }

  /**
   * Checks whether an entry meets MCQ requirements given the active mode (AND/OR).
   */
  private _matchesMcq(
    entry: ISummaryIndexEntry,
    criteria: IMcqFilterCriteria,
  ): boolean {
    const activeEntries = Object.entries(criteria.selections).filter(
      ([, values]) => Boolean(values && values.length > 0),
    );
    if (activeEntries.length === 0) {
      return true;
    }

    if (criteria.mode === FILTER_MODE_AND) {
      return this._matchMcqAnd(entry, activeEntries);
    }
    return this._matchMcqOr(entry, activeEntries);
  }

  /**
   * Requires entry responses to satisfy all active question selections.
   */
  private _matchMcqAnd(
    entry: ISummaryIndexEntry,
    activeEntries: [string, string[]][],
  ): boolean {
    return activeEntries.every(([questionId, targetValues]) =>
      this._entryMatchesQuestion(entry, questionId, targetValues),
    );
  }

  /**
   * Requires entry responses to satisfy at least one active question selection.
   */
  private _matchMcqOr(
    entry: ISummaryIndexEntry,
    activeEntries: [string, string[]][],
  ): boolean {
    return activeEntries.some(([questionId, targetValues]) =>
      this._entryMatchesQuestion(entry, questionId, targetValues),
    );
  }

  /**
   * Determines if an entry's response for a question intersects with the target criteria.
   */
  private _entryMatchesQuestion(
    entry: ISummaryIndexEntry,
    questionId: string,
    targetValues: string[],
  ): boolean {
    const response = entry.mcq_responses[questionId];
    if (response === undefined || response === null) {
      return false;
    }
    if (Array.isArray(response)) {
      return response.some((val) => targetValues.includes(val));
    }
    return targetValues.includes(response);
  }
}

export default FilterEngineService;
