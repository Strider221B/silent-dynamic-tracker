import TimelineMonthGroup from "@/components/history/TimelineMonthGroup";
import { EMPTY_TIMELINE_MESSAGE } from "@/constants/filterConstants";
import type { ITimelineYearGroup } from "@/types/timeline";
import styles from "./TimelineView.module.css";

export interface ITimelineViewProps {
  yearGroups: ITimelineYearGroup[];
  onSelectEntry: (date: string) => void;
  emptyMessage?: string;
}

/**
 * Top-level timeline rendering Year groups, Month groups, and empty state fallbacks.
 */
export function TimelineView({
  yearGroups,
  onSelectEntry,
  emptyMessage = EMPTY_TIMELINE_MESSAGE,
}: ITimelineViewProps) {
  if (yearGroups.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={styles.timelineContainer}>
      {yearGroups.map((yearGroup) => (
        <section
          key={yearGroup.year}
          className={styles.yearSection}
          aria-label={`Year ${yearGroup.year}`}
        >
          <h2 className={styles.yearHeading}>{yearGroup.year}</h2>
          {yearGroup.months.map((monthGroup) => (
            <TimelineMonthGroup
              key={monthGroup.month}
              monthGroup={monthGroup}
              onSelectEntry={onSelectEntry}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

export default TimelineView;
