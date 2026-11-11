// Timeline of "Trapped in a Sunken Submarine in 1851, Their Way Out Was to Let the Sea In": shots timed to words.json,
// the submarine's dive, tilt, crush and landing on the harbour bed, the water rising inside the cut-open hull, the
// hatch that flies open, and the camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f,
// hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2040;
export const D0 = 6.0; // quay / street level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** Kiel: the town and its stone quay on x < 0, the harbour water on x > 0 */
export const SEA_Y = D0 - 1.2;
export const BED_Y = SEA_Y - 16; // the harbour bed, about sixteen metres down
/** the submarine moored at the quay, the spot where it dives, and where it lies on the bed */
export const SUBQ: V3 = [5.2, SEA_Y + 0.15, 2];
export const DIVE: V3 = [26, SEA_Y + 0.15, 6];
export const WRECK: V3 = [26, BED_Y + 1.05, 6];
/** Bauer on the quay, and the Danish blockade ships out at the harbour mouth */
export const BAUER_Q: V3 = [-1.4, D0, 4.2];
export const DANES: [number, number][] = [[105, -22], [128, 14], [150, -4]];
/** the cut-open hull (studio set on the harbour bed, far from the wreck): axis along x, open toward +z */
export const CUT: V3 = [300, BED_Y + 1.6, 300];
export const CUT_R = 1.5;
export const FLOOR_Y = CUT[1] - 1.0; // the plank floor inside (world y)
/** where the three men stand inside (local x along the hull; + is the bow, under the hatch) */
export const HATCH_X = 1.5;
export const WITT_X = -0.7, THOMSEN_X = -2.1, BAUER_X = 1.25, MEN_Z = -0.45;
/** the display plinth on the quay in the last shot */
export const PLINTH: V3 = [-7, D0, -2];

// story beats (seconds on the voice clock)
export const T_DIVE = 17.57; // "dived"
export const T_TIP = 18.88; // "tipped"
export const T_SLID = 20.82; // "slid"
export const T_CRUSH = 23.9; // "crushed"
export const T_SNAP = 25.08; // "snapped"
export const T_HIT = 27.14; // "hit"
export const T_RISE0 = 42.45, T_RISE1 = 46.3; // the water rises inside until "as hard as the sea"
export const T_FLEW = 54.2; // "flew"

/** submarine exterior pose per shot: centre, yaw, pitch (stern down > 0), hatch open 0..1, visible */
export type SubPose = { p: V3; yaw: number; pitch: number; open: number; vis: boolean };
const sinkY = (t: number, t0: number, t1: number, y0: number, y1: number) => y0 + (y1 - y0) * smooth((t - t0) / (t1 - t0));
export const subAt = (id: number, t: number): SubPose => {
  const at = (p: V3, pitch = 0, open = 0): SubPose => ({ p, yaw: 0, pitch, open, vis: true });
  if (id === 1) { // the hook: it slips under, then settles on the bed
    if (t < 2.0) return at([DIVE[0], sinkY(t, -0.4, 2.0, DIVE[1], DIVE[1] - 2.2), DIVE[2]], 0.05 * smooth(t / 2));
    const y = DIVE[1] - 2.2 + (WRECK[1] - DIVE[1] + 2.2) * easeOut(clamp01((t - 2.0) / 1.75));
    return at([WRECK[0], y, WRECK[2]], 0.05 + 0.09 * smooth((t - 2.0) / 1.75));
  }
  if (id === 2 || id === 3) return at([SUBQ[0], SUBQ[1] + 0.04 * Math.sin(t * 1.3), SUBQ[2]]);
  if (id === 4) return at([DIVE[0], sinkY(t, T_DIVE - 0.35, T_DIVE + 1.6, DIVE[1], DIVE[1] - 2.6), DIVE[2]]);
  if (id === 5 || id === 6) { // the tilt and the fall, mid-water
    const y = SEA_Y - 5 - 2.2 * (t - 18.5);
    return at([DIVE[0], y, DIVE[2]], 0.34 * smooth((t - T_TIP) / 0.9));
  }
  if (id === 7) {
    const y = t < T_HIT ? WRECK[1] + 1.3 * clamp01((T_HIT - t) / 0.3) : WRECK[1];
    return at([WRECK[0], y, WRECK[2]], 0.34 - 0.2 * smooth((t - T_HIT) / 0.5));
  }
  if (id === 10 || id === 12 || id === 15) return at(WRECK, 0.14);
  if (id === 14) return at(WRECK, 0.14, 1);
  if (id === 16) return { p: [PLINTH[0], D0 + 1.9, PLINTH[2]], yaw: 0, pitch: 0, open: 0, vis: true };
  return { p: WRECK, yaw: 0, pitch: 0.14, open: 0, vis: false };
};
/** the cut-open hull: tilt (rad, stern down), ballast weight local x, the inside water level (world y), lamp dimming */
export const cutAt = (id: number, t: number) => {
  let tilt = 0, ballast = 0.4, water = FLOOR_Y - 0.3, dim = 1, open = 0;
  if (id === 5) { tilt = 0.3 * smooth((t - (T_SLID - 1.6)) / 1.0); ballast = 0.4 - 3.1 * smooth((t - T_SLID + 0.1) / 0.8); }
  else if (id >= 6) { tilt = id === 6 ? 0.3 : 0.12; ballast = -2.7; }
  if (id === 1) water = FLOOR_Y + 0.05 + 0.15 * smooth((t - 5.2) / 1.0);
  if (id === 7) water = FLOOR_Y + 0.05 + 0.1 * smooth((t - 29.4) / 1.2);
  if (id === 8 || id === 9) water = FLOOR_Y + 0.2 + 0.03 * (t - 31.3);
  if (id === 10) water = FLOOR_Y + 0.35;
  if (id === 11) water = FLOOR_Y + 0.35 + 0.6 * smooth((t - T_RISE0) / (T_RISE1 - T_RISE0));
  if (id === 12) { water = FLOOR_Y + 0.95 + 0.02 * (t - 47.2); dim = 0.62; }
  if (id === 13) { water = FLOOR_Y + 1.05; dim = 0.62; open = smooth((t - T_FLEW + 0.08) / 0.18); }
  return { tilt, ballast, water, dim, open };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "quay" | "under" | "inside";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 187, "under"), mk(2, 187, 330, "quay"), mk(3, 330, 456, "inside"), mk(4, 456, 556, "quay", "golden"),
  mk(5, 556, 700, "under"), mk(6, 700, 806, "under"), mk(7, 806, 940, "under"), mk(8, 940, 1035, "inside"),
  mk(9, 1035, 1107, "inside"), mk(10, 1107, 1272, "under"), mk(11, 1272, 1414, "inside"), mk(12, 1414, 1552, "inside"),
  mk(13, 1552, 1654, "inside"), mk(14, 1654, 1803, "under"), mk(15, 1803, 1881, "under"), mk(16, 1881, TOTAL, "quay", "golden"),
];
/** some shots switch place mid-shot on a hard cut: [frame, scene] (the hook opens on the quay; inserts inside / outside) */
export const SCENE_CUTS: Record<number, [number, Scene][]> = {
  1: [[0, "quay"], [60, "under"], [150, "inside"]],
  2: [[187, "quay"]],
  5: [[556, "under"], [622, "inside"]],
  6: [[700, "under"], [750, "inside"]],
  7: [[806, "under"], [879, "inside"]],
  10: [[1107, "under"], [1172, "inside"]],
  12: [[1414, "inside"], [1484, "under"]],
  14: [[1654, "under"], [1727, "quay"]],
};
export const sceneAt = (id: number, f: number): Scene => {
  const cuts = SCENE_CUTS[id];
  if (!cuts) return SHOTS[id - 1].scene;
  let s = cuts[0][1];
  for (const [f0, sc] of cuts) if (f >= f0) s = sc;
  return s;
};
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 4: 8, 5: 8, 12: 8, 15: 8, 16: 8 };
export const FLASH_AT = 187;

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

const Y = D0, SY = SEA_Y, BY = BED_Y;
/** a point inside the cut-open hull (local x, y from the axis, z) in world space, untilted */
export const cutP = (x: number, y: number, z: number): V3 => [CUT[0] + x, CUT[1] + y, CUT[2] + z];
const C = cutP;
const subY = (id: number, f: number) => subAt(id, T(f)).p[1];

// shot 1 (hook): from the quay the tower slips under; underwater it settles on the bed; inside, the sea sprays in
const S1a = (f: number) => dolly([-1.5, Y + 1.7, -7], [DIVE[0], SY + 0.6, DIVE[2]], pushK(f, 0, 0.0028, 0.006, 30), { fov: 34 });
const S1b = (f: number) => dolly([37, BY + 4.2, 19], [WRECK[0], (subY(1, f) + BY + 3) / 2, WRECK[2]], pushK(f, 60, 0.0025), { fov: 46, roll: 0.03 });
const S1c = (f: number) => dolly(C(0.2, 0.4, 7.6), C(-0.3, 0.1, -0.5), pushK(f, 150, 0.003, 0.006, 30), { fov: 40, roll: -0.035 });
// shot 2: Bauer on the quay beside his iron boat; then out to sea: the Danish blockade
const S2a = (f: number) => dolly([-5.6, Y + 1.6, 10.5], [BAUER_Q[0] + 2.2, Y + 1.2, BAUER_Q[2] - 1.2], pushK(f, 187, 0.0024), { fov: 44 });
const S2b = (f: number) => dolly([-3, Y + 2.6, -2], [128, SY + 5, -4], pushK(f, 268, 0.0018), { fov: 30, roll: 0.03 });
// shot 3: the cut-open hull: the men in the treadwheels; glide in on Witt and Thomsen
const S3a = (f: number) => dolly(C(-0.2, 0.6, 8.6), C(-0.4, 0.15, -0.5), pushK(f, 330, 0.0022), { fov: 42 });
const S3b = (f: number) => dolly(C(-1.4, 0.3, 5.6), C(-1.4, 0.15, -0.5), pushK(f, 392, 0.0025), { fov: 40, roll: 0.03 });
// shot 4 (golden): the town watches from the quay; the boat dives
const S4a = (f: number) => dolly([-9, Y + 3.4, -9], [5.6, SY + 1.6, -2.4], pushK(f, 456, 0.002), { fov: 40 });
// shot 5: mid-water the stern tips down; inside the ballast weight slides back
const S5a = (f: number) => { const y = subY(5, f); return dolly([DIVE[0] + 8, y + 2.5, DIVE[2] + 11], [DIVE[0], y + 0.2, DIVE[2]], pushK(f, 556, 0.0025), { fov: 46, roll: -0.03 }); };
const S5b = (f: number) => dolly(C(-0.9, 0.5, 8.4), C(-0.9, 0, -0.5), pushK(f, 622, 0.0025, 0.005, 30), { fov: 42, roll: 0.07 });
// shot 6: close on the hull as the sea crushes it; inside, the drive wheel snaps
const S6a = (f: number) => { const y = subY(6, f); return dolly([DIVE[0] + 1.8, y + 0.8, DIVE[2] + 5.4], [DIVE[0] - 0.6, y + 0.1, DIVE[2] + 0.9], pushK(f, 700, 0.003, 0.006, 30), { fov: 42, roll: 0.035 }); };
const S6b = (f: number) => dolly(C(WITT_X, 0.1, 4.4), C(WITT_X, -0.05, -0.5), pushK(f, 750, 0.003, 0.006, 30), { fov: 40, roll: -0.035 });
// shot 7: it hits the bed; the camera rises sixteen metres toward the light; inside, water sprays through the seams
const S7a = (f: number) => dolly([WRECK[0] + 9, BY + 1.6, WRECK[2] + 12], [WRECK[0], BY + 1.2, WRECK[2]], pushK(f, 806, 0.0022), { fov: 46 });
const S7b = (f: number) => dolly([WRECK[0] + 12, BY + 7, WRECK[2] + 16], [WRECK[0] - 2, BY + 13, WRECK[2] - 2], pushK(f, 836, 0.0018), { fov: 52, roll: -0.03 });
const S7c = (f: number) => dolly(C(-0.6, 0.3, 6.8), C(-0.6, -0.1, -0.5), pushK(f, 879, 0.0028), { fov: 42, roll: 0.035 });
// shot 8: pumping and plugging; Bauer heaves at the hatch
const S8a = (f: number) => dolly(C(-1.8, 0.5, 7.8), C(-1.8, 0.15, -0.5), pushK(f, 940, 0.0022), { fov: 44 });
const S8b = (f: number) => dolly(C(BAUER_X, 0.6, 4.6), C(BAUER_X, 0.5, -0.5), pushK(f, 1006, 0.003, 0.006, 30), { fov: 40, roll: 0.035 });
// shot 9: Bauer: stop
const S9a = (f: number) => dolly(C(BAUER_X - 0.6, 0.2, 4.0), C(BAUER_X - 0.4, 0.2, -0.5), pushK(f, 1035, 0.003, 0.006, 30), { fov: 40, roll: -0.035 });
// shot 10: the pivot: the sea presses the hatch shut; Bauer thinks of a freezer door
const S10a = (f: number) => dolly([WRECK[0] + 5.6, BY + 4.6, WRECK[2] + 5.8], [WRECK[0] + 1.2, BY + 2.6, WRECK[2]], pushK(f, 1107, 0.0025, 0.005, 30), { fov: 42 });
const S10b = (f: number) => dolly(C(BAUER_X - 0.3, 0.5, 5.2), C(BAUER_X - 0.5, 0.65, -0.5), pushK(f, 1172, 0.0028), { fov: 42, roll: 0.03 });
// shot 11: the water rises, the trapped air squeezes and pushes back
const S11a = (f: number) => dolly(C(0.3, 0.6, 8.4), C(0.3, 0.2, -0.5), pushK(f, 1272, 0.0022), { fov: 42 });
const S11b = (f: number) => dolly(C(0.9, 0.8, 6.2), C(0.9, 0.45, -0.5), pushK(f, 1352, 0.0028, 0.006, 30), { fov: 42, roll: -0.03 });
// shot 12: hours in the dark; outside, grappling hooks scrape the hull
const S12a = (f: number) => dolly(C(1.3, 0.8, 4.8), C(1.3, 0.6, -0.5), pushK(f, 1414, 0.0022), { fov: 40, roll: 0.03 });
const S12b = (f: number) => dolly([WRECK[0] + 4.5, BY + 3.4, WRECK[2] + 7.2], [WRECK[0], BY + 2.6, WRECK[2]], pushK(f, 1484, 0.0025), { fov: 44 });
// shot 13: the strongest man under the hatch: it flies open
const S13a = (f: number) => dolly(C(HATCH_X - 0.2, 0.9, 5.2), C(HATCH_X, 1.1, -0.5), pushK(f, 1552, 0.0025, 0.006, 30), { fov: 42, roll: -0.03 });
// shot 14: the air bursts out and carries them up; at the surface the boats pull them in
const S14a = (f: number) => dolly([WRECK[0] + 7, BY + 2.5 + 7 * glide((f - 1654) / 70), WRECK[2] + 11], [WRECK[0] + 1.5, BY + 4 + 10 * glide((f - 1654) / 70), WRECK[2]], pushK(f, 1654, 0.002), { fov: 48 });
const S14b = (f: number) => dolly([DIVE[0] - 9, SY + 2.2, DIVE[2] + 9], [DIVE[0], SY + 0.4, DIVE[2]], pushK(f, 1727, 0.0025, 0.005, 30), { fov: 42, roll: 0.03 });
// shot 15: the boat alone on the bed for thirty years
const S15a = (f: number) => dolly([WRECK[0] - 8, BY + 3.2, WRECK[2] + 11], [WRECK[0], BY + 1.4, WRECK[2]], pushK(f, 1803, 0.0022), { fov: 46, roll: -0.03 });
// shot 16 (golden): today: the boat on show, the oldest submarine in the world; the camera rises
const S16a = (f: number) => dolly([PLINTH[0] + 11, Y + 2.4, PLINTH[2] + 12.5], [PLINTH[0], Y + 1.9, PLINTH[2]], pushK(f, 1881, 0.0022), { fov: 44 });
const S16b = (f: number) => dolly([PLINTH[0] + 7.6, Y + 1.8, PLINTH[2] + 9.2], [PLINTH[0] + 0.2, Y + 2.0, PLINTH[2]], pushK(f, 1901, 0.0025, 0.006, 30), { fov: 42, roll: 0.035 });
const S16c = (f: number): Shot => {
  const a = S16b(1975), s = glide((f - 1975) / 65);
  return { pos: [a.pos[0] + 6 * s, a.pos[1] + 7 * s, a.pos[2] + 8 * s], look: [a.look[0] - 3 * s, a.look[1] + 0.5 * s, a.look[2]], fov: 42 + 6 * s, roll: (a.roll ?? 0) * (1 - s) };
};

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 60, cut: true, s: S1b }, { f: 150, cut: true, s: S1c }],
  2: [{ f: 187, s: S2a }, { f: 268, cut: true, s: S2b }],
  3: [{ f: 330, s: S3a }, { f: 392, dur: 30, s: S3b }],
  4: [{ f: 456, s: S4a }],
  5: [{ f: 556, s: S5a }, { f: 622, cut: true, s: S5b }],
  6: [{ f: 700, s: S6a }, { f: 750, cut: true, s: S6b }],
  7: [{ f: 806, s: S7a }, { f: 836, dur: 36, s: S7b }, { f: 879, cut: true, s: S7c }],
  8: [{ f: 940, s: S8a }, { f: 1006, cut: true, s: S8b }],
  9: [{ f: 1035, s: S9a }],
  10: [{ f: 1107, s: S10a }, { f: 1172, cut: true, s: S10b }],
  11: [{ f: 1272, s: S11a }, { f: 1352, dur: 26, s: S11b }],
  12: [{ f: 1414, s: S12a }, { f: 1484, cut: true, s: S12b }],
  13: [{ f: 1552, s: S13a }],
  14: [{ f: 1654, s: S14a }, { f: 1727, cut: true, s: S14b }],
  15: [{ f: 1803, s: S15a }],
  16: [{ f: 1881, s: S16a }, { f: 1901, cut: true, s: S16b }, { f: 1975, dur: 65, s: S16c }],
};

// impact kicks: [seconds, strength]: the tip, the crush, the snap, the landing, the hatch
const KICKS: [number, number][] = [[T_TIP, 0.6], [T_CRUSH, 1], [T_SNAP, 0.8], [T_HIT, 1], [T_FLEW, 1]];
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
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const man = (x: number, dy = 0.75) => (): V3 => C(x, FLOOR_Y - CUT[1] + dy + 0.9, MEN_Z);
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 150, cInf: 12, focus: man(-0.3) },
  { f: 187, cInf: 10, focus: () => [BAUER_Q[0], Y + 1.6, BAUER_Q[2]] },
  { f: 268, cInf: 0 },
  { f: 330, cInf: 0 },
  { f: 392, dur: 30, cInf: 11, focus: man(-1.4) },
  { f: 456, cInf: 0 },
  { f: 622, cInf: 0 },
  { f: 700, cInf: 12, focus: (f) => [DIVE[0] - 0.6, subY(6, f) + 0.1, DIVE[2] + 0.9] },
  { f: 750, cInf: 13, focus: man(WITT_X) },
  { f: 806, cInf: 0 },
  { f: 879, cInf: 10, focus: man(-0.6) },
  { f: 940, cInf: 0 },
  { f: 1006, cInf: 12, focus: man(BAUER_X) },
  { f: 1035, cInf: 13, focus: man(BAUER_X) },
  { f: 1107, cInf: 10, focus: () => [WRECK[0] + 1.2, BY + 2.6, WRECK[2]] },
  { f: 1172, cInf: 12, focus: man(BAUER_X) },
  { f: 1272, cInf: 0 },
  { f: 1414, cInf: 12, focus: man(1.3) },
  { f: 1484, cInf: 7, focus: () => [WRECK[0], BY + 2.6, WRECK[2]] },
  { f: 1552, cInf: 13, focus: man(HATCH_X) },
  { f: 1654, cInf: 0 },
  { f: 1727, cInf: 10, focus: () => [DIVE[0], SY + 0.6, DIVE[2]] },
  { f: 1803, cInf: 0 },
  { f: 1901, cInf: 11, focus: () => [PLINTH[0] + 0.4, Y + 2, PLINTH[2]] },
  { f: 1975, dur: 50, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

/** near framing objects: none (the quay shots frame with the crowd) */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
