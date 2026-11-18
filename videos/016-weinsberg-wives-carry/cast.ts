// The cast and hand-drawn props of the Weinsberg legend: the wives (bonnets, long dresses) and their husbands riding on
// their backs, King Conrad (crimson coat, gold sash, a drawn crown), his soldiers (red tabards, grey helmets), the herald,
// hungry townsfolk, a monk at his desk, and people on the square today. The drawn props: the crown, the herald's scroll,
// the empty bread basket, the soldiers' dream of a sack of silver, the open chronicle, the page of look-alike castles and
// the Weibertreu sign. Every prop is an unlit ink-outlined drawing; cards that arrive mid-shot grow in slowly (never pop).
import { Pen, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, WALL_Z, SHELF, CAMP, STR, SCR, RUIN, SNOW_Y, roadY, coupleZ, coupleX, N_COUPLES, smooth, V3,
  T_LEGEND, T_CASTLE, T_PATIENCE, T_BREAD, T_TERMS, T_PUNISHED, T_WOMEN, T_PEACE, T_CARRY, T_SHOULDERS, T_SACKS, T_WIFE,
  T_SHOUT, T_LAUGHS, T_WORD, T_CHRONICLE, T_SIMILAR, T_MERCIFUL, T_BELIEVE, T_SAVED, T_LEAVE, T_DAWN,
} from "./story";

const WIVES: Outfit[] = [
  { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#5a8fc2", skin: SKINS[0] },
  { jacket: "#2f5f6a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#d9a441", skin: SKINS[1] },
  { jacket: "#5d7a3a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#c25a7a", skin: SKINS[2] },
  { jacket: "#b5653f", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#3f6fb5", skin: SKINS[3] },
  { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#d9a441", skin: SKINS[1] },
  { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#8c3b4a", skin: SKINS[0] },
];
const HUSBANDS: Outfit[] = [
  { jacket: "#7a5a3a", pants: "#4a4038", boots: "#3a2a20", hat: "hair", hair: "#5a3b2a", moustache: "#5a3b2a", skin: SKINS[1] },
  { jacket: "#4a6a8a", pants: "#3a3530", boots: "#3a2a20", hat: "cap", cap: "#8c3b4a", skin: SKINS[0] },
  { jacket: "#8a6a3a", pants: "#3b3f52", boots: "#3a2a20", hat: "hair", hair: "#2a201a", skin: SKINS[3] },
  { jacket: "#5d7a3a", pants: "#4a4038", boots: "#3a2a20", hat: "cap", cap: "#5a3b2a", moustache: "#3a2a20", skin: SKINS[2] },
  { jacket: "#6a4a6a", pants: "#3a3530", boots: "#3a2a20", hat: "hair", hair: "#8a5a3a", skin: SKINS[0] },
  { jacket: "#2f5f6a", pants: "#4a4038", boots: "#3a2a20", hat: "hair", hair: "#e6e2da", moustache: "#e6e2da", skin: SKINS[1] },
];
const KING: Outfit = { jacket: "#8a2632", pants: "#3a2a30", boots: "#2a1a1a", hat: "hair", hair: "#6a4a2a", moustache: "#6a4a2a", buttons: "#e0b04a", sash: "#e0b04a", build: "stout", skin: SKINS[0] };
const soldierO = (v: number): Outfit => ({ jacket: "#9a3434", pants: "#3d3a40", boots: "#2a2220", hat: "cap", cap: "#8a8f99", belt: "#5a3b2a", sword: v % 2 === 0, skin: SKINS[v % 4], moustache: v % 3 === 1 ? "#4a3426" : undefined });
const SOLDIERS = [0, 1, 2, 3, 4, 5].map(soldierO);
const HERALD: Outfit = { jacket: "#c08a3a", pants: "#8a2632", boots: "#2a1a1a", hat: "cap", cap: "#8a2632", skin: SKINS[1] };
const MONK: Outfit = { jacket: "#6a4a32", pants: "#6a4a32", boots: "#3a2a20", hat: "hair", hair: "#8a6a4a", belt: "#e8dcc0", skin: SKINS[0] };
const MODERN: Outfit[] = [
  { jacket: "#e2683c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair: "#5a3b2a", skin: SKINS[2] },
  { jacket: "#3f8f6a", pants: "#2f3a4a", boots: "#3a2a20", hat: "hair", hair: "#2a201a", skin: SKINS[3] },
  { jacket: "#f2c14e", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#2f5f6a", skin: SKINS[0] },
  { jacket: "#c25a7a", pants: "#3b3f52", boots: "#3a2a20", hat: "hair", hair: "#8a5a3a", skin: SKINS[1] },
  { jacket: "#5a8fc2", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: "#e6e2da", moustache: "#e6e2da", skin: SKINS[0] },
  { jacket: "#7b5ac9", pants: "#3b5b9a", boots: "#3a2a20", hat: "hair", hair: "#5a3b2a", skin: SKINS[2] },
];
const INKC = "#241726";
const PAPER = "#f6ecd2";
const GOLD = "#e0b04a";

// ---------------- drawings ----------------
/** a crown (220 x 140) */
const drawCrown = (p: Pen) => {
  p.poly([[20, 128], [200, 128], [210, 30], [160, 78], [110, 14], [60, 78], [10, 30]], GOLD, 8);
  p.line([[24, 108], [196, 108]], "#b5873a", 8, false);
  for (const [x, c] of [[60, "#c0353a"], [110, "#2f6a9a"], [160, "#c0353a"]] as const) p.ell(x, 96, 11, 9, c, 4);
};
/** the herald's scroll (300 x 220): parchment with lines and a red seal */
const drawScroll = (p: Pen) => {
  p.poly([[20, 30], [280, 22], [282, 196], [18, 204]], PAPER, 8);
  p.ell(150, 26, 136, 14, "#e2d2ae", 6);
  p.ell(150, 200, 136, 14, "#e2d2ae", 6);
  for (let k = 0; k < 5; k++) p.line([[50, 62 + k * 24], [250 - (k % 2) * 40, 62 + k * 24]], "#7a6a52", 6, false);
  p.ell(220, 176, 20, 20, "#c0353a", 5);
};
/** an empty bread basket (300 x 200): wicker, two crumbs */
const drawBasket = (p: Pen) => {
  p.poly([[20, 70], [280, 70], [246, 186], [54, 186]], "#c9944a", 8);
  for (let k = 0; k < 4; k++) p.line([[40 + k * 6, 98 + k * 22], [260 - k * 6, 98 + k * 22]], "#9a6a30", 5, false);
  p.ell(150, 70, 130, 18, "#7a5226", 7);
  p.ell(120, 66, 8, 6, "#e0b878", 3); p.ell(176, 70, 6, 5, "#e0b878", 3);
};
/** a thought bubble (360 x 300) with a fat sack of silver in it */
const drawSackBubble = (p: Pen) => {
  p.ell(180, 130, 160, 116, "#ffffff", 8);
  p.ell(70, 262, 22, 16, "#ffffff", 6); p.ell(40, 290, 12, 9, "#ffffff", 5);
  p.poly([[150, 60], [210, 60], [264, 150], [250, 220], [110, 220], [96, 150]], "#c9b48a", 8);
  p.line([[146, 70], [214, 70]], "#6a4224", 9, false);
  for (const [x, y] of [[116, 232], [150, 238], [186, 234], [222, 230]] as const) p.ell(x, y - 10, 18, 9, "#d9dde0", 4);
};
/** the open chronicle (400 x 260): two pages of text lines, a little drawing of a wife carrying her husband */
const drawBook = (p: Pen) => {
  p.poly([[10, 40], [200, 20], [200, 250], [10, 236]], PAPER, 8);
  p.poly([[200, 20], [390, 40], [390, 236], [200, 250]], PAPER, 8);
  for (let k = 0; k < 7; k++) p.line([[30, 70 + k * 24], [180, 66 + k * 24 - k * 0.6]], "#6a5a48", 5, false);
  for (let k = 0; k < 3; k++) p.line([[220, 186 + k * 18], [372, 190 + k * 18]], "#6a5a48", 5, false);
  // the little picture: a wife walking, her husband on her back
  p.ell(282, 70, 16, 16, "#ffe2c2", 5); p.poly([[268, 86], [300, 86], [312, 160], [258, 160]], "#c25a7a", 5);
  p.ell(306, 54, 15, 15, "#ffe2c2", 5); p.poly([[296, 68], [322, 70], [330, 108], [298, 104]], "#7a5a3a", 5);
  p.stroke([[262, 160], [256, 176]], 5, INKC); p.stroke([[306, 160], [314, 176]], 5, INKC);
  p.line([[200, 20], [200, 250]], INKC, 6, false);
};
/** a page of look-alike legends (300 x 260): three little castles, each with a wife carrying a husband */
const drawCastles = (p: Pen) => {
  p.poly([[12, 14], [288, 8], [292, 252], [8, 248]], PAPER, 8);
  for (const [x, y] of [[80, 80], [210, 100], [130, 190]] as const) {
    p.poly([[x - 40, y + 30], [x + 40, y + 30], [x + 40, y - 10], [x + 26, y - 10], [x + 26, y - 30], [x + 12, y - 30], [x + 12, y - 10], [x - 12, y - 10], [x - 12, y - 30], [x - 26, y - 30], [x - 26, y - 10], [x - 40, y - 10]], "#cbbfa6", 5);
    p.poly([[x - 8, y + 30], [x + 8, y + 30], [x + 8, y + 10], [x - 8, y + 10]], "#5a5048", 3);
    p.ell(x + 54, y + 4, 7, 7, "#ffe2c2", 3); p.ell(x + 60, y - 8, 6, 6, "#ffe2c2", 3);
    p.poly([[x + 48, y + 10], [x + 60, y + 10], [x + 63, y + 30], [x + 45, y + 30]], "#c25a7a", 3);
  }
};
/** the sign on the square (360 x 280): a wooden board on a post */
const drawSign = (p: Pen) => {
  p.poly([[170, 120], [190, 120], [190, 276], [170, 276]], "#7a5226", 6);
  p.poly([[12, 20], [348, 12], [350, 130], [10, 136]], "#8a5a30", 8);
  p.poly([[26, 32], [334, 26], [336, 118], [24, 122]], "#f2e2b0", 4);
  const g = p.g; g.font = "bold 50px Georgia, serif"; g.fillStyle = "#3a2a1a"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("WEIBERTREU", 180, 76);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = D0, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** a card that grows in from t0 over d seconds (scale 0 -> 1, the drawing never changes, so no frame jumps) */
const grow = (t: number, t0: number, d = 0.8) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
};
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);
/** a burst of light from t0 (0.5 s, a kick frame: planned in shots.json), shrinking away at the end */
const burst = (out: Stage, t: number, t0: number, x: number, y: number, z: number, s: number) => {
  const u = (t - t0 + 1e-6) / 0.5;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 15), k = 1 - smooth((u - 0.55) / 0.45);
  card(out, `burst${uq}`, 500, 500, (pn) => fxBurst(pn, uq), x, y, z, s * k, s * k, true);
};
/** falling snow round a point: n flakes in a box, each fading in at the top and out at the bottom (never pops) */
const drawFlake = (p: Pen) => { p.ell(32, 32, 18, 18, "#ffffff", 0); };
const snow = (out: Stage, c: V3, t: number, n: number, w: number, h: number, size: number) => {
  for (let i = 0; i < n; i++) {
    const h1 = ((i * 0.618) % 1), h2 = ((i * 0.377 + 0.2) % 1), h3 = ((i * 0.851 + 0.5) % 1);
    const u = (t * (0.18 + 0.08 * h3) + h1) % 1, s = size * (0.6 + 0.6 * h2) * smooth(u / 0.1) * smooth((1 - u) / 0.1);
    if (s < 0.004) continue;
    out.fx.push({ key: "flake", cw: 64, ch: 64, draw: drawFlake, x: c[0] + (h2 - 0.5) * w + 0.4 * Math.sin(t * 1.3 + i), y: c[1] + h * (1 - u), z: c[2] + (h3 - 0.5) * w * 0.6, w: s, h: s, soft: true });
  }
};
/** the king, with his drawn crown on his head */
const king = (cam: CamInfo, t: number, out: Stage, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = SNOW_Y) => {
  front(cam, t, out, 3, KING, "king", x, z, expr, extra, y);
  const dx = cam.pos.x - x, dz = cam.pos.z - z, l = Math.hypot(dx, dz) || 1;
  card(out, "crown", 220, 140, drawCrown, x + (dx / l) * 0.05, y + 1.78, z + (dz / l) * 0.05, 0.34, 0.22);
};
/** a wife walking along (dx, dz), bent forward, her husband riding on her back (sitting card behind her shoulders) */
const carry = (cam: CamInfo, t: number, out: Stage, k: number, x: number, z: number, y: number, dx: number, dz: number, ew: Expr, eh: Expr, hw = 0) => {
  const i = 100 + k, wife = WIVES[k % 6], hus = HUSBANDS[(k + 2) % 6], ph = q(t * 0.95 + k * 0.37, 48);
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, wife, `w${k % 6}`), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "march", phase: ph, expr: ew, blink: lidAt(t, i), tilt: 7 }, { mode: "march", phase: ph, expr: ew, blink: lidAt(t, i), stride: 0.75 * Math.max(0.3, v.fs) }, 1));
  blob(out, x, y, z, 1.1);
  const cx = cam.pos.x - x, cz = cam.pos.z - z, cl = Math.hypot(cx, cz) || 1;
  const bob = -0.035 * Math.cos(4 * Math.PI * ph);
  const lat = v.side ? 0 : (k % 2 ? 0.12 : -0.12);
  const bx = x - (cx / cl) * 0.2 - dx * (v.side ? 0.26 : 0) + cam.right.x * lat, bz = z - (cz / cl) * 0.2 - dz * (v.side ? 0.26 : 0) + cam.right.z * lat;
  out.places.push(person(cam, who(i + 50, hus, `h${(k + 2) % 6}`), bx, y + (v.side ? 1.2 : 1.4) + bob, bz, { side: v.side, mirror: v.mirror },
    { mode: "sit", expr: eh, blink: lidAt(t, i + 50), ...(hw ? { wave: hw } : {}) }, { mode: "swing", pose: 0.35, expr: eh, blink: lidAt(t, i + 50) }, 0.95));
};
/** the procession of shot id: every couple that is out of the gate */
const procession = (id: number, t: number, cam: CamInfo, out: Stage, ew: (k: number) => Expr, eh: (k: number) => Expr, hw = 0) => {
  for (let k = 0; k < N_COUPLES[id]; k++) {
    const z = coupleZ(id, k, t);
    if (z === null) continue;
    const x = coupleX(k);
    carry(cam, t, out, k, x, z, roadY(z), 0, 1, ew(k), eh(k), hw);
  }
};

// ---------------- the places ----------------
const KZ = CAMP[2];
const groundY = (x: number, z: number) => (Math.abs(x) < 2.02 ? roadY(z) : SNOW_Y);
const townSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 1) { // the hook: the wives come down the ramp toward us
    procession(1, t, cam, out, (k) => (t < T_LEGEND + 1.2 ? "stern" : k % 2 ? "grin" : "smile"), (k) => (k % 2 ? "nervous" : "dazed"));
    return;
  }
  if (id === 2) { // December: a few soldiers of the siege on the snow by the road, falling snow
    for (let j = 0; j < 4; j++) front(cam, t, out, 20 + j, SOLDIERS[j], `s${j}`, [-5.5, -7.0, 4.6, 6.2][j], [20, 23, 21, 24][j], "stern", {}, SNOW_Y);
    snow(out, [-2.5, D0, 26], t, 30, 9, 6, 0.08);
    void T_CASTLE;
    return;
  }
  if (id === 3) { // the king at his pavilion, losing patience
    const lost = t >= T_PATIENCE - 0.07;
    const shake = lost && t < T_PATIENCE + 0.7 ? q(8 * Math.sin((t - T_PATIENCE) * 22), 3) : 0;
    king(cam, t, out, 6.2, KZ - 6.2, lost ? "pained" : "stern", { headTilt: shake });
    for (let j = 0; j < 2; j++) front(cam, t, out, 20 + j, SOLDIERS[j], `s${j}`, [4.9, 8.1][j], [38.6, 38.8][j], j % 2 ? "stern" : "neutral", {}, SNOW_Y);
    snow(out, [5.4, D0, KZ - 9], t, 30, 7, 5, 0.06);
    return;
  }
  if (id === 5) { // the herald reads the terms; faces along the wall top
    const hz = 4.2, hy = roadY(hz);
    front(cam, t, out, 25, HERALD, "herald", 0.5, hz, "stern", { wave: 0.6 }, hy);
    const g = grow(t, T_TERMS - 0.5, 0.8);
    card(out, "scroll", 300, 220, drawScroll, 0.5 + 0.2, hy + 1.45, hz + 0.35, 0.62 * g, 0.45 * g);
    const wy = D0 + SHELF + 10;
    const spots = [-5.2, -4.3, -3.4, -2.5, 2.5, 3.4, 4.3, 5.2];
    spots.forEach((x, j) => {
      const woman = j % 2 === 1;
      let ex: Expr = "nervous";
      if (!woman && t >= T_PUNISHED - 0.07) ex = "shock";
      if (woman && t >= T_WOMEN - 0.07) ex = "relief";
      if (woman && t >= T_PEACE - 0.07) ex = "smile";
      front(cam, t, out, 30 + j, woman ? WIVES[j % 6] : HUSBANDS[j % 6], woman ? `w${j % 6}` : `h${j % 6}`, x, WALL_Z - 0.3, ex, {}, wy, false);
    });
    snow(out, [1.5, D0, 6], t, 26, 7, 6, 0.06);
    return;
  }
  if (id === 7) { // dawn: soldiers wait by the road, dreaming of silver
    const rich = t >= T_SACKS - 0.07;
    const spots: [number, number][] = [[-2.2, 17.5], [0.4, 16.6], [1.6, 12.5], [-3.0, 12.0], [-1.9, 9.0], [1.4, 8.6]];
    spots.forEach(([x, z], j) => front(cam, t, out, 20 + j, SOLDIERS[j], `s${j}`, x, z, rich ? (j % 2 ? "laugh" : "grin") : "smile", rich && j % 2 ? { wave: wave(t, j, 6) } : {}, groundY(x, z)));
    const g = grow(t, T_SACKS - 0.4, 0.8);
    card(out, "sackBubble", 360, 300, drawSackBubble, -0.8, D0 + 3.3, 15, 1.2 * g, 1.0 * g);
    void T_DAWN;
    return;
  }
  if (id === 8) { // they come out, bent double, every wife with her husband on her back
    procession(8, t, cam, out, () => "stern", (k) => (k % 2 ? "nervous" : "dazed"));
    return;
  }
  if (id === 9) { // "it's a trick!"
    const sh = t >= T_SHOUT - 0.07;
    procession(9, t, cam, out, () => "stern", () => "nervous");
    const spots: [number, number][] = [[3.0, KZ - 17.6], [1.9, KZ - 16.8], [4.3, KZ - 16.6]];
    spots.forEach(([x, z], j) => front(cam, t, out, 20 + j, SOLDIERS[j], `s${j}`, x, z, sh ? "shock" : "dazed", sh ? { wave: wave(t, j, 9) } : {}, SNOW_Y));
    burst(out, t, Math.floor((T_SHOUT - 2 / 30) * 30 + 1e-6) / 30, 3.0, D0 + 2.2, KZ - 17.4, 1.2);
    return;
  }
  if (id === 10) { // the king laughs: a king keeps his word
    const lg = t >= T_LAUGHS - 0.07, wd = t >= T_WORD - 0.07;
    king(cam, t, out, 6.0, KZ - 16.6, wd ? "grin" : lg ? "laugh" : "dazed", lg && !wd ? { wave: wave(t, 0, 7) } : {});
    front(cam, t, out, 21, SOLDIERS[1], "s1", 4.5, KZ - 15.4, lg ? "dazed" : "shock", {}, SNOW_Y);
    front(cam, t, out, 23, SOLDIERS[3], "s3", 7.6, KZ - 15.2, lg ? "relief" : "shock", {}, SNOW_Y);
    burst(out, t, Math.floor((T_LAUGHS - 2 / 30) * 30 + 1e-6) / 30, 6.0, D0 + 1.9, KZ - 16.4, 1.1);
    return;
  }
  if (id === 11) { // they walk free, past soldiers who can only watch
    procession(11, t, cam, out, (k) => (k % 2 ? "laugh" : "grin"), (k) => (k % 3 ? "laugh" : "grin"));
    for (let j = 0; j < 3; j++) front(cam, t, out, 20 + j, SOLDIERS[j + 2], `s${j + 2}`, -4.6 - j * 0.8, 15.5 + j * 2.6 + (t - 39.67) * 0.9, "dazed", {}, SNOW_Y);
    return;
  }
  // id 14: the long line leaving the town that never fell, the camp watching
  procession(14, t, cam, out, (k) => (t >= T_SAVED - 0.07 && k % 2 ? "grin" : "smile_closed"), (k) => (t >= T_LEAVE - 0.07 ? "laugh" : k % 2 ? "grin" : "smile"));
  for (let j = 0; j < 6; j++) front(cam, t, out, 20 + j, SOLDIERS[j], `s${j}`, (j % 2 ? 1 : -1) * (4.2 + (j % 3) * 1.1), 24 + j * 1.6, "dazed", {}, SNOW_Y);
  king(cam, t, out, 7.4, 27.5, "grin");
};

const streetSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [sx, , sz] = STR, py = D0 + 0.08;
  if (id === 4) { // hungry people and the empty basket
    const sad = t >= T_BREAD - 0.07;
    const spots: [number, number, boolean][] = [[-0.9, -0.9, true], [0.2, -1.5, false], [1.3, -0.8, true], [2.3, -1.6, false], [-2.1, -1.8, false]];
    spots.forEach(([x, z, woman], j) => front(cam, t, out, 30 + j, woman ? WIVES[j % 6] : HUSBANDS[j % 6], woman ? `w${j % 6}` : `h${j % 6}`, sx + x, sz + z, sad ? (j % 2 ? "pained" : "nervous") : "nervous", {}, py));
    const g = grow(t, T_BREAD - 0.35, 0.9);
    card(out, "basket", 300, 200, drawBasket, sx - 0.85, py + 0.95, sz - 0.6, 0.62 * g, 0.41 * g);
    return;
  }
  // id 6: a wife and her husband: what can she carry?
  const idea = t >= T_SHOULDERS - 0.07, look = t >= T_CARRY - 0.07;
  front(cam, t, out, 40, WIVES[0], "w0", sx - 0.45, sz - 0.5, idea ? "grin" : look ? "neutral" : "nervous", idea ? { headTilt: 6 } : {}, py);
  front(cam, t, out, 41, HUSBANDS[2], "h2", sx + 0.55, sz - 0.65, idea ? "dazed" : "nervous", {}, py);
};

const scriptoriumSet = (t: number, cam: CamInfo, out: Stage) => {
  const [mx, , mz] = SCR;
  const ex: Expr = t >= T_MERCIFUL - 0.07 ? "grin" : t >= T_SIMILAR - 0.07 ? "whistle" : t >= T_CHRONICLE - 0.07 ? "smile_closed" : "neutral";
  front(cam, t, out, 60, MONK, "monk", mx, mz - 1.35, ex, { mode: "sit" }, D0 + 0.75, false);
  card(out, "book", 400, 260, drawBook, mx, D0 + 1.18, mz - 0.72, 0.7, 0.46);
  const g = grow(t, T_SIMILAR - 0.3, 0.9);
  card(out, "castles", 300, 260, drawCastles, mx + 0.75, D0 + 2.1, mz - 1.6, 1.0 * g, 0.87 * g);
};

const ruinSet = (t: number, cam: CamInfo, out: Stage) => {
  const [ux, , uz] = RUIN, py = D0 + 0.1;
  const glad = t >= T_BELIEVE - 0.07;
  const spots: [number, number][] = [[-1.4, 6.2], [-0.3, 7.4], [0.8, 6.0], [1.9, 7.8], [-0.9, 9.0], [1.2, 9.6]];
  spots.forEach(([x, z], j) => front(cam, t, out, 70 + j, MODERN[j], `m${j}`, ux + x, uz + z, glad ? (j % 2 ? "laugh" : "grin") : "smile", glad && j === 4 ? { wave: wave(t, j, 5) } : {}, py));
  card(out, "sign", 360, 280, drawSign, ux + 2.0, py + 0.88, uz + 11.5, 1.5, 1.17);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "town") townSet(id, t, cam, out);
  else if (s.scene === "street") streetSet(id, t, cam, out);
  else if (s.scene === "scriptorium") scriptoriumSet(t, cam, out);
  else ruinSet(t, cam, out);
  void T_WIFE;
  return out;
};
