import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// The real npm "server-only" package unconditionally throws on import
// (see node_modules/server-only/index.js) — it only no-ops via the
// "react-server" export condition, which Next's bundler sets but Vitest
// does not. Mock it out so lib/env.ts and lib/inspection-service.ts can be
// imported under test.
vi.mock("server-only", () => ({}));
