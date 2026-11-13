import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TABAT Lapangan",
    short_name: "TABAT",
    start_url: "/lapangan",
    scope: "/",
    display: "standalone",
    background_color: "#f0e6d3",
    theme_color: "#2c2318",
    lang: "id",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" }],
  };
}
