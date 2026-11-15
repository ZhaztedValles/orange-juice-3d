// Timeline of "In 1862 a Balloon Pilot Saved Two Lives by Pulling a Rope With His Teeth, Five Miles Up": shots timed to
// words.json. Three places on one big ground: the Wolverhampton gasworks yard (the balloon on the ground, the crowd,
// the gasholder), the sky five miles up (the balloon alone over a deck of clouds, the ground lost in the haze) and a
// cottage garden at sunset (the stack of pillows of the analogy). Camera grammar of the bridge template: slow
// push-ins, smootherstep glides of 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2034;
export const D0 = 6.0; // ground level (m)
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the gasworks yard: the balloon stands on the cobbles at the origin, the gasholder behind it to the north-west */
export const YARD: V3 = [0, D0, 0];
export const GASHOLDER: V3 = [-24, D0, -26];
/** the balloon five miles up: the basket floor's height in the sky shots */
export const SKY_Y = D0 + 420;
/** low over the fields at sunset (the payoff) */
export const LOW_Y = D0 + 55;
/** the cottage garden of the pillow analogy */
export const PIL: V3 = [420, D0, 0];
/** the balloon (basket-floor frame): basket 1.5 m square, rim 0.95 m, the load ring, the envelope's neck and top */
export const BASKET = 0.75, RIM = 0.95, RING_Y = 3.3, RING_R = 0.8, NECK_Y = 5.4, ENV_R = 7.2, ENV_C = NECK_Y + 7.4, TOP_Y = ENV_C + ENV_R * 1.02;
/** the two men in the basket (local x, z) */
export const GLA: [number, number] = [-0.34, 0.12];
export const COX: [number, number] = [0.36, 0.12];

// story beats (seconds on the voice clock)
export const T_TEETH = 4.06; // "teeth,"
export const T_FIVE = 4.66; // "five miles"
export const T_HENRY = 9.93; // "Henry Coxwell"
export const T_ROSE = 13.55; // "rose"
export const T_THERMO = 20.32; // "thermometer"
export const T_FREEZE = 21.79; // "freezing."
export const T_SLOWED = 27.39; // "slowed,"
export const T_LIMP = 28.66; // "limp,"
export const T_SAW = 31.43; // "saw"
export const T_TANGLED = 32.4; // "tangled,"
export const T_CLIMBED = 32.98; // "climbed"
export const T_DOWN = 35.5; // "down,"
export const T_HANDS = 36.5; // "hands"
export const T_SEE = 37.58; // "You see,"
export const T_PILLOWS = 42.62; // "pillows,"
export const T_SQUASH = 43.29; // "squashed"
export const T_FLUFFY = 44.64; // "fluffy"
export const T_BREATH = 46.8; // "breath"
export const T_SWITCH = 49.2; // "switch off."
export const T_GRAB = 51.08; // "grabbed"
export const T_JERK = 52.9; // "jerked"
export const T_HISS = 54.23; // "hissed"
export const T_SANK = 55.83; // "sank"
export const T_WOKE = 57.88; // "woke,"
export const T_PENCIL = 59.0; // "pencil"
export const T_SLEPT = 61.96; // "slept"
export const T_HIGHEST = 62.96; // "highest"

/** the basket floor's world position in shot id at time t */
export const balloonAt = (id: number, t: number): V3 => {
  if (id === 2) return [0, D0, 0];
  if (id === 3) { const u = Math.max(0, t - T_ROSE + 0.07); return [0.6 * u * u, D0 + 1.1 * u * u + 0.9 * u, -0.3 * u * u]; }
  if (id === 13) return [0, SKY_Y - 6 - 2.2 * smooth((t - T_SANK + 0.4) / 2.0) * (t - 55.0), 0];
  if (id === 14) return [8 + 0.6 * (t - 61.0), LOW_Y - 0.5 * (t - 61.0), 0];
  if (id === 10) return [0, SKY_Y, 0];
  // the sky: a slow climb (shots 1, 4, 5 rise faster; the rest drift)
  const climb = id === 5 ? 1.6 * (t - 22.5) : id === 4 ? 0.6 * (t - 17.8) : 0.15 * (t - 30);
  return [0, SKY_Y + climb, 0];
};
/** local -> world for the balloon of shot id */
export const bw = (id: number, t: number, x: number, y: number, z: number): V3 => { const b = balloonAt(id, t); return [b[0] + x, b[1] + y, b[2] + z]; };

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "yard" | "sky" | "garden";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 190, "sky"), mk(2, 190, 370, "yard"), mk(3, 370, 533, "yard"), mk(4, 533, 675, "sky"),
  mk(5, 675, 800, "sky"), mk(6, 800, 925, "sky"), mk(7, 925, 1040, "sky"), mk(8, 1040, 1125, "sky"),
  mk(9, 1125, 1250, "sky"), mk(10, 1250, 1370, "garden"), mk(11, 1370, 1515, "sky"), mk(12, 1515, 1650, "sky"),
  mk(13, 1650, 1830, "sky"), mk(14, 1830, TOTAL, "sky", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 4: 8, 10: 8, 11: 8, 14: 8 };
export const FLASH_AT = 190;

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
/** a camera in the balloon's frame: pos and look are local to the basket floor of shot id */
const rel = (id: number, f: number, pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => {
  const t = T(f);
  return dolly(bw(id, t, ...pos), bw(id, t, ...look), k, rest);
};
const Y = D0;
const MID = (GLA[0] + COX[0]) / 2;
// shot 1 (hook): close on Coxwell, the valve rope in his teeth; then the wide: a speck under the balloon, over the clouds
const S1a = (f: number) => rel(1, f, [COX[0] - 0.15, 1.65, 3.3], [COX[0] - 0.05, 1.55, COX[1]], pushK(f, 0, 0.0026, 0.006, 30), { fov: 40, roll: 0.03 });
const S1b = (f: number) => rel(1, f, [26, -4, 34], [0, 8.5, 0], pushK(f, 138, 0.0022, 0.005, 30), { fov: 46 });
// shot 2: the gasworks yard: Glaisher with his notebook; then a glide to Coxwell and the giant balloon
const S2a = (f: number) => dolly([1.4, Y + 2.0, 4.6], [GLA[0] - 0.1, Y + 1.5, GLA[1]], pushK(f, 190, 0.0024), { fov: 40 });
const S2b = (f: number) => dolly([5.5, Y + 2.4, 8.5], [0.4, Y + 6.5, 0], pushK(f, 296, 0.0022), { fov: 50, roll: -0.03 });
// shot 3: the crowd and the gasholder: the balloon rises
const S3a = (f: number) => dolly([16, Y + 2.0, 24], [1.5, Y + 7.5 + 0.45 * Math.max(0, T(f) - T_ROSE) ** 2, -1], pushK(f, 370, 0.0016), { fov: 50 });
// shot 4: five miles up: the two in the basket; then close on the thermometer
const S4a = (f: number) => rel(4, f, [0.6, 2.0, 4.4], [MID, 1.4, 0], pushK(f, 533, 0.0024), { fov: 42, roll: 0.03 });
const S4b = (f: number) => rel(4, f, [-1.75, 1.4, 1.2], [-0.84, 1.22, 0.2], pushK(f, 607, 0.0028, 0.006, 30), { fov: 40, roll: -0.03 });
// shot 5: from beside: the balloon climbing past the cloud tops
const S5a = (f: number) => { const t = T(f), b = balloonAt(5, 22.5); return dolly([b[0] + 30, b[1] + 1.6 * (t - 22.5) * 0.35 + 2, b[2] + 30], bw(5, t, 0, 7, 0), pushK(f, 675, 0.0018), { fov: 46 }); };
// shot 6: close on Glaisher: the pencil slows, his arms go limp
const S6a = (f: number) => rel(6, f, [GLA[0] + 0.6, 1.75, 3.1], [GLA[0] + 0.05, 1.35, GLA[1]], pushK(f, 800, 0.0026, 0.006, 30), { fov: 40, roll: -0.03 });
// shot 7: looking up from the basket: the tangled valve rope at the ring, Coxwell climbs
const S7a = (f: number) => rel(7, f, [1.4, 1.5, 3.4], [0.2, RING_Y - 0.3, 0], pushK(f, 925, 0.0024), { fov: 46, roll: 0.03 });
const S7b = (f: number) => rel(7, f, [1.6, 1.9, 3.8], [0.3, RING_Y - 0.1, 0], pushK(f, 989, 0.0026, 0.006, 30), { fov: 48, roll: 0.03 });
// shot 8: back in the basket: his hands are frozen useless
const S8a = (f: number) => rel(8, f, [COX[0] - 0.1, 1.6, 3.2], [COX[0], 1.3, COX[1]], pushK(f, 1040, 0.0026, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 9: far below the balloon, looking up: so much sky above, so little air
const S9a = (f: number) => rel(9, f, [18, -36, 26], [0, 9, 0], pushK(f, 1125, 0.002), { fov: 46, roll: -0.03 });
// shot 10 (golden): the cottage garden: a stack of pillows, squashed flat at the bottom, fluffy on top
const S10a = (f: number) => dolly([PIL[0] + 0.5, Y + 1.6, PIL[2] + 6.4], [PIL[0] - 0.15, Y + 1.05, PIL[2]], pushK(f, 1250, 0.0024, 0.006, 30), { fov: 44, roll: 0.03 });
// shot 11: the two in the basket: every breath too thin
const S11a = (f: number) => rel(11, f, [MID + 0.15, 1.9, 4.0], [MID, 1.4, 0], pushK(f, 1370, 0.0026), { fov: 42, roll: -0.03 });
// shot 12: close on Coxwell: the rope in his teeth, the jerks; then up at the valve: the gas hisses out
const S12a = (f: number) => rel(12, f, [COX[0] - 0.15, 1.65, 3.0], [COX[0] - 0.05, 1.5, COX[1]], pushK(f, 1515, 0.0026, 0.006, 30), { fov: 40, roll: 0.03 });
const S12b = (f: number) => rel(12, f, [9, TOP_Y - 4, 13], [0, TOP_Y - 1.5, 0], pushK(f, 1625, 0.003, 0.006, 25), { fov: 44, roll: -0.03 });
// shot 13: the balloon sinks into the clouds; then Glaisher wakes and picks up his pencil
const S13a = (f: number) => { const b0 = balloonAt(13, 55.0); return dolly([b0[0] + 28, b0[1] - 6, b0[2] + 30], bw(13, T(f), 0, 8, 0), pushK(f, 1650, 0.0018), { fov: 46 }); };
const S13b = (f: number) => rel(13, f, [GLA[0] + 0.6, 1.75, 3.1], [GLA[0] + 0.05, 1.35, GLA[1]], pushK(f, 1722, 0.0026, 0.006, 30), { fov: 40, roll: 0.03 });
// shot 14 (golden): low over the fields at sunset: the two in the basket, then the wide of the whole balloon
const S14a = (f: number) => rel(14, f, [MID - 0.2, 1.9, 4.0], [MID, 1.4, 0], pushK(f, 1830, 0.0022), { fov: 42 });
const S14b = (f: number) => rel(14, f, [-20, 4, 34], [0, 7, 0], pushK(f, 1886, 0.0016), { fov: 46, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 138, cut: true, s: S1b }],
  2: [{ f: 190, s: S2a }, { f: 296, dur: 34, s: S2b }],
  3: [{ f: 370, s: S3a }],
  4: [{ f: 533, s: S4a }, { f: 607, cut: true, s: S4b }],
  5: [{ f: 675, s: S5a }],
  6: [{ f: 800, s: S6a }],
  7: [{ f: 925, s: S7a }, { f: 989, dur: 30, s: S7b }],
  8: [{ f: 1040, s: S8a }],
  9: [{ f: 1125, s: S9a }],
  10: [{ f: 1250, s: S10a }],
  11: [{ f: 1370, s: S11a }],
  12: [{ f: 1515, s: S12a }, { f: 1625, cut: true, s: S12b }],
  13: [{ f: 1650, s: S13a }, { f: 1722, cut: true, s: S13b }],
  14: [{ f: 1830, s: S14a }, { f: 1886, dur: 40, s: S14b }],
};

// impact kicks: [seconds, strength]: the teeth on the rope (hook), the useless hands, the jerk of the head
const KICKS: [number, number][] = [[T_TEETH - 2 / 30, 0.5], [T_HANDS - 2 / 30, 0.4], [T_JERK - 2 / 30, 0.6]];
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
const eyes = (id: number, who: [number, number]) => (f: number): V3 => bw(id, T(f), who[0], 1.45, who[1]);
export const DOF: Dof[] = [
  { f: 0, cInf: 15, focus: eyes(1, COX) },
  { f: 138, cInf: 0 },
  { f: 190, cInf: 12, focus: () => [GLA[0], D0 + 1.5, GLA[1]] },
  { f: 296, cInf: 0 },
  { f: 533, cInf: 10, focus: eyes(4, [MID, 0.1]) },
  { f: 607, cInf: 14, focus: (f) => bw(4, T(f), -0.84, 1.22, 0.2) },
  { f: 675, cInf: 0 },
  { f: 800, cInf: 13, focus: eyes(6, GLA) },
  { f: 925, cInf: 10, focus: (f) => bw(7, T(f), 0.2, RING_Y - 0.4, 0) },
  { f: 1040, cInf: 13, focus: eyes(8, COX) },
  { f: 1125, cInf: 0 },
  { f: 1250, cInf: 12, focus: () => [PIL[0] - 0.2, D0 + 1.1, PIL[2]] },
  { f: 1370, cInf: 10, focus: eyes(11, [MID, 0.1]) },
  { f: 1515, cInf: 14, focus: eyes(12, COX) },
  { f: 1625, cInf: 0 },
  { f: 1722, cInf: 13, focus: eyes(13, GLA) },
  { f: 1830, cInf: 5, focus: eyes(14, [MID, 0.1]) },
  { f: 1886, dur: 30, cInf: 0 },
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
  { a: 370, b: 533, kit: "lantern", pos: [13.5, D0, 20.5], s: 3.0 },
  { a: 1250, b: 1370, kit: "plant_bushDetailed", pos: [PIL[0] + 1.9, D0, PIL[2] + 3.2], s: 0.9 },
];
