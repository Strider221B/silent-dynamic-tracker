import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_FAILURE_TOAST_MESSAGE,
  PAST_DATE_TOAST_MESSAGE,
} from "@/constants/weatherConstants";
import { useWeather } from "@/hooks/useWeather";
import type { WeatherService } from "@/services/WeatherService";
import type { IEnvironmentalData } from "@/types/environmental";

describe("useWeather", () => {
  let mockWeatherService: WeatherService;
  let mockShowToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockWeatherService = {
      isDateEligibleForWeather: vi.fn(),
      fetchEnvironmentalData: vi.fn(),
    } as unknown as WeatherService;

    mockShowToast = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should trigger PAST_DATE_TOAST_MESSAGE when querying ineligible past date", async () => {
    vi.mocked(mockWeatherService.isDateEligibleForWeather).mockReturnValue(false);

    const { result } = renderHook(() =>
      useWeather(mockWeatherService, mockShowToast),
    );

    let data: IEnvironmentalData | null = null;
    await act(async () => {
      data = await result.current.getEnvironmentalDataForDate(
        "Mumbai",
        "2026-11-01",
      );
    });

    expect(data).toBeNull();
    expect(mockShowToast).toHaveBeenCalledWith(PAST_DATE_TOAST_MESSAGE);
    expect(mockWeatherService.fetchEnvironmentalData).not.toHaveBeenCalled();
    expect(result.current.isLoadingWeather).toBe(false);
  });

  it("should trigger API_FAILURE_TOAST_MESSAGE when fetch returns null", async () => {
    vi.mocked(mockWeatherService.isDateEligibleForWeather).mockReturnValue(true);
    vi.mocked(mockWeatherService.fetchEnvironmentalData).mockResolvedValue(null);

    const { result } = renderHook(() =>
      useWeather(mockWeatherService, mockShowToast),
    );

    let data: IEnvironmentalData | null = null;
    await act(async () => {
      data = await result.current.getEnvironmentalDataForDate(
        "Mumbai",
        "2026-11-14",
      );
    });

    expect(data).toBeNull();
    expect(mockShowToast).toHaveBeenCalledWith(API_FAILURE_TOAST_MESSAGE);
    expect(result.current.isLoadingWeather).toBe(false);
  });

  it("should return environmental data on success without showing toast", async () => {
    const mockData: IEnvironmentalData = {
      temperature: "28C",
      condition: "Sunny",
      aqi: "Good",
      aqi_numeric: 1,
      pm25: 12.0,
      source: "api",
    };

    vi.mocked(mockWeatherService.isDateEligibleForWeather).mockReturnValue(true);
    vi.mocked(mockWeatherService.fetchEnvironmentalData).mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useWeather(mockWeatherService, mockShowToast),
    );

    let data: IEnvironmentalData | null = null;
    await act(async () => {
      data = await result.current.getEnvironmentalDataForDate(
        "Mumbai",
        "2026-11-14",
      );
    });

    expect(data).toEqual(mockData);
    expect(mockShowToast).not.toHaveBeenCalled();
    expect(result.current.isLoadingWeather).toBe(false);
  });
});

