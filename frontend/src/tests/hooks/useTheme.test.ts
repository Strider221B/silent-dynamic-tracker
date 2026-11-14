import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeService } from "@/services/ThemeService";

describe("useTheme", () => {
  let mockThemeService: ThemeService;

  beforeEach(() => {
    mockThemeService = {
      getInitialTheme: vi.fn().mockReturnValue("day"),
      applyTheme: vi.fn(),
    } as unknown as ThemeService;
  });

  it("should initialize with initial theme from theme service", () => {
    const { result } = renderHook(() =>
      useTheme({ themeService: mockThemeService }),
    );

    expect(result.current.theme).toBe("day");
    expect(result.current.isNightMode).toBe(false);
    expect(mockThemeService.getInitialTheme).toHaveBeenCalledTimes(1);
    expect(mockThemeService.applyTheme).toHaveBeenCalledWith("day");
  });

  it("should toggle theme between day and night", () => {
    const { result } = renderHook(() =>
      useTheme({ themeService: mockThemeService }),
    );

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("night");
    expect(result.current.isNightMode).toBe(true);
    expect(mockThemeService.applyTheme).toHaveBeenCalledWith("night");

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("day");
    expect(result.current.isNightMode).toBe(false);
    expect(mockThemeService.applyTheme).toHaveBeenCalledWith("day");
  });

  it("should allow setting theme directly", () => {
    const { result } = renderHook(() =>
      useTheme({ themeService: mockThemeService }),
    );

    act(() => {
      result.current.setTheme("night");
    });

    expect(result.current.theme).toBe("night");
    expect(mockThemeService.applyTheme).toHaveBeenCalledWith("night");
  });
});
