import {
  MIDNIGHT_END_HOUR,
  MIDNIGHT_START_HOUR,
} from "@/constants/checklistConstants";

/**
 * Service encapsulating target date calculation and midnight rollover checking.
 */
export class DateResolutionService {
  private static readonly _HOUR_THRESHOLD: number = MIDNIGHT_END_HOUR;
  private static readonly _START_HOUR: number = MIDNIGHT_START_HOUR;
  private static readonly _ONE_DAY_OFFSET: number = 1;
  private static readonly _MONTH_OFFSET: number = 1;
  private static readonly _PAD_WIDTH: number = 2;
  private static readonly _PAD_CHAR: string = "0";

  /**
   * Initializes DateResolutionService.
   */
  constructor() {
    // Pure date resolution utility service
  }

  /**
   * Returns true if the provided time falls within the midnight window (00:00 to 04:59).
   */
  public isInMidnightWindow(currentTime: Date = new Date()): boolean {
    const hour = currentTime.getHours();
    return (
      hour >= DateResolutionService._START_HOUR &&
      hour < DateResolutionService._HOUR_THRESHOLD
    );
  }

  /**
   * Returns yesterday's ISO date string if in midnight window, otherwise today's ISO date string.
   */
  public getDefaultTargetDate(currentTime: Date = new Date()): string {
    if (this.isInMidnightWindow(currentTime)) {
      return this.getYesterdayDate(currentTime);
    }
    return this.getTodayDate(currentTime);
  }

  /**
   * Returns today's ISO date string (YYYY-MM-DD) in local time.
   */
  public getTodayDate(currentTime: Date = new Date()): string {
    return this._formatDate(currentTime);
  }

  /**
   * Returns yesterday's ISO date string (YYYY-MM-DD) in local time.
   */
  public getYesterdayDate(currentTime: Date = new Date()): string {
    const yesterday = new Date(currentTime.getTime());
    yesterday.setDate(
      yesterday.getDate() - DateResolutionService._ONE_DAY_OFFSET,
    );
    return this._formatDate(yesterday);
  }

  /**
   * Formats a Date instance as YYYY-MM-DD using local time parts.
   */
  private _formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + DateResolutionService._MONTH_OFFSET).padStart(
      DateResolutionService._PAD_WIDTH,
      DateResolutionService._PAD_CHAR,
    );
    const day = String(date.getDate()).padStart(
      DateResolutionService._PAD_WIDTH,
      DateResolutionService._PAD_CHAR,
    );
    return `${year}-${month}-${day}`;
  }
}
