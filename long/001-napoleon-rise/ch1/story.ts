// Chapter 1 "The Boy Who Crowned Himself": timeline, sets, cameras and lens. Everything is keyed to words.json
// (frame = word start x 30, reactions 0-3 frames early). Camera grammar as the sample chapter: hard cuts on big
// reframes, smootherstep glides of 18-40 f, every hold creeps (pushK), 4-5 deg rolls on emphasis beats.
import { clamp01, smooth, easeOut } from "../../../src/engine/math";
export const FPS = 30;
export const TOTAL = 3093;
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- sets (far apart, one visible per shot) ----------------
/** Notre-Dame outside (west front at z = 0, parvis toward +z), inside (west door at z = 0, altar toward -z) */
export const EXT: V3 = [3000, 0, 0];
export const INT: V3 = [-3000, 0, 0];
/** the military school courtyard (flash-forward), the Buonaparte home (one room) */
export const SCH: V3 = [-6000, 0, 0];
export const HOME: V3 = [6000, 0, 0];
/** Corsica at the origin: sea y = 0, land / quay top G, straight quay along z = 0 (x -220..220), town toward +z */
export const G = 1.5;
export type SetName = "ext" | "int" | "school" | "home" | "corsica";
export const at = (o: V3, x: number, y: number, z: number): V3 => [o[0] + x, o[1] + y, o[2] + z];

// Corsica landmarks
export const PALACE_DOOR: V3 = [60, G, 36.6];      // the governor's door (portico front)
export const CASA: V3 = [-60, G, 26];              // Casa Buonaparte front, row 2
export const TOWER: V3 = [-262, 8, -28];           // Genoese tower base on the headland rock
export const FIELD: V3 = [238, G, 100];            // the standoff field (between the two lines)

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 96, light: "day", set: "ext", sunAz: 120, sunEl: 40 },
  { id: 2, a: 96, b: 282, light: "day", set: "int", sunAz: 110 },
  { id: 3, a: 282, b: 496, light: "day", set: "int", sunAz: 110 },
  { id: 4, a: 496, b: 621, light: "day", set: "int", sunAz: 110 },
  { id: 5, a: 621, b: 779, light: "day", set: "school" },
  { id: 6, a: 779, b: 888, light: "day", set: "corsica", sunAz: 120 },
  { id: 7, a: 888, b: 972, light: "day", set: "corsica", sunAz: 125 },
  { id: 8, a: 972, b: 1099, light: "day", set: "int", sunAz: 110 },
  { id: 9, a: 1099, b: 1195, light: "day", set: "corsica", sunAz: 120 },
  { id: 10, a: 1195, b: 1299, light: "day", set: "corsica" },
  { id: 11, a: 1299, b: 1422, light: "day", set: "corsica" },
  { id: 12, a: 1422, b: 1553, light: "day", set: "corsica", sunAz: 125 },
  { id: 13, a: 1553, b: 1652, light: "day", set: "corsica" },
  { id: 14, a: 1652, b: 1793, light: "day", set: "home", sunAz: 120 },
  { id: 15, a: 1793, b: 2097, light: "day", set: "home", sunAz: 120 },
  { id: 16, a: 2097, b: 2225, light: "day", set: "corsica", sunAz: 125 },
  { id: 17, a: 2225, b: 2577, light: "day", set: "corsica", sunAz: 110 },
  { id: 18, a: 2577, b: 2649, light: "day", set: "home", sunAz: 120 },
  { id: 19, a: 2649, b: 2810, light: "golden", set: "corsica", sunAz: 20, sunEl: 9 },
  { id: 20, a: 2810, b: 2963, light: "golden", set: "corsica", sunAz: -25, sunEl: 8 },
  { id: 21, a: 2963, b: TOTAL, light: "golden", set: "corsica", sunAz: 145, sunEl: 10 },
];
/** crossfades at the time jumps (flash-forward to the cadet, back to Corsica, a few months later, the departure) */
export const XFADE: Record<number, number> = { 5: 8, 6: 8, 9: 8, 13: 8, 19: 10 };
/** a 4-frame white flash the moment the crown is on ("own head") */
export const FLASH_AT = 467;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story beats (frames) ----------------
/** crown lift: k 0 (chest) until 414, quickly through the face zone (0.2-0.6) by 420, up to 1 by 446; crown on at the 467 cut */
export const CROWN_ON = 467;
export const crownK = (f: number) => (f < 414 ? 0 : f < 420 ? 0.62 * ((f - 414) / 6) : f < 446 ? 0.62 + 0.38 * smooth((f - 420) / 26) : 1);
/** the governor's door: opens over 2352-2374 */
export const doorOpen = (f: number) => easeOut(clamp01((f - 2352) / 22));
/** the departing ship (shots 19-21): moored broadside at the quay, then heading out (-z) */
export const SHIP_L = 26;
export const shipPose = (id: number, f: number): { x: number; z: number; yaw: number; sails: boolean } => {
  if (id === 19) return { x: -20, z: -5.2, yaw: 0, sails: false };
  const t = (f - 2810) / FPS;
  return { x: -40, z: -70 - 7.5 * t, yaw: Math.PI / 2, sails: true };
};
/** the French royal ship arriving (shot 11), bow +x */
export const arrivePose = (f: number) => ({ x: -150 + 5.5 * ((f - 1299) / FPS), z: -62, yaw: 0.12 });

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 30, roll: 0, ...c });
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
/** push-in factor since f0 (rate per frame; punch raises it for the first n frames with 8 f soft edges) */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
/** a sideways truck: pos and look slide together along (dx, dz) by u metres per frame since f0 */
const truck = (s: Shot, f: number, f0: number, dx: number, dz: number): Shot => {
  const u = f - f0;
  return { ...s, pos: [s.pos[0] + dx * u, s.pos[1], s.pos[2] + dz * u], look: [s.look[0] + dx * u, s.look[1], s.look[2] + dz * u] };
};
const I = (x: number, y: number, z: number) => at(INT, x, y, z);
const E = (x: number, y: number, z: number) => at(EXT, x, y, z);
const S = (x: number, y: number, z: number) => at(SCH, x, y, z);
const H = (x: number, y: number, z: number) => at(HOME, x, y, z);
const P = 0.9; // choir platform

// the boat the boy leaves on: a point in the ship's local frame (bow +x) -> world
export const shipPt = (id: number, f: number, lx: number, ly: number, lz: number): V3 => {
  const s = shipPose(id, f), c = Math.cos(s.yaw), n = Math.sin(s.yaw);
  return [s.x + lx * c + lz * n, ly, s.z - lx * n + lz * c];
};
export const DECK = -0.8 + 0.085 * SHIP_L; // deck height (ship origin sunk 0.8 m)

const CAMS: Record<number, Key[]> = {
  // 1: Notre-Dame from the parvis, cold grey day, slow push up the front (title card on top)
  1: [{ f: 0, s: (f) => dolly(E(10, 1.9, 112), E(0, 31, 0), pushK(f, 0, 0.0016), { fov: 36 }) }],
  // 2: inside, from the choir looking west over the guests; cut to the Pope on "the Pope"
  2: [
    { f: 92, s: (f) => dolly(I(3.2, 4.4, -43.5), I(-0.5, 4.2, -2), pushK(f, 92, 0.0022), { fov: 40 }) },
    { f: 198, cut: true, s: (f) => dolly(I(-2.4, 2.3, -39.4), I(-5.3, 2.1, -44.8), pushK(f, 198, 0.0025), { fov: 32 }) },
  ],
  // 3: the coronation: wide 3/4 over the guests -> MS of the man at the altar -> low MS for the lift -> CU crowned (punch)
  3: [
    { f: 282, s: (f) => dolly(I(4.6, 4.6, -27), I(-0.5, 2.0, -45), pushK(f, 282, 0.0025), { fov: 34 }) },
    { f: 328, cut: true, s: (f) => dolly(I(1.6, 2.35, -40.4), I(0, 2.3 + P - 0.9, -45.2), pushK(f, 328, 0.003), { fov: 30 }) },
    { f: 412, cut: true, s: (f) => dolly(I(0.5, 1.7, -41.0), I(0, 2.7, -45.2), pushK(f, 412, 0.002), { fov: 34 }) },
    { f: 467, cut: true, s: (f) => dolly(I(0.25, 2.4, -42.2), I(0, 2.42, -45.2), pushK(f, 467, 0.002, 0.009, 30), { fov: 30, roll: -0.04 }) },
  ],
  // 4: "His name is Napoleon Bonaparte": heroic low MS with the Pope and the apse windows; CU on "thirty-five"
  4: [
    { f: 496, s: (f) => dolly(I(-2.6, 1.75, -38.6), I(-0.6, 2.75, -45.4), pushK(f, 496, 0.0025), { fov: 34 }) },
    { f: 560, cut: true, s: (f) => dolly(I(-0.6, 2.55, -42.2), I(0, 2.62, -45.2), pushK(f, 560, 0.0025), { fov: 30, roll: 0.035 }) },
    { f: 590, dur: 26, s: (f) => dolly(I(-0.6, 2.55, -42.2), I(0, 2.62, -45.2), pushK(f, 560, 0.0025), { fov: 30, roll: -0.03 }) },
  ],
  // 5: twenty years earlier: the cadet laughed at; closer on "laughed"
  5: [
    { f: 617, s: (f) => dolly(S(0.9, 1.75, 7.2), S(0, 1.25, -0.4), pushK(f, 617, 0.0022), { fov: 32 }) },
    { f: 674, dur: 30, s: (f) => dolly(S(0.4, 1.6, 5.4), S(0, 1.22, -0.4), pushK(f, 674, 0.0022), { fov: 32 }) },
    { f: 739, cut: true, s: (f) => dolly(S(0.35, 1.45, 2.9), S(0, 1.32, 0), pushK(f, 739, 0.0025), { fov: 30, roll: 0.04 }) },
  ],
  // 6: the small island from far out at sea, gliding in
  6: [{ f: 775, s: (f) => { const u = glide((f - 775) / 113); return { pos: [-60 + 30 * u, 260 - 70 * u, -1150 + 260 * u], look: [-10, 45 - 5 * u, 260], fov: 30 }; } }],
  // 7: "a sleepy harbour town": low over the water among the boats, trucking right
  7: [{ f: 888, s: (f) => truck({ pos: [-36, 3.4, -38], look: [-8, 6.5, 30], fov: 34 }, f, 888, 0.07, 0) }],
  // 8: "to the throne": the imperial throne, low, pushing in
  8: [
    { f: 972, s: (f) => dolly(I(2.2, 1.55, -40.0), I(5.2, 2.6, -46.2), pushK(f, 972, 0.0025), { fov: 32 }) },
    { f: 1030, dur: 36, s: (f) => dolly(I(3.4, 1.75, -40.6), I(5.3, 2.62, -46.2), pushK(f, 1030, 0.0022), { fov: 32, roll: -0.03 }) },
  ],
  // 9: Corsica: the harbour town from the bay, mountains behind
  9: [{ f: 1095, s: (f) => truck(dolly([80, 30, -165], [-5, 16, 70], pushK(f, 1095, 0.0012), { fov: 36 }), f, 1095, -0.05, 0) }],
  // 10: the Genoese tower on its headland
  10: [{ f: 1195, s: (f) => dolly([-222, 4.5, -72], [-262, 15.5, -28], pushK(f, 1195, 0.0025), { fov: 36 }) }],
  // 11: a French royal ship sails in, seen from the quay; push on "France"
  11: [
    { f: 1299, s: (f) => dolly([-82, G + 2.2, -4], [-138, 9, -62], pushK(f, 1299, 0.0015), { fov: 32 }) },
    { f: 1385, dur: 26, s: (f) => dolly([-92, G + 2.6, -16], [-130, 11, -62], pushK(f, 1385, 0.002), { fov: 30 }) },
  ],
  // 12: the standoff: Corsicans (left) and the white-coated royal troops (right); cut to the Corsicans on "and they lost"
  12: [
    { f: 1422, s: (f) => dolly([238, G + 2.4, 77], [238, G + 1.5, 100], pushK(f, 1422, 0.0015), { fov: 34 }) },
    { f: 1510, cut: true, s: (f) => dolly([233.6, G + 1.75, 92.5], [230, G + 1.35, 100], pushK(f, 1510, 0.0025), { fov: 30, roll: -0.03 }) },
  ],
  // 13: a few months later: the street in front of the Buonaparte house
  13: [{ f: 1549, s: (f) => dolly([-47, G + 1.6, 19.6], [-60, G + 4.4, 26], pushK(f, 1549, 0.0022), { fov: 40 }) }],
  // 14: the birth: Letizia with the baby, Carlo proud; closer on "His parents named him"
  14: [
    { f: 1652, s: (f) => dolly(H(0.4, 1.6, 3.4), H(0.05, 1.3, -1.1), pushK(f, 1652, 0.0025), { fov: 32 }) },
    { f: 1733, cut: true, s: (f) => dolly(H(-0.2, 1.42, 1.15), H(-0.4, 1.3, -1.2), pushK(f, 1733, 0.003), { fov: 30, roll: 0.03 }) },
  ],
  // 15: Carlo the lawyer -> the empty purse -> Letizia's strict house (eight children) -> "Here is the twist"
  15: [
    { f: 1793, s: (f) => dolly(H(0.6, 1.6, 2.9), H(2.0, 1.3, -1.3), pushK(f, 1793, 0.0025), { fov: 32 }) },
    { f: 1906, cut: true, s: (f) => dolly(H(1.55, 1.5, 0.9), H(2.15, 1.38, -1.3), pushK(f, 1906, 0.003), { fov: 30, roll: -0.04 }) },
    { f: 1943, cut: true, s: (f) => dolly(H(-0.6, 1.55, 4.6), H(-0.3, 1.05, -0.6), pushK(f, 1943, 0.002), { fov: 40 }) },
    { f: 2000, dur: 34, s: (f) => dolly(H(-1.6, 1.25, 3.2), H(-1.2, 0.95, -0.6), pushK(f, 2000, 0.002), { fov: 38 }) },
    { f: 2055, cut: true, s: (f) => dolly(H(1.75, 1.6, 0.75), H(2.15, 1.5, -1.3), pushK(f, 2055, 0.003, 0.007, 25), { fov: 28, roll: 0.05 }) },
  ],
  // 16: Carlo with the Corsican fighters; cut to his grin on "he made a smart choice"
  16: [
    { f: 2097, s: (f) => dolly([236, G + 2.0, 85], [231.5, G + 1.4, 100], pushK(f, 2097, 0.002), { fov: 32 }) },
    { f: 2181, cut: true, s: (f) => dolly([231.4, G + 1.72, 96.8], [230.6, G + 1.62, 100], pushK(f, 2181, 0.003), { fov: 30, roll: 0.04 }) },
  ],
  // 17: the governor's square: the handshake -> the door opens -> the letter
  17: [
    { f: 2225, s: (f) => dolly([60.2, G + 1.75, 24.5], [60, G + 1.6, 33.5], pushK(f, 2225, 0.0022), { fov: 32 }) },
    { f: 2327, cut: true, s: (f) => dolly([60, G + 0.9, 23.5], [60, G + 2.7, 36.6], pushK(f, 2327, 0.0025, 0.005, 40), { fov: 36 }) },
    { f: 2420, cut: true, s: (f) => dolly([59.6, G + 1.6, 27.4], [60, G + 1.42, 31.6], pushK(f, 2420, 0.0022), { fov: 30 }) },
    { f: 2520, dur: 30, s: (f) => dolly([59.2, G + 1.6, 28.4], [59.3, G + 1.42, 31.6], pushK(f, 2520, 0.0022), { fov: 30, roll: -0.03 }) },
  ],
  // 18: home: Carlo shows the boy the letter
  18: [{ f: 2577, s: (f) => dolly(H(0.5, 1.3, 2.6), H(0.25, 1.12, -1.0), pushK(f, 2577, 0.0028, 0.006, 30), { fov: 32 }) }],
  // 19: golden: the family on the quay, the ship behind; cut to the boy waving from the deck on "said goodbye"
  19: [
    { f: 2644, s: (f) => dolly([-7, G + 1.65, 12.5], [-19, G + 2.0, -3], pushK(f, 2644, 0.0018), { fov: 34 }) },
    { f: 2748, cut: true, s: (f) => dolly([-16.6, DECK + 1.55, -11.4], [-18.6, DECK + 1.25, -4.8], pushK(f, 2748, 0.0022), { fov: 32 }) },
  ],
  // 20: the ship sails out of the bay; cut aboard on "to a school full of rich kids"
  20: [
    { f: 2810, s: (f) => dolly([10, 16, -20], shipPt(20, f, 0, 7, 0), pushK(f, 2810, 0.0012), { fov: 34 }) },
    { f: 2898, cut: true, s: (f) => ({ pos: shipPt(20, f, -4.2, DECK + 2.4, 6.2), look: shipPt(20, f, -9.6, DECK + 1.05, 0), fov: 34, roll: 0.03 }) },
  ],
  // 21: the island shrinking behind the boy; crane up and back over the golden sea
  21: [
    { f: 2963, s: (f) => ({ pos: shipPt(21, f, -4.2, DECK + 2.2, 5.6), look: shipPt(21, f, -9.6, DECK + 1.1, 0), fov: 34 }) },
    {
      f: 2990, dur: 103, s: (f) => {
        const lk = shipPt(21, f, -9.6, DECK + 1.1, 0);
        return { pos: shipPt(21, f, 20, DECK + 26, 22), look: [lk[0], lk[1] + 2, lk[2] + 60], fov: 32, roll: 0 };
      },
    },
  ],
};

// impact kicks: the volley on "fought back"
const KICKS: [number, number][] = [[1494 / FPS, 0.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const KICK_FRAMES = KICKS.map(([t]) => Math.round(t * FPS));
/** every in-shot cut frame (for shots.json) */
export const CUT_FRAMES = Object.values(CAMS).flatMap((ks) => ks.filter((k) => k.cut).map((k) => k.f));
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
/** thin-lens DOF per beat: cInf px at 1080 for infinity (0 = sharp); focus = world point (else the look point) */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },                                         // Notre-Dame establishing
  { f: 96, cInf: 6, focus: () => I(0, 1.6, -30) },          // nave wide: front rows sharp, west end soft
  { f: 198, cInf: 12, focus: () => I(-5.3, 2.3, -45.0) },   // the Pope MS
  { f: 282, cInf: 5, focus: () => I(0, 2.4, -45) },         // 3/4 over the guests
  { f: 328, cInf: 11, focus: () => I(0, 2.5, -45.2) },      // the man at the altar
  { f: 412, cInf: 12, focus: () => I(0, 2.6, -45.2) },      // the lift
  { f: 467, cInf: 14, focus: () => I(0, 2.55, -45.2) },     // crowned CU
  { f: 496, cInf: 10, focus: () => I(0, 2.5, -45.2) },
  { f: 560, cInf: 14, focus: () => I(0, 2.55, -45.2) },
  { f: 621, cInf: 10, focus: () => S(0, 1.35, 0) },         // cadet MS
  { f: 739, cInf: 13, focus: () => S(0, 1.35, 0) },         // cadet CU
  { f: 779, cInf: 0 },                                       // aerial, harbour wide
  { f: 972, cInf: 10, focus: () => I(5.4, 2.5, -45.8) },    // throne
  { f: 1099, cInf: 0 },                                      // Corsica wide, tower, ship, standoff
  { f: 1510, cInf: 12, focus: () => [230, G + 1.5, 100] },  // the Corsicans lose
  { f: 1553, cInf: 0 },                                      // street
  { f: 1652, cInf: 9, focus: () => H(0, 1.45, -1.1) },      // birth MS
  { f: 1733, cInf: 13, focus: () => H(-0.45, 1.3, -1.2) },  // baby CU
  { f: 1793, cInf: 10, focus: () => H(2.15, 1.45, -1.3) },  // Carlo
  { f: 1906, cInf: 13, focus: () => H(2.15, 1.4, -1.3) },   // the purse
  { f: 1943, cInf: 5, focus: () => H(-0.5, 1.0, -0.6) },    // the eight children
  { f: 2055, cInf: 14, focus: () => H(2.15, 1.5, -1.3) },   // the twist
  { f: 2097, cInf: 6, focus: () => [231.5, G + 1.5, 100] }, // Carlo armed
  { f: 2181, cInf: 13, focus: () => [230.6, G + 1.6, 100] },
  { f: 2225, cInf: 8, focus: () => [60, G + 1.55, 31] },    // the handshake
  { f: 2327, cInf: 0 },                                      // the door
  { f: 2420, cInf: 10, focus: () => [60, G + 1.5, 31] },    // the letter
  { f: 2577, cInf: 11, focus: () => H(0.2, 1.15, -1.0) },   // the boy and the letter
  { f: 2649, cInf: 5, focus: () => [-16, G + 1.4, 2.5] },   // golden quay
  { f: 2748, cInf: 11, focus: () => [-18.6, DECK + 1.2, -4.5] }, // the boy waving
  { f: 2810, cInf: 0 },                                      // the ship sails out
  { f: 2898, cInf: 10, focus: (f) => shipPt(20, f, -9.6, DECK + 1.1, 0) },
  { f: 2963, cInf: 10, focus: (f) => shipPt(21, f, -9.6, DECK + 1.1, 0) },
  { f: 2990, dur: 60, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { T };
