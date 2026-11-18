// Timeline of "Legend Says These Wives Carried Their Husbands Out of a Siege": shots timed to words.json. Four places,
// far apart on one big ground: Weinsberg (a walled town on a raised shelf, its gate at the top of a ramp, the castle on
// the snowy hill behind, the king's camp of striped tents on the snow below), a street inside the town, a monk's
// writing room (the chronicle) and the castle ruin today. Camera grammar of the bridge template: slow push-ins,
// smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1950;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the town: its front wall faces +z at z = WALL_Z, the gate at x = 0; the shelf behind it is SHELF m high */
export const WALL_Z = -12;
export const SHELF = 2.4;
/** the ramp runs from the gate (z = WALL_Z) down to z = RAMP_Z, then the road goes on over the snow to the camp */
export const RAMP_Z = 12;
/** the king's camp: tents round z = CAMP[2] */
export const CAMP: V3 = [0, D0, 44];
/** a street inside the town (built apart, on flat ground) */
export const STR: V3 = [0, D0, 320];
/** the monk's writing room (open-topped): back wall at z = SCR[2] - 3 */
export const SCR: V3 = [320, D0, 320];
/** the castle ruin today on its hill, a square in front */
export const RUIN: V3 = [-320, D0, 320];
/** ground height of the road at z (the ramp from the gate down, then flat) */
export const roadY = (z: number) => D0 + 0.07 + SHELF * clamp01((RAMP_Z - z) / (RAMP_Z - WALL_Z));
export const SNOW_Y = D0 + 0.12;

// story beats (seconds on the voice clock)
export const T_LEGEND = 0.58; // "Legend"
export const T_BACKS = 4.33; // "backs."
export const T_CASTLE = 9.6; // "castle"
export const T_KING = 10.83; // "King"
export const T_ARMY = 13.33; // "army,"
export const T_PATIENCE = 14.1; // "patience."
export const T_BREAD = 16.97; // "bread"
export const T_OUT = 17.7; // "running out."
export const T_TERMS = 19.2; // "terms."
export const T_PUNISHED = 20.6; // "punished,"
export const T_WOMEN = 21.33; // "women"
export const T_PEACE = 22.23; // "peace."
export const T_CARRY = 24.8; // "carry"
export const T_SHOULDERS = 25.37; // "shoulders."
export const T_DAWN = 26.83; // "dawn"
export const T_CREAKS = 27.4; // "creaks"
export const T_SACKS = 29.07; // "sacks"
export const T_SILVER = 29.5; // "silver"
export const T_INSTEAD = 30.84; // "Instead,"
export const T_WIFE = 31.73; // "wife"
export const T_HUSBAND = 33.63; // "husband"
export const T_SHOUT = 35.33; // "shout"
export const T_TRICK = 35.93; // "trick."
export const T_LAUGHS = 37.31; // "laughs,"
export const T_WORD = 39.0; // "word."
export const T_FREE = 41.1; // "free,"
export const T_HAPPEN = 43.5; // "happen?"
export const T_CHRONICLE = 44.77; // "chronicle"
export const T_SIMILAR = 46.67; // "similar"
export const T_SPREAD = 49.57; // "spread"
export const T_MERCIFUL = 50.73; // "merciful."
export const T_BELIEVE = 53.5; // "believe"
export const T_WEIBERTREU = 55.94; // "Weibertreu,"
export const T_WIVES = 57.8; // "wives."
export const T_FELL = 59.87; // "fell"
export const T_SAVED = 60.33; // "saved"
export const T_LEAVE = 62.13; // "leave"

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "town" | "street" | "scriptorium" | "ruin";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 148, "town"), mk(2, 148, 322, "town"), mk(3, 322, 446, "town"), mk(4, 446, 546, "street"),
  mk(5, 546, 688, "town"), mk(6, 688, 798, "street"), mk(7, 798, 922, "town"), mk(8, 922, 1044, "town"),
  mk(9, 1044, 1095, "town"), mk(10, 1095, 1190, "town"), mk(11, 1190, 1296, "town"),
  mk(12, 1296, 1560, "scriptorium"), mk(13, 1560, 1761, "ruin"), mk(14, 1761, TOTAL, "town", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 4: 8, 5: 8, 6: 8, 7: 10, 12: 10, 13: 10, 14: 10 };
export const FLASH_AT = 148;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the gate and the procession ----------------
/** how far the gate is raised (0 shut .. 1 open) in shot id at time t */
export const gateUp = (id: number, t: number) => (id === 7 ? smooth((t - T_CREAKS + 0.1) / 1.8) : [1, 8, 9, 10, 11, 14].includes(id) ? 1 : 0);
/** walking speed of a wife carrying her husband (m/s) */
export const PACE = 1.1;
/** the procession in shot id: couple k's z on the road (they walk toward +z), or null when not out yet */
export const coupleZ = (id: number, k: number, t: number): number | null => {
  let z: number;
  if (id === 1) z = 3.5 - 3.4 * k + PACE * t;
  else if (id === 8 || id === 9 || id === 10) z = -11.5 + PACE * (t - 30.73 - 1.4 * k);
  else if (id === 11) z = 20 - 3.2 * k + PACE * (t - 39.67);
  else if (id === 14) z = 26 - 3.3 * k + PACE * (t - 58.7);
  else return null;
  return z < -15.5 ? null : z;
};
/** x of couple k (they keep to the road in a loose line) */
export const coupleX = (k: number) => [-0.7, 0.8, -0.2, 1.0, -0.9, 0.4, -0.5, 0.9, -0.1, 0.6, -0.8, 0.2][k % 12];
export const N_COUPLES: Record<number, number> = { 1: 5, 8: 6, 9: 6, 10: 6, 11: 7, 14: 12 };

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
const fr = (t: number) => Math.round(t * FPS);
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const Y = D0, CZ = CAMP[2];
// shot 1 (hook): wives coming down the ramp toward us, each with her husband on her back; the lens backs away with them
const S1a = (f: number) => { const z = 3.5 + PACE * T(f); return dolly([1.3, roadY(z) + 1.7, z + 5.2], [0.0, roadY(z - 2) + 1.7, z - 2], pushK(f, 0, 0.0016, 0.004, 30), { fov: 46, roll: 0.03 }); };
// shot 2: Weinsberg in December: the walls, the gate, the houses on their shelf and the castle on the hill
const S2a = (f: number) => dolly([-6, Y + 8, 62], [0, Y + 13, -50], pushK(f, 148, 0.0005), { fov: 50, roll: -0.03 });
// shot 3: the king at his tent below the walls, his soldiers round him
const S3a = (f: number) => dolly([4.4, Y + 1.9, CZ - 13.5], [6.2, Y + 1.8, CZ - 6.2], pushK(f, 322, 0.002, 0.005, 30), { fov: 44, roll: 0.03 });
// shot 4: inside the town: hungry people and an empty bread basket
const S4a = (f: number) => dolly([STR[0] + 1.0, Y + 1.9, STR[2] + 6.8], [STR[0] + 0.2, Y + 1.5, STR[2] - 0.6], pushK(f, 446, 0.0022, 0.005, 30), { fov: 50, roll: -0.03 });
// shot 5: the herald below the gate reads the terms up to the faces on the wall
const S5a = (f: number) => dolly([2.2, roadY(10.5) + 1.5, 10.5], [0, Y + 7.5, WALL_Z], pushK(f, 546, 0.0006), { fov: 50, roll: 0.03 });
// shot 6: a wife and her husband in the street: what can she carry?
const S6a = (f: number) => dolly([STR[0] + 0.1, Y + 1.75, STR[2] + 3.8], [STR[0] + 0.05, Y + 1.6, STR[2] - 0.5], pushK(f, 688, 0.0024, 0.006, 30), { fov: 44, roll: 0.03 });
// shot 7 (golden): dawn: soldiers on the snow wait as the gate rises
const S7a = (f: number) => dolly([-1.2, Y + 1.7, 24], [0.2, roadY(-12) + 2.0, WALL_Z], pushK(f, 798, 0.0006), { fov: 44, roll: -0.03 });
// shot 8 (golden): the wives come out, bent double, carrying their husbands
const S8a = (f: number) => dolly([-1.8, Y + 2.0, 8], [0.0, roadY(-8) + 1.6, -8], pushK(f, 922, 0.0024, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 9 (golden): the soldiers shout "a trick!"
const S9a = (f: number) => dolly([1.2, Y + 1.8, CZ - 21.5], [3.0, Y + 1.7, CZ - 17.6], pushK(f, 1044, 0.003, 0.008, 25), { fov: 42, roll: -0.04 });
// shot 10 (golden): the king laughs
const S10a = (f: number) => dolly([5.2, Y + 1.85, CZ - 20.0], [6.0, Y + 1.85, CZ - 16.6], pushK(f, 1095, 0.0024, 0.007, 30), { fov: 40, roll: 0.04 });
// shot 11 (golden): the line of couples walks free past the camp, tracked from the side
const S11a = (f: number) => { const z = 15.2 + PACE * (T(f) - 39.67); return dolly([7.4, Y + 1.7, z + 1.0], [0.0, Y + 1.5, z - 1.2], pushK(f, 1190, 0.0016, 0.004, 30), { fov: 48, roll: -0.03 }); };
// shot 12: decades later, a monk writes the story in his chronicle; then a hard cut closer as he wonders
const S12a = (f: number) => dolly([SCR[0] + 1.0, Y + 2.0, SCR[2] + 4.4], [SCR[0] + 0.0, Y + 1.3, SCR[2] - 1.0], pushK(f, 1296, 0.0018, 0.004, 30), { fov: 46, roll: 0.03 });
export const F_SPREAD = fr(49.07) - 3;
const S12b = (f: number) => dolly([SCR[0] - 0.4, Y + 1.6, SCR[2] + 2.0], [SCR[0] + 0.05, Y + 1.45, SCR[2] - 0.9], pushK(f, F_SPREAD, 0.0024, 0.006, 30), { fov: 40, roll: -0.03 });
// shot 13 (golden): today: the ruin on its hill, people looking up, the name on a sign
const S13a = (f: number) => dolly([RUIN[0] + 1.5, Y + 1.8, RUIN[2] + 19], [RUIN[0] - 0.5, Y + 10, RUIN[2] - 40], pushK(f, 1560, 0.0006), { fov: 56, roll: 0.03 });
// shot 14 (golden): high and wide: the long line of couples leaving the town that never fell; the lens rises away
const S14a = (f: number) => { const s = glide((f - 1761) / 189); return { pos: [18 + 4 * s, Y + 9 + 5 * s, 44 + 6 * s], look: [0, Y + 5, -6], fov: 50, roll: 0 } as Shot; };

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 148, s: S2a }],
  3: [{ f: 322, s: S3a }],
  4: [{ f: 446, s: S4a }],
  5: [{ f: 546, s: S5a }],
  6: [{ f: 688, s: S6a }],
  7: [{ f: 798, s: S7a }],
  8: [{ f: 922, s: S8a }],
  9: [{ f: 1044, s: S9a }],
  10: [{ f: 1095, s: S10a }],
  11: [{ f: 1190, s: S11a }],
  12: [{ f: 1296, s: S12a }, { f: F_SPREAD, cut: true, s: S12b }],
  13: [{ f: 1560, s: S13a }],
  14: [{ f: 1761, s: S14a }],
};

// impact kicks: [seconds, strength]: the wives come out, the shout, the laugh
const KICKS: [number, number][] = [[T_WIFE - 2 / 30, 0.45], [T_SHOUT - 2 / 30, 0.35], [T_LAUGHS - 2 / 30, 0.3]];
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
const at = (p: V3) => () => p;
export const DOF: Dof[] = [
  { f: 0, cInf: 10, focus: (f) => { const z = coupleZ(1, 0, T(f)) ?? 0; return [coupleX(0), roadY(z) + 1.9, z]; } },
  { f: 148, cInf: 0 },
  { f: 322, cInf: 11, focus: at([6.2, Y + 1.8, CZ - 6.2]) },
  { f: 446, cInf: 11, focus: at([STR[0] + 0.2, Y + 1.6, STR[2] - 0.4]) },
  { f: 546, cInf: 0 },
  { f: 688, cInf: 14, focus: at([STR[0], Y + 1.65, STR[2] - 0.5]) },
  { f: 798, cInf: 0 },
  { f: 922, cInf: 7, focus: at([0, roadY(-10) + 1.8, -10]) },
  { f: 1044, cInf: 13, focus: at([3.0, Y + 1.7, CZ - 17.6]) },
  { f: 1095, cInf: 13, focus: at([6.0, Y + 1.85, CZ - 16.6]) },
  { f: 1190, cInf: 0 },
  { f: 1296, cInf: 10, focus: at([SCR[0], Y + 1.4, SCR[2] - 1.0]) },
  { f: F_SPREAD, cInf: 13, focus: at([SCR[0], Y + 1.5, SCR[2] - 1.0]) },
  { f: 1560, cInf: 0 },
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
];
