// Chapter 6 "Emperor": timeline, sets, cameras and lens. Everything is keyed to words.json (frame = word start x 30,
// reactions 0-3 frames early). Camera grammar as chapter 1: hard cuts on big reframes, smootherstep glides of 18-40 f,
// every hold creeps (pushK), 3-5 deg rolls on emphasis beats.
import { clamp01, smooth, easeOut } from "../../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2969;
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- sets (far apart, one visible per shot) ----------------
/** rooms: Napoleon's study (night and day), the print shop, the Senate, the London cartoonist's studio */
export const STUDY: V3 = [6000, 0, 0];
export const PRESS: V3 = [6000, 0, 200];
export const SENATE: V3 = [6000, 0, 400];
export const STUDIO: V3 = [6000, 0, 600];
/** Paris street: bank, lycee, the Tuileries palace with its steps, a shop, a cafe corner, the ballot table */
export const PARIS: V3 = [-6000, 0, 0];
/** Notre-Dame outside (west front at z = 0, parvis toward +z), inside (west door at z = 0, altar toward -z) */
export const EXT: V3 = [3000, 0, 0];
export const INT: V3 = [-3000, 0, 0];
/** the military school courtyard (flash-back to the mocked cadet) */
export const SCH: V3 = [-6000, 0, 3000];
/** a green battlefield + camp (wars, Waterloo, the line-up, the campfire), the Russian snow */
export const FIELD: V3 = [3000, 0, 3000];
export const SNOW: V3 = [3000, 0, -3000];
/** Saint Helena: a rock in the ocean (shares the sea with Corsica) */
export const HEL: V3 = [1600, 0, -1700];
export const HEL_R: V3 = [110, 46, 86];   // the island ellipsoid (radii), green cap a little smaller and taller
/** Corsica at the origin: sea y = 0, quay top G along z = 0, town toward +z (chapter 1's harbour) */
export const G = 1.5;
export type SetName = "study" | "press" | "senate" | "studio" | "paris" | "ext" | "int" | "school" | "field" | "snow" | "helena" | "corsica";
export const at = (o: V3, x: number, y: number, z: number): V3 => [o[0] + x, o[1] + y, o[2] + z];
export const CASA: V3 = [-60, G, 26];
export const TOWER: V3 = [-262, 8, -28];
/** the palace steps (Paris local): 6 steps, 0.2 m rise, 0.45 m deep, the lowest front at z = -7.3, the facade at -10 */
export const stepY = (z: number) => { let y = 0; for (let i = 0; i < 6; i++) if (z <= -7.3 - 0.45 * i) y = 0.2 * (i + 1); return y; };
/** height of the Saint Helena green cap (local x, z) */
export const helY = (x: number, z: number) => { const r = 1 - (x / (HEL_R[0] * 0.8)) ** 2 - (z / (HEL_R[2] * 0.78)) ** 2; return r > 0 ? HEL_R[1] * 1.04 * Math.sqrt(r) - 6 : -6; };

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName; sunAz?: number; sunEl?: number; night?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 108, light: "golden", set: "study", sunAz: 150, sunEl: 30, night: true },
  { id: 2, a: 108, b: 155, light: "day", set: "paris", sunAz: 110 },
  { id: 3, a: 155, b: 206, light: "day", set: "paris", sunAz: 110 },
  { id: 4, a: 206, b: 257, light: "day", set: "paris", sunAz: 150 },
  { id: 5, a: 257, b: 374, light: "day", set: "study", sunAz: 120 },
  { id: 6, a: 374, b: 422, light: "day", set: "study", sunAz: 120 },
  { id: 7, a: 422, b: 524, light: "day", set: "paris", sunAz: 110 },
  { id: 8, a: 524, b: 640, light: "day", set: "press", sunAz: 120 },
  { id: 9, a: 640, b: 695, light: "day", set: "paris", sunAz: 110 },
  { id: 10, a: 695, b: 802, light: "day", set: "study", sunAz: 120 },
  { id: 11, a: 802, b: 956, light: "day", set: "paris", sunAz: 155 },
  { id: 12, a: 956, b: 1014, light: "day", set: "senate", sunAz: 120 },
  { id: 13, a: 1014, b: 1064, light: "day", set: "paris", sunAz: 110 },
  { id: 14, a: 1064, b: 1170, light: "day", set: "ext", sunAz: 120, sunEl: 40 },
  { id: 15, a: 1170, b: 1269, light: "day", set: "int", sunAz: 110 },
  { id: 16, a: 1269, b: 1347, light: "day", set: "int", sunAz: 110 },
  { id: 17, a: 1347, b: 1436, light: "day", set: "int", sunAz: 110 },
  { id: 18, a: 1436, b: 1538, light: "day", set: "int", sunAz: 110 },
  { id: 19, a: 1538, b: 1569, light: "day", set: "school" },
  { id: 20, a: 1569, b: 1691, light: "day", set: "int", sunAz: 110 },
  { id: 21, a: 1691, b: 1776, light: "day", set: "field", sunAz: 120 },
  { id: 22, a: 1776, b: 1867, light: "day", set: "snow", sunAz: 120, sunEl: 30 },
  { id: 23, a: 1867, b: 1961, light: "day", set: "field", sunAz: 120 },
  { id: 24, a: 1961, b: 2094, light: "golden", set: "helena", sunAz: 25, sunEl: 9 },
  { id: 25, a: 2094, b: 2187, light: "day", set: "studio", sunAz: 120 },
  { id: 26, a: 2187, b: 2300, light: "day", set: "field", sunAz: 110 },
  { id: 27, a: 2300, b: 2430, light: "day", set: "studio", sunAz: 120 },
  { id: 28, a: 2430, b: 2496, light: "golden", set: "field", sunAz: 150, sunEl: 8 },
  { id: 29, a: 2496, b: 2660, light: "day", set: "study", sunAz: 120 },
  { id: 30, a: 2660, b: TOTAL, light: "golden", set: "corsica", sunAz: 20, sunEl: 8 },
];
/** crossfades at the time jumps (1802, back to 1804, the school flash-back and back, the later wars, exile, Corsica) */
export const XFADE: Record<number, number> = { 11: 10, 14: 10, 19: 8, 20: 8, 21: 10, 24: 10, 30: 12 };
/** a 4-frame white flash the moment the crown is on ("but himself") */
export const FLASH_AT = 1402;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story beats (frames) ----------------
/** self-crowning: k 0 (chest) until 1364, through the face zone (0.2-0.6) in 6 frames, up to 1 by 1392; crown on at the 1402 cut */
export const CROWN_ON = 1402;
export const crownK = (f: number) => (f < 1364 ? 0 : f < 1370 ? 0.62 * ((f - 1364) / 6) : f < 1392 ? 0.62 + 0.38 * smooth((f - 1370) / 22) : 1);
/** the Code lands on the desk (shot 6) */
export const BOOK_LAND = 388;
export const bookY = (f: number) => { const u = clamp01((f - 378) / (BOOK_LAND - 378)); return 0.82 + 2.6 * (1 - u * u); };
/** the press platen (shot 8): pumping until it is stopped on the cut at 604 */
export const PRESS_STOP = 604;
export const platenY = (f: number) => (f >= PRESS_STOP ? 1.42 : 1.15 + 0.27 * (0.5 + 0.5 * Math.cos(((f - 524) / 22) * Math.PI * 2)));
/** the caricature tears at "myth" (shot 25) */
export const TEAR = 2163;
export const tearK = (f: number) => clamp01((f - TEAR) / 16);
/** the desk globe spins (shot 29) */
export const globeA = (f: number) => (f - 2496) * 0.045;

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
/** a sideways truck: pos and look slide together along (dx, dz) by u metres per frame since f0 */
const truck = (s: Shot, f: number, f0: number, dx: number, dz: number): Shot => {
  const u = f - f0;
  return { ...s, pos: [s.pos[0] + dx * u, s.pos[1], s.pos[2] + dz * u], look: [s.look[0] + dx * u, s.look[1], s.look[2] + dz * u] };
};
export const Sd = (x: number, y: number, z: number) => at(STUDY, x, y, z);
export const Pr = (x: number, y: number, z: number) => at(PRESS, x, y, z);
export const Sn = (x: number, y: number, z: number) => at(SENATE, x, y, z);
export const St = (x: number, y: number, z: number) => at(STUDIO, x, y, z);
export const Pa = (x: number, y: number, z: number) => at(PARIS, x, y, z);
export const I = (x: number, y: number, z: number) => at(INT, x, y, z);
export const E = (x: number, y: number, z: number) => at(EXT, x, y, z);
export const S = (x: number, y: number, z: number) => at(SCH, x, y, z);
export const F = (x: number, y: number, z: number) => at(FIELD, x, y, z);
export const W = (x: number, y: number, z: number) => at(SNOW, x, y, z);
export const H = (x: number, y: number, z: number) => at(HEL, x, y, z);
const P = 0.9; // Notre-Dame choir platform
/** Napoleon on Saint Helena: on the cap near the west edge, looking out to sea (-x) */
export const NAP_HEL: V3 = [-62, 0, 14];
export const napHel = (): V3 => H(NAP_HEL[0], helY(NAP_HEL[0], NAP_HEL[2]), NAP_HEL[2]);
/** Waterloo: Napoleon on his grey horse, riding slowly off to the left after "beaten" */
export const WAT_X = (f: number) => 150 - (f < 1893 ? 0 : 1.1 * ((f - 1893) / FPS) ** 1.3);
/** the boy on the Corsican quay (golden callback) */
export const BOY: V3 = [-30, G, 1.3];

const CAMS: Record<number, Key[]> = {
  // 1: the study at night, candles, piles of paper: a slow push (title card on top)
  1: [{ f: 0, s: (f) => dolly(Sd(1.9, 1.95, 4.4), Sd(-0.1, 1.3, -2.2), pushK(f, 0, 0.0018), { fov: 36 }) }],
  // 2: the national bank: low on the street, people carrying sacks up the steps
  2: [{ f: 104, s: (f) => truck(dolly(Pa(-41, 1.6, 15), Pa(-50, 5.2, -10), pushK(f, 104, 0.0022), { fov: 40 }), f, 104, -0.03, 0) }],
  // 3: the lycee: pupils filing out behind their master
  3: [{ f: 155, cut: true, s: (f) => dolly(Pa(-3.5, 1.55, 6.5), Pa(-11, 2.4, -8.5), pushK(f, 155, 0.0025), { fov: 38 }) }],
  // 4: the palace of the government: crane up over the guards and the flag
  4: [
    { f: 206, cut: true, s: (f) => dolly(Pa(52, 1.8, 26), Pa(45, 5.5, -10), pushK(f, 206, 0.002), { fov: 40 }) },
    { f: 212, dur: 40, s: (f) => dolly(Pa(52, 4.2, 25), Pa(45, 7.0, -10), pushK(f, 212, 0.002), { fov: 40 }) },
  ],
  // 5: the study by day: drafting the laws with the jurists; cut to Napoleon on "ordered one single set"
  5: [
    { f: 257, cut: true, s: (f) => dolly(Sd(-2.3, 1.85, 3.4), Sd(0.1, 1.25, -2.0), pushK(f, 257, 0.0022), { fov: 36 }) },
    { f: 296, cut: true, s: (f) => dolly(Sd(-0.15, 1.72, -0.3), Sd(0.25, 1.6, -2.75), pushK(f, 296, 0.0025), { fov: 32 }) },
    { f: 330, dur: 30, s: (f) => dolly(Sd(-0.05, 1.7, -0.5), Sd(0.25, 1.6, -2.75), pushK(f, 330, 0.0025), { fov: 32, roll: 0.035 }) },
  ],
  // 6: the Code lands on the desk (thump + kick)
  6: [{ f: 374, cut: true, s: (f) => dolly(Sd(0.55, 1.2, 0.75), Sd(0, 1.05, -1.7), pushK(f, 374, 0.0025, 0.006, 26), { fov: 36 }) }],
  // 7: every man equal: trucking along a line of citizens; cut to the proud shopkeeper on "protected property"
  7: [
    { f: 422, s: (f) => truck({ pos: Pa(4.5, 1.6, 9.5), look: Pa(4.5, 1.3, 2), fov: 34 }, f, 422, 0.075, 0) },
    { f: 481, cut: true, s: (f) => dolly(Pa(21.2, 1.55, 8.6), Pa(20, 1.5, 12.8), pushK(f, 481, 0.0028), { fov: 32 }) },
  ],
  // 8: the print shop: the press working; cut to the policeman stopping it on "shut down"
  8: [
    { f: 524, cut: true, s: (f) => dolly(Pr(2.8, 1.85, 3.6), Pr(-0.2, 1.35, -1.6), pushK(f, 524, 0.002), { fov: 38 }) },
    { f: 604, cut: true, s: (f) => dolly(Pr(0.55, 1.75, 1.95), Pr(0.45, 1.25, -1.45), pushK(f, 604, 0.0025, 0.006, 25), { fov: 34, roll: -0.03 }) },
  ],
  // 9: a critic talking on a cafe corner, a police spy peeking from behind the column
  9: [{ f: 640, cut: true, s: (f) => truck(dolly(Pa(-77.5, 1.6, 7.2), Pa(-79.6, 1.45, -0.6), pushK(f, 640, 0.0025), { fov: 34 }), f, 640, 0.012, 0) }],
  // 10: husband and wife: the Code in his hands
  10: [
    { f: 695, cut: true, s: (f) => dolly(Sd(-0.9, 1.6, 2.7), Sd(-2.75, 1.35, -0.85), pushK(f, 695, 0.0022), { fov: 34 }) },
    { f: 738, dur: 30, s: (f) => dolly(Sd(-1.3, 1.55, 1.6), Sd(-2.7, 1.42, -0.85), pushK(f, 738, 0.0022), { fov: 32, roll: 0.03 }) },
  ],
  // 11: 1802: the Consul on the palace steps, the crowd cheering; cut low on "Two years later", one step up
  11: [
    { f: 797, s: (f) => dolly(Pa(50.5, 2.7, 0.2), Pa(45.2, 2.1, -8.6), pushK(f, 797, 0.0018), { fov: 36 }) },
    { f: 884, cut: true, s: (f) => dolly(Pa(46.4, 0.95, -5.6), Pa(45, 1.75, -9.1), pushK(f, 884, 0.0022), { fov: 34 }) },
    { f: 922, dur: 26, s: (f) => dolly(Pa(46.2, 1.05, -6.0), Pa(45, 1.95, -9.2), pushK(f, 922, 0.0025), { fov: 34, roll: 0.04 }) },
  ],
  // 12: the Senate: rows of senators raising their hands
  12: [{ f: 956, cut: true, s: (f) => dolly(Sn(1.2, 3.0, 7.6), Sn(0, 2.3, -4), pushK(f, 956, 0.0025), { fov: 40 }) }],
  // 13: the public vote: ballots into the box
  13: [{ f: 1014, cut: true, s: (f) => truck(dolly(Pa(-27.6, 1.6, 6.4), Pa(-30.2, 1.2, 1.4), pushK(f, 1014, 0.0025), { fov: 34 }), f, 1014, 0.012, 0) }],
  // 14: back to the cold December morning: Notre-Dame from the parvis, rising
  14: [{ f: 1059, s: (f) => { const u = glide((f - 1059) / 111); return dolly([E(-16, 1.9, 104)[0], 1.9 + 5 * u, E(0, 0, 104)[2]], E(0, 24 + 3 * u, 0), pushK(f, 1059, 0.0012), { fov: 40 }); } }],
  // 15: the Pope on his throne: did he know? push in on his sideways look
  15: [
    { f: 1170, cut: true, s: (f) => dolly(I(-1.6, 2.0, -40.6), I(-5.3, 2.2, -44.85), pushK(f, 1170, 0.0022), { fov: 32 }) },
    { f: 1214, dur: 34, s: (f) => dolly(I(-3.2, 2.05, -41.9), I(-5.35, 2.25, -44.85), pushK(f, 1214, 0.0025), { fov: 30, roll: -0.03 }) },
  ],
  // 16: everyone watching: the guests seen from the choir
  16: [{ f: 1269, cut: true, s: (f) => truck(dolly(I(-2.4, 3.1, -40.5), I(0.6, 1.9, -14), pushK(f, 1269, 0.0018), { fov: 38 }), f, 1269, 0.02, 0) }],
  // 17: the self-crowning from a new angle (in front of the altar, the nave behind him); CU crowned on "but himself"
  17: [
    { f: 1347, cut: true, s: (f) => dolly(I(-1.15, 1.95, -47.75), I(0, 2.72, -45.2), pushK(f, 1347, 0.0022), { fov: 36 }) },
    { f: 1402, cut: true, s: (f) => dolly(I(-0.4, 2.42, -47.4), I(0, 2.46, -45.2), pushK(f, 1402, 0.002, 0.009, 26), { fov: 32, roll: 0.04 }) },
  ],
  // 18: he turns and crowns the kneeling Josephine; CU of the empress on "as his empress"
  18: [
    { f: 1436, cut: true, s: (f) => dolly(I(-1.5, 2.05, -40.3), I(0.65, 1.85, -44.6), pushK(f, 1436, 0.0022), { fov: 32 }) },
    { f: 1460, dur: 32, s: (f) => dolly(I(-0.9, 1.95, -41.4), I(0.7, 1.8, -44.6), pushK(f, 1460, 0.0025), { fov: 32 }) },
    { f: 1495, cut: true, s: (f) => dolly(I(0.05, 2.0, -42.2), I(0.3, 2.0, -44.4), pushK(f, 1495, 0.0025), { fov: 34, roll: -0.03 }) },
  ],
  // 19: the mocked schoolboy (flash-back)
  19: [{ f: 1534, s: (f) => dolly(S(0.7, 1.6, 4.8), S(0, 1.3, -0.3), pushK(f, 1534, 0.004), { fov: 34 }) }],
  // 20: to emperor: in front of his throne; pull back wide on "the story does not end there"
  20: [
    { f: 1565, s: (f) => dolly(I(3.4, 1.55, -40.9), I(5.3, 2.55, -45.65), pushK(f, 1565, 0.0025), { fov: 34 }) },
    { f: 1626, dur: 64, s: (f) => dolly(I(-1.0, 7.5, -26), I(3.4, 2.2, -45.5), pushK(f, 1626, 0.0012), { fov: 40 }) },
  ],
  // 21: the wars: blue columns through cannon smoke
  21: [{ f: 1686, s: (f) => truck({ pos: F(5, 1.9, 10.5), look: F(-4, 1.5, -2), fov: 36 }, f, 1686, 0.04, 0) }],
  // 22: Russia 1812: the retreat through deep snow
  22: [{ f: 1776, cut: true, s: (f) => dolly(W(2.0, 1.6, 3.2), W(0, 1.15, -8), pushK(f, 1776, 0.0022), { fov: 36 }) }],
  // 23: Waterloo: Napoleon on his horse in the smoke, then riding away
  23: [
    { f: 1867, cut: true, s: (f) => dolly(F(152.5, 2.2, 10.5), F(150.5, 2.4, 0), pushK(f, 1867, 0.0022), { fov: 36 }) },
    { f: 1893, dur: 50, s: (f) => dolly(F(WAT_X(f) + 1.0, 2.6, 12), F(WAT_X(f) - 0.5, 2.3, 0), 1, { fov: 36 }) },
  ],
  // 24: Saint Helena from the sea (golden), then Napoleon alone on the edge looking out
  24: [
    { f: 1956, s: (f) => { const u = glide((f - 1956) / 80); return { pos: H(-330 + 70 * u, 55 - 15 * u, 240 - 60 * u), look: H(0, 28, 0), fov: 30 }; } },
    { f: 2033, cut: true, s: (f) => { const n = napHel(); return dolly([n[0] + 3.6, n[1] + 1.9, n[2] + 4.2], [n[0] - 0.6, n[1] + 1.45, n[2]], pushK(f, 2033, 0.0022), { fov: 34 }); } },
  ],
  // 25: the caricature on the easel; it tears on "myth" and the real man stands behind it
  25: [{ f: 2094, cut: true, s: (f) => dolly(St(0.45, 1.5, 3.9), St(0, 1.25, -1.1), pushK(f, 2094, 0.0022, 0.005, 30), { fov: 36 }) }],
  // 26: five foot seven: trucking along a line of soldiers to Napoleon in the middle
  26: [
    { f: 2187, cut: true, s: (f) => truck({ pos: F(-157, 1.55, 7.2), look: F(-157, 1.25, 0), fov: 34 }, f, 2187, 0.06, 0) },
    { f: 2238, dur: 40, s: (f) => dolly(F(-150.2, 1.6, 6.4), F(-150, 1.3, 0), pushK(f, 2238, 0.0025), { fov: 34 }) },
  ],
  // 27: the London cartoonist laughing at his drawing; cut to the caricature on "a furious little man"
  27: [
    { f: 2300, cut: true, s: (f) => dolly(St(-0.8, 1.6, 1.9), St(-3.0, 1.2, -2.3), pushK(f, 2300, 0.0022), { fov: 36 }) },
    { f: 2380, cut: true, s: (f) => dolly(St(0.25, 1.15, 1.4), St(0, 0.85, -1.0), pushK(f, 2380, 0.0025), { fov: 34, roll: 0.03 }) },
  ],
  // 28: the little corporal: soldiers cheering him round a campfire (golden)
  28: [{ f: 2430, cut: true, s: (f) => dolly(F(-146.6, 1.55, 26.4), F(-150, 1.35, 19.6), pushK(f, 2430, 0.0025), { fov: 36 }) }],
  // 29: the Code on the desk with the globes; cut to the spinning globe
  29: [
    { f: 2496, cut: true, s: (f) => dolly(Sd(1.6, 1.5, 1.0), Sd(0.15, 1.0, -1.7), pushK(f, 2496, 0.0022), { fov: 36 }) },
    { f: 2555, cut: true, s: (f) => dolly(Sd(1.5, 1.4, -0.55), Sd(0.72, 1.22, -1.75), pushK(f, 2555, 0.0025), { fov: 34 }) },
  ],
  // 30: Corsica at golden hour: the boy on the quay looking at the sea; crane up and back over the harbour
  30: [
    { f: 2654, s: (f) => dolly([BOY[0] + 4.4, G + 1.5, BOY[2] + 2.6], [BOY[0] - 1.4, G + 1.35, BOY[2] - 1.2], pushK(f, 2654, 0.0018), { fov: 34 }) },
    { f: 2780, dur: 150, s: (f) => dolly([BOY[0] + 30, G + 26, BOY[2] + 48], [BOY[0] - 2, G + 0.5, BOY[2] - 14], pushK(f, 2780, 0.0008), { fov: 34 }) },
  ],
};

// impact kicks: the Code lands; a cannon at Waterloo
const KICKS: [number, number][] = [[BOOK_LAND / FPS, 0.7], [1712 / FPS, 0.4]];
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
  { f: 0, cInf: 5, focus: () => Sd(0, 1.5, -2.7) },          // the study wide
  { f: 108, cInf: 0 },                                        // street wides
  { f: 257, cInf: 6, focus: () => Sd(0.2, 1.5, -2.5) },      // the jurists
  { f: 296, cInf: 12, focus: () => Sd(0.25, 1.6, -2.75) },   // Napoleon MS
  { f: 374, cInf: 11, focus: () => Sd(0, 1.0, -1.65) },      // the Code
  { f: 422, cInf: 7, focus: () => Pa(9, 1.5, 2) },            // the citizens
  { f: 481, cInf: 11, focus: () => Pa(20, 1.6, 12.7) },      // shopkeeper
  { f: 524, cInf: 5, focus: () => Pr(0.2, 1.4, -1.4) },      // press wide
  { f: 604, cInf: 11, focus: () => Pr(0.6, 1.4, -1.0) },     // police + printer
  { f: 640, cInf: 9, focus: () => Pa(-79.6, 1.5, -0.4) },    // the cafe corner
  { f: 695, cInf: 10, focus: () => Sd(-2.7, 1.45, -0.9) },   // husband and wife
  { f: 802, cInf: 5, focus: () => Pa(45.2, 2.2, -8.9) },     // the Consul on the steps
  { f: 884, cInf: 10, focus: () => Pa(45, 2.3, -9.0) },
  { f: 956, cInf: 5, focus: () => Sn(0, 2.3, -3) },          // the Senate
  { f: 1014, cInf: 8, focus: () => Pa(-30.2, 1.3, 1.2) },    // ballot box
  { f: 1064, cInf: 0 },                                       // Notre-Dame
  { f: 1170, cInf: 12, focus: () => I(-5.35, 2.35, -44.85) },// the Pope
  { f: 1269, cInf: 5, focus: () => I(-1, 1.6, -20) },        // the guests
  { f: 1347, cInf: 11, focus: () => I(0, 2.6, -45.2) },      // self-crowning
  { f: 1402, cInf: 14, focus: () => I(0, 2.45, -45.2) },     // crowned CU
  { f: 1436, cInf: 10, focus: () => I(0.7, 1.9, -44.6) },    // Josephine
  { f: 1495, cInf: 13, focus: () => I(0.24, 2.0, -44.3) },   // the empress CU
  { f: 1538, cInf: 11, focus: () => S(0, 1.35, 0) },         // the cadet
  { f: 1569, cInf: 11, focus: () => I(5.4, 2.5, -45.65) },   // the emperor
  { f: 1626, dur: 50, cInf: 0 },                              // pull back
  { f: 1691, cInf: 0 },                                       // the wars, the snow
  { f: 1776, cInf: 7, focus: () => W(0, 1.3, -6) },
  { f: 1867, cInf: 8, focus: (f) => F(WAT_X(f), 2.3, 0) },   // Waterloo
  { f: 1961, cInf: 0 },                                       // Saint Helena aerial
  { f: 2033, cInf: 10, focus: () => napHel() },
  { f: 2094, cInf: 8, focus: () => St(0, 1.3, -1.1) },       // the easel
  { f: 2187, cInf: 7, focus: () => F(-150, 1.4, 0) },        // the line-up
  { f: 2300, cInf: 9, focus: () => St(-3.0, 1.3, -2.5) },    // the cartoonist
  { f: 2380, cInf: 10, focus: () => St(0, 0.9, -1.0) },      // the caricature
  { f: 2430, cInf: 8, focus: () => F(-150, 1.4, 19.4) },     // campfire
  { f: 2496, cInf: 10, focus: () => Sd(0, 0.95, -1.65) },    // the Code and the globes
  { f: 2555, cInf: 12, focus: () => Sd(0.72, 1.22, -1.75) },
  { f: 2660, cInf: 6, focus: () => [BOY[0], G + 1.2, BOY[2]] }, // the boy at the quay
  { f: 2780, dur: 60, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { T, P };
