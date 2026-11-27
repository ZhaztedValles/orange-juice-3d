// Timeline of "Voyager 1 Reached One Light-Day From Earth While Sending Empty Signals": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): the big dish in a field near Canberra at the
// origin, the 1977 launch pad at x = PX, the mission control room at x = LX, a living room (the phone analogy) at
// z = HZ, the celebration hall at z = -HZ, and deep space high above everything at y = SY (ground and sky swapped
// for a starfield there by world.ts).
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1900;
export const D0 = 1.2; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the dish: azimuth-elevation mount on a concrete pedestal; the bowl's centre at DISH_C, radius DISH_R */
export const DISH_R = 11, DISH_H = 13; // bowl radius, elevation axis height above the ground
export const DISH: V3 = [0, D0, 0];
export const HUT: V3 = [17, D0, 10]; // the operators' building beside the dish
export const PX = 600; // the launch pad
export const LX = -600; // the control room
export const HZ = 600; // the living room at z = HZ, the hall at z = -HZ
export const SY = 5000; // deep space (y)
export const PROBE: V3 = [0, SY, 0];
/** the dish's elevation (radians above the horizon) in shot id at t: it swings up to lock on in shot 7 */
export const dishEl = (id: number, t: number) => (id === 7 ? 0.5 + 0.28 * smooth((t - T_HUGE) / 1.2) : id === 14 ? 0.62 : 0.78);

// story beats (seconds on the voice clock)
export const T_HELLO = 3.73, T_REACH = 5.28;
export const T_VOY = 6.76, T_SENT = 7.81, T_FLA = 8.36, T_77 = 9.23;
export const T_TEAM = 10.65, T_PROUD = 11.05, T_WORKS = 11.7;
export const T_ON = 13.8, T_FIRST = 15.46, T_LD = 17.45, T_EARTH = 18.0;
export const T_THAT = 18.74, T_16 = 19.32, T_MILES = 20.27;
export const T_BUT = 21.18, T_HUGE = 22.69, T_DISH = 23.07, T_LOCK = 23.95, T_SIGNAL = 24.71, T_EMPTY = 25.81;
export const T_PROBE = 27.05, T_CALL = 27.77, T_NOTHING = 28.81;
export const T_SEE = 30.02, T_PHONE = 31.23, T_RINGS = 31.79, T_NOBODY = 32.39, T_RINGING = 33.65, T_ANT = 34.44, T_WORK = 35.8;
export const T_FAULT = 36.58, T_COMP = 37.73, T_PACKS = 38.4, T_DATA = 38.92;
export const T_HERE = 39.66, T_QUEST = 41.25, T_ARRIVE = 42.38, T_ANSWER = 43.56, T_WEEKS = 45.7;
export const T_THREE = 46.58, T_SAVED = 48.19, T_SILENCE = 48.83;
export const T_SO = 51.0, T_CELEB = 51.16, T_LATE = 52.92, T_NEWS = 54.41, T_HOME = 55.55;
export const T_WOULD = 56.3, T_LISTEN = 57.02, T_ONLY = 58.17, T_RINGS2 = 58.49, T_TELL = 59.29;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "dish" | "space" | "pad" | "lab" | "home" | "hall";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 125, "dish", "golden"), mk(2, 125, 179, "space"), mk(3, 179, 311, "pad"), mk(4, 311, 412, "lab"),
  mk(5, 412, 560, "space"), mk(6, 560, 633, "space"), mk(7, 633, 809, "dish"), mk(8, 809, 898, "space"),
  mk(9, 898, 1095, "home"), mk(10, 1095, 1188, "lab"), mk(11, 1188, 1395, "lab"), mk(12, 1395, 1528, "space"),
  mk(13, 1528, 1687, "hall"), mk(14, 1687, TOTAL, "dish", "golden"),
];
/** crossfades (frames) at place changes */
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8, 5: 8, 7: 8, 8: 8, 9: 8, 10: 8, 12: 8, 13: 8, 14: 10 };
export const FLASH_AT = 179;
export const SPACE = (id: number) => SHOTS[id - 1].scene === "space";

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fr = (t: number) => Math.round(t * FPS);

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

// where the people stand (used by cast.ts too)
export const OPS: V3 = [HUT[0] - 4.5, Y, HUT[2] + 1.5]; // the dish operators outside their building
export const DESK: V3 = [LX, Y, -1.2]; // the front desk of the control room
export const COMP: V3 = [LX + 3.2, Y, -3.2]; // the data computer cabinet (back right)
export const CAL: V3 = [LX - 2.6, Y + 2.0, -3.93]; // the wall calendar (back left)
export const SOFA: V3 = [0, Y, HZ - 1.4]; // the living room: the woman's chair
export const PHONE: V3 = [0.75, Y + 0.72, HZ - 1.2]; // the telephone on its side table
export const STAGE: V3 = [0, Y, -HZ - 2.5]; // the hall's stage
export const CROWD_Z = -HZ + 1.5;
const BOWL: V3 = [DISH[0], Y + DISH_H + 2, DISH[2]]; // about the bowl's centre
const PRB: V3 = [PROBE[0], PROBE[1], PROBE[2]];

// shot 1 (hook): sunset, the big dish sends a ring up toward the sky
const S1 = (f: number) => dolly([BOWL[0] + 20, Y + 3.0, BOWL[2] + 52], [BOWL[0] - 1, Y + 14, BOWL[2]], P(f, 0, T_HELLO, 0.005), { fov: 48, roll: 0.03 });
// shot 2: deep space: the ring reaches the little probe
const S2 = (f: number) => dolly([PRB[0] + 9.5, PRB[1] + 1.0, PRB[2] + 3.4], [PRB[0], PRB[1], PRB[2] + 2.0], P(f, 125, T_REACH, 0.006), { fov: 44, roll: -0.03 });
// shot 3: Florida, 1977: the rocket on its pad, the crowd behind the fence; it lifts off on "seventy-seven"
export const ROCKET: V3 = [PX, Y, 0];
const S3a = (f: number) => dolly([PX + 10, Y + 2.2, 50], [PX, Y + 12, 0], P(f, 179, T_FLA, 0.004), { fov: 54, roll: 0.03 });
const S3b = (f: number) => dolly([PX + 10, Y + 2.0, 51], [PX, Y + 15, 0], pushK(f, fr(T_77) - 3, 0.0015), { fov: 58, roll: 0.03 });
// shot 4: the control room: the team at their desks, proud
const S4 = (f: number) => dolly([LX + 1.4, Y + 1.75, 5.4], [LX + 0.1, Y + 1.45, -1.2], P(f, 311, T_PROUD, 0.006), { fov: 46, roll: -0.03 });
// shot 5: space: the probe sails past, a gold ring marks the light-day
const S5a = (f: number) => dolly([PRB[0] - 5.5, PRB[1] + 0.8, PRB[2] + 6.0], [PRB[0], PRB[1] + 0.2, PRB[2]], P(f, 412, T_FIRST, 0.005), { fov: 42, roll: 0.03 });
const S5b = (f: number) => dolly([PRB[0] - 3.8, PRB[1] + 0.5, PRB[2] + 7.0], [PRB[0], PRB[1] + 0.1, PRB[2]], P(f, fr(T_LD) - 3, T_EARTH, 0.006), { fov: 40, roll: 0.03 });
// shot 6: space, wide: far behind the probe the Earth is one blue dot
export const EARTH_DOT: V3 = [PRB[0] + 3, PRB[1] - 1.4, PRB[2] + 60];
const S6 = (f: number) => dolly([PRB[0] - 4.5, PRB[1] + 2.2, PRB[2] - 12.0], [EARTH_DOT[0] - 1, EARTH_DOT[1] + 1.5, EARTH_DOT[2]], P(f, 560, T_MILES, 0.004), { fov: 40, roll: -0.03 });
// shot 7: day: the dish swings up and locks on; the operators look up
const S7a = (f: number) => dolly([BOWL[0] + 24, Y + 2.2, BOWL[2] + 34], [BOWL[0] + 2, Y + 13, BOWL[2]], P(f, 633, T_DISH, 0.004), { fov: 48, roll: -0.03 });
const S7b = (f: number) => dolly([OPS[0] + 2.6, Y + 1.6, OPS[2] + 6.4], [OPS[0] - 1.2, Y + 2.6, OPS[2] - 3.0], P(f, fr(T_SIGNAL) - 3, T_EMPTY, 0.007), { fov: 48, roll: -0.03 });
// shot 8: space, close: the probe still sends rings home, empty ones
const S8 = (f: number) => dolly([PRB[0] + 12, PRB[1] + 0.6, PRB[2] + 2.8], [PRB[0], PRB[1] + 0.3, PRB[2] + 2.4], P(f, 809, T_NOTHING, 0.006), { fov: 50, roll: -0.03 });
// shot 9: the phone analogy: a woman in her chair, the phone rings, nobody on the line
const S9a = (f: number) => dolly([SOFA[0] + 0.9, Y + 1.05, SOFA[2] + 3.8], [SOFA[0] + 0.35, Y + 1.0, SOFA[2]], P(f, 898, T_RINGS, 0.006), { fov: 44, roll: 0.03 });
const S9b = (f: number) => dolly([SOFA[0] + 0.6, Y + 1.05, SOFA[2] + 2.8], [SOFA[0] + 0.2, Y + 1.05, SOFA[2]], P(f, fr(T_RINGING) - 3, T_ANT, 0.005), { fov: 42, roll: 0.03 });
// shot 10: the control room: the engineers at the data computer
const S10 = (f: number) => dolly([COMP[0] - 2.4, Y + 1.75, COMP[2] + 5.8], [COMP[0] - 0.5, Y + 1.45, COMP[2]], P(f, 1095, T_COMP, 0.007), { fov: 44, roll: 0.03 });
// shot 11: the control room: one engineer at her desk and the wall calendar flipping, a day out, a day back
const S11 = (f: number) => dolly([CAL[0] + 0.1, Y + 1.75, 4.8], [CAL[0] - 0.3, Y + 1.7, -2.5], P(f, 1188, T_ARRIVE, 0.004), { fov: 46, roll: -0.03 });
// shot 12: space: the probe, rings full of data going home again
const S12 = (f: number) => dolly([PRB[0] - 12, PRB[1] + 1.2, PRB[2] + 2.8], [PRB[0], PRB[1] + 0.3, PRB[2] + 2.4], P(f, 1395, T_SAVED, 0.005), { fov: 50, roll: 0.03 });
// shot 13: the hall: the team and the children cheer, one day late
const S13 = (f: number) => dolly([STAGE[0] + 1.6, Y + 1.9, CROWD_Z + 7.5], [STAGE[0] + 0.2, Y + 1.8, STAGE[2] + 0.6], P(f, 1528, T_CELEB, 0.006), { fov: 46, roll: -0.03 });
// shot 14: sunset again: the dish listening, the operators beside it
const S14 = (f: number) => dolly([OPS[0] + 2.8, Y + 1.5, OPS[2] + 6.5], [OPS[0] - 1.4, Y + 2.2, OPS[2] - 4.0], pushK(f, 1687, 0.0009) * pushK(f, fr(T_LISTEN) - 3, 0, 0.003, 25), { fov: 54, roll: 0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 125, s: S2 }], 3: [{ f: 179, s: S3a }, { f: fr(T_77) - 3, dur: 40, s: S3b }], 4: [{ f: 311, s: S4 }],
  5: [{ f: 412, s: S5a }, { f: fr(T_LD) - 3, dur: 30, s: S5b }], 6: [{ f: 560, s: S6 }],
  7: [{ f: 633, s: S7a }, { f: fr(T_SIGNAL) - 3, cut: true, s: S7b }], 8: [{ f: 809, s: S8 }],
  9: [{ f: 898, s: S9a }, { f: fr(T_RINGING) - 3, dur: 30, s: S9b }], 10: [{ f: 1095, s: S10 }], 11: [{ f: 1188, s: S11 }],
  12: [{ f: 1395, s: S12 }], 13: [{ f: 1528, s: S13 }], 14: [{ f: 1687, s: S14 }],
};
/** in-shot camera cuts (frames), listed in shots.json `planned` */
export const CUT_FRAMES = [fr(T_SIGNAL) - 3];

// impact kicks: [seconds, strength]: lift-off, the dish locks on
const KICKS: [number, number][] = [[T_77 - 2 / 30, 0.3], [T_LOCK - 2 / 30, 0.2]];
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
const head = (p: V3, dy = 1.75): V3 => [p[0], p[1] + dy, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 125, cInf: 12, focus: at(PRB) },
  { f: 179, cInf: 0 },
  { f: 311, cInf: 12, focus: at([LX + 0.1, Y + 1.5, -1.6]) },
  { f: 412, cInf: 11, focus: at(PRB) },
  { f: 560, cInf: 0 },
  { f: 633, cInf: 0 },
  { f: fr(T_SIGNAL) - 3, cInf: 10, focus: at(head(OPS)) },
  { f: 809, cInf: 12, focus: at(PRB) },
  { f: 898, cInf: 13, focus: at(head(SOFA, 1.3)) },
  { f: 1095, cInf: 12, focus: at([COMP[0] - 0.6, Y + 1.6, COMP[2] + 1.2]) },
  { f: 1188, cInf: 10, focus: at([CAL[0] - 0.6, Y + 1.75, 0.1]) },
  { f: 1395, cInf: 10, focus: at(PRB) },
  { f: 1528, cInf: 11, focus: at([STAGE[0], Y + 1.75, CROWD_Z + 1.2]) },
  { f: 1687, cInf: 5, focus: at(head(OPS)) },
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
  { a: 0, b: 125, kit: "tree_default", pos: [BOWL[0] + 24, Y, BOWL[2] + 33], s: 9.0 },
  { a: 179, b: 311, kit: "plant_bushLarge", pos: [PX + 12.5, Y, 40], s: 1.6 },
  { a: 1687, b: TOTAL, kit: "tree_oak", pos: [OPS[0] + 11.5, Y, OPS[2] + 13.5], s: 7.5 },
];
