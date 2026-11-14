import { useCallback, useEffect, useMemo, useState } from "react";
import { useDriveSync } from "@/hooks/useDriveSync";
import { PayloadMergeService } from "@/services/PayloadMergeService";
import { SaveLogOrchestrator } from "@/services/SaveLogOrchestrator";
import { SessionStateService } from "@/services/SessionStateService";
import { WeatherService } from "@/services/WeatherService";
import type { IAppConfig, IStandardQuestion } from "@/types/config";

export interface IUseChecklistOptions {
  targetDate?: string;
  sessionState?: SessionStateService;
  saveOrchestrator?: SaveLogOrchestrator;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export interface IUseChecklistReturn {
  responses: Record<string, string | string[]>;
  temporaryOptions: Record<string, string[]>;
  location: string;
  notes: string;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  handleSelectOption: (
    questionId: string,
    option: string,
    isMultiple: boolean,
  ) => void;
  handleQuickAdd: (questionId: string, option: string) => void;
  handleSaveOptionPermanently: (
    questionId: string,
    option: string,
  ) => Promise<void>;
  handleSaveLog: () => Promise<void>;
  setLocation: (location: string) => void;
  setNotes: (notes: string) => void;
}

const EMPTY_LOCATION = "" as const;
const EMPTY_NOTES = "" as const;
const NO_LOGS_FOLDER_ERROR = "Cannot save: logs folder is not ready." as const;

/**
 * Custom hook encapsulating checklist interaction, state drafting, and saving.
 */
export function useChecklist(
  options: IUseChecklistOptions = {},
): IUseChecklistReturn {
  const {
    targetDate = new Date().toISOString().slice(0, 10),
    sessionState: customSessionState,
    saveOrchestrator: customOrchestrator,
    onSaveSuccess,
    onSaveError,
  } = options;

  const {
    config,
    summaryIndex,
    logsFolderId,
    appFolderId,
    driveService,
    saveConfig,
    saveSummaryIndex,
  } = useDriveSync();

  const sessionState = useMemo(
    () => customSessionState ?? new SessionStateService(),
    [customSessionState],
  );

  const saveOrchestrator = useMemo(
    () =>
      customOrchestrator ??
      new SaveLogOrchestrator(
        driveService,
        new WeatherService(),
        new PayloadMergeService(),
        sessionState,
      ),
    [customOrchestrator, driveService, sessionState],
  );

  const [responses, setResponses] = useState<
    Record<string, string | string[]>
  >({});
  const [temporaryOptions, setTemporaryOptions] = useState<
    Record<string, string[]>
  >({});
  const [location, setLocationState] = useState<string>(EMPTY_LOCATION);
  const [notes, setNotesState] = useState<string>(EMPTY_NOTES);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      sessionState.initDraft(config, targetDate);
      const initialResponses: Record<string, string | string[]> = {};
      const allQuestions = [
        ...config.standard_questions,
        ...(config.custom_saved_questions || []),
      ];
      for (const q of allQuestions) {
        initialResponses[q.id] = Array.isArray(q.default)
          ? [...q.default]
          : q.default;
      }
      setResponses(initialResponses);
    }
  }, [config, sessionState, targetDate]);

  const setLocation = useCallback(
    (loc: string): void => {
      setLocationState(loc);
      sessionState.setLocation(loc);
    },
    [sessionState],
  );

  const setNotes = useCallback(
    (n: string): void => {
      setNotesState(n);
      sessionState.setNotes(n);
    },
    [sessionState],
  );

  const handleSelectOption = useCallback(
    (questionId: string, option: string, isMultiple: boolean): void => {
      setResponses((prev) => {
        let updated: string | string[];
        if (isMultiple) {
          const currentArr = Array.isArray(prev[questionId])
            ? (prev[questionId] as string[])
            : [];
          updated = currentArr.includes(option)
            ? currentArr.filter((item) => item !== option)
            : [...currentArr, option];
        } else {
          updated = option;
        }
        sessionState.setResponse(questionId, updated);
        return { ...prev, [questionId]: updated };
      });
    },
    [sessionState],
  );

  const handleQuickAdd = useCallback(
    (questionId: string, option: string): void => {
      sessionState.addTemporaryOption(questionId, option);
      const updated = sessionState.getTemporaryOptions(questionId);
      setTemporaryOptions((prev) => ({ ...prev, [questionId]: updated }));
    },
    [sessionState],
  );

  const handleSaveOptionPermanently = useCallback(
    async (questionId: string, option: string): Promise<void> => {
      if (!config) {
        return;
      }
      const updatedConfig: IAppConfig = {
        ...config,
        standard_questions: config.standard_questions.map((q) =>
          q.id === questionId && !q.options.includes(option)
            ? { ...q, options: [...q.options, option] }
            : q,
        ),
        custom_saved_questions: (config.custom_saved_questions || []).map(
          (q: IStandardQuestion) =>
            q.id === questionId && !q.options.includes(option)
              ? { ...q, options: [...q.options, option] }
              : q,
        ),
      };
      await saveConfig(updatedConfig);
    },
    [config, saveConfig],
  );

  const handleSaveLog = useCallback(async (): Promise<void> => {
    if (!logsFolderId) {
      const err = new Error(NO_LOGS_FOLDER_ERROR);
      setSaveError(NO_LOGS_FOLDER_ERROR);
      onSaveError?.(err);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const { updatedIndex } = await saveOrchestrator.executeSave(
        targetDate,
        location,
        logsFolderId,
        summaryIndex || [],
        appFolderId || undefined,
      );
      await saveSummaryIndex(updatedIndex);
      setSaveSuccess(true);
      onSaveSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setSaveError(error.message);
      onSaveError?.(error);
    } finally {
      setIsSaving(false);
    }
  }, [
    logsFolderId,
    saveOrchestrator,
    targetDate,
    location,
    summaryIndex,
    appFolderId,
    saveSummaryIndex,
    onSaveSuccess,
    onSaveError,
  ]);

  return {
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
  };
}

export default useChecklist;
