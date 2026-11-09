// Timeline of "The Fern That Lived in a Sealed Bottle": shots timed to words.json, the fern growth, the ship's departure
// and the camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big
// reframes, 7-frame impact kicks that flip sign every frame.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1890;
export const D0 = 6.0; // quay top (m)
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

// ---------------- set positions ----------------
export const TABLE: V3 = [0, D0, -33.4];
export const TABLE_H = 0.9;
export const BOTTLE: V3 = [0, D0 + TABLE_H, -33.4]; // base of the bottle card
export const BOTTLE_H = 0.85;
export const GARDEN: V3 = [-8.6, D0, -34.2];
export const MIRROR: V3 = [3.4, D0 + 1.55, -33.4];
export const STAND: V3 = [10, D0, -34.0];
export const DECK_Y = 3.0;
export const SHIP_Z = -13.0;
export const shipX = (t: number) => (t < 44.3 ? 4 : 4 - 0.7 * (t - 44.3));

// ---------------- story physics ----------------
/** fern growth 0..1 as the narration tells it: nothing, a speck (17.3 s), unrolling (19.9 s), grass (21.2 s), thriving */
export const fernU = (t: number) =>
  lin([[16.0, 0], [17.3, 0.0], [17.98, 0.1], [19.3, 0.2], [20.9, 0.42], [22.3, 0.55], [26.9, 0.62], [29.9, 0.78], [33.5, 0.93], [34.3, 1]], t);
export const POT_T = 55.9; // "and after, nearly all did"
export const PUPA_IN = 12.93; // dropped into the bottle
export const LID_T = 14.9; // screwed on ("tight")
export const DISH_T = 11.47; // the pupa in its dish of soil ("pupa")

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "table" | "dock" | "garden" | "mirror" | "cycle" | "ship" | "deck" | "pots" | "finale";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; tau: (t: number) => number };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene, tau: (t) => t });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 168, "table"), mk(2, 168, 322, "dock"), mk(3, 322, 480, "table"), mk(4, 480, 580, "table"), mk(5, 580, 684, "table"),
  mk(6, 684, 806, "garden"), mk(7, 806, 896, "table"), mk(8, 896, 1028, "table"), mk(9, 1028, 1157, "mirror"), mk(10, 1157, 1329, "cycle"),
  mk(11, 1329, 1420, "ship", "golden"), mk(12, 1420, 1530, "deck", "golden"), mk(13, 1530, 1677, "pots"), mk(14, 1677, 1737, "pots"),
  mk(15, 1737, TOTAL, "finale"),
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 8, 6: 8, 9: 6, 10: 6, 11: 8, 12: 8, 13: 8, 15: 8 };
export const FLASH_AT = 168;

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
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

const BM: V3 = [0, D0 + 1.35, -33.4]; // bottle middle
const WM: V3 = [0.95, D0 + 1.5, -33.4]; // Ward's face height at the table

// shot 1 (hook): MS of Ward and the bottle -> CU of the bottle on "lived for three years"
const S1a = (f: number) => dolly([1.2, D0 + 1.7, -29.6], [0.5, D0 + 1.4, -33.4], pushK(f, 0, 0.0025), { fov: 40 });
const S1b = (f: number) => dolly([0.5, D0 + 1.5, -30.9], BM, pushK(f, 100, 0.0022, 0.005, 30), { fov: 36, roll: -0.04 });
// shot 2: aerial of the dock, then Ward at his table ("Doctor Ward collects bugs")
const S2a = (f: number) => zoom([30, D0 + 11, 10], [-1, D0 - 1, -20], 46, pushK(f, 164, 0.0022));
const S2b = (f: number) => dolly([0.2, D0 + 1.7, -29.3], [0.9, D0 + 1.5, -33.4], pushK(f, 228, 0.0022), { fov: 38, roll: 0.03 });
// shot 3: Ward with the dish and the empty bottle -> bottle CU -> lid CU
const S3a = (f: number) => dolly([1.7, D0 + 1.7, -29.6], [0.4, D0 + 1.45, -33.4], pushK(f, 322, 0.0025), { fov: 40 });
const S3b = (f: number) => dolly([0.4, D0 + 1.5, -30.8], BM, pushK(f, 383, 0.0022), { fov: 34, roll: 0.03 });
const S3c = (f: number) => dolly([0.6, D0 + 1.75, -31.0], [0, D0 + 1.75, -33.4], pushK(f, 428, 0.0025), { fov: 32, roll: -0.035 });
// shots 4, 5, 7: the bottle growing
const S4a = (f: number) => dolly([0.7, D0 + 1.45, -30.6], BM, pushK(f, 480, 0.002, 0.005, 30), { fov: 34 });
const S5a = (f: number) => dolly([-0.6, D0 + 1.55, -30.7], BM, pushK(f, 580, 0.0022), { fov: 34, roll: 0.035 });
const S7a = (f: number) => dolly([0.9, D0 + 1.4, -30.9], BM, pushK(f, 806, 0.0022), { fov: 36, roll: -0.03 });
// shot 6: Ward's garden, dying in the smoke
const S6a = (f: number) => zoom([-6.2, D0 + 2.2, -28.6], [-8.4, D0 + 0.9, -34.2], 44, pushK(f, 684, 0.0022));
const S6b = (f: number) => dolly([-7.9, D0 + 1.3, -31.3], [-8.5, D0 + 0.8, -34.2], pushK(f, 745, 0.0022), { fov: 36, roll: 0.03 });
// shot 8: Ward stumped
const S8a = (f: number) => dolly([0.2, D0 + 1.7, -29.9], [0.75, D0 + 1.5, -33.4], pushK(f, 896, 0.002, 0.006, 30), { fov: 36 });
const S8b = (f: number) => dolly([0.9, D0 + 1.65, -30.6], [0.9, D0 + 1.6, -33.4], pushK(f, 972, 0.0025, 0.005, 30), { fov: 34, roll: -0.035 });
// shot 9: the mirror
const S9a = (f: number) => dolly([MIRROR[0] + 0.2, MIRROR[1], -29.4], [MIRROR[0], MIRROR[1] - 0.05, -33.4], pushK(f, 1028, 0.0022), { fov: 38 });
// shot 10: the water goes round
const S10a = (f: number) => dolly([0.3, D0 + 1.5, -30.4], BM, pushK(f, 1157, 0.002), { fov: 33, roll: 0.03 });
const S10b = (f: number) => dolly([-0.4, D0 + 1.6, -30.8], [0, D0 + 1.45, -33.4], pushK(f, 1250, 0.002), { fov: 38, roll: -0.035 });
// shot 11: the ship leaves (golden), shot 12: the captain's letter
const S11a = (f: number) => { const x = shipX(T(f)); return zoom([x + 33, 9, -39], [x - 1, 4.2, -13], 44, pushK(f, 1325, 0.0016)); };
const S12a = (f: number) => { const x = shipX(T(f)); return dolly([x + 3.4, DECK_Y + 1.7, SHIP_Z + 3.4], [x + 0.9, DECK_Y + 1.5, SHIP_Z], pushK(f, 1420, 0.0022), { fov: 40 }); };
const S12b = (f: number) => { const x = shipX(T(f)); return dolly([x + 2.2, DECK_Y + 1.45, SHIP_Z + 3.0], [x + 0.9, DECK_Y + 1.4, SHIP_Z], pushK(f, 1460, 0.0025, 0.005, 30), { fov: 34, roll: 0.035 }); };
// shots 13-14: the stand of pots, wilted then green (one camera across the change)
const S13a = (f: number) => dolly([10.4, D0 + 1.7, -28.4], [10, D0 + 1.35, -34.0], pushK(f, 1530, 0.002), { fov: 54 });
const S13b = (f: number) => dolly([10.6, D0 + 1.5, -28.2], [10, D0 + 1.3, -34.0], pushK(f, 1618, 0.0022, 0.005, 30), { fov: 54, roll: -0.03 });
// shot 15: the finale, crane out from the bottle
const S15a = (f: number) => dolly([0.5, D0 + 1.5, -30.9], BM, pushK(f, 1737, 0.002), { fov: 36 });
const S15b = (f: number): Shot => {
  const a = S15a(1790), s = glide((f - 1790) / 100);
  return { pos: [a.pos[0] + (2.6 - a.pos[0]) * s, a.pos[1] + (D0 + 2.9 - a.pos[1]) * s, a.pos[2] + (-26.4 - a.pos[2]) * s],
    look: [a.look[0] + (0.4 - a.look[0]) * s, a.look[1] + (D0 + 1.1 - a.look[1]) * s, a.look[2]], fov: (a.fov ?? 36) + (46 - (a.fov ?? 36)) * s, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 90, dur: 28, s: S1b }],
  2: [{ f: 164, s: S2a }, { f: 228, cut: true, s: S2b }],
  3: [{ f: 322, s: S3a }, { f: 383, cut: true, s: S3b }, { f: 428, cut: true, s: S3c }],
  4: [{ f: 480, s: S4a }],
  5: [{ f: 580, s: S5a }],
  6: [{ f: 684, s: S6a }, { f: 745, cut: true, s: S6b }],
  7: [{ f: 806, s: S7a }],
  8: [{ f: 896, s: S8a }, { f: 972, cut: true, s: S8b }],
  9: [{ f: 1028, s: S9a }],
  10: [{ f: 1157, s: S10a }, { f: 1250, dur: 26, s: S10b }],
  11: [{ f: 1325, s: S11a }],
  12: [{ f: 1420, s: S12a }, { f: 1460, cut: true, s: S12b }],
  13: [{ f: 1530, s: S13a }, { f: 1618, dur: 26, s: S13b }],
  15: [{ f: 1737, s: S15a }, { f: 1790, cut: true, s: rolled(S15a, 0) }, { f: 1790, dur: 100, s: S15b }],
};
CAMS[14] = CAMS[13];
void [rolled];

// impact kicks: the lid goes on
const KICKS: [number, number][] = [[LID_T, 0.7]];
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
  { f: 0, cInf: 12, focus: () => [0.5, D0 + 1.4, -33.4] },
  { f: 90, dur: 28, cInf: 15, focus: () => BM },
  { f: 168, cInf: 0 },
  { f: 228, cInf: 10, focus: () => WM },
  { f: 322, cInf: 10, focus: () => [0.4, D0 + 1.45, -33.4] },
  { f: 383, cInf: 14, focus: () => BM },
  { f: 480, cInf: 15, focus: () => BM },
  { f: 684, cInf: 0 },
  { f: 745, cInf: 12 },
  { f: 806, cInf: 15, focus: () => BM },
  { f: 896, cInf: 11, focus: () => WM },
  { f: 1028, cInf: 12 },
  { f: 1157, cInf: 15, focus: () => BM },
  { f: 1329, cInf: 0 },
  { f: 1420, cInf: 8 },
  { f: 1530, cInf: 0 },
  { f: 1737, cInf: 14, focus: () => BM },
  { f: 1790, dur: 100, cInf: 0 },
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

/** near framing objects: none in this film (the table, shelf and ship carry the foreground) */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
