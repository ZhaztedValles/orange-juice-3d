// The cast and hand-drawn props of the last-season story: Howard Carter (dark suit, brown cap), Lord Carnarvon (pale
// suit, top hat), Lady Evelyn (pink, bonnet), the American who gave up (blue coat, top hat, white moustache), the
// diggers (long pale robes, white caps), tourists, a London newsboy and his crowd, a later dig team and two thieves.
// Every prop is an unlit ink-outlined drawing: the gold mask, Carter's drawing of the boy king, sand baskets, the candle,
// the newspaper (its mask picture fades on "no"), parasols, sacks, gold glints. Cards that arrive mid-shot grow in, never pop.
import { Pen, townsfolk, KID, SKINS, Outfit, Expr, FrontOpts, SideOpts } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import { fxBurst } from "../../src/engine/toon";
import {
  D0, TY, SHOTS, PIT, stepY, CH, MASK, DOOR, NEWS, WALK_Y, LORD_L, CARTER_L, SKETCH_AT, AMER_AT, smooth, clamp01, V3,
  T_TREASURE, T_ONE0, T_CHANCE, T_PAID, T_TUT, T_GIVEN, T_EMPTY, T_NOTHING, T_GONE, T_BEGGED, T_ONE, T_STEP, T_MEN, T_SEALED,
  T_RUSHED, T_HOLE, T_ASKED, T_ANY, T_WONDER, T_NO, T_TOUR, T_NO1, T_SONGS, T_CURSE, T_TEAM, T_OR, T_THIEVES, T_YES2, T_ONE2, T_TOMB, T_MOVE,
} from "./story";

const Y = D0, WY = D0 + WALK_Y;
const CARTER: Outfit = { jacket: "#4a4852", pants: "#3a3a44", boots: "#2a2220", hat: "cap", cap: "#6b5238", skin: SKINS[0], moustache: "#3a2a20", buttons: "#c9a24a" };
const LORD: Outfit = { jacket: "#d6c9a8", pants: "#a89a7e", boots: "#5a3b2a", hat: "tophat", skin: SKINS[1], moustache: "#7a5a3a", buttons: "#8a6a3e" };
const EVELYN: Outfit = { jacket: "#d98a96", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", hair: "#6b4a32", dress: "#f0bcc4", skin: SKINS[0] };
const AMER: Outfit = { jacket: "#5a6a8a", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", moustache: "#ece8e0", skin: SKINS[1], buttons: "#d9dde0" };
const WORKERS: Outfit[] = [3, 2, 3, 1, 2, 3].map((k, i) => ({
  jacket: ["#efe6d2", "#e2d6bc", "#d8cbb0", "#efe6d2", "#c9d2d8", "#e8dcc4"][i], pants: "#e8dcc4", boots: "#6a4a32", hat: "cap",
  cap: i % 2 ? "#f6f2ea" : "#e9e1cf", dress: ["#ebe1cb", "#ddd0b4", "#d2c4a6", "#ece3cf", "#c4ccd2", "#e4d8c0"][i], skin: SKINS[k],
}));
const TEAM: Outfit[] = [
  { jacket: "#8a6a3e", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#c9b48a", skin: SKINS[0] },
  { jacket: "#3f6b4a", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#e6dcc0", skin: SKINS[2], moustache: "#2a201a" },
  { jacket: "#7a4e6a", pants: "#4a4f5e", boots: "#3a2a20", hat: "hair", hair: "#3a2a20", skin: SKINS[1] },
];
const THIEF: Outfit[] = [
  { jacket: "#3a3446", pants: "#2c2f3a", boots: "#2a2220", hat: "cap", cap: "#2a2a30", skin: SKINS[2], moustache: "#2a201a" },
  { jacket: "#4a3a30", pants: "#2c2f3a", boots: "#2a2220", hat: "cap", cap: "#5a4030", skin: SKINS[3] },
];
const NEWSBOY: Outfit = { ...KID, jacket: "#8a6a3e", pants: "#4a4f5e", boots: "#3a2a20", cap: "#4a4850", skin: SKINS[1] };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);

// ---------------- drawings ----------------
/** the gold mask (400 x 480): a gold face in a blue-and-gold striped headcloth, a blue-striped beard, kohl eyes */
const drawMask = (p: Pen) => {
  p.poly([[200, 18], [330, 60], [372, 200], [388, 420], [300, 470], [100, 470], [12, 420], [28, 200], [70, 60]], "#2f5f9a", 9);
  for (let i = 0; i < 9; i++) { const y = 70 + i * 44; p.line([[24 + i * 1.5, y], [100, y - 6]], "#e8b84a", 14, false); p.line([[300, y - 6], [376 - i * 1.5, y]], "#e8b84a", 14, false); }
  p.poly([[200, 40], [300, 76], [316, 150], [84, 150], [100, 76]], "#e8b84a", 7);
  p.ell(200, 250, 108, 132, "#f0c050", 9);
  p.ell(160, 228, 26, 13, "#ffffff", 5); p.ell(240, 228, 26, 13, "#ffffff", 5);
  p.dot(160, 228, 9, "#1f1a24"); p.dot(240, 228, 9, "#1f1a24");
  p.line([[124, 204], [194, 200]], "#1f2a5a", 7, false); p.line([[206, 200], [276, 204]], "#1f2a5a", 7, false);
  p.line([[200, 236], [192, 290], [210, 292]], "#b8862a", 5, false);
  p.line([[176, 322], [224, 322]], "#9a5a3a", 7, false);
  p.poly([[184, 380], [216, 380], [222, 470], [178, 470]], "#2f5f9a", 6);
  for (let y = 392; y < 470; y += 16) p.line([[182, y], [218, y]], "#e8b84a", 5, false);
  p.poly([[150, 30], [250, 30], [236, 62], [164, 62]], "#e8b84a", 6);
};
/** Carter's drawing (300 x 260): a sheet with a sketched young king's head in a striped headcloth */
const drawSketch = (p: Pen) => {
  p.poly([[10, 14], [290, 8], [292, 250], [8, 254]], "#f3ead2", 7);
  p.poly([[150, 40], [220, 66], [232, 200], [68, 200], [80, 66]], "#c9b48a", 5);
  p.ell(150, 140, 50, 62, "#f6efdc", 5);
  p.dot(132, 130, 5, "#4a3a30"); p.dot(168, 130, 5, "#4a3a30");
  p.line([[136, 168], [164, 168]], "#4a3a30", 4, false);
  for (let y = 214; y < 244; y += 10) p.line([[40, y], [260, y]], "#b9ad92", 3, false);
};
/** a sand basket (200 x 150), full when k > 0 */
const drawBasket = (full: boolean) => (p: Pen) => {
  if (full) p.ell(100, 50, 84, 30, "#d9bd8f", 6);
  p.poly([[14, 50], [186, 50], [160, 140], [40, 140]], "#a8743e", 8);
  for (let x = 40; x < 170; x += 24) p.line([[x, 54], [x + 6, 136]], "#7d5234", 4, false);
  p.line([[24, 84], [176, 84]], "#7d5234", 4, false);
};
/** a candle in a little holder (100 x 260) */
const drawCandle = (p: Pen) => {
  p.poly([[34, 60], [66, 60], [66, 220], [34, 220]], "#f4ecd4", 6);
  p.ell(50, 230, 40, 14, "#b8862a", 6);
  p.ell(50, 34, 14, 26, "#ffd36a", 4); p.ell(50, 40, 6, 12, "#fff6d0", 0);
};
/** the hole in the plaster (120 x 100): a dark gap with a gold gleam inside */
const drawHole = (p: Pen) => {
  p.poly([[10, 30], [60, 8], [112, 26], [104, 86], [20, 92]], "#1f1714", 6);
  p.ell(64, 56, 20, 12, "#c8902a", 0);
};
/** the newspaper (400 x 300): columns, a masthead band, and a big picture of the mask, faded by k (0 = gone) */
const drawPaper = (k: number) => (p: Pen) => {
  p.poly([[10, 20], [390, 10], [392, 290], [8, 284]], "#f1ece1", 8);
  for (let y = 40; y < 280; y += 16) { p.line([[24, y], [96, y]], "#8d8a86", 5, false); p.line([[304, y], [376, y]], "#8d8a86", 5, false); }
  p.poly([[112, 30], [288, 30], [288, 64], [112, 64]], "#3a3446", 0);
  if (k > 0.02) {
    const g = p.g; g.save(); g.globalAlpha = k;
    p.poly([[200, 80], [262, 104], [276, 270], [124, 270], [138, 104]], "#2f5f9a", 5);
    p.ell(200, 170, 46, 60, "#f0c050", 5);
    p.dot(184, 160, 5, "#1f1a24"); p.dot(216, 160, 5, "#1f1a24");
    g.restore();
  }
  if (k < 0.98) for (let y = 90; y < 270; y += 16) p.line([[124, y], [276, y]], "#8d8a86", 5, false);
};
/** a parasol (300 x 200) in colour c */
const drawParasol = (c: string) => (p: Pen) => {
  p.poly([[10, 130], [60, 50], [150, 16], [240, 50], [290, 130]], c, 8);
  p.line([[150, 18], [150, 196]], "#4a3426", 7);
  p.line([[60, 52], [100, 128]], "#00000033", 4, false); p.line([[240, 52], [200, 128]], "#00000033", 4, false);
};
/** a bulging sack (200 x 220) */
const drawSack = (p: Pen) => {
  p.poly([[60, 40], [140, 40], [190, 150], [160, 210], [40, 210], [10, 150]], "#9a7a4a", 8);
  p.line([[64, 52], [136, 52]], "#5a4030", 7, false);
};
/** a pick (300 x 120) over the shoulder */
const drawPick = (p: Pen) => {
  p.line([[20, 100], [240, 30]], "#8a6a44", 12);
  p.poly([[200, 10], [290, 40], [270, 54], [196, 34]], "#5a5860", 6);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = Y) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, phase: number, expr: Expr,
  so: SideOpts = {}, y = Y) => {
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "march", phase: q(phase, 48), expr, blink: lidAt(t, i) }, { mode: "march", phase: q(phase, 48), expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs), ...so }, 1));
  blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** before / after a word (2 frames early) */
const by = (t: number, t0: number) => t >= t0 - 0.07;
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) => {
  if (w > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
};
const burst = (out: Stage, p: V3, t: number, t0: number, size: number, col = "#fff3b0", d = 0.35) => {
  const u = (t - t0) / d;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 12);
  out.fx.push({ key: `burst${uq}${col}`, cw: 500, ch: 500, draw: (pn) => fxBurst(pn, uq, col), x: p[0], y: p[1], z: p[2], w: size * (1 - 0.3 * u), h: size * (1 - 0.3 * u) });
};
/** a pendulum of the head for "no": headTilt in degrees */
const shake = (t: number, t0: number, d = 0.9) => (t < t0 - 0.07 || t > t0 + d ? 0 : 12 * Math.sin((t - t0 + 0.07) * 14) * (1 - (t - t0) / d));
/** a raised hand (wave 0..1) settling in over 0.25 s from t0 */
const raise = (t: number, t0: number) => (by(t, t0) ? q(0.85 * smooth((t - t0 + 0.07) / 0.25), 6) : 0);
/** a digger carrying a basket on his head along a line, looping: from a to b in d seconds, then back empty */
const carrier = (cam: CamInfo, t: number, out: Stage, i: number, a: V3, b: V3, d: number, ph: number, y = Y) => {
  const u = ((t / d + ph) % 2 + 2) % 2, go = u < 1, k = go ? u : 2 - u;
  const x = a[0] + (b[0] - a[0]) * k, z = a[2] + (b[2] - a[2]) * k, sx = go ? b[0] - a[0] : a[0] - b[0], sz = go ? b[2] - a[2] : a[2] - b[2];
  walker(cam, t, out, i, WORKERS[i % 6], `w${i % 6}`, x, z, sx, sz, t * 1.7 + i * 0.3, i % 3 ? "smile" : "neutral", {}, y);
  card(out, go ? "basketF" : "basketE", 200, 150, drawBasket(go), x, y + 2.05, z, 0.5, 0.37);
};
const lawnPair = (cam: CamInfo, t: number, out: Stage, lx: Expr, lo: FrontOpts, cx: Expr, co: FrontOpts) => {
  front(cam, t, out, 1, LORD, "lord", LORD_L[0], LORD_L[2], lx, { facing: 1, ...lo });
  front(cam, t, out, 2, CARTER, "carter", CARTER_L[0], CARTER_L[2], cx, { facing: -1, ...co });
};

// ---------------- the places ----------------
const roomSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  card(out, "mask", 400, 480, drawMask, MASK[0], MASK[1], MASK[2], 0.5, 0.6);
  card(out, "candle", 100, 260, drawCandle, CH[0] + 0.9, D0 + 1.3, MASK[2] + 1.1, 0.1, 0.26);
  if (id === 1) burst(out, [MASK[0] + 0.12, MASK[1] + 0.18, MASK[2] + 0.05], t, T_TREASURE - 0.05, 0.4, "#fff0b0", 0.4);
  else {
    burst(out, [CH[0] - 1.0, D0 + 1.0, CH[2] - 2.0], t, T_WONDER - 0.05, 0.55, "#fff0b0", 0.4);
    burst(out, [CH[0] + 1.6, D0 + 1.3, CH[2] - 3.2], t, T_WONDER + 0.2, 0.5, "#fff0b0", 0.4);
    burst(out, [CH[0] - 3.0, D0 + 1.5, CH[2] - 3.3], t, T_WONDER + 0.45, 0.5, "#fff0b0", 0.4);
  }
};

const lawnSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 2) lawnPair(cam, t, out, by(t, T_ONE0) ? "smile_closed" : "stern", { wave: raise(t, T_ONE0) }, by(t, T_CHANCE) ? "grin" : "nervous", {});
  else if (id === 7) {
    const gone = by(t, T_GONE), beg = by(t, T_BEGGED), one = by(t, T_ONE);
    lawnPair(cam, t, out, one ? "smile_closed" : gone ? "stern" : "neutral", { headTilt: shake(t, T_GONE), wave: raise(t, T_ONE) },
      beg ? "pained" : gone ? "shock" : "neutral", { tilt: beg && !one ? 7 : 0 });
  } else if (id === 13) lawnPair(cam, t, out, "stern", { headTilt: shake(t, T_NO, 1.2) }, by(t, T_NO) ? "pained" : "nervous", {});
  else lawnPair(cam, t, out, by(t, T_YES2) ? "grin" : "smile_closed", { wave: raise(t, T_ONE2) }, by(t, T_YES2) ? "laugh" : "nervous", {});
};

const valleySet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 3) {
    front(cam, t, out, 1, CARTER, "carter", 0.5, -8.6, "smile", {}, TY);
    front(cam, t, out, 2, LORD, "lord", -3.5, -1.5, by(t, T_PAID) ? "smile_closed" : "smile");
    for (let j = 0; j < 4; j++) carrier(cam, t, out, 3 + j, [-6 + j * 2, TY, -10], [-6 + j * 2 + 6, TY, -8.5], 4.5, j * 0.45, TY);
    for (let j = 0; j < 3; j++) carrier(cam, t, out, 8 + j, [4 + j * 2.5, Y, -3.5], [16, Y, -2.5], 5.5, j * 0.6);
  } else if (id === 4) {
    const [x, y, z] = SKETCH_AT, tut = by(t, T_TUT);
    front(cam, t, out, 1, CARTER, "carter", x, z, tut ? "grin" : "smile", {}, y);
    card(out, "sketch", 300, 260, drawSketch, x - 0.05, y + 1.05, z + 0.35, 0.5, 0.43);
    carrier(cam, t, out, 3, [x - 5, y, z - 2.5], [x + 3, y, z - 3.5], 4.0, 0.2, y);
  } else if (id === 5) {
    const x = AMER_AT[0] + 0.9 * (t - SHOTS[4].a / 30), z = AMER_AT[2];
    walker(cam, t, out, 1, AMER, "amer", x, z, 1, 0.15, t * 1.6, by(t, T_EMPTY) ? "pained" : by(t, T_GIVEN) ? "nervous" : "stern", {});
    card(out, "basketE", 200, 150, drawBasket(false), x + 0.35, Y + 0.85, z + 0.25, 0.42, 0.31);
    front(cam, t, out, 2, WORKERS[1], "w1", AMER_AT[0] - 2.5, AMER_AT[2] - 2.0, by(t, T_EMPTY) ? "nervous" : "neutral");
    front(cam, t, out, 3, WORKERS[4], "w4", AMER_AT[0] - 1.2, AMER_AT[2] - 2.8, "neutral");
  } else if (id === 6) {
    for (let j = 0; j < 6; j++) carrier(cam, t, out, 3 + j, [-5 + j * 1.6, Y, -4.6], [6 + j * 1.6, Y, -1.0 + (j % 2) * 1.2], 3.6, j * 0.33);
    const no = by(t, T_NOTHING);
    front(cam, t, out, 1, CARTER, "carter", -1.2, -2.2, no ? "pained" : "stern", { tilt: no ? -5 : 0 });
    card(out, "basketE", 200, 150, drawBasket(false), -1.0, Y + 0.95, -1.9, 0.42, 0.31);
  } else if (id === 8) {
    const hit = by(t, T_STEP), men = by(t, T_MEN);
    const ph = ((t - 24.1) / 0.75) % 1, strike = q(clamp01(hit ? 0 : 1 - Math.abs(ph - 0.5) * 2), 8);
    front(cam, t, out, 1, WORKERS[0], "w0", 2.0, -9.2, hit ? "shock" : "stern", { prop: ["hammer", hit ? 0 : strike] }, TY);
    front(cam, t, out, 2, WORKERS[2], "w2", 3.4, -9.0, hit ? "shock" : "neutral", { prop: ["hammer", hit ? 0 : q(clamp01(1 - Math.abs(((ph + 0.5) % 1) - 0.5) * 2), 8)] }, TY);
    front(cam, t, out, 3, WORKERS[3], "w3", 5.4, -12.4, hit ? "grin" : "neutral", {}, TY);
    carrier(cam, t, out, 4, [-2, TY, -12], [-0.5, TY, -7.5], 3.5, 0.3, TY);
    walker(cam, t, out, 5, CARTER, "carter", 6.2 - 0.9 * clamp01((t - T_MEN + 0.5) / 1.4), -10.6, -1, 0, t * 1.6, men ? (hit ? "grin" : "shock") : "neutral", {}, TY);
    burst(out, [2.6, TY + 0.05, -10.25], t, T_STEP - 0.05, 0.9, "#fff3b0");
  } else if (id === 9) {
    const sealed = by(t, T_SEALED);
    for (let j = 0; j < 3; j++) { const z = -11.0 - j * 1.4, x = j % 2 ? 3.05 : 2.15; front(cam, t, out, 1 + j, WORKERS[j], `w${j}`, x, z, sealed ? "grin" : "neutral", {}, stepY(z)); }
    front(cam, t, out, 5, CARTER, "carter", 2.2, -15.35, sealed ? "grin" : "shock", { wave: sealed ? 0.6 : 0 }, Y);
  } else if (id === 10) {
    const t0 = SHOTS[9].a / 30, x = -7.6 + 1.7 * (t - t0);
    walker(cam, t, out, 1, LORD, "lord", x, 0.2, 1, -0.2, t * 2.4, "grin", {});
    walker(cam, t, out, 2, EVELYN, "evelyn", x - 1.1, 0.8, 1, -0.2, t * 2.4 + 0.4, "smile", {});
    front(cam, t, out, 3, CARTER, "carter", -1.6, -3.4, by(t, T_RUSHED) ? "laugh" : "grin", { wave: q(0.5 + 0.5 * Math.sin(t * 7), 6) });
    for (let j = 0; j < 3; j++) front(cam, t, out, 4 + j, WORKERS[j + 2], `w${j + 2}`, -0.4 + j * 1.0, -4.2 + (j % 2) * 0.5, "smile");
  } else if (id === 11) {
    const awe = by(t, T_HOLE + 0.4), ask = by(t, T_ASKED), dx = DOOR[0], dz = DOOR[2];
    card(out, "hole", 120, 100, drawHole, dx - 0.3, Y + 1.62, dz + 0.04, 0.22, 0.18);
    front(cam, t, out, 1, CARTER, "carter", dx + 0.22, dz + 0.55, awe ? "shock" : "stern", { facing: -1, wave: 0.7 }, Y);
    card(out, "candle", 100, 260, drawCandle, dx - 0.28, Y + 1.5, dz + 0.42, 0.1, 0.26);
    front(cam, t, out, 2, LORD, "lord", dx + 0.62, dz + 1.05, ask ? "nervous" : "neutral", { facing: -1 }, Y);
    void T_ANY;
  } else if (id === 14) {
    for (let j = 0; j < 5; j++) {
      const x = -6 + 1.15 * (t - 40.2) + j * 1.9, z = -8.6 - (j % 2) * 0.5, c = ["#f0c4c8", "#f6ecd2", "#c9e0f0", "#f2d98a", "#d8c4f0"][j];
      walker(cam, t, out, 1 + j, FOLK[(j * 3) % 8], `tour${j}`, x, z, 1, 0, t * 1.5 + j * 0.37, by(t, T_TOUR) ? (j % 2 ? "grin" : "smile") : "smile", {}, TY);
      if (j % 2 === 0) card(out, `para${j}`, 300, 200, drawParasol(c), x + 0.1, TY + 2.25, z, 0.85, 0.57);
    }
    front(cam, t, out, 7, WORKERS[5], "w5", -1.2, -11.8, "smile", { wave: q(0.5 + 0.5 * Math.sin(t * 4), 6) }, TY);
  } else if (id === 16) {
    if (t * 30 < Math.round(T_OR * 30) - 2 - 0.5) {
      const team = by(t, T_TEAM), ph = ((t - 49.0) / 0.7) % 1;
      TEAM.forEach((o, j) => front(cam, t, out, 1 + j, o, `team${j}`, 1.2 + j * 1.3, -9.0 - (j % 2) * 0.4, team ? (j % 2 ? "grin" : "smile") : "neutral",
        j < 2 ? { prop: ["hammer", q(clamp01(1 - Math.abs(((ph + j * 0.5) % 1) - 0.5) * 2), 8)] } : { wave: 0.5 }, TY));
      card(out, "pick", 300, 120, drawPick, 5.6, TY + 1.0, -9.6, 0.8, 0.32);
    } else {
      const t0 = T_THIEVES - 0.3;
      for (let j = 0; j < 2; j++) {
        const x = -1.2 + 0.8 * (t - t0) + j * 1.3, z = -9.0 - j * 0.6;
        walker(cam, t, out, 4 + j, THIEF[j], `thief${j}`, x, z, 1, -0.1, t * 1.2 + j * 0.5, j ? "grin" : "nervous", {}, TY);
        card(out, "sack", 200, 220, drawSack, x - 0.35, TY + 0.75, z + 0.2, 0.45, 0.5);
      }
    }
  } else if (id === 18) {
    const yes = by(t, T_TOMB), end = by(t, T_MOVE);
    front(cam, t, out, 1, CARTER, "carter", 1.0, -9.2, yes ? "grin" : "smile", { wave: end ? q(0.5 + 0.5 * Math.sin(t * 6), 6) : 0 }, TY);
    front(cam, t, out, 2, LORD, "lord", 4.3, -9.4, yes ? "laugh" : "smile", {}, TY);
    front(cam, t, out, 3, EVELYN, "evelyn", 4.9, -11.4, "grin", {}, TY);
    for (let j = 0; j < 3; j++) front(cam, t, out, 4 + j, WORKERS[j], `w${j}`, [0.4, 0.9, 5.4][j], [-11.6, -13.2, -13.0][j], end ? "laugh" : "smile", {}, TY);
  }
};

const streetSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const [nx, , nz] = NEWS, gone = 1 - smooth((t - T_NO1 + 0.07) / 0.5);
  front(cam, t, out, 1, NEWSBOY, "news", nx, nz, by(t, T_NO1) ? "nervous" : "grin", { wave: q(0.6 + 0.4 * Math.sin(t * 5), 6) }, WY);
  card(out, `paper${q(gone, 10)}`, 400, 300, drawPaper(q(gone, 10)), nx - 0.32, WY + 0.98, nz + 0.3, 0.62, 0.47);
  front(cam, t, out, 2, FOLK[0], "f0", nx - 1.2, nz - 0.5, by(t, T_SONGS) ? "neutral" : "smile", { tilt: by(t, T_SONGS) ? -5 : 0 }, WY);
  front(cam, t, out, 3, FOLK[2], "f2", nx + 1.0, nz - 0.7, by(t, T_CURSE) ? "nervous" : "smile", {}, WY);
  front(cam, t, out, 4, FOLK[5], "f5", nx + 2.6, nz - 0.2, "smile", {}, WY);
  for (let j = 0; j < 4; j++) walker(cam, t, out, 5 + j, FOLK[(j + 3) % 8], `p${j}`, nx - 10 + j * 6 + 1.0 * (t - 44.4) * (j % 2 ? 1 : -1), j % 2 ? -5.6 : 6.4, j % 2 ? 1 : -1, 0, t * 1.5 + j * 0.3, "smile", {}, WY);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "valley") valleySet(id, t, cam, out);
  else if (s.scene === "lawn") lawnSet(id, t, cam, out);
  else if (s.scene === "street") streetSet(id, t, cam, out);
  else roomSet(id, t, cam, out);
  void PIT;
  return out;
};
