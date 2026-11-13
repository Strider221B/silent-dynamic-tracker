import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDriveSync } from "@/hooks/useDriveSync";

describe("useDriveSync", () => {
  it("should throw error when invoked outside a DriveSyncProvider", () => {
    expect(() => renderHook(() => useDriveSync())).toThrow(
      "useDriveSync must be used within a DriveSyncProvider",
    );
  });
});

