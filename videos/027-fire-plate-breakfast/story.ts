// Timeline of "The King and Queen Ate Breakfast Above a Fire": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): Putney Heath at the origin (David Hartley's
// fire-proof house, open at the front for the cutaway shots, with the fire room below, the breakfast room above and
// the layered floor between them; the obelisk beside it), a London street at x = SX, a kitchen at x = KX and the
// Paris room at z = PR[2].
// Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1950;
export const D0 = 1.2; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the house: x -HW..HW, z -HD..HD, open front at z = HD in the cutaway shots */
export const HW = 5, HD = 3.5;
/** the floor between the rooms: ceiling underside at F1, top of the upper floorboards at UF */
export const F1 = D0 + 3.0, UF = F1 + 0.385;
/** the floor layers, bottom to top (heights above F1): ceiling boards, joists, lower boards, iron plate, upper boards */
export const LAYER = { ceil: 0.06, joist: 0.18, low: 0.05, iron: 0.045, top: 0.05 };
export const EAVE = UF + 3.0;
export const TABLE_Y = UF + 0.78; // the breakfast table top
export const TAB: V3 = [-0.8, UF, -1.2]; // the table centre
export const FIRE: V3 = [-0.8, D0, -0.9]; // the fire on the floor below, right under the table
export const OB: V3 = [8.5, D0, 5.5]; // the obelisk
export const SX = 600; // the London street
export const KX = -600; // the kitchen
export const PR: V3 = [0, D0, 600]; // the Paris room
export const WALK_Y = 0.18;

// story beats (seconds on the voice clock)
export const T_KING = 2.13, T_BREAK = 4.17, T_FIRE = 4.97, T_FEET = 6.33;
export const T_HOUSE = 7.2, T_HEATH = 8.1, T_HARTLEY = 10.23, T_PROUD = 12.1, T_THIN = 12.97, T_IRON = 13.23, T_FLOOR = 14.47;
export const T_FEARED = 16.23, T_GREAT = 16.93, T_PAID = 18.4, T_WORKED = 20.23;
export const T_SET = 21.43, T_FIRES = 21.73, T_AGAIN = 23.43, T_MAYOR = 24.33, T_WATCHED = 25.0, T_ABOVE = 25.8;
export const T_STORY = 27.23, T_SAT = 28.7, T_BREAK2 = 29.33, T_FLAMES = 30.57, T_ROARED = 31.03;
export const T_BLACK = 33.43, T_EVERY = 34.0, T_GIVE = 35.33, T_NEVER = 36.35;
export const T_SEE = 37.54, T_AIR = 38.73, T_CLIMB = 40.0, T_IRON2 = 40.97, T_LID = 42.1, T_SLAM = 42.47, T_PAN = 43.9, T_NOWHERE = 45.1;
export const T_CITY = 46.5, T_FREEMAN = 47.43, T_STONE = 48.7, T_OBEL = 49.2, T_FORGOT = 51.67;
export const T_NINE = 53.1, T_PEACE = 54.3, T_WAR = 55.77, T_SIGNED = 56.4, T_PARIS = 57.97;
export const T_MAN = 59.0, T_STOP = 61.17, T_WAR2 = 61.53;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "heath" | "cut" | "street" | "kitchen" | "paris";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 147, "cut"), mk(2, 147, 210, "cut"), mk(3, 210, 305, "heath"), mk(4, 305, 386, "heath"), mk(5, 386, 465, "cut"),
  mk(6, 465, 628, "street"), mk(7, 628, 805, "cut"), mk(8, 805, 960, "cut"), mk(9, 960, 1118, "cut"), mk(10, 1118, 1218, "cut"),
  mk(11, 1218, 1388, "kitchen"), mk(12, 1388, 1520, "heath"), mk(13, 1520, 1588, "heath", "golden"), mk(14, 1588, 1760, "paris"),
  mk(15, 1760, TOTAL, "heath", "golden"),
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 3: 8, 6: 8, 7: 8, 11: 8, 12: 8, 13: 10, 14: 8, 15: 10 };
export const FLASH_AT = 210;
/** the open-front (cutaway) shots hide the front wall */
export const CUTAWAY = (id: number) => SHOTS[id - 1].scene === "cut";
/** how black the ceiling boards are in shot id at t (0 clean .. 1 charred) */
export const charAt = (id: number, t: number) => (id < 9 ? 0 : id > 9 ? 1 : smooth((t - T_BLACK + 0.6) / 1.2));

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
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const P = (f: number, a: number, t: number, punch = 0.005) => pushK(f, a, 0.0017, 0, 30) * pushK(f, fr(t) - 3, 0, punch, 25);
const Y = D0;

// where the people stand (used by cast.ts too)
export const KING_AT: V3 = [-1.25, TABLE_Y - 0.5, -1.8]; // seated behind the table
export const QUEEN_AT: V3 = [-0.3, TABLE_Y - 0.5, -1.8];
export const MAYOR_UP: V3 = [1.3, UF, -1.6]; // the Lord Mayor standing upstairs
export const HART_DOWN: V3 = [0.9, Y, 0.5]; // Hartley by the fire below
export const HART_DOOR: V3 = [1.0, Y, 4.6]; // Hartley at his front door
export const NEWS: V3 = [SX - 6, Y + WALK_Y, -5.8]; // Hartley on the London pavement
export const COOK: V3 = [KX + 0.4, Y, -0.9];
const HEADS: V3 = [-0.78, TABLE_Y + 0.45, -1.8]; // the royal faces
const SLAB: V3 = [1.0, F1 + 0.18, HD]; // the cut edge of the floor

// shot 1 (hook): the King and Queen at breakfast upstairs
const S1 = (f: number) => dolly([-0.45, TABLE_Y + 0.5, 3.0], HEADS, P(f, 0, T_BREAK, 0.006), { fov: 40, roll: 0.03 });
// shot 2: on "fire": the flames on the floor below, then a glide back to show both rooms, the royals right above
const S2a = (f: number) => dolly([-0.2, Y + 1.0, 3.0], [FIRE[0], Y + 0.7, FIRE[2]], pushK(f, 147, 0.002), { fov: 44, roll: -0.03 });
const S2b = (f: number) => dolly([0.6, Y + 3.1, 10.5], [-0.7, Y + 3.0, -1.0], P(f, 165, T_FEET, 0.004), { fov: 46, roll: -0.03 });
// shot 3: Putney Heath, wide: the lone brick house among the trees, Hartley walking up
const S3 = (f: number) => dolly([9, Y + 3.2, 22], [0, Y + 3.4, 0], P(f, 210, T_HARTLEY, 0.003), { fov: 46, roll: 0.03 });
// shot 4: Hartley at his front door with an iron plate
const S4 = (f: number) => dolly([HART_DOOR[0] + 0.8, Y + 1.65, HART_DOOR[2] + 3.8], [HART_DOOR[0] - 0.1, Y + 1.45, HART_DOOR[2]], P(f, 305, T_PROUD, 0.006), { fov: 40, roll: 0.03 });
// shot 5: the cut edge of the floor: boards, the thin iron plate, boards, joists, ceiling
const S5 = (f: number) => dolly([SLAB[0] + 0.05, SLAB[1] + 0.1, SLAB[2] + 1.45], [SLAB[0], SLAB[1], SLAB[2]], P(f, 386, T_FLOOR, 0.005), { fov: 30, roll: -0.03 });
// shot 6: a London street: Parliament's money handed over
const S6 = (f: number) => dolly([NEWS[0] + 2.0, Y + 1.7, NEWS[2] + 6.2], [NEWS[0] + 0.6, Y + 1.4, NEWS[2]], P(f, 465, T_PAID, 0.005), { fov: 44, roll: -0.03 });
// shot 7: Hartley lights a fire below, then a glide up to the Lord Mayor watching from the room above
const S7a = (f: number) => dolly([1.0, Y + 1.7, 7.2], [0.1, Y + 1.2, -0.2], P(f, 628, T_FIRES, 0.005), { fov: 44, roll: 0.03 });
const S7b = (f: number) => dolly([1.3, UF + 1.75, 6.2], [0.6, UF + 1.35, -1.2], P(f, fr(T_MAYOR) - 3, T_WATCHED, 0.004), { fov: 44, roll: 0.03 });
// shot 8: wide cutaway: the royals sit down upstairs, the flames roar below
const S8 = (f: number) => dolly([0.8, Y + 3.3, 12.0], [-0.5, Y + 3.1, -1.0], P(f, 805, T_ROARED, 0.006), { fov: 46, roll: -0.03 });
// shot 9: below, looking up at the ceiling going black; cut upstairs to the waiting faces
const S9a = (f: number) => dolly([0.6, Y + 0.6, 2.8], [-0.5, F1 + 0.1, -0.6], P(f, 960, T_BLACK, 0.005), { fov: 50, roll: 0.03 });
const S9b = (f: number) => dolly([-0.6, TABLE_Y + 0.55, 3.2], [-0.78, TABLE_Y + 0.45, -1.8], P(f, fr(T_EVERY) - 2, T_NEVER, 0.007), { fov: 44, roll: 0.03 });
// shot 10: the floor's cut edge again, the flames pressing up under it and stopping
const S10 = (f: number) => dolly([SLAB[0] + 0.12, SLAB[1] - 0.3, SLAB[2] + 2.0], [SLAB[0], SLAB[1] - 0.4, SLAB[2]], P(f, 1118, T_CLIMB, 0.005), { fov: 40, roll: 0.03 });
// shot 11: a kitchen: a cook slams a lid on a burning frying pan
const S11 = (f: number) => dolly([COOK[0] + 0.7, Y + 1.55, COOK[2] + 4.4], [COOK[0] - 0.1, Y + 1.25, COOK[2]], P(f, 1218, T_SLAM, 0.008), { fov: 42, roll: -0.03 });
// shot 12: the heath: the new obelisk beside the house, the Lord Mayor and Hartley
const S12 = (f: number) => dolly([OB[0] + 6.0, Y + 1.9, OB[2] + 13.0], [OB[0] - 1.0, Y + 3.2, OB[2] - 0.5], P(f, 1388, T_FREEMAN, 0.004), { fov: 46, roll: 0.03 });
// shot 13: evening, years on: the obelisk alone, the house a mansion
const S13 = (f: number) => dolly([OB[0] + 8.5, Y + 2.0, OB[2] + 13], [OB[0] - 4.5, Y + 3.0, OB[2] - 3.5], P(f, 1520, T_FORGOT, 0.003), { fov: 48, roll: -0.03 });
// shot 14: Paris: the treaty signed at Hartley's table
const S14 = (f: number) => dolly([PR[0] + 1.0, Y + 1.95, PR[2] + 4.3], [PR[0] + 0.4, Y + 1.3, PR[2] - 1.1], P(f, 1588, T_SIGNED, 0.006), { fov: 44, roll: -0.03 });
// shot 15: sunset on the heath: Hartley by his obelisk
const S15 = (f: number) => dolly([OB[0] + 3.2, Y + 1.3, OB[2] + 10.5], [OB[0] + 0.4, Y + 2.5, OB[2]], P(f, 1760, T_STOP, 0.003), { fov: 50, roll: 0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 147, s: S2a }, { f: 165, dur: 36, s: S2b }], 3: [{ f: 210, s: S3 }], 4: [{ f: 305, s: S4 }], 5: [{ f: 386, s: S5 }],
  6: [{ f: 465, s: S6 }], 7: [{ f: 628, s: S7a }, { f: fr(T_MAYOR) - 3, dur: 32, s: S7b }], 8: [{ f: 805, s: S8 }],
  9: [{ f: 960, s: S9a }, { f: fr(T_EVERY) - 2, cut: true, s: S9b }], 10: [{ f: 1118, s: S10 }], 11: [{ f: 1218, s: S11 }],
  12: [{ f: 1388, s: S12 }], 13: [{ f: 1520, s: S13 }], 14: [{ f: 1588, s: S14 }], 15: [{ f: 1760, s: S15 }],
};
/** in-shot camera cuts (frames), listed in shots.json `planned` */
export const CUT_FRAMES = [fr(T_EVERY) - 2];

// impact kicks: [seconds, strength]: the flames roar, the lid slams
const KICKS: [number, number][] = [[T_ROARED - 2 / 30, 0.25], [T_SLAM - 2 / 30, 0.35]];
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
const head = (p: V3, dy = 1.75): V3 => [p[0], p[1] + dy, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: at(HEADS) },
  { f: 147, cInf: 12, focus: at([FIRE[0], Y + 0.7, FIRE[2]]) },
  { f: 165, dur: 36, cInf: 0 },
  { f: 210, cInf: 0 },
  { f: 305, cInf: 12, focus: at(head(HART_DOOR)) },
  { f: 386, cInf: 12, focus: at(SLAB) },
  { f: 465, cInf: 11, focus: at(head(NEWS)) },
  { f: 628, cInf: 7, focus: at(head(HART_DOWN)) },
  { f: fr(T_MAYOR) - 3, dur: 32, cInf: 7, focus: at(head(MAYOR_UP)) },
  { f: 805, cInf: 0 },
  { f: 960, cInf: 10, focus: at([-0.5, F1, -0.6]) },
  { f: fr(T_EVERY) - 2, cInf: 13, focus: at([-0.3, TABLE_Y + 0.5, -1.8]) },
  { f: 1118, cInf: 12, focus: at([SLAB[0], SLAB[1] - 0.2, SLAB[2]]) },
  { f: 1218, cInf: 12, focus: at(head(COOK, 1.4)) },
  { f: 1388, cInf: 0 },
  { f: 1520, cInf: 0 },
  { f: 1588, cInf: 10, focus: at([PR[0], Y + 1.6, PR[2] - 1.2]) },
  { f: 1760, cInf: 5, focus: at([OB[0] + 1.0, Y + 1.75, OB[2] + 3.0]) },
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
  { a: 465, b: 628, kit: "lantern", pos: [NEWS[0] + 2.9, Y + WALK_Y, NEWS[2] + 3.3], s: 3.0 },
  { a: 1388, b: 1520, kit: "tree_oak", pos: [OB[0] + 10.5, Y, OB[2] + 12.5], s: 8.0 },
];
