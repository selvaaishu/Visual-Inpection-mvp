import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Matches MAX_UPLOAD_BYTES in lib/drone/schemas.ts — Next's own default
      // (1MB) is enforced before our Server Action code ever runs, so it has
      // to be raised here too or real photos get rejected at the framework
      // level with an unhandled client-side "Failed to fetch".
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
