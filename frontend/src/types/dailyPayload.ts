import type { IEnvironmentalData } from "@/types/environmental";

/**
 * Session-only custom question addition inside a daily log payload.
 */
export interface ICustomQuestionAddition {
  question: string;
  type: string;
  selections: string[];
}

/**
 * Full daily log payload stored as logs/YYYY-MM-DD.json in Google Drive.
 */
export interface IDailyPayload {
  date: string;
  location: string;
  environmental_data: IEnvironmentalData | null;
  standard_responses: Record<string, string | string[]>;
  custom_additions: {
    custom_questions: ICustomQuestionAddition[];
  };
  free_form_notes: string;
}

