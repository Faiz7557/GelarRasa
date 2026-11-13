// Semua teks UI Bahasa Indonesia (docs/03 §2, §7; docs/04 §6). Kata terlarang: lihat KATA_TERLARANG.

export const TAGLINE = "Ingat tempatnya, basahi gambutnya, sebelum Agustus.";
export const MEREK = "TABAT";

export const PITA_DEMO = "Data lapangan, tugas, dan akses: demo fiktif. Riwayat jejak: MODIS–BIG 2015–2024.";

// Pengecualian sah atas KATA_TERLARANG: kalimat bernegasi.
export const LEGENDA_KALIMAT = "riwayat pengulangan, bukan peluang terbakar";

export const KATA_TERLARANG = [
  "prediksi",
  "ramalan",
  "peluang terbakar",
  "risiko terbakar tahun ini",
  "AI memutuskan",
  "dijamin",
  "pasti",
] as const;

// Tanggal acuan sementara; nanti diganti nilai dari DB (meta.as_of dan tenggat).
export const AS_OF = "2027-06-01";
export const DEADLINE = "2027-08-01";

export function hariMenujuTenggat(asOf = AS_OF, deadline = DEADLINE): number {
  const t = (s: string) => Date.parse(`${s}T00:00:00Z`);
  return Math.max(0, Math.round((t(deadline) - t(asOf)) / 86_400_000));
}
export const labelHitungMundur = (hari: number) => `${hari} hari menuju 1 Agu`;

export type KunciRute = "kesiapan" | "peta" | "tugas" | "bukti" | "data";

export type ItemMenu = { kunci: string; label: string; href: string; ikon: string };
export const GRUP_MENU: readonly { pertanyaan: string; item: readonly ItemMenu[] }[] = [
  { pertanyaan: "Siap sebelum Agustus?", item: [{ kunci: "kesiapan", label: "Kesiapan", href: "/", ikon: "CalendarClock" }] },
  { pertanyaan: "Di mana mulai?", item: [{ kunci: "peta", label: "Peta Riwayat", href: "/peta", ikon: "Map" }] },
  { pertanyaan: "Apa yang harus dilakukan?", item: [{ kunci: "tugas", label: "Tugas", href: "/tugas", ikon: "ListTodo" }] },
  {
    pertanyaan: "Bisa dipercaya?",
    item: [
      { kunci: "bukti", label: "Putar Ulang 2023", href: "/bukti", ikon: "History" },
      { kunci: "data", label: "Cek Data", href: "/data", ikon: "ShieldCheck" },
    ],
  },
];

export const MENU_LAPANGAN = { label: "TABAT Lapangan", catatan: "buka di ponsel", href: "/lapangan" };

export const JUDUL_LAYAR: Record<KunciRute | "blok" | "lapangan", string> = {
  kesiapan: "Kesiapan",
  peta: "Peta Riwayat",
  tugas: "Tugas",
  bukti: "Putar Ulang 2023",
  data: "Cek Data",
  blok: "Kartu Lokasi",
  lapangan: "TABAT Lapangan",
};

export const LANGKAH_TABAT = ["Telusuri", "Amati", "Bagi tugas", "Aksi", "Tuntaskan"] as const;

export const AKSI = {
  masukDemo: "Masuk sebagai demo",
  masuk: "Masuk",
  keluar: "Keluar",
  resetDemo: "Reset demo",
  cobaLagi: "Coba lagi",
  tutup: "Tutup",
  batal: "Batal",
  setujui: "Setujui",
  tolak: "Tolak",
  buatTugas: "Buat tugas",
  kirimWa: "Kirim ke WhatsApp",
  tandaiTerbukti: "Tandai terbukti",
} as const;

export const MASUK = {
  judul: "Masuk ke TABAT",
  formSummary: "Masuk dengan email dan kata sandi",
  email: "Email",
  sandi: "Kata sandi",
  catatan: "Semua persona fiktif. Tidak ada data pribadi nyata.",
  memuat: "Memasuki…",
};

export const SHELL = {
  pilihPersona: "Ganti persona",
  menuUtama: "Menu utama",
  lewatiKonten: "Lewati ke konten",
  resetBerhasil: "Demo dikembalikan ke keadaan awal.",
  resetGagal: "Reset demo belum tersedia. Coba lagi nanti.",
  resetMemuat: "Mengatur ulang…",
  gantiGagal: "Gagal mengganti persona. Coba lagi.",
  keluarGagal: "Gagal keluar. Coba lagi.",
  badgeTerlambat: (n: number) => `${n} terlambat`,
};

export const PESAN_KOSONG: Record<string, string> = {
  kesiapan: "Belum ada kunjungan tercatat musim ini.",
  peta: "Tidak ada blok dengan filter ini.",
  tugas: "Belum ada tugas di kolom ini.",
  blok: "Blok tidak ditemukan.",
  lapangan: "Tidak ada tugas untuk Anda.",
  umum: "Belum ada data untuk ditampilkan.",
};
export const PESAN_SEGERA = "Layar ini sedang disiapkan.";
export const RESET_FILTER = "Atur ulang filter";
export const KEMBALI_KE_PETA = "Kembali ke Peta";

export const PESAN_GALAT = {
  umum: "Terjadi gangguan. Coba lagi.",
  petaGagal: "Peta tidak dapat dimuat. Daftar blok tetap ditampilkan.",
  tugasGagal: "Status tugas tidak berubah. Coba lagi.",
  antreanGagal: "Antrean belum terkirim. TABAT akan mencoba lagi otomatis.",
  belumMasuk: "Belum masuk.",
  peranSalah: "Peran Anda tidak boleh melakukan ini.",
  bodyTidakValid: "Isi permintaan tidak valid.",
  kredensialSalah: "Email atau kata sandi salah.",
  personaTidakDikenal: "Persona tidak dikenal.",
  jaringan: "Tidak dapat terhubung. Periksa sambungan Anda.",
};

export const ALASAN = ["akses_terputus", "sudah_dibasahi", "bukan_gambut", "di_luar_kewenangan", "tabat_sudah_baik", "lainnya"] as const;
export type Alasan = (typeof ALASAN)[number];
export const LABEL_ALASAN: Record<Alasan, string> = {
  akses_terputus: "Akses terputus",
  sudah_dibasahi: "Sudah dibasahi",
  bukan_gambut: "Bukan gambut",
  di_luar_kewenangan: "Di luar kewenangan",
  tabat_sudah_baik: "Tabat sudah baik",
  lainnya: "Lainnya",
};

export const STATUS_TUGAS = ["usulan", "disetujui", "diperiksa", "dirawat", "terbukti", "ditolak"] as const;
export type StatusTugas = (typeof STATUS_TUGAS)[number];
export const LABEL_STATUS_TUGAS: Record<StatusTugas, string> = {
  usulan: "Usulan",
  disetujui: "Disetujui",
  diperiksa: "Diperiksa",
  dirawat: "Dirawat",
  terbukti: "Terbukti",
  ditolak: "Ditolak",
};

export const KELAS = ["P1", "P2", "CEK", "PANTAU", "LAIN"] as const;
export type Kelas = (typeof KELAS)[number];
export const LABEL_KELAS: Record<Kelas, string> = {
  P1: "Prioritas 1",
  P2: "Prioritas 2",
  CEK: "Perlu dicek",
  PANTAU: "Dipantau",
  LAIN: "Tanpa jejak",
};

export const AKSES = ["jalan", "sungai", "sulit", "tidak_bisa"] as const;
export type Akses = (typeof AKSES)[number];
export const LABEL_AKSES: Record<Akses, string> = {
  jalan: "Lewat jalan",
  sungai: "Lewat sungai",
  sulit: "Akses sulit",
  tidak_bisa: "Tidak bisa dijangkau",
};
