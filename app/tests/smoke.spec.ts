import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const ABAIKAN = /HMR|WebSocket|webpack-hmr|favicon|React DevTools/i;
const errs: string[] = [];
let tugasId = "";
let blokId = 0;

const masukApi = (page: Page) => page.request.post("/api/auth/masuk", { data: { demo: true } });
const ganti = (page: Page, persona: string) => page.request.post("/api/auth/ganti", { data: { persona } });

test.beforeEach(async ({ page }) => {
  errs.length = 0;
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !ABAIKAN.test(m.text()) && !ABAIKAN.test(m.location().url)) errs.push(`console: ${m.text()}`);
  });
});
test.afterEach(() => {
  expect(errs).toEqual([]);
});

test("1. demo langsung terbuka tanpa login dan reset", async ({ page }) => {
  await page.goto("/masuk");
  await expect(page).toHaveURL(/\/(\?.*)?$/);
  const r = await page.request.post("/api/demo/reset");
  expect(r.status()).toBe(200);
});

test("2. tujuh halaman dan hero", async ({ page }) => {
  await masukApi(page);
  const tugas = await (await page.request.get("/api/tugas")).json();
  blokId = tugas.data?.[0]?.block_id ?? 50980;
  const halaman: [string, RegExp][] = [
    ["/?tur=0", /Siap sebelum 1 Agustus\?/],
    ["/peta?tur=0", /Peta Riwayat/],
    [`/blok/${blokId}?tur=0`, new RegExp(`Blok ${blokId}`)],
    ["/tugas?tur=0", /^Tugas$/],
    ["/bukti?tur=0", /Putar Ulang 2023/],
    ["/data?tur=0", /Cek Data/],
    ["/lapangan?tur=0", /Daring|Luring/],
  ];
  for (const [url, judul] of halaman) {
    const res = await page.goto(url);
    expect(res?.ok(), url).toBeTruthy();
    if (url.startsWith("/lapangan")) await expect(page.getByText(judul).first()).toBeVisible();
    else await expect(page.getByRole("heading", { level: 1, name: judul })).toBeVisible();
    await expect(page.getByText(/demo fiktif/).first(), url).toBeVisible();
    await page.waitForLoadState("networkidle");
  }
  // hero: angka dari API
  const { data } = await (await page.request.get("/api/ringkasan")).json();
  const { siap, wajib } = data.kesiapan;
  await page.goto("/?tur=0");
  await expect(page.getByText(`${siap.toLocaleString("id-ID")} dari ${wajib.toLocaleString("id-ID")}`).first()).toBeVisible();
});

test("3. setujui satu usulan", async ({ page }) => {
  await masukApi(page);
  await page.goto("/tugas?tur=0");
  const usulan = page.getByRole("region", { name: "Usulan" });
  const kartu = usulan.locator("article[data-tugas]").first();
  tugasId = (await kartu.getAttribute("data-tugas")) ?? "";
  blokId = Number((await kartu.getByRole("link", { name: /^Blok \d+/ }).textContent())?.match(/\d+/)?.[0]);
  await kartu.getByRole("button", { name: "Setujui" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Pemilik tugas").selectOption("regu");
  await dlg.getByRole("button", { name: "Setujui" }).click();
  const disetujui = page.getByRole("region", { name: "Disetujui" }).locator(`article[data-tugas="${tugasId}"]`);
  await expect(disetujui).toBeVisible();
  const wa = disetujui.getByRole("link", { name: /WhatsApp/ });
  await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\//);
});

test("4. tolak satu usulan", async ({ page }) => {
  await masukApi(page);
  await page.goto("/tugas?tur=0");
  const kartu = page.getByRole("region", { name: "Usulan" }).locator("article[data-tugas]").first();
  const id = (await kartu.getAttribute("data-tugas")) ?? "";
  await kartu.getByRole("button", { name: "Tolak" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Atau tulis dengan kata sendiri").fill("jembatan putus sejak Mei");
  await dlg.getByRole("button", { name: "Sortir" }).click();
  await expect(dlg.getByText(/Disortir: Akses terputus/)).toBeVisible();
  await dlg.getByRole("button", { name: "Tolak" }).click();
  await page.locator("details > summary", { hasText: "Ditolak" }).click();
  await expect(page.locator(`details article[data-tugas="${id}"]`)).toBeVisible();
});

test("5. lapangan luring ke daring", async ({ page }) => {
  await masukApi(page);
  expect((await ganti(page, "regu")).ok()).toBeTruthy();
  await page.goto("/lapangan?tur=0");
  const item = page.getByRole("button", { name: new RegExp(`Blok ${blokId}(?!\\d)`) });
  await expect(item).toBeVisible();

  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("switch", { name: "Mode luring (demo)" }).check();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByText(/Luring · 0 antre/)).toBeVisible();

  await item.click();
  await page.getByLabel("Muka air (cm)").fill("62");
  await expect(page.getByText("Memuat daftar tabat")).toHaveCount(0);
  const tabat = page.getByRole("group", { name: "Tabat" }).getByRole("button");
  if ((await tabat.count()) > 1) {
    await tabat.first().click();
    await page.getByRole("button", { name: "Rembes" }).click();
  }
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByText("1 kunjungan menunggu kirim")).toBeVisible();

  await page.reload();
  await expect(page.getByText("1 kunjungan menunggu kirim")).toBeVisible();

  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("switch", { name: "Mode luring (demo)" }).uncheck();
  await expect.poll(() => page.getByText(/Daring · 0 antre/).count(), { timeout: 30_000 }).toBe(1);

  const { data } = await (await page.request.get(`/api/tugas?block=${blokId}`)).json();
  expect(data.find((t: { tugas_id: string }) => t.tugas_id === tugasId)?.status).toBe("diperiksa");
});

test("6. kembali ke koordinator dan reset", async ({ page }) => {
  await masukApi(page);
  expect((await ganti(page, "koordinator")).ok()).toBeTruthy();
  expect((await page.request.post("/api/demo/reset")).status()).toBe(200);
});
