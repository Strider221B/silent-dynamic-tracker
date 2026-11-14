import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TimelineView from "@/components/history/TimelineView";
import { EMPTY_TIMELINE_MESSAGE } from "@/constants/filterConstants";
import type { ITimelineYearGroup } from "@/types/timeline";

describe("TimelineView", () => {
  it("should display default empty state when yearGroups is empty", () => {
    render(<TimelineView yearGroups={[]} onSelectEntry={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      EMPTY_TIMELINE_MESSAGE,
    );
  });

  it("should display custom empty message when provided", () => {
    render(
      <TimelineView
        yearGroups={[]}
        onSelectEntry={vi.fn()}
        emptyMessage="Nothing here!"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Nothing here!");
  });

  it("should render years, months, and entries hierarchy", () => {
    const handleSelect = vi.fn();
    const mockGroups: ITimelineYearGroup[] = [
      {
        year: 2026,
        months: [
          {
            month: 11,
            monthName: "November",
            entries: [
              {
                date: "2026-11-14",
                location: "Tokyo",
                weather_summary: "18C",
                aqi_summary: "Good",
                mcq_responses: {},
                custom_entries_exist: false,
              },
            ],
          },
        ],
      },
    ];

    render(
      <TimelineView yearGroups={mockGroups} onSelectEntry={handleSelect} />,
    );

    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("November (1)")).toBeInTheDocument();
    expect(screen.getByText("2026-11-14")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /log entry for 2026-11-14/i }));
    expect(handleSelect).toHaveBeenCalledWith("2026-11-14");
  });
});
