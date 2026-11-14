import { useCallback, useMemo, useState } from "react";
import FreeFormNotes from "@/components/checklist/FreeFormNotes";
import LocationInput from "@/components/checklist/LocationInput";
import MidnightRolloverModal from "@/components/checklist/MidnightRolloverModal";
import QuestionBlock from "@/components/checklist/QuestionBlock";
import SaveButton from "@/components/checklist/SaveButton";
import {
  SAVE_SUCCESS_TOAST,
} from "@/constants/checklistConstants";
import { useChecklist } from "@/hooks/useChecklist";
import { useDriveSync } from "@/hooks/useDriveSync";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { DateResolutionService } from "@/services/DateResolutionService";
import type { IStandardQuestion } from "@/types/config";
import styles from "./ChecklistDashboard.module.css";

const APP_TITLE = "Daily Tracker" as const;
const CHANGE_DATE_BUTTON_TEXT = "Change Date" as const;

/**
 * Mobile-first dashboard orchestrating checklist rendering, notes, location, and commit actions.
 */
export function ChecklistDashboard() {
  const { config } = useDriveSync();
  const dateService = useMemo(() => new DateResolutionService(), []);
  const todayStr = useMemo(() => dateService.getTodayDate(), [dateService]);
  const yesterdayStr = useMemo(
    () => dateService.getYesterdayDate(),
    [dateService],
  );

  const {
    selectedDate,
    showRolloverModal,
    confirmYesterday,
    confirmToday,
    overrideDate,
    dismissModal,
  } = useMidnightRollover({ dateService });

  const [isDateModalOpen, setIsDateModalOpen] = useState<boolean>(false);

  const {
    responses,
    temporaryOptions,
    location,
    notes,
    isSaving,
    saveError,
    saveSuccess,
    handleSelectOption,
    handleQuickAdd,
    handleSaveOptionPermanently,
    handleSaveLog,
    setLocation,
    setNotes,
  } = useChecklist({ targetDate: selectedDate });

  const allQuestions = useMemo((): IStandardQuestion[] => {
    if (!config) {
      return [];
    }
    return [
      ...config.standard_questions,
      ...(config.custom_saved_questions || []),
    ];
  }, [config]);

  const handleOpenDateModal = useCallback((): void => {
    setIsDateModalOpen(true);
  }, []);

  const handleCloseDateModal = useCallback((): void => {
    setIsDateModalOpen(false);
    dismissModal();
  }, [dismissModal]);

  const handleConfirmYesterday = useCallback((): void => {
    confirmYesterday();
    setIsDateModalOpen(false);
  }, [confirmYesterday]);

  const handleConfirmToday = useCallback((): void => {
    confirmToday();
    setIsDateModalOpen(false);
  }, [confirmToday]);

  const handleOverrideDate = useCallback(
    (customDate: string): void => {
      overrideDate(customDate);
      setIsDateModalOpen(false);
    },
    [overrideDate],
  );

  return (
    <main className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.mainTitle}>{APP_TITLE}</h1>
          <span className={styles.dateBadge}>{`Logging for: ${selectedDate}`}</span>
        </div>
        <button
          type="button"
          className={styles.changeDateButton}
          onClick={handleOpenDateModal}
        >
          {CHANGE_DATE_BUTTON_TEXT}
        </button>
      </header>

      {saveSuccess && (
        <aside className={styles.successBanner} role="status">
          {SAVE_SUCCESS_TOAST}
        </aside>
      )}

      {saveError && (
        <aside className={styles.errorBanner} role="alert">
          {saveError}
        </aside>
      )}

      {allQuestions.map((q) => (
        <QuestionBlock
          key={q.id}
          question={q}
          currentResponse={responses[q.id]}
          temporaryOptions={temporaryOptions[q.id]}
          onSelectOption={handleSelectOption}
          onQuickAdd={handleQuickAdd}
          onSavePermanent={handleSaveOptionPermanently}
        />
      ))}

      <LocationInput location={location} onChange={setLocation} />
      <FreeFormNotes notes={notes} onChange={setNotes} />
      <SaveButton onSave={handleSaveLog} isSaving={isSaving} />

      <MidnightRolloverModal
        isOpen={showRolloverModal || isDateModalOpen}
        yesterdayDateStr={yesterdayStr}
        todayDateStr={todayStr}
        onConfirmYesterday={handleConfirmYesterday}
        onConfirmToday={handleConfirmToday}
        onOverrideDate={handleOverrideDate}
        onDismiss={handleCloseDateModal}
      />
    </main>
  );
}

export default ChecklistDashboard;
