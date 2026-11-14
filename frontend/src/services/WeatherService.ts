import {
  WEATHER_FETCH_TIMEOUT_MS,
  WEATHER_PROXY_ENDPOINT,
} from "@/constants/weatherConstants";
import { EPA_INDEX_LABELS, EPA_UNKNOWN_LABEL } from "@/constants/epaConstants";
import type {
  EpaIndexNumeric,
  EpaIndexText,
  IEnvironmentalData,
} from "@/types/environmental";
import {
  formatDateToISO,
  getYesterdayDate,
  parseISODate,
} from "@/utils/dateUtils";

/**
 * Service orchestrating weather proxy requests and environmental data normalization.
 */
export class WeatherService {
  private static readonly _DEFAULT_TIMEOUT_MS: number = WEATHER_FETCH_TIMEOUT_MS;
  private static readonly _API_SOURCE = "api" as const;
  private static readonly _QUERY_PARAM_LOCATION = "location" as const;
  private static readonly _GET_METHOD = "GET" as const;
  private static readonly _MIN_EPA_INDEX = 1 as const;
  private static readonly _MAX_EPA_INDEX = 6 as const;
  private static readonly _MIN_PM25 = 0 as const;

  private readonly _baseUrl: string;

  /**
   * Initialize WeatherService with an optional base URL for API requests.
   */
  constructor(baseUrl: string = "") {
    this._baseUrl = baseUrl;
  }

  /**
   * Check whether the specified target calendar date is eligible for real-time weather querying.
   * Only today and yesterday are eligible; past dates > 1 day or future dates return false.
   */
  public isDateEligibleForWeather(
    targetDate: string,
    referenceDate: Date = new Date(),
  ): boolean {
    try {
      parseISODate(targetDate);
    } catch {
      return false;
    }

    const todayStr = formatDateToISO(referenceDate);
    const yesterdayStr = getYesterdayDate(referenceDate);
    return targetDate === todayStr || targetDate === yesterdayStr;
  }

  /**
   * Fetch normalized environmental metrics for a location on an eligible target date.
   * Returns null if date is ineligible, location is empty, or request fails.
   */
  public async fetchEnvironmentalData(
    location: string,
    targetDate: string,
  ): Promise<IEnvironmentalData | null> {
    if (!this.isDateEligibleForWeather(targetDate)) {
      return null;
    }

    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      return null;
    }

    const endpoint = `${this._baseUrl}${WEATHER_PROXY_ENDPOINT}?${WeatherService._QUERY_PARAM_LOCATION}=${encodeURIComponent(trimmedLocation)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      WeatherService._DEFAULT_TIMEOUT_MS,
    );

    try {
      const options = this._buildFetchOptions(controller.signal);
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        return null;
      }
      const data: unknown = await response.json();
      return this._parseEnvironmentalResponse(data);
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private _buildFetchOptions(signal: AbortSignal): RequestInit {
    return {
      method: WeatherService._GET_METHOD,
      signal,
    };
  }

  private _parseAqiNumeric(value: unknown): EpaIndexNumeric | null {
    if (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= WeatherService._MIN_EPA_INDEX &&
      value <= WeatherService._MAX_EPA_INDEX
    ) {
      return value as EpaIndexNumeric;
    }
    return null;
  }

  private _parseAqiText(value: unknown, numericIndex: EpaIndexNumeric | null): EpaIndexText | null {
    if (numericIndex !== null && numericIndex in EPA_INDEX_LABELS) {
      return EPA_INDEX_LABELS[numericIndex];
    }
    if (typeof value === "string" && value.trim()) {
      return value as EpaIndexText;
    }
    return EPA_UNKNOWN_LABEL;
  }

  private _parsePm25(value: unknown): number | null {
    if (typeof value === "number" && !Number.isNaN(value) && value >= WeatherService._MIN_PM25) {
      return value;
    }
    return null;
  }

  private _parseEnvironmentalResponse(data: unknown): IEnvironmentalData {
    const record =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : {};

    const temperature =
      typeof record.temperature === "string" ? record.temperature : null;
    const condition =
      typeof record.condition === "string" ? record.condition : null;
    const aqiNumeric = this._parseAqiNumeric(record.aqi_numeric);
    const aqi = this._parseAqiText(record.aqi, aqiNumeric);
    const pm25 = this._parsePm25(record.pm25);

    return {
      temperature,
      condition,
      aqi,
      aqi_numeric: aqiNumeric,
      pm25,
      source: WeatherService._API_SOURCE,
    };
  }
}

export default WeatherService;

