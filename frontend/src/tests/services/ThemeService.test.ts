import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeService } from "@/services/ThemeService";

describe("ThemeService", () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    service = new ThemeService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should default to day mode when no preference or matchMedia exists", () => {
    const theme = service.getInitialTheme();
    expect(theme).toBe("day");
  });

  it("should return stored preference from localStorage if valid", () => {
    localStorage.setItem("sdt_theme_preference", "night");
    expect(service.getInitialTheme()).toBe("night");

    localStorage.setItem("sdt_theme_preference", "day");
    expect(service.getInitialTheme()).toBe("day");
  });

  it("should ignore invalid stored theme strings and fallback", () => {
    localStorage.setItem("sdt_theme_preference", "invalid-theme");
    expect(service.getInitialTheme()).toBe("day");
  });

  it("should honor prefers-color-scheme: dark if no stored preference exists", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const theme = service.getInitialTheme();
    expect(theme).toBe("night");
  });

  it("should apply data-theme attribute to root document element and persist to localStorage", () => {
    service.applyTheme("night");
    expect(document.documentElement.getAttribute("data-theme")).toBe("night");
    expect(localStorage.getItem("sdt_theme_preference")).toBe("night");

    service.applyTheme("day");
    expect(document.documentElement.getAttribute("data-theme")).toBe("day");
    expect(localStorage.getItem("sdt_theme_preference")).toBe("day");
  });

  it("should handle localStorage errors gracefully when reading or saving", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage disabled");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });

    expect(() => service.getInitialTheme()).not.toThrow();
    expect(service.getInitialTheme()).toBe("day");
    expect(() => service.applyTheme("night")).not.toThrow();
  });
});
