// Smoke API TABAT. Pakai: node scripts/api-smoke.mjs [baca|tugas|kunjungan|reset|semua]  (env BASE, default http://localhost:3000)
import { randomUUID } from 'node:crypto';

const BASE = process.env.BASE || 'http://localhost:3000';
const grup = process.argv[2] || 'semua';
let cookie = '';
let gagal = 0;
const st = {}; // state antar-langkah

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const sc = res.headers.getSetCookie?.() ?? [];
  const sess = sc.map((c) => c.split(';')[0]).find((c) => c.startsWith('tabat_session='));
  if (sess) cookie = sess;
  let json = null;
  try { json = await res.json(); } catch { /* bukan JSON */ }
  return { status: res.status, json };
}

async function langkah(nama, method, path, body, harap, cek) {
  const r = await call(method, path, body);
  let lulus = r.status === harap;
  let catatan = '';
  if (lulus && cek) {
    try { const m = cek(r.json); if (m !== true) { lulus = false; catatan = ` (${m || 'isi tidak sesuai'})`; } } catch (e) { lulus = false; catatan = ` (${e.message})`; }
  }
  if (!lulus) gagal++;
  const pesan = r.json?.error ? ` - ${r.json.error}` : '';
  console.log(`${lulus ? 'LULUS' : 'GAGAL'}  ${method.padEnd(5)} ${path}  -> ${r.status} (harap ${harap})${catatan}${lulus ? '' : pesan}  [${nama}]`);
  return r;
}

const masuk = () => langkah('login demo', 'POST', '/api/auth/masuk', { demo: true }, 200);
const ganti = (persona) => langkah(`ganti ke ${persona}`, 'POST', '/api/auth/ganti', { persona }, 200);

async function cariBlokBebas(n) {
  const bl = (await call('GET', '/api/blok?kelas=P1&limit=2000')).json.data;
  const tg = (await call('GET', '/api/tugas')).json.data;
  const terpakai = new Set(tg.map((t) => t.block_id));
  const bebas = bl.map((b) => b.block_id).filter((id) => !terpakai.has(id)).slice(0, n);
  if (bebas.length < n) throw new Error('Tidak cukup blok P1 tanpa tugas untuk smoke');
  return bebas;
}

async function baca() {
  console.log('== grup baca');
  await masuk();
  await langkah('ringkasan', 'GET', '/api/ringkasan', undefined, 200, (j) => !!j.data.kesiapan);
  const bl = await langkah('daftar blok', 'GET', '/api/blok?limit=5', undefined, 200, (j) => j.data.length > 0);
  const id = bl.json?.data?.[0]?.block_id ?? 1;
  await langkah('detail blok', 'GET', `/api/blok/${id}`, undefined, 200, (j) => !!j.data.block);
  await langkah('blok tidak ada', 'GET', '/api/blok/999999999', undefined, 404);
  await langkah('atribut blok', 'GET', '/api/blok-atribut', undefined, 200, (j) => j.data.baris.length > 0);
  await langkah('daftar tugas', 'GET', '/api/tugas', undefined, 200, (j) => Array.isArray(j.data));
}

async function siapkanTugas() {
  if (st.A) return;
  await ganti('koordinator');
  const [a, b] = await cariBlokBebas(2);
  const ra = await langkah('buat usulan A', 'POST', '/api/tugas', { block_id: a, jenis: 'periksa', catatan: 'smoke' }, 201, (j) => j.data.tugas[0].status === 'usulan');
  const rb = await langkah('buat usulan B', 'POST', '/api/tugas', { block_id: b }, 201);
  st.A = ra.json?.data?.tugas?.[0]?.tugas_id;
  st.B = rb.json?.data?.tugas?.[0]?.tugas_id;
  st.blokA = a;
  await langkah('usulan duplikat', 'POST', '/api/tugas', { block_id: a }, 409);
}

async function tugas() {
  console.log('== grup tugas');
  await masuk();
  await siapkanTugas();
  await langkah('body salah', 'POST', '/api/tugas', { block_id: 'x' }, 400);
  await langkah('blok tidak ada', 'POST', '/api/tugas', { block_id: 999999999 }, 404);
  await langkah('massal tiap duplikat dilewati', 'POST', '/api/tugas', { block_ids: [st.blokA], jenis: 'periksa' }, 200, (j) => j.data.dilewati === 1 && j.data.dibuat === 0);
  await langkah('setujui A (pemilik regu)', 'PATCH', `/api/tugas/${st.A}`, { aksi: 'setujui', pemilik: 'regu' }, 200, (j) => j.data.status === 'disetujui' && j.data.pemilik === 'regu');
  await langkah('aksi tidak dikenal', 'PATCH', `/api/tugas/${st.A}`, { aksi: 'hapus' }, 400);
  await langkah('tugas tidak ada', 'PATCH', '/api/tugas/T-999999', { aksi: 'buka' }, 404);
  await ganti('regu');
  await langkah('regu setujui B -> dilarang', 'PATCH', `/api/tugas/${st.B}`, { aksi: 'setujui' }, 403);
  await langkah('regu POST tugas -> dilarang', 'POST', '/api/tugas', { block_id: st.blokA }, 403);
  await ganti('koordinator');
  await langkah('tolak B tanpa alasan sah', 'PATCH', `/api/tugas/${st.B}`, { aksi: 'tolak', alasan: 'ngawur' }, 400);
  await langkah('tolak B', 'PATCH', `/api/tugas/${st.B}`, { aksi: 'tolak', alasan: 'akses_terputus', catatan: 'jembatan putus' }, 200, (j) => j.data.status === 'ditolak' && j.data.alasan_tolak === 'akses_terputus');
  await langkah('status tidak sah (ditolak -> dirawat)', 'PATCH', `/api/tugas/${st.B}`, { aksi: 'status', ke: 'dirawat' }, 409);
  await langkah('terbukti tanpa foto -> 409', 'PATCH', `/api/tugas/${st.A}`, { aksi: 'status', ke: 'terbukti' }, 409);
  await langkah('buka ulang B', 'PATCH', `/api/tugas/${st.B}`, { aksi: 'buka' }, 200, (j) => j.data.status === 'usulan');
}

async function kunjungan() {
  console.log('== grup kunjungan');
  await masuk();
  await siapkanTugas();
  // pastikan A berstatus disetujui (bila grup tugas tidak jalan)
  const a = (await call('GET', `/api/tugas?block=${st.blokA}`)).json.data.find((t) => t.tugas_id === st.A);
  if (a.status === 'usulan') await langkah('setujui A', 'PATCH', `/api/tugas/${st.A}`, { aksi: 'setujui', pemilik: 'regu' }, 200);
  await ganti('regu');
  const cid = randomUUID();
  const body = {
    client_id: cid, block_id: st.blokA, tugas_id: st.A, jenis: 'periksa', tanggal: '2027-05-20',
    muka_air_cm: 30, kondisi_tabat: 'baik', akses_aktual: 'jalan', catatan: 'smoke',
    foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==', koordinat_sumber: 'centroid',
  };
  const k1 = await langkah('kunjungan periksa', 'POST', '/api/kunjungan', body, 201, (j) => !!j.data.kunjungan_id);
  const k2 = await langkah('kirim ulang client_id sama', 'POST', '/api/kunjungan', body, 200, (j) => j.data.duplikat === true && j.data.kunjungan_id === k1.json.data.kunjungan_id);
  void k2;
  await langkah('tugas jadi diperiksa', 'GET', `/api/tugas?block=${st.blokA}`, undefined, 200, (j) => j.data.find((t) => t.tugas_id === st.A).status === 'diperiksa');
  await langkah('1 baris kunjungan di blok', 'GET', `/api/blok/${st.blokA}`, undefined, 200, (j) => j.data.kunjungan.filter((k) => k.client_id === cid).length === 1);
  await langkah('regu rawat -> dilarang', 'POST', '/api/kunjungan', { ...body, client_id: randomUUID(), jenis: 'rawat' }, 403);
  await langkah('muka air di luar rentang', 'POST', '/api/kunjungan', { ...body, client_id: randomUUID(), muka_air_cm: 500 }, 400);
  await langkah('foto bukan jpeg', 'POST', '/api/kunjungan', { ...body, client_id: randomUUID(), foto: 'data:image/png;base64,AAAA' }, 400);
  await langkah('body > 300 KB', 'POST', '/api/kunjungan', { ...body, client_id: randomUUID(), catatan: 'x'.repeat(310 * 1024) }, 413);
  await ganti('koordinator');
  await langkah('terbukti (ada foto)', 'PATCH', `/api/tugas/${st.A}`, { aksi: 'status', ke: 'terbukti' }, 200, (j) => j.data.status === 'terbukti' && j.data.has_foto_visit === true);
}

async function reset() {
  console.log('== grup reset');
  await masuk();
  await langkah('koordinator reset', 'POST', '/api/demo/reset', {}, 200, (j) => j.ok === true);
  await ganti('regu');
  await langkah('regu reset -> dilarang', 'POST', '/api/demo/reset', {}, 403);
  await ganti('koordinator');
}

const G = { baca, tugas, kunjungan, reset };
if (grup !== 'semua' && !G[grup]) {
  console.error('Grup tidak dikenal. Pilih: baca | tugas | kunjungan | reset | semua');
  process.exit(2);
}
try {
  for (const n of grup === 'semua' ? ['baca', 'tugas', 'kunjungan', 'reset'] : [grup]) await G[n]();
  // bersih-bersih agar state kembali awal
  await masuk();
  await langkah('reset akhir', 'POST', '/api/demo/reset', {}, 200);
} catch (e) {
  console.error('GAGAL: ' + e.message);
  gagal++;
}
console.log(gagal ? `\n${gagal} langkah tidak sesuai harapan.` : '\nSemua langkah sesuai harapan.');
process.exit(gagal ? 1 : 0);
