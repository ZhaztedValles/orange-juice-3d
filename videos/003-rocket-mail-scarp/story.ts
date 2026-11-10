// Timeline of "The Rocket That Mailed Letters Into the Sand": shots timed to words.json, the rocket test on Scarp,
// and the camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big
// reframes, 7-frame impact kicks that flip sign every frame.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1950;
export const D0 = 6.0; // bluff top / ground (m); the sea is at 0
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- the set ----------------
export const SNOW: V3 = [96, D0, -96]; // the hearth patch (the analogy); named SNOW for the template's sake
export const RAIL_Z = -49; // launch rail start (z); the rail points to the sea (+z), tilted up 20 degrees
export const RAIL_TILT = (20 * Math.PI) / 180;
export const IGNITE_T = 915 / 30; // "flash"
export const BURST_T = 932 / 30; // "bang"
/** rocket / letters clock: shot 1 is a teaser from after the burst; the replay (shots 11+) re-stages the burst on the word "burst" */
export const rocketClock = (id: number, t: number) => (id === 1 ? BURST_T + 0.55 + 0.85 * t : id >= 11 ? t - (1446 - 932) / 30 : t);
export const rocketPos = (rt: number): V3 => {
  const tau = Math.max(0, rt - IGNITE_T), s = 0.5 * 27 * tau * tau; // metres along the rail
  return [0, D0 + 0.95 + s * Math.sin(RAIL_TILT) + 0.0, RAIL_Z + 1.6 + s * Math.cos(RAIL_TILT)];
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "beach" | "fire";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene = "beach", light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 172), mk(2, 172, 354), mk(3, 354, 546), mk(4, 546, 750), mk(5, 750, 902), mk(6, 902, 1042), mk(7, 1042, 1160, "fire"), mk(8, 1160, 1286, "fire"),
  mk(9, 1286, 1358), mk(10, 1358, 1424), mk(11, 1424, 1561), mk(12, 1561, 1720), mk(13, 1720, 1830, "beach", "golden"), mk(14, 1830, TOTAL, "beach", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 7: 8, 9: 8, 13: 8 };
export const FLASH_AT = 172;

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
const [FX, , FZ] = SNOW;
// shot 1 (hook): letters raining on the beach, then Zucker looking up
const S1a = (f: number) => dolly([-7, Y + 1.2, -34], [0, Y + 7, -44], pushK(f, 0, 0.0025), { fov: 52 });
const S1b = (f: number) => dolly([-1.5, Y + 1.7, -37.5], [-3.5, Y + 2.4, -42], pushK(f, 96, 0.0022, 0.005, 30), { fov: 38, roll: -0.04 });
// shot 2: Scarp from the sea, then the cottages
const S2a = (f: number) => dolly([40, Y + 16, 20], [0, Y + 2, -52], pushK(f, 172, 0.0022), { fov: 46 });
const S2b = (f: number) => dolly([22, Y + 1.8, -26], [34, Y + 3.5, -44], pushK(f, 240, 0.0022), { fov: 46, roll: 0.03 });
// shot 3: Zucker, then his rocket
const S3a = (f: number) => dolly([-6.0, Y + 1.6, -33], [-3.5, Y + 1.5, -40], pushK(f, 354, 0.0025), { fov: 34 });
const S3b = (f: number) => dolly([5, Y + 1.5, -37], [0, Y + 1.5, -46.5], pushK(f, 440, 0.0022, 0.005, 30), { fov: 42, roll: -0.035 });
// shot 4: the officials, then the line of fire to Harris
const S4a = (f: number) => dolly([-9, Y + 1.6, -27], [4, Y + 1.5, -40], pushK(f, 546, 0.002), { fov: 46 });
const S4b = (f: number) => dolly([0.6, Y + 1.5, -53.5], [0, Y + 4, 20], pushK(f, 622, 0.0022), { fov: 50, roll: 0.03 });
// shot 5: packing, the fuse, everyone leaning in
const S5a = (f: number) => dolly([3, Y + 1.5, -38], [0, Y + 1.8, -45.5], pushK(f, 750, 0.002), { fov: 40 });
const S5b = (f: number) => dolly([2.4, Y + 1.0, -53], [0, Y + 1.1, -47.5], pushK(f, 811, 0.0022, 0.005, 30), { fov: 38, roll: -0.035 });
const S5c = (f: number) => dolly([-4, Y + 1.7, -31], [3, Y + 1.5, -41], pushK(f, 861, 0.002), { fov: 46 });
// shot 6: the bang
const S6a = (f: number) => dolly([-5, Y + 1.3, -40.5], [0, Y + 2.2, -46.5], pushK(f, 902, 0.002, 0.006, 30), { fov: 44 });
const S6b = (f: number) => dolly([14, Y + 3, -30], [0, Y + 3, -46], pushK(f, 944, 0.002), { fov: 50, roll: 0.03 });
const S6c = (f: number) => dolly([3.2, Y + 1.3, -43.5], [0, Y + 1.2, -48.5], pushK(f, 992, 0.0022), { fov: 44, roll: -0.03 });
// shots 7-8: the hearth
const S7a = (f: number) => dolly([FX + 1.2, Y + 1.5, FZ + 7], [FX - 1.2, Y + 1.0, FZ], pushK(f, 1042, 0.002), { fov: 40 });
const S8a = (f: number) => dolly([FX - 4.2, Y + 1.5, FZ + 7.5], [FX + 2.2, Y + 0.9, FZ], pushK(f, 1160, 0.002), { fov: 40, roll: -0.03 });
// shot 9: Zucker blames the powder
const S9a = (f: number) => dolly([-3, Y + 1.6, -32.5], [-1, Y + 1.5, -40], pushK(f, 1286, 0.0025), { fov: 36 });
// shot 10: the powder, in section
const S10a = (f: number) => dolly([0, Y + 2.0, -35], [0, Y + 1.8, -40], pushK(f, 1358, 0.002, 0.005, 30), { fov: 38, roll: 0.03 });
// shot 11: the burst again, then the confetti
const S11a = (f: number) => dolly([-5, Y + 1.3, -40.5], [0, Y + 2.2, -46.5], pushK(f, 1424, 0.002, 0.006, 30), { fov: 44 });
const S11b = (f: number) => dolly([12, Y + 4, -27], [0, Y + 3.5, -46], pushK(f, 1480, 0.0018), { fov: 52, roll: -0.03 });
// shot 12: collecting the letters, the stamp
const S12a = (f: number) => dolly([-8, Y + 1.7, -30], [2, Y + 0.8, -44], pushK(f, 1561, 0.002), { fov: 46 });
const S12b = (f: number) => dolly([1.2, Y + 1.3, -38.6], [0.6, Y + 1.0, -42], pushK(f, 1650, 0.0022, 0.005, 30), { fov: 36, roll: 0.035 });
// shot 13 (golden): Zucker among the letters
const S13a = (f: number) => dolly([-4, Y + 1.6, -33], [-1, Y + 1.4, -41], pushK(f, 1720, 0.0022), { fov: 38 });
// shot 14 (golden): pulling back over the beach
const S14a = (f: number) => dolly([6, Y + 2.0, -31], [0, Y + 0.8, -44], pushK(f, 1830, 0.002), { fov: 46, roll: 0.03 });
const S14c = (f: number): Shot => {
  const a = S14a(1880), s = glide((f - 1880) / 70);
  return { pos: [a.pos[0] + (24 - a.pos[0]) * s, a.pos[1] + (Y + 14 - a.pos[1]) * s, a.pos[2] + (-6 - a.pos[2]) * s], look: a.look, fov: (a.fov ?? 46) + 4 * s, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 96, cut: true, s: S1b }],
  2: [{ f: 172, s: S2a }, { f: 240, cut: true, s: S2b }],
  3: [{ f: 354, s: S3a }, { f: 440, cut: true, s: S3b }],
  4: [{ f: 546, s: S4a }, { f: 622, cut: true, s: S4b }],
  5: [{ f: 750, s: S5a }, { f: 811, cut: true, s: S5b }, { f: 861, cut: true, s: S5c }],
  6: [{ f: 902, s: S6a }, { f: 944, cut: true, s: S6b }, { f: 992, cut: true, s: S6c }],
  7: [{ f: 1042, s: S7a }],
  8: [{ f: 1160, s: S8a }],
  9: [{ f: 1286, s: S9a }],
  10: [{ f: 1358, s: S10a }],
  11: [{ f: 1424, s: S11a }, { f: 1480, cut: true, s: S11b }],
  12: [{ f: 1561, s: S12a }, { f: 1650, cut: true, s: S12b }],
  13: [{ f: 1720, s: S13a }],
  14: [{ f: 1830, s: S14a }, { f: 1880, dur: 70, s: S14c }],
};

// impact kicks: the bang (and its replay)
const KICKS: [number, number][] = [[BURST_T - 0.05, 0.9], [1446 / 30 - 0.05, 0.8]];
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
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 8, focus: () => [0, Y + 7, -44] },
  { f: 96, cInf: 14, focus: () => [-3.5, Y + 2.4, -42] },
  { f: 172, cInf: 0 },
  { f: 240, cInf: 0 },
  { f: 354, cInf: 12, focus: () => [-3.5, Y + 1.5, -40] },
  { f: 440, cInf: 10, focus: () => [0, Y + 1.5, -46.5] },
  { f: 546, cInf: 8 },
  { f: 622, cInf: 0 },
  { f: 750, cInf: 10, focus: () => [0, Y + 1.8, -45.5] },
  { f: 811, cInf: 13, focus: () => [0, Y + 1.1, -47.5] },
  { f: 861, cInf: 8 },
  { f: 902, cInf: 8, focus: () => [0, Y + 2.2, -46.5] },
  { f: 944, cInf: 0 },
  { f: 992, cInf: 11, focus: () => [0, Y + 1.2, -48.5] },
  { f: 1042, cInf: 11, focus: () => [FX - 1.2, Y + 1.0, FZ] },
  { f: 1160, cInf: 11, focus: () => [FX + 2.2, Y + 0.9, FZ] },
  { f: 1286, cInf: 12, focus: () => [-1, Y + 1.5, -40] },
  { f: 1358, cInf: 10, focus: () => [0, Y + 1.8, -40] },
  { f: 1424, cInf: 8, focus: () => [0, Y + 2.2, -46.5] },
  { f: 1480, cInf: 0 },
  { f: 1561, cInf: 6 },
  { f: 1650, cInf: 12, focus: () => [0.6, Y + 1.0, -42] },
  { f: 1720, cInf: 10, focus: () => [-1, Y + 1.4, -41] },
  { f: 1830, cInf: 5 },
  { f: 1880, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};


/** near framing objects: none in this film */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
