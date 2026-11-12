import { describe, expect, it } from "vitest";
import { sanitizeText, truncateText } from "@/utils/stringUtils";

describe("stringUtils", () => {
  describe("sanitizeText", () => {
    it("should escape XSS script tags and quote characters", () => {
      const dirty = `  <script>alert("xss" & 'test')</script>  `;
      const sanitized = sanitizeText(dirty);
      expect(sanitized).toBe(
        "&lt;script&gt;alert(&quot;xss&quot; &amp; &#x27;test&#x27;)&lt;&#x2F;script&gt;"
      );
      expect(sanitized).not.toContain("<script>");
    });

    it("should trim whitespace and preserve plain alphanumeric text", () => {
      expect(sanitizeText("  Mumbai, India  ")).toBe("Mumbai, India");
    });

    it("should return empty string for whitespace-only input", () => {
      expect(sanitizeText("   ")).toBe("");
    });
  });

  describe("truncateText", () => {
    it("should return original text when within maxLength", () => {
      expect(truncateText("Hello", 5)).toBe("Hello");
      expect(truncateText("Hello", 10)).toBe("Hello");
    });

    it("should truncate and append ellipsis when exceeding maxLength", () => {
      expect(truncateText("Silent Dynamic Tracker", 9)).toBe("Silent...");
    });

    it("should truncate without ellipsis when maxLength is 3 or less", () => {
      expect(truncateText("Hello", 3)).toBe("Hel");
      expect(truncateText("Hello", 0)).toBe("");
    });

    it("should throw RangeError for negative or non-integer maxLength", () => {
      expect(() => truncateText("Hello", -1)).toThrow(RangeError);
      expect(() => truncateText("Hello", 2.5)).toThrow(RangeError);
    });
  });
});

