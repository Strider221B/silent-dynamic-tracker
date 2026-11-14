/**
 * Checklist selection types, thresholds, and UI display strings.
 */
export const QUESTION_TYPE_SELECT_ONE = "select_one" as const;
export const QUESTION_TYPE_SELECT_MULTIPLE = "select_multiple" as const;

export const MIDNIGHT_START_HOUR = 0 as const;
export const MIDNIGHT_END_HOUR = 5 as const;

export const MIN_TOUCH_TARGET_SIZE_PX = 48 as const;

export const SAVE_BUTTON_TEXT = "Save Log" as const;
export const SAVING_BUTTON_TEXT = "Saving..." as const;

export const LOCATION_LABEL = "Location" as const;
export const LOCATION_PLACEHOLDER =
  "Enter city/location (e.g. Mumbai, India)" as const;

export const NOTES_LABEL = "Free-Form Notes" as const;
export const NOTES_PLACEHOLDER =
  "Optional thoughts or reflections..." as const;

export const QUICK_ADD_BUTTON_TEXT = "Add" as const;
export const QUICK_ADD_PLACEHOLDER = "Add custom option..." as const;
export const SAVE_PERMANENT_LABEL = "Save permanently" as const;

export const MIDNIGHT_MODAL_TITLE = "Late Night Logging" as const;
export const MIDNIGHT_MODAL_SUBTITLE =
  "It's late night (12 AM - 5 AM). Are you logging for Yesterday or Today?" as const;
export const CONFIRM_YESTERDAY_TEXT = "Yesterday" as const;
export const CONFIRM_TODAY_TEXT = "Today" as const;
export const OVERRIDE_DATE_LABEL = "Or pick specific date:" as const;

export const WEATHER_UNAVAILABLE_PAST_DATE_TOAST =
  "Weather unavailable for past dates. You can add it manually." as const;
export const WEATHER_FETCH_FAILED_TOAST =
  "Weather data unavailable. You can add it manually." as const;
export const SAVE_SUCCESS_TOAST = "Log saved successfully." as const;
export const SAVE_FAILED_TOAST = "Failed to save log." as const;
