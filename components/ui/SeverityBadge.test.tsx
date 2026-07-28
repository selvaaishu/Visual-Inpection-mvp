import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SeverityBadge from "./SeverityBadge";

describe("SeverityBadge", () => {
  it.each([
    ["Low", "bg-green-100", "text-green-700"],
    ["Medium", "bg-yellow-100", "text-yellow-700"],
    ["High", "bg-orange-100", "text-orange-700"],
    ["Critical", "bg-red-100", "text-red-700"],
  ] as const)("renders %s with its mapped color classes", (severity, bg, text) => {
    render(<SeverityBadge severity={severity} />);
    const badge = screen.getByText(severity);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(bg);
    expect(badge).toHaveClass(text);
  });
});
