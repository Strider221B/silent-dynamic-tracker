import { describe, expect, it } from "vitest";
import { DateResolutionService } from "@/services/DateResolutionService";

describe("DateResolutionService", () => {
  const service = new DateResolutionService();

  describe("isInMidnightWindow", () => {
    it("should return true at 00:00", () => {
      const midnight = new Date(2026, 10, 14, 0, 0, 0);
      expect(service.isInMidnightWindow(midnight)).toBe(true);
    });

    it("should return true at 02:30 AM", () => {
      const lateNight = new Date(2026, 10, 14, 2, 30, 0);
      expect(service.isInMidnightWindow(lateNight)).toBe(true);
    });

    it("should return true at 04:59 AM", () => {
      const beforeThreshold = new Date(2026, 10, 14, 4, 59, 59);
      expect(service.isInMidnightWindow(beforeThreshold)).toBe(true);
    });

    it("should return false at 05:00 AM", () => {
      const threshold = new Date(2026, 10, 14, 5, 0, 0);
      expect(service.isInMidnightWindow(threshold)).toBe(false);
    });

    it("should return false at 05:01 AM", () => {
      const morning = new Date(2026, 10, 14, 5, 1, 0);
      expect(service.isInMidnightWindow(morning)).toBe(false);
    });

    it("should return false at 23:59 PM", () => {
      const evening = new Date(2026, 10, 14, 23, 59, 0);
      expect(service.isInMidnightWindow(evening)).toBe(false);
    });

    it("should use current date when no argument is supplied", () => {
      const result = service.isInMidnightWindow();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getDefaultTargetDate", () => {
    it("should return yesterday date when within midnight window (e.g. 02:30 AM)", () => {
      const date = new Date(2026, 10, 14, 2, 30, 0); // Nov 14, 2026
      expect(service.getDefaultTargetDate(date)).toBe("2026-11-13");
    });

    it("should return today date when outside midnight window (e.g. 10:00 AM)", () => {
      const date = new Date(2026, 10, 14, 10, 0, 0); // Nov 14, 2026
      expect(service.getDefaultTargetDate(date)).toBe("2026-11-14");
    });

    it("should use current date when no argument is supplied", () => {
      const result = service.getDefaultTargetDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getTodayDate and getYesterdayDate", () => {
    it("should format today date correctly with zero padding", () => {
      const singleDigitDate = new Date(2026, 0, 5, 12, 0, 0); // Jan 5, 2026
      expect(service.getTodayDate(singleDigitDate)).toBe("2026-01-05");
    });

    it("should format yesterday date across year boundary", () => {
      const newYear = new Date(2026, 0, 1, 3, 0, 0); // Jan 1, 2026
      expect(service.getYesterdayDate(newYear)).toBe("2025-12-31");
    });

    it("should use current date when no argument is supplied to getTodayDate and getYesterdayDate", () => {
      expect(service.getTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(service.getYesterdayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
