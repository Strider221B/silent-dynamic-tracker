/**
 * Constants governing environmental weather proxy calls and fallback behavior.
 */

export const WEATHER_PROXY_ENDPOINT = "/api/weather" as const;

export const PAST_DATE_TOAST_MESSAGE =
  "Weather data unavailable for past dates. You can add it manually." as const;

export const API_FAILURE_TOAST_MESSAGE =
  "Weather data unavailable. You can add it manually." as const;

export const MAX_ELIGIBLE_DAYS_FOR_WEATHER = 1 as const;

export const WEATHER_FETCH_TIMEOUT_MS = 5000 as const;

