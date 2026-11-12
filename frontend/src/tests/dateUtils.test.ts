import { describe, expect, it } from "vitest";
import {
  formatDateToISO,
  getYesterdayDate,
  isMidnightWindow,
  parseISODate,
} from "@/utils/dateUtils";

describe("dateUtils", () => {
  describe("formatDateToISO", () => {
    it("should zero-pad single-digit months and days", () => {
      const date = new Date(2026, 0, 5, 14, 30);
      expect(formatDateToISO(date)).toBe("2026-01-05");
    });

    it("should format double-digit months and days accurately", () => {
      const date = new Date(2026, 10, 12, 23, 59);
      expect(formatDateToISO(date)).toBe("2026-11-12");
    });

    it("should throw an error for an invalid Date instance", () => {
      expect(() => formatDateToISO(new Date("invalid"))).toThrow("Invalid Date provided");
    });
  });

  describe("isMidnightWindow", () => {
    it("should return true at 00:00 and 04:59 boundaries", () => {
      expect(isMidnightWindow(new Date(2026, 10, 12, 0, 0))).toBe(true);
      expect(isMidnightWindow(new Date(2026, 10, 12, 4, 59))).toBe(true);
    });

    it("should return false at 05:00 and 23:59 boundaries", () => {
      expect(isMidnightWindow(new Date(2026, 10, 12, 5, 0))).toBe(false);
      expect(isMidnightWindow(new Date(2026, 10, 12, 23, 59))).toBe(false);
    });

    it("should throw an error for an invalid Date instance", () => {
      expect(() => isMidnightWindow(new Date(Number.NaN))).toThrow("Invalid Date provided");
    });
  });

  describe("getYesterdayDate", () => {
    it("should return the previous day within the same month", () => {
      const date = new Date(2026, 10, 12, 2, 15);
      expect(getYesterdayDate(date)).toBe("2026-11-11");
    });

    it("should handle month boundary rollover", () => {
      const marchFirst = new Date(2026, 2, 1, 1, 0);
      expect(getYesterdayDate(marchFirst)).toBe("2026-02-28");
    });

    it("should handle leap year month boundary rollover", () => {
      const leapMarchFirst = new Date(2024, 2, 1, 1, 0);
      expect(getYesterdayDate(leapMarchFirst)).toBe("2024-02-29");
    });

    it("should handle year boundary rollover", () => {
      const newYearsDay = new Date(2026, 0, 1, 0, 30);
      expect(getYesterdayDate(newYearsDay)).toBe("2025-12-31");
    });

    it("should throw an error for an invalid Date instance", () => {
      expect(() => getYesterdayDate(new Date("bad"))).toThrow("Invalid Date provided");
    });
  });

  describe("parseISODate", () => {
    it("should parse a valid YYYY-MM-DD string to local midnight Date", () => {
      const parsed = parseISODate("2026-11-09");
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(10);
      expect(parsed.getDate()).toBe(9);
    });

    it("should throw on malformed ISO strings", () => {
      expect(() => parseISODate("2026/11/09")).toThrow(
        "Invalid ISO date string; expected YYYY-MM-DD"
      );
      expect(() => parseISODate("11-09-2026")).toThrow(
        "Invalid ISO date string; expected YYYY-MM-DD"
      );
    });

    it("should throw on non-existent calendar dates", () => {
      expect(() => parseISODate("2026-02-30")).toThrow("Invalid calendar date in ISO string");
      expect(() => parseISODate("2026-13-01")).toThrow("Invalid calendar date in ISO string");
    });
  });
});

