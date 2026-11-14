import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LocationInput from "@/components/checklist/LocationInput";

describe("LocationInput", () => {
  it("should render location input with label and handle value change", () => {
    const onChange = vi.fn();
    render(<LocationInput location="Tokyo" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: /location/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Tokyo");

    fireEvent.change(input, { target: { value: "Kyoto, Japan" } });
    expect(onChange).toHaveBeenCalledWith("Kyoto, Japan");
  });

  it("should display custom placeholder when supplied", () => {
    render(
      <LocationInput
        location=""
        onChange={vi.fn()}
        placeholder="Custom city placeholder"
      />,
    );

    expect(
      screen.getByPlaceholderText("Custom city placeholder"),
    ).toBeInTheDocument();
  });
});
