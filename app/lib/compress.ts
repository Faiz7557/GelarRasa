// Kompres foto di klien: canvas -> JPEG lebar maks 800 px, kualitas 0,6; turunkan sampai <= 150 KB.
const MAKS_BYTE = 150 * 1024;
const byteOf = (url: string) => Math.floor(((url.length - url.indexOf(",") - 1) * 3) / 4);

export async function kompresFoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  let lebar = Math.min(800, bmp.width);
  let q = 0.6;
  for (let i = 0; i < 12; i++) {
    const c = document.createElement("canvas");
    c.width = lebar;
    c.height = Math.max(1, Math.round((bmp.height * lebar) / bmp.width));
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/jpeg", q);
    if (byteOf(url) <= MAKS_BYTE) {
      bmp.close();
      return url;
    }
    if (q > 0.31) q -= 0.1;
    else lebar = Math.round(lebar * 0.8); // ponytail: kualitas sudah minimum, kecilkan lebar
  }
  bmp.close();
  throw new Error("Foto terlalu besar.");
}
