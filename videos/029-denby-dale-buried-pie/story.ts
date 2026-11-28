// Timeline of "This Village Had to Bury Its Giant Pie": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): the village green of Denby Dale at the origin
// (stone cottages round a green, a timber stage with the giant pie on it, hills of the dale behind), the bakehouse
// yard at x = SX (the open dish on trestles), the planning room at x = KX, the stew-pot kitchen at z = PR[2] and the
// pit in a field by the woods at z = PT[2].
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2025;
export const D0 = 1.2; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the stage on the green: x -STW..STW, z -STD..STD, top at ST */
export const STW = 2.4, STD = 1.8, ST = D0 + 0.8;
/** the pie dish: radius DR, depth DD; the crust dome rises CH above the rim */
export const DR = 1.2, DD = 0.6, CH = 0.34;
export const PIE: V3 = [0, ST, 0]; // the pie on the stage (dish bottom)
export const PIE_TOP = ST + DD + CH;
export const SX = 600; // the bakehouse yard
export const YD: V3 = [SX, D0 + 0.7, 0]; // the open dish on its trestles (dish bottom)
export const KX = -600; // the planning room
export const PR: V3 = [0, D0, 600]; // the stew-pot kitchen
export const PT: V3 = [0, D0, -600]; // the pit in the field
export const PIT_R = 1.7;
export const POT: V3 = [PR[0] - 0.3, D0 + 0.85, PR[2] - 1.0]; // the stew pot on the kitchen table (bottom)

// story beats (seconds on the voice clock)
export const T_PIE = 3.02, T_BIG = 3.56, T_PROUD = 4.29, T_ENDED = 4.85, T_GRAVE = 5.4;
export const T_SINCE = 6.31, T_DENBY = 7.72, T_ROYAL = 9.15, T_GIANT = 10.32;
export const T_QUEEN = 12.05, T_FIFTY = 13.54, T_SO = 14.43, T_PLANNED = 14.7, T_GREATEST = 15.18;
export const T_BUILT = 16.73, T_DISH = 17.5, T_PACKED = 17.93, T_MEAT = 18.46, T_GAME = 18.77, T_TON = 19.73;
export const T_MAKING = 21.16, T_DAYS = 21.75, T_WARM = 22.54, T_SUMMER = 23.61;
export const T_LAST = 24.95, T_BAKED = 25.5, T_CROWDS = 26.02, T_PLATES = 26.99, T_APP = 28.43;
export const T_FIRST = 29.5, T_KNIFE = 29.77, T_IN = 30.2;
export const T_OUT = 30.9, T_SMELL = 31.36, T_BAD = 31.93, T_STEPPED = 32.6, T_MEAT2 = 33.65, T_ROTTEN = 34.62;
export const T_SEE = 35.33, T_POT = 37.1, T_MIDDLE = 38.1, T_WARM2 = 38.71, T_EDGES = 39.88, T_COOL = 40.19, T_FEAST = 41.59, T_GERMS = 42.01;
export const T_EMPTIED = 44.39, T_PIT = 45.09, T_BURIED = 45.51, T_LIME = 46.02, T_MONSTER = 46.98, T_GOOD = 48.14;
export const T_GIVEN = 49.83, T_FOREVER = 50.75;
export const T_INSTEAD = 52.05, T_SEPT = 52.65, T_NEW = 53.67, T_NOGAME = 54.24, T_SUCCESS = 56.2, T_FULL = 57.81;
export const T_NAME = 58.75, T_RES = 60.15, T_EVEN = 62.52, T_RISE = 63.4, T_GRAVE2 = 63.98;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "green" | "pit" | "room" | "yard" | "kitchen";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 143, "green"), mk(2, 143, 189, "pit"), mk(3, 189, 342, "green"), mk(4, 342, 494, "room"), mk(5, 494, 633, "yard"),
  mk(6, 633, 742, "yard"), mk(7, 742, 880, "green"), mk(8, 880, 920, "green"), mk(9, 920, 1058, "green"),
  mk(10, 1058, 1285, "kitchen"), mk(11, 1285, 1466, "pit"), mk(12, 1466, 1559, "green", "golden"), mk(13, 1559, 1753, "green"),
  mk(14, 1753, TOTAL, "green", "golden"),
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 2: 6, 4: 8, 5: 8, 6: 8, 7: 8, 10: 8, 11: 8, 12: 10, 13: 10, 14: 10 };
export const FLASH_AT = 189;
/** which pie stands on the stage: 0 none, 1 the Jubilee pie, 2 the Resurrection pie */
export const pieOn = (id: number) => (id === 12 ? 0 : id >= 13 ? 2 : 1);
/** how far the Resurrection pie's crust lifts off (m) in shot id at t */
export const liftAt = (id: number, t: number) => (id === 14 ? 0.45 * smooth((t - T_RISE + 0.07) / 0.6) : 0);

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
export const BAKER: V3 = [1.35, Y, 2.8]; // the head baker beside the stage, front right
export const BAKER_UP: V3 = [1.55, ST, 0.95]; // the baker on the stage with the knife
export const TABLE: V3 = [KX + 0.2, Y, -1.3]; // the planning table
export const PORTRAIT: V3 = [KX + 3.3, Y + 2.35, -3.96]; // the Queen's portrait on the back wall
export const COOK: V3 = [PR[0] + 0.6, Y, PR[2] - 2.0];
const PIEC: V3 = [0, ST + 0.75, 0]; // the pie's middle
const DISH_IN: V3 = [YD[0], YD[1] + 0.45, YD[2]]; // inside the open dish

// shot 1 (hook): the giant pie on the stage, the proud baker and the villagers
const S1 = (f: number) => dolly([0.8, Y + 2.3, 9.6], [0.1, Y + 1.5, 1.2], P(f, 0, T_PROUD, 0.006), { fov: 44, roll: 0.03 });
// shot 2: the pit in the field with a wooden grave marker
const S2 = (f: number) => dolly([2.2, Y + 3.4, PT[2] + 7.6], [0.2, Y + 0.7, PT[2] - 0.9], P(f, 143, T_GRAVE, 0.006), { fov: 44, roll: -0.03 });
// shot 3: the village green, wide: cottages, the dale behind, an old pie paraded on a cart
const S3 = (f: number) => dolly([11, Y + 4.6, 25], [0, Y + 2.8, 0], P(f, 189, T_GIANT, 0.003), { fov: 50, roll: 0.03 });
// shot 4: the Queen's portrait, then a glide down to the villagers planning round the table
const S4a = (f: number) => dolly([PORTRAIT[0] - 0.2, PORTRAIT[1] - 0.2, PORTRAIT[2] + 3.0], PORTRAIT, P(f, 342, T_FIFTY, 0.005), { fov: 36, roll: 0.03 });
const S4b = (f: number) => dolly([TABLE[0] + 0.9, Y + 2.1, TABLE[2] + 5.4], [TABLE[0] + 0.2, Y + 1.35, TABLE[2] - 0.3], P(f, fr(T_SO) - 3, T_GREATEST, 0.006), { fov: 44, roll: 0.03 });
// shot 5: the bakehouse yard from above: the open dish filling with meat and game
const S5 = (f: number) => dolly([YD[0] + 1.0, Y + 4.4, YD[2] + 6.4], [YD[0], YD[1] + 0.4, YD[2] - 0.1], P(f, 494, T_TON, 0.006), { fov: 44, roll: -0.03 });
// shot 6: days later: the closed pie in the hot yard, flies buzzing
const S6 = (f: number) => dolly([YD[0] - 1.6, Y + 2.0, YD[2] + 6.0], [YD[0] + 0.4, YD[1] + 0.8, YD[2] + 0.3], P(f, 633, T_SUMMER, 0.005), { fov: 42, roll: 0.03 });
// shot 7: the green: the crowds arrive with plates and forks
const S7 = (f: number) => dolly([-3.2, Y + 2.5, 11.5], [0, Y + 1.6, 0.5], P(f, 742, T_APP, 0.005), { fov: 48, roll: -0.03 });
// shot 8: close: the first knife goes into the crust
const S8 = (f: number) => dolly([0.9, ST + 1.45, 3.1], [0.35, ST + 0.8, 0.7], P(f, 880, T_IN, 0.008), { fov: 36, roll: 0.04 });
// shot 9: the smell rises, the crowd steps back
const S9 = (f: number) => dolly([0.9, Y + 2.6, 10.8], [0, Y + 1.8, 0.8], P(f, 920, T_ROTTEN, 0.006), { fov: 46, roll: -0.03 });
// shot 10: the kitchen: a huge pot of stew, its warm middle and cool edges, the germs
const S10 = (f: number) => dolly([PR[0] + 0.1, Y + 2.2, PR[2] + 4.6], [POT[0] + 0.25, Y + 1.75, POT[2]], P(f, 1058, T_FEAST, 0.006), { fov: 44, roll: 0.03 });
// shot 11: the pit: the pie emptied in and buried in quicklime
const S11 = (f: number) => dolly([3.6, Y + 2.9, PT[2] + 7.6], [0, Y + 0.4, PT[2] - 0.2], P(f, 1285, T_LIME, 0.006), { fov: 46, roll: -0.03 });
// shot 12: evening: the empty stage, the baker sitting on its edge
const S12 = (f: number) => dolly([2.4, Y + 1.5, 7.4], [0.3, Y + 1.3, 1.0], P(f, 1466, T_FOREVER, 0.004), { fov: 44, roll: 0.03 });
// shot 13: September: the new pie, the village women who baked it, everyone eating
const S13 = (f: number) => dolly([-1.8, Y + 2.6, 11.6], [0, Y + 1.6, 0.4], P(f, 1559, T_SUCCESS, 0.005), { fov: 46, roll: 0.03 });
// shot 14: sunset: the Resurrection Pie, its crust rising on little wings
const S14 = (f: number) => dolly([1.2, Y + 1.7, 9.8], [0, Y + 2.1, 0.4], P(f, 1753, T_RISE, 0.004), { fov: 48, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 143, s: S2 }], 3: [{ f: 189, s: S3 }], 4: [{ f: 342, s: S4a }, { f: fr(T_SO) - 3, dur: 32, s: S4b }],
  5: [{ f: 494, s: S5 }], 6: [{ f: 633, s: S6 }], 7: [{ f: 742, s: S7 }], 8: [{ f: 880, s: S8 }], 9: [{ f: 920, s: S9 }],
  10: [{ f: 1058, s: S10 }], 11: [{ f: 1285, s: S11 }], 12: [{ f: 1466, s: S12 }], 13: [{ f: 1559, s: S13 }], 14: [{ f: 1753, s: S14 }],
};
/** in-shot camera cuts (frames), listed in shots.json `planned` */
export const CUT_FRAMES: number[] = [];

// impact kicks: [seconds, strength]: the knife goes in, the smell hits, the quicklime lands
const KICKS: [number, number][] = [[T_IN - 2 / 30, 0.25], [T_BAD - 2 / 30, 0.3], [T_LIME - 2 / 30, 0.3]];
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
  { f: 0, cInf: 15, focus: at(head(BAKER)) },
  { f: 143, cInf: 12, focus: at([0, Y + 0.6, PT[2] - 1.0]) },
  { f: 189, cInf: 0 },
  { f: 342, cInf: 12, focus: at(PORTRAIT) },
  { f: fr(T_SO) - 3, dur: 32, cInf: 11, focus: at([TABLE[0], Y + 1.7, TABLE[2] - 0.6]) },
  { f: 494, cInf: 10, focus: at(DISH_IN) },
  { f: 633, cInf: 11, focus: at([YD[0], YD[1] + 0.8, YD[2]]) },
  { f: 742, cInf: 0 },
  { f: 880, cInf: 13, focus: at([0.35, ST + 0.9, 0.75]) },
  { f: 920, cInf: 7, focus: at(PIEC) },
  { f: 1058, cInf: 12, focus: at([POT[0], POT[1] + 0.4, POT[2]]) },
  { f: 1285, cInf: 0 },
  { f: 1466, cInf: 10, focus: at([0.9, ST + 1.2, 1.6]) },
  { f: 1559, cInf: 0 },
  { f: 1753, cInf: 5, focus: at(PIEC) },
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
  { a: 189, b: 342, kit: "tree_oak", pos: [15.5, Y, 21.5], s: 8.0 },
  { a: 742, b: 880, kit: "lantern", pos: [-4.6, Y, 8.6], s: 3.0 },
  { a: 1285, b: 1466, kit: "tree_fat", pos: [6.8, Y, PT[2] + 7.4], s: 6.5 },
  { a: 1753, b: 2025, kit: "stall-red", pos: [-3.8, Y, 3.6], s: 2.6, yaw: 0.6 },
];
