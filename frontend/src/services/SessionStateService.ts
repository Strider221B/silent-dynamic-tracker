import type { IAppConfig } from "@/types/config";
import type {
  ICustomQuestionAddition,
  IDailyPayload,
} from "@/types/dailyPayload";

/**
 * Service managing in-memory logging draft state for the current session.
 */
export class SessionStateService {
  private static readonly _EMPTY_STRING: string = "";

  private _date: string = SessionStateService._EMPTY_STRING;
  private _location: string = SessionStateService._EMPTY_STRING;
  private _notes: string = SessionStateService._EMPTY_STRING;
  private _responses: Record<string, string | string[]> = {};
  private _temporaryOptions: Map<string, string[]> = new Map();
  private _config: IAppConfig | null = null;

  /**
   * Initializes SessionStateService with optional initial app config.
   */
  constructor(config?: IAppConfig) {
    if (config) {
      this.initDraft(config, SessionStateService._EMPTY_STRING);
    }
  }

  /**
   * Initializes or re-initializes draft state with question defaults from schema.
   */
  public initDraft(config: IAppConfig, defaultDate: string): void {
    this._config = config;
    this._date = defaultDate;
    this._location = SessionStateService._EMPTY_STRING;
    this._notes = SessionStateService._EMPTY_STRING;
    this._responses = {};
    this._temporaryOptions.clear();

    const allQuestions = [
      ...config.standard_questions,
      ...(config.custom_saved_questions || []),
    ];

    for (const q of allQuestions) {
      this._responses[q.id] = Array.isArray(q.default)
        ? [...q.default]
        : q.default;
    }
  }

  /**
   * Sets response value for a given question.
   */
  public setResponse(questionId: string, value: string | string[]): void {
    this._responses[questionId] = Array.isArray(value) ? [...value] : value;
  }

  /**
   * Appends an in-memory temporary option for a question.
   */
  public addTemporaryOption(questionId: string, option: string): void {
    const trimmed = option.trim();
    if (!trimmed) {
      return;
    }

    const currentList = this._temporaryOptions.get(questionId) || [];
    if (!currentList.includes(trimmed)) {
      this._temporaryOptions.set(questionId, [...currentList, trimmed]);
    }
  }

  /**
   * Retrieves temporary options defined for a question.
   */
  public getTemporaryOptions(questionId: string): string[] {
    const list = this._temporaryOptions.get(questionId);
    return list ? [...list] : [];
  }

  /**
   * Updates location string in memory.
   */
  public setLocation(location: string): void {
    this._location = location;
  }

  /**
   * Updates free-form notes in memory.
   */
  public setNotes(notes: string): void {
    this._notes = notes;
  }

  /**
   * Updates target date in memory.
   */
  public setDate(date: string): void {
    this._date = date;
  }

  /**
   * Checks whether notes are present or any temporary option was selected.
   */
  public hasCustomEntries(): boolean {
    if (this._notes.trim().length > 0) {
      return true;
    }

    for (const [qId, tempOpts] of this._temporaryOptions.entries()) {
      const resp = this._responses[qId];
      if (this._isAnyOptionSelected(resp, tempOpts)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Builds and returns a snapshot of the current daily payload draft.
   */
  public getDraftPayload(): Partial<IDailyPayload> {
    return this._cloneDraft();
  }

  /**
   * Resets all in-memory session draft fields.
   */
  public reset(): void {
    this._date = SessionStateService._EMPTY_STRING;
    this._location = SessionStateService._EMPTY_STRING;
    this._notes = SessionStateService._EMPTY_STRING;
    this._responses = {};
    this._temporaryOptions.clear();
    this._config = null;
  }

  /**
   * Deep-clones the in-memory draft state into a payload structure.
   */
  private _cloneDraft(): Partial<IDailyPayload> {
    const responsesCopy: Record<string, string | string[]> = {};
    for (const [key, val] of Object.entries(this._responses)) {
      responsesCopy[key] = Array.isArray(val) ? [...val] : val;
    }

    return {
      date: this._date,
      location: this._location,
      standard_responses: responsesCopy,
      free_form_notes: this._notes,
      custom_additions: {
        custom_questions: this._buildCustomAdditions(),
      },
    };
  }

  /**
   * Formulates custom question addition entries for selected temporary options.
   */
  private _buildCustomAdditions(): ICustomQuestionAddition[] {
    const additions: ICustomQuestionAddition[] = [];
    if (!this._config) {
      return additions;
    }

    for (const [qId, tempOpts] of this._temporaryOptions.entries()) {
      const resp = this._responses[qId];
      const selectedTemp = tempOpts.filter((opt) =>
        this._isOptionSelected(resp, opt),
      );
      if (selectedTemp.length > 0) {
        additions.push({
          question: qId,
          type: Array.isArray(resp) ? "select_multiple" : "select_one",
          selections: selectedTemp,
        });
      }
    }
    return additions;
  }

  /**
   * Evaluates if a given option is selected in the question response.
   */
  private _isOptionSelected(
    resp: string | string[] | undefined,
    opt: string,
  ): boolean {
    if (!resp) {
      return false;
    }
    return Array.isArray(resp) ? resp.includes(opt) : resp === opt;
  }

  /**
   * Evaluates if any of the candidate options are selected in the response.
   */
  private _isAnyOptionSelected(
    resp: string | string[] | undefined,
    candidates: string[],
  ): boolean {
    return candidates.some((opt) => this._isOptionSelected(resp, opt));
  }
}
