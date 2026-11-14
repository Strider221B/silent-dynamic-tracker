import type { DriveService } from "@/services/DriveService";
import type { PayloadMergeService } from "@/services/PayloadMergeService";
import type { SessionStateService } from "@/services/SessionStateService";
import type { WeatherService } from "@/services/WeatherService";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { IEnvironmentalData } from "@/types/environmental";
import type {
  ISummaryIndex,
  ISummaryIndexEntry,
} from "@/types/summaryIndex";

/**
 * Orchestrator coordinating weather enrichment, Drive commits, and index upsert.
 */
export class SaveLogOrchestrator {
  private static readonly _EMPTY_STRING: string = "";
  private static readonly _COMMA_SEPARATOR: string = ", ";

  private readonly _driveService: DriveService;
  private readonly _weatherService: WeatherService;
  private readonly _mergeService: PayloadMergeService;
  private readonly _sessionState: SessionStateService;

  /**
   * Initializes SaveLogOrchestrator with injected service dependencies.
   */
  constructor(
    driveService: DriveService,
    weatherService: WeatherService,
    mergeService: PayloadMergeService,
    sessionState: SessionStateService,
  ) {
    this._driveService = driveService;
    this._weatherService = weatherService;
    this._mergeService = mergeService;
    this._sessionState = sessionState;
  }

  /**
   * Executes the full log saving pipeline.
   */
  public async executeSave(
    targetDate: string,
    location: string,
    logsFolderId: string,
    currentSummaryIndex: ISummaryIndex,
    appFolderId?: string,
  ): Promise<{ updatedIndex: ISummaryIndex }> {
    const envData = await this._weatherService.fetchEnvironmentalData(
      location,
      targetDate,
    );
    const draft = this._sessionState.getDraftPayload();
    const newPayload = this._buildDailyPayload(
      targetDate,
      location,
      envData,
      draft,
    );
    const finalPayload = await this._resolveFinalPayload(
      targetDate,
      logsFolderId,
      newPayload,
    );
    await this._driveService.writeDailyPayload(
      targetDate,
      logsFolderId,
      finalPayload,
    );
    const updatedIndex = await this._commitSummaryIndex(
      targetDate,
      location,
      envData,
      finalPayload,
      currentSummaryIndex,
      appFolderId,
    );
    return { updatedIndex };
  }

  /**
   * Combines draft session fields with target metadata into a daily payload.
   */
  private _buildDailyPayload(
    targetDate: string,
    location: string,
    envData: IEnvironmentalData | null,
    draft: Partial<IDailyPayload>,
  ): IDailyPayload {
    return {
      date: targetDate,
      location,
      environmental_data: envData,
      standard_responses: draft.standard_responses ?? {},
      custom_additions: draft.custom_additions ?? { custom_questions: [] },
      free_form_notes: draft.free_form_notes ?? SaveLogOrchestrator._EMPTY_STRING,
    };
  }

  /**
   * Merges with existing payload if present on Drive, or uses new payload.
   */
  private async _resolveFinalPayload(
    targetDate: string,
    logsFolderId: string,
    newPayload: IDailyPayload,
  ): Promise<IDailyPayload> {
    const existing = await this._driveService.readDailyPayload(
      targetDate,
      logsFolderId,
    );
    if (!existing) {
      return newPayload;
    }
    return this._mergeService.merge(existing, newPayload);
  }

  /**
   * Generates summary index entry, upserts into index, and persists to Drive.
   */
  private async _commitSummaryIndex(
    targetDate: string,
    location: string,
    envData: IEnvironmentalData | null,
    finalPayload: IDailyPayload,
    currentSummaryIndex: ISummaryIndex,
    appFolderId?: string,
  ): Promise<ISummaryIndex> {
    const hasCustom =
      this._sessionState.hasCustomEntries() ||
      finalPayload.free_form_notes.trim().length > 0 ||
      (finalPayload.custom_additions?.custom_questions?.length ?? 0) > 0;

    const entry = this._createIndexEntry(
      targetDate,
      location,
      envData,
      finalPayload.standard_responses,
      hasCustom,
    );

    const updatedIndex = this._upsertSummaryIndex(currentSummaryIndex, entry);
    const resolvedAppFolderId =
      appFolderId ?? (await this._driveService.ensureAppFolder());
    await this._driveService.writeSummaryIndexFile(
      resolvedAppFolderId,
      updatedIndex,
    );
    return updatedIndex;
  }

  /**
   * Formats a concise human-readable weather summary string.
   */
  private _formatWeatherSummary(
    envData: IEnvironmentalData | null,
  ): string | null {
    if (!envData) {
      return null;
    }
    const { temperature, condition } = envData;
    if (temperature && condition) {
      return `${temperature}${SaveLogOrchestrator._COMMA_SEPARATOR}${condition}`;
    }
    return temperature || condition || null;
  }

  /**
   * Constructs a summary index entry for the given day.
   */
  private _createIndexEntry(
    date: string,
    location: string,
    envData: IEnvironmentalData | null,
    mcqResponses: Record<string, string | string[]>,
    hasCustom: boolean,
  ): ISummaryIndexEntry {
    return {
      date,
      location,
      weather_summary: this._formatWeatherSummary(envData),
      aqi_summary: envData?.aqi ?? null,
      mcq_responses: { ...mcqResponses },
      custom_entries_exist: hasCustom,
    };
  }

  /**
   * Upserts the daily index entry into the summary index list.
   */
  private _upsertSummaryIndex(
    existingIndex: ISummaryIndex,
    newEntry: ISummaryIndexEntry,
  ): ISummaryIndex {
    const indexCopy = [...existingIndex];
    const matchIdx = indexCopy.findIndex((item) => item.date === newEntry.date);
    if (matchIdx >= 0) {
      indexCopy[matchIdx] = newEntry;
    } else {
      indexCopy.push(newEntry);
    }
    return indexCopy;
  }
}
