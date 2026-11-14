import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SaveButton from "@/components/checklist/SaveButton";

describe("SaveButton", () => {
  it("should render Save Log button and trigger onSave when tapped", () => {
    const onSave = vi.fn();
    render(<SaveButton onSave={onSave} isSaving={false} />);

    const button = screen.getByRole("button", { name: "Save Log" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "false");

    fireEvent.click(button);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("should show Saving... and disable button during active save", () => {
    render(<SaveButton onSave={vi.fn()} isSaving={true} />);

    const button = screen.getByRole("button", { name: "Saving..." });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("should respect disabled prop", () => {
    const onSave = vi.fn();
    render(<SaveButton onSave={onSave} isSaving={false} disabled={true} />);

    const button = screen.getByRole("button", { name: "Save Log" });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onSave).not.toHaveBeenCalled();
  });
});
