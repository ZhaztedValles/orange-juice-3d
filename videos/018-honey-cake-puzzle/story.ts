// Timeline of "Puzzle: Someone Stole a Prize Bake During the Boat Race": shots timed to words.json. One place: the
// main street of Millbrook (an invented river town) running along x, Mrs Plum's bakery on the north side with its shop
// window, the church tower closing the west end, the river and its bridge at the east end. Camera grammar of the bridge
// template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1995;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the shop window: sill height, the depth the bakes stand at, and the x of the three bakes (pie, tart, honey cake) */
export const SILL_Y = D0 + 1.05;
export const BAKE_Z = -3.42;
export const BAKE_X = [-2.3, -1.05, 0.2];
/** the church clock face (on the tower's east side) */
export const CLOCK: V3 = [-34.85, D0 + 16, 0];
/** the river (x range) and the bridge deck */
export const RIVER_X0 = 36, RIVER_X1 = 54;
export const DECK_Y = D0 + 0.55;
/** where the three suspects stand (Otto, Greta, Felix) */
export const SUS: [number, number][] = [[5.6, -1.6], [6.9, -1.4], [8.2, -1.7]];

// story beats (seconds on the voice clock)
export const T_ROBBED = 0.85;
export const T_THIEF = 3.36;
export const T_TWO = 4.99; // "two words."
export const T_MILLBROOK = 7.55;
export const T_BAKER = 9.30;
export const T_PROUD = 10.38;
export const T_THREE = 12.26;
export const T_CHERRY = 13.51;
export const T_TART = 14.80;
export const T_HONEY = 15.60;
export const T_OCLOCK = 17.0;
export const T_RANG = 17.98;
export const T_RACE = 18.70;
export const T_WHOLE = 19.50;
export const T_CHEER = 21.21;
export const T_RANTOO = 22.62;
export const T_OPEN = 24.0;
export const T_BACK = 25.68;
export const T_EMPTY = 26.61;
export const T_CRUMBS = 27.59;
export const T_PIKE = 29.46;
export const T_QUIET = 31.50;
export const T_NOBODY = 32.35;
export const T_MISSING = 33.40;
export const T_STOPPED = 34.48;
export const T_WHERE = 37.0;
export const T_OTTO = 38.58;
export const T_ROWING = 39.92;
export const T_ANYONE = 41.30;
export const T_LAST = 42.25;
export const T_GRETA = 43.31;
export const T_HELD = 44.17;
export const T_BRIDGE2 = 46.21;
export const T_WET = 48.44;
export const T_FELIX = 49.55;
export const T_YAWNED = 50.48;
export const T_ASLEEP = 51.89;
export const T_HONEY2 = 54.40;
export const T_CAKE2 = 54.67;
export const T_SMILED = 56.03;
export const T_CLOSED = 56.83;
export const T_WALKED = 57.92;
export const T_WHO = 60.05;
export const T_THIEF2 = 60.55;
export const T_TELL = 62.29;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light };
const mk = (id: number, a: number, b: number, light: Light = "day"): ShotDef => ({ id, a, b, light });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 165), mk(2, 165, 345), mk(3, 345, 492), mk(4, 492, 645), mk(5, 645, 735), mk(6, 735, 873),
  mk(7, 873, 1017), mk(8, 1017, 1155), mk(9, 1155, 1290), mk(10, 1290, 1476), mk(11, 1476, 1662),
  mk(12, 1662, 1788), mk(13, 1788, TOTAL),
];
/** crossfades (frames) at time changes: later that afternoon (6), the closing question (13) */
export const XFADE: Record<number, number> = { 6: 10, 13: 10 };
export const FLASH_AT = 165;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** the honey cake is in the window until the race (shots 1 and 6 on are after the theft) */
export const cakeThere = (id: number) => id >= 2 && id <= 5;

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
export const fr = (t: number) => Math.round(t * FPS);
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const Y = D0, [OX, OZ] = SUS[0], [GX, GZ] = SUS[1], [FX, FZ] = SUS[2];
// shot 1 (hook): the shop window from the street: two bakes and an empty plate; slow push-in, a punch on "two words"
export const F_TWO = fr(T_TWO) - 3;
const S1a = (f: number) => dolly([-0.15, Y + 1.5, 0.6], [-0.3, Y + 1.32, -3.4], pushK(f, 0, 0.0016, 0, 30), { fov: 46, roll: 0.03 });
const S1b = (f: number) => dolly([-0.15, Y + 1.5, 0.6], [-0.3, Y + 1.32, -3.4], pushK(f, 0, 0.0016, 0, 30) * pushK(f, F_TWO, 0, 0.006, 30), { fov: 46, roll: 0.03 });
// shot 2: Millbrook's main street, then a glide to Mrs Plum at her shop
const S2a = (f: number) => dolly([-15, Y + 6.0, 13], [5, Y + 2.6, -2], pushK(f, 165, 0.0008), { fov: 50, roll: -0.03 });
export const F_BAKER = fr(T_BAKER) - 3;
const S2b = (f: number) => dolly([2.4, Y + 2.0, 4.2], [0.9, Y + 1.5, -2.6], pushK(f, F_BAKER, 0.0018, 0.004, 30), { fov: 46, roll: -0.03 });
// shot 3: along the window, from bake to bake on their words
const B = (x: number) => (f: number) => dolly([x + 0.25, Y + 1.7, -1.0], [x, Y + 1.3, BAKE_Z], pushK(f, 345, 0.0012), { fov: 44, roll: 0.03 });
export const F_TART = fr(T_TART) - 3, F_HONEY = fr(T_HONEY) - 3;
// shot 4: the church clock at two, the bell; hard cut to the town running down the street to the river
const S4a = (f: number) => dolly([-23, Y + 13.0, 4], [CLOCK[0], CLOCK[1] + 0.3, CLOCK[2]], pushK(f, 492, 0.0016, 0.005, 30), { fov: 40, roll: 0.04 });
export const F_WHOLE = fr(T_WHOLE) - 3;
const S4b = (f: number) => dolly([3, Y + 4.6, 2.0], [30, Y + 0.6, -0.5], pushK(f, F_WHOLE, 0.0012), { fov: 50, roll: -0.03 });
// shot 5: Mrs Plum runs off too; the window stays open behind her
const S5a = (f: number) => dolly([-4.5, Y + 2.0, 4.8], [1.4, Y + 1.5, -2.2], pushK(f, 645, 0.0018), { fov: 48, roll: 0.03 });
// shot 6: back at the window: one plate empty; glide down to the trail of crumbs on the cobbles
const S6a = (f: number) => dolly([-1.6, Y + 1.9, 2.4], [0.3, Y + 1.45, -3.0], pushK(f, 735, 0.0016, 0, 30) * pushK(f, fr(T_EMPTY) - 3, 0, 0.006, 30), { fov: 46, roll: -0.03 });
export const F_CRUMBS = fr(T_CRUMBS) - 3;
const S6b = (f: number) => dolly([1.2, Y + 1.5, 1.6], [3.6, Y + 0.1, -1.2], pushK(f, F_CRUMBS, 0.0016), { fov: 48, roll: -0.02 });
// shot 7: Constable Pike and Mrs Plum by the window
const S7a = (f: number) => dolly([-1.2, Y + 2.0, 4.6], [-1.2, Y + 1.5, -2.3], pushK(f, 873, 0.0018, 0, 30) * pushK(f, fr(T_NOBODY) - 3, 0, 0.005, 30), { fov: 44, roll: 0.03 });
// shot 8: the constable and the three suspects in the street
const S8a = (f: number) => dolly([6.0, Y + 2.0, 11.0], [6.0, Y + 1.25, -0.5], pushK(f, 1017, 0.0012, 0, 30), { fov: 50, roll: -0.03 });
// shots 9-11: each suspect in a medium shot
const MS = (x: number, z: number, f0: number, roll: number) => (f: number) => dolly([x + 0.3, Y + 1.9, z + 4.4], [x, Y + 1.4, z], pushK(f, f0, 0.0018), { fov: 44, roll });
export const F_HONEY2 = fr(T_HONEY2) - 3;
const S11b = (f: number) => dolly([FX + 0.15, Y + 1.75, FZ + 2.0], [FX, Y + 1.55, FZ], pushK(f, F_HONEY2, 0.002, 0.006, 25), { fov: 40, roll: 0.04 });
// shot 12: the constable smiles and walks over to them
const S12a = (f: number) => dolly([0.4, Y + 2.2, 6.6], [5.6, Y + 1.4, -1.0], pushK(f, 1662, 0.0016), { fov: 48, roll: 0.03 });
// shot 13 (golden, evening): the three suspects in a row, a question over each; slow push-in
const S13a = (f: number) => dolly([GX - 0.2, Y + 2.0, GZ + 7.6], [GX, Y + 1.5, GZ], pushK(f, 1788, 0.0012, 0, 30), { fov: 46, roll: 0 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: F_TWO, dur: 18, s: S1b }],
  2: [{ f: 165, s: S2a }, { f: F_BAKER, dur: 36, s: S2b }],
  3: [{ f: 345, s: B(BAKE_X[0]) }, { f: F_TART, dur: 18, s: B(BAKE_X[1]) }, { f: F_HONEY, dur: 18, s: B(BAKE_X[2]) }],
  4: [{ f: 492, s: S4a }, { f: F_WHOLE, cut: true, s: S4b }],
  5: [{ f: 645, s: S5a }],
  6: [{ f: 735, s: S6a }, { f: F_CRUMBS, dur: 30, s: S6b }],
  7: [{ f: 873, s: S7a }],
  8: [{ f: 1017, s: S8a }],
  9: [{ f: 1155, s: MS(OX, OZ, 1155, 0.03) }],
  10: [{ f: 1290, s: MS(GX, GZ, 1290, -0.03) }],
  11: [{ f: 1476, s: MS(FX, FZ, 1476, 0.03) }, { f: F_HONEY2, cut: true, s: S11b }],
  12: [{ f: 1662, s: S12a }],
  13: [{ f: 1788, s: S13a }],
};
void OZ; void GZ;

// impact kicks: [seconds, strength]: "two words", "empty", "cake"
const KICKS: [number, number][] = [[T_TWO - 2 / 30, 0.3], [T_EMPTY - 2 / 30, 0.4], [T_CAKE2 - 2 / 30, 0.35]];
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
  { f: 0, cInf: 12, focus: at([-0.45, SILL_Y + 0.2, BAKE_Z]) },
  { f: 165, cInf: 0 },
  { f: F_BAKER, cInf: 11, focus: at([0.9, Y + 1.6, -2.6]) },
  { f: 345, cInf: 13, focus: at([-1.05, SILL_Y + 0.2, BAKE_Z]) },
  { f: 492, cInf: 0 },
  { f: 645, cInf: 7, focus: at([0.0, Y + 1.6, -2.0]) },
  { f: 735, cInf: 12, focus: at([1.25, Y + 1.6, -2.4]) },
  { f: F_CRUMBS, cInf: 0 },
  { f: 873, cInf: 11, focus: at([-1.2, Y + 1.6, -2.3]) },
  { f: 1017, cInf: 0 },
  { f: 1155, cInf: 12, focus: at([OX, Y + 1.6, OZ]) },
  { f: 1290, cInf: 12, focus: at([GX, Y + 1.6, GZ]) },
  { f: 1476, cInf: 12, focus: at([FX, Y + 1.6, FZ]) },
  { f: F_HONEY2, cInf: 14, focus: at([FX, Y + 1.6, FZ]) },
  { f: 1662, cInf: 7, focus: at([3.4, Y + 1.6, 0.5]) },
  { f: 1788, cInf: 5, focus: at([GX, Y + 1.6, GZ]) },
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
  { a: 1781, b: TOTAL, kit: "lantern", pos: [4.4, Y, 4.6], s: 2.6 },
];
