// Timeline of "This 1583 Shipwreck Padlock Stayed Locked for 400 Years. A Scanner Just Cracked Its Code": shots timed to words.json. Three
// places on one big ground: a Welsh beach (dry sand and low dunes sloping into the sea at z < 0; the 1583 storm, the
// detectorist's finds, the last look out to sea), a lab (an open-topped room with the scanner cabinet and a desk
// with its monitor) and a museum room (open-topped, a work table and a display case). Camera grammar of the bridge
// template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2010;
export const D0 = 6.0; // ground level (m)
export const SEA_Y = D0 - 1.0; // the sea surface
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the beach: flat dry sand down to z = -6, then a slope into the sea (water line about z = -16) */
export const BEACH: V3 = [0, D0, 0];
/** the lab (open-topped room), its desk with the monitor and the scanner cabinet */
export const LAB: V3 = [110, D0, 130];
export const DESK: V3 = [108.8, D0, 127.6];
export const SCAN: V3 = [112.4, D0, 127.4];
/** the museum room (open-topped), its work table and the display case */
export const MUS: V3 = [-110, D0, 130];
export const TABLE: V3 = [-110, D0, 128.8];
export const CASE: V3 = [-107.2, D0, 127.6];
/** the sand's height at z on the beach (flat to z = -6, then sloping 1:9 into the sea) */
export const sandY = (z: number) => (z >= -6 ? D0 : D0 - (-6 - z) / 9);

// story beats (seconds on the voice clock)
export const T_PADLOCK = 1.52; // "padlock"
export const T_CLICKED = 4.0; // "clicked open"
export const T_NOBODY = 4.97; // "nobody broke it"
export const T_SHIP = 8.32; // "ship"
export const T_STORM = 10.97; // "storm"
export const T_DROVE = 11.53; // "drove"
export const T_COINS = 14.47; // "coins"
export const T_SANK = 14.86; // "sank"
export const T_STRIPPED = 17.65; // "stripped"
export const T_MAN = 19.18; // "man"
export const T_DETECTOR = 20.02; // "detector"
export const T_TREASURE = 21.23; // "treasure."
export const T_DUG = 23.59; // "dug up"
export const T_LOCK = 24.6; // "lock"
export const T_RINGS = 25.73; // "rings"
export const T_SIX = 27.35; // "Six"
export const T_THOUSAND = 29.26; // "thousand"
export const T_ONE = 30.6; // "one is right"
export const T_TWENTY = 32.0; // "twenty"
export const T_NOBODY2 = 32.62; // "nobody got it."
export const T_LAB = 35.25; // "lab"
export const T_PUT = 36.95; // "put it in"
export const T_SCANNER = 37.31; // "scanner"
export const T_FAILED = 39.96; // "failed"
export const T_THIRD = 40.61; // "third"
export const T_NOTCH = 41.9; // "notch"
export const T_LINED = 42.15; // "lined up."
export const T_A = 43.59; // "A,"
export const T_N = 43.86; // "N,"
export const T_C = 44.16; // "C,"
export const T_E = 44.62; // "E."
export const T_SET = 45.76; // "set the rings"
export const T_CLEANED = 46.5; // "cleaned"
export const T_OPENED = 47.5; // "opened."
export const T_FORCED = 48.71; // "forced"
export const T_PERFECT = 50.17; // "perfect,"
export const T_SWANSEA = 51.74; // "Swansea."
export const T_FOUND = 53.61; // "found"
export const T_ARK = 55.36; // "Ark"
export const T_KNOWS = 57.17; // "knows"
export const T_OWNER = 59.14; // "owner."
export const T_NAME = 60.19; // "name,"
export const T_PASSWORD = 61.06; // "password?"
export const T_TELL = 62.09; // "Tell me"

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "museum" | "storm" | "beach" | "lab";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 183, "museum"), mk(2, 183, 400, "storm", "golden"), mk(3, 400, 484, "storm", "golden"), mk(4, 484, 659, "beach"),
  mk(5, 659, 817, "beach"), mk(6, 817, 946, "beach"), mk(7, 946, 1007, "beach", "golden"), mk(8, 1007, 1171, "lab"),
  mk(9, 1171, 1287, "lab"), mk(10, 1287, 1340, "lab"), mk(11, 1340, 1447, "museum"), mk(12, 1447, 1590, "museum"),
  mk(13, 1590, 1696, "museum"), mk(14, 1696, TOTAL, "beach", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 4: 10, 7: 8, 8: 8, 11: 8, 14: 10 };
export const FLASH_AT = 183;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the ship ----------------
/** the Ann Francis: x, z, yaw (bow along local +x), roll; driven toward the beach in shot 2, beached and heeled in 3 */
export type ShipPose = { x: number; z: number; yaw: number; roll: number; pitch: number } | null;
export const shipAt = (id: number, t: number): ShipPose => {
  if (id === 2) {
    const u = smooth((t - T_DROVE + 0.2) / 1.6);
    return { x: -14 + 1.1 * (t - 6.1), z: -50 + 16 * u, yaw: -0.5 - 0.5 * u, roll: 0.16 * Math.sin(t * 2.1) + 0.12 * u, pitch: 0.06 * Math.sin(t * 1.7 + 0.6) };
  }
  if (id === 3) return { x: 7, z: -30, yaw: -1.2, roll: 0.34 + 0.01 * Math.sin(t * 1.3), pitch: 0.04 };
  return null;
};

// ---------------- the finder walking ----------------
/** the detectorist's x along the beach in shot 4 (walks toward +x, slowly, sweeping) */
export const finderX = (t: number) => -7.5 + 0.55 * (t - 16.1);

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
/** a look point d metres from pos toward tgt: keeps the push-ins small when the subject is far away */
const aim = (pos: V3, tgt: V3, d: number): V3 => {
  const v = tgt.map((x, i) => x - pos[i]), n = Math.hypot(...v) || 1;
  return pos.map((x, i) => x + (v[i] / n) * d) as V3;
};
const Y = D0;
const M = MUS, Tb = TABLE, Cs = CASE, Lb = LAB, Dk = DESK, Sc = SCAN;
export const fr = (t: number) => Math.round(t * FPS);
// shot 1 (hook): the museum table: the brass lock between the curator and the conservator; it clicks open
const S1a = (f: number) => dolly([Tb[0] + 0.3, Y + 1.6, Tb[2] + 2.5], [Tb[0] + 0.0, Y + 1.32, Tb[2] - 0.4], pushK(f, 0, 0.0018, 0.005, 30), { fov: 44, roll: 0.03 });
// shot 2 (golden): from the beach: the Ann Francis heaving in the storm, driven toward the sand
const S2a = (f: number) => { const p: V3 = [-3, Y + 1.5, 7]; return dolly(p, aim(p, [-9, Y + 3.0, -40], 16), pushK(f, 183, 0.0016, 0.005, 30), { fov: 34, roll: -0.03 }); };
// shot 3 (golden): low on the sand: the coins sink, the wreck heeled over behind
const S3a = (f: number) => dolly([-0.8, Y + 0.75, 1.6], [0.2, Y + 0.2, -3.2], pushK(f, 400, 0.0024, 0.006, 30), { fov: 44, roll: 0.04 });
// shot 4: long after, a bright day: the detectorist sweeps along the beach
const S4a = (f: number) => { const x = finderX(f / FPS); return dolly([x + 6.5, Y + 2.0, 6.4], [x + 0.6, Y + 1.0, -1.2], pushK(f, 484, 0.0018, 0.004, 30), { fov: 44, roll: 0.03 }); };
// shot 5: 1999: he holds up the little brass lock
const S5a = (f: number) => dolly([1.05, Y + 1.72, 1.9], [0.05, Y + 1.38, -1.0], pushK(f, 659, 0.0022, 0.006, 30), { fov: 42, roll: -0.03 });
// shot 6: the lock close: four rings of six letters
const S6a = (f: number) => dolly([0.62, Y + 1.36, 0.55], [0.32, Y + 1.24, -0.62], pushK(f, 817, 0.0022, 0.005, 30), { fov: 40, roll: 0.04 });
// shot 7 (golden): twenty years: he sits on the sand at sunset turning the rings
const S7a = (f: number) => dolly([4.3, Y + 1.25, 8.6], [2.8, Y + 0.85, 4.6], pushK(f, 946, 0.0026, 0.006, 30), { fov: 42, roll: -0.03 });
// shot 8: the lab: the curator brings the lock, the engineer puts it in the scanner
const S8a = (f: number) => dolly([Lb[0] - 0.4, Y + 1.85, Lb[2] + 3.9], [Lb[0] + 1.3, Y + 1.25, Lb[2] - 2.0], pushK(f, 1007, 0.0018, 0.004, 30), { fov: 46, roll: 0.03 });
// shot 9: the monitor: a failed scan, then the third
const S9a = (f: number) => dolly([Dk[0] - 0.12, Y + 1.62, Dk[2] + 3.0], [Dk[0] - 0.24, Y + 1.3, Dk[2] - 0.1], pushK(f, 1171, 0.0022, 0.005, 30), { fov: 42, roll: -0.03 });
// shot 10: the screen close: the four letters
const S10a = (f: number) => dolly([Dk[0] + 0.08, Y + 1.26, Dk[2] + 1.9], [Dk[0], Y + 1.2, Dk[2] - 0.1], pushK(f, 1287, 0.003, 0.008, 30), { fov: 40, roll: 0.03 });
// shot 11: the museum table: they set the rings, brush out the grit, it opens
const S11a = (f: number) => dolly([Tb[0] - 0.9, Y + 1.7, Tb[2] + 2.5], [Tb[0] + 0.1, Y + 1.15, Tb[2] - 0.3], pushK(f, 1340, 0.002, 0.005, 30), { fov: 44, roll: -0.03 });
// shot 12: the display case: visitors round the lock on show
const S12a = (f: number) => dolly([Cs[0] - 2.2, Y + 1.85, Cs[2] + 4.4], [Cs[0] + 0.1, Y + 1.2, Cs[2] - 0.2], pushK(f, 1447, 0.0018, 0.004, 30), { fov: 46, roll: 0.03 });
// shot 13: the finder beside the case: like opening the Ark
const S13a = (f: number) => dolly([Cs[0] - 0.55, Y + 1.85, Cs[2] + 4.4], [Cs[0] - 0.25, Y + 1.45, Cs[2] + 0.2], pushK(f, 1590, 0.0024, 0.006, 30), { fov: 42, roll: -0.03 });
// shot 14 (golden): the beach at sunset: the finder looks out to where the ship came ashore; a slow rise
const S14a = (f: number) => dolly([2.6, Y + 1.5, 6.2], [0.4, Y + 1.5, -2.0], pushK(f, 1696, 0.0016, 0.004, 30), { fov: 46, roll: 0.03 });
const S14b = (f: number) => dolly([3.6, Y + 2.6, 8.4], [0.0, Y + 2.0, -6.0], pushK(f, fr(T_NAME) - 3, 0.0014), { fov: 48, roll: 0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 183, s: S2a }],
  3: [{ f: 400, s: S3a }],
  4: [{ f: 484, s: S4a }],
  5: [{ f: 659, s: S5a }],
  6: [{ f: 817, s: S6a }],
  7: [{ f: 946, s: S7a }],
  8: [{ f: 1007, s: S8a }],
  9: [{ f: 1171, s: S9a }],
  10: [{ f: 1287, s: S10a }],
  11: [{ f: 1340, s: S11a }],
  12: [{ f: 1447, s: S12a }],
  13: [{ f: 1590, s: S13a }],
  14: [{ f: 1696, s: S14a }, { f: fr(T_NAME) - 3, dur: 40, s: S14b }],
};

// impact kicks: [seconds, strength]: the lock clicks open (hook), the storm, the detector finds treasure, the lock opens at
// the museum, "the Ark" (the bursts of light start on these planned kick frames)
const KICKS: [number, number][] = [[T_CLICKED - 2 / 30, 0.45], [T_STORM - 2 / 30, 0.6], [T_TREASURE - 2 / 30, 0.3], [T_OPENED - 2 / 30, 0.45], [T_ARK - 2 / 30, 0.3]];
export const KICK_FRAMES = KICKS.map(([t]) => Math.floor(t * FPS + 1e-6));
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
/** the lock is drawn open from its kick frame on (the drawing swaps on the kick, a planned frame) */
export const lockOpen = (id: number, t: number) => (id === 1 ? t >= T_CLICKED - 2 / 30 - 1e-6 : id === 11 ? t >= T_OPENED - 2 / 30 - 1e-6 : id >= 12 && id <= 13);
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
  { f: 0, cInf: 12, focus: at([Tb[0], Y + 1.1, Tb[2] - 0.15]) },
  { f: 183, cInf: 0 },
  { f: 400, cInf: 13, focus: at([0.1, Y + 0.15, -2.6]) },
  { f: 484, cInf: 0 },
  { f: 659, cInf: 11, focus: at([0.05, Y + 1.5, -1.0]) },
  { f: 817, cInf: 15, focus: at([0.32, Y + 1.24, -0.62]) },
  { f: 946, cInf: 10, focus: at([2.8, Y + 0.9, 4.6]) },
  { f: 1007, cInf: 7, focus: at([Lb[0] + 1.2, Y + 1.5, Lb[2] - 1.6]) },
  { f: 1171, cInf: 12, focus: at([Dk[0], Y + 1.2, Dk[2] - 0.1]) },
  { f: 1287, cInf: 14, focus: at([Dk[0], Y + 1.2, Dk[2] - 0.1]) },
  { f: 1340, cInf: 11, focus: at([Tb[0] + 0.1, Y + 1.3, Tb[2] - 0.4]) },
  { f: 1447, cInf: 7, focus: at([Cs[0], Y + 1.4, Cs[2] + 0.4]) },
  { f: 1590, cInf: 12, focus: at([Cs[0] - 0.4, Y + 1.6, Cs[2]]) },
  { f: 1696, cInf: 5, focus: at([0.4, Y + 1.5, -1.6]) },
  { f: fr(T_NAME) - 3, dur: 36, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  // the focus point glides with the blur (an instant focus jump at a blurred key reads as a pop)
  const pf = p.focus, df = d.focus ?? pf, e = glide(k);
  const focus = pf && df && k < 1 ? (g: number): V3 => { const a = pf(g), b = df(g); return a.map((v, j) => v + (b[j] - v) * e) as V3; } : d.focus;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus };
};

/** near framing objects: Kenney models just in front of the lens for a few shots */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 484, b: 659, kit: "grass_large", pos: [-0.6, D0, 5.0], s: 0.9 },
];
void M; void Sc;
