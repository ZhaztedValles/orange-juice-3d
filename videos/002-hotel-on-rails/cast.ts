// The cast and hand-drawn props of the hotel story: the proud owner, the work gang with hammers, hotel guests on the porch,
// the beach crowd, splashes under the porch, the owner's thought bubbles, and the two walkers in the snow (boots sinking,
// snowshoes on top). Built on the card system in src/engine/cards.ts; every prop is an unlit ink-outlined drawing.
import { Pen, townsfolk, KID, SKINS, Outfit, fxSplash, Expr, FrontOpts } from "../../src/engine/toon";
import { CamInfo, Stage, Who, hh, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import { D0, SNOW, SHOTS, clock, lift, hotelZ, locoZ, trackX, LOCO_TRACKS, HZ0, smooth } from "./story";

export const OWNER: Outfit = { jacket: "#6b2d3a", pants: "#3b3f52", boots: "#2b2220", hat: "tophat", build: "stout", buttons: "#e8c45a", moustache: "#5a4636", skin: SKINS[1] };
const WORKER = (v: number): Outfit => ({ jacket: ["#8a6a3c", "#4f6f8f", "#7a4a3a"][v % 3], pants: "#3b3f52", boots: "#2b2220", hat: "cap", cap: ["#5a3b2a", "#2f3b52", "#6b6b5a"][v % 3], skin: SKINS[v % 4] });
const WORKERS = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(WORKER);
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const WALKER_A: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#8c3b4a", skin: SKINS[0] };
const WALKER_B: Outfit = { jacket: "#b5653f", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#2f5f6a", skin: SKINS[2] };
const LEAD = 2 / 30;
const INKC = "#241726";

// ---------------- drawings ----------------
const cloudBubble = (p: Pen) => {
  p.ell(200, 150, 160, 105, "#fbf7ee", 9);
  p.ell(70, 190, 70, 56, "#fbf7ee", 9); p.ell(330, 190, 70, 56, "#fbf7ee", 9); p.ell(200, 90, 110, 62, "#fbf7ee", 9);
  p.ell(200, 150, 150, 95, "#fbf7ee", 0);
  p.ell(150, 292, 24, 18, "#fbf7ee", 6); p.ell(120, 336, 14, 11, "#fbf7ee", 5);
};
/** thought bubble on a 400 x 360 canvas: kind 0 = a brick wall, 1 = a hotel on wheels with an arrow */
const drawThought = (p: Pen, kind: number) => {
  cloudBubble(p);
  if (kind === 0) {
    p.poly([[110, 90], [290, 90], [290, 200], [110, 200]], "#c8643f", 8);
    for (let y = 116; y < 200; y += 28) p.stroke([[110, y], [290, y]], 4, INKC);
    for (let y = 90; y < 200; y += 28) for (let x = (y / 28) % 2 ? 150 : 180; x < 290; x += 60) p.stroke([[x, y], [x, y + 28]], 4, INKC);
  } else {
    p.poly([[110, 150], [260, 150], [260, 100], [185, 66], [110, 100]], "#e9d9b8", 8);
    p.poly([[130, 118], [160, 118], [160, 140], [130, 140]], "#6b9bd0", 4); p.poly([[190, 118], [220, 118], [220, 140], [190, 140]], "#6b9bd0", 4);
    p.ell(135, 170, 15, 15, "#34313c", 5); p.ell(190, 170, 15, 15, "#34313c", 5); p.ell(245, 170, 15, 15, "#34313c", 5);
    p.stroke([[270, 120], [330, 120]], 10, INKC); p.stroke([[300, 100], [335, 120], [300, 140]], 10, INKC);
  }
};
/** a snow mound (billboard) that swallows the legs: 400 x 220 */
const drawMound = (p: Pen) => {
  p.poly([[10, 200], [34, 120], [90, 78], [150, 96], [200, 60], [262, 90], [320, 80], [372, 130], [392, 200]], "#f7fafd", 9);
  p.stroke([[60, 150], [120, 130]], 5, "rgba(120,150,200,.5)"); p.stroke([[230, 135], [300, 150]], 5, "rgba(120,150,200,.5)");
};
/** a boot hole (flat): 240 x 240 */
const drawHole = (p: Pen) => { p.ell(120, 120, 80, 60, "#dbe6f2", 7); p.ell(120, 128, 56, 40, "#8da6c8", 0); };
/** a snowshoe seen from above (flat): 220 x 360 */
const drawShoe = (p: Pen) => {
  p.ell(110, 190, 86, 150, "#d9a864", 9);
  p.ell(110, 190, 66, 130, "#f1dcae", 0);
  for (let i = -3; i <= 3; i++) p.stroke([[110 + i * 18, 70], [110 + i * 18, 310]], 3, "rgba(120,80,40,.8)");
  for (let j = 0; j < 7; j++) p.stroke([[50, 90 + j * 32], [170, 90 + j * 32]], 3, "rgba(120,80,40,.8)");
};
/** a shallow snowshoe print (flat): 220 x 360 */
const drawPrint = (p: Pen) => { p.ell(110, 190, 80, 140, "#e6eef7", 6); p.ell(110, 190, 62, 120, "#d3dff0", 0); };

// ---------------- staging ----------------
const personAt = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, sc = 1, extra: FrontOpts = {}) => {
  out.places.push(person(cam, { i, o, okey } as Who, x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, sc));
  blob(out, x, y, z, sc);
};

/** porch guests: six folk on the deck, riding along with the hotel */
const GUEST_X = [-15.9, -11.4, -2.3, 2.3, 11.4, 15.9];
const guests = (id: number, t: number, ts: number, cam: CamInfo, out: Stage) => {
  const hz = hotelZ(id, t), y = D0 + lift(ts) + 0.35;
  const moving = t > 32.3;
  GUEST_X.forEach((x, k) => {
    let expr: Expr = k % 2 ? "smile" : "neutral";
    if (id === 3 && t > 14.94 - LEAD) expr = k % 2 ? "shock" : "nervous";
    else if (id >= 15) expr = k % 2 ? "laugh" : "grin";
    else if (moving) expr = k % 3 === 0 ? "grin" : "laugh";
    const wave = id >= 14 || (moving && id >= 8) ? Math.sin(t * 6 + k * 1.7) : undefined;
    personAt(cam, t, out, 40 + k, FOLK[k % 6], `g${k % 6}`, x, y, hz + 9.0 + (k % 2) * 0.5, expr, 1, wave === undefined ? {} : { wave });
  });
};

const OWNER_RAIL = [-6.75, 0, 0] as const;
const owner = (id: number, t: number, ts: number, cam: CamInfo, out: Stage) => {
  const hz = hotelZ(id, t);
  let x: number, y: number, z: number, expr: Expr;
  if (t < 20.5 || t >= 57.4) {
    x = id >= 15 ? 6.8 : -6.8; y = D0 + lift(ts) + 0.35; z = hz + 9.3;
    expr = id >= 15 ? "laugh" : t < 16.9 ? "neutral" : t < 18.9 ? "nervous" : "grin";
  } else {
    x = OWNER_RAIL[0]; y = D0; z = hz - 11; // walks beside the ropes
    expr = t < 36 ? "grin" : t < 39.4 - LEAD ? "nervous" : "relief";
    if (t > 28) z = hz - 11;
    if (t < 27.4) { x = -12.4; z = -61; expr = "grin"; } // proud beside his locomotive
  }
  personAt(cam, t, out, 1, OWNER, "owner", x, y, z, expr, 1.04);
  if (id === 4 && t < 20.5) {
    const k = t < 18.1 ? 0 : 1;
    if (t > 16.95 && t < 20.5) out.fx.push({ key: `thought${k}`, cw: 400, ch: 360, draw: (p) => drawThought(p, k), x: x + 1.0, y: y + 2.8, z: z + 0.1, w: 1.5, h: 1.35 });
  }
};

/** the work gang: hammers on the jacks (rear of the hotel), spikes on the tracks, hands on the ropes */
const gang = (id: number, t: number, ts: number, cam: CamInfo, out: Stage) => {
  const hz = hotelZ(id, t);
  if (ts > 21.6 && ts < 25.2) for (let i = 0; i < 9; i++) {
    const u = (ts * 1.6 + hh(i) * 2) % 1;
    personAt(cam, t, out, 60 + i, WORKERS[i], `w${i % 9}`, -16 + i * 4 + 0.7, D0, HZ0 - 8.2, "grin", 1, { prop: ["hammer", q(u, 6)] });
  }
  if (ts >= 25.0 && ts < 27.9) for (let i = 0; i < 8; i++) {
    const u = (ts * 1.8 + hh(i, 1) * 2) % 1;
    personAt(cam, t, out, 70 + i, WORKERS[i], `w${i % 9}`, -17 + i * 4.8, D0, -62 - (i % 3) * 4 - (ts - 25) * 1.5, "stern", 1, { prop: ["hammer", q(u, 6)] });
  }
  if (ts >= 27.3 && ts < 30.5) for (let i = 0; i < 6; i++) {
    const x = trackX(LOCO_TRACKS[i]) + 0.95;
    personAt(cam, t, out, 80 + i, WORKERS[i], `w${i % 9}`, x, D0, hz - 11, i % 2 ? "grin" : "neutral", 1);
  }
};

const crowd = (id: number, t: number, ts: number, cam: CamInfo, out: Stage) => {
  const hz = hotelZ(id, t);
  for (let i = 0; i < 30; i++) {
    const side = i % 2 ? 1 : -1, x = side * (24 + hh(i, 1) * 22), z = -50 - hh(i, 2) * 48 + (id >= 14 ? hz - HZ0 : 0) * 0.4;
    const arrive = i < 6 ? 0 : 28.2 + hh(i, 3) * 3.4;
    if (ts < arrive) continue;
    const cheer = t > 32.3;
    const ex: Expr = cheer ? (i % 3 ? "laugh" : "grin") : i % 4 === 0 ? "smile" : "neutral";
    const wave = cheer && i % 3 !== 2 ? Math.sin(t * 6 + i) : undefined;
    personAt(cam, t, out, 100 + i, FOLK[i % 6], `c${i % 6}`, x, D0, z, ex, 1, wave === undefined ? {} : { wave });
  }
};

const splashes = (t: number, out: Stage) => {
  // the sea slops under the porch: splashes at the piles when the word sloshed lands
  const t0 = 14.94 - LEAD;
  if (t < t0 - 0.2 || t > t0 + 2.4) return;
  for (let k = 0; k < 6; k++) {
    const t1 = t0 + k * 0.28, u = (t - t1) / 0.75;
    if (u < 0 || u > 1) continue;
    const uq = q(u, 16), x = -14 + k * 5.6 + hh(k) * 1.6;
    out.fx.push({ key: `spl${uq}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, uq), x, y: 1.2, z: -26.2, w: 3.0, h: 3.0 });
  }
};

const hotelSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const ts = clock(id, t);
  guests(id, t, ts, cam, out);
  owner(id, t, ts, cam, out);
  gang(id, t, ts, cam, out);
  crowd(id, t, ts, cam, out);
  if (id === 3) splashes(t, out);
  void locoZ;
};

const snowSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [sx, , sz] = SNOW;
  // man A: boots, sinking
  const ax = sx - 1.2, sink = 0.62 * smooth((t - 41.7) / 1.6);
  const ya = D0 + 0.05 - sink;
  personAt(cam, t, out, 200, WALKER_A, "wa", ax, ya, sz, id === 10 ? (t < 43.4 ? "smile" : "shock") : "pained", 1);
  out.fx.push({ key: "mound", cw: 400, ch: 220, draw: drawMound, x: ax, y: D0 + 0.42 + 0.05, z: sz + 0.5, w: 1.45, h: 0.8 });
  for (let k = 0; k < 4; k++) out.fx.push({ key: "hole", cw: 240, ch: 240, draw: drawHole, x: ax + 0.4 + k * 0.9, y: D0 + 0.07, z: sz - 1.6 - k * 0.1, w: 0.7, h: 0.7, flat: true });
  // man B: snowshoes, on top
  const bx = sx + 2.2;
  personAt(cam, t, out, 201, WALKER_B, "wb", bx, D0 + 0.12, sz, t < 45.0 ? "neutral" : t < 47.1 ? "smile" : "grin", 1);
  for (const dx of [-0.2, 0.2]) out.fx.push({ key: "shoe", cw: 220, ch: 360, draw: drawShoe, x: bx + dx, y: D0 + 0.1, z: sz + 0.25, w: 0.34, h: 0.56, flat: true });
  for (let k = 1; k < 5; k++) for (const dx of [-0.2, 0.2]) out.fx.push({ key: "print", cw: 220, ch: 360, draw: drawPrint, x: bx + dx - k * 1.2, y: D0 + 0.07, z: sz + 0.3 + (k % 2) * 0.05, w: 0.34, h: 0.56, flat: true, rot: Math.PI / 2 });
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "snow") snowSet(id, t, cam, out); else hotelSet(id, t, cam, out);
  void KID;
  return out;
};
