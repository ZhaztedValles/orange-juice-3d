// The cast and hand-drawn props of the horse-flu story: New Yorkers (crews in blue caps, riders, onlookers) hauling the
// horse car on ropes, horses (side view, healthy or sick under a blanket, walking or standing; front-view heads over
// the stall doors), a pair of oxen, the stable hand, firemen, schoolchildren round one water bucket, Bostonians, and
// the smoke and flames of the fire. Every prop is an unlit ink-outlined drawing. vehicles() places the horse car, the
// cart and the fire engine; ropeEnds() gives the rope spans for world.ts.
import { Pen, townsfolk, KID, PARENT, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxPuff } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, NY, RAIL_Z, FH, STB, NSTALL, stallX, SCH, BUCKET, BOS, BURN, RUIN, carX, PULL_N, pullerP, engX, puffU, rowCough,
  T_COUGH1, T_COUGH2, T_ROPES, T_TWO, T_FIRE, T_SNIFF, T_ALL, V3, smooth, clamp01,
} from "./story";

const CREW: Outfit = { jacket: "#2f4a7a", pants: "#2c2f3a", boots: "#2a2220", hat: "cap", cap: "#2f4a7a", buttons: "#d9b45a", skin: SKINS[1] };
const CREW2: Outfit = { ...CREW, moustache: "#4a3426", skin: SKINS[0] };
const HAND: Outfit = { jacket: "#8a6a3e", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#6b5a3a", skin: SKINS[2], moustache: "#6b4a32" };
const FIRE: Outfit = { jacket: "#26314f", pants: "#26314f", boots: "#1e1a1c", hat: "cap", cap: "#b8332b", buttons: "#e8c45a", skin: SKINS[0], moustache: "#5a3b2a" };
const FIRE2: Outfit = { ...FIRE, moustache: undefined, skin: SKINS[3] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const KIDS: Outfit[] = [
  { ...KID, skin: SKINS[0] }, { ...KID, jacket: "#3f8f6a", cap: "#f2c14e", skin: SKINS[1] },
  { ...KID, jacket: "#c25a7a", hat: "bonnet", dress: "#d9a441", skin: SKINS[2] }, { ...KID, jacket: "#5a8fc2", hat: "hair", hair: "#5a3b2a", skin: SKINS[3] },
  { ...KID, jacket: "#e2a03c", hat: "bonnet", dress: "#5a8fc2", skin: SKINS[1] },
];
const TEACHER: Outfit = { ...PARENT, jacket: "#5a4a7a", dress: "#4a3f5e", hat: "bonnet", skin: SKINS[0] };
const COATS = ["#7a4a2c", "#5e3b26", "#a0703f", "#3a2a22", "#8c5a34", "#c49a6c"];
const INKC = "#241726";
const rad = (d: number) => (d * Math.PI) / 180;

// ---------------- drawings ----------------
type HorseOpts = { coat: string; sick: number; phase: number; blanket: string | null; flip: boolean; ox?: boolean; toss?: number };
/** a horse (or an ox) in side view on a 640 x 480 canvas, facing right (flip: left); hooves on y = 468 */
const drawHorse = (p: Pen, o: HorseOpts) => {
  const g = p.g;
  g.save();
  if (o.flip) { g.translate(640, 0); g.scale(-1, 1); }
  const coat = o.coat, dark = o.ox ? "#6a4a32" : "#2a1d1a", by = o.ox ? 262 : 250;
  // legs (far pair first): a walk swings them, hooves planted at the bottom
  const legs: [number, number, boolean][] = [[215, 0.5, false], [395, 0, false], [240, 0, true], [420, 0.5, true]];
  for (const [x, ph, near] of legs) {
    const s = o.phase >= 0 ? Math.sin((o.phase + ph) * Math.PI * 2) : 0, fx = x + 28 * s, lift = o.phase >= 0 ? Math.max(0, -Math.cos((o.phase + ph) * Math.PI * 2)) * 14 : 0;
    p.stroke([[x, by + 40], [x + 6 * s, by + 130], [fx, 462 - lift]], o.ox ? 30 : 24, near ? coat : mixDark(coat));
    p.ell(fx + 4, 466 - lift, 17, 9, dark, 4);
  }
  // tail
  p.line([[118, by - 40], [96, by + 40], [104, by + 120]], o.ox ? coat : dark, o.ox ? 12 : 22);
  if (o.ox) p.ell(104, by + 124, 12, 16, dark, 4);
  // neck and head: a sick animal hangs its head (rotate about the withers); the neck goes behind the body
  const droop = rad((o.ox ? 18 : 0) + 52 * o.sick - 8 * (o.toss ?? 0));
  p.rot = [droop, 420, by - 40];
  if (o.ox) p.poly([[380, by - 70], [470, by - 74], [500, by + 10], [400, by + 50]], coat, 8);
  else p.poly([[380, by - 30], [455, by - 168], [505, by - 150], [480, by + 20]], coat, 8);
  p.rot = null;
  // body
  p.ell(310, by, o.ox ? 190 : 175, o.ox ? 100 : 82, coat, 9);
  if (o.blanket) {
    p.poly([[205, by - 70], [420, by - 70], [430, by + 40], [195, by + 40]], o.blanket, 7);
    p.line([[205, by - 20], [425, by - 20]], "#f1e6c8", 7, false); p.line([[200, by + 18], [428, by + 18]], "#f1e6c8", 7, false);
  }
  p.rot = [droop, 420, by - 40];
  if (o.ox) {
    p.line([[500, by - 58], [494, by - 90], [512, by - 108]], "#f1ece1", 11); p.line([[540, by - 58], [552, by - 88], [572, by - 96]], "#f1ece1", 11);
    p.ell(520, by - 20, 58, 46, coat, 8);
    p.ell(560, by - 4, 28, 24, "#d8b496", 6);
  } else {
    p.poly([[440, by - 150], [470, by - 196], [505, by - 160]], mixDark(coat), 6); // ear
    p.poly([[470, by - 182], [560, by - 120], [578, by - 96], [560, by - 78], [482, by - 112]], coat, 8);
    p.ell(566, by - 96, 18, 15, "#4a3a36", 5);
    p.line([[400, by - 60], [450, by - 168], [478, by - 178]], dark, 16); // mane
  }
  // the eye: bright and round, or half-shut when sick
  const ex = o.ox ? 525 : 500, ey = o.ox ? by - 34 : by - 140;
  if (o.sick > 0.5) { p.stroke([[ex - 11, ey + 2], [ex + 11, ey + 2]], 7, INKC); p.stroke([[ex - 12, ey - 4], [ex + 10, ey - 9]], 5, INKC); }
  else { p.ell(ex, ey, 11, 11, "#ffffff", 4); p.dot(ex + 3, ey + 1, 6, INKC); }
  p.rot = null;
  g.restore();
};
const mixDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), k = 0.72;
  const r = Math.round(((n >> 16) & 255) * k), gg = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return "#" + [r, gg, b].map((v) => v.toString(16).padStart(2, "0")).join("");
};
/** a horse's head over the stall door, facing us (300 x 420): sick = head low, ears back, eyes half-shut */
const drawHead = (p: Pen, coat: string, blaze: boolean, sick: number) => {
  const dy = 70 * sick, ea = 30 * sick;
  p.poly([[96, 420], [104, 250 + dy], [196, 250 + dy], [204, 420]], coat, 8); // neck
  p.rot = [rad(-ea), 110, 120 + dy]; p.poly([[92, 136 + dy], [104, 60 + dy], [128, 128 + dy]], coat, 7); p.rot = null;
  p.rot = [rad(ea), 190, 120 + dy]; p.poly([[208, 136 + dy], [196, 60 + dy], [172, 128 + dy]], coat, 7); p.rot = null;
  p.poly([[96, 130 + dy], [204, 130 + dy], [192, 300 + dy], [176, 352 + dy], [124, 352 + dy], [108, 300 + dy]], coat, 8);
  if (blaze) p.poly([[140, 140 + dy], [160, 140 + dy], [170, 300 + dy], [130, 300 + dy]], "#f4efe6", 0);
  p.ell(150, 336 + dy, 40, 26, mixDark(coat), 6);
  p.dot(136, 338 + dy, 6, INKC); p.dot(164, 338 + dy, 6, INKC);
  p.poly([[110, 128 + dy], [150, 108 + dy], [190, 128 + dy], [150, 150 + dy]], "#2a1d1a", 0); // forelock
  for (const ex of [118, 182]) {
    if (sick > 0.5) { p.stroke([[ex - 12, 196 + dy], [ex + 12, 196 + dy]], 7, INKC); p.stroke([[ex - 12, 188 + dy], [ex + 12, 186 + dy]], 5, INKC); }
    else { p.ell(ex, 192 + dy, 12, 13, "#ffffff", 4); p.dot(ex, 194 + dy, 7, INKC); }
  }
};
/** the schoolroom water bucket with its dipper (200 x 200) */
const drawBucket = (p: Pen) => {
  p.poly([[40, 70], [160, 70], [148, 190], [52, 190]], "#9a6a3e", 7);
  p.line([[46, 110], [154, 110]], "#4a4850", 6); p.line([[50, 160], [150, 160]], "#4a4850", 6);
  p.ell(100, 70, 60, 14, "#7fb6d8", 6);
  p.line([[120, 66], [150, 20], [176, 12]], "#c9a047", 8);
};
/** a puff of smoke (400 x 400), shade 0 light grey .. 1 dark */
const drawSmoke = (p: Pen, seed: number, shade: number) => {
  const c = ["#d9d2cc", "#a9a1a2", "#6f6870"][Math.min(2, Math.round(shade * 2))];
  const r = (k: number) => ((seed * 97 + k * 31) % 17) / 17;
  for (let i = 0; i < 6; i++) p.ell(110 + 180 * r(i), 120 + 160 * r(i + 9), 70 + 40 * r(i + 3), 60 + 30 * r(i + 5), c, 0);
  p.ell(200, 210, 130, 110, c, 0);
};
/** flames on a roof (400 x 400), flicker frame k */
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

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = D0) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, o.build === "kid" ? 1 : 1));
  blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** someone walking along (dx, dz): side or front view picked from the camera, legs in step with the ground speed */
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, phase: number, expr: Expr, so: SideOpts = {}, y = D0) => {
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "march", phase: q(phase, 16), expr, blink: lidAt(t, i) }, { mode: "march", phase: q(phase, 16), expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs), ...so }, 1));
  blob(out, x, y, z, 1);
};
const horse = (out: Stage, key: string, x: number, z: number, o: HorseOpts, y = D0) => {
  const k = `${key}|${o.coat}|${q(o.sick, 6)}|${o.phase >= 0 ? q(o.phase, 12) : -1}|${o.blanket}|${o.flip}|${q(o.toss ?? 0, 4)}`;
  const w = o.ox ? 2.9 : 2.75, h = w * 0.75;
  out.fx.push({ key: k, cw: 640, ch: 480, draw: (p) => drawHorse(p, o), x, y: y + h / 2 - 0.03, z, w, h });
  blob(out, x - 0.6, y, z, 1.1); blob(out, x + 0.6, y, z, 1.1);
};
/** where a side-view horse's nose is (for its cough puff) */
const nose = (x: number, z: number, o: HorseOpts, y = D0): V3 => [x + (o.flip ? -1 : 1) * 1.1, y + (o.sick > 0.5 ? 0.9 : 1.6), z + 0.05];
const puff = (out: Stage, key: string, p: V3, t: number, t0: number, size = 0.6) => {
  const u = puffU(t, t0);
  if (u < 0) return;
  const uq = q(u, 10);
  out.fx.push({ key: `puff${uq}`, cw: 300, ch: 300, draw: (pn) => fxPuff(pn, uq), x: p[0], y: p[1] + 0.2 * u, z: p[2], w: size * (0.6 + 0.6 * u), h: size * (0.6 + 0.6 * u), soft: true });
  void key;
};
/** a column of smoke puffs rising from p: n puffs cycling upward, small where they start */
const smoke = (out: Stage, key: string, p: V3, t: number, n: number, rise: number, size: number, shade: number, k = 1) => {
  for (let i = 0; i < n; i++) {
    const u = (t * 0.07 + i / n) % 1, s = size * (0.15 + 0.85 * Math.sqrt(u)) * (1 - smooth((u - 0.75) / 0.25)) * k * smooth(u / 0.08); // grows from nothing, shrinks away at the top: no pop when it recycles
    if (s < 0.05) continue;
    out.fx.push({ key: `smoke${i % 4}_${shade}`, cw: 400, ch: 400, draw: (pn) => drawSmoke(pn, i % 4, shade), x: p[0] + 3 * u * Math.sin(i * 2.1) + 6 * u, y: p[1] + rise * u, z: p[2] - 2 * u, w: s, h: s * 0.9, soft: true });
  }
};

/** the vehicles: horse car (front at x), the cart, the fire engine (pole tip at x); null = not in the shot */
export const vehicles = (id: number, t: number): { car: V3 | null; cart: V3 | null; engine: V3 | null } => {
  const carIn = [1, 2, 5, 6, 14].includes(id);
  return {
    car: carIn ? [carX(id, t), D0 + 0.13, RAIL_Z] : null,
    cart: id === 2 ? [-12 + 3.2 * (t - 6.9), D0 + 0.08, -3.0] : null,
    engine: id === 12 ? [engX(t), D0 + 0.08, BOS[2]] : null,
  };
};
/** the rope spans: [from, to, slack 0..1] */
export const ropeEnds = (id: number, t: number): [V3, V3, number][] => {
  const out: [V3, V3, number][] = [];
  const hookOf = (x: number, z: number): V3 => [x + 1.0, D0 + 1.05, z];
  if (id === 1 || id === 6 || id === 14) {
    const fx = carX(id, t), slack = id === 6 ? 1 - 0.85 * smooth((t - T_ROPES + 0.15) / 0.3) : 0.12;
    const n = id === 14 ? 1 : PULL_N;
    for (let j = 0; j < n; j++) { const p = id === 14 ? ([fx + 2.4, D0, 0.3] as V3) : pullerP(fx, j); out.push([hookOf(fx, RAIL_Z), [p[0] - 0.12, D0 + 1.3, p[2]], slack]); }
  }
  if (id === 2 || id === 5) { // the traces to the horses' (or oxen's) collars
    const fx = carX(id, t);
    for (const sz of [-0.55, 0.55]) out.push([hookOf(fx, sz * 0.3), [fx + 2.0, D0 + (id === 5 ? 1.1 : 1.35), sz], 0.1]);
  }
  if (id === 12) {
    const ex = engX(t);
    for (let j = 0; j < PULL_N; j++) { const p = pullerP(ex - 1.0, j, BOS[2]); out.push([[ex - 0.3, D0 + 1.0, BOS[2] + (j % 2 ? 0.45 : -0.45)], [p[0] - 0.12, D0 + 1.3, p[2]], 0.1]); }
  }
  return out;
};

// ---------------- the places ----------------
const pullers = (cam: CamInfo, t: number, out: Stage, fx: number, z0: number, n: number, outfits: Outfit[], go: number, exprOf: (j: number) => Expr) => {
  for (let j = 0; j < n; j++) {
    const [x, , z] = pullerP(fx, j, z0);
    const o = outfits[j % outfits.length];
    if (go > 0) walker(cam, t, out, 10 + j, o, `pl${j}`, x, z, 1, 0, t * 1.25 + j * 0.23, exprOf(j));
    else front(cam, t, out, 10 + j, o, `pl${j}`, x, z, exprOf(j));
  }
};

const nySet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const golden = SHOTS[id - 1].light === "golden";
  const sickHorse: HorseOpts = { coat: COATS[1], sick: 1, phase: -1, blanket: "#a8322c", flip: true };
  if (id === 1) {
    const fx = carX(1, t);
    pullers(cam, t, out, fx, RAIL_Z, PULL_N, [CREW, FOLK[0], CREW2, FOLK[2], FOLK[4], CREW], 1, (j) => (j % 3 === 0 ? "pained" : j % 3 === 1 ? "stern" : "nervous"));
    horse(out, "sick", 4.6, 3.4, sickHorse, D0 + 0.08);
    puff(out, "h", nose(4.6, 3.4, sickHorse, D0 + 0.08), t, 6.05, 0.7);
    front(cam, t, out, 30, FOLK[1], "f1", 0.5, -6.0, "shock", {}, D0 + 0.18);
    front(cam, t, out, 31, FOLK[3], "f3", -2.0, -6.4, "laugh", {}, D0 + 0.18);
    front(cam, t, out, 32, FOLK[5], "f5", 3.5, -6.3, "nervous", {}, D0 + 0.18);
  } else if (id === 2) {
    const fx = carX(2, t), ph = t * 2.2;
    for (const [sz, c] of [[-0.55, COATS[0]], [0.55, COATS[3]]] as const) horse(out, `pair${sz}`, fx + 2.0, sz, { coat: c, sick: 0, phase: ph % 1, blanket: null, flip: false }, D0 + 0.08);
    const cx = -12 + 3.2 * (t - 6.9);
    horse(out, "cartH", cx + 1.7, -3.0, { coat: COATS[2], sick: 0, phase: (t * 1.8) % 1, blanket: null, flip: false }, D0 + 0.08);
    walker(cam, t, out, 33, FOLK[0], "f0", -10 + 1.2 * (t - 6.9), -6.2, 1, 0, t * 1.6, "smile", {}, D0 + 0.18);
    walker(cam, t, out, 34, FOLK[1], "f1", -2 - 1.1 * (t - 6.9), 6.9, -1, 0, t * 1.5 + 0.3, "smile_closed", {}, D0 + 0.18);
    front(cam, t, out, 35, FOLK[3], "f3", -7.5, 6.0, "laugh", {}, D0 + 0.18);
    front(cam, t, out, 36, FOLK[4], "f4", -6.6, 6.3, "smile", {}, D0 + 0.18);
    front(cam, t, out, 37, FOLK[5], "f5", 2.6, -6.4, "smile", {}, D0 + 0.18);
  } else if (id === 5) {
    const fx = carX(5, t);
    for (const [sz, c] of [[-0.6, "#c49a6c"], [0.6, "#a7825c"]] as const) horse(out, `ox${sz}`, fx + 2.1, sz, { coat: c, sick: 0, phase: (t * 0.45) % 1, blanket: null, flip: false, ox: true }, D0 + 0.08);
    front(cam, t, out, 40, CREW2, "crew2", fx + 0.35, 0.0, t < 23.4 ? "stern" : "pained", {}, D0 + 0.62);
    front(cam, t, out, 41, FOLK[2], "f2", -4.5, -5.9, "nervous", {}, D0 + 0.18);
    front(cam, t, out, 42, FOLK[1], "f1", -6.0, -6.3, "stern", {}, D0 + 0.18);
    front(cam, t, out, 43, FOLK[4], "f4", -3.2, 5.6, "pained", {}, D0 + 0.18);
  } else if (id === 6) {
    const fx = carX(6, t), go = t >= T_ROPES - 0.07 ? 1 : 0;
    pullers(cam, t, out, fx, RAIL_Z, PULL_N, [CREW, FOLK[1], FOLK[0], CREW2, FOLK[3], FOLK[4]], go, (j) => (go ? (j % 2 ? "pained" : "stern") : j % 2 ? "nervous" : "smile"));
    front(cam, t, out, 44, FOLK[5], "f5", fx - 1.0, -6.0, go ? "laugh" : "smile", {}, D0 + 0.18);
  } else if (id === 7) {
    for (let i = 0; i < 6; i++) {
      const well = i === 2 || i === 3, x = FH[0] - 3.6 + 1.75 * i, z = FH[2] + 5.6 + (i % 2) * 0.5;
      horse(out, `fh${i}`, x, z, { coat: COATS[i % 6], sick: well ? 0 : 1, phase: -1, blanket: well ? null : ["#a8322c", "#3f6b4a", "#5a5a8a"][i % 3], flip: false,
        toss: well ? 0.5 + 0.5 * Math.sin(t * 2.2 + i) : 0 }, D0 + 0.18);
    }
    front(cam, t, out, 50, FIRE, "fire", FH[0] - 4.8, FH[2] + 7.4, t < T_TWO ? "nervous" : "relief", {}, D0 + 0.18);
    front(cam, t, out, 51, FIRE2, "fire2", FH[0] + 6.8, FH[2] + 7.0, "pained", {}, D0 + 0.18);
  } else if (id === 14) {
    const fx = carX(14, t);
    walker(cam, t, out, 10, CREW, "pl0", fx + 2.4, 0.3, 1, 0, t * 1.5, t > 63.3 ? "grin" : "stern");
    horse(out, "sick", 1.0, -3.4, { ...sickHorse, sick: 0.7 }, D0 + 0.08);
    front(cam, t, out, 52, FOLK[3], "f3", 7.4, 6.2, "laugh", {}, D0 + 0.18);
  }
  void golden;
};

const stableSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  for (let k = 0; k < NSTALL; k++) {
    let sick = 0;
    if (id === 4) sick = 1;
    if (id === 11) sick = smooth((t - rowCough(k) - 0.3) / 0.6);
    const coat = COATS[(k * 5) % 6], x = stallX(k), dy = 0.0;
    const sq = q(sick, 6);
    out.fx.push({ key: `head|${coat}|${k % 3 === 0}|${sq}`, cw: 300, ch: 420, draw: (p) => drawHead(p, coat, k % 3 === 0, sq), x, y: D0 + 1.78 + dy, z: STB[2] - 0.14, w: 0.82, h: 1.15 });
    const nz: V3 = [x, D0 + 1.75 - 0.2 * sick, STB[2] + 0.2];
    if (id === 3 && k === 9) puff(out, "c1", nz, t, T_COUGH1, 0.6);
    if (id === 3 && (k === 7 || k === 8)) puff(out, "c2", nz, t, T_COUGH2 - 0.05 + 0.15 * (k - 7), 0.6);
    if (id === 11) puff(out, `r${k}`, nz, t, rowCough(k), 0.6);
  }
  if (id === 3 || id === 4) {
    const ex: Expr = id === 3 ? (t < T_COUGH2 - 0.07 ? "smile" : "shock") : "nervous";
    front(cam, t, out, 60, HAND, "hand", stallX(8) + 1.5, STB[2] + 1.7, ex, {}, D0 + 0.08);
  }
};

const schoolSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  out.fx.push({ key: "bucket", cw: 200, ch: 200, draw: drawBucket, x: BUCKET[0], y: D0 + 0.3, z: BUCKET[2], w: 0.6, h: 0.6 });
  blob(out, BUCKET[0], D0, BUCKET[2], 0.9);
  const spots: [number, number][] = [[-0.95, -0.5], [-0.4, -0.95], [0.35, -1.0], [0.95, -0.55], [1.25, 0.15]];
  for (let i = 0; i < 5; i++) {
    const [dx, dz] = spots[i], x = BUCKET[0] + dx, z = BUCKET[2] + dz;
    let ex: Expr = i % 2 ? "smile" : "grin";
    if (id === 10) {
      if (i === 2 && t >= T_SNIFF - 0.07) ex = "pained";
      if (t >= T_ALL - 0.07) ex = t < T_ALL + 0.8 ? "shock" : "pained";
      if (i === 2) puff(out, "k2", [x, D0 + 1.05, z + 0.25], t, T_SNIFF - 0.05, 0.4);
      if (i !== 2) puff(out, `k${i}`, [x, D0 + 1.05, z + 0.25], t, T_ALL - 0.05 + 0.04 * i, 0.4);
    }
    front(cam, t, out, 70 + i, KIDS[i], `kid${i}`, x, z, ex);
  }
  if (id === 9) {
    front(cam, t, out, 76, TEACHER, "teacher", SCH[0] - 1.4, SCH[2] - 3.4, "smile");
    walker(cam, t, out, 77, KIDS[1], "kid1", SCH[0] + 4 - 1.3 * (t - 36.3), SCH[2] + 3.2, -1, 0, t * 2, "laugh");
  }
};

const bostonSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 8 || id === 12) {
    const k = id === 8 ? smooth((t - T_FIRE + 0.07) / 1.2) : 1;
    const roof: V3 = [BURN[0], D0 + 0.18 + 6.6, BOS[2] - 8.2]; // the eaves of the house front: fire out of the top windows
    if (k > 0.01) {
      const fk = Math.floor(t * 8) % 4;
      out.fx.push({ key: `flames${fk}`, cw: 400, ch: 400, draw: (p) => drawFlames(p, fk), x: roof[0], y: roof[1] + 2.4 * k, z: roof[2], w: 6 * k, h: 4.4 * k });
    }
    smoke(out, "burn", [roof[0], roof[1] + 4, roof[2] - 2], t, 9, 30, 9, id === 8 ? 1 : 2, 0.35 + 0.65 * (id === 8 ? clamp01((t - 33.5) / 2) : 1));
  }
  if (id === 8) {
    const ex: Expr = t < T_FIRE - 0.07 ? "smile" : "shock";
    front(cam, t, out, 80, FOLK[0], "f0", BOS[0] + 18, BOS[2] + 0.2, ex, {}, D0 + 0.18);
    front(cam, t, out, 81, FOLK[1], "f1", BOS[0] + 19.6, BOS[2] - 0.8, ex, {}, D0 + 0.18);
    front(cam, t, out, 82, FOLK[4], "f4", BOS[0] + 21.2, BOS[2] + 0.4, t < T_FIRE - 0.07 ? "neutral" : "nervous", {}, D0 + 0.18);
  }
  if (id === 12) {
    const ex = engX(t);
    pullers(cam, t, out, ex - 1.0, BOS[2], PULL_N, [FIRE, FIRE2, FIRE, FOLK[2], FIRE2, FOLK[0]], 1, (j) => (j % 2 ? "pained" : "stern"));
  }
  if (id === 13) {
    const spots: [number, number][] = [[-14, -12], [-2, -6], [8, -14], [18, -4], [-8, 2], [26, -16]];
    spots.forEach(([dx, dz], i) => smoke(out, `r${i}`, [RUIN[0] + dx, D0 + 2, RUIN[2] + dz], t + i * 2.3, 5, 16, 6, 1));
  }
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "ny") nySet(id, t, cam, out);
  else if (s.scene === "stable") stableSet(id, t, cam, out);
  else if (s.scene === "school") schoolSet(id, t, cam, out);
  else bostonSet(id, t, cam, out);
  void NY; void T_ROPES;
  return out;
};
