// Timeline of "Benjamin Franklin Flattened a Windy Pond With One Teaspoon of Oil": shots timed to words.json, the oil
// on the pond (the patch the wind pushes back, the calm that spreads from the windward bank), the smooth wakes at sea,
// and the camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1980;
export const D0 = 6.0; // common / ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the pond on Clapham Common: an ellipse, rx along x, rz along z; the wind blows toward -x (west) */
export const POND: V3 = [0, D0, -110];
export const PRX = 30, PRZ = 22;
export const WATER_Y = D0 - 0.18;
export const inPond = (x: number, z: number, m = 0) => ((x - POND[0]) / (PRX + m)) ** 2 + ((z - POND[2]) / (PRZ + m)) ** 2 < 1;
/** the downwind (west) and windward (east) spots on the bank */
export const WEST: V3 = [-31.4, D0, -110.5];
export const EAST: V3 = [31.2, D0, -111.0];
/** a London street of terraced houses, far from the common */
export const LON: V3 = [320, D0, -110];
/** a garden table on the common (the tablecloth, the toast, Rayleigh's tray) */
export const TAB: V3 = [-70, D0, -40];
export const TABLE_Y = D0 + 0.78;
/** the open sea, far east past the end of the land; ships sail toward +x */
export const SEA_X0 = 1000;
export const SEA_Y = D0 - 0.5;
export const SHIP0: V3 = [1400, SEA_Y, -100];
/** ship centres (x, z) at time t: 0 and 1 leave smooth wakes, 2 carries Franklin */
export const shipAt = (k: number, t: number): [number, number] => [SHIP0[0] + [0, -34, 24][k] + 1.6 * t, SHIP0[2] + [0, 26, 52][k]];

// the oil (seconds on the voice clock)
export const T_POUR_W = 23.35; // "downwind": the first pour
export const T_BACK = 25.6; // "back to the bank"
export const T_POUR_E = 29.62; // "teaspoon"
export const T_DIED = 30.65; // "ripples died"
/** calm patches as [x, z, radius, oilTint] for the water shader (radius 0 = off). Every one grows or slides smoothly. */
export const calmAt = (id: number, t: number): [number, number, number, number][] => {
  const out: [number, number, number, number][] = [];
  if (id === 1) { // the hook: the calm spreads from the windward bank, sped up
    out.push([EAST[0] - 0.5, EAST[2], 1.5 + 34 * smooth((t - 3.3) / 2.4), 0]);
  } else if (id === 5) { // the first pour: a small slick that the wind pushes back to the bank
    const u = smooth((t - T_POUR_W - 0.1) / 0.6), k = smooth((t - 24.2) / (T_BACK - 24.2));
    out.push([WEST[0] + 4.2 - 3.0 * k, WEST[2], 2.6 * u * (1 - 0.3 * k), 1]);
  } else if (id >= 6 && id <= 8) {
    const r = 0.8 * smooth((t - T_POUR_E - 0.05) / 0.5) + 44 * smooth((t - T_POUR_E - 0.4) / 4.6) ** 1.25;
    out.push([EAST[0] - 0.5, EAST[2], r, 0]);
  } else if (id === 11) {
    out.push([EAST[0] - 0.5, EAST[2], 44, 0]);
  } else if (id === 13) {
    out.push([EAST[0] - 0.5, EAST[2], 60, 0]);
  }
  return out;
};
/** smooth wakes behind ships 0 and 1 (sea shots): [x0, z0, x1, z1, half width] */
export const wakesAt = (t: number): [number, number, number, number, number][] =>
  [0, 1].map((k) => { const [x, z] = shipAt(k, t); return [x - 12, z, x - 140, z, 4.5]; });
/** wind strength 0..1 (ripple drift speed and size) */
export const windAt = (id: number) => (id >= 12 ? 0.55 : 1);

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "pond" | "london" | "sea" | "table";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene = "pond", light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 176), mk(2, 176, 325, "london"), mk(3, 325, 529, "sea"), mk(4, 529, 674), mk(5, 674, 815), mk(6, 815, 917),
  mk(7, 917, 1034), mk(8, 1034, 1117), mk(9, 1117, 1311, "table"), mk(10, 1311, 1465, "table"), mk(11, 1465, 1604),
  mk(12, 1604, 1776, "table", "golden"), mk(13, 1776, TOTAL, "pond", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 3: 8, 4: 8, 9: 8, 11: 8, 12: 8, 13: 8 };
export const FLASH_AT = 176;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- where Franklin is ----------------
/** Franklin's spot per shot at time t: [x, z, walking phase or -1 when standing] */
export const franklinAt = (id: number, t: number): [number, number, number] => {
  if (id === 1) return [EAST[0], EAST[2], -1];
  if (id === 2) return [LON[0] - 2, LON[2] + 0.5, -1];
  if (id === 4) { const u = clamp01((t - 17.6) / 4.8); return [-38 + 6.2 * u, -121 + 9.6 * u, u < 1 ? (t * 1.6) % 1 : -1]; }
  if (id === 5) return [WEST[0], WEST[2], -1];
  if (id === 6) { const u = clamp01((t - 27.15) / 1.8); return [EAST[0] - 4.5 * (1 - u), EAST[2] - 9 * (1 - u), u < 1 ? (t * 1.6) % 1 : -1]; }
  if (id === 7 || id === 8 || id === 13) return [EAST[0], EAST[2], -1];
  if (id === 11) { const u = clamp01((t - 48.9) / 3.6); return [-12 + 6 * u, -133.4, u < 1 ? (t * 1.6) % 1 : -1]; }
  return [0, -200, -1];
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
const FR = (id: number, f: number) => franklinAt(id, T(f));
// shot 1 (hook): low over the water at Franklin on the windward bank, then high: the calm spreads across the pond
const S1a = (f: number) => dolly([20.5, Y + 1.5, -104.5], [EAST[0], Y + 1.2, EAST[2]], pushK(f, 0, 0.0025, 0.006, 30), { fov: 42 });
const S1b = (f: number) => dolly([46, Y + 30, -66], [6, Y, -112], pushK(f, 96, 0.0022), { fov: 50, roll: -0.03 });
// shot 2: a London street, Franklin and his kite; then closer on him
const S2a = (f: number) => dolly([LON[0] - 16, Y + 2.4, LON[2] + 1.5], [LON[0] - 1, Y + 4.2, LON[2]], pushK(f, 176, 0.0022), { fov: 50 });
const S2b = (f: number) => dolly([LON[0] - 7.5, Y + 1.7, LON[2] + 2.2], [LON[0] - 2, Y + 1.6, LON[2] + 0.5], pushK(f, 262, 0.0025), { fov: 40, roll: 0.03 });
// shot 3: three ships at sea, two with smooth wakes; then Franklin and the captain on deck
const S3a = (f: number) => { const [x] = shipAt(0, T(f)); return dolly([x - 120, SEA_Y + 16, SHIP0[2] - 70], [x - 40, SEA_Y + 1, SHIP0[2] + 18], pushK(f, 325, 0.0018), { fov: 48 }); };
const S3b = (f: number) => { const [x, z] = shipAt(2, T(f)); return dolly([x + 1.2, SEA_Y + 9.0, z - 9.5], [x - 0.4, SEA_Y + 7.0, z + 0.2], pushK(f, 442, 0.0025), { fov: 44, roll: -0.035 }); };
// shot 4: Franklin crosses the common toward the rippling pond; then the cruet
const S4a = (f: number) => dolly([-52, Y + 3.2, -134], [-28, Y + 1, -110], pushK(f, 529, 0.002), { fov: 46 });
const S4b = (f: number) => { const [x, z] = FR(4, f); return dolly([x - 1.6, Y + 1.5, z - 4.6], [x + 0.2, Y + 1.25, z], pushK(f, 608, 0.0025, 0.006, 30), { fov: 38, roll: 0.035 }); };
// shot 5: the downwind pour, seen from over the water; then the slick pushed back against the bank
const S5a = (f: number) => dolly([-18.5, Y + 1.7, -104], [WEST[0] + 0.5, Y + 0.9, WEST[2]], pushK(f, 674, 0.0022), { fov: 42 });
const S5b = (f: number) => dolly([-24.5, Y + 2.6, -107.5], [WEST[0] + 1.5, Y - 0.2, WEST[2]], pushK(f, 755, 0.0025, 0.005, 30), { fov: 44, roll: -0.03 });
// shot 6: round to the windward side; the teaspoon
const S6a = (f: number) => dolly([16, Y + 1.8, -104], [EAST[0] - 1, Y + 1.1, EAST[2] - 3], pushK(f, 815, 0.0022), { fov: 44 });
const S6b = (f: number) => dolly([24.5, Y + 1.3, -106.5], [EAST[0] - 0.4, Y + 0.9, EAST[2]], pushK(f, 880, 0.0025, 0.006, 30), { fov: 40, roll: 0.035 });
// shot 7: the calm runs out across the water; then high: half an acre smooth as glass
const S7a = (f: number) => dolly([27, Y + 2.2, -116], [0, Y - 0.3, -108], pushK(f, 917, 0.002), { fov: 48 });
const S7b = (f: number) => dolly([52, Y + 36, -62], [4, Y, -112], pushK(f, 968, 0.0018), { fov: 52, roll: -0.03 });
// shot 8: the mystery: Franklin over the flat water
const S8a = (f: number) => dolly([24.5, Y + 1.45, -103.5], [EAST[0], Y + 1.45, EAST[2]], pushK(f, 1034, 0.0028, 0.006, 30), { fov: 38, roll: -0.035 });
// shots 9-10: the table: a tablecloth and a dragging hand; butter on toast, then the magnifier
const S9a = (f: number) => dolly([TAB[0] + 0.15, Y + 2.25, TAB[2] + 1.45], [TAB[0], TABLE_Y, TAB[2] - 0.05], pushK(f, 1117, 0.0022), { fov: 42, roll: 0.03 });
const S10a = (f: number) => dolly([TAB[0] - 0.2, Y + 2.0, TAB[2] + 1.05], [TAB[0] + 0.05, TABLE_Y, TAB[2]], pushK(f, 1311, 0.0025), { fov: 40, roll: -0.03 });
const S10b = (f: number) => dolly([TAB[0] + 0.05, Y + 1.55, TAB[2] + 0.75], [TAB[0] + 0.05, TABLE_Y + 0.2, TAB[2]], pushK(f, 1416, 0.003, 0.006, 30), { fov: 38 });
// shot 11: Franklin strolls the south bank with his bamboo cane
const S11a = (f: number) => { const [x, z] = FR(11, f); return dolly([x + 2.0, Y + 1.6, z - 6.2], [x + 0.2, Y + 1.15, z], pushK(f, 1465, 0.0022), { fov: 40, roll: 0.03 }); };
// shot 12 (golden): Lord Rayleigh's tray; then the magnifier
const S12a = (f: number) => dolly([TAB[0] + 0.6, Y + 1.95, TAB[2] + 3.2], [TAB[0], Y + 1.15, TAB[2] - 0.4], pushK(f, 1604, 0.0022), { fov: 42 });
const S12b = (f: number) => dolly([TAB[0] + 0.05, Y + 1.55, TAB[2] + 0.75], [TAB[0] + 0.05, TABLE_Y + 0.2, TAB[2]], pushK(f, 1740, 0.003, 0.006, 30), { fov: 38, roll: 0.03 });
// shot 13 (golden): Franklin on the bank by the glassy pond; his unfinished sum; the camera rises
const S13a = (f: number) => dolly([18, Y + 2.0, -101], [EAST[0], Y + 1.4, EAST[2]], pushK(f, 1776, 0.0022), { fov: 44 });
const S13b = (f: number) => dolly([25.2, Y + 1.55, -104.2], [EAST[0] - 0.2, Y + 1.7, EAST[2]], pushK(f, 1804, 0.0025, 0.005, 30), { fov: 40, roll: -0.035 });
const S13c = (f: number): Shot => {
  const a = S13b(1890), s = glide((f - 1890) / 90);
  return { pos: [a.pos[0] + (-6 - a.pos[0]) * s, a.pos[1] + (Y + 11 - a.pos[1]) * s, a.pos[2] + (-62 - a.pos[2]) * s], look: [a.look[0] + (6 - a.look[0]) * s, a.look[1] + (Y - a.look[1]) * s, a.look[2] + (-112 - a.look[2]) * s], fov: 40 + 8 * s, roll: (a.roll ?? 0) * (1 - s) };
};

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 96, cut: true, s: S1b }],
  2: [{ f: 176, s: S2a }, { f: 262, dur: 30, s: S2b }],
  3: [{ f: 325, s: S3a }, { f: 442, cut: true, s: S3b }],
  4: [{ f: 529, s: S4a }, { f: 608, cut: true, s: S4b }],
  5: [{ f: 674, s: S5a }, { f: 755, cut: true, s: S5b }],
  6: [{ f: 815, s: S6a }, { f: 880, dur: 22, s: S6b }],
  7: [{ f: 917, s: S7a }, { f: 968, cut: true, s: S7b }],
  8: [{ f: 1034, s: S8a }],
  9: [{ f: 1117, s: S9a }],
  10: [{ f: 1311, s: S10a }, { f: 1416, cut: true, s: S10b }],
  11: [{ f: 1465, s: S11a }],
  12: [{ f: 1604, s: S12a }, { f: 1740, cut: true, s: S12b }],
  13: [{ f: 1776, s: S13a }, { f: 1804, cut: true, s: S13b }, { f: 1890, dur: 90, s: S13c }],
};

// impact kicks: none in this film (a calm story)
const KICKS: [number, number][] = [];
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
const eyes = (id: number, dy = 1.62) => (f: number): V3 => { const [x, z] = FR(id, f); return [x, Y + dy, z]; };
export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: eyes(1) },
  { f: 96, cInf: 0 },
  { f: 176, cInf: 0 },
  { f: 262, dur: 30, cInf: 11, focus: eyes(2) },
  { f: 325, cInf: 0 },
  { f: 442, cInf: 10, focus: (f) => { const [x, z] = shipAt(2, T(f)); return [x - 0.4, SEA_Y + 7.2, z + 0.2]; } },
  { f: 529, cInf: 0 },
  { f: 608, cInf: 13, focus: eyes(4) },
  { f: 674, cInf: 11, focus: eyes(5) },
  { f: 755, cInf: 7, focus: () => [WEST[0] + 1.5, WATER_Y, WEST[2]] },
  { f: 815, cInf: 7, focus: eyes(6) },
  { f: 880, dur: 22, cInf: 12, focus: eyes(6) },
  { f: 917, cInf: 0 },
  { f: 1034, cInf: 13, focus: eyes(8) },
  { f: 1117, cInf: 12, focus: () => [TAB[0], TABLE_Y, TAB[2]] },
  { f: 1311, cInf: 12, focus: () => [TAB[0], TABLE_Y, TAB[2]] },
  { f: 1416, cInf: 14, focus: () => [TAB[0] + 0.05, TABLE_Y + 0.2, TAB[2]] },
  { f: 1465, cInf: 11, focus: eyes(11) },
  { f: 1604, cInf: 10, focus: () => [TAB[0], Y + 1.5, TAB[2] - 0.5] },
  { f: 1740, cInf: 14, focus: () => [TAB[0] + 0.05, TABLE_Y + 0.2, TAB[2]] },
  { f: 1776, cInf: 5, focus: eyes(13) },
  { f: 1804, cInf: 12, focus: eyes(13) },
  { f: 1890, dur: 60, cInf: 0 },
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

/** near framing objects: a bush at the edge of the common in the walk-up shot */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
