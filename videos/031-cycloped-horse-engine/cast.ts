// The cast and hand-drawn props of the Cycloped story: the horse (side view, walking on the treadmill, proud, startled,
// sheepish), Thomas Brandreth in his top hat, the three judges, the crowd in top hats and bonnets, a boy who jogs
// beside the Cycloped, the Rocket's fireman, George and Robert Stephenson, the analogy rider, passengers. Every prop is
// an unlit ink-outlined drawing: steam, the firebox flame, the purse of sovereigns, the crossed-out boiler and coal,
// the splinters of the floor, the judge's flag, the exercise bike, weight arrows, three iron weights, a sack of coal,
// the day bubble (a sun crossing the sky over a horse at the plough) and speed lines. Cards that arrive mid-shot grow
// in, and cards that leave shrink away: nothing pops.
import { Pen, SKINS, Outfit, Expr, FrontOpts, KID, fxBurst, fxPuff } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, TZ0, TZ1, RT, KRT, KX, CYC_FLOOR, CYC_W, ENG_X, CHIM, BRANDRETH, JUDGES, FIREMAN, V3, smooth, clamp01,
  cycX, engX, sinkAt, walking, autoX, trainX, train17X,
  T_HORSE, T_RACE, T_STEAM, T_WORLD, T_TEN, T_CROWDED, T_RAINHILL, T_LIVERPOOL, T_RAILWAY, T_FIVE, T_POUNDS, T_LOCO,
  T_FOUR, T_HISSED, T_FIRE, T_STEAM2, T_FIFTH, T_CYC, T_THOMAS, T_DIRECTOR, T_ITSELF, T_INSIDE, T_WALKED, T_TURNED,
  T_BOILER, T_COAL, T_JUST, T_HORSE2, T_CROWD, T_LAUGHED, T_MOVED, T_MARCHING, T_BRAVELY, T_CREPT, T_SIX, T_HOUR,
  T_THEN, T_CRACK, T_HORSE3, T_THROUGH, T_FLOOR2, T_CYC2, T_OUT, T_SEE, T_TREAD, T_PEDAL, T_BIKE, T_BOLTED, T_CAR,
  T_LEGS, T_CAR2, T_BIKE2, T_YOU, T_WITH, T_WEIGHED, T_THREE, T_TONS, T_ENGINE, T_STRENGTH, T_COAL2, T_SACK, T_DAY,
  T_WORK, T_ROCKET, T_WON, T_THIRTY, T_HOUR2, T_YEAR, T_TRAINS, T_MANCHESTER, T_BECAME, T_ONLY, T_HISTORY, T_LOSE,
  T_FALLING, T_FLOOR3,
} from "./story";

const Y = D0, RTY = D0 + RT;
const INKC = "#241726";
const rad = (d: number) => (d * Math.PI) / 180;
const BRANDO: Outfit = { jacket: "#2f4a3a", pants: "#d8cbb0", boots: "#2a2220", hat: "tophat", skin: SKINS[0], moustache: "#6b4a32", buttons: "#d9b45a" };
const JUDGE: Outfit[] = [
  { jacket: "#2a2a34", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[1], moustache: "#8a8a8a" },
  { jacket: "#5a3a2a", pants: "#d8cbb0", boots: "#2a2220", hat: "tophat", skin: SKINS[2] },
  { jacket: "#3f5f8a", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[0], moustache: "#3a2a20" },
];
const FOLK: Outfit[] = [
  { jacket: "#3f5f8a", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[0], moustache: "#3a2a20" },
  { jacket: "#6a4a6a", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#6b4a32", dress: "#c25a7a", skin: SKINS[1] },
  { jacket: "#8a6a3e", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#4a4850", skin: SKINS[2] },
  { jacket: "#3f6fa0", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#3a2a20", dress: "#d9a441", skin: SKINS[3] },
  { jacket: "#5a3a2a", pants: "#d8cbb0", boots: "#2a2220", hat: "tophat", skin: SKINS[0] },
  { jacket: "#2f5a6a", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#a8743e", dress: "#5a8fc2", skin: SKINS[1] },
  { jacket: "#7a4a32", pants: "#4a4f5e", boots: "#2a2220", hat: "cap", cap: "#6a5a4a", skin: SKINS[1], moustache: "#6b4a32" },
  { jacket: "#4a6a3a", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#6b4a32", dress: "#8c3b4a", skin: SKINS[2] },
];
const FIREO: Outfit = { jacket: "#3a3a44", pants: "#2c2f3a", boots: "#2a2220", hat: "cap", cap: "#2a2a30", skin: SKINS[1], moustache: "#3a2a20" };
const GEORGE: Outfit = { jacket: "#2a2a34", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[0], buttons: "#d9b45a" };
const ROBERT: Outfit = { jacket: "#5a3a2a", pants: "#d8cbb0", boots: "#2a2220", hat: "tophat", skin: SKINS[1], moustache: "#3a2a20" };
const BOY: Outfit = { ...KID, jacket: "#3f8f6a", cap: "#f2c14e", skin: SKINS[2] };
const RIDER: Outfit = { jacket: "#e2a03c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair: "#3a2a20", skin: SKINS[3] };

// ---------------- drawings ----------------
const mixDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), k = 0.72;
  const r = Math.round(((n >> 16) & 255) * k), gg = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return "#" + [r, gg, b].map((v) => v.toString(16).padStart(2, "0")).join("");
};
type Mood = "proud" | "wide" | "sheepish";
type HorseOpts = { coat: string; phase: number; mood: Mood; nod?: number };
/** a horse in side view on a 640 x 480 canvas, facing right, hooves on y = 468: walking (phase >= 0) or standing */
const drawHorse = (p: Pen, o: HorseOpts) => {
  const coat = o.coat, dark = "#2a1d1a", by = 250;
  const legs: [number, number, boolean][] = [[215, 0.5, false], [395, 0, false], [240, 0, true], [420, 0.5, true]];
  for (const [x, ph, near] of legs) {
    const s = o.phase >= 0 ? Math.sin((o.phase + ph) * Math.PI * 2) : 0, fx = x + 28 * s, lift = o.phase >= 0 ? Math.max(0, -Math.cos((o.phase + ph) * Math.PI * 2)) * 14 : 0;
    p.stroke([[x, by + 40], [x + 6 * s, by + 130], [fx, 462 - lift]], 24, near ? coat : mixDark(coat));
    p.ell(fx + 4, 466 - lift, 17, 9, dark, 4);
  }
  p.line([[118, by - 40], [96, by + 40], [104, by + 120]], dark, 22);
  const head = rad(o.mood === "sheepish" ? 16 : -6 * (o.nod ?? 0));
  p.rot = [head, 420, by - 40];
  p.poly([[380, by - 30], [455, by - 168], [505, by - 150], [480, by + 20]], coat, 8);
  p.rot = null;
  p.ell(310, by, 175, 82, coat, 9);
  p.poly([[255, by - 76], [345, by - 76], [350, by + 30], [250, by + 30]], "#a8322c", 7); // a racing cloth
  p.line([[252, by - 20], [348, by - 20]], "#f1e6c8", 7, false);
  p.rot = [head, 420, by - 40];
  p.poly([[440, by - 150], [470, by - 196], [505, by - 160]], mixDark(coat), 6);
  p.poly([[470, by - 182], [560, by - 120], [578, by - 96], [560, by - 78], [482, by - 112]], coat, 8);
  p.ell(566, by - 96, 18, 15, "#4a3a36", 5);
  p.line([[400, by - 60], [450, by - 168], [478, by - 178]], dark, 16);
  const ex = 500, ey = by - 140;
  if (o.mood === "wide") { p.ell(ex, ey, 16, 16, "#ffffff", 4); p.dot(ex + 3, ey, 5, INKC); }
  else if (o.mood === "sheepish") { p.ell(ex, ey + 2, 11, 9, "#ffffff", 4); p.dot(ex + 2, ey + 4, 5, INKC); p.stroke([[ex - 13, ey - 6], [ex + 12, ey - 3]], 6, INKC); }
  else { p.ell(ex, ey, 11, 11, "#ffffff", 4); p.dot(ex + 3, ey + 1, 6, INKC); }
  p.rot = null;
};
/** a steam cloud (300 x 300), age u 0..1 */
const drawSteam = (p: Pen, u: number) => {
  const a = (0.9 * (1 - u)).toFixed(3);
  for (let i = 0; i < 5; i++) {
    const an = rad(200 + i * 40), d = 30 + 60 * u, r = (40 + 16 * (i % 2)) * (0.7 + 0.5 * u);
    p.ell(150 + d * Math.cos(an), 170 + d * 0.6 * Math.sin(an), r, r * 0.85, `rgba(246,244,240,${a})`, 0);
  }
  p.ell(150, 170, 58 * (0.7 + 0.5 * u), 50 * (0.7 + 0.5 * u), `rgba(250,248,244,${a})`, 0);
};
/** a flame at a firebox door (160 x 200), frame n */
const drawFlame = (p: Pen, n: number) => {
  const w = 1 + 0.12 * Math.sin(n * 1.7);
  p.poly([[30, 190], [44 * w, 90], [80, 10 + 10 * Math.sin(n)], [116, 90], [130, 190]], "#f07a2a", 6);
  p.poly([[56, 190], [64, 120], [80, 70 + 8 * Math.cos(n)], [96, 120], [104, 190]], "#ffd25a", 0);
};
/** the purse (240 x 220): a fat leather bag, gold coins spilling */
const drawPurse = (p: Pen) => {
  p.poly([[50, 200], [30, 120], [70, 60], [170, 60], [210, 120], [190, 200]], "#8a5a34", 7);
  p.poly([[80, 64], [100, 30], [140, 30], [160, 64]], "#7a4a2c", 6);
  p.line([[78, 66], [162, 66]], "#d9b45a", 8, false);
  for (const [x, y] of [[40, 206], [200, 204], [120, 210]]) { p.ell(x, y, 22, 10, "#f2c14e", 4); }
  p.ell(120, 136, 30, 30, "#f2c14e", 5); p.ell(120, 136, 18, 18, "#e0a832", 0);
};
/** a crossed-out thing (240 x 240): the boiler (k 0) or a lump of coal (k 1), a red cross over it, cross drawn by u */
const drawNo = (p: Pen, k: number, u: number) => {
  if (k === 0) { p.poly([[40, 90], [200, 90], [200, 170], [40, 170]], "#8a8f98", 6); p.ell(40, 130, 22, 40, "#6a6f78", 5); p.poly([[150, 30], [176, 30], [176, 90], [150, 90]], "#2f2d33", 5); }
  else { p.poly([[50, 160], [70, 90], [130, 70], [190, 110], [180, 170], [110, 190]], "#2a2628", 6); p.line([[90, 110], [120, 100]], "#5a5658", 6, false); }
  if (u > 0) {
    const e = (a: [number, number], b: [number, number], k2: number): [number, number] => [a[0] + (b[0] - a[0]) * k2, a[1] + (b[1] - a[1]) * k2];
    const u1 = clamp01(u * 2), u2 = clamp01(u * 2 - 1);
    p.line([[24, 24], e([24, 24], [216, 216], u1)], "#d0342c", 22);
    if (u2 > 0) p.line([[216, 24], e([216, 24], [24, 216], u2)], "#d0342c", 22);
  }
};
/** a bag of oats (160 x 160) */
const drawOats = (p: Pen) => {
  p.poly([[30, 150], [20, 60], [60, 40], [100, 40], [140, 60], [130, 150]], "#d8c08a", 6);
  p.line([[40, 56], [120, 56]], "#a08a5a", 6, false);
  for (const [x, y] of [[60, 30], [80, 24], [100, 30]]) p.ell(x, y, 8, 5, "#e8d49a", 3);
};
/** splinters of the floor (300 x 200): broken plank ends, frame v */
const drawSplinters = (p: Pen, v: number) => {
  const rot = v * 0.6;
  for (let i = 0; i < 4; i++) {
    const cx = 50 + i * 66, cy = 110 + 20 * Math.sin(i * 2 + rot), a = 0.5 * Math.sin(i + rot);
    p.rot = [a, cx, cy];
    p.poly([[cx - 26, cy - 10], [cx + 18, cy - 12], [cx + 30, cy - 4], [cx + 20, cy + 2], [cx + 30, cy + 10], [cx - 26, cy + 10]], "#b98a56", 5);
    p.rot = null;
  }
};
/** a broken plank edge (500 x 160) for the hole in the floor */
const drawHole = (p: Pen) => {
  p.poly([[10, 60], [120, 40], [150, 90], [200, 30], [260, 80], [300, 20], [360, 70], [420, 36], [490, 60], [490, 150], [10, 150]], "#9a7046", 6);
  for (const x of [80, 180, 280, 380]) p.line([[x, 70], [x, 148]], "#6a4a30", 5, false);
};
/** the judge's red flag (200 x 160), wave phase n */
const drawFlag = (p: Pen, n: number) => {
  const w = 10 * Math.sin(n * 0.9);
  p.line([[20, 158], [20, 8]], "#6a4a32", 10);
  p.poly([[24, 12], [100, 18 + w], [180, 10], [180, 84], [100, 92 + w], [24, 84]], "#d0342c", 6);
};
/** the exercise bike (360 x 300): a stand, a heavy wheel at the front, a saddle, cranks at angle a (rad) */
const drawBike = (p: Pen, a: number) => {
  p.poly([[30, 288], [330, 288], [320, 270], [40, 270]], "#3a3a44", 5);
  p.line([[110, 272], [150, 150], [170, 90]], "#5a6a7a", 14);
  p.line([[150, 150], [260, 150], [290, 272]], "#5a6a7a", 14);
  p.ell(270, 150, 62, 62, "#8a8f98", 7); p.ell(270, 150, 18, 18, "#3a3a44", 0);
  p.poly([[140, 92], [200, 86], [204, 100], [146, 104]], "#2a2228", 5); // the saddle
  p.line([[250, 150], [262, 80], [300, 74]], "#5a6a7a", 10); // the handlebar
  const cx = 160, cy = 200, r = 34;
  p.ell(cx, cy, 22, 22, "#c9a24a", 4);
  for (const s of [0, Math.PI]) { const x = cx + r * Math.cos(a + s), y = cy + r * Math.sin(a + s); p.line([[cx, cy], [x, y]], "#2f2d33", 8); p.poly([[x - 16, y - 5], [x + 16, y - 5], [x + 16, y + 5], [x - 16, y + 5]], "#2f2d33", 3); }
  p.line([[cx, cy + 4], [270, 152]], "#2f2d33", 4, false);
};
/** a bolt (120 x 120) */
const drawBolt = (p: Pen) => {
  p.poly([[30, 20], [90, 20], [104, 44], [90, 68], [30, 68], [16, 44]], "#a8acb4", 6);
  p.poly([[50, 68], [70, 68], [70, 116], [50, 116]], "#8a8f98", 5);
  for (const y of [80, 92, 104]) p.line([[50, y], [70, y + 6]], "#5a5e66", 3, false);
};
/** a heavy down arrow (140 x 220) */
const drawArrow = (p: Pen) => p.poly([[45, 10], [95, 10], [95, 120], [130, 120], [70, 210], [10, 120], [45, 120]], "#e0503a", 7);
/** sweat drops (200 x 120), phase n */
const drawSweat = (p: Pen, n: number) => {
  for (let i = 0; i < 3; i++) { const y = 30 + ((n * 7 + i * 30) % 80); p.poly([[30 + i * 70, y - 22], [44 + i * 70, y], [30 + i * 70, y + 10], [16 + i * 70, y]], "#8ac6f2", 4); }
};
/** an iron weight (220 x 200) with a ring on top */
const drawWeight = (p: Pen) => {
  p.ell(110, 40, 30, 26, null, 0); p.arc(110, 40, 30, 26, 180, 360, 12, "#3a3a44");
  p.poly([[40, 190], [60, 60], [160, 60], [180, 190]], "#4a4a54", 8);
  p.line([[70, 80], [150, 80]], "#6a6a76", 6, false);
};
/** a sack of coal (180 x 200), black lumps at its mouth */
const drawSack = (p: Pen) => {
  p.poly([[30, 190], [20, 60], [70, 40], [110, 40], [160, 60], [150, 190]], "#8a7a5a", 7);
  for (const [x, y] of [[60, 44], [92, 34], [122, 46], [80, 26]]) p.ell(x, y, 18, 13, "#2a2628", 4);
  p.line([[40, 70], [140, 70]], "#6a5a3a", 6, false);
};
/** the day bubble (420 x 300): a thought cloud, a horse at the plough, the sun crossing the sky (u 0..1) */
const drawDay = (p: Pen, u: number) => {
  for (const [x, y, r] of [[110, 110, 90], [210, 80, 100], [310, 110, 90], [160, 180, 90], [270, 180, 90]]) p.ell(x, y, r, r * 0.8, "#ffffff", 6);
  p.ell(210, 140, 170, 100, "#ffffff", 0);
  const sx = 70 + 280 * u, sy = 170 - 110 * Math.sin(Math.PI * u);
  p.ell(sx, sy, 22, 22, u > 0.85 ? "#f08a4a" : "#ffd25a", 4);
  p.poly([[60, 220], [360, 220], [360, 236], [60, 236]], "#86ab5c", 0);
  const hx = 120 + 140 * u;
  p.ell(hx, 196, 34, 16, "#7a4a2c", 4); p.line([[hx + 28, 190], [hx + 44, 172]], "#7a4a2c", 10); p.ell(hx + 48, 170, 10, 8, "#7a4a2c", 3);
  for (const dx of [-22, 20]) p.line([[hx + dx, 206], [hx + dx, 224]], "#7a4a2c", 7);
  p.line([[hx - 34, 196], [hx - 70, 214]], "#6a4a32", 5); p.poly([[hx - 78, 206], [hx - 60, 206], [hx - 66, 224]], "#8a8f98", 3);
};
/** speed lines (500 x 200) */
const drawSpeed = (p: Pen, n: number) => {
  for (let i = 0; i < 5; i++) { const y = 30 + i * 36, x0 = 20 + ((n * 37 + i * 61) % 80); p.line([[x0, y], [x0 + 300 + 30 * (i % 2), y]], "#ffffff", 8, false); }
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = Y, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** someone sitting (front view): the card's sole 0.1 m below the seat */
const sitter = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, p: V3, expr: Expr, extra: FrontOpts = {}) => {
  out.places.push(person(cam, who(i, o, okey), p[0], p[1] - 0.1, p[2], { side: false, mirror: false }, { mode: "sit", expr, blink: lidAt(t, i), ...extra }, {}, 1));
};
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, phase: number, expr: Expr) => {
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, Y, z, { side: v.side, mirror: v.mirror },
    { mode: "stroll", phase: q(phase % 1, 16), expr, blink: lidAt(t, i) }, { mode: "march", phase: q(phase % 1, 16), expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs) * 0.8 }, 1));
  blob(out, x, Y, z, o.build === "kid" ? 0.8 : 1);
};
/** before / after a word (2 frames early) */
const by = (t: number, t0: number) => t >= t0 - 0.07;
/** a card that grows in from t0 over d seconds */
const grow = (t: number, t0: number, d = 0.4) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
};
const burst = (out: Stage, p: V3, t: number, t0: number, size: number, col = "#fff3b0", d = 0.4) => {
  const u = (t - t0) / d;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 12), k = 1 - smooth((u - 0.6) / 0.4);
  out.fx.push({ key: `burst${uq}${col}`, cw: 500, ch: 500, draw: (pn) => fxBurst(pn, uq, col), x: p[0], y: p[1], z: p[2], w: size * k, h: size * k });
};
const dust = (out: Stage, p: V3, t: number, t0: number, size: number, d = 0.6) => {
  const u = (t - t0) / d;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 12), k = smooth(u / 0.15);
  out.fx.push({ key: `puff${uq}`, cw: 300, ch: 300, draw: (pn) => fxPuff(pn, uq), x: p[0], y: p[1], z: p[2], w: size * k, h: size * k, soft: true });
};
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);
const f12 = (t: number, off = 0) => (Math.round(t * 30) + off) % 12;

/** the horse in the Cycloped at x (its hooves on the treadmill, sunk by `sink`) */
const horse = (out: Stage, x: number, t: number, mood: Mood, walk: boolean, sink = 0, nod = 0, y0 = RTY) => {
  const ph = walk ? q((t * 1.6) % 1, 12) : -1, w = 2.6, h = w * 0.75, o: HorseOpts = { coat: "#8a5a34", phase: ph, mood, nod: q(nod, 4) };
  out.fx.push({ key: `horse|${ph}|${mood}|${o.nod}`, cw: 640, ch: 480, draw: (p) => drawHorse(p, o), x: x - 0.1, y: y0 + CYC_FLOOR - sink + h / 2 - 0.03, z: TZ0 + 0.05, w, h });
};
/** steam from an engine's chimney top: three clouds cycling (rate per second), size s */
const steam = (out: Stage, k: number, x: number, z: number, t: number, s = 1.3, rate = 0.7, y0 = RTY) => {
  const [cx, cy] = CHIM[k];
  for (let i = 0; i < 3; i++) {
    const u = (t * rate + i / 3 + k * 0.17) % 1, uq = q(u, 16), g = smooth(u / 0.12);
    card(out, `steam${uq}`, 300, 300, (pn) => drawSteam(pn, uq), x + cx - 0.9 * u, y0 + cy + 0.3 + 1.5 * u, z, s * (0.5 + 0.8 * u) * g, s * (0.5 + 0.8 * u) * g, true);
  }
};
/** the crowd behind the fence: a front row on the ground and rows on the grandstand steps */
const crowd = (cam: CamInfo, t: number, out: Stage, expr: (j: number) => Expr, waving: number, n = 14) => {
  const spots: [number, number, number][] = [
    [-7.5, -7.2, 0], [-5.6, -7.0, 0], [-3.8, -7.3, 0], [-1.9, -7.0, 0], [0.2, -7.2, 0], [2.2, -7.0, 0], [4.1, -7.3, 0], [6.0, -7.1, 0], [8.0, -7.2, 0],
    [-6.4, -12.0, 0.5], [-2.6, -12.0, 0.5], [1.3, -12.0, 0.5], [5.2, -12.0, 0.5], [-4.5, -13.1, 1.0], [-0.6, -13.1, 1.0], [3.3, -13.1, 1.0], [7.0, -13.1, 1.0],
  ];
  for (let j = 0; j < Math.min(n, spots.length); j++) {
    const [x, z, y] = spots[j];
    front(cam, t, out, 20 + j, FOLK[j % 8], `f${j % 8}`, x, z, expr(j), { wave: waving ? wave(t, j) : 0, facing: x < 0 ? 1 : -1 }, Y + y, y === 0);
  }
};
const engines = (out: Stage, id: number, t: number, rate = 0.7) => {
  for (let k = 0; k < 4; k++) { const x = engX(k, id, t); if (Math.abs(x) < 50) steam(out, k, x, TZ1, t, 1.3, rate); }
};

// ---------------- the course ----------------
const courseSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const cx = cycX(id, t), sink = sinkAt(id, t), walk = walking(id, t);
  if (id !== 16) horse(out, cx, t, id >= 10 && by(t, T_CRACK) ? (id >= 11 ? "sheepish" : "wide") : "proud", walk, sink, id === 5 || id === 1 ? Math.sin(t * 3) * 0.5 + 0.5 : 0);
  if (sink > 0.005) { const g = clamp01(sink / 0.18); card(out, "hole", 500, 160, drawHole, cx, RTY + CYC_FLOOR - 0.06, TZ0 + CYC_W + 0.02, 2.8 * g, 0.36 * g); }
  if (id === 1) {
    engines(out, id, t);
    if (by(t, T_HORSE)) burst(out, [cx + 0.9, RTY + CYC_FLOOR + 2.0, TZ0 + 0.3], t, T_HORSE - 0.05, 1.3);
    crowd(cam, t, out, (j) => (by(t, T_RACE) ? (j % 2 ? "laugh" : "grin") : "smile"), by(t, T_WORLD) ? 1 : 0, 9);
    void T_STEAM;
  } else if (id === 2) {
    engines(out, id, t);
    const c = by(t, T_CROWDED);
    crowd(cam, t, out, (j) => (c ? (j % 3 ? "grin" : "laugh") : "smile"), c ? 1 : 0, 17);
    if (by(t, T_TEN)) burst(out, [0, Y + 4.5, -9], t, T_TEN - 0.05, 3.0);
    void T_RAINHILL; void T_LIVERPOOL;
  } else if (id === 3) {
    const [jx, , jz] = JUDGES, fv = by(t, T_FIVE);
    JUDGE.forEach((o, j) => front(cam, t, out, 1 + j, o, `j${j}`, jx - 0.9 + 0.9 * j, jz - 1.5, by(t, T_LOCO) ? (j === 1 ? "grin" : "smile") : fv ? "stern" : "neutral", { wave: j === 1 && by(t, T_LOCO) ? 0.7 : 0 }));
    const g = grow(t, T_FIVE - 0.1, 0.35);
    card(out, "purse", 240, 220, drawPurse, jx, Y + 0.84 + 0.24 * g, jz - 0.5, 0.52 * g, 0.48 * g);
    if (by(t, T_POUNDS)) burst(out, [jx, Y + 1.3, jz - 0.4], t, T_POUNDS - 0.05, 1.1);
    void T_RAILWAY;
  } else if (id === 4) {
    engines(out, id, t, by(t, T_HISSED) ? 1.1 : 0.7);
    if (by(t, T_FIRE)) {
      const n = f12(t), g = grow(t, T_FIRE, 0.25);
      card(out, `flame${n}`, 160, 200, (pn) => drawFlame(pn, n), ENG_X[1] - 1.2, RTY + 1.15, TZ1 + 0.6, 0.5 * g, 0.62 * g);
    }
    if (by(t, T_STEAM2)) burst(out, [ENG_X[2] + 1, RTY + 4.4, TZ1 + 0.3], t, T_STEAM2 - 0.05, 1.6, "#ffffff");
    void T_FOUR;
  } else if (id === 5) {
    engines(out, id, t);
    const [bx, , bz] = BRANDRETH, d = by(t, T_DIRECTOR);
    front(cam, t, out, 1, BRANDO, "brand", bx, bz, by(t, T_ITSELF) ? "laugh" : by(t, T_THOMAS) ? "grin" : "smile", { facing: -1, wave: d ? 0.75 : 0 });
    if (by(t, T_CYC)) burst(out, [cx, RTY + CYC_FLOOR + 1.6, TZ0 + 0.3], t, T_CYC - 0.05, 2.0);
    if (d) burst(out, [bx, Y + 2.3, bz + 0.1], t, T_DIRECTOR - 0.05, 0.9);
    void T_FIFTH;
  } else if (id === 6) {
    if (by(t, T_WALKED)) burst(out, [cx - 0.4, RTY + CYC_FLOOR + 0.2, TZ0 + CYC_W + 0.2], t, T_WALKED - 0.05, 0.8, "#ffe9a8");
    if (by(t, T_TURNED)) burst(out, [cx + 0.25, RTY + 0.75, TZ0 + CYC_W + 0.3], t, T_TURNED - 0.05, 1.0);
    void T_INSIDE;
  } else if (id === 7) {
    const items: [number, number, number][] = [[0, T_BOILER, -0.9], [1, T_COAL, 0.4]];
    items.forEach(([k, t0, dx]) => {
      const g = grow(t, t0 - 0.2, 0.3) * (1 - grow(t, T_JUST, 0.3)), u = q(clamp01((t - t0 + 0.07) / 0.3), 10);
      card(out, `no${k}${u}`, 240, 240, (pn) => drawNo(pn, k, u), cx + dx, RTY + CYC_FLOOR + 2.55, TZ0 + 1.2, 0.62 * g, 0.62 * g);
    });
    const og = grow(t, T_JUST, 0.3);
    card(out, "oats", 160, 160, drawOats, cx + 1.75, RTY + CYC_FLOOR + 1.0, TZ0 + 0.9, 0.42 * og, 0.42 * og);
    if (by(t, T_HORSE2)) burst(out, [cx + 1.0, RTY + CYC_FLOOR + 1.9, TZ0 + 0.4], t, T_HORSE2 - 0.05, 1.6);
  } else if (id === 8) {
    engines(out, id, t);
    const l = by(t, T_LAUGHED);
    crowd(cam, t, out, (j) => (l ? (j % 2 ? "laugh" : "grin") : "smile"), l ? 1 : 0, 12);
    front(cam, t, out, 1, BRANDO, "brand", 1.6 + 0.6 * smooth((t - T_MOVED) / 1.5), 2.2, by(t, T_BRAVELY) ? "laugh" : by(t, T_MOVED) ? "grin" : l ? "nervous" : "smile", { facing: 1, wave: by(t, T_MOVED) ? 0.6 : 0 });
    if (by(t, T_MOVED)) dust(out, [cx - 1.6, Y + 0.3, TZ0 + 0.9], t, T_MOVED - 0.05, 0.9);
    void T_CROWD; void T_MARCHING;
  } else if (id === 9) {
    const n = engX(0, 9, t);
    if (Math.abs(n) < 50) steam(out, 0, n, TZ1, t, 1.3, 2.2);
    if (n > -6 && n < 30) card(out, `speed${f12(t) % 4}`, 500, 200, (pn) => drawSpeed(pn, f12(t) % 4), n - 3.4, RTY + 1.2, TZ1, 2.6, 1.0);
    walker(cam, t, out, 2, BOY, "boy", cx + 0.9, TZ0 + 2.2, 1, 0, t * 2.0, by(t, T_SIX) ? "laugh" : "grin");
    void T_CREPT; void T_HOUR;
  } else if (id === 10) {
    if (by(t, T_CRACK)) { burst(out, [cx, RTY + CYC_FLOOR, TZ0 + 1.1], t, T_CRACK - 0.05, 1.6, "#ffe9a8"); dust(out, [cx, Y + 0.4, TZ0 + 1.2], t, T_CRACK, 1.2); }
    if (by(t, T_THROUGH)) {
      const u = clamp01((t - T_THROUGH + 0.07) / 0.6), v = q(u, 10);
      card(out, `spl${v}`, 300, 200, (pn) => drawSplinters(pn, v * 10), cx, RTY + CYC_FLOOR + 0.2 + 0.6 * Math.sin(Math.PI * u), TZ0 + 1.2, 1.4 * (1 - 0.5 * u), 0.9 * (1 - 0.5 * u));
      dust(out, [cx + 0.2, Y + 0.3, TZ0 + 1.3], t, T_THROUGH, 1.6, 0.8);
      burst(out, [cx + 0.6, RTY + CYC_FLOOR + 1.3, TZ0 + 0.6], t, T_FLOOR2 - 0.05, 1.8);
    }
    void T_THEN; void T_HORSE3;
  } else if (id === 11) {
    const [bx, , bz] = BRANDRETH;
    front(cam, t, out, 1, BRANDO, "brand", cx + bx + 0.4, bz - 0.2, by(t, T_OUT) ? "pained" : "shock", { facing: -1, wave: 1 });
    front(cam, t, out, 2, JUDGE[1], "j1", cx + 2.9, 1.9, "stern", { facing: -1, wave: by(t, T_OUT) ? 0.8 : 0.3 });
    const n = f12(t);
    card(out, `flag${n}`, 200, 160, (pn) => drawFlag(pn, n), cx + 3.2, Y + 2.35, 2.0, 0.7, 0.56);
    void T_CYC2;
  } else if (id === 13) {
    const drops: number[] = [T_WEIGHED - 0.5, T_WEIGHED, T_THREE];
    drops.forEach((t0, i) => {
      const u = clamp01((t - t0 + 0.3) / 0.3);
      if (t < t0 - 0.3) return;
      const yy = RTY + CYC_FLOOR + 0.4 + 3.5 * (1 - u * u);
      card(out, "weight", 220, 200, drawWeight, cx - 1.1 + 1.1 * i, yy, TZ0 + 0.75, 0.9, 0.82);
      if (u >= 1) dust(out, [cx - 1.1 + 1.1 * i, RTY + CYC_FLOOR + 0.1, TZ0 + 0.9], t, t0, 1.0, 0.5);
    });
    front(cam, t, out, 1, BRANDO, "brand", cx + 2.5, 2.4, by(t, T_TONS) ? "dazed" : by(t, T_WEIGHED) ? "shock" : "nervous", { facing: -1 });
    void T_WITH;
  } else if (id === 14) {
    steam(out, 1, ENG_X[1], TZ1, t, 1.2, 0.6);
    const [fx, , fz] = FIREMAN;
    front(cam, t, out, 1, FIREO, "fire", fx, fz, by(t, T_WORK) ? "laugh" : by(t, T_SACK) ? "grin" : "smile", { facing: 1, wave: by(t, T_COAL2) ? wave(t, 0, 5) : 0.4 });
    const n = f12(t), fg = grow(t, T_STRENGTH - 0.3, 0.3);
    card(out, `flame${n}`, 160, 200, (pn) => drawFlame(pn, n), ENG_X[1] - 1.2, RTY + 1.15, TZ1 + 0.6, 0.5 * fg, 0.62 * fg);
    const sg = grow(t, T_SACK - 0.25, 0.3);
    card(out, "sack", 180, 200, drawSack, fx + 0.75, Y + 0.45 * sg, fz + 0.35, 0.72 * sg, 0.8 * sg);
    const bg = grow(t, T_DAY - 0.8, 0.3), u = q(clamp01((t - (T_DAY - 0.75)) / 1.1), 32);
    card(out, `day${u}`, 420, 300, (pn) => drawDay(pn, u), fx + 0.9, Y + 2.85, fz + 0.4, 1.7 * bg, 1.2 * bg);
    void T_ENGINE;
  } else if (id === 15) {
    const rx = engX(1, 15, t);
    steam(out, 1, rx, TZ1, t, 1.4, 2.6);
    if (rx > -20 && rx < 30) card(out, `speed${f12(t) % 4}`, 500, 200, (pn) => drawSpeed(pn, f12(t) % 4), rx - 3.6, RTY + 1.3, TZ1, 3.0, 1.1);
    const w = by(t, T_WON);
    crowd(cam, t, out, (j) => (w ? (j % 2 ? "laugh" : "grin") : "shock"), w ? 1 : 0, 9);
    front(cam, t, out, 1, GEORGE, "george", -2.2, 2.6, w ? "laugh" : "grin", { wave: w ? wave(t, 1) : 0, facing: 1 });
    front(cam, t, out, 2, ROBERT, "robert", -1.1, 2.9, w ? "laugh" : "grin", { wave: w ? wave(t, 2) : 0, facing: 1 });
    if (by(t, T_THIRTY)) burst(out, [rx + 1, RTY + 2.6, TZ1 + 0.5], t, T_THIRTY - 0.05, 2.4);
    void T_ROCKET; void T_HOUR2;
  } else if (id === 17) {
    const rx = train17X(t);
    steam(out, 1, rx, TZ1, t, 1.2, 1.2);
    passengers(cam, t, out, rx, RTY, TZ1, by(t, T_ONLY));
    front(cam, t, out, 1, BRANDO, "brand", cx + 2.4, 2.0, by(t, T_FALLING) ? "laugh" : by(t, T_HISTORY) ? "grin" : "relief", { facing: -1, wave: by(t, T_LOSE) ? 0.7 : 0 });
    if (by(t, T_FLOOR3)) burst(out, [cx + 0.9, RTY + CYC_FLOOR + 1.2, TZ0 + 0.6], t, T_FLOOR3 - 0.05, 1.6);
    void T_BECAME;
  }
};
/** the passengers in the two carriages behind the Rocket at rx */
const passengers = (cam: CamInfo, t: number, out: Stage, rx: number, y0: number, z: number, waving: boolean) => {
  for (let k = 0; k < 2; k++) for (let s = 0; s < 3; s++) {
    const x = rx - 6.4 - 3.8 * k - 1.1 + 1.1 * s, j = k * 3 + s;
    sitter(cam, t, out, 40 + j, FOLK[(j + 2) % 8], `f${(j + 2) % 8}`, [x, y0 + 0.85, z], waving ? "laugh" : "grin", { wave: waving ? wave(t, j) : 0 });
  }
};

// ---------------- the road (analogy) ----------------
const roadSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const ax = autoX(t), a = by(t, T_PEDAL) ? (t - T_PEDAL) * 7 : 0, aq = q((a / (Math.PI * 2)) % 1, 16) * Math.PI * 2;
  const bg = 1;
  card(out, `bike${q(aq, 4)}`, 360, 300, (pn) => drawBike(pn, aq), ax - 0.9, Y + 0.95 + 0.55 * bg, 0.2, 1.3 * bg, 1.08 * bg);
  const tired = by(t, T_YOU), legs = by(t, T_LEGS);
  sitter(cam, t, out, 1, RIDER, "rider", [ax - 1.0, Y + 1.72, 0.3], tired ? "pained" : legs ? "nervous" : "grin", { wave: 0.4 });
  if (by(t, T_BOLTED)) {
    const g = grow(t, T_BOLTED, 0.25) * (1 - grow(t, T_LEGS - 0.3, 0.3));
    card(out, "bolt", 120, 120, drawBolt, ax - 1.5, Y + 1.25, 1.0, 0.34 * g, 0.34 * g);
    burst(out, [ax - 1.5, Y + 1.25, 1.0], t, T_BOLTED - 0.05, 0.8);
  }
  if (by(t, T_CAR)) burst(out, [ax + 0.8, Y + 1.6, 0.9], t, T_CAR - 0.05, 1.6);
  // the weight arrows: on the car, the bike, and you
  const arrows: [number, number, number][] = [[T_CAR2, ax + 0.9, Y + 2.2], [T_BIKE2, ax - 0.6, Y + 2.35], [T_YOU, ax - 1.0, Y + 3.25]];
  arrows.forEach(([t0, x, y]) => { const g = grow(t, t0, 0.25); card(out, "arrow", 140, 220, drawArrow, x, y + 0.25 * (1 - g), 0.9, 0.34 * g, 0.52 * g); });
  if (legs) { const n = f12(t) % 6, g = grow(t, T_LEGS, 0.3); card(out, `sweat${n}`, 200, 120, (pn) => drawSweat(pn, n), ax - 1.0, Y + 3.0, 0.6, 0.6 * g, 0.36 * g); }
  for (const [t0, x] of [[T_BIKE, ax - 0.6], [T_YOU, ax - 1.0]] as const) burst(out, [x, Y + 2.0, 0.9], t, t0 - 0.05, 1.0);
  if (by(t, T_TREAD)) burst(out, [ax - 0.9, Y + 2.0, 0.9], t, T_TREAD - 0.05, 1.2);
  void T_SEE; void cam; void KRT;
};

// ---------------- the country line ----------------
const countrySet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const rx = trainX(t), y0 = D0 + KRT;
  steam(out, 1, rx, 0, t, 1.3, 1.4, y0);
  passengers(cam, t, out, rx, y0, 0, by(t, T_MANCHESTER));
  if (by(t, T_TRAINS)) burst(out, [rx - 6.4, y0 + 2.4, 0.5], t, T_TRAINS - 0.05, 2.0);
  void T_YEAR; void KX;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "course") courseSet(id, t, cam, out);
  else if (s.scene === "road") roadSet(id, t, cam, out);
  else countrySet(id, t, cam, out);
  return out;
};
