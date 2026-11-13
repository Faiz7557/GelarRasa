export type LangkahTur = { kunci: string; judul: string; isi: (el: Element | null) => string };

/** Teks tanpa angka hardcode; angka hanya dibaca dari DOM target. */
export const LANGKAH: LangkahTur[] = [
  {
    kunci: "hitung-mundur",
    judul: "Hitung mundur",
    isi: (el) => `${el?.getAttribute("aria-label") ?? "Hitung mundur menuju 1 Agustus"} — satu pertanyaan: siap sebelum Agustus?`,
  },
  { kunci: "urus-dulu", judul: "Urus ini dulu", isi: () => "Lima blok yang harus diurus dulu, diurut dari riwayat berulang." },
  { kunci: "kartu-lokasi", judul: "Kartu Lokasi", isi: () => "Klik blok untuk melihat riwayat, kondisi, tindakan, tenggat." },
  { kunci: "tugas", judul: "Tugas", isi: () => "Satu pemilik, satu tenggat, satu bukti." },
  { kunci: "bukti", judul: "Putar Ulang 2023", isi: () => "Kenapa urutan ini dipercaya: uji ulang dengan data 2023." },
];
