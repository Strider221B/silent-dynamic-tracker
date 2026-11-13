import { beforeEach, describe, expect, it } from "vitest";
import { PayloadMergeService } from "@/services/PayloadMergeService";
import type { IDailyPayload } from "@/types/dailyPayload";
import type { IEnvironmentalData } from "@/types/environmental";

describe("PayloadMergeService", () => {
  let merger: PayloadMergeService;
  let basePayload: IDailyPayload;

  beforeEach(() => {
    merger = new PayloadMergeService();
    basePayload = {
      date: "2026-11-12",
      location: "Mumbai",
      environmental_data: {
        temperature: "28°C",
        condition: "Clear",
        aqi: "Moderate",
        aqi_numeric: 2,
        pm25: 35.5,
        source: "api",
      },
      standard_responses: {
        energy_level: "High",
        habits_completed: ["Exercised", "Read"],
      },
      custom_additions: {
        custom_questions: [
          {
            question: "Daytime Feeling",
            type: "select_one",
            selections: ["Calm"],
          },
        ],
      },
      free_form_notes: "Morning walk done.",
    };
  });

  it("should preserve existing fields when draft does not provide updates", () => {
    const merged = merger.merge(basePayload, {});

    expect(merged.date).toBe("2026-11-12");
    expect(merged.location).toBe("Mumbai");
    expect(merged.environmental_data).toEqual(basePayload.environmental_data);
    expect(merged.standard_responses).toEqual(basePayload.standard_responses);
    expect(merged.free_form_notes).toBe("Morning walk done.");
  });

  it("should overwrite scalar fields (date, location) when updated in draft", () => {
    const merged = merger.merge(basePayload, {
      date: "2026-11-13",
      location: "Pune",
    });

    expect(merged.date).toBe("2026-11-13");
    expect(merged.location).toBe("Pune");
  });

  it("should overwrite updated standard responses while preserving untouched keys", () => {
    const merged = merger.merge(basePayload, {
      standard_responses: {
        energy_level: "Exhausted",
        evening_routine: "Done",
      },
    });

    expect(merged.standard_responses.energy_level).toBe("Exhausted");
    expect(merged.standard_responses.evening_routine).toBe("Done");
    expect(merged.standard_responses.habits_completed).toEqual([
      "Exercised",
      "Read",
    ]);
  });

  it("should replace free-form notes when draft provides new notes", () => {
    const merged = merger.merge(basePayload, {
      free_form_notes: "Evening update: Felt relaxed after dinner.",
    });

    expect(merged.free_form_notes).toBe(
      "Evening update: Felt relaxed after dinner.",
    );
  });

  it("should preserve environmental data when draft has null or undefined", () => {
    const mergedWithNull = merger.merge(basePayload, {
      environmental_data: null,
    });
    expect(mergedWithNull.environmental_data).toEqual(
      basePayload.environmental_data,
    );
  });

  it("should overwrite environmental data when draft provides new environmental data", () => {
    const newEnv: IEnvironmentalData = {
      temperature: "22°C",
      condition: "Cool",
      aqi: "Good",
      aqi_numeric: 1,
      source: "manual",
    };

    const merged = merger.merge(basePayload, {
      environmental_data: newEnv,
    });

    expect(merged.environmental_data).toEqual(newEnv);
  });

  it("should merge custom question additions: update existing, preserve untouched, append novel", () => {
    const draft = {
      custom_additions: {
        custom_questions: [
          {
            question: "Daytime Feeling",
            type: "select_one",
            selections: ["Grounded", "Calm"],
          },
          {
            question: "Evening Mood",
            type: "select_one",
            selections: ["Sleepy"],
          },
        ],
      },
    };

    const merged = merger.merge(basePayload, draft);
    expect(merged.custom_additions.custom_questions).toHaveLength(2);

    const feeling = merged.custom_additions.custom_questions.find(
      (q) => q.question === "Daytime Feeling",
    );
    expect(feeling?.selections).toEqual(["Grounded", "Calm"]);

    const mood = merged.custom_additions.custom_questions.find(
      (q) => q.question === "Evening Mood",
    );
    expect(mood?.selections).toEqual(["Sleepy"]);
  });

  it("should handle empty or undefined custom additions gracefully", () => {
    const emptyPayload: IDailyPayload = {
      date: "2026-11-12",
      location: "",
      environmental_data: null,
      standard_responses: {},
      custom_additions: { custom_questions: [] },
      free_form_notes: "",
    };

    const merged = merger.merge(emptyPayload, {});
    expect(merged.custom_additions.custom_questions).toEqual([]);
    expect(merged.environmental_data).toBeNull();
  });
});
