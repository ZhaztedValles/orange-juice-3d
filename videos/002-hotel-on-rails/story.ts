// Timeline of "The Hotel That Escaped the Ocean on Rails": shots timed to words.json, the hotel's journey on rails,
// and the camera grammar of the bridge template: slow push-ins, smootherstep glides of 18-40 f, hard cuts on big
// reframes, 7-frame impact kicks that flip sign every frame.
import { clamp01, smooth, easeOut } from "../../src/engine/math";
export const FPS = 30;
export const TOTAL = 2025;
export const D0 = 6.0; // bluff top / ground (m); the sea is at 0
export type V3 = [number, number, number];
export { clamp01, smooth, easeOut };

const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- the set ----------------
export const HZ0 = -37.5; // hotel centre z before the move (main block z -44..-31, porch to -26; the bluff edge is z -30)
export const NT = 24; // tracks
export const trackX = (i: number) => (i - 11.5) * 1.5;
export const LOCO_TRACKS = [1, 5, 9, 14, 18, 22];
export const SNOW: V3 = [96, D0, -96]; // the snow patch (the analogy)
/** metres the hotel has moved inland; the hook (shot 1) is a teaser from mid-journey */
const SHIFT: [number, number][] = [[0, 0], [32.3, 0], [35.4, 7.0], [40, 9], [52.4, 12], [54.5, 18], [56.2, 29], [57.4, 36], [80, 36]];
export const shift = (id: number, t: number) => (id === 1 ? 15 + 0.7 * t : lin(SHIFT, t));
/** story clock for the build-up state (jacks, cars, tracks, locomotives): the hook shows the journey under way */
export const clock = (id: number, t: number) => (id === 1 ? 40 : t);
export const LIFT = 1.05;
export const lift = (ts: number) => LIFT * smooth((ts - 22.5) / 1.5);
export const CARS_T = 710 / 30; // flatcars slide in under the hotel (appear exactly on the cut at f 710)
export const carOff = (ts: number) => -(1 - easeOut(clamp01((ts - CARS_T) / 1.5))) * 22;
export const TRACK_T = 25.2; // two dozen tracks laid, one every 0.06 s
export const LOCOS_T = 27.3; // five more locomotives roll up
export const ROPE_T = 28.5; // ropes hooked
export const MOVE_T = 32.3; // the wheels turn
export const hotelZ = (id: number, t: number) => HZ0 - shift(id, t);
export const locoZ = (id: number, t: number) => hotelZ(id, t) - 18.1;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "hotel" | "snow";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene };
const mk = (id: number, a: number, b: number, scene: Scene = "hotel", light: Light = "day"): ShotDef => ({ id, a, b, light, scene });
export const SHOTS: ShotDef[] = [
  mk(1, 0, 168), mk(2, 168, 334), mk(3, 334, 507), mk(4, 507, 660), mk(5, 660, 756), mk(6, 756, 822), mk(7, 822, 970), mk(8, 970, 1082),
  mk(9, 1082, 1220), mk(10, 1220, 1347, "snow"), mk(11, 1347, 1446, "snow"), mk(12, 1446, 1518), mk(13, 1518, 1572), mk(14, 1572, 1716),
  mk(15, 1716, 1836, "hotel", "golden"), mk(16, 1836, TOTAL, "hotel", "golden"),
];
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 10: 8, 12: 8, 15: 8 };
export const FLASH_AT = 168;

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

const Y = D0;
const HZ = (id: number, f: number) => hotelZ(id, T(f));
// shot 1 (hook): from in front of the locomotives, the hotel rolling behind them; then a loco close-up
const S1a = (f: number) => dolly([-14, Y + 2.2, -112], [0, Y + 4.5, -62], pushK(f, 0, 0.0025), { fov: 52 });
const S1b = (f: number) => dolly([-3, Y + 1.6, -92], [-3, Y + 2.4, -66], pushK(f, 96, 0.0022, 0.005, 30), { fov: 44, roll: -0.04 });
// shot 2: aerial of the hotel from the sea, then the facade and flag from the beach
const S2a = (f: number) => dolly([46, Y + 17, 8], [0, Y + 4, -36], pushK(f, 168, 0.0022), { fov: 46 });
const S2b = (f: number) => dolly([10, Y + 1.7, -14], [1, Y + 6, -33], pushK(f, 240, 0.0022), { fov: 44, roll: 0.03 });
// shot 3: from the sea, the waves under the porch
const S3a = (f: number) => dolly([14, 2.6, -2], [0, Y - 0.5, -29], pushK(f, 334, 0.002), { fov: 50 });
const S3b = (f: number) => dolly([3.5, 1.4, -14], [0.5, Y - 2.0, -27.5], pushK(f, 440, 0.0022, 0.005, 30), { fov: 42, roll: -0.035 });
// shot 4: the owner and his thoughts, then the locomotive he owns
const S4a = (f: number) => dolly([-6.8, Y + 1.8, -17], [-6.8, Y + 1.5, -29], pushK(f, 507, 0.0025), { fov: 34 });
const S4b = (f: number) => dolly([-9.5, Y + 1.5, -68], [-14, Y + 1.8, -58], pushK(f, 618, 0.0022, 0.005, 30), { fov: 44, roll: 0.035 });
// shot 5: the jacks under the front of the hotel, then the flatcars rolling in at the back
const S5a = (f: number) => dolly([-3, Y + 1.3, -64], [0, Y + 0.9, -45], pushK(f, 660, 0.002), { fov: 46 });
const S5b = (f: number) => dolly([26, Y + 1.5, -52], [6, Y + 0.9, -47], pushK(f, 710, 0.0022), { fov: 46, roll: -0.03 });
// shot 6: aerial of the tracks being laid
const S6a = (f: number) => dolly([20, Y + 17, -78], [0, Y, -50], pushK(f, 756, 0.0022), { fov: 50 });
// shot 7: six locomotives with their ropes, then the crowd
const S7a = (f: number) => dolly([0, Y + 1.5, -86], [0, Y + 2, -64], pushK(f, 822, 0.0022), { fov: 50 });
const S7b = (f: number) => dolly([19.5, Y + 1.6, -44], [10, Y + 2.2, -62], pushK(f, 882, 0.002), { fov: 50, roll: 0.03 });
// shot 8: driving wheels, then the creeping hotel
const S8a = (f: number) => { const z = locoZ(8, T(f)); return dolly([9.6, Y + 1.2, z + 8], [4.0, Y + 0.9, z - 0.3], pushK(f, 970, 0.002, 0.006, 30), { fov: 40 }); };
const S8b = (f: number) => dolly([36, Y + 5, -22], [2, Y + 5.5, -52], pushK(f, 1030, 0.002), { fov: 48, roll: -0.03 });
// shot 9: the weight, then the rope
const S9a = (f: number) => dolly([6.75, Y + 0.8, -73], [1, Y + 7.5, -52], pushK(f, 1082, 0.002, 0.006, 30), { fov: 58 });
const S9b = (f: number) => { const z = hotelZ(9, T(f)) - 11.2; return dolly([2.4, Y + 1.25, z], [-3.75, Y + 1.15, z], pushK(f, 1150, 0.0025, 0.005, 30), { fov: 40, roll: 0.035 }); };
// shots 10-11: the snow
const S10a = (f: number) => dolly([SNOW[0] + 1.2, Y + 1.5, SNOW[2] + 7], [SNOW[0] - 1.2, Y + 1.0, SNOW[2]], pushK(f, 1220, 0.002), { fov: 40 });
const S11a = (f: number) => dolly([SNOW[0] - 4.2, Y + 1.5, SNOW[2] + 7.5], [SNOW[0] + 2.2, Y + 0.9, SNOW[2]], pushK(f, 1347, 0.002), { fov: 40, roll: -0.03 });
// shots 12-13: the cars and wheels under the hotel
const S12a = (f: number) => dolly([24, Y + 8, -72], [0, Y + 0.8, -50], pushK(f, 1446, 0.002), { fov: 48 });
const S13a = (f: number) => dolly([6.75, Y + 0.7, -64], [6.75, Y + 0.6, -56.4], pushK(f, 1518, 0.0022, 0.006, 30), { fov: 46, roll: 0.035 });
// shot 14: the long way inland, from the sea side
const S14a = (f: number) => dolly([42, Y + 13, -8], [0, Y + 4, -50], pushK(f, 1572, 0.0016), { fov: 50 });
const S14b = (f: number) => dolly([22, Y + 2.2, -46], [0, Y + 4.2, -66], pushK(f, 1650, 0.0022), { fov: 46, roll: -0.03 });
// shot 15 (golden): the hotel at its new place
const S15a = (f: number) => dolly([16, Y + 2.0, -40], [0, Y + 4.4, -66], pushK(f, 1716, 0.0022), { fov: 46 });
// shot 16 (golden): the empty bluff and the sea, then the finale
const S16a = (f: number) => dolly([0, 2.4, -6], [0, Y + 0.6, -30], pushK(f, 1836, 0.002), { fov: 44, roll: 0.03 });
const S16b = (f: number) => dolly([30, Y + 3.5, -38], [0, Y + 4.5, -69], pushK(f, 1895, 0.0016), { fov: 48 });
const S16c = (f: number): Shot => {
  const a = S16b(1940), s = glide((f - 1940) / 85);
  return { pos: [a.pos[0] + (40 - a.pos[0]) * s, a.pos[1] + (Y + 16 - a.pos[1]) * s, a.pos[2] + (-10 - a.pos[2]) * s], look: a.look, fov: (a.fov ?? 48) + (4) * s, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 90, dur: 28, s: S1b }],
  2: [{ f: 168, s: S2a }, { f: 240, dur: 30, s: S2b }],
  3: [{ f: 334, s: S3a }, { f: 440, cut: true, s: S3b }],
  4: [{ f: 507, s: S4a }, { f: 618, cut: true, s: S4b }],
  5: [{ f: 660, s: S5a }, { f: 710, cut: true, s: S5b }],
  6: [{ f: 756, s: S6a }],
  7: [{ f: 822, s: S7a }, { f: 882, cut: true, s: S7b }],
  8: [{ f: 970, s: S8a }, { f: 1030, cut: true, s: S8b }],
  9: [{ f: 1082, s: S9a }, { f: 1150, cut: true, s: S9b }],
  10: [{ f: 1220, s: S10a }],
  11: [{ f: 1347, s: S11a }],
  12: [{ f: 1446, s: S12a }],
  13: [{ f: 1518, s: S13a }],
  14: [{ f: 1572, s: S14a }, { f: 1650, dur: 24, s: S14b }],
  15: [{ f: 1716, s: S15a }],
  16: [{ f: 1836, s: S16a }, { f: 1895, cut: true, s: S16b }, { f: 1940, dur: 85, s: S16c }],
};
void HZ;

// impact kicks: the wheels start (a lurch), the first rope tug at the snap word
const KICKS: [number, number][] = [[MOVE_T + 0.3, 0.7], [39.4, 0.5]];
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
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 8, focus: () => [-1, Y + 3, -64] },
  { f: 90, dur: 28, cInf: 14, focus: () => [2.2, Y + 2, -70] },
  { f: 168, cInf: 0 },
  { f: 240, cInf: 9, focus: () => [1, Y + 5, -33] },
  { f: 334, cInf: 0 },
  { f: 440, cInf: 13, focus: () => [0.5, Y - 2, -27.5] },
  { f: 507, cInf: 12, focus: () => [-5.2, Y + 1.5, -25] },
  { f: 618, cInf: 8 },
  { f: 660, cInf: 7, focus: () => [0, Y + 0.9, -45] },
  { f: 710, cInf: 8 },
  { f: 756, cInf: 0 },
  { f: 822, cInf: 6 },
  { f: 882, cInf: 0 },
  { f: 970, cInf: 10, focus: (f) => [4, Y + 0.8, locoZ(8, f / 30)] },
  { f: 1030, cInf: 0 },
  { f: 1082, cInf: 0 },
  { f: 1150, cInf: 12, focus: (f) => [-3.75, Y + 1.15, hotelZ(9, f / 30) - 11.2] },
  { f: 1220, cInf: 11, focus: () => [SNOW[0] - 1.2, Y + 1.0, SNOW[2]] },
  { f: 1347, cInf: 11, focus: () => [SNOW[0] + 2.2, Y + 0.9, SNOW[2]] },
  { f: 1446, cInf: 0 },
  { f: 1518, cInf: 0 },
  { f: 1572, cInf: 0 },
  { f: 1716, cInf: 6 },
  { f: 1836, cInf: 10, focus: () => [0, Y + 0.6, -30] },
  { f: 1895, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects: none in this film */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
