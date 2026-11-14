import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { DateResolutionService } from "@/services/DateResolutionService";

describe("useMidnightRollover", () => {
  it("should initialize with modal open and yesterday date during midnight window", () => {
    const lateNightDate = new Date(2026, 10, 14, 2, 0, 0); // 02:00 AM Nov 14
    const dateService = new DateResolutionService();

    const { result } = renderHook(() =>
      useMidnightRollover({ dateService, now: lateNightDate }),
    );

    expect(result.current.showRolloverModal).toBe(true);
    expect(result.current.selectedDate).toBe("2026-11-13");
  });

  it("should initialize with modal closed and today date during daytime", () => {
    const dayDate = new Date(2026, 10, 14, 14, 0, 0); // 02:00 PM Nov 14
    const dateService = new DateResolutionService();

    const { result } = renderHook(() =>
      useMidnightRollover({ dateService, now: dayDate }),
    );

    expect(result.current.showRolloverModal).toBe(false);
    expect(result.current.selectedDate).toBe("2026-11-14");
  });

  it("should confirm yesterday and close modal", () => {
    const lateNightDate = new Date(2026, 10, 14, 1, 0, 0);
    const { result } = renderHook(() =>
      useMidnightRollover({ now: lateNightDate }),
    );

    act(() => {
      result.current.confirmYesterday();
    });

    expect(result.current.showRolloverModal).toBe(false);
    expect(result.current.selectedDate).toBe("2026-11-13");
  });

  it("should confirm today and close modal", () => {
    const lateNightDate = new Date(2026, 10, 14, 1, 0, 0);
    const { result } = renderHook(() =>
      useMidnightRollover({ now: lateNightDate }),
    );

    act(() => {
      result.current.confirmToday();
    });

    expect(result.current.showRolloverModal).toBe(false);
    expect(result.current.selectedDate).toBe("2026-11-14");
  });

  it("should override date and close modal", () => {
    const lateNightDate = new Date(2026, 10, 14, 1, 0, 0);
    const { result } = renderHook(() =>
      useMidnightRollover({ now: lateNightDate }),
    );

    act(() => {
      result.current.overrideDate("2026-11-01");
    });

    expect(result.current.showRolloverModal).toBe(false);
    expect(result.current.selectedDate).toBe("2026-11-01");
  });

  it("should dismiss modal without changing date", () => {
    const lateNightDate = new Date(2026, 10, 14, 1, 0, 0);
    const { result } = renderHook(() =>
      useMidnightRollover({ now: lateNightDate }),
    );

    act(() => {
      result.current.dismissModal();
    });

    expect(result.current.showRolloverModal).toBe(false);
    expect(result.current.selectedDate).toBe("2026-11-13");
  });

  it("should allow direct setSelectedDate update", () => {
    const { result } = renderHook(() => useMidnightRollover());

    act(() => {
      result.current.setSelectedDate("2026-12-25");
    });

    expect(result.current.selectedDate).toBe("2026-12-25");
  });
});
