import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";

// next/font/google relies on a Next.js build-time transform that isn't
// available under plain Vitest, so it's mocked here rather than executed.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "mock-font-sans" }),
  Geist_Mono: () => ({ variable: "mock-font-mono" }),
}));

describe("RootLayout", () => {
  it("renders an <html> root wrapping <body> and the given children", async () => {
    const { default: RootLayout } = await import("./layout");

    // RootLayout renders <html>/<body>, which testing-library's render()
    // cannot mount (it can't nest <html> inside a container div), so the
    // component function is invoked directly and its returned element tree
    // is inspected instead.
    const element = RootLayout({
      children: <div data-testid="child">hello</div>,
    }) as ReactElement<{ children: ReactElement }>;

    expect(element.type).toBe("html");
    const body = element.props.children as ReactElement<{
      children: ReactElement<{ "data-testid": string }>;
    }>;
    expect(body.type).toBe("body");
    expect(body.props.children.props["data-testid"]).toBe("child");
  });
});
