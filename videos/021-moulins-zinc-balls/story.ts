// Timeline of "The Letters That Rolled Along the Bottom of the Seine Into Besieged Paris": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): the Seine at Paris (the river along x, the stone
// quay and houses on the north bank, the net across the river at x = 0 between two posts), the Seine far upstream
// (x ~ 300: the same river between earth banks, a small jetty, fields), the square of Moulins (z ~ 400: cobbles,
// houses, the post office, the table) and the riverbed (x ~ -1200, beyond the end of the land: sand, stones, weed, the
// water surface seen from below). Camera grammar of the bridge template: slow push-ins, smootherstep glides of
// 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2040;
export const D0 = 1.2; // bank / street level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the river: water surface WY, half-width RW (z in [-RW, RW]), flowing toward -x; the net across it at NET_X */
export const WY = D0 - 0.9, RW = 14, NET_X = 0;
/** the upstream bank (Robert's jetty on the south bank) */
export const UP: V3 = [300, D0, RW], JETTY: V3 = [300, D0 - 0.35, RW - 2.6];
/** the square of Moulins (its centre), the post office window, the packing table, the parade rope */
export const MOU: V3 = [0, D0, 400], POST: V3 = [-11.5, D0, 391.1], TABLE: V3 = [6, D0, 404], ROPE: V3 = [0, D0, 412];
/** the riverbed far below the world (floor at UY, water surface above it at UY + UD) */
export const UNDER: V3 = [-1200, 0, 0], UY = 0, UD = 3.6;
/** a ball's radius (the real ones were about 13 cm across) */
export const BALL_R = 0.075;

// story beats (seconds on the voice clock)
export const T_WINTER = 0.72, T_LETTERS = 2.38, T_PARIS = 2.90, T_ROLLED = 3.27, T_BOTTOM = 3.98, T_RIVER = 4.47;
export const T_PRUSSIAN = 5.24, T_SURROUNDED = 6.08, T_NO = 7.22, T_POST = 7.40, T_IN = 8.01;
export const T_THREE = 8.84, T_DELORT = 9.62, T_ROBERT = 10.19, T_VONOVEN = 10.70, T_STRANGE = 11.43, T_PLAN = 11.85;
export const T_MOULINS = 12.80, T_PAID = 13.65, T_FRANC = 14.16, T_ONE = 14.80, T_PARIS2 = 15.45;
export const T_HUNDREDS = 16.29, T_SEALED = 17.35, T_ZINC = 17.89, T_BALL = 18.20, T_FINS = 18.69, T_SPIN = 19.49;
export const T_ROBERT2 = 20.38, T_FARMER = 21.41, T_SLIPPED = 22.11, T_SEINE = 22.86, T_UPSTREAM = 23.65;
export const T_SANK = 25.25, T_ROLLED2 = 25.73, T_RIVERBED = 26.43, T_SO = 26.93, T_SOLDIERS = 27.14, T_NOTHING = 27.77;
export const T_INPARIS = 28.54, T_VONOVEN2 = 29.27, T_STRETCHED = 29.70, T_NET = 30.10, T_WAITED = 31.12;
export const T_DAY = 31.84, T_EMPTY = 33.25, T_NIGHT = 34.35, T_TORN = 34.80, T_POSTS = 35.38;
export const T_YOUSEE = 36.15, T_JANUARY = 36.66, T_COLD = 37.74, T_FILLED = 38.69, T_ICE = 39.11;
export const T_STOP = 40.23, T_ABALL = 40.52, T_BUT = 40.86, T_ICE2 = 41.01, T_PUSHES = 41.30, T_CROWD = 42.06, T_LEANING = 42.48, T_ROPE = 43.35;
export const T_GAVE = 44.52, T_WAY = 44.77, T_SLOW = 45.49, T_STUCK = 46.84, T_MUD = 47.30;
export const T_SIEGE = 48.16, T_ENDED = 48.54, T_SINGLE = 49.35, T_ARRIVED = 50.10;
export const T_KEPT = 51.67, T_TURNING = 51.95, T_CENTURY = 52.89, T_LAST = 53.77, T_EIGHTY = 54.73;
export const T_SOME = 55.67, T_FINALLY = 56.31, T_REACHED = 56.76, T_GRAND = 57.15, T_WRITTEN = 58.69;
export const T_TWENTY = 59.96, T_STILL = 60.77, T_MUD2 = 61.75, T_SLOWEST = 62.66, T_HISTORY = 63.62, T_WAY2 = 64.92;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "paris" | "up" | "moulins" | "under";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 153, "under"), mk(2, 153, 252, "paris"), mk(3, 252, 375, "moulins"), mk(4, 375, 483, "moulins"),
  mk(5, 483, 605, "moulins"), mk(6, 605, 748, "up"), mk(7, 748, 853, "under"), mk(8, 853, 953, "paris"),
  mk(9, 953, 1017, "paris", "golden"), mk(10, 1017, 1082, "paris", "golden"), mk(11, 1082, 1192, "paris"),
  mk(12, 1192, 1318, "moulins"), mk(13, 1318, 1438, "paris"), mk(14, 1438, 1540, "paris"), mk(15, 1540, 1666, "up"),
  mk(16, 1666, 1786, "moulins", "golden"), mk(17, 1786, TOTAL, "under"),
];
/** crossfades (frames) at place / time changes: the analogy (12), the found balls (15), the last shot (17) */
export const XFADE: Record<number, number> = { 12: 10, 15: 10, 17: 10 };
export const FLASH_AT = 153;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fr = (t: number) => Math.round(t * FPS);

// ---------------- the story physics ----------------
/** cuts inside shots (frames): on "so" to the soldiers, on "slow" to the riverbed, on "stop" to the ball at the rope */
export const F_SO = fr(T_SO) - 3, F_SLOW = fr(T_SLOW) - 3, F_STILL = fr(T_SLOWEST) - 3;
/** a rolling ball: position along -x from x0 at speed v (m/s) starting at t0, resting on y; spin angle about z */
export const rollAt = (x0: number, y: number, z: number, t0: number, v: number, t: number) => {
  const d = Math.max(0, t - t0) * v;
  return { pos: [x0 - d, y + BALL_R, z] as V3, spin: d / BALL_R };
};
/** the net: 1 = standing, 0 = torn down (posts fallen); per shot */
export const netAt = (id: number, t: number): number => {
  if (id === 10) return 1 - 0.45 * smooth((t - T_TORN + 0.07) / 0.5);
  if (id === 11) return 0.55;
  if (id === 13) return f13(t);
  return 1;
};
const f13 = (t: number) => 0.55 * (1 - smooth((t - T_GAVE + 0.07) / 0.6));
/** the net hauled up out of the water (0 = in the water, 1 = lifted), shot 9 */
export const haulAt = (id: number, t: number) => (id === 9 ? smooth((t - T_DAY + 0.1) / 1.0) : 0);
/** ice on the river: 0 none .. 1 full (shots 10, 11, 13) */
export const iceAt = (id: number, t: number) => {
  if (id === 10) return 0.55;
  if (id === 11) return 0.6 + 0.4 * smooth((t - T_FILLED + 0.1) / 0.8);
  if (id === 13) return 1;
  return 0;
};
/** the parade rope (shot 12): its two posts tip over (0 upright .. 1 fallen) once the crowd leans */
export const ropeTipAt = (t: number) => smooth((t - T_ROPE + 0.07) / 0.45);
export const ropeLeanAt = (t: number) => smooth((t - T_LEANING + 0.07) / 0.9);

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

const Y = D0, [UX, , UZ] = UNDER, [MX, , MZ] = MOU, [PX, , PZ] = UP;
/** the balls on the riverbed: the hook ball, shot 7's ball, the stuck ones (x, z offsets from UNDER, sunk depth) */
export const HOOK_BALL = { x0: UX + 1.6, z: UZ, t0: 0, v: 0.36 };
export const SANK_BALL = { x0: UX + 2.2, z: UZ + 0.3, t0: T_SANK - 0.3, v: 0.45 };
export const STUCK: [number, number, number][] = [[-0.25, 0.35, 0.3], [0.3, -0.4, 0.25], [-0.45, -1.2, 0.35], [0.35, -2.0, 0.2], [-0.2, -2.9, 0.3], [0.5, -3.8, 0.3]];
export const LAST_BALL = { x0: UX + 0.9, z: UZ - 0.15, t0: T_SLOWEST - 0.2, v: 0.12 };
// shot 1 (hook): low on the riverbed, a ball rolls toward the lens out of the green gloom; punch on "rolled"
const S1a = (f: number) => {
  const b = rollAt(HOOK_BALL.x0, UY, HOOK_BALL.z, HOOK_BALL.t0, HOOK_BALL.v, f / FPS).pos;
  return dolly([b[0] - 1.25, UY + 0.32, b[2] + 0.55], [b[0] + 0.1, UY + 0.14, b[2]], pushK(f, 0, 0.0016, 0, 30) * pushK(f, fr(T_ROLLED) - 3, 0, 0.004, 25), { fov: 44, roll: 0.03 });
};
// shot 2: Paris from the south bank: the quay, the houses, soldiers along the far fields; push on "no post"
const S2a = (f: number) => dolly([NET_X + 26, Y + 5.5, RW + 16], [NET_X - 6, Y + 1.4, -RW - 10], pushK(f, 153, 0.0018, 0, 30) * pushK(f, fr(T_NO) - 3, 0, 0.004, 25), { fov: 50, roll: -0.03 });
// shot 3: Moulins: the three men at the table round a ball
const S3a = (f: number) => dolly([TABLE[0] + 0.3, Y + 1.9, TABLE[2] + 5.2], [TABLE[0], Y + 1.3, TABLE[2] - 0.2], pushK(f, 252, 0.0016, 0, 30) * pushK(f, fr(T_STRANGE) - 3, 0, 0.005, 25), { fov: 44, roll: 0.03 });
// shot 4: the queue at the post office window; push on "franc"
const S4a = (f: number) => dolly([POST[0] + 8.0, Y + 2.0, POST[2] + 6.4], [POST[0] + 3.2, Y + 1.3, POST[2] - 1.0], pushK(f, 375, 0.0018, 0, 30) * pushK(f, fr(T_FRANC) - 3, 0, 0.005, 25), { fov: 46, roll: -0.03 });
// shot 5: close on the table: the letters go in, the lid goes on, the ball spins on its fins
const S5a = (f: number) => dolly([TABLE[0] + 0.25, Y + 1.7, TABLE[2] + 2.3], [TABLE[0] + 0.0, Y + 1.25, TABLE[2] - 0.4], pushK(f, 483, 0.0016, 0, 30) * pushK(f, fr(T_SPIN) - 3, 0, 0.005, 25), { fov: 44, roll: 0.03 });
// shot 6: far upstream: Robert in a farmer's smock on the jetty slips a ball in; splash on "slipped"
const S6a = (f: number) => dolly([JETTY[0] + 5.5, Y + 1.6, JETTY[2] + 4.8], [JETTY[0] - 0.4, Y + 0.6, JETTY[2] - 1.2], pushK(f, 605, 0.0016, 0, 30) * pushK(f, fr(T_SLIPPED) - 3, 0, 0.004, 25), { fov: 48, roll: -0.03 });
// shot 7: the ball sinks onto the bed and rolls away; cut on "so" up to the soldiers staring at the empty water
const S7a = (f: number) => {
  const b = rollAt(SANK_BALL.x0, UY, SANK_BALL.z, SANK_BALL.t0, SANK_BALL.v, f / FPS).pos;
  return dolly([b[0] + 0.15, UY + 0.5, b[2] + 1.35], [b[0], UY + 0.22, b[2]], pushK(f, 748, 0.0016, 0, 30), { fov: 46, roll: -0.03 });
};
const S7b = (f: number) => dolly([PX - 5.6, Y + 1.8, -RW + 2.6], [PX - 3.7, Y + 1.35, -RW - 2.7], pushK(f, F_SO, 0.0018, 0, 30) * pushK(f, fr(T_NOTHING) - 3, 0, 0.005, 25), { fov: 46, roll: 0.03 });
// shot 8: the net across the river at Paris, Vonoven on the south bank by his post
export const VON: V3 = [NET_X + 2.2, Y, RW + 1.6];
const S8a = (f: number) => dolly([NET_X + 9, Y + 3.2, RW + 10], [NET_X + 1.8, Y + 0.6, RW - 1.0], pushK(f, 853, 0.0018, 0, 30) * pushK(f, fr(T_WAITED) - 3, 0, 0.004, 25), { fov: 54, roll: 0.03 });
// shot 9 (golden): morning: Vonoven and a helper haul the net up; nothing in it
const S9a = (f: number) => dolly([NET_X + 4.5, Y + 1.8, RW + 5.0], [NET_X, Y + 0.3, RW - 3.0], pushK(f, 953, 0.0018, 0, 30) * pushK(f, fr(T_EMPTY) - 3, 0, 0.006, 25), { fov: 46, roll: -0.03 });
// shot 10 (golden): dusk: the ice floes ram the net, the posts tear out on "torn"
const S10a = (f: number) => dolly([NET_X + 14, Y + 2.6, RW + 5.0], [NET_X + 1.5, Y + 0.0, RW - 1.0], pushK(f, 1017, 0.0018, 0, 30) * pushK(f, fr(T_TORN) - 3, 0, 0.006, 25), { fov: 54, roll: 0.04 });
// shot 11: "You see": the frozen January river from high on the quay, ice everywhere
const S11a = (f: number) => dolly([NET_X + 30, Y + 12, RW + 10], [NET_X - 10, WY, -2], pushK(f, 1082, 0.0016, 0, 30) * pushK(f, fr(T_ICE) - 3, 0, 0.004, 25), { fov: 50, roll: -0.03 });
// shot 12: the analogy in the square of Moulins: a ball stops at a parade rope; the crowd leans on it, the posts tip
const S12a = (f: number) => dolly([ROPE[0] + 1.2, Y + 1.7, ROPE[2] - 6.8], [ROPE[0], Y + 1.1, ROPE[2] + 0.4], pushK(f, 1192, 0.0016, 0, 30) * pushK(f, fr(T_CROWD) - 3, 0, 0.004, 25), { fov: 48, roll: 0.03 });
// shot 13: the posts give way in the ice; cut on "slow" down to the balls sunk in the mud
const S13a = (f: number) => dolly([NET_X + 9.5, Y + 2.2, RW + 5.5], [NET_X + 1.2, Y + 0.3, RW - 1.2], pushK(f, 1318, 0.0018, 0, 30) * pushK(f, fr(T_GAVE) - 3, 0, 0.005, 25), { fov: 46, roll: -0.04 });
const S13b = (f: number) => dolly([UX + 0.6, UY + 0.55, UZ + 1.9], [UX, UY + 0.06, UZ - 0.6], pushK(f, F_SLOW, 0.0018, 0, 30) * pushK(f, fr(T_STUCK) - 3, 0, 0.004, 25), { fov: 48, roll: 0.03 });
// shot 14: the siege ends: Paris cheers on the quay; Vonoven alone at his empty net shrugs on "arrived"
const S14a = (f: number) => dolly([NET_X + 9, Y + 2.2, RW + 10], [NET_X + 0.5, Y + 1.0, RW + 1.6], pushK(f, 1438, 0.0018, 0, 30) * pushK(f, fr(T_ARRIVED) - 3, 0, 0.006, 25), { fov: 46, roll: 0.03 });
// shot 15 (golden): years later, upstream: a fisherman lifts a muddy ball out of his net
export const BOAT: V3 = [PX - 14, WY, RW - 5];
const S15a = (f: number) => dolly([BOAT[0] + 4.0, WY + 2.3, BOAT[2] + 3.4], [BOAT[0], WY + 0.75, BOAT[2]], pushK(f, 1540, 0.0016, 0, 30) * pushK(f, fr(T_EIGHTY) - 3, 0, 0.004, 25), { fov: 46, roll: -0.03 });
// shot 16 (golden): a postman hands an old letter to a grandmother and her grandson at their door in Moulins
export const DOOR: V3 = [MX + 17, Y, MZ - 12];
const S16a = (f: number) => dolly([DOOR[0] + 0.2, Y + 1.9, DOOR[2] + 7.0], [DOOR[0] + 0.2, Y + 1.15, DOOR[2] + 0.8], pushK(f, 1666, 0.0016, 0, 30) * pushK(f, fr(T_GRAND) - 3, 0, 0.004, 25), { fov: 46, roll: 0.03 });
// shot 17: the riverbed: balls half sunk in the mud; cut on "slowest" low to one still rolling, a hair at a time
const S17a = (f: number) => dolly([UX + 0.5, UY + 0.75, UZ + 2.7], [UX, UY + 0.08, UZ - 0.9], pushK(f, 1786, 0.0014, 0, 30) * pushK(f, fr(T_TWENTY) - 3, 0, 0.004, 25), { fov: 50, roll: -0.03 });
const S17b = (f: number) => {
  const b = rollAt(LAST_BALL.x0, UY, LAST_BALL.z, LAST_BALL.t0, LAST_BALL.v, f / FPS).pos;
  return dolly([b[0] - 1.1, UY + 0.3, b[2] + 0.75], [b[0] + 0.05, UY + 0.12, b[2]], pushK(f, F_STILL, 0.0018, 0, 30) * pushK(f, fr(T_WAY2) - 3, 0, 0.004, 25), { fov: 44, roll: 0.03 });
};

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 153, s: S2a }],
  3: [{ f: 252, s: S3a }],
  4: [{ f: 375, s: S4a }],
  5: [{ f: 483, s: S5a }],
  6: [{ f: 605, s: S6a }],
  7: [{ f: 748, s: S7a }, { f: F_SO, cut: true, s: S7b }],
  8: [{ f: 853, s: S8a }],
  9: [{ f: 953, s: S9a }],
  10: [{ f: 1017, s: S10a }],
  11: [{ f: 1082, s: S11a }],
  12: [{ f: 1192, s: S12a }],
  13: [{ f: 1318, s: S13a }, { f: F_SLOW, cut: true, s: S13b }],
  14: [{ f: 1438, s: S14a }],
  15: [{ f: 1540, s: S15a }],
  16: [{ f: 1666, s: S16a }],
  17: [{ f: 1786, s: S17a }, { f: F_STILL, cut: true, s: S17b }],
};

// impact kicks: [seconds, strength]: the splash, the net torn, the posts give way, the rope posts fall
const KICKS: [number, number][] = [[T_SLIPPED + 0.25, 0.25], [T_TORN - 2 / 30, 0.35], [T_ROPE - 2 / 30, 0.25], [T_GAVE - 2 / 30, 0.3]];
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
const ballF = (b: { x0: number; z: number; t0: number; v: number }) => (f: number) => rollAt(b.x0, UY, b.z, b.t0, b.v, f / FPS).pos;
export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: ballF(HOOK_BALL) },
  { f: 153, cInf: 0 },
  { f: 252, cInf: 12, focus: at([TABLE[0], Y + 1.6, TABLE[2] - 0.9]) },
  { f: 375, cInf: 10, focus: at([POST[0] + 1.6, Y + 1.6, POST[2] + 1.6]) },
  { f: 483, cInf: 14, focus: at([TABLE[0], Y + 1.0, TABLE[2]]) },
  { f: 605, cInf: 11, focus: at([JETTY[0] - 0.2, Y + 1.0, JETTY[2] - 0.6]) },
  { f: 748, cInf: 14, focus: ballF(SANK_BALL) },
  { f: F_SO, cInf: 10, focus: at([PX - 3, Y + 1.5, -RW - 2.6]) },
  { f: 853, cInf: 0 },
  { f: 953, cInf: 11, focus: at([NET_X + 1.0, Y + 1.0, RW + 0.6]) },
  { f: 1017, cInf: 0 },
  { f: 1192, cInf: 10, focus: at([ROPE[0], Y + 1.4, ROPE[2] + 1.0]) },
  { f: 1318, cInf: 0 },
  { f: F_SLOW, cInf: 12, focus: at([UX - 0.25, UY + 0.1, UZ + 0.35]) },
  { f: 1438, cInf: 11, focus: at([VON[0], Y + 1.5, VON[2]]) },
  { f: 1540, cInf: 10, focus: at([BOAT[0], WY + 1.3, BOAT[2]]) },
  { f: 1666, cInf: 12, focus: at([DOOR[0], Y + 1.5, DOOR[2] + 1.2]) },
  { f: 1786, cInf: 7, focus: at([UX - 0.25, UY + 0.1, UZ + 0.35]) },
  { f: F_STILL, cInf: 15, focus: ballF(LAST_BALL) },
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
  { a: 853, b: 953, kit: "plant_bush", pos: [NET_X + 9.2, D0, RW + 5.6], s: 0.9 },
  { a: 1666, b: 1786, kit: "plant_bush", pos: [DOOR[0] - 2.4, D0, DOOR[2] + 3.4], s: 0.7 },
];
void MZ; void PZ;
