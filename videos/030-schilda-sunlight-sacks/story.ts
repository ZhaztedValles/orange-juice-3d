// Timeline of "The Legend of the Town That Forgot Its Windows": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): the market square of Schilda at the origin (timbered
// houses round it, the new three-walled town hall at the back), the council room at x = KX, the prince's court at
// z = CT[2], the roofless hall seen from inside at z = OH[2], the pitch-dark hall at x = DK[0] (a closed dark box) and
// a far-away town at x = SX for the ending.
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2000;
export const D0 = 1.2; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the town hall on the square: a triangle of walls, front corners (+-HWX, HZ), back corner (0, HBZ); wall height HH */
export const HWX = 4.6, HZ = 1.0, HBZ = -7.0, HH = 6.2, HR = 3.6; // HR: roof apex above the walls
export const DOORW = 0.85, DOORH = 2.5; // half width and height of the door
export const SX = 600; // the far-away town
export const KX = -600; // the council room
export const CT: V3 = [0, D0, -600]; // the prince's court
export const OH: V3 = [0, D0, 600]; // the roofless hall, inside
export const DK: V3 = [1200, D0, 0]; // the hall in the dark, inside

// story beats (seconds on the voice clock)
export const T_CLEVER = 2.01, T_FOOLISH = 2.92, T_PURPOSE = 3.48;
export const T_SCHILDA = 4.94, T_TALES = 5.95, T_PRINTED = 6.35;
export const T_MEN = 8.35, T_WISE = 8.93, T_PRINCES = 9.43, T_CALLING = 10.05, T_ADVICE = 10.88;
export const T_SOON = 11.75, T_NOMEN = 12.0, T_HOME = 12.82;
export const T_ELDERS = 13.75, T_AGREED = 14.12, T_WISDOM = 15.03, T_FOOLISH2 = 16.14, T_HOME2 = 17.18;
export const T_FIRST = 17.86, T_BUILT = 18.32, T_HALL = 19.3, T_THREE = 19.81, T_WALLS = 20.38, T_PROUD = 20.95, T_ROOF = 21.32;
export const T_OPENING = 22.23, T_WHOLE = 23.02, T_MARCHED = 23.62, T_INSIDE = 23.98;
export const T_DARK = 25.48, T_SPECK = 27.0, T_SUNNY = 27.81;
export const T_NOON = 28.93, T_CAUGHT = 29.35, T_SACKS = 30.25, T_BUCKETS = 30.68, T_MOUSE = 31.4, T_RAN = 32.12, T_INDOORS = 32.44;
export const T_POURED = 33.42, T_STILL = 34.09, T_DARK2 = 34.38;
export const T_TRAVELLER = 35.2, T_TOLD = 35.6, T_ROOF2 = 36.35, T_OFF = 36.6;
export const T_LIGHT = 37.2, T_SUMMER = 38.21, T_COUNCIL = 38.6, T_SKY = 39.42;
export const T_WINTER = 40.27, T_BACK = 41.0, T_DARK3 = 42.05;
export const T_COUNCILLOR = 43.52, T_SAW = 44.02, T_BEAM = 44.6, T_CRACK = 45.4;
export const T_WIN1 = 46.51, T_FORGOT = 47.42, T_WIN2 = 47.85;
export const T_LIKELY = 48.88, T_JOKES = 50.29, T_PROUD2 = 50.9, T_TOWNS = 51.4;
export const T_LEGEND = 52.9, T_PLAYED = 53.92, T_FOOL = 54.3, T_STUCK = 55.54;
export const T_BURNED = 56.98, T_SCATTERED = 57.94, T_WORLD = 58.98;
export const T_STORY = 60.3, T_EVERY = 61.66, T_FEW = 62.61, T_SCHILDAS = 62.86;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "square" | "court" | "room" | "open" | "dark" | "far";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 128, "square"), mk(2, 128, 240, "square"), mk(3, 240, 349, "court"), mk(4, 349, 401, "square"),
  mk(5, 401, 532, "room"), mk(6, 532, 658, "square"), mk(7, 658, 761, "square"), mk(8, 761, 858, "dark"),
  mk(9, 858, 996, "square"), mk(10, 996, 1047, "dark"), mk(11, 1047, 1113, "square"), mk(12, 1113, 1199, "open"),
  mk(13, 1199, 1279, "square", "golden"), mk(14, 1279, 1392, "dark"), mk(15, 1392, 1456, "square"), mk(16, 1456, 1577, "room"),
  mk(17, 1577, 1687, "square"), mk(18, 1687, 1790, "square", "golden"), mk(19, 1790, TOTAL, "far", "golden"),
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 3: 8, 5: 8, 12: 8, 13: 10, 16: 8, 17: 8, 18: 10, 19: 10 };
export const FLASH_AT = 128;

/** the town hall's walls (0..1 built) in shot id at t: they rise in shot 6, before that the square has no hall */
export const wallsAt = (id: number, t: number) => (id === 6 ? smooth((t - T_BUILT + 0.07) / (T_WALLS + 0.3 - T_BUILT)) : id === 4 || id === 2 ? 0 : 1);
/** the roof's offset: [lift (m), sideways (m)]; drops on in shot 6, lifts away in 11, gone in 12, comes back in 13 */
export const roofAt = (id: number, t: number): [number, number] => {
  if (id === 2 || id === 4) return [40, 0];
  if (id === 6) { const k = 1 - easeOut(clamp01((t - T_ROOF + 0.4) / 0.5)); return [14 * k, 0]; }
  if (id === 11) { const k = smooth((t - T_OFF + 0.07) / 0.9); return [12 * k, 5 * k]; }
  if (id === 13) { const k = 1 - smooth((t - T_BACK + 0.6) / 0.6); return [12 * k, 0]; }
  return [0, 0];
};
/** the windows knocked into the hall's front wall: 0 none, then grow-in amounts per window */
export const windowsOn = (id: number) => id >= 15 && id !== 16;

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
export const ELDER: V3 = [0.55, Y, 4.4]; // the old councillor in front of the hall
export const TABLE: V3 = [KX + 0.2, Y, -1.3]; // the council table
export const THRONE: V3 = [CT[0] + 0.4, Y, CT[2] - 2.6]; // the prince on his throne
export const OTABLE: V3 = [OH[0], Y, OH[2] - 1.2]; // the council table in the roofless hall
export const DOOR: V3 = [0, Y, HZ]; // the hall door
const HALLC: V3 = [0, Y + 3.4, HZ - 1.5];

// shot 1 (hook): the windowless hall, the proud old councillor and the townsfolk; the fool's cap lands on "foolish"
const S1 = (f: number) => dolly([0.9, Y + 2.2, 12.4], [0.1, Y + 2.2, 2.4], P(f, 0, T_FOOLISH, 0.007), { fov: 46, roll: 0.03 });
// shot 2: the square of Schilda, wide: timbered houses, townsfolk, the empty plot where the hall will stand
const S2 = (f: number) => dolly([12, Y + 5.2, 26], [0, Y + 2.8, -1], P(f, 128, T_PRINTED, 0.003), { fov: 50, roll: 0.03 });
// shot 3: the prince's court: a prince on his throne, the wise men of Schilda giving advice
const S3 = (f: number) => dolly([CT[0] + 0.9, Y + 2.0, CT[2] + 5.6], [CT[0] - 0.3, Y + 1.5, CT[2] - 1.2], P(f, 240, T_CALLING, 0.006), { fov: 46, roll: -0.03 });
// shot 4: the square with only the wives left, arms folded
const S4 = (f: number) => dolly([-0.8, Y + 1.9, 8.6], [0, Y + 1.6, 2.6], P(f, 349, T_HOME, 0.008), { fov: 44, roll: 0.04 });
// shot 5: the council room: the elders round the table agree on the plan
const S5 = (f: number) => dolly([TABLE[0] + 0.9, Y + 2.1, TABLE[2] + 5.0], [TABLE[0] + 0.2, Y + 1.45, TABLE[2] - 0.4], P(f, 401, T_FOOLISH2, 0.006), { fov: 44, roll: 0.03 });
// shot 6: the square: the three walls rise, the roof drops on
const S6 = (f: number) => dolly([5.5, Y + 4.0, 19.5], [0, Y + 4.0, -1.5], P(f, 532, T_ROOF, 0.006), { fov: 50, roll: -0.03 });
// shot 7: opening day: the whole town marches in through the door
const S7 = (f: number) => dolly([-2.6, Y + 2.6, 12.5], [0, Y + 2.0, 1.6], P(f, 658, T_MARCHED, 0.005), { fov: 46, roll: 0.03 });
// shots 8, 10, 14: inside the dark hall: only eyes
const SD = (a: number, t: number) => (f: number) => dolly([DK[0], Y + 1.75, DK[2] + 4.2], [DK[0], Y + 1.7, DK[2]], P(f, a, t, 0.008), { fov: 44, roll: 0.02 });
// shot 9: noon on the square: sacks, buckets and a mousetrap held up to the sun, then the run to the door
const S9 = (f: number) => dolly([1.6, Y + 2.2, 11.0], [0, Y + 2.0, 3.4], P(f, 858, T_MOUSE, 0.008), { fov: 48, roll: -0.03 });
// shot 11: the traveller points up: the roof lifts away
const S11 = (f: number) => dolly([-4.5, Y + 3.4, 17.5], [0, Y + 4.4, -1], P(f, 1047, T_OFF, 0.005), { fov: 50, roll: 0.03 });
// shot 12: inside the roofless hall: the council meets under the open sky
const S12 = (f: number) => dolly([OH[0] + 0.9, Y + 1.6, OH[2] + 4.2], [OH[0], Y + 2.6, OH[2] - 1.6], P(f, 1113, T_SKY, 0.005), { fov: 48, roll: -0.03 });
// shot 13: winter evening: snow, the roof comes back down
const S13 = (f: number) => dolly([4.0, Y + 3.2, 17.0], [0, Y + 4.2, -1], P(f, 1199, T_DARK3, 0.005), { fov: 50, roll: 0.03 });
// shot 15: the hall's front: windows knocked in
const S15 = (f: number) => dolly([1.6, Y + 2.8, 12.6], [0, Y + 3.0, 1.0], P(f, 1392, T_WIN2, 0.008), { fov: 48, roll: -0.04 });
// shot 16: the council room by lamplight: an old storyteller with the joke book and laughing children
const S16 = (f: number) => dolly([TABLE[0] - 1.4, Y + 1.7, TABLE[2] + 4.2], [TABLE[0] + 0.1, Y + 1.3, TABLE[2] - 0.3], P(f, 1456, T_JOKES, 0.005), { fov: 44, roll: 0.03 });
// shot 17: the square: everyone in fool's caps, laughing
const S17 = (f: number) => dolly([-1.6, Y + 2.4, 12.4], [0, Y + 2.1, 2.4], P(f, 1577, T_STUCK, 0.006), { fov: 48, roll: -0.03 });
// shot 18: golden evening: smoke over the roofs, the townsfolk walk off with their bundles
const S18 = (f: number) => dolly([9, Y + 3.0, 24], [0, Y + 3.0, 4], P(f, 1687, T_SCATTERED, 0.004), { fov: 50, roll: 0.03 });
// shot 19: a far-away town at sunset: a newcomer in a fool's cap catching sunshine in a sack, the locals amazed
const S19 = (f: number) => dolly([SX + 0.6, Y + 2.0, 9.6], [SX - 0.2, Y + 1.8, 1.0], P(f, 1790, T_SCHILDAS, 0.006), { fov: 46, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 128, s: S2 }], 3: [{ f: 240, s: S3 }], 4: [{ f: 349, s: S4 }], 5: [{ f: 401, s: S5 }],
  6: [{ f: 532, s: S6 }], 7: [{ f: 658, s: S7 }], 8: [{ f: 761, s: SD(761, T_DARK) }], 9: [{ f: 858, s: S9 }],
  10: [{ f: 996, s: SD(996, T_STILL) }], 11: [{ f: 1047, s: S11 }], 12: [{ f: 1113, s: S12 }], 13: [{ f: 1199, s: S13 }],
  14: [{ f: 1279, s: SD(1279, T_CRACK) }], 15: [{ f: 1392, s: S15 }], 16: [{ f: 1456, s: S16 }], 17: [{ f: 1577, s: S17 }],
  18: [{ f: 1687, s: S18 }], 19: [{ f: 1790, s: S19 }],
};
/** in-shot camera cuts (frames), listed in shots.json `planned` */
export const CUT_FRAMES: number[] = [];

// impact kicks: [seconds, strength]: the cap lands, the roof drops on, "Still dark", the first window
const KICKS: [number, number][] = [[T_FOOLISH - 2 / 30, 0.22], [T_ROOF - 2 / 30, 0.3], [T_STILL - 2 / 30, 0.2], [T_WIN1 - 2 / 30, 0.3]];
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
  { f: 0, cInf: 14, focus: at(head(ELDER)) },
  { f: 128, cInf: 0 },
  { f: 240, cInf: 11, focus: at([CT[0] - 0.4, Y + 1.7, CT[2] - 0.6]) },
  { f: 349, cInf: 12, focus: at([0, Y + 1.7, 3.4]) },
  { f: 401, cInf: 11, focus: at([TABLE[0], Y + 1.7, TABLE[2] - 0.6]) },
  { f: 532, cInf: 0 },
  { f: 761, cInf: 0 },
  { f: 858, cInf: 10, focus: at([0, Y + 1.8, 5.2]) },
  { f: 996, cInf: 0 },
  { f: 1047, cInf: 0 },
  { f: 1113, cInf: 7, focus: at([OTABLE[0], Y + 1.7, OTABLE[2] - 0.4]) },
  { f: 1199, cInf: 0 },
  { f: 1392, cInf: 0 },
  { f: 1456, cInf: 12, focus: at([TABLE[0], Y + 1.4, TABLE[2] - 0.5]) },
  { f: 1577, cInf: 10, focus: at([0, Y + 1.8, 4.4]) },
  { f: 1687, cInf: 0 },
  { f: 1790, cInf: 5, focus: at([SX, Y + 1.7, 2.2]) },
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
  { a: 128, b: 240, kit: "tree_oak", pos: [16.5, Y, 21.5], s: 8.0 },
  { a: 658, b: 761, kit: "lantern", pos: [-4.8, Y, 8.8], s: 3.0 },
  { a: 1687, b: 1790, kit: "tree_fat", pos: [13.2, Y, 19.0], s: 6.5 },
  { a: 1790, b: 2000, kit: "stall-red", pos: [SX - 3.4, Y, 3.4], s: 2.6, yaw: 0.6 },
];
void HALLC;
