// The cast and hand-drawn props of the monk story: the Abbé Nollet (black cassock, powdered hair), two hundred
// Carthusian monks in white habits, Parisians on the street, a gentleman who touches the jar, two gardener monks with the
// hose, royal guards in blue and the king at Versailles; the Leyden jar, its spark, Nollet's thought bubbles (a bolt and
// a question mark; the ring with an imagined wave running round it) and the water from the hose. Every prop is an
// unlit ink-outlined drawing. wireEnds() gives the iron wire's spans between the monks' hands for world.ts.
import { Pen, townsfolk, soldier, OFFICER, SKINS, Outfit, Expr, FrontOpts, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import {
  D0, SHOTS, NM, JS, NOLLET_R, STAND_Y, PAR, PTAB, GAR, VER, DIRV, NG, guardP, monkAt, hop, JUMPS, glowAt,
  T_TOUCH, T_SHOCK, T_WIRE, T_TAP, T_GUARDS, smooth, clamp01, V3,
} from "./story";

export const NOLLET: Outfit = { jacket: "#2c2a35", pants: "#2c2a35", boots: "#1e1a1c", hat: "hair", hair: "#ece6dc", dress: "#2c2a35", buttons: "#efe9df", skin: SKINS[1] };
const MONKS: Outfit[] = [0, 1, 2].map((v) => ({ jacket: "#ece5d3", pants: "#ece5d3", boots: "#4a3426", hat: "hair", hair: ["#6b4a32", "#4a3426", "#a08262"][v], dress: "#e6dfcc", buttons: "#ece5d3", skin: SKINS[[0, 1, 3][v]] }));
const GENT: Outfit = { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#2b2220", hat: "tophat", buttons: "#d9b45a", moustache: "#5a3b2a", skin: SKINS[0] };
const GUARD = (v: number): Outfit => soldier(v, { jacket: "#2f4f9a", pants: "#c0353a", belt: "#f1efe6", rifle: false, buttons: "#e8c45a" });
const KING: Outfit = { ...OFFICER, jacket: "#6a2f5a", pants: "#e9e1cf", hat: "hair", hair: "#efeae0", sash: "#3a5fb0", buttons: "#e8c45a", moustache: undefined, build: "stout", skin: SKINS[0] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const LEAD = 2 / 30;
const INKC = "#241726";
/** hand height and half-spread of a standing adult card (m), for the wire */
const HAND_Y = 0.86, HAND_W = 0.3;

// ---------------- drawings ----------------
/** the Leyden jar (200 x 340): glass, a band of metal foil, a cork, the brass rod and ball; glow 0..1 */
const drawJar = (p: Pen, glow: number) => {
  p.poly([[40, 320], [160, 320], [168, 140], [150, 112], [50, 112], [32, 140]], "#d6eaee", 7);
  p.poly([[42, 316], [158, 316], [163, 200], [37, 200]], "#b9c0c8", 6);
  p.poly([[60, 112], [140, 112], [136, 88], [64, 88]], "#8a6a3a", 6);
  p.line([[100, 90], [100, 34]], "#c9a047", 10);
  p.ell(100, 28, 20, 20, glow > 0 ? "#fff3b0" : "#d9b45a", 6);
};
/** a thought bubble (420 x 380); kind 0 = a lightning bolt and a question mark; kind 1 = the ring with a wave at angle a */
const drawBubble = (p: Pen, kind: number, a: number) => {
  p.ell(210, 160, 190, 140, "#fbf7ee", 9); p.ell(120, 318, 26, 20, "#fbf7ee", 6); p.ell(84, 360, 15, 12, "#fbf7ee", 5);
  if (kind === 0) {
    p.poly([[150, 60], [110, 170], [150, 170], [118, 262], [206, 140], [164, 140], [196, 60]], "#ffd25a", 7);
    p.arc(286, 128, 34, 34, -200, 60, 14, INKC); p.stroke([[302, 158], [290, 192]], 14, INKC); p.dot(288, 228, 9, INKC);
  } else {
    p.ell(210, 160, 140, 92, null, 5);
    for (let i = 0; i < 28; i++) {
      const b = (i / 28) * Math.PI * 2, d = Math.abs(((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI), up = d < 0.5 ? 26 * (1 - d / 0.5) : 0;
      const x = 210 + 140 * Math.cos(b), y = 160 + 92 * Math.sin(b) - up;
      p.ell(x, y, 8, 11, up > 0 ? "#ffd25a" : "#ece5d3", 4);
    }
  }
};
/** water out of the hose (360 x 260): an arc of spray to the right; u 0..1 how far it has run */
const drawSpray = (p: Pen, u: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const s = (i / 12) * u; pts.push([20 + 320 * s, 40 + 30 * s - 0 + 200 * s * s]); }
  p.line(pts, "#9fd6f0", 9);
  for (let i = 2; i <= 12; i += 2) { const [x, y] = pts[i]; p.ell(x + 14, y + 10, 7, 9, "#bfe6f7", 3); p.ell(x - 10, y + 16, 5, 7, "#bfe6f7", 3); }
  if (u > 0.8) for (const [x, y] of [[300, 240], [330, 226], [270, 250]] as const) p.ell(x, y, 14, 8, "#9fd6f0", 4);
};

// ---------------- staging ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const personAt = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, blinkOn = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: blinkOn ? lidAt(t, i) : false, ...extra }, {}, 1));
  blob(out, x, D0, z, 1);
};
/** a world point beside a character (camera-facing cards): side in m along the screen's right, dy up, push toward the lens */
const beside = (cam: CamInfo, x: number, y: number, z: number, side: number, dy: number, push = 0.1): V3 => {
  const r = cam.right, dx = cam.pos.x - x, dz = cam.pos.z - z, n = Math.hypot(dx, dz) || 1;
  return [x + r.x * side + (dx / n) * push, y + dy, z + r.z * side + (dz / n) * push];
};
const spark = (out: Stage, key: string, p: V3, t: number, t0: number, size = 0.5) => {
  if (t < t0 || t > t0 + 0.5) return;
  const u = q((t - t0) / 0.5, 15);
  out.fx.push({ key: `spark${key}${u}`, cw: 500, ch: 500, draw: (pn) => fxBurst(pn, u, "#fff3b0", 10, 30, 220), x: p[0], y: p[1], z: p[2], w: size, h: size });
};
const jar = (out: Stage, p: V3, glow: number) => {
  const g = glow > 0 ? 1 : 0;
  out.fx.push({ key: `jar${g}`, cw: 200, ch: 340, draw: (pn) => drawJar(pn, g), x: p[0], y: p[1] + 0.25, z: p[2], w: 0.24, h: 0.41 });
};
/** expression of a monk who has just been shocked */
const monkFace = (t: number, jumps: number[], k: number): Expr => {
  for (const t0 of jumps) {
    if (t >= t0 - 0.03 && t < t0 + 1.1) return "shock";
    if (t >= t0 + 1.1 && t < t0 + 2.4) return k % 3 === 0 ? "dazed" : k % 3 === 1 ? "pained" : "nervous";
  }
  return k % 4 === 0 ? "smile_closed" : "neutral";
};

/** the iron wire: one span from each monk's hand to the next monk's (and the two end wires to the jar) */
export const wireEnds = (id: number, t: number, cam: CamInfo): [V3, V3][] => {
  const s = SHOTS[id - 1];
  if (s.scene !== "ring") return [];
  const out: [V3, V3][] = [], r = cam.right;
  const hands = (k: number): [V3, V3] => {
    const { p } = monkAt(id, t, k);
    const y = p[1] + HAND_Y;
    return [[p[0] - r.x * HAND_W, y, p[2] - r.z * HAND_W], [p[0] + r.x * HAND_W, y, p[2] + r.z * HAND_W]];
  };
  let prev = hands(0);
  for (let k = 1; k < NM; k++) {
    const cur = hands(k);
    const a = monkAt(id, t, k - 1).p, b = monkAt(id, t, k).p;
    const right = (b[0] - a[0]) * r.x + (b[2] - a[2]) * r.z > 0; // is the next monk to the right on screen?
    out.push(right ? [prev[1], cur[0]] : [prev[0], cur[1]]);
    prev = cur;
  }
  // the end wires: monk 0 to the jar's foil, and the last monk's wire to the jar's ball (touched at T_WIRE)
  const jarFoil: V3 = [JS[0] - 0.08, STAND_Y + 0.12, JS[2]], ball: V3 = [JS[0], STAND_Y + 0.46, JS[2]];
  const h0 = hands(0), hl = hands(NM - 1);
  out.push([jarFoil, h0[1]]);
  const reach = id === 7 ? smooth((t - (T_WIRE - 0.9)) / 0.85) : id >= 8 ? 1 : 0;
  const tip: V3 = [JS[0] + 0.4 - 0.4 * reach, STAND_Y + 0.25 + 0.21 * reach, JS[2] + 0.1 - 0.1 * reach];
  out.push([hl[0], tip]);
  void ball;
  return out;
};

const ringSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const jumps = JUMPS[id] ?? [];
  for (let k = 0; k < NM; k++) {
    const m = monkAt(id, t, k), [x, y, z] = m.p;
    const d = Math.hypot(cam.pos.x - x, cam.pos.z - z);
    const ex = monkFace(t, jumps, k);
    const o = MONKS[k % 3];
    out.places.push(person(cam, who(100 + (k % 7), o, `m${k % 3}`), x, y, z, { side: false, mirror: false },
      { mode: m.walk >= 0 ? "stroll" : "stand", phase: m.walk >= 0 ? q(m.walk, 12) : 0, expr: d < 30 ? ex : "neutral", blink: d < 14 ? lidAt(t, 100 + k) : false }, {}, 1));
    if (d < 60) blob(out, x, D0, z, 1, y > D0 + 0.05 ? 0.6 : 1);
    if (d < 25) for (const t0 of jumps) spark(out, `m${k % 2}`, [x, y + HAND_Y, z], t, t0, 0.42);
  }
  // Nollet at the jar in the ring's gap
  const glow = glowAt(id, t);
  jar(out, [JS[0], STAND_Y, JS[2]], glow);
  if (id >= 7 && id <= 8 || id === 1 || id === 9 || id === 15) {
    const ex: Expr = id === 7 ? (t < T_WIRE ? "stern" : "grin") : id === 8 ? "whistle" : id === 9 ? "shock" : "grin";
    personAt(cam, t, out, 1, NOLLET, "nol", NOLLET_R[0], D0, NOLLET_R[2], ex, id === 9 && t > 35.7 ? { wave: 1 } : {});
  }
  if (id === 7) spark(out, "w", [JS[0], STAND_Y + 0.46, JS[2] + 0.05], t, T_WIRE, 0.35);
  if (id === 8) {
    const a = 1.7 + (2 * Math.PI) * clamp01((t - 31.4) / 2.4);
    const ph = q(a, 10);
    out.fx.push({ key: `bub1_${ph}`, cw: 420, ch: 380, draw: (p) => drawBubble(p, 1, ph), ...xyz(beside(cam, NOLLET_R[0], D0, NOLLET_R[2], -0.6, 2.75)), w: 1.05, h: 0.95 });
  }
};
const xyz = (p: V3) => ({ x: p[0], y: p[1], z: p[2] });

const parisSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const jarP: V3 = [PTAB[0] + 0.15, STAND_Y, PTAB[2]];
  const touched = id === 3 && t >= T_SHOCK;
  jar(out, jarP, touched && t < T_SHOCK + 0.4 ? 1 : 0);
  personAt(cam, t, out, 1, NOLLET, "nol", PAR[0], D0, PAR[2], id === 4 ? (t < 16.3 ? "neutral" : "whistle") : id === 3 && touched ? "laugh" : "smile");
  // onlookers
  personAt(cam, t, out, 20, FOLK[1], "f1", PAR[0] - 1.6, D0, PAR[2] - 1.2, touched ? "laugh" : "smile");
  personAt(cam, t, out, 21, FOLK[4], "f4", PAR[0] + 2.8, D0, PAR[2] - 1.0, touched ? "shock" : "neutral");
  personAt(cam, t, out, 22, FOLK[3], "f3", PAR[0] - 2.8, D0, PAR[2] + 1.0, "smile");
  // the gentleman who touches the jar (shot 3): reaches, then jumps
  if (id === 2 || id === 3) {
    const y = D0 + (id === 3 ? hop(t, T_SHOCK - 0.03) : 0);
    const ex: Expr = id === 3 ? (t < T_TOUCH ? "smile" : t < T_SHOCK - 0.03 ? "whistle" : t < T_SHOCK + 1.0 ? "shock" : "dazed") : "smile";
    personAt(cam, t, out, 23, GENT, "gent", PAR[0] + 1.5, y, PAR[2] + 0.8, ex, id === 3 ? { wave: q(smooth((t - T_TOUCH + 0.2) / 0.5), 8) } : {});
    if (id === 3) spark(out, "g", [jarP[0], STAND_Y + 0.46, jarP[2] + 0.1], t, T_SHOCK, 0.5);
  }
  if (id === 4) out.fx.push({ key: "bub0", cw: 420, ch: 380, draw: (p) => drawBubble(p, 0, 0), ...xyz(beside(cam, PAR[0], D0, PAR[2], -0.45, 2.42)), w: 0.85, h: 0.77 });
};

const gardenSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const open = t >= T_TAP;
  personAt(cam, t, out, 30, MONKS[1], "g1", GAR[0] + 0.45, D0, GAR[2] - 5.55, open ? "grin" : "smile", t >= T_TAP - 0.4 ? { wave: 0 } : {});
  const ex: Expr = !open ? "neutral" : t < T_TAP + 1.2 ? "shock" : "laugh";
  personAt(cam, t, out, 31, MONKS[0], "g0", GAR[0] + 1.75, D0, GAR[2] + 1.05, ex);
  if (open) {
    const u = q(clamp01((t - T_TAP) / 0.25), 10);
    const nz: V3 = [GAR[0] + 1.35, D0 + 0.92, GAR[2] + 0.8];
    out.fx.push({ key: `spray${u}`, cw: 360, ch: 260, draw: (p) => drawSpray(p, u), ...xyz(beside(cam, nz[0], nz[1], nz[2], 0.72, -0.35, 0.2)), w: 1.45, h: 1.05 });
  }
};

const versaillesSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const jumpT = T_GUARDS;
  for (let j = 0; j < NG; j++) {
    const [x, , z] = guardP(j);
    const y = D0 + (id === 13 ? hop(t, jumpT) : 0);
    const ex: Expr = id === 13 && t >= jumpT - 0.03 ? (t < jumpT + 1.1 ? "shock" : "dazed") : id === 14 ? "dazed" : "stern";
    personAt(cam, t, out, 60 + j, GUARD(j), `gd${j % 4}`, x, y, z, ex, {}, Math.hypot(cam.pos.x - x, cam.pos.z - z) < 12);
  }
  const front: V3 = [VER[0] - DIRV[0] * 1.3, STAND_Y, VER[2] - DIRV[2] * 1.3];
  jar(out, front, id === 13 && t >= jumpT && t < jumpT + 0.4 ? 1 : 0);
  if (id === 13) spark(out, "v", [front[0], STAND_Y + 0.46, front[2]], t, jumpT, 0.4);
  const nx = VER[0] + 0.9, nz = VER[2] + 0.7;
  const nex: Expr = id === 14 ? (t < 57.6 ? "smile" : "laugh") : t > jumpT ? "grin" : "smile";
  personAt(cam, t, out, 1, NOLLET, "nol", nx, D0, nz, nex, id === 14 && t > 57.5 ? { wave: 1 } : {});
  const kex: Expr = id === 13 ? (t < jumpT + 0.2 ? "smile" : "laugh") : "laugh";
  personAt(cam, t, out, 70, KING, "king", VER[0] + 2.9, D0, VER[2] - 1.6, kex);
  personAt(cam, t, out, 71, FOLK[5], "f5", VER[0] + 3.9, D0, VER[2] - 2.6, id === 13 && t > jumpT ? "shock" : "smile");
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "paris") parisSet(id, t, cam, out);
  else if (s.scene === "garden") gardenSet(id, t, cam, out);
  else if (s.scene === "versailles") versaillesSet(id, t, cam, out);
  else ringSet(id, t, cam, out);
  void LEAD;
  return out;
};
