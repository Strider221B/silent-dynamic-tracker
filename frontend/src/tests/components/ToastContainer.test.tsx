import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ToastContainer from "@/components/common/ToastContainer";
import * as useToastModule from "@/hooks/useToast";

describe("ToastContainer", () => {
  it("should render nothing when there are no active toasts", () => {
    vi.spyOn(useToastModule, "useToast").mockReturnValue({
      toasts: [],
      showToast: vi.fn(),
      dismissToast: vi.fn(),
    });

    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it("should render toast items with correct message, aria role, and handle dismissal", () => {
    const dismissMock = vi.fn();
    vi.spyOn(useToastModule, "useToast").mockReturnValue({
      toasts: [
        {
          id: "toast-1",
          message: "Info message",
          type: "info",
          durationMs: 4000,
        },
        {
          id: "toast-2",
          message: "Error message",
          type: "error",
          durationMs: 4000,
        },
      ],
      showToast: vi.fn(),
      dismissToast: dismissMock,
    });

    render(<ToastContainer />);

    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();

    const infoToast = screen.getByRole("status");
    expect(infoToast).toHaveTextContent("Info message");

    const errorToast = screen.getByRole("alert");
    expect(errorToast).toHaveTextContent("Error message");

    const dismissButtons = screen.getAllByRole("button", {
      name: "Dismiss notification",
    });
    expect(dismissButtons).toHaveLength(2);

    fireEvent.click(dismissButtons[0]);
    expect(dismissMock).toHaveBeenCalledWith("toast-1");
  });
});
