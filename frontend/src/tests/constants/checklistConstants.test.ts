import { describe, expect, it } from "vitest";
import {
  CONFIRM_TODAY_TEXT,
  CONFIRM_YESTERDAY_TEXT,
  LOCATION_LABEL,
  LOCATION_PLACEHOLDER,
  MIDNIGHT_END_HOUR,
  MIDNIGHT_MODAL_SUBTITLE,
  MIDNIGHT_MODAL_TITLE,
  MIDNIGHT_START_HOUR,
  MIN_TOUCH_TARGET_SIZE_PX,
  NOTES_LABEL,
  NOTES_PLACEHOLDER,
  OVERRIDE_DATE_LABEL,
  QUESTION_TYPE_SELECT_MULTIPLE,
  QUESTION_TYPE_SELECT_ONE,
  QUICK_ADD_BUTTON_TEXT,
  QUICK_ADD_PLACEHOLDER,
  SAVE_BUTTON_TEXT,
  SAVE_FAILED_TOAST,
  SAVE_PERMANENT_LABEL,
  SAVE_SUCCESS_TOAST,
  SAVING_BUTTON_TEXT,
  WEATHER_FETCH_FAILED_TOAST,
  WEATHER_UNAVAILABLE_PAST_DATE_TOAST,
} from "@/constants/checklistConstants";

describe("checklistConstants", () => {
  it("should define question types, midnight hours, and minimum touch target size", () => {
    expect(QUESTION_TYPE_SELECT_ONE).toBe("select_one");
    expect(QUESTION_TYPE_SELECT_MULTIPLE).toBe("select_multiple");
    expect(MIDNIGHT_START_HOUR).toBe(0);
    expect(MIDNIGHT_END_HOUR).toBe(5);
    expect(MIN_TOUCH_TARGET_SIZE_PX).toBe(48);
  });

  it("should define button and input labels", () => {
    expect(SAVE_BUTTON_TEXT).toBe("Save Log");
    expect(SAVING_BUTTON_TEXT).toBe("Saving...");
    expect(LOCATION_LABEL).toBe("Location");
    expect(LOCATION_PLACEHOLDER).toContain("Mumbai");
    expect(NOTES_LABEL).toBe("Free-Form Notes");
    expect(NOTES_PLACEHOLDER).toContain("Optional thoughts");
    expect(QUICK_ADD_BUTTON_TEXT).toBe("Add");
    expect(QUICK_ADD_PLACEHOLDER).toBe("Add custom option...");
    expect(SAVE_PERMANENT_LABEL).toBe("Save permanently");
  });

  it("should define modal text and notification strings", () => {
    expect(MIDNIGHT_MODAL_TITLE).toBe("Late Night Logging");
    expect(MIDNIGHT_MODAL_SUBTITLE).toContain("12 AM - 5 AM");
    expect(CONFIRM_YESTERDAY_TEXT).toBe("Yesterday");
    expect(CONFIRM_TODAY_TEXT).toBe("Today");
    expect(OVERRIDE_DATE_LABEL).toBe("Or pick specific date:");
    expect(WEATHER_UNAVAILABLE_PAST_DATE_TOAST).toContain("past dates");
    expect(WEATHER_FETCH_FAILED_TOAST).toContain("Weather data unavailable");
    expect(SAVE_SUCCESS_TOAST).toBe("Log saved successfully.");
    expect(SAVE_FAILED_TOAST).toBe("Failed to save log.");
  });
});
