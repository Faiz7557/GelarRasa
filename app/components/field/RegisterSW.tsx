"use client";

import { useEffect } from "react";

/** Daftarkan service worker (hanya produksi). Pasang di app/lapangan/layout.tsx. */
export function RegisterSW() {
  useEffect(() => {
    try {
      if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
      }
    } catch {}
  }, []);
  return null;
}
