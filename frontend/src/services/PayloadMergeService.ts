import type {
  ICustomQuestionAddition,
  IDailyPayload,
} from "@/types/dailyPayload";
import type { IEnvironmentalData } from "@/types/environmental";

/**
 * Service encapsulating shallow-merge logic between daytime and nighttime log entries.
 */
export class PayloadMergeService {
  /**
   * Initializes the PayloadMergeService.
   */
  constructor() {
    // Stateless merge utility
  }

  /**
   * Merges an existing daily payload with an updated partial draft.
   *
   * @param existingPayload - Full payload already stored on Google Drive.
   * @param newDraft - New partial log draft submitted by the user.
   */
  public merge(
    existingPayload: IDailyPayload,
    newDraft: Partial<IDailyPayload>,
  ): IDailyPayload {
    const mergedDate = newDraft.date ?? existingPayload.date;
    const mergedLocation = newDraft.location ?? existingPayload.location;
    const mergedEnv = this._resolveEnvironmentalData(
      existingPayload.environmental_data,
      newDraft.environmental_data,
    );
    const mergedResponses = this._mergeStandardResponses(
      existingPayload.standard_responses,
      newDraft.standard_responses ?? {},
    );
    const existingCustom =
      existingPayload.custom_additions?.custom_questions ?? [];
    const updateCustom = newDraft.custom_additions?.custom_questions ?? [];
    const mergedCustomQuestions = this._mergeCustomAdditions(
      existingCustom,
      updateCustom,
    );
    const mergedNotes =
      newDraft.free_form_notes !== undefined
        ? newDraft.free_form_notes
        : existingPayload.free_form_notes;

    return {
      date: mergedDate,
      location: mergedLocation,
      environmental_data: mergedEnv,
      standard_responses: mergedResponses,
      custom_additions: { custom_questions: mergedCustomQuestions },
      free_form_notes: mergedNotes,
    };
  }

  private _resolveEnvironmentalData(
    existing: IEnvironmentalData | null,
    update: IEnvironmentalData | null | undefined,
  ): IEnvironmentalData | null {
    if (update !== undefined && update !== null) {
      return update;
    }
    return existing;
  }

  private _mergeStandardResponses(
    existing: Record<string, string | string[]>,
    update: Record<string, string | string[]>,
  ): Record<string, string | string[]> {
    return {
      ...existing,
      ...update,
    };
  }

  private _mergeCustomAdditions(
    existing: ICustomQuestionAddition[],
    update: ICustomQuestionAddition[],
  ): ICustomQuestionAddition[] {
    const updatedMap = new Map<string, ICustomQuestionAddition>();
    for (const item of update) {
      updatedMap.set(item.question, item);
    }

    const result: ICustomQuestionAddition[] = [];
    const processedQuestions = new Set<string>();

    for (const item of existing) {
      if (updatedMap.has(item.question)) {
        result.push(updatedMap.get(item.question)!);
        processedQuestions.add(item.question);
      } else {
        result.push(item);
      }
    }

    for (const item of update) {
      if (!processedQuestions.has(item.question)) {
        result.push(item);
      }
    }

    return result;
  }
}

