// Timeline of "In 1746 a Priest Made 200 Monks Jump at Exactly the Same Moment": shots timed to words.json, the ring of
// monks joined by iron wire on a meadow beside their monastery, the jumps (all at once), the glow along the wire, the
// Paris street where Nollet shows off his jar, the garden hose of the analogy, the guards at Versailles, and the camera
// grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2010;
export const D0 = 6.0; // meadow / street level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the ring of monks: centre, radius, count; Nollet's jar stands in the gap at angle A0 (toward +z) */
export const RC: V3 = [0, D0, -110];
export const RR = 45;
export const NM = 200;
export const A0 = Math.PI / 2;
export const ringP = (a: number, r = RR, y = D0): V3 => [RC[0] + r * Math.cos(a), y, RC[2] + r * Math.sin(a)];
/** the jar stand in the ring's gap, and Nollet beside it */
export const JS: V3 = ringP(A0);
export const NOLLET_R: V3 = [JS[0] + 0.75, D0, JS[2] + 0.35];
export const STAND_Y = D0 + 0.8;
/** the Paris street (Nollet's table and jar), the monastery garden (the hose), Versailles (the guards) */
export const PAR: V3 = [320, D0, -110];
export const PTAB: V3 = [PAR[0] + 0.7, D0, PAR[2] + 0.1];
export const GAR: V3 = [-90, D0, 40];
export const VER: V3 = [320, D0, 140];
/** the guards' line at Versailles: from the front man back along DIRV */
export const DIRV: V3 = [-0.5, 0, -0.866];
export const NG = 18;
export const guardP = (j: number): V3 => [VER[0] + DIRV[0] * 0.78 * j, D0, VER[2] + DIRV[2] * 0.78 * j];

// story beats (seconds on the voice clock, 2 frames before the word)
const L = 2 / 30;
export const T_LEAP = 3.8 - L; // "leap": the hook
export const T_TOUCH = 12.36 - L; // "Touch"
export const T_SHOCK = 13.29 - L; // "shock"
export const T_WIRE = 28.0 - L; // "touched" (the first wire)
export const T_JUMP = 35.69 - L; // "yelped"
export const T_ONE = 38.35 - L; // "one" (the aerial: all at once)
export const T_TAP = 44.98 - L; // "tap"
export const T_GUARDS = 53.98 - L; // "leap"
export const T_LIGHT = 60.73 - L; // "speed (of light)": the wire glows
export const T_MILE = 62.24 - L; // "mile": the last jump
/** monk k's place on the ring (angle) */
export const monkA = (k: number) => A0 + (2 * Math.PI * (k + 0.75)) / (NM + 0.5);
/** jump height (m) for a jump at t0: up and down in 0.42 s */
export const hop = (t: number, t0: number) => { const u = (t - t0) / 0.42; return u > 0 && u < 1 ? 0.55 * Math.sin(Math.PI * u) : 0; };
/** the jump times of the ring in a shot */
export const JUMPS: Record<number, number[]> = { 1: [T_LEAP], 9: [T_JUMP], 10: [T_ONE], 15: [T_MILE] };
/** monk k: position (feet) at time t in shot id, walking flag */
export const monkAt = (id: number, t: number, k: number): { p: V3; walk: number } => {
  const a = monkA(k);
  if (id === 5) { // lining up: each walks out to his place on the ring
    const t0 = 18.0 + 0.9 * ((k * 37) % 11) / 11, u = clamp01((t - t0) / 2.6), r = RR - 5 + 5 * smooth(u);
    return { p: ringP(a, r), walk: u > 0 && u < 1 ? ((t - t0) * 1.6) % 1 : -1 };
  }
  let y = D0;
  for (const t0 of JUMPS[id] ?? []) y += hop(t, t0);
  return { p: ringP(a, RR, y), walk: -1 };
};
/** the wire glows (0..1) when the shock runs through it */
export const glowAt = (id: number, t: number) => {
  let g = 0;
  for (const t0 of JUMPS[id] ?? []) g = Math.max(g, clamp01(1 - (t - t0 + 0.07) / 0.3) * (t >= t0 - 0.07 ? 1 : 0));
  if (id === 15) g = Math.max(g, (t >= T_LIGHT ? 1 : 0) * clamp01(1 - (t - T_LIGHT) / 0.6));
  if (id === 7) g = Math.max(g, (t >= T_WIRE ? 1 : 0) * clamp01(1 - (t - T_WIRE) / 0.35) * 0.5);
  return g;
};
/** the garden tap opens (0..1) */
export const tapAt = (t: number) => smooth((t - T_TAP) / 0.25);

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "ring" | "paris" | "garden" | "versailles";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 188, "ring"), mk(2, 188, 366, "paris"), mk(3, 366, 455, "paris"), mk(4, 455, 545, "paris"),
  mk(5, 545, 680, "ring"), mk(6, 680, 795, "ring"), mk(7, 795, 888, "ring"), mk(8, 888, 1020, "ring"),
  mk(9, 1020, 1140, "ring"), mk(10, 1140, 1200, "ring"), mk(11, 1200, 1335, "garden"), mk(12, 1335, 1505, "garden"),
  mk(13, 1505, 1655, "versailles", "golden"), mk(14, 1655, 1750, "versailles", "golden"), mk(15, 1750, TOTAL, "ring", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 5: 8, 11: 8, 13: 8, 15: 8 };
export const FLASH_AT = 188;

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
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const Y = D0;
const add = (p: V3, dx: number, dy: number, dz: number): V3 => [p[0] + dx, p[1] + dy, p[2] + dz];

// shot 1 (hook): the whole ring from high above; then low over the near arc as every monk leaps
const S1a = (f: number) => dolly([22, Y + 62, JS[2] + 58], [0, Y, RC[2] + 14], pushK(f, 0, 0.0022), { fov: 46 });
const S1b = (f: number) => dolly([9, Y + 4.6, JS[2] + 11], [-7, Y + 0.9, JS[2] - 6], pushK(f, 96, 0.0025, 0.006, 30), { fov: 42, roll: 0.03 });
// shot 2: a Paris street: Nollet at his table with the jar; then the jar
const S2a = (f: number) => dolly([PAR[0] + 1.8, Y + 2.0, PAR[2] + 8.6], [PAR[0] + 0.1, Y + 1.25, PAR[2]], pushK(f, 188, 0.0022), { fov: 40 });
const S2b = (f: number) => dolly([PTAB[0] + 0.45, Y + 1.3, PTAB[2] + 2.3], [PTAB[0], Y + 1.05, PTAB[2]], pushK(f, 300, 0.0028, 0.006, 30), { fov: 38, roll: -0.03 });
// shot 3: a gentleman touches the jar and jumps
const S3a = (f: number) => dolly([PAR[0] + 1.9, Y + 1.6, PAR[2] + 4.8], [PAR[0] + 1.0, Y + 1.2, PAR[2] + 0.4], pushK(f, 366, 0.0025, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 4: Nollet wonders how fast it travels
const S4a = (f: number) => dolly([PAR[0] - 0.2, Y + 1.8, PAR[2] + 3.6], [PAR[0] - 0.25, Y + 1.75, PAR[2]], pushK(f, 455, 0.0028, 0.006, 30), { fov: 40, roll: -0.035 });
// shot 5: the monks walk out into a giant ring
const S5a = (f: number) => dolly([24, Y + 24, JS[2] + 36], [0, Y, RC[2] + 8], pushK(f, 545, 0.002), { fov: 46 });
// shot 6: along the ring: each monk holds an iron wire to the next
const S6a = (f: number) => { const a = A0 + 0.32 - 0.12 * glide((f - 680) / 115); return dolly(ringP(a, RR + 3.2, Y + 1.4), ringP(a - 0.012, RR, Y + 1.0), pushK(f, 680, 0.002), { fov: 40, roll: 0.03 }); };
// shot 7: Nollet charges the jar and touches it to the first wire
const S7a = (f: number) => dolly([JS[0] + 0.9, Y + 1.5, JS[2] + 3.9], [JS[0] + 0.25, Y + 1.15, JS[2]], pushK(f, 795, 0.0025, 0.006, 30), { fov: 40 });
// shot 8: Nollet imagines a wave running round the ring
const S8a = (f: number) => dolly([NOLLET_R[0] - 0.1, Y + 1.85, NOLLET_R[2] + 4.2], [NOLLET_R[0] - 0.3, Y + 1.85, NOLLET_R[2]], pushK(f, 888, 0.0025), { fov: 42, roll: -0.03 });
// shot 9: down the line of monks: all of them jump at once
const S9a = (f: number) => dolly(ringP(A0 - 0.3, RR + 5.0, Y + 1.7), ringP(A0 + 0.16, RR - 1.5, Y + 1.0), pushK(f, 1020, 0.0022, 0.006, 30), { fov: 34, roll: 0.035 });
// shot 10: from above: not one monk behind
const S10a = (f: number) => dolly([-26, Y + 58, JS[2] + 52], [-4, Y, RC[2] + 12], pushK(f, 1140, 0.003, 0.006, 30), { fov: 46, roll: -0.03 });
// shots 11-12: the monastery garden: a hose from the tap on the wall to a monk at the far end
const S11a = (f: number) => dolly([GAR[0] + 5.2, Y + 2.6, GAR[2] + 5.4], [GAR[0] + 0.6, Y + 0.8, GAR[2] - 2.4], pushK(f, 1200, 0.0022), { fov: 44 });
const S12a = (f: number) => dolly([GAR[0] + 4.6, Y + 1.9, GAR[2] + 4.8], [GAR[0] + 0.6, Y + 0.9, GAR[2] - 2.2], pushK(f, 1335, 0.0022, 0.006, 30), { fov: 44, roll: 0.03 });
// shot 13 (golden): Versailles: the line of guards holding hands, the king watching
const S13a = (f: number) => dolly([VER[0] + 2.6, Y + 1.9, VER[2] + 6.4], [VER[0] - 2.4, Y + 1.25, VER[2] - 5.0], pushK(f, 1505, 0.0022), { fov: 42 });
const S13b = (f: number) => dolly([VER[0] + 1.4, Y + 1.5, VER[2] + 3.6], [VER[0] - 1.6, Y + 1.2, VER[2] - 3.4], pushK(f, 1590, 0.0025, 0.006, 30), { fov: 40, roll: -0.035 });
// shot 14 (golden): Nollet: instant!
const S14a = (f: number) => dolly([VER[0] + 1.6, Y + 1.7, VER[2] + 3.6], [VER[0] + 0.9, Y + 1.75, VER[2] + 0.7], pushK(f, 1655, 0.0028, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 15 (golden): the ring once more; the camera rises as the light runs through the wire and they all jump
const S15a = (f: number) => dolly([14, Y + 9, JS[2] + 16], [-4, Y + 1.0, JS[2] - 8], pushK(f, 1750, 0.002), { fov: 44 });
const S15b = (f: number): Shot => {
  const s = glide((f - 1790) / 70);
  return { pos: [14 + 18 * s, Y + 9 + 70 * s, JS[2] + 16 + 50 * s], look: [-4 + 4 * s, Y + 1 - 1 * s, JS[2] - 8 - 37 * s], fov: 44 + 2 * s, roll: 0 };
};
const S15c = (f: number) => { const a = S15b(1860); return dolly(a.pos, a.look, pushK(f, 1860, 0.0018, 0.005, 30), { fov: 46 }); };

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 96, cut: true, s: S1b }],
  2: [{ f: 188, s: S2a }, { f: 300, cut: true, s: S2b }],
  3: [{ f: 366, s: S3a }],
  4: [{ f: 455, s: S4a }],
  5: [{ f: 545, s: S5a }],
  6: [{ f: 680, s: S6a }],
  7: [{ f: 795, s: S7a }],
  8: [{ f: 888, s: S8a }],
  9: [{ f: 1020, s: S9a }],
  10: [{ f: 1140, s: S10a }],
  11: [{ f: 1200, s: S11a }],
  12: [{ f: 1335, s: S12a }],
  13: [{ f: 1505, s: S13a }, { f: 1590, cut: true, s: S13b }],
  14: [{ f: 1655, s: S14a }],
  15: [{ f: 1750, s: S15a }, { f: 1790, dur: 70, s: S15b }, { f: 1860, s: S15c }],
};

// impact kicks: [seconds, strength]: the hook leap, the gentleman's shock, the ring's jump, the tap, the guards, the last jump
const KICKS: [number, number][] = [[T_LEAP, 0.6], [T_SHOCK, 1], [T_JUMP, 1], [T_ONE, 0.5], [T_TAP, 0.4], [T_GUARDS, 0.8], [T_MILE, 0.5]];
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
void add;

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (p: V3, dy = 1.75): (() => V3) => () => [p[0], D0 + dy, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 96, cInf: 7, focus: () => [0, D0 + 1.7, JS[2] - 1] },
  { f: 188, cInf: 10, focus: eyes(PAR) },
  { f: 300, cInf: 13, focus: () => [PTAB[0], D0 + 1.05, PTAB[2]] },
  { f: 366, cInf: 12, focus: eyes([PAR[0] + 1.5, D0, PAR[2] + 0.8]) },
  { f: 455, cInf: 14, focus: eyes(PAR, 1.85) },
  { f: 545, cInf: 0 },
  { f: 680, cInf: 11, focus: () => ringP(A0 + 0.25, RR, D0 + 1.6) },
  { f: 795, cInf: 12, focus: eyes(NOLLET_R) },
  { f: 888, cInf: 12, focus: eyes(NOLLET_R) },
  { f: 1020, cInf: 0 },
  { f: 1200, cInf: 0 },
  { f: 1335, cInf: 7, focus: () => [GAR[0] + 1.5, D0 + 1.3, GAR[2] + 0.9] },
  { f: 1505, cInf: 0 },
  { f: 1590, cInf: 10, focus: () => [VER[0], D0 + 1.7, VER[2]] },
  { f: 1655, cInf: 13, focus: eyes([VER[0] + 0.9, D0, VER[2] + 0.7]) },
  { f: 1750, cInf: 5, focus: () => [0, D0 + 1.6, JS[2] - 2] },
  { f: 1790, dur: 40, cInf: 0 },
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
  { a: 188, b: 300, kit: "lantern", pos: [PAR[0] + 3.4, D0, PAR[2] + 5.2], s: 2.8 },
  { a: 1200, b: 1505, kit: "plant_bushDetailed", pos: [GAR[0] + 4.0, D0, GAR[2] + 3.0], s: 1.0 },
  { a: 1505, b: 1590, kit: "hedge", pos: [VER[0] + 2.9, D0, VER[2] + 3.4], s: 1.2 },
];
