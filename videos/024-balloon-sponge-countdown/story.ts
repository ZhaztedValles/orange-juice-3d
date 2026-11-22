// Timeline of "The Last 25 Minutes of the First Flight: Two Men Putting Out Fires Over Paris": shots timed to
// words.json. Three places far apart on one big ground (beyond each other's fog): the garden of the Chateau de la
// Muette (the balloon on the lawn, the crowd, the king), Paris (roofs, streets and the Seine, seen from the balloon)
// and the field between two windmills where it lands. The balloon is a Montgolfier hot-air balloon: a tall blue and
// gold envelope standing on a round gallery where the two men stand on opposite sides of the open neck, with the straw
// brazier hanging in the middle. Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f,
// hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2040;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the garden of La Muette: the balloon stands on the lawn at the origin, the chateau behind it to the north */
export const GARDEN: V3 = [0, D0, 0];
/** Paris under the balloon: the centre of the town; the Seine runs along x through it */
export const PARIS: V3 = [0, D0, -700];
export const RIVER_Z = PARIS[2] - 6, RIVER_W = 34;
/** the landing field between two windmills */
export const FIELD: V3 = [620, D0, 0];
export const MILLS: V3[] = [[FIELD[0] - 17, D0, FIELD[2] - 16], [FIELD[0] + 19, D0, FIELD[2] - 13]];
/** the balloon (gallery-floor frame): the gallery ring, its rail, the envelope profile (radius r at height y) */
/** the gallery's height above the lawn on its launch trestles, and once landed (resting on the brazier) */
export const GROUND_GAL = 0.8, LANDED_GAL = 0.5;
export const GAL_IN = 1.45, GAL_OUT = 2.6, RAIL = 0.95, MAN_R = 2.08;
export const ENV_PROFILE: [number, number][] = [
  [1.45, 0.0], [1.6, 1.4], [1.95, 2.8], [2.7, 4.2], [3.8, 5.6], [5.0, 7.2], [6.0, 9.0], [6.7, 11.0], [7.0, 13.0],
  [6.9, 14.8], [6.3, 16.6], [5.2, 18.2], [3.6, 19.5], [1.8, 20.3], [0.001, 20.6],
];
/** the envelope's radius at height y (linear in the profile) */
export const envR = (y: number) => {
  for (let i = 0; i + 1 < ENV_PROFILE.length; i++) {
    const [r0, y0] = ENV_PROFILE[i], [r1, y1] = ENV_PROFILE[i + 1];
    if (y <= y1) return r0 + (r1 - r0) * clamp01((y - y0) / (y1 - y0));
  }
  return 0;
};
/** the two men on the gallery (local angle around the neck; 0 = +x): d'Arlandes east, Pilatre west */
export const DAR_A = 0.0, PIL_A = Math.PI;
export const onGallery = (a: number, r = MAN_R): [number, number] => [r * Math.cos(a), -r * Math.sin(a)];

// story beats (seconds on the voice clock)
export const T_PUTTING = 3.75, T_FIRES = 4.16;
export const T_IT = 5.03, T_PARIS = 8.57;
export const T_MONT = 9.45, T_BLUE = 10.91, T_STRAW = 13.57;
export const T_KING = 14.68, T_PRISON = 15.53, T_BUT = 16.79, T_PIL = 16.93, T_BEGGED = 18.94;
export const T_25 = 20.21, T_RISE = 22.10, T_SILENT = 23.41;
export const T_20 = 24.51, T_SEINE = 27.46;
export const T_15 = 29.21, T_BURNING = 30.70, T_LAND = 31.38, T_GLOWING = 32.73, T_HOLES = 33.10;
export const T_10 = 34.56, T_DABS = 36.01, T_SPONGE = 37.02, T_SINK = 39.54;
export const T_SHOUTS = 40.74, T_FEED = 41.42, T_GROWS = 42.73, T_HOLES2 = 43.73;
export const T_5 = 44.48, T_WANTS = 46.02, T_ROOFS = 47.85;
export const T_1 = 49.26, T_CLEAR = 50.75, T_DIE = 52.27;
export const T_SETTLES = 53.60, T_WINDMILLS = 55.89;
export const T_THEN = 56.91, T_COLL = 58.05, T_EMBERS = 60.12;
export const T_FIRSTMAN = 61.0, T_DRAGGED = 63.16, T_OWN = 64.41;

/** the balloon's gallery floor in world space, shot id at time t */
export const balloonAt = (id: number, t: number): V3 => {
  const [GX, , GZ] = GARDEN, [PX, , PZ] = PARIS, [FX, , FZ] = FIELD;
  if (id === 2 || id === 3 || id === 4) return [GX, D0 + GROUND_GAL, GZ];
  if (id === 5) { const u = Math.max(0, t - T_RISE + 0.07); return [GX + 0.25 * u * u, D0 + GROUND_GAL + 0.9 * u * u + 0.5 * u, GZ]; }
  if (id === 11) { const u = t - T_1; return [FX - 70 + 4.0 * u, D0 + 34 - 2.6 * u, FZ - 4]; }
  if (id === 12) { const k = smooth((t - T_SETTLES + 0.4) / 2.6); return [FX - 9 * (1 - k), D0 + LANDED_GAL + 16 * (1 - k), FZ]; }
  if (id === 13 || id === 14) return [FX, D0 + LANDED_GAL, FZ];
  // over Paris (shots 1, 6-10): a slow drift east along the river, about seventy metres up
  return [PX - 60 + 1.4 * (t - 20), D0 + 70, RIVER_Z + 4];
};
/** local -> world for the balloon of shot id */
export const bw = (id: number, t: number, x: number, y: number, z: number): V3 => { const b = balloonAt(id, t); return [b[0] + x, b[1] + y, b[2] + z]; };
/** the envelope's collapse after landing: 0 standing .. 1 flat on the ground */
export const collapseAt = (id: number, t: number) => (id === 14 ? 1 : id === 13 ? smooth((t - T_COLL + 0.1) / 1.1) : 0);
/** the brazier fire: 0 out .. 1 roaring */
export const fireAt = (id: number, t: number) => {
  if (id === 2 || id === 3 || id === 4) return 0.55;
  if (id === 9) return 0.6 + 0.4 * smooth((t - T_GROWS + 0.3) / 0.8);
  if (id === 11) return 0.8 * (1 - smooth((t - T_DIE + 0.4) / 1.0));
  if (id >= 12) return 0;
  return 0.75;
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "garden" | "sky" | "field";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 148, "sky"), mk(2, 148, 281, "garden"), mk(3, 281, 437, "garden"), mk(4, 437, 603, "garden"),
  mk(5, 603, 732, "garden"), mk(6, 732, 873, "sky"), mk(7, 873, 1034, "sky"), mk(8, 1034, 1204, "sky"),
  mk(9, 1204, 1331, "sky"), mk(10, 1331, 1475, "sky"), mk(11, 1475, 1587, "sky"), mk(12, 1587, 1704, "field"),
  mk(13, 1704, 1827, "field"), mk(14, 1827, TOTAL, "field", "golden"),
];
/** crossfades (frames) at place changes: up into the sky over the Seine (6), down into the field (12) */
export const XFADE: Record<number, number> = { 6: 10, 12: 10 };
export const FLASH_AT = 148;

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
const T = (f: number) => f / FPS;
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** a camera in the balloon's frame: pos and look are local to the gallery floor of shot id */
const rel = (id: number, f: number, pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => {
  const t = T(f);
  return dolly(bw(id, t, ...pos), bw(id, t, ...look), k, rest);
};
/** a hold that creeps in, with a punch on the beat word t */
const P = (f: number, a: number, t: number, punch = 0.005) => pushK(f, a, 0.0018, 0, 30) * pushK(f, fr(t) - 3, 0, punch, 25);
const [DX, DZ] = onGallery(DAR_A), [PLX, PLZ] = onGallery(PIL_A);
const Y = D0, [GX, , GZ] = GARDEN, [FX, , FZ] = FIELD;
/** where the king, the prisoners and the two flyers stand on the lawn (shot 4) */
export const KING_AT: V3 = [GX + 9.0, D0 + 0.08, GZ + 9.0];
// shot 1 (hook): over Paris, the balloon wide with the roofs below; cut on "putting" to d'Arlandes dabbing a hole
const S1a = (f: number) => rel(1, f, [-26, -6, 30], [0, 8, 0], P(f, 0, T_PUTTING, 0.003), { fov: 48, roll: 0.03 });
const S1b = (f: number) => rel(1, f, [DX + 4.6, 1.5, DZ + 1.8], [DX - 0.2, 1.8, DZ - 0.1], P(f, 109, T_FIRES, 0.006), { fov: 56, roll: -0.03 });
// shot 2: the garden of La Muette: the chateau, the crowd, the balloon on the lawn
const S2 = (f: number) => dolly([GX + 22, Y + 3.0, GZ + 38], [GX - 2, Y + 8.5, GZ - 6], P(f, 148, T_PARIS, 0.004), { fov: 52, roll: -0.03 });
// shot 3: under the balloon: the Montgolfier brothers feed the straw fire; a glide up the blue and gold envelope
const S3a = (f: number) => dolly([GX + 5.5, Y + 1.7, GZ + 8.5], [GX + 0.6, Y + 2.2, GZ + 1.0], pushK(f, 281, 0.0018), { fov: 46, roll: 0.03 });
const S3b = (f: number) => dolly([GX + 9, Y + 2.2, GZ + 17], [GX, Y + 11, GZ], pushK(f, fr(T_BLUE) - 3, 0.0018), { fov: 52, roll: 0.03 });
// shot 4: the lawn: the king points at two prisoners; a glide to the two flyers begging for the honour
const S4a = (f: number) => dolly([KING_AT[0] + 0.6, Y + 1.8, KING_AT[2] + 6.2], [KING_AT[0] + 0.6, Y + 1.5, KING_AT[2]], pushK(f, 437, 0.0018), { fov: 42, roll: -0.03 });
const S4b = (f: number) => dolly([KING_AT[0] - 2.6, Y + 1.8, KING_AT[2] + 7.0], [KING_AT[0] - 2.7, Y + 1.5, KING_AT[2]], P(f, fr(T_PIL) - 3, T_BEGGED, 0.005), { fov: 42, roll: -0.03 });
// shot 5: lift-off: from behind the crowd, the balloon rises off the lawn
const S5 = (f: number) => { const t = T(f), up = Math.max(0, t - T_RISE) * 1.6;
  return dolly([GX + 14, Y + 1.9, GZ + 27], [GX, Y + 9 + up, GZ], P(f, 603, T_SILENT, 0.004), { fov: 54, roll: 0.03 }); };
// shot 6: the balloon over the Seine, the roofs of Paris below
const S6 = (f: number) => rel(6, f, [-46, 10, 36], [4, -20, -2], P(f, 732, T_SEINE, 0.003), { fov: 64, roll: -0.03 });
// shot 7: close on the cloth above d'Arlandes: burning straw floats up, glowing holes open
const S7 = (f: number) => rel(7, f, [DX + 4.4, 1.6, DZ + 2.6], [DX - 0.3, 2.0, DZ + 0.1], P(f, 873, T_HOLES, 0.006), { fov: 56, roll: 0.03 });
// shot 8: d'Arlandes and his wet sponge on the pitchfork, dabbing; the balloon sinks
const S8 = (f: number) => rel(8, f, [DX + 4.2, 1.6, DZ - 1.8], [DX - 0.1, 1.9, DZ + 0.1], P(f, 1034, T_SINK, 0.006), { fov: 54, roll: -0.03 });
// shot 9: under the other side of the gallery: Pilatre shouts and forks straw onto the brazier; the fire grows
const S9 = (f: number) => rel(9, f, [PLX - 4.4, -0.6, PLZ + 2.2], [PLX + 0.6, 1.0, PLZ], P(f, 1204, T_GROWS, 0.006), { fov: 48, roll: 0.03 });
// shot 10: high beside the balloon: d'Arlandes wants to land; the rooftops of Paris right below
const S10 = (f: number) => rel(10, f, [DX + 6.0, 5.0, DZ + 7.0], [DX - 1.0, -4, DZ - 1.0], P(f, 1331, T_ROOFS, 0.004), { fov: 58, roll: -0.03 });
// shot 11: the edge of the city: the balloon sinks past toward the fields as the fire dies
const S11 = (f: number) => { const b = balloonAt(11, T_1);
  return dolly([b[0] + 30, Y + 24, b[2] + 48], bw(11, T(f), 0, 3, 0), P(f, 1475, T_DIE, 0.003), { fov: 54, roll: 0.03 }); };
// shot 12: the field between the windmills: the balloon settles
const S12 = (f: number) => dolly([FX + 4, Y + 2.2, FZ + 42], [FX, Y + 9, FZ - 4], P(f, 1587, T_WINDMILLS, 0.004), { fov: 54, roll: -0.03 });
// shot 13: closer: the cloth collapses on top of them
const S13 = (f: number) => dolly([FX + 12, Y + 3.0, FZ + 21], [FX, Y + 4.5, FZ], P(f, 1704, T_COLL, 0.006), { fov: 50, roll: 0.03 });
// shot 14 (golden): farm folk drag Pilatre out from under his own balloon
/** how far Pilatre has been dragged out from under the cloth (m) */
export const dragAt = (t: number) => 1.2 * smooth((t - T_DRAGGED + 0.07) / 1.3);
const S14 = (f: number) => dolly([FX + 12.2 + dragAt(T(f)), Y + 2.1, FZ + 10.2], [FX + 8.9 + dragAt(T(f)), Y + 0.9, FZ + 0.6], P(f, 1827, T_DRAGGED, 0.006), { fov: 50, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 109, cut: true, s: S1b }],
  2: [{ f: 148, s: S2 }],
  3: [{ f: 281, s: S3a }, { f: fr(T_BLUE) - 3, dur: 36, s: S3b }],
  4: [{ f: 437, s: S4a }, { f: fr(T_PIL) - 3, dur: 30, s: S4b }],
  5: [{ f: 603, s: S5 }], 6: [{ f: 732, s: S6 }], 7: [{ f: 873, s: S7 }], 8: [{ f: 1034, s: S8 }],
  9: [{ f: 1204, s: S9 }], 10: [{ f: 1331, s: S10 }], 11: [{ f: 1475, s: S11 }], 12: [{ f: 1587, s: S12 }],
  13: [{ f: 1704, s: S13 }], 14: [{ f: 1827, s: S14 }],
};

// impact kicks: [seconds, strength]: "fires" (hook), the holes opening, the cloth collapsing
const KICKS: [number, number][] = [[T_FIRES - 2 / 30, 0.35], [T_HOLES - 2 / 30, 0.3], [T_COLL - 2 / 30, 0.45]];
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
const eyes = (id: number, a: number) => (f: number): V3 => { const [x, z] = onGallery(a); return bw(id, T(f), x, 1.55, z); };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 109, cInf: 15, focus: eyes(1, DAR_A) },
  { f: 148, cInf: 0 },
  { f: 281, cInf: 11, focus: () => [GX + 2.6, D0 + 1.5, GZ + 2.4] },
  { f: fr(T_BLUE) - 3, dur: 30, cInf: 0 },
  { f: 437, cInf: 11, focus: () => [KING_AT[0], D0 + 1.6, KING_AT[2]] },
  { f: 603, cInf: 0 },
  { f: 873, cInf: 12, focus: eyes(7, DAR_A) },
  { f: 1034, cInf: 13, focus: eyes(8, DAR_A) },
  { f: 1204, cInf: 11, focus: eyes(9, PIL_A) },
  { f: 1331, cInf: 0 },
  { f: 1827, cInf: 10, focus: (f) => [FX + 8.9 + dragAt(T(f)), D0 + 0.6, FZ + 1.0] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  const pf = p.focus, df = d.focus ?? pf, e = glide(k);
  const focus = pf && df && k < 1 ? (g: number): V3 => { const a = pf(g), b = df(g); return a.map((v, j) => v + (b[j] - v) * e) as V3; } : d.focus;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus };
};

/** near framing objects: Kenney models just in front of the lens for a few shots */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 148, b: 281, kit: "tree_oak", pos: [GX + 27, D0, GZ + 30], s: 8.0 },
  { a: 1587, b: 1704, kit: "plant_bushDetailed", pos: [FX + 7.5, D0, FZ + 35], s: 1.2 },
  { a: 437, b: 603, kit: "lantern", pos: [KING_AT[0] + 3.4, D0, KING_AT[2] + 3.2], s: 2.6 },
];
