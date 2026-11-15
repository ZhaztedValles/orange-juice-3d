// The cast and hand-drawn props of the balloon story: Glaisher (grey whiskers, dark coat, notebook) and Coxwell (cap,
// moustache) in the basket, the crowd at the gasworks, the instrument board (thermometer and dials), frost on the
// hands, breath and gas puffs, the deck of clouds five miles up, and the stack of pillows in the cottage garden.
// Every prop is an unlit ink-outlined drawing. ropeEnds() gives the net, ring and valve rope spans for world.ts.
import { Pen, townsfolk, KID, PARENT, SKINS, Outfit, Expr, FrontOpts, fxPuff, fxCloud } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, hh } from "../../src/engine/cards";
import {
  D0, SHOTS, PIL, GLA, COX, BASKET, RIM, RING_Y, RING_R, NECK_Y, ENV_R, ENV_C, TOP_Y, SKY_Y, V3, smooth, clamp01, bw, camAt,
  T_TEETH, T_ROSE, T_THERMO, T_FREEZE, T_SLOWED, T_LIMP, T_CLIMBED, T_DOWN, T_HANDS, T_SQUASH, T_FLUFFY, T_BREATH, T_SWITCH,
  T_GRAB, T_JERK, T_HISS, T_WOKE, T_PENCIL, T_SLEPT, T_HENRY,
} from "./story";

const GLAISHER: Outfit = { jacket: "#3a3f5a", pants: "#4a4f5e", boots: "#2a2220", hat: "hair", hair: "#a8a4a0", moustache: "#a8a4a0", buttons: "#d9b45a", skin: SKINS[1] };
const COXWELL: Outfit = { jacket: "#7a4a2c", pants: "#3b3f52", boots: "#3a2a20", hat: "cap", cap: "#3f5a46", moustache: "#4a3020", skin: SKINS[0] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const WORKER: Outfit = { jacket: "#5a5a66", pants: "#3a3a44", boots: "#2a2220", hat: "cap", cap: "#4a4a52", skin: SKINS[2], moustache: "#5a3b2a" };
const KIDO: Outfit = { ...KID, jacket: "#5a8fc2", hat: "hair", hair: "#5a3b2a", skin: SKINS[1] };
const MOTHER: Outfit = { ...PARENT, jacket: "#8c3b4a", dress: "#d9a441", hat: "bonnet", skin: SKINS[2] };
const INKC = "#241726";

// ---------------- drawings ----------------
/** the instrument board (300 x 400): a thermometer (red column at level 0..1) and two dials; frost creeps in when cold */
const drawBoard = (p: Pen, level: number, frost: number) => {
  p.poly([[20, 20], [280, 20], [280, 380], [20, 380]], "#8a6038", 8);
  p.poly([[70, 40], [130, 40], [130, 360], [70, 360]], "#f2ead6", 6); // the thermometer's card
  p.ell(100, 320, 22, 22, "#c8342c", 6);
  p.poly([[92, 320], [108, 320], [108, 300 - 230 * level], [92, 300 - 230 * level]], "#c8342c", 0);
  p.line([[92, 70], [92, 318]], INKC, 4, false); p.line([[108, 70], [108, 318]], INKC, 4, false);
  for (let k = 0; k < 7; k++) p.line([[112, 80 + 34 * k], [126, 80 + 34 * k]], INKC, 4, false);
  for (const [cx, cy, a] of [[205, 120, -0.6 - 1.6 * (1 - level)], [205, 270, 0.4 + 0.8 * level]] as const) {
    p.ell(cx, cy, 52, 52, "#f4efe2", 7);
    p.stroke([[cx, cy], [cx + 40 * Math.cos(a - Math.PI / 2), cy + 40 * Math.sin(a - Math.PI / 2)]], 7, INKC);
    p.dot(cx, cy, 7, INKC);
  }
  if (frost > 0.02) for (let i = 0; i < 9; i++) {
    const x = 30 + ((i * 97) % 240), y = 30 + ((i * 53) % 320), r = 16 + 10 * frost;
    for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; p.line([[x - r * Math.cos(a), y - r * Math.sin(a)], [x + r * Math.cos(a), y + r * Math.sin(a)]], `rgba(214,236,250,${(0.9 * frost).toFixed(2)})`, 5, false); }
  }
};
/** Glaisher's open notebook (300 x 220), the pencil at u 0..1 along the line */
const drawBook = (p: Pen, u: number) => {
  p.poly([[20, 60], [150, 40], [150, 200], [20, 210]], "#f6f0de", 7);
  p.poly([[150, 40], [280, 60], [280, 210], [150, 200]], "#efe6cc", 7);
  for (let k = 0; k < 4; k++) { p.line([[38, 88 + 28 * k], [132, 80 + 28 * k]], "#7a7c90", 4, false); p.line([[168, 80 + 28 * k], [262, 88 + 28 * k]], "#7a7c90", 4, false); }
  const px = 168 + 90 * u;
  p.line([[px, 150], [px + 40, 60]], "#d9a441", 12); p.line([[px, 150], [px + 6, 136]], INKC, 6, false);
};
/** frost on a hand (200 x 200): a pale-blue ice crust with sparkles */
const drawIce = (p: Pen) => {
  p.ell(100, 100, 46, 40, "rgba(200,230,248,0.92)", 6);
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 4; p.line([[100 - 78 * Math.cos(a), 100 - 78 * Math.sin(a)], [100 + 78 * Math.cos(a), 100 + 78 * Math.sin(a)]], "#e8f6ff", 6); }
};
/** the stack of five pillows on the bench (520 x 640): squash 0 = all fluffy .. 1 = flat at the bottom, fluffy on top */
const drawPillows = (p: Pen, squash: number, wob: number) => {
  const cols = ["#efe6d2", "#d8e4ef", "#f2d9d2", "#e6efd8", "#efe1c2", "#f4f0ea"];
  let y = 630;
  for (let i = 0; i < 5; i++) {
    const k = i / 4, h = 128 * (1 - squash * 0.62 * (1 - k) ** 1.2) * (i === 4 ? 1 + 0.08 * wob : 1), w = 215 - 8 * i + 30 * squash * (1 - k);
    const cy = y - h / 2;
    p.ell(260, cy, w, h / 2, cols[i], 7);
    p.line([[260 - w * 0.6, cy + h * 0.05], [260 + w * 0.6, cy - h * 0.05]], "rgba(36,23,38,0.25)", 4, false);
    y -= h * 0.92;
  }
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: expr === "dazed" ? 0 : lidAt(t, i), ...extra }, {}, o.build === "kid" ? 1 : 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
const puff = (out: Stage, p: V3, u: number, size: number) => {
  const uq = q(u, 10);
  out.fx.push({ key: `puff${uq}`, cw: 300, ch: 300, draw: (pn) => fxPuff(pn, uq), x: p[0], y: p[1] + 0.25 * size * u, z: p[2], w: size * (0.6 + 0.7 * u), h: size * (0.6 + 0.7 * u), soft: true });
};

/** Glaisher's state in shot id at time t: awake 0, fading 1, out cold 2 */
const glaState = (id: number, t: number) => {
  if (id === 1 || (id >= 7 && id <= 12)) return 2;
  if (id === 6) return t < T_SLOWED - 0.07 ? 0 : t < T_LIMP - 0.07 ? 1 : 2;
  if (id === 13) return t < T_WOKE - 0.07 ? 2 : 0;
  return 0;
};
/** the valve rope: tangled at the ring until Coxwell frees it (shot 7), then hanging free, then in his teeth */
const ropeState = (id: number, t: number): "tangle" | "free" | "teeth" => {
  if (id === 1) return "teeth";
  if (id >= 4 && id <= 6) return "tangle";
  if (id === 7) return t < 34.0 ? "tangle" : "free";
  if (id === 12) return t < T_GRAB - 0.07 ? "free" : "teeth";
  return "free";
};
/** Coxwell's head jerks on the rope (degrees of head tilt) */
const jerk = (id: number, t: number) => {
  if (id === 12 && t >= T_JERK - 0.07 && t < T_JERK + 1.4) return q(14 * Math.sin((t - T_JERK + 0.07) * Math.PI * 2 * 1.6) * (1 - (t - T_JERK) / 1.6), 2);
  if (id === 1 && t >= T_TEETH - 0.07 && t < T_TEETH + 0.9) return q(12 * Math.sin((t - T_TEETH + 0.07) * Math.PI * 2 * 1.6), 2);
  return 0;
};
/** where Coxwell's mouth is (local), with the head jerk */
const coxMouth = (j: number): V3 => [COX[0] + 0.006 * j, 1.37, COX[1] + 0.06];
/** Coxwell's climb into the ring (shot 7): 0 in the basket .. 1 up at the ring */
const climbU = (id: number, t: number) => (id === 7 ? smooth((t - T_CLIMBED + 0.07) / 1.0) : 0);

/** the rope spans: [from, to, slack 0..1] */
export const ropeEnds = (id: number, t: number): [V3, V3, number][] => {
  const out: [V3, V3, number][] = [];
  if (SHOTS[id - 1].scene === "garden") return out;
  const L = (x: number, y: number, z: number) => bw(id, t, x, y, z);
  const ph = -0.7, nr = ENV_R * Math.cos(ph), ny = ENV_C + Math.sin(ph) * (ENV_C - NECK_Y - 0.6);
  for (let k = 0; k < 8; k++) { // the net: envelope to the load ring
    const a = (k / 8) * Math.PI * 2 + 0.2;
    out.push([L(nr * Math.cos(a), ny, nr * Math.sin(a)), L(RING_R * Math.cos(a), RING_Y, RING_R * Math.sin(a)), 0]);
  }
  for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { // ring to the basket corners
    const a = Math.atan2(cz, cx);
    out.push([L(RING_R * Math.cos(a), RING_Y, RING_R * Math.sin(a)), L(cx * (BASKET - 0.03), RIM, cz * (BASKET - 0.03)), 0]);
  }
  const rs = ropeState(id, t), top = L(0, NECK_Y, 0);
  if (rs === "tangle") { // knotted round the ring: a zigzag of short spans, then a loose end
    const pts: V3[] = [top, L(0.3, RING_Y + 0.45, 0.25), L(-0.5, RING_Y + 0.05, 0.55), L(0.55, RING_Y - 0.1, 0.4), L(-0.2, RING_Y + 0.3, -0.5), L(0.65, RING_Y + 0.15, -0.2), L(0.5, RING_Y - 0.6, 0.3)];
    for (let i = 0; i + 1 < pts.length; i++) out.push([pts[i], pts[i + 1], 0.2]);
  } else if (rs === "free") out.push([top, L(0.05, RIM + 0.1, -0.68), 0.05]); // down the back wall, clear of the faces
  else { // over the ring and down to his mouth, in front of his face
    const m = coxMouth(jerk(id, t)), via = L(m[0] + 0.5, RING_Y - 0.2, m[2] + 0.3), lip = L(m[0] - 0.05, m[1] + 0.08, m[2] + 0.06);
    out.push([top, via, 0], [via, lip, 0.1], [lip, L(m[0] + 0.03, m[1], m[2] + 0.06), 0]);
  }
  return out;
};

// ---------------- the places ----------------
/** the two in the basket and their props, in shot id (also on the ground in the yard) */
const basketCrew = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const L = (x: number, y: number, z: number) => bw(id, t, x, y, z);
  const fy = 0.06;
  // ---- Glaisher ----
  const gs = glaState(id, t);
  let gex: Expr = id === 2 ? "smile" : id === 3 ? (t < T_ROSE - 0.07 ? "smile" : "grin") : "stern";
  if (id === 4) gex = t < T_FREEZE - 0.07 ? "stern" : "nervous";
  if (gs === 1) gex = "nervous";
  if (gs === 2) gex = "dazed";
  if (id === 13 && gs === 0) gex = t < T_PENCIL - 0.07 ? "shock" : "relief";
  if (id === 14) gex = t < T_SLEPT - 0.07 ? "smile" : "nervous";
  const slump = gs === 2 ? (id === 6 ? smooth((t - T_LIMP + 0.07) / 0.5) : 1) : 0;
  const g = L(GLA[0], fy - 0.12 * slump, GLA[1]);
  front(cam, t, out, 1, GLAISHER, "gla", g[0], g[1], g[2], gex, { tilt: q(-9 * slump, 2), headTilt: q(-22 * slump, 2) }, false);
  // the notebook: held over the rim, the pencil moving; it drops below the rim when he goes limp
  if (id !== 9 && id !== 5) {
    const writing = gs === 0 && id !== 3 && id !== 14 ? ((t * 0.8) % 1) : gs === 1 ? 0.2 : 0.5;
    const drop = gs === 2 ? (id === 6 ? smooth((t - T_LIMP + 0.07) / 0.25) : 1) : 0;
    const b = L(GLA[0] + 0.1, 1.06 - 0.5 * drop, GLA[1] + 0.3);
    const wq = q(writing, 8);
    if (drop < 1) out.fx.push({ key: `book${wq}`, cw: 300, ch: 220, draw: (p) => drawBook(p, wq), x: b[0], y: b[1], z: b[2], w: 0.36, h: 0.26 });
  }
  // ---- Coxwell ----
  const cu = climbU(id, t), hands = id === 1 || (id === 8 && t >= T_HANDS - 0.07) || id === 11 || id === 12;
  let cex: Expr = id === 2 ? (t < T_HENRY - 0.07 ? "smile" : "grin") : id === 3 ? "grin" : "stern";
  if (id === 6) cex = t < T_LIMP - 0.07 ? "stern" : "shock";
  if (id === 7) cex = "nervous";
  if (id === 8) cex = t < T_DOWN - 0.07 ? "nervous" : t < T_HANDS - 0.07 ? "stern" : "shock";
  if (id === 11) cex = t < T_SWITCH - 0.07 ? "pained" : "dazed";
  if (id === 12 || id === 1) cex = ropeState(id, t) === "teeth" ? "pained" : "nervous";
  if (id === 13) cex = t < T_WOKE - 0.07 ? "stern" : "relief";
  if (id === 14) cex = t < T_SLEPT - 0.07 ? "smile" : "laugh";
  const c = L(COX[0] - 0.12 * cu, fy + cu * (RING_Y - 1.55), COX[1] - 0.05 * cu);
  const up = cu > 0.02 || hands;
  front(cam, t, out, 2, COXWELL, "cox", c[0], c[1], c[2], cex, { ...(up ? { mode: "fall" as const } : {}), headTilt: jerk(id, t) }, false);
  if (hands) for (const s of [-1, 1]) { const h = L(COX[0] + s * 0.36, 1.47, COX[1] + 0.05); out.fx.push({ key: "ice", cw: 200, ch: 200, draw: drawIce, x: h[0], y: h[1], z: h[2], w: 0.2, h: 0.2 }); }
  // ---- the instrument board on its post at the basket's front corner ----
  if (id !== 9 && id !== 5 && id !== 2 && id !== 3) {
    const level = id === 4 ? 0.62 - 0.5 * smooth((t - T_THERMO + 0.3) / 1.6) : id >= 13 ? 0.25 : 0.12;
    const frost = id === 4 ? smooth((t - T_FREEZE + 0.07) / 0.8) : id >= 13 ? 0.3 : 1;
    const lq = q(level, 30), fq = q(frost, 6), bp = L(-0.84, 1.22, 0.2);
    out.fx.push({ key: `board${lq}_${fq}`, cw: 300, ch: 400, draw: (p) => drawBoard(p, lq, fq), x: bp[0], y: bp[1], z: bp[2], w: 0.3, h: 0.4 });
  }
  // ---- breath (shot 11) and the gas out of the valve (shots 12-13) ----
  if (id === 11) for (const [w, x0] of [[0, GLA[0]], [1, COX[0]]] as const) {
    const u = ((t - T_BREATH + 0.07 + 0.6 * w) % 1.6) / 0.9;
    if (t >= T_BREATH - 0.5 && u >= 0 && u < 1) puff(out, L(x0 + 0.12, 1.32, 0.3), u, 0.22);
  }
  if ((id === 12 && t >= T_HISS - 0.07) || id === 13) for (let k = 0; k < 4; k++) {
    const u = ((t - T_HISS + 0.07) * 0.9 + k / 4) % 1, s = id === 13 ? 1.4 : 2.4;
    puff(out, L(0.5 * Math.sin(k * 2.1), TOP_Y + 0.3 + 2.0 * u, 0.5 * Math.cos(k * 2.1)), u, s);
  }
};

/** the deck of clouds under the balloon (and a few above); none within 14 m of the shot's opening lens */
const clouds = (id: number, t: number, out: Stage) => {
  if (id === 9 || id === 14) return;
  const s = SHOTS[id - 1], c0 = camAt(id, s.a).pos;
  const deck = id === 13 ? SKY_Y - 18 : id === 5 ? SKY_Y + 4 : SKY_Y - 30;
  for (let i = 0; i < 44; i++) {
    const a = hh(i, 1) * Math.PI * 2, d = 22 + 150 * hh(i, 2), x = Math.cos(a) * d, z = Math.sin(a) * d;
    const y = deck - 18 * hh(i, 3) + (i % 5 === 0 ? 70 + 40 * hh(i, 4) : 0), w = 24 + 36 * hh(i, 5);
    if (Math.hypot(x - c0[0], y - c0[1], z - c0[2]) < 14 + w / 2) continue;
    out.fx.push({ key: `cloud${i % 4}`, cw: 600, ch: 300, draw: (p) => fxCloud(p, i % 4), x, y, z, w, h: w / 2, soft: true });
  }
  void t;
};

const yardSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  basketCrew(id, t, cam, out);
  const cheer = id === 3 && t >= T_ROSE - 0.07;
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (0.08 + 0.84 * (i / 13)), r = 10.2 + 1.1 * (i % 3), x = Math.cos(a) * r, z = Math.sin(a) * r - 1;
    const o = i % 4 === 3 ? WORKER : FOLK[i % 6];
    const ex: Expr = cheer ? (i % 2 ? "laugh" : "shock") : i % 3 ? "smile" : "neutral";
    front(cam, t, out, 20 + i, o, `crowd${i}`, x, D0 + 0.08, z, ex, cheer && i % 2 === 0 ? { wave: q(Math.sin(t * 7 + i), 4) } : {});
  }
  if (id === 2) front(cam, t, out, 40, WORKER, "wk", 2.4, D0 + 0.08, 1.4, "stern");
};

const skySet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  clouds(id, t, out);
  basketCrew(id, t, cam, out);
};

const gardenSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const sq = q(0.35 + 0.65 * smooth((t - T_SQUASH + 0.07) / 0.6), 20), wob = q(clamp01(1 - Math.abs(t - T_FLUFFY - 0.25) / 0.5) * Math.sin((t - T_FLUFFY) * 18), 6);
  out.fx.push({ key: `pillows${sq}_${wob}`, cw: 520, ch: 640, draw: (p) => drawPillows(p, sq, wob), x: PIL[0] - 0.2, y: D0 + 0.52 + 0.62, z: PIL[2], w: 1.0, h: 1.24 });
  const press = t >= T_SQUASH - 0.07 && t < T_FLUFFY - 0.07;
  front(cam, t, out, 50, KIDO, "kid", PIL[0] - 1.0, D0, PIL[2] + 0.45, press ? "grin" : t >= T_FLUFFY - 0.07 ? "laugh" : "smile", press ? { wave: 0.6 } : {});
  front(cam, t, out, 51, MOTHER, "mum", PIL[0] + 0.85, D0, PIL[2] + 0.3, t >= T_FLUFFY - 0.07 ? "smile_closed" : "smile");
  void id;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "yard") yardSet(id, t, cam, out);
  else if (s.scene === "sky") skySet(id, t, cam, out);
  else gardenSet(id, t, cam, out);
  return out;
};
