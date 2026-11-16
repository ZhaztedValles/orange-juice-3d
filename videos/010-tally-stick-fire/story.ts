// Timeline of "In 1834 Two Workmen Burned Down Parliament by Throwing Out Old Receipts": shots timed to words.json.
// Places on one big ground: the old Palace of Westminster on the west bank of the river (a riverside row of halls and
// towers, the great medieval hall behind, the cobbled yard with the chequered treasury table, the carts and the pub)
// and the bridge across the river; then, far off on the east side, four open-topped rooms: the cellar with the two
// furnaces, the Lords chamber with its tapestry, the corridor at the Lords' door, and a garden table for the toaster
// analogy. Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big
// reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2045;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the river runs along z between these x (the palace on the west bank, x < RIVER_X0) */
export const RIVER_X0 = 30, RIVER_X1 = 130, WATER_Y = D0 - 1.4;
/** the bridge: across the river at z BR_Z0..BR_Z1, deck top at BR_Y */
export const BR_Z0 = 64, BR_Z1 = 76, BR_Y = D0 + 0.6;
/** the palace's riverside row (house centres, x = PAL_X) and the second row behind it */
export const PAL_X = 18, PAL2_X = 5;
export const PAL_Z = [-50, -36, -22, -8, 6, 20];
export const PAL2_Z = [-44, -30, -16, -2, 12];
/** the great medieval hall, south of the yard (x0, x1, z0, z1) */
export const HALL = [-34, 4, -74, -60] as const;
/** the yard: the chequered table, the two carts of sticks, the pub across the yard */
export const TABLE: V3 = [-14, D0 + 0.08, 0];
export const CART1: V3 = [-24, D0 + 0.08, 16], CART2: V3 = [-22.4, D0 + 0.08, 18.6];
export const PUB: V3 = [-46, D0, 22];
/** the rooms (centre of the floor) */
export const CELLAR: V3 = [400, D0, 0];
export const FURN_X = [-2, 2]; // the two furnaces on the cellar's back wall (local x)
export const CHAMBER: V3 = [500, D0, 0];
export const CORRIDOR: V3 = [560, D0, 0];
export const GARDEN: V3 = [640, D0, 0];

// story beats (seconds on the voice clock)
export const T_BURNED = 2.25; // "burned down"
export const T_THROW = 4.04; // "throwing out"
export const T_TALLY = 7.85; // "tally sticks"
export const T_SPLIT = 10.12; // "split in two."
export const T_HALF = 12.43; // "half,"
export const T_MATCH = 13.97; // "match,"
export const T_PAPER = 15.93; // "paper"
export const T_CARTLOADS = 16.91; // "cartloads"
export const T_WAY = 18.15; // "way."
export const T_BURNED2 = 20.11; // "had them burned"
export const T_JOSHUA = 24.6; // "Joshua Cross"
export const T_PATRICK = 25.48; // "Patrick Furlong"
export const T_FED = 26.32; // "fed them in"
export const T_HOT = 30.15; // "hot"
export const T_SHUT = 32.99; // "shut"
export const T_PUB = 34.33; // "pub,"
export const T_FLAMES = 37.09; // "flames"
export const T_COAL = 40.81; // "coal,"
export const T_WOOD = 42.77; // "wood"
export const T_TALL = 43.9; // "tall."
export const T_STUFF = 45.1; // "stuffing"
export const T_FLAMES2 = 47.01; // "flames shoot"
export const T_RACED = 49.67; // "raced"
export const T_CAUGHT = 51.81; // "caught,"
export const T_FIREBALL = 54.17; // "fireball"
export const T_CROWDS = 55.44; // "crowds"
export const T_HALL = 59.38; // "hall"
export const T_CENT = 60.75; // "Centuries"
export const T_BILL = 63.31; // "bill"
export const T_PARL = 64.47; // "Parliament."

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "ext" | "yard" | "cellar" | "chamber" | "corridor" | "garden";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 168, "ext", "golden"), mk(2, 168, 330, "yard"), mk(3, 330, 475, "yard"), mk(4, 475, 565, "yard"),
  mk(5, 565, 690, "cellar"), mk(6, 690, 837, "cellar"), mk(7, 837, 943, "chamber"), mk(8, 943, 1048, "yard", "golden"),
  mk(9, 1048, 1165, "corridor", "golden"), mk(10, 1165, 1337, "cellar"), mk(11, 1337, 1470, "garden"),
  mk(12, 1470, 1579, "chamber", "golden"), mk(13, 1579, 1720, "ext", "golden"), mk(14, 1720, 1819, "ext"),
  mk(15, 1819, TOTAL, "yard"),
];
/** the palace stands whole until the fire, then the ruin (shots 14-15) */
export const ruined = (id: number) => id >= 14;
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 5: 8, 7: 8, 9: 8, 10: 8, 11: 8, 12: 8, 14: 10 };
export const FLASH_AT = 168;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the walk to the pub (shot 8) ----------------
export const WALK0: V3 = [-33.5, D0 + 0.08, 12.5], WALK1: V3 = [-39.6, D0 + 0.08, 20.6];
export const walkAt = (t: number, lag = 0): V3 => {
  const u = clamp01((t - 31.3 - lag) / 3.6);
  return [WALK0[0] + (WALK1[0] - WALK0[0]) * u, WALK0[1], WALK0[2] + (WALK1[2] - WALK0[2]) * u];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const Y = D0;
const C = CELLAR, H = CHAMBER, K = CORRIDOR, G = GARDEN;
const fr = (t: number) => Math.round(t * FPS);
// shot 1 (hook, golden): across the river, the palace in flames; a punch-in on "burned down"
const S1a = (f: number) => dolly([84, Y + 3.2, 20], [16, Y + 10, -14], pushK(f, 0, 0.0016, 0.004, 30), { fov: 44, roll: 0.03 });
const S1b = (f: number) => dolly([66, Y + 2.6, 12], [16, Y + 11, -16], pushK(f, 100, 0.0022), { fov: 42, roll: 0.03 });
// shot 2: the treasury table in the yard: the clerk holds up a tally stick and splits it
const S2a = (f: number) => dolly([TABLE[0] + 0.2, Y + 1.95, 4.6], [TABLE[0], Y + 1.35, -0.6], pushK(f, 168, 0.0022), { fov: 42, roll: -0.03 });
// shot 3: close on the two halves; they come back together
const S3a = (f: number) => dolly([TABLE[0], Y + 1.8, 3.2], [TABLE[0], Y + 1.5, -0.8], pushK(f, 330, 0.0024, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 4: the two carts piled with sticks
const S4a = (f: number) => dolly([-16.6, Y + 2.1, 6.4], [-21.8, Y + 1.4, 15.6], pushK(f, 475, 0.0022), { fov: 44, roll: -0.03 });
// shot 5: the cellar: the clerk of works points at the furnaces
const S5a = (f: number) => dolly([C[0] + 0.4, Y + 2.1, 8.8], [C[0] - 0.2, Y + 1.5, -2.0], pushK(f, 565, 0.0022, 0.005, 30), { fov: 50, roll: 0.03 });
// shot 6: close on Cross at the left furnace, glide to Furlong
const S6a = (f: number) => dolly([C[0] - 2.4, Y + 1.65, 0.9], [C[0] - 3.1, Y + 1.35, -2.4], pushK(f, 690, 0.0026), { fov: 40, roll: -0.03 });
const S6b = (f: number) => dolly([C[0] + 0.1, Y + 1.7, 1.4], [C[0] - 0.6, Y + 1.3, -2.3], pushK(f, 759, 0.0024), { fov: 42, roll: -0.03 });
// shot 7: the Lords chamber: two visitors at the tapestry, the floor hot under them
const S7a = (f: number) => dolly([H[0] + 0.2, Y + 1.85, 6.4], [H[0], Y + 1.6, -1.0], pushK(f, 837, 0.0024, 0.006, 30), { fov: 46, roll: 0.03 });
// shot 8 (golden): the yard: the workmen walk off to the pub
const S8a = (f: number) => dolly([-31.6, Y + 1.7, 23.6], [-38.2, Y + 1.2, 17.6], pushK(f, 943, 0.002), { fov: 44, roll: -0.03 });
// shot 9 (golden): the corridor: the doorkeeper's wife sees flames under the Lords' door
const S9a = (f: number) => dolly([K[0] + 0.9, Y + 1.7, 5.4], [K[0] + 0.4, Y + 1.3, -2.5], pushK(f, 1048, 0.0024, 0.006, 30), { fov: 46, roll: 0.03 });
// shot 10: close on the furnace: coal glows low, dry wood burns tall
const S10a = (f: number) => dolly([C[0] + FURN_X[0] + 0.3, Y + 1.5, 2.2], [C[0] + FURN_X[0], Y + 1.45, -3.2], pushK(f, 1165, 0.0022, 0.005, 30), { fov: 46, roll: -0.03 });
// shot 11: the garden table: a toaster stuffed with newspaper
const S11a = (f: number) => dolly([G[0] + 0.25, Y + 1.25, 3.0], [G[0] + 0.2, Y + 0.9, 0], pushK(f, 1337, 0.0024, 0.006, 30), { fov: 42, roll: 0.03 });
// shot 12 (golden): the chamber wall: hot gas races up, the panelling catches
const S12a = (f: number) => dolly([H[0] - 0.6, Y + 1.9, 3.2], [H[0] - 1.4, Y + 2.6, -5.8], pushK(f, 1470, 0.0024, 0.005, 30), { fov: 48, roll: 0.03 });
// shot 13 (golden): the fireball over the river; then the crowd on the bridge, lit by the fire
const S13a = (f: number) => dolly([124, Y + 7, 44], [16, Y + 11, -14], pushK(f, 1579, 0.0018, 0.005, 30), { fov: 46, roll: -0.03 });
const S13b = (f: number) => dolly([54, BR_Y + 1.9, 65.2], [63, BR_Y + 1.05, 72], pushK(f, fr(T_CROWDS) - 3, 0.0022), { fov: 44, roll: 0.03 });
// shot 14: next morning: the smoking ruin, then a glide to the great hall, still standing
const S14a = (f: number) => dolly([112, Y + 7, 42], [10, Y + 6, -26], pushK(f, 1720, 0.0018), { fov: 46 });
const S14b = (f: number) => dolly([46, Y + 6, -22], [-14, Y + 8, -64], pushK(f, 1777, 0.002), { fov: 46, roll: -0.03 });
// shot 15: in the yard before the ruin: the clerk of works unrolls the bill; then the wide
const S15a = (f: number) => dolly([-17.4, Y + 1.6, 0.8], [-10.8, Y + 1.12, 0], pushK(f, 1819, 0.0022, 0.005, 30), { fov: 40, roll: 0.03 });
const S15b = (f: number) => dolly([-24, Y + 2.6, 4.6], [-6, Y + 2.6, -3], pushK(f, 1950, 0.0016), { fov: 46, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 100, dur: 36, s: S1b }],
  2: [{ f: 168, s: S2a }],
  3: [{ f: 330, s: S3a }],
  4: [{ f: 475, s: S4a }],
  5: [{ f: 565, s: S5a }],
  6: [{ f: 690, s: S6a }, { f: 759, dur: 30, s: S6b }],
  7: [{ f: 837, s: S7a }],
  8: [{ f: 943, s: S8a }],
  9: [{ f: 1048, s: S9a }],
  10: [{ f: 1165, s: S10a }],
  11: [{ f: 1337, s: S11a }],
  12: [{ f: 1470, s: S12a }],
  13: [{ f: 1579, s: S13a }, { f: 1660, cut: true, s: S13b }],
  14: [{ f: 1720, s: S14a }, { f: 1777, dur: 36, s: S14b }],
  15: [{ f: 1819, s: S15a }, { f: 1950, dur: 40, s: S15b }],
};

// impact kicks: [seconds, strength]: "burned down", the hot floor, the flames under the door, the toaster, the fireball
const KICKS: [number, number][] = [[T_BURNED - 2 / 30, 0.4], [T_HOT - 2 / 30, 0.35], [T_FLAMES - 2 / 30, 0.4], [T_FLAMES2 - 2 / 30, 0.45], [T_FIREBALL - 2 / 30, 0.7]];
export const KICK_FRAMES = KICKS.map(([t]) => Math.floor(t * FPS + 1e-6));
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const Ln = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * Ln * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const at = (p: V3) => () => p;
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 168, cInf: 11, focus: at([TABLE[0], Y + 1.5, -0.8]) },
  { f: 330, cInf: 14, focus: at([TABLE[0], Y + 1.3, -0.3]) },
  { f: 475, cInf: 0 },
  { f: 565, cInf: 10, focus: at([C[0] - 1.6, Y + 1.5, 0.2]) },
  { f: 690, cInf: 13, focus: at([C[0] - 3.1, Y + 1.5, -2.4]) },
  { f: 759, dur: 30, cInf: 12, focus: at([C[0] - 0.8, Y + 1.5, -2.2]) },
  { f: 837, cInf: 11, focus: at([H[0], Y + 1.5, 0.5]) },
  { f: 943, cInf: 0 },
  { f: 1048, cInf: 11, focus: at([K[0] + 1.0, Y + 1.5, -0.3]) },
  { f: 1165, cInf: 12, focus: at([C[0] + FURN_X[0], Y + 1.0, -3.1]) },
  { f: 1337, cInf: 13, focus: at([G[0], Y + 1.0, 0]) },
  { f: 1470, cInf: 0 },
  { f: 1660, cInf: 10, focus: at([62, BR_Y + 1.5, 69.5]) },
  { f: 1720, cInf: 0 },
  { f: 1819, cInf: 12, focus: at([-10.8, Y + 1.5, 0]) },
  { f: 1950, dur: 30, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  const pf = p.focus, df = d.focus ?? pf, e = glide(k);
  const focus = pf && df && k < 1 ? (g: number): V3 => { const a = pf(g), b = df(g); return a.map((v, j) => v + (b[j] - v) * e) as V3; } : d.focus;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus };
};

/** near framing objects: Kenney models just in front of the lens for a few shots */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 943, b: 1048, kit: "lantern", pos: [-28.6, D0 + 0.08, 19.6], s: 3.0 },
  { a: 1337, b: 1470, kit: "plant_bushDetailed", pos: [G[0] + 1.7, D0, 1.5], s: 0.9 },
  { a: 1579, b: 1720, kit: "lantern", pos: [56.4, BR_Y, 66.2], s: 2.6 },
];
