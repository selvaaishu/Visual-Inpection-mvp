import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it.each([
    ["PASS", "bg-green-100", "text-green-700"],
    ["MONITOR", "bg-yellow-100", "text-yellow-700"],
    ["ESCALATE", "bg-red-100", "text-red-700"],
  ] as const)("renders %s with its mapped color classes", (status, bg, text) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(status);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(bg);
    expect(badge).toHaveClass(text);
  });
});
