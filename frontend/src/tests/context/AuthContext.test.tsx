import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import type { GoogleAuthService } from "@/services/GoogleAuthService";

describe("AuthContext and AuthProvider", () => {
  let mockAuthService: GoogleAuthService;
  let initClientCallback: ((token: string) => void) | null;

  beforeEach(() => {
    initClientCallback = null;
    mockAuthService = {
      initClient: vi.fn((cb: (token: string) => void) => {
        initClientCallback = cb;
      }),
      requestAccessToken: vi.fn(),
      getAccessToken: vi.fn().mockReturnValue(null),
      revokeToken: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: vi.fn().mockReturnValue(false),
    } as unknown as GoogleAuthService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize client and provide unauthenticated state by default", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider authService={mockAuthService}>{children}</AuthProvider>
      ),
    });

    expect(mockAuthService.initClient).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should update state when token callback is invoked", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider authService={mockAuthService}>{children}</AuthProvider>
      ),
    });

    expect(initClientCallback).not.toBeNull();

    act(() => {
      initClientCallback!("received-token-xyz");
    });

    expect(result.current.token).toBe("received-token-xyz");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should call requestAccessToken when login is invoked", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider authService={mockAuthService}>{children}</AuthProvider>
      ),
    });

    act(() => {
      result.current.login();
    });

    expect(mockAuthService.requestAccessToken).toHaveBeenCalledTimes(1);
  });

  it("should reset loading state if requestAccessToken throws", () => {
    vi.mocked(mockAuthService.requestAccessToken).mockImplementationOnce(() => {
      throw new Error("GIS failure");
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider authService={mockAuthService}>{children}</AuthProvider>
      ),
    });

    act(() => {
      result.current.login();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should revoke token and reset state on logout", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider authService={mockAuthService}>{children}</AuthProvider>
      ),
    });

    act(() => {
      initClientCallback!("valid-token");
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockAuthService.revokeToken).toHaveBeenCalledTimes(1);
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("should render child elements inside provider", () => {
    render(
      <AuthProvider authService={mockAuthService}>
        <div data-testid="child-element">Inside Provider</div>
      </AuthProvider>,
    );

    expect(screen.getByTestId("child-element")).toHaveTextContent(
      "Inside Provider",
    );
  });

  it("should instantiate default GoogleAuthService when not provided in props", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current.authService).toBeDefined();
  });
});
