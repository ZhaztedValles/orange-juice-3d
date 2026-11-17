// Chapter 3, "The Guns of Toulon": the timeline. Shots keyed to words.json (cuts 0-3 f before their word), camera keys
// per shot (same grammar as the sample chapter: smootherstep glides, creeping push-ins on every hold, cuts on big
// reframes, flip kicks on impacts), lens blur per beat. Places: Paris (square, steps), the palace room (throne, war
// table), Toulon (harbour, town quay, the British fort on the Caire heights, the French camp and batteries).
import { clamp01, smooth, easeOut } from "../../../src/engine/math";
import { BAT_C, ground, PARIS, ROOM, THRONE, WAR_TABLE, FORT_C, FORT_Y, CAMP_C, CAMP_Y, V3, stepTop } from "./terrain";
export { clamp01, smooth, easeOut };
export type { V3 };
export const FPS = 30;
export const TOTAL = 3039;
const T = (f: number) => f / FPS;

// ---------------- places used by cameras and cast ----------------
const gy = (x: number, z: number) => ground(x, z);
/** Napoleon's spot at the camp map table, the camp lookout, the battery, the breach */
export const TABLE: V3 = [-268, CAMP_Y, -104];
export const LOOKOUT: V3 = [-262, CAMP_Y, -113];
export const BAT: V3 = [BAT_C[0], gy(BAT_C[0], BAT_C[1]), BAT_C[1]];      // centre of the battery (guns face +x toward the walls)
export const BREACH: V3 = [-154, 0, -150];                // outside the west wall (y from ground)
BREACH[1] = gy(BREACH[0], BREACH[2]);
export const WALL_TOP = FORT_Y + 4.2;                     // fort wall-walk height
export const FLAGPOLE: V3 = [-118, FORT_Y, -150];
/** the hauling path (shot 13): guns pushed along +x on the saddle */
export const HAUL_Z = -112;

// ---------------- shots ----------------
export type Light = "day" | "golden" | "night";
export type Place = "paris" | "room" | "toulon";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; fogFar?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 115, light: "day", place: "paris" },        // Paris 1789: crowd with tricolours
  { id: 2, a: 115, b: 268, light: "day", place: "room" },       // the empty throne, the crown rolls
  { id: 3, a: 268, b: 339, light: "day", place: "room" },       // war table: half of Europe closes in
  { id: 4, a: 339, b: 481, light: "day", place: "paris" },      // white-coated noble officers flee
  { id: 5, a: 481, b: 613, light: "day", place: "paris" },      // the captain climbs the steps
  { id: 6, a: 613, b: 804, light: "day", place: "toulon", fogFar: 900 }, // Toulon wide; royalists raise the white flag
  { id: 7, a: 804, b: 1043, light: "day", place: "toulon", fogFar: 900 }, // British fleet sails in; French fleet at the quay
  { id: 8, a: 1043, b: 1160, light: "day", place: "toulon", fogFar: 700 }, // siege going nowhere
  { id: 9, a: 1160, b: 1345, light: "day", place: "toulon", fogFar: 600 }, // gunnery officer wounded; the captain rides in
  { id: 10, a: 1345, b: 1552, light: "day", place: "toulon", fogFar: 600 }, // "It was Napoleon"; the maps
  { id: 11, a: 1552, b: 1708, light: "day", place: "toulon", fogFar: 700 }, // the fort, Little Gibraltar
  { id: 12, a: 1708, b: 1913, light: "day", place: "toulon", fogFar: 900 }, // the harbour from the fort; Napoleon points
  { id: 13, a: 1913, b: 2180, light: "day", place: "toulon", fogFar: 600 }, // hauling guns; the battery under fire
  { id: 14, a: 2180, b: 2283, light: "day", place: "toulon", fogFar: 600 }, // the men without fear
  { id: 15, a: 2283, b: 2521, light: "night", place: "toulon" }, // the night assault in the rain; the bayonet
  { id: 16, a: 2521, b: 2558, light: "night", place: "toulon" }, // the fort falls: tricolour up
  { id: 17, a: 2558, b: 2694, light: "golden", place: "toulon", fogFar: 900 }, // the British fleet sails away
  { id: 18, a: 2694, b: 2881, light: "golden", place: "toulon", fogFar: 600 }, // promotion to brigadier general
  { id: 19, a: 2881, b: TOTAL, light: "golden", place: "toulon", fogFar: 700 }, // alone on the wall: success is dangerous
];
/** crossfades (frames) at time / place jumps */
export const XFADE: Record<number, number> = { 2: 8, 6: 8, 15: 8, 17: 8, 18: 8 };
export const FLASH_AT = -100; // no white flash in this chapter

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story beats (seconds) ----------------
export const CROWN_T = 5.2;          // the crown tips off the throne ("gone")
export const ARMY_T0 = 8.95;         // toy armies start to close in ("and France was at war")
export const FLAG_UP = [24.1, 26.4] as const; // the white flag goes up the quay pole ("rebelled")
export const SIEGE_SHOT = 36.7;      // a camp gun fires, the ball drops short ("but")
export const RIDE_T = [41.9, 44.4] as const; // the captain rides into camp
export const LOOK_UP = 47.25;        // "saw what the others had missed"
export const POINT_T = [49.4, 51.3] as const; // the sabre tip slides from the town to the hill
export const NAP_POINT = 60.55;      // "Take the fort"
export const BAT_FIRE = [67.2, 68.4, 69.6, 70.7, 71.8, 72.9, 74.0];
export const INCOMING = [68.85, 70.1, 70.95, 71.4, 72.2, 73.4];
export const DUCK = [70.95, 72.6] as const;
export const NIGHT_FLASH = [76.3, 76.9, 77.5, 78.0, 78.6, 79.1, 79.5, 80.1, 80.6, 81.1, 81.5];
export const STAB_T = 82.45;         // "thigh"
export const FALL_T = 84.15;         // "But the fort fell": tricolour up
export const PROMOTE_T = 94.15;      // "promoted"

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 24, roll: 0, ...c });
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
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const add = (a: V3, x: number, y: number, z: number): V3 => [a[0] + x, a[1] + y, a[2] + z];
const P = (x: number, y: number, z: number): V3 => [PARIS[0] + x, PARIS[1] + y, PARIS[2] + z - 2000];

// ---- story paths shared with the cast ----
/** Napoleon on the steps (shot 5): z along the steps over time */
export const climbZ = (t: number) => 2019.5 + 10.5 * smooth((t - 16.15) / 4.3) * 0.15 + 10.5 * clamp01((t - 16.15) / 4.3) * 0.85;
export const climbY = (t: number) => stepTop(climbZ(t));
/** the captain's horse (shot 9b): x along the camp track */
export const rideX = (t: number) => {
  const u = clamp01((t - RIDE_T[0]) / (RIDE_T[1] - RIDE_T[0]));
  return -312 + 26 * (1 - (1 - u) ** 2);
};
export const RIDE_Z = -112;
/** guns hauled along the saddle (shot 13a) */
export const haulX = (t: number) => -284 + 1.1 * (t - 63.8);

// ---- framings ----
// 1: Paris square wide (calm, title card over it), slow push toward the crowd and the grand steps
const S1a = (f: number) => dolly(P(-7, 4.6, 1966), P(1, 3.2, 2010), pushK(f, 0, 0.0016), { fov: 30 });
// 2: palace room: the empty throne, low; follow the crown down to the floor
const S2a = (f: number) => dolly(add(ROOM, 1.6, 1.15, 2.2), add(THRONE, 0, 1.25, 0), pushK(f, 111, 0.0022), { fov: 28 });
const S2b = (f: number) => dolly(add(ROOM, 2.6, 0.55, 0.2), add(ROOM, 0.9, 0.2, 4.6), pushK(f, 196, 0.002), { fov: 30, roll: 0.035 });
// 3: war table from above
const S3a = (f: number) => dolly(add(WAR_TABLE, 0.2, 3.3, 2.4), add(WAR_TABLE, 0, 0.95, -0.15), pushK(f, 268, 0.0035), { fov: 30 });
// 4: Paris east street, the nobles hurry across the frame
const S4a = (f: number) => dolly(P(31, 1.75, 1990.5), P(33, 1.35, 2000), pushK(f, 339, 0.002), { fov: 30 });
const S4b = (f: number) => dolly(P(33.5, 1.7, 1993.6), P(37, 1.4, 2000.2), pushK(f, 430, 0.0025), { fov: 26, roll: -0.035 });
// 5: the steps, side view tracking the captain up
const S5a = (f: number) => { const z = climbZ(T(f)); return dolly([-8.5, 1.9 + 0.55 * climbY(T(f)), z - 1.2], [0, 1.5 + climbY(T(f)), z + 0.6], pushK(f, 481, 0.0018), { fov: 28 }); };
const S5b = (f: number) => { const z = climbZ(T(f)); return dolly([-6.2, 0.9 + 0.7 * climbY(T(f)), z - 3.6], [0, 1.8 + climbY(T(f)), z + 0.8], pushK(f, 566, 0.002, 0.005, 30), { fov: 30, roll: 0.04 }); };
// 6: Toulon aerial from the south-east over the sea, then the quay where the white flag goes up
const S6a = (f: number) => dolly([250, 85, -240], [-60, 6, -10], pushK(f, 609, 0.0018), { fov: 34 });
const S6b = (f: number) => dolly([33.5, 3.8, 87.5], [28, 4.4, 74], pushK(f, 722, 0.0022), { fov: 32 });
// 7: the British fleet sails in (low over the water), then the French fleet at the arsenal quay
const S7a = (f: number) => dolly([170, 7, 22], [230, 9, -40], pushK(f, 804, 0.0012), { fov: 30 });
const S7a2 = (f: number) => dolly([170, 7, 22], [200, 9, -36], pushK(f, 870, 0.0012), { fov: 30 });
const S7b = (f: number) => dolly([-6, 9, 14], [-34, 9, 52], pushK(f, 950, 0.0022), { fov: 30 });
// 8: the camp looking out over the harbour: bored soldiers, a gun fires short
const S8a = (f: number) => dolly([-271.5, CAMP_Y + 1.7, -95.5], [-261, CAMP_Y + 0.6, -105], pushK(f, 1043, 0.0018), { fov: 32 });
// 9: the wounded gunnery officer, then the captain rides in
const OFFICER_SPOT: V3 = [-296, CAMP_Y, -122];
const S9a = (f: number) => dolly(add(OFFICER_SPOT, -0.6, 1.5, 5.4), add(OFFICER_SPOT, 0.4, 1.1, 0), pushK(f, 1160, 0.0025), { fov: 26 });
const S9b = (f: number) => { const x = rideX(T(f)); return dolly([x - 1.0, CAMP_Y + 1.9, RIDE_Z + 10], [x + 1.2, CAMP_Y + 2.1, RIDE_Z], pushK(f, 1255, 0.0015), { fov: 28 }); };
// 10: close-up "It was Napoleon", the map table, the map from above
const S10a = (f: number) => dolly(add(TABLE, 0.3, 1.75, 2.9), add(TABLE, 0, 1.62, -0.6), pushK(f, 1345, 0.003, 0.006, 30), { fov: 26 });
const S10b = (f: number) => dolly(add(TABLE, -0.4, 2.0, 4.6), add(TABLE, 0, 1.25, -0.4), pushK(f, 1385, 0.0022), { fov: 28 });
const S10c = (f: number) => dolly(add(TABLE, 0.05, 2.55, 1.75), add(TABLE, 0, 0.95, 0.05), pushK(f, 1468, 0.002), { fov: 32 });
// 11: the fort from the slope below its west wall; push up on "Little Gibraltar"
const S11a = (f: number) => dolly([-40, 32, -40], [-128, FORT_Y + 2, -148], pushK(f, 1552, 0.002), { fov: 30 });
const S11b = (f: number) => zoom([-62, 36, -78], [-129, FORT_Y + 3.5, -149], 17, pushK(f, 1670, 0.002, 0.006, 30), { roll: -0.035 });
// 12: from the fort parapet over the harbour; then Napoleon on the camp lookout pointing at the fort
const S12a = (f: number) => zoom([-120.5, WALL_TOP + 3.6, -145.2], [-20, 0, -60], 32, pushK(f, 1708, 0.0015));
const S12b = (f: number) => dolly(add(LOOKOUT, -8, 1.8, 6), add(LOOKOUT, 6, 3, -4), pushK(f, 1817, 0.002), { fov: 32 });
// 13: hauling the guns along the saddle; the battery under the walls
const S13a = (f: number) => { const x = haulX(T(f)); return dolly([x - 3, gy(x, HAUL_Z + 12) + 2.0, HAUL_Z + 12], [x + 2, gy(x, HAUL_Z) + 1.3, HAUL_Z], pushK(f, 1913, 0.0015), { fov: 30 }); };
const S13b = (f: number) => dolly(add(BAT, -9.5, 2.6, 7), add(BAT, 8, 9, -3.5), pushK(f, 2005, 0.0018), { fov: 34 });
const S13c = (f: number) => dolly(add(BAT, -15, 9, 12), add(BAT, 3, 0.5, -2), pushK(f, 2087, 0.0025, 0.005, 30), { fov: 30, roll: 0.035 });
// 14: the men without fear, front MS
const S14a = (f: number) => dolly(add(BAT, 4.6, 1.75, 8.2), add(BAT, -1.6, 1.4, 0.4), pushK(f, 2180, 0.0025), { fov: 28 });
// 15: night storm: the column up the slope; Napoleon charging; the bayonet
const S15a = (f: number) => dolly([-196, gy(-196, -130) + 2.4, -130], [-175, 30, -150], pushK(f, 2279, 0.0018), { fov: 32 });
const S15b = (f: number) => { const x = chargeX(T(f)); return dolly([x + 0.3, gy(x, -141.5) + 1.5, -141.5], [x + 1.2, gy(x + 1.2, -150) + 1.5, -150], pushK(f, 2408, 0.0018), { fov: 36 }); };
const S15c = (f: number) => dolly(add(BREACH, -1.6, 1.6, 4.4), add(BREACH, -0.4, 1.35, 0), pushK(f, 2451, 0.003, 0.006, 26), { fov: 28 });
// 16: low, up at the wall top where the tricolour goes up
const S16a = (f: number) => dolly([-153, FORT_Y + 1.4, -142], [-142, WALL_TOP + 3, -150], pushK(f, 2521, 0.003), { fov: 34, roll: 0.03 });
// 17: golden: from the fort wall over the harbour, the British fleet leaving
const S17a = (f: number) => zoom([-114, WALL_TOP + 2.0, -142], [20, 2, -70], 30, pushK(f, 2554, 0.0012));
// 18: promotion on the camp plateau
const CEREMONY: V3 = [-282, CAMP_Y, -100];
export { CEREMONY, OFFICER_SPOT };
const S18a = (f: number) => dolly(add(CEREMONY, 3.6, 1.9, 6.4), add(CEREMONY, -0.4, 1.4, 0), pushK(f, 2690, 0.002), { fov: 30 });
const S18b = (f: number) => dolly(add(CEREMONY, 0.9, 1.75, 3.4), add(CEREMONY, 0, 1.6, 0), pushK(f, 2822, 0.0025, 0.006, 30), { fov: 28, roll: -0.035 });
// 19: alone on the wall at dusk; slow pull back and up
const LONE: V3 = [-117.1, WALL_TOP, -140.6];
export { LONE };
const S19a = (f: number) => { const u = glide((f - 2881) / 158), d = 3.6 + 7 * u; return { pos: [LONE[0] - 0.79 * d + 0.9, LONE[1] + 1.5 + 2.4 * u, LONE[2] - 0.61 * d - 0.6] as V3, look: [LONE[0], LONE[1] + 1.45 + 0.3 * u, LONE[2]] as V3, fov: 28 + 2 * u, roll: 0 }; };

/** charge path (shot 15b): Napoleon and the column run along +x up toward the wall */
export const chargeX = (t: number) => -182 + 2.4 * (t - 80.2);

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 111, s: S2a }, { f: 196, dur: 34, s: S2b }],
  3: [{ f: 268, s: S3a }],
  4: [{ f: 339, s: S4a }, { f: 430, dur: 30, s: S4b }],
  5: [{ f: 481, s: S5a }, { f: 566, dur: 26, s: S5b }],
  6: [{ f: 609, s: S6a }, { f: 722, cut: true, s: S6b }],
  7: [{ f: 804, s: S7a }, { f: 870, dur: 40, s: S7a2 }, { f: 950, cut: true, s: S7b }],
  8: [{ f: 1043, s: S8a }],
  9: [{ f: 1160, s: S9a }, { f: 1255, cut: true, s: S9b }],
  10: [{ f: 1345, s: S10a }, { f: 1385, cut: true, s: S10b }, { f: 1468, cut: true, s: S10c }],
  11: [{ f: 1552, s: S11a }, { f: 1660, dur: 30, s: S11b }],
  12: [{ f: 1708, s: S12a }, { f: 1817, cut: true, s: S12b }],
  13: [{ f: 1913, s: S13a }, { f: 2005, cut: true, s: S13b }, { f: 2087, cut: true, s: S13c }],
  14: [{ f: 2180, s: S14a }],
  15: [{ f: 2279, s: S15a }, { f: 2408, cut: true, s: S15b }, { f: 2451, cut: true, s: S15c }],
  16: [{ f: 2521, s: S16a }],
  17: [{ f: 2554, s: S17a }],
  18: [{ f: 2690, s: S18a }, { f: 2822, cut: true, s: S18b }],
  19: [{ f: 2881, s: S19a }],
};
/** every in-shot camera cut (shots.json "planned") */
export const CUTS = Object.values(CAMS).flatMap((ks) => ks.filter((k) => k.cut).map((k) => k.f));

// impact kicks: [t, gain]
export const KICKS: [number, number][] = [
  [CROWN_T + 0.4, 0.5], [SIEGE_SHOT, 0.6],
  ...BAT_FIRE.map((t) => [t, 0.7] as [number, number]),
  ...INCOMING.map((t) => [t, 0.45] as [number, number]),
  [STAB_T, 1.0], [PROMOTE_T, 0.4],
];
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
  // never under the Toulon hills: a dolly toward a look point up a slope would sink the lens into the ground
  if (SHOTS[id - 1].place === "toulon") c.pos[1] = Math.max(c.pos[1], ground(c.pos[0], c.pos[2]) + 1.3, 1.2);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 115, cInf: 10, focus: () => add(THRONE, 0, 1.2, 0) },
  { f: 196, dur: 34, cInf: 13, focus: () => add(ROOM, 0.9, 0.2, 4.6) },
  { f: 268, cInf: 8 },
  { f: 339, cInf: 6 },
  { f: 430, dur: 30, cInf: 10 },
  { f: 481, cInf: 8, focus: (f) => [0, 1.6 + climbY(T(f)), climbZ(T(f))] },
  { f: 613, cInf: 0 },
  { f: 722, cInf: 8 },
  { f: 804, cInf: 0 },
  { f: 1160, cInf: 12 },
  { f: 1255, cInf: 6, focus: (f) => [rideX(T(f)), CAMP_Y + 2, RIDE_Z] },
  { f: 1345, cInf: 14 },
  { f: 1385, cInf: 10 },
  { f: 1468, cInf: 10 },
  { f: 1552, cInf: 0 },
  { f: 1817, cInf: 8, focus: () => add(LOOKOUT, 0, 1.6, 0) },
  { f: 1913, cInf: 5 },
  { f: 2005, cInf: 0 },
  { f: 2087, cInf: 9 },
  { f: 2180, cInf: 11 },
  { f: 2283, cInf: 0 },
  { f: 2408, cInf: 8 },
  { f: 2451, cInf: 12 },
  { f: 2521, cInf: 0 },
  { f: 2694, cInf: 9 },
  { f: 2822, cInf: 13 },
  { f: 2881, cInf: 6, focus: () => add(LONE, 0, 1.5, 0) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { easeOut as eOut, FORT_C, FORT_Y, CAMP_C, CAMP_Y, ROOM, THRONE, WAR_TABLE, PARIS };
