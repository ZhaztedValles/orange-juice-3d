// The cast and hand-drawn props of the pond story: Benjamin Franklin (grey hair, brown coat), the ship's captain,
// onlookers on the common, Londoners in the street, Lord Rayleigh at his tray; the cruet and its trickle of oil, the
// kite, the bamboo cane, the tablecloth that wrinkles under a dragging hand, butter thinning on toast, the magnifier
// that shows one layer of molecules, and Franklin's unfinished sum. Every prop is an unlit ink-outlined drawing.
import { Pen, townsfolk, SKINS, Outfit, Expr, FrontOpts } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import { D0, SHOTS, LON, TAB, TABLE_Y, SEA_Y, EAST, WEST, T_POUR_W, T_BACK, T_POUR_E, shipAt, franklinAt, smooth, clamp01 } from "./story";

export const FRANKLIN: Outfit = { jacket: "#7a5234", pants: "#4a3a30", boots: "#2b2220", hat: "hair", hair: "#d2cabd", build: "stout", buttons: "#d9b45a", skin: SKINS[0] };
const CAPTAIN: Outfit = { jacket: "#2f3b5a", pants: "#e9e1cf", boots: "#2b2220", hat: "tophat", buttons: "#e8c45a", moustache: "#5a4636", skin: SKINS[1] };
const RAYLEIGH: Outfit = { jacket: "#34313c", pants: "#3b3f52", boots: "#2b2220", hat: "hair", hair: "#6b4a32", moustache: "#5a3b2a", skin: SKINS[0] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const LEAD = 2 / 30;
const INKC = "#241726";

// ---------------- drawings ----------------
/** a glass cruet of oil (120 x 200); tilt in radians */
const drawCruet = (p: Pen, tilt: number) => {
  p.rot = [tilt, 60, 120];
  p.poly([[34, 190], [86, 190], [92, 120], [70, 82], [70, 40], [50, 40], [50, 82], [28, 120]], "#cfe3e6", 7);
  p.poly([[37, 186], [83, 186], [88, 130], [32, 130]], "#e6c25a", 0);
  p.poly([[46, 40], [74, 40], [76, 22], [44, 22]], "#7a5234", 6);
  p.rot = null;
};
/** a thin trickle of oil and two drops (80 x 220): u 0..1 how far it has run */
const drawTrickle = (p: Pen, u: number) => {
  p.line([[40, 10], [42, 10 + 150 * u]], "#e6c25a", 7, false);
  if (u > 0.6) p.ell(44, 190, 9, 12, "#e6c25a", 4);
};
/** Franklin's kite with its tail, and a small spark (260 x 300) */
const drawKite = (p: Pen) => {
  p.poly([[130, 20], [220, 110], [130, 210], [40, 110]], "#f1e8d2", 8);
  p.stroke([[130, 20], [130, 210]], 4, INKC); p.stroke([[40, 110], [220, 110]], 4, INKC);
  p.stroke([[130, 210], [150, 240], [118, 262], [140, 292]], 4, INKC);
  for (const [x, y] of [[150, 240], [118, 262]] as const) p.poly([[x - 9, y - 6], [x + 9, y - 6], [x, y + 8]], "#c0353a", 3);
  p.poly([[226, 26], [208, 62], [222, 62], [204, 100], [244, 52], [228, 52], [242, 26]], "#ffd25a", 5);
};
/** the bamboo cane (60 x 500); the hollow top joint is a little darker */
const drawCane = (p: Pen) => {
  p.line([[30, 20], [30, 490]], "#d9b86a", 16);
  for (const y of [120, 240, 360]) p.stroke([[20, y], [40, y]], 5, "#8a6a3a");
  p.ell(30, 22, 10, 6, "#5a3b2a", 4);
};
/** a thought bubble (400 x 360) with a puzzle: a teaspoon, a divide sign, an acre square, and a question mark */
const drawSum = (p: Pen) => {
  p.ell(200, 150, 170, 112, "#fbf7ee", 9); p.ell(150, 292, 24, 18, "#fbf7ee", 6); p.ell(120, 336, 14, 11, "#fbf7ee", 5);
  p.ell(85, 150, 26, 18, "#c9ccd2", 6); p.line([[108, 150], [150, 150]], "#c9ccd2", 10);
  p.ell(85, 150, 16, 10, "#e6c25a", 0);
  p.stroke([[168, 150], [200, 150]], 8, INKC); p.ell(184, 134, 5, 5, INKC, 0); p.ell(184, 166, 5, 5, INKC, 0);
  p.poly([[214, 118], [276, 118], [276, 180], [214, 180]], "#9ccfd8", 7);
  p.stroke([[292, 140], [316, 140]], 8, INKC); p.stroke([[292, 160], [316, 160]], 8, INKC);
  p.arc(342, 128, 16, 16, -200, 60, 8, INKC); p.stroke([[350, 142], [342, 162]], 8, INKC); p.ell(342, 182, 5, 5, INKC, 0);
};
/** the tablecloth from above (600 x 360): wr = wrinkles 0..1, slick = an oily sheen 0..1, hx = hand position 0..1 */
const drawCloth = (p: Pen, wr: number, slick: number) => {
  p.poly([[20, 20], [580, 20], [580, 340], [20, 340]], "#f2eadb", 8);
  for (let x = 60; x < 580; x += 80) p.stroke([[x, 22], [x, 338]], 6, "#d7c7a6");
  for (let y = 60; y < 340; y += 80) p.stroke([[22, y], [578, y]], 6, "#d7c7a6");
  if (slick > 0) p.ell(300, 180, 230 * slick + 10, 120 * slick + 6, "rgba(232,205,110,0.35)", 0);
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 62, a = 22 * wr * (1 - i * 0.12);
    if (a > 0.8) p.stroke([[x, 40], [x + a, 110], [x - a, 180], [x + a, 250], [x, 320]], 6 + 4 * wr, "rgba(120,100,80,0.75)");
  }
};
/** a hand seen from above, fingers pointing left (200 x 160) */
const drawHand = (p: Pen) => {
  p.poly([[60, 40], [170, 46], [190, 80], [170, 116], [60, 120], [40, 80]], SKINS[0], 7);
  for (const y of [52, 72, 92, 112]) p.line([[62, y], [14, y + 2]], SKINS[0], 15);
  p.line([[120, 120], [96, 150]], SKINS[0], 15);
  p.poly([[166, 40], [200, 40], [200, 124], [166, 124]], "#7a5234", 6);
};
/** toast from above with butter (360 x 360): u = how far the butter has spread 0..1 (and how thin) */
const drawToast = (p: Pen, u: number) => {
  p.poly([[40, 70], [70, 30], [130, 22], [180, 40], [240, 22], [300, 32], [326, 70], [320, 330], [40, 330]], "#c98a44", 9);
  p.poly([[62, 82], [86, 52], [130, 44], [180, 62], [240, 44], [290, 54], [306, 84], [302, 312], [58, 312]], "#efc982", 0);
  const r = 34 + 110 * u, a = 1 - 0.6 * u;
  p.ell(180, 190, r * 1.05, r * 0.9, `rgba(255,226,120,${a.toFixed(2)})`, u < 0.4 ? 5 : 0);
  if (u < 0.3) p.poly([[150, 160], [210, 160], [214, 214], [146, 214]], "#ffe27a", 6);
};
/** a butter knife (420 x 100) */
const drawKnife = (p: Pen) => {
  p.poly([[20, 40], [250, 34], [262, 50], [250, 66], [20, 60]], "#d9dde4", 6);
  p.poly([[250, 38], [410, 36], [410, 64], [250, 62]], "#6b4a32", 6);
};
/** the magnifier (520 x 520): a lens showing one row of oil molecules lying on the water */
const drawLens = (p: Pen) => {
  p.line([[400, 400], [500, 500]], "#6b4a32", 34);
  p.ell(240, 240, 220, 220, "#bfe4f0", 14);
  p.poly([[40, 300], [440, 300], [430, 380], [50, 380]], "#3f86c6", 0);
  for (let i = 0; i < 9; i++) {
    const x = 70 + i * 42;
    p.line([[x, 300], [x, 236]], "#f0c24e", 18);
    p.ell(x, 300, 14, 12, "#e08a3a", 4);
  }
  p.ell(240, 240, 220, 220, null, 14);
};
/** Rayleigh's tray from above (600 x 400) with a measured film (u 0..1) and a ruler */
const drawTray = (p: Pen, u: number) => {
  p.poly([[20, 30], [580, 30], [580, 300], [20, 300]], "#9aa0a8", 9);
  p.poly([[44, 52], [556, 52], [556, 278], [44, 278]], "#4f9ad0", 0);
  if (u > 0) p.ell(300, 165, 30 + 170 * u, 22 + 90 * u, "rgba(240,215,120,0.55)", 0);
  p.poly([[40, 330], [560, 330], [560, 380], [40, 380]], "#e9d9a8", 6);
  for (let x = 60; x < 560; x += 25) p.stroke([[x, 330], [x, x % 100 === 60 ? 362 : 350]], 3, INKC);
};

// ---------------- staging ----------------
const personAt = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, sc = 1, extra: FrontOpts = {}) => {
  out.places.push(person(cam, { i, o, okey } as Who, x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, sc));
  blob(out, x, y, z, sc);
};
/** a world point beside a character's hand (camera-facing cards) */
const hand = (cam: CamInfo, x: number, y: number, z: number, side: number, dy: number, push = 0.1): [number, number, number] => {
  const r = cam.right, dx = cam.pos.x - x, dz = cam.pos.z - z, n = Math.hypot(dx, dz) || 1;
  return [x + r.x * side + (dx / n) * push, y + dy, z + r.z * side + (dz / n) * push];
};

const franklin = (id: number, t: number, cam: CamInfo, out: Stage, expr: Expr, y = D0) => {
  const [x, z, ph] = franklinAt(id, t);
  personAt(cam, t, out, 1, FRANKLIN, "ben", x, y, z, expr, 1, ph >= 0 ? { mode: "stroll", phase: q(ph, 24) } : {});
  return [x, z] as const;
};
/** the cruet in Franklin's hand; pouring between t0 and t1 tips it and runs a trickle down to the water */
const cruet = (cam: CamInfo, t: number, out: Stage, x: number, z: number, t0 = 1e9, t1 = 1e9) => {
  const tip = smooth((t - t0 + 0.25) / 0.3) * (1 - smooth((t - t1) / 0.3));
  const tq = q(tip, 24);
  const [hx, hy, hz] = hand(cam, x, D0, z, 0.3, 0.8 + 0.1 * tq);
  out.fx.push({ key: `cruet${tq}`, cw: 120, ch: 200, draw: (p) => drawCruet(p, -1.6 * tq), x: hx, y: hy, z: hz, w: 0.13, h: 0.22 });
  if (tq > 0.6) {
    const u = q(clamp01((t - t0) / 0.3), 12);
    out.fx.push({ key: `trickle${u}`, cw: 80, ch: 220, draw: (p) => drawTrickle(p, u), x: hx - cam.right.x * 0.1, y: hy - 0.62, z: hz - cam.right.z * 0.1, w: 0.12, h: 1.1 });
  }
};
const watchers = (t: number, cam: CamInfo, out: Stage, calm: boolean) => {
  personAt(cam, t, out, 20, FOLK[1], "f1", EAST[0] + 3.4, D0, EAST[2] + 6.0, calm ? "laugh" : "smile");
  personAt(cam, t, out, 21, FOLK[4], "f4", EAST[0] + 4.6, D0, EAST[2] - 6.6, calm ? "shock" : "neutral");
};

const pondSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 1) {
    const [x, z] = franklin(id, t, cam, out, t < 3.6 ? "smile" : "grin");
    cruet(cam, t, out, x, z, 2.6, 3.6);
    watchers(t, cam, out, t > 4.2);
  } else if (id === 4) {
    const [x, z] = franklin(id, t, cam, out, "smile");
    cruet(cam, t, out, x, z);
  } else if (id === 5) {
    const ex: Expr = t < T_POUR_W ? "smile" : t < 24.9 - LEAD ? "neutral" : "nervous";
    const [x, z] = franklin(id, t, cam, out, ex);
    cruet(cam, t, out, x, z, T_POUR_W, T_POUR_W + 0.7);
    void T_BACK; void WEST;
  } else if (id === 6) {
    const [x, z] = franklin(id, t, cam, out, t < T_POUR_E ? "stern" : "smile");
    cruet(cam, t, out, x, z, T_POUR_E - 0.1, T_POUR_E + 0.5);
    watchers(t, cam, out, false);
  } else if (id === 7) {
    franklin(id, t, cam, out, t < 31.0 ? "grin" : "laugh");
    watchers(t, cam, out, t > 31.6);
  } else if (id === 8) {
    franklin(id, t, cam, out, t < 35.6 ? "nervous" : "dazed");
  } else if (id === 11) {
    const [x, z] = franklin(id, t, cam, out, t < 51.5 - LEAD ? "smile" : "grin");
    const tip = q(smooth((t - 51.4) / 0.4), 16);
    const [hx, hy, hz] = hand(cam, x, D0, z, 0.32, 0.5);
    out.fx.push({ key: `cane`, cw: 60, ch: 500, draw: drawCane, x: hx, y: hy, z: hz, w: 0.07, h: 1.1, rot: -0.15 - 0.5 * tip });
  } else if (id === 13) {
    const [x, z] = franklin(id, t, cam, out, t < 61.8 - LEAD ? "smile" : "whistle");
    if (t >= 1804 / 30) out.fx.push({ key: "sum", cw: 400, ch: 360, draw: drawSum, x: x - cam.right.x * 0.9, y: D0 + 2.75, z: z - cam.right.z * 0.9, w: 1.5, h: 1.35 });
    watchers(t, cam, out, true);
  }
};

const londonSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  franklin(id, t, cam, out, t < 8.9 ? "smile" : "grin");
  out.fx.push({ key: "kite", cw: 260, ch: 300, draw: drawKite, x: LON[0] + 4, y: D0 + 12.5, z: LON[2] - 1.5, w: 2.2, h: 2.5 });
  for (let i = 0; i < 4; i++) {
    const dir = i % 2 ? -1 : 1, x = LON[0] + 2 + i * 6 + dir * 1.3 * (t - 5.8), z = LON[2] + (i % 2 ? 2.8 : -2.6);
    personAt(cam, t, out, 30 + i, FOLK[(i + 2) % 6], `l${i}`, x, D0, z, i % 2 ? "neutral" : "smile", 1, { mode: "stroll", phase: q((t * 1.6 + i * 0.3) % 1, 24) });
  }
};

const seaSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (Math.round(t * 30) < 442) return;
  const [x, z] = shipAt(2, t), dy = SEA_Y + 5.55;
  personAt(cam, t, out, 1, FRANKLIN, "ben", x - 0.8, dy, z + 0.4, t < 15.0 ? "neutral" : "shock");
  personAt(cam, t, out, 40, CAPTAIN, "cap", x + 1.2, dy, z - 0.2, t < 15.4 ? "smile" : "grin");
};

const tableSet = (id: number, t: number, cam: CamInfo, out: Stage, f: number) => {
  const top = TABLE_Y + 0.004;
  if (id === 9) {
    const drag = smooth((t - (40.65 - LEAD)) / 0.9), slick = smooth((t - (41.5 - LEAD)) / 0.8);
    const wr = q(drag * (1 - slick), 30), sk = q(slick, 30);
    out.fx.push({ key: `cloth${wr}_${sk}`, cw: 600, ch: 360, draw: (p) => drawCloth(p, wr, sk), x: TAB[0], y: top, z: TAB[2], w: 1.62, h: 0.97, flat: true });
    const hx = TAB[0] + 0.32 - 0.34 * drag - 0.3 * slick + 0.05 * Math.sin(t * 2);
    out.fx.push({ key: "hand", cw: 200, ch: 160, draw: drawHand, x: hx, y: top + 0.03, z: TAB[2] + 0.05, w: 0.36, h: 0.29, flat: true });
  } else if (id === 10) {
    const u = q(smooth((t - (44.15 - LEAD)) / 2.7), 60);
    out.fx.push({ key: `toast${u}`, cw: 360, ch: 360, draw: (p) => drawToast(p, u), x: TAB[0] + 0.05, y: top + 0.01, z: TAB[2], w: 0.5, h: 0.5, flat: true });
    out.fx.push({ key: "knife", cw: 420, ch: 100, draw: drawKnife, x: TAB[0] + 0.25 - 0.25 * u, y: top + 0.03, z: TAB[2] + 0.15 + 0.06 * Math.sin(t * 3), w: 0.42, h: 0.1, flat: true, rot: 0.3 });
    if (f >= 1416) out.fx.push({ key: "lens", cw: 520, ch: 520, draw: drawLens, x: TAB[0] + 0.05, y: TABLE_Y + 0.2, z: TAB[2], w: 0.3, h: 0.3 });
  } else if (id === 12) {
    personAt(cam, t, out, 50, RAYLEIGH, "ray", TAB[0] - 0.1, D0, TAB[2] - 0.95, t < 55.1 ? "neutral" : "smile");
    const u = q(smooth((t - (54.5 - LEAD)) / 2.0), 60);
    out.fx.push({ key: `tray${u}`, cw: 600, ch: 400, draw: (p) => drawTray(p, u), x: TAB[0], y: top + 0.02, z: TAB[2] + 0.05, w: 1.2, h: 0.8, flat: true });
    if (f >= 1740) out.fx.push({ key: "lens", cw: 520, ch: 520, draw: drawLens, x: TAB[0] + 0.05, y: TABLE_Y + 0.2, z: TAB[2], w: 0.3, h: 0.3 });
  }
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  const f = Math.round(t * 30);
  if (s.scene === "london") londonSet(id, t, cam, out);
  else if (s.scene === "sea") seaSet(id, t, cam, out);
  else if (s.scene === "table") tableSet(id, t, cam, out, f);
  else pondSet(id, t, cam, out);
  return out;
};
