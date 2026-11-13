import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR (mis. .next/par/t41) memungkinkan beberapa dev server paralel di folder yang sama.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["better-sqlite3"],
  // Berkas SQLite dibaca saat runtime, jadi harus ikut ke setiap fungsi serverless.
  outputFileTracingIncludes: {
    "/**": ["./data/tabat.db"],
  },
  // GeoJSON statis jarang berubah: cache 1 hari di browser/CDN, basi-sambil-validasi 7 hari.
  async headers() {
    return [
      {
        source: "/geo/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
