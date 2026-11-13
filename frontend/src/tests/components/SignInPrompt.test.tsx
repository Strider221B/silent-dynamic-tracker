import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { AuthContext, type IAuthContextValue } from "@/context/AuthContext";
import type { GoogleAuthService } from "@/services/GoogleAuthService";

describe("SignInPrompt", () => {
  let mockAuthContext: IAuthContextValue;

  beforeEach(() => {
    mockAuthContext = {
      token: null,
      isAuthenticated: false,
      isLoading: false,
      authService: {} as GoogleAuthService,
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("should render application title, subtitle, and privacy explanation", () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SignInPrompt />
      </AuthContext.Provider>,
    );

    expect(
      screen.getByRole("heading", { name: /silent dynamic tracker/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/strict privacy: scoped only to files created by this app/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with google/i }),
    ).toBeInTheDocument();
  });

  it("should trigger login and callback when button is clicked", () => {
    const handleSignInMock = vi.fn();
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SignInPrompt onSignIn={handleSignInMock} />
      </AuthContext.Provider>,
    );

    const button = screen.getByRole("button", { name: /sign in with google/i });
    fireEvent.click(button);

    expect(handleSignInMock).toHaveBeenCalledTimes(1);
    expect(mockAuthContext.login).toHaveBeenCalledTimes(1);
  });

  it("should show loading state and disable button when authenticating", () => {
    mockAuthContext.isLoading = true;

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SignInPrompt />
      </AuthContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });
});

