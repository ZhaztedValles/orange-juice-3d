// Timeline of "In 1872 Two Cousins Sold America's Richest Bankers a Diamond Field They Sprinkled by Hand": shots timed to
// words.json. Four places on one big ground: the salted field on the high desert (sand, sage, anthills, the striped
// mesas behind), a banker's office in San Francisco (an open-topped room: plank floor, panelled walls, the desk), a San
// Francisco street with the bank, and a green patch with one small bush for the fruit analogy. Camera grammar of the
// bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2085;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the salted field: the dug patches round the origin, the anthills just west of it */
export const FIELD: V3 = [0, D0, 0];
export const ANTS: V3 = [-2.6, D0, -4.2];
/** the banker's office (open-topped room), the desk centre */
export const OFFICE: V3 = [220, D0, 0];
export const DESK: V3 = [220, D0, -1.2];
/** the San Francisco street: the bank's front door */
export const BANK: V3 = [-220, D0, 0];
/** the green patch of the fruit analogy: the bush */
export const BUSH: V3 = [0, D0, 240];
/** the signpost of the payoff */
export const SIGN: V3 = [4.6, D0, 1.2];
/** the dug patches of the salted acre (x, z, radius) */
export const DIGS: [number, number, number][] = [[0.6, 0.4, 0.55], [-1.2, -0.8, 0.45], [1.9, -1.4, 0.5], [-0.4, -2.4, 0.4], [2.8, 0.9, 0.42], [-2.0, 1.9, 0.38]];

// story beats (seconds on the voice clock)
export const T_BOUGHT = 3.85; // "bought"
export const T_SPRINKLED = 5.6; // "sprinkled"
export const T_COUSINS = 7.35; // "cousins,"
export const T_DIAMONDS = 11.32; // "diamonds,"
export const T_NOT = 12.4; // "not"
export const T_WANTED = 15.07; // "wanted"
export const T_TIFFANY = 16.02; // "Tiffany"
export const T_HUNDRED = 17.16; // "hundred"
export const T_JANIN = 20.1; // "Henry Janin"
export const T_EYES = 22.94; // "eyes"
export const T_PICKING = 26.05; // "picking"
export const T_REAL = 28.94; // "real,"
export const T_GOT = 30.18; // "got"
export const T_MILLION = 30.8; // "million"
export const T_KING = 33.08; // "Clarence King"
export const T_DUG = 37.79; // "dug,"
export const T_ANTHILLS = 38.76; // "anthills,"
export const T_RUBY = 39.64; // "ruby"
export const T_HOLE = 41.1; // "hole."
export const T_SEE = 41.84; // "You see,"
export const T_DIA2 = 42.61; // "diamonds"
export const T_RUBIES2 = 43.23; // "rubies"
export const T_NEVER = 45.88; // "never"
export const T_APPLE = 49.17; // "apple,"
export const T_BANANA = 49.9; // "banana"
export const T_COCONUT = 50.55; // "coconut"
export const T_SOMEONE = 52.56; // "someone"
export const T_CHEAP = 54.81; // "cheap"
export const T_THROWN = 57.81; // "thrown"
export const T_FRAUD = 60.1; // "fraud,"
export const T_SHUT = 61.41; // "shut"
export const T_MAPS = 62.55; // "maps"
export const T_DFIELD = 63.54; // "Diamond Field,"
export const T_NOT2 = 65.12; // "not"

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "field" | "office" | "street" | "bush";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 208, "field"), mk(2, 208, 420, "office"), mk(3, 420, 478, "street"), mk(4, 478, 578, "office"),
  mk(5, 578, 752, "field"), mk(6, 752, 958, "field"), mk(7, 958, 1078, "field"), mk(8, 1078, 1252, "field"),
  mk(9, 1252, 1440, "field"), mk(10, 1440, 1612, "bush"), mk(11, 1612, 1772, "field"), mk(12, 1772, 1880, "office"),
  mk(13, 1880, TOTAL, "field"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 5: 8, 7: 8, 10: 8, 11: 8, 12: 8, 13: 10 };
export const FLASH_AT = 208;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the walks ----------------
/** shot 5: the cousins lead the blindfolded engineer across the flat toward the lens (x, z at time t) */
export const leadAt = (t: number, lag = 0): V3 => {
  const u = clamp01((t - 19.0 - lag) / 6.2);
  return [-7 + 4.6 * u, D0, -9 + 9.4 * u];
};
/** shot 7: King walks in from the far side of the field */
export const kingAt = (t: number): V3 => {
  const u = clamp01((t - 31.6) / 4.4);
  return [-3 + 3.2 * u, D0, -13 + 12.4 * u];
};
/** shot 11: the cousins walk the acre at dusk, throwing stones */
export const salterAt = (t: number, k: number): V3 => {
  const u = clamp01((t - 53.4) / 5.8);
  return [-5 + 7 * u + 0.4 * k, D0, -3.5 + 1.6 * k + 0.6 * u];
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
const O = OFFICE, B = BANK, U = BUSH, A = ANTS;
const fr = (t: number) => Math.round(t * FPS);
// shot 1 (hook, golden): the bankers knelt in the salted field; then the cousins behind them, sprinkling
const S1a = (f: number) => dolly([1.2, Y + 2.2, 8.6], [0.3, Y + 0.9, -0.6], pushK(f, 0, 0.0018, 0.004, 30), { fov: 44, roll: 0.03 });
const S1b = (f: number) => dolly([-3.6, Y + 1.7, 4.2], [-5.4, Y + 1.2, -2.6], pushK(f, 160, 0.0026, 0.006, 30), { fov: 42, roll: -0.03 });
// shot 2: the office: the banker at his desk, the two cousins and their bag; a glide in on the cousins' secret
const S2a = (f: number) => dolly([O[0] + 0.4, Y + 1.9, 5.6], [O[0], Y + 1.25, -1.0], pushK(f, 208, 0.0022), { fov: 44, roll: -0.03 });
const S2b = (f: number) => dolly([O[0] + 0.9, Y + 1.7, 3.4], [O[0] + 0.6, Y + 1.45, -0.3], pushK(f, 360, 0.0026, 0.006, 30), { fov: 40, roll: -0.03 });
// shot 3: the street: bankers in top hats crowd the bank's door
const S3a = (f: number) => dolly([B[0] + 1.2, Y + 2.2, 10.5], [B[0], Y + 3.0, 0], pushK(f, 420, 0.003, 0.006, 30), { fov: 46, roll: 0.03 });
// shot 4: the jeweller's desk: Tiffany with his loupe, the price
const S4a = (f: number) => dolly([O[0] - 1.6, Y + 1.7, 2.6], [O[0] - 2.3, Y + 1.35, -1.0], pushK(f, 478, 0.0026, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 5: the high desert: the blindfolded engineer led across the flat, the mesas behind
const S5a = (f: number) => dolly([-1.5, Y + 1.6, 6.5], [-5.5, Y + 1.6, -12], pushK(f, 578, 0.0018), { fov: 46, roll: -0.03 });
// shot 6: kneeling at the dug patches: the gems out of the dirt; then the cousins with the money
const S6a = (f: number) => dolly([0.6, Y + 1.6, 4.6], [0.4, Y + 0.7, -0.4], pushK(f, 752, 0.0022, 0.005, 30), { fov: 44, roll: 0.03 });
const S6b = (f: number) => dolly([-2.3, Y + 1.7, 3.6], [-3.6, Y + 1.35, 0.0], pushK(f, 888, 0.0026, 0.006, 30), { fov: 42, roll: 0.03 });
// shot 7: wide: King walks in across the field with his tripod
const S7a = (f: number) => dolly([0.2, Y + 2.0, 9.5], [-0.8, Y + 1.5, -6], pushK(f, 958, 0.0018), { fov: 46, roll: 0.03 });
// shot 8: King at the dug patches; then low on the anthill with its ruby
const S8a = (f: number) => dolly([0.2, Y + 1.8, 5.0], [-0.6, Y + 0.9, -0.4], pushK(f, 1078, 0.0024, 0.006, 30), { fov: 44, roll: -0.03 });
const S8b = (f: number) => dolly([A[0] + 0.5, Y + 0.75, A[2] + 2.3], [A[0], Y + 0.35, A[2]], pushK(f, 1160, 0.0028, 0.007, 30), { fov: 40, roll: -0.04 });
// shot 9: the pivot: King at his easel, the two rocks
const S9a = (f: number) => dolly([1.4, Y + 1.7, 5.4], [2.0, Y + 1.45, -1.5], pushK(f, 1252, 0.0024, 0.006, 30), { fov: 42, roll: 0.03 });
// shot 10: the green patch: a kid at one small bush with an apple, a banana and a coconut; the second kid with the basket
const S10a = (f: number) => dolly([U[0] + 0.1, Y + 1.4, U[2] + 5.4], [U[0] + 0.05, Y + 0.6, U[2]], pushK(f, 1440, 0.0024, 0.006, 30), { fov: 42, roll: -0.03 });
const S10b = (f: number) => dolly([U[0] + 1.6, Y + 1.4, U[2] + 4.0], [U[0] + 1.2, Y + 0.95, U[2] - 0.6], pushK(f, fr(T_SOMEONE) - 3, 0.0026), { fov: 42, roll: -0.03 });
// shot 11 (golden): dusk: the cousins walk the acre, throwing stones from their bags
const S11a = (f: number) => dolly([2.5, Y + 1.7, 5.0], [-0.5, Y + 1.2, -2.6], pushK(f, 1612, 0.002), { fov: 44, roll: 0.03 });
// shot 12: the office: the bankers read King's letter, FRAUD
const S12a = (f: number) => dolly([O[0] + 0.2, Y + 1.8, 3.6], [O[0], Y + 1.4, -0.9], pushK(f, 1772, 0.0026, 0.006, 30), { fov: 42, roll: 0.03 });
// shot 13: the payoff: the empty field and its sign; a slow rise to the wide of the mesas
const S13a = (f: number) => dolly([SIGN[0] + 0.6, Y + 1.6, SIGN[2] + 5.2], [SIGN[0], Y + 1.4, SIGN[2]], pushK(f, 1880, 0.0024, 0.005, 30), { fov: 42, roll: -0.03 });
const S13b = (f: number) => dolly([SIGN[0] + 1.5, Y + 3.2, SIGN[2] + 11], [SIGN[0] - 1, Y + 2.2, SIGN[2] - 25], pushK(f, 1975, 0.0016), { fov: 46, roll: 0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 160, cut: true, s: S1b }],
  2: [{ f: 208, s: S2a }, { f: 360, dur: 30, s: S2b }],
  3: [{ f: 420, s: S3a }],
  4: [{ f: 478, s: S4a }],
  5: [{ f: 578, s: S5a }],
  6: [{ f: 752, s: S6a }, { f: 888, dur: 30, s: S6b }],
  7: [{ f: 958, s: S7a }],
  8: [{ f: 1078, s: S8a }, { f: 1160, cut: true, s: S8b }],
  9: [{ f: 1252, s: S9a }],
  10: [{ f: 1440, s: S10a }, { f: fr(T_SOMEONE) - 3, dur: 30, s: S10b }],
  11: [{ f: 1612, s: S11a }],
  12: [{ f: 1772, s: S12a }],
  13: [{ f: 1880, s: S13a }, { f: 1975, dur: 40, s: S13b }],
};

// impact kicks: [seconds, strength]: the ruby at the bottom of the hole, the word fraud
const KICKS: [number, number][] = [[T_HOLE - 2 / 30, 0.45], [T_FRAUD - 2 / 30, 0.6]];
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
  { f: 0, cInf: 5, focus: at([0.3, Y + 1.0, -0.6]) },
  { f: 160, cInf: 12, focus: at([-5.4, Y + 1.5, -2.6]) },
  { f: 208, cInf: 10, focus: at([O[0], Y + 1.5, -0.3]) },
  { f: 360, dur: 30, cInf: 13, focus: at([O[0] + 0.85, Y + 1.5, -0.2]) },
  { f: 420, cInf: 0 },
  { f: 478, cInf: 13, focus: at([O[0] - 2.3, Y + 1.5, -1.0]) },
  { f: 578, cInf: 0 },
  { f: 752, cInf: 11, focus: at([0.4, Y + 1.0, -0.4]) },
  { f: 888, dur: 30, cInf: 12, focus: at([-3.6, Y + 1.5, 0.0]) },
  { f: 958, cInf: 0 },
  { f: 1078, cInf: 11, focus: at([-0.6, Y + 1.2, -0.4]) },
  { f: 1160, cInf: 15, focus: at([A[0], Y + 0.35, A[2]]) },
  { f: 1252, cInf: 10, focus: at([2.2, Y + 1.5, -1.5]) },
  { f: 1440, cInf: 13, focus: at([U[0], Y + 0.8, U[2]]) },
  { f: 1612, cInf: 5, focus: at([-0.5, Y + 1.4, -2.2]) },
  { f: 1772, cInf: 12, focus: at([O[0], Y + 1.5, -0.9]) },
  { f: 1880, cInf: 10, focus: at([SIGN[0], Y + 1.5, SIGN[2]]) },
  { f: 1975, dur: 30, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  // the focus point glides with the blur (an instant focus jump at a blurred key reads as a pop)
  const pf = p.focus, df = d.focus ?? pf, e = glide(k);
  const focus = pf && df && k < 1 ? (g: number): V3 => { const a = pf(g), b = df(g); return a.map((v, j) => v + (b[j] - v) * e) as V3; } : d.focus;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus };
};

/** near framing objects: Kenney models just in front of the lens for a few shots */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 420, b: 478, kit: "cart", pos: [B[0] + 4.2, D0 + 0.08, 5.4], s: 1.6, yaw: 0.6 },
  { a: 578, b: 752, kit: "plant_bush", pos: [1.6, D0, 3.0], s: 0.9 },
  { a: 1880, b: 2085, kit: "plant_bush", pos: [SIGN[0] - 1.6, D0, SIGN[2] + 2.6], s: 0.8 },
];
