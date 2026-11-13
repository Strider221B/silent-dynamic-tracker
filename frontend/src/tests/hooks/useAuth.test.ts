import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAuth } from "@/hooks/useAuth";

describe("useAuth", () => {
  it("should throw error when invoked outside an AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an AuthProvider",
    );
  });
});

