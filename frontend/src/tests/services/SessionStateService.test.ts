import { describe, expect, it } from "vitest";
import { SessionStateService } from "@/services/SessionStateService";
import type { IAppConfig } from "@/types/config";

const mockConfig: IAppConfig = {
  version: "1.0",
  standard_questions: [
    {
      id: "energy_level",
      question: "How was your energy?",
      type: "select_one",
      options: ["Low", "Moderate", "High"],
      default: "Moderate",
    },
    {
      id: "habits_completed",
      question: "Habits completed today?",
      type: "select_multiple",
      options: ["Exercise", "Read", "Meditate"],
      default: ["Exercise"],
    },
  ],
  custom_saved_questions: [
    {
      id: "custom_mood",
      question: "Mood?",
      type: "select_one",
      options: ["Calm", "Anxious"],
      default: "Calm",
    },
  ],
};

describe("SessionStateService", () => {
  it("should initialize draft state from config defaults", () => {
    const service = new SessionStateService(mockConfig);
    const draft = service.getDraftPayload();

    expect(draft.standard_responses).toEqual({
      energy_level: "Moderate",
      habits_completed: ["Exercise"],
      custom_mood: "Calm",
    });
    expect(service.hasCustomEntries()).toBe(false);
  });

  it("should update single select response, replacing previous choice", () => {
    const service = new SessionStateService();
    service.initDraft(mockConfig, "2026-11-14");
    service.setResponse("energy_level", "High");

    const draft = service.getDraftPayload();
    expect(draft.standard_responses?.energy_level).toBe("High");
  });

  it("should update multi-select response", () => {
    const service = new SessionStateService();
    service.initDraft(mockConfig, "2026-11-14");
    service.setResponse("habits_completed", ["Exercise", "Read"]);

    const draft = service.getDraftPayload();
    expect(draft.standard_responses?.habits_completed).toEqual([
      "Exercise",
      "Read",
    ]);
  });

  it("should append temporary option and retrieve it", () => {
    const service = new SessionStateService(mockConfig);
    service.addTemporaryOption("habits_completed", "Journaling");

    expect(service.getTemporaryOptions("habits_completed")).toEqual([
      "Journaling",
    ]);
    expect(service.getTemporaryOptions("unknown_question")).toEqual([]);

    // Should not add duplicates or whitespace-only
    service.addTemporaryOption("habits_completed", "Journaling");
    service.addTemporaryOption("habits_completed", "   ");
    expect(service.getTemporaryOptions("habits_completed")).toEqual([
      "Journaling",
    ]);
  });

  it("should report hasCustomEntries true when temporary option is selected", () => {
    const service = new SessionStateService(mockConfig);
    service.addTemporaryOption("energy_level", "Exhausted");

    // Before selection
    expect(service.hasCustomEntries()).toBe(false);

    // Select temporary option
    service.setResponse("energy_level", "Exhausted");
    expect(service.hasCustomEntries()).toBe(true);

    const draft = service.getDraftPayload();
    expect(draft.custom_additions?.custom_questions).toEqual([
      {
        question: "energy_level",
        type: "select_one",
        selections: ["Exhausted"],
      },
    ]);
  });

  it("should report hasCustomEntries true when multi-select includes temp option", () => {
    const service = new SessionStateService(mockConfig);
    service.addTemporaryOption("habits_completed", "Cold Plunge");
    service.setResponse("habits_completed", ["Exercise", "Cold Plunge"]);

    expect(service.hasCustomEntries()).toBe(true);
    const draft = service.getDraftPayload();
    expect(draft.custom_additions?.custom_questions).toEqual([
      {
        question: "habits_completed",
        type: "select_multiple",
        selections: ["Cold Plunge"],
      },
    ]);
  });

  it("should report hasCustomEntries true when free-form notes are present", () => {
    const service = new SessionStateService(mockConfig);
    expect(service.hasCustomEntries()).toBe(false);

    service.setNotes("Productive day");
    expect(service.hasCustomEntries()).toBe(true);
    expect(service.getDraftPayload().free_form_notes).toBe("Productive day");
  });

  it("should set and update location and date", () => {
    const service = new SessionStateService();
    service.setLocation("Tokyo, Japan");
    service.setDate("2026-11-15");

    const draft = service.getDraftPayload();
    expect(draft.location).toBe("Tokyo, Japan");
    expect(draft.date).toBe("2026-11-15");
  });

  it("should reset all fields cleanly", () => {
    const service = new SessionStateService(mockConfig);
    service.setLocation("London");
    service.setNotes("Notes");
    service.addTemporaryOption("energy_level", "Wired");

    service.reset();
    const draft = service.getDraftPayload();

    expect(draft.date).toBe("");
    expect(draft.location).toBe("");
    expect(draft.free_form_notes).toBe("");
    expect(draft.standard_responses).toEqual({});
    expect(draft.custom_additions?.custom_questions).toEqual([]);
    expect(service.hasCustomEntries()).toBe(false);
  });

  it("should handle hasCustomEntries when question response is undefined", () => {
    const service = new SessionStateService();
    // Add temp option to a question that has no response
    service.addTemporaryOption("unanswered_q", "Temp Option");
    expect(service.hasCustomEntries()).toBe(false);
  });
});
