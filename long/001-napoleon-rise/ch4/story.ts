// Chapter 4 "A Whiff of Grapeshot" (1794-1796): timeline, sets, cameras, kicks and lens per shot, keyed to words.json.
// Seven sets live in one world (world.ts) and only the shot's own set is visible: the Tuileries square (PALACE), a
// Paris street ending at the church of Saint-Roch (STREET), a prison cell (CELL), a garret (ATTIC), a salon (SALON,
// also the candle-lit wedding), the countryside / army camp (COUNTRY) and the river with the bridge of Lodi (LODI).
// Camera grammar as the sample chapter: cuts on big reframes, smootherstep glides 18-40 f, every hold creeps.
import { clamp01, smooth, easeOut } from "../../../src/engine/math";
export const FPS = 30;
export const TOTAL = 3105;
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type SetName = "palace" | "street" | "cell" | "attic" | "salon" | "country" | "lodi";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 144, light: "day", set: "palace" },        // Paris 1794: the Tuileries; deputies quarrel
  { id: 2, a: 144, b: 269, light: "day", set: "palace" },      // Robespierre arrested and led away
  { id: 3, a: 269, b: 407, light: "day", set: "street" },      // Napoleon and Augustin Robespierre; soldiers arrest him too
  { id: 4, a: 407, b: 549, light: "day", set: "cell" },        // prison cell
  { id: 5, a: 549, b: 669, light: "day", set: "street" },      // released, walking alone through Paris
  { id: 6, a: 669, b: 813, light: "day", set: "attic" },       // the garret; dreaming of the Sultan's skyline
  { id: 7, a: 813, b: 924, light: "day", set: "palace" },      // October 1795: the palace again
  { id: 8, a: 924, b: 1040, light: "day", set: "street" },     // royalists march on the government
  { id: 9, a: 1040, b: 1224, light: "day", set: "palace" },    // Barras; he calls for Napoleon
  { id: 10, a: 1224, b: 1316, light: "day", set: "palace" },   // Napoleon: "cannons" -> cannon insert
  { id: 11, a: 1316, b: 1518, light: "day", set: "country" },  // Murat gallops; the gun park at Sablons
  { id: 12, a: 1518, b: 1693, light: "day", set: "street" },   // Saint-Roch: royalists on the steps; the guns fire; they scatter
  { id: 13, a: 1693, b: 1771, light: "day", set: "street" },   // the smoke clears: "a whiff of grapeshot"
  { id: 14, a: 1771, b: 1905, light: "day", set: "palace" },   // command of the army in Paris
  { id: 15, a: 1905, b: 2061, light: "day", set: "salon" }, // Josephine in her salon
  { id: 16, a: 2061, b: 2101, light: "day", set: "salon" }, // he fell for her hard
  { id: 17, a: 2101, b: 2174, light: "golden", set: "salon" }, // the wedding by candlelight
  { id: 18, a: 2174, b: 2334, light: "day", set: "street" },   // two days later: riding off to Italy
  { id: 19, a: 2334, b: 2497, light: "day", set: "country" },  // the ragged army of Italy; Napoleon at 26
  { id: 20, a: 2497, b: 2576, light: "day", set: "country" },  // army after army
  { id: 21, a: 2576, b: 2783, light: "day", set: "lodi" },     // the bridge of Lodi
  { id: 22, a: 2783, b: 2886, light: "golden", set: "country" }, // "the little corporal" by the camp fire
  { id: 23, a: 2886, b: TOTAL, light: "golden", set: "palace" }, // the hero's return; politicians whisper
];
/** crossfades (frames) at time jumps; one white flash when the guns fire at Saint-Roch */
export const XFADE: Record<number, number> = { 7: 8, 15: 8, 18: 8, 19: 8, 22: 8, 23: 8 };
export const FLASH_AT = 1610;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story beats (seconds, from words.json; reactions lead their word by 2 f) ----------------
const L = 2 / FPS;
export const BEAT = {
  turned: 3.55 - L, arrested: 7.45 - L, so: 11.55 - L, over: 17.02 - L, thought: 22.8 - L, sultan: 25.44 - L,
  thousands: 30.86, remembered: 38.3 - L, exactly: 41.75 - L, cannons: 42.98 - L, galloped: 46.55 - L, forty: 47.64 - L,
  fired: 53.74 - L, fell: 54.85 - L, whiff: 57.89 - L, changed: 59.92 - L, command: 61.38 - L, widow: 66.25 - L, hard: 69.38 - L,
  married: 70.09 - L, left: 73.55 - L, boots: 80.09 - L, twentysix: 81.62 - L, charged: 89.01 - L, took: 91.95 - L,
  corporal: 95.17 - L, hero: 97.45 - L, men: 98.22 - L, wonder: 99.61 - L,
};

// ---------------- set anchors ----------------
/** Saint-Roch facade plane (STREET set): the church closes the street at z = CHURCH_Z, steps down to z = STEPS_Z */
export const CHURCH_Z = -40, STEPS_Z = -33.5;
/** the guns in the street (STREET set), muzzles toward -z */
export const STREET_GUNS: V3[] = [[-3.2, 0, 4], [3.2, 0, 4]];
/** Lodi: deck height and half-length of the bridge along z; river half-width */
export const DECK = 1.0, BR_HALF = 44, RIVER = 36, WATER_Y = -1.7;
/** the camp in the COUNTRY set */
export const CAMP: V3 = [40, 0, -26];
/** the Sablons gun park in the COUNTRY set */
export const PARK: V3 = [-60, 0, -16];
/** Murat's gallop along the road (COUNTRY, +x): x at time t */
export const muratX = (t: number) => -150 + 7.2 * (t - 43.9);
/** Napoleon riding off (STREET, +z) */
export const rideZ = (t: number) => 30 + 5.0 * Math.max(0, t - 73.4) ** 1.25;
/** Napoleon walking alone (STREET, along -z) */
export const walkZ = (t: number) => 92 - 1.3 * (t - 18.3);
/** royalist column marching (STREET, along -z) */
export const royalFront = (t: number) => 62 - 1.5 * (t - 30.8);
/** charging column on the Lodi bridge (+z) */
export const chargeZ = (t: number) => -60 + 5.2 * (t - 88.4);
/** marching column (COUNTRY road, +x) */
export const marchX = (t: number) => -30 + 1.6 * (t - 83.2);

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 24, roll: 0, ...c });
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
/** push-in factor since f0 (the subject grows ~rate per frame); `punch` raises it with 8 f soft edges for n frames */
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
/** truck along with a subject: the framing translates by (dx, 0, dz) */
const track = (s: Shot, dx: number, dz: number): Shot => ({ ...s, pos: [s.pos[0] + dx, s.pos[1], s.pos[2] + dz], look: [s.look[0] + dx, s.look[1], s.look[2] + dz] });

const CAMS: Record<number, Key[]> = {
  // 1: calm establishing of the Tuileries under the title card, then the quarrelling deputies
  1: [
    { f: 0, s: (f) => dolly([26, 7.5, 62], [0, 9, -30], pushK(f, 0, 0.0016), { fov: 26 }) },
    { f: 105, cut: true, s: (f) => dolly([0.6, 1.75, 13.5], [0, 1.4, 5.5], pushK(f, 105, 0.0025), { fov: 25, roll: -0.03 }) },
  ],
  // 2: Robespierre between two soldiers; then marched off (side, tracking with them)
  2: [
    { f: 144, s: (f) => dolly([1.2, 1.75, 11.5], [0, 1.4, 4], pushK(f, 144, 0.0028), { fov: 24 }) },
    { f: 221, cut: true, s: (f) => track(dolly([4.5, 1.8, 11.5], [1.0, 1.35, 4], pushK(f, 221, 0.0015), { fov: 26 }), 0.9 * (T(f) - 7.37), 0) },
  ],
  // 3: friends (Augustin + Napoleon) in a street; then the soldiers come for Napoleon
  3: [
    { f: 269, s: (f) => dolly([1.0, 1.75, 57], [0, 1.4, 48.5], pushK(f, 269, 0.0028), { fov: 24 }) },
    { f: 345, cut: true, s: (f) => dolly([-2.6, 1.8, 58.5], [0.2, 1.35, 48.5], pushK(f, 345, 0.0022, 0.006, 30), { fov: 26, roll: 0.03 }) },
  ],
  // 4: the cell: wide-ish, then pushing to his face on "career was over"
  4: [
    { f: 407, s: (f) => dolly([0.9, 1.55, 3.3], [-0.2, 0.95, -1.3], pushK(f, 407, 0.0022), { fov: 30 }) },
    { f: 497, dur: 30, s: (f) => dolly([0.1, 1.15, 0.9], [-0.35, 0.92, -1.3], pushK(f, 497, 0.0015), { fov: 28, roll: -0.03 }) },
  ],
  // 5: walking alone down the street, the camera trucks beside him
  5: [{ f: 549, s: (f) => { const z = walkZ(T(f)); return dolly([6.0, 1.9, z - 3], [0.6, 1.35, z - 0.6], pushK(f, 549, 0.0015), { fov: 26 }); } }],
  // 6: the garret, then a slow move up toward the dream
  6: [
    { f: 669, s: (f) => dolly([1.6, 1.65, 3.6], [0.2, 1.45, -0.6], pushK(f, 669, 0.002), { fov: 30 }) },
    { f: 750, dur: 34, s: (f) => dolly([1.0, 1.95, 3.0], [0.5, 1.95, -0.6], pushK(f, 750, 0.0018), { fov: 32 }) },
  ],
  // 7: October 1795: crane down over the square
  7: [
    { f: 809, s: (f) => dolly([-40, 20, 58], [0, 8, -30], pushK(f, 809, 0.0015), { fov: 27 }) },
    { f: 845, dur: 40, s: (f) => dolly([-24, 7, 42], [0, 7, -30], pushK(f, 845, 0.0018), { fov: 27, roll: 0.02 }) },
  ],
  // 8: the royalist column marches at the lens down the street
  8: [{ f: 924, s: (f) => { const F = royalFront(T(f)); return { pos: [2.6, 1.6, F - 9 - 0.0], look: [0, 1.6, F + 6], fov: 28 }; } }],
  // 9: Barras on the palace steps; cut to the two-shot when he remembers Napoleon
  9: [
    { f: 1040, s: (f) => dolly([1.6, 1.8, -10.5], [0, 1.45, -17.5], pushK(f, 1040, 0.0025), { fov: 24 }) },
    { f: 1147, cut: true, s: (f) => dolly([0.4, 1.8, -10], [0.1, 1.4, -17.5], pushK(f, 1147, 0.0022), { fov: 25 }) },
  ],
  // 10: Napoleon close, punch on "exactly"; cut to a gun on "cannons"
  10: [
    { f: 1224, s: (f) => dolly([1.5, 1.7, -14.2], [1.0, 1.55, -17.5], pushK(f, 1250, 0.002, 0.006, 35), { fov: 24 }) },
    { f: 1287, cut: true, s: (f) => dolly([9.6, 1.25, -1.6], [6.4, 1.05, -5.6], pushK(f, 1287, 0.0035), { fov: 30, roll: 0.04 }) },
  ],
  // 11: gallop: the lens trucks along with Murat; then the gun park
  11: [
    { f: 1316, s: (f) => { const x = muratX(T(f)); return { pos: [x + 1.0, 2.0, 12.5], look: [x + 0.4, 1.9, 0], fov: 25 }; } },
    { f: 1427, cut: true, s: (f) => dolly([PARK[0] + 9, 2.4, PARK[2] + 14], [PARK[0] + 1, 1.5, PARK[2]], pushK(f, 1427, 0.0022), { fov: 27 }) },
  ],
  // 12: Saint-Roch wide; the guns fire (cut + flash + kick); the royalists flee up the steps
  12: [
    { f: 1518, s: (f) => dolly([2.2, 4.5, 14], [0, 4.0, -6], pushK(f, 1518, 0.0035), { fov: 28 }) },
    { f: 1610, cut: true, s: (f) => dolly([-7.6, 1.55, 7.5], [0.5, 1.2, 3.0], pushK(f, 1610, 0.0025), { fov: 30 }) },
    { f: 1642, cut: true, s: (f) => dolly([2.5, 2.6, -16], [0, 2.4, STEPS_Z - 1], pushK(f, 1642, 0.0025), { fov: 28, roll: -0.03 }) },
  ],
  // 13: low through the drifting smoke past the guns toward the church
  13: [{ f: 1693, s: (f) => dolly([-5.5, 1.5, 12.5], [-1.6, 1.4, 4.2], pushK(f, 1693, 0.0028), { fov: 26 }) }],
  // 14: command of the army in Paris: Napoleon before the ranks, the lens rises as he raises his sabre
  14: [
    { f: 1771, s: (f) => dolly([1.5, 1.75, 1.5], [0, 1.5, -6], pushK(f, 1771, 0.0022), { fov: 26 }) },
    { f: 1826, dur: 30, s: (f) => dolly([2.5, 1.45, 3.5], [0, 1.85, -6], pushK(f, 1826, 0.002), { fov: 27, roll: 0.04 }) },
  ],
  // 15: the salon (wide), then Josephine close on "elegant widow"
  15: [
    { f: 1901, s: (f) => dolly([2.6, 1.75, 4.6], [0.2, 1.45, -1.8], pushK(f, 1901, 0.0022), { fov: 28 }) },
    { f: 1984, cut: true, s: (f) => dolly([-0.7, 1.68, 1.3], [-0.45, 1.55, -1.8], pushK(f, 1984, 0.002), { fov: 25 }) },
  ],
  // 16: Napoleon, smitten
  16: [{ f: 2061, s: (f) => dolly([1.65, 1.68, 1.6], [1.35, 1.6, -1.4], pushK(f, 2061, 0.0035), { fov: 25, roll: 0.03 }) }],
  // 17: the candle-lit wedding at the side table
  17: [{ f: 2101, s: (f) => dolly([-1.3, 1.7, 2.6], [-3.3, 1.35, -3.3], pushK(f, 2101, 0.0025), { fov: 27 }) }],
  // 18: Josephine waves, Napoleon rides off down the street
  18: [
    { f: 2170, s: (f) => dolly([4.0, 1.9, 21], [0, 1.6, 30], pushK(f, 2170, 0.0018), { fov: 27 }) },
    { f: 2215, dur: 40, s: (f) => { const z = Math.min(rideZ(T(f)), 70), d = Math.hypot(4, z - 22), k = 9 / d; return { pos: [4.0, 2.1, 22], look: [4.0 - 4.0 * k, 2.1 - 0.3 * k, 22 + (z - 22) * k], fov: 27 }; } },
  ],
  // 19: the ragged camp; boots (low); Napoleon at 26
  19: [
    { f: 2330, s: (f) => dolly([CAMP[0] + 5, 2.0, CAMP[2] + 11], [CAMP[0], 1.1, CAMP[2] + 1], pushK(f, 2330, 0.002), { fov: 28 }) },
    { f: 2399, cut: true, s: (f) => dolly([CAMP[0] - 1.0, 0.45, CAMP[2] + 7.6], [CAMP[0] - 1.6, 0.35, CAMP[2] + 4.6], pushK(f, 2399, 0.0028), { fov: 30, roll: -0.03 }) },
    { f: 2445, cut: true, s: (f) => dolly([CAMP[0] + 2.4, 1.72, CAMP[2] + 11.6], [CAMP[0] + 2.0, 1.55, CAMP[2] + 8.4], pushK(f, 2445, 0.0025, 0.005, 30), { fov: 25 }) },
  ],
  // 20: army after army: a column on the road, guns smoking on the far hill
  20: [{ f: 2497, s: (f) => { const x = marchX(T(f)); return dolly([x + 4, 3.2, 17], [x + 1, 2.4, -6], pushK(f, 2497, 0.0015), { fov: 30 }); } }],
  // 21: Lodi wide; the charge (side, tracking); the far end taken
  21: [
    { f: 2576, s: (f) => dolly([46, 15, -86], [0, 0, 6], pushK(f, 2576, 0.0016), { fov: 27 }) },
    { f: 2667, cut: true, s: (f) => { const z = chargeZ(T(f)) + 3.5; return { pos: [15, 3.6, z - 4], look: [0, 1.9, z], fov: 28 }; } },
    { f: 2755, cut: true, s: (f) => dolly([5.5, 2.6, BR_HALF + 10], [0, 2.0, BR_HALF - 3], pushK(f, 2755, 0.003), { fov: 30, roll: 0.03 }) },
  ],
  // 22: veterans by the fire at dusk, then closer on "little corporal"
  22: [
    { f: 2779, s: (f) => dolly([CAMP[0] - 4.5, 1.9, CAMP[2] + 9], [CAMP[0], 1.3, CAMP[2] + 0.5], pushK(f, 2779, 0.0022), { fov: 28 }) },
    { f: 2840, dur: 30, s: (f) => dolly([CAMP[0] - 2.4, 1.75, CAMP[2] + 6.5], [CAMP[0] + 0.3, 1.45, CAMP[2] + 0.5], pushK(f, 2840, 0.002), { fov: 27, roll: -0.03 }) },
  ],
  // 23: the hero in the square; then the whispering politicians (Napoleon soft behind them), slow push to the end
  23: [
    { f: 2882, s: (f) => dolly([5, 2.8, 17], [0, 1.6, 0], pushK(f, 2882, 0.0022), { fov: 27 }) },
    { f: 2943, cut: true, s: (f) => dolly([-0.4, 1.75, 16.5], [-1.6, 1.5, 10], pushK(f, 2943, 0.0012), { fov: 25 }) },
    { f: 2990, dur: 40, s: (f) => dolly([-1.3, 1.7, 15.2], [-1.9, 1.5, 10], pushK(f, 2990, 0.0015), { fov: 24, roll: -0.04 }) },
  ],
};

/** impact kicks: the guns of Saint-Roch, the Lodi guns */
const KICKS: [number, number][] = [[1610 / FPS, 1.6], [1627 / FPS, 0.6], [2700 / FPS, 0.5], [2730 / FPS, 0.4]];
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
  const Ln = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * Ln * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** every camera cut inside a shot (shots.json "planned") */
export const CUTS = Object.values(CAMS).flatMap((ks) => ks.filter((k) => k.cut).map((k) => k.f));

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },                                   // establishing
  { f: 105, cInf: 11, focus: () => [0, 1.6, 5.5] },    // deputies MS
  { f: 144, cInf: 11, focus: () => [0, 1.6, 4] },      // Robespierre MS
  { f: 221, cInf: 6 },                                 // marched off
  { f: 269, cInf: 11, focus: () => [0, 1.6, 48.5] },   // friends MS
  { f: 345, cInf: 8, focus: () => [0, 1.6, 48.5] },
  { f: 407, cInf: 6 },                                 // cell
  { f: 497, dur: 30, cInf: 12 },                       // cell close
  { f: 549, cInf: 5 },                                 // walking
  { f: 669, cInf: 6, focus: () => [-0.1, 1.6, -0.6] }, // attic
  { f: 813, cInf: 0 },                                 // palace wide
  { f: 924, cInf: 0 },                                 // royalist column
  { f: 1040, cInf: 11, focus: () => [0, 1.6, -17.5] }, // Barras
  { f: 1147, cInf: 10, focus: () => [0, 1.6, -17.5] },
  { f: 1224, cInf: 13, focus: () => [1.0, 1.6, -17.5] }, // Napoleon close
  { f: 1287, cInf: 12 },                               // cannon insert (focus = look)
  { f: 1316, cInf: 6 },                                // gallop
  { f: 1427, cInf: 0 },                                // gun park
  { f: 1518, cInf: 0 },                                // Saint-Roch wide
  { f: 1610, cInf: 6 },                                // guns fire
  { f: 1642, cInf: 0 },                                // royalists flee
  { f: 1693, cInf: 8 },                                // smoke
  { f: 1771, cInf: 10, focus: () => [0, 1.6, -6] },    // command
  { f: 1905, cInf: 8, focus: () => [0, 1.6, -1.8] },   // salon
  { f: 1984, cInf: 13, focus: () => [-0.45, 1.6, -1.8] }, // Josephine close
  { f: 2061, cInf: 13, focus: () => [1.35, 1.6, -1.4] }, // Napoleon smitten
  { f: 2101, cInf: 9, focus: () => [-3.3, 1.55, -2.7] }, // wedding
  { f: 2174, cInf: 0 },                                // riding off
  { f: 2334, cInf: 0 },                                // camp
  { f: 2399, cInf: 12 },                               // boots
  { f: 2445, cInf: 13, focus: () => [CAMP[0] + 2.0, 1.6, CAMP[2] + 8.4] }, // Napoleon at 26
  { f: 2497, cInf: 0 },                                // marching
  { f: 2576, cInf: 0 },                                // Lodi
  { f: 2783, cInf: 7, focus: () => [CAMP[0], 1.5, CAMP[2] + 0.5] }, // camp fire
  { f: 2886, cInf: 0 },                                // hero's return
  { f: 2943, cInf: 12, focus: () => [-1.7, 1.6, 10] }, // whispering politicians
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
