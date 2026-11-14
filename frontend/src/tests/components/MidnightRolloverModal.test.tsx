import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MidnightRolloverModal from "@/components/checklist/MidnightRolloverModal";

describe("MidnightRolloverModal", () => {
  it("should return null when isOpen is false", () => {
    const { container } = render(
      <MidnightRolloverModal
        isOpen={false}
        yesterdayDateStr="2026-11-13"
        todayDateStr="2026-11-14"
        onConfirmYesterday={vi.fn()}
        onConfirmToday={vi.fn()}
        onOverrideDate={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render dialog with buttons for yesterday and today when open", () => {
    const onConfirmYesterday = vi.fn();
    const onConfirmToday = vi.fn();

    render(
      <MidnightRolloverModal
        isOpen={true}
        yesterdayDateStr="2026-11-13"
        todayDateStr="2026-11-14"
        onConfirmYesterday={onConfirmYesterday}
        onConfirmToday={onConfirmToday}
        onOverrideDate={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const yesterdayBtn = screen.getByRole("button", {
      name: /yesterday \(2026-11-13\)/i,
    });
    const todayBtn = screen.getByRole("button", {
      name: /today \(2026-11-14\)/i,
    });

    fireEvent.click(yesterdayBtn);
    expect(onConfirmYesterday).toHaveBeenCalledTimes(1);

    fireEvent.click(todayBtn);
    expect(onConfirmToday).toHaveBeenCalledTimes(1);
  });

  it("should trigger onOverrideDate when custom date is chosen", () => {
    const onOverrideDate = vi.fn();

    render(
      <MidnightRolloverModal
        isOpen={true}
        yesterdayDateStr="2026-11-13"
        todayDateStr="2026-11-14"
        onConfirmYesterday={vi.fn()}
        onConfirmToday={vi.fn()}
        onOverrideDate={onOverrideDate}
      />,
    );

    const datePicker = screen.getByLabelText(/or pick specific date:/i);
    fireEvent.change(datePicker, { target: { value: "2026-11-05" } });

    expect(onOverrideDate).toHaveBeenCalledWith("2026-11-05");
  });
});
