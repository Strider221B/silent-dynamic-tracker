import { describe, expect, it } from "vitest";
import { DriveApiError } from "@/errors/DriveApiError";

describe("DriveApiError", () => {
  it("should create an instance with message and status code", () => {
    const error = new DriveApiError("Not found", 404);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DriveApiError);
    expect(error.name).toBe("DriveApiError");
    expect(error.message).toBe("Not found");
    expect(error.statusCode).toBe(404);
    expect(error.endpoint).toBeUndefined();
  });

  it("should attach endpoint when provided", () => {
    const error = new DriveApiError(
      "Unauthorized",
      401,
      "https://www.googleapis.com/drive/v3/files",
    );
    expect(error.statusCode).toBe(401);
    expect(error.endpoint).toBe("https://www.googleapis.com/drive/v3/files");
  });
});

