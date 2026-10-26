import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The desktop browser may open the same local dev site through either host.
  // Next's dev-only HMR endpoint blocks non-localhost origins unless allowed.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
