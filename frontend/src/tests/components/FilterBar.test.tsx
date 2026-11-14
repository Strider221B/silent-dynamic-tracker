import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "@/components/history/FilterBar";
import {
  ALL_TIME_LABEL,
  FILTER_MODE_AND,
  FILTER_MODE_OR,
  RESET_FILTERS_LABEL,
} from "@/constants/filterConstants";
import type { IStandardQuestion } from "@/types/config";

describe("FilterBar", () => {
  const mockYearsAndMonths = new Map<number, number[]>([
    [2026, [11, 10]],
    [2025, [12]],
  ]);

  const mockQuestions: IStandardQuestion[] = [
    {
      id: "energy_level",
      question: "Energy Level",
      type: "select_one",
      options: ["High", "Moderate", "Low"],
      default: "Moderate",
    },
  ];

  it("should render time buttons, mode toggle buttons, and reset button", () => {
    render(
      <FilterBar
        availableYearsAndMonths={mockYearsAndMonths}
        selectedYears={[]}
        selectedMonths={[]}
        mcqQuestions={mockQuestions}
        mcqSelections={{}}
        matchMode={FILTER_MODE_AND}
        hasActiveFilters={false}
        onTimeChange={vi.fn()}
        onMcqToggle={vi.fn()}
        onModeChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: ALL_TIME_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2025" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: FILTER_MODE_AND })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: FILTER_MODE_OR })).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: RESET_FILTERS_LABEL });
    expect(resetBtn).toBeDisabled();
  });

  it("should trigger onTimeChange when toggling a year or clicking All Time", () => {
    const handleTimeChange = vi.fn();
    render(
      <FilterBar
        availableYearsAndMonths={mockYearsAndMonths}
        selectedYears={[2026]}
        selectedMonths={[]}
        mcqQuestions={[]}
        mcqSelections={{}}
        matchMode={FILTER_MODE_AND}
        hasActiveFilters={true}
        onTimeChange={handleTimeChange}
        onMcqToggle={vi.fn()}
        onModeChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "2026" }));
    expect(handleTimeChange).toHaveBeenCalledWith([], []);

    fireEvent.click(screen.getByRole("button", { name: ALL_TIME_LABEL }));
    expect(handleTimeChange).toHaveBeenCalledWith([], []);
  });

  it("should trigger onModeChange when switching between AND and OR", () => {
    const handleModeChange = vi.fn();
    render(
      <FilterBar
        availableYearsAndMonths={mockYearsAndMonths}
        selectedYears={[]}
        selectedMonths={[]}
        mcqQuestions={[]}
        mcqSelections={{}}
        matchMode={FILTER_MODE_AND}
        hasActiveFilters={false}
        onTimeChange={vi.fn()}
        onMcqToggle={vi.fn()}
        onModeChange={handleModeChange}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: FILTER_MODE_OR }));
    expect(handleModeChange).toHaveBeenCalledWith(FILTER_MODE_OR);

    fireEvent.click(screen.getByRole("button", { name: FILTER_MODE_AND }));
    expect(handleModeChange).toHaveBeenCalledWith(FILTER_MODE_AND);
  });

  it("should trigger onMcqToggle when clicking question chips", () => {
    const handleMcqToggle = vi.fn();
    render(
      <FilterBar
        availableYearsAndMonths={mockYearsAndMonths}
        selectedYears={[]}
        selectedMonths={[]}
        mcqQuestions={mockQuestions}
        mcqSelections={{ energy_level: ["High"] }}
        matchMode={FILTER_MODE_AND}
        hasActiveFilters={true}
        onTimeChange={vi.fn()}
        onMcqToggle={handleMcqToggle}
        onModeChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Moderate" }));
    expect(handleMcqToggle).toHaveBeenCalledWith("energy_level", "Moderate");
  });

  it("should trigger onReset when clicking enabled reset button", () => {
    const handleReset = vi.fn();
    render(
      <FilterBar
        availableYearsAndMonths={mockYearsAndMonths}
        selectedYears={[2026]}
        selectedMonths={[]}
        mcqQuestions={[]}
        mcqSelections={{}}
        matchMode={FILTER_MODE_AND}
        hasActiveFilters={true}
        onTimeChange={vi.fn()}
        onMcqToggle={vi.fn()}
        onModeChange={vi.fn()}
        onReset={handleReset}
      />,
    );

    const resetBtn = screen.getByRole("button", { name: RESET_FILTERS_LABEL });
    expect(resetBtn).not.toBeDisabled();
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
