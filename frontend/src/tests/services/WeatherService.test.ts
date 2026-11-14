import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeatherService } from "@/services/WeatherService";
import { formatDateToISO, getYesterdayDate } from "@/utils/dateUtils";

describe("WeatherService", () => {
  let service: WeatherService;
  const mockBaseUrl = "https://tracker.example.com";

  beforeEach(() => {
    service = new WeatherService(mockBaseUrl);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isDateEligibleForWeather", () => {
    it("should return true for today", () => {
      const today = formatDateToISO(new Date());
      expect(service.isDateEligibleForWeather(today)).toBe(true);
    });

    it("should return true for yesterday", () => {
      const yesterday = getYesterdayDate(new Date());
      expect(service.isDateEligibleForWeather(yesterday)).toBe(true);
    });

    it("should return false for 2 days ago", () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const target = formatDateToISO(twoDaysAgo);
      expect(service.isDateEligibleForWeather(target)).toBe(false);
    });

    it("should return false for future dates", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const target = formatDateToISO(tomorrow);
      expect(service.isDateEligibleForWeather(target)).toBe(false);
    });

    it("should return false for invalid date strings", () => {
      expect(service.isDateEligibleForWeather("not-a-date")).toBe(false);
      expect(service.isDateEligibleForWeather("2026-02-31")).toBe(false);
    });
  });

  describe("fetchEnvironmentalData", () => {
    it("should return normalized IEnvironmentalData on happy path fetch", async () => {
      const today = formatDateToISO(new Date());
      const mockResponse = {
        temperature: "31.5C",
        condition: "Clear",
        aqi: "Moderate",
        aqi_numeric: 2,
        pm25: 36.4,
        source: "api",
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await service.fetchEnvironmentalData("Mumbai", today);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        temperature: "31.5C",
        condition: "Clear",
        aqi: "Moderate",
        aqi_numeric: 2,
        pm25: 36.4,
        source: "api",
      });
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("should return null immediately for past date without calling fetch", async () => {
      globalThis.fetch = vi.fn();
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const pastDate = formatDateToISO(twoDaysAgo);

      const result = await service.fetchEnvironmentalData("Mumbai", pastDate);

      expect(result).toBeNull();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("should return null immediately for blank location without calling fetch", async () => {
      globalThis.fetch = vi.fn();
      const today = formatDateToISO(new Date());

      const result = await service.fetchEnvironmentalData("   ", today);

      expect(result).toBeNull();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("should return null on HTTP error response (e.g. 500)", async () => {
      const today = formatDateToISO(new Date());
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response("Server Error", { status: 500 }),
      );

      const result = await service.fetchEnvironmentalData("Mumbai", today);

      expect(result).toBeNull();
    });

    it("should return null on HTTP 404 response", async () => {
      const today = formatDateToISO(new Date());
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response("Not Found", { status: 404 }),
      );

      const result = await service.fetchEnvironmentalData("UnknownCity", today);

      expect(result).toBeNull();
    });

    it("should return null on network failure or abort", async () => {
      const today = formatDateToISO(new Date());
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("Network failed"));

      const result = await service.fetchEnvironmentalData("Mumbai", today);

      expect(result).toBeNull();
    });

    it("should map EPA index 1 to Good and handle null pm25", async () => {
      const today = formatDateToISO(new Date());
      const mockResponse = {
        temperature: "20C",
        condition: "Partly Cloudy",
        aqi_numeric: 1,
        pm25: null,
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await service.fetchEnvironmentalData("London", today);

      expect(result).not.toBeNull();
      expect(result?.aqi).toBe("Good");
      expect(result?.aqi_numeric).toBe(1);
      expect(result?.pm25).toBeNull();
    });

    it("should fallback to Unknown label when aqi_numeric is absent or invalid", async () => {
      const today = formatDateToISO(new Date());
      const mockResponse = {
        temperature: null,
        condition: null,
        aqi: null,
        aqi_numeric: 99,
        pm25: -10,
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await service.fetchEnvironmentalData("Tokyo", today);

      expect(result).not.toBeNull();
      expect(result?.aqi).toBe("Unknown");
      expect(result?.aqi_numeric).toBeNull();
      expect(result?.pm25).toBeNull();
    });

    it("should parse text aqi when numeric index is absent but text is provided", async () => {
      const today = formatDateToISO(new Date());
      const mockResponse = {
        temperature: 25,
        condition: 123,
        aqi: "Unhealthy",
        aqi_numeric: null,
        pm25: "invalid",
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await service.fetchEnvironmentalData("Delhi", today);

      expect(result).not.toBeNull();
      expect(result?.aqi).toBe("Unhealthy");
      expect(result?.temperature).toBeNull();
      expect(result?.condition).toBeNull();
      expect(result?.pm25).toBeNull();
    });
  });
});
