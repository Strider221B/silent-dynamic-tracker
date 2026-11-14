import TimelineEntryCard from "@/components/history/TimelineEntryCard";
import type { ITimelineMonthGroup } from "@/types/timeline";
import styles from "./TimelineMonthGroup.module.css";

export interface ITimelineMonthGroupProps {
  monthGroup: ITimelineMonthGroup;
  onSelectEntry: (date: string) => void;
}

/**
 * Renders a labeled month section containing cards for every entry in that month.
 */
export function TimelineMonthGroup({
  monthGroup,
  onSelectEntry,
}: ITimelineMonthGroupProps) {
  const headingText = `${monthGroup.monthName} (${monthGroup.entries.length})`;

  return (
    <section className={styles.monthSection} aria-label={headingText}>
      <h3 className={styles.monthHeading}>{headingText}</h3>
      <div className={styles.entryList}>
        {monthGroup.entries.map((entry) => (
          <TimelineEntryCard
            key={entry.date}
            entry={entry}
            onClick={onSelectEntry}
          />
        ))}
      </div>
    </section>
  );
}

export default TimelineMonthGroup;
