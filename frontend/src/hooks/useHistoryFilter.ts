import { useCallback, useMemo, useState } from "react";
import {
  FILTER_MODE_AND,
} from "@/constants/filterConstants";
import { FilterEngineService } from "@/services/FilterEngineService";
import { TimelineGroupingService } from "@/services/TimelineGroupingService";
import type { FilterMode } from "@/types/filter";
import type { ISummaryIndex, ISummaryIndexEntry } from "@/types/summaryIndex";
import type { ITimelineYearGroup } from "@/types/timeline";

export interface IUseHistoryFilterProps {
  entries: ISummaryIndex;
  filterEngine?: FilterEngineService;
  groupingService?: TimelineGroupingService;
}

export interface IUseHistoryFilterResult {
  selectedYears: number[];
  selectedMonths: number[];
  mcqSelections: Record<string, string[]>;
  matchMode: FilterMode;
  filteredEntries: ISummaryIndexEntry[];
  groupedTimeline: ITimelineYearGroup[];
  availableYearsAndMonths: Map<number, number[]>;
  hasActiveFilters: boolean;
  setTimeFilter: (years: number[], months: number[]) => void;
  toggleMcqFilter: (questionId: string, value: string) => void;
  setMatchMode: (mode: FilterMode) => void;
  resetFilters: () => void;
}

/**
 * Custom hook managing timeline filtering state, compound operators, and grouped rendering.
 */
export function useHistoryFilter({
  entries,
  filterEngine: customEngine,
  groupingService: customGrouping,
}: IUseHistoryFilterProps): IUseHistoryFilterResult {
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [mcqSelections, setMcqSelections] = useState<Record<string, string[]>>(
    {},
  );
  const [matchMode, setMatchModeState] = useState<FilterMode>(FILTER_MODE_AND);

  const engine = useMemo(
    () => customEngine ?? new FilterEngineService(),
    [customEngine],
  );
  const grouping = useMemo(
    () => customGrouping ?? new TimelineGroupingService(),
    [customGrouping],
  );

  const availableYearsAndMonths = useMemo(
    () => grouping.extractAvailableYearsAndMonths(entries),
    [entries, grouping],
  );

  const filteredEntries = useMemo(
    () =>
      engine.filter(
        entries,
        { years: selectedYears, months: selectedMonths },
        { selections: mcqSelections, mode: matchMode },
      ),
    [entries, engine, selectedYears, selectedMonths, mcqSelections, matchMode],
  );

  const groupedTimeline = useMemo(
    () => grouping.groupEntries(filteredEntries),
    [filteredEntries, grouping],
  );

  const hasActiveFilters = useMemo(
    () =>
      selectedYears.length > 0 ||
      selectedMonths.length > 0 ||
      Object.values(mcqSelections).some((vals) => vals.length > 0),
    [selectedYears, selectedMonths, mcqSelections],
  );

  const setTimeFilter = useCallback(
    (years: number[], months: number[]): void => {
      setSelectedYears(years);
      setSelectedMonths(months);
    },
    [],
  );

  const toggleMcqFilter = useCallback(
    (questionId: string, value: string): void => {
      setMcqSelections((prev) => {
        const currentVals = prev[questionId] || [];
        const nextVals = currentVals.includes(value)
          ? currentVals.filter((v) => v !== value)
          : [...currentVals, value];
        return {
          ...prev,
          [questionId]: nextVals,
        };
      });
    },
    [],
  );

  const setMatchMode = useCallback((mode: FilterMode): void => {
    setMatchModeState(mode);
  }, []);

  const resetFilters = useCallback((): void => {
    setSelectedYears([]);
    setSelectedMonths([]);
    setMcqSelections({});
    setMatchModeState(FILTER_MODE_AND);
  }, []);

  return {
    selectedYears,
    selectedMonths,
    mcqSelections,
    matchMode,
    filteredEntries,
    groupedTimeline,
    availableYearsAndMonths,
    hasActiveFilters,
    setTimeFilter,
    toggleMcqFilter,
    setMatchMode,
    resetFilters,
  };
}

export default useHistoryFilter;
