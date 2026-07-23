import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // This is a global cap across every Server Action in the app. It has to
      // cover the largest per-route limit — the Visual Inspection upload UI
      // promises "Maximum size: 50MB" (app/actions.ts), and drone-surveillance
      // enforces its own tighter 15MB check in app/drone-surveillance/actions.ts.
      // Next's own default (1MB) is enforced before our code ever runs, so
      // without this, uploads over 1MB fail at the framework level with an
      // unhandled client-side "Failed to fetch" instead of our validation error.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
