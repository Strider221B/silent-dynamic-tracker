import { useMemo } from "react";
import DayDetailModal from "@/components/history/DayDetailModal";
import EnvironmentalEditModal from "@/components/history/EnvironmentalEditModal";
import FilterBar from "@/components/history/FilterBar";
import TimelineView from "@/components/history/TimelineView";
import { useDayDetail } from "@/hooks/useDayDetail";
import { useDriveSync } from "@/hooks/useDriveSync";
import { useHistoryFilter } from "@/hooks/useHistoryFilter";
import type { IStandardQuestion } from "@/types/config";
import styles from "./HistoryDashboard.module.css";

const DASHBOARD_TITLE = "History Timeline" as const;

/**
 * Historical logs dashboard orchestrating compound filters, timeline grouping, and day inspections.
 */
export function HistoryDashboard() {
  const {
    summaryIndex,
    config,
    driveService,
    logsFolderId,
    appFolderId,
    saveSummaryIndex,
  } = useDriveSync();

  const entries = useMemo(() => summaryIndex ?? [], [summaryIndex]);

  const {
    selectedYears,
    selectedMonths,
    mcqSelections,
    matchMode,
    groupedTimeline,
    availableYearsAndMonths,
    hasActiveFilters,
    setTimeFilter,
    toggleMcqFilter,
    setMatchMode,
    resetFilters,
  } = useHistoryFilter({ entries });

  const {
    activeEntryDate,
    activePayload,
    isLoadingPayload,
    payloadError,
    isEditingEnvironmental,
    isSavingEnvironmental,
    openDayDetail,
    closeDayDetail,
    openEnvironmentalEdit,
    closeEnvironmentalEdit,
    saveEnvironmentalEdit,
  } = useDayDetail({
    driveService,
    logsFolderId,
    appFolderId,
    summaryIndex,
    saveSummaryIndex,
  });

  const mcqQuestions = useMemo((): IStandardQuestion[] => {
    if (!config) {
      return [];
    }
    return [
      ...config.standard_questions,
      ...(config.custom_saved_questions || []),
    ];
  }, [config]);

  const subtitleText = `${entries.length} entries recorded`;

  return (
    <main className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.mainTitle}>{DASHBOARD_TITLE}</h1>
          <span className={styles.subtitle}>{subtitleText}</span>
        </div>
      </header>

      <FilterBar
        availableYearsAndMonths={availableYearsAndMonths}
        selectedYears={selectedYears}
        selectedMonths={selectedMonths}
        mcqQuestions={mcqQuestions}
        mcqSelections={mcqSelections}
        matchMode={matchMode}
        hasActiveFilters={hasActiveFilters}
        onTimeChange={setTimeFilter}
        onMcqToggle={toggleMcqFilter}
        onModeChange={setMatchMode}
        onReset={resetFilters}
      />

      <TimelineView
        yearGroups={groupedTimeline}
        onSelectEntry={openDayDetail}
      />

      <DayDetailModal
        isOpen={Boolean(activeEntryDate)}
        date={activeEntryDate}
        payload={activePayload}
        isLoading={isLoadingPayload}
        error={payloadError}
        onClose={closeDayDetail}
        onEditEnvironmental={openEnvironmentalEdit}
      />

      <EnvironmentalEditModal
        isOpen={isEditingEnvironmental}
        initialData={activePayload?.environmental_data ?? null}
        onSave={saveEnvironmentalEdit}
        onClose={closeEnvironmentalEdit}
        isSaving={isSavingEnvironmental}
      />
    </main>
  );
}

export default HistoryDashboard;
