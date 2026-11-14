import type { IEnvironmentalData } from "@/types/environmental";
import styles from "./DayDetailEnvironmentalSection.module.css";

export interface IDayDetailEnvironmentalSectionProps {
  data: IEnvironmentalData | null;
  onEdit: () => void;
}

const SECTION_TITLE = "Environmental Conditions" as const;
const EDIT_BUTTON_LABEL = "Edit" as const;
const ADD_BUTTON_LABEL = "Add Weather" as const;
const NO_WEATHER_PLACEHOLDER = "No weather data — tap to add" as const;
const NOT_AVAILABLE = "N/A" as const;

/**
 * Renders environmental metrics and source indicator with an edit action button.
 */
export function DayDetailEnvironmentalSection({
  data,
  onEdit,
}: IDayDetailEnvironmentalSectionProps) {
  if (!data) {
    return (
      <section className={styles.envSection} aria-label={SECTION_TITLE}>
        <div className={styles.envHeader}>
          <h3 className={styles.envTitle}>{SECTION_TITLE}</h3>
          <button type="button" className={styles.editButton} onClick={onEdit}>
            {ADD_BUTTON_LABEL}
          </button>
        </div>
        <p className={styles.emptyText}>{NO_WEATHER_PLACEHOLDER}</p>
      </section>
    );
  }

  const sourceLabel = `Source: ${data.source || "api"}`;

  return (
    <section className={styles.envSection} aria-label={SECTION_TITLE}>
      <div className={styles.envHeader}>
        <h3 className={styles.envTitle}>{SECTION_TITLE}</h3>
        <button
          type="button"
          className={styles.editButton}
          onClick={onEdit}
          aria-label="Edit environmental data"
        >
          {`✏️ ${EDIT_BUTTON_LABEL}`}
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.item}>
          <span className={styles.label}>Temperature</span>
          <span className={styles.value}>{data.temperature || NOT_AVAILABLE}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Condition</span>
          <span className={styles.value}>{data.condition || NOT_AVAILABLE}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Air Quality</span>
          <span className={styles.value}>{data.aqi || NOT_AVAILABLE}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>PM2.5</span>
          <span className={styles.value}>
            {data.pm25 !== null && data.pm25 !== undefined ? data.pm25 : NOT_AVAILABLE}
          </span>
        </div>
      </div>

      <span className={styles.sourceBadge}>{sourceLabel}</span>
    </section>
  );
}

export default DayDetailEnvironmentalSection;
