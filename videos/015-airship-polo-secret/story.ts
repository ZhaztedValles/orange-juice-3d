// Timeline of "She Flew Over Paris Before the Wright Brothers. Her Parents Hid It for Decades": shots timed to
// words.json. Five places, far apart on one big ground: a Paris street of cream and grey-roofed houses with a pavement
// cafe, the airship shed on the grass at Neuilly (and the road beside it), the polo field at Bagatelle (white boards,
// goal posts, a striped stand, trees round it), the family's parlour (an open-topped room) and, thirty years on, a
// dining room (open-topped, a long table with candles). The airship is a real 3D model (world.ts) posed by shipAt.
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes,
// flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2030;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** Paris: a street along x through z = 0 (road z -4.5..4.5, pavements to 8.4, house fronts at 8.4) */
export const PAR: V3 = [0, D0, 0];
/** the pavement cafe on the south side: Santos-Dumont's table */
export const CAFE: V3 = [24, D0, 6.6];
/** Neuilly: the grass in front of the airship shed (the shed's open front at z = FLD[2] - 8); the road at z = FLD[2] + 22 */
export const FLD: V3 = [0, D0, 320];
/** Bagatelle: the middle of the polo field (the stand behind at z = POLO[2] - 24) */
export const POLO: V3 = [330, D0, 320];
/** the parlour (open-topped): back wall at z = PARL[2] - 3 */
export const PARL: V3 = [420, D0, -320];
/** the dining room thirty years on (open-topped): back wall at z = DIN[2] - 3, the table along x at z = DIN[2] */
export const DIN: V3 = [-420, D0, -320];

// story beats (seconds on the voice clock)
export const T_FLEW = 4.09; // "flew"
export const T_PARENTS = 5.45; // "parents"
export const T_NOBODY = 6.28; // "nobody"
export const T_AIDA = 9.19; // "Aida"
export const T_LOVES = 13.07; // "loves"
export const T_TINY = 14.97; // "tiny"
export const T_LUNCH = 16.4; // "lunch"
export const T_ASKS = 18.39; // "asks"
export const T_THREE = 20.39; // "three"
export const T_ALONE = 21.8; // "alone."
export const T_CHASES = 22.76; // "chases"
export const T_WAVING = 24.16; // "waving"
export const T_SHOUTING = 25.19; // "shouting"
export const T_POLO = 28.25; // "polo"
export const T_MIDDLE = 30.15; // "middle"
export const T_CHEERS = 31.74; // "cheers"
export const T_HELPS = 32.2; // "helps"
export const T_FIRST = 34.04; // "first"
export const T_HEAR = 37.3; // "hear"
export const T_PRINTED = 40.67; // "printed"
export const T_BORN = 43.44; // "born,"
export const T_MARRIED = 44.12; // "married,"
export const T_DIED = 45.21; // "died."
export const T_PHOTO = 47.45; // "photo"
export const T_DELETE = 48.42; // "delete,"
export const T_FEARED = 49.4; // "feared"
export const T_MARRY = 50.35; // "marry"
export const T_SAY = 53.61; // "say"
export const T_NAME = 53.85; // "name."
export const T_THIRTY = 57.31; // "thirty"
export const T_OFFICER = 59.59; // "officer"
export const T_BRAGGED = 60.51; // "bragged"
export const T_AIRSHIPS = 61.2; // "airships."
export const T_SMILED = 62.36; // "smiled,"
export const T_TOLD = 63.23; // "told"
export const T_FIRST2 = 64.19; // "first."

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "paris" | "field" | "polo" | "parlour" | "dinner";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 161, "paris"), mk(2, 161, 225, "parlour"), mk(3, 225, 372, "paris"), mk(4, 372, 543, "paris"),
  mk(5, 543, 630, "field"), mk(6, 630, 676, "field"), mk(7, 676, 804, "field"), mk(8, 804, 873, "polo"),
  mk(9, 873, 1010, "polo"), mk(10, 1010, 1096, "polo"), mk(11, 1096, 1148, "parlour"), mk(12, 1148, 1380, "parlour"),
  mk(13, 1380, 1550, "parlour"), mk(14, 1550, 1641, "paris"), mk(15, 1641, 1863, "dinner"), mk(16, 1863, TOTAL, "dinner"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 5: 8, 8: 8, 11: 8, 14: 8, 15: 10 };
export const FLASH_AT = 225;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the airship ----------------
/** the airship No. 9: the basket floor at (x, y, z), bow along +x turned by yaw; null when it is not in the shot */
export type ShipPose = { x: number; y: number; z: number; yaw: number; pitch: number; prop: number } | null;
const T6 = 630 / FPS, T7 = 676 / FPS, T8 = 804 / FPS;
/** where the airship is on the road shot (7): drifting +x above the road at the bicycle's pace */
export const chaseX = (t: number) => FLD[0] + 6 + 3.2 * (t - T7);
export const shipAt = (id: number, t: number): ShipPose => {
  const bob = 0.08 * Math.sin(t * 1.3), pr = t * 9;
  if (id === 1) return { x: -17 + 2.6 * t, y: D0 + 14.5 + bob, z: -14, yaw: 0.05, pitch: 0.02 * Math.sin(t * 0.9), prop: pr };
  if (id === 4 || id === 14) return { x: CAFE[0] - 1.0, y: D0 + 17.5 - 2.0 * smooth((t - 12.4) / 5.5) + bob, z: 15.5, yaw: 0, pitch: 0.02 * Math.sin(t * 0.8), prop: pr };
  if (id === 5) return { x: FLD[0], y: D0, z: FLD[2], yaw: 0, pitch: 0, prop: 0 };
  if (id === 6) { const u = smooth((t - T6 + 0.1) / 1.6); return { x: FLD[0] + 0.6 * u, y: D0 + 6.5 * u, z: FLD[2], yaw: 0, pitch: -0.04 * u, prop: pr * u }; }
  if (id === 7) return { x: chaseX(t), y: D0 + 6.2 + bob, z: FLD[2] + 21.0, yaw: 0, pitch: 0.02 * Math.sin(t), prop: pr };
  if (id === 8) return { x: POLO[0] - 58 + 4.2 * (t - T8), y: D0 + 15 - 1.2 * (t - T8), z: POLO[2] - 4, yaw: 0.1, pitch: 0.03, prop: pr };
  if (id === 9) {
    const u = smooth((t - 29.05) / 1.1);
    return { x: POLO[0] - 9 * (1 - u), y: D0 + 7.5 * (1 - u) ** 1.5, z: POLO[2], yaw: 0.1 * (1 - u), pitch: 0.05 * (1 - u), prop: pr * (1 - 0.8 * u) };
  }
  if (id === 10) return { x: POLO[0], y: D0, z: POLO[2], yaw: 0, pitch: 0, prop: t * 1.5 };
  return null;
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
export const fr = (t: number) => Math.round(t * FPS);
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const add = (a: V3, x: number, y: number, z: number): V3 => [a[0] + x, a[1] + y, a[2] + z];
const shipC = (id: number, f: number, dy = 2.6): V3 => { const s = shipAt(id, T(f))!; return [s.x, s.y + dy, s.z]; };
/** a look point d metres from pos toward tgt (keeps the push-ins small when the subject is far away) */
const aim = (pos: V3, tgt: V3, d: number): V3 => {
  const v = tgt.map((x, i) => x - pos[i]), n = Math.hypot(...v) || 1;
  return pos.map((x, i) => x + (v[i] / n) * d) as V3;
};
/** Aida and her mother strolling along the south pavement in shot 3 */
export const strollX = (t: number) => -4 + 0.9 * (t - 225 / FPS);
const Y = D0;
// shot 1 (hook): from the pavement, up past the rooftops: the little airship sails along the street, a girl in its basket
const S1a = (f: number) => { const p: V3 = [-7, Y + 1.6, 7.6]; const s = shipC(1, f, 0.6); return dolly(p, aim(p, s, 14), pushK(f, 0, 0.0016, 0.004, 30), { fov: 50, roll: 0.03 }); };
// shot 2: the parlour: her parents, stern, a finger to the lips
const S2a = (f: number) => dolly(add(PARL, 0.15, 1.75, 2.7), add(PARL, 0, 1.55, -1.5), pushK(f, 161, 0.0026, 0.007, 25), { fov: 42, roll: -0.03 });
// shot 3: June 1903: Aida and her mother stroll along a Paris pavement
const S3a = (f: number) => { const x = strollX(T(f)); return dolly([x + 2.2, Y + 1.8, 1.4], [x + 0.2, Y + 1.5, 6.6], pushK(f, 225, 0.0018, 0.004, 30), { fov: 46, roll: 0.03 }); };
// shot 4: the pavement cafe: Santos-Dumont at his table, his airship tied up above the street, Parisians waving
const S4a = (f: number) => dolly(add(CAFE, -1.5, 1.5, -13.6), add(CAFE, -0.8, 6.0, 3.0), pushK(f, 372, 0.0018, 0.004, 30), { fov: 62, roll: -0.03 });
// shot 5: Neuilly: the airship on the grass before its shed; she asks, he teaches
const S5a = (f: number) => dolly(add(FLD, 3.0, 1.8, 14.5), add(FLD, 0.3, 2.9, 1.5), pushK(f, 543, 0.0018, 0.004, 30), { fov: 50, roll: 0.03 });
// shot 6: up she goes, alone; he waves from the grass
const S6a = (f: number) => dolly(add(FLD, 4.5, 1.5, 14.5), add(FLD, 0.8, 4.4, 1.0), pushK(f, 630, 0.0022, 0.006, 25), { fov: 56, roll: -0.04 });
// shot 7: the road beside the park: he pedals after her, the airship above him
const S7a = (f: number) => { const x = chaseX(T(f)); return dolly([x + 3.0, Y + 2.2, FLD[2] + 36], [x - 0.6, Y + 5.2, FLD[2] + 21.5], pushK(f, 676, 0.0012, 0.003, 30), { fov: 58, roll: 0.03 }); };
// shot 8: Bagatelle: over the treetops toward the polo field
const S8a = (f: number) => { const p = add(POLO, 12, 1.7, 16); return dolly(p, aim(p, shipC(8, f, 0.5), 16), pushK(f, 804, 0.0012, 0.003, 30), { fov: 40, roll: 0.03 }); };
// shot 9: down in the middle of the match; the crowd runs to the basket
const S9a = (f: number) => dolly(add(POLO, 6.0, 1.8, 12.5), add(POLO, -0.6, 2.6, 0), pushK(f, 873, 0.0016, 0.004, 30), { fov: 52, roll: -0.03 });
// shot 10: Aida by the basket, the crowd cheering: the first woman to pilot a powered aircraft
const S10a = (f: number) => dolly(add(POLO, 2.6, 1.75, 5.6), add(POLO, 1.3, 1.6, 1.4), pushK(f, 1010, 0.0024, 0.006, 30), { fov: 42, roll: 0.03 });
// shot 11: the parlour: her parents hear about it
const S11a = (f: number) => dolly(add(PARL, 0.9, 1.8, 3.4), add(PARL, 0.1, 1.5, -1.5), pushK(f, 1096, 0.0026, 0.007, 25), { fov: 44, roll: -0.03 });
// shot 12: you see: the father's newspaper; born, married, died
const S12a = (f: number) => dolly(add(PARL, -0.25, 2.0, 3.7), add(PARL, -0.45, 2.0, -1.5), pushK(f, 1148, 0.0016, 0.004, 30), { fov: 46, roll: 0.03 });
// shot 13: the mother and the photo that can never be deleted; no man would marry her
const S13a = (f: number) => dolly(add(PARL, 0.6, 1.95, 3.7), add(PARL, 0.3, 1.9, -1.5), pushK(f, 1380, 0.0018, 0.004, 30), { fov: 44, roll: -0.03 });
// shot 14: the cafe again: Santos-Dumont keeps her name to himself
const S14a = (f: number) => dolly(add(CAFE, -1.2, 1.7, -3.8), add(CAFE, 0.1, 1.6, 0.2), pushK(f, 1550, 0.0022, 0.005, 30), { fov: 44, roll: 0.03 });
// shot 15: thirty years on: dinner; a young navy officer brags about airships
const S15a = (f: number) => dolly(add(DIN, 0.2, 2.1, 7.2), add(DIN, 0.0, 1.55, -1.0), pushK(f, 1641, 0.0016, 0.004, 30), { fov: 46, roll: 0.03 });
// shot 16: Aida smiles, and tells him who did it first
const S16a = (f: number) => dolly(add(DIN, -0.5, 1.95, 2.3), add(DIN, -1.0, 1.78, -1.0), pushK(f, 1863, 0.0024, 0.006, 30), { fov: 42, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }], 2: [{ f: 161, s: S2a }], 3: [{ f: 225, s: S3a }], 4: [{ f: 372, s: S4a }],
  5: [{ f: 543, s: S5a }], 6: [{ f: 630, s: S6a }], 7: [{ f: 676, s: S7a }], 8: [{ f: 804, s: S8a }],
  9: [{ f: 873, s: S9a }], 10: [{ f: 1010, s: S10a }], 11: [{ f: 1096, s: S11a }], 12: [{ f: 1148, s: S12a }],
  13: [{ f: 1380, s: S13a }], 14: [{ f: 1550, s: S14a }], 15: [{ f: 1641, s: S15a }], 16: [{ f: 1863, s: S16a }],
};

// impact kicks: [seconds, strength]: the landing in the middle of the match, the parents hear, "who had done it first."
const KICKS: [number, number][] = [[T_MIDDLE - 2 / 30, 0.5], [T_HEAR - 2 / 30, 0.45], [T_FIRST2 - 2 / 30, 0.35]];
export const KICK_FRAMES = KICKS.map(([t]) => Math.floor(t * FPS + 1e-6));
/** the time of the kick frame for a word at t (bursts and pose changes start exactly there, a planned frame) */
export const kickT = (t: number) => Math.floor((t - 2 / 30) * FPS + 1e-6) / FPS;
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
  { f: 161, cInf: 13, focus: at(add(PARL, 0, 1.7, -1.5)) },
  { f: 225, cInf: 10, focus: (f) => [strollX(T(f)), Y + 1.6, 6.6] },
  { f: 372, cInf: 0 },
  { f: 543, cInf: 7, focus: at(add(FLD, 0, 1.6, 2.2)) },
  { f: 630, cInf: 0 },
  { f: 1010, cInf: 11, focus: at(add(POLO, 1.3, 1.65, 1.4)) },
  { f: 1096, cInf: 12, focus: at(add(PARL, 0, 1.6, -1.5)) },
  { f: 1148, cInf: 11, focus: at(add(PARL, -0.4, 1.7, -1.4)) },
  { f: 1380, cInf: 12, focus: at(add(PARL, 0.5, 1.7, -1.4)) },
  { f: 1550, cInf: 12, focus: at(add(CAFE, 0, 1.6, 0.4)) },
  { f: 1641, cInf: 7, focus: at(add(DIN, 0, 1.6, -1.0)) },
  { f: 1863, cInf: 13, focus: at(add(DIN, -1.0, 1.7, -1.0)) },
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
  { a: 804, b: 873, kit: "plant_bush", pos: [POLO[0] + 10.2, D0, POLO[2] + 13.4], s: 1.1 },
];
