import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TimelineEntryCard from "@/components/history/TimelineEntryCard";
import type { ISummaryIndexEntry } from "@/types/summaryIndex";

describe("TimelineEntryCard", () => {
  const mockEntry: ISummaryIndexEntry = {
    date: "2026-11-14",
    location: "Tokyo",
    weather_summary: "18C, Sunny",
    aqi_summary: "Good",
    mcq_responses: { energy_level: "High" },
    custom_entries_exist: true,
  };

  it("should render date, location, weather, AQI, and custom badge", () => {
    const handleClick = vi.fn();
    render(<TimelineEntryCard entry={mockEntry} onClick={handleClick} />);

    expect(screen.getByText("2026-11-14")).toBeInTheDocument();
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("18C, Sunny")).toBeInTheDocument();
    expect(screen.getByText("AQI: Good")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("should trigger onClick callback on mouse click", () => {
    const handleClick = vi.fn();
    render(<TimelineEntryCard entry={mockEntry} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledWith("2026-11-14");
  });

  it("should trigger onClick callback on Enter and Space keydown", () => {
    const handleClick = vi.fn();
    render(<TimelineEntryCard entry={mockEntry} onClick={handleClick} />);

    const card = screen.getByRole("button");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(handleClick).toHaveBeenCalledWith("2026-11-14");

    fireEvent.keyDown(card, { key: " " });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("should render fallback text when location is empty and hide custom badge when false", () => {
    const emptyEntry: ISummaryIndexEntry = {
      ...mockEntry,
      location: "",
      weather_summary: null,
      aqi_summary: null,
      custom_entries_exist: false,
    };
    render(<TimelineEntryCard entry={emptyEntry} onClick={vi.fn()} />);

    expect(screen.getByText("No location")).toBeInTheDocument();
    expect(screen.queryByText("Custom")).not.toBeInTheDocument();
  });
});
