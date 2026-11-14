import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DayDetailModal from "@/components/history/DayDetailModal";
import type { IDailyPayload } from "@/types/dailyPayload";

describe("DayDetailModal", () => {
  const mockPayload: IDailyPayload = {
    date: "2026-11-14",
    location: "Berlin",
    environmental_data: {
      temperature: "14C",
      condition: "Clear",
      aqi: "Good",
      aqi_numeric: 1,
      pm25: 10,
      source: "api",
    },
    standard_responses: {
      energy_level: "High",
      habits: ["Exercise", "Reading"],
    },
    custom_additions: { custom_questions: [] },
    free_form_notes: "Great day today.",
  };

  it("should return null when isOpen is false or date is null", () => {
    const { container: c1 } = render(
      <DayDetailModal
        isOpen={false}
        date="2026-11-14"
        payload={mockPayload}
        isLoading={false}
        error={null}
        onClose={vi.fn()}
        onEditEnvironmental={vi.fn()}
      />,
    );
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(
      <DayDetailModal
        isOpen={true}
        date={null}
        payload={mockPayload}
        isLoading={false}
        error={null}
        onClose={vi.fn()}
        onEditEnvironmental={vi.fn()}
      />,
    );
    expect(c2).toBeEmptyDOMElement();
  });

  it("should render loading spinner when isLoading is true", () => {
    render(
      <DayDetailModal
        isOpen={true}
        date="2026-11-14"
        payload={null}
        isLoading={true}
        error={null}
        onClose={vi.fn()}
        onEditEnvironmental={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should render error banner when error is present", () => {
    render(
      <DayDetailModal
        isOpen={true}
        date="2026-11-14"
        payload={null}
        isLoading={false}
        error="Failed to load file"
        onClose={vi.fn()}
        onEditEnvironmental={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load file");
  });

  it("should render day details, responses, notes, and trigger edit callback", () => {
    const handleEdit = vi.fn();
    render(
      <DayDetailModal
        isOpen={true}
        date="2026-11-14"
        payload={mockPayload}
        isLoading={false}
        error={null}
        onClose={vi.fn()}
        onEditEnvironmental={handleEdit}
      />,
    );

    expect(screen.getByText("Log: 2026-11-14")).toBeInTheDocument();
    expect(screen.getByText("📍 Berlin")).toBeInTheDocument();
    expect(screen.getByText("14C")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.getByText("Source: api")).toBeInTheDocument();
    expect(screen.getByText("Exercise, Reading")).toBeInTheDocument();
    expect(screen.getByText("Great day today.")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /edit environmental data/i }),
    );
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("should render fallback text when environmental data is null and trigger add", () => {
    const handleEdit = vi.fn();
    const payloadNoWeather: IDailyPayload = {
      ...mockPayload,
      environmental_data: null,
      free_form_notes: "",
    };

    render(
      <DayDetailModal
        isOpen={true}
        date="2026-11-14"
        payload={payloadNoWeather}
        isLoading={false}
        error={null}
        onClose={vi.fn()}
        onEditEnvironmental={handleEdit}
      />,
    );

    expect(
      screen.getByText("No weather data — tap to add"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No notes recorded for this date."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Weather" }));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("should trigger onClose when clicking Close button or pressing Escape", () => {
    const handleClose = vi.fn();
    render(
      <DayDetailModal
        isOpen={true}
        date="2026-11-14"
        payload={mockPayload}
        isLoading={false}
        error={null}
        onClose={handleClose}
        onEditEnvironmental={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
