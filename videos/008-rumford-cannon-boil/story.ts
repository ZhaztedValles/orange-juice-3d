// Timeline of "In 1798 a Count Boiled Water With No Fire, Using Two Horses and a Cannon": shots timed to words.json.
// Two places, far apart on one big ground: the cobbled yard of the Munich arsenal (the boring machine in the middle:
// a horse gin, its shafts, the brass casting turning on trestles against a fixed drill, later the wooden box of water
// around its end; a row of finished guns along the north side) and a Munich street on a cold morning (the analogy).
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes,
// flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2040;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the boring machine: the casting's axis runs along x at height AX; its end (the part being bored) at x = 0 */
export const AX = D0 + 1.15;
/** the wooden box of water around the casting's end */
export const BOX = { x0: -0.35, x1: 1.25, z0: -0.7, z1: 0.7, y0: D0 + 0.5, y1: D0 + 1.9 };
export const WATER_Y = BOX.y1 - 0.12;
/** the horse gin: two horses walk a circle of radius GIN_R round GIN */
export const GIN: V3 = [-6.5, D0, -7.5];
export const GIN_R = 4.0;
export const GIN_PERIOD = 15; // seconds per turn
export const ginAngle = (t: number) => (t / GIN_PERIOD) * Math.PI * 2;
/** the row of finished guns on their carriages, muzzles toward +z */
export const ROW: V3 = [12, D0, -13];
export const NGUN = 6;
/** the Munich street of the cold-morning analogy */
export const MOR: V3 = [320, D0, 0];

// story beats (seconds on the voice clock)
export const T_FIRE = 4.56; // "fire."
export const T_HOT = 17.61; // "hot"
export const T_TOUCH = 18.65; // "touch"
export const T_COLD = 21.89; // "cold water"
export const T_BLUNT = 23.07; // "blunt drill"
export const T_WARM = 28.81; // "warm."
export const T_HAND = 31.32; // "hand in it"
export const T_CROWD = 33.62; // "workmen crowding"
export const T_BOIL = 35.2; // "boiled."
export const T_STARED = 38.5; // "stared"
export const T_MOTION = 42.98; // "motion."
export const T_RUB = 43.89; // "Rub"
export const T_WARM2 = 45.99; // "warm up"
export const T_SHOOK = 49.51; // "shook"
export const T_SHAKING = 52.65; // "shaking"
export const T_HEAT = 54.04; // "heat."
export const T_FLUID = 57.33; // "fluid"
export const T_MORE = 60.08; // "more."
export const T_STOVE = 62.08; // "stove"

/** water heat 0 (cold) .. 1 (boiling) at time t: the box is filled at "cold water", warm by "warm", boiling at "boiled" */
export const heatAt = (t: number) => {
  if (t < 24) return 0;
  if (t < T_BOIL) return 0.85 * smooth((t - 24) / (T_BOIL - 24 - 0.5)) ** 1.2;
  return 1;
};
/** the box is there from the experiment on (and in the hook, which shows its end) */
export const boxOn = (id: number) => id === 1 || id >= 5;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "yard" | "street";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 160, "yard"), mk(2, 160, 316, "yard"), mk(3, 316, 481, "yard"), mk(4, 481, 582, "yard"),
  mk(5, 582, 736, "yard"), mk(6, 736, 887, "yard"), mk(7, 887, 963, "yard"), mk(8, 963, 1079, "yard"),
  mk(9, 1079, 1198, "yard"), mk(10, 1198, 1314, "yard"), mk(11, 1314, 1466, "street", "golden"), mk(12, 1466, 1644, "yard"),
  mk(13, 1644, 1823, "yard"), mk(14, 1823, TOTAL, "yard", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 11: 8, 12: 8, 14: 8 };
export const FLASH_AT = 160;

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
const BC: V3 = [(BOX.x0 + BOX.x1) / 2, BOX.y1, 0]; // top of the box
// shot 1 (hook): the steaming box, Rumford beside it, the horses circling behind; then low under the box: no fire
const S1a = (f: number) => dolly([BC[0] + 4.6, Y + 3.0, 7.8], [BC[0] - 1.6, Y + 1.7, -0.6], pushK(f, 0, 0.0024), { fov: 44, roll: 0.03 });
const S1b = (f: number) => dolly([BC[0] + 1.8, Y + 0.45, 3.6], [BC[0], Y + 0.55, 0], pushK(f, 132, 0.0025, 0.006, 30), { fov: 42 });
// shot 2: the yard's row of guns; Rumford walks along them, proud
const S2a = (f: number) => { const x = rumX(T(f)); return dolly([x + 6.5, Y + 2.2, ROW[2] + 10.5], [x + 0.8, Y + 1.5, ROW[2] + 3.2], pushK(f, 160, 0.0022), { fov: 44 }); };
// shot 3: the machine at work: horses on the gin, the casting turning against the drill
const S3a = (f: number) => dolly([4.5, Y + 4.2, 10.5], [-3.2, Y + 1.2, -3.0], pushK(f, 316, 0.0022), { fov: 46 });
const S3b = (f: number) => dolly([3.6, Y + 2.2, 4.6], [0.4, Y + 1.2, 0], pushK(f, 316, 0.0022), { fov: 42, roll: -0.03 });
// shot 4: Rumford reaches for the hot metal
const S4a = (f: number) => dolly([-0.6, Y + 1.9, 4.4], [-1.9, Y + 1.35, 0.3], pushK(f, 481, 0.0026, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 5: the box of cold water round the casting; then the blunt drill
const S5a = (f: number) => dolly([3.2, Y + 3.0, 5.6], [-0.2, Y + 1.4, 0.2], pushK(f, 582, 0.0024), { fov: 42 });
const S5b = (f: number) => dolly([3.0, Y + 2.7, 4.8], [2.6, Y + 1.2, 0], pushK(f, 689, 0.0026, 0.006, 30), { fov: 52, roll: -0.03 });
// shot 6: high wide: the two horses walking their circle, the worker testing the water
const S6a = (f: number) => dolly([6.5, Y + 7.5, 9.5], [-3.2, Y + 0.8, -3.6], pushK(f, 736, 0.0022), { fov: 46 });
// shot 7: close on the worker at the box: he snatches his hand out
const S7a = (f: number) => dolly([2.6, Y + 2.2, 3.8], [0.6, Y + 1.6, 0.9], pushK(f, 887, 0.0028, 0.006, 30), { fov: 40, roll: 0.035 });
// shot 8: the workmen crowd round; the water boils
const S8a = (f: number) => dolly([5.2, Y + 2.9, 6.4], [0.4, Y + 1.6, 0], pushK(f, 963, 0.0024, 0.006, 30), { fov: 44, roll: -0.03 });
// shot 9: low under the box: no coal, no flame; then the faces
const S9a = (f: number) => dolly([BC[0] - 1.4, Y + 0.4, 3.4], [BC[0], Y + 0.6, 0], pushK(f, 1079, 0.0025), { fov: 42, roll: 0.03 });
const S9b = (f: number) => dolly([1.0, Y + 1.75, 5.6], [0.4, Y + 1.65, 1.6], pushK(f, 1128, 0.0026, 0.006, 30), { fov: 40 });
// shot 10: close on the drill grinding the brass
const S10a = (f: number) => dolly([1.9, Y + 2.3, 2.1], [0.6, Y + 1.5, 0], pushK(f, 1198, 0.0024, 0.006, 30), { fov: 40, roll: -0.03 });
// shot 11 (golden): a cold Munich morning: a man rubbing his hands
const S11a = (f: number) => dolly([MOR[0] - 1.2, Y + 1.85, 9.6], [MOR[0], Y + 1.55, 5.8], pushK(f, 1314, 0.0026, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 12: the box again, and a look inside the brass: the shaking bits
const S12a = (f: number) => dolly([0.2, Y + 2.1, 4.6], [-0.3, Y + 1.8, 0.6], pushK(f, 1466, 0.0024, 0.005, 30), { fov: 42 });
// shot 13: the learned men beside the box; then the horses, still walking
const S13a = (f: number) => dolly([4.4, Y + 2.0, 5.6], [1.6, Y + 1.6, 1.8], pushK(f, 1644, 0.0024), { fov: 42, roll: 0.03 });
/** where gin horse 0 is at time t */
export const horse0 = (t: number): V3 => { const th = ginAngle(t); return [GIN[0] + GIN_R * Math.cos(th) - 0.9 * Math.sin(th), D0 + 1.2, GIN[2] + GIN_R * Math.sin(th) + 0.9 * Math.cos(th)]; };
const S13b = (f: number) => dolly([-2.0, Y + 3.0, 3.8], horse0(T(f)), pushK(f, 1760, 0.0024, 0.006, 30), { fov: 44, roll: 0.03 });
// shot 14 (golden): the whole yard at sunset, the horses still walking, steam rising: the best stove in Munich
const S14a = (f: number) => {
  const s = glide((f - 1823) / 200);
  return dolly([7 + 2 * s, Y + 4.5 + 2.5 * s, 11 + 3 * s], [-3.0, Y + 1.4, -3.5], pushK(f, 1823, 0.0012), { fov: 46 });
};

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 132, cut: true, s: S1b }],
  2: [{ f: 160, s: S2a }],
  3: [{ f: 316, s: S3a }, { f: 400, dur: 40, s: S3b }],
  4: [{ f: 481, s: S4a }],
  5: [{ f: 582, s: S5a }, { f: 689, cut: true, s: S5b }],
  6: [{ f: 736, s: S6a }],
  7: [{ f: 887, s: S7a }],
  8: [{ f: 963, s: S8a }],
  9: [{ f: 1079, s: S9a }, { f: 1128, cut: true, s: S9b }],
  10: [{ f: 1198, s: S10a }],
  11: [{ f: 1314, s: S11a }],
  12: [{ f: 1466, s: S12a }],
  13: [{ f: 1644, s: S13a }, { f: 1760, dur: 40, s: S13b }],
  14: [{ f: 1823, s: S14a }],
};

/** Rumford walking along the guns (shot 2) */
export const rumX = (t: number) => ROW[0] - 4 + 1.15 * (t - 5.33);

// impact kicks: [seconds, strength]: the hot touch, the boil, "motion"
const KICKS: [number, number][] = [[T_TOUCH - 2 / 30, 0.5], [T_BOIL - 2 / 30, 0.7], [T_MOTION - 2 / 30, 0.4]];
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
export const DOF: Dof[] = [
  { f: 0, cInf: 10, focus: () => [BC[0] - 1.0, D0 + 1.7, 1.0] },
  { f: 132, cInf: 14, focus: () => [BC[0], D0 + 0.6, 0.7] },
  { f: 160, cInf: 7, focus: (f) => [rumX(T(f)), D0 + 1.6, ROW[2] + 3.2] },
  { f: 316, cInf: 0 },
  { f: 400, dur: 30, cInf: 10, focus: () => [0.4, D0 + 1.2, 0] },
  { f: 481, cInf: 13, focus: () => [-1.9, D0 + 1.6, 0.9] },
  { f: 582, cInf: 10, focus: () => [0.4, D0 + 1.6, 0.8] },
  { f: 689, cInf: 12, focus: () => [2.6, D0 + 1.15, 0] },
  { f: 736, cInf: 0 },
  { f: 887, cInf: 12, focus: () => [0.9, D0 + 1.7, 1.2] },
  { f: 963, cInf: 10, focus: () => [0.6, D0 + 1.7, 1.2] },
  { f: 1079, cInf: 14, focus: () => [BC[0], D0 + 0.6, 0.7] },
  { f: 1128, cInf: 12, focus: () => [0.4, D0 + 1.7, 1.6] },
  { f: 1198, cInf: 13, focus: () => [0.7, D0 + 1.4, 0] },
  { f: 1314, cInf: 12, focus: () => [MOR[0], D0 + 1.6, 5.9] },
  { f: 1466, cInf: 10, focus: () => [-0.3, D0 + 1.9, 0.9] },
  { f: 1644, cInf: 11, focus: () => [1.8, D0 + 1.7, 1.9] },
  { f: 1760, dur: 30, cInf: 7, focus: (f) => horse0(T(f)) },
  { f: 1823, cInf: 0 },
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
  { a: 316, b: 481, kit: "lantern", pos: [3.2, D0, 8.6], s: 3.0 },
  { a: 1314, b: 1466, kit: "lantern", pos: [MOR[0] + 1.9, D0 + 0.18, 7.6], s: 3.0 },
  { a: 1823, b: TOTAL, kit: "plant_bushDetailed", pos: [4.6, D0, 9.6], s: 1.1 },
];
