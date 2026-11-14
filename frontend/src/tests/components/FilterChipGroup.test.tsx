import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterChipGroup from "@/components/history/FilterChipGroup";
import type { IStandardQuestion } from "@/types/config";

describe("FilterChipGroup", () => {
  const mockQuestion: IStandardQuestion = {
    id: "mood",
    question: "Daily Mood",
    type: "select_one",
    options: ["Happy", "Neutral", "Stressed"],
    default: "Neutral",
  };

  it("should render question label and option chips with correct aria-pressed states", () => {
    render(
      <FilterChipGroup
        question={mockQuestion}
        selectedValues={["Happy"]}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText("Daily Mood")).toBeInTheDocument();
    const happyBtn = screen.getByRole("button", { name: "Happy" });
    const neutralBtn = screen.getByRole("button", { name: "Neutral" });

    expect(happyBtn).toHaveAttribute("aria-pressed", "true");
    expect(neutralBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("should trigger onToggle when an option chip is clicked", () => {
    const handleToggle = vi.fn();
    render(
      <FilterChipGroup
        question={mockQuestion}
        selectedValues={[]}
        onToggle={handleToggle}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Stressed" }));
    expect(handleToggle).toHaveBeenCalledWith("mood", "Stressed");
  });
});
