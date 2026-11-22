// Timeline of "The Pearl Necklace That Came Home in the Post as Lumps of Sugar": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): a London street along x (cobbled road, raised
// pavements, terraced houses both sides; Mayer's shop at x = 0, the post counter at x = 40, the gang's doorway at
// x = -40, the café table at x = 80, the station at x = 120, Highbury at x = -110), Mayer's office (an open set at
// z = -300: plank floor, panelled back wall, his desk), a Paris street (z = 300, cream houses) and a home kitchen
// garden (x = 300). Camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard
// cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2040;
export const D0 = 1.2; // street level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** the street: road half-width RW (z in [-RW, RW]), pavements out to PW, raised by KERB */
export const RW = 4, PW = 7, KERB = 0.15, PY = D0 + KERB;
/** Mayer's shop door (north pavement), the post counter, the gang's doorway, the café table, the station, Highbury */
export const SHOP: V3 = [0, PY, -6.3], COUNTER: V3 = [40, PY, -5.6], DEN: V3 = [-40, PY, 5.6], CAFE: V3 = [80, PY, 5.4];
export const STATION: V3 = [120, PY, -5.4], HIGH: V3 = [-110, PY, 5.6], POSTER: V3 = [20, PY, -6.9], CHAIN: V3 = [60, PY, 5.6];
/** Mayer's office: desk centre (top at DESK_Y), Mayer stands behind it */
export const OFF: V3 = [0, D0, -300], DESK_Y = D0 + 0.12 + 0.9;
/** the Paris street and the home kitchen garden */
export const PAR: V3 = [0, D0, 300], HOME: V3 = [300, D0, 0];

// story beats (seconds on the voice clock)
export const T_OPENED = 2.90, T_PARCEL = 3.23, T_FOUND = 3.76, T_SUGAR = 4.49;
export const T_MAX = 5.31, T_HATTON = 6.10, T_OWNED = 6.83, T_PINK = 7.60, T_MONA = 8.50;
export const T_SENT = 10.20, T_PARIS = 10.62, T_SELL = 11.11, T_SALE = 11.78, T_FELL = 12.14;
export const T_CAME = 13.38, T_POST = 14.29, T_TIED = 14.90, T_SEALED = 15.45, T_WAX = 15.99;
export const T_SEALS = 16.94, T_FINE = 17.56, T_BUT = 17.94, T_GONE = 18.551;
export const T_SOMEWHERE = 19.48, T_OPENED2 = 20.85, T_SWAPPED = 21.49, T_SEALED2 = 22.20;
export const T_YOUSEE = 23.677, T_BOX = 24.30, T_HEAVY = 25.43, T_NOT = 26.45, T_LIKE = 27.36;
export const T_BISCUIT = 27.56, T_RATTLES = 28.70, T_NOONE = 29.35, T_TEA = 30.21;
export const T_SUGAR2 = 30.95, T_SAME = 31.46, T_FOOLED = 32.06, T_HAND = 32.70, T_CARRIED = 33.12;
export const T_LLOYDS = 34.01, T_REWARD = 35.08, T_SCOTLAND = 35.67, T_HUNTING = 36.65;
export const T_TRAIL = 37.61, T_GRIZZARD = 38.77, T_THIEF = 39.90, T_KING = 40.55, T_FENCES = 40.89;
export const T_DETECTIVES = 41.84, T_WATCHED = 42.44, T_WEEKS = 43.36, T_CAUGHT = 44.17, T_STATION = 44.86;
export const T_NOTONE = 45.73, T_PEARLS3 = 46.60;
export const T_TWO = 47.90, T_PIANO = 48.92, T_HORNE = 50.27, T_WALKED = 50.90, T_HIGHBURY = 51.38;
export const T_SAW = 52.38, T_DROP = 52.98, T_MATCHBOX = 53.25, T_GUTTER = 54.00, T_RUN = 54.49;
export const T_INSIDE = 55.30, T_BROKEN = 56.06, T_STRING = 56.49, T_PEARLS4 = 56.92;
export const T_GAVE = 57.95, T_BOY = 58.62, T_MARBLE = 59.14, T_TOOK = 59.75, T_POLICE = 60.52;
export const T_GREAT = 61.55, T_THEFT = 62.16, T_LONDON = 62.52, T_UNDONE = 63.11, T_SMALL = 64.06, T_MATCHBOX2 = 64.45;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "street" | "office" | "paris" | "home";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 150, "office"), mk(2, 150, 252, "street"), mk(3, 252, 300, "office"), mk(4, 300, 390, "paris"),
  mk(5, 390, 501, "street"), mk(6, 501, 582, "office"), mk(7, 582, 708, "street", "golden"), mk(8, 708, 818, "street"),
  mk(9, 818, 926, "home"), mk(10, 926, 1017, "street"), mk(11, 1017, 1122, "street"), mk(12, 1122, 1252, "street", "golden"),
  mk(13, 1252, 1322, "street"), mk(14, 1322, 1434, "street"), mk(15, 1434, 1564, "street"), mk(16, 1564, 1652, "street"),
  mk(17, 1652, 1732, "street"), mk(18, 1732, 1840, "street"), mk(19, 1840, TOTAL, "office"),
];
/** crossfades (frames) at place / time changes: the analogy (9), two weeks later (15), the ending (19) */
export const XFADE: Record<number, number> = { 9: 10, 15: 10, 19: 10 };
export const FLASH_AT = 150;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const fr = (t: number) => Math.round(t * FPS);

// ---------------- the story physics ----------------
/** the parcel lid with its string and seals lifting off (0 on the box .. 1 gone up out of frame), shot 6 */
export const lidOff = (t: number) => smooth((t - T_BUT + 0.1) / 0.45);
/** the swap at dusk (shot 7): the necklace goes into the coat (0 .. 1), the sugar goes into the box (0 .. 1) */
export const swapOut = (t: number) => smooth((t - T_SWAPPED + 0.1) / 0.6);
export const swapIn = (t: number) => smooth((t - T_SWAPPED - 0.3) / 0.6);
/** the parcel passed along the chain of postmen (shot 10): its x along the line */
export const chainX = (t: number) => {
  const u = clamp01((t - T_SUGAR2 + 0.1) / (T_CARRIED + 0.3 - T_SUGAR2));
  return CHAIN[0] + 1.15 - 2.3 * u;
};
/** Augustus Horne strolling along the Highbury pavement (shot 15): his x */
export const horneX = (t: number) => HIGH[0] - 2.0 + 0.55 * Math.max(0, t - T_TWO + 0.2);
/** the matchbox falling from the running man's hand into the gutter (shot 16): 0 in hand .. 1 in the gutter */
export const dropAt = (t: number) => clamp01((t - T_DROP + 0.07) / 0.45);

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

const Y = D0, [OX, , OZ] = OFF, [HX, , HZ] = HOME, [AX, , AZ] = PAR;
// shot 1 (hook): across the desk: Mayer stares into the opened parcel full of sugar; punch on "sugar"
const S1 = (f: number) => dolly([OX + 0.35, Y + 1.75, OZ + 3.3], [OX, Y + 1.25, OZ - 0.3], P(f, 0, T_SUGAR, 0.006), { fov: 44, roll: 0.03 });
// shot 2: Hatton Garden: the street of terraces, Mayer proud at his shop door; push on "Hatton Garden"
const S2 = (f: number) => dolly([SHOP[0] + 6.5, Y + 2.3, 3.2], [SHOP[0] - 0.8, Y + 1.7, -7.5], P(f, 150, T_HATTON), { fov: 50, roll: -0.03 });
// shot 3: close on the necklace on its tray on the desk, Mayer beaming behind it
const S3 = (f: number) => dolly([OX + 0.2, Y + 1.6, OZ + 1.9], [OX, Y + 1.2, OZ - 0.2], P(f, 252, T_MONA, 0.004), { fov: 42, roll: -0.03 });
// shot 4: Paris: the agent shows the case; the buyer shakes his head on "fell through"
const S4 = (f: number) => dolly([AX + 3.2, Y + 1.9, AZ + 6.0], [AX - 0.2, Y + 1.35, AZ - 0.2], P(f, 300, T_FELL), { fov: 46, roll: 0.03 });
// shot 5: the postman brings the parcel along the pavement to Mayer's door
const S5 = (f: number) => dolly([SHOP[0] + 5.8, Y + 2.0, 0.6], [SHOP[0] + 0.8, Y + 1.4, -6.4], P(f, 390, T_WAX, 0.004), { fov: 48, roll: 0.03 });
// shot 6: the desk: the sealed parcel; the lid comes off on "but"; nothing but sugar; kick on "gone"
const S6 = (f: number) => dolly([OX - 0.3, Y + 1.7, OZ + 2.8], [OX, Y + 1.2, OZ - 0.3], P(f, 501, T_GONE, 0.007), { fov: 44, roll: -0.04 });
// shot 7 (golden): dusk, the gang's doorway: the necklace out, the sugar in
const S7 = (f: number) => dolly([DEN[0] - 3.4, Y + 1.9, DEN[2] - 4.6], [DEN[0] + 0.1, Y + 1.25, DEN[2] + 0.3], P(f, 582, T_SWAPPED), { fov: 46, roll: 0.03 });
// shot 8: "You see": the post counter: a clerk hefts the parcel; push on "heavy"
const S8 = (f: number) => dolly([COUNTER[0] - 0.6, Y + 1.85, 0.4], [COUNTER[0], Y + 1.45, COUNTER[2] - 0.2], P(f, 708, T_HEAVY), { fov: 44, roll: -0.03 });
// shot 9: the analogy at home: a boy shakes the biscuit tin at the garden table
const S9 = (f: number) => dolly([HX + 0.4, Y + 1.5, HZ + 4.4], [HX, Y + 1.1, HZ - 0.2], P(f, 818, T_TEA), { fov: 44, roll: 0.03 });
// shot 10: three postmen pass the parcel hand to hand
const S10 = (f: number) => dolly([CHAIN[0] + 0.5, Y + 2.0, -2.2], [CHAIN[0], Y + 1.35, CHAIN[2] + 0.3], P(f, 926, T_HAND), { fov: 48, roll: 0.03 });
// shot 11: the reward poster on the wall; two detectives read it, then set off on "hunting"
const S11 = (f: number) => dolly([POSTER[0] + 2.2, Y + 1.9, 0.0], [POSTER[0] - 0.4, Y + 1.6, POSTER[2]], P(f, 1017, T_HUNTING), { fov: 48, roll: -0.03 });
// shot 12 (golden): Grizzard at his doorway; the crown on "King"
const S12 = (f: number) => dolly([DEN[0] + 2.8, Y + 1.8, DEN[2] - 4.6], [DEN[0] + 0.2, Y + 1.6, DEN[2] + 0.2], P(f, 1122, T_KING, 0.006), { fov: 44, roll: 0.03 });
// shot 13: from behind a lamp post across the road, a detective watches the gang at the café table
const S13 = (f: number) => dolly([CAFE[0] - 2.0, Y + 1.75, -0.8], [CAFE[0] - 0.4, Y + 1.25, CAFE[2] - 1.4], P(f, 1252, T_WEEKS), { fov: 46, roll: -0.03 });
// shot 14: the station: the detectives grab the gang; kick on "caught"; shrugs on "not one"
const S14 = (f: number) => dolly([STATION[0] + 0.8, Y + 2.0, 2.6], [STATION[0], Y + 1.4, STATION[2] - 0.6], P(f, 1322, T_NOTONE), { fov: 50, roll: 0.03 });
// shot 15: two weeks later, Highbury: Augustus Horne walks along the pavement toward us
const S15 = (f: number) => { const x = horneX(f / FPS) - 0.3;
  return dolly([x - 0.6, Y + 1.8, HIGH[2] - 5.2], [x, Y + 1.4, HIGH[2] + 0.2], P(f, 1434, T_HIGHBURY, 0.004), { fov: 46, roll: -0.03 }); };
// shot 16: a man drops the matchbox into the gutter and runs off; Horne stares
const S16 = (f: number) => dolly([HIGH[0] + 0.6, Y + 1.7, -0.9], [HIGH[0] - 0.9, Y + 1.0, HIGH[2] - 1.2], P(f, 1564, T_GUTTER), { fov: 48, roll: 0.03 });
// shot 17: looking down into the gutter: the open matchbox and its broken string of pearls
const S17 = (f: number) => dolly([HIGH[0] - 1.6 + 0.35, Y + 1.25, RW - 0.2 - 0.9], [HIGH[0] - 1.6, Y + 0.02, RW - 0.25], P(f, 1652, T_PEARLS4, 0.005), { fov: 42, roll: -0.03 });
// shot 18: Horne gives the boy a pearl, then turns to the constable
const S18 = (f: number) => dolly([HIGH[0] + 0.5, Y + 1.8, HIGH[2] - 5.0], [HIGH[0] + 0.2, Y + 1.3, HIGH[2] + 0.2], P(f, 1732, T_POLICE), { fov: 46, roll: 0.03 });
// shot 19 (golden): the office: the pearls back on the desk beside the matchbox, Mayer laughing; push on "matchbox"
const S19 = (f: number) => dolly([OX - 0.25, Y + 1.7, OZ + 3.4], [OX, Y + 1.25, OZ - 0.3], P(f, 1840, T_MATCHBOX2, 0.004), { fov: 44, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 150, s: S2 }], 3: [{ f: 252, s: S3 }], 4: [{ f: 300, s: S4 }], 5: [{ f: 390, s: S5 }],
  6: [{ f: 501, s: S6 }], 7: [{ f: 582, s: S7 }], 8: [{ f: 708, s: S8 }], 9: [{ f: 818, s: S9 }], 10: [{ f: 926, s: S10 }],
  11: [{ f: 1017, s: S11 }], 12: [{ f: 1122, s: S12 }], 13: [{ f: 1252, s: S13 }], 14: [{ f: 1322, s: S14 }],
  15: [{ f: 1434, s: S15 }], 16: [{ f: 1564, s: S16 }], 17: [{ f: 1652, s: S17 }], 18: [{ f: 1732, s: S18 }],
  19: [{ f: 1840, s: S19 }],
};

// impact kicks: [seconds, strength]: the pearls gone, the arrest
const KICKS: [number, number][] = [[T_GONE - 2 / 30, 0.3], [T_CAUGHT - 2 / 30, 0.35]];
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
/** where Mayer stands behind his desk */
export const MAYER_AT: V3 = [OX + 0.05, D0 + 0.12, OZ - 1.0];
export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: at([OX, DESK_Y + 0.15, OZ + 0.05]) },
  { f: 150, cInf: 0 },
  { f: 252, cInf: 14, focus: at([OX, DESK_Y + 0.1, OZ + 0.1]) },
  { f: 300, cInf: 10, focus: at([AX, Y + 1.6, AZ]) },
  { f: 390, cInf: 0 },
  { f: 501, cInf: 13, focus: at([OX, DESK_Y + 0.15, OZ + 0.05]) },
  { f: 582, cInf: 11, focus: at([DEN[0], Y + 1.5, DEN[2]]) },
  { f: 708, cInf: 12, focus: at([COUNTER[0], Y + 1.6, COUNTER[2] - 0.3]) },
  { f: 818, cInf: 12, focus: at([HX, Y + 1.0, HZ - 0.4]) },
  { f: 926, cInf: 7, focus: at([CHAIN[0], Y + 1.5, CHAIN[2]]) },
  { f: 1017, cInf: 0 },
  { f: 1122, cInf: 12, focus: at([DEN[0] + 0.2, Y + 1.7, DEN[2] + 0.2]) },
  { f: 1252, cInf: 10, focus: at([CAFE[0] + 0.4, Y + 1.6, CAFE[2] + 0.3]) },
  { f: 1322, cInf: 0 },
  { f: 1434, cInf: 7, focus: at([HIGH[0] - 0.6, Y + 1.6, HIGH[2] - 1.0]) },
  { f: 1564, cInf: 0 },
  { f: 1652, cInf: 14, focus: at([HIGH[0] - 1.6, Y + 0.02, RW - 0.25]) },
  { f: 1732, cInf: 11, focus: at([HIGH[0] + 0.4, Y + 1.5, HIGH[2]]) },
  { f: 1840, cInf: 12, focus: at([MAYER_AT[0], Y + 1.7, MAYER_AT[2]]) },
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
  { a: 818, b: 926, kit: "plant_bush", pos: [HX - 1.9, D0, HZ + 2.2], s: 0.8 },
  { a: 390, b: 501, kit: "lantern", pos: [SHOP[0] + 4.4, PY, -4.4], s: 3.0 },
];
void AZ; void HZ;
