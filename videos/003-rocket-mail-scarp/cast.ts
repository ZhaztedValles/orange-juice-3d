// The cast and hand-drawn props of the Scarp rocket story: Zucker the rocket fan, three officials, the island folk, the
// ignition and burst flashes, a scorch mark, a powder cross-section, the campfire (a log burns slowly, kindling flares)
// and the stamped envelope. Built on the card system in src/engine/cards.ts; every prop is an unlit ink-outlined drawing.
import { Pen, townsfolk, SKINS, Outfit, Expr, FrontOpts, fxBurst, fxPuff } from "../../src/engine/toon";
import { CamInfo, Stage, Who, hh, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import { D0, SNOW, SHOTS, IGNITE_T, BURST_T, RAIL_Z, rocketClock, rocketPos } from "./story";

export const ZUCKER: Outfit = { jacket: "#3d5a45", pants: "#4a4038", boots: "#2b2220", hat: "cap", cap: "#2f3b52", build: "adult", buttons: "#d8c070", skin: SKINS[0] };
const OFFICIAL = (v: number): Outfit => ({ jacket: ["#2f3342", "#3b3a30", "#40303a"][v % 3], pants: "#2b2d35", boots: "#1f1a18", hat: "tophat", build: "stout", buttons: "#e8c45a", moustache: ["#5a4636", "#2a201a", "#7a6a56"][v % 3], skin: SKINS[(v + 1) % 4] });
const OFFICIALS = [0, 1, 2].map(OFFICIAL);
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const LEAD = 2 / 30;
const INKC = "#241726";

// ---------------- drawings ----------------
const flame = (p: Pen, cx: number, base: number, w: number, h: number, ol: number) => {
  p.poly([[cx - w, base], [cx - w * 0.9, base - h * 0.45], [cx - w * 0.2, base - h * 0.6], [cx, base - h], [cx + w * 0.3, base - h * 0.6], [cx + w * 0.95, base - h * 0.4], [cx + w, base]], "#f08a2e", ol);
  p.poly([[cx - w * 0.55, base], [cx - w * 0.5, base - h * 0.3], [cx, base - h * 0.62], [cx + w * 0.5, base - h * 0.3], [cx + w * 0.55, base]], "#ffd25a", 0);
};
/** a campfire on a 500 x 500 canvas. kind 0: one thick log with small slow flames; kind 1: a pile of kindling; L = flame size 0..1 */
const drawFire = (p: Pen, kind: number, L: number) => {
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI; p.ell(250 - 170 * Math.cos(a), 440, 30, 20, "#8b8a88", 6); p.ell(250 + 170 * Math.cos(a) * 0 + (i - 3) * 55, 450, 30, 20, "#9d9b97", 6); }
  if (kind === 0) {
    p.poly([[90, 400], [410, 400], [420, 440], [80, 440]], "#7a4a2a", 9);
    p.ell(412, 420, 14, 22, "#c99a62", 6);
    for (let i = 0; i < 4; i++) flame(p, 140 + i * 75, 402, 34 + 8 * L, 46 + 60 * L + (i % 2) * 16, 6);
  } else {
    const sticks: [number, number, number, number][] = [[110, 440, 250, 330], [390, 440, 250, 330], [150, 440, 300, 345], [350, 440, 210, 345], [90, 440, 330, 380], [410, 440, 170, 380], [200, 440, 280, 300], [300, 440, 220, 300]];
    for (const [x0, y0, x1, y1] of sticks) p.line([[x0, y0], [x1, y1]], "#9a6a3a", 14);
    const n = 6;
    for (let i = 0; i < n; i++) flame(p, 120 + i * 52, 360 - (i % 2) * 20, 42 + 20 * L, 70 + 330 * L * (0.7 + 0.3 * ((i * 3) % 4) / 3), 7);
  }
};
/** the rocket in section, standing upright (360 x 700): packed powder, air gaps, and a flame racing through them; u 0..1 */
const drawPowder = (p: Pen, u: number) => {
  p.poly([[110, 640], [250, 640], [250, 170], [180, 70], [110, 170]], "#ece3cf", 10);
  p.poly([[110, 640], [250, 640], [250, 590], [110, 590]], "#b8372f", 8);
  const gaps: [number, number][] = [[150, 540], [215, 500], [140, 440], [210, 390], [160, 330], [205, 290], [150, 235], [200, 200]];
  for (let r = 0; r < 14; r++) for (let c = 0; c < 4; c++) p.ell(133 + c * 32 + (r % 2) * 10, 590 - r * 28, 9, 9, "#4a3b33", 0);
  gaps.forEach(([x, y], i) => {
    const lit = u > (640 - y) / 480;
    p.ell(x, y, 17, 21, lit ? "#ffd25a" : "#fdf9ee", 5);
    if (lit && u < 1) flame(p, x, y + 18, 15, 40 + 25 * ((i % 3) / 2), 4);
  });
  p.stroke([[40, 640], [320, 640]], 8, INKC);
};
/** envelope with a scorched corner and a round "damaged" stamp, 520 x 360; s = stamp progress 0..1 */
const drawLetter = (p: Pen, s: number) => {
  p.poly([[30, 60], [490, 60], [490, 320], [30, 320]], "#f4ecd8", 9);
  p.poly([[30, 60], [260, 210], [490, 60]], "#eadfc6", 7);
  p.poly([[390, 320], [490, 320], [490, 240], [440, 262], [420, 290]], "#5a4a3c", 0);
  p.poly([[390, 62], [490, 62], [490, 140]], "#6b5a4a", 0);
  p.poly([[380, 100], [470, 100], [470, 150], [380, 150]], "#8fb3a0", 5); // the stamp
  if (s > 0) {
    const r = 70 + 40 * (1 - s);
    p.ell(170, 230, r, r * 0.78, null, 10);
    p.poly([[130, 230], [170, 190], [210, 230], [170, 270]], "#c0353a", 6);
    p.ell(170, 230, r - 14, (r - 14) * 0.78, null, 5);
  }
};
/** a soot scorch mark on the sand (flat), 360 x 360 */
const drawScorch = (p: Pen) => { p.ell(180, 180, 150, 110, "#3b332d", 0); p.ell(170, 175, 100, 70, "#26211e", 0); };

// ---------------- staging ----------------
const personAt = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, sc = 1, extra: FrontOpts = {}) => {
  out.places.push(person(cam, { i, o, okey } as Who, x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, sc));
  blob(out, x, y, z, sc);
};

const beachSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const rt = rocketClock(id, t), after = rt >= BURST_T - LEAD;
  // Zucker
  let zx = -3.5, zz = -40, zex: Expr = "smile";
  if (id === 1) { zex = "dazed"; }
  else if (id === 3) zex = t < 15 ? "grin" : "smile";
  else if (id === 4) zex = "neutral";
  else if (id === 5) { zex = t < 28.6 ? "grin" : t < 29.9 ? "nervous" : "smile"; zx = -1.6; zz = -42; }
  else if (id === 6) { zex = t < 30.45 ? "smile" : "shock"; zx = -2.5; zz = -42; }
  else if (id === 9) zex = "pained";
  else if (id === 10) zex = "nervous";
  else if (id === 11) { zex = rt < BURST_T - LEAD ? "nervous" : "shock"; zx = -2.5; zz = -42; }
  else if (id === 12) { zex = "pained"; zx = -4.5; zz = -38; }
  else if (id >= 13) { zex = "dazed"; zx = -1.5; zz = -41; }
  personAt(cam, t, out, 1, ZUCKER, "zucker", zx, D0, zz, zex, 1.02);
  // the three officials
  if (id === 1 || (id >= 4 && id <= 6) || id === 11 || id === 12) {
    const arrive = id === 4 ? Math.min(1, Math.max(0, (t - 18.3) / 1.6)) : 1;
    OFFICIALS.forEach((o, k) => {
      const x = 4.6 + k * 2.3 + (1 - arrive) * 14, z = -38 - (k % 2) * 1.8;
      const ex: Expr = after ? "shock" : id === 4 ? "stern" : "neutral";
      personAt(cam, t, out, 20 + k, o, `o${k}`, x, D0, z, ex);
    });
  }
  // the island folk
  if (id === 1 || id === 2 || (id >= 4 && id <= 6) || id === 11 || id === 12 || id >= 13) {
    const n = id === 2 ? 4 : id >= 12 ? 9 : 11;
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, x = id === 2 ? 28 + i * 3 : side * (7 + hh(i, 1) * 9), z = id === 2 ? -37 - (i % 2) * 2 : -34 - hh(i, 2) * 14;
      const ex: Expr = after ? (id >= 13 ? "pained" : "shock") : id === 5 ? "nervous" : "neutral";
      const wave = id >= 12 && id <= 12 ? undefined : undefined;
      personAt(cam, t, out, 100 + i, FOLK[i % 6], `c${i % 6}`, x, D0, z, ex, 1, wave === undefined ? {} : { wave });
    }
  }
  // ignition exhaust spark and the burst flash
  const tI = IGNITE_T - LEAD;
  if (rt > 28.2 && rt < IGNITE_T && id === 5 && t >= 811 / 30) {
    const u = q(((t * 6) % 1), 6);
    out.fx.push({ key: `fuse${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#ffd25a", 8, 30, 120), x: 0.1, y: D0 + 1.0, z: RAIL_Z + 0.2, w: 0.7, h: 0.7 });
  }
  if (rt >= tI && rt < tI + 0.4 && id !== 1) {
    const u = q((rt - tI) / 0.4, 8), rp = rocketPos(Math.min(rt, BURST_T));
    out.fx.push({ key: `ign${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#ffe28a", 9, 40, 200), x: rp[0], y: rp[1] - 0.2, z: rp[2] - 1.9, w: 2.2, h: 2.2 });
  }
  const tB = BURST_T - LEAD;
  if (rt >= tB && rt < tB + 0.45 && id !== 1) {
    const u = q((rt - tB) / 0.45, 12), bp = rocketPos(BURST_T);
    out.fx.push({ key: `bst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff3b0", 12, 60, 240), x: bp[0], y: bp[1], z: bp[2], w: 4.2, h: 4.2 });
  }
  if (rt >= BURST_T && rt < BURST_T + 0.9 && id !== 1) {
    const u = q((rt - BURST_T) / 0.9, 12), bp = rocketPos(BURST_T);
    out.fx.push({ key: `pf${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: bp[0], y: D0 + 0.7, z: RAIL_Z + 1.4, w: 4.5, h: 4.5 });
  }
  if (after && id !== 1) out.fx.push({ key: "scorch", cw: 360, ch: 360, draw: drawScorch, x: 0, y: D0 + 0.025, z: RAIL_Z + 2.4, w: 3.2, h: 3.2, flat: true });
  // the powder in section
  if (id === 10) {
    const u = q(Math.min(1, Math.max(0, (t - 45.35) / 1.45)), 24);
    out.fx.push({ key: `pow${u}`, cw: 360, ch: 700, draw: (p) => drawPowder(p, u), x: 0, y: D0 + 1.8, z: -40, w: 1.5, h: 2.9 });
  }
  // the stamped envelope
  if (id === 12 && t >= 1650 / 30) {
    const u = q(Math.min(1, Math.max(0, (t - 55.0) / 0.3)), 8);
    out.fx.push({ key: `let${u}`, cw: 520, ch: 360, draw: (p) => drawLetter(p, u), x: 0.6, y: D0 + 1.0, z: -42, w: 1.05, h: 0.73 });
  }
};

const fireSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [sx, , sz] = SNOW;
  const a: Outfit = townsfolk(2), b: Outfit = { ...townsfolk(4), hat: "cap", cap: "#8c3b4a" };
  const t1 = 41.55 - LEAD; // "goes up" -> the pile flares
  const L = id === 7 ? 0.25 + 0.1 * Math.sin(t * 2.2) : Math.min(1, Math.max(0.1, (t - 40.2) / (t1 - 40.2 + 1e-6)) ** 2.2);
  const lq = q(L, 10);
  const kind = id === 7 ? 0 : 1;
  out.fx.push({ key: `fire${kind}_${lq}`, cw: 500, ch: 500, draw: (p) => drawFire(p, kind, lq), x: id === 7 ? sx - 1.2 : sx + 2.2, y: D0 + (id === 7 ? 0.95 : 1.15 + 0.6 * lq) - 0.1, z: sz + 0.2, w: id === 7 ? 1.9 : 2.3, h: id === 7 ? 1.9 : 2.3 + 1.2 * lq });
  personAt(cam, t, out, 200, a, "fa", sx - 2.7, D0, sz - 0.2, id === 7 ? (t < 37 ? "neutral" : "smile") : "neutral", 1);
  personAt(cam, t, out, 201, b, "fb", sx + 4.0, D0, sz - 0.2, id === 7 ? "neutral" : t < t1 ? "smile" : "shock", 1);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "fire") fireSet(id, t, cam, out); else beachSet(id, t, cam, out);
  return out;
};
