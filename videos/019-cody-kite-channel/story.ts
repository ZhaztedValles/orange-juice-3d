// Timeline of "In 1903 a Cowboy Crossed the English Channel in a Boat Pulled by a Kite": shots timed to words.json.
// One world with several places far apart (beyond the fog of each other): Dover beach under its chalk cliffs (x ~ 0),
// the Calais quay (x ~ 700), the open Channel (x ~ 300-420, z ~ 300-420) with the Goodwin Sands, the navy ship, the
// mail steamer, and inland fields with a river and a flying field (x ~ -600). Sea level is y = 0; the shingle and the
// fields are at D0. Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on
// big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2025;
export const D0 = 1.2; // shingle / field level (m); the sea is at y = 0
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the beach: flat shingle at D0 for z in [-40, -6], sloping into the sea down to z = 10 (y -1) */
export const SHORE_Z0 = -6, SHORE_Z1 = 10;
export const shoreY = (z: number) => (z <= SHORE_Z0 ? D0 : D0 - (2.2 * (z - SHORE_Z0)) / (SHORE_Z1 - SHORE_Z0));
/** Calais quay: top at QUAY_Y, its sea face at z = QUAY_Z, x around CALAIS */
export const CALAIS = 700, QUAY_Z = 4, QUAY_Y = D0 + 0.4;
/** the Goodwin Sands: a flat sand bank */
export const SANDS: V3 = [432, 0, 326];
/** inland: the river (along x, z in [RIVER_Z - 7, RIVER_Z + 7]) and the flying field */
export const RIVER_X = -600, RIVER_Z = -300;
export const FIELD: V3 = [-600, D0, -432];
/** the navy ship and the mail steamer (their decks) */
export const NAVY_DECK = 3.0, STEAM_DECK = 2.6;

// story beats (seconds on the voice clock)
export const T_PULLED = 5.78, T_KITE = 6.28;
export const T_CODY = 8.20, T_HAT = 10.36, T_MOUST = 11.75, T_KITES = 12.39, T_LIFT = 13.05;
export const T_NAVY = 14.15, T_TESTED = 14.57, T_FAME = 16.81;
export const T_FIRST = 17.65, T_REPORTER = 19.27, T_TIED = 20.23, T_FLIPPED = 22.39;
export const T_TOOK = 23.85, T_LOOK = 24.30, T_WENT = 24.69, T_LIFEBELT = 25.73;
export const T_WIND = 27.31, T_TURNED = 27.62, T_WRONG = 28.00;
export const T_FIFTH = 29.34, T_CALAIS = 31.25, T_STEAMER = 31.82;
export const T_SEVEN = 33.66, T_PUSHED = 34.52, T_CLIMBED = 35.90, T_DARK = 36.52;
export const T_DIED = 38.48, T_TIDE = 39.02, T_DRAGGED = 39.38, T_GOODWIN = 40.15;
export const T_YOUSEE = 41.35, T_SAIL = 42.62, T_STRING = 43.79, T_HIGH = 44.73, T_FASTER = 45.71;
export const T_LIKE = 46.19, T_MIDDLE = 46.95, T_BANKS = 48.08;
export const T_BREEZE = 49.12, T_TOWED = 50.33;
export const T_MORNING = 52.95, T_THIRTEEN = 53.81, T_LANDED = 55.67, T_DOVER = 56.65;
export const T_FIVE = 57.55, T_FIRSTF = 59.11, T_FLIGHT = 60.48;
export const T_KITEMAN = 61.95, T_LETGO = 63.25, T_STRINGEND = 63.89;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light };
const mk = (id: number, a: number, b: number, light: Light = "day"): ShotDef => ({ id, a, b, light });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 207), mk(2, 207, 420), mk(3, 420, 525), mk(4, 525, 806), mk(5, 806, 867), mk(6, 867, 987),
  mk(7, 987, 1116, "golden"), mk(8, 1116, 1239, "golden"), mk(9, 1239, 1464, "golden"), mk(10, 1464, 1550, "golden"),
  mk(11, 1550, 1722), mk(12, 1722, 1850), mk(13, 1850, TOTAL, "golden"),
];
/** crossfades (frames) at time changes: that evening (7), the next morning (11), the last word (13) */
export const XFADE: Record<number, number> = { 7: 10, 11: 10, 13: 10 };
export const FLASH_AT = 207;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fr = (t: number) => Math.round(t * FPS);
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- the boat, the kite, the ships, the aeroplane ----------------
/** the boat per shot: floor position, heading yaw (hull along +x when yaw = 0), roll; null = not in this shot */
export type BoatPose = { p: V3; yaw: number; roll: number; onDeck?: boolean };
const OPEN1: V3 = [350, 0, 300], OPEN2: V3 = [392, 0, 326], OPEN3: V3 = [300, 0, 420];
export const BEACH_BOAT: V3 = [1.6, D0, -9.2];
const bob = (t: number, k = 1): number => k * 0.05 * Math.sin(t * 1.9);
export const shipAt = (kind: "navy" | "steam", t: number): V3 =>
  kind === "navy" ? [-200 + 2.0 * (t - 14), 0.03 * Math.sin(t * 1.2), 260] : [440 + 4.0 * (t - 29), 0.04 * Math.sin(t * 1.3), 140];
export const boatAt = (id: number, t: number): BoatPose | null => {
  if (id === 1) return { p: add(OPEN1, [1.2 * t, bob(t), 0]), yaw: 0, roll: 0.03 * Math.sin(t * 1.3) };
  if (id === 2 || id === 4 || id === 5) return { p: BEACH_BOAT, yaw: 0, roll: 0 };
  if (id === 6) { const s = shipAt("steam", t); return { p: add(s, [-7, STEAM_DECK, 0]), yaw: 0, roll: 0, onDeck: true }; }
  if (id === 7) {
    const u = Math.max(0, t - T_PUSHED + 0.1);
    return { p: [CALAIS + 1.0 + 0.25 * u, bob(t), QUAY_Z + 1.4 + 0.9 * u], yaw: -Math.PI / 2 + 0.15, roll: 0.02 * Math.sin(t * 1.5) };
  }
  if (id === 8) {
    const u = Math.max(0, t - T_TIDE);
    return { p: add(OPEN2, [0.3 * (t - 37.2) + 0.9 * u, bob(t), 0]), yaw: 0.25 * smooth(u / 2), roll: 0.04 * Math.sin(t * 1.4) };
  }
  if (id === 9) return { p: add(OPEN3, [1.0 * (t - 41.3), bob(t), 0]), yaw: 0, roll: 0.03 * Math.sin(t * 1.3) };
  if (id === 10) { const tt = t - 48.8; return { p: add(OPEN3, [8 + 1.0 * tt + 1.2 * tt * tt * 0.5, bob(t), 0]), yaw: 0, roll: 0.04 * Math.sin(t * 1.8) }; }
  if (id === 11) {
    const k = easeOut(clamp01((t - 51.67) / (T_LANDED - 51.67)));
    return { p: [0, bob(t, 1 - k), 16 - 11.5 * k], yaw: Math.PI / 2, roll: 0.03 * Math.sin(t * 1.4) * (1 - k) };
  }
  return null;
};
/** the main kite: its position and the end of its line; null = not in this shot */
export type KitePose = { p: V3; anchor: V3; tilt: number; yaw: number; sag: number };
const mast = (b: BoatPose): V3 => {
  const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
  return add(b.p, [0.6 * c, 2.3, -0.6 * s]);
};
export const kiteAt = (id: number, t: number): KitePose | null => {
  const b = boatAt(id, t);
  const sway = (k = 1): V3 => [0.4 * k * Math.sin(t * 0.9), 0.5 * k * Math.sin(t * 1.3 + 1), 0.3 * k * Math.sin(t * 0.7)];
  if (id === 1 && b) return { p: add(add(b.p, [9, 15.5, -2]), sway()), anchor: mast(b), tilt: 0.25 + 0.05 * Math.sin(t * 1.3), yaw: 0, sag: 0.6 };
  if (id === 7 && b) {
    const k = smooth((t - T_PUSHED + 0.2) / 2.6);
    return { p: add(add(b.p, lerp3([1.5, 2.6, 3.0], [5, 15, 15], k)), sway(k)), anchor: mast(b), tilt: 0.25, yaw: -Math.PI / 2, sag: 0.4 + 0.4 * k };
  }
  if (id === 8 && b) {
    const k = smooth((t - T_DIED + 0.15) / 1.8);
    return { p: add(add(b.p, lerp3([16, 15, 0], [13, 2.6, -1.5], k)), sway(1 - k)), anchor: mast(b), tilt: 0.25 + 0.9 * k, yaw: 0, sag: 0.6 + 1.6 * k };
  }
  if (id === 9 && b) return { p: add(add(b.p, [5.5, 14, 0]), sway()), anchor: mast(b), tilt: 0.25, yaw: 0, sag: 0.5 };
  if (id === 10 && b) {
    const k = smooth((t - 48.8) / 1.6);
    return { p: add(add(b.p, lerp3([8, 4, 0.5], [9, 12, 0], k)), sway(k)), anchor: mast(b), tilt: 0.25 + 0.6 * (1 - k), yaw: 0, sag: 0.5 + 0.8 * (1 - k) };
  }
  if (id === 11 && b) return { p: add(add(b.p, [-1, 15, -14]), sway()), anchor: mast(b), tilt: 0.25, yaw: Math.PI / 2, sag: 0.6 };
  if (id === 13) {
    const hand: V3 = [FIELD[0] + 0.25, D0 + 1.25, FIELD[2] - 8 + 0.1];
    const u = Math.max(0, t - T_LETGO + 0.05), base: V3 = [FIELD[0] - 7, D0 + 15, FIELD[2] - 20];
    const p = add(add(base, [-2.2 * u, 2.4 * u, -3.0 * u]), sway());
    const end = lerp3(hand, add(p, [3, -9, 4]), smooth(u / 2.5));
    return { p, anchor: u > 0 ? end : hand, tilt: 0.25, yaw: Math.PI / 2 + 0.3, sag: u > 0 ? 0.9 + 0.8 * smooth(u / 1.5) : 0.5 };
  }
  return null;
};
/** the aeroplane on the field (shot 12 flying, shot 13 parked) */
export const planeAt = (id: number, t: number): { p: V3; pitch: number; spin: number } | null => {
  if (id === 12) { const u = t - 57.4; return { p: [FIELD[0] - 24 + 8.5 * u, D0 + 3.2 + 0.25 * Math.sin(u * 2.1) + 0.12 * u, FIELD[2] - 6], pitch: 0.04, spin: t * 40 }; }
  return null;
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
/** a dolly relative to a moving point */
const rel = (o: V3, pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => dolly(add(o, pos), add(o, look), k, rest);
const bp = (id: number, f: number) => (boatAt(id, f / FPS) as BoatPose).p;
const sp = (f: number, kind: "navy" | "steam") => shipAt(kind, f / FPS);

const Y = D0;
// shot 1 (hook): the little boat on the open sea, side on; on "pulled by a kite" a glide up to the kite
export const F_PULLED = fr(T_PULLED) - 3;
const S1a = (f: number) => rel(bp(1, f), [-1.2, 1.25, 5.2], [0.4, 0.95, 0], pushK(f, 0, 0.0016, 0, 30), { fov: 44, roll: 0.03 });
const S1b = (f: number) => rel([bp(1, f)[0], 0, bp(1, f)[2]], [-1.5, 1.0, 21], [4.5, 8.2, -1], pushK(f, F_PULLED, 0.0015, 0.005, 30), { fov: 56, roll: 0.04 });
// shot 2: Dover beach, Cody by his boat (medium shot), pushes on "hat" and "moustache"; cut to the man-lifting kites
export const F_KITES = fr(T_KITES) - 3;
const CODY_B: V3 = [-1.0, Y, -8.4], REP_B: V3 = [0.6, Y, -7.6];
const S2a = (f: number) => dolly([CODY_B[0] + 0.5, Y + 1.85, CODY_B[2] + 4.0], [CODY_B[0] + 0.1, Y + 1.45, CODY_B[2]], pushK(f, 207, 0.0015, 0, 30) * pushK(f, fr(T_HAT) - 3, 0, 0.004, 25) * pushK(f, fr(T_MOUST) - 3, 0, 0.004, 25), { fov: 44, roll: -0.03 });
export const LIFT_BASE: V3 = [-6, Y, -14], LIFT_TOP: V3 = [-16, Y + 34, -40];
/** a point on the man-lifting cable (u 0 at the winch .. 1 at the top kite) and the basket hanging under it */
export const liftP = (u: number): V3 => [LIFT_BASE[0] + (LIFT_TOP[0] - LIFT_BASE[0]) * u, LIFT_BASE[1] + (LIFT_TOP[1] - LIFT_BASE[1]) * u - 1.35 * 4 * u * (1 - u), LIFT_BASE[2] + (LIFT_TOP[2] - LIFT_BASE[2]) * u];
export const basketAt = (t: number): V3 => { const q = liftP(0.42); return [q[0] + 0.15 * Math.sin(t * 1.1), q[1] - 2.0, q[2]]; };
const S2b = (f: number) => dolly([4, Y + 1.4, 4], [-9, Y + 15, -24], pushK(f, F_KITES, 0.0012, 0.004, 30), { fov: 52, roll: 0.05 });
// shot 3: the navy ship flying a Cody kite
const S3a = (f: number) => rel(sp(f, "navy"), [-12, 4.0, -24], [-15, 9.5, 0], pushK(f, 420, 0.0018), { fov: 52, roll: -0.03 });
// shot 4: the boat on the shingle with its lifelines, Cody and the reporter; cut to the reporter; glide wide as he walks off
export const F_TOOK = fr(T_TOOK) - 3, F_WENT = fr(T_WENT) - 3;
const S4a = (f: number) => dolly([0.2, Y + 2.4, 0.4], [0.3, Y + 0.9, -9.0], pushK(f, 525, 0.0013, 0, 30) * pushK(f, fr(T_TIED) - 3, 0, 0.004, 25), { fov: 48, roll: 0.03 });
const S4b = (f: number) => dolly([REP_B[0] + 0.9, Y + 1.75, REP_B[2] + 3.4], [REP_B[0], Y + 1.5, REP_B[2]], pushK(f, F_TOOK, 0.0018, 0.005, 25), { fov: 42, roll: -0.03 });
const S4c = (f: number) => dolly([3.4, Y + 2.6, -0.4], [0.4, Y + 1.6, -12.5], pushK(f, F_WENT, 0.0014), { fov: 50, roll: -0.02 });
// shot 5: the flag on the beach swings round; Cody watches
export const FLAG: V3 = [-3.2, Y, -6.4];
const S5a = (f: number) => dolly([-0.6, Y + 2.0, -1.0], [-3.4, Y + 2.9, -7.2], pushK(f, 806, 0.0018, 0, 30) * pushK(f, fr(T_TURNED) - 3, 0, 0.005, 25), { fov: 48, roll: 0.04 });
// shot 6: the mail steamer to Calais, the boat and kite on its deck
const S6a = (f: number) => rel(sp(f, "steam"), [-11, 6.0, -15], [-4.5, 4.0, 0], pushK(f, 867, 0.0016, 0, 30), { fov: 48, roll: -0.03 });
// shot 7 (golden): the Calais quay at dusk; Cody pushes off, the kite climbs (glide up with it)
export const F_CLIMBED = fr(T_CLIMBED) - 3;
const S7a = (f: number) => dolly([CALAIS - 9, 2.4, QUAY_Z + 13], [CALAIS + 1, 1.9, QUAY_Z + 1], pushK(f, 987, 0.0016, 0, 30), { fov: 48, roll: 0.03 });
const S7b = (f: number) => dolly([CALAIS - 11, 1.8, QUAY_Z + 16], [CALAIS + 3, 7.5, QUAY_Z + 9], pushK(f, F_CLIMBED, 0.0012), { fov: 54, roll: 0.04 });
// shot 8 (golden): out at sea, behind the boat: the wind dies, the kite falls, the sands ahead
const S8a = (f: number) => rel([bp(8, f)[0], 0, bp(8, f)[2]], [-8.5, 2.4, 3.2], [9, 1.6, -0.8], pushK(f, 1116, 0.0016, 0, 30) * pushK(f, fr(T_GOODWIN) - 3, 0, 0.004, 25), { fov: 50, roll: -0.03 });
// shot 9 (golden): side view, the kite high over the boat and the wind arrows; cut to the river
export const F_LIKE = fr(T_LIKE) - 3;
const S9a = (f: number) => rel([bp(9, f)[0], 0, bp(9, f)[2]], [2.5, 6.5, 19], [2.5, 7.6, 0], pushK(f, 1239, 0.0012, 0, 30) * pushK(f, fr(T_HIGH) - 3, 0, 0.004, 25), { fov: 56, roll: 0.03 });
const S9b = (f: number) => dolly([RIVER_X - 7, Y + 5.0, RIVER_Z + 11], [RIVER_X, Y, RIVER_Z], pushK(f, F_LIKE, 0.0016, 0.004, 25), { fov: 50, roll: -0.03 });
// shot 10 (golden): the breeze returns: chase behind the boat as the kite climbs
const S10a = (f: number) => rel([bp(10, f)[0], 0, bp(10, f)[2]], [-8, 2.0, -9], [2, 3.8, 0], pushK(f, 1464, 0.0018), { fov: 58, roll: 0.04 });
// shot 11 (day): the next morning at Dover: the boat runs onto the beach under the cliffs
const S11a = (f: number) => dolly([4.5, 2.2, 22], [0, 1.9, -4], pushK(f, 1550, 0.0016, 0, 30) * pushK(f, fr(T_DOVER) - 3, 0, 0.004, 25), { fov: 48, roll: -0.03 });
// shot 12 (day): the flying field: the aeroplane passes the crowd (the lens pans with it)
const S12a = (f: number) => {
  const pl = (planeAt(12, f / FPS) as { p: V3 }).p;
  return dolly([FIELD[0] - 10, Y + 2.0, FIELD[2] + 9], [pl[0] - 1, pl[1] + 0.6, pl[2]], pushK(f, 1722, 0.0012, 0, 30), { fov: 50, roll: 0.03 });
};
// shot 13 (golden): Cody on the field lets the kite go; low lens looking up
const S13a = (f: number) => dolly([FIELD[0] + 3.6, Y + 1.0, FIELD[2] + 2.5], [FIELD[0] - 2.2, Y + 5.2, FIELD[2] - 14], pushK(f, 1850, 0.0012, 0, 30), { fov: 54, roll: -0.02 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: F_PULLED, dur: 30, s: S1b }],
  2: [{ f: 207, s: S2a }, { f: F_KITES, cut: true, s: S2b }],
  3: [{ f: 420, s: S3a }],
  4: [{ f: 525, s: S4a }, { f: F_TOOK, cut: true, s: S4b }, { f: F_WENT, dur: 30, s: S4c }],
  5: [{ f: 806, s: S5a }],
  6: [{ f: 867, s: S6a }],
  7: [{ f: 987, s: S7a }, { f: F_CLIMBED, dur: 36, s: S7b }],
  8: [{ f: 1116, s: S8a }],
  9: [{ f: 1239, s: S9a }, { f: F_LIKE, cut: true, s: S9b }],
  10: [{ f: 1464, s: S10a }],
  11: [{ f: 1550, s: S11a }],
  12: [{ f: 1722, s: S12a }],
  13: [{ f: 1850, s: S13a }],
};
export const CODY_BEACH = CODY_B, REPORTER_BEACH = REP_B;

// impact kicks: [seconds, strength]: the wind dies, the boat lands
const KICKS: [number, number][] = [[T_DIED - 2 / 30, 0.35], [T_LANDED - 2 / 30, 0.4]];
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
const onBoat = (id: number, dy = 0.9) => (f: number) => add(bp(id, f), [0, dy, 0]);
export const DOF: Dof[] = [
  { f: 0, cInf: 12, focus: onBoat(1) },
  { f: F_PULLED, dur: 30, cInf: 0 },
  { f: 207, cInf: 12, focus: at([CODY_B[0], Y + 1.6, CODY_B[2]]) },
  { f: F_KITES, cInf: 0 },
  { f: 420, cInf: 0 },
  { f: 525, cInf: 10, focus: at([0.0, Y + 1.5, -8.0]) },
  { f: F_TOOK, cInf: 13, focus: at([REP_B[0], Y + 1.6, REP_B[2]]) },
  { f: F_WENT, dur: 30, cInf: 7, focus: at([0.0, Y + 1.5, -9.0]) },
  { f: 806, cInf: 10, focus: at([-4.2, Y + 1.6, -7.2]) },
  { f: 867, cInf: 0 },
  { f: 987, cInf: 7, focus: onBoat(7) },
  { f: F_CLIMBED, dur: 30, cInf: 0 },
  { f: 1116, cInf: 5, focus: onBoat(8) },
  { f: 1239, cInf: 0 },
  { f: 1464, cInf: 5, focus: onBoat(10) },
  { f: 1550, cInf: 0 },
  { f: 1722, cInf: 0 },
  { f: 1850, cInf: 5, focus: at([FIELD[0], Y + 1.6, FIELD[2] - 8]) },
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
  { a: 987, b: 1116, kit: "lantern", pos: [CALAIS - 4.6, QUAY_Y, QUAY_Z - 0.6], s: 2.4 },
  { a: 1850, b: TOTAL, kit: "grass_large", pos: [FIELD[0] + 2.4, D0, FIELD[2] + 0.6], s: 0.9 },
];
