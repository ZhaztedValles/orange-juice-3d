# Orange Juice 3D

3D cartoon story Shorts for the **Orange Juice Productions** YouTube channel: flat bean-head cartoon characters in an
ink-outlined, painted 3D world, rendered with [three.js](https://threejs.org/) inside [Remotion](https://www.remotion.dev/).

The first composition, `BridgeShort` (1080x1920, 30 fps), is the "bridge" template ported from the
`cartoon-3d-short` skill.

## Setup
```sh
npm ci
node scripts/fetch-kenney.mjs     # downloads the Kenney CC0 kits, extracts the models into public/bridge/kenney/
npx tsc --noEmit
```

## Rendering
Environment variables (all optional):

| Variable | Default | Meaning |
|---|---|---|
| `GL` | `angle` | Chromium GL backend. `angle` uses the GPU; on CPU-only machines (CI) use `swangle` or `swiftshader`. |
| `BROWSER_EXECUTABLE` | Remotion's headless shell | Path to a local Chrome. |
| `REMOTION_TMP` | OS temp dir | Where `scripts/bridge-stills.mjs` puts Remotion's temp bundles. Each bundle copies `public/`, so use a folder you clean up. For the CLI set `TEMP`/`TMP` (Windows) or `TMPDIR` (Linux/macOS). |

```sh
# stills at half size: out/x_100.jpg, out/x_400.jpg
node scripts/bridge-stills.mjs out/x_ 100,400 0.5
# a 10 s segment at full size
npx remotion render src/index.ts BridgeShort out/seg.mp4 --frames=0-299 --concurrency=1
```

On CI, `.github/workflows/spike-render.yml` (manual `workflow_dispatch`, inputs `frames` and `gl`) renders a frame
range on an ubuntu runner and uploads the mp4 and a still.

## Scripts
- `scripts/fetch-kenney.mjs`: fetch the Kenney models (never committed).
- `scripts/bridge-stills.mjs`: render stills.
- `scripts/bridge_shots.py`: write `out/bridge/shots.json` from `story.ts` for `short_qa.py`.
- `scripts/short_qa.py`: frame-by-frame QA of a final render (black, white, frozen, pop frames, loudness).
- `scripts/sbs_sheet.py`: side-by-side review sheets.
- `scripts/bridge_merge.py`: merge look-pass sandboxes back into `src/videos/bridge/`.

## Credits
- 3D models: [Kenney](https://kenney.nl) — Nature Kit and Fantasy Town Kit, licensed
  [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Thank you, Kenney! The models are downloaded by
  `scripts/fetch-kenney.mjs` and are not stored in this repository.
- Code: MIT, see `LICENSE`.
