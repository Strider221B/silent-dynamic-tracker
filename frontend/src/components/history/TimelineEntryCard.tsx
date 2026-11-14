import { useCallback, useMemo, type KeyboardEvent } from "react";
import type { ISummaryIndexEntry } from "@/types/summaryIndex";
import styles from "./TimelineEntryCard.module.css";

export interface ITimelineEntryCardProps {
  entry: ISummaryIndexEntry;
  onClick: (date: string) => void;
}

const CUSTOM_INDICATOR_TEXT = "Custom" as const;
const KEY_ENTER = "Enter" as const;
const KEY_SPACE = " " as const;
const NO_LOCATION_TEXT = "No location" as const;

function resolveAqiClass(aqiSummary: string | null): string {
  if (!aqiSummary) {
    return styles.aqiDefault;
  }
  const normalized = aqiSummary.toLowerCase();
  if (normalized.includes("good")) return styles.aqiGood;
  if (normalized.includes("moderate")) return styles.aqiModerate;
  if (normalized.includes("sensitive")) return styles.aqiSensitive;
  if (normalized.includes("very unhealthy")) return styles.aqiVeryUnhealthy;
  if (normalized.includes("unhealthy")) return styles.aqiUnhealthy;
  if (normalized.includes("hazardous")) return styles.aqiHazardous;
  return styles.aqiDefault;
}

/**
 * Summary card presenting date, location, weather, AQI, and custom entries indicator.
 */
export function TimelineEntryCard({ entry, onClick }: ITimelineEntryCardProps) {
  const aqiStyleClass = useMemo(
    () => resolveAqiClass(entry.aqi_summary),
    [entry.aqi_summary],
  );

  const handleClick = useCallback((): void => {
    onClick(entry.date);
  }, [entry.date, onClick]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === KEY_ENTER || e.key === KEY_SPACE) {
        e.preventDefault();
        onClick(entry.date);
      }
    },
    [entry.date, onClick],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Log entry for ${entry.date}`}
    >
      <div className={styles.headerRow}>
        <span className={styles.dateText}>{entry.date}</span>
        <span className={styles.locationText}>
          {entry.location || NO_LOCATION_TEXT}
        </span>
      </div>

      <div className={styles.badgeRow}>
        {entry.weather_summary && (
          <span className={styles.weatherBadge}>{entry.weather_summary}</span>
        )}

        {entry.aqi_summary && (
          <span className={`${styles.aqiBadge} ${aqiStyleClass}`}>
            {`AQI: ${entry.aqi_summary}`}
          </span>
        )}

        {entry.custom_entries_exist && (
          <span
            className={styles.customBadge}
            title="Contains custom entries or notes"
          >
            {CUSTOM_INDICATOR_TEXT}
          </span>
        )}
      </div>
    </div>
  );
}

export default TimelineEntryCard;
