// Timeline of "How a Sheet of Glass Put a Ghost on a London Stage in 1862": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): the Polytechnic theatre (open-topped hall at the
// origin: the stage, the orchestra pit in front of it with its screen, the tilted glass, the benches), Regent Street
// with the Polytechnic front and the glazier's cart (x ~ 300), Dircks's office (x ~ -300) and the kitchen of the
// analogy with its garden (z ~ 300). Camera grammar of the bridge template: slow push-ins, smootherstep glides of
// 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1995;
export const D0 = 1.2; // floor / street level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the theatre: hall x in [-HW, HW], z in [STAGE_Z0, HALL_Z1]; the stage top at SY over z in [STAGE_Z0, STAGE_Z1] */
export const HW = 9, STAGE_Z0 = -9, STAGE_Z1 = -1, HALL_Z1 = 18, SY = D0 + 1.1;
/** the orchestra pit in front of the stage: x in [-PIT_W, PIT_W], z in [STAGE_Z1, PIT_Z1], floor at PY; its screen top */
export const PIT_W = 4.5, PIT_Z1 = 1.4, PY = D0 - 1.4, SCREEN_Y = D0 + 0.9;
/** the glass: bottom edge centre on the stage, width, height, final tilt (top toward the seats) */
export const GLASS: V3 = [0, SY, -1.5];
export const GLASS_W = 7.2, GLASS_H = 3.8, GLASS_TILT = 0.36;
/** the benches: rows of seats (z of each row), the seat height */
export const ROWS = [4.2, 6.4, 8.6, 10.8, 13.0, 15.2], SEAT_Y = D0 + 0.45;
/** who stands where on the stage: the actor, the ghost; the hidden actor in the pit; the lamp in the pit */
export const ACTOR: V3 = [-0.75, SY, -4.4], GHOST: V3 = [0.85, SY, -4.8], PIT_ACTOR: V3 = [0.2, PY, 0.25], LAMP: V3 = [1.5, PY + 0.9, 0.5];
/** Regent Street: the street along x through ST, the Polytechnic front on its north side, the glazier's cart */
export const ST: V3 = [300, D0, 0], POLY_Z = -12.4, CART: V3 = [338, D0, -6.6];
/** Dircks's office (open-topped room) and the kitchen of the analogy (its window wall faces +z at KIT_Z) */
export const OFF: V3 = [-300, D0, 0], KIT: V3 = [0, D0, 300];

// story beats (seconds on the voice clock)
export const T_GHOST = 2.65, T_WALKED = 3.10, T_NOBODY = 4.57, T_HOW = 5.40;
export const T_STAGE = 6.03, T_ROYAL = 6.85, T_STAR = 8.19, T_PEPPER = 9.45, T_CROWD = 10.93;
export const T_BUT = 11.75, T_NOT = 12.60, T_HIS = 12.82;
export const T_LIVERPOOL = 13.59, T_DIRCKS = 15.05, T_DREAMED = 15.72, T_PLAN = 17.34, T_REBUILD = 18.00, T_THEATRE = 18.84;
export const T_FOUND = 19.64, T_CHEAPER = 20.34, T_HID = 21.55, T_PIT = 22.32, T_LIT = 23.60, T_BLAZING = 24.20, T_LAMP = 24.70;
export const T_STOOD = 26.05, T_SHEET = 26.66, T_GLASS = 26.95, T_TILTED = 28.32, T_SEATS = 29.09;
export const T_DIMMED = 30.61, T_PALE = 31.20, T_DRIFTED = 31.85, T_ACTORS = 32.66;
export const T_THEY = 33.45, T_SEE = 33.91, T_FOLLOWED = 34.54, T_MARKS = 35.27;
export const T_FIVE = 36.46, T_STARED = 37.35, T_THERE = 38.65;
export const T_YOUSEE = 39.35, T_WINDOW = 40.49, T_MIRROR = 41.04, T_KITCHEN = 42.52, T_NIGHT = 43.27, T_YOURSELF = 44.02, T_FLOATING = 44.44, T_GARDEN = 45.23;
export const T_LIGHT = 46.06, T_DIM = 47.15, T_SHOWS = 48.51, T_BOTH = 48.83;
export const T_SOLD = 50.39, T_FIFTEEN = 51.06, T_SOON = 52.10, T_SHORT = 53.10, T_PLATE = 53.50;
export const T_GAVE = 55.02, T_MONEY = 55.45, T_CROWDS = 56.17, T_ONE = 57.20;
export const T_STILL = 58.38, T_PEPPERS = 58.99, T_GHOSTW = 59.40;
export const T_MAN = 60.30, T_DREAMT = 60.71, T_BECAME = 61.33, T_NOBODYE = 62.10, T_SEEE = 62.76;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "hall" | "street" | "office" | "kitchen";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 178, "hall", "golden"), mk(2, 178, 243, "street"), mk(3, 243, 405, "hall"), mk(4, 405, 586, "office"),
  mk(5, 586, 772, "hall"), mk(6, 772, 892, "hall"), mk(7, 892, 1091, "hall", "golden"), mk(8, 1091, 1177, "hall", "golden"),
  mk(9, 1177, 1379, "kitchen", "golden"), mk(10, 1379, 1496, "hall", "golden"), mk(11, 1496, 1638, "street"),
  mk(12, 1638, 1741, "office"), mk(13, 1741, 1803, "hall"), mk(14, 1803, TOTAL, "hall", "golden"),
];
/** crossfades (frames) at place / time changes: into the kitchen (9), back to the theatre (10), the last shot (14) */
export const XFADE: Record<number, number> = { 9: 10, 10: 10, 14: 10 };
export const FLASH_AT = 178;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fr = (t: number) => Math.round(t * FPS);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- the story physics ----------------
/** the ghost's opacity on the stage per shot (0 = not there) */
export const ghostAt = (id: number, t: number): number => {
  if (id === 1) return 0.62 * smooth((t - T_GHOST + 0.1) / 0.9);
  if (id === 7) return 0.62 * smooth((t - T_PALE + 0.1) / 1.2);
  if (id === 10) return 0.62 * smooth((t - T_SHOWS + 0.25) / 0.8);
  if (id === 13) return 0.55;
  return 0;
};
/** the ghost drifts a little across the stage */
export const ghostPos = (id: number, t: number): V3 => {
  const u = id === 7 ? Math.max(0, t - T_DRIFTED + 0.1) : id === 1 ? Math.max(0, t - T_WALKED) : 0;
  return add(id === 10 ? [-2.0, SY, -4.0] : GHOST, [-0.18 * u, 0.05 * Math.sin(t * 1.7), 0]);
};
/** the pit lamp's brightness 0..1 */
export const lampAt = (id: number, t: number): number => {
  if (id === 5) return smooth((t - T_BLAZING + 0.1) / 0.5);
  if (id === 10) return 0.45 + 0.55 * smooth((t - T_LIGHT + 0.1) / 0.5);
  if (id === 6) return 1;
  return 0;
};
/** the glass: tilt from the vertical (top toward the seats), lift 0 (lying on the stage) .. 1 (stood); null = not there */
export const glassAt = (id: number, t: number): { tilt: number; up: number } | null => {
  if (id === 6) {
    const up = smooth((t - T_STOOD + 0.1) / 1.1);
    return { up, tilt: GLASS_TILT * smooth((t - T_TILTED + 0.1) / 0.9) };
  }
  if (id === 2 || id === 4 || id === 9 || id === 11 || id === 12) return null;
  if (id === 3 || id === 5) return null; // before Pepper stood it
  return { up: 1, tilt: GLASS_TILT };
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
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const Y = D0;
// shot 1 (hook, golden): from the seats, the stage with the actor and the ghost; cut on "nobody" to the audience
export const F_NOBODY = fr(T_NOBODY) - 3;
const S1a = (f: number) => dolly([1.4, Y + 2.3, 3.2], [0.0, SY + 1.2, -4.6], pushK(f, 0, 0.0018, 0, 30) * pushK(f, fr(T_GHOST) - 3, 0, 0.005, 30), { fov: 46, roll: 0.03 });
const S1b = (f: number) => dolly([0.8, D0 + 1.7, 1.6], [-0.6, D0 + 1.0, 6.4], pushK(f, F_NOBODY, 0.0016, 0.004, 25), { fov: 46, roll: -0.04 });
// shot 2: Regent Street, the queue at the Polytechnic
const S2a = (f: number) => dolly([ST[0] + 9, Y + 2.6, 7.5], [ST[0] - 1, Y + 5.2, POLY_Z], pushK(f, 178, 0.0018, 0, 30), { fov: 50, roll: -0.03 });
// shot 3: Pepper on the stage, lights up; punch on "not"
export const F_NOT = fr(T_NOT) - 3;
const S3a = (f: number) => dolly([1.0, Y + 2.2, 3.4], [0.0, SY + 1.3, -3.2], pushK(f, 243, 0.0016, 0, 30) * pushK(f, fr(T_PEPPER) - 3, 0, 0.004, 25) * pushK(f, F_NOT, 0, 0.006, 25), { fov: 38, roll: 0.03 });
// shot 4: Dircks's office: Dircks and his model; cut on "plan" to the two owners and the plan
export const F_PLAN = fr(T_PLAN) - 3;
export const DIRCKS_O: V3 = [OFF[0] - 2.2, Y, OFF[2] - 1.0], OWNERS_O: V3 = [OFF[0] - 0.2, Y, OFF[2] + 0.4];
const S4a = (f: number) => dolly([OFF[0] + 0.2, Y + 1.9, OFF[2] + 3.4], [OFF[0] - 1.5, Y + 1.35, OFF[2] - 1.1], pushK(f, 405, 0.0016, 0, 30) * pushK(f, fr(T_DIRCKS) - 3, 0, 0.004, 25), { fov: 42, roll: -0.03 });
const S4b = (f: number) => dolly([OFF[0] - 1.6, Y + 1.8, OFF[2] + 5.4], [OFF[0] - 1.1, Y + 1.4, OFF[2] - 0.4], pushK(f, F_PLAN, 0.0018, 0, 30) * pushK(f, fr(T_THEATRE) - 3, 0, 0.004, 25), { fov: 46, roll: 0.03 });
// shot 5: the pit: Pepper on the stage edge points down at the hidden actor; the lamp blazes
const S5a = (f: number) => dolly([3.4, SY + 1.5, 1.0], [-0.5, PY + 1.0, -0.2], pushK(f, 586, 0.0016, 0, 30) * pushK(f, fr(T_BLAZING) - 3, 0, 0.005, 25), { fov: 54, roll: 0.03 });
// shot 6: side view across the stage front: two stagehands stand the glass up, then tilt it
const S6a = (f: number) => dolly([7.8, SY + 1.5, 1.6], [0.0, SY + 0.9, -1.8], pushK(f, 772, 0.0014, 0, 30) * pushK(f, fr(T_TILTED) - 3, 0, 0.004, 25), { fov: 50, roll: -0.03 });
// shot 7 (golden): the stage dims, the ghost drifts in beside the actor; cut on "They" to the floor marks
export const F_THEY = fr(T_THEY) - 3;
const S7a = (f: number) => dolly([0.8, Y + 2.2, 2.6], [0.0, SY + 1.2, -4.6], pushK(f, 892, 0.0016, 0, 30) * pushK(f, fr(T_PALE) - 3, 0, 0.004, 25), { fov: 44, roll: 0.03 });
const S7b = (f: number) => dolly([0.2, SY + 1.4, -1.5], [-1.5, SY + 0.5, -4.5], pushK(f, F_THEY, 0.0018, 0, 30) * pushK(f, fr(T_MARKS) - 3, 0, 0.004, 25), { fov: 50, roll: -0.04 });
// shot 8 (golden): five hundred faces, wide from over the pit
const S8a = (f: number) => dolly([-0.6, Y + 1.9, 2.2], [0.4, Y + 1.0, 9.0], pushK(f, 1091, 0.0016, 0.005, 30), { fov: 54, roll: 0.04 });
// shot 9 (golden): the kitchen: over her shoulder to the window, her reflection floating in the garden
const KZ = KIT[2];
const S9a = (f: number) => dolly([KIT[0] + 0.1, Y + 1.75, KZ - 6.5], [KIT[0] - 0.1, Y + 1.55, KZ + 1.5], pushK(f, 1177, 0.0012, 0, 30) * pushK(f, fr(T_FLOATING) - 3, 0, 0.004, 25), { fov: 46, roll: -0.03 });
// shot 10 (golden): the cut-away from the side: the lamp, the hidden actor, the glass, the ghost behind it
const S10a = (f: number) => dolly([5.2, SY + 3.0, 3.6], [0.0, SY - 0.2, -2.0], pushK(f, 1379, 0.0016, 0, 30) * pushK(f, fr(T_SHOWS) - 3, 0, 0.004, 25), { fov: 56, roll: 0.03 });
// shot 11: the queue along Regent Street; cut on "soon" to the glazier's empty cart
export const F_SOON = fr(T_SOON) - 3;
const S11a = (f: number) => dolly([ST[0] - 16, Y + 3.0, 4.0], [ST[0] + 4, Y + 1.8, -6.0], pushK(f, 1496, 0.0018, 0, 30), { fov: 50, roll: 0.03 });
const S11b = (f: number) => dolly([CART[0] - 1.2, Y + 2.4, CART[2] + 9.5], [CART[0] - 0.9, Y + 1.3, CART[2] + 1.0], pushK(f, F_SOON, 0.0018, 0, 30) * pushK(f, fr(T_PLATE) - 3, 0, 0.004, 25), { fov: 50, roll: -0.03 });
// shot 12: the patent table: Dircks pushes the money bag to Pepper
export const TABLE_O: V3 = [OFF[0] + 0.7, Y, OFF[2] - 1.2];
const S12a = (f: number) => dolly([OFF[0] + 1.0, Y + 1.8, OFF[2] + 3.3], [OFF[0] + 0.7, Y + 1.25, OFF[2] - 1.4], pushK(f, 1638, 0.0018, 0, 30) * pushK(f, fr(T_ONE) - 3, 0, 0.005, 25), { fov: 44, roll: 0.03 });
// shot 13: Pepper bows beside his ghost, the crowd cheers
const S13a = (f: number) => dolly([-1.8, Y + 2.2, 6.0], [0.2, SY + 1.2, -3.8], pushK(f, 1741, 0.002, 0.005, 30), { fov: 42, roll: -0.04 });
// shot 14 (golden): Dircks alone on the back bench fades away
export const DIRCKS_SEAT: V3 = [-4.6, SEAT_Y, ROWS[3]];
const S14a = (f: number) => dolly([-3.0, Y + 1.7, ROWS[3] - 3.9], [-4.6, Y + 1.15, ROWS[3]], pushK(f, 1803, 0.0014, 0, 30) * pushK(f, fr(T_NOBODYE) - 3, 0, 0.004, 25), { fov: 44, roll: 0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: F_NOBODY, cut: true, s: S1b }],
  2: [{ f: 178, s: S2a }],
  3: [{ f: 243, s: S3a }],
  4: [{ f: 405, s: S4a }, { f: F_PLAN, cut: true, s: S4b }],
  5: [{ f: 586, s: S5a }],
  6: [{ f: 772, s: S6a }],
  7: [{ f: 892, s: S7a }, { f: F_THEY, cut: true, s: S7b }],
  8: [{ f: 1091, s: S8a }],
  9: [{ f: 1177, s: S9a }],
  10: [{ f: 1379, s: S10a }],
  11: [{ f: 1496, s: S11a }, { f: F_SOON, cut: true, s: S11b }],
  12: [{ f: 1638, s: S12a }],
  13: [{ f: 1741, s: S13a }],
  14: [{ f: 1803, s: S14a }],
};

// impact kicks: [seconds, strength]: the lamp blazes, the glass stands, the crowd stares
const KICKS: [number, number][] = [[T_BLAZING - 2 / 30, 0.3], [T_STARED - 2 / 30, 0.3]];
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
  { f: 0, cInf: 12, focus: at([0.0, SY + 1.5, -4.6]) },
  { f: F_NOBODY, cInf: 10, focus: at([0.0, Y + 1.1, ROWS[0]]) },
  { f: 178, cInf: 0 },
  { f: 243, cInf: 13, focus: at([0.0, SY + 1.5, -3.2]) },
  { f: 405, cInf: 12, focus: at([DIRCKS_O[0], Y + 1.55, DIRCKS_O[2]]) },
  { f: F_PLAN, cInf: 10, focus: at([OWNERS_O[0], Y + 1.55, OWNERS_O[2]]) },
  { f: 586, cInf: 7, focus: at([PIT_ACTOR[0], PY + 1.5, PIT_ACTOR[2]]) },
  { f: 772, cInf: 0 },
  { f: 892, cInf: 11, focus: at([0.0, SY + 1.5, -4.6]) },
  { f: F_THEY, cInf: 13, focus: at([-1.0, SY + 0.3, -4.5]) },
  { f: 1091, cInf: 0 },
  { f: 1177, cInf: 10, focus: at([KIT[0] + 0.7, Y + 1.6, KZ - 1.3]) },
  { f: 1379, cInf: 0 },
  { f: 1496, cInf: 0 },
  { f: F_SOON, cInf: 11, focus: at([CART[0] - 0.6, Y + 1.5, CART[2] + 0.8]) },
  { f: 1638, cInf: 12, focus: at([TABLE_O[0], Y + 1.5, TABLE_O[2]]) },
  { f: 1741, cInf: 10, focus: at([0.0, SY + 1.5, -3.6]) },
  { f: 1803, cInf: 14, focus: at([DIRCKS_SEAT[0], Y + 1.3, DIRCKS_SEAT[2]]) },
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
  { a: 178, b: 243, kit: "lantern", pos: [ST[0] + 5.6, D0 + 0.18, 4.6], s: 3.0 },
  { a: 1177, b: 1379, kit: "plant_bush", pos: [KIT[0] - 1.6, D0 + 0.9, KZ - 0.5], s: 0.5 },
];
