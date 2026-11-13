import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("should render with default text and accessible attributes", () => {
    render(<LoadingSpinner />);

    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render with customized text message", () => {
    render(<LoadingSpinner text="Connecting to Google Drive..." />);

    expect(
      screen.getByText("Connecting to Google Drive..."),
    ).toBeInTheDocument();
  });

  it("should render with various size settings", () => {
    const { container, rerender } = render(<LoadingSpinner size="small" />);
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<LoadingSpinner size="large" />);
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<LoadingSpinner size="medium" />);
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<LoadingSpinner size={"custom" as "medium"} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
