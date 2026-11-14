import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuickAddInput from "@/components/checklist/QuickAddInput";

describe("QuickAddInput", () => {
  it("should render input field and disabled Add button when empty", () => {
    render(<QuickAddInput onAdd={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /add custom option/i });
    const addButton = screen.getByRole("button", { name: /add/i });

    expect(input).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it("should enable Add button when text is entered and submit on click", () => {
    const onAdd = vi.fn();
    render(<QuickAddInput onAdd={onAdd} />);

    const input = screen.getByRole("textbox", { name: /add custom option/i });
    const addButton = screen.getByRole("button", { name: /add/i });

    fireEvent.change(input, { target: { value: "New Habit" } });
    expect(addButton).not.toBeDisabled();

    fireEvent.click(addButton);
    expect(onAdd).toHaveBeenCalledWith("New Habit");
    expect(input).toHaveValue("");
  });

  it("should submit on pressing Enter key", () => {
    const onAdd = vi.fn();
    render(<QuickAddInput onAdd={onAdd} />);

    const input = screen.getByRole("textbox", { name: /add custom option/i });

    fireEvent.change(input, { target: { value: "Cold Shower" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onAdd).toHaveBeenCalledWith("Cold Shower");
    expect(input).toHaveValue("");
  });

  it("should not trigger onAdd when input is whitespace-only", () => {
    const onAdd = vi.fn();
    render(<QuickAddInput onAdd={onAdd} />);

    const input = screen.getByRole("textbox", { name: /add custom option/i });

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onAdd).not.toHaveBeenCalled();
  });
});
