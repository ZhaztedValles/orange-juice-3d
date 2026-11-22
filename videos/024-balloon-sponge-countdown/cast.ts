// The cast and hand-drawn props of the first-flight story: Pilatre de Rozier (teal coat) and the Marquis d'Arlandes
// (red coat) on the gallery, the Montgolfier brothers at the brazier, the king and two prisoners on the lawn, the
// crowd, the farm folk at the windmills; the straw fire in the brazier, burning bits of straw, the glowing holes in
// the cloth (and their dark scorch marks once dabbed out), the pitchfork with its wet sponge, clouds over Paris.
// Every prop is an unlit ink-outlined drawing. Fire flickers by smooth size and sway on fixed drawings (no drawing
// swaps every few frames: those read as pops in QA).
import { Pen, townsfolk, SKINS, Outfit, Expr, FrontOpts, fxPuff, fxCloud } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, hh } from "../../src/engine/cards";
import {
  dragAt, D0, SHOTS, GARDEN, FIELD, KING_AT, MAN_R, DAR_A, PIL_A, V3, smooth, clamp01, bw, onGallery, envR, fireAt, collapseAt,
  T_FIRES, T_BLUE, T_STRAW, T_PRISON, T_BUT, T_PIL, T_BEGGED, T_RISE, T_SILENT, T_SEINE, T_BURNING, T_LAND, T_HOLES,
  T_DABS, T_SPONGE, T_SINK, T_SHOUTS, T_FEED, T_GROWS, T_HOLES2, T_WANTS, T_ROOFS, T_CLEAR, T_DIE, T_SETTLES,
  T_WINDMILLS, T_COLL, T_EMBERS, T_DRAGGED, T_OWN, T_MONT,
} from "./story";

const HAIR = "#ece6da"; // powdered hair
const DAR: Outfit = { jacket: "#9a3a34", pants: "#e9dfc6", boots: "#2a2220", hat: "hair", hair: HAIR, buttons: "#d9b45a", skin: SKINS[0] };
const PIL: Outfit = { jacket: "#2f6a66", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#d8d0c2", buttons: "#d9b45a", skin: SKINS[1] };
const KING: Outfit = { jacket: "#2f3f7a", pants: "#e9dfc6", boots: "#2a2220", hat: "hair", hair: HAIR, buttons: "#d9b45a", sash: "#5a8fc2", build: "stout", skin: SKINS[0] };
const PRISONER: Outfit = { jacket: "#6b6660", pants: "#5a5650", boots: "#3a3030", hat: "cap", cap: "#4a4640", moustache: "#4a3020", skin: SKINS[2] };
const PRISONER2: Outfit = { ...PRISONER, jacket: "#5d5a6a", moustache: undefined, skin: SKINS[3] };
const BRO1: Outfit = { jacket: "#5a4a3a", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#5a4030", skin: SKINS[1] };
const BRO2: Outfit = { jacket: "#3e5262", pants: "#4a4440", boots: "#2a2220", hat: "hair", hair: "#8a8078", skin: SKINS[0] };
const FARMER: Outfit = { jacket: "#7a6a4a", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", skin: SKINS[2] };
const FARMER2: Outfit = { jacket: "#4f6a4a", pants: "#5a4f44", boots: "#3a2a20", hat: "hair", hair: "#3a2a20", skin: SKINS[3] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => { const o = townsfolk(v); return o.hat === "tophat" ? { ...o, hat: "hair", hair: v % 3 ? HAIR : "#5a4030" } : o; });
const INKC = "#241726";

// ---------------- drawings ----------------
/** flames (300 x 400): tongues of red, orange and yellow (variant k only seeds the shape; it never changes in a shot) */
const drawFlame = (k: number) => (p: Pen) => {
  const tongues = (col: string, s: number, w: number) => {
    const pts: [number, number][] = [[150 - 130 * w, 390]];
    for (let i = 0; i < 5; i++) {
      const x = 150 - 130 * w + (260 * w * (i + 0.5)) / 5, h = s * (220 + 110 * Math.sin(i * 2.1 + k * 1.7));
      pts.push([x - 22 * w, 390 - h * 0.45], [x + 6 * Math.sin(k + i), 390 - h], [x + 22 * w, 390 - h * 0.45]);
    }
    pts.push([150 + 130 * w, 390]);
    p.poly(pts, col, 6);
  };
  tongues("#d8452c", 1.0, 1.0); tongues("#f08a2a", 0.72, 0.8); tongues("#ffd45a", 0.42, 0.55);
};
/** a glowing hole in the cloth (200 x 200): a ragged orange-gold ring round a dark burnt centre */
const drawHole = (p: Pen) => {
  const ring = (r: number, col: string, ink: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, rr = r * (0.82 + 0.18 * Math.sin(i * 2.7)); pts.push([100 + rr * Math.cos(a), 100 + rr * Math.sin(a)]); }
    p.poly(pts, col, ink);
  };
  ring(92, "#ff9a2e", 6); ring(66, "#ffd45a", 0); ring(42, "#3a1e1a", 5);
};
/** the dark scorch a dabbed-out hole leaves (200 x 200) */
const drawScorch = (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, rr = 70 * (0.8 + 0.2 * Math.sin(i * 2.7)); pts.push([100 + rr * Math.cos(a), 100 + rr * Math.sin(a)]); }
  p.poly(pts, "#3a2a2e", 5);
};
/** a burning bit of straw (120 x 120): a short gold stalk with an orange glowing tip */
const drawEmber = (p: Pen) => {
  p.stroke([[20, 100], [86, 34]], 10, INKC); p.stroke([[22, 98], [84, 36]], 6, "#e8c45a");
  p.ell(90, 30, 18, 18, "#ff8a2a", 5);
};
/** the pitchfork with the wet sponge on its tines (120 x 800): pole at the bottom, sponge at the top */
const drawFork = (p: Pen) => {
  p.stroke([[60, 790], [60, 170]], 16, INKC); p.stroke([[60, 788], [60, 172]], 10, "#9a6a3a");
  p.stroke([[28, 170], [92, 170]], 12, INKC);
  for (const x of [32, 60, 88]) p.stroke([[x, 170], [x, 110]], 8, INKC);
  p.ell(60, 80, 50, 42, "#e6c64a", 7); // the sponge
  for (const [x, y] of [[44, 70], [70, 92], [76, 62], [50, 96]]) p.dot(x, y, 6, "#b8962e");
};
/** a pitchfork of straw (120 x 800): pole, tines and a bunch of straw on them */
const drawStrawFork = (p: Pen) => {
  p.stroke([[60, 790], [60, 170]], 16, INKC); p.stroke([[60, 788], [60, 172]], 10, "#9a6a3a");
  p.stroke([[28, 170], [92, 170]], 12, INKC);
  for (const x of [32, 60, 88]) p.stroke([[x, 170], [x, 110]], 8, INKC);
  p.poly([[8, 130], [112, 120], [104, 40], [60, 10], [16, 44]], "#e8c45a", 6);
  for (let i = 0; i < 6; i++) p.line([[20 + 16 * i, 120], [30 + 12 * i, 30]], "#b8962e", 4, false);
};
/** a sheaf of straw held in the arms (220 x 160) */
const drawSheaf = (p: Pen) => {
  p.poly([[10, 60], [210, 40], [214, 110], [14, 130]], "#e8c45a", 6);
  p.stroke([[100, 40], [104, 128]], 10, "#b8962e");
  for (let i = 0; i < 7; i++) p.line([[16 + 28 * i, 64 - 3 * i], [20 + 28 * i, 124 - 3 * i]], "#c9a24a", 4, false);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true, roll = 0) => {
  const pl = person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: expr === "dazed" ? 0 : lidAt(t, i), ...extra }, {}, 1);
  out.places.push(roll ? { ...pl, roll } : pl);
  if (shadow) blob(out, x, y, z, 1);
};
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, extra: { soft?: boolean; rot?: number } = {}) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...extra });
};
const at = (t: number, t0: number) => t >= t0 - 0.07;
/** move p d metres toward the camera */
const toCam = (cam: CamInfo, p: V3, d: number): V3 => {
  const dx = cam.pos.x - p[0], dy = cam.pos.y - p[1], dz = cam.pos.z - p[2], l = Math.hypot(dx, dy, dz) || 1;
  return [p[0] + (dx / l) * d, p[1] + (dy / l) * d, p[2] + (dz / l) * d];
};
/** a point on the cloth (local angle a, height y), in world space for shot id */
const onCloth = (id: number, t: number, a: number, y: number): V3 => { const r = envR(y) + 0.04; return bw(id, t, r * Math.cos(a), y, -r * Math.sin(a)); };
/** the brazier fire: two fixed flame drawings that flicker smoothly in size and sway */
const fire = (id: number, t: number, out: Stage, u: number) => {
  if (u <= 0.02) return;
  const fw = 1 + 0.06 * Math.sin(t * 7.3), fh = 1 + 0.1 * Math.sin(t * 9.1 + 1), gh = 1 + 0.1 * Math.sin(t * 6.7 + 0.4);
  card(out, "flame|0", 300, 400, drawFlame(0), bw(id, t, 0, -0.2 + 0.55 * u * fh, 0), 1.0 * u * fw, 1.3 * u * fh, { rot: 0.05 * Math.sin(t * 5.1) });
  card(out, "flame|3", 300, 400, drawFlame(3), bw(id, t, 0.15, -0.25 + 0.4 * u * gh, 0.1), 0.7 * u, 0.95 * u * gh, { rot: 0.06 * Math.sin(t * 4.3 + 1) });
};

/** the holes in the cloth: local angle, height, size, the second they open, the second they are dabbed out (or never) */
type Hole = { a: number; y: number; s: number; open: number; out: number };
const DAR_HOLES: Hole[] = [
  { a: DAR_A + 0.16, y: 2.6, s: 0.34, open: T_HOLES, out: T_DABS + 0.35 },
  { a: DAR_A - 0.14, y: 3.1, s: 0.28, open: T_HOLES + 0.2, out: T_SPONGE + 0.1 },
  { a: DAR_A + 0.34, y: 3.4, s: 0.4, open: T_HOLES + 0.35, out: 37.95 },
  { a: DAR_A - 0.32, y: 2.35, s: 0.26, open: T_HOLES + 0.5, out: 38.7 },
];
const PIL_HOLES: Hole[] = [
  { a: PIL_A - 0.2, y: 3.0, s: 0.3, open: 0, out: 99 },
  { a: PIL_A + 0.25, y: 3.9, s: 0.36, open: 0, out: 99 },
  { a: PIL_A + 0.02, y: 4.6, s: 0.3, open: T_HOLES2 - 0.2, out: 99 },
];
/** draws the holes of a side: the scorch (under) always once opened, the glow on top while it burns */
const holes = (id: number, t: number, cam: CamInfo, out: Stage, list: Hole[], grow = 1) => {
  for (const h of list) {
    const u = smooth((t - h.open + 0.07) / 0.5);
    if (u <= 0) continue;
    const g = (1 - smooth((t - h.out + 0.07) / 0.3)) * u, c = onCloth(id, t, h.a, h.y), s = h.s * grow;
    card(out, "scorch", 200, 200, drawScorch, toCam(cam, c, 0.08), s * u, s * u);
    const fl = 1 + 0.08 * Math.sin(t * 8 + h.a * 9);
    if (g > 0.01) card(out, "hole", 200, 200, drawHole, toCam(cam, c, 0.14), s * g * fl, s * g * fl);
  }
};
/** the hook (shot 1) has three holes burning, and the sponge on one on "fires" */
const HOOK_HOLES: Hole[] = [
  { a: DAR_A + 0.16, y: 2.6, s: 0.34, open: 0, out: T_FIRES + 0.15 },
  { a: DAR_A - 0.14, y: 3.1, s: 0.28, open: 0, out: 99 },
  { a: DAR_A + 0.34, y: 3.4, s: 0.4, open: 0, out: 99 },
];
/** the pitchfork from d'Arlandes' hands up to the cloth point target (screen-space angle from the camera's right) */
const fork = (cam: CamInfo, out: Stage, key: string, draw: (p: Pen) => void, from0: V3, to: V3) => {
  const d0: V3 = [to[0] - from0[0], to[1] - from0[1], to[2] - from0[2]];
  const side = d0[0] * cam.right.x + d0[1] * cam.right.y + d0[2] * cam.right.z < 0 ? -1 : 1; // held at his side toward the target, clear of the face
  const from: V3 = [from0[0] + cam.right.x * 0.34 * side, from0[1], from0[2] + cam.right.z * 0.34 * side];
  const mid: V3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const d: V3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const sx = d[0] * cam.right.x + d[1] * cam.right.y + d[2] * cam.right.z, sy = d[1];
  const len = Math.hypot(...d);
  card(out, key, 120, 800, draw, toCam(cam, mid, 0.35), len * 0.15, len, { rot: Math.atan2(-sx, sy) });
};

// ---------------- the places ----------------
/** the two flyers on the gallery in shot id */
const flyers = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [dx, dz] = onGallery(DAR_A), [px, pz] = onGallery(PIL_A);
  let dex: Expr = "stern", pex: Expr = "stern";
  if (id === 1) dex = at(t, T_FIRES) ? "nervous" : "stern";
  if (id === 5) { dex = at(t, T_RISE) ? "grin" : "smile"; pex = at(t, T_RISE) ? "laugh" : "smile"; }
  if (id === 6) { dex = at(t, T_SEINE) ? "laugh" : "grin"; pex = "grin"; }
  if (id === 7) dex = at(t, T_HOLES) ? "shock" : at(t, T_LAND) ? "nervous" : "smile";
  if (id === 8) dex = at(t, T_SINK) ? "nervous" : "stern";
  if (id === 9) pex = at(t, T_GROWS) ? "grin" : at(t, T_SHOUTS) ? "shock" : "stern";
  if (id === 10) { dex = at(t, T_ROOFS) ? "pained" : at(t, T_WANTS) ? "nervous" : "stern"; pex = "stern"; }
  if (id === 11) { dex = at(t, T_DIE) ? "relief" : "nervous"; pex = at(t, T_CLEAR) ? "smile" : "stern"; }
  if (id === 12) { dex = at(t, T_WINDMILLS) ? "relief" : "nervous"; pex = at(t, T_WINDMILLS) ? "laugh" : "smile"; }
  if (id === 13) { dex = at(t, T_COLL) ? "shock" : "laugh"; pex = at(t, T_COLL) ? "shock" : "laugh"; }
  const wave = id === 5 && at(t, T_RISE) ? { wave: 0.9 } : id === 12 && at(t, T_WINDMILLS) ? { wave: 0.8 } : {};
  const d = bw(id, t, dx, 0.04, dz), p = bw(id, t, px, 0.04, pz);
  front(cam, t, out, 1, DAR, "dar", d[0], d[1], d[2], dex, id === 9 ? {} : wave, false);
  front(cam, t, out, 2, PIL, "pil", p[0], p[1], p[2], pex, id === 9 && at(t, T_FEED) && !at(t, T_GROWS) ? { wave: 0.7 } : wave, false);
  // d'Arlandes' sponge fork: up to the hole he is dabbing (shots 1 and 8), resting against the cloth otherwise
  const hand = bw(id, t, dx + 0.1, 1.15, dz);
  if (id === 1) fork(cam, out, "fork", drawFork, hand, onCloth(id, t, DAR_A + 0.16, 2.6 + 0.08 * Math.sin(t * 9)));
  else if (id === 8) {
    const hs = DAR_HOLES, ts = hs.map((h) => h.out - 0.5);
    let i = 0; while (i + 1 < hs.length && t >= ts[i + 1]) i++;
    const k = i + 1 < hs.length ? smooth((t - ts[i] - 0.2) / 0.4) : 0, a = hs[i], b = hs[Math.min(i + 1, hs.length - 1)];
    const tgt = onCloth(id, t, a.a + (b.a - a.a) * k, a.y + (b.y - a.y) * k + 0.06 * Math.sin(t * 10));
    fork(cam, out, "fork", drawFork, hand, tgt);
  } else if (id === 7 || id === 10) fork(cam, out, "fork", drawFork, hand, onCloth(id, t, DAR_A - 0.45, 2.5));
  // Pilatre's fork of straw over the brazier (shot 9)
  if (id === 9) {
    const ph = at(t, T_FEED) ? smooth((t - T_FEED + 0.07) / 0.5) : 0;
    fork(cam, out, "strawfork", drawStrawFork, bw(id, t, px + 0.1, 1.1, pz), bw(id, t, px + 0.6 + 0.5 * ph, 0.9 - 0.7 * ph, pz + 0.2));
  }
};
/** burning bits of straw drifting up the cloth (shot 7) */
const embers = (id: number, t: number, out: Stage) => {
  if (t < T_BURNING - 0.6) return;
  for (let k = 0; k < 7; k++) {
    const u = ((t - T_BURNING + 0.6) * 0.45 + k / 7) % 1, a = DAR_A - 0.4 + 0.8 * hh(k, 3);
    const y = 1.6 + 3.2 * u, r = envR(y) + 0.35 + 0.2 * Math.sin(k + t * 2);
    const sz = 0.24 * Math.sin(Math.PI * u) * clamp01((t - T_BURNING + 0.6) / 0.5);
    card(out, "ember", 120, 120, drawEmber, bw(id, t, r * Math.cos(a), y, -r * Math.sin(a)), sz, sz, { rot: q(t * 2 + k, 20) });
  }
};
/** a few soft clouds round the balloon over Paris; none near the shot's opening lens */
const clouds = (id: number, out: Stage, cam0: V3) => {
  for (let i = 0; i < 16; i++) {
    const a = hh(i, 1) * Math.PI * 2, d = 60 + 160 * hh(i, 2), b = bw(id, 30, 0, 0, 0);
    const x = b[0] + Math.cos(a) * d, z = b[2] + Math.sin(a) * d, y = D0 + 120 + 50 * hh(i, 3), w = 30 + 30 * hh(i, 5);
    if (Math.hypot(x - cam0[0], y - cam0[1], z - cam0[2]) < 20 + w / 2) continue;
    out.fx.push({ key: `cloud${i % 4}`, cw: 600, ch: 300, draw: (p) => fxCloud(p, i % 4), x, y, z, w, h: w / 2, soft: true });
  }
};

const skySet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  clouds(id, out, [cam.pos.x, cam.pos.y, cam.pos.z]);
  flyers(id, t, cam, out);
  fire(id, t, out, fireAt(id, t));
  if (id === 1) holes(id, t, cam, out, HOOK_HOLES);
  if (id === 7) { embers(id, t, out); holes(id, t, cam, out, DAR_HOLES); }
  if (id === 8 || id === 10 || id === 11) holes(id, t, cam, out, DAR_HOLES);
  if (id === 9) holes(id, t, cam, out, PIL_HOLES, 1 + 0.5 * smooth((t - T_HOLES2 + 0.3) / 0.8));
  if (id === 10 || id === 11) holes(id, t, cam, out, PIL_HOLES);
};

const gardenSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [GX, , GZ] = GARDEN;
  fire(id, t, out, fireAt(id, t));
  if (id === 5) flyers(id, t, cam, out);
  // the brothers by the brazier, feeding it straw
  const fed = id === 3 && at(t, T_STRAW);
  front(cam, t, out, 3, BRO1, "bro1", GX + 2.9, D0, GZ + 1.8, id === 3 ? (at(t, T_BLUE) ? "grin" : "smile") : "smile", fed ? { wave: 0.5 } : {});
  front(cam, t, out, 4, BRO2, "bro2", GX + 3.4, D0, GZ - 0.6, id === 3 && at(t, T_MONT) ? "smile_closed" : "neutral");
  if (id === 3) card(out, "sheaf", 220, 160, drawSheaf, [GX + 2.75, D0 + 1.05, GZ + 2.05], 0.6, 0.44);
  // the king, the prisoners and the two flyers on the lawn (not yet aboard)
  if (id !== 5) {
    const [KX, KY, KZ] = KING_AT, beg = at(t, T_BEGGED), turn = id === 4 && at(t, T_BUT);
    front(cam, t, out, 5, KING, "king", KX, KY, KZ, id === 4 ? (turn ? "nervous" : at(t, T_PRISON) ? "stern" : "smile") : "smile", id === 4 && at(t, T_PRISON) && !turn ? { wave: 0.6 } : {});
    front(cam, t, out, 6, PRISONER, "pr1", KX + 1.5, KY, KZ - 0.5, id === 4 && at(t, T_PRISON) ? (turn ? "relief" : "shock") : "neutral");
    front(cam, t, out, 7, PRISONER2, "pr2", KX + 2.6, KY, KZ + 0.3, id === 4 && at(t, T_PRISON) ? (turn ? "relief_open" : "nervous") : "neutral");
    front(cam, t, out, 1, DAR, "dar", KX - 3.4, KY, KZ + 0.2, id === 4 ? (beg ? "grin" : at(t, T_PIL) ? "smile" : "stern") : "smile", id === 4 && beg ? { wave: 0.9 } : {});
    front(cam, t, out, 2, PIL, "pil", KX - 1.9, KY, KZ - 0.3, id === 4 ? (beg ? "laugh" : at(t, T_PIL) ? "grin" : "stern") : "smile", id === 4 && at(t, T_PIL) ? { wave: 0.7 } : {});
  }
  // the crowd behind the fence, all facing the balloon; silent as it rises
  const hush = id === 5 && at(t, T_SILENT), rising = id === 5 && at(t, T_RISE);
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (0.1 + 0.8 * (i / 15)), rr = 9.6 + 1.3 * (i % 3), x = GX + Math.cos(a) * rr, z = GZ + Math.sin(a) * rr;
    if (Math.hypot(x - KING_AT[0], z - KING_AT[2]) < 4.5) continue;
    const ex: Expr = hush ? (i % 2 ? "shock" : "dazed") : rising ? "laugh" : i % 3 ? "smile" : "neutral";
    front(cam, t, out, 20 + i, FOLK[i % 6], `crowd${i}`, x, D0, z, ex, rising && !hush && i % 2 === 0 ? { wave: 0.8 } : {});
  }
};

const fieldSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [FX, , FZ] = FIELD, k = collapseAt(id, t);
  if (id === 12 || id === 13) flyers(id, t, cam, out);
  // the embers of the brazier glowing on the grass once the balloon is down
  if (id >= 13) {
    const g = 0.5 + 0.06 * Math.sin(t * 6);
    card(out, "puff_ember", 300, 300, (p) => fxPuff(p, 0.35), [FX - 3.0, D0 + 0.3 + 0.2 * k, FZ + 3.2], 0.9 * g, 0.9 * g, { soft: true });
    void T_EMBERS;
  }
  if (id === 12) {
    front(cam, t, out, 8, FARMER, "farm1", FX + 13, D0, FZ + 9, at(t, T_SETTLES) ? "shock" : "neutral");
    front(cam, t, out, 9, FARMER2, "farm2", FX - 12, D0, FZ + 10, at(t, T_WINDMILLS) ? "laugh" : "nervous", at(t, T_WINDMILLS) ? { wave: 0.8 } : {});
  }
  if (id === 13) {
    front(cam, t, out, 8, FARMER, "farm1", FX + 11.5, D0, FZ + 6.5, at(t, T_COLL) ? "shock" : "grin");
    front(cam, t, out, 9, FARMER2, "farm2", FX + 14.5, D0, FZ + 3.5, at(t, T_COLL) ? "shock" : "smile");
  }
  if (id === 14) { // Pilatre, lying, is dragged out from under the cloth by two farm folk
    const x = FX + 7.6 + dragAt(t);
    front(cam, t, out, 2, PIL, "pil", x, D0 + 0.2, FZ + 1.0, at(t, T_OWN) ? "relief" : "dazed", {}, false, -1.45);
    blob(out, x + 0.8, D0, FZ + 1.0, 1.2);
    front(cam, t, out, 8, FARMER, "farm1", x + 2.3, D0, FZ + 0.3, at(t, T_DRAGGED) ? "stern" : "nervous", { wave: 0.5, tilt: -6 });
    front(cam, t, out, 9, FARMER2, "farm2", x + 2.6, D0, FZ + 1.5, at(t, T_DRAGGED) ? "grin" : "nervous", { wave: 0.5, tilt: -6 });
    front(cam, t, out, 1, DAR, "dar", FX + 11.6, D0, FZ - 2.6, at(t, T_OWN) ? "laugh" : "relief");
  }
  void MAN_R;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "garden") gardenSet(id, t, cam, out);
  else if (s.scene === "sky") skySet(id, t, cam, out);
  else fieldSet(id, t, cam, out);
  void clamp01; void T_PIL;
  return out;
};
