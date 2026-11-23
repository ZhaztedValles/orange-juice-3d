// The cast and hand-drawn props of the fire-plate story: David Hartley (green coat, white wig), King George the Third
// (red coat, blue sash, a little crown) and Queen Charlotte (blue gown), the Lord Mayor (crimson, gold chain) and two
// aldermen, a Member of Parliament with a purse, a cook, the three American peace commissioners, Londoners and walkers
// on the heath. Every prop is an unlit ink-outlined drawing: the flames and smoke, the iron plate, the teapot and cups,
// the purse, the lit taper, the frying pan and its lid, the treaty and its seals, a quill. Cards that arrive mid-shot
// grow in, and cards that leave shrink away: nothing pops.
import { Pen, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, F1, HD, UF, TABLE_Y, TAB, FIRE, OB, PR, SHOTS, NEWS, WALK_Y, COOK, KING_AT, QUEEN_AT, MAYOR_UP, HART_DOWN, HART_DOOR, smooth, clamp01, V3,
  T_KING, T_BREAK, T_HARTLEY, T_PROUD, T_IRON, T_FEARED, T_PAID, T_WORKED, T_FIRES, T_MAYOR, T_WATCHED, T_SAT, T_ROARED, T_BLACK, T_EVERY, T_GIVE, T_NEVER,
  T_CLIMB, T_LID, T_SLAM, T_NOWHERE, T_FREEMAN, T_STONE, T_FORGOT, T_PEACE, T_SIGNED, T_PARIS, T_STOP,
} from "./story";

const Y = D0, WY = D0 + WALK_Y;
const WIG = "#efebe2";
const HARTLEY: Outfit = { jacket: "#3f6a52", pants: "#e2d6b8", boots: "#2a2220", hat: "hair", hair: "#b8b2a8", skin: SKINS[0], buttons: "#d9b44a" };
const KING: Outfit = { jacket: "#b0352f", pants: "#efe6d2", boots: "#2a2220", hat: "hair", hair: WIG, sash: "#2f5f9a", buttons: "#e0b84a", skin: SKINS[1], build: "stout" };
const QUEEN: Outfit = { jacket: "#7fa3c9", pants: "#5a6a8a", boots: "#4a3426", hat: "hair", hair: "#e8e2d6", dress: "#9ab8d8", skin: SKINS[0] };
const MAYOR: Outfit = { jacket: "#2c2a36", pants: "#2c2f3a", boots: "#2a2220", hat: "hair", hair: "#d8d0c4", sash: "#e0b84a", buttons: "#e0b84a", skin: SKINS[2], build: "stout" };
const ALDER: Outfit[] = [
  { jacket: "#6a4a6e", pants: "#2c2f3a", boots: "#2a2220", hat: "hair", hair: "#d8d4cc", skin: SKINS[0] },
  { jacket: "#5a4a3a", pants: "#2c2f3a", boots: "#2a2220", hat: "hair", hair: WIG, skin: SKINS[3], moustache: "#d8d4cc" },
];
const MP: Outfit = { jacket: "#3a3a52", pants: "#e2d6b8", boots: "#2a2220", hat: "hair", hair: WIG, skin: SKINS[1], buttons: "#c9c4b8" };
const COOKO: Outfit = { jacket: "#f4efe2", pants: "#6a5a4a", boots: "#3a2a20", hat: "cap", cap: "#ffffff", dress: "#d8cbb0", skin: SKINS[2] };
const FRANKLIN: Outfit = { jacket: "#7a5a3a", pants: "#7a5a3a", boots: "#2a2220", hat: "hair", hair: "#d8d4cc", skin: SKINS[0], build: "stout", buttons: "#c9a24a" };
const ADAMS: Outfit = { jacket: "#2c3a4e", pants: "#2c3a4e", boots: "#2a2220", hat: "hair", hair: WIG, skin: SKINS[1], build: "stout" };
const JAY: Outfit = { jacket: "#2e2a30", pants: "#2e2a30", boots: "#2a2220", hat: "hair", hair: "#e8e4dc", skin: SKINS[0] };
const FOLK: Outfit[] = [
  { jacket: "#6a4a6a", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#6b4a32", dress: "#c25a7a", skin: SKINS[0] },
  { jacket: "#4a5a3a", pants: "#d8cbb0", boots: "#2a2220", hat: "hair", hair: "#6b4a32", skin: SKINS[2] },
  { jacket: "#8a6a3e", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#4a4850", skin: SKINS[1] },
  { jacket: "#3f6fa0", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#3a2a20", dress: "#d9a441", skin: SKINS[3] },
  { jacket: "#5a3a2a", pants: "#d8cbb0", boots: "#2a2220", hat: "hair", hair: "#3a2a20", skin: SKINS[0], moustache: "#3a2a20" },
  { jacket: "#2f5a6a", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#a8743e", dress: "#5a8fc2", skin: SKINS[1] },
];

// ---------------- drawings ----------------
/** smooth flames (400 x 400): phase step n of FLN, tongues rise and sway continuously so no frame jumps */
const FLN = 24;
const drawFlames = (p: Pen, n: number) => {
  const ph = (n / FLN) * Math.PI * 2;
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
/** a puff of smoke (400 x 400), shade 0 light grey .. 2 dark */
const drawSmoke = (p: Pen, seed: number, shade: number) => {
  const c = ["#d9d2cc", "#a9a1a2", "#6f6870"][shade];
  const r = (k: number) => ((seed * 97 + k * 31) % 17) / 17;
  for (let i = 0; i < 6; i++) p.ell(110 + 180 * r(i), 120 + 160 * r(i + 9), 70 + 40 * r(i + 3), 60 + 30 * r(i + 5), c, 0);
  p.ell(200, 210, 130, 110, c, 0);
};
/** the iron plate (300 x 220): a thin dark sheet with rivet holes and a bright edge */
const drawPlate = (p: Pen) => {
  p.poly([[20, 40], [280, 16], [286, 190], [14, 204]], "#5d626b", 8);
  p.line([[26, 46], [276, 22]], "#9ea4ad", 6, false);
  for (const [x, y] of [[40, 60], [262, 40], [264, 172], [36, 186], [150, 30], [150, 192]]) p.dot(x, y, 6, "#2c2e33");
};
/** a teapot (220 x 180) */
const drawTeapot = (p: Pen) => {
  p.ell(110, 110, 70, 58, "#f6f2e8", 7);
  p.poly([[176, 100], [214, 62], [206, 56], [170, 86]], "#f6f2e8", 6);
  p.line([[44, 84], [16, 100], [44, 136]], "#f6f2e8", 9, false);
  p.ell(110, 52, 34, 12, "#f6f2e8", 6); p.dot(110, 38, 8, "#2f5f9a");
  p.line([[60, 110], [160, 110]], "#2f5f9a", 6, false);
};
/** a cup and saucer (160 x 110) */
const drawCup = (p: Pen) => {
  p.ell(80, 92, 70, 14, "#f6f2e8", 6);
  p.poly([[34, 30], [126, 30], [116, 86], [44, 86]], "#f6f2e8", 6);
  p.line([[126, 44], [148, 52], [122, 72]], "#f6f2e8", 6, false);
  p.line([[38, 50], [122, 50]], "#2f5f9a", 5, false);
};
/** a plate of toast (200 x 100) */
const drawToast = (p: Pen) => {
  p.ell(100, 70, 92, 24, "#f6f2e8", 6);
  p.poly([[50, 30], [110, 22], [116, 64], [56, 70]], "#d9a85a", 5);
  p.poly([[96, 36], [150, 30], [154, 66], [100, 70]], "#c8904a", 5);
};
/** a little gold crown (200 x 140) */
const drawCrown = (p: Pen) => {
  p.poly([[20, 120], [20, 40], [60, 80], [100, 20], [140, 80], [180, 40], [180, 120]], "#e8b84a", 8);
  p.dot(100, 96, 12, "#c0392b"); p.dot(50, 100, 8, "#2f5f9a"); p.dot(150, 100, 8, "#2f5f9a");
};
/** a purse of money (180 x 200) with coins */
const drawPurse = (p: Pen) => {
  p.poly([[60, 40], [120, 40], [168, 140], [140, 194], [40, 194], [12, 140]], "#8a5a3a", 8);
  p.line([[56, 52], [124, 52]], "#e0b84a", 8, false);
  for (const [x, y] of [[70, 120], [104, 140], [86, 168]]) p.ell(x, y, 18, 18, "#f0c050", 4);
};
/** a lit taper (80 x 260) */
const drawTaper = (p: Pen) => {
  p.line([[40, 250], [40, 70]], "#e8dcc0", 12);
  p.ell(40, 46, 16, 30, "#ffb340", 4); p.ell(40, 54, 7, 14, "#fff2b0", 0);
};
/** a frying pan seen from the front (360 x 120) */
const drawPan = (p: Pen) => {
  p.poly([[20, 30], [240, 30], [220, 96], [40, 96]], "#3a3a40", 8);
  p.line([[240, 50], [352, 30]], "#5a4030", 14);
  p.line([[30, 34], [230, 34]], "#7a7a84", 5, false);
};
/** a pan lid (300 x 130) with a knob */
const drawLid = (p: Pen) => {
  p.poly([[14, 112], [70, 44], [230, 44], [286, 112]], "#8d9099", 8);
  p.ell(150, 34, 26, 16, "#3a2a24", 6);
  p.line([[60, 92], [240, 92]], "#b9bcc4", 5, false);
};
/** the treaty (360 x 260): a sheet with lines of text and k seals (0..3) */
const drawTreaty = (p: Pen) => {
  p.poly([[14, 18], [346, 10], [350, 248], [10, 252]], "#f3ead2", 7);
  for (let y = 40; y < 190; y += 16) p.line([[40, y], [320, y]], "#8d8a86", 4, false);
  for (let i = 0; i < 4; i++) p.line([[40 + i * 74, 222], [96 + i * 74, 218]], "#3a3446", 4, false);
};
/** a red wax seal (100 x 100) */
const drawSeal = (p: Pen) => { p.ell(50, 50, 40, 38, "#b8302e", 6); p.ell(50, 50, 20, 18, "#d24a3e", 0); };
/** a quill (60 x 260) */
const drawQuill = (p: Pen) => {
  p.poly([[30, 250], [20, 120], [10, 40], [30, 8], [50, 40], [40, 120]], "#f6f2e8", 6);
  p.line([[30, 250], [30, 20]], "#b9ad92", 3, false);
};

/** the floor in section (840 x 200): upper boards, the thin iron plate (bright edge, rivets), lower boards, the joists
 *  with dark gaps between them, the ceiling boards: bands as thick as the real layers, the plate drawn a little thicker */
const drawLayers = (p: Pen) => {
  const band = (y0: number, y1: number, col: string, w = 5) => p.poly([[0, y0], [840, y0], [840, y1], [0, y1]], col, w);
  band(4, 30, "#c8945a"); for (let x = 60; x < 840; x += 140) p.line([[x, 6], [x, 28]], "#7d5234", 4, false);
  band(30, 56, "#6b7380", 6); p.line([[0, 34], [840, 34]], "#c9d0da", 6, false);
  for (let x = 40; x < 840; x += 100) p.dot(x, 46, 5, "#2c2e33");
  band(56, 80, "#b98a52"); for (let x = 120; x < 840; x += 160) p.line([[x, 58], [x, 78]], "#7d5234", 4, false);
  band(80, 166, "#3a2a24", 0);
  for (let x = 10; x < 840; x += 96) p.poly([[x, 80], [x + 34, 80], [x + 34, 166], [x, 166]], "#a8743e", 5);
  band(166, 196, "#d8c4a0");
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = Y, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
const seat = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, p: V3, expr: Expr, extra: FrontOpts = {}) =>
  front(cam, t, out, i, o, okey, p[0], p[2], expr, { mode: "sit", ...extra }, p[1], false);
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, phase: number, expr: Expr,
  so: SideOpts = {}, y = Y) => {
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "stroll", phase: q(phase % 1, 16), expr, blink: lidAt(t, i) }, { mode: "march", phase: q(phase % 1, 16), expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs) * 0.8, ...so }, 1));
  blob(out, x, y, z, 1);
};
/** before / after a word (2 frames early) */
const by = (t: number, t0: number) => t >= t0 - 0.07;
/** a card that grows in from t0 over d seconds */
const grow = (t: number, t0: number, d = 0.5) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
};
const burst = (out: Stage, p: V3, t: number, t0: number, size: number, col = "#fff3b0", d = 0.4) => {
  const u = (t - t0) / d;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 12), k = 1 - smooth((u - 0.6) / 0.4);
  out.fx.push({ key: `burst${uq}${col}`, cw: 500, ch: 500, draw: (pn) => fxBurst(pn, uq, col), x: p[0], y: p[1], z: p[2], w: size * k, h: size * k });
};
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);
const flk = (t: number, off = 0) => (Math.round(t * 30) + off) % FLN;
/** flames standing on p (base), w x h */
const flames = (out: Stage, p: V3, t: number, w: number, h: number, off = 0) => {
  const n = flk(t, off);
  card(out, `flames${n}`, 400, 400, (pn) => drawFlames(pn, n), p[0], p[1] + h / 2, p[2], w, h);
};
/** smoke puffs rising from p and spreading along the ceiling (soft, grow in and shrink away) */
const smoke = (out: Stage, p: V3, t: number, n: number, rise: number, size: number, shade: number) => {
  for (let i = 0; i < n; i++) {
    const u = (t * 0.35 + i / n) % 1, s = size * (0.3 + 0.7 * Math.sqrt(u)) * smooth(u / 0.12) * (1 - smooth((u - 0.75) / 0.25));
    if (s < 0.04) continue;
    const sp = (i % 2 ? 1 : -1) * 2.2 * u * u;
    card(out, `smoke${i % 4}_${shade}`, 400, 400, (pn) => drawSmoke(pn, i % 4, shade), p[0] + sp, p[1] + rise * Math.sqrt(u), p[2] + 0.1 * i, s, s * 0.8, true);
  }
};

/** how big the fire in the fire room is, shot id at t (0 out .. 1.3 roaring); world.ts sizes the glow from it too */
export const fireAt = (id: number, t: number) => {
  if (id === 2 || id === 9) return 1.15;
  if (id === 7) return 0.9 * smooth((t - T_FIRES + 0.07) / 0.9);
  if (id === 8) return 0.95 + 0.35 * smooth((t - T_ROARED + 0.07) / 0.3);
  return 0;
};
/** the painted cut face of the floor between the rooms (unlit, so the layers always read) */
const layers = (out: Stage) => card(out, "layers", 840, 200, drawLayers, 1.0, (F1 + UF) / 2, HD + 0.035, 1.68, UF - F1);
const roomFire = (id: number, t: number, out: Stage) => {
  const k = fireAt(id, t);
  if (k < 0.02) return;
  flames(out, [FIRE[0] - 0.25, Y + 0.24, FIRE[2] + 0.1], t, 1.2 * k, 1.7 * k, 0);
  flames(out, [FIRE[0] + 0.3, Y + 0.24, FIRE[2] + 0.25], t, 0.9 * k, 1.3 * k, 9);
  if (k > 0.6) smoke(out, [FIRE[0], Y + 1.4 * k, FIRE[2] - 0.2], t, 4, F1 - Y - 1.6 * k, 0.9 * k, 1);
};
/** the breakfast things on the table */
const breakfast = (out: Stage) => {
  card(out, "teapot", 220, 180, drawTeapot, TAB[0] - 0.05, TABLE_Y + 0.13, TAB[2] + 0.05, 0.3, 0.25);
  card(out, "cup", 160, 110, drawCup, TAB[0] - 0.65, TABLE_Y + 0.05, TAB[2] + 0.12, 0.16, 0.11);
  card(out, "cup", 160, 110, drawCup, TAB[0] + 0.6, TABLE_Y + 0.05, TAB[2] + 0.12, 0.16, 0.11);
  card(out, "toast", 200, 100, drawToast, TAB[0] + 0.25, TABLE_Y + 0.04, TAB[2] + 0.2, 0.26, 0.13);
};
const royals = (cam: CamInfo, t: number, out: Stage, ke: Expr, qe: Expr, ko: FrontOpts = {}, qo: FrontOpts = {}) => {
  seat(cam, t, out, 1, KING, "king", KING_AT, ke, { facing: 1, ...ko });
  seat(cam, t, out, 2, QUEEN, "queen", QUEEN_AT, qe, { facing: -1, ...qo });
  card(out, "crown", 200, 140, drawCrown, KING_AT[0], KING_AT[1] + 1.2, KING_AT[2] + 0.05, 0.2, 0.14);
  breakfast(out);
};

// ---------------- the places ----------------
const cutSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  roomFire(id, t, out);
  if (id === 1) {
    const b = by(t, T_BREAK);
    royals(cam, t, out, b ? "grin" : by(t, T_KING) ? "smile" : "smile_closed", b ? "laugh" : "smile", { wave: b ? 0.5 : 0 });
  } else if (id === 2) {
    royals(cam, t, out, "smile", "smile_closed");
    front(cam, t, out, 3, HARTLEY, "hart", HART_DOWN[0], HART_DOWN[2], "grin", { facing: -1 });
  } else if (id === 5) {
    layers(out);
    burst(out, [1.1, F1 + 0.32, HD + 0.03], t, T_IRON - 0.05, 0.3, "#e8eef8");
  } else if (id === 7) {
    const lit = by(t, T_FIRES);
    front(cam, t, out, 3, HARTLEY, "hart", HART_DOWN[0], HART_DOWN[2], lit ? "grin" : "stern", { facing: -1, wave: 0.6 });
    card(out, "taper", 80, 260, drawTaper, HART_DOWN[0] - 0.4, Y + 1.3, HART_DOWN[2] + 0.1, 0.07, 0.24);
    const w = by(t, T_WATCHED);
    front(cam, t, out, 4, MAYOR, "mayor", MAYOR_UP[0], MAYOR_UP[2], w ? "nervous" : by(t, T_MAYOR) ? "neutral" : "smile_closed", { headTilt: w ? -8 : 0 }, UF);
    front(cam, t, out, 5, ALDER[0], "al0", MAYOR_UP[0] - 1.2, MAYOR_UP[2] - 0.5, w ? "shock" : "neutral", {}, UF);
    front(cam, t, out, 6, ALDER[1], "al1", MAYOR_UP[0] + 1.1, MAYOR_UP[2] - 0.4, w ? "nervous" : "smile", {}, UF);
  } else if (id === 8) {
    const roar = by(t, T_ROARED), sat = by(t, T_SAT);
    royals(cam, t, out, roar ? "nervous" : sat ? "smile" : "smile_closed", roar ? "shock" : "smile");
    front(cam, t, out, 4, MAYOR, "mayor", MAYOR_UP[0] + 0.4, MAYOR_UP[2], roar ? "nervous" : "smile", {}, UF);
    front(cam, t, out, 3, HARTLEY, "hart", HART_DOWN[0] + 0.6, HART_DOWN[2] + 0.4, roar ? "grin" : "smile", { facing: -1, wave: roar ? 0.7 : 0 });
  } else if (id === 9) {
    if (t * 30 < Math.round(T_EVERY * 30) - 2 - 0.5) {
      // below: the ceiling going black over the flames (world.ts chars it)
      void T_BLACK;
    } else {
      const nv = by(t, T_NEVER), give = by(t, T_GIVE);
      royals(cam, t, out, nv ? "laugh" : give ? "pained" : "nervous", nv ? "relief_open" : give ? "shock" : "nervous", { tilt: nv ? 0 : -3 }, { headTilt: nv ? 0 : 6 });
      front(cam, t, out, 4, MAYOR, "mayor", MAYOR_UP[0] - 0.1, MAYOR_UP[2] - 0.2, nv ? "relief" : "nervous", { wave: nv ? 0.6 : 0 }, UF);
    }
  } else if (id === 10) {
    // flames pressing up under the cut edge of the floor, smoke spreading flat under it: nothing gets through
    const c = by(t, T_CLIMB);
    layers(out);
    flames(out, [0.4, F1 - 1.2, HD - 0.15], t, 0.8, 1.2, 3);
    flames(out, [1.3, F1 - 1.25, HD - 0.2], t, 0.9, 1.25, 11);
    smoke(out, [0.9, F1 - 0.25, HD - 0.4], t, 3, 0.05, 0.5, 1);
    if (c) burst(out, [1.0, F1 + 0.32, HD + 0.03], t, T_CLIMB - 0.05, 0.35, "#e8eef8");
  }
};

const heathSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 3) {
    const t0 = SHOTS[2].a / 30, z = 15 - 1.1 * (t - t0);
    walker(cam, t, out, 1, HARTLEY, "hart", 2.0, z - 3.0, 0, -1, t * 1.9, by(t, T_HARTLEY) ? "grin" : "smile");
    walker(cam, t, out, 2, FOLK[0], "f0", -7 + 0.8 * (t - t0), 11, 1, 0, t * 1.7 + 0.3, "smile");
    walker(cam, t, out, 3, FOLK[4], "f4", -8 + 0.8 * (t - t0), 11.6, 1, 0, t * 1.7, "smile");
  } else if (id === 4) {
    const pr = by(t, T_PROUD);
    front(cam, t, out, 1, HARTLEY, "hart", HART_DOOR[0], HART_DOOR[2], pr ? "grin" : "smile", { wave: 0.55, facing: 1 });
    card(out, "plate", 300, 220, drawPlate, HART_DOOR[0] + 0.45, Y + 1.25, HART_DOOR[2] + 0.2, 0.55, 0.4);
    if (pr) burst(out, [HART_DOOR[0] + 0.6, Y + 1.4, HART_DOOR[2] + 0.25], t, T_PROUD - 0.05, 0.4, "#e8eef8");
  } else if (id === 12) {
    const fm = by(t, T_FREEMAN), st = by(t, T_STONE);
    front(cam, t, out, 1, HARTLEY, "hart", OB[0] - 2.4, OB[2] + 1.2, fm ? "laugh" : "grin", { facing: 1 });
    front(cam, t, out, 4, MAYOR, "mayor", OB[0] - 1.2, OB[2] + 1.6, fm ? "grin" : "smile", { facing: -1, wave: fm ? 0.6 : 0 });
    front(cam, t, out, 5, ALDER[0], "al0", OB[0] + 1.4, OB[2] + 1.5, "smile", { wave: fm ? wave(t, 0) : 0 });
    front(cam, t, out, 6, ALDER[1], "al1", OB[0] + 2.4, OB[2] + 0.9, "smile", { wave: fm ? wave(t, 1.3) : 0 });
    FOLK.slice(0, 4).forEach((o, j) => front(cam, t, out, 7 + j, o, `f${j}`, OB[0] - 4.0 + j * 1.3, OB[2] - 1.6 - (j % 2) * 0.6, fm ? "grin" : "smile", { wave: fm ? wave(t, j) : 0 }));
    if (st) burst(out, [OB[0], Y + 1.0, OB[2] + 1.05], t, T_STONE - 0.05, 0.9);
  } else if (id === 13) {
    const t0 = SHOTS[12].a / 30;
    walker(cam, t, out, 1, FOLK[5], "f5", OB[0] - 6 + 0.9 * (t - t0), OB[2] + 3.2, 1, 0, t * 1.7, "smile");
    walker(cam, t, out, 2, FOLK[1], "f1", OB[0] - 7 + 0.9 * (t - t0), OB[2] + 3.6, 1, 0, t * 1.7 + 0.4, by(t, T_FORGOT) ? "neutral" : "smile");
  } else if (id === 15) {
    const s = by(t, T_STOP);
    front(cam, t, out, 1, HARTLEY, "hart", OB[0] + 1.0, OB[2] + 3.0, s ? "laugh" : "smile", { facing: -1, wave: s ? 0.6 : 0 });
  }
};

const streetSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const [nx, , nz] = NEWS, paid = by(t, T_PAID), fe = by(t, T_FEARED);
  front(cam, t, out, 1, HARTLEY, "hart", nx, nz, paid ? "laugh" : "smile", { facing: 1, wave: paid ? 0.6 : 0 }, WY);
  front(cam, t, out, 2, MP, "mp", nx + 1.2, nz - 0.2, paid ? "smile" : "stern", { facing: -1, wave: 0.5 }, WY);
  // the purse moves from the member's hand to Hartley's
  const u = smooth((t - T_PAID + 0.2) / 0.5);
  card(out, "purse", 180, 200, drawPurse, nx + 0.9 - 0.55 * u, WY + 1.0 + 0.15 * Math.sin(u * Math.PI), nz + 0.25, 0.28, 0.31);
  front(cam, t, out, 3, FOLK[3], "f3", nx - 1.6, nz - 0.8, fe ? "nervous" : "smile", {}, WY);
  front(cam, t, out, 4, FOLK[1], "f1", nx + 2.8, nz - 0.6, fe ? "nervous" : "neutral", {}, WY);
  for (let j = 0; j < 4; j++) walker(cam, t, out, 5 + j, FOLK[(j + 2) % 6], `p${j}`, nx - 10 + j * 6 + 1.0 * (t - 15.5) * (j % 2 ? 1 : -1), j % 2 ? -5.4 : 6.4, j % 2 ? 1 : -1, 0, t * 1.5 + j * 0.3, "smile", {}, WY);
  void T_WORKED;
};

const kitchenSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const [cx, , cz] = COOK, slam = by(t, T_SLAM), lid = by(t, T_LID);
  const pan: V3 = [cx - 0.45, Y + 1.03, cz - 0.6];
  front(cam, t, out, 1, COOKO, "cook", cx + 0.35, cz, slam ? (by(t, T_NOWHERE) ? "laugh" : "grin") : lid ? "stern" : "shock", { facing: -1, wave: slam ? 0.2 : 0.75 });
  card(out, "pan", 360, 120, drawPan, pan[0] + 0.12, pan[1] + 0.05, pan[2], 0.5, 0.17);
  // flames out of the pan until the lid lands, then they shrink away under it; a last wisp escapes
  const k = 1 - smooth((t - T_SLAM + 0.07) / 0.2);
  if (k > 0.02) flames(out, [pan[0], pan[1] + 0.08, pan[2] + 0.02], t, 0.45 * k, 0.7 * k, 5);
  const u = smooth((t - T_LID + 0.1) / Math.max(0.1, T_SLAM - T_LID));
  card(out, "lid", 300, 130, drawLid, pan[0] + 0.4 * (1 - u), pan[1] + 0.12 + 0.75 * (1 - u), pan[2] + 0.05, 0.42, 0.18);
  if (slam) {
    burst(out, [pan[0], pan[1] + 0.2, pan[2] + 0.06], t, T_SLAM - 0.07, 0.5);
    const w = (t - T_SLAM) / 1.4;
    if (w > 0 && w < 1) card(out, "smoke2_0", 400, 400, (pn) => drawSmoke(pn, 2, 0), pan[0] + 0.1 * w, pan[1] + 0.3 + 0.5 * w, pan[2], 0.3 * smooth(w / 0.15) * (1 - smooth((w - 0.6) / 0.4)), 0.24, true);
  }
};

const parisSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const [px, , pz] = PR, sg = by(t, T_SIGNED), pa = by(t, T_PARIS);
  front(cam, t, out, 1, HARTLEY, "hart", px - 0.75, pz - 1.95, sg ? "grin" : "smile_closed", { facing: 1, wave: sg ? 0 : 0.5 });
  front(cam, t, out, 2, FRANKLIN, "franklin", px + 0.15, pz - 2.05, sg ? "laugh" : by(t, T_PEACE) ? "smile" : "smile_closed", {});
  front(cam, t, out, 3, ADAMS, "adams", px + 0.95, pz - 1.95, sg ? "grin" : "stern", { facing: -1 });
  front(cam, t, out, 4, JAY, "jay", px + 1.75, pz - 1.3, pa ? "smile" : "neutral", { facing: -1 });
  card(out, "treaty", 360, 260, drawTreaty, px - 0.1, Y + 0.98, pz - 0.95, 0.5, 0.36);
  card(out, "quill", 60, 260, drawQuill, px - 0.4 + 0.15 * clamp01((t - T_SIGNED + 0.6) / 0.6), Y + 1.12, pz - 0.85, 0.05, 0.2);
  for (let i = 0; i < 3; i++) { const g = grow(t, T_SIGNED + 0.25 * i, 0.35); card(out, "seal", 100, 100, drawSeal, px - 0.25 + i * 0.13, Y + 0.86, pz - 0.9, 0.07 * g, 0.07 * g); }
  if (sg) burst(out, [px - 0.05, Y + 1.15, pz - 0.85], t, T_SIGNED - 0.05, 0.6);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "cut") cutSet(id, t, cam, out);
  else if (s.scene === "heath") heathSet(id, t, cam, out);
  else if (s.scene === "street") streetSet(id, t, cam, out);
  else if (s.scene === "kitchen") kitchenSet(id, t, cam, out);
  else parisSet(id, t, cam, out);
  return out;
};
