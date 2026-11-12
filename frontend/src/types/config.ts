/**
 * Supported checklist question selection types.
 */
export type QuestionType = "select_one" | "select_multiple";

/**
 * Standard checklist question schema stored in config.json.
 */
export interface IStandardQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options: string[];
  default: string | string[];
}

/**
 * Permanently saved custom checklist question schema stored in config.json.
 */
export type ISavedCustomQuestion = IStandardQuestion;

/**
 * Master application configuration schema (config.json).
 */
export interface IAppConfig {
  version: string;
  standard_questions: IStandardQuestion[];
  custom_saved_questions: ISavedCustomQuestion[];
}

