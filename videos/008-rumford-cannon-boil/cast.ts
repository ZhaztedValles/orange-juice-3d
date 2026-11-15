// The cast and hand-drawn props of the Rumford story: Count Rumford (blue coat, top hat), the arsenal workmen in caps,
// gunners and bystanders, two learned men in powdered wigs, the two horses walking the gin (side view, hitched at the
// sweep ends), a man on a cold morning rubbing his hands, and the effect cards: steam over the box, boiling bubbles,
// brass chips, heat ticks, the water splash, a look through a lens into the shaking brass, the scholars' flask of
// "fluid". Every prop is an unlit ink-outlined drawing.
import { Pen, townsfolk, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxPuff, fxCreak, fxSplash, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, BOX, WATER_Y, AX, GIN, GIN_R, ginAngle, ROW, NGUN, MOR, rumX, heatAt,
  T_FIRE, T_HOT, T_TOUCH, T_COLD, T_WARM, T_HAND, T_CROWD, T_BOIL, T_STARED, T_MOTION, T_WARM2, T_SHOOK, T_SHAKING, T_HEAT, T_FLUID, T_MORE,
  V3, smooth, clamp01,
} from "./story";

const G0 = D0 + 0.08; // yard cobbles
const RUM: Outfit = { jacket: "#2c3e6b", pants: "#e6dcc2", boots: "#2a2220", hat: "tophat", buttons: "#e8c45a", sash: "#c0353a", skin: SKINS[0] };
const WK1: Outfit = { jacket: "#8a6a3e", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#6b5a3a", skin: SKINS[2], moustache: "#6b4a32" };
const WK2: Outfit = { jacket: "#6a7a4a", pants: "#4a3f3a", boots: "#2a2220", hat: "cap", cap: "#3f4a6b", skin: SKINS[1] };
const WK3: Outfit = { jacket: "#9a4a3a", pants: "#3b3f52", boots: "#2a2220", hat: "cap", cap: "#5e3b26", skin: SKINS[3], moustache: "#3a2a22" };
const GUNNER: Outfit = { jacket: "#3a5a8a", pants: "#e6dcc2", boots: "#1e1a1c", hat: "cap", cap: "#2a3550", buttons: "#d9dde0", skin: SKINS[1] };
const SCI1: Outfit = { jacket: "#4a3a5e", pants: "#2f2d36", boots: "#1e1a1c", hat: "hair", hair: "#ece6da", buttons: "#d9b45a", skin: SKINS[0], build: "stout" };
const SCI2: Outfit = { jacket: "#3a4a3e", pants: "#2f2d36", boots: "#1e1a1c", hat: "hair", hair: "#e2dccf", skin: SKINS[2] };
const COLDMAN: Outfit = { jacket: "#7a3a3a", pants: "#3b3f52", boots: "#2a2220", hat: "cap", cap: "#3a4a6b", skin: SKINS[1] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const COATS = ["#7a4a2c", "#3a2a22"];
const INKC = "#241726";
const rad = (d: number) => (d * Math.PI) / 180;

// ---------------- drawings ----------------
type HorseOpts = { coat: string; phase: number; flip: boolean };
const mixDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), k = 0.72;
  const r = Math.round(((n >> 16) & 255) * k), gg = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return "#" + [r, gg, b].map((v) => v.toString(16).padStart(2, "0")).join("");
};
/** a horse in side view on a 640 x 480 canvas, facing right (flip: left), with its collar; hooves on y = 468 */
const drawHorse = (p: Pen, o: HorseOpts) => {
  const g = p.g;
  g.save();
  if (o.flip) { g.translate(640, 0); g.scale(-1, 1); }
  const coat = o.coat, dark = "#2a1d1a", by = 250;
  const legs: [number, number, boolean][] = [[215, 0.5, false], [395, 0, false], [240, 0, true], [420, 0.5, true]];
  for (const [x, ph, near] of legs) {
    const s = Math.sin((o.phase + ph) * Math.PI * 2), fx = x + 28 * s, lift = Math.max(0, -Math.cos((o.phase + ph) * Math.PI * 2)) * 14;
    p.stroke([[x, by + 40], [x + 6 * s, by + 130], [fx, 462 - lift]], 24, near ? coat : mixDark(coat));
    p.ell(fx + 4, 466 - lift, 17, 9, dark, 4);
  }
  p.line([[118, by - 40], [96, by + 40], [104, by + 120]], dark, 22);
  p.poly([[380, by - 30], [455, by - 168], [505, by - 150], [480, by + 20]], coat, 8);
  p.ell(310, by, 175, 82, coat, 9);
  p.poly([[430, by - 120], [470, by - 104], [470, by - 10], [440, by + 20], [418, by - 20]], "#6b4a2a", 7); // the collar
  p.poly([[440, by - 150], [470, by - 196], [505, by - 160]], mixDark(coat), 6);
  p.poly([[470, by - 182], [560, by - 120], [578, by - 96], [560, by - 78], [482, by - 112]], coat, 8);
  p.ell(566, by - 96, 18, 15, "#4a3a36", 5);
  p.line([[400, by - 60], [450, by - 168], [478, by - 178]], dark, 16);
  p.ell(500, by - 140, 11, 11, "#ffffff", 4); p.dot(503, by - 139, 6, INKC);
  g.restore();
};
/** a puff of steam (400 x 400): soft white lobes */
const drawSteam = (p: Pen, seed: number) => {
  const r = (k: number) => ((seed * 97 + k * 31) % 17) / 17;
  for (let i = 0; i < 6; i++) p.ell(110 + 180 * r(i), 120 + 160 * r(i + 9), 70 + 40 * r(i + 3), 60 + 30 * r(i + 5), "rgba(250,248,244,0.85)", 0);
  p.ell(200, 210, 130, 110, "rgba(250,248,244,0.85)", 0);
};
/** boiling bubbles on the water, drawn top-down (400 x 400), frame k */
const drawBubbles = (p: Pen, k: number, n: number) => {
  for (let i = 0; i < n; i++) {
    const u = ((k * 0.37 + i * 0.61) % 1), x = 40 + ((i * 131) % 320), y = 40 + ((i * 197) % 320), r = 6 + 16 * Math.sin(u * Math.PI);
    p.ell(x, y, r, r, "rgba(236,246,252,0.9)", 3);
  }
};
/** a brass chip curl (120 x 120) */
const drawChip = (p: Pen, k: number) => { p.arc(60, 60, 34, 24, 20 + k * 40, 300 + k * 40, 12, "#e0b45a"); };
/** a bucket (200 x 200) */
const drawBucket = (p: Pen) => {
  p.poly([[40, 70], [160, 70], [148, 190], [52, 190]], "#9a6a3e", 7);
  p.line([[46, 110], [154, 110]], "#4a4850", 6); p.line([[50, 160], [150, 160]], "#4a4850", 6);
  p.ell(100, 70, 60, 14, "#7fb6d8", 6);
  p.arc(100, 70, 64, 70, 180, 360, 6, "#4a4850");
};
/** two hands rubbing together (400 x 300): u = rub phase -1..1; motion ticks on both sides */
const drawRub = (p: Pen, u: number, skin: string, warm: number) => {
  const o = 26 * u;
  p.ell(170 + o, 150, 70, 46, skin, 8, 0, 360, -12);
  p.ell(230 - o, 160, 70, 46, skin, 8, 0, 360, 12);
  p.ell(128 + o, 128, 20, 14, skin, 6, 0, 360, -50); p.ell(272 - o, 138, 20, 14, skin, 6, 0, 360, 50); // thumbs
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.stroke([[200 + s * (120 + 16 * k), 110 + 40 * k], [200 + s * (150 + 16 * k), 104 + 40 * k]], 7, INKC);
  if (warm > 0.05) for (let k = 0; k < 3; k++) p.line([[150 + 50 * k, 90], [140 + 50 * k, 60 - 20 * warm], [156 + 50 * k, 30 - 30 * warm]], "#ff9a4a", 8 * warm + 2);
};
/** the look inside the brass (600 x 600): a magnifying lens, a grid of balls shaking with amplitude amp, frame k */
const drawAtoms = (p: Pen, amp: number, k: number) => {
  const g = p.g;
  p.line([[460, 460], [560, 560]], "#5e3b26", 34);
  p.ell(300, 300, 230, 230, "#f2dca0", 14);
  g.save(); g.beginPath(); g.ellipse(300, 300, 222, 222, 0, 0, Math.PI * 2); g.clip();
  const hot = clamp01(amp / 26);
  for (let iy = 0; iy < 7; iy++) for (let ix = 0; ix < 7; ix++) {
    const j = ix * 7 + iy, a = Math.sin(k * 2.7 + j * 1.9) * amp, b = Math.cos(k * 3.1 + j * 2.3) * amp;
    const col = hot > 0.6 ? "#e8a040" : hot > 0.3 ? "#d8a848" : "#c49a48";
    p.ell(120 + ix * 60 + a, 120 + iy * 60 + b, 22, 22, col, 5);
  }
  g.restore();
  p.ell(300, 300, 230, 230, null, 16);
  if (amp > 4) for (let i = 0; i < 6; i++) { const an = rad(i * 60 + k * 9), r0 = 250; p.stroke([[300 + r0 * Math.cos(an), 300 + r0 * Math.sin(an)], [300 + (r0 + 20 + amp) * Math.cos(an), 300 + (r0 + 20 + amp) * Math.sin(an)]], 8, INKC); }
};
/** the scholars' flask of "heat fluid" (240 x 320): a glass flask with an orange glow inside */
const drawFlask = (p: Pen) => {
  p.poly([[100, 30], [140, 30], [140, 130], [210, 280], [30, 280], [100, 130]], "rgba(214,236,246,0.9)", 8);
  p.poly([[78, 200], [162, 200], [196, 270], [44, 270]], "#ffab4a", 0);
  p.line([[90, 230], [120, 214], [150, 230]], "#ffd27a", 8, false);
  p.poly([[94, 14], [146, 14], [146, 34], [94, 34]], "#8a5a34", 6);
};

/** text-free "no fire" mark (400 x 400): a flame under a bold red cross */
const drawNoFire = (p: Pen) => {
  const g = p.g;
  g.beginPath(); g.moveTo(200, 360); g.bezierCurveTo(90, 350, 90, 230, 170, 150); g.bezierCurveTo(180, 210, 210, 220, 205, 60);
  g.bezierCurveTo(300, 140, 320, 330, 200, 360); g.closePath(); g.fillStyle = "#f08a3a"; g.fill(); g.lineWidth = 12; g.strokeStyle = INKC; g.stroke();
  p.ell(205, 290, 40, 55, "#ffd25a", 0);
  for (const [a, b] of [[[70, 70], [330, 330]], [[330, 70], [70, 330]]] as const) { p.stroke([a as unknown as [number, number], b as unknown as [number, number]], 52, INKC); p.stroke([a as unknown as [number, number], b as unknown as [number, number]], 36, "#d8342c"); }
};
const noFire = (out: Stage) => out.fx.push({ key: "nofire", cw: 400, ch: 400, draw: drawNoFire, x: (BOX.x0 + BOX.x1) / 2, y: G0 + 0.27, z: 0.2, w: 0.42, h: 0.42 });

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = G0) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  blob(out, x, y, z, 1);
};
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, phase: number, expr: Expr, so: SideOpts = {}, y = G0) => {
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "march", phase: q(phase, 16), expr, blink: lidAt(t, i) }, { mode: "march", phase: q(phase, 16), expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs), ...so }, 1));
  blob(out, x, y, z, 1);
};
/** someone who walks from a to b over [t0, t1], then stands */
const arrive = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, a: [number, number], b: [number, number], t0: number, t1: number, expr: Expr, standExpr: Expr, extra: FrontOpts = {}) => {
  if (t >= t1) return front(cam, t, out, i, o, okey, b[0], b[1], standExpr, extra);
  const u = clamp01((t - t0) / (t1 - t0)), x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
  walker(cam, t, out, i, o, okey, x, z, b[0] - a[0], b[1] - a[1], t * 1.6 + i * 0.3, expr);
};

/** the two gin horses, hitched at the sweep ends, walking the circle */
const ginHorses = (cam: CamInfo, t: number, out: Stage) => {
  const th = ginAngle(t);
  for (let k = 0; k < 2; k++) {
    const s = k ? -1 : 1, ex = GIN[0] + s * GIN_R * Math.cos(th), ez = GIN[2] + s * GIN_R * Math.sin(th);
    const tx = -s * Math.sin(th), tz = s * Math.cos(th); // walking direction
    const x = ex + tx * 0.9 + (ex - GIN[0]) * 0.08, z = ez + tz * 0.9 + (ez - GIN[2]) * 0.08;
    const flip = tx * cam.right.x + tz * cam.right.z < 0;
    const o: HorseOpts = { coat: COATS[k], phase: ((th * GIN_R) / 1.7) % 1, flip };
    const key = `horse|${o.coat}|${q(o.phase, 12)}|${flip}`;
    out.fx.push({ key, cw: 640, ch: 480, draw: (p) => drawHorse(p, { ...o, phase: q(o.phase, 12) }), x, y: G0 + 2.06 / 2 - 0.03, z, w: 2.75, h: 2.06 });
    blob(out, x - 0.6 * tx, G0, z - 0.6 * tz, 1.1); blob(out, x + 0.6 * tx, G0, z + 0.6 * tz, 1.1);
  }
};
/** steam rising from the box: k 0..1 how much */
const steam = (out: Stage, t: number, k: number) => {
  if (k < 0.03) return;
  const n = 4 + Math.round(6 * k), cx = (BOX.x0 + BOX.x1) / 2;
  for (let i = 0; i < n; i++) {
    const u = (t * (0.12 + 0.1 * k) + i / n) % 1, s = (0.4 + 1.6 * k) * (0.2 + 0.8 * Math.sqrt(u)) * (1 - smooth((u - 0.7) / 0.3)) * smooth(u / 0.1);
    if (s < 0.04) continue;
    out.fx.push({ key: `steam${i % 4}`, cw: 400, ch: 400, draw: (pn) => drawSteam(pn, i % 4), x: cx + 0.5 * Math.sin(i * 2.1) * (0.3 + u) + 0.4 * u, y: WATER_Y + 0.15 + (1.2 + 2.6 * k) * u, z: 0.3 * Math.cos(i * 1.7), w: s, h: s * 0.9, soft: true });
  }
};
const bubbles = (out: Stage, t: number, k: number) => {
  const fk = Math.floor(t * 10) % 8, n = Math.round(22 * smooth((k - 0.5) / 0.5));
  if (n < 1) return;
  out.fx.push({ key: `bub${fk}_${n}`, cw: 400, ch: 400, draw: (p) => drawBubbles(p, fk, n), x: (BOX.x0 + BOX.x1) / 2, y: WATER_Y + 0.012, z: 0, w: BOX.x1 - BOX.x0 - 0.2, h: BOX.z1 - BOX.z0 - 0.2, flat: true });
};
const chips = (out: Stage, t: number) => {
  for (let i = 0; i < 5; i++) {
    const u = (t * 0.9 + i / 5) % 1, ck = i % 3;
    out.fx.push({ key: `chip${ck}`, cw: 120, ch: 120, draw: (p) => drawChip(p, ck), x: 0.6 + 0.12 * Math.sin(i * 2.3), y: AX - 0.2 - 0.85 * u * u, z: 0.18 + 0.1 * i / 5, w: 0.09, h: 0.09 });
  }
};
const heatOf = (id: number, t: number) => ([1, 9, 10, 12, 13, 14].includes(id) ? 1 : id < 5 ? 0 : heatAt(t));

// ---------------- the places ----------------
const yardSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  ginHorses(cam, t, out);
  const h = heatOf(id, t);
  steam(out, t, id === 13 ? 0.75 + 0.25 * smooth((t - T_MORE + 0.07) / 1.0) : h >= 1 ? 0.75 : h);
  bubbles(out, t, h);
  if (id === 1) {
    front(cam, t, out, 1, RUM, "rum", -1.2, 1.3, t < T_FIRE - 0.07 ? "smile" : "grin");
    if (t < 132 / 30) front(cam, t, out, 20, WK1, "wk1", 2.3, 1.1, "shock");
    else noFire(out);
  } else if (id === 2) {
    walker(cam, t, out, 1, RUM, "rum", rumX(t), ROW[2] + 3.2, 1, 0, t * 1.4, "smile");
    for (let i = 0; i < 3; i++) {
      const x = ROW[0] + (i * 2 - 1.5) * 3.0 + 1.5, ex: Expr = t > rumX(t) - x + 5.3 && rumX(t) > x - 1.5 ? "grin" : "neutral";
      front(cam, t, out, 22 + i, GUNNER, `gun${i}`, x, ROW[2] + 0.9, ex);
    }
    void NGUN;
  } else if (id === 3) {
    chips(out, t);
    front(cam, t, out, 20, WK1, "wk1", 4.1, 1.2, "stern");
    front(cam, t, out, 21, WK2, "wk2", -1.6, -5.2, "smile");
    front(cam, t, out, 1, RUM, "rum", -1.6, 1.6, "smile");
  } else if (id === 4) {
    chips(out, t);
    const hot = t >= T_HOT - 0.07, ouch = t >= T_TOUCH - 0.07;
    front(cam, t, out, 1, RUM, "rum", -1.9, 0.9, ouch ? "shock" : hot ? "nervous" : "neutral", ouch ? { wave: 1 } : { wave: -0.2 });
    if (hot) { const u = ((t - T_HOT) * 1.6) % 1; out.fx.push({ key: `creak${q(u, 10)}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, q(u, 10)), x: -1.95, y: AX + 0.75, z: 0.2, w: 0.7, h: 0.7 }); }
    if (ouch && t < T_TOUCH + 0.6) {
      const u = q((t - T_TOUCH + 0.07) / 0.6, 10);
      out.fx.push({ key: `burst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#ffb04a"), x: -1.7, y: AX + 0.35, z: 0.45, w: 0.8, h: 0.8 });
    }
  } else if (id === 5) {
    front(cam, t, out, 1, RUM, "rum", -1.1, 1.3, "smile", { wave: 0.3 });
    if (t < 689 / 30) front(cam, t, out, 20, WK1, "wk1", 2.0, 1.0, "stern");
    if (t < 689 / 30) out.fx.push({ key: "bucket", cw: 200, ch: 200, draw: drawBucket, x: 1.45, y: BOX.y1 + 0.12, z: 0.75, w: 0.5, h: 0.5, rot: q(0.9 * smooth((t - T_COLD + 0.8) / 0.4), 10) });
    else out.fx.push({ key: "bucket", cw: 200, ch: 200, draw: drawBucket, x: 2.5, y: G0 + 0.25, z: 1.6, w: 0.5, h: 0.5 });
    if (t >= T_COLD - 0.5 && t < T_COLD + 0.5) {
      const u = q((t - T_COLD + 0.5) / 1.0, 12);
      out.fx.push({ key: `splash${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, u), x: 0.7, y: WATER_Y + 0.3, z: 0.2, w: 1.0, h: 1.0 });
    }
  } else if (id === 6) {
    front(cam, t, out, 1, RUM, "rum", -1.2, 1.4, "smile");
    front(cam, t, out, 21, WK2, "wk2", 0.5, 1.15, t < T_WARM - 0.07 ? "neutral" : "smile");
    front(cam, t, out, 22, WK3, "wk3", -2.0, -5.0, "neutral");
  } else if (id === 7) {
    const ouch = t >= T_HAND - 0.07;
    front(cam, t, out, 21, WK2, "wk2", 0.5, 1.15, ouch ? "shock" : "nervous", ouch ? { wave: 1 } : {});
    if (ouch && t < T_HAND + 0.7) { const u = q((t - T_HAND + 0.07) / 0.7, 10); out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: 0.9, y: WATER_Y + 0.25, z: 0.75, w: 0.7, h: 0.7, soft: true }); }
  } else if (id === 8) {
    const boil = t >= T_BOIL - 0.07, ex = (calm: Expr): Expr => (boil ? "shock" : calm);
    front(cam, t, out, 1, RUM, "rum", -1.3, 1.3, boil ? "grin" : "smile");
    front(cam, t, out, 21, WK2, "wk2", 0.5, 1.2, ex("nervous"));
    arrive(cam, t, out, 20, WK1, "wk1", [5.5, 2.5], [2.0, 1.2], 32.3, T_CROWD + 0.6, "neutral", ex("nervous"));
    arrive(cam, t, out, 22, WK3, "wk3", [4.5, -3.5], [1.6, -1.2], 32.6, T_CROWD + 0.9, "neutral", ex("neutral"));
    arrive(cam, t, out, 23, FOLK[0], "f0", [6.5, 0.5], [2.6, 0.2], 32.4, T_CROWD + 1.1, "smile", ex("smile"));
    arrive(cam, t, out, 24, FOLK[3], "f3", [-4.0, 3.5], [-0.4, 1.9], 32.5, T_CROWD + 0.8, "smile", ex("neutral"));
  } else if (id === 9) {
    if (t < 1128 / 30) { noFire(out); return; }
    const ex: Expr = t >= T_STARED - 0.07 ? "shock" : "nervous";
    front(cam, t, out, 1, RUM, "rum", -1.3, 1.3, "grin");
    front(cam, t, out, 21, WK2, "wk2", 0.0, 1.7, ex);
    front(cam, t, out, 20, WK1, "wk1", 1.1, 1.5, ex);
    front(cam, t, out, 23, FOLK[0], "f0", 2.0, 1.2, ex);
    front(cam, t, out, 24, FOLK[3], "f3", -0.7, 2.0, ex);
  } else if (id === 10) {
    if (t >= T_MOTION - 0.07) { const u = ((t - T_MOTION) * 2) % 1; out.fx.push({ key: `creak${q(u, 10)}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, q(u, 10)), x: 0.4, y: BOX.y1 + 0.5, z: 0.4, w: 0.6, h: 0.6 }); }
    front(cam, t, out, 20, WK1, "wk1", 2.6, 1.1, "smile");
  } else if (id === 12) {
    const amp = 3 + 20 * smooth((t - T_SHOOK + 0.07) / 1.8) + 6 * smooth((t - T_SHAKING + 0.07) / 0.5), fk = Math.floor(t * 30) % 24;
    const ak = Math.round(amp);
    out.fx.push({ key: `atoms${ak}_${fk}`, cw: 600, ch: 600, draw: (p) => drawAtoms(p, ak, fk / 2), x: -0.4, y: AX + 0.95, z: 0.75, w: 1.15, h: 1.15 });
    front(cam, t, out, 1, RUM, "rum", -1.9, 1.3, t >= T_HEAT - 0.07 ? "grin" : "smile");
    void T_SHAKING;
  } else if (id === 13) {
    const flask = true;
    front(cam, t, out, 30, SCI1, "sci1", 1.5, 1.9, t < T_FLUID - 0.07 ? "stern" : "smile");
    if (flask) out.fx.push({ key: "flask", cw: 240, ch: 320, draw: drawFlask, x: 1.5 + 0.40, y: G0 + 0.6, z: 2.0, w: 0.3, h: 0.4 });
    front(cam, t, out, 31, SCI2, "sci2", 2.5, 1.6, t < T_MORE - 0.07 ? "stern" : "shock");
    front(cam, t, out, 1, RUM, "rum", -1.2, 1.5, "smile");
  } else if (id === 14) {
    front(cam, t, out, 1, RUM, "rum", -0.9, 1.5, "grin");
    front(cam, t, out, 21, WK2, "wk2", 0.5, 1.4, "laugh");
    front(cam, t, out, 20, WK1, "wk1", 2.1, 1.1, "smile");
    front(cam, t, out, 30, SCI1, "sci1", 3.0, 0.2, "relief");
    front(cam, t, out, 23, FOLK[0], "f0", -2.4, 0.9, "laugh");
  }
};

const streetSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  // a cold morning: breath puffs, the hands rubbing, then warm
  const x = MOR[0], z = 5.9, y = D0 + 0.18, warm = smooth((t - T_WARM2 + 0.07) / 0.8);
  front(cam, t, out, 40, COLDMAN, "cold", x, z, warm > 0.5 ? "relief" : "pained", { prop: "icecream" }, y);
  const tb = (t - 43.0) % 1.5;
  if (tb < 0.7) { const u = q(tb / 0.7, 10); out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: x + 0.35, y: y + 1.75 + 0.1 * u, z: z + 0.2, w: 0.45, h: 0.45, soft: true }); }
  const rub = q(Math.sin((t - 43.8) * Math.PI * 2 * 2.2), 8) * smooth((t - 43.82) / 0.2);
  const wk = q(warm, 4);
  out.fx.push({ key: `rub${rub}_${wk}`, cw: 400, ch: 300, draw: (p) => drawRub(p, rub, COLDMAN.skin!, wk), x: x + 0.05, y: y + 1.05, z: z + 0.25, w: 0.5, h: 0.375 });
  front(cam, t, out, 41, FOLK[1], "f1", x - 6, -6.2, "neutral", {}, y);
  void id;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "yard") yardSet(id, t, cam, out);
  else streetSet(id, t, cam, out);
  return out;
};
export type { V3 };
