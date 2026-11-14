import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuestionBlock from "@/components/checklist/QuestionBlock";
import type { IStandardQuestion } from "@/types/config";

const singleQuestion: IStandardQuestion = {
  id: "mood",
  question: "How was your mood today?",
  type: "select_one",
  options: ["Calm", "Neutral", "Anxious"],
  default: "Neutral",
};

const multiQuestion: IStandardQuestion = {
  id: "habits",
  question: "Which habits did you complete?",
  type: "select_multiple",
  options: ["Walk", "Read", "Code"],
  default: ["Walk"],
};

describe("QuestionBlock", () => {
  it("should render question title and standard option chips", () => {
    const onSelectOption = vi.fn();
    render(
      <QuestionBlock
        question={singleQuestion}
        currentResponse="Calm"
        onSelectOption={onSelectOption}
        onQuickAdd={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "How was your mood today?" }),
    ).toBeInTheDocument();

    const calmChip = screen.getByRole("switch", { name: "Calm" });
    const neutralChip = screen.getByRole("switch", { name: "Neutral" });

    expect(calmChip).toHaveAttribute("aria-checked", "true");
    expect(neutralChip).toHaveAttribute("aria-checked", "false");

    fireEvent.click(neutralChip);
    expect(onSelectOption).toHaveBeenCalledWith("mood", "Neutral", false);
  });

  it("should render multi-select chips accurately", () => {
    const onSelectOption = vi.fn();
    render(
      <QuestionBlock
        question={multiQuestion}
        currentResponse={["Walk", "Code"]}
        onSelectOption={onSelectOption}
        onQuickAdd={vi.fn()}
      />,
    );

    const walkChip = screen.getByRole("switch", { name: "Walk" });
    const readChip = screen.getByRole("switch", { name: "Read" });
    const codeChip = screen.getByRole("switch", { name: "Code" });

    expect(walkChip).toHaveAttribute("aria-checked", "true");
    expect(readChip).toHaveAttribute("aria-checked", "false");
    expect(codeChip).toHaveAttribute("aria-checked", "true");

    fireEvent.click(readChip);
    expect(onSelectOption).toHaveBeenCalledWith("habits", "Read", true);
  });

  it("should render temporary options and trigger quick add / permanent save", () => {
    const onQuickAdd = vi.fn();
    const onSavePermanent = vi.fn();

    render(
      <QuestionBlock
        question={singleQuestion}
        currentResponse="Custom Option"
        temporaryOptions={["Custom Option"]}
        onSelectOption={vi.fn()}
        onQuickAdd={onQuickAdd}
        onSavePermanent={onSavePermanent}
      />,
    );

    const tempChip = screen.getByRole("switch", { name: "Custom Option" });
    expect(tempChip).toHaveAttribute("aria-checked", "true");

    const permanentButton = screen.getByRole("button", {
      name: /save permanently: custom option/i,
    });
    fireEvent.click(permanentButton);
    expect(onSavePermanent).toHaveBeenCalledWith("mood", "Custom Option");

    // Test quick add
    const input = screen.getByRole("textbox", {
      name: /add custom option for how was your mood today\?/i,
    });
    fireEvent.change(input, { target: { value: "Euphoric" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onQuickAdd).toHaveBeenCalledWith("mood", "Euphoric");
  });

  it("should handle undefined currentResponse gracefully", () => {
    render(
      <QuestionBlock
        question={singleQuestion}
        currentResponse={undefined}
        onSelectOption={vi.fn()}
        onQuickAdd={vi.fn()}
      />,
    );

    const calmChip = screen.getByRole("switch", { name: "Calm" });
    expect(calmChip).toHaveAttribute("aria-checked", "false");
  });
});
