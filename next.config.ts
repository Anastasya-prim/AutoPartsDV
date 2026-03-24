import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Уменьшает образ Docker (см. Dockerfile в корне и deploy/README.md)
  output: "standalone",

  /** В dev браузер ходит на /api → Next проксирует на Nest (4000). В production редиректа нет: /api обрабатывает Nginx. */
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:4000/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
