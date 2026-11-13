"use client";

import { useCallback, useEffect, useState } from "react";

export type BlokAttrs = {
  kolom: string[]; // ["id","kelas","tipe","hotspot","status"]
  kelas: string[];
  status: string[];
  baris: number[][]; // [id, kelasIdx, tipe, hotspot, statusIdx]
};

/** Ambil /api/blok-atribut sekali. `diberikan` dipakai bila halaman sudah punya datanya (tanpa fetch ulang). */
export function useBlockAttrs(diberikan?: BlokAttrs) {
  const [attrs, setAttrs] = useState<BlokAttrs | null>(null);
  const [galat, setGalat] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (diberikan) return;
    let batal = false;
    fetch("/api/blok-atribut")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => !batal && setAttrs(j.data))
      .catch(() => !batal && setGalat(true));
    return () => {
      batal = true;
    };
  }, [diberikan, n]);

  const ulang = useCallback(() => {
    setGalat(false);
    setN((v) => v + 1);
  }, []);
  return { attrs: diberikan ?? attrs, galat, ulang };
}
