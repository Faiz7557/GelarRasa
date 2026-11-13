import { JUDUL_LAYAR, LABEL_ALASAN, type Alasan } from "@/lib/copy";
import { getFacts, getMeta } from "@/lib/data";
import { getEksternal, getMusim, getObsHistogram, getPenolakan } from "@/lib/cekdata";
import { AMBANG_AIR_CM, JEDA, LEAD_AKSES } from "@/lib/rules";
import { fmtHa, fmtNum, fmtPct, fmtTanggal } from "@/lib/format";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ObsHistogram, SeasonChart } from "@/components/data/Charts";

export const dynamic = "force-dynamic";

const BAGIAN = [
  ["asumsi", "Asumsi"],
  ["sumber", "Sumber data"],
  ["pengamatan", "Kelengkapan pengamatan"],
  ["penolakan", "Dipelajari dari penolakan"],
  ["musim", "Musim"],
  ["tidak", "Yang tidak kami lakukan"],
  ["pilihan", "Pilihan kami"],
] as const;

const SUMBER_ALASAN: Record<string, string> = { pilih: "dipilih petugas", ai: "disarankan AI, dikonfirmasi petugas", kata_kunci: "dari kata kunci catatan" };
const SUMBER_DATA = [
  ["MODIS MCD64A1.061", "Bukti positif area terbakar, tile h29v09, 2015–2024."],
  ["BIG, peta lahan gambut (layer 6)", "Batas lahan gambut."],
  ["GWIS bulanan", "Pola bulanan luas terbakar."],
  ["GADM 4.1 level 2", "Batas kabupaten."],
];

const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2">
    <span aria-hidden className="text-ink-3">•</span>
    <span>{children}</span>
  </li>
);

export default function Data() {
  const m = getMeta();
  const f = Object.fromEntries(getFacts().map((x) => [x.key, x]));
  const eks = getEksternal();
  const { bins, prioritasKurang4, prioritasTotal } = getObsHistogram();
  const tolak = getPenolakan();
  const musim = getMusim();
  const blockHa = Number(m.block_ha);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[28px] font-bold leading-[34px] text-ink">{JUDUL_LAYAR.data}</h1>
      <nav aria-label="Lompat ke bagian" className="flex flex-wrap gap-2">
        {BAGIAN.map(([id, nama]) => (
          <a key={id} href={`#${id}`} className="min-h-9 rounded-full border border-line bg-panel px-3 py-1.5 text-[14px] text-ink-2 hover:text-ink">
            {nama}
          </a>
        ))}
      </nav>

      <Card id="asumsi" className="scroll-mt-20 text-[15px] text-ink-2">
        <CardTitle>Asumsi</CardTitle>
        <ul className="mt-3 flex flex-col gap-2">
          <Li>Tanggal hari ini di demo: <b className="text-ink">{fmtTanggal(m.as_of)}</b> <DemoBadge /></Li>
          <Li>Tenggat musim: <b className="text-ink">{fmtTanggal(m.deadline)}</b>.</Li>
          <Li>Batas aman periksa = tenggat dikurangi waktu akses ke blok dan jeda {JEDA} hari. Waktu akses: jalan {LEAD_AKSES.jalan} hari, sungai {LEAD_AKSES.sungai} hari, sulit {LEAD_AKSES.sulit} hari. Kelas akses adalah data demo <DemoBadge /></Li>
          <Li>Muka air diukur dari permukaan gambut ke bawah. Sampai {AMBANG_AIR_CM} cm dihitung aman; lebih dari {AMBANG_AIR_CM} cm di bawah ambang kerusakan (rujukan: PP 57/2016 dan Pantau Gambut 2024).</Li>
          <Li>Blok prioritas dihitung <b className="text-ink">siap</b> bila sebelum tenggat ada kunjungan dengan muka air terisi dan kondisi tabat terisi, serta tugas pemeriksaannya berstatus terbukti. Blok wajib: P1, ditambah P2 bila mode El Niño aktif <DemoBadge /></Li>
        </ul>
      </Card>

      <Card id="sumber" className="scroll-mt-20 text-[15px] text-ink-2">
        <CardTitle>Sumber data</CardTitle>
        <ul className="mt-3 flex flex-col gap-2">
          {SUMBER_DATA.map(([n, d]) => (
            <Li key={n}><b className="text-ink">{n}</b>. {d}</Li>
          ))}
          <Li>Jendela studi: {m.data_window}. Blok di luar jendela tidak dinilai.</Li>
        </ul>
        <h3 className="mt-4 font-display text-[16px] font-semibold text-ink">Kutipan dari laporan lain</h3>
        <ul className="mt-2 flex flex-col gap-3">
          {eks.map((e) => (
            <li key={e.key} className="rounded-control border border-line bg-panel-2 p-3">
              <p><b className="text-ink">{fmtPct(e.persen)}</b> {e.ukuran}</p>
              <p className="mt-1 text-[14px]">
                Sumber: {e.sumber}.{" "}
                {e.tautan && <a href={e.tautan} target="_blank" rel="noreferrer" className="underline">Tautan</a>}{" "}
                {e.status && <Badge varian="segera">{e.status}</Badge>}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card id="pengamatan" className="scroll-mt-20 text-[15px] text-ink-2">
        <CardTitle>Kelengkapan pengamatan</CardTitle>
        <p className="mt-2">Jumlah blok menurut tahun teramati lengkap (dari 10 tahun, 2015–2024). Blok tanpa jejak bukan bukti bebas kebakaran.</p>
        <div className="mt-3"><ObsHistogram bins={bins} /></div>
        <p className="mt-3">
          Blok prioritas (P1 dan P2) dengan pengamatan kurang dari 4 tahun: <b className="text-ink">{fmtNum(prioritasKurang4)}</b> dari {fmtNum(prioritasTotal)}.
        </p>
      </Card>

      <Card id="penolakan" className="scroll-mt-20 text-[15px] text-ink-2">
        <div className="flex items-center gap-2"><CardTitle>Yang dipelajari dari penolakan</CardTitle><DemoBadge /></div>
        {tolak.total === 0 ? (
          <div className="mt-3"><EmptyState pesan="Belum ada usulan ditolak." /></div>
        ) : (
          <>
            <p className="mt-2">{fmtNum(tolak.total)} usulan ditolak.</p>
            <ul className="mt-2 flex flex-col gap-1">
              {tolak.perAlasan.map((r) => (
                <li key={r.alasan} className="flex justify-between gap-2 border-b border-line py-1">
                  <span>{LABEL_ALASAN[r.alasan as Alasan] ?? r.alasan}</span>
                  <b className="text-ink">{fmtNum(r.n)}</b>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[14px]">Asal alasan: {tolak.perSumber.map((s) => `${SUMBER_ALASAN[s.sumber] ?? s.sumber} (${fmtNum(s.n)})`).join(", ")}.</p>
            {tolak.contoh.length > 0 && (
              <>
                <h3 className="mt-3 font-display text-[16px] font-semibold text-ink">Catatan terbaru</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {tolak.contoh.map((c, i) => (
                    <li key={i} className="rounded-control border border-line bg-panel-2 p-3">
                      <Badge>{LABEL_ALASAN[c.alasan as Alasan] ?? c.alasan}</Badge> {c.catatan}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </Card>

      <Card id="musim" className="scroll-mt-20 text-[15px] text-ink-2">
        <CardTitle>Musim</CardTitle>
        <p className="mt-2">
          {fmtPct(f.agu_okt_pct.value)} luas terbakar jatuh pada Agustus–Oktober (GWIS Kalsel dan Kalteng, 2015–2024). Karena itu pemeriksaan harus selesai sebelum 1 Agustus.
        </p>
        <div className="mt-3"><SeasonChart data={musim} /></div>
      </Card>

      <Card id="tidak" className="scroll-mt-20 text-[15px] text-ink-2">
        <CardTitle>Apa yang TABAT tidak lakukan</CardTitle>
        <ul className="mt-3 flex flex-col gap-2">
          <Li>Tidak meramal kebakaran. Peta menunjukkan riwayat pengulangan.</Li>
          <Li>Tidak mengukur emisi.</Li>
          <Li>Tidak menggantikan SiPongi atau BMKG.</Li>
          <Li>Tidak mengelola anggaran atau izin.</Li>
          <Li>Data lapangan di demo ini fiktif <DemoBadge /></Li>
        </ul>
      </Card>

      <Card id="pilihan" className="scroll-mt-20 text-[15px] text-ink-2">
        <CardTitle>Pilihan kami dan alasannya</CardTitle>
        <ul className="mt-3 flex flex-col gap-2">
          <Li><b className="text-ink">Blok 2,3 km.</b> Satu blok adalah 5×5 sel MODIS, sekitar {fmtHa(blockHa, 1)}: cukup kecil untuk ditunjuk ke satu regu, cukup besar agar tidak terlalu rinci.</Li>
          <Li><b className="text-ink">Tanpa skor berbobot.</b> Blok diurutkan menurut sel berulang terbanyak, lalu tahun jejak terakhir, lalu Gi*, lalu nomor blok: satu kalimat yang bisa diperiksa siapa pun.</Li>
          <Li><b className="text-ink">Hanya riwayat.</b> TABAT menunjukkan di mana jejak berulang, bukan kapan atau apakah akan terbakar lagi.</Li>
        </ul>
      </Card>
    </div>
  );
}
