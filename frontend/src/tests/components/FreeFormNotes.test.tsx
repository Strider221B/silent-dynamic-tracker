import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FreeFormNotes from "@/components/checklist/FreeFormNotes";

describe("FreeFormNotes", () => {
  it("should render textarea with label and value", () => {
    const onChange = vi.fn();
    render(<FreeFormNotes notes="Initial note" onChange={onChange} />);

    const textarea = screen.getByRole("textbox", { name: /free-form notes/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Initial note");

    fireEvent.change(textarea, { target: { value: "Updated reflection" } });
    expect(onChange).toHaveBeenCalledWith("Updated reflection");
  });

  it("should render with custom placeholder when provided", () => {
    render(
      <FreeFormNotes
        notes=""
        onChange={vi.fn()}
        placeholder="Custom notes prompt..."
      />,
    );

    expect(
      screen.getByPlaceholderText("Custom notes prompt..."),
    ).toBeInTheDocument();
  });
});
