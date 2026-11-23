// Timeline of "America's First Car Race Was Won at 5 mph": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): a snowy Chicago street of brick terraces along x at
// z = 0 (the horse-tram rails at RAIL_Z, the motor lane at LANE_Z, a blacksmith's lean-to on the north pavement), the
// start and finish line in Jackson Park at x = -400 (a striped banner across the road, crowds behind ropes), the road
// to Evanston at x = +400 (snow fields, rail fences, pines) and a warm dining room at z = +400 (the soup and the turkey).
// The motor carriages are 3D (world.ts) and placed per shot by cars(); the people sit on their benches as cards.
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1990;
export const D0 = 1.2; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the street (centre), its rails and motor lane (z), the smithy front, the park line, the road, the room */
export const RAIL_Z = -1.8, LANE_Z = 1.8, WALK_Y = 0.18;
export const SMITH: V3 = [44, D0 + WALK_Y, -7.0];
export const PX = -400;
export const RX = 400;
export const ROOM: V3 = [0, D0, 400];

// story beats (seconds on the voice clock)
export const T_WON = 2.11, T_FIVE = 2.76, T_SECOND = 4.75, T_PASSED = 6.4;
export const T_CHICAGO = 7.39, T_THANKS = 8.22, T_PAY = 11.68, T_DOLLARS = 12.53, T_CAR1 = 13.88, T_UMPIRE = 17.25;
export const T_EIGHTY = 19.06, T_SIGN = 19.56, T_STORM = 21.09, T_BURIES = 21.52, T_SNOW = 22.33, T_SIX = 23.49, T_START = 24.6;
export const T_SLIDES = 25.99, T_TRAM = 26.93, T_ELEC = 27.6, T_GIVE = 28.65;
export const T_STEER = 30.32, T_SNAPS = 30.71, T_SMITH = 31.27, T_FIX = 32.11, T_FALLS = 33.01, T_BEHIND = 33.67;
export const T_OSCAR = 34.64, T_WIND = 36.44, T_EYES = 37.09, T_CLOSE = 37.73;
export const T_ENGINE = 38.73, T_FINE = 39.24, T_WRONG = 40.02, T_MAN = 40.45;
export const T_SEE = 41.15, T_STILL = 43.7, T_BLOW = 45.02, T_SOUP = 45.66, T_COOL = 46.02, T_OPEN = 47.01, T_ICY = 48.49, T_FACE = 49.29;
export const T_TEN = 50.4, T_WINS = 51.45, T_LATE = 52.73, T_ROLLS = 53.81, T_KING = 55.29, T_STEERING = 56.36, T_HOLDING = 57.6, T_OTHER = 58.77;
export const T_TURKEY = 60.83, T_UMP2 = 61.69, T_SECOND2 = 62.42, T_PLACE = 62.77;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "street" | "park" | "road" | "room";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 126, "street"), mk(2, 126, 219, "park", "golden"), mk(3, 219, 325, "street"), mk(4, 325, 463, "street"),
  mk(5, 463, 563, "park"), mk(6, 563, 630, "street"), mk(7, 630, 695, "street", "golden"), mk(8, 695, 770, "park"),
  mk(9, 770, 822, "street"), mk(10, 822, 880, "road"), mk(11, 880, 936, "street"), mk(12, 936, 1036, "street"),
  mk(13, 1036, 1155, "road"), mk(14, 1155, 1231, "road"), mk(15, 1231, 1401, "room"), mk(16, 1401, 1500, "road"),
  mk(17, 1500, 1580, "park", "golden"), mk(18, 1580, 1780, "park", "golden"), mk(19, 1780, 1840, "room", "golden"),
  mk(20, 1840, TOTAL, "park", "golden"),
];
/** crossfades (frames) at place / time changes: into the room and back out of it */
export const XFADE: Record<number, number> = { 15: 10, 16: 8 };
export const FLASH_AT = 219;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fr = (t: number) => Math.round(t * FPS);

// ---------------- the story physics: where every carriage is ----------------
/** carriage kinds: 0 Duryea wagon, 1 Mueller's Benz, 2 Macy's Benz, 3 De La Vergne Benz, 4 Electrobat, 5 Sturges electric */
export type CarPose = { k: number; x: number; z: number; yaw: number; roll?: number };
/** the Duryea wagon on the street in shot 11: rolls toward -x until the steering snaps, swerves and stops */
const duryea11 = (t: number) => {
  const t0 = SHOTS[10].a / FPS, ts = T_SNAPS - 0.05;
  const run = (u: number) => 2.2 * u;
  const x = 30 - (t < ts ? run(t - t0) : run(ts - t0) + 1.1 * easeOut(clamp01((t - ts) / 0.9)));
  return { x, yaw: Math.PI + 0.45 * smooth((t - ts) / 0.7), z: LANE_Z + 0.8 * smooth((t - ts) / 0.9) };
};
/** the tram front (+x) and the Macy Benz sliding into its back platform in shot 9 */
export const tramX9 = (t: number) => { const t0 = SHOTS[8].a / FPS, ti = T_TRAM - 0.06; return t < ti ? -6 + 1.4 * (t - t0) : -6 + 1.4 * (ti - t0) + 0.5 * easeOut(clamp01((t - ti) / 0.8)); };
const macy9 = (t: number) => {
  const ti = T_TRAM - 0.06, rear = tramX9(ti) - 6.05;
  const x = t < ti ? rear - 4.2 * (ti - t) : rear - 0.25 * Math.sin(Math.PI * clamp01((t - ti) / 0.5));
  return { x, yaw: 0.42 * smooth((t - (T_SLIDES - 0.1)) / 0.8) - 0.12 * smooth((t - ti) / 0.4), z: RAIL_Z + 0.15 };
};
/** the motor carriages in shot id at t (seconds) */
export const cars = (id: number, t: number): CarPose[] => {
  switch (id) {
    case 1: return [{ k: 0, x: 27 - 2.2 * t, z: LANE_Z, yaw: Math.PI }];
    case 2: return [{ k: 1, x: PX - 9 + 1.5 * (t - 4.2), z: 0.6, yaw: 0 }];
    case 3: return [{ k: 2, x: 34 - 2.0 * (t - 7.3), z: LANE_Z, yaw: Math.PI }];
    case 5: return [{ k: 1, x: PX - 6, z: 0, yaw: 0 }];
    case 8: return [0, 1, 2, 3, 4, 5].map((k, i) => ({ k, x: PX - 2.2 - Math.floor(i / 3) * 4.2, z: -3.4 + (i % 3) * 3.4 + Math.floor(i / 3) * 1.4, yaw: 0 }));
    case 9: { const m = macy9(t); return [{ k: 2, x: m.x, z: m.z, yaw: m.yaw }]; }
    case 10: return [{ k: 4, x: RX + 2, z: 0, yaw: 0 }, { k: 5, x: RX - 26, z: 0.4, yaw: 0.1 }];
    case 11: { const d = duryea11(t); return [{ k: 0, x: d.x, z: d.z, yaw: d.yaw }]; }
    case 12: return [{ k: 0, x: SMITH[0] + 3.4, z: -2.9, yaw: Math.PI - 0.25 }];
    case 13: case 14: case 16: return [{ k: 1, x: benzRoadX(t), z: 0, yaw: 0 }];
    case 17: return [{ k: 0, x: PX - 3.3 + 2.2 * (t - T_WINS + 1.5), z: 0, yaw: 0 }];
    case 18: return [{ k: 1, x: PX - 13 + 1.5 * Math.min(t - 52.7, 4.6) + 0.9 * easeOut(clamp01((t - 57.3) / 2.0)), z: 0.6, yaw: 0 }];
    case 20: return [{ k: 1, x: PX + 1.5, z: 0.6, yaw: 0 }];
    default: return [];
  }
};
/** Mueller's Benz on the Evanston road: a slow steady crawl */
export const benzRoadX = (t: number) => RX - 30 + 1.9 * (t - 34);
/** the tram in shot 9 only */
export const tramAt = (id: number, t: number): V3 | null => (id === 9 ? [tramX9(t), D0 + 0.13, RAIL_Z] : id === 3 ? [-20 + 1.3 * (t - 7.3), D0 + 0.13, RAIL_Z] : null);
/** the seats on a carriage (local x along the heading, z to its left): driver, passenger */
export const SEATS: Record<number, [number, number][]> = {
  0: [[-0.55, -0.32], [-0.55, 0.34]], 1: [[-0.35, -0.32], [-0.35, 0.34]], 2: [[-0.35, -0.32], [-0.35, 0.34]], 3: [[-0.35, -0.32], [-0.35, 0.34]],
  4: [[-0.2, -0.32], [-0.2, 0.34]], 5: [[-0.3, -0.32], [-0.3, 0.34]],
};
/** seat height above the ground per kind */
export const SEAT_Y: Record<number, number> = { 0: 1.28, 1: 1.12, 2: 1.12, 3: 1.12, 4: 1.3, 5: 1.2 };
/** world point of a seat on a posed carriage */
export const seatAt = (c: CarPose, s: number): V3 => {
  const [lx, lz] = SEATS[c.k][s], cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
  return [c.x + lx * cy + lz * sy, D0 + SEAT_Y[c.k], c.z - lx * sy + lz * cy];
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
const P = (f: number, a: number, t: number, punch = 0.005) => pushK(f, a, 0.0017, 0, 30) * pushK(f, fr(t) - 3, 0, punch, 25);
const Y = D0;
const carOf = (id: number, f: number, i = 0) => cars(id, f / FPS)[i];
/** a camera riding with car i of shot id: offsets along its heading (x), up (y) and to its left (z) */
const ride = (id: number, f: number, pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => {
  const c = carOf(id, f), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
  const w = (o: V3): V3 => [c.x + o[0] * cy + o[2] * sy, D0 + o[1], c.z - o[0] * sy + o[2] * cy];
  return dolly(w(pos), w(look), k, rest);
};

// shot 1 (hook): low on the snowy street, the Duryea wagon crawls toward us, a walker keeping pace on the pavement
const S1 = (f: number) => dolly([14, Y + 1.25, 5.6], [24, Y + 1.5, 2.4], P(f, 0, T_FIVE, 0.005), { fov: 44, roll: 0.03 });
// shot 2: dusk at the finish: the Benz rolls in, the umpire steering and holding up the driver
const S2 = (f: number) => ride(2, f, [3.8, 1.8, 1.9], [-0.35, 1.55, 0.0], P(f, 126, T_PASSED, 0.006), { fov: 44, roll: -0.03 });
// shot 3: wide street from first-floor height: snow, brick terraces, a family carrying the turkey home
const S3 = (f: number) => dolly([-3, Y + 4.6, -2.6], [12, Y + 1.3, 5.0], P(f, 219, T_THANKS, 0.003), { fov: 52, roll: 0.03 });
// shot 4: the newsboy on the pavement holding up the paper with the prize
const NEWS: V3 = [-6, Y + WALK_Y, -6.2];
const S4 = (f: number) => dolly([NEWS[0] + 1.6, Y + 1.55, NEWS[2] + 5.0], [NEWS[0] - 0.2, Y + 1.35, NEWS[2]], P(f, 325, T_DOLLARS, 0.005), { fov: 44, roll: -0.03 });
// shot 5: the park: Mueller's Benz at the start, the umpire climbing on beside him; push to the umpire on "umpire"
const S5 = (f: number) => ride(5, f, [4.0, 1.85, 1.9], [-0.35, 1.6, 0.0], P(f, 463, T_UMPIRE, 0.006), { fov: 42, roll: 0.03 });
// shot 6: the sign-up table on the pavement: a queue of inventors
const DESK: V3 = [-24, Y + WALK_Y, -6.4];
const S6 = (f: number) => dolly([DESK[0] + 5.2, Y + 1.7, DESK[2] + 5.4], [DESK[0] + 1.0, Y + 1.3, DESK[2]], P(f, 563, T_SIGN, 0.004), { fov: 48, roll: 0.03 });
// shot 7: the night before: the storm fills the street with snow
const S7 = (f: number) => dolly([6, Y + 2.2, 3.0], [-24, Y + 3.2, -0.5], P(f, 630, T_SNOW, 0.004), { fov: 50, roll: -0.03 });
// shot 8: the start line in the park: six carriages side by side
const S8 = (f: number) => dolly([PX + 14, Y + 4.2, 3.0], [PX - 4.0, Y + 1.0, 0.2], P(f, 695, T_SIX, 0.004), { fov: 52, roll: 0.03 });
// shot 9: side view: the Macy Benz slides on the snow into the back of the horse tram
const S9 = (f: number) => dolly([tramX9(T_TRAM) - 6.5, Y + 1.9, 9.5], [tramX9(T_TRAM) - 6.4, Y + 1.2, RAIL_Z], P(f, 770, T_TRAM, 0.007), { fov: 46, roll: -0.03 });
// shot 10: the road: the Electrobat stopped dead in the snow
const S10 = (f: number) => dolly([RX + 6.0, Y + 1.7, 4.6], [RX + 1.6, Y + 1.45, 0.0], P(f, 822, T_GIVE, 0.006), { fov: 44, roll: 0.03 });
// shot 11: the Duryea wagon on the street: the steering snaps, it swerves to a stop
const S11 = (f: number) => dolly([18, Y + 1.5, 6.4], [24.5, Y + 1.4, 2.0], P(f, 880, T_SNAPS, 0.007), { fov: 44, roll: -0.03 });
// shot 12: the smithy: the blacksmith hammers the steering arm, Duryea waits
const S12 = (f: number) => dolly([SMITH[0] - 0.6, Y + 1.8, SMITH[2] + 6.4], [SMITH[0] + 0.9, Y + 1.25, SMITH[2] + 0.3], P(f, 936, T_BEHIND, 0.005), { fov: 46, roll: 0.03 });
// shot 13: riding beside Mueller's Benz on the road: the wind, his eyes start to close
const S13a = (f: number) => ride(13, f, [4.2, 1.9, 4.4], [-0.3, 1.5, 0], pushK(f, 1036, 0.0015), { fov: 46, roll: 0.03 });
const S13b = (f: number) => ride(13, f, [2.2, 1.7, 1.2], [-0.35, 1.62, -0.32], P(f, fr(T_EYES) - 4, T_CLOSE, 0.006), { fov: 40, roll: 0.03 });
// shot 14: low behind the Benz: the engine puffs away happily, the driver slumps
const S14 = (f: number) => ride(14, f, [-4.6, 1.5, 3.0], [0.2, 1.3, -0.1], P(f, 1155, T_MAN, 0.005), { fov: 46, roll: -0.03 });
// shot 15: the dining room: steam rises from a bowl of soup, then she blows on it
const S15 = (f: number) => dolly([ROOM[0] + 0.6, Y + 1.55, ROOM[2] + 3.6], [ROOM[0] - 0.1, Y + 1.35, ROOM[2] - 0.2], P(f, 1231, T_BLOW, 0.006), { fov: 44, roll: 0.03 });
// shot 16: close in front of Mueller: icy wind streaks into his face
const S16 = (f: number) => ride(16, f, [2.6, 1.72, -0.9], [-0.35, 1.6, -0.32], P(f, 1401, T_ICY, 0.006), { fov: 40, roll: -0.03 });
// shot 17: dusk at the finish banner: the Duryea wagon rolls under it, the crowd cheers
const S17 = (f: number) => dolly([PX + 8.0, Y + 1.8, 2.8], [PX - 1.0, Y + 2.0, -0.3], P(f, 1500, T_WINS, 0.006), { fov: 48, roll: 0.03 });
// shot 18: the Benz rolls in late (wide), then close on the umpire steering and holding up Mueller
const S18a = (f: number) => dolly([PX + 6, Y + 2.0, 8.0], [PX - 6, Y + 1.5, 0.3], P(f, 1580, T_ROLLS, 0.004), { fov: 48, roll: -0.03 });
const S18b = (f: number) => ride(18, f, [3.0, 1.75, 1.3], [-0.35, 1.55, 0.0], P(f, fr(T_STEERING) - 3, T_HOLDING, 0.006), { fov: 40, roll: -0.03 });
// shot 19: the dining room at dusk: the family round the turkey
const S19 = (f: number) => dolly([ROOM[0] + 0.3, Y + 1.9, ROOM[2] + 4.2], [ROOM[0], Y + 1.1, ROOM[2] - 0.6], P(f, 1780, T_TURKEY, 0.005), { fov: 46, roll: 0.03 });
// shot 20: past the finish: the umpire grins at the wheel, Mueller asleep on his shoulder, the crowd laughing
const S20 = (f: number) => ride(20, f, [3.6, 1.8, 1.5], [-0.35, 1.55, 0.0], P(f, 1840, T_SECOND2, 0.006), { fov: 42, roll: 0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 126, s: S2 }], 3: [{ f: 219, s: S3 }], 4: [{ f: 325, s: S4 }], 5: [{ f: 463, s: S5 }], 6: [{ f: 563, s: S6 }],
  7: [{ f: 630, s: S7 }], 8: [{ f: 695, s: S8 }], 9: [{ f: 770, s: S9 }], 10: [{ f: 822, s: S10 }], 11: [{ f: 880, s: S11 }], 12: [{ f: 936, s: S12 }],
  13: [{ f: 1036, s: S13a }, { f: fr(T_EYES) - 4, dur: 30, s: S13b }], 14: [{ f: 1155, s: S14 }], 15: [{ f: 1231, s: S15 }], 16: [{ f: 1401, s: S16 }],
  17: [{ f: 1500, s: S17 }], 18: [{ f: 1580, s: S18a }, { f: fr(T_STEERING) - 3, cut: true, s: S18b }], 19: [{ f: 1780, s: S19 }], 20: [{ f: 1840, s: S20 }],
};
/** in-shot camera cuts (frames), listed in shots.json `planned` */
export const CUT_FRAMES = [fr(T_STEERING) - 3];

// impact kicks: [seconds, strength]: the tram bump, the steering snap, the hammer
const KICKS: [number, number][] = [[T_TRAM - 2 / 30, 0.35], [T_SNAPS - 2 / 30, 0.3]];
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
const seatOf = (id: number, s: number) => (f: number) => { const p = seatAt(carOf(id, f), s); return [p[0], p[1] + 0.75, p[2]] as V3; };
export const DOF: Dof[] = [
  { f: 0, cInf: 13, focus: (f) => { const c = carOf(1, f); return [c.x, Y + 2.0, c.z] as V3; } },
  { f: 126, cInf: 12, focus: seatOf(2, 0) },
  { f: 219, cInf: 0 },
  { f: 325, cInf: 12, focus: at([NEWS[0], Y + 1.9, NEWS[2]]) },
  { f: 463, cInf: 11, focus: seatOf(5, 1) },
  { f: 563, cInf: 7, focus: at([DESK[0] + 1.0, Y + 1.8, DESK[2]]) },
  { f: 630, cInf: 0 },
  { f: 770, cInf: 0 },
  { f: 822, cInf: 10, focus: at([RX + 1.8, Y + 2.0, 0]) },
  { f: 880, cInf: 0 },
  { f: 936, cInf: 10, focus: at([SMITH[0], Y + 1.8, SMITH[2] + 0.3]) },
  { f: 1036, cInf: 10, focus: seatOf(13, 0) },
  { f: fr(T_EYES) - 4, dur: 20, cInf: 14, focus: seatOf(13, 0) },
  { f: 1155, cInf: 7, focus: seatOf(14, 0) },
  { f: 1231, cInf: 13, focus: at([ROOM[0] - 0.1, Y + 1.5, ROOM[2] - 0.2]) },
  { f: 1401, cInf: 14, focus: seatOf(16, 0) },
  { f: 1500, cInf: 0 },
  { f: 1580, cInf: 0 },
  { f: fr(T_STEERING) - 3, cInf: 13, focus: seatOf(18, 1) },
  { f: 1780, cInf: 10, focus: at([ROOM[0], Y + 1.5, ROOM[2] - 0.6]) },
  { f: 1840, cInf: 12, focus: seatOf(20, 1) },
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
  { a: 219, b: 325, kit: "lantern", pos: [-4.2, D0 + WALK_Y, 5.0], s: 3.0 },
  { a: 695, b: 770, kit: "tree_cone", pos: [PX + 9, D0, 9.5], s: 7.0 },
  { a: 822, b: 880, kit: "tree_cone", pos: [RX + 8.5, D0, 7.5], s: 6.0 },
  { a: 1500, b: 1580, kit: "lantern", pos: [PX + 5.6, D0, 4.2], s: 3.0 },
];
export { NEWS, DESK };
