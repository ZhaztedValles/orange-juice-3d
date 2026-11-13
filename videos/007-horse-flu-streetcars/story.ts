// Timeline of "In 1872 Nearly Every Horse Caught the Flu, So People Pulled the Streetcars Themselves": shots timed to
// words.json. Four places, far apart on one big ground: a New York street with a horse-car line and a firehouse, a
// long horse stable, a country schoolhouse with its water bucket, and a Boston street (the fire, the men dragging the
// engine, the burnt blocks). Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f,
// hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2048;
export const D0 = 6.0; // street level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** New York: the street runs along x through z = 0; one horse-car track down the middle */
export const NY: V3 = [0, D0, 0];
export const RAIL_Z = 0;
/** the firehouse on the north side of the street, its doors at z = FH[2] + 4.2 */
export const FH: V3 = [44, D0, -12.5];
/** the stable: stalls along x, half-doors at z = STB[2], open toward +z */
export const STB: V3 = [0, D0, 420];
export const NSTALL = 14, STALL_W = 2.5;
export const stallX = (k: number) => STB[0] + (k - (NSTALL - 1) / 2) * STALL_W;
/** the country school and its water bucket */
export const SCH: V3 = [420, D0, 0];
export const BUCKET: V3 = [SCH[0] + 0.2, D0, SCH[2] + 1.0];
/** Boston: a street along x through z = BOS[2]; the burning house on the north side; the burnt blocks east of it */
export const BOS: V3 = [420, D0, 420];
export const BURN: V3 = [BOS[0] + 26, D0, BOS[2] - 11];
export const RUIN: V3 = [BOS[0] + 95, D0, BOS[2] - 20];

// story beats (seconds on the voice clock)
export const T_COUGH1 = 13.05; // "cough" (Toronto)
export const T_COUGH2 = 17.6; // "cough." (the New York stable)
export const T_OXEN = 23.46; // "oxen"
export const T_ROPES = 28.48; // "ropes"
export const T_TWO = 32.45; // "just two"
export const T_FIRE = 34.66; // "fire broke out"
export const T_SNIFF = 44.42; // "sniffle"
export const T_ALL = 45.04; // "everyone's"
export const T_THROUGH = 50.14; // "the flu went through"
export const T_DRAG = 54.94; // "dragged"
export const T_ROPE = 64.81; // "rope."

/** the horse car's front x on the New York street at time t of shot id */
export const carX = (id: number, t: number) => {
  if (id === 1) return -8 + 0.75 * t; // hauled by hand (the hook)
  if (id === 2) return -16 + 4.2 * (t - 6.9); // drawn by a trotting pair
  if (id === 5) return -3 + 0.12 * (t - 22.0); // the oxen barely move it
  if (id === 6) return -2 + 0.85 * smooth((t - T_ROPES + 0.1) / 1.2) * (t - T_ROPES + 0.6); // the crews and riders take the ropes
  if (id === 14) return -9 + 1.1 * (t - 61.27); // one man with a rope
  return -1000;
};
/** where the men pulling the car (or the fire engine) walk: n ropes, puller j, a step ahead of the car */
export const PULL_N = 6;
export const pullerP = (frontX: number, j: number, z0 = RAIL_Z): V3 => [frontX + 2.2 + 1.15 * Math.floor(j / 2), D0, z0 + (j % 2 ? 0.75 : -0.75)];
/** the fire engine on the Boston street (shot 12): its pole end x */
export const engX = (t: number) => BOS[0] - 14 + 1.25 * (t - 52.53);
/** cough puffs: a horse (or child) coughs at these times; 0..1 progress of the puff */
export const puffU = (t: number, t0: number) => (t >= t0 && t < t0 + 0.7 ? (t - t0) / 0.7 : -1);
/** the stable row's coughs travel from stall 0 to the last stall (shot 11) */
export const rowCough = (k: number) => T_THROUGH - 3.3 + 0.32 * k;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "ny" | "stable" | "school" | "boston";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 206, "ny"), mk(2, 206, 362, "ny"), mk(3, 362, 548, "stable"), mk(4, 548, 661, "stable"),
  mk(5, 661, 809, "ny"), mk(6, 809, 922, "ny"), mk(7, 922, 1010, "ny"), mk(8, 1010, 1090, "boston", "golden"),
  mk(9, 1090, 1208, "school"), mk(10, 1208, 1390, "school"), mk(11, 1390, 1576, "stable"), mk(12, 1576, 1718, "boston", "golden"),
  mk(13, 1718, 1838, "boston"), mk(14, 1838, TOTAL, "ny", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 3: 8, 5: 8, 8: 8, 9: 8, 11: 8, 12: 8, 14: 8 };
export const FLASH_AT = 206;

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
// shot 1 (hook): men hauling the horse car down the street on ropes; then low beside a sick horse in a blanket at the curb
const S1a = (f: number) => { const x = carX(1, T(f)); return dolly([x + 11, Y + 3.0, 8.5], [x + 1.5, Y + 1.3, 0], pushK(f, 0, 0.0022), { fov: 44 }); };
const S1b = (f: number) => dolly([10.5, Y + 1.8, 12.5], [3.4, Y + 1.2, 2.0], pushK(f, 125, 0.0025, 0.006, 30), { fov: 40, roll: 0.035 });
// shot 2: the busy street as it was: the horse car trotting by, a cart, strollers
const S2a = (f: number) => dolly([-1, Y + 3.0, 17], [-3, Y + 1.6, 0], pushK(f, 206, 0.0022), { fov: 46 });
const S2b = (f: number) => dolly([8, Y + 3.4, 16], [5, Y + 1.6, 0], pushK(f, 206, 0.0022), { fov: 46, roll: -0.03 });
// shot 3: the stable: the row of stalls, then the stable hand hearing the cough
const S3a = (f: number) => dolly([stallX(NSTALL - 1) + 6, Y + 2.4, STB[2] + 7.5], [stallX(5), Y + 1.6, STB[2]], pushK(f, 362, 0.0022), { fov: 44 });
const S3b = (f: number) => dolly([stallX(8) + 3.6, Y + 1.9, STB[2] + 6.4], [stallX(8) + 0.5, Y + 1.6, STB[2] + 0.4], pushK(f, 442, 0.0026, 0.006, 30), { fov: 40, roll: -0.03 });
// shot 4: a day later: every head hangs
const S4a = (f: number) => dolly([stallX(0) - 5, Y + 2.3, STB[2] + 7.5], [stallX(7), Y + 1.6, STB[2]], pushK(f, 548, 0.0025), { fov: 44, roll: 0.03 });
// shot 5: oxen on the horse-car line, the street jammed
const S5a = (f: number) => dolly([6.5, Y + 2.3, 8.0], [-1.6, Y + 1.3, 0], pushK(f, 661, 0.0024, 0.006, 30), { fov: 44 });
// shot 6: the crews and riders take the ropes; the car rolls
const S6a = (f: number) => { const x = carX(6, T(f)); return dolly([x + 10, Y + 2.3, 7.5], [x + 1.6, Y + 1.3, 0], pushK(f, 809, 0.0025, 0.006, 30), { fov: 44, roll: -0.035 }); };
// shot 7: the firehouse: of all its horses, two stand tall
const S7a = (f: number) => dolly([FH[0] + 9.5, Y + 2.6, FH[2] + 12.5], [FH[0] - 1, Y + 1.6, FH[2] + 5.0], pushK(f, 922, 0.0024), { fov: 42 });
const S7b = (f: number) => dolly([FH[0] + 8, Y + 2.0, FH[2] + 9.5], [FH[0] + 0.8, Y + 1.6, FH[2] + 5.8], pushK(f, 970, 0.0028, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 8 (golden): Boston: smoke rises from a roof
const S8a = (f: number) => dolly([BOS[0] + 6, Y + 1.8, BOS[2] + 7.6], [BURN[0] + 4, Y + 5.0, BOS[2] - 8], pushK(f, 1010, 0.0028, 0.006, 30), { fov: 46, roll: 0.03 });
// shots 9-10: the schoolhouse and the shared water bucket
const S9a = (f: number) => dolly([SCH[0] + 8, Y + 3.2, SCH[2] + 15], [SCH[0], Y + 2.4, SCH[2] - 1], pushK(f, 1090, 0.0022), { fov: 46 });
const S10a = (f: number) => dolly([BUCKET[0] + 1.2, Y + 1.6, BUCKET[2] + 5.4], [BUCKET[0], Y + 0.5, BUCKET[2]], pushK(f, 1208, 0.0022, 0.006, 30), { fov: 42 });
// shot 11: down the long stable row: the coughs run stall to stall
const S11a = (f: number) => dolly([stallX(NSTALL - 1) + 4.5, Y + 2.4, STB[2] + 6.0], [stallX(6), Y + 1.7, STB[2]], pushK(f, 1390, 0.002), { fov: 40, roll: -0.03 });
// shot 12 (golden): men drag the fire engine toward the smoke
const S12a = (f: number) => { const x = engX(T(f)); return dolly([x + 9, Y + 2.4, BOS[2] + 7], [x - 0.5, Y + 1.4, BOS[2]], pushK(f, 1576, 0.0024, 0.006, 30), { fov: 44, roll: 0.03 }); };
// shot 13 (golden): from above: the burnt blocks still smoking
const S13a = (f: number) => {
  const s = glide((f - 1718) / 110);
  return { pos: [RUIN[0] - 10 + 6 * s, Y + 40 + 12 * s, RUIN[2] + 28 + 6 * s], look: [RUIN[0] + 2, Y, RUIN[2] - 8], fov: 46, roll: 0 } as Shot;
};
// shot 14 (golden): back in New York: one man with a rope, and the horse in its blanket watching
const S14a = (f: number) => { const x = carX(14, T(f)); return dolly([x + 9, Y + 2.0, 8], [x + 1.4, Y + 1.3, 0.5], pushK(f, 1838, 0.0022, 0.005, 30), { fov: 42 }); };

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 125, cut: true, s: S1b }],
  2: [{ f: 206, s: S2a }, { f: 290, dur: 40, s: S2b }],
  3: [{ f: 362, s: S3a }, { f: 442, cut: true, s: S3b }],
  4: [{ f: 548, s: S4a }],
  5: [{ f: 661, s: S5a }],
  6: [{ f: 809, s: S6a }],
  7: [{ f: 922, s: S7a }, { f: 970, cut: true, s: S7b }],
  8: [{ f: 1010, s: S8a }],
  9: [{ f: 1090, s: S9a }],
  10: [{ f: 1208, s: S10a }],
  11: [{ f: 1390, s: S11a }],
  12: [{ f: 1576, s: S12a }],
  13: [{ f: 1718, s: S13a }],
  14: [{ f: 1838, s: S14a }],
};

// impact kicks: [seconds, strength]: the ropes go taut, the fire catches, the sneeze, "dragged"
const KICKS: [number, number][] = [[T_ROPES - 2 / 30, 0.7], [T_FIRE - 2 / 30, 0.5], [T_ALL - 2 / 30, 0.6], [T_DRAG - 2 / 30, 0.5]];
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
  { f: 0, cInf: 0 },
  { f: 125, cInf: 13, focus: () => [4.6, D0 + 1.5, 2.4] },
  { f: 206, cInf: 0 },
  { f: 442, cInf: 12, focus: () => [stallX(8) - 0.3, D0 + 1.6, STB[2]] },
  { f: 548, cInf: 7, focus: () => [1, D0 + 1.6, STB[2]] },
  { f: 661, cInf: 10, focus: () => [0.8, D0 + 1.4, 0] },
  { f: 809, cInf: 11, focus: (f) => [carX(6, T(f)) + 3.6, D0 + 1.6, 0] },
  { f: 922, cInf: 7, focus: () => [FH[0], D0 + 1.6, FH[2] + 5.4] },
  { f: 970, cInf: 12, focus: () => [FH[0] + 2.2, D0 + 1.7, FH[2] + 5.6] },
  { f: 1010, cInf: 0 },
  { f: 1208, cInf: 12, focus: () => [BUCKET[0], D0 + 1.1, BUCKET[2]] },
  { f: 1390, cInf: 5, focus: () => [stallX(8), D0 + 1.7, STB[2]] },
  { f: 1576, cInf: 10, focus: (f) => [engX(T(f)) + 3, D0 + 1.6, BOS[2]] },
  { f: 1718, cInf: 0 },
  { f: 1838, cInf: 11, focus: (f) => [carX(14, T(f)) + 3.4, D0 + 1.6, 0] },
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
  { a: 206, b: 362, kit: "lantern", pos: [-1.5, D0, 12.2], s: 3.0 },
  { a: 1090, b: 1208, kit: "plant_bushDetailed", pos: [SCH[0] + 6.5, D0, SCH[2] + 12], s: 1.1 },
];
