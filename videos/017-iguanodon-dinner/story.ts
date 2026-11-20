// Timeline of "In 1853, Twenty-One Men Ate Dinner Inside a Dinosaur": shots timed to words.json. Three places, far
// apart on one big ground: Hawkins's workshop yard (an open timber shed round the clay mould of the Iguanodon, a
// platform round it, the glass hall of the Crystal Palace far behind), the park with its lake and the finished
// Iguanodon on an island (then and today), and a Belgian coal-mine gallery where the skeletons turn up. Camera grammar
// of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2016;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the Iguanodon mould in the workshop: body centre, head toward +x */
export const IG: V3 = [0, D0, 0];
/** body centre height above the ground and radii of the body ellipsoid */
export const BODY_Y = 3.0, BODY_R: V3 = [4.2, 1.5, 1.5];
/** rim of the open back (top of the hollow shell) and the diners' table top */
export const RIM_Y = D0 + BODY_Y + 0.37;
export const TABLE_Y = D0 + BODY_Y + 0.3;
/** the platform round the mould */
export const DECK_Y = D0 + 1.6;
/** the park: lake round an island, the finished Iguanodon on it */
export const PARK: V3 = [0, D0, 420];
export const ISLE: V3 = [0, D0, 420 - 16];
/** the coal-mine gallery (open-topped): back wall at z = MINE[2] - 3 */
export const MINE: V3 = [420, D0, 0];

// story beats (seconds on the voice clock)
export const T_DINO = 4.85; // "dinosaur."
export const T_HOST = 5.89; // "Their host"
export const T_MONSTERS = 10.1; // "monsters"
export const T_PALACE = 10.97; // "Crystal Palace"
export const T_PRIDE = 13.1; // "pride"
export const T_IGUANODON = 14.04; // "Iguanodon,"
export const T_HOLLOW = 15.41; // "hollow"
export const T_TABLE = 17.93; // "table"
export const T_DREW = 19.27; // "drew"
export const T_INVITE = 19.88; // "invite"
export const T_OWEN = 22.3; // "Richard Owen"
export const T_HEAD = 24.6; // "head."
export const T_WAITERS = 25.9; // "waiters"
export const T_SOUP = 26.76; // "soup,"
export const T_FISH = 27.11; // "fish,"
export const T_TURKEY = 27.52; // "turkey"
export const T_PIE = 27.93; // "pie,"
export const T_TOAST = 29.82; // "toasted"
export const T_ROARED = 30.7; // "roared"
export const T_SONG = 31.14; // "song"
export const T_PAPERS = 32.98; // "papers"
export const T_CROWDS = 33.9; // "crowds"
export const T_PROBLEM = 36.45; // "problem,"
export const T_WRONG = 37.74; // "wrong."
export const T_YOUSEE = 38.5; // "You see,"
export const T_BONES = 40.23; // "bones"
export const T_JIGSAW = 41.31; // "jigsaw"
export const T_PICTURE = 42.12; // "picture"
export const T_POINTED = 43.8; // "pointed"
export const T_HORN = 46.71; // "horn,"
export const T_SPIKE = 48.21; // "spike"
export const T_NOSE = 48.83; // "nose."
export const T_MINERS = 51.5; // "miners"
export const T_SKELETONS = 53.49; // "skeletons,"
export const T_HAND = 55.23; // "hand,"
export const T_THUMB = 56.3; // "thumb."
export const T_FAMOUS = 57.69; // "famous"
export const T_MISTAKE = 59.99; // "mistake,"
export const T_STANDS = 61.83; // "stands"
export const T_HORN2 = 63.29; // "horn and all."

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "yard" | "park" | "mine";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 174, "yard", "golden"), mk(2, 174, 384, "yard"), mk(3, 384, 523, "yard"), mk(4, 523, 575, "yard"),
  mk(5, 575, 638, "yard"), mk(6, 638, 770, "yard", "golden"), mk(7, 770, 887, "yard", "golden"), mk(8, 887, 983, "yard", "golden"),
  mk(9, 983, 1070, "park"), mk(10, 1070, 1152, "park"), mk(11, 1152, 1303, "yard"), mk(12, 1303, 1499, "yard"),
  mk(13, 1499, 1712, "mine"), mk(14, 1712, 1822, "yard", "golden"), mk(15, 1822, TOTAL, "park"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 6: 8, 9: 8, 11: 8, 13: 10, 14: 10, 15: 10 };
export const FLASH_AT = 174;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** the nose spike on the workshop mould: absent until Hawkins fits it in shot 12 (it slides in on the nose) */
export const spikeIn = (id: number, t: number) => (id === 12 ? smooth((t - T_SPIKE + 0.1) / 0.6) : 1);

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
const fr = (t: number) => Math.round(t * FPS);
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const Y = D0, [PX, , PZ] = PARK, [MX, , MZ] = MINE;
// shot 1 (hook, golden): the diners at their table in the dinosaur's open back, lanterns overhead; slow push-in
const S1a = (f: number) => dolly([10.0, Y + 7.0, 10.4], [2.3, Y + 3.7, -0.4], pushK(f, 0, 0.0016, 0.005, 30), { fov: 50, roll: 0.03 });
// shot 2: Hawkins in the workshop yard by his monsters, the glass hall of the Crystal Palace far behind
const S2a = (f: number) => dolly([12.5, Y + 2.2, 14.5], [3.5, Y + 3.0, -1.5], pushK(f, 174, 0.0008), { fov: 50, roll: -0.03 });
export const F_PALACE = fr(T_PALACE) - 3;
const S2b = (f: number) => dolly([12.0, Y + 2.6, 13.5], [-6.0, Y + 14, -150], pushK(f, F_PALACE, 0.0006), { fov: 50, roll: -0.02 });
// shot 3: along the clay mould of the Iguanodon, head to tail; the lens glides past its flank
const S3a = (f: number) => dolly([11.5, Y + 3.8, 6.8], [3.0, Y + 3.6, 0], pushK(f, 384, 0.001), { fov: 48, roll: 0.03 });
const S3b = (f: number) => dolly([8.5, Y + 8.0, 9.5], [1.5, Y + 3.4, 0], pushK(f, 384, 0.0012), { fov: 50, roll: 0.03 });
// shot 4: workmen lift the long table up into the open back
const S4a = (f: number) => dolly([-6.0, Y + 6.6, 7.6], [0.6, Y + 3.4, 0.4], pushK(f, 523, 0.0024, 0.005, 30), { fov: 48, roll: -0.03 });
// shot 5: Hawkins at his drawing desk, the invitation card
export const DESK: V3 = [-1.0, Y, 7.5];
const S5a = (f: number) => dolly([DESK[0] + 0.4, Y + 1.9, DESK[2] + 3.4], [DESK[0], Y + 1.45, DESK[2] - 0.2], pushK(f, 575, 0.0026, 0.006, 30), { fov: 42, roll: 0.03 });
// shot 6 (golden): Owen in the best seat at the head end
const S6a = (f: number) => dolly([0.6, Y + 5.0, 4.6], [2.8, Y + 3.9, -0.1], pushK(f, 638, 0.0022, 0.006, 30), { fov: 44, roll: 0.03 });
// shot 7 (golden): waiters on the platform pass the dishes up
const S7a = (f: number) => dolly([0.8, Y + 2.6, 8.6], [0.2, Y + 3.0, 1.6], pushK(f, 770, 0.002, 0.005, 30), { fov: 46, roll: -0.03 });
// shot 8 (golden): the toast and the roaring song
const S8a = (f: number) => dolly([-1.2, Y + 5.2, 6.0], [0.0, Y + 4.0, 0], pushK(f, 887, 0.002, 0.007, 30), { fov: 44, roll: 0.04 });
// shot 9: the park, crowds round the lake, the finished monster on its island
const S9a = (f: number) => dolly([PX + 7.0, Y + 3.2, PZ + 18], [PX + 0.0, Y + 2.4, ISLE[2]], pushK(f, 983, 0.0012, 0.004, 30), { fov: 50, roll: -0.03 });
// shot 10: closer on the monster's head and its nose horn
const S10a = (f: number) => dolly([PX + 9.0, Y + 4.5, ISLE[2] + 7.8], [PX + 6.1, Y + 4.4, ISLE[2]], pushK(f, 1070, 0.0024, 0.008, 25), { fov: 40, roll: 0.04 });
// shot 11: Hawkins and Owen at a trestle with a few bones: a jigsaw with no picture
export const BENCH: V3 = [3.0, Y, 7.5];
const S11a = (f: number) => dolly([BENCH[0] + 0.3, Y + 2.3, BENCH[2] + 3.6], [BENCH[0], Y + 1.25, BENCH[2]], pushK(f, 1152, 0.002, 0.005, 30), { fov: 46, roll: -0.03 });
// shot 12: the pointed bone, guessed a horn, fitted on the mould's nose
const S12a = (f: number) => dolly([9.0, Y + 3.6, 8.6], [5.4, Y + 3.5, 1.0], pushK(f, 1303, 0.0016, 0.004, 30), { fov: 48, roll: 0.03 });
export const F_NOSE = fr(T_SPIKE) - 3;
const S12b = (f: number) => dolly([6.5, Y + 4.9, 4.0], [6.4, Y + 4.5, 0.0], pushK(f, F_NOSE, 0.0024, 0.007, 30), { fov: 40, roll: 0.03 });
// shot 13: 1878, the Belgian coal mine: miners' lamps on a skeleton in the coal; hard cut close on the hand
const S13a = (f: number) => dolly([MX + 0.6, Y + 2.3, MZ + 9.5], [MX + 0.2, Y + 1.9, MZ - 2.8], pushK(f, 1499, 0.0016, 0.004, 30), { fov: 50, roll: -0.03 });
export const F_HAND = fr(T_HAND) - 3;
const S13b = (f: number) => dolly([MX + 1.7, Y + 2.2, MZ - 0.6], [MX + 1.7, Y + 2.2, MZ - 2.9], pushK(f, F_HAND, 0.0024, 0.008, 30), { fov: 40, roll: 0.03 });
// shot 14 (golden): back at the dinner; the lens rises and pulls away from the diners in the mistake
const S14a = (f: number) => { const s = glide((f - 1712) / 110); return { pos: [4.5 + 1.0 * s, Y + 5.5 + 1.7 * s, 6.0 + 5.5 * s], look: [0.8, Y + 3.6, -0.3], fov: 48, roll: 0.03 * (1 - s) } as Shot; };
// shot 15: today, the park: modern visitors on the shore; the lens rises over the lake to the old monster, horn and all
const S15a = (f: number) => { const s = glide((f - 1822) / 194); return { pos: [PX + 8 - 1.5 * s, Y + 3.0 + 1.2 * s, PZ + 16 + 2 * s], look: [PX + 2.0, Y + 2.4, ISLE[2]], fov: 50, roll: 0 } as Shot; };

export const F_3B = fr(T_HOLLOW) - 3;
export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 174, s: S2a }, { f: F_PALACE, dur: 36, s: S2b }],
  3: [{ f: 384, s: S3a }, { f: F_3B, dur: 36, s: S3b }],
  4: [{ f: 523, s: S4a }],
  5: [{ f: 575, s: S5a }],
  6: [{ f: 638, s: S6a }],
  7: [{ f: 770, s: S7a }],
  8: [{ f: 887, s: S8a }],
  9: [{ f: 983, s: S9a }],
  10: [{ f: 1070, s: S10a }],
  11: [{ f: 1152, s: S11a }],
  12: [{ f: 1303, s: S12a }, { f: F_NOSE, cut: true, s: S12b }],
  13: [{ f: 1499, s: S13a }, { f: F_HAND, cut: true, s: S13b }],
  14: [{ f: 1712, s: S14a }],
  15: [{ f: 1822, s: S15a }],
};

// impact kicks: [seconds, strength]: the roar, "wrong", "thumb"
const KICKS: [number, number][] = [[T_ROARED - 2 / 30, 0.35], [T_WRONG - 2 / 30, 0.45], [T_THUMB - 2 / 30, 0.4]];
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
  { f: 0, cInf: 7, focus: at([0.6, Y + 4.0, -0.7]) },
  { f: 174, cInf: 0 },
  { f: 384, cInf: 0 },
  { f: 523, cInf: 0 },
  { f: 575, cInf: 13, focus: at([DESK[0], Y + 1.6, DESK[2] - 0.3]) },
  { f: 638, cInf: 12, focus: at([2.8, Y + 3.9, -0.1]) },
  { f: 770, cInf: 10, focus: at([0.2, Y + 3.0, 1.9]) },
  { f: 887, cInf: 10, focus: at([0.0, Y + 4.1, 0.3]) },
  { f: 983, cInf: 0 },
  { f: 1070, cInf: 12, focus: at([PX + 5.8, Y + 4.4, ISLE[2]]) },
  { f: 1152, cInf: 11, focus: at([BENCH[0], Y + 1.6, BENCH[2] - 0.4]) },
  { f: 1303, cInf: 0 },
  { f: F_NOSE, cInf: 12, focus: at([6.6, Y + 4.4, 0]) },
  { f: 1499, cInf: 7, focus: at([MX, Y + 1.9, MZ - 1.0]) },
  { f: F_HAND, cInf: 14, focus: at([MX + 1.7, Y + 2.2, MZ - 2.9]) },
  { f: 1712, cInf: 5, focus: at([0.6, Y + 4.0, -0.7]) },
  { f: 1822, cInf: 0 },
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
  { a: 975, b: 1070, kit: "tree_oak", pos: [PX + 10.5, Y, PZ + 15.0], s: 6.5 },
  { a: 1815, b: TOTAL, kit: "plant_bush", pos: [PX + 6.8, Y, PZ + 12.2], s: 1.2 },
];
