import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OptionChip from "@/components/checklist/OptionChip";

describe("OptionChip", () => {
  it("should render switch button with label and aria-checked=false when unselected", () => {
    const onToggle = vi.fn();
    render(<OptionChip label="Exercise" isSelected={false} onToggle={onToggle} />);

    const chip = screen.getByRole("switch", { name: "Exercise" });
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute("aria-checked", "false");

    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("should render aria-checked=true when selected", () => {
    render(<OptionChip label="Reading" isSelected={true} onToggle={vi.fn()} />);

    const chip = screen.getByRole("switch", { name: "Reading" });
    expect(chip).toHaveAttribute("aria-checked", "true");
  });

  it("should render save permanently button when isTemporary is true and onSavePermanent is provided", () => {
    const onSavePermanent = vi.fn();
    const onToggle = vi.fn();

    render(
      <OptionChip
        label="Custom Option"
        isSelected={false}
        onToggle={onToggle}
        isTemporary={true}
        onSavePermanent={onSavePermanent}
      />,
    );

    const saveButton = screen.getByRole("button", {
      name: /save permanently: custom option/i,
    });
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);
    expect(onSavePermanent).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("should not render permanent button if isTemporary is false", () => {
    render(
      <OptionChip
        label="Standard Option"
        isSelected={false}
        onToggle={vi.fn()}
        isTemporary={false}
        onSavePermanent={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /save permanently/i }),
    ).not.toBeInTheDocument();
  });
});
