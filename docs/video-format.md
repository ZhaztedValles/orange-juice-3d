# Video format

Every video is a folder `videos/<id>/`, where `<id>` matches `^\d{3}-[a-z0-9-]+$` (e.g. `000-bridge`). The number
is unique across folders. `npm run gen` scans the folders and writes the registry `src/videos.generated.ts`
(`npm run gen -- --check` exits 1 when it is stale; CI runs that). `src/Root.tsx` registers one composition per
entry with the id `oj-<id>`, 1080x1920 at 30 fps.

## Files in a video folder

| File | Required | Contents |
|---|---|---|
| `Video.tsx` | yes | `export const FRAMES = <integer literal>;` (duration at 30 fps; `audio/spec.py` reads it with the regex `export const FRAMES\s*=\s*(\d+)\s*;`, so no expressions) and `export default` a `React.FC` with no props. |
| `meta.yml` | yes | `title`, `template` (true = never queued or posted), `description`, `tags`. |
| `words.json` | for the mix | `Word[]` (`{ w, s, e }`, seconds) from `src/engine/captions.ts`; the registry imports it when present. |
| `voice.wav` | for the mix | Narration from `tools/voice.py` (mono). `audio/spec.py` reports it (and `words.json`) missing. |
| `audio.json` | no | Score sections and SFX events for `audio/build_mix.py` (see below). |
| anything else | no | The video's own modules (story timeline, world, cast, town...). They import the engine from `../../src/engine/`. |

Rules:
- Output 1080x1920, 30 fps. Every pixel-sized parameter is specified at 1080x1920 and scales with the output height.
- Film grain stays off.
- Kenney CC0 models are loaded with `loadKenney(names)` / `staticFile("kenney/<name>.glb")`; they are fetched into
  `public/kenney/` by `scripts/fetch-kenney.mjs` and never committed.
- Engine modules never import from a video folder. When an engine module needs a value that differs per video, it
  takes it as a parameter (default: the bridge template's value).

## `audio.json`

`python audio/build_mix.py videos/<id> out/<id>` turns `voice.wav` + `words.json` + `audio.json` into the soundtrack:
`mix.wav` (48 kHz stereo 24-bit, exactly `round(FRAMES / 30 * 48000)` samples), `stem_voice.wav`, `stem_music.wav`,
`stem_sfx.wav` (32-bit float, master gain applied, before the limiter) and `mix_report.json`
`{lufs, true_peak_db, samples}`. It runs `audio/spec.py`'s `validate` first and exits 1 listing the problems.

```json
{
  "music": [ {"from": 0.0, "to": 4.2, "mood": "hook"}, {"from": 4.2, "to": 30.0, "mood": "playful"},
             {"from": 30.0, "to": 34.6, "mood": "tension"}, {"from": 34.6, "to": 37.5, "mood": "none"},
             {"from": 37.5, "to": 67.5, "mood": "warm"} ],
  "key": "Bb", "bpm": 120,
  "sfx": [ {"t": 34.62, "kind": "bolt_snap", "gain_db": 0, "pan": 0.0},
           {"t": 36.4, "kind": "splash_big", "gain_db": -2, "pan": -0.2},
           {"t": 0.0, "kind": "breeze", "dur": 8.0, "gain_db": -10} ]
}
```

Rules (`DUR = FRAMES / 30`):
- Every number is a finite JSON number (no `NaN` / `Infinity`).
- `music` sections cover 0..DUR with no gaps or overlaps (edges match within half a frame, 1/60 s). `mood` is one of `hook`, `playful`, `march`, `warm`,
  `tension`, `mystery`, `sad`, `none` (silence).
- `key`: `C C# Db D D# Eb E F F# Gb G G# Ab A A# Bb B` (major; the minor moods use its relative minor).
  `bpm`: 60..180.
- `sfx` events: `t` in [0, DUR); `kind` from the list below; `dur` (> 0, `t + dur` <= DUR + 1/60) is required for the kinds marked
  (dur) and not allowed for the others; `gain_db` in [-30, 6] (default 0); `pan` in [-1, 1] (default 0). No other fields: the rng
  (seeded with the event's index) and `dur` are the only arguments passed.
- SFX kinds (`audio.spec.SFX_KINDS`: the public functions defined in `audio/sfx_gen.py` that take an `r` parameter
  and whose parameters other than `r` / `dur` all have defaults): `applause` (dur), `bird_chirps` (dur), `bolt_snap`, `bolt_strain` (dur), `boot`, `breeze` (dur),
  `chain_groan` (dur), `chain_whip`, `clink` (dur), `column_stomp`, `creak` (dur), `crickets` (dur),
  `flag_flutter` (dur), `hammer_hit`, `oof`, `push_thump`, `rattle` (dur), `splash_big`, `stroll_step`,
  `swing_squeak`, `timber_tear` (dur), `water_bed` (dur), `whoa` (dur), `whoosh` (dur), `wood_crack`.
  A sound running past the end of the video is cut off.

Moods (`audio/score.py`, all notes generated from a seed = the video number, on `instruments.py` voices):
`hook` glock motif + snare pickup (2 bars), `playful` pluck bass on 1 and 3 + glock tune on I-V-vi-IV, `march`
oompah tuba / horns + snare + fife tune, `warm` pad + vibes arpeggio, `tension` minor pad + timpani on every beat
with a crescendo, `mystery` tremolo vibes + low pad (sparse), `sad` slow music box + pad, `none` silence. Each section
starts on its own downbeat and fades out over 0.25 s past its end (the crossfade); the score goes through a small
room (rt60 0.6 s).

Mix: first `tame_voice_peaks` removes the voice's transient peaks (Kokoro emits half-cycle spikes at sentence
onsets): wherever its 4x-oversampled peak passes a ceiling, the gain dips with a 1 ms look-ahead and returns to 1 over
15 ms; the ceiling is set so that after the master gain the voice alone peaks at -2 dBTP. Nothing else touches the
voice. Then, with the tamed voice's integrated loudness `Lv`, music is ducked -3 dB while words are spoken (0.08 s before to
0.12 s after each word) and then set to `Lv - 10.4` LUFS integrated (measured after the duck, as the bridge's final stems were), SFX are summed and set to `Lv - 13.7`; these are
the bridge's stem balance (voice -15.4, music -25.8, sfx -29.1 LUFS; `MUSIC_BELOW_VOICE_DB`, `SFX_BELOW_VOICE_DB` in
`audio/build_mix.py`). The voice gets no EQ or compression. One master gain brings the sum to -14.0 LUFS integrated, then a true-peak
limiter (ceiling -1.2 dBTP) keeps it at or below -1 dBTP.

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
