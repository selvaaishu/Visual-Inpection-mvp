import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InspectionResults from "./InspectionResults";

// InspectionResults currently renders hardcoded mock data rather than props
// or real analysis results — this test documents that current behavior.
describe("InspectionResults", () => {
  it("renders the hardcoded mock inspection result", () => {
    render(<InspectionResults />);
    expect(
      screen.getByRole("heading", { name: "Inspection Results" })
    ).toBeInTheDocument();
    expect(screen.getByText("Hairline Crack")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("Column B4")).toBeInTheDocument();
    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(screen.getByText("MONITOR")).toBeInTheDocument();
  });
});
