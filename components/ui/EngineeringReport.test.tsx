import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EngineeringReport from "./EngineeringReport";

describe("EngineeringReport", () => {
  it("renders the not-yet-performed placeholder message", () => {
    render(<EngineeringReport />);
    expect(
      screen.getByRole("heading", { name: "Engineering Report" })
    ).toBeInTheDocument();
    expect(screen.getByText(/No inspection has been performed yet/)).toBeInTheDocument();
  });
});
