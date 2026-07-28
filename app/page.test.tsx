import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders without crashing and composes all main sections", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Visual Inspection MVP" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Upload Concrete Surface" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Image Preview" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Inspection Results" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Engineering Report" })
    ).toBeInTheDocument();
  });
});
