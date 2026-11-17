// Timeline of "What If Egypt Had Said Yes? The Statue of Liberty Was Almost a Lighthouse on the Suez Canal": shots
// timed to words.json. Five places on one big ground: the Port Said quay at the mouth of the canal (the sea to the
// north, the mole where either the plain lighthouse or the imagined giant stands), the cliff of Abu Simbel with its four
// seated stone kings, Bartholdi's studio (an open-topped room that also plays the Khedive's office), and New York Harbor
// far out to sea (the island with the copper statue, a low skyline behind). The day light is the real history, the
// golden light is the imagined one. Camera grammar of the bridge template: slow push-ins, smootherstep glides of
// 18-40 f, hard cuts on big reframes, flip kicks on impacts.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 1935;
export const D0 = 6.0; // ground level (m)
export const SEA_Y = D0 - 1.0; // the sea surface
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

// ---------------- the set ----------------
/** the canal mouth: the mole that carries the giant (imagined, golden shots) or the plain lighthouse (real, day shots) */
export const L: V3 = [10, D0, -55];
export const PED = 14; // the giant's pedestal height on the mole
/** Abu Simbel: the middle of the cliff foot */
export const TEMPLE: V3 = [-110, D0, 120];
/** the studio / the Khedive's office (open-topped room) and its desk */
export const OFFICE: V3 = [110, D0, 130];
export const DESK: V3 = [110, D0, 128.8];
/** the easel in the studio */
export const EASEL: V3 = [112.4, D0, 128.2];
/** New York Harbor: the island's statue */
export const NY: V3 = [600, D0, -500];
export const NYPED = 20; // the copper statue's pedestal height on the island

// story beats (seconds on the voice clock)
export const T_EGYPT = 2.7; // "Egypt."
export const T_STOOD = 7.3; // "stood"
export const T_KINGS = 8.5; // "kings"
export const T_DREAM = 10.22; // "dreaming"
export const T_GIANTS = 10.68; // "giants."
export const T_DREW = 14.32; // "drew"
export const T_WOMAN = 16.32; // "woman"
export const T_CHURCH = 17.21; // "church,"
export const T_TORCH = 19.2; // "torch"
export const T_SHIPS = 19.94; // "ships"
export const T_DRAWINGS = 22.27; // "drawings"
export const T_KHEDIVE = 23.73; // "Khedive,"
export const T_NO = 25.1; // "no,"
export const T_COST = 25.85; // "cost"
export const T_OPENED = 28.15; // "opened"
export const T_PLAIN = 30.6; // "plain"
export const T_WHAT = 31.9; // "what"
export const T_YES = 33.02; // "yes?"
export const T_GIANT = 35.71; // "giant"
export const T_BLAZING = 36.98; // "blazing"
export const T_SAILORS = 38.48; // "Sailors"
export const T_PICTURE = 39.38; // "picture"
export const T_WORLD = 40.62; // "world."
export const T_NEVER = 44.02; // "never"
export const T_SECOND = 44.76; // "second"
export const T_KEPT = 47.08; // "kept"
export const T_NOTHING = 49.45; // "nothing"
export const T_SISTERS = 51.91; // "sisters."
export const T_LIT = 56.14; // "lit"
export const T_HARBOR = 57.05; // "Harbor."
export const T_WELCOME = 58.89; // "welcome"
export const T_EGYPT2 = 60.94; // "Egypt."

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "harbour" | "temple" | "studio" | "palace" | "deck" | "ny";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene, light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 104, "harbour", "golden"), mk(2, 104, 346, "temple"), mk(3, 346, 568, "studio"), mk(4, 568, 651, "harbour", "golden"),
  mk(5, 651, 820, "palace"), mk(6, 820, 950, "harbour"), mk(7, 950, 1008, "palace"), mk(8, 1008, 1151, "deck", "golden"),
  mk(9, 1151, 1238, "harbour", "golden"), mk(10, 1238, 1369, "studio"), mk(11, 1369, 1594, "studio"), mk(12, 1594, TOTAL, "ny", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 6: 8, 8: 10, 10: 8, 12: 10 };
export const FLASH_AT = 104;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** the giant (imagined) stands at the canal mouth in the golden harbour shots; the plain lighthouse in the day ones */
export const giantOn = (id: number) => { const s = SHOTS[id - 1]; return s.light === "golden" && (s.scene === "harbour" || s.scene === "deck"); };

// ---------------- the ships ----------------
/** 0: the steam launch (deck shots), 1 and 2: schooners. x, z, yaw (bow along local +x; yaw -PI/2 = heading +z) */
export type ShipPose = { x: number; z: number; yaw: number } | null;
const H = Math.PI / 2;
export const shipAt = (k: number, id: number, t: number): ShipPose => {
  if (k === 0) {
    if (id === 8) return { x: 0, z: -12 + 0.5 * (t - 33.6), yaw: -H };
    if (id === 12) return { x: NY[0] - 4, z: NY[2] + 52 - 0.35 * (t - 53), yaw: H };
    return null;
  }
  if (k === 1) {
    if (id === 1) return { x: -34 + 2.2 * t, z: L[2] + 24, yaw: 0 };
    if (id === 4) return { x: L[0] - 13, z: L[2] - 4 + 1.6 * (t - 18.9), yaw: -H };
    if (id === 6) return { x: L[0] - 30 + 1.2 * (t - 27.3), z: L[2] + 22, yaw: 0 };
    return null;
  }
  if (id === 6) return { x: L[0] + 30 - 1.0 * (t - 27.3), z: L[2] + 2, yaw: Math.PI };
  if (id === 9) return { x: L[0] + 20 - 0.8 * (t - 38.3), z: L[2] + 22, yaw: Math.PI };
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
/** a look point d metres from pos toward tgt: keeps the push-ins small when the subject is far away */
const aim = (pos: V3, tgt: V3, d: number): V3 => {
  const v = tgt.map((x, i) => x - pos[i]), n = Math.hypot(...v) || 1;
  return pos.map((x, i) => x + (v[i] / n) * d) as V3;
};
const Y = D0;
const T = TEMPLE, O = OFFICE, E = EASEL, N = NY;
const fr = (t: number) => Math.round(t * FPS);
// shot 1 (hook, golden): the giant at the canal mouth, lamp lit, two kids on the quay, a schooner passing below her
const S1a = (f: number) => dolly([-12, Y + 1.8, 16], aim([-12, Y + 1.8, 16], [6, Y + 17, -55], 22), pushK(f, 0, 0.0016, 0.004, 30), { fov: 50, roll: 0.03 });
// shot 2: Abu Simbel: tiny Bartholdi under the four stone kings; cut in on his face as he dreams
const S2a = (f: number) => dolly([T[0] + 5, Y + 1.5, T[2] + 40], aim([T[0] + 5, Y + 1.5, T[2] + 40], [T[0] + 1, Y + 9, T[2]], 16), pushK(f, 104, 0.0014, 0.004, 30), { fov: 50, roll: -0.03 });
const S2b = (f: number) => dolly([T[0] + 2.0, Y + 1.3, T[2] + 13.0], [T[0] + 1.0, Y + 1.9, T[2] + 8.6], pushK(f, fr(T_DREAM) - 3, 0.0026, 0.006, 30), { fov: 42, roll: -0.04 });
// shot 3: the studio: Bartholdi at his easel, the drawing of the robed woman with a church beside her for scale
const S3a = (f: number) => dolly([E[0] - 1.2, Y + 1.8, E[2] + 5.6], [E[0] - 0.8, Y + 1.4, E[2]], pushK(f, 346, 0.0018), { fov: 44, roll: 0.03 });
const S3b = (f: number) => dolly([E[0] + 0.2, Y + 1.7, E[2] + 3.2], [E[0] + 0.05, Y + 1.5, E[2]], pushK(f, fr(T_WOMAN) - 3, 0.0026, 0.006, 30), { fov: 42, roll: 0.03 });
// shot 4 (golden): the plan: a schooner sails in under her torch
const S4a = (f: number) => dolly([-26, Y + 0.6, -10], aim([-26, Y + 0.6, -10], [6, Y + 20, -56], 20), pushK(f, 568, 0.002, 0.005, 30), { fov: 50, roll: -0.03 });
// shot 5: the Khedive's office: Bartholdi shows the drawing; the Khedive says no; the cost
const S5a = (f: number) => dolly([O[0] + 0.6, Y + 1.9, O[2] + 4.6], [O[0], Y + 1.4, O[2] - 1.4], pushK(f, 651, 0.002), { fov: 44, roll: -0.03 });
const S5b = (f: number) => dolly([O[0] - 0.2, Y + 1.75, O[2] + 2.0], [O[0] - 0.1, Y + 1.5, O[2] - 1.8], pushK(f, fr(T_NO) - 3, 0.0026, 0.006, 30), { fov: 42, roll: -0.03 });
// shot 6: 1869, the real opening: a crowd on the quay, ships, the plain lighthouse
const S6a = (f: number) => dolly([-4, Y + 2.0, 12], aim([-4, Y + 2.0, 12], [8, Y + 11, -55], 14), pushK(f, 820, 0.0018, 0.004, 30), { fov: 48, roll: 0.03 });
// shot 7: but what if: the Khedive close, he says yes
const S7a = (f: number) => dolly([O[0] - 0.4, Y + 1.7, O[2] + 1.0], [O[0] - 0.15, Y + 1.55, O[2] - 2.0], pushK(f, 950, 0.003, 0.008, 30), { fov: 40, roll: 0.04 });
// shot 8 (golden): on the deck of a steam launch: sailors wave, the giant and her blazing lamp behind them
const S8a = (f: number) => {
  const z = -12 + 0.5 * (f / FPS - 33.6);
  return dolly([-0.9, Y + 2.7, z + 4.8], aim([-0.9, Y + 2.7, z + 4.8], [3.2, Y + 13, -52], 8), pushK(f, 1008, 0.0016, 0.004, 30), { fov: 52, roll: 0.03 });
};
// shot 9 (golden): the quay: sailors with her picture on cards, the giant far behind
const S9a = (f: number) => dolly([L[0] - 2.2, Y + 1.5, 12.6], aim([L[0] - 2.2, Y + 1.5, 12.6], [L[0] - 0.6, Y + 6.5, -40], 7), pushK(f, 1151, 0.0024, 0.006, 30), { fov: 48, roll: -0.03 });
// shot 10: the studio: Bartholdi at ease, the easel empty
const S10a = (f: number) => dolly([E[0] - 1.2, Y + 1.5, E[2] + 4.4], [E[0] - 0.75, Y + 1.0, E[2] + 0.6], pushK(f, 1238, 0.0022), { fov: 44, roll: -0.03 });
// shot 11: the studio: the two drawings side by side, Bartholdi between them
const S11a = (f: number) => dolly([O[0] + 0.4, Y + 1.8, O[2] + 4.2], [O[0] + 0.4, Y + 1.6, O[2] - 3.0], pushK(f, 1369, 0.0018), { fov: 44, roll: 0.03 });
const S11b = (f: number) => dolly([O[0] + 0.4, Y + 1.85, O[2] + 2.0], [O[0] + 0.4, Y + 1.9, O[2] - 3.4], pushK(f, fr(T_NOTHING) + 30, 0.0024, 0.005, 30), { fov: 42, roll: 0.03 });
// shot 12 (golden): New York Harbor, 1886: the crowd on the launch, the copper statue; her torch lights; a slow rise
const S12a = (f: number) => {
  const z = N[2] + 52 - 0.35 * (f / FPS - 53);
  return dolly([N[0] - 5.0, Y + 2.25, z + 3.0], aim([N[0] - 5.0, Y + 2.25, z + 3.0], [N[0], Y + 18, N[2]], 8), pushK(f, 1594, 0.0016, 0.004, 30), { fov: 50, roll: -0.03 });
};
const S12b = (f: number) => dolly([N[0] - 22, Y + 9, N[2] + 70], aim([N[0] - 22, Y + 9, N[2] + 70], [N[0], Y + 24, N[2]], 30), pushK(f, fr(T_WELCOME) - 6, 0.0018), { fov: 46, roll: -0.03 });

export const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 104, s: S2a }, { f: fr(T_DREAM) - 3, cut: true, s: S2b }],
  3: [{ f: 346, s: S3a }, { f: fr(T_WOMAN) - 3, dur: 30, s: S3b }],
  4: [{ f: 568, s: S4a }],
  5: [{ f: 651, s: S5a }, { f: fr(T_NO) - 3, dur: 24, s: S5b }],
  6: [{ f: 820, s: S6a }],
  7: [{ f: 950, s: S7a }],
  8: [{ f: 1008, s: S8a }],
  9: [{ f: 1151, s: S9a }],
  10: [{ f: 1238, s: S10a }],
  11: [{ f: 1369, s: S11a }, { f: fr(T_NOTHING) + 30, dur: 36, s: S11b }],
  12: [{ f: 1594, s: S12a }, { f: fr(T_WELCOME) - 6, dur: 40, s: S12b }],
};

// impact kicks: [seconds, strength]: the Khedive's no, the torch lit in New York
const KICKS: [number, number][] = [[T_NO - 2 / 30, 0.5], [T_LIT - 2 / 30, 0.4]];
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
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 104, cInf: 0 },
  { f: fr(T_DREAM) - 3, cInf: 13, focus: at([T[0] + 1.0, Y + 1.5, T[2] + 8.6]) },
  { f: 346, cInf: 10, focus: at([E[0] - 0.6, Y + 1.5, E[2] + 0.6]) },
  { f: fr(T_WOMAN) - 3, dur: 30, cInf: 13, focus: at([E[0], Y + 1.5, E[2]]) },
  { f: 568, cInf: 0 },
  { f: 651, cInf: 10, focus: at([O[0], Y + 1.5, O[2] - 1.4]) },
  { f: fr(T_NO) - 3, dur: 24, cInf: 12, focus: at([O[0] - 0.1, Y + 1.5, O[2] - 1.9]) },
  { f: 820, cInf: 0 },
  { f: 950, cInf: 14, focus: at([O[0] - 0.15, Y + 1.5, O[2] - 1.9]) },
  { f: 1008, cInf: 5, focus: (f: number) => [0.2, Y + 3.4, -11.6 + 0.5 * (f / FPS - 33.6)] },
  { f: 1151, cInf: 7, focus: at([L[0] - 0.7, Y + 1.4, 7.6]) },
  { f: 1238, cInf: 10, focus: at([E[0] - 1.0, Y + 1.0, E[2] + 1.0]) },
  { f: 1369, cInf: 10, focus: at([O[0] + 0.4, Y + 1.5, O[2] - 1.6]) },
  { f: 1594, cInf: 5, focus: (f: number) => [N[0] - 4, Y + 3.4, N[2] + 51 - 0.35 * (f / FPS - 53)] },
  { f: fr(T_WELCOME) - 6, dur: 30, cInf: 0 },
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
  { a: 104, b: fr(T_DREAM) - 3, kit: "plant_bush", pos: [T[0] + 7.5, D0, T[2] + 20], s: 1.2 },
  { a: 820, b: 950, kit: "cart", pos: [-8.5, D0 + 0.02, 8.5], s: 1.5, yaw: 0.7 },
  { a: 1151, b: 1238, kit: "stall-red", pos: [L[0] + 2.6, D0, 9.6], s: 2.6, yaw: -0.4 },
];
