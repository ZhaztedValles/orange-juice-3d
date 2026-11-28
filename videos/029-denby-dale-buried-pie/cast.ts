// The cast and hand-drawn props of the buried-pie story: the head baker (white jacket and cap), the village women who
// bake the second pie (bonnets, aprons), villagers in top hats and bonnets, two labourers, a cook. Every prop is an
// unlit ink-outlined drawing: the Queen's portrait, the pie plan, joints of meat and game birds, flies and heat haze,
// plates and forks, the carving knife, the stink, the stew-pot cross-section and its germs, pie chunks, quicklime,
// the grave marker, the "no game" sign, and the little wings and halo of the Resurrection Pie. Cards that arrive
// mid-shot grow in, and cards that leave shrink away: nothing pops.
import { Pen, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, ST, STD, DR, PIE_TOP, YD, DD, PT, PIT_R, POT, SHOTS, BAKER, BAKER_UP, TABLE, PORTRAIT, COOK, smooth, clamp01, V3,
  T_BIG, T_PROUD, T_GRAVE, T_DENBY, T_GIANT, T_QUEEN, T_PLANNED, T_GREATEST, T_BUILT, T_PACKED, T_MEAT, T_GAME, T_TON,
  T_DAYS, T_WARM, T_SUMMER, T_BAKED, T_CROWDS, T_PLATES, T_APP, T_KNIFE, T_IN, T_OUT, T_SMELL, T_BAD, T_STEPPED, T_ROTTEN,
  T_POT, T_MIDDLE, T_EDGES, T_COOL, T_FEAST, T_GERMS, T_EMPTIED, T_PIT, T_LIME, T_MONSTER, T_GOOD, T_GIVEN, T_FOREVER,
  T_NEW, T_NOGAME, T_SUCCESS, T_FULL, T_NAME, T_RES, T_EVEN, T_RISE, T_GRAVE2, liftAt,
} from "./story";

const Y = D0;
const BAKERO: Outfit = { jacket: "#f4efe2", pants: "#5a4a3a", boots: "#2a2220", hat: "cap", cap: "#ffffff", skin: SKINS[1], moustache: "#6b4a32", build: "stout" };
const WOMEN: Outfit[] = [
  { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", hair: "#6b4a32", dress: "#f2ead8", skin: SKINS[0] },
  { jacket: "#2f5f6a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", hair: "#3a2a20", dress: "#efe4cc", skin: SKINS[2] },
  { jacket: "#5d7a3a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", hair: "#a8743e", dress: "#f4ecdc", skin: SKINS[3] },
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
const LAB: Outfit[] = [
  { jacket: "#6a5a4a", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#4a4850", skin: SKINS[0] },
  { jacket: "#5a6a7a", pants: "#5a4a3a", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", skin: SKINS[2], moustache: "#3a2a20" },
];
const COOKO: Outfit = { jacket: "#f4efe2", pants: "#6a5a4a", boots: "#3a2a20", hat: "cap", cap: "#ffffff", dress: "#d8cbb0", skin: SKINS[3] };

// ---------------- drawings ----------------
/** the Queen's portrait (240 x 300): gold frame, a lady in black with a white veil and a small crown */
const drawPortrait = (p: Pen) => {
  p.poly([[8, 8], [232, 8], [232, 292], [8, 292]], "#d9a441", 8);
  p.poly([[30, 30], [210, 30], [210, 270], [30, 270]], "#8a9ab0", 5);
  p.poly([[60, 270], [72, 170], [120, 150], [168, 170], [180, 270]], "#2a2630", 5);
  p.poly([[78, 150], [80, 96], [120, 76], [160, 96], [162, 150]], "#9a9aa4", 4);
  p.ell(120, 120, 34, 38, "#f2d4b8", 5);
  p.poly([[88, 98], [96, 84], [144, 84], [152, 98]], "#f6f2ea", 3);
  p.poly([[102, 84], [106, 64], [114, 74], [120, 58], [126, 74], [134, 64], [138, 84]], "#e8b84a", 4);
  p.dot(106, 118, 4, "#241726"); p.dot(134, 118, 4, "#241726");
  p.line([[110, 140], [130, 140]], "#8a4a3a", 4, false);
  p.ell(120, 196, 12, 10, "#e8b84a", 3);
};
/** the plan (300 x 220): a sheet with a huge pie drawn on it and a little person beside it */
const drawPlan = (p: Pen) => {
  p.poly([[10, 14], [290, 6], [294, 214], [6, 210]], "#f3ead2", 6);
  p.ell(130, 128, 96, 40, "#d9a15a", 5); p.poly([[34, 128], [34, 160], [226, 160], [226, 128]], "#6b6560", 5);
  p.ell(130, 160, 96, 18, "#6b6560", 0, 0, 180);
  p.ell(130, 124, 92, 34, "#d9a15a", 0);
  p.ell(252, 112, 10, 12, "#f2d4b8", 3); p.line([[252, 126], [252, 164]], "#3a3446", 5, false);
  p.line([[252, 164], [244, 186]], "#3a3446", 4, false); p.line([[252, 164], [260, 186]], "#3a3446", 4, false);
};
/** a joint of beef (200 x 140) */
const drawMeat = (p: Pen) => {
  p.ell(92, 74, 78, 54, "#b8504a", 7);
  p.ell(92, 74, 50, 32, "#d97a6a", 0);
  p.ell(150, 64, 22, 18, "#f4e8d6", 5); p.line([[168, 56], [192, 44]], "#f4e8d6", 12);
  p.ell(192, 44, 8, 10, "#f4e8d6", 4);
};
/** a game bird (220 x 160): brown body, red face, long tail */
const drawBird = (p: Pen) => {
  p.poly([[10, 70], [70, 60], [70, 84]], "#8a5a34", 5);
  p.ell(110, 90, 62, 42, "#a8743e", 7);
  p.ell(170, 56, 22, 22, "#3f6a52", 5); p.ell(176, 54, 9, 9, "#c0392b", 0);
  p.poly([[190, 56], [214, 62], [190, 66]], "#e8b84a", 4);
  p.line([[96, 128], [90, 154]], "#8a5a34", 5); p.line([[124, 128], [128, 154]], "#8a5a34", 5);
  for (const [x, y] of [[90, 82], [116, 96], [130, 76]]) p.dot(x, y, 5, "#6a4426");
};
/** a fly (80 x 60), wings up or down */
const drawFly = (p: Pen, up: number) => {
  p.ell(26, up ? 18 : 26, 16, 10, "rgba(220,235,255,0.9)", 3); p.ell(54, up ? 18 : 26, 16, 10, "rgba(220,235,255,0.9)", 3);
  p.ell(40, 38, 16, 12, "#2a2630", 4); p.dot(52, 34, 4, "#c0392b");
};
/** heat haze (200 x 300): three wavy lines, phase n */
const drawHeat = (p: Pen, n: number) => {
  for (let k = 0; k < 3; k++) {
    const pts: [number, number][] = [];
    for (let y = 290; y > 10; y -= 14) pts.push([40 + k * 60 + 14 * Math.sin(y / 30 + n * 0.8 + k), y]);
    p.line(pts, "#fff1c8", 8, false);
  }
};
/** a plate with a fork (160 x 110) */
const drawPlateFork = (p: Pen) => {
  p.ell(70, 70, 64, 30, "#f6f2e8", 6); p.ell(70, 68, 40, 16, "#e8e2d4", 0);
  p.line([[140, 100], [150, 20]], "#b9bcc4", 7);
  for (const dx of [-8, 0, 8]) p.line([[150 + dx, 22], [150 + dx, 4]], "#b9bcc4", 4);
};
/** the carving knife (360 x 90) */
const drawKnife = (p: Pen) => {
  p.poly([[10, 50], [230, 30], [250, 60], [20, 64]], "#d8dce4", 6);
  p.line([[24, 46], [226, 34]], "#f6f8fc", 4, false);
  p.poly([[250, 34], [350, 30], [352, 66], [250, 64]], "#6a4a32", 6);
  p.dot(290, 48, 5, "#e0b84a"); p.dot(326, 48, 5, "#e0b84a");
};
/** the stink (400 x 400): a sickly green cloud with wavy lines and a skull-ish swirl-free face, phase n */
const drawStink = (p: Pen, n: number) => {
  const ph = n * 0.5;
  p.ell(200, 250, 150, 110, "rgba(150,190,80,0.75)", 0);
  p.ell(140, 190, 90, 80, "rgba(170,205,95,0.75)", 0); p.ell(260, 180, 90, 80, "rgba(140,180,70,0.75)", 0);
  for (let k = 0; k < 3; k++) {
    const pts: [number, number][] = [];
    for (let y = 390; y > 30; y -= 14) pts.push([110 + k * 90 + 16 * Math.sin(y / 26 + ph + k * 2), y]);
    p.line(pts, "#6f8f2a", 9, false);
  }
};
/** the stew pot in section (420 x 320): warm red middle, edges that cool to blue (k 0..1), arrows */
const drawSection = (p: Pen, k: number) => {
  const edge = k < 0.5 ? "#e8823a" : "#5a8fc2";
  p.poly([[30, 40], [390, 40], [370, 300], [50, 300]], "#4e4b48", 10);
  p.poly([[50, 60], [370, 60], [352, 282], [68, 282]], edge, 0);
  p.ell(210, 170, 118, 92, "#f07a2a", 0);
  p.ell(210, 170, 70, 54, "#d8402a", 0);
  if (k > 0.5) for (const [x, d] of [[90, 1], [330, -1]]) { p.line([[x, 170], [x + d * 40, 170]], "#ffffff", 8); p.line([[x + d * 40, 170], [x + d * 26, 158]], "#ffffff", 6); p.line([[x + d * 40, 170], [x + d * 26, 182]], "#ffffff", 6); }
  for (let i = 0; i < 3; i++) p.line([[170 + i * 40, 140], [176 + i * 40, 118], [170 + i * 40, 96]], "#ffe0a0", 6, false);
};
/** a germ (140 x 140): a green blob with little feet, a grin and a fork, variant v */
const drawGerm = (p: Pen, v: number) => {
  const c = ["#7ac25a", "#5aa86a", "#9ac24a"][v % 3];
  const pts: [number, number][] = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = 46 + (i % 2 ? 8 : 0); pts.push([70 + Math.cos(a) * r, 74 + Math.sin(a) * r * 0.9]); }
  p.poly(pts, c, 6);
  p.dot(56, 64, 7, "#241726"); p.dot(84, 64, 7, "#241726");
  p.ell(70, 88, 16, 9, "#241726", 0, 0, 180);
};
/** a chunk of pie (160 x 120) */
const drawChunk = (p: Pen) => {
  p.poly([[14, 60], [80, 20], [148, 56], [130, 108], [30, 110]], "#7a5a3a", 6);
  p.poly([[14, 60], [80, 20], [148, 56], [80, 66]], "#d9a15a", 5);
  p.dot(70, 90, 8, "#5a6a3a"); p.dot(104, 84, 6, "#5a6a3a");
};
/** a white puff of quicklime (400 x 400) */
const drawLime = (p: Pen, seed: number) => {
  const r = (k: number) => ((seed * 97 + k * 31) % 17) / 17;
  for (let i = 0; i < 6; i++) p.ell(110 + 180 * r(i), 130 + 150 * r(i + 9), 70 + 40 * r(i + 3), 60 + 30 * r(i + 5), "#f6f6f2", 0);
  p.ell(200, 220, 130, 100, "#f6f6f2", 0);
};
/** the grave marker (200 x 280): two crossed boards with a little pie painted on */
const drawMarker = (p: Pen) => {
  p.poly([[86, 278], [86, 20], [114, 14], [114, 278]], "#8a6a48", 6);
  p.poly([[20, 70], [180, 62], [180, 96], [20, 104]], "#8a6a48", 6);
  p.ell(100, 150, 40, 18, "#d9a15a", 4); p.poly([[60, 150], [60, 166], [140, 166], [140, 150]], "#6b6560", 4);
};
/** the pie monster (320 x 220): a cracked pie with angry eyes and jagged teeth */
const drawMonster = (p: Pen) => {
  p.ell(160, 120, 150, 90, "#8a6a3a", 8);
  p.ell(160, 96, 140, 60, "#c08a4a", 0);
  p.poly([[96, 70], [136, 84], [96, 92]], "#f6f2e8", 4); p.poly([[224, 70], [184, 84], [224, 92]], "#f6f2e8", 4);
  p.dot(112, 82, 7, "#241726"); p.dot(208, 82, 7, "#241726");
  p.poly([[90, 140], [110, 120], [130, 140], [150, 120], [170, 140], [190, 120], [210, 140], [230, 120], [230, 160], [90, 160]], "#3a2a24", 5);
};
/** the "no game" sign (220 x 220): a game bird in a red ring with a bar */
const drawNoGame = (p: Pen) => {
  p.ell(110, 110, 100, 100, "#f6f2ea", 8);
  p.ell(110, 120, 46, 30, "#a8743e", 5); p.ell(148, 92, 16, 16, "#3f6a52", 4); p.dot(152, 90, 6, "#c0392b");
  p.poly([[40, 116], [70, 108], [70, 126]], "#8a5a34", 4);
  p.ell(110, 110, 92, 92, null, 0); p.arc(110, 110, 92, 92, 0, 360, 16, "#c0392b");
  p.line([[46, 46], [174, 174]], "#c0392b", 16);
};
/** little wings (500 x 220), flap phase 0..1 */
const drawWings = (p: Pen, ph: number) => {
  const lift = 40 * Math.sin(ph * Math.PI * 2);
  for (const s of [-1, 1]) {
    const x0 = 250 + s * 40, xs = (dx: number) => 250 + s * dx;
    p.poly([[x0, 150], [xs(120), 80 - lift], [xs(230), 40 - lift * 1.4], [xs(200), 110 - lift], [xs(220), 130 - lift * 0.8], [xs(170), 160 - lift * 0.5], [xs(160), 190]], "#ffffff", 7);
    p.line([[xs(110), 120 - lift * 0.7], [xs(180), 100 - lift * 1.1]], "#d8dce4", 4, false);
  }
};
/** a gold halo (300 x 110) */
const drawHalo = (p: Pen) => { p.ell(150, 55, 130, 36, null, 0); p.arc(150, 55, 130, 36, 0, 360, 18, "#ffd25a"); };
/** an old pie on a handcart (420 x 260) */
const drawCartPie = (p: Pen) => {
  p.poly([[30, 150], [390, 150], [380, 190], [40, 190]], "#8a6a48", 6);
  p.line([[390, 160], [418, 120]], "#6a4a32", 10);
  for (const x of [100, 320]) { p.ell(x, 204, 44, 44, "#6a4a32", 6); p.ell(x, 204, 12, 12, "#3a2a24", 0); }
  p.poly([[80, 150], [80, 110], [340, 110], [340, 150]], "#6b6560", 6);
  p.ell(210, 110, 132, 40, "#d9a15a", 6);
  p.ell(210, 104, 100, 24, "#e8b46a", 0);
};
/** a sack of lime (140 x 180) */
const drawSack = (p: Pen) => {
  p.poly([[20, 40], [120, 30], [132, 170], [10, 174]], "#e8e0cc", 6);
  p.line([[30, 50], [112, 42]], "#b9ad92", 6, false);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = Y, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
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
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);
const f12 = (t: number, off = 0) => (Math.round(t * 30) + off) % 12;
/** a card flying from a to b over [t0, t0 + d] on an arc, shrinking at the end when `sink` */
const flyCard = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, a: V3, b: V3, t: number, t0: number, d: number, w: number, h: number, arc = 0.6) => {
  const u = clamp01((t - t0 + 0.07) / d);
  if (t < t0 - 0.07) return;
  const e = smooth(u), k = u < 1 ? 1 : 0;
  if (!k) return;
  card(out, key, cw, ch, draw, a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e + arc * Math.sin(Math.PI * e), a[2] + (b[2] - a[2]) * e, w * (1 - 0.6 * smooth((u - 0.7) / 0.3)), h * (1 - 0.6 * smooth((u - 0.7) / 0.3)));
};
const plate = (out: Stage, x: number, y: number, z: number) => card(out, "plateFork", 160, 110, drawPlateFork, x + 0.32, y + 0.95, z + 0.12, 0.3, 0.2);
const stinks = (out: Stage, t: number, t0: number, base: V3, size: number) => {
  const g = grow(t, t0, 0.6);
  if (g < 0.02) return;
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.25 + i / 3) % 1, s = size * g * (0.5 + 0.5 * u) * (1 - smooth((u - 0.8) / 0.2)) * smooth(u / 0.1);
    const n = f12(t, i * 4);
    card(out, `stink${n}`, 400, 400, (pn) => drawStink(pn, n), base[0] + (i - 1) * 0.5 * u, base[1] + 0.2 + 1.6 * u, base[2] + 0.05 * i, s, s, true);
  }
};

// ---------------- the places ----------------
const crowd = (cam: CamInfo, t: number, out: Stage, n: number, expr: (j: number) => Expr, back = 0, plates = false, waving = 0) => {
  const spots: [number, number][] = [[-1.7, 2.7], [-2.7, 2.2], [-4.2, 2.5], [2.9, 2.3], [-3.6, 3.4], [4.3, 2.7], [3.7, 3.6], [-2.6, 4.4]];
  for (let j = 0; j < n; j++) {
    const [x, z] = spots[j];
    front(cam, t, out, 10 + j, FOLK[j], `f${j}`, x, z + back, expr(j), { wave: waving ? wave(t, j) : 0, facing: x < 0 ? 1 : -1 });
    if (plates) plate(out, x, Y, z + back);
  }
};

const greenSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [bx, , bz] = BAKER;
  if (id === 1) {
    const pr = by(t, T_PROUD);
    front(cam, t, out, 1, BAKERO, "baker", bx, bz, pr ? "laugh" : by(t, T_BIG) ? "grin" : "smile", { wave: pr ? 0.7 : 0, facing: -1 });
    ([[-1.3, 2.7], [-0.4, 3.3], [-2.2, 3.4]] as [number, number][]).forEach(([x, z], j) =>
      front(cam, t, out, 10 + j, FOLK[j], `f${j}`, x, z, by(t, T_BIG) ? (j === 1 ? "laugh" : "grin") : "smile", { facing: 1, wave: by(t, T_PROUD) ? wave(t, j) : 0 }));
    if (by(t, T_BIG)) burst(out, [0, PIE_TOP + 0.4, 0.4], t, T_BIG - 0.05, 1.6);
  } else if (id === 3) {
    const t0 = SHOTS[2].a / 30, x = -4.5 + 1.0 * (t - t0);
    walker(cam, t, out, 1, LAB[0], "lab0", x + 2.4, 5.9, 1, 0, t * 1.8, "grin");
    card(out, "cartPie", 420, 260, drawCartPie, x, Y + 0.68, 6.1, 2.2, 1.36);
    walker(cam, t, out, 2, FOLK[0], "f0", x - 1.6, 6.6, 1, 0, t * 1.8 + 0.3, "smile");
    const g = by(t, T_GIANT);
    for (let j = 0; j < 5; j++) front(cam, t, out, 3 + j, FOLK[j + 1], `f${j + 1}`, -5 + j * 2.6, 9.4 + (j % 2) * 0.8, g ? "laugh" : by(t, T_DENBY) ? "grin" : "smile", { wave: g ? wave(t, j) : 0 });
  } else if (id === 7) {
    const t0 = SHOTS[6].a / 30, arrive = T_PLATES;
    const spots: [number, number][] = [[-1.7, 2.7], [-2.7, 2.2], [-4.2, 2.5], [2.9, 2.3], [-3.6, 3.4], [4.3, 2.7], [3.7, 3.6], [-2.6, 4.4]];
    spots.forEach(([x, z], j) => {
      const from = x < 0 ? -10 - j : 10 + j, u = clamp01((t - t0 - 0.1 * j) / (arrive - t0 - 0.1 * j));
      const px = from + (x - from) * u, ex: Expr = by(t, T_APP) ? "laugh" : "grin";
      if (u < 1) walker(cam, t, out, 10 + j, FOLK[j], `f${j}`, px, z, x < 0 ? 1 : -1, 0, t * 1.8 + j * 0.3, ex);
      else front(cam, t, out, 10 + j, FOLK[j], `f${j}`, x, z, ex, { facing: x < 0 ? 1 : -1 });
      plate(out, px, Y, z);
    });
    front(cam, t, out, 1, BAKERO, "baker", BAKER_UP[0], BAKER_UP[2], by(t, T_BAKED) ? "grin" : "smile", { wave: by(t, T_CROWDS) ? 0.6 : 0, facing: -1 }, ST);
  } else if (id === 8) {
    const inn = by(t, T_IN);
    front(cam, t, out, 1, BAKERO, "baker", BAKER_UP[0], BAKER_UP[2], inn ? "nervous" : "grin", { facing: -1, wave: 0.5 }, ST);
    const u = smooth((t - T_KNIFE + 0.2) / (T_IN - T_KNIFE + 0.2));
    card(out, "knife", 360, 90, drawKnife, 0.72, PIE_TOP + 0.32 - 0.3 * u, 0.72, 0.62, 0.155);
    if (inn) burst(out, [0.42, PIE_TOP - 0.02, 0.78], t, T_IN - 0.05, 0.5, "#f0d090");
  } else if (id === 9) {
    const sm = by(t, T_SMELL), st = by(t, T_STEPPED), back = 0.9 * smooth((t - T_STEPPED + 0.07) / 0.35);
    card(out, "knife", 360, 90, drawKnife, 0.72, PIE_TOP + 0.02, 0.72, 0.62, 0.155);
    stinks(out, t, T_OUT, [0.3, PIE_TOP, 0.6], 1.3);
    front(cam, t, out, 1, BAKERO, "baker", BAKER_UP[0] + 0.2 * back, BAKER_UP[2] + 0.2 * back, by(t, T_ROTTEN) ? "dazed" : sm ? "pained" : "grin", { facing: -1, tilt: st ? -5 : 0 }, ST);
    ([[-1.2, 2.9], [-0.55, 3.8], [0.95, 3.3]] as [number, number][]).forEach(([x, z], j) => {
      front(cam, t, out, 10 + j, FOLK[j], `f${j}`, x, z + back, st ? (j % 2 ? "pained" : "shock") : sm ? "shock" : "grin", { facing: x < 0 ? 1 : -1 });
      plate(out, x, Y, z + back);
    });
    if (by(t, T_BAD)) burst(out, [0.2, PIE_TOP + 0.9, 0.6], t, T_BAD - 0.05, 1.2, "#cfe6a0");
  } else if (id === 12) {
    const fe = by(t, T_FOREVER);
    front(cam, t, out, 1, BAKERO, "baker", 0.9, STD + 0.25, fe ? "dazed" : by(t, T_GIVEN) ? "pained" : "nervous", { mode: "sit", headTilt: 8 }, ST - 0.5, false);
    front(cam, t, out, 2, FOLK[1], "f1", -1.6, 3.0, "nervous", { facing: 1 });
    front(cam, t, out, 3, FOLK[6], "f6", 3.2, 3.4, fe ? "pained" : "neutral", { facing: -1 });
  } else if (id === 13) {
    const ng = by(t, T_NOGAME), su = by(t, T_SUCCESS);
    WOMEN.forEach((o, j) => front(cam, t, out, 1 + j, o, `w${j}`, -1.6 + j * 1.6 + (j === 1 ? 0 : 0), j === 1 ? 1.55 : 1.25, su ? "laugh" : by(t, T_NEW) ? "grin" : "smile", { wave: su ? wave(t, j) : 0 }, ST));
    crowd(cam, t, out, 7, () => (by(t, T_FULL) ? "relief" : su ? "laugh" : "smile"), 0.4, true, su ? 1 : 0);
    const g = grow(t, T_NOGAME, 0.35) * (1 - grow(t, T_SUCCESS - 0.3, 0.35));
    if (ng) card(out, "noGame", 220, 220, drawNoGame, 0, PIE_TOP + 1.15, 0.3, 0.9 * g, 0.9 * g);
    if (su) burst(out, [0, PIE_TOP + 0.5, 0.5], t, T_SUCCESS - 0.05, 2.2);
  } else if (id === 14) {
    const rs = by(t, T_RES), ri = by(t, T_RISE), lift = liftAt(14, t);
    front(cam, t, out, 1, BAKERO, "baker", bx, bz, by(t, T_GRAVE2) ? "laugh" : ri ? "shock" : rs ? "grin" : "smile", { facing: -1, wave: by(t, T_GRAVE2) ? 0.7 : 0 });
    WOMEN.forEach((o, j) => front(cam, t, out, 2 + j, o, `w${j}`, -2.9 + j * 0.75, 2.5 + (j % 2) * 0.5, ri ? (by(t, T_GRAVE2) ? "laugh" : "shock") : by(t, T_NAME) ? "grin" : "smile", { wave: by(t, T_GRAVE2) ? wave(t, j) : 0, facing: 1 }));
    const hg = grow(t, T_RES, 0.5);
    card(out, "halo", 300, 110, drawHalo, 0, PIE_TOP + 0.55 + lift, 0, 1.6 * hg, 0.58 * hg);
    if (ri) {
      const n = f12(t), wg = grow(t, T_RISE, 0.35);
      card(out, `wings${n}`, 500, 220, (pn) => drawWings(pn, n / 12), 0, PIE_TOP - 0.05 + lift, 0.2, 3.4 * wg, 1.5 * wg);
      burst(out, [0, PIE_TOP + lift, 0.4], t, T_RISE - 0.05, 2.0);
    }
    void T_EVEN;
  }
};

const pitSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [px, , pz] = PT;
  card(out, "marker", 200, 280, drawMarker, px + 0.2, Y + 0.75, pz - PIT_R - 0.5, 0.72, 1.0);
  if (id === 2) {
    front(cam, t, out, 1, BAKERO, "baker", px + 1.5, pz - PIT_R - 0.6, by(t, T_GRAVE) ? "pained" : "nervous", { facing: -1, headTilt: 6 });
    card(out, "chunk", 160, 120, drawChunk, px - 0.3, Y + 0.18, pz + 0.2, 0.7, 0.52);
    card(out, "chunk", 160, 120, drawChunk, px + 0.5, Y + 0.15, pz - 0.3, 0.6, 0.45);
    if (by(t, T_GRAVE)) burst(out, [px, Y + 1.0, pz - PIT_R - 0.4], t, T_GRAVE - 0.05, 1.0, "#e8eef8");
    return;
  }
  // shot 11: the chunks tipped in, the monster in the pit, then the white lime over it all
  front(cam, t, out, 1, LAB[0], "lab0", px - 1.4, pz + 1.4, by(t, T_LIME) ? "grin" : "stern", { facing: 1, wave: 0.6 });
  front(cam, t, out, 2, LAB[1], "lab1", px + 1.5, pz + 1.2, by(t, T_MONSTER) ? "shock" : "stern", { facing: -1, wave: 0.5 });
  front(cam, t, out, 3, BAKERO, "baker", px + 0.6, pz - PIT_R - 0.7, by(t, T_GOOD) ? "relief" : "pained", { facing: -1 });
  card(out, "sack", 140, 180, drawSack, px - 0.95, Y + 1.0, pz + 1.5, 0.36, 0.46);
  for (let i = 0; i < 4; i++) flyCard(out, "chunk", 160, 120, drawChunk, [px - 1.0, Y + 1.3, pz + 1.4], [px - 0.6 + 0.4 * i, Y + 0.1, pz - 0.2 + 0.15 * i], t, T_EMPTIED + 0.25 * i, 0.5, 0.6, 0.45, 0.5);
  const mg = grow(t, T_MONSTER - 0.15, 0.3), cover = grow(t, T_LIME, 1.2);
  if (by(t, T_PIT)) card(out, "monster", 320, 220, drawMonster, px, Y + 0.35 + 0.25 * mg, pz - 0.1, 1.5 * (0.6 + 0.4 * mg) * (1 - 0.7 * smooth((t - T_GOOD) / 0.4)), 1.0 * (0.6 + 0.4 * mg) * (1 - 0.7 * smooth((t - T_GOOD) / 0.4)));
  if (by(t, T_LIME)) {
    for (let i = 0; i < 4; i++) {
      const u = clamp01((t - T_LIME - 0.12 * i) / 1.4), s = 1.4 * smooth(u / 0.2) * (1 - 0.5 * smooth((u - 0.6) / 0.4));
      if (s > 0.02) card(out, `lime${i}`, 400, 400, (pn) => drawLime(pn, i), px - 0.8 + 0.55 * i, Y + 0.4 + 0.6 * u, pz + 0.2 * (i % 2), s, s * 0.8, true);
    }
    out.fx.push({ key: "limeFloor", cw: 400, ch: 400, draw: (pn) => pn.ell(200, 200, 196, 196, "#f2f2ec", 0), x: px, y: Y + 0.05, z: pz, w: 2 * PIT_R * cover, h: 2 * PIT_R * cover, flat: true });
    burst(out, [px, Y + 0.8, pz + 0.3], t, T_LIME - 0.05, 1.8, "#ffffff");
  }
};

const roomSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  card(out, "portrait", 240, 300, drawPortrait, PORTRAIT[0], PORTRAIT[1], PORTRAIT[2] + 0.05, 0.84, 1.05);
  if (by(t, T_QUEEN) && t < T_QUEEN + 0.6) burst(out, [PORTRAIT[0] + 0.55, PORTRAIT[1] + 0.5, PORTRAIT[2] + 0.1], t, T_QUEEN - 0.05, 0.6);
  const [tx, , tz] = TABLE, pl = by(t, T_PLANNED), gr = by(t, T_GREATEST);
  front(cam, t, out, 1, BAKERO, "baker", tx - 0.9, tz - 0.95, gr ? "laugh" : pl ? "grin" : "smile", { facing: 1, wave: gr ? 0.6 : 0 });
  front(cam, t, out, 2, WOMEN[0], "w0", tx + 0.1, tz - 1.1, gr ? "grin" : "smile", {});
  front(cam, t, out, 3, FOLK[0], "f0", tx + 1.1, tz - 0.9, gr ? "laugh" : "smile_closed", { facing: -1, wave: gr ? 0.5 : 0 });
  const g = grow(t, T_PLANNED, 0.4);
  card(out, "plan", 300, 220, drawPlan, tx + 0.05, Y + 1.12, tz + 0.15, 0.7 * g, 0.51 * g);
  if (gr) burst(out, [tx, Y + 1.3, tz + 0.2], t, T_GREATEST - 0.05, 1.0);
};

const yardSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [dx, dy, dz] = YD, rim = dy + DD;
  if (id === 5) {
    front(cam, t, out, 1, BAKERO, "baker", dx + 1.9, dz - 0.6, by(t, T_TON) ? "laugh" : by(t, T_BUILT) ? "grin" : "smile", { facing: -1, wave: by(t, T_PACKED) ? 0.6 : 0 });
    front(cam, t, out, 2, LAB[0], "lab0", dx - 1.9, dz + 0.4, "grin", { facing: 1, wave: 0.7 });
    front(cam, t, out, 3, LAB[1], "lab1", dx - 1.4, dz - 1.4, "smile", { facing: 1, wave: 0.6 });
    const items: [number, "meat" | "bird"][] = [[T_PACKED, "meat"], [T_MEAT, "meat"], [T_MEAT + 0.3, "meat"], [T_GAME, "bird"], [T_GAME + 0.3, "bird"], [T_GAME + 0.6, "meat"], [T_GAME + 0.9, "bird"]];
    items.forEach(([t0, k], i) => {
      const a: V3 = [dx - 1.7, Y + 1.25, dz + 0.3 - 0.5 * (i % 2)], b: V3 = [dx - 0.6 + 0.2 * i, rim - 0.1, dz - 0.3 + 0.1 * (i % 3)];
      if (k === "meat") flyCard(out, "meat", 200, 140, drawMeat, a, b, t, t0, 0.45, 0.42, 0.29);
      else flyCard(out, "bird", 220, 160, drawBird, a, b, t, t0, 0.45, 0.44, 0.32);
    });
    // what is already in shows as a heap of joints and birds on the meat level
    const lvl = smooth((t - T_PACKED + 0.07) / (T_TON + 0.5 - T_PACKED));
    if (lvl > 0.15) {
      const pile: [number, number, "meat" | "bird"][] = [[-0.5, -0.2, "meat"], [0.3, 0.1, "bird"], [0.6, -0.4, "meat"], [-0.2, 0.4, "bird"], [0.1, -0.6, "meat"]];
      pile.forEach(([ox, oz, k], i) => {
        const g = smooth((lvl - 0.15 - 0.12 * i) / 0.2), yy = dy + 0.05 + (DD - 0.14) * lvl + 0.12;
        if (k === "meat") card(out, "meat", 200, 140, drawMeat, dx + ox, yy, dz + oz, 0.42 * g, 0.29 * g);
        else card(out, "bird", 220, 160, drawBird, dx + ox, yy, dz + oz, 0.44 * g, 0.32 * g);
      });
    }
    if (by(t, T_TON)) burst(out, [dx, rim + 0.5, dz], t, T_TON - 0.05, 1.8);
  } else {
    // days later: the closed pie in the heat, flies circling, the baker mopping his brow
    front(cam, t, out, 1, BAKERO, "baker", dx + 1.3, dz + 1.25, by(t, T_SUMMER) ? "pained" : by(t, T_WARM) ? "nervous" : "smile", { facing: -1, wave: by(t, T_WARM) ? 0.9 : 0 });
    front(cam, t, out, 2, LAB[1], "lab1", dx - 1.8, dz - 0.6, by(t, T_DAYS) ? "dazed" : "smile", { facing: 1 });
    const n = f12(t);
    for (let i = 0; i < 2; i++) card(out, `heat${n}`, 200, 300, (pn) => drawHeat(pn, n), dx - 0.6 + 1.2 * i, rim + 0.9, dz + 0.3, 0.6, 0.9, true);
    const fg = grow(t, T_WARM, 0.6);
    for (let i = 0; i < 5; i++) {
      const a = t * (2.2 + 0.4 * i) + i * 1.3, up = Math.round(t * 30 + i) % 2;
      card(out, `fly${up}`, 80, 60, (pn) => drawFly(pn, up), dx + 0.8 * Math.cos(a), rim + 0.6 + 0.25 * Math.sin(a * 1.7), dz + 0.6 * Math.sin(a), 0.24 * fg, 0.18 * fg);
    }
  }
};

const kitchenSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const [cx, , cz] = COOK;
  front(cam, t, out, 1, COOKO, "cook", cx, cz, by(t, T_GERMS) ? "shock" : by(t, T_POT) ? "grin" : "smile", { facing: -1, wave: by(t, T_COOL) ? 0.6 : 0 });
  // steam over the pot
  const n = f12(t);
  card(out, `heat${n}`, 200, 300, (pn) => drawHeat(pn, n), POT[0], POT[1] + 0.95 + 0.3 * (1 - grow(t, T_MIDDLE - 0.3, 0.45)), POT[2] + 0.1, 0.45 * (1 - 0.6 * grow(t, T_MIDDLE - 0.3, 0.45)), 0.55, true);
  // the cross-section of the pot, beside it: the middle stays hot, the edges cool
  const g = grow(t, T_MIDDLE - 0.3, 0.45), k = by(t, T_EDGES) ? 1 : 0;
  const sx = POT[0] + 0.1, sy = POT[1] + 1.45, sz = POT[2] + 0.6;
  card(out, `section${k}`, 420, 320, (pn) => drawSection(pn, k), sx, sy, sz, 1.15 * g, 0.88 * g);
  if (by(t, T_COOL) && t < T_COOL + 0.5) burst(out, [sx, sy, sz + 0.05], t, T_COOL - 0.05, 0.9, "#cfe0ff");
  // germs crowd into the warm middle
  for (let i = 0; i < 7; i++) {
    const t0 = T_FEAST + (i < 3 ? 0.1 * i : 0.4 + 0.08 * i), gg = grow(t, t0, 0.25);
    if (gg < 0.02) continue;
    const a = i * 2.4 + t * 1.5;
    card(out, `germ${i % 3}`, 140, 140, (pn) => drawGerm(pn, i % 3), sx + 0.22 * Math.cos(a) * (i % 3 ? 1 : 0.4), sy + 0.17 * Math.sin(a), sz + 0.04, 0.3 * gg, 0.3 * gg);
  }
  void T_GERMS;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "green") greenSet(id, t, cam, out);
  else if (s.scene === "pit") pitSet(id, t, cam, out);
  else if (s.scene === "room") roomSet(id, t, cam, out);
  else if (s.scene === "yard") yardSet(id, t, cam, out);
  else kitchenSet(id, t, cam, out);
  void DR;
  return out;
};
