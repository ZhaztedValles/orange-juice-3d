// The cast and hand-drawn props of the snow-race story: Frank Duryea (dark coat, brown cap), Oscar Mueller (green coat,
// top hat), Charles King the umpire (tan coat, navy cap), the other drivers and umpires, the newsboy, the clerk and the
// queue of inventors, the starter with his flag, the tram driver and his two horses, the blacksmith and his hammer,
// the woman with the soup, the family at the turkey, the Chicago crowds. Every prop is an unlit ink-outlined drawing:
// snowflakes, wind streaks, exhaust puffs, sparks, the newspaper, the soup bowl and its steam, the turkey, the flag.
// People in the carriages sit on the benches (seatAt in story.ts); cards that arrive mid-shot grow in, never pop.
import { Pen, townsfolk, KID, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxPuff, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, WALK_Y, SMITH, PX, RX, ROOM, NEWS, DESK, RAIL_Z, LANE_Z, cars, seatAt, tramAt, CarPose, V3, smooth, clamp01,
  T_PASSED, T_THANKS, T_DOLLARS, T_UMPIRE, T_SIGN, T_SIX, T_TRAM, T_GIVE, T_SNAPS, T_FALLS, T_WIND, T_EYES, T_CLOSE, T_MAN,
  T_BLOW, T_ICY, T_WINS, T_ROLLS, T_KING, T_TURKEY, T_UMP2, benzRoadX,
} from "./story";

const Y = D0, WY = D0 + WALK_Y;
const DURYEA: Outfit = { jacket: "#3a3446", pants: "#2c2f3a", boots: "#2a2220", hat: "cap", cap: "#6b4a32", skin: SKINS[0], moustache: "#5a3b2a", buttons: "#c9a24a" };
const MUELLER: Outfit = { jacket: "#4f6e3a", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[1], moustache: "#3a2a20", buttons: "#d9b45a" };
const KING: Outfit = { jacket: "#b5813f", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#2f3f6a", skin: SKINS[2], buttons: "#2f2d33" };
const WHITE: Outfit = { jacket: "#6f7484", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[3], buttons: "#d9dde0" };
const DRIVERS: Outfit[] = [
  { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[0], moustache: "#4a3426" },
  { jacket: "#2f5f6a", pants: "#3b3f52", boots: "#2a2220", hat: "cap", cap: "#8a6a3e", skin: SKINS[1] },
  { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[2], moustache: "#2a201a" },
  { jacket: "#b5653f", pants: "#3b3f52", boots: "#2a2220", hat: "cap", cap: "#3a3446", skin: SKINS[3] },
];
const NEWSBOY: Outfit = { ...KID, jacket: "#8a6a3e", pants: "#4a4f5e", boots: "#3a2a20", cap: "#4a4850", skin: SKINS[1] };
const SMITHO: Outfit = { jacket: "#5a4030", pants: "#3a3030", boots: "#2a1e18", hat: "hair", hair: "#2a201a", skin: SKINS[3], moustache: "#2a201a", build: "stout" };
const COOK: Outfit = { jacket: "#c25a7a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#6b4a32", dress: "#5a8fc2", skin: SKINS[0] };
const TRAMMAN: Outfit = { jacket: "#2f4a7a", pants: "#2c2f3a", boots: "#2a2220", hat: "cap", cap: "#2f4a7a", buttons: "#d9b45a", skin: SKINS[1], moustache: "#4a3426" };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);
const MEN = [0, 2, 4, 6].map(townsfolk);
const KIDO: Outfit = { ...KID, jacket: "#3f8f6a", cap: "#f2c14e", skin: SKINS[2] };
const INKC = "#241726";
const rad = (d: number) => (d * Math.PI) / 180;

// ---------------- drawings ----------------
/** a snowflake (64 x 64) */
const drawFlake = (p: Pen) => { p.ell(32, 32, 18, 18, "#ffffff", 0); };
/** a wind streak (400 x 100): a white curl, fading at both ends */
const drawStreak = (p: Pen) => {
  const g = p.g, gr = g.createLinearGradient(0, 0, 400, 0);
  gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.35, "rgba(255,255,255,0.9)"); gr.addColorStop(0.8, "rgba(240,246,255,0.8)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.strokeStyle = gr; g.lineWidth = 9; g.lineCap = "round";
  g.beginPath(); g.moveTo(10, 60); g.bezierCurveTo(140, 70, 250, 40, 330, 46); g.bezierCurveTo(370, 48, 380, 30, 360, 24); g.stroke();
};
/** the newspaper held open (400 x 300): columns of grey lines round a big drawing of a motor carriage and a money bag */
const drawPaper = (p: Pen) => {
  p.poly([[10, 20], [390, 10], [392, 290], [8, 284]], "#f1ece1", 8);
  p.line([[200, 18], [200, 286]], "#c9c2b2", 3, false);
  for (let y = 40; y < 280; y += 16) { p.line([[24, y], [96, y]], "#8d8a86", 5, false); p.line([[304, y], [376, y]], "#8d8a86", 5, false); }
  p.poly([[112, 30], [288, 30], [288, 64], [112, 64]], "#3a3446", 0); // the masthead band (no letters)
  // the carriage: a body, a bench, two big wheels
  p.poly([[124, 150], [230, 150], [230, 182], [124, 182]], "#5a2630", 5);
  p.poly([[132, 120], [150, 120], [150, 150], [132, 150]], "#2f2a30", 4);
  p.ell(142, 196, 26, 26, null, 6); p.ell(218, 200, 20, 20, null, 6);
  // the money bag
  p.ell(262, 210, 26, 30, "#d9b45a", 5); p.poly([[250, 176], [274, 176], [268, 186], [256, 186]], "#c9a04a", 4);
  p.dot(262, 212, 7, "#8a6a3e");
};
/** a soup bowl (300 x 200): a blue-and-white bowl with orange soup */
const drawBowl = (p: Pen) => {
  p.ell(150, 70, 128, 30, "#e08a3a", 7);
  p.poly([[22, 70], [278, 70], [246, 150], [200, 178], [100, 178], [54, 150]], "#f1ece1", 8);
  p.line([[44, 108], [256, 108]], "#5a8fc2", 9, false);
  p.ell(150, 186, 52, 10, "#d8d0c0", 5);
};
/** a wisp of steam (200 x 300), phase k */
const drawSteam = (k: number) => (p: Pen) => {
  const g = p.g; g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 16; g.lineCap = "round";
  g.beginPath(); g.moveTo(100, 290);
  for (let y = 290; y > 20; y -= 10) g.lineTo(100 + 30 * Math.sin(y / 45 + k), y);
  g.stroke();
};
/** the roast turkey on its platter (500 x 300) */
const drawTurkey = (p: Pen) => {
  p.ell(250, 230, 230, 52, "#f1ece1", 8);
  p.ell(250, 170, 150, 92, "#c27a3a", 9);
  p.ell(220, 140, 70, 34, "#d99a5a", 0);
  for (const s of [-1, 1]) { p.line([[250 + s * 120, 200], [250 + s * 176, 150]], "#c27a3a", 34); p.ell(250 + s * 184, 140, 22, 18, "#f1ece1", 5); }
  p.ell(140, 236, 26, 14, "#5d7a3a", 4); p.ell(360, 236, 26, 14, "#5d7a3a", 4); p.ell(300, 244, 18, 10, "#c0362c", 4);
};
/** the starter's flag on its stick (200 x 300) */
const drawFlag = (k: number) => (p: Pen) => {
  p.line([[30, 290], [30, 20]], "#8a6a44", 10);
  p.poly([[34, 24], [180, 30 + 10 * Math.sin(k)], [176, 110 + 8 * Math.sin(k + 1)], [34, 104]], "#c0362c", 7);
  p.poly([[34, 24], [100, 27 + 5 * Math.sin(k)], [100, 66 + 5 * Math.sin(k)], [34, 64]], "#f1ece1", 0);
};
type HorseOpts = { coat: string; phase: number; flip: boolean; shy?: number };
const mixDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), k = 0.72;
  const r = Math.round(((n >> 16) & 255) * k), gg = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return "#" + [r, gg, b].map((v) => v.toString(16).padStart(2, "0")).join("");
};
/** a horse in side view on a 640 x 480 canvas, facing right (flip: left), wearing a red blanket; hooves on y = 468 */
const drawHorse = (p: Pen, o: HorseOpts) => {
  const g = p.g;
  g.save();
  if (o.flip) { g.translate(640, 0); g.scale(-1, 1); }
  const coat = o.coat, dark = "#2a1d1a", by = 250;
  const legs: [number, number, boolean][] = [[215, 0.5, false], [395, 0, false], [240, 0, true], [420, 0.5, true]];
  for (const [x, ph, near] of legs) {
    const s = o.phase >= 0 ? Math.sin((o.phase + ph) * Math.PI * 2) : 0, fx = x + 28 * s, lift = o.phase >= 0 ? Math.max(0, -Math.cos((o.phase + ph) * Math.PI * 2)) * 14 : 0;
    p.stroke([[x, by + 40], [x + 6 * s, by + 130], [fx, 462 - lift]], 24, near ? coat : mixDark(coat));
    p.ell(fx + 4, 466 - lift, 17, 9, dark, 4);
  }
  p.line([[118, by - 40], [96, by + 40], [104, by + 120]], dark, 22);
  const lift = rad(-14 * (o.shy ?? 0));
  p.rot = [lift, 420, by - 40];
  p.poly([[380, by - 30], [455, by - 168], [505, by - 150], [480, by + 20]], coat, 8);
  p.rot = null;
  p.ell(310, by, 175, 82, coat, 9);
  p.poly([[205, by - 70], [420, by - 70], [430, by + 40], [195, by + 40]], "#a8322c", 7);
  p.line([[205, by - 20], [425, by - 20]], "#f1e6c8", 7, false);
  p.rot = [lift, 420, by - 40];
  p.poly([[440, by - 150], [470, by - 196], [505, by - 160]], mixDark(coat), 6);
  p.poly([[470, by - 182], [560, by - 120], [578, by - 96], [560, by - 78], [482, by - 112]], coat, 8);
  p.ell(566, by - 96, 18, 15, "#4a3a36", 5);
  p.line([[400, by - 60], [450, by - 168], [478, by - 178]], dark, 16);
  const ex = 500, ey = by - 140;
  if ((o.shy ?? 0) > 0.5) { p.ell(ex, ey, 14, 14, "#ffffff", 4); p.dot(ex + 4, ey, 5, INKC); }
  else { p.ell(ex, ey, 11, 11, "#ffffff", 4); p.dot(ex + 3, ey + 1, 6, INKC); }
  p.rot = null;
  g.restore();
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = Y) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** someone sitting (front view): the card's sole 0.1 m below the seat */
const sitter = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, p: V3, expr: Expr, extra: FrontOpts = {}) => {
  out.places.push(person(cam, who(i, o, okey), p[0], p[1] - 0.1, p[2], { side: false, mirror: false }, { mode: "sit", expr, blink: lidAt(t, i), ...extra }, {}, 1));
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
const grow = (t: number, t0: number, d = 0.25) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) => {
  if (w > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
};
/** falling snow round a point: n flakes in a box, each fading in at the top and out at the bottom (never pops); drift = sideways m/s */
const snow = (out: Stage, c: V3, t: number, n: number, w: number, h: number, size: number, fall = 0.2, drift = 0) => {
  for (let i = 0; i < n; i++) {
    const h1 = ((i * 0.618) % 1), h2 = ((i * 0.377 + 0.2) % 1), h3 = ((i * 0.851 + 0.5) % 1);
    const u = (t * (fall + 0.08 * h3) + h1) % 1, s = size * (0.6 + 0.6 * h2) * smooth(u / 0.1) * smooth((1 - u) / 0.1);
    if (s < 0.004) continue;
    const dx = (((h2 - 0.5) * w + drift * u / (fall + 0.08 * h3)) % w + w * 1.5) % w - w / 2;
    out.fx.push({ key: "flake", cw: 64, ch: 64, draw: drawFlake, x: c[0] + dx + 0.4 * Math.sin(t * 1.3 + i), y: c[1] + h * (1 - u), z: c[2] + (h3 - 0.5) * w * 0.6, w: s, h: s, soft: true });
  }
};
/** wind streaks blowing along -x past a point at speed v (m/s), each fading in and out over its run */
const wind = (out: Stage, c: V3, t: number, n: number, len: number, v: number, spread: number, size = 1.0) => {
  for (let i = 0; i < n; i++) {
    const h1 = (i * 0.618) % 1, h2 = (i * 0.377 + 0.2) % 1, h3 = (i * 0.851 + 0.5) % 1;
    const u = (t * v / len + h1) % 1, k = smooth(u / 0.2) * smooth((1 - u) / 0.2);
    if (k < 0.02) continue;
    out.fx.push({ key: "streak", cw: 400, ch: 100, draw: drawStreak, x: c[0] + len / 2 - len * u, y: c[1] + (h2 - 0.5) * spread, z: c[2] + (h3 - 0.5) * spread * 1.4, w: size * (0.8 + 0.5 * h3) * k, h: size * 0.25 * (0.8 + 0.5 * h3) * k, soft: true });
  }
};
const puffAt = (out: Stage, p: V3, t: number, n: number, period: number, size: number, rise = 0.6, back = 1.0) => {
  for (let i = 0; i < n; i++) {
    const u = ((t / period + i / n) % 1), uq = q(u, 10);
    out.fx.push({ key: `puff${uq}`, cw: 300, ch: 300, draw: (pn) => fxPuff(pn, uq), x: p[0] - back * u, y: p[1] + rise * u, z: p[2], w: size * (0.5 + 0.8 * u), h: size * (0.5 + 0.8 * u), soft: true });
  }
};
const burst = (out: Stage, p: V3, t: number, t0: number, size: number, col = "#fff3b0", d = 0.35) => {
  const u = (t - t0) / d;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 12);
  out.fx.push({ key: `burst${uq}${col}`, cw: 500, ch: 500, draw: (pn) => fxBurst(pn, uq, col), x: p[0], y: p[1], z: p[2], w: size * (1 - 0.3 * u), h: size * (1 - 0.3 * u) });
};
const horse = (out: Stage, key: string, x: number, z: number, o: HorseOpts, y = Y) => {
  const k = `${key}|${o.coat}|${o.phase >= 0 ? q(o.phase, 12) : -1}|${o.flip}|${q(o.shy ?? 0, 4)}`;
  const w = 2.75, h = w * 0.75;
  out.fx.push({ key: k, cw: 640, ch: 480, draw: (p) => drawHorse(p, o), x, y: y + h / 2 - 0.03, z, w, h });
  blob(out, x - 0.6, y, z, 1.1); blob(out, x + 0.6, y, z, 1.1);
};
/** a carriage's two riders: [outfit, key, expr, extra] for the driver and the passenger (null = empty) */
type Rider = [Outfit, string, Expr, FrontOpts?] | null;
const riders = (cam: CamInfo, t: number, out: Stage, c: CarPose, i0: number, a: Rider, b: Rider) => {
  [a, b].forEach((r, s) => { if (r) sitter(cam, t, out, i0 + s, r[0], r[1], seatAt(c, s), r[2], r[3] ?? {}); });
  blob(out, c.x, Y, c.z, 2.6, 0.9);
};
/** a crowd behind the rope at z = zc, from x0 to x1 */
const crowd = (cam: CamInfo, t: number, out: Stage, i0: number, x0: number, x1: number, zc: number, exprOf: (j: number) => Expr, wave = false) => {
  const n = Math.round((x1 - x0) / 1.1);
  for (let j = 0; j < n; j++) {
    const x = x0 + j * 1.1 + 0.3 * Math.sin(j * 2.3), z = zc + 0.6 * Math.sin(j * 1.7) * Math.sign(zc);
    front(cam, t, out, i0 + j, FOLK[j % 8], `cr${j % 8}`, x, z, exprOf(j), wave && j % 3 === 0 ? { wave: q(0.5 + 0.5 * Math.sin(t * 7 + j), 6) } : {});
  }
};

// ---------------- the places ----------------
const streetSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const cs = cars(id, t);
  if (id === 1) {
    const c = cs[0];
    riders(cam, t, out, c, 1, [DURYEA, "dur", "stern"], [WHITE, "white", "neutral"]);
    puffAt(out, [c.x + 1.3, Y + 0.7, c.z - 0.3], t, 4, 1.0, 0.55, 0.5, -0.8);
    walker(cam, t, out, 3, FOLK[2], "walk", c.x + 1.5, 6.0, -1, 0, t * 1.9, "smile", {}, WY);
    front(cam, t, out, 4, FOLK[1], "f1", 30, 6.6, "laugh", {}, WY);
    front(cam, t, out, 5, FOLK[3], "f3", 33, 6.2, "smile", {}, WY);
    front(cam, t, out, 6, FOLK[4], "f4", 26, -6.2, "grin", {}, WY);
    snow(out, [20, Y, 3], t, 50, 14, 6, 0.07);
  } else if (id === 3) {
    const c = cs[0];
    riders(cam, t, out, c, 1, [DRIVERS[0], "macy", "smile"], [DRIVERS[1], "macyU", "neutral"]);
    const tp = tramAt(3, t)!;
    horse(out, "tr", tp[0] + 2.0, RAIL_Z, { coat: "#7a4a2c", phase: (t * 1.6) % 1, flip: false });
    front(cam, t, out, 9, TRAMMAN, "tram", tp[0] + 0.4, RAIL_Z, "smile", {}, Y + 0.6);
    const fx = 12 - 1.1 * (t - 7.3), ph = t * 1.5;
    walker(cam, t, out, 10, FOLK[0], "dad", fx, 6.0, -1, 0, ph, by(t, T_THANKS) ? "grin" : "smile", {}, WY);
    card(out, "turkeyW", 500, 300, drawTurkey, fx - 0.45, WY + 1.05, 6.25, 0.6, 0.36);
    walker(cam, t, out, 11, FOLK[1], "mom", fx + 0.9, 6.5, -1, 0, ph + 0.3, "smile_closed", {}, WY);
    walker(cam, t, out, 12, KIDO, "kid", fx - 0.9, 6.7, -1, 0, ph * 1.3 + 0.5, "laugh", {}, WY);
    for (let j = 0; j < 6; j++) walker(cam, t, out, 13 + j, FOLK[(j + 2) % 8], `p${j}`, 4 + j * 6 + 1.0 * (t - 7.3) * (j % 2 ? 1 : -1), j % 2 ? -6.0 : 6.8, j % 2 ? 1 : -1, 0, t * 1.5 + j * 0.3, "smile", {}, WY);
    snow(out, [6, Y, 2], t, 60, 22, 8, 0.09);
  } else if (id === 4) {
    const [nx, , nz] = NEWS, react = by(t, T_DOLLARS);
    front(cam, t, out, 1, NEWSBOY, "news", nx, nz, react ? "laugh" : "grin", { wave: q(0.6 + 0.4 * Math.sin(t * 5), 6) }, WY);
    card(out, "paper", 400, 300, drawPaper, nx - 0.32, WY + 0.98, nz + 0.3, 0.62, 0.47);
    front(cam, t, out, 2, FOLK[0], "f0", nx - 1.2, nz - 0.5, react ? "shock" : "neutral", {}, WY);
    front(cam, t, out, 3, FOLK[2], "f2", nx + 1.0, nz - 0.7, react ? "grin" : "smile", {}, WY);
    front(cam, t, out, 4, FOLK[5], "f5", nx + 2.6, nz - 0.2, "smile", {}, WY);
    snow(out, [nx, Y, nz + 2.5], t, 34, 7, 4, 0.05);
  } else if (id === 6) {
    const [dx, , dz] = DESK;
    sitter(cam, t, out, 1, WHITE, "clerk", [dx - 0.2, WY + 0.5, dz - 0.75], "smile");
    for (let j = 0; j < 7; j++) {
      const ex: Expr = j === 0 ? (by(t, T_SIGN) ? "grin" : "smile") : (["grin", "smile", "laugh", "smile_closed"] as Expr[])[j % 4];
      front(cam, t, out, 2 + j, j === 0 ? DURYEA : j === 2 ? MUELLER : MEN[j % 4], `q${j}`, dx + 1.1 + j * 0.85, dz + 0.45 + 0.15 * Math.sin(j * 2), ex, {}, WY);
    }
    snow(out, [dx + 2, Y, dz], t, 30, 8, 5, 0.05);
  } else if (id === 7) {
    const k = 0.3 + 0.7 * smooth((t - 21.0) / 1.4);
    walker(cam, t, out, 1, FOLK[0], "late", -6 - 1.3 * (t - 21), -6.2, -1, 0, t * 1.6, "pained", {}, WY);
    snow(out, [-10, Y, 0], t, Math.round(220 * k), 26, 10, 0.16, 0.32, -1.8);
    snow(out, [-1, Y, 1.5], t, Math.round(90 * k), 8, 5, 0.06, 0.4, -1.8);
  } else if (id === 9) {
    const c = cs[0], tp = tramAt(9, t)!, hit = by(t, T_TRAM);
    riders(cam, t, out, c, 1, [DRIVERS[0], "macy", hit ? "shock" : "nervous"], [DRIVERS[1], "macyU", hit ? "shock" : "nervous"]);
    horse(out, "tr", tp[0] + 2.0, RAIL_Z, { coat: "#7a4a2c", phase: (t * 1.6) % 1, flip: false, shy: hit ? smooth((t - T_TRAM) / 0.2) : 0 });
    front(cam, t, out, 9, TRAMMAN, "tram", tp[0] + 0.4, RAIL_Z, hit ? "shock" : "smile", {}, Y + 0.6);
    burst(out, [tp[0] - 6.0, Y + 1.0, RAIL_Z + 0.9], t, T_TRAM - 0.05, 1.3);
    front(cam, t, out, 10, FOLK[1], "f1", tp[0] - 9, -6.4, hit ? "shock" : "neutral", {}, WY);
    front(cam, t, out, 11, FOLK[3], "f3", tp[0] - 4, -6.1, hit ? "laugh" : "smile", {}, WY);
    snow(out, [tp[0] - 6, Y, 2], t, 40, 12, 5, 0.07);
  } else if (id === 11) {
    const c = cs[0], snap = by(t, T_SNAPS);
    riders(cam, t, out, c, 1, [DURYEA, "dur", snap ? "shock" : "stern"], [WHITE, "white", snap ? "shock" : "neutral"]);
    const tl = seatAt(c, 0);
    burst(out, [tl[0] - 0.4, tl[1] + 0.35, tl[2] + 0.3], t, T_SNAPS - 0.05, 0.9);
    if (!snap) puffAt(out, [c.x + 1.3, Y + 0.7, c.z - 0.3], t, 4, 1.0, 0.55, 0.5, -0.8);
    front(cam, t, out, 5, FOLK[6], "f6", 30, 6.4, snap ? "shock" : "smile", {}, WY);
    snow(out, [24, Y, 3], t, 40, 12, 5, 0.07);
  } else if (id === 12) {
    const [sx, sy, sz] = SMITH, c = cs[0];
    riders(cam, t, out, c, 4, null, [WHITE, "white", "neutral"]);
    const ph = ((t - 31.0) / 0.6) % 1, k = ph < 0.7 ? 1 - ph / 0.7 * 0.2 - 0.8 * Math.sin((ph / 0.7) * Math.PI / 2) : smooth((ph - 0.7) / 0.3);
    const strike = q(clamp01(1 - k), 8);
    front(cam, t, out, 1, SMITHO, "smith", sx + 0.1, sz - 0.45, "stern", { prop: ["hammer", strike] }, sy);
    const n = Math.floor((t - 31.0) / 0.6), tHit = 31.0 + n * 0.6 + 0.42;
    burst(out, [sx + 0.45, sy + 0.95, sz + 0.05], t, tHit, 0.55, "#ffcf6a", 0.25);
    front(cam, t, out, 2, DURYEA, "dur", sx + 1.8, sz + 0.9, by(t, T_FALLS) ? "pained" : "nervous", {}, sy);
  }
};

const parkSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const cs = cars(id, t);
  if (id === 2 || id === 18 || id === 20) {
    const c = cs[0], late = id === 2 ? 0 : id === 18 ? clamp01((t - 52.7) / 1) : 1;
    const asleep: FrontOpts = { tilt: -14, headTilt: -16, blink: 1 };
    riders(cam, t, out, c, 1, [KING, "king", id === 20 && by(t, T_UMP2) ? "grin" : id === 20 ? "smile_closed" : "stern"], [MUELLER, "mue", "neutral", asleep]);
    const shocked = id === 2 ? by(t, T_PASSED) : id === 18 ? by(t, T_KING) : true;
    crowd(cam, t, out, 10, PX - 14, PX + 8, -7.6, (j) => (id === 20 ? (j % 2 ? "laugh" : "grin") : shocked ? (j % 3 ? "shock" : "laugh") : "smile"), id === 20);
    crowd(cam, t, out, 40, PX - 14, PX + 8, 7.6, (j) => (id === 20 ? (j % 2 ? "grin" : "laugh") : shocked ? (j % 2 ? "laugh" : "shock") : "smile"), id === 20);
    void late; void T_ROLLS;
  } else if (id === 5) {
    const c = cs[0], ump = by(t, T_UMPIRE);
    riders(cam, t, out, c, 1, [MUELLER, "mue", "grin"], [KING, "king", ump ? "smile_closed" : "neutral"]);
    crowd(cam, t, out, 10, PX - 16, PX + 2, -7.6, (j) => (j % 2 ? "smile" : "grin"));
    snow(out, [c.x, Y, 1], t, 40, 10, 5, 0.06);
  } else if (id === 8) {
    const R: [Rider, Rider][] = [
      [[DURYEA, "dur", "stern"], [WHITE, "white", "neutral"]],
      [[MUELLER, "mue", "grin"], [KING, "king", "smile"]],
      [[DRIVERS[0], "macy", "smile"], [DRIVERS[1], "macyU", "neutral"]],
      [[DRIVERS[2], "dlv", "grin"], [DRIVERS[3], "dlvU", "nervous"]],
      [[DRIVERS[3], "eb", "smile"], [DRIVERS[0], "ebU", "neutral"]],
      [[DRIVERS[1], "st", "nervous"], [DRIVERS[2], "stU", "smile"]],
    ];
    cs.forEach((c, i) => riders(cam, t, out, c, 1 + i * 2, R[i][0], R[i][1]));
    const six = by(t, T_SIX);
    front(cam, t, out, 20, WHITE, "starter", PX + 3.0, -4.4, six ? "grin" : "stern", { wave: six ? q(0.5 + 0.5 * Math.sin(t * 6), 6) : 0 });
    card(out, "flag", 200, 300, drawFlag(q(t * 5 % (Math.PI * 2), 8)), PX + 3.55, Y + 2.35, -4.3, 0.55, 0.82);
    crowd(cam, t, out, 30, PX - 14, PX - 3, -11.5, (j) => (six ? (j % 2 ? "laugh" : "grin") : "smile"));
    snow(out, [PX + 4, Y, 0], t, 50, 16, 6, 0.08);
  } else if (id === 17) {
    const c = cs[0], won = by(t, T_WINS);
    riders(cam, t, out, c, 1, [DURYEA, "dur", won ? "relief_open" : "stern"], [WHITE, "white", won ? "grin" : "neutral"]);
    puffAt(out, [c.x - 1.3, Y + 0.7, c.z - 0.3], t, 4, 1.0, 0.55, 0.5, 0.8);
    crowd(cam, t, out, 10, PX - 10, PX + 10, -7.6, (j) => (won ? (j % 2 ? "laugh" : "grin") : "smile"), won);
    crowd(cam, t, out, 40, PX - 10, PX + 10, 7.6, (j) => (won ? (j % 2 ? "grin" : "laugh") : "smile"), won);
  }
};

const roadSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const cs = cars(id, t);
  if (id === 10) {
    const give = by(t, T_GIVE);
    riders(cam, t, out, cs[0], 1, [DRIVERS[3], "eb", give ? "pained" : "nervous", give ? { headTilt: 10 } : {}], [DRIVERS[0], "ebU", give ? "stern" : "nervous"]);
    riders(cam, t, out, cs[1], 3, [DRIVERS[1], "st", "pained"], [DRIVERS[2], "stU", "stern"]);
    snow(out, [RX + 2, Y, 1], t, 50, 12, 5, 0.07);
  } else {
    const c = cs[0], cx = benzRoadX(t);
    let mx: Expr = "stern", mo: FrontOpts = {};
    if (id === 13) {
      if (by(t, T_WIND)) mx = "pained";
      if (by(t, T_EYES)) { mx = "neutral"; mo = { blink: q(0.5 + 0.5 * smooth((t - T_EYES) / (T_CLOSE - T_EYES + 0.2)), 4) }; }
    } else if (id === 14) { mx = "neutral"; mo = { blink: 0.75, headTilt: -10 * smooth((t - T_MAN + 0.1) / 0.6) }; }
    else if (id === 16) { mx = by(t, T_ICY) ? "pained" : "stern"; }
    riders(cam, t, out, c, 1, [MUELLER, "mue", mx, mo], [KING, "king", id === 14 ? "stern" : "nervous"]);
    puffAt(out, [cx - 1.4, Y + 0.75, -0.1], t, 5, 0.9, 0.6, 0.5, 1.2);
    const sp = id === 16 ? 9 : 7;
    wind(out, [cx + 0.5, Y + 1.7, -0.1], t, id === 16 ? 14 : 10, 9, sp, 1.8, 0.9);
    snow(out, [cx + 1, Y, 0], t, 70, 10, 5, 0.06, 0.35, -3.0);
  }
};

const roomSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [rx, ry, rz] = ROOM, top = ry + 0.86;
  if (id === 15) {
    const blow = by(t, T_BLOW);
    front(cam, t, out, 1, COOK, "cook", rx - 0.1, rz - 1.45, blow ? "whistle" : "smile", { tilt: blow ? 6 : 0 }, ry + 0.1);
    card(out, "bowl", 300, 200, drawBowl, rx - 0.1, top + 0.09, rz - 0.55, 0.36, 0.24);
    const k = smooth((t - T_BLOW + 0.07) / 0.3) * (1 - smooth((t - T_BLOW - 1.4) / 0.6));
    for (let i = 0; i < 3; i++) {
      const u = (t * 0.45 + i / 3) % 1, a = smooth(u / 0.2) * smooth((1 - u) / 0.25);
      const sx = rx - 0.1 + (i - 1) * 0.07 + k * (0.15 + 0.9 * u), sy = top + 0.3 + 0.55 * u * (1 - 0.6 * k);
      card(out, `steam${i}`, 200, 300, drawSteam(i * 2.1), sx, sy, rz - 0.5, 0.16 * a * (1 + 0.4 * k), 0.28 * a, true);
    }
  } else {
    card(out, "turkey", 500, 300, drawTurkey, rx, top + 0.22, rz - 0.6, 0.75, 0.45);
    const tk = by(t, T_TURKEY);
    const seats: [number, number, Outfit, Expr][] = [[-0.75, -1.4, FOLK[0], "grin"], [0.0, -1.5, COOK, "laugh"], [0.75, -1.4, KIDO, "laugh"], [-1.55, -0.6, FOLK[3], "smile_closed"], [1.55, -0.6, FOLK[4], "grin"]];
    seats.forEach(([dx, dz, o, ex], i) => sitter(cam, t, out, 1 + i, o, `fam${i}`, [rx + dx, ry + 0.72, rz + dz], tk && i % 2 ? "laugh" : ex));
  }
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "street") streetSet(id, t, cam, out);
  else if (s.scene === "park") parkSet(id, t, cam, out);
  else if (s.scene === "road") roadSet(id, t, cam, out);
  else roomSet(id, t, cam, out);
  void LANE_Z;
  return out;
};
