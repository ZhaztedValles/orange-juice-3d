// usage: node scripts/stills.mjs <outPrefix> <frame,frame,...> [scale]  (bundles once, jpeg)
// Env:
//   BRIDGE_ENTRY        entry file (default src/index.ts); e.g. src/sandboxes/<name>/index.tsx for a sandbox copy
//   COMPOSITION         composition id (default oj-000-bridge)
//   GL                  Chromium GL backend: angle (default, GPU) | swangle | swiftshader | egl | vulkan
//   BROWSER_EXECUTABLE  optional path to a local Chrome; otherwise Remotion's own headless shell is used
//   STILL_FORMAT        jpeg (default) | png
//   INPUT_PROPS         optional JSON inputProps, e.g. {"post":{"dpr":0.6666666666666666}}
//   REMOTION_TMP        folder for Remotion's temp bundles (default: the OS temp dir). Each bundle copies public/,
//                       so point this at a folder you clean up afterwards.
import fs from "node:fs";
import path from "node:path";
// set the temp dir BEFORE Remotion loads (it reads os.tmpdir() at import time), hence the dynamic imports below
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = process.env.REMOTION_TMP; }
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");

const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
if (!prefix || !frames) { console.error("usage: node scripts/stills.mjs <outPrefix> <frame,frame,...> [scale]"); process.exit(2); }
const browserExecutable = process.env.BROWSER_EXECUTABLE || null;
const chromiumOptions = { gl: process.env.GL || "angle" };
const inputProps = process.env.INPUT_PROPS ? JSON.parse(process.env.INPUT_PROPS) : {};
const fmt = process.env.STILL_FORMAT === "png" ? "png" : "jpeg";
fs.mkdirSync(path.dirname(path.resolve(`${prefix}x`)), { recursive: true });
const tb = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.BRIDGE_ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
console.log("bundle", ((Date.now() - tb) / 1000).toFixed(1) + "s");
const composition = await selectComposition({ serveUrl, id: process.env.COMPOSITION || "oj-000-bridge", browserExecutable, chromiumOptions, inputProps });
const onBrowserLog = (l) => { if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.${fmt === "png" ? "png" : "jpg"}`, imageFormat: fmt, jpegQuality: 88, inputProps, scale: Number(scale),
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 180000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
