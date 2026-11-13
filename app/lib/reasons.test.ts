import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortirKataKunci, ALASAN_TOLAK } from './reasons';

const cases: [string, string][] = [
  ['jembatan ke blok putus sejak Mei', 'akses_terputus'],
  ['jembatan putus', 'akses_terputus'],
  ['Lokasi TERGENANG banjir', 'akses_terputus'],
  ['lahannya ternyata tanah mineral', 'bukan_gambut'],
  ['data peta salah', 'bukan_gambut'],
  ['masuk konsesi PT', 'di_luar_kewenangan'],
  ['wilayah HGU perusahaan', 'di_luar_kewenangan'],
  ['lahan sudah basah', 'sudah_dibasahi'],
  ['muka air sudah naik', 'sudah_dibasahi'],
  ['tabat masih baik', 'tabat_sudah_baik'],
  ['sekat baru diperbaiki', 'tabat_sudah_baik'],
  ['asdf qwerty', 'lainnya'],
];
test('sortirKataKunci', () => {
  for (const [t, a] of cases) assert.equal(sortirKataKunci(t).alasan, a, t);
  assert.equal(sortirKataKunci('asdf').cocok, null);
  assert.ok(sortirKataKunci('jembatan putus').cocok);
  assert.ok(ALASAN_TOLAK.includes('lainnya'));
});
