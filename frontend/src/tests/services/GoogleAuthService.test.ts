import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleAuthService } from "@/services/GoogleAuthService";
import type { ITokenClientConfig, ITokenResponse } from "@/types/google";

describe("GoogleAuthService", () => {
  let mockRequestAccessToken: ReturnType<typeof vi.fn>;
  let mockRevoke: ReturnType<typeof vi.fn>;
  let capturedConfig: ITokenClientConfig | null;

  beforeEach(() => {
    capturedConfig = null;
    mockRequestAccessToken = vi.fn();
    mockRevoke = vi.fn((_token: string, done: () => void) => done());

    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn((config: ITokenClientConfig) => {
            capturedConfig = config;
            return {
              requestAccessToken: mockRequestAccessToken,
            };
          }),
          revoke: mockRevoke,
        },
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.google;
  });

  it("should initialize client and authenticate when token callback is invoked", () => {
    const service = new GoogleAuthService("test-client-id");
    const tokenCallback = vi.fn();

    service.initClient(tokenCallback);
    expect(window.google?.accounts.oauth2.initTokenClient).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "test-client-id",
        scope: "https://www.googleapis.com/auth/drive.file",
      }),
    );

    expect(capturedConfig).not.toBeNull();
    const tokenResponse: ITokenResponse = {
      access_token: "mock-access-token",
      expires_in: 3600,
    };
    capturedConfig!.callback(tokenResponse);

    expect(tokenCallback).toHaveBeenCalledWith("mock-access-token");
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getAccessToken()).toBe("mock-access-token");
  });

  it("should handle string-formatted expires_in and fallback defaults", () => {
    const service = new GoogleAuthService("test-client-id");
    service.initClient(() => {});

    capturedConfig!.callback({
      access_token: "token-string-expires",
      expires_in: "1800",
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getAccessToken()).toBe("token-string-expires");

    capturedConfig!.callback({
      access_token: "token-nan-expires",
      expires_in: "invalid-number",
    });
    expect(service.isAuthenticated()).toBe(true);
  });

  it("should clear token and remain unauthenticated when response contains error", () => {
    const service = new GoogleAuthService();
    const tokenCallback = vi.fn();
    service.initClient(tokenCallback);

    capturedConfig!.callback({
      access_token: "",
      expires_in: 0,
      error: "access_denied",
    });

    expect(tokenCallback).not.toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
  });

  it("should report expired token when remaining time is below buffer threshold", () => {
    const service = new GoogleAuthService();
    service.initClient(() => {});

    capturedConfig!.callback({
      access_token: "short-lived-token",
      expires_in: 50, // 50s is below the 60s buffer
    });

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
  });

  it("should trigger requestAccessToken on initialized token client", () => {
    const service = new GoogleAuthService();
    service.initClient(() => {});

    service.requestAccessToken();
    expect(mockRequestAccessToken).toHaveBeenCalledWith({ prompt: "" });
  });

  it("should throw error if requestAccessToken is called when GIS is not loaded", () => {
    delete window.google;
    const service = new GoogleAuthService();
    expect(() => service.requestAccessToken()).toThrow(
      "Google Identity Services not initialized",
    );
  });

  it("should revoke token via GIS revoke when available", async () => {
    const service = new GoogleAuthService();
    service.initClient(() => {});
    capturedConfig!.callback({
      access_token: "token-to-revoke",
      expires_in: 3600,
    });

    expect(service.isAuthenticated()).toBe(true);

    await service.revokeToken();
    expect(mockRevoke).toHaveBeenCalledWith(
      "token-to-revoke",
      expect.any(Function),
    );
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
  });

  it("should fallback to fetch revocation when GIS revoke is unavailable", async () => {
    delete window.google?.accounts.oauth2.revoke;
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    globalThis.fetch = fetchMock;

    const service = new GoogleAuthService();
    service.initClient(() => {});
    capturedConfig!.callback({
      access_token: "token-for-fetch-revoke",
      expires_in: 3600,
    });

    await service.revokeToken();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://oauth2.googleapis.com/revoke?token=token-for-fetch-revoke"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(service.isAuthenticated()).toBe(false);
  });

  it("should safely handle revokeToken when no token is present", async () => {
    const service = new GoogleAuthService();
    await service.revokeToken();
    expect(service.isAuthenticated()).toBe(false);
  });

  it("should gracefully handle initClient when window.google is not loaded", () => {
    delete window.google;
    const service = new GoogleAuthService();
    expect(() => service.initClient(() => {})).not.toThrow();
  });

  it("should re-initialize client during requestAccessToken if callback was provided", () => {
    delete window.google;
    const service = new GoogleAuthService();
    service.initClient(() => {});

    // Now load GIS dynamically
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn().mockReturnValue({
            requestAccessToken: mockRequestAccessToken,
          }),
          revoke: mockRevoke,
        },
      },
    };

    service.requestAccessToken();
    expect(mockRequestAccessToken).toHaveBeenCalledWith({ prompt: "" });
  });

  it("should swallow network errors in _fetchRevoke gracefully", async () => {
    delete window.google?.accounts.oauth2.revoke;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

    const service = new GoogleAuthService();
    service.initClient(() => {});
    capturedConfig!.callback({
      access_token: "token-failing-fetch",
      expires_in: 3600,
    });

    await expect(service.revokeToken()).resolves.toBeUndefined();
    expect(service.isAuthenticated()).toBe(false);
  });
});
