import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // QuickJS ships a .wasm file; load it from node_modules at runtime instead of bundling it.
  serverExternalPackages: [
    "quickjs-emscripten",
    "quickjs-emscripten-core",
    "@jitl/quickjs-wasmfile-release-sync",
  ],
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
