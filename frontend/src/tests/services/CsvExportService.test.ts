import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CsvExportService } from "@/services/CsvExportService";
import type { ISummaryIndex } from "@/types/summaryIndex";

describe("CsvExportService", () => {
  let service: CsvExportService;

  beforeEach(() => {
    service = new CsvExportService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle empty index gracefully and return empty string", () => {
    const result = service.generateCsv([]);
    expect(result).toBe("");
  });

  it("should extract MCQ response keys as Title Case column headers", () => {
    const mockIndex: ISummaryIndex = [
      {
        date: "2026-11-10",
        location: "Mumbai",
        weather_summary: "30C, Clear",
        aqi_summary: "Moderate",
        custom_entries_exist: false,
        mcq_responses: {
          energy_level: "High",
          interacted_with: ["Family", "Friends"],
        },
      },
    ];

    const csv = service.generateCsv(mockIndex);
    const lines = csv.split("\r\n");
    expect(lines.length).toBe(2);

    const headers = lines[0];
    expect(headers).toContain("Date,Location,Weather Summary,AQI Summary,Custom Entries Exist");
    expect(headers).toContain("Energy Level");
    expect(headers).toContain("Interacted With");
  });

  it("should properly escape commas, double quotes, and newlines in values (RFC-4180)", () => {
    const mockIndex: ISummaryIndex = [
      {
        date: "2026-11-12",
        location: 'New York, "Downtown"',
        weather_summary: "Rainy\nWindy",
        aqi_summary: "Good",
        custom_entries_exist: true,
        mcq_responses: {
          energy_level: 'Very "High"',
        },
      },
    ];

    const csv = service.generateCsv(mockIndex);
    const lines = csv.split("\r\n");

    expect(lines[0]).toContain("Date");
    // Escaped location should have quotes around it and escaped quotes inside
    expect(csv).toContain('"New York, ""Downtown"""');
    // Escaped weather summary should have quotes around multiline text
    expect(csv).toContain('"Rainy\nWindy"');
    // Escaped energy level
    expect(csv).toContain('"Very ""High"""');
    // Custom entries exist boolean mapped to Yes
    expect(csv).toContain("Yes");
  });

  it("should trigger browser download using blob and anchor element", () => {
    const mockIndex: ISummaryIndex = [
      {
        date: "2026-11-14",
        location: "Tokyo",
        weather_summary: null,
        aqi_summary: null,
        custom_entries_exist: false,
        mcq_responses: {},
      },
    ];

    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    const realAnchor = document.createElement("a");
    const clickMock = vi.fn();
    realAnchor.click = clickMock;

    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return realAnchor;
      }
      return document.createElement(tagName);
    });

    service.downloadCsv(mockIndex);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
  });
});
