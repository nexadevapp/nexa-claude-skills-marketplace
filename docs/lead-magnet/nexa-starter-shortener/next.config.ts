import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  poweredByHeader: false,
};

export default config;
