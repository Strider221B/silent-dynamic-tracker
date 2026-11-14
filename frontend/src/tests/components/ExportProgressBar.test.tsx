import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExportProgressBar from "@/components/export/ExportProgressBar";

describe("ExportProgressBar", () => {
  it("should render progress bar with clamped percentage and aria attributes", () => {
    render(<ExportProgressBar percent={45} statusText="Archiving logs..." />);

    expect(screen.getByText("Archiving logs...")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "45");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("should clamp values below 0 and above 100", () => {
    const { rerender } = render(<ExportProgressBar percent={-10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByText("0%")).toBeInTheDocument();

    rerender(<ExportProgressBar percent={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
