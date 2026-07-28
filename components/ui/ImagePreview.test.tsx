import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ImagePreview from "./ImagePreview";

describe("ImagePreview", () => {
  it("renders the empty-state placeholder", () => {
    render(<ImagePreview />);
    expect(
      screen.getByRole("heading", { name: "Image Preview" })
    ).toBeInTheDocument();
    expect(screen.getByText("No image uploaded yet")).toBeInTheDocument();
  });
});
