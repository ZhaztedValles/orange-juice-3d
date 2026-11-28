// Timeline of "A Horse Entered a Steam Engine Race in 1829": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): the Rainhill course at the origin (a double track
// along x, the Cycloped on the near track, the four steam engines on the far track, a fence, the crowd and a grandstand
// behind), the road of the exercise-bike analogy at x = SX and the country line to Manchester at x = KX.
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2020;
export const D0 = 1.2; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the two tracks: near at z = TZ0, far at z = TZ1; rail tops RT above the ground; half gauge GA */
export const TZ0 = 0, TZ1 = -3.4, RT = 0.16, GA = 0.72;
export const FENCE_Z = -6.2;
export const SX = 600; // the analogy road
export const KX = -600; // the country line to Manchester
/** the Cycloped: floor (treadmill) height above the rails, half length, half width, side rail height */
export const CYC_FLOOR = 0.95, CYC_L = 1.7, CYC_W = 0.95, CYC_SIDE = 2.3;
/** the engines' starting places on the far track (0 Novelty, 1 Rocket, 2 Sans Pareil, 3 Perseverance) */
export const ENG_X = [-11, -4, 3.5, 10.5];
/** each engine's chimney top in its own frame [x, y] (heading +x, rail top at y = 0) */
export const CHIM: [number, number][] = [[-0.95, 3.3], [1.05, 4.5], [1.0, 4.3], [1.0, 3.9]];
/** the country line's rail top above the ground (it runs on a low bank) */
export const KRT = 0.63;

// story beats (seconds on the voice clock)
export const T_HORSE = 1.85, T_RACE = 2.45, T_STEAM = 3.38, T_WORLD = 4.25;
export const T_OCTOBER = 5.25, T_TEN = 5.97, T_CROWDED = 6.95, T_TRACK = 7.97, T_RAINHILL = 8.35, T_LIVERPOOL = 9.07;
export const T_RAILWAY = 10.32, T_FIVE = 11.09, T_POUNDS = 11.65, T_LOCO = 12.45;
export const T_FOUR = 13.41, T_HISSED = 14.05, T_FIRE = 14.49, T_STEAM2 = 14.93;
export const T_FIFTH = 15.81, T_CYC = 16.39, T_THOMAS = 17.38, T_DIRECTOR = 18.35, T_ITSELF = 19.38;
export const T_INSIDE = 20.31, T_WALKED = 21.36, T_FLOOR = 21.84, T_TURNED = 23.25, T_WHEELS = 23.62;
export const T_BOILER = 24.7, T_COAL = 25.31, T_JUST = 25.73, T_ONE = 25.98, T_HORSE2 = 26.2;
export const T_CROWD = 27.5, T_LAUGHED = 27.82, T_MOVED = 28.71, T_MARCHING = 29.55, T_BRAVELY = 29.95;
export const T_CREPT = 31.35, T_SIX = 32.26, T_HOUR = 32.88;
export const T_THEN = 33.52, T_CRACK = 34.33, T_HORSE3 = 34.85, T_THROUGH = 35.6, T_FLOOR2 = 35.84;
export const T_CYC2 = 36.64, T_OUT = 37.23;
export const T_SEE = 37.77, T_TREAD = 38.8, T_PEDAL = 39.55, T_BIKE = 40.62, T_BOLTED = 40.9, T_CAR = 41.42;
export const T_LEGS = 42.3, T_CAR2 = 43.15, T_BIKE2 = 43.55, T_YOU = 43.98;
export const T_WITH = 44.58, T_WEIGHED = 46.0, T_THREE = 46.51, T_TONS = 46.75;
export const T_ENGINE = 47.74, T_STRENGTH = 48.95, T_COAL2 = 49.46, T_SACK = 50.41, T_DAY = 52.17, T_WORK = 52.48;
export const T_ROCKET = 53.7, T_WON = 54.08, T_THIRTY = 54.89, T_HOUR2 = 55.66;
export const T_YEAR = 56.91, T_TRAINS = 57.7, T_MANCHESTER = 58.58;
export const T_BECAME = 60.23, T_ONLY = 60.71, T_HISTORY = 61.52, T_LOSE = 62.1, T_FALLING = 62.96, T_FLOOR3 = 63.66;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "course" | "road" | "country";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 140, "course"), mk(2, 140, 302, "course"), mk(3, 302, 400, "course"), mk(4, 400, 470, "course"),
  mk(5, 470, 605, "course"), mk(6, 605, 730, "course"), mk(7, 730, 818, "course"), mk(8, 818, 925, "course"),
  mk(9, 925, 1000, "course"), mk(10, 1000, 1092, "course"), mk(11, 1092, 1128, "course"), mk(12, 1128, 1330, "road"),
  mk(13, 1330, 1425, "course"), mk(14, 1425, 1598, "course"), mk(15, 1598, 1688, "course"),
  mk(16, 1688, 1782, "country", "golden"), mk(17, 1782, TOTAL, "course", "golden"),
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 12: 10, 13: 8, 16: 10, 17: 10 };
export const FLASH_AT = 140;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fr = (t: number) => Math.round(t * FPS);
const T0 = (id: number) => SHOTS[id - 1].a / FPS;

// ---------------- story physics ----------------
/** the Cycloped's x on the near track in shot id at t (it starts to roll on "moved", creeps, and stops at the crack) */
export const cycX = (id: number, t: number) => {
  if (id === 8) { const u = Math.max(0, t - T_MOVED + 0.07); return 0.55 * u * u / (1 + 0.5 * u); }
  if (id === 9) return 2.0 + 1.3 * (t - T0(9));
  if (id === 10) return 6.3 + 1.3 * (Math.min(t, T_CRACK - 0.07) - T0(10));
  if (id >= 11) return 7.5;
  return 0;
};
/** is the horse walking (the treadmill running)? */
export const walking = (id: number, t: number) => id === 6 || id === 8 || id === 9 || (id === 10 && t < T_CRACK - 0.07) || id === 1 || id === 5;
/** how far the horse has sunk through the floor (m): 0 before the crack, 0.9 at the end of the fall */
export const sinkAt = (id: number, t: number) => {
  if (id < 10) return 0;
  if (id === 10) return 0.18 * smooth((t - T_CRACK + 0.07) / 0.2) + 0.72 * easeOut(clamp01((t - T_THROUGH + 0.07) / 0.35));
  return 0.9;
};
/** an engine's x on the far track: Novelty roars past in shot 9, Rocket races in 15, the others stand */
export const engX = (k: number, id: number, t: number) => {
  if (id === 9 && k === 0) return -26 + 15 * (t - T0(9));
  if (id === 15 && k === 1) return -30 + 16 * (t - T0(15));
  if (id >= 13 && k === 0) return ENG_X[0] - 30; // Novelty has gone off down the line
  return ENG_X[k];
};
/** the analogy car's x on the road (it crawls as the rider pedals) */
export const autoX = (t: number) => SX - 2.0 + 0.35 * Math.max(0, t - T_PEDAL);
/** the train's x on the country line in shot 16, and on the far track behind the wreck in shot 17 */
export const trainX = (t: number) => KX - 18 + 6.5 * (t - T0(16));
export const train17X = (t: number) => -16 + 4.2 * (t - T0(17));

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
const Y = D0;
const tt = (f: number) => f / FPS;

// where the people stand (used by cast.ts too)
export const BRANDRETH: V3 = [1.2, Y, 2.0]; // Thomas Brandreth beside his machine, front right
export const JUDGES: V3 = [-14, Y, 2.6]; // the judges' table by the near track
export const FIREMAN: V3 = [ENG_X[1] - 2.6, Y, TZ1 + 1.55]; // the Rocket's fireman by the tender
const HORSE_HEAD = (x: number): V3 => [x + 0.9, Y + RT + CYC_FLOOR + 1.75, TZ0];

// shot 1 (hook): the horse in its wagon on the near track, steam engines behind it on the far track
const S1 = (f: number) => dolly([1.6, Y + 2.7, 8.6], [0.3, Y + 2.3, -0.6], P(f, 0, T_STEAM, 0.006), { fov: 46, roll: 0.03 });
// shot 2: the course, wide and high: the crowd, the grandstand, the mile of track; a glide along the track on "track"
const S2a = (f: number) => dolly([-3, Y + 3.4, 16], [0, Y + 2.9, -8], P(f, 140, T_CROWDED, 0.003), { fov: 50, roll: 0.03 });
const S2b = (f: number) => dolly([11, Y + 4.0, 16], [-4, Y + 2.2, -6], P(f, fr(T_TRACK) - 3, T_LIVERPOOL, 0.003), { fov: 50, roll: -0.03 });
// shot 3: the judges' table: the purse of five hundred pounds
const S3 = (f: number) => dolly([JUDGES[0] + 0.7, Y + 2.2, JUDGES[2] + 5.0], [JUDGES[0] + 0.1, Y + 1.5, JUDGES[2] - 0.4], P(f, 302, T_FIVE, 0.006), { fov: 44, roll: 0.03 });
// shot 4: along the far track: the four steam engines hissing
const S4 = (f: number) => dolly([-16, Y + 3.2, 9.5], [0, Y + 2.0, TZ1], P(f, 400, T_STEAM2, 0.006), { fov: 44, roll: -0.04 });
// shot 5: the Cycloped and Brandreth, proud
const S5 = (f: number) => dolly([2.2, Y + 2.2, 9.6], [0.5, Y + 1.5, 0.4], P(f, 470, T_DIRECTOR, 0.006), { fov: 44, roll: 0.03 });
// shot 6: the cut-away side: the horse on the moving floor, the gear turning the wheels
const S6 = (f: number) => dolly([0.2, Y + 1.9, 6.6], [0.1, Y + 1.7, 0], P(f, 605, T_TURNED, 0.006), { fov: 44, roll: -0.03 });
// shot 7: close on the horse: no boiler, no coal, just one horse
const S7 = (f: number) => dolly([1.6, Y + 2.9, 5.4], [0.6, Y + 2.3, 0], P(f, 730, T_HORSE2, 0.008), { fov: 42, roll: 0.04 });
// shot 8: the crowd laughs (behind the fence), then the Cycloped rolls off
const S8 = (f: number) => dolly([-3.4, Y + 2.3, 9.4], [0.6, Y + 2.0, -2.5], P(f, 818, T_MARCHING, 0.005), { fov: 48, roll: -0.03 });
// shot 9: tracking beside the Cycloped as it creeps; Novelty roars past behind; a boy jogs alongside
const S9 = (f: number) => { const x = cycX(9, tt(f)); return { ...dolly([x + 1.4, Y + 2.4, 8.4], [x + 0.6, Y + 2.0, 0], P(f, 925, T_SIX, 0.004)), fov: 46, roll: 0.03 }; };
// shot 10: close on the Cycloped: the crack, the horse goes through the floor
const S10 = (f: number) => { const x = cycX(10, Math.min(tt(f), T_CRACK)); return { ...dolly([x + 0.9, Y + 2.6, 5.6], [x + 0.5, Y + 2.0, 0], P(f, 1000, T_THROUGH, 0.009)), fov: 44, roll: -0.04 }; };
// shot 11: the judge waves it out; Brandreth with his hands on his head
const S11 = (f: number) => dolly([7.5 + 2.2, Y + 2.3, 9.4], [7.5 + 1.2, Y + 1.5, 0.5], P(f, 1092, T_OUT, 0.008), { fov: 46, roll: 0.03 });
// shot 12: the road: a rider pedals an exercise bike bolted to a car
const S12 = (f: number) => { const x = autoX(tt(f)); return { ...dolly([x + 0.8, Y + 2.6, 12.0], [x + 0.1, Y + 1.7, 0], P(f, 1128, T_YOU, 0.006)), fov: 46, roll: -0.03 }; };
// shot 13: the Cycloped and the weights it carries: three tons
const S13 = (f: number) => dolly([7.5 + 1.2, Y + 2.9, 9.0], [7.5 + 0.2, Y + 1.9, 0], P(f, 1330, T_THREE, 0.007), { fov: 46, roll: 0.03 });
// shot 14: the Rocket's tender: the fireman, the coal, one sack and a horse's whole day
const S14 = (f: number) => dolly([FIREMAN[0] + 1.6, Y + 2.3, FIREMAN[2] + 5.6], [FIREMAN[0] + 0.7, Y + 2.0, FIREMAN[2] - 0.8], P(f, 1425, T_DAY, 0.006), { fov: 44, roll: -0.03 });
// shot 15: low by the far track: the Rocket races past, the crowd cheers
const S15 = (f: number) => dolly([6, Y + 1.4, 6.5], [-1, Y + 1.9, TZ1], P(f, 1598, T_THIRTY, 0.006), { fov: 48, roll: 0.045 });
// shot 16: golden: the country line, a train of carriages behind the Rocket, far chimneys of Manchester
const S16 = (f: number) => { const x = trainX(tt(f)) - 0.5; return { ...dolly([x + 5, Y + 2.8, 12], [x, Y + 1.8, 0], P(f, 1688, T_MANCHESTER, 0.004)), fov: 46, roll: -0.03 }; };
// shot 17: golden: the broken Cycloped by the track, the horse in the floor, the train passing behind
const S17 = (f: number) => dolly([7.5 + 1.8, Y + 2.5, 8.2], [7.5 + 0.4, Y + 1.9, 0], P(f, 1782, T_FLOOR3, 0.007), { fov: 44, roll: 0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 140, s: S2a }, { f: fr(T_TRACK) - 3, dur: 36, s: S2b }], 3: [{ f: 302, s: S3 }], 4: [{ f: 400, s: S4 }],
  5: [{ f: 470, s: S5 }], 6: [{ f: 605, s: S6 }], 7: [{ f: 730, s: S7 }], 8: [{ f: 818, s: S8 }], 9: [{ f: 925, s: S9 }],
  10: [{ f: 1000, s: S10 }], 11: [{ f: 1092, s: S11 }], 12: [{ f: 1128, s: S12 }], 13: [{ f: 1330, s: S13 }], 14: [{ f: 1425, s: S14 }],
  15: [{ f: 1598, s: S15 }], 16: [{ f: 1688, s: S16 }], 17: [{ f: 1782, s: S17 }],
};
/** in-shot camera cuts (frames), listed in shots.json `planned` */
export const CUT_FRAMES: number[] = [];

// impact kicks: [seconds, strength]: the crack, the horse through the floor, the three tons land, the Rocket's pass
const KICKS: [number, number][] = [[T_CRACK - 2 / 30, 0.3], [T_THROUGH - 2 / 30, 0.35], [T_THREE - 2 / 30, 0.3], [T_THIRTY - 2 / 30, 0.25]];
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
  { f: 0, cInf: 15, focus: at(HORSE_HEAD(0)) },
  { f: 140, cInf: 0 },
  { f: 302, cInf: 12, focus: at([JUDGES[0], Y + 1.6, JUDGES[2] - 0.3]) },
  { f: 400, cInf: 0 },
  { f: 470, cInf: 11, focus: at([BRANDRETH[0], Y + 1.75, BRANDRETH[2]]) },
  { f: 605, cInf: 0 },
  { f: 730, cInf: 13, focus: at(HORSE_HEAD(0)) },
  { f: 818, cInf: 0 },
  { f: 925, cInf: 10, focus: (f) => HORSE_HEAD(cycX(9, f / FPS)) },
  { f: 1000, cInf: 12, focus: (f) => HORSE_HEAD(cycX(10, f / FPS)) },
  { f: 1092, cInf: 10, focus: at([7.5 + 1.8, Y + 1.75, 1.6]) },
  { f: 1128, cInf: 0 },
  { f: 1330, cInf: 0 },
  { f: 1425, cInf: 11, focus: at([FIREMAN[0], Y + 1.7, FIREMAN[2]]) },
  { f: 1598, cInf: 0 },
  { f: 1688, cInf: 0 },
  { f: 1782, cInf: 5, focus: at([7.5 + 0.9, Y + RT + CYC_FLOOR + 0.9, 0]) },
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
  { a: 140, b: 302, kit: "tree_oak", pos: [-14, Y, 24], s: 8.0 },
  { a: 302, b: 400, kit: "lantern", pos: [JUDGES[0] - 2.4, Y, JUDGES[2] + 3.0], s: 2.6 },
  { a: 818, b: 925, kit: "banner-red", pos: [-5.6, Y, 5.2], s: 3.0 },
  { a: 1782, b: TOTAL, kit: "lantern", pos: [7.5 + 3.4, Y, 4.2], s: 2.6 },
];
