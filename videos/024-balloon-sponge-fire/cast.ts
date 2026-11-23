// The cast and hand-drawn props of the balloon story: the Marquis d'Arlandes (red coat, powdered hair), Pilatre de
// Rozier (blue coat, dark hair), the king (royal blue, gold sash, powdered wig), Benjamin Franklin (brown coat, long
// grey hair), the crowd of the garden. Drawn props and effects: the straw fire, its smoke and sparks, the burning
// spots on the paper, the wet sponge on its pitchfork, the champagne bottle, its cork and foam.
import { Pen, SKINS, Outfit, Expr, FrontOpts, SideOpts, townsfolk, fxBurst, fxPuff } from "../../src/engine/toon";
import { CamInfo, Stage, Who, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, smooth, clamp01, balloonAt, fireAt, SPOTS, spotSize, envPt, MARQ, PIL, KING, FRANK, FIELD, LAUNCH, V3,
  T_GARDEN, T_STEP, T_KING, T_WATCH, T_FRANKLIN, T_ROPES, T_UP, T_LOOKING, T_SINK, T_SHOUTS, T_BATHING, T_SPARKS,
  T_STICKS, T_ONE2, T_STOPS, T_DROP, T_SEINE, T_SPOTS, T_ZERO, T_BUMP, T_ALIVE, T_FIRST, T_POP, T_THREE,
} from "./story";

const MARQUIS: Outfit = { jacket: "#8a3a34", pants: "#e8e2d4", boots: "#2a1e18", hat: "hair", hair: "#e6e0d2", buttons: "#c9a24a", belt: null, skin: SKINS[0] };
const PILATRE: Outfit = { jacket: "#2f5a7e", pants: "#d8d0bc", boots: "#1e1a1e", hat: "hair", hair: "#3a2a20", buttons: "#c9a24a", belt: null, skin: SKINS[1] };
const KINGO: Outfit = { jacket: "#2a4486", pants: "#e8e2d4", boots: "#1e1a1e", hat: "hair", hair: "#ece6da", sash: "#d4a53a", buttons: "#d4a53a", belt: null, skin: SKINS[0], build: "stout" };
const FRANKO: Outfit = { jacket: "#6a4a32", pants: "#5a4030", boots: "#2a1e18", hat: "hair", hair: "#c8c2b8", buttons: "#8a6a44", belt: null, skin: SKINS[1], build: "stout" };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);

// ---------------- drawings ----------------
/** flames (300 x 400): tongues of red, orange and yellow, flickering smoothly with the phase k (radians, period 2 pi) */
const drawFlame = (k: number) => (p: Pen) => {
  const tongues = (col: string, s: number, w: number) => {
    const pts: [number, number][] = [[150 - 130 * w, 390]];
    for (let i = 0; i < 5; i++) {
      const x = 150 - 130 * w + (260 * w * (i + 0.5)) / 5, h = s * (220 + 80 * Math.sin(i * 2.1 + 2 * k) + 30 * Math.sin(i * 1.3 + 3 * k));
      pts.push([x - 22 * w, 390 - h * 0.45], [x + 6 * Math.sin(2 * k + i), 390 - h], [x + 22 * w, 390 - h * 0.45]);
    }
    pts.push([150 + 130 * w, 390]);
    p.poly(pts, col, 6);
  };
  tongues("#d8452c", 1.0, 1.0); tongues("#f08a2a", 0.72, 0.8); tongues("#ffd45a", 0.42, 0.55);
};
/** soft grey smoke (300 x 300) drifting with the phase k */
const drawSmoke = (k: number) => (p: Pen) => {
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1 + 0.3 * Math.sin(k + i), r = 46 + 18 * (i % 3);
    p.ell(150 + 70 * Math.cos(a), 170 + 50 * Math.sin(a) - i * 10, r, r * 0.85, "rgba(150,144,150,0.8)", 0);
  }
};
/** rising sparks (300 x 300) at phase k in 0..1: each spark drifts up and wraps to the bottom */
const drawSparks = (k: number) => (p: Pen) => {
  for (let i = 0; i < 12; i++) {
    const x = 30 + ((i * 97) % 240) + 8 * Math.sin(2 * Math.PI * k + i), y = 280 - 260 * ((((i * 53) % 260) / 260 + k) % 1);
    p.ell(x, y, 7, 7, i % 2 ? "#ffe07a" : "#ffb04a", 3);
  }
};
/** a burning spot in the paper (200 x 200): a ragged black hole in a glowing orange ring, flickering with k */
const drawSpot = (k: number) => (p: Pen) => {
  const ring = (r: number, col: string, ol: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, rr = r * (1 + 0.12 * Math.sin(i * 2.7 + k)); pts.push([100 + rr * Math.cos(a), 100 + rr * Math.sin(a)]); }
    p.poly(pts, col, ol);
  };
  ring(88, "#ff9a3a", 6); ring(62, "#ffd45a", 0); ring(40, "#2a1a16", 4);
};
/** the pitchfork with the wet sponge on its tines (200 x 600): shaft from the bottom up, tines and a yellow sponge on top */
const drawFork = (p: Pen) => {
  p.line([[100, 590], [100, 170]], "#a67a4a", 16);
  p.poly([[60, 170], [140, 170], [140, 186], [60, 186]], "#4a4448", 5);
  for (const x of [66, 100, 134]) p.line([[x, 178], [x, 90]], "#4a4448", 8);
  p.ell(100, 70, 58, 44, "#e8c860", 6);
  for (let i = 0; i < 7; i++) p.dot(70 + (i * 37) % 64, 52 + (i * 23) % 40, 6, "#b89430");
};
/** the champagne bottle (200 x 500), corked or open */
const drawBottle = (open: boolean) => (p: Pen) => {
  p.poly([[60, 490], [140, 490], [140, 230], [118, 170], [112, 70], [88, 70], [82, 170], [60, 230]], "#2f6a3a", 6);
  p.poly([[64, 400], [136, 400], [136, 300], [64, 300]], "#efe2c0", 4);
  p.poly([[84, 120], [116, 120], [114, 64], [86, 64]], "#d4a53a", 4);
  if (!open) p.poly([[88, 64], [112, 64], [116, 30], [84, 30]], "#c8a070", 5);
};
/** foam spraying out of the bottle (300 x 300) at t 0..1 */
const drawFoam = (t: number) => (p: Pen) => {
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.22, d = 40 + 200 * t * (0.6 + 0.4 * ((i * 7) % 5) / 5);
    const r = 28 * (1 - t);
    p.ell(150 + d * Math.cos(a), 290 + d * Math.sin(a), r, r, "#fbf6e6", 4);
  }
};
const drawCork = (p: Pen) => p.poly([[70, 80], [130, 80], [140, 20], [60, 20]], "#c8a070", 6);

// ---------------- helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true, scale = 1) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, scale));
  if (shadow) blob(out, x, y, z, scale);
};
/** someone walking along x (dir +1 / -1) at v m/s: side view (or front stroll when seen head-on) */
const walk = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, dir: number, v: number, expr: Expr) => {
  const vw = viewOf(cam, x, z, dir, 0), phase = (t * v * 1.25) % 1;
  if (vw.side) {
    const so: SideOpts = { mode: "march", phase, expr, blink: lidAt(t, i), stride: Math.max(0.3, vw.fs) * Math.min(1, v / 1.6) };
    out.places.push(person(cam, who(i, o, okey), x, y, z, { side: true, mirror: vw.mirror }, {}, so));
  } else out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stroll", phase, expr, blink: lidAt(t, i) }, {}));
  blob(out, x, y, z);
};
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: { soft?: boolean; flat?: boolean; rot?: number } = {}) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, ...extra });
};
const at = (t: number, t0: number) => t >= t0 - 0.07;
/** the frame number modulo 60: the phase of the looping fire, smoke, spark and spot drawings (one small step per frame) */
const PH = (t: number) => Math.round(t * 30) % 60;
const add = (b: V3, o: V3): V3 => [b[0] + o[0], b[1] + o[1], b[2] + o[2]];
/** the point d metres from (x, z) toward the camera (props held in front of a character card) */
const toCam = (cam: CamInfo, x: number, z: number, d: number): [number, number] => {
  const dx = cam.pos.x - x, dz = cam.pos.z - z, l = Math.hypot(dx, dz) || 1;
  return [x + (dx / l) * d, z + (dz / l) * d];
};
/** the straw fire in the brazier of a balloon at b, size u 0..1 */
const fire = (out: Stage, t: number, b: V3, u: number) => {
  if (u <= 0.01) return;
  const n = PH(t), k = (2 * Math.PI * n) / 60, n2 = (n + 30) % 60;
  card(out, `flame|${n}`, 300, 400, drawFlame(k), b[0], b[1] + 1.02 + 0.45 * u, b[2], 1.0 * u, 1.3 * u);
  card(out, `flame|${n2}`, 300, 400, drawFlame((2 * Math.PI * n2) / 60), b[0] + 0.15, b[1] + 1.0 + 0.3 * u, b[2] + 0.12, 0.7 * u, 0.95 * u);
  card(out, `smoke|${n}`, 300, 300, drawSmoke(k), b[0], b[1] + 2.4 + 0.2 * Math.sin(t), b[2], 1.4 * u, 1.4 * u, { soft: true });
};
/** the burning spots of shot id on the envelope of a balloon at b */
const spots = (out: Stage, id: number, t: number, b: V3) => {
  const n = PH(t);
  (SPOTS[id] ?? []).forEach((s) => {
    const w = spotSize(s, t), p = add(b, envPt(s[0], s[1], 0.25));
    card(out, `spot|${n}`, 200, 200, drawSpot((2 * Math.PI * n) / 60), p[0], p[1], p[2], w, w);
  });
};
/** the two men on the gallery of a balloon at b */
const aboard = (cam: CamInfo, t: number, out: Stage, b: V3, em: Expr, ep: Expr, xm: FrontOpts = {}, xp: FrontOpts = {}) => {
  front(cam, t, out, 1, MARQUIS, "marq", ...add(b, MARQ), em, xm, false);
  front(cam, t, out, 2, PILATRE, "pil", ...add(b, PIL), ep, xp, false);
};
/** the crowd on the lawn in front of the launch floor: rows facing the balloon, waving when `cheer` */
const crowd = (cam: CamInfo, t: number, out: Stage, cheer: boolean, skip: number[] = []) => {
  for (let i = 0; i < 16; i++) {
    if (skip.includes(i)) continue;
    const row = Math.floor(i / 8), x = -12 + (i % 8) * 3.3 + (row % 2) * 1.5 + 0.5 * Math.sin(i * 3.1), z = 13 + row * 4.2 + 0.6 * Math.cos(i * 1.7);
    const hop = cheer ? 0.07 * Math.abs(Math.sin(t * 6 + i)) : 0;
    front(cam, t, out, 40 + i, FOLK[i % 8], `f${i % 8}`, x, D0 + hop, z, cheer ? (i % 3 ? "laugh" : "grin") : i % 2 ? "smile" : "neutral", cheer && i % 2 ? { wave: 0.9 } : {});
  }
};
/** the sponge on the pitchfork, held up from the marquis' hand toward the spot it dabs; dab 0..1 pushes it in */
const fork = (cam: CamInfo, out: Stage, b: V3, target: V3, dab: number) => {
  const h = add(b, [MARQ[0] + 0.35, 1.45, MARQ[2] + 0.1]);
  const tip: V3 = [h[0] + (target[0] - h[0]) * (0.75 + 0.2 * dab), h[1] + (target[1] - h[1]) * (0.75 + 0.2 * dab), h[2] + (target[2] - h[2]) * (0.75 + 0.2 * dab)];
  const dx = (tip[0] - h[0]) * cam.right.x + (tip[2] - h[2]) * cam.right.z, dy = tip[1] - h[1], len = Math.hypot(dx, dy);
  const [cx, cz] = toCam(cam, (h[0] + tip[0]) / 2, (h[2] + tip[2]) / 2, 0.25);
  card(out, "fork", 200, 600, drawFork, cx, (h[1] + tip[1]) / 2, cz, len / 3, len, { rot: Math.atan2(dy, dx) - Math.PI / 2 });
};

// ---------------- the shots ----------------
const shots = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const b = balloonAt(id, t) as V3;
  if (id === 1 || id === 11) { // the marquis dabs out the burning spots with the sponge on his pitchfork
    const list = SPOTS[id], live = list.find((s) => t < s[4]) ?? list[list.length - 1];
    const dab = id === 11 && t < T_STICKS ? 0 : 0.5 + 0.5 * Math.sin(t * 9);
    const busy = id === 1 || t > T_STICKS - 0.1;
    aboard(cam, t, out, b, id === 1 ? "stern" : t > T_ONE2 + 0.2 ? "relief" : busy ? "stern" : "nervous", "neutral", busy ? { wave: 1, look: 0.3 } : {});
    if (busy) fork(cam, out, b, add(b, envPt(live[0], live[1], 0.25)), dab);
    spots(out, id, t, b);
    fire(out, t, b, 1);
    return;
  }
  if (id === 2) return; // Paris from above: no one yet
  if (id === 3) { // the two men walk up to the balloon on the launch floor; the crowd behind the hedge
    const u = smooth((t - T_GARDEN + 0.4) / (T_STEP + 0.4 - T_GARDEN));
    const xm = 11 - 6.6 * u, xp = 13 - 6.8 * u, walking = u > 0.02 && u < 0.98;
    if (walking) {
      walk(cam, t, out, 1, MARQUIS, "marq", xm, LAUNCH[1], 2.0, -1, 1.4, "smile");
      walk(cam, t, out, 2, PILATRE, "pil", xp, LAUNCH[1], 0.6, -1, 1.4, "grin");
    } else {
      front(cam, t, out, 1, MARQUIS, "marq", xm, LAUNCH[1], 2.0, at(t, 12.5) ? "grin" : "smile");
      front(cam, t, out, 2, PILATRE, "pil", xp, LAUNCH[1], 0.6, "grin", at(t, 12.5) ? { wave: 0.8 } : {});
    }
    fire(out, t, b, 0.7);
    return;
  }
  if (id === 4) { // the straw fire under the open neck
    aboard(cam, t, out, b, "smile", "stern");
    fire(out, t, b, 1);
    return;
  }
  if (id === 5) { // the king, then Benjamin Franklin, among the crowd
    crowd(cam, t, out, false, [3, 10]);
    front(cam, t, out, 20, KINGO, "king", ...KING, at(t, T_WATCH) ? "smile" : "neutral", at(t, T_KING) ? { look: -0.3 } : {});
    front(cam, t, out, 21, FRANKO, "frank", ...FRANK, at(t, T_FRANKLIN) ? "grin" : "smile", { look: -0.3 });
    void T_KING;
    return;
  }
  if (id === 6) { // the ropes let go; the balloon lifts over the trees; the crowd cheers
    const up = at(t, T_UP);
    crowd(cam, t, out, up);
    front(cam, t, out, 20, KINGO, "king", ...KING, up ? "laugh" : "smile");
    aboard(cam, t, out, b, up ? "grin" : "nervous", up ? "laugh" : "stern", up ? { wave: 1 } : {}, up ? { wave: 1 } : {});
    fire(out, t, b, 1);
    void T_ROPES;
    return;
  }
  if (id === 7) { // the marquis gazes at Paris and forgets the fire; they sink
    aboard(cam, t, out, b, at(t, T_SINK) ? "shock" : at(t, T_LOOKING) ? "smile_closed" : "smile", "neutral", at(t, T_SINK) ? {} : { look: 0.6 });
    fire(out, t, b, fireAt(7, t));
    return;
  }
  if (id === 8) { // Pilatre shouts round the neck
    const shout = at(t, T_SHOUTS) && t < T_BATHING + 0.5;
    aboard(cam, t, out, b, "neutral", shout ? "shock" : at(t, T_BATHING + 0.5) ? "stern" : "nervous", {}, shout ? { wave: 1, look: 0.5 } : { look: 0.5 });
    fire(out, t, b, 0.6);
    return;
  }
  if (id === 9) { // wide: high over Paris
    aboard(cam, t, out, b, "nervous", "stern");
    fire(out, t, b, 1);
    void T_THREE;
    return;
  }
  if (id === 10) { // the envelope: sparks rise from the straw and burn glowing holes
    if (at(t, T_SPARKS)) { const n = PH(t) % 30; const p = add(b, envPt(5.5, 0.05, 0.6)); card(out, `sparks|${n}`, 300, 300, drawSparks(n / 30), p[0], p[1], p[2], 3.0 * smooth((t - T_SPARKS + 0.07) / 0.3), 3.0); }
    spots(out, 10, t, b);
    aboard(cam, t, out, b, at(t, 36.3) ? "shock" : "neutral", "neutral");
    return;
  }
  if (id === 12) { // the balloon drops toward the roofs
    aboard(cam, t, out, b, at(t, T_DROP) ? "shock" : at(t, T_STOPS) ? "nervous" : "stern", at(t, T_DROP) ? "shock" : "stern");
    fire(out, t, b, 0.5);
    return;
  }
  if (id === 13) { // across the Seine; the spots spread
    aboard(cam, t, out, b, "nervous", "nervous");
    spots(out, 13, t, b);
    fire(out, t, b, 0.8);
    void T_SEINE; void T_SPOTS;
    return;
  }
  if (id === 14) { // he lets the fire die; a last puff of smoke on "zero"
    aboard(cam, t, out, b, "stern", "nervous");
    fire(out, t, b, fireAt(14, t));
    const u = (t - T_ZERO + 0.1) / 1.0;
    if (u > 0 && u < 1) { const k = Math.round(u * 24) / 24; card(out, `puff|${k}`, 300, 300, (p) => fxPuff(p, k), b[0], b[1] + 1.4 + 0.8 * u, b[2], 1.4, 1.4, { soft: true }); }
    return;
  }
  if (id === 15) { // the bump between the windmills; burnt but alive
    const down = at(t, T_BUMP);
    aboard(cam, t, out, b, at(t, T_ALIVE) ? "laugh" : down ? "dazed" : "nervous", at(t, T_ALIVE) ? "laugh" : down ? "dazed" : "shock", at(t, T_ALIVE) ? { wave: 1 } : {}, at(t, T_ALIVE) ? { wave: 0.8 } : {});
    return;
  }
  // id 16: on the grass by the sagging balloon: the champagne
  const [FX, , FZ] = FIELD, popped = at(t, T_POP);
  front(cam, t, out, 1, MARQUIS, "marq", FX - 0.45, D0, FZ + 4.8, popped ? "laugh" : at(t, T_FIRST) ? "grin" : "smile", popped ? { wave: 1 } : {});
  front(cam, t, out, 2, PILATRE, "pil", FX + 0.95, D0, FZ + 4.5, popped ? "laugh" : "grin");
  const [bx, bz] = toCam(cam, FX + 0.6, FZ + 4.5, 0.4);
  card(out, popped ? "bottle|o" : "bottle|c", 200, 500, drawBottle(popped), bx, D0 + 1.2, bz, 0.26, 0.65, { rot: 0.35 });
  const u = (t - T_POP + 0.05) / 0.8;
  if (u > 0 && u < 1) {
    const k = Math.round(u * 24) / 24;
    card(out, `pop|${k}`, 500, 500, (p) => fxBurst(p, k, "#fff3b0", 10, 40, 200), bx - 0.15, D0 + 1.5, bz, 0.7, 0.7);
    card(out, `foam|${k}`, 300, 300, drawFoam(k), bx - 0.15, D0 + 1.55 + 0.2 * k, bz, 0.6, 0.6);
  }
  if (u > 0 && u < 2.5) card(out, "cork", 200, 100, drawCork, bx - 0.2 - 0.9 * u, D0 + 1.5 + 2.4 * u - 1.2 * u * u, bz, 0.12, 0.06, { rot: 3 * u });
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  setStageLight(cam, SHOTS[id - 1].light);
  shots(id, t, cam, out);
  return out;
};
void clamp01;
