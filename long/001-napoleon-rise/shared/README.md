# The Rise of Napoleon: shared cast and props

Every chapter draws the same people and props from this folder, so faces, clothes and hats match across the six
chapters. Import from a chapter folder (`long/001-napoleon-rise/ch<N>/`) as `../shared/cast` and `../shared/props`;
these files import the engine as `../../../src/engine/<module>`. Do not copy or edit them per chapter: if you need a
new preset, build it in your chapter from the engine `Outfit` fields below (spread a preset: `{ ...NAP_GENERAL.o, ... }`
with a new `okey`).

## cast.ts

A preset is a `Char = { i, okey, o, scale, expr }`: `i` fixes the head shape and the blink timing (same `i` = same
face), `okey` keys the drawing cache, `o` is the engine `Outfit`, `expr` the default expression.

| Export | Looks like |
|---|---|
| `NAP_CHILD` | Napoleone ~9 (Corsica, ch1): kid build, tan waistcoat, short dark hair, heavy brows, stern |
| `NAP_CADET` | the cadet ~15 (ch2): teen build, blue school coat with red collar / lapels |
| `NAP_GENERAL` | 1793-1799 (ch3-5): blue coat, red collar, gold epaulettes, tricolour sash, white breeches, black boots, sabre, sideways bicorne with the cockade, long lank hair to the collar |
| `NAP_CONSUL` | First Consul 1799-1804 (ch5-6): red coat with gold facings, gold-laced bicorne, short hair + forelock |
| `NAP_EMPEROR` | the coronation (ch1, ch6): white robe, crimson mantle with ermine and golden bees, gold laurel wreath |
| `NAP_EMPEROR_CROWN` | the same wearing the gold crown |
| `NAP_ICON` | the classic later look (epilogue): green coat, white waistcoat, sideways bicorne; pose with prop `"tuck"` |
| `CARLO`, `LETIZIA` | father (plum coat, tricorne, powdered hair) and mother (dark green dress, black hair, stern) |
| `LUCIEN` | Lucien in 1799: deputy's white robe, blue sash, scarlet mantle |
| `JOSEPHINE`, `JOSEPHINE_EMPRESS` | white Empire dress, rose bodice, dark curls; empress: ermine mantle + small crown |
| `schoolboy(v, teen?)` | v 0-2, rich boys in the same blue school coat (fair / ginger / brown hair, grin / laugh / smile); kid build, `teen = true` for Paris |
| `frenchSoldier(v)` | v 0-5: blue coat, white lapels, red collar, white breeches, crossbelts, musket, sideways bicorne (v 2, 5: red forage cap) |
| `frenchOfficer(v)` | v 0-2: fore-and-aft gold-laced bicorne, epaulettes, red sash, sabre (v 2: white plume) |
| `MURAT`, `BARRAS`, `ROBESPIERRE` | Murat (sky-blue, gold, white plume, black curls); Barras (stout Director, tricolour sash, red plume); Robespierre (green coat, powdered hair) |
| `britishSoldier(v)`, `BRITISH_OFFICER`, `NELSON` | redcoats with black-cockade bicornes and muskets; officer; Nelson in navy blue with white facings |
| `royalist(v)` | v 0-3: civilian coats, tricornes with the white royal cockade, muskets (Paris 1795) |
| `mamluk(v)` | v 0-3: coloured turban over a red / green cap, bright kaftan (a robe on foot), baggy trousers, beard, sabre |
| `savant(v)` | v 0-2: scholars: civilian coats, top hat / tricorne / bare grey head; pose with prop `"book"` |
| `POPE` | Pius VII: white robe with a gold band, gold cope, white-and-gold mitre |
| `lawmaker(v)` | v 0-3: deputies of the Five Hundred (white robe, blue sash, scarlet mantle), angry by default |
| `ALL` | every preset by name (lineups) |
| `who(c)`, `put(cam, out, t, c, x, y, z, opts)` | staging helpers (below) |
| `FR_BLUE`, `FR_WHITE`, `FR_RED`, `GOLD`, `BR_RED` | palette |

## props.ts

| Export | Looks like |
|---|---|
| `cannon({ paint?, barrel?, elev? })` | 3D field gun: olive carriage, two 12-spoke wheels (1.4 m), bronze barrel (2.1 m), muzzle toward +x, origin under the axle. `group.userData.muzzle` = muzzle point (group space) for smoke / flash |
| `cannonballs(n = 3)` | 3D pyramid of shot |
| `warship({ length = 40, flag = "fr", sails = "set", hull?, band?, brace = 30 })` | 3D ship of the line: black hull with ochre bands, two rows of gun ports with red lids, 3 masts, bellied square sails braced 30 deg (or `"furled"`), jib, rigging, stern ensign + masthead flag. Bow toward +x, origin at the waterline amidships, mainmast ~0.85 L above deck |
| `fleet(n, shipOpts, seed)` | n warship clones in a staggered line along +x (spacing ~1.6 L), shared geometry |
| `flagTex("fr" \| "uk" \| "white")` | flag canvas texture (tricolour, red ensign with the pre-1801 union, Bourbon white) for your own flag meshes |
| `horseCard(cam, out, t, x, y, z, opts, mirror?, scale?)` | 2D side-view horse card (lit like the characters) + contact blobs. `opts`: `coat` (`HORSE_COATS.grey / bay / chestnut / black / dun`), `mane`, `pose` (`"stand" \| "walk" \| "gallop" \| "rear"`), `phase` (0..1 per stride for walk / gallop), `cloth` / `clothTrim` (saddle cloth, `null` = bare back), `rider` (any Char), `riderOpts` (side-view options: `expr`, `prop: ["sword", k]`, `pose` = forward lean), `blaze`, `socks` |
| `drawHorse(pen, opts, light)`, `HORSE_SCALE`, `HORSE_COATS` | the raw drawing (on a person card at 1 / HORSE_SCALE) and constants |

## notredame.ts

Notre-Dame de Paris as it stood on 2 December 1804 (ch1 builds it, ch6 reuses it). Two independent builders, each a
`THREE.Group` in its own local frame with the ground at y = 0; place each one wherever your world wants it (they never
need to see each other) and add it to the root once (static, already batched):

| Export | What it is |
|---|---|
| `notreDameExterior()` | the west front (two flat-topped towers, 69 m; three portals; the gallery of kings with EMPTY niches, the statues were pulled down in 1793; the rose; the open arcade), stepped buttresses and ledges in 3D, the nave and aisles behind with flying buttresses and a slate roof. No spire (removed 1786, rebuilt 1860). Origin: centre of the west front on the ground, front faces +z, the church runs toward -z (110 m). No ground: lay your parvis from z = 0 toward +z. Casts shadows, inked. |
| `notreDameInterior()` | returns `{ group, spots }`: the nave dressed for the coronation. Origin: floor at the west door, nave centre line along -z; west wall with a glowing rose at z = +1, east (apse) wall with three lancets and a small rose at z = -56. Nave x -7..7 (vault apex 34 m), columns at x = +-7 every 6 m (z -4..-46), aisles to x = +-13. Red carpet with gold bees down the aisle, crimson banners with golden bees on every column, 9 rows of benches each side, a choir platform (3 steps, top 0.9 m from z = -39.2), the altar (gold-trimmed cloth, gold cross, six candles with glowing flames), the Pope's throne and the imperial throne (canopies). Glass is unlit and slightly over 1 (blooms), light shafts are additive NOINK planes. The shell does not cast shadows (the directional sun still lights the floor); columns, benches and furniture do. |
| `ND_SPOTS` (= `spots`) | local positions: `platformY` 0.9; `napoleon` [0, 0.9, -45.2] (in front of the altar, facing the nave); `altar`; `popeThrone` [-5.4, 0.9, -46.6] and `imperialThrone` [5.4, 0.9, -46.6] (seat 0.55 m over the platform; stand people ~0.95 m in front, +z); `josephine` [2.6, 0.9, -44.2]; `guests` (54 [x, z] floor spots, 3 per side per row, rows z -10..-34); `guards` (along the carpet); `columns` ([x, z], radius 0.7 m). Add the group's position to every spot. |

Usage (ch1 `world.ts`): `const nd = notreDameExterior(); nd.position.set(3000, 0, 0); root.add(nd);` and
`const { group, spots } = notreDameInterior(); group.position.set(-3000, 0, 0); root.add(group);`. Gotchas: cameras inside
the nave work best between y 1.5 and 10 (the vault is plain stone, the clerestory glass glows); a lens closer than ~1 m
to a column or banner fills the frame; the aisle ceiling sits at 13 m, so aisle cameras must stay below it. Keep the
interior fog far away (near >= 400) or the nave hazes over. Guests are cards: in shots looking down the nave from the
west they face the camera (billboards), so the guest-faces-forward shots are the ones looking west from the choir.

## Engine additions (src/engine/toon.ts, all optional `Outfit` fields)

Hats: `"bicorne"` (worn sideways: a wide crescent from the front, a tall narrow crescent in profile), `"bicorne_fa"`
(fore-and-aft: the reverse), `"tricorne"`, `"crown"`, `"laurel"`, `"mitre"`, `"turban"`. Hat fields: `hatCol`,
`hatTrim` (gold lace edge, mitre bands, turban cap), `plume`, `cockade` (undefined = tricolour, a colour, `null` = none).
Hair / face: `locks` (hair colour under any hat) + `lockLen` (0 short .. 1 to the collar) + `forelock`, `beard`,
`brow` (brow thickness). Clothes: `lapels`, `collar`, `epaulettes`, `sash: "tricolour"`, `robe` (ankle-length, legs
hidden), `cloak` (mantle behind the body + open front panels) with `trim` (`"ermine"` or a colour). Build `"teen"`.
Props (`FrontOpts.prop`; `SideOpts.prop` for `"tuck"`, `"book"`, `["sword", k]`): `"tuck"` (hand in the coat),
`"book"` (open book in both hands), `["crown", k]` (crown lifted in both hands, k 0 at the chest .. 1 above the head),
`["sword", k]` (sabre, k 0 lowered .. 1 raised). `SideOpts.mode: "ride"` seats a rider (used by `horseCard`).
`cards.ts` now exports `seedOf(i)` and `tier(d)`.

## Usage (in a chapter's cast.ts, called from world.ts update() like the sample's `stage()`)

```ts
import { NAP_GENERAL, frenchSoldier, mamluk, put } from "../shared/cast";
import { cannon, warship, horseCard, HORSE_COATS } from "../shared/props";

// world.ts constructor: 3D props are ordinary objects
const gun = cannon({ elev: 6 }); gun.position.set(4, 0, -2); gun.rotation.y = Math.PI / 2; root.add(gun);
const ship = warship({ flag: "uk" }); ship.position.set(0, -0.8, -150); root.add(ship); // sink it into your water

// every frame (cast stage(): cam = { pos, right }, out = { places: [], fx: [] }, t = seconds)
put(cam, out, t, NAP_GENERAL, 0, D0, 0, { fo: { expr: "stern", prop: ["sword", 1] } });          // front view
put(cam, out, t, frenchSoldier(2), 1.4, D0, 0.5, { walk: { dx: 0, dz: -1, phase: t % 1 } });     // marching
put(cam, out, t, NAP_GENERAL, -2, D0, 0, { side: true, mirror: true });                          // profile, facing left
horseCard(cam, out, t, 6, D0, -3, { coat: HORSE_COATS.grey, pose: "gallop", phase: (t * 2) % 1, rider: mamluk(1), riderOpts: { prop: ["sword", 1] } });
```

The world's update loop binds `out.places` to `Actor`s exactly as the sample chapter does (horse cards are ordinary
places with `scale` = 2 and their own `size`; the sample loop handles them unchanged).

## Gotchas

- Heads: the engine has 7 head shapes, picked by `i` (`seedOf(i) = (i * 5 + 3) % 7 + 1`); presets fix `i`, so never
  restage a preset with another `i` (its face would change). Napoleon is `i = 100` at every age.
- `["crown", k]`: for k between about 0.2 and 0.6 the crown passes in front of the face. Animate quickly through that
  range, or start at 0.6. After the crown is on, switch the outfit to `NAP_EMPEROR_CROWN` on a cut or a blink.
- Horses are side-view cards only: frame them roughly side-on (a card seen at more than ~50 deg turns into a sliver; it
  never shows a front view). `mirror = true` faces left. Gallop legs come from `phase`: advance it ~2 strides/s
  (`(t * 2) % 1`) and slide x at ~6-8 m/s or the hooves skate. The rider is drawn into the horse card, so it inherits
  the horse's mirroring and gallop bob.
- The horse card is 2 x a person card (5.2 m tall, mostly empty): keep its frustum test sphere big enough (the
  sample's `p.y + 1.1 * scale`, radius 3.5 works).
- Ships: square sails are braced 30 deg, so a pure side view shows them foreshortened; for big sail shapes use a 3/4
  view or `brace: 50`. The hull below the waterline is drawn (black), so sink the origin ~1 m into opaque water.
- Cannon: muzzle at +x; `rotation.y = Math.PI / 2` points it toward -z. The barrel is bronze (bloom-free, threshold
  1.0); smoke and flashes are your own effect cards at `userData.muzzle`.
- `put()` adds the contact blob; pass `blob: false` for seated or floating people.
- tsc only checks `shared/` through a chapter that imports it (via the generated registry): run `npm run gen` and
  `npx tsc --noEmit` after wiring your chapter.
- Forbidden tokens of the import sandbox apply here too (docs/video-format.md); the scan is textual.
