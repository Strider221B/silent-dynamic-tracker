import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EnvironmentalEditModal from "@/components/history/EnvironmentalEditModal";
import type { IEnvironmentalData } from "@/types/environmental";

describe("EnvironmentalEditModal", () => {
  const mockInitialData: IEnvironmentalData = {
    temperature: "20C",
    condition: "Sunny",
    aqi: "Good",
    aqi_numeric: 1,
    pm25: 12.4,
    source: "api",
  };

  it("should render null when isOpen is false", () => {
    const { container } = render(
      <EnvironmentalEditModal
        isOpen={false}
        initialData={mockInitialData}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("should pre-populate form fields from initialData", () => {
    render(
      <EnvironmentalEditModal
        isOpen={true}
        initialData={mockInitialData}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/temperature/i)).toHaveValue("20C");
    expect(screen.getByLabelText(/condition/i)).toHaveValue("Sunny");
    expect(screen.getByLabelText(/air quality index/i)).toHaveValue("Good");
    expect(screen.getByLabelText(/pm2\.5/i)).toHaveValue(12.4);
  });

  it("should submit updated data with mapped numeric AQI and source: manual", async () => {
    const handleSave = vi.fn();
    render(
      <EnvironmentalEditModal
        isOpen={true}
        initialData={mockInitialData}
        onSave={handleSave}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/temperature/i), {
      target: { value: "32C" },
    });
    fireEvent.change(screen.getByLabelText(/condition/i), {
      target: { value: "Smoggy" },
    });
    fireEvent.change(screen.getByLabelText(/air quality index/i), {
      target: { value: "Unhealthy" },
    });
    fireEvent.change(screen.getByLabelText(/pm2\.5/i), {
      target: { value: "65.5" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(handleSave).toHaveBeenCalledWith({
      temperature: "32C",
      condition: "Smoggy",
      aqi: "Unhealthy",
      aqi_numeric: 4,
      pm25: 65.5,
      source: "manual",
    });
  });

  it("should trigger onClose on Cancel button and Escape key", () => {
    const handleClose = vi.fn();
    render(
      <EnvironmentalEditModal
        isOpen={true}
        initialData={mockInitialData}
        onSave={vi.fn()}
        onClose={handleClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it("should disable buttons when isSaving is true", () => {
    render(
      <EnvironmentalEditModal
        isOpen={true}
        initialData={mockInitialData}
        onSave={vi.fn()}
        onClose={vi.fn()}
        isSaving={true}
      />,
    );

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
