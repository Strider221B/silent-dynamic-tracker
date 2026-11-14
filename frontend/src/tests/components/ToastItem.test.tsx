import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ToastItem from "@/components/common/ToastItem";
import type { IToastItem } from "@/context/ToastContext";

describe("ToastItem", () => {
  it("should render info toast with status role and trigger onDismiss on click", () => {
    const onDismissMock = vi.fn();
    const toast: IToastItem = {
      id: "test-info",
      message: "Information update",
      type: "info",
      durationMs: 3000,
    };

    render(<ToastItem toast={toast} onDismiss={onDismissMock} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Information update")).toBeInTheDocument();

    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss notification",
    });
    fireEvent.click(dismissBtn);

    expect(onDismissMock).toHaveBeenCalledWith("test-info");
  });

  it("should render error toast with alert role", () => {
    const toast: IToastItem = {
      id: "test-err",
      message: "Critical error occurred",
      type: "error",
      durationMs: 3000,
    };

    render(<ToastItem toast={toast} onDismiss={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Critical error occurred")).toBeInTheDocument();
  });
});
