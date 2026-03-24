import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Уменьшает образ Docker (см. Dockerfile в корне и deploy/README.md)
  output: "standalone",
};

export default nextConfig;
