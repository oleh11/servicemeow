import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: "/api/now/update-set",
        destination: "/api/now/update-sets",
      },
      {
        source: "/api/now/update-set/:path*",
        destination: "/api/now/update-sets/:path*",
      },
    ];
  },
};

export default nextConfig;
