import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "@/App";

describe("App", () => {
  it("should render AuthBarrier displaying sign in prompt when unauthenticated", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /silent dynamic tracker/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with google/i }),
    ).toBeInTheDocument();
  });
});

