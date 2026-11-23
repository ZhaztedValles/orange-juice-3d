// Timeline of "What If Lord Carnarvon Had Said No?": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): the Valley of the Kings at the origin (a sandy
// valley floor, cliffs to the north with an old royal tomb door, a terrace of ancient rubble with the ruins of
// workmen's huts on top and, cut down into it, the hidden staircase to a sealed door), the lord's English lawn and
// house at x = ES, a London street with the newsboy at x = SX, and the treasure room at z = CH[2].
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1890;
export const D0 = 1.2; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the rubble terrace (top height), the stair pit cut into it, the sealed door at its foot */
export const TER_H = 2.4, TY = D0 + TER_H;
export const PIT = { x0: 1.6, x1: 3.6, zTop: -10, zBot: -15, zDoor: -16 };
export const STEPS = 10;
/** height of the stair tread at z (the steps run down from the terrace top at zTop to the ground at zBot) */
export const stepY = (z: number) => {
  if (z >= PIT.zTop) return TY;
  if (z <= PIT.zBot) return D0;
  const i = Math.floor(((PIT.zTop - z) / (PIT.zTop - PIT.zBot)) * STEPS);
  return D0 + TER_H * (1 - (i + 1) / STEPS);
};
export const ES = -600; // the English lawn
export const SX = 600; // the London street
export const CH: V3 = [0, D0, 600]; // the treasure room
export const WALK_Y = 0.18;

// story beats (seconds on the voice clock)
export const T_TREASURE = 1.55, T_RICH = 2.71, T_ONE0 = 3.9, T_CHANCE = 4.42;
export const T_FIVE = 5.46, T_CARN = 6.72, T_PAID = 7.28, T_VALLEY = 8.85, T_BOY = 10.25, T_TUT = 11.14;
export const T_AMER = 12.75, T_GIVEN = 13.35, T_EMPTY = 14.61, T_TONS = 16.3, T_SAND = 16.74, T_NOTHING = 17.93;
export const T_SAID = 19.2, T_GONE = 19.94, T_BUT = 20.52, T_BEGGED = 21.07, T_ONE = 22.5, T_WINTER = 22.95;
export const T_NOV = 24.24, T_RUINS = 25.84, T_HUTS = 26.57, T_MEN = 27.62, T_STEP = 28.02;
export const T_DOWN = 29.7, T_SEALED = 30.16, T_SO = 30.88, T_RUSHED = 31.4;
export const T_CANDLE = 33.3, T_HOLE = 34.25, T_ASKED = 34.94, T_ANY = 35.75, T_YES = 36.88, T_WONDER = 37.17;
export const T_WHATIF = 38.52, T_NO = 39.37, T_HUTS2 = 40.67, T_TOUR = 41.74, T_STEP2 = 43.17;
export const T_NO1 = 44.51, T_MASK = 45.0, T_NO2 = 46.05, T_SONGS = 46.24, T_NO3 = 47.52, T_CURSE = 48.05;
export const T_MAYBE = 49.3, T_TEAM = 49.86, T_OR = 51.6, T_THIEVES = 51.77;
export const T_REAL = 53.3, T_YES2 = 54.52, T_ONE2 = 54.77, T_TOMB = 56.85, T_WAIT = 57.74, T_HUTS3 = 58.31, T_MOVE = 59.85;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "valley" | "lawn" | "street" | "room";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 69, "room", "golden"), mk(2, 69, 153, "lawn"), mk(3, 153, 288, "valley"), mk(4, 288, 360, "valley"),
  mk(5, 360, 465, "valley"), mk(6, 465, 556, "valley"), mk(7, 556, 722, "lawn"), mk(8, 722, 876, "valley"),
  mk(9, 876, 924, "valley"), mk(10, 924, 979, "valley"), mk(11, 979, 1084, "valley"), mk(12, 1084, 1149, "room", "golden"),
  mk(13, 1149, 1215, "lawn"), mk(14, 1215, 1333, "valley"), mk(15, 1333, 1477, "street"), mk(16, 1477, 1588, "valley"),
  mk(17, 1588, 1677, "lawn"), mk(18, 1677, TOTAL, "valley"),
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 7: 10, 8: 8, 12: 6, 13: 8, 14: 8, 17: 8, 18: 8 };
export const FLASH_AT = 153;
/** the what-if shots: the huts still stand and the staircase stays buried */
export const WHATIF = (id: number) => id === 14 || id === 16;
/** how much of the stair pit is open: 0 buried, 1 only the top step, 2 all the way down to the door */
export const pitOpen = (id: number) => (WHATIF(id) || id <= 7 ? 0 : id === 8 ? 1 : 2);

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
export const LORD_L: V3 = [ES - 0.75, Y, 0]; // the lord on his lawn
export const CARTER_L: V3 = [ES + 0.8, Y, 0.35]; // Carter facing him
export const SKETCH_AT: V3 = [-2.0, TY, -8.4]; // Carter on the terrace with his drawing
export const AMER_AT: V3 = [-9.5, Y, -2.2]; // the American walking off
export const DOOR: V3 = [(PIT.x0 + PIT.x1) / 2, Y, PIT.zDoor];
export const NEWS: V3 = [SX - 6, Y + WALK_Y, -6.2];

// shot 1 (hook): the gold mask glowing in candlelight in the treasure room
const MASK: V3 = [CH[0], Y + 1.55, CH[2] - 2.0];
const S1 = (f: number) => dolly([MASK[0] + 0.35, MASK[1] + 0.12, MASK[2] + 3.2], MASK, P(f, 0, T_TREASURE, 0.006), { fov: 34, roll: 0.03 });
// shot 2: on the lawn, the lord holds up one finger to Carter
const S2 = (f: number) => dolly([ES + 1.0, Y + 1.62, 5.0], [ES + 0.1, Y + 1.5, 0.1], P(f, 69, T_ONE0, 0.006), { fov: 42, roll: -0.03 });
// shot 3: the Valley of the Kings, wide: cliffs, the rubble terrace, the diggers
const S3 = (f: number) => dolly([15, Y + 6.5, 17], [0, Y + 2.6, -12], P(f, 153, T_VALLEY, 0.003), { fov: 50, roll: 0.03 });
// shot 4: Carter on the terrace with his drawing of the boy king
const S4 = (f: number) => dolly([SKETCH_AT[0] + 1.1, TY + 1.6, SKETCH_AT[2] + 4.2], [SKETCH_AT[0] - 0.1, TY + 1.4, SKETCH_AT[2]], P(f, 288, T_TUT, 0.006), { fov: 42, roll: 0.03 });
// shot 5: the American walks off with an empty basket, shrugging
const S5 = (f: number) => dolly([AMER_AT[0] + 4.5, Y + 1.7, AMER_AT[2] + 6.0], [AMER_AT[0] + 1.0, Y + 1.4, AMER_AT[2]], P(f, 360, T_EMPTY, 0.005), { fov: 46, roll: -0.03 });
// shot 6: baskets of sand carried to the spoil heaps; Carter finds nothing
const S6 = (f: number) => dolly([7, Y + 2.6, 6.5], [0.5, Y + 1.5, -2.5], P(f, 465, T_NOTHING, 0.005), { fov: 48, roll: 0.03 });
// shot 7: the lawn: the lord says the money is gone (two-shot), then close on him as Carter begs
const S7a = (f: number) => dolly([ES + 1.3, Y + 1.62, 5.2], [ES + 0.05, Y + 1.45, 0.1], P(f, 556, T_GONE, 0.006), { fov: 44, roll: 0.03 });
const S7b = (f: number) => dolly([ES - 0.1, Y + 1.62, 3.0], [ES - 0.75, Y + 1.62, 0], P(f, fr(T_BUT) - 2, T_ONE, 0.006), { fov: 40, roll: 0.03 });
// shot 8: on the terrace by the hut ruins: a hoe hits the top step
const S8 = (f: number) => dolly([6.0, TY + 2.1, -4.6], [2.6, TY + 0.2, -10.6], P(f, 722, T_STEP, 0.008), { fov: 46, roll: -0.03 });
// shot 9: looking down the cleared staircase to the sealed door
const S9 = (f: number) => dolly([2.6, TY + 3.0, -7.0], [2.6, Y + 0.9, -15.6], P(f, 876, T_SEALED, 0.006), { fov: 46, roll: 0.03 });
// shot 10: the lord and Lady Evelyn hurry across the valley, Carter waving them in
const S10 = (f: number) => dolly([-2.6, Y + 1.7, 7.6], [-5.0, Y + 1.4, -0.4], P(f, 924, T_RUSHED, 0.005), { fov: 46, roll: -0.03 });
// shot 11: at the foot of the stairs: Carter holds the candle to the hole, the lord at his shoulder
const S11 = (f: number) => dolly([2.3, Y + 2.75, -11.4], [2.75, Y + 1.45, -15.6], P(f, 979, T_ANY, 0.006), { fov: 50, roll: 0.03 });
// shot 12: the treasure room: gold everywhere in the candlelight
const S12a = (f: number) => dolly([CH[0] + 2.2, Y + 1.8, CH[2] + 3.6], [CH[0] - 0.6, Y + 1.1, CH[2] - 1.8], pushK(f, 1084, 0.002), { fov: 48, roll: -0.03 });
const S12b = (f: number) => dolly([CH[0] + 0.6, Y + 1.7, CH[2] + 2.4], [CH[0] - 0.3, Y + 1.2, CH[2] - 1.9], P(f, fr(T_WONDER) - 4, T_WONDER, 0.006), { fov: 44, roll: -0.03 });
// shot 13: the lawn again, the lord shakes his head: no
const S13 = (f: number) => dolly([ES + 0.05, Y + 1.62, 3.1], [ES - 0.75, Y + 1.6, 0], P(f, 1149, T_NO, 0.008), { fov: 40, roll: -0.03 });
// shot 14 (what if): the huts still stand, tourists stroll over the buried step
const S14 = (f: number) => dolly([7.2, TY + 2.3, -4.4], [2.0, TY + 0.8, -11.8], P(f, 1215, T_STEP2, 0.005), { fov: 48, roll: 0.03 });
// shot 15 (what if): the London newsboy, and no golden mask on his paper
const S15 = (f: number) => dolly([NEWS[0] + 1.6, Y + 1.55, NEWS[2] + 5.0], [NEWS[0] - 0.2, Y + 1.35, NEWS[2]], P(f, 1333, T_NO2, 0.004), { fov: 44, roll: -0.03 });
// shot 16 (what if): years later another team digs at the huts, then cut: two thieves creep in with sacks
const S16a = (f: number) => dolly([6.2, TY + 2.2, -4.8], [2.6, TY + 0.6, -11.2], P(f, 1477, T_TEAM, 0.005), { fov: 48, roll: 0.03 });
const S16b = (f: number) => dolly([-2.4, TY + 1.8, -3.4], [1.0, TY + 1.0, -9.6], P(f, fr(T_OR) - 2, T_THIEVES, 0.006), { fov: 44, roll: 0.03 });
// shot 17: the lawn: the lord says yes, one more time
const S17 = (f: number) => dolly([ES + 1.0, Y + 1.62, 4.2], [ES - 0.35, Y + 1.5, 0.05], P(f, 1588, T_YES2, 0.006), { fov: 42, roll: 0.03 });
// shot 18: the valley at sunset, wide, then a glide down to the huts and the open staircase
const S18a = (f: number) => dolly([13, Y + 8.0, 12], [2.0, Y + 2.6, -12], pushK(f, 1677, 0.0015), { fov: 50, roll: -0.03 });
const S18b = (f: number) => dolly([2.7, TY + 2.7, 0.6], [2.6, TY + 0.9, -10.4], P(f, fr(T_HUTS3) - 3, T_MOVE, 0.004), { fov: 46, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 69, s: S2 }], 3: [{ f: 153, s: S3 }], 4: [{ f: 288, s: S4 }], 5: [{ f: 360, s: S5 }], 6: [{ f: 465, s: S6 }],
  7: [{ f: 556, s: S7a }, { f: fr(T_BUT) - 2, cut: true, s: S7b }], 8: [{ f: 722, s: S8 }], 9: [{ f: 876, s: S9 }], 10: [{ f: 924, s: S10 }],
  11: [{ f: 979, s: S11 }], 12: [{ f: 1084, s: S12a }, { f: fr(T_WONDER) - 4, dur: 26, s: S12b }], 13: [{ f: 1149, s: S13 }], 14: [{ f: 1215, s: S14 }],
  15: [{ f: 1333, s: S15 }], 16: [{ f: 1477, s: S16a }, { f: fr(T_OR) - 2, cut: true, s: S16b }], 17: [{ f: 1588, s: S17 }],
  18: [{ f: 1677, s: S18a }, { f: fr(T_TOMB) - 3, dur: 40, s: S18b }],
};
/** in-shot camera cuts (frames), listed in shots.json `planned` */
export const CUT_FRAMES = [fr(T_BUT) - 2, fr(T_OR) - 2];

// impact kicks: [seconds, strength]: the hoe on the step
const KICKS: [number, number][] = [[T_STEP - 2 / 30, 0.3]];
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
  { f: 0, cInf: 15, focus: at(MASK) },
  { f: 69, cInf: 12, focus: at(head(LORD_L)) },
  { f: 153, cInf: 0 },
  { f: 288, cInf: 12, focus: at(head(SKETCH_AT)) },
  { f: 360, cInf: 10, focus: at(head([AMER_AT[0] + 1.0, Y, AMER_AT[2]])) },
  { f: 465, cInf: 0 },
  { f: 556, cInf: 11, focus: at(head(LORD_L)) },
  { f: fr(T_BUT) - 2, cInf: 13, focus: at(head(LORD_L)) },
  { f: 722, cInf: 7, focus: at([2.6, TY + 0.4, -10.4]) },
  { f: 876, cInf: 0 },
  { f: 924, cInf: 0 },
  { f: 979, cInf: 12, focus: at([2.5, Y + 1.7, -15.4]) },
  { f: 1084, cInf: 7, focus: at([CH[0] - 0.4, Y + 1.2, CH[2] - 1.8]) },
  { f: 1149, cInf: 14, focus: at(head(LORD_L)) },
  { f: 1215, cInf: 0 },
  { f: 1333, cInf: 12, focus: at([NEWS[0], Y + 1.9, NEWS[2]]) },
  { f: 1477, cInf: 0 },
  { f: fr(T_OR) - 2, cInf: 10, focus: at([0.5, TY + 1.6, -9.2]) },
  { f: 1588, cInf: 12, focus: at(head(LORD_L)) },
  { f: 1677, cInf: 0 },
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
  { a: 69, b: 153, kit: "tree_oak", pos: [ES + 4.2, Y, 3.6], s: 7.0 },
  { a: 1333, b: 1477, kit: "lantern", pos: [NEWS[0] + 2.8, Y + WALK_Y, NEWS[2] + 3.2], s: 3.0 },
  { a: 1588, b: 1677, kit: "tree_oak", pos: [ES + 4.0, Y, 3.0], s: 7.0 },
];
export { MASK };
