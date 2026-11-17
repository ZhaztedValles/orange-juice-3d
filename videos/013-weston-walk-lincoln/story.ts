// Timeline of "He Lost a Bet on Lincoln, So He Walked 478 Miles to Washington": shots timed to words.json. Six places,
// far apart on one big ground: a Boston street with the State House (gold dome, white portico) at its head, a muddy
// country road through snowy fields, a village street lined with townsfolk, a sand beach (the analogy), Washington
// (the avenue up to the Capitol with its dome still unfinished under a crane, March 1861) and the inaugural ball (an
// open-topped room: panelled walls, lamps, dancers). Camera grammar of the bridge template: slow push-ins,
// smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2040;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** Boston: a street along x through z = 0; the State House on the north side, its steps reaching z = SH[2] + 9 */
export const BOS: V3 = [0, D0, 0];
export const SH: V3 = [0, D0, -24];
/** where the bet is made: the south pavement of the Boston street, in front of the terraces */
export const BET: V3 = [44, D0, 6.2];
/** the country road: along x through z = ROAD[2], snowy fields both sides */
export const ROAD: V3 = [0, D0, 320];
/** the village street: along x through z = VIL[2] */
export const VIL: V3 = [0, D0, -320];
/** the beach: dry sand from z = BEACH[2] - 40 down to the water line at z = BEACH[2] + 14 */
export const BEACH: V3 = [-420, D0, 380];
/** Washington: the avenue along x through z = 0 up to the Capitol, whose front steps face -x at CAP[0] - 16 */
export const CAP: V3 = [480, D0, 0];
/** the ballroom (open-topped): back wall at z = BALL[2] - 5 */
export const BALL: V3 = [420, D0, 360];

// story beats (seconds on the voice clock)
export const T_WALK = 2.67; // "walk"
export const T_MILES = 3.92; // "miles."
export const T_SURE = 8.24; // "sure"
export const T_NEVER = 9.45; // "never"
export const T_TELLS = 10.47; // "tells"
export const T_WINS1 = 11.82; // "wins" (the deal)
export const T_TEN = 14.93; // "ten"
export const T_LINCOLN = 16.04; // "Lincoln wins."
export const T_WINS = 16.38; // "wins."
export const T_SETS = 18.99; // "sets off"
export const T_HUNDREDS = 20.73; // "hundreds"
export const T_SNOW = 24.62; // "snow"
export const T_TOWNS = 26.57; // "towns"
export const T_WATCH = 27.82; // "watch"
export const T_FALLS = 29.48; // "falls"
export const T_SPRAINS = 30.45; // "sprains"
export const T_KEEPS = 31.4; // "keeps going"
export const T_BEHIND = 33.19; // "behind."
export const T_SEE = 34.12; // "You see,"
export const T_STEALS = 34.75; // "steals"
export const T_SAND = 37.77; // "sand"
export const T_SINKS = 39.31; // "sinks"
export const T_SLIDES = 39.73; // "slides back"
export const T_TIRES = 42.3; // "tires"
export const T_MILLION = 44.12; // "million"
export const T_VANISH = 45.44; // "vanish."
export const T_LIMPS = 47.42; // "limps"
export const T_FIVE = 48.59; // "five"
export const T_AFTER = 50.17; // "after"
export const T_SWORN = 50.94; // "sworn in."
export const T_BALL = 53.6; // "ball,"
export const T_SHOOK = 55.09; // "shook"
export const T_OFFERED = 57.06; // "offered"
export const T_TRAIN = 58.09; // "train"
export const T_NO = 60.27; // "no."
export const T_LOST = 61.55; // "lost"
export const T_YEARS = 63.79; // "years"
export const T_PAID = 64.45; // "paid"
export const T_WALK2 = 64.92; // "walk."

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "road" | "boston" | "village" | "beach" | "capitol" | "ball";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 138, "road"), mk(2, 138, 478, "boston"), mk(3, 478, 514, "boston"), mk(4, 514, 678, "boston"),
  mk(5, 678, 786, "road"), mk(6, 786, 876, "village"), mk(7, 876, 1017, "road"), mk(8, 1017, 1100, "road"),
  mk(9, 1100, 1300, "beach"), mk(10, 1300, 1384, "road"), mk(11, 1384, 1560, "capitol", "golden"), mk(12, 1560, 1680, "ball"),
  mk(13, 1680, 1824, "ball"), mk(14, 1824, TOTAL, "village", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 4: 8, 5: 8, 6: 8, 9: 8, 10: 8, 11: 10, 12: 8, 14: 10 };
export const FLASH_AT = 138;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- where Weston walks ----------------
/** Weston's x on the road / street of shot id at time t (he walks toward +x everywhere) */
export const westonX = (id: number, t: number) => {
  if (id === 1) return -6 + 1.5 * t;
  if (id === 4) return SH[0] + 0.8 + 1.5 * smooth((t - T_SETS + 0.1) / 0.6) * (t - T_SETS + 0.4);
  if (id === 5) return 40 + 1.5 * (t - 22.6);
  if (id === 6) return VIL[0] - 14 + 1.5 * (t - 26.2);
  if (id === 7) { // walks, falls, gets up and limps on
    const t1 = T_FALLS - 0.1, t2 = T_KEEPS - 0.1;
    if (t < t1) return 120 + 1.5 * (t - 29.2);
    if (t < t2) return 120 + 1.5 * (t1 - 29.2);
    return 120 + 1.5 * (t1 - 29.2) + 0.9 * (t - t2);
  }
  if (id === 8) return 150 + 0.55 * (t - 33.9);
  if (id === 10) return 60 + 1.2 * (t - 43.3);
  if (id === 11) return CAP[0] - 60 + 0.95 * (t - 46.1);
  if (id === 14) return VIL[0] - 12 + 0.9 * (t - 60.8);
  return 0;
};
/** the walking phase (steps): 2 steps per second at full pace, slower when he limps */
export const westonPhase = (id: number, t: number) => (id === 7 && t >= T_KEEPS - 0.1 ? 0.6 : id === 8 ? 0.7 : id === 11 ? 0.65 : 1) * t * 1.0;

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
const T = (f: number) => f / FPS;
const fr = (t: number) => Math.round(t * FPS);
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const Y = D0, RZ = ROAD[2];
export const F_TELLS = fr(T_TELLS) - 3;
// shot 1 (hook): Weston striding toward us down the snowy road, the road running back to the hills
const S1a = (f: number) => { const x = westonX(1, T(f)); return dolly([x + 7.5, Y + 1.5, RZ + 2.6], [x, Y + 1.5, RZ - 0.3], pushK(f, 0, 0.0018, 0.005, 30), { fov: 44, roll: 0.03 }); };
// shot 2: 1860, a Boston pavement: Weston, sure of himself, and his friend; then closer as he makes the deal
const S2a = (f: number) => dolly([BET[0] + 1.6, Y + 1.9, BET[2] - 6.6], [BET[0] + 0.2, Y + 1.5, BET[2]], pushK(f, 138, 0.0018, 0.004, 30), { fov: 42, roll: -0.03 });
const S2b = (f: number) => dolly([BET[0] + 0.05, Y + 1.95, BET[2] - 6.6], [BET[0] + 0.1, Y + 1.75, BET[2] + 0.2], pushK(f, F_TELLS, 0.0022, 0.005, 30), { fov: 44, roll: 0.03 });
// shot 3: Lincoln wins: Weston's face, his friend laughing behind
const S3a = (f: number) => dolly([BET[0] - 0.9, Y + 1.75, BET[2] - 2.5], [BET[0] - 0.55, Y + 1.65, BET[2]], pushK(f, 478, 0.003, 0.01, 20), { fov: 38, roll: -0.04 });
// shot 4: the State House, a cold morning: he sets off along the street, the crowd behind him
const S4a = (f: number) => dolly([SH[0] + 17, Y + 2.0, 15], [SH[0] + 1.5, Y + 4.6, -10], pushK(f, 514, 0.0018, 0.004, 30), { fov: 52, roll: 0.03 });
// shot 5: snow and ice: a side view along the road, the fields white behind
const S5a = (f: number) => { const x = westonX(5, T(f)); return dolly([x + 2.0, Y + 1.5, RZ + 3.7], [x + 0.6, Y + 1.25, RZ], pushK(f, 678, 0.0022), { fov: 44, roll: -0.03 }); };
// shot 6: a village street: people on both pavements wait to see him pass
const S6a = (f: number) => dolly([VIL[0] + 5, Y + 2.3, VIL[2] + 0.8], [VIL[0] - 14, Y + 1.4, VIL[2] - 0.3], pushK(f, 786, 0.0016, 0.004, 30), { fov: 50, roll: 0.03 });
// shot 7: the mud: he falls, sprains his ankle, limps on; the clock falls behind
const S7a = (f: number) => { const x = westonX(7, T(f)); return dolly([x + 1.3, Y + 1.6, RZ + 3.8], [x + 0.4, Y + 1.0, RZ], pushK(f, 876, 0.0024, 0.006, 30), { fov: 42, roll: 0.03 }); };
// shot 7, "keeps going": a hard cut wider and lower as he gets up and limps on (the cut hides the sit-to-walk change)
export const F_KEEPS = fr(T_KEEPS - 0.1);
const S7b = (f: number) => { const x = westonX(7, T(f)); return dolly([x + 2.6, Y + 1.2, RZ + 4.6], [x + 0.6, Y + 1.05, RZ], pushK(f, F_KEEPS, 0.0024, 0.006, 30), { fov: 44, roll: -0.03 }); };
// shot 8: you see: low by his boots in the mud
const S8a = (f: number) => { const x = westonX(8, T(f)); return dolly([x + 1.8, Y + 0.85, RZ + 2.6], [x, Y + 0.7, RZ], pushK(f, 1017, 0.0024, 0.006, 30), { fov: 40, roll: -0.04 }); };
// shot 9: the beach: someone trudging over soft sand, the sea behind
const S9a = (f: number) => dolly([BEACH[0] + 2.4, Y + 1.5, BEACH[2] - 5.4], [BEACH[0] + 0.6, Y + 1.1, BEACH[2] + 0.5], pushK(f, 1100, 0.002, 0.005, 30), { fov: 44, roll: 0.03 });
// shot 10: from above: the long road, a tiny walker, the miles behind him
const S10a = (f: number) => {
  const s = glide((f - 1300) / 84);
  return { pos: [50 + 6 * s, Y + 20 + 4 * s, RZ + 18 + 3 * s], look: [66 + 3 * s, Y, RZ - 1], fov: 46, roll: 0 } as Shot;
};
// shot 11 (golden): Washington: he limps up the avenue to the Capitol; the crowd is already going home
const S11a = (f: number) => dolly([CAP[0] - 72, Y + 1.9, 4.0], [CAP[0] - 40, Y + 6.0, -3.5], pushK(f, 1384, 0.0016, 0.004, 30), { fov: 50, roll: -0.03 });
// shot 12: the inaugural ball: dancers, the new president, the handshake
const S12a = (f: number) => dolly([BALL[0] + 0.5, Y + 2.4, BALL[2] + 8.5], [BALL[0] + 0.2, Y + 1.5, BALL[2] - 2.0], pushK(f, 1560, 0.002, 0.005, 30), { fov: 50, roll: 0.03 });
// shot 13: the ticket home: the two of them close
const S13a = (f: number) => dolly([BALL[0] + 0.3, Y + 1.85, BALL[2] + 3.4], [BALL[0] + 0.25, Y + 1.7, BALL[2] - 2.0], pushK(f, 1680, 0.0022, 0.005, 30), { fov: 42, roll: -0.03 });
// shot 14 (golden): fifty years on: the old walker strides down a village street, the crowd cheering
const S14a = (f: number) => { const x = westonX(14, T(f)); return dolly([x + 9.5, Y + 2.2, VIL[2] + 1.8], [x - 1.0, Y + 1.4, VIL[2] - 0.6], pushK(f, 1824, 0.0018, 0.004, 30), { fov: 44, roll: 0.03 }); };

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 138, s: S2a }, { f: F_TELLS, cut: true, s: S2b }],
  3: [{ f: 478, s: S3a }],
  4: [{ f: 514, s: S4a }],
  5: [{ f: 678, s: S5a }],
  6: [{ f: 786, s: S6a }],
  7: [{ f: 876, s: S7a }, { f: F_KEEPS, cut: true, s: S7b }],
  8: [{ f: 1017, s: S8a }],
  9: [{ f: 1100, s: S9a }],
  10: [{ f: 1300, s: S10a }],
  11: [{ f: 1384, s: S11a }],
  12: [{ f: 1560, s: S12a }],
  13: [{ f: 1680, s: S13a }],
  14: [{ f: 1824, s: S14a }],
};

// impact kicks: [seconds, strength]: "Lincoln wins.", the fall in the mud, the sprain, the handshake
const KICKS: [number, number][] = [[T_WINS - 2 / 30, 0.6], [T_FALLS - 2 / 30, 0.6], [T_SPRAINS - 2 / 30, 0.35], [T_SHOOK - 2 / 30, 0.35]];
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
  const c = run(CAMS[id], f), a = kickAt(T(f));
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
  { f: 138, cInf: 10, focus: at([BET[0] + 0.2, Y + 1.6, BET[2]]) },
  { f: F_TELLS, cInf: 12, focus: at([BET[0], Y + 1.6, BET[2]]) },
  { f: 478, cInf: 14, focus: at([BET[0] - 0.55, Y + 1.7, BET[2]]) },
  { f: 514, cInf: 0 },
  { f: 678, cInf: 11, focus: (f) => [westonX(5, T(f)), Y + 1.6, RZ] },
  { f: 786, cInf: 0 },
  { f: 876, cInf: 11, focus: (f) => [westonX(7, T(f)), Y + 1.0, RZ] },
  { f: 1017, cInf: 13, focus: (f) => [westonX(8, T(f)), Y + 0.7, RZ] },
  { f: 1100, cInf: 10, focus: at([BEACH[0] + 0.4, Y + 1.4, BEACH[2] + 0.4]) },
  { f: 1300, cInf: 0 },
  { f: 1560, cInf: 7, focus: at([BALL[0] + 0.2, Y + 1.6, BALL[2] - 2.1]) },
  { f: 1680, cInf: 12, focus: at([BALL[0] + 0.25, Y + 1.7, BALL[2] - 2.1]) },
  { f: 1824, cInf: 7, focus: (f) => [westonX(14, T(f)), Y + 1.6, VIL[2] - 0.2] },
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
];
