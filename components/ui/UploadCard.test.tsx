import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import UploadCard from "./UploadCard";

describe("UploadCard", () => {
  it("renders the upload prompt and action buttons", () => {
    render(<UploadCard />);
    expect(
      screen.getByRole("heading", { name: "Upload Concrete Surface" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse Files" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Inspect Surface" })
    ).toBeInTheDocument();
  });

  // Documents current behavior: the upload flow is not wired up yet.
  // This test is an intentional tripwire — a future PR that adds real file
  // upload should update it rather than delete it.
  it("has no functional file input yet (upload is not wired up)", () => {
    const { container } = render(<UploadCard />);
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
});
