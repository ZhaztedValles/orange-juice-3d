// Timeline of "The Last 25 Minutes of the First Flight Ever": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): the royal garden of La Muette at the origin (a lawn,
// the chateau at z = -60, trees all round, the crowd), Paris to the east (a grid of houses round x = 430, the Seine
// running along x at z = 120..150) and the landing field with its two windmills at x = -400. The balloon (gallery
// floor = its local origin, the envelope above, the straw brazier hung in the open neck) is posed per shot by
// balloonAt. Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big
// reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1935;
export const D0 = 1.2; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the launch spot on the lawn, Paris centre, the river band (z), the landing field */
/** the launch platform height on the lawn */
export const PLAT = 0.35;
export const LAUNCH: V3 = [0, D0 + PLAT, 0];
export const PAR: V3 = [430, D0, 40];
export const RIV0 = 120, RIV1 = 150;
export const FIELD: V3 = [-400, D0, 0];
/** the balloon (local, gallery floor at y = 0): neck radius, gallery outer radius, rail height, envelope crown */
export const RN = 2.3, RG = 3.3, RAIL = 1.0, NECK0 = 1.9, CROWN = 22;
/** the envelope radius at local height y (neck tube, flare, round top) */
export const envR = (y: number) => {
  if (y <= 2.6) return RN + 0.1 * clamp01((y - NECK0) / 0.7);
  if (y <= 12) return 2.4 + 4.6 * Math.sin((Math.PI / 2) * ((y - 2.6) / 9.4));
  return 7.0 * Math.sqrt(Math.max(0, 1 - ((y - 12) / (CROWN - 12)) ** 2));
};
/** a point on the envelope surface at local height y and angle th (0 = +z, toward +x), pushed out by d */
export const envPt = (y: number, th: number, d = 0.12): V3 => { const r = envR(y) + d; return [r * Math.sin(th), y, r * Math.cos(th)]; };
/** where the two men stand on the gallery (local): the marquis on the +z side, Pilatre opposite (they cannot see each other) */
export const MARQ: V3 = [0.3, 0.06, 2.8], PIL: V3 = [-0.3, 0.06, -2.8];

// story beats (seconds on the voice clock)
export const T_FIRES = 3.56, T_PARIS = 5.34, T_GARDEN = 8.32, T_STEP = 10.68, T_BALLOON = 11.93, T_BLUE = 12.51;
export const T_FIRE = 14.49, T_KING = 15.9, T_WATCH = 16.31, T_FRANKLIN = 17.29;
export const T_25 = 18.66, T_ROPES = 20.4, T_UP = 21.31, T_TREES = 22.07;
export const T_20 = 22.89, T_MARQUIS = 24.77, T_LOOKING = 25.85, T_FORGETS = 26.82, T_SINK = 27.93;
export const T_PILATRE = 28.71, T_SHOUTS = 29.14, T_RIVER = 30.45, T_BATHING = 31.45;
export const T_15 = 32.29, T_THREE = 33.86, T_SPARKS = 34.83, T_BURN = 35.75, T_HOLES = 36.42;
export const T_10 = 37.54, T_STICKS = 39.3, T_SPONGE = 39.88, T_FORK = 40.4, T_DABS = 41.05, T_ONE = 42.12, T_BY = 42.35, T_ONE2 = 42.56;
export const T_STOPS = 44.01, T_DROP = 45.33, T_ROOFS = 45.95;
export const T_5 = 46.7, T_SEINE = 49.11, T_SPOTS = 50.02, T_SPREAD = 50.65;
export const T_LETS = 51.75, T_DIE = 52.5, T_ZERO = 53.23;
export const T_BUMP = 54.23, T_WINDMILLS = 55.91, T_BURNT = 56.66, T_ALIVE = 57.15;
export const T_FIRST = 58.26, T_FLIGHT = 59.95, T_POP = 61.14, T_CHAMP = 61.54;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "garden" | "air" | "paris" | "field";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 158, "air"), mk(2, 158, 232, "paris"), mk(3, 232, 411, "garden"), mk(4, 411, 471, "garden"),
  mk(5, 471, 555, "garden"), mk(6, 555, 684, "garden"), mk(7, 684, 852, "air"), mk(8, 852, 963, "air"),
  mk(9, 963, 1040, "air"), mk(10, 1040, 1122, "air"), mk(11, 1122, 1290, "air"), mk(12, 1290, 1395, "air"),
  mk(13, 1395, 1536, "air"), mk(14, 1536, 1611, "air"), mk(15, 1611, 1734, "field"), mk(16, 1734, TOTAL, "field"),
];
/** crossfades (frames) at place / time changes: the landing (15) */
export const XFADE: Record<number, number> = { 15: 10 };
export const FLASH_AT = 158;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fr = (t: number) => Math.round(t * FPS);

// ---------------- the story physics ----------------
const [PX0, , PZ0] = PAR, [FX0, , FZ0] = FIELD;
/** the balloon's gallery floor in world space per shot; null = not in the shot */
export const balloonAt = (id: number, t: number): V3 | null => {
  switch (id) {
    case 1: return [PX0 - 60 + 0.4 * t, 95, PZ0 - 40];
    case 2: return null;
    case 3: case 4: case 5: return LAUNCH;
    case 6: { const u = Math.max(0, t - T_UP + 0.15); return [0.3 * u * u, LAUNCH[1] + 4.0 * u * u + 2.0 * u, 0]; }
    case 7: return [PX0 - 70 + 0.4 * (t - 22), 92 - 2.4 * smooth((t - T_SINK + 0.1) / 0.9), PZ0 - 60];
    case 8: return [PX0 - 60 + 0.4 * (t - 28), 88, PZ0 - 50];
    case 9: case 10: return [PX0 - 20 + 0.5 * (t - 32), 110, PZ0 - 10];
    case 11: return [PX0 - 10 + 0.4 * (t - 37), 104, PZ0];
    case 12: return [PX0 + 10 + 0.5 * (t - 43), 44 - 8 * smooth((t - T_DROP + 0.1) / 1.0), PZ0 + 30];
    case 13: return [PX0 + 30, 34 - 0.6 * (t - 46.5), RIV0 - 10 + 6 * (t - 46.5)];
    case 14: return [PX0 + 30, 30, RIV1 + 20];
    case 15: { const u = clamp01((t - (T_BUMP - 1.6)) / 1.6); return [FX0 + 3 * (1 - u), D0 + 9 * (1 - u) * (1 - u), FZ0]; }
    default: return [FX0, D0, FZ0];
  }
};
/** the envelope's height scale: 1 standing, sagging after the landing */
export const sagAt = (id: number, t: number) => (id === 15 ? 1 - 0.12 * smooth((t - T_BUMP) / 1.2) : id === 16 ? 0.88 - 0.06 * smooth((t - 58) / 3) : 1);
/** the straw fire 0..1 per shot */
export const fireAt = (id: number, t: number) => {
  if (id === 7) return 1 - 0.65 * smooth((t - T_FORGETS + 0.1) / 0.8);
  if (id === 14) return 1 - smooth((t - T_DIE + 0.3) / 0.7);
  if (id >= 15) return 0;
  return 1;
};
/** burning spots on the envelope: [local height, angle, size m, start s, end s]; size grows over 0.5 s, shrinks over 0.25 s */
export type Spot = [number, number, number, number, number];
export const SPOTS: Record<number, Spot[]> = {
  1: [[3.4, -0.22, 0.42, -1, 2.1], [3.9, 0.12, 0.4, -1, 99], [3.1, 0.3, 0.36, 1.0, 99], [4.3, -0.1, 0.34, 2.4, 99]],
  10: [[7.5, -0.2, 0.7, T_BURN - 0.05, 99], [9.2, 0.25, 0.6, T_BURN + 0.35, 99], [6.2, 0.3, 0.55, T_HOLES - 0.05, 99], [10.5, -0.1, 0.5, T_HOLES + 0.25, 99]],
  11: [[3.5, -0.25, 0.42, -1, T_ONE - 0.05], [4.1, 0.1, 0.4, -1, T_BY - 0.05], [3.2, 0.32, 0.38, -1, T_ONE2 - 0.05]],
  13: [[7, -0.3, 1.1, -1, 99], [9.5, 0.2, 1.0, -1, 99], [5.5, 0.4, 0.9, T_SPOTS - 0.1, 99], [11, -0.5, 0.9, T_SPREAD - 0.1, 99], [8, 0.7, 0.8, 49.2, 99]],
};
export const spotSize = (s: Spot, t: number) => s[2] * smooth((t - s[3]) / 0.5) * (1 - smooth((t - s[4]) / 0.25));

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
const P = (f: number, a: number, t: number, punch = 0.005) => pushK(f, a, 0.0017, 0, 30) * pushK(f, fr(t) - 3, 0, punch, 25);
const add = (b: V3, o: V3): V3 => [b[0] + o[0], b[1] + o[1], b[2] + o[2]];
/** a camera riding with the balloon of shot id: lens and target as offsets from the gallery floor */
const rel = (id: number, f: number, pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => {
  const b = balloonAt(id, f / FPS)!;
  return dolly(add(b, pos), add(b, look), k, rest);
};
/** a camera fixed in the world, aimed at the balloon of shot id at time t0 */
const fixedOn = (id: number, t0: number, pos: V3, look: V3) => { const b = balloonAt(id, t0)!; return { pos: add(b, pos), look: add(b, look) }; };
const Y = D0, [FX, , FZ] = FIELD;

// shot 1 (hook): close on the marquis at the gallery dabbing burning spots, Paris far below
const S1 = (f: number) => rel(1, f, [2.0, 2.1, 9.0], [0.35, 2.1, 2.8], P(f, 0, T_FIRES, 0.005), { fov: 50, roll: 0.03 });
// shot 2: Paris from above: rooftops and the Seine
const S2 = (f: number) => dolly([PX0 - 95, 70, PZ0 - 120], [PX0 + 10, 18, PZ0 + 70], P(f, 158, 6.39, 0.003), { fov: 52, roll: -0.03 });
// shot 3: the lawn: the two men walk up to the balloon; tilt up the envelope on "balloon"
const S3a = (f: number) => dolly([10.5, Y + 1.8, 13.5], [4.5, Y + 1.9, 1.2], P(f, 232, T_STEP, 0.004), { fov: 50, roll: 0.03 });
const S3b = (f: number) => dolly([7, Y + 2.0, 24], [0, Y + 11.5, 0], P(f, fr(T_BALLOON) - 3, T_BLUE, 0.004), { fov: 54, roll: 0.03 });
// shot 4: the straw fire in the brazier under the open neck
const S4 = (f: number) => dolly([4.9, LAUNCH[1] + 1.55, 1.5], [0, LAUNCH[1] + 1.05, 0], P(f, 411, T_FIRE, 0.007), { fov: 46, roll: -0.03 });
// shot 5: the crowd: the king, then a glide to Benjamin Franklin
const KING: V3 = [-3.2, Y, 15.5], FRANK: V3 = [2.6, Y, 16.2];
export { KING, FRANK };
const S5a = (f: number) => dolly([KING[0] + 0.6, Y + 1.75, KING[2] + 5.0], [KING[0], Y + 1.55, KING[2]], P(f, 471, T_KING, 0.004), { fov: 44, roll: 0.03 });
const S5b = (f: number) => dolly([FRANK[0] - 0.4, Y + 1.75, FRANK[2] + 5.0], [FRANK[0], Y + 1.55, FRANK[2]], P(f, fr(T_FRANKLIN) - 6, 17.84, 0.006), { fov: 44, roll: -0.03 });
// shot 6: low on the lawn behind the crowd: the balloon lifts on "up" and clears the trees
const S6 = (f: number) => { const b = balloonAt(6, f / FPS)!;
  return dolly([9, Y + 1.3, 36], [b[0], b[1] + 9, b[2]], pushK(f, 555, 0.0015), { fov: 56, roll: -0.03 }); };
// shot 7: close on the marquis gazing at Paris; the fire dies down; the balloon sinks in frame
const S7 = (f: number) => { const c = fixedOn(7, 25.5, [2.4, 1.9, 9.5], [0.3, 1.75, 2.8]); return dolly(c.pos, c.look, P(f, 684, T_SINK, 0.006), { fov: 50, roll: 0.03 }); };
// shot 8: the other side of the gallery: Pilatre shouts round the neck
const S8 = (f: number) => rel(8, f, [-2.2, 1.9, -9.5], [-0.3, 1.75, -2.8], P(f, 852, T_BATHING, 0.006), { fov: 48, roll: -0.03 });
// shot 9: wide: the balloon high over Paris
const S9 = (f: number) => rel(9, f, [52, 8, 66], [0, 9, 0], P(f, 963, T_THREE, 0.003), { fov: 50, roll: 0.03 });
// shot 10: the envelope: sparks burn glowing holes in the paper
const S10 = (f: number) => rel(10, f, [3.0, 7.0, 17.5], [0.2, 7.8, 5.5], P(f, 1040, T_HOLES, 0.006), { fov: 46, roll: -0.03 });
// shot 11: the marquis and his sponge on a pitchfork, dabbing out the spots one by one
const S11 = (f: number) => rel(11, f, [2.0, 2.1, 9.0], [0.35, 2.1, 2.8], P(f, 1122, T_ONE, 0.005), { fov: 50, roll: 0.03 });
// shot 12: from roof height: the balloon drops toward the roofs on "drop"
const S12 = (f: number) => { const c = fixedOn(12, 44, [30, 8, 40], [0, -10, 0]); return dolly(c.pos, c.look, P(f, 1290, T_DROP, 0.005), { fov: 56, roll: -0.03 }); };
// shot 13: over the Seine: the balloon drifts across the river, the burning spots spreading
const S13 = (f: number) => { const c = fixedOn(13, 48.5, [14, 6, 60], [0, -6, 0]); return dolly(c.pos, c.look, P(f, 1395, T_SPOTS, 0.004), { fov: 56, roll: 0.03 }); };
// shot 14: the brazier: he lets the fire die
const S14 = (f: number) => rel(14, f, [4.9, 1.55, 1.5], [0, 1.05, 0], P(f, 1536, T_ZERO, 0.007), { fov: 46, roll: -0.03 });
// shot 15: the field between two windmills: the balloon bumps down
const S15 = (f: number) => dolly([FX + 8, Y + 2.4, FZ + 40], [FX, Y + 8.5, FZ], P(f, 1611, T_ALIVE, 0.004), { fov: 54, roll: -0.03 });
// shot 16: the two men on the grass by the sagging balloon pop the champagne
const S16 = (f: number) => dolly([FX + 0.3, Y + 1.7, FZ + 13], [FX + 0.25, Y + 1.3, FZ + 4.7], P(f, 1734, T_POP, 0.006), { fov: 46, roll: 0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 158, s: S2 }], 3: [{ f: 232, s: S3a }, { f: fr(T_BALLOON) - 3, dur: 34, s: S3b }], 4: [{ f: 411, s: S4 }],
  5: [{ f: 471, s: S5a }, { f: fr(T_FRANKLIN) - 6, dur: 26, s: S5b }], 6: [{ f: 555, s: S6 }], 7: [{ f: 684, s: S7 }], 8: [{ f: 852, s: S8 }],
  9: [{ f: 963, s: S9 }], 10: [{ f: 1040, s: S10 }], 11: [{ f: 1122, s: S11 }], 12: [{ f: 1290, s: S12 }], 13: [{ f: 1395, s: S13 }],
  14: [{ f: 1536, s: S14 }], 15: [{ f: 1611, s: S15 }], 16: [{ f: 1734, s: S16 }],
};

// impact kicks: [seconds, strength]: the sink, the drop, the bump, the cork
const KICKS: [number, number][] = [[T_SINK - 2 / 30, 0.2], [T_DROP - 2 / 30, 0.25], [T_BUMP - 2 / 30, 0.35], [T_POP - 2 / 30, 0.2]];
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
const on = (id: number, o: V3) => (f: number) => add(balloonAt(id, f / FPS)!, o);
const at = (p: V3) => () => p;
export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: on(1, [MARQ[0], 1.7, MARQ[2]]) },
  { f: 158, cInf: 0 },
  { f: 232, cInf: 7, focus: at([6, Y + 1.6, 1.5]) },
  { f: 411, cInf: 13, focus: at([0, LAUNCH[1] + 1.0, 0]) },
  { f: 471, cInf: 11, focus: at([KING[0], Y + 1.7, KING[2]]) },
  { f: fr(T_FRANKLIN) - 6, dur: 20, cInf: 11, focus: at([FRANK[0], Y + 1.7, FRANK[2]]) },
  { f: 555, cInf: 0 },
  { f: 684, cInf: 12, focus: on(7, [MARQ[0], 1.7, MARQ[2]]) },
  { f: 852, cInf: 12, focus: on(8, [PIL[0], 1.7, PIL[2]]) },
  { f: 963, cInf: 0 },
  { f: 1040, cInf: 7, focus: on(10, [0, 7.5, 6.0]) },
  { f: 1122, cInf: 14, focus: on(11, [MARQ[0], 1.7, MARQ[2]]) },
  { f: 1290, cInf: 0 },
  { f: 1536, cInf: 13, focus: on(14, [0, 1.0, 0]) },
  { f: 1611, cInf: 0 },
  { f: 1734, cInf: 11, focus: at([FX + 0.3, Y + 1.7, FZ + 4.6]) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

/** near framing objects: Kenney models just in front of the lens for a few shots */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 232, b: 411, kit: "plant_bush", pos: [8.6, D0, 19.5], s: 1.0 },
  { a: 555, b: 684, kit: "tree_oak", pos: [16, D0, 30], s: 9.0 },
];
