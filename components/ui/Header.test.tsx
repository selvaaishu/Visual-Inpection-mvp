import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "./Header";

describe("Header", () => {
  it("renders the app title and subtitle", () => {
    render(<Header />);
    expect(
      screen.getByRole("heading", { name: "Visual Inspection MVP" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("AI-powered concrete surface inspection")
    ).toBeInTheDocument();
  });
});
