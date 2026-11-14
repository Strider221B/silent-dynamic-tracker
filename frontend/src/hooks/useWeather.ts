import { useCallback, useState } from "react";
import {
  API_FAILURE_TOAST_MESSAGE,
  PAST_DATE_TOAST_MESSAGE,
} from "@/constants/weatherConstants";
import type { WeatherService } from "@/services/WeatherService";
import type { IEnvironmentalData } from "@/types/environmental";

export interface IUseWeatherReturn {
  isLoadingWeather: boolean;
  getEnvironmentalDataForDate: (
    location: string,
    targetDate: string,
  ) => Promise<IEnvironmentalData | null>;
}

/**
 * Custom hook managing weather fetching lifecycle and user toast feedback.
 */
export function useWeather(
  weatherService: WeatherService,
  showToast: (msg: string) => void,
): IUseWeatherReturn {
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  const getEnvironmentalDataForDate = useCallback(
    async (
      location: string,
      targetDate: string,
    ): Promise<IEnvironmentalData | null> => {
      if (!weatherService.isDateEligibleForWeather(targetDate)) {
        showToast(PAST_DATE_TOAST_MESSAGE);
        return null;
      }

      setIsLoadingWeather(true);
      try {
        const data = await weatherService.fetchEnvironmentalData(
          location,
          targetDate,
        );
        if (data === null) {
          showToast(API_FAILURE_TOAST_MESSAGE);
        }
        return data;
      } finally {
        setIsLoadingWeather(false);
      }
    },
    [weatherService, showToast],
  );

  return {
    isLoadingWeather,
    getEnvironmentalDataForDate,
  };
}

export default useWeather;

