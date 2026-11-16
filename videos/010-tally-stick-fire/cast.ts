// The cast and hand-drawn props of the tally-stick fire: Joshua Cross (cap, moustache) and Patrick Furlong (red hair),
// the treasury clerk and a merchant at the chequered table, the clerk of works (top hat), two visitors in the Lords,
// the doorkeeper's wife, a child with a toaster, the crowd on the bridge. Every prop is an unlit ink-outlined drawing:
// the notched tally stick and its two halves, flying sticks, the furnace mouth with its coals and flames, roof flames,
// smoke, the fireball, the toaster stuffed with newspaper, the pub sign and the unrolled bill.
import { Pen, townsfolk, KID, PARENT, SKINS, Outfit, Expr, FrontOpts } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf, hh } from "../../src/engine/cards";
import {
  D0, SHOTS, V3, smooth, clamp01, TABLE, CART1, CELLAR, FURN_X, CHAMBER, CORRIDOR, GARDEN, PAL_X, PAL2_X, PAL_Z, PAL2_Z,
  BR_Y, PUB, walkAt, WALK0, WALK1,
  T_BURNED, T_TALLY, T_SPLIT, T_MATCH, T_WAY, T_BURNED2, T_JOSHUA, T_PATRICK, T_FED, T_HOT, T_SHUT, T_PUB, T_FLAMES,
  T_COAL, T_WOOD, T_TALL, T_STUFF, T_FLAMES2, T_RACED, T_CAUGHT, T_FIREBALL, T_CROWDS, T_BILL, T_PARL,
} from "./story";

const CROSS: Outfit = { jacket: "#6a5040", pants: "#3b3f52", boots: "#2a2220", hat: "cap", cap: "#4f4a44", moustache: "#5a3b2a", skin: SKINS[0] };
const FURLONG: Outfit = { jacket: "#4f6a52", pants: "#4a4038", boots: "#2a2220", hat: "hair", hair: "#b8552e", skin: SKINS[1] };
const CLERK: Outfit = { jacket: "#2e3550", pants: "#3a3a44", boots: "#1e1a1c", hat: "tophat", buttons: "#d9b45a", skin: SKINS[1] };
const MERCHANT: Outfit = { jacket: "#7a3a34", pants: "#4a4f5e", boots: "#2a2220", hat: "tophat", moustache: "#4a3020", skin: SKINS[2], build: "stout" };
const WEOBLEY: Outfit = { jacket: "#34363e", pants: "#4a4a50", boots: "#1e1a1c", hat: "tophat", buttons: "#d9b45a", moustache: "#7a6a5a", skin: SKINS[0], build: "stout" };
const WIFE: Outfit = { ...PARENT, jacket: "#5a6a8a", dress: "#c08a4a", hat: "bonnet", skin: SKINS[1] };
const KIDO: Outfit = { ...KID, jacket: "#5a8fc2", hat: "hair", hair: "#5a3b2a", skin: SKINS[2] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const VIS_M = FOLK[0], VIS_F = FOLK[1];
const INKC = "#241726";

// ---------------- drawings ----------------
/** the tally stick (600 x 240): sep 0 = whole, 1 = split into the long stock (top) and the short foil (bottom), apart */
const NOTCH: [number, number][] = [[120, 34], [170, 22], [205, 22], [260, 14], [300, 14], [330, 14], [395, 30], [450, 8], [475, 8]];
const drawTally = (p: Pen, split: boolean, sep: number) => {
  const notches = (y: number, d: number) => { for (const [x, w] of NOTCH) p.poly([[x - w / 2, y], [x, y + d], [x + w / 2, y]], "#5a3a22", 0); };
  if (!split) {
    p.poly([[40, 96], [560, 96], [570, 120], [560, 146], [40, 146], [30, 120]], "#d8b47a", 7);
    p.ell(44, 121, 14, 25, "#8a6a44", 5);
    notches(97, 26);
    p.line([[120, 121], [550, 121]], "rgba(90,58,34,0.35)", 3, false);
    return;
  }
  const dy = 34 * sep, dx = 36 * sep;
  p.poly([[40 - dx, 96 - dy], [560 - dx, 96 - dy], [570 - dx, 121 - dy], [40 - dx, 121 - dy], [30 - dx, 110 - dy]], "#d8b47a", 7);
  p.ell(44 - dx, 110 - dy, 13, 13, "#8a6a44", 5);
  notches(97 - dy, 22); for (const [x, w] of NOTCH) p.line([[x - dx - w / 2, 97 - dy], [x - dx, 119 - dy]], "#5a3a22", 4, false);
  p.poly([[140 + dx, 121 + dy], [570 + dx, 121 + dy], [560 + dx, 146 + dy], [140 + dx, 146 + dy]], "#e2c08a", 7);
  for (const [x, w] of NOTCH) if (x > 140) p.poly([[x + dx - w / 2, 121 + dy], [x + dx, 136 + dy], [x + dx + w / 2, 121 + dy]], "#5a3a22", 0);
};
/** one stick in flight (200 x 60) */
const drawStick = (p: Pen) => { p.poly([[10, 22], [190, 18], [192, 38], [12, 42]], "#d8b47a", 5); p.poly([[60, 21], [68, 31], [76, 20]], "#5a3a22", 0); };
/** flames (400 x 400), flicker frame k */
const drawFlames = (p: Pen, k: number) => {
  const tongue = (x: number, h: number, w: number, col: string) => {
    const g = p.g, sway = ((k * 13 + x) % 9) - 4;
    g.beginPath(); g.moveTo(x - w, 392);
    g.bezierCurveTo(x - w * 1.1, 392 - h * 0.45, x - w * 0.2 + sway, 392 - h * 0.7, x + sway * 2, 392 - h);
    g.bezierCurveTo(x + w * 0.5 + sway, 392 - h * 0.6, x + w * 1.1, 392 - h * 0.4, x + w, 392);
    g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = "#5a1d12"; g.stroke();
  };
  for (let i = 0; i < 4; i++) tongue(80 + i * 80, 230 + 90 * (((k + i) * 7) % 3) / 2, 62, "#f07a2a");
  for (let i = 0; i < 4; i++) tongue(90 + i * 78, 110 + 50 * (((k + i) * 5) % 3) / 2, 34, "#ffd25a");
};
/** smooth flames (shot 10 close-up): phase step n of SMOOTH_N, tongues rise and sway continuously so no frame jumps */
const SMOOTH_N = 24;
const drawFlamesSmooth = (p: Pen, n: number) => {
  const ph = (n / SMOOTH_N) * Math.PI * 2;
  const tongue = (x: number, h: number, w: number, sway: number, col: string) => {
    const g = p.g;
    g.beginPath(); g.moveTo(x - w, 392);
    g.bezierCurveTo(x - w * 1.1, 392 - h * 0.45, x - w * 0.2 + sway, 392 - h * 0.7, x + sway * 2, 392 - h);
    g.bezierCurveTo(x + w * 0.5 + sway, 392 - h * 0.6, x + w * 1.1, 392 - h * 0.4, x + w, 392);
    g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = "#5a1d12"; g.stroke();
  };
  for (let i = 0; i < 4; i++) tongue(80 + i * 80, 275 + 40 * Math.sin(ph + i * 1.7), 62, 4 * Math.sin(2 * ph + i * 2.3), "#f07a2a");
  for (let i = 0; i < 4; i++) tongue(90 + i * 78, 135 + 22 * Math.sin(ph + 1 + i * 2.1), 34, 3 * Math.sin(2 * ph + 0.7 + i * 1.9), "#ffd25a");
};
/** a puff of smoke (400 x 400), shade 0 light grey .. 1 dark */
const drawSmoke = (p: Pen, seed: number, shade: number) => {
  const c = ["#d9d2cc", "#a9a1a2", "#6f6870"][Math.min(2, Math.round(shade * 2))];
  const r = (k: number) => ((seed * 97 + k * 31) % 17) / 17;
  for (let i = 0; i < 6; i++) p.ell(110 + 180 * r(i), 120 + 160 * r(i + 9), 70 + 40 * r(i + 3), 60 + 30 * r(i + 5), c, 0);
  p.ell(200, 210, 130, 110, c, 0);
};
/** the furnace mouth (300 x 300): the dark arch, glowing coals; L 0..1 = flames inside the arch, k = flicker
 *  (k >= 100: smooth phase k - 100 of SMOOTH_N for the shot 10 close-up) */
const drawMouth = (p: Pen, L: number, k: number) => {
  p.poly([[40, 300], [40, 150], [70, 95], [150, 70], [230, 95], [260, 150], [260, 300]], "#1c1416", 8);
  for (let i = 0; i < 7; i++) p.ell(70 + i * 27, 282 - (i % 2) * 8, 22, 14, i % 3 ? "#e0542a" : "#ffb347", 4);
  if (L > 0.02) {
    const g = p.g;
    for (let i = 0; i < 5; i++) {
      const ph = ((k - 100) / SMOOTH_N) * Math.PI * 2, sm = k >= 100;
      const x = 80 + i * 35, w = 22 + 6 * L;
      const h = (60 + 150 * L) * (sm ? 0.85 + 0.15 * Math.sin(ph + i * 1.9) : 0.7 + 0.3 * (((k + i) * 7) % 3) / 2);
      const sw = sm ? 3 * Math.sin(2 * ph + i * 2.2) : ((k * 13 + i * 5) % 9) - 4;
      g.beginPath(); g.moveTo(x - w, 278); g.bezierCurveTo(x - w, 278 - h * 0.5, x + sw, 278 - h * 0.7, x + sw, 278 - h);
      g.bezierCurveTo(x + w * 0.6, 278 - h * 0.6, x + w, 278 - h * 0.4, x + w, 278); g.closePath();
      g.fillStyle = i % 2 ? "#ffd25a" : "#f07a2a"; g.fill(); g.lineWidth = 5; g.strokeStyle = "#5a1d12"; g.stroke();
    }
  }
};
/** a fireball (500 x 500): t 0..1, a ball of orange with a yellow core and licking tongues */
const drawFireball = (p: Pen, t: number) => {
  const r = 120 + 110 * Math.min(1, t * 2);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, rr = r * (1.05 + 0.18 * (i % 2)); p.ell(250 + Math.cos(a) * r * 0.7, 250 + Math.sin(a) * r * 0.7, rr * 0.42, rr * 0.42, i % 2 ? "#e8562a" : "#f07a2a", 6); }
  p.ell(250, 250, r * 0.78, r * 0.78, "#f59a3a", 0);
  p.ell(250, 250, r * 0.5, r * 0.5, "#ffd25a", 0);
  p.ell(250, 250, r * 0.25, r * 0.25, "#fff3b0", 0);
};
/** the toaster (400 x 400): paper 0..1 stuffed in, fire 0..1 flames shooting out of the top, k flicker */
const drawToaster = (p: Pen, paper: number, fire: number, k: number) => {
  if (fire > 0.02) {
    const g = p.g;
    for (let i = 0; i < 4; i++) {
      const x = 130 + i * 48, h = 200 * fire * (0.75 + 0.25 * (((k + i) * 7) % 3) / 2), w = 30, sw = ((k * 11 + i * 7) % 9) - 4;
      g.beginPath(); g.moveTo(x - w, 190); g.bezierCurveTo(x - w, 190 - h * 0.5, x + sw, 190 - h * 0.7, x + sw * 2, 190 - h);
      g.bezierCurveTo(x + w * 0.6, 190 - h * 0.6, x + w, 190 - h * 0.4, x + w, 190); g.closePath();
      g.fillStyle = i % 2 ? "#ffd25a" : "#f07a2a"; g.fill(); g.lineWidth = 6; g.strokeStyle = "#5a1d12"; g.stroke();
    }
  }
  if (paper > 0.02) for (const [x, a] of [[160, -0.15], [240, 0.12]] as const) {
    const h = 110 * paper;
    p.poly([[x - 34, 200], [x - 34 + a * h, 200 - h], [x + 34 + a * h, 200 - h - 10], [x + 34, 200]], "#f2eee2", 6);
    for (let l = 0; l < 3; l++) p.line([[x - 22 + a * h * (0.3 + 0.2 * l), 200 - h * (0.3 + 0.2 * l)], [x + 22 + a * h * (0.3 + 0.2 * l), 200 - h * (0.3 + 0.2 * l) - 4]], "#8a8a92", 4, false);
  }
  p.poly([[80, 380], [80, 230], [100, 196], [300, 196], [320, 230], [320, 380]], "#b9c4cc", 8);
  p.poly([[96, 360], [96, 240], [130, 240], [130, 360]], "rgba(255,255,255,0.45)", 0);
  for (const x of [160, 240]) p.poly([[x - 40, 206], [x + 40, 206], [x + 40, 218], [x - 40, 218]], "#2a2228", 0);
  p.poly([[320, 280], [352, 280], [352, 300], [320, 300]], INKC, 0);
  p.poly([[96, 382], [120, 398], [280, 398], [304, 382]], "#3a3236", 5);
};
/** the pub sign (300 x 260): a board with a frothy mug */
const drawSign = (p: Pen) => {
  p.line([[90, 10], [90, 40]], INKC, 5, false); p.line([[210, 10], [210, 40]], INKC, 5, false);
  p.poly([[30, 40], [270, 40], [270, 240], [30, 240]], "#2f4a3a", 8);
  p.poly([[100, 100], [190, 100], [182, 210], [108, 210]], "#d9a441", 7);
  p.ell(145, 98, 54, 22, "#f6f0de", 6);
  p.line([[190, 125], [222, 130], [220, 180], [186, 185]], "#d9a441", 10);
};
/** the bill (300 x 900): a roller at the top and the paper unrolled to length u 0..1, close lines and a red seal */
const drawBill = (p: Pen, u: number) => {
  const L = 40 + 820 * u;
  p.poly([[50, 40], [250, 40], [250, L], [50, L]], "#f4ecd4", 7);
  for (let y = 80; y < L - 50; y += 34) p.line([[74, y], [226 - ((y * 7) % 40), y]], "#7a7468", 5, false);
  if (u > 0.85) p.ell(200, L - 40, 26, 26, "#b8332b", 6);
  p.ell(150, 40, 118, 18, "#c9a46a", 7);
};
/** heat shimmer under the door (500 x 120): a low orange glow, flames 0..1 licking out */
const drawDoorGap = (p: Pen, L: number, k: number) => {
  p.poly([[20, 116], [480, 116], [480, 100], [20, 100]], "#ffb347", 0);
  if (L > 0.02) for (let i = 0; i < 7; i++) {
    const x = 50 + i * 66, h = 20 + 80 * L * (0.6 + 0.4 * (((k + i) * 5) % 3) / 2), w = 26;
    p.poly([[x - w, 112], [x - w * 0.4, 112 - h * 0.6], [x, 112 - h], [x + w * 0.4, 112 - h * 0.6], [x + w, 112]], i % 2 ? "#ffd25a" : "#f07a2a", 4);
  }
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, p: V3, dx: number, dz: number, moving: boolean, expr: Expr) => {
  const v = viewOf(cam, p[0], p[2], dx, dz), phase = moving ? q((t * 1.9) % 1, 16) : 0;
  out.places.push(person(cam, who(i, o, okey), p[0], p[1], p[2], { side: moving && v.side, mirror: v.mirror },
    { mode: moving ? "stroll" : "stand", phase, expr, blink: lidAt(t, i) }, { mode: moving ? "march" : "stand", phase, expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs) * 0.8 }, 1));
  blob(out, p[0], p[1], p[2], 1);
};
const flick = (t: number) => Math.floor(t * 8) % 6;
/** smooth flicker phase: one step per frame, a full cycle every SMOOTH_N frames */
const smoothK = (t: number, off = 0) => (Math.round(t * 30) + off) % SMOOTH_N;
const flames = (out: Stage, p: V3, t: number, w: number, h: number, seed = 0) => {
  const k = (flick(t) + seed) % 6;
  out.fx.push({ key: `flames${k}`, cw: 400, ch: 400, draw: (pn) => drawFlames(pn, k), x: p[0], y: p[1] + h / 2, z: p[2], w, h });
};
/** a column of smoke puffs rising from p: n puffs cycling upward, small where they start */
const smoke = (out: Stage, p: V3, t: number, n: number, rise: number, size: number, shade: number, k = 1) => {
  for (let i = 0; i < n; i++) {
    const u = (t * 0.07 + i / n) % 1, s = size * (0.15 + 0.85 * Math.sqrt(u)) * (1 - smooth((u - 0.75) / 0.25)) * k * smooth(u / 0.08);
    if (s < 0.05) continue;
    out.fx.push({ key: `smoke${i % 4}_${shade}`, cw: 400, ch: 400, draw: (pn) => drawSmoke(pn, i % 4, shade), x: p[0] + 3 * u * Math.sin(i * 2.1) + 6 * u, y: p[1] + rise * u, z: p[2] - 2 * u, w: s, h: s * 0.9, soft: true });
  }
};
/** one soft smoke wisp at p, u 0..1 through its life: grows from nothing and fades out small at the top (no pop) */
const puff = (out: Stage, p: V3, u: number, size: number, seed = 0) => {
  const s = size * (0.3 + 0.7 * Math.sqrt(u)) * smooth(u / 0.12) * (1 - smooth((u - 0.8) / 0.2));
  if (s < 0.03) return;
  out.fx.push({ key: `smoke${seed % 4}_0`, cw: 400, ch: 400, draw: (pn) => drawSmoke(pn, seed % 4, 0), x: p[0], y: p[1] + 0.25 * size * u, z: p[2], w: s, h: s * 0.9, soft: true });
};
/** a stick tossed from a (hands) into b (the furnace mouth) over 0.5 s from t0 */
const toss = (out: Stage, a: V3, b: V3, t: number, t0: number) => {
  const u = (t - t0) / 0.5;
  if (u < 0 || u >= 1) return;
  const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u + 0.6 * u * (1 - u), z = a[2] + (b[2] - a[2]) * u;
  const g = smooth(u / 0.15); // grows out of the hand: no pop
  out.fx.push({ key: "stick", cw: 200, ch: 60, draw: drawStick, x, y, z, w: 0.5 * g, h: 0.15 * g, rot: q(u * 4, 8) });
};
/** roof tops of the whole palace, for flames and smoke */
const ROOFS: V3[] = [...PAL_Z.map((z, i): V3 => [PAL_X, D0 + [9.8, 12, 11, 12, 9.8, 11][i] + 2.4, z]), ...PAL2_Z.map((z, i): V3 => [PAL2_X, D0 + [12, 13, 12, 13, 12][i] + 2.6, z])];

// ---------------- the places ----------------
const palaceFire = (id: number, t: number, out: Stage) => {
  ROOFS.forEach((r, i) => {
    const grow = id === 1 ? 1 : 0.85 + 0.15 * smooth((t - T_FIREBALL) / 1.5);
    flames(out, [r[0] + 1.5, r[1] - 2.8, r[2]], t, 11 * grow, 8 * grow, i);
    smoke(out, [r[0], r[1] + 4, r[2]], t + i * 1.7, 6, 34, 12, 2);
  });
  if (id === 13) {
    const u = (t - T_FIREBALL + 0.07) / 1.4;
    if (u >= 0 && u < 1) {
      const uq = q(u, 20), r = ROOFS[3];
      out.fx.push({ key: `fireball${uq}`, cw: 500, ch: 500, draw: (pn) => drawFireball(pn, uq), x: r[0] + 2, y: r[1] + 4 + 8 * u, z: r[2], w: 10 + 22 * Math.min(1, u * 2), h: 10 + 22 * Math.min(1, u * 2) });
    }
  }
};
const crowdOnBridge = (t: number, cam: CamInfo, out: Stage) => {
  for (let i = 0; i < 22; i++) {
    const row = i % 3, x = 56.5 + (i / 22) * 15 + 0.4 * row, z = 69.2 + 1.5 * row + 0.3 * hh(i, 2);
    const ex: Expr = t < T_CROWDS - 0.07 ? "shock" : (["shock", "nervous", "shock", "dazed"] as Expr[])[i % 4];
    front(cam, t, out, 60 + i, i === 10 || i === 17 ? { ...KIDO, jacket: "#c25a3a" } : FOLK[i % 6], `crowd${i}`, x, BR_Y, z, ex);
  }
};
const extSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 1 || id === 13) {
    palaceFire(id, t, out);
    if (id === 13) crowdOnBridge(t, cam, out);
    else for (let i = 0; i < 14; i++) front(cam, t, out, 60 + i, FOLK[i % 6], `crowd${i}`, 46 + i * 3.2, BR_Y, 69 + (i % 3) * 1.5, "shock");
  } else { // the morning after: thin smoke over the ruin
    ROOFS.forEach((r, i) => { if (i % 2 === 0) smoke(out, [r[0], D0 + 4, r[2]], t + i * 1.3, 5, 26, 8, 1, 0.8); });
  }
};

const yardSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [tx, ty, tz] = TABLE;
  if (id === 2 || id === 3) {
    const showing = id === 2 && t < T_SPLIT - 0.07;
    let cex: Expr = id === 2 ? (t < T_TALLY - 0.07 ? "smile" : "stern") : "stern";
    let mex: Expr = id === 2 ? "smile" : (t < T_MATCH - 0.07 ? "nervous" : "relief");
    if (id === 3 && t >= T_MATCH - 0.07) cex = "grin";
    if (id === 2 && t >= T_SPLIT - 0.07) mex = "grin";
    front(cam, t, out, 1, CLERK, "clerk", tx - 0.6, ty, tz - 1.7, cex, { wave: id === 2 && showing ? 0.5 : undefined });
    front(cam, t, out, 2, MERCHANT, "merch", tx + 0.65, ty, tz - 1.75, mex);
    // the stick: whole, then split; in shot 3 the halves held apart, then fitted back together on "match"
    const sep = id === 2 ? (showing ? 0 : smooth((t - T_SPLIT + 0.07) / 0.3)) : 1 - smooth((t - T_MATCH + 0.07) / 0.35);
    const sq = q(sep, 12);
    const y = ty + (id === 2 ? 1.3 : 1.22);
    out.fx.push({ key: `tally${showing ? "w" : "s"}${sq}`, cw: 600, ch: 240, draw: (p) => drawTally(p, !showing, sq), x: tx, y, z: tz - 0.55, w: 1.0, h: 0.4 });
  }
  if (id === 4) {
    front(cam, t, out, 3, WEOBLEY, "weob", -19.2, D0 + 0.08, 13.0, t < T_WAY - 0.07 ? "stern" : "nervous", { wave: 0.5 });
    front(cam, t, out, 4, CROSS, "cross", -20.3, D0 + 0.08, 12.4, "nervous");
    front(cam, t, out, 5, FURLONG, "furl", -21.3, D0 + 0.08, 12.5, "neutral");
    void CART1;
  }
  if (id === 8) {
    const moving = t < 34.9;
    walker(cam, t, out, 4, CROSS, "cross", walkAt(t), WALK1[0] - WALK0[0], WALK1[2] - WALK0[2], moving, t < T_SHUT - 0.07 ? "smile" : "whistle");
    walker(cam, t, out, 5, FURLONG, "furl", walkAt(t, 0.45), WALK1[0] - WALK0[0], WALK1[2] - WALK0[2], t < 35.35, t < T_PUB - 0.07 ? "smile" : "grin");
  }
  if (id === 8 || id === 4) out.fx.push({ key: "pubsign", cw: 300, ch: 260, draw: drawSign, x: PUB[0] + 5.0, y: D0 + 2.9, z: PUB[2] + 1.94, w: 1.1, h: 0.95 });
  if (id === 15) {
    const late = t >= T_PARL - 0.07;
    front(cam, t, out, 4, CROSS, "cross", -11.3, D0 + 0.08, 0.7, late ? "shock" : "nervous");
    front(cam, t, out, 5, FURLONG, "furl", -11.3, D0 + 0.08, -0.7, late ? "shock" : "nervous");
    front(cam, t, out, 3, WEOBLEY, "weob", -10.4, D0 + 0.08, 0, t < T_BILL - 0.07 ? "stern" : "pained", { wave: t >= T_BILL - 0.3 ? 0.3 : undefined });
    const u = smooth((t - T_BILL + 0.07) / 0.8), uq = q(u, 20);
    // the rolled bill in his hands from the start of the shot; on "bill" it unrolls down to the ground
    out.fx.push({ key: `bill${uq}`, cw: 300, ch: 900, draw: (p) => drawBill(p, uq), x: -10.85, y: D0 + 0.84, z: 0.3, w: 0.42, h: 1.26 });
    smoke(out, [10, D0 + 4, -8], t, 6, 24, 8, 1, 0.8);
  }
};

const cellarSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [cx, cy, cz] = CELLAR;
  // the furnace mouths: low coals before the burning starts, then the wood flames (shot 10: coal first, then wood)
  FURN_X.forEach((fx, i) => {
    let L = id === 5 ? 0.15 + 0.55 * smooth((t - T_BURNED2 + 0.07) / 0.6) : 0.7;
    if (id === 10) L = i === 0 ? (t < T_WOOD - 0.07 ? 0 : smooth((t - T_WOOD + 0.07) / 0.5)) : 0.3;
    const lq = q(L, 10), k = id === 10 ? 100 + smoothK(t, i * 7) : flick(t + i * 0.3);
    out.fx.push({ key: `mouth${lq}_${k}`, cw: 300, ch: 300, draw: (p) => drawMouth(p, lq, k), x: cx + fx, y: cy + 0.68, z: cz - 3.5, w: 1.3, h: 1.3 });
    if (id === 10 && i === 0 && t >= T_WOOD - 0.07) { // dry wood: the flames burst out of the mouth and climb the flue
      const u = smooth((t - T_WOOD + 0.07) / 0.9) * (1 + 0.25 * smooth((t - T_TALL + 0.07) / 0.5));
      const n = smoothK(t, 5), w = 1.4 * smooth(u / 0.2), h = 0.05 + 2.95 * u;
      out.fx.push({ key: `sflames${n}`, cw: 400, ch: 400, draw: (pn) => drawFlamesSmooth(pn, n), x: cx + fx, y: cy + 1.0 + h / 2, z: cz - 3.45, w, h });
    }
  });
  if (id === 5) {
    front(cam, t, out, 3, WEOBLEY, "weob", cx - 1.6, cy + 0.08, cz + 0.2, t < T_BURNED2 - 0.07 ? "stern" : "smile", { wave: t >= T_BURNED2 - 0.4 ? 0.7 : undefined });
    front(cam, t, out, 4, CROSS, "cross", cx + 0.6, cy + 0.08, cz - 0.6, "neutral");
    front(cam, t, out, 5, FURLONG, "furl", cx + 1.9, cy + 0.08, cz - 1.1, "neutral");
  }
  if (id === 6) {
    const cr: V3 = [cx - 3.15, cy + 0.08, cz - 2.5], fu: V3 = [cx - 0.55, cy + 0.08, cz - 2.3];
    const tossC = [23.2, 24.5, 25.8, T_FED - 0.07, 27.2], tossF = [23.8, 25.1, T_FED + 0.3, 27.6];
    const armUp = (ts: number[]) => ts.some((s) => t >= s - 0.15 && t < s + 0.25);
    front(cam, t, out, 4, CROSS, "cross", cr[0], cr[1], cr[2], t < T_JOSHUA - 0.07 ? "smile" : "whistle", { wave: armUp(tossC) ? 0.6 : undefined });
    front(cam, t, out, 5, FURLONG, "furl", fu[0], fu[1], fu[2], t < T_PATRICK - 0.07 ? "smile" : "grin", { wave: armUp(tossF) ? 0.6 : undefined });
    for (const s of tossC) toss(out, [cr[0] + 0.35, cy + 1.35, cr[2] + 0.1], [cx + FURN_X[0], cy + 0.7, cz - 3.4], t, s);
    for (const s of tossF) toss(out, [fu[0] - 0.35, cy + 1.35, fu[2] + 0.1], [cx + FURN_X[0] + 0.3, cy + 0.7, cz - 3.4], t, s);
  }
  if (id === 10) toss(out, [cx + FURN_X[0] + 0.9, cy + 1.6, cz - 1.0], [cx + FURN_X[0], cy + 0.7, cz - 3.4], t, T_WOOD - 0.55);
  void T_COAL;
};

const chamberSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [hx, hy, hz] = CHAMBER;
  if (id === 7) {
    const hop = t >= T_HOT - 0.07 ? Math.abs(Math.sin((t - T_HOT + 0.07) * Math.PI * 2.6)) * 0.16 * (1 - smooth((t - T_HOT - 0.9) / 0.4)) : 0;
    const ex: Expr = t < T_HOT - 0.07 ? "nervous" : "shock";
    front(cam, t, out, 6, VIS_M, "vism", hx - 0.6, hy + 0.08 + hop, hz + 0.6, t < 28.8 ? "smile" : ex);
    front(cam, t, out, 7, VIS_F, "visf", hx + 0.6, hy + 0.08 + 0.8 * hop, hz + 0.4, ex);
    for (let i = 0; i < 6; i++) { const u = ((t - 27.9) * 0.5 + i / 6) % 1; if (t > 27.9) puff(out, [hx - 2.4 + i * 1.0, hy + 0.15 + 1.6 * u, hz - 1.2 - (i % 2) * 1.2], u, 1.1, i); }
  }
  if (id === 12) {
    // hot gas racing up the wall behind the panelling, then the panelling catches
    for (let i = 0; i < 7; i++) {
      const u = ((t - T_RACED + 0.07) * 1.3 + i / 7) % 1;
      if (t >= 48.9) puff(out, [hx - 1.4 + 0.25 * Math.sin(i * 2.3), hy + 0.3 + 5.4 * u, hz - 5.6], u, 1.3, i);
    }
    const spots: V3[] = [[-1.4, 0.5, 0], [-3.0, 1.6, 0], [0.4, 1.2, 0], [-2.0, 3.4, 0], [1.6, 3.0, 0], [-4.2, 3.6, 0]];
    spots.forEach((s, i) => {
      const u = smooth((t - T_CAUGHT + 0.07 - i * 0.12) / 0.5);
      if (u > 0.02) flames(out, [hx + s[0], hy + s[1], hz - 5.7], t, 2.6 * u, 3.2 * u, i);
    });
  }
};

const corridorSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [kx, ky, kz] = CORRIDOR;
  const L = smooth((t - T_FLAMES + 0.07) / 0.4), lq = q(L, 10), k = flick(t);
  out.fx.push({ key: `gap${lq}_${k}`, cw: 500, ch: 120, draw: (p) => drawDoorGap(p, lq, k), x: kx, y: ky + 0.24 + 0.1 * L, z: kz - 2.9, w: 2.3, h: 0.55 });
  if (t > 36.2) for (let i = 0; i < 4; i++) { const u = ((t - 36.2) * 0.6 + i / 4) % 1; puff(out, [kx - 0.8 + i * 0.55, ky + 0.3 + 1.6 * u, kz - 2.7], u, 0.7, i); }
  const p: V3 = [kx + 1.3 - 0.4 * smooth((t - 35.2) / 1.2), ky + 0.08, kz - 0.2];
  front(cam, t, out, 8, WIFE, "wife", p[0], p[1], p[2], t < T_FLAMES - 0.07 ? "smile" : "shock", t >= T_FLAMES - 0.07 ? { wave: 0.8 } : {});
  void id;
};

const gardenSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [gx, gy, gz] = GARDEN;
  const paper = smooth((t - T_STUFF + 0.07) / 0.9), fire = smooth((t - T_FLAMES2 + 0.07) / 0.3) * (0.9 + 0.1 * Math.sin(t * 9));
  const pq = q(paper, 10), fq = q(fire, 10), k = flick(t);
  out.fx.push({ key: `toaster${pq}_${fq}_${fq > 0 ? k : 0}`, cw: 400, ch: 400, draw: (p) => drawToaster(p, pq, fq, k), x: gx + 0.05, y: gy + 0.8 + 0.25, z: gz, w: 0.5, h: 0.5 });
  front(cam, t, out, 9, KIDO, "kid", gx + 0.55, gy, gz - 0.5, t < T_STUFF - 0.07 ? "smile" : t < T_FLAMES2 - 0.07 ? "grin" : "shock", t >= T_STUFF - 0.07 && t < T_FLAMES2 - 0.07 ? { wave: 0.4 } : {});
  void id;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "ext") extSet(id, t, cam, out);
  else if (s.scene === "yard") yardSet(id, t, cam, out);
  else if (s.scene === "cellar") cellarSet(id, t, cam, out);
  else if (s.scene === "chamber") chamberSet(id, t, cam, out);
  else if (s.scene === "corridor") corridorSet(id, t, cam, out);
  else gardenSet(id, t, cam, out);
  void clamp01; void T_BURNED; void T_COAL;
  return out;
};
