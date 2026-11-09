# Orange Juice 3D

3D cartoon story Shorts for the **Orange Juice Productions** YouTube channel: flat bean-head cartoon characters in an
ink-outlined, painted 3D world, rendered with [three.js](https://threejs.org/) inside [Remotion](https://www.remotion.dev/).

Each video lives in its own folder `videos/<NNN-slug>/` (see `docs/video-format.md`) and becomes the composition
`oj-<NNN-slug>` (1080x1920, 30 fps); shared rendering code lives in `src/engine/`. `videos/000-bridge/` is the
"bridge" template ported from the `cartoon-3d-short` skill.

## Setup
```sh
npm ci
node scripts/fetch-kenney.mjs     # downloads the Kenney CC0 kits, extracts the models into public/kenney/
npm run gen                       # regenerates src/videos.generated.ts from videos/*/
npm run typecheck
npm test
```

## Rendering
Environment variables (all optional):

| Variable | Default | Meaning |
|---|---|---|
| `GL` | `angle` | Chromium GL backend. `angle` uses the GPU; on CPU-only machines (CI) use `swangle` or `swiftshader`. |
| `BROWSER_EXECUTABLE` | Remotion's headless shell | Path to a local Chrome. |
| `REMOTION_TMP` | OS temp dir | Where `scripts/stills.mjs` puts Remotion's temp bundles. Each bundle copies `public/`, so use a folder you clean up. For the CLI set `TEMP`/`TMP` (Windows) or `TMPDIR` (Linux/macOS). |

```sh
# stills at half size: out/x_100.jpg, out/x_400.jpg
node scripts/stills.mjs out/x_ 100,400 0.5          # COMPOSITION=oj-<id> picks the video
# a 10 s segment at full size
npx remotion render src/index.ts oj-000-bridge out/seg.mp4 --frames=0-299 --concurrency=1
```

On CI, `.github/workflows/spike-render.yml` (manual `workflow_dispatch`, inputs `frames` and `gl`) renders a frame
range on an ubuntu runner and uploads the mp4 and a still.

## Scripts
- `scripts/fetch-kenney.mjs`: fetch the Kenney models (never committed).
- `scripts/gen-registry.mjs`: write `src/videos.generated.ts` from `videos/*/` (`--check` exits 1 when stale).
- `scripts/stills.mjs`: render stills.
- `scripts/short_qa.py`: frame-by-frame QA of a final render (black, white, frozen, pop frames, loudness).
- `scripts/sbs_sheet.py`: side-by-side review sheets.
- `tools/video_check.py`: `python tools/video_check.py videos/<id> [...]` checks a video folder against the folder contract in `docs/video-format.md` (prints `ok <id>` or the problems, exits 1).

## Credits
- 3D models: [Kenney](https://kenney.nl) — Nature Kit and Fantasy Town Kit, licensed
  [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Thank you, Kenney! The models are downloaded by
  `scripts/fetch-kenney.mjs` and are not stored in this repository.
- Captions font: [Poppins](https://fonts.google.com/specimen/Poppins) Bold by Indian Type Foundry, licensed
  [SIL OFL 1.1](public/fonts/OFL.txt); bundled in `public/fonts/`.
- Code: MIT, see `LICENSE`.
