import { useCallback, useContext, useMemo, useState } from "react";
import { DriveSyncContext } from "@/context/DriveSyncContext";
import type { DriveService } from "@/services/DriveService";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { IEnvironmentalData } from "@/types/environmental";
import type { ISummaryIndex, ISummaryIndexEntry } from "@/types/summaryIndex";

export interface IUseDayDetailOptions {
  driveService?: DriveService;
  logsFolderId?: string | null;
  appFolderId?: string | null;
  summaryIndex?: ISummaryIndex | null;
  saveSummaryIndex?: (newIndex: ISummaryIndex) => Promise<void>;
}

export interface IUseDayDetailResult {
  activeEntryDate: string | null;
  activePayload: IDailyPayload | null;
  cachedPayloads: Record<string, IDailyPayload>;
  isLoadingPayload: boolean;
  payloadError: string | null;
  isEditingEnvironmental: boolean;
  isSavingEnvironmental: boolean;
  openDayDetail: (date: string) => Promise<void>;
  closeDayDetail: () => void;
  openEnvironmentalEdit: () => void;
  closeEnvironmentalEdit: () => void;
  saveEnvironmentalEdit: (data: IEnvironmentalData) => Promise<void>;
}

const MISSING_SERVICE_MSG =
  "Drive service or logs folder is not available." as const;
const LOG_NOT_FOUND_MSG = "Daily log file not found." as const;
const MANUAL_SOURCE = "manual" as const;
const COMMA_DELIMITER = ", " as const;

function formatWeatherSummary(data: IEnvironmentalData): string | null {
  const { temperature, condition } = data;
  if (temperature && condition) {
    return `${temperature}${COMMA_DELIMITER}${condition}`;
  }
  return temperature || condition || null;
}

function updateIndexWithEnvironmental(
  currentIndex: ISummaryIndex,
  date: string,
  payload: IDailyPayload,
  envData: IEnvironmentalData,
): ISummaryIndex {
  const weatherSummary = formatWeatherSummary(envData);
  const aqiSummary = envData.aqi ?? null;
  const matchIdx = currentIndex.findIndex((entry) => entry.date === date);

  if (matchIdx >= 0) {
    const copy = [...currentIndex];
    const existing = copy[matchIdx];
    if (existing) {
      copy[matchIdx] = {
        ...existing,
        weather_summary: weatherSummary,
        aqi_summary: aqiSummary,
      };
    }
    return copy;
  }

  const newEntry: ISummaryIndexEntry = {
    date,
    location: payload.location || "",
    weather_summary: weatherSummary,
    aqi_summary: aqiSummary,
    mcq_responses: payload.standard_responses || {},
    custom_entries_exist: false,
  };
  return [...currentIndex, newEntry];
}

/**
 * Custom hook managing lazy hydration of daily log payloads and manual environmental updates.
 */
export function useDayDetail(
  options?: IUseDayDetailOptions,
): IUseDayDetailResult {
  const context = useContext(DriveSyncContext);
  const driveService = options?.driveService ?? context?.driveService;
  const logsFolderId = options?.logsFolderId ?? context?.logsFolderId ?? null;
  const appFolderId = options?.appFolderId ?? context?.appFolderId ?? null;
  const summaryIndex = options?.summaryIndex ?? context?.summaryIndex ?? null;
  const saveSummaryIndex =
    options?.saveSummaryIndex ?? context?.saveSummaryIndex;

  const [activeEntryDate, setActiveEntryDate] = useState<string | null>(null);
  const [cachedPayloads, setCachedPayloads] = useState<
    Record<string, IDailyPayload>
  >({});
  const [isLoadingPayload, setIsLoadingPayload] = useState<boolean>(false);
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [isEditingEnvironmental, setIsEditingEnvironmental] =
    useState<boolean>(false);
  const [isSavingEnvironmental, setIsSavingEnvironmental] =
    useState<boolean>(false);

  const activePayload = useMemo(
    () => (activeEntryDate ? cachedPayloads[activeEntryDate] ?? null : null),
    [activeEntryDate, cachedPayloads],
  );

  const openDayDetail = useCallback(
    async (date: string): Promise<void> => {
      setActiveEntryDate(date);
      setPayloadError(null);
      if (cachedPayloads[date]) {
        return;
      }
      if (!driveService || !logsFolderId) {
        setPayloadError(MISSING_SERVICE_MSG);
        return;
      }
      setIsLoadingPayload(true);
      try {
        const payload = await driveService.readDailyPayload(date, logsFolderId);
        if (payload) {
          setCachedPayloads((prev) => ({ ...prev, [date]: payload }));
        } else {
          setPayloadError(LOG_NOT_FOUND_MSG);
        }
      } catch (err) {
        setPayloadError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setIsLoadingPayload(false);
      }
    },
    [cachedPayloads, driveService, logsFolderId],
  );

  const closeDayDetail = useCallback((): void => {
    setActiveEntryDate(null);
    setIsEditingEnvironmental(false);
    setPayloadError(null);
  }, []);

  const openEnvironmentalEdit = useCallback((): void => {
    setIsEditingEnvironmental(true);
  }, []);

  const closeEnvironmentalEdit = useCallback((): void => {
    setIsEditingEnvironmental(false);
  }, []);

  const saveEnvironmentalEdit = useCallback(
    async (data: IEnvironmentalData): Promise<void> => {
      if (!activeEntryDate || !driveService || !logsFolderId) {
        throw new Error(MISSING_SERVICE_MSG);
      }
      setIsSavingEnvironmental(true);
      try {
        const existing = cachedPayloads[activeEntryDate] ?? {
          date: activeEntryDate,
          location: "",
          environmental_data: null,
          standard_responses: {},
          custom_additions: { custom_questions: [] },
          free_form_notes: "",
        };
        const updatedEnv: IEnvironmentalData = { ...data, source: MANUAL_SOURCE };
        const updatedPayload: IDailyPayload = {
          ...existing,
          environmental_data: updatedEnv,
        };
        await driveService.writeDailyPayload(
          activeEntryDate,
          logsFolderId,
          updatedPayload,
        );
        setCachedPayloads((prev) => ({
          ...prev,
          [activeEntryDate]: updatedPayload,
        }));

        const updatedIndex = updateIndexWithEnvironmental(
          summaryIndex || [],
          activeEntryDate,
          updatedPayload,
          updatedEnv,
        );
        if (saveSummaryIndex) {
          await saveSummaryIndex(updatedIndex);
        } else if (appFolderId) {
          await driveService.writeSummaryIndexFile(appFolderId, updatedIndex);
        }
        setIsEditingEnvironmental(false);
      } finally {
        setIsSavingEnvironmental(false);
      }
    },
    [
      activeEntryDate,
      driveService,
      logsFolderId,
      cachedPayloads,
      summaryIndex,
      saveSummaryIndex,
      appFolderId,
    ],
  );

  return {
    activeEntryDate,
    activePayload,
    cachedPayloads,
    isLoadingPayload,
    payloadError,
    isEditingEnvironmental,
    isSavingEnvironmental,
    openDayDetail,
    closeDayDetail,
    openEnvironmentalEdit,
    closeEnvironmentalEdit,
    saveEnvironmentalEdit,
  };
}

export default useDayDetail;
