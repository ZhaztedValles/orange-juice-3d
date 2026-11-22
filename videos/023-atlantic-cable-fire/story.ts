// Timeline of "New York Burned Its Own City Hall Celebrating a Wire Under the Atlantic": shots timed to words.json.
// One world with places far apart (beyond the fog of each other): New York's City Hall Park (z ~ -430, the hall with
// its cupola facing +z across a lawn), the telegraph office (an open set at x = 300), the garden of the hose analogy
// (x = -300) and the open Atlantic (sea level y = 0, z > 0) with the two cable ships. Land is at D0. Camera grammar
// of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1995;
export const D0 = 1.2; // land level (m); the sea is at y = 0
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- places ----------------
/** City Hall: centre of its front wall (z = HALL[2]); the cupola sits on the centre block; the crowd stands on the lawn */
export const HALL: V3 = [0, D0, -430];
export const DOME: V3 = [0, D0 + 17.2, -434.5];
/** the telegraph office (desk centre, top at DESK_Y) and the garden of the analogy */
export const OFF: V3 = [300, D0, -400], DESK_Y = D0 + 0.12 + 0.9;
export const HOME: V3 = [-300, D0, -400];
/** the ships: deck height above the sea; the sea scene centre */
export const DECK = 3.0, SEA: V3 = [0, 0, 300];

// story beats (seconds on the voice clock)
export const T_CHEERED = 2.29, T_WIRE = 2.66, T_SET = 3.77, T_FIRE = 4.99;
export const T_WIRE2 = 5.97, T_SEA = 7.36, T_MILES = 8.62, T_IRELAND = 9.51, T_NEWF = 10.10;
export const T_CYRUS = 11.25, T_SNAP = 13.31, T_SINK = 13.74, T_SUMMER = 14.71, T_WARSHIPS = 15.30, T_MET = 15.78;
export const T_TIED = 16.80, T_STEAMED = 17.66, T_APART = 18.04, T_THIS = 18.84, T_HELD = 19.82;
export const T_QUEEN = 20.59, T_SENT = 21.49, T_WORDS = 22.35, T_PRES = 22.88, T_TOOK = 23.88, T_SIXTEEN = 24.55, T_HOURS = 25.11;
export const T_NOBODY = 26.45, T_FIREWORKS = 27.34, T_BURST = 27.94, T_HALL = 28.70;
export const T_SPARKS = 29.44, T_ROOF = 30.43, T_MORNING = 31.15, T_DOME = 31.56, T_FLAMES = 32.16;
export const T_BUT = 33.05, T_SIGNAL = 34.01, T_FADING = 34.56, T_CLICK = 35.49, T_WEAKER = 35.76, T_LAST = 36.30;
export const T_SO = 37.14, T_WILDMAN = 38.62, T_PUSHED = 39.85, T_HARDER = 40.10, T_VOLTS = 41.42;
export const T_YOUSEE = 42.26, T_HOSE = 45.10, T_CRACK = 45.62, T_TURN = 46.54, T_TAP = 46.85, T_UP = 47.62;
export const T_WATER = 47.98, T_NOT = 48.52, T_BURSTS = 49.89, T_CRACK2 = 50.55;
export const T_WITHIN = 51.73, T_DEAD = 53.09, T_PAPERS = 54.09, T_WONDERED = 54.54, T_ALL = 56.38;
export const T_EIGHT = 57.16, T_FIELD2 = 57.99, T_LAID = 58.33, T_WORKED = 59.08;
export const T_BUT2 = 59.77, T_BURNED = 60.51, T_CHAT = 61.69, T_WEEKS = 62.85;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "nyc" | "sea" | "deck" | "office" | "garden";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 150, "nyc", "golden"), mk(2, 150, 330, "sea"), mk(3, 330, 430, "deck"), mk(4, 430, 560, "sea"),
  mk(5, 560, 615, "deck"), mk(6, 615, 790, "office"), mk(7, 790, 880, "nyc", "golden"), mk(8, 880, 1000, "nyc", "golden"),
  mk(9, 1000, 1115, "office"), mk(10, 1115, 1265, "office"), mk(11, 1265, 1545, "garden"), mk(12, 1545, 1625, "office"),
  mk(13, 1625, 1715, "nyc"), mk(14, 1715, 1795, "deck"), mk(15, 1795, TOTAL, "nyc", "golden"),
];
/** crossfades (frames) at place / time changes: the analogy (11), eight years later (14), the ending (15) */
export const XFADE: Record<number, number> = { 11: 10, 14: 10, 15: 10 };
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
/** the ships (local +x = bow, waterline y = 0): position and heading per shot; null = not in the shot */
export type ShipPose = { p: V3; yaw: number };
const [SX0, , SZ0] = SEA;
export const shipAt = (kind: "niagara" | "agam", id: number, t: number): ShipPose | null => {
  if (kind === "niagara") {
    if (id === 2) return { p: [SX0 - 10 + 1.6 * (t - 5), 0, SZ0], yaw: 0 };
    if (id === 3 || id === 5) return { p: [SX0, 0, SZ0], yaw: 0 };
    if (id === 4) return { p: [SX0 + 26 + 3.2 * Math.max(0, t - T_STEAMED + 0.1), 0, SZ0], yaw: 0 };
    return null;
  }
  if (id === 4) return { p: [SX0 - 26 - 3.2 * Math.max(0, t - T_STEAMED + 0.1), 0, SZ0 + 2], yaw: Math.PI };
  if (id === 14) return { p: [SX0, 0, SZ0], yaw: 0 };
  return null;
};
/** the stern of a ship pose (where the cable leaves it), at deck height + rail */
export const sternOf = (s: ShipPose): V3 => [s.p[0] - 22 * Math.cos(s.yaw), DECK + 0.6, s.p[2] + 22 * Math.sin(s.yaw)];
/** the cable snapping in shot 3: 0 taut .. 1 gone */
export const snapAt = (t: number) => clamp01((t - T_SNAP + 0.07) / 0.5);
/** the water from the hose (shot 11): the tap opening 0..1, the crack bursting 0..1 */
export const tapAt = (t: number) => smooth((t - T_TAP + 0.1) / 0.8);
export const burstAt = (t: number) => clamp01((t - T_BURSTS + 0.07) / 0.6);
/** the fire on the dome: 0 none .. 1 full flames (shot 8); shot 1 shows it catching on "fire" */
export const fireAt = (id: number, t: number) =>
  id === 1 ? smooth((t - T_FIRE + 0.6) / 0.6) : id === 8 ? 0.25 * smooth((t - T_ROOF + 0.1) / 0.6) + 0.75 * smooth((t - T_FLAMES + 0.25) / 0.4) : 0;

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

const Y = D0, [HX0, , HZ0] = HALL, [OX, , OZ] = OFF, [GX, , GZ] = HOME;
/** where the operator stands behind the desk, and the battery bench of Whitehouse */
export const OPER_AT: V3 = [OX + 0.05, D0 + 0.12, OZ - 1.0];
export const BATT: V3 = [OX + 2.6, D0 + 0.12, OZ - 1.4];
// shot 1 (hook, golden): the lawn: the crowd cheers under fireworks; the cupola catches fire on "fire"
const S1 = (f: number) => dolly([HX0 + 6, Y + 2.0, HZ0 + 38], [HX0, Y + 4.8, HZ0 - 2], P(f, 0, T_FIRE, 0.006), { fov: 50, roll: 0.03 });
// shot 2: the sea: the Niagara pays out the cable from her stern into the water
const S2 = (f: number) => { const s = shipAt("niagara", 2, f / FPS)!, x = s.p[0];
  return dolly([x - 52, 9, SZ0 + 46], [x - 16, 2.6, SZ0], P(f, 150, T_NEWF, 0.003), { fov: 46, roll: -0.03 }); };
// shot 3: the deck: Cyrus Field by the cable drum; the cable snaps on "snap"
const S3 = (f: number) => dolly([SX0 - 14.5, DECK + 3.0, SZ0 - 3.3], [SX0 - 22, DECK + 0.8, SZ0 + 0.8], P(f, 330, T_SNAP, 0.004), { fov: 48, roll: 0.03 });
// shot 4: from high up: the two ships stern to stern, the cable joined between them; they steam apart
const S4 = (f: number) => dolly([SX0 + 6, 46, SZ0 + 80], [SX0, 1.5, SZ0], P(f, 430, T_STEAMED, 0.002), { fov: 56, roll: -0.03 });
// shot 5: the deck again: the sailors and Field cheer, the cable holds over the stern
const S5 = (f: number) => dolly([SX0 - 21.0, DECK + 2.0, SZ0 - 5.0], [SX0 - 14.5, DECK + 1.4, SZ0 - 1.4], P(f, 560, T_HELD, 0.007), { fov: 50, roll: -0.03 });
// shot 6: the telegraph office: the operator at the desk, the tape of the Queen's message creeping out
const S6 = (f: number) => dolly([OX + 0.5, Y + 1.75, OZ + 3.4], [OX + 0.1, Y + 1.3, OZ - 0.4], P(f, 615, T_SIXTEEN, 0.005), { fov: 46, roll: 0.03 });
// shot 7 (golden): the lawn from the side: fireworks burst over City Hall
const S7 = (f: number) => dolly([HX0 - 14, Y + 2.0, HZ0 + 38], [HX0 - 1, Y + 4.8, HZ0 - 3], P(f, 790, T_FIREWORKS, 0.005), { fov: 52, roll: -0.03 });
// shot 8 (golden): close on the cupola: sparks drop onto the roof; smoke, then flames on "flames"
const S8 = (f: number) => dolly([HX0 + 7, Y + 12.5, HZ0 + 24], [DOME[0], DOME[1] - 0.5, DOME[2]], P(f, 880, T_FLAMES, 0.006), { fov: 46, roll: 0.03 });
// shot 9: the office: the operator listens hard, each click smaller
const S9 = (f: number) => dolly([OX - 0.6, Y + 1.7, OZ + 2.4], [OX, Y + 1.4, OZ - 0.6], P(f, 1000, T_WEAKER, 0.005), { fov: 44, roll: -0.03 });
// shot 10: Whitehouse at his battery bench: he pushes the lever, sparks on "volts"
const S10 = (f: number) => dolly([BATT[0] - 0.4, Y + 1.9, BATT[2] + 4.8], [BATT[0] - 0.2, Y + 1.3, BATT[2]], P(f, 1115, T_VOLTS, 0.007), { fov: 46, roll: 0.03 });
// shot 11: the analogy: a garden hose with a crack; the tap goes up, the water bursts out of the crack
const S11 = (f: number) => dolly([GX + 0.3, Y + 2.4, GZ + 7.5], [GX, Y + 0.9, GZ], P(f, 1265, T_BURSTS, 0.006), { fov: 50, roll: -0.03 });
// shot 12: the office: the line is dead; the operator slumps, Whitehouse stares
const S12 = (f: number) => dolly([OX + 1.2, Y + 1.8, OZ + 4.2], [OX + 0.75, Y + 1.3, OZ - 0.8], P(f, 1545, T_DEAD, 0.007), { fov: 48, roll: 0.03 });
// shot 13: day on the lawn: a newsboy waves his paper, people scratch their heads; the burnt cupola behind
const S13 = (f: number) => dolly([HX0 + 8, Y + 1.9, HZ0 + 30], [HX0 + 2, Y + 4.5, HZ0 + 14], P(f, 1625, T_WONDERED), { fov: 50, roll: -0.03 });
// shot 14: eight years later: Field on a new ship's deck, the cable working
const S14 = (f: number) => dolly([SX0 - 9.5, DECK + 2.0, SZ0 + 2.6], [SX0 - 17, DECK + 1.4, SZ0 - 2.0], P(f, 1715, T_WORKED, 0.006), { fov: 46, roll: 0.03 });
// shot 15 (golden): City Hall with its burnt, smoking cupola; two citizens shrug; push on "chat"
const S15 = (f: number) => dolly([HX0 - 5, Y + 2.0, HZ0 + 36], [HX0, Y + 4.8, HZ0 - 2], P(f, 1795, T_CHAT, 0.005), { fov: 50, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }], 2: [{ f: 150, s: S2 }], 3: [{ f: 330, s: S3 }], 4: [{ f: 430, s: S4 }], 5: [{ f: 560, s: S5 }],
  6: [{ f: 615, s: S6 }], 7: [{ f: 790, s: S7 }], 8: [{ f: 880, s: S8 }], 9: [{ f: 1000, s: S9 }], 10: [{ f: 1115, s: S10 }],
  11: [{ f: 1265, s: S11 }], 12: [{ f: 1545, s: S12 }], 13: [{ f: 1625, s: S13 }], 14: [{ f: 1715, s: S14 }],
  15: [{ f: 1795, s: S15 }],
};

// impact kicks: [seconds, strength]: the cable snaps, the flames, the volts, the dead line
const KICKS: [number, number][] = [[T_SNAP - 2 / 30, 0.3], [T_FLAMES - 2 / 30, 0.3], [T_VOLTS - 2 / 30, 0.35], [T_DEAD - 2 / 30, 0.25]];
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
/** where Field stands on the deck (shots 3, 5, 14) */
export const FIELD_AT: V3 = [SX0 - 15.2, DECK + 0.06, SZ0 - 2.2];
/** where Field stands by the stern rail in shot 3 */
export const FIELD3: V3 = [SX0 - 18.6, DECK + 0.06, SZ0 - 1.6];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 330, cInf: 11, focus: at([FIELD3[0], DECK + 1.7, FIELD3[2]]) },
  { f: 430, cInf: 0 },
  { f: 560, cInf: 10, focus: at([FIELD_AT[0], DECK + 1.7, FIELD_AT[2]]) },
  { f: 615, cInf: 12, focus: at([OPER_AT[0], Y + 1.7, OPER_AT[2]]) },
  { f: 790, cInf: 0 },
  { f: 880, cInf: 7, focus: at(DOME) },
  { f: 1000, cInf: 13, focus: at([OPER_AT[0], Y + 1.7, OPER_AT[2]]) },
  { f: 1115, cInf: 12, focus: at([BATT[0] - 0.4, Y + 1.7, BATT[2] + 0.3]) },
  { f: 1265, cInf: 10, focus: at([GX, Y + 0.6, GZ]) },
  { f: 1545, cInf: 11, focus: at([OPER_AT[0] + 0.8, Y + 1.7, OPER_AT[2]]) },
  { f: 1625, cInf: 7, focus: at([HX0 + 3, Y + 1.6, HZ0 + 20]) },
  { f: 1715, cInf: 10, focus: at([FIELD_AT[0], DECK + 1.7, FIELD_AT[2]]) },
  { f: 1795, cInf: 0 },
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
  { a: 1265, b: 1545, kit: "plant_bush", pos: [GX - 2.3, D0, GZ + 3.0], s: 0.9 },
  { a: 790, b: 880, kit: "tree_oak", pos: [HX0 - 19, D0, HZ0 + 33], s: 9.0 },
  { a: 1625, b: 1715, kit: "lantern", pos: [HX0 + 5.2, D0, HZ0 + 27], s: 3.0 },
];
void OZ; void GZ;
