// Chapter 5, "Pyramids and a Lost Fleet": the timeline. Shots keyed to words.json, the places they happen in, the
// camera keys (same grammar as the sample chapter: smootherstep glides, hard cuts on big reframes, every hold creeps),
// impact kicks and the lens blur per beat. Positions of the main actors live here so the cameras can frame them.
import { clamp01, smooth, easeOut } from "../../../src/engine/math";
export const FPS = 30;
export const TOTAL = 3138;
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places (one world; every place is a group shown only in its own shots) ----------------
/** voyage: the flagship L'Orient at the origin, bow +x, deck floor at FL */
export const FL = 4.1;
export const NAP_RAIL: V3 = [6, FL, 3.0];
export const MAP_T: V3 = [-6, FL, -1.3];
export const SCOPE: V3 = [7.0, FL, -3.5];
export const EASEL: V3 = [10.6, FL, 1.6];
/** Aboukir Bay: the French line at z = 0 (13 ships, x -300..300), beach above z = SHORE_Z, Nelson's Vanguard heading -z */
export const SHORE_Z = -120, BEACH = 0.3;
export const NAP_SHORE: V3 = [10, BEACH, -128];
export const VANGUARD: V3 = [40, -1, 210];
export const FLV = 3.6;
export const NELSON_AT: V3 = [40.6, FLV, 200.5];
/** Egypt: sand ground (sandY), the Nile at x 300..380, the pyramids at z -560..-640 */
export const RIDGE_Z = -70;
export const DIG: V3 = [250, 0, 100];
export const STONE2: V3 = [253, 0, 104.5];
export const CAMP: V3 = [-150, 0, 200];
export const NAP_CAMP: V3 = [-150, 0, 203.2];
export const ACRE: V3 = [0, 0, 560];
/** France: a Paris street at the origin, the plotters' room at z -200, the Orangerie of Saint-Cloud at z -400 */
export const ROOM: V3 = [0, 0, -200];
export const HALL: V3 = [0, 0, -400];
export const TRIB = 0.8; // tribune height

/** the desert ground height (m): a ridge for the Mamluks, the hill under Acre, a few dunes; flat on the battlefield */
const g2 = (x: number, z: number, cx: number, cz: number, sx: number, sz: number) => Math.exp(-(((x - cx) / sx) ** 2) - (((z - cz) / sz) ** 2));
export const sandY = (x: number, z: number) => {
  let y = 4.2 * Math.exp(-(((z - RIDGE_Z) / 10) ** 2)) * (1 - smooth((Math.abs(x) - 70) / 50));
  y += 13 * g2(x, z, ACRE[0], ACRE[2] + 10, 70, 55);
  for (const [cx, cz, h, sx, sz] of DUNES) y += h * g2(x, z, cx, cz, sx, sz);
  return y;
};
const DUNES: [number, number, number, number, number][] = [
  [-150, -160, 7, 50, 30], [140, -200, 6, 45, 28], [-260, -40, 9, 60, 40], [-90, 380, 6, 40, 30], [120, 400, 7, 50, 30],
  [-300, 260, 10, 60, 50], [60, -330, 5, 60, 25], [-60, 120, 3, 30, 22], [170, 20, 4, 30, 25],
];

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Place = "voyage" | "desert" | "bay" | "battle" | "wrecks" | "escape" | "france";
/** night: "moon" (blue moonlight, escape) or "fire" (the burning bay); the grade still follows `light` */
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; night?: "moon" | "fire" };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 159, light: "day", place: "voyage" },        // the fleet at sea (title card)
  { id: 2, a: 159, b: 310, light: "day", place: "voyage" },      // Napoleon at the rail -> the crowded deck
  { id: 3, a: 310, b: 401, light: "day", place: "voyage" },      // the map: the route to India
  { id: 4, a: 401, b: 651, light: "day", place: "voyage" },      // the savants on deck
  { id: 5, a: 651, b: 791, light: "day", place: "desert" },      // the Mamluk cavalry on the ridge
  { id: 6, a: 791, b: 870, light: "day", place: "desert" },      // the army marching, pyramids on the horizon
  { id: 7, a: 870, b: 1027, light: "day", place: "desert" },     // the hollow square, the charge breaking
  { id: 8, a: 1027, b: 1110, light: "day", place: "desert" },    // victory
  { id: 9, a: 1110, b: 1183, light: "golden", place: "bay" },    // the fleet at anchor, eleven days later
  { id: 10, a: 1183, b: 1315, light: "golden", place: "bay" },   // Nelson -> the British line sailing in
  { id: 11, a: 1315, b: 1423, light: "golden", place: "battle", night: "fire" }, // the night battle, L'Orient explodes
  { id: 12, a: 1423, b: 1560, light: "day", place: "wrecks" },   // next morning: Napoleon at the empty sea
  { id: 13, a: 1560, b: 1708, light: "day", place: "desert" },   // desert march -> the siege of Acre
  { id: 14, a: 1708, b: 1932, light: "day", place: "desert" },   // digging at Rosetta, the stone
  { id: 15, a: 1932, b: 2059, light: "day", place: "desert" },   // the scholars and the stone
  { id: 16, a: 2059, b: 2325, light: "golden", place: "desert" }, // news from home at the camp, the decision
  { id: 17, a: 2325, b: 2519, light: "day", place: "escape", night: "moon" }, // slipping away at night
  { id: 18, a: 2519, b: 2597, light: "day", place: "france" },   // cheered in the streets
  { id: 19, a: 2597, b: 2678, light: "golden", place: "france" }, // the plot by candlelight
  { id: 20, a: 2678, b: 2822, light: "day", place: "france" },   // Saint-Cloud: shouted down
  { id: 21, a: 2822, b: 2922, light: "day", place: "france" },   // Lucien, the soldiers clear the hall
  { id: 22, a: 2922, b: TOTAL, light: "day", place: "france" },  // First Consul
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 5: 8, 9: 10, 11: 8, 12: 8, 13: 8, 14: 8, 17: 8, 18: 8, 20: 8, 22: 8 };
export const FLASH_AT = -100; // no white flash in this chapter

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story physics ----------------
/** the column in the desert marches +x (shot 6) */
export const colX = (t: number) => 9 + 1.5 * (t - 26.3);
/** the tired column (shot 13) */
export const tiredX = (t: number) => -14 + 0.9 * (t - 52);
/** British ships closing on the anchored line (shot 10): z offset */
export const brZ = (t: number) => -2.2 * Math.max(0, t - 39.4);
/** the little ship slipping away (shot 17), the British patrol */
export const smallX = (t: number) => -62 + 6 * (t - 77.5);
export const SMALL_Z = 140;
export const patrolX = (t: number) => 40 - 2 * (t - 77.5);
export const PATROL_Z = 200;
/** Napoleon riding through the cheering street (shot 18) */
export const rideX = (t: number) => -7 + 1.6 * (t - 84);
/** the courier galloping into the camp (shot 16), stopping at 70.1 s */
export const COURIER_STOP = 70.1;
export const courierX = (t: number) => CAMP[0] + 4.2 + Math.max(0, COURIER_STOP - t) * 7.5;
/** L'Orient explodes */
export const BOOM = 46.1;

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 26, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** a slow lateral drift (m) along d over the shot, on top of a push */
const drift = (s: Shot, d: V3, u: number): Shot => ({ ...s, pos: add(s.pos, [d[0] * u, d[1] * u, d[2] * u]), look: add(s.look, [d[0] * u, d[1] * u, d[2] * u]) });
/** a ship's slow roll on the deck shots (rad): 7 s period, tiny */
const sea = (f: number, a = 0.008) => a * Math.sin((2 * Math.PI * f) / 210);

const SH = (id: number) => SHOTS[id - 1];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => drift(dolly([-78, 19, 92], [34, 7, -6], pushK(f, 0, 0.0012), { fov: 27 }), [10, 0, -4], f / 160) }],
  2: [
    { f: 159, s: (f) => dolly([7.3, 7.05, 12.6], [6, 5.6, 3.0], pushK(f, 159, 0.0022), { fov: 23, roll: sea(f) }) },
    { f: 253, cut: true, s: (f) => drift(dolly([62, 30, 52], [7, 6, 0], pushK(f, 253, 0.0016), { fov: 30 }), [-3, 0, 0], (f - 253) / 60) },
  ],
  3: [
    { f: 310, s: (f) => dolly([-6.4, 7.5, 4.3], [-6, 5.1, -1.9], pushK(f, 310, 0.0028), { fov: 31, roll: sea(f) }) },
    { f: 366, dur: 26, s: (f) => dolly([-5.0, 7.2, 3.9], [-5.8, 5.0, -1.8], pushK(f, 366, 0.002), { fov: 31, roll: sea(f) - 0.03 }) }, // "India": along the route
  ],
  4: [
    { f: 401, s: (f) => dolly([7.9, 6.0, 3.6], [7.6, 5.35, -3.0], pushK(f, 401, 0.0024), { fov: 26, roll: sea(f) }) },
    { f: 478, cut: true, s: (f) => drift(dolly([14.2, 8.4, 4.6], [4.6, 4.5, -0.8], pushK(f, 478, 0.0018), { fov: 34 }), [0, 0, -1.2], (f - 478) / 70) },
    { f: 547, cut: true, s: (f) => dolly([6.4, 6.1, 4.6], [11.0, 5.2, 1.6], pushK(f, 547, 0.0025), { fov: 28, roll: sea(f) + 0.02 }) },
  ],
  5: [
    { f: 645, s: (f) => dolly([5, 3.0, -38], [0, 6.0, -70], pushK(f, 645, 0.0018), { fov: 27 }) },
    { f: 736, cut: true, s: (f) => dolly([5.5, sandY(2, -64) + 1.7, -53.8], [2.2, sandY(2, -64) + 2.0, -64.3], pushK(f, 736, 0.002, 0.005, 30), { fov: 27, roll: 0.035 }) },
  ],
  6: [{ f: 791, s: (f) => drift(dolly([-2, 1.05, 23], [0, 5.4, -10], pushK(f, 791, 0.0022), { fov: 27 }), [2.5, 0, 0], (f - 791) / 79) }],
  7: [
    { f: 870, s: (f) => drift(dolly([36, 30, 58], [0, 0, -4], pushK(f, 870, 0.0018), { fov: 28 }), [-6, 0, 0], (f - 870) / 90) },
    { f: 961, cut: true, s: (f) => dolly([-15, 1.35, 31], [2, 2.0, 13.5], pushK(f, 961, 0.0026), { fov: 28, roll: -0.03 }) },
    { f: 990, dur: 22, s: (f) => dolly([-15, 1.35, 31], [2, 2.0, 13.5], pushK(f, 961, 0.0026), { fov: 28, roll: 0.035 }) }, // "broke": roll through level
  ],
  8: [{ f: 1027, s: (f) => dolly([3.5, 1.35, 15], [0, 3.1, -4], pushK(f, 1027, 0.0028, 0.006, 30), { fov: 28 }) }],
  9: [{ f: 1100, s: (f) => drift(zoom([-330, 9, -72], [-60, 9, 4], 25, pushK(f, 1100, 0.0016)), [0, 0, 6], (f - 1100) / 90) }],
  10: [
    { f: 1183, s: (f) => dolly([47.2, FLV + 2.0, 205.2], [38.6, FLV + 1.45, 195.6], pushK(f, 1183, 0.0024), { fov: 26, roll: sea(f, 0.01) }) },
    { f: 1246, cut: true, s: (f) => drift(dolly([195, 6.5, 262], [40, 9, 92], pushK(f, 1246, 0.0018), { fov: 28 }), [0, 0, -6], (f - 1246) / 70) },
  ],
  11: [{ f: 1311, s: (f) => drift(dolly([-205, 10, -92], [-20, 9, 8], pushK(f, 1311, 0.0018), { fov: 27 }), [0, 0, 8], (f - 1311) / 112) }],
  12: [
    { f: 1419, s: (f) => dolly([6.5, 2.4, -136.5], [14, 2.7, -100], pushK(f, 1419, 0.0022), { fov: 28 }) },
    { f: 1503, cut: true, s: (f) => dolly([12.6, 2.05, -125.2], [10, 1.98, -128], pushK(f, 1503, 0.0025, 0.005, 30), { fov: 27, roll: -0.03 }) },
  ],
  13: [
    { f: 1556, s: (f) => { const x = tiredX(T(f)); return { pos: [x + 3, 1.7, 316.5], look: [x + 1.5, 1.75, 300], fov: 30 }; } },
    { f: 1658, cut: true, s: (f) => dolly([-34, 4.2, 452], [6, 3, 560], pushK(f, 1658, 0.0022), { fov: 26 }) },
  ],
  14: [
    { f: 1704, s: (f) => dolly([237.5, 2.7, 108.5], [250, 0.9, 99.5], pushK(f, 1704, 0.0018), { fov: 28 }) },
    { f: 1840, cut: true, s: (f) => dolly([245.2, 2.05, 104.2], [250, 0.7, 99.6], pushK(f, 1840, 0.0024), { fov: 28, roll: 0.03 }) },
    { f: 1888, cut: true, s: (f) => dolly([249.15, 1.35, 101.3], [250.4, 0.5, 99.35], pushK(f, 1888, 0.0018, 0.005, 28), { fov: 24 }) },
  ],
  15: [
    { f: 1932, s: (f) => dolly([253.6, 1.95, 112.4], [253, 1.35, 104.6], pushK(f, 1932, 0.0024), { fov: 28 }) },
    { f: 1993, dur: 30, s: (f) => dolly([252.2, 1.75, 108.8], [253.1, 1.15, 104.6], pushK(f, 1993, 0.002), { fov: 28, roll: 0.03 }) }, // "finally read"
  ],
  16: [
    { f: 2059, s: (f) => drift(dolly([-139, 1.9, 223], [-150.5, 2.3, 200], pushK(f, 2059, 0.0018), { fov: 30 }), [-2, 0, 0], (f - 2059) / 58) },
    { f: 2117, cut: true, s: (f) => dolly([-150.4, 1.8, 207.4], [-150, 1.5, 203.2], pushK(f, 2117, 0.0022), { fov: 27 }) },
    { f: 2184, dur: 26, s: (f) => dolly([-150.4, 1.8, 207.4], [-150, 1.5, 203.2], pushK(f, 2117, 0.0022), { fov: 27, roll: -0.035 }) }, // "weak and unpopular"
    { f: 2247, cut: true, s: (f) => dolly([-149.4, 1.8, 205.6], [-150, 1.5, 203.2], pushK(f, 2247, 0.0022, 0.006, 32), { fov: 26 }) },
  ],
  17: [
    { f: 2321, s: (f) => drift(dolly([-150, 5, -30], [-75, 8, 120], pushK(f, 2321, 0.0016), { fov: 28 }), [6, 0, 0], (f - 2321) / 75) },
    { f: 2396, cut: true, s: (f) => dolly([3.4, 2.3, -112], [0, 1.75, -128.5], pushK(f, 2396, 0.0026), { fov: 27 }) },
    { f: 2433, cut: true, s: (f) => drift(dolly([-78, 3.4, 72], [-22, 8, 170], pushK(f, 2433, 0.0016), { fov: 30 }), [8, 0, 0], (f - 2433) / 86) },
  ],
  18: [{ f: 2515, s: (f) => drift(dolly([1.5, 1.9, 13.5], [0, 2.8, -4], pushK(f, 2515, 0.0022), { fov: 30 }), [1.6, 0, 0], (f - 2515) / 82) }],
  19: [{ f: 2597, s: (f) => dolly([0.4, 2.0, -195.4], [0, 1.45, -201], pushK(f, 2597, 0.003), { fov: 30, roll: 0.02 }) }],
  20: [
    { f: 2674, s: (f) => drift(dolly([-24.5, 3.6, -387.5], [-3, 2.0, -401], pushK(f, 2674, 0.0018), { fov: 32 }), [1, 0, 0], (f - 2674) / 97) },
    { f: 2771, cut: true, s: (f) => dolly([-17.0, 1.9, -396.0], [-15.2, 1.6, -400.8], pushK(f, 2771, 0.0024, 0.006, 30), { fov: 28, roll: 0.035 }) },
  ],
  21: [
    { f: 2822, s: (f) => dolly([-10.5, 2.35, -397.6], [-19.5, 2.55, -403.4], pushK(f, 2822, 0.0026), { fov: 30 }) },
    { f: 2875, cut: true, s: (f) => drift(dolly([-4, 2.0, -387.5], [-4, 1.6, -403], pushK(f, 2875, 0.0016), { fov: 32 }), [-2.5, 0, 0], (f - 2875) / 47) },
  ],
  22: [
    { f: 2918, s: (f) => dolly([-11.5, 2.5, -397.4], [-20, 2.45, -398.6], pushK(f, 2918, 0.0022), { fov: 28 }) },
    { f: 3042, cut: true, s: (f) => dolly([-16.6, 2.75, -397.8], [-20, 2.25, -398.4], pushK(f, 3042, 0.0022, 0.006, 32), { fov: 27, roll: -0.03 }) },
  ],
};

// impact kicks: L'Orient's explosion, the Acre bombardment, the volleys of the square
const KICKS: [number, number][] = [[BOOM, 1.6], [56.2, 0.4], [33.15, 0.5]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** every in-shot cut frame (for shots.json "planned") */
export const CUTS = Object.values(CAMS).flat().filter((k) => k.cut).map((k) => k.f);
export const KICK_FRAMES = KICKS.map(([t]) => Math.ceil(t * FPS - 1e-6));
export const shotIdOf = (id: number) => SH(id);

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const at = (p: V3, dy: number) => (): V3 => [p[0], p[1] + dy, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },                                   // fleet wide
  { f: 159, cInf: 12, focus: at(NAP_RAIL, 1.6) },      // Napoleon at the rail
  { f: 253, cInf: 0 },                                 // the deck from above
  { f: 310, cInf: 8 },                                 // the map table (focus = look)
  { f: 401, cInf: 12, focus: at(SCOPE, 1.55) },        // the savant at the telescope
  { f: 478, cInf: 0 },                                 // the deck of scholars
  { f: 547, cInf: 12, focus: () => [11.4, FL + 1.6, 2.4] }, // the artist
  { f: 651, cInf: 0 },                                 // the ridge (establishing)
  { f: 736, cInf: 12, focus: () => [2, sandY(2, -64.5) + 2.9, -64.5] }, // the Mamluk CU
  { f: 791, cInf: 0 },                                 // the march, the square, the victory wide
  { f: 1027, cInf: 8, focus: () => [0, 3.0, -2.5] },   // victory: Napoleon on the horse
  { f: 1110, cInf: 0 },                                // the bay
  { f: 1183, cInf: 11, focus: at(NELSON_AT, 1.6) },    // Nelson
  { f: 1246, cInf: 0 },                                // the British line, the battle
  { f: 1423, cInf: 6, focus: at(NAP_SHORE, 1.6) },     // Napoleon on the shore (wide)
  { f: 1503, cInf: 14, focus: at(NAP_SHORE, 1.6) },    // CU
  { f: 1560, cInf: 0 },                                // march, Acre
  { f: 1708, cInf: 5 },                                // the dig (focus = look)
  { f: 1840, cInf: 10 },                               // the stone found
  { f: 1888, cInf: 13 },                               // stone CU
  { f: 1932, cInf: 10, focus: () => [253, 1.55, 105.3] }, // scholars
  { f: 2059, cInf: 0 },                                // camp wide
  { f: 2117, cInf: 12, focus: at(NAP_CAMP, 1.55) },    // reading
  { f: 2247, cInf: 14, focus: at(NAP_CAMP, 1.62) },    // the decision CU
  { f: 2325, cInf: 0 },                                // escape wide
  { f: 2396, cInf: 8, focus: () => [0, BEACH + 1.6, -128.5] }, // the soldiers on the beach
  { f: 2433, cInf: 0 },                                // the British ship
  { f: 2519, cInf: 6, focus: () => [rideX(85.5), 3.0, -0.5] }, // the street
  { f: 2597, cInf: 11, focus: () => [0, 1.5, -201.1] }, // the plot
  { f: 2678, cInf: 0 },                                // the hall wide
  { f: 2771, cInf: 13, focus: () => [-16, 1.6, -400.6] }, // Napoleon shouted down
  { f: 2822, cInf: 9, focus: () => [-20, TRIB + 1.6, -404] }, // Lucien
  { f: 2875, cInf: 0 },                                // clearing the hall
  { f: 2922, cInf: 10, focus: () => [-20, TRIB + 1.6, -398.4] }, // First Consul
  { f: 3042, cInf: 14, focus: () => [-20, TRIB + 1.65, -398.4] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
