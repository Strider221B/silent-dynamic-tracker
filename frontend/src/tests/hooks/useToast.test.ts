import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/context/ToastContext";
import { useToast } from "@/hooks/useToast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it("should throw error if called outside of ToastProvider", () => {
    // Suppress React boundary console.error for expected throw
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useToast())).toThrow(
      "useToast must be used within a ToastProvider",
    );

    consoleSpy.mockRestore();
  });

  it("should push toasts with default and custom types", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ToastProvider, null, children);

    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current.toasts).toHaveLength(0);

    act(() => {
      result.current.showToast("Default info toast");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Default info toast");
    expect(result.current.toasts[0].type).toBe("info");

    act(() => {
      result.current.showToast("Success toast", "success", 5000);
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[1].message).toBe("Success toast");
    expect(result.current.toasts[1].type).toBe("success");
    expect(result.current.toasts[1].durationMs).toBe(5000);
  });

  it("should dismiss a specific toast explicitly via dismissToast", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ToastProvider, null, children);

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast("Toast to dismiss");
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.dismissToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("should auto-dismiss toast after durationMs has elapsed", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ToastProvider, null, children);

    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast("Auto dismiss message", "info", 3000);
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
