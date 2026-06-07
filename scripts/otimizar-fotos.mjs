// Otimiza fotos do produto: redimensiona pra 1080px max, JPEG quality 82.
// Roda com: node scripts/otimizar-fotos.mjs
//
// Resultado esperado: 2MB → ~250-400KB por foto, sem perda visivel.

import sharp from "sharp";
import { readdir, stat, mkdir, copyFile, unlink, rename } from "node:fs/promises";
import { join, basename } from "node:path";

const FOTOS_DIR = "fotos";
const MAX_WIDTH = 1080;
const QUALITY  = 82;

async function run() {
  const arquivos = (await readdir(FOTOS_DIR))
    .filter((n) => /\.(jpe?g|png|webp)$/i.test(n));

  console.log(`\n📷 ${arquivos.length} fotos pra otimizar\n`);

  let totalAntes = 0, totalDepois = 0;

  for (const nome of arquivos) {
    const path = join(FOTOS_DIR, nome);
    const antes = (await stat(path)).size;
    totalAntes += antes;

    const tmpPath = path + ".tmp.jpg";

    const meta = await sharp(path).metadata();
    const novaLargura = Math.min(meta.width, MAX_WIDTH);

    await sharp(path)
      .resize({ width: novaLargura, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
      .toFile(tmpPath);

    const depois = (await stat(tmpPath)).size;
    totalDepois += depois;

    // Substitui o original
    await unlink(path);
    await rename(tmpPath, path);

    const reducao = ((1 - depois / antes) * 100).toFixed(0);
    console.log(`  ${nome.padEnd(10)} ${kb(antes).padStart(8)} → ${kb(depois).padStart(8)}  (-${reducao}%)`);
  }

  const reducaoTotal = ((1 - totalDepois / totalAntes) * 100).toFixed(0);
  console.log(`\n  Total      ${kb(totalAntes).padStart(8)} → ${kb(totalDepois).padStart(8)}  (-${reducaoTotal}%)\n`);
  console.log("✅ pronto! verifique as fotos antes de comitar.\n");
}

function kb(bytes) {
  return (bytes / 1024).toFixed(0) + " KB";
}

run().catch((e) => { console.error(e); process.exit(1); });
