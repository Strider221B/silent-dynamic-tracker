import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DayDetailEnvironmentalSection from "@/components/history/DayDetailEnvironmentalSection";
import type { IEnvironmentalData } from "@/types/environmental";

describe("DayDetailEnvironmentalSection", () => {
  const mockData: IEnvironmentalData = {
    temperature: "24C",
    condition: "Sunny",
    aqi: "Good",
    aqi_numeric: 1,
    pm25: 14.2,
    source: "manual",
  };

  it("should render empty state placeholder when data is null and trigger onEdit on Add", () => {
    const handleEdit = vi.fn();
    render(<DayDetailEnvironmentalSection data={null} onEdit={handleEdit} />);

    expect(
      screen.getByText("No weather data — tap to add"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Weather" }));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("should render metrics and source badge when data is present and trigger onEdit on Edit", () => {
    const handleEdit = vi.fn();
    render(<DayDetailEnvironmentalSection data={mockData} onEdit={handleEdit} />);

    expect(screen.getByText("24C")).toBeInTheDocument();
    expect(screen.getByText("Sunny")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("14.2")).toBeInTheDocument();
    expect(screen.getByText("Source: manual")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /edit environmental data/i }),
    );
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("should render fallback N/A text when fields are missing", () => {
    const emptyData: IEnvironmentalData = {
      temperature: null,
      condition: null,
      aqi: null,
      pm25: null,
      source: null,
    };
    render(<DayDetailEnvironmentalSection data={emptyData} onEdit={vi.fn()} />);

    expect(screen.getAllByText("N/A")).toHaveLength(4);
    expect(screen.getByText("Source: api")).toBeInTheDocument();
  });
});
