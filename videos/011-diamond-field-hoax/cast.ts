// The cast and hand-drawn props of the diamond hoax: the cousins Arnold (brown coat, cap) and Slack (grey coat, grey
// whiskers), the San Francisco bankers in top hats, Tiffany (white whiskers), the engineer Janin (blue coat, the
// blindfold) and the geologist King (olive field coat); the gems (diamonds and rubies), the leather bag, the price card,
// the money bags, the dug patches, the ruby in the anthill, King's board of the two rocks, the apple, banana and coconut
// under the bush with the second kid's basket, King's letter with its stamp, the field's signpost and a tumbleweed.
// Every prop is an unlit ink-outlined drawing; cards that arrive mid-shot grow in over a few frames (never pop).
import { Pen, KID, SKINS, Outfit, Expr, FrontOpts } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, hh, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, FIELD, ANTS, DESK, BANK, BUSH, SIGN, DIGS, V3, smooth, clamp01, leadAt, kingAt, salterAt,
  T_SPRINKLED, T_DIAMONDS, T_NOT, T_WANTED, T_TIFFANY, T_HUNDRED, T_EYES, T_PICKING, T_REAL, T_GOT, T_DUG, T_ANTHILLS, T_RUBY,
  T_HOLE, T_SEE, T_DIA2, T_RUBIES2, T_NEVER, T_APPLE, T_BANANA, T_COCONUT, T_SOMEONE, T_CHEAP, T_FRAUD, T_SHUT, T_DFIELD, T_NOT2,
} from "./story";

const ARNOLD: Outfit = { jacket: "#7a5434", pants: "#4a3f36", boots: "#2a2220", hat: "cap", cap: "#6a4a30", moustache: "#4a3020", skin: SKINS[1] };
const SLACK: Outfit = { jacket: "#5f6270", pants: "#3a3a44", boots: "#2a2220", hat: "cap", cap: "#3a3a40", moustache: "#9a948c", skin: SKINS[0] };
const BANKERS: Outfit[] = [
  { jacket: "#26283a", pants: "#2e3040", boots: "#1e1a1c", hat: "tophat", moustache: "#4a3020", buttons: "#d9b45a", skin: SKINS[0] },
  { jacket: "#4a2e36", pants: "#2e3040", boots: "#1e1a1c", hat: "tophat", skin: SKINS[2] },
  { jacket: "#2f4a52", pants: "#34363f", boots: "#1e1a1c", hat: "tophat", moustache: "#2a201a", skin: SKINS[1] },
  { jacket: "#3a3446", pants: "#2e3040", boots: "#1e1a1c", hat: "tophat", moustache: "#8a8480", skin: SKINS[0] },
  { jacket: "#5a4a32", pants: "#34363f", boots: "#1e1a1c", hat: "tophat", skin: SKINS[3] },
  { jacket: "#283a4a", pants: "#2e3040", boots: "#1e1a1c", hat: "tophat", moustache: "#4a3426", skin: SKINS[2] },
];
const TIFFANY: Outfit = { jacket: "#2a2a36", pants: "#30303a", boots: "#1e1a1c", hat: "hair", hair: "#d8d4cc", moustache: "#d8d4cc", buttons: "#d9b45a", skin: SKINS[0] };
const JANIN: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#3a2a20", moustache: "#3a2a20", skin: SKINS[2] };
const KING: Outfit = { jacket: "#6b6a3c", pants: "#5a4a3a", boots: "#3a2a20", hat: "cap", cap: "#7a6a4a", moustache: "#6a4a2c", skin: SKINS[1] };
const KIDO: Outfit = { ...KID, jacket: "#5a8fc2", hat: "hair", hair: "#5a3b2a", skin: SKINS[1] };
const KID2: Outfit = { ...KID, jacket: "#d9a441", cap: "#3f6fb5", skin: SKINS[3] };
const INKC = "#241726";

// ---------------- drawings ----------------
/** one gem (128 x 128): kind 0 a rough pale diamond, 1 a ruby; a white glint */
const drawGem = (p: Pen, kind: number) => {
  const col = kind ? "#d8344a" : "#dff2fb", dk = kind ? "#9a1f34" : "#9cc4d8";
  p.poly([[64, 12], [108, 44], [96, 104], [32, 104], [20, 44]], col, 8);
  p.poly([[64, 12], [76, 48], [52, 48]], dk, 0);
  p.line([[20, 44], [108, 44]], INKC, 4, false); p.line([[52, 48], [32, 104]], INKC, 4, false); p.line([[76, 48], [96, 104]], INKC, 4, false);
  p.ell(46, 32, 7, 7, "#ffffff", 0);
};
/** a glint (128 x 128): a four-point star, size 0..1 */
const drawGlint = (p: Pen, s: number) => {
  const r = 18 + 44 * s, w = 8 + 6 * s;
  p.poly([[64, 64 - r], [64 + w, 64 - w], [64 + r, 64], [64 + w, 64 + w], [64, 64 + r], [64 - w, 64 + w], [64 - r, 64], [64 - w, 64 - w]], "#fffbe6", 4);
};
/** the leather bag (240 x 240), open = gems spilling over the lip */
const drawBag = (p: Pen, open: boolean) => {
  p.poly([[60, 90], [180, 90], [216, 196], [190, 228], [50, 228], [24, 196]], "#8a5a34", 9);
  p.poly([[70, 70], [170, 70], [180, 96], [60, 96]], "#6a4224", 8);
  p.line([[64, 84], [176, 84]], "#3a2416", 6, false);
  if (open) for (let i = 0; i < 6; i++) p.ell(80 + i * 16, 70 - (i % 2) * 10, 10, 9, i % 3 ? "#dff2fb" : "#d8344a", 4);
};
/** the pile of rough diamonds on the desk (300 x 160) */
const drawPile = (p: Pen) => {
  for (let i = 0; i < 16; i++) { const x = 40 + ((i * 53) % 220), y = 120 - ((i * 37) % 60); p.poly([[x, y - 18], [x + 16, y - 4], [x + 10, y + 14], [x - 10, y + 14], [x - 16, y - 4]], i % 5 === 2 ? "#d8344a" : "#dff2fb", 4); }
};
/** the price card (360 x 200): $150,000 in ink on cream */
const drawPrice = (p: Pen) => {
  p.poly([[16, 30], [344, 16], [344, 184], [16, 184]], "#f6ecd2", 9);
  p.dot(40, 100, 12, INKC);
  const g = p.g; g.font = "bold 82px Georgia, serif"; g.fillStyle = "#2a5a32"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$150,000", 192, 106);
};
/** a money bag (240 x 260) with a dollar sign */
const drawMoney = (p: Pen) => {
  p.poly([[96, 60], [144, 60], [204, 150], [196, 236], [44, 236], [36, 150]], "#c9b48a", 9);
  p.line([[92, 66], [148, 66]], "#6a4224", 10, false);
  p.poly([[100, 20], [140, 20], [146, 58], [94, 58]], "#c9b48a", 8);
  const g = p.g; g.font = "bold 110px Georgia, serif"; g.fillStyle = "#2a5a32"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", 120, 160);
};
/** a dug patch (256 x 256): dark turned earth with clods (flat on the ground) */
const drawDig = (p: Pen) => {
  p.ell(128, 128, 118, 104, "#8a6440", 0);
  p.ell(128, 128, 96, 82, "#6e4c30", 0);
  for (let i = 0; i < 9; i++) p.ell(60 + ((i * 47) % 140), 70 + ((i * 29) % 120), 12, 9, "#9c7450", 0);
};
/** the hole at the anthill's top with the ruby at its bottom (200 x 200) */
const drawAntHole = (p: Pen, glow: number) => {
  p.ell(100, 110, 56, 40, "#4a2c1c", 6);
  p.ell(100, 120, 34, 22, "#2a1810", 0);
  p.poly([[100, 96], [124, 112], [118, 136], [82, 136], [76, 112]], "#d8344a", 6);
  p.ell(92, 108, 5, 5, "#ffffff", 0);
  if (glow > 0.02) p.ell(100, 116, 40 + 30 * glow, 30 + 22 * glow, `rgba(255,240,200,${(0.35 * glow).toFixed(2)})`, 0);
};
/** King's board (480 x 420): two rocks far apart, a dark volcanic pipe holding diamonds, pale marble holding rubies;
 *  hd / hr 0..1 light up each rock, x 0..1 draws the cross between them */
const drawRocks = (p: Pen, hd: number, hr: number, x: number) => {
  p.poly([[10, 10], [470, 10], [470, 410], [10, 410]], "#2f3b34", 10);
  p.poly([[40, 300], [70, 120], [140, 90], [200, 130], [210, 300]], hd > 0.02 ? "#4a5068" : "#3d4256", 8); // the dark pipe rock
  for (let i = 0; i < 5; i++) { const cx = 90 + (i % 3) * 40, cy = 160 + Math.floor(i / 2) * 50; p.poly([[cx, cy - 14], [cx + 12, cy - 2], [cx + 8, cy + 12], [cx - 8, cy + 12], [cx - 12, cy - 2]], "#dff2fb", 4); }
  p.poly([[270, 300], [280, 140], [350, 100], [430, 150], [440, 300]], hr > 0.02 ? "#f2e4dc" : "#ddd0c8", 8); // the pale marble
  for (let i = 0; i < 5; i++) { const cx = 310 + (i % 3) * 40, cy = 170 + Math.floor(i / 2) * 45; p.poly([[cx, cy - 14], [cx + 12, cy - 2], [cx + 8, cy + 12], [cx - 8, cy + 12], [cx - 12, cy - 2]], "#d8344a", 4); }
  for (const [h, cx] of [[hd, 125], [hr, 355]] as const) if (h > 0.02) p.arc(cx, 200, 100 + 6 * h, 120 + 6 * h, 0, 360, 4 + 6 * h, "#ffe08a");
  if (x > 0.02) { const L = 34 * x; p.stroke([[240 - L, 200 - L], [240 + L, 200 + L]], 14, "#e8563a"); p.stroke([[240 + L, 200 - L], [240 - L, 200 + L]], 14, "#e8563a"); }
  p.line([[30, 350], [450, 350]], "#d9d2c4", 6, false);
};
/** the fruit (200 x 200): 0 apple, 1 banana, 2 coconut */
const drawFruit = (p: Pen, k: number) => {
  if (k === 0) { p.ell(100, 112, 66, 62, "#d8342c", 8); p.line([[100, 52], [108, 22]], "#5a3a22", 8, false); p.ell(126, 36, 20, 10, "#5d9a3a", 5); p.ell(78, 92, 12, 16, "#f08a7a", 0); }
  else if (k === 1) { const g = p.g; g.beginPath(); g.moveTo(24, 70); g.quadraticCurveTo(100, 190, 182, 70); g.quadraticCurveTo(100, 140, 24, 70); g.closePath(); g.fillStyle = "#f2d24a"; g.fill(); g.lineWidth = 8; g.strokeStyle = INKC; g.stroke(); p.dot(182, 68, 8, "#5a3a22"); }
  else { p.ell(100, 104, 78, 74, "#7a5032", 8); for (const [x, y] of [[80, 70], [112, 66], [96, 92]]) p.dot(x, y, 9, "#3a2416"); p.line([[46, 120], [70, 160]], "#5a3a22", 5, false); }
};
/** the second kid's basket (260 x 200) */
const drawBasket = (p: Pen) => {
  p.poly([[20, 70], [240, 70], [210, 190], [50, 190]], "#c9944e", 8);
  for (let y = 96; y < 190; y += 24) p.line([[36, y], [226, y]], "#8a5a2a", 4, false);
  p.arc(130, 70, 96, 64, 180, 360, 9, "#8a5a2a");
  p.ell(96, 66, 22, 20, "#d8342c", 6); p.ell(150, 62, 24, 22, "#7a5032", 6);
};
/** King's letter (300 x 380), stamp 0..1 brings the red FRAUD stamp in */
const drawLetter = (p: Pen, stamp: number) => {
  p.poly([[16, 16], [284, 24], [284, 364], [16, 364]], "#f6f0de", 8);
  for (let k = 0; k < 9; k++) p.line([[40, 60 + 30 * k], [256 - ((k * 37) % 70), 60 + 30 * k]], "#7a7c90", 4, false);
  if (stamp > 0.02) {
    const g = p.g; g.save(); g.translate(150, 200); g.rotate(-0.25); g.scale(0.6 + 0.4 * stamp, 0.6 + 0.4 * stamp);
    g.globalAlpha = Math.min(1, stamp * 1.4); g.strokeStyle = "#c8282c"; g.lineWidth = 10; g.strokeRect(-128, -44, 256, 88);
    g.font = "bold 72px Georgia, serif"; g.fillStyle = "#c8282c"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("FRAUD", 0, 4);
    g.restore();
  }
};
/** a sign board (520 x 180) with painted words */
const drawBoard = (p: Pen, text: string, bg: string, fg: string) => {
  p.poly([[10, 18], [510, 10], [510, 170], [10, 166]], bg, 10);
  const g = p.g; g.font = "bold 78px Georgia, serif"; const sz = Math.min(78, Math.floor(78 * 450 / g.measureText(text).width)); g.font = `bold ${sz}px Georgia, serif`; g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 260, 94);
};
/** a tumbleweed (256 x 256) */
const drawWeed = (p: Pen) => {
  p.ell(128, 128, 104, 96, null, 8);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.line([[128 + 30 * Math.cos(a), 128 + 30 * Math.sin(a)], [128 + 100 * Math.cos(a + 0.6), 128 + 92 * Math.sin(a + 0.6)]], "#9a7a4a", 6, false); }
  p.arc(128, 128, 64, 60, 0, 360, 6, "#a8885a");
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
/** a card that grows in from t0 over 0.25 s (scale 0 -> 1, the drawing never changes, so no frame jumps) */
const grow = (t: number, t0: number, d = 0.25) => smooth((t - t0 + 0.07) / d);
const gem = (out: Stage, x: number, y: number, z: number, kind: number, s = 0.12) => {
  if (s > 0.004) out.fx.push({ key: `gem${kind}`, cw: 128, ch: 128, draw: (p) => drawGem(p, kind), x, y: y + s / 2, z, w: s, h: s });
};
const glint = (out: Stage, x: number, y: number, z: number, s: number, size = 0.3) => {
  const sq = q(s, 8);
  if (sq > 0) out.fx.push({ key: `glint${sq}`, cw: 128, ch: 128, draw: (p) => drawGlint(p, sq), x, y, z, w: size, h: size, soft: true });
};
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number) => {
  if (w > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h });
};

// ---------------- the places ----------------
/** the salted acre: dug patches and the gems lying in them */
const acre = (out: Stage, gems = true) => {
  DIGS.forEach(([x, z, r], i) => {
    out.fx.push({ key: "dig", cw: 256, ch: 256, draw: drawDig, x: FIELD[0] + x, y: D0 + 0.012 + 0.002 * i, z: FIELD[2] + z, w: 2 * r, h: 1.8 * r, flat: true, rot: i * 0.7 });
    if (gems) for (let k = 0; k < 3; k++) gem(out, FIELD[0] + x + (hh(i, k) - 0.5) * r, D0, FIELD[2] + z + (hh(i, k + 5) - 0.5) * r * 0.8, (i + k) % 3 === 0 ? 1 : 0, 0.09);
  });
};

const fieldSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 1) { // the bankers in the salted field; behind them the two cousins sprinkling gems from their bags
    acre(out);
    const ex: Expr[] = ["grin", "laugh", "smile"];
    [[-0.8, -1.4], [1.4, -1.9], [0.3, -2.8]].forEach(([x, z], i) => front(cam, t, out, 10 + i, BANKERS[i], `bk${i}`, x, D0, z, t < 3.0 ? "smile" : ex[i], i === 1 ? { wave: q(0.5 + 0.3 * Math.sin(t * 5), 6) } : {}));
    glint(out, 0.6, D0 + 0.2, 0.4, 0.5 + 0.5 * Math.sin(t * 4), 0.35);
    glint(out, 1.9, D0 + 0.2, -1.4, 0.5 + 0.5 * Math.sin(t * 4 + 2), 0.3);
    for (const [k, o, x, z] of [[0, ARNOLD, -5.4, -2.6], [1, SLACK, -6.4, -2.0]] as const) {
      front(cam, t, out, 1 + k, o, k ? "slack" : "arnold", x, D0, z, t >= T_SPRINKLED - 0.07 ? "grin" : "smile_closed", { wave: 0.25 });
      card(out, "bag0", 240, 240, (p) => drawBag(p, false), x + 0.36, D0 + 0.95, z + 0.12, 0.3, 0.3);
      for (let g = 0; g < 4; g++) { const u = (t * 1.3 + g / 4) % 1; gem(out, x + 0.42 + 0.05 * Math.sin(g * 2), D0 + 0.85 * (1 - u * u), z + 0.14, g % 2, 0.08); }
    }
    return;
  }
  if (id === 5) { // the blindfolded engineer led across the flat
    const ws: [Outfit, string, number, number, Expr][] = [[ARNOLD, "arnold", 0, 0, "smile_closed"], [JANIN, "janin", 0.5, 0.8, "nervous"], [SLACK, "slack", 1.0, -0.8, "smile"]];
    ws.forEach(([o, k, lag, dx], i) => {
      const p = leadAt(t, lag), pp: V3 = [p[0] + dx, p[1], p[2]], moving = t < 19.0 + lag + 6.2;
      walker(cam, t, out, [1, 20, 2][i], o, k, pp, 5.5, 9, moving, ws[i][4]);
      if (k === "janin") { // the blindfold: a white band over the eyes, a touch toward the lens
        const dxc = cam.pos.x - pp[0], dzc = cam.pos.z - pp[2], n = Math.hypot(dxc, dzc) || 1;
        out.fx.push({ key: "blindfold", cw: 256, ch: 64, draw: (pn) => { pn.poly([[6, 14], [250, 8], [250, 52], [6, 56]], "#f2ede0", 6); }, x: pp[0] + (dxc / n) * 0.2, y: D0 + 1.53, z: pp[2] + (dzc / n) * 0.2, w: 0.36, h: 0.09 });
      }
    });
    void T_EYES;
    return;
  }
  if (id === 6) { // picking gems out of the dirt; Janin says it is real; the cousins with the money
    acre(out);
    const jx = 0.4, jz = -1.6;
    front(cam, t, out, 20, JANIN, "janin", jx, D0, jz, t < T_PICKING - 0.07 ? "stern" : t < T_REAL - 0.07 ? "shock" : "grin", t >= T_REAL - 0.07 ? { wave: 0.6 } : {});
    front(cam, t, out, 12, BANKERS[2], "bk2", 1.9, D0, -2.3, t < T_PICKING - 0.07 ? "smile" : "laugh");
    front(cam, t, out, 13, BANKERS[3], "bk3", -1.0, D0, -2.6, t < T_REAL - 0.07 ? "smile" : "grin");
    const gu = grow(t, T_PICKING);
    gem(out, jx + 0.36, D0 + 0.98, jz + 0.12, 0, 0.12 * gu);
    glint(out, jx + 0.36, D0 + 1.1, jz + 0.14, gu * (0.6 + 0.4 * Math.sin(t * 6)), 0.32);
    front(cam, t, out, 1, ARNOLD, "arnold", -3.4, D0, -0.2, t < T_GOT - 0.07 ? "smile_closed" : "laugh");
    front(cam, t, out, 2, SLACK, "slack", -4.4, D0, -0.6, t < T_GOT - 0.07 ? "smile" : "grin");
    const mu = grow(t, T_GOT, 0.3);
    card(out, "money", 240, 260, drawMoney, -3.0, D0 + 0.98, -0.05, 0.36 * mu, 0.39 * mu);
    card(out, "money", 240, 260, drawMoney, -4.0, D0 + 0.98, -0.45, 0.36 * mu, 0.39 * mu);
    return;
  }
  if (id === 7) { // King walks in
    acre(out, false);
    const p = kingAt(t);
    walker(cam, t, out, 30, KING, "king", p, 3.2, 12.4, t < 36.0, "stern");
    return;
  }
  if (id === 8) { // King at the dug patches; the anthill with its ruby
    acre(out, false);
    front(cam, t, out, 30, KING, "king", -0.9, D0, -1.7, t < T_DUG - 0.07 ? "stern" : t < T_HOLE - 0.07 ? "nervous" : "shock");
    const g = clamp01((t - T_RUBY + 0.07) / 0.4) * (0.7 + 0.3 * Math.sin(t * 6));
    const gq = q(g, 10);
    out.fx.push({ key: `anthole${gq}`, cw: 200, ch: 200, draw: (p) => drawAntHole(p, gq), x: ANTS[0], y: D0 + 0.33, z: ANTS[2] + 0.02, w: 0.2, h: 0.2 });
    for (let k = 0; k < 6; k++) { // ants wandering on the hill
      const a = t * 0.9 + k * 1.05, r = 0.12 + 0.18 * hh(k, 3);
      out.fx.push({ key: "ant", cw: 64, ch: 64, draw: (p) => { p.ell(32, 32, 14, 9, INKC, 0); p.ell(14, 30, 8, 7, INKC, 0); }, x: ANTS[0] + r * Math.cos(a), y: D0 + 0.3 - 0.45 * r, z: ANTS[2] + 0.18 + r * Math.sin(a) * 0.4, w: 0.035, h: 0.035 });
    }
    void T_ANTHILLS;
    return;
  }
  if (id === 9) { // the pivot: King's board of the two rocks
    const hd = q(smooth((t - T_DIA2 + 0.07) / 0.3), 8), hr = q(smooth((t - T_RUBIES2 + 0.07) / 0.3), 8), x = q(smooth((t - T_NEVER + 0.07) / 0.3), 8);
    out.fx.push({ key: `rocks${hd}_${hr}_${x}`, cw: 480, ch: 420, draw: (p) => drawRocks(p, hd, hr, x), x: 2.6, y: D0 + 1.35, z: -1.55, w: 1.2, h: 1.05 });
    front(cam, t, out, 30, KING, "king", 1.45, D0, -0.9, t < T_SEE + 0.3 ? "stern" : t < T_NEVER - 0.07 ? "smile" : "grin", { wave: 0.7 });
    return;
  }
  if (id === 11) { // dusk: the cousins walk the acre throwing stones
    acre(out, false);
    for (const [k, o, key] of [[0, ARNOLD, "arnold"], [1, SLACK, "slack"]] as const) {
      const p = salterAt(t, k);
      walker(cam, t, out, 1 + k, o, key, p, 7, 0.6, t < 59.2, t >= T_CHEAP - 0.07 ? "grin" : "smile_closed");
      for (let g = 0; g < 3; g++) { // stones in flight from the hand to the ground, ahead of each man
        const u = (t * 1.1 + g / 3 + k * 0.5) % 1;
        gem(out, p[0] + 0.3 + 1.2 * u, D0 + 1.0 + 0.6 * u - 1.6 * u * u, p[2] + 0.25, (g + k) % 2, 0.08);
      }
    }
    return;
  }
  // id 13: the empty field and its sign, a tumbleweed rolling by
  acre(out, false);
  const dq = q(smooth((t - T_DFIELD + 0.07) / 0.3), 1);
  void dq;
  out.fx.push({ key: "signDF", cw: 520, ch: 180, draw: (p) => drawBoard(p, "DIAMOND FIELD", "#c9944e", "#3a2416"), x: SIGN[0], y: D0 + 1.62, z: SIGN[2] + 0.09, w: 1.3, h: 0.45 });
  const wx = -6 + 1.6 * (t - 62.7), wr = -(t - 62.7) * 1.6 / 0.4;
  out.fx.push({ key: "weed", cw: 256, ch: 256, draw: drawWeed, x: wx, y: D0 + 0.4 + 0.08 * Math.abs(Math.sin(t * 4)), z: SIGN[2] + 1.2, w: 0.8, h: 0.8, rot: wr });
  void T_NOT2;
};

const officeSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [dx, , dz] = DESK, fy = D0 + 0.08;
  if (id === 2) {
    front(cam, t, out, 10, BANKERS[0], "bk0", dx, fy, dz - 0.8, t < T_DIAMONDS - 0.07 ? "smile" : t < T_NOT - 0.07 ? "shock" : "nervous");
    front(cam, t, out, 1, ARNOLD, "arnold", dx - 0.8, fy, dz + 0.95, t < T_NOT - 0.07 ? "smile" : "smile_closed");
    front(cam, t, out, 2, SLACK, "slack", dx + 0.85, fy, dz + 1.0, t < T_NOT - 0.07 ? "smile" : "whistle");
    card(out, "bag1", 240, 240, (p) => drawBag(p, true), dx - 0.35, D0 + 0.82 + 0.15, dz + 0.1, 0.3, 0.3);
    const u = grow(t, T_DIAMONDS, 0.3);
    card(out, "pile", 300, 160, drawPile, dx + 0.15, D0 + 0.82 + 0.08 * u, dz + 0.15, 0.5 * u, 0.27 * u);
    if (u > 0.5) glint(out, dx + 0.2, D0 + 0.98, dz + 0.2, 0.5 + 0.5 * Math.sin(t * 5), 0.25);
    return;
  }
  if (id === 4) { // Tiffany at his table, the loupe, the price
    const tx = DESK[0] - 2.4, tz = -2.1;
    front(cam, t, out, 40, TIFFANY, "tiff", tx, fy, tz, t < T_HUNDRED - 0.07 ? "stern" : "shock");
    for (let k = 0; k < 5; k++) gem(out, tx - 0.3 + k * 0.14, D0 + 0.8, -1.05 + 0.08 * (k % 2), k === 2 ? 1 : 0, 0.08);
    card(out, "loupe", 128, 128, (p) => { p.ell(64, 64, 44, 44, "#c9dbe6", 10); p.line([[96, 96], [124, 124]], INKC, 12, false); }, tx + 0.28, D0 + 1.32, tz + 0.2, 0.13, 0.13);
    const u = grow(t, T_HUNDRED, 0.3);
    card(out, "price", 360, 200, drawPrice, tx + 0.45, D0 + 1.05, -0.95, 0.54 * u, 0.3 * u);
    void T_TIFFANY;
    return;
  }
  // id 12: the bankers read King's letter
  const st = smooth((t - T_FRAUD + 0.07) / 0.15), sq = q(st, 4), slump = t >= T_SHUT - 0.07;
  front(cam, t, out, 10, BANKERS[0], "bk0", dx, fy, dz - 0.8, t < T_FRAUD - 0.07 ? "stern" : slump ? "pained" : "shock");
  front(cam, t, out, 14, BANKERS[1], "bk1", dx + 1.3, fy, dz - 0.5, t < T_FRAUD - 0.07 ? "nervous" : "shock");
  front(cam, t, out, 15, BANKERS[5], "bk5", dx - 1.3, fy, dz - 0.4, t < T_FRAUD - 0.07 ? "stern" : slump ? "dazed" : "shock");
  out.fx.push({ key: `letter${sq}`, cw: 300, ch: 380, draw: (p) => drawLetter(p, sq), x: dx + 0.05, y: D0 + 1.15, z: dz - 0.25, w: 0.4, h: 0.5 });
};

const streetSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [bx, , bz] = BANK;
  card(out, "signBank", 520, 180, (p) => drawBoard(p, "BANK", "#2f4a52", "#f2d78a"), bx, D0 + 6.5, bz - 3.0, 2.9, 1.0);
  const cheer = t >= T_WANTED - 0.07;
  for (let i = 0; i < 6; i++) {
    const x = bx - 3.0 + i * 1.2 + (i % 2) * 0.2, z = bz - 1.4 + (i % 3) * 0.8;
    front(cam, t, out, 10 + i, BANKERS[i], `bk${i}`, x, D0 + 0.08, z, cheer ? (i % 2 ? "laugh" : "grin") : "smile", cheer && i % 2 === 0 ? { wave: q(0.5 + 0.4 * Math.sin(t * 7 + i), 4) } : {});
  }
  void id;
};

const bushSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [ux, , uz] = BUSH, gy = D0 + 0.04;
  const fr: [number, number, number, number][] = [[0, -0.22, 0.35, T_APPLE], [1, 0.16, 0.45, T_BANANA], [2, 0.52, 0.3, T_COCONUT]];
  fr.forEach(([k, x, z], i) => card(out, `fruit${k}`, 200, 200, (p) => drawFruit(p, k), ux + x, gy + (k === 1 ? 0.07 : 0.11), uz + z, k === 1 ? 0.28 : 0.22, k === 1 ? 0.14 : 0.22 - 0.0 * i));
  let ex: Expr = "smile";
  if (t >= T_APPLE - 0.07) ex = "shock";
  if (t >= T_COCONUT - 0.07) ex = "dazed";
  if (t >= T_SOMEONE - 0.07) ex = "laugh";
  front(cam, t, out, 50, KIDO, "kid", ux - 0.62, gy, uz + 0.4, ex);
  front(cam, t, out, 51, KID2, "kid2", ux + 1.25, gy, uz - 0.6, t >= T_SOMEONE - 0.07 ? "grin" : "whistle", { wave: 0.5 });
  card(out, "basket", 260, 200, drawBasket, ux + 1.55, gy + 0.62, uz - 0.5, 0.42, 0.32);
  void id;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "field") fieldSet(id, t, cam, out);
  else if (s.scene === "office") officeSet(id, t, cam, out);
  else if (s.scene === "street") streetSet(id, t, cam, out);
  else bushSet(id, t, cam, out);
  return out;
};
