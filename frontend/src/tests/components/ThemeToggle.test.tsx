import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeToggle from "@/components/theme/ThemeToggle";
import type { ThemeService } from "@/services/ThemeService";

describe("ThemeToggle", () => {
  it("should render day mode by default with sun icon and switch to night mode label", () => {
    const mockService = {
      getInitialTheme: vi.fn().mockReturnValue("day"),
      applyTheme: vi.fn(),
    } as unknown as ThemeService;

    render(<ThemeToggle options={{ themeService: mockService }} />);

    const button = screen.getByRole("button", { name: "Switch to night mode" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Day");
    expect(button).toHaveTextContent("☀️");
  });

  it("should toggle to night mode on click and update label and icon", () => {
    const mockService = {
      getInitialTheme: vi.fn().mockReturnValue("day"),
      applyTheme: vi.fn(),
    } as unknown as ThemeService;

    render(<ThemeToggle options={{ themeService: mockService }} />);

    const button = screen.getByRole("button", { name: "Switch to night mode" });
    fireEvent.click(button);

    expect(
      screen.getByRole("button", { name: "Switch to day mode" }),
    ).toBeInTheDocument();
    expect(button).toHaveTextContent("Night");
    expect(button).toHaveTextContent("🌙");
    expect(mockService.applyTheme).toHaveBeenCalledWith("night");
  });
});
