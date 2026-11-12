import {
  MIDNIGHT_ROLLOVER_END_HOUR,
  MIDNIGHT_ROLLOVER_START_HOUR,
} from "@/constants/appConstants";

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_OFFSET = 1 as const;
const PAD_WIDTH = 2 as const;
const PAD_CHAR = "0" as const;
const ONE_DAY_OFFSET = 1 as const;
const DECIMAL_RADIX = 10 as const;
const INVALID_DATE_ERROR = "Invalid Date provided" as const;
const INVALID_ISO_FORMAT_ERROR = "Invalid ISO date string; expected YYYY-MM-DD" as const;
const INVALID_CALENDAR_DATE_ERROR = "Invalid calendar date in ISO string" as const;

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new Error(INVALID_DATE_ERROR);
  }
}

function padTwoDigits(value: number): string {
  return String(value).padStart(PAD_WIDTH, PAD_CHAR);
}

/**
 * Formats a Date instance into a local YYYY-MM-DD ISO calendar string.
 */
export function formatDateToISO(date: Date): string {
  assertValidDate(date);
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + MONTH_OFFSET);
  const day = padTwoDigits(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Returns true when the local time falls within the late-night rollover window (00:00 - 04:59).
 */
export function isMidnightWindow(date: Date): boolean {
  assertValidDate(date);
  const hour = date.getHours();
  return hour >= MIDNIGHT_ROLLOVER_START_HOUR && hour <= MIDNIGHT_ROLLOVER_END_HOUR;
}

/**
 * Returns the previous calendar day formatted as YYYY-MM-DD in local time.
 */
export function getYesterdayDate(date: Date): string {
  assertValidDate(date);
  const yesterday = new Date(date.getTime());
  yesterday.setDate(yesterday.getDate() - ONE_DAY_OFFSET);
  return formatDateToISO(yesterday);
}

/**
 * Parses a strict YYYY-MM-DD string into a local-midnight Date instance.
 */
export function parseISODate(dateStr: string): Date {
  const match = ISO_DATE_REGEX.exec(dateStr);
  if (!match) {
    throw new Error(INVALID_ISO_FORMAT_ERROR);
  }

  const year = Number.parseInt(match[1], DECIMAL_RADIX);
  const month = Number.parseInt(match[2], DECIMAL_RADIX);
  const day = Number.parseInt(match[3], DECIMAL_RADIX);
  const parsed = new Date(year, month - MONTH_OFFSET, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - MONTH_OFFSET ||
    parsed.getDate() !== day
  ) {
    throw new Error(INVALID_CALENDAR_DATE_ERROR);
  }

  return parsed;
}

