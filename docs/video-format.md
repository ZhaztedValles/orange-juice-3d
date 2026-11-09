# Video format

Every video is a folder `videos/<id>/`, where `<id>` matches `^\d{3}-[a-z0-9-]+$` (e.g. `000-bridge`). The number
is unique across folders. `npm run gen` scans the folders and writes the registry `src/videos.generated.ts`
(`npm run gen -- --check` exits 1 when it is stale; CI runs that). `src/Root.tsx` registers one composition per
entry with the id `oj-<id>`, 1080x1920 at 30 fps.

## Files in a video folder

| File | Required | Contents |
|---|---|---|
| `Video.tsx` | yes | `export const FRAMES: number` (duration at 30 fps) and `export default` a `React.FC` with no props. |
| `meta.yml` | yes | `title`, `template` (true = never queued or posted), `description`, `tags`. |
| `words.json` | no | `Word[]` (`{ w, s, e }`, seconds) from `src/engine/captions.ts`; the registry imports it when present. |
| anything else | no | The video's own modules (story timeline, world, cast, town...). They import the engine from `../../src/engine/`. |

Rules:
- Output 1080x1920, 30 fps. Every pixel-sized parameter is specified at 1080x1920 and scales with the output height.
- Film grain stays off.
- Kenney CC0 models are loaded with `loadKenney(names)` / `staticFile("kenney/<name>.glb")`; they are fetched into
  `public/kenney/` by `scripts/fetch-kenney.mjs` and never committed.
- Engine modules never import from a video folder. When an engine module needs a value that differs per video, it
  takes it as a parameter (default: the bridge template's value).

## Engine modules

`videos/000-bridge/` is the reference video. What it owns: `Video.tsx` (post chain, crossfades, flash), `story.ts`
(timeline, story physics, cameras, DOF, `D0`, `FPS`, `TOTAL`), `world.ts` (the scene: sky, river, bridge, swing, smoke,
clouds, Kenney list), `town.ts` (`buildTown`, `flagTex`, church, mill, park), `cast.ts` (who stands where per shot,
swing, officer, one-off effects, `SU_SWING`).

Engine exports a video may use, one per line:

### `src/engine/math.ts`
- `clamp01(x)`: clamp to 0..1.
- `smooth(x)`: smoothstep of x clamped to 0..1.
- `easeOut(u)`: quartic ease-out on 0..1.

### `src/engine/captions.ts`
- `Word`: `{ w: string; s: number; e: number }`, one spoken word with start / end in seconds.
- `wordAt(words, t)`: index of the word to show at t seconds, or -1 (shows until the next start; hides at e + 0.15 before a pause over 0.40 s; last word until e + 0.30).
- `cleanWord(w)`: the word as captioned (outer punctuation stripped except `'` and `-`, case kept).

Captions are not a video's job: `src/Root.tsx` wraps every video in `WithCaptions` (`src/engine/WithCaptions.tsx`, overlay in
`CaptionsOverlay.tsx`; Poppins Bold from `public/fonts/`), driven by `words` from the registry (null = no captions). Input props:
`{"captions": false}` turns them off (writer review stills); `{"__testWords": Word[]}` overrides the words and is test-only.

### `src/engine/kit.ts`
- `loadKenney(names)`: load Kenney models from `public/kenney/` once per name list, as a `Kit` (missing ones left out).
- `kenneyUrl(name)`: `staticFile("kenney/<name>.glb")`.

### `src/engine/build.ts`
- `Kit`: name -> Kenney scene root.
- `V(x, y, z)`: shorthand for `new THREE.Vector3`.
- `lam(key, make)`: cached two-tone Lambert material by key.
- `quad(a, b, c, d, u1?, v1?, u0?, v0?)`: one textured quad geometry.
- `tri(a, b, c)`: one triangle geometry.
- `boxGeo(min, max, tile?, bottom?)`: axis-aligned box geometry with world-scale UVs.
- `Batch`: collects geometry by material and merges it into one static mesh per material (`add`, `addObject`, `build`).
- `Strand`: box-section (or chain-link) tube rebuilt along a path every frame (chains, rails, ropes).
- `Ray`: a sight line `{ o, d, len, core }` that props and houses keep clear.
- `setSightLines(rays)`: set the sight lines `prop()` / `house()` test against (clear with `[]` after building).
- `prop(batch, kit, name, x, y, z, h, yaw?)`: place a Kenney model scaled to height h (trees / hedges / banners drawn as cartoon versions); skipped when it blocks a sight line.
- `kitClone(kit, name, h)`: a Kenney model (or cartoon plant) as its own object, for foreground framing.
- `roofMat(col)`: painted roof-tile material (slate for `#8f97a8`).
- `house(batch, x, z, yaw, w, d, h, style, y = 6.0)`: gabled house with painted facades and 3D trim; skipped when it blocks a sight line.

### `src/engine/paint.ts`
- `rng(seed)`: deterministic random generator.
- `ctex(key, w, h, draw)`: cached canvas texture painted by `draw(ctx, rng)`.
- `rep(tex, x, y)`: set a texture to repeat x by y.
- `jit(r, hex, dv?, dh?, ds?)`: per-tile colour jitter.
- `grass()`, `cobble()`, `stone(key?, cols?)`, `planks()`, `beam()`, `water()`, `bed()`, `roof(col)`, `brick()`, `chainTex()`: base painted textures.
- `facade(key, wm, hm, style)`: plaster / brick facade with windows, doors, timber frame.
- `planksHD()`, `beamHD()`, `stoneHD(key?, cols?, mortar?)`, `cobbleHD()`, `roofHD(col, slate?)`, `grassHD()`, `facadeHD(key, wm, hm, style)`, `chainHD()`: high-detail versions for close shots.
- `waterMarks(key, nCrest, nGlint)`, `waterNear()`, `waterFar()`: wave-crest and glint overlays for water.
- `CLOUD_DAY`, `CLOUD_GOLD`: cloud palettes.
- `cloudHD(seed, pal?)`: painted cloud card texture.

### `src/engine/shade.ts`
- `TONE`: two-tone world shading uniforms (shared, kept in sync with the light preset).
- `CHAR`: character-card uniforms (kept in sync with the light preset).
- `LFB`: patched `lights_fragment_begin` shader chunk (sun visibility written once).
- `twoTone(material, liftK?)`: turn a Lambert / Phong material into the two-tone toon look.
- `untone(color, out?)`: linear colour that the Neutral tone map turns into the given on-screen colour.

### `src/engine/lights.ts`
- `LightPreset`, `LIGHTS`: sun position and colour, two-tone and card shading, sky / fog, shadow bias presets for `day` and `golden`.
- `WorldLook`, `LOOK`: sky stops, water, bounce, saturation and cloud colours for `day` and `golden`.

### `src/engine/cardshade.ts`
- `GRAD_K`, `GRAD_KB`, `TINT_K`: card side-gradient and tint strengths.
- `CARD_K`: card shader uniforms (`uPx` = render height / 1920, set per draw).
- `cardShade(material)`: lit flat character card material (tint, bright floor, gradient toward the sun).
- `blobMaterial(map)`: multiply material for contact blobs.

### `src/engine/cards.ts`
- `Req`, `Pool`: canvas pool, one canvas per distinct drawing key per frame (`req`, then `flush`).
- `SU`: metres per character design unit (1000 units = 2.16 m).
- `Actor`: lit character card mesh (yaw billboard, receives shadows, NOINK layer).
- `Fx`: unlit effect card (cut-out, soft, or multiply ground blob).
- `Place`, `FxPlace`, `Stage`: what a cast module returns per frame (characters and effect cards with positions).
- `CamInfo`: camera position, right vector, optional sun direction.
- `setStageLight(cam, light)`: call before staging a frame: picks up the scene's sun and the `day` / `golden` preset.
- `hh(i, s?)`: deterministic hash in 0..1 per index.
- `q(v, n?)`: quantise a value (keeps drawing keys shareable).
- `light2D(cam, mirror)`: canvas angle the sun comes from on a card, in 45-degree steps.
- `viewOf(cam, x, z, dx, dz)`: front / side view, mirroring and foreshortening for someone walking along (dx, dz).
- `lidAt(t, i, swaps?, fps = 30)`: eyelid 0..1 for character i at time t (random blinks plus a blink on every swap).
- `Who`: `{ i, o: Outfit, okey }`, a character identity.
- `person(cam, who, x, y, z, view, frontOpts, sideOpts, scale?)`: one character drawing sized by distance, lit from the sun.
- `hexOf(rgb, k)`: multiply colour as sRGB hex, faded by k.
- `blob(stage, x, y, z, scale?, k?)`: contact shadow under a standing card (plus a soft sun-away tail by day).

### `src/engine/toon.ts`
- `INK`, `SKIN`, `SKINS`: outline and skin colours.
- `Build`, `Outfit`: body build and outfit description.
- `mul(c, m)`, `shade(c, k)`, `mix(a, b, t)`: colour helpers on hex strings.
- `RIFLEMAN`, `OFFICER`, `KID`, `PARENT`: ready outfits.
- `soldier(v?, extra?)`, `townsfolk(v?)`: outfit variants.
- `Pen`: canvas drawing helper with ink outlines (`poly`, `ell`, ...).
- `Blob`, `blobPts(cx, cy, blob, n?)`, `headBlob(seed, a?, facing?)`: bean head shapes.
- `thickAngle(light)`: direction of the thickest outline for a light angle.
- `Expr`: facial expressions.
- `Arms`, `Prop`: arm polylines and hand props.
- `FrontOpts`, `bodyFront(pen, outfit, opts)`: front-view character drawing.
- `SideOpts`, `bodySide(pen, outfit, opts)`: side-view character drawing.
- `swingKid(pen, outfit, kick, expr, light?, blink?)`: child on a swing.
- `fxNote`, `fxBurst`, `fxSplash`, `fxPuff`, `fxStars`, `fxCreak`, `fxRing`: animated effect drawings (t in 0..1 where timed).
- `fxSign`: text-free "no marching in step" sign.
- `fxCloud(pen, seed)`: soft cartoon cloud.
- `fxShadow(pen, col)`, `fxContact(pen, col)`, `fxBlob(pen, col)`: ground shadow / contact blob drawings.
- `fxPlank`, `fxDrum`: floating debris drawings.

### `src/engine/ink.ts`
- `NOINK`: layer for objects the world ink pass skips (cards, effects, blobs).
- `InkOptions`, `InkPass`: world ink-line post pass (depth + normal edges), runs before the lens blur.
- `noInkFallback(root)`: moves camera-facing billboards onto `NOINK` (safe every frame).

### `src/engine/lensblur.ts`
- `LensBlur`: thin-lens depth-of-field pass pair (`pre`, `main`; set `focus` and `cInf` per frame).
- `LensBlurEffect`: one stage of it.
- `GrainEffect`: film grain (off: never enable it in a video).

### `src/engine/grade.ts`
- `GradeParams`, `GradeEffect`: display-referred colour grade (curves, tint, vignette), after tone mapping.
- `GRADE_DAY`, `GRADE_GOLDEN`, `GRADE_DAY2`, `GRADE_GOLDEN2`, `GRADES`: presets (`GRADES` holds the current ones).
- `GRADE_STRENGTH`: per-light preset strength.
- `gradeFor(effect, light)`: apply the preset of a light.
- `tintRGB(cb, cr)`, `KX`, `monoTangents(ky)`: grade curve / tint helpers.
