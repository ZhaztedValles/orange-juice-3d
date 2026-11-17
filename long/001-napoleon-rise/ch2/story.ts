// Chapter 2 "The Outsider at School": timeline, shots, cameras, lens and impact kicks, all keyed to words.json.
// Four places live in one scene, 2 km apart so fog and the far plane keep them out of each other's frames:
// Brienne (origin), Paris / Champ de Mars and the Ecole Militaire (x + 2000), and three interior sets at x - 2000
// (the Autun classroom, the Brienne classroom, Napoleone's room).
import { clamp01, smooth, easeOut } from "../../../src/engine/math";
export const FPS = 30;
export const TOTAL = 3089;
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
export type PlaceId = "brienne" | "paris" | "classA" | "classB" | "room";
export const ORIGIN: Record<PlaceId, V3> = {
  brienne: [0, 0, 0], paris: [2000, 0, 0], classA: [-2000, 0, 0], classB: [-2000, 0, 200], room: [-2000, 0, 400],
};
/** place-local point -> world */
export const P = (pl: PlaceId, x: number, y: number, z: number): V3 => { const o = ORIGIN[pl]; return [o[0] + x, o[1] + y, o[2] + z]; };

// ---------------- story beats (seconds, from words.json) ----------------
export const FORT0 = 39.15, FORT1 = 41.2;      // "built a fortress of snow": walls rise
export const FIRE1 = 1799 / FPS;               // "the cannons"
export const FIRE2 = 1938 / FPS;               // "maths mattered more": the target shot
export const HIT2 = FIRE2 + 0.55;
export const LETTER_SAD = 2132 / FPS;           // "died"
export const FLASH_AT = 3011;                   // "exploded"

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Sky = "grey" | "blue";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: PlaceId; sky?: Sky; snow?: boolean; night?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 138, light: "day", place: "classA" },                          // Autun schoolroom
  { id: 2, a: 138, b: 320, light: "day", place: "brienne", sky: "grey" },           // arrival at Brienne
  { id: 3, a: 320, b: 467, light: "day", place: "brienne", sky: "grey" },           // the rich boys
  { id: 4, a: 467, b: 585, light: "day", place: "brienne", sky: "grey" },           // small, poor, accent
  { id: 5, a: 585, b: 728, light: "day", place: "brienne", sky: "grey" },           // mocked; walks away
  { id: 6, a: 728, b: 922, light: "day", place: "brienne", sky: "grey" },           // reading under a tree
  { id: 7, a: 922, b: 1032, light: "day", place: "classB" },                        // mathematics
  { id: 8, a: 1032, b: 1251, light: "day", place: "brienne", sky: "grey", snow: true }, // snow, the fortress rises
  { id: 9, a: 1251, b: 1352, light: "day", place: "brienne", sky: "grey", snow: true }, // Napoleone takes charge
  { id: 10, a: 1352, b: 1432, light: "day", place: "brienne", sky: "grey", snow: true }, // the snowball battle
  { id: 11, a: 1432, b: 1592, light: "golden", place: "brienne", snow: true },       // the legend (golden crane-out)
  { id: 12, a: 1592, b: 1763, light: "day", place: "paris", sky: "blue" },          // Ecole Militaire
  { id: 13, a: 1763, b: 1823, light: "day", place: "paris", sky: "blue" },          // the artillery: a cannon fires
  { id: 14, a: 1823, b: 1996, light: "day", place: "paris", sky: "blue" },          // clever, not rich; maths
  { id: 15, a: 1996, b: 2193, light: "day", place: "room" },                        // the letter
  { id: 16, a: 2193, b: 2346, light: "golden", place: "room", night: true },        // candlelight: the family
  { id: 17, a: 2346, b: 2492, light: "golden", place: "room", night: true },        // racing through the course
  { id: 18, a: 2492, b: 2663, light: "day", place: "paris", sky: "blue" },          // second lieutenant
  { id: 19, a: 2663, b: 2755, light: "day", place: "room" },                        // a lieutenant's pay
  { id: 20, a: 2755, b: 2824, light: "day", place: "paris", sky: "blue" },          // promotions with connections
  { id: 21, a: 2824, b: 3011, light: "day", place: "room" },                        // forgotten junior officer
  { id: 22, a: 3011, b: TOTAL, light: "day", place: "paris", sky: "blue" },         // 1789: France explodes
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 2: 8, 7: 6, 8: 10, 11: 8, 12: 10, 15: 10, 16: 8, 18: 8, 19: 8, 21: 8 };

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 26, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
/** push-in factor since f0 (subject grows ~rate per frame), `punch` raises it for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push in place-local coordinates: the camera slides toward the look point by factor k */
const D = (pl: PlaceId, pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => {
  const p: V3 = [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k];
  return { pos: P(pl, ...p), look: P(pl, ...look), ...rest };
};
/** pull-back: the camera slides away from the look point (k > 1 grows) */
const pull = (f: number, f0: number, rate: number) => Math.exp(rate * Math.max(0, f - f0));

// Brienne: the school front at z = 30; Nap walks in from the left at z = -15
export const NAP_WALK = { x0: -10.5, x1: -5.2, z: -5, t0: 138 / FPS, t1: 250 / FPS };
export const napWalkX = (t: number) => NAP_WALK.x0 + (NAP_WALK.x1 - NAP_WALK.x0) * clamp01((t - NAP_WALK.t0) / (NAP_WALK.t1 - NAP_WALK.t0));
// shot 5: Nap turns and walks off on "He did not try to fit in"
export const WALKOFF = 668 / FPS;

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: (f) => D("classA", [0.6, 2.5, -8.2], [0, 1.25, 1.5], pushK(f, 0, 0.0016), { fov: 30 }) },
    { f: 92, dur: 34, s: (f) => D("classA", [-0.4, 1.3, -4.3], [-1.3, 1.0, -0.9], pushK(f, 92, 0.002), { fov: 27, roll: 0.03 }) },
  ],
  2: [
    { f: 134, s: (f) => D("brienne", [6, 6.5, -44], [-2, 3.5, 20], pushK(f, 134, 0.0012), { fov: 30 }) },
    { f: 200, dur: 40, s: (f) => D("brienne", [0, 3.2, -30], [-5, 2.2, 10], pushK(f, 200, 0.0015), { fov: 30, roll: -0.02 }) },
    { f: 266, cut: true, s: (f) => D("brienne", [-2.6, 0.85, -8.6], [-5.3, 1.35, -3], pushK(f, 266, 0.0025), { fov: 30, roll: 0.03 }) },
  ],
  3: [
    { f: 320, s: (f) => D("brienne", [4.4, 1.35, -13.2], [4.6, 1.05, -6], pushK(f, 320, 0.002), { fov: 26 }) },
    { f: 378, dur: 30, s: (f) => D("brienne", [5.6, 1.3, -10.6], [5.3, 1.05, -6], pushK(f, 378, 0.0022), { fov: 26, roll: -0.035 }) },
  ],
  4: [
    { f: 467, s: (f) => D("brienne", [-0.2, 0.95, -10.4], [-0.3, 1.0, -6], pushK(f, 467, 0.0025), { fov: 26 }) },
    { f: 541, dur: 24, s: (f) => D("brienne", [0.5, 1.0, -9.2], [0.1, 1.05, -5.8], pushK(f, 541, 0.002, 0.005, 30), { fov: 26, roll: 0.035 }) },
  ],
  5: [
    { f: 585, s: (f) => D("brienne", [0.4, 1.7, -15.5], [0.4, 1.0, -6], pushK(f, 585, 0.0018), { fov: 28 }) },
    { f: 660, dur: 40, s: (f) => D("brienne", [1.4, 1.5, -14.5], [1.6, 1.0, -6], pushK(f, 660, 0.0018), { fov: 28 }) },
  ],
  6: [
    { f: 728, s: (f) => D("brienne", [-20.9, 1.4, 0.9], [-23.7, 1.1, 6.0], pushK(f, 728, 0.002), { fov: 28 }) },
    { f: 823, dur: 32, s: (f) => D("brienne", [-22.0, 1.25, 3.0], [-23.4, 1.08, 6.0], pushK(f, 823, 0.0015), { fov: 30, roll: 0.03 }) },
  ],
  7: [
    { f: 919, s: (f) => D("classB", [0.4, 1.9, -6.0], [0.3, 1.45, 3.5], pushK(f, 919, 0.0018), { fov: 28 }) },
    { f: 984, dur: 26, s: (f) => D("classB", [-1.0, 1.5, -2.0], [-1.1, 1.35, 3.9], pushK(f, 984, 0.002, 0.005, 30), { fov: 30, roll: -0.03 }) },
  ],
  8: [
    { f: 1027, s: (f) => D("brienne", [18, 12, -38], [0, 3, 6], pushK(f, 1027, 0.0012), { fov: 30 }) },
    { f: 1150, dur: 40, s: (f) => D("brienne", [6.5, 3.4, -15], [0, 0.6, -1.5], pushK(f, 1150, 0.0018), { fov: 30 }) },
  ],
  9: [
    { f: 1251, s: (f) => D("brienne", [1.8, 2.6, -10.5], [0, 1.45, 0.4], pushK(f, 1251, 0.0022), { fov: 28 }) },
    { f: 1316, dur: 28, s: (f) => D("brienne", [-1.4, 2.4, -9.6], [0, 1.5, 0.4], pushK(f, 1316, 0.002), { fov: 28, roll: -0.035 }) },
  ],
  10: [
    { f: 1352, s: (f) => D("brienne", [12.5, 2.1, -4.5], [0, 0.95, -4.0], pushK(f, 1352, 0.0025), { fov: 32 }) },
    { f: 1395, dur: 22, s: (f) => D("brienne", [10.5, 1.8, -4.2], [0, 1.0, -4.0], pushK(f, 1395, 0.0025, 0.006, 30), { fov: 32, roll: 0.04 }) },
  ],
  11: [
    { f: 1428, s: (f) => D("brienne", [3.2, 1.3, -9.5], [0, 2.2, 0.8], pushK(f, 1428, 0.001), { fov: 30 }) },
    { f: 1470, dur: 110, s: () => D("brienne", [6.5, 5.0, -17], [0, 1.9, -1.5], 1, { fov: 30 }) },
  ],
  12: [
    { f: 1587, s: (f) => D("paris", [-22, 2.6, -42], [0, 11, 60], pushK(f, 1587, 0.0012), { fov: 30 }) },
    { f: 1700, dur: 40, s: (f) => D("paris", [-9, 1.6, -6], [-2, 5.6, 60], pushK(f, 1700, 0.0012), { fov: 32, roll: 0.02 }) },
  ],
  13: [
    { f: 1763, s: (f) => D("paris", [5.6, 1.45, -5.2], [0.2, 1.0, 0.4], pushK(f, 1763, 0.0025), { fov: 30 }) },
  ],
  14: [
    { f: 1823, s: (f) => D("paris", [5.2, 1.45, -2.4], [3.0, 1.2, 1.9], pushK(f, 1823, 0.0022), { fov: 28 }) },
    { f: 1871, cut: true, s: (f) => D("paris", [-6.0, 1.5, 0.2], [-8.3, 1.1, 6.0], pushK(f, 1871, 0.0022), { fov: 28, roll: -0.03 }) },
    { f: 1903, cut: true, s: (f) => D("paris", [2.2, 1.9, 6.5], [-0.2, 0.9, -40], pushK(f, 1903, 0.0015), { fov: 30 }) },
  ],
  15: [
    { f: 1991, s: (f) => D("room", [0.2, 1.45, -3.9], [0.35, 1.1, 1.2], pushK(f, 1991, 0.0018), { fov: 30 }) },
    { f: 2096, dur: 36, s: (f) => D("room", [0.3, 1.35, -1.0], [0.4, 1.2, 1.2], pushK(f, 2096, 0.0015, 0.004, 30), { fov: 30 }) },
  ],
  16: [
    { f: 2189, s: (f) => D("room", [-0.4, 1.45, -1.9], [-1.15, 0.95, 1.8], pushK(f, 2189, 0.002), { fov: 30 }) },
  ],
  17: [
    { f: 2346, s: (f) => D("room", [1.5, 1.35, -1.8], [-0.6, 1.15, 1.6], pushK(f, 2346, 0.0018), { fov: 28 }) },
    { f: 2420, dur: 40, s: (f) => D("room", [0.2, 1.3, -1.3], [-0.8, 1.15, 1.6], pushK(f, 2420, 0.002), { fov: 28, roll: 0.03 }) },
  ],
  18: [
    { f: 2488, s: (f) => D("paris", [0.6, 1.85, 37.5], [0, 1.35, 48], pushK(f, 2488, 0.0018), { fov: 30 }) },
    { f: 2592, cut: true, s: (f) => D("paris", [0.3, 1.3, 43.8], [0, 1.45, 47.6], pushK(f, 2592, 0.002, 0.005, 30), { fov: 28, roll: 0.03 }) },
  ],
  19: [
    { f: 2659, s: (f) => D("room", [-0.1, 1.35, -2.5], [-1.9, 0.95, 0.6], pushK(f, 2659, 0.002), { fov: 30 }) },
  ],
  20: [
    { f: 2755, s: (f) => D("paris", [2.6, 1.6, 36.6], [1.4, 1.35, 44.3], pushK(f, 2755, 0.0025), { fov: 28 }) },
  ],
  21: [
    { f: 2820, s: (f) => { const k = pull(f, 2830, 0.0075); return D("room", [1.15, 1.45, 0.4], [1.3, 1.3, 2.0], Math.min(k, 3.4), { fov: 30 }); } },
    { f: 2953, cut: true, s: (f) => D("room", [0.7, 1.4, -0.2], [1.35, 1.3, 2.05], pushK(f, 2953, 0.0025, 0.006, 30), { fov: 28, roll: -0.03 }) },
  ],
  22: [
    { f: 3011, s: (f) => D("paris", [-16, 1.3, -6.5], [-16, 2.0, 12], pushK(f, 3011, 0.0025), { fov: 34 }) },
  ],
};

// impact kicks: the image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[FIRE1, 1.2], [1380 / FPS, 0.5], [1401 / FPS, 0.5], [1418 / FPS, 0.6], [FIRE2, 0.8], [FLASH_AT / FPS, 1.4]];
export const KICK_FRAMES = KICKS.map(([t]) => Math.round(t * FPS));
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
/** every in-shot camera cut (for shots.json) */
export const CUT_FRAMES = Object.values(CAMS).flatMap((ks) => ks.filter((k) => k.cut).map((k) => k.f));

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },                                              // classroom wide (title card)
  { f: 92, dur: 34, cInf: 11, focus: () => P("classA", -1.3, 1.05, -0.9) },
  { f: 138, cInf: 0 },                                            // Brienne wides
  { f: 266, cInf: 12, focus: () => P("brienne", -5.2, 1.1, -5) }, // Nap looks up
  { f: 320, cInf: 10 },                                           // boys
  { f: 467, cInf: 12, focus: () => P("brienne", -1.0, 1.05, -5.8) },
  { f: 585, cInf: 0 },
  { f: 728, cInf: 10, focus: () => P("brienne", -23.7, 1.1, 6.0) },
  { f: 922, cInf: 0 },                                            // classroom B
  { f: 984, dur: 26, cInf: 8, focus: () => P("classB", -0.3, 1.4, 3.6) },
  { f: 1032, cInf: 0 },                                           // snow wide
  { f: 1251, cInf: 10, focus: () => P("brienne", 0, 1.7, 0.6) },  // Nap takes charge
  { f: 1352, cInf: 0 },                                           // battle (busy, sharp)
  { f: 1432, cInf: 5 },                                           // legend: mild
  { f: 1592, cInf: 0 },                                           // Paris wides
  { f: 1763, cInf: 10, focus: () => P("paris", 1.5, 1.2, 1.0) },
  { f: 1823, cInf: 11, focus: () => P("paris", 3.4, 1.25, 1.9) },
  { f: 1871, cInf: 11, focus: () => P("paris", -8.2, 1.15, 6.0) },
  { f: 1903, cInf: 0 },
  { f: 1996, cInf: 8, focus: () => P("room", 0.4, 1.4, 1.2) },
  { f: 2096, dur: 36, cInf: 13, focus: () => P("room", 0.4, 1.5, 1.2) },
  { f: 2193, cInf: 9, focus: () => P("room", -1.15, 1.0, 1.95) },
  { f: 2346, cInf: 9, focus: () => P("room", -0.6, 1.25, 1.4) },
  { f: 2492, cInf: 7, focus: () => P("paris", 0, 1.4, 47.5) },
  { f: 2592, cInf: 13, focus: () => P("paris", 0, 1.5, 47.6) },
  { f: 2663, cInf: 9, focus: () => P("room", -1.9, 0.95, 0.6) },
  { f: 2755, cInf: 11, focus: () => P("paris", 1.6, 1.45, 44.2) },
  { f: 2824, cInf: 8, focus: () => P("room", 1.3, 1.45, 2.0) },
  { f: 2953, cInf: 13, focus: () => P("room", 1.35, 1.35, 2.05) },
  { f: 3011, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
