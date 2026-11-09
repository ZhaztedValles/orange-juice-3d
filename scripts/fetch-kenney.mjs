// Downloads the Kenney CC0 kits the bridge world uses and extracts only the .glb models world.ts loads into
// public/kenney/. The models are CC0 (https://kenney.nl), but they are never committed: run this after
// `npm ci` (CI caches public/kenney/). No dependencies: a tiny zip reader on top of node:zlib.
// usage: node scripts/fetch-kenney.mjs [--force]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const OUT = path.resolve("public/kenney");
// kit page slug -> models taken from it (names as world.ts KENNEY lists them, without .glb)
const KITS = {
  "nature-kit": ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "plant_bushLarge", "plant_bushDetailed",
    "plant_bush", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lily_large", "canoe"],
  "fantasy-town-kit": ["tree-high-round", "tree", "hedge", "lantern", "cart", "stall-red", "stall-green", "stall-bench",
    "banner-red", "banner-green", "windmill"],
};
const UA = { "User-Agent": "Mozilla/5.0 (orange-juice-3d fetch-kenney)" };

const want = Object.values(KITS).flat();
// the Fantasy Town Kit GLBs reference an external Textures/colormap.png next to them
const TEXTURES = { "fantasy-town-kit": ["colormap.png"] };
const missing = want.filter((n) => !fs.existsSync(path.join(OUT, `${n}.glb`)));
for (const [slug, tex] of Object.entries(TEXTURES)) if (tex.some((t) => !fs.existsSync(path.join(OUT, "Textures", t)))) missing.push(KITS[slug][0]);
if (!missing.length && !process.argv.includes("--force")) {
  console.log(`kenney: all ${want.length} models present in ${OUT}`);
  process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });

/** Kenney's download button asks /download-link/<hex("assets/<slug>")> for a fresh signed URL. */
async function kitZip(slug) {
  const page = await fetch(`https://kenney.nl/assets/${slug}`, { headers: UA });
  if (!page.ok) throw new Error(`${slug}: page HTTP ${page.status}`);
  const html = await page.text();
  const id = html.match(/data-download-id='([0-9a-f]+)'/)?.[1] ?? Buffer.from(`assets/${slug}`).toString("hex");
  const cookie = (page.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const link = await fetch(`https://kenney.nl/download-link/${id}`, { headers: { ...UA, Referer: `https://kenney.nl/assets/${slug}`, Cookie: cookie } });
  const { url } = await link.json();
  if (!url) throw new Error(`${slug}: no signed download url`);
  const zip = await fetch(url, { headers: { ...UA, Cookie: cookie } });
  if (!zip.ok) throw new Error(`${slug}: zip HTTP ${zip.status}`);
  return Buffer.from(await zip.arrayBuffer());
}

/** Minimal zip reader: central directory -> { name: () => Buffer }. Handles stored and deflated entries. */
function readZip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    entries[name] = () => {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + csize);
      return method === 0 ? data : zlib.inflateRawSync(data);
    };
    p += 46 + nlen + xlen + clen;
  }
  return entries;
}

let got = 0;
for (const [slug, models] of Object.entries(KITS)) {
  const need = models.filter((n) => missing.includes(n) || process.argv.includes("--force"));
  if (!need.length) continue;
  console.log(`kenney: downloading ${slug} ...`);
  let zip;
  for (let attempt = 1; ; attempt++) {
    try { zip = readZip(await kitZip(slug)); break; } catch (e) {
      // kenney.nl drops connections now and then (ECONNRESET); every attempt asks for a fresh signed link
      if (attempt >= 5) throw e;
      console.warn(`  attempt ${attempt} failed (${e.cause?.code ?? e.message}); retrying`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
  // prefer the GLB folder ("Models/GLB format/<name>.glb"); fall back to any <name>.glb in the zip
  const glbs = Object.keys(zip).filter((n) => n.toLowerCase().endsWith(".glb"));
  for (const m of need) {
    const hit = glbs.filter((n) => path.posix.basename(n) === `${m}.glb`).sort((a, b) => a.length - b.length)[0];
    if (!hit) { console.error(`  MISSING in ${slug}: ${m}.glb`); continue; }
    fs.writeFileSync(path.join(OUT, `${m}.glb`), zip[hit]());
    got++;
  }
  for (const t of TEXTURES[slug] ?? []) {
    // the texture from the same folder as the GLBs (the FBX/OBJ folders carry their own copies)
    const dir = path.posix.dirname(glbs.find((n) => path.posix.basename(n) === `${models[0]}.glb`) ?? "");
    const hit = zip[`${dir}/Textures/${t}`] ? `${dir}/Textures/${t}` : Object.keys(zip).find((n) => n.endsWith(`/Textures/${t}`));
    if (!hit) { console.error(`  MISSING in ${slug}: Textures/${t}`); continue; }
    fs.mkdirSync(path.join(OUT, "Textures"), { recursive: true });
    fs.writeFileSync(path.join(OUT, "Textures", t), zip[hit]());
  }
  // keep the kit licence next to the models
  const lic = Object.keys(zip).find((n) => /license\.txt$/i.test(n));
  if (lic) fs.writeFileSync(path.join(OUT, `LICENSE-${slug}.txt`), zip[lic]());
}
const still = want.filter((n) => !fs.existsSync(path.join(OUT, `${n}.glb`)))
  .concat(Object.values(TEXTURES).flat().filter((t) => !fs.existsSync(path.join(OUT, "Textures", t))));
console.log(`kenney: wrote ${got} models to ${OUT}${still.length ? `; still missing: ${still.join(", ")}` : ""}`);
if (still.length) process.exit(1);
