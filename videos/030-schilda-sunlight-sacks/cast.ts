// The cast and hand-drawn props of the Schilda legend: the white-haired old councillor, the elders of the council,
// the wives of Schilda (bonnets, aprons), townsfolk, two builders with hammers, a prince on his throne with three wise
// men, a traveller with his bundle, children, and the folk of a far-away town. Every prop is an unlit ink-outlined
// drawing: fool's caps, a book of wisdom, scrolls, a crown, the plan, sacks, buckets and a mousetrap, sunshine, eyes in
// the dark, the beam of light through the crack, windows, dust, snow, smoke and bundles. Cards that arrive mid-shot
// grow in, and cards that leave shrink away or move out of frame: nothing pops.
import { Pen, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxBurst, fxPuff, KID } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, HZ, HH, DOORW, SX, CT, OH, DK, SHOTS, ELDER, TABLE, THRONE, OTABLE, smooth, clamp01, V3, windowsOn,
  T_CLEVER, T_FOOLISH, T_PURPOSE, T_SCHILDA, T_PRINTED, T_MEN, T_WISE, T_PRINCES, T_CALLING, T_ADVICE, T_NOMEN, T_HOME,
  T_ELDERS, T_AGREED, T_WISDOM, T_FOOLISH2, T_HOME2, T_BUILT, T_THREE, T_PROUD, T_ROOF, T_OPENING, T_WHOLE, T_MARCHED,
  T_DARK, T_SPECK, T_SUNNY, T_NOON, T_CAUGHT, T_SACKS, T_BUCKETS, T_MOUSE, T_RAN, T_POURED, T_STILL, T_TRAVELLER,
  T_TOLD, T_ROOF2, T_OFF, T_LIGHT, T_SUMMER, T_SKY, T_WINTER, T_BACK, T_DARK3, T_COUNCILLOR, T_SAW, T_BEAM, T_CRACK,
  T_WIN1, T_FORGOT, T_WIN2, T_LIKELY, T_JOKES, T_TOWNS, T_LEGEND, T_PLAYED, T_FOOL, T_STUCK, T_BURNED, T_SCATTERED,
  T_WORLD, T_STORY, T_EVERY, T_FEW, T_SCHILDAS,
} from "./story";

const Y = D0;
const ELDERO: Outfit = { jacket: "#4a3f6a", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#ece8e0", skin: SKINS[1], moustache: "#ece8e0", build: "stout" };
const COUNCIL: Outfit[] = [
  { jacket: "#2f5f6a", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#b8b4ac", skin: SKINS[0], moustache: "#b8b4ac" },
  { jacket: "#7a4a32", pants: "#4a4f5e", boots: "#2a2220", hat: "hair", hair: "#6b4a32", skin: SKINS[2], build: "stout" },
  { jacket: "#3f5f8a", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#d8d4cc", skin: SKINS[3], moustache: "#d8d4cc" },
];
const WOMEN: Outfit[] = [
  { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", hair: "#6b4a32", dress: "#f2ead8", skin: SKINS[0] },
  { jacket: "#2f5f6a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", hair: "#3a2a20", dress: "#efe4cc", skin: SKINS[2] },
  { jacket: "#5d7a3a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", hair: "#a8743e", dress: "#f4ecdc", skin: SKINS[3] },
];
const FOLK: Outfit[] = [
  { jacket: "#3f5f8a", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#3a2a20", skin: SKINS[0], moustache: "#3a2a20" },
  { jacket: "#6a4a6a", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#6b4a32", dress: "#c25a7a", skin: SKINS[1] },
  { jacket: "#8a6a3e", pants: "#4a4f5e", boots: "#3a2a20", hat: "hair", hair: "#a8743e", skin: SKINS[2] },
  { jacket: "#3f6fa0", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#3a2a20", dress: "#d9a441", skin: SKINS[3] },
  { jacket: "#5a3a2a", pants: "#d8cbb0", boots: "#2a2220", hat: "hair", hair: "#6b4a32", skin: SKINS[0] },
  { jacket: "#2f5a6a", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#a8743e", dress: "#5a8fc2", skin: SKINS[1] },
  { jacket: "#7a4a32", pants: "#4a4f5e", boots: "#2a2220", hat: "hair", hair: "#2a2220", skin: SKINS[1], moustache: "#6b4a32" },
  { jacket: "#4a6a3a", pants: "#3b3f52", boots: "#2a2220", hat: "bonnet", hair: "#6b4a32", dress: "#8c3b4a", skin: SKINS[2] },
];
const BUILDERS: Outfit[] = [
  { jacket: "#6a5a4a", pants: "#4a4f5e", boots: "#3a2a20", hat: "cap", cap: "#4a4850", skin: SKINS[0] },
  { jacket: "#5a6a7a", pants: "#5a4a3a", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", skin: SKINS[2], moustache: "#3a2a20" },
];
const PRINCEO: Outfit = { jacket: "#6a2a7a", pants: "#f2ead8", boots: "#2a2220", hat: "hair", hair: "#a8743e", skin: SKINS[0], sash: "#d9a441", buttons: "#e8c45a" };
const WISE: Outfit[] = [
  { jacket: "#2a3a5a", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[1], moustache: "#8a8a8a" },
  { jacket: "#3a2a20", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[2] },
  { jacket: "#3a5a3a", pants: "#3b3f52", boots: "#2a2220", hat: "tophat", skin: SKINS[3], moustache: "#3a2a20" },
];
const TRAVELLER: Outfit = { jacket: "#5d7a3a", pants: "#6a5a4a", boots: "#3a2a20", hat: "cap", cap: "#8a5a34", skin: SKINS[2], moustache: "#6b4a32" };
const KIDS: Outfit[] = [KID, { ...KID, jacket: "#5a8fc2", pants: "#6a4a32", cap: "#d9a441" }];

// ---------------- drawings ----------------
/** a fool's cap (240 x 200): two floppy points with bells, red and yellow halves, a band */
const drawCap = (p: Pen) => {
  p.poly([[40, 170], [24, 60], [6, 20], [60, 60], [120, 130]], "#c0392b", 6);
  p.poly([[200, 170], [216, 60], [234, 20], [180, 60], [120, 130]], "#e8b84a", 6);
  p.poly([[70, 150], [120, 40], [170, 150]], "#3f6fa0", 6);
  p.poly([[36, 150], [204, 150], [210, 192], [30, 192]], "#f2ead8", 6);
  for (const [x, y] of [[10, 22], [230, 22], [120, 40]]) p.ell(x, y, 14, 14, "#f6d25a", 4);
};
/** a thick book (220 x 160), closed, leather and gold */
const drawBook = (p: Pen) => {
  p.poly([[20, 30], [190, 14], [206, 132], [28, 150]], "#7a3a2a", 7);
  p.poly([[34, 44], [182, 30], [194, 120], [40, 134]], "#8c4a32", 0);
  p.ell(112, 84, 30, 26, null, 0); p.arc(112, 84, 30, 26, 0, 360, 7, "#e8b84a");
  p.line([[204, 30], [212, 136]], "#f2ead8", 10);
};
/** an open book (300 x 200): two pages with a little drawing of a hall and a sack */
const drawOpenBook = (p: Pen) => {
  p.poly([[10, 40], [150, 60], [290, 40], [290, 186], [150, 196], [10, 186]], "#7a3a2a", 7);
  p.poly([[22, 46], [148, 64], [148, 184], [22, 174]], "#f6efdc", 4); p.poly([[152, 64], [278, 46], [278, 174], [152, 184]], "#f6efdc", 4);
  p.poly([[44, 150], [44, 110], [86, 84], [126, 110], [126, 150]], "#ecd3a2", 4); p.poly([[40, 110], [86, 72], [130, 110]], "#a5523a", 4);
  p.ell(214, 126, 30, 34, "#d8c8a0", 4); p.ell(214, 86, 16, 16, "#ffd25a", 3);
};
/** a scroll (180 x 120) */
const drawScroll = (p: Pen) => {
  p.poly([[20, 20], [160, 20], [160, 100], [20, 100]], "#f3ead2", 5);
  p.ell(20, 60, 12, 42, "#e0d2b0", 4); p.ell(160, 60, 12, 42, "#e0d2b0", 4);
  for (let i = 0; i < 4; i++) p.line([[44, 38 + i * 16], [136, 38 + i * 16]], "#8a7a6a", 4, false);
};
/** a crown (200 x 140) */
const drawCrown = (p: Pen) => {
  p.poly([[20, 120], [14, 30], [60, 80], [100, 14], [140, 80], [186, 30], [180, 120]], "#e8b84a", 7);
  for (const x of [56, 100, 144]) p.ell(x, 100, 10, 10, "#c0392b", 3);
};
/** the plan (300 x 220): a sheet with a fool's cap drawn on it */
const drawPlan = (p: Pen) => {
  p.poly([[10, 14], [290, 6], [294, 214], [6, 210]], "#f3ead2", 6);
  p.poly([[100, 170], [80, 80], [64, 50], [110, 84], [150, 130]], "#c0392b", 5);
  p.poly([[200, 170], [220, 80], [236, 50], [190, 84], [150, 130]], "#e8b84a", 5);
  p.poly([[96, 160], [204, 160], [208, 190], [92, 190]], "#f2ead8", 5);
  for (const [x, y] of [[64, 50], [236, 50]]) p.ell(x, y, 10, 10, "#f6d25a", 3);
};
/** a sack (160 x 200), open at the top or tied; glow k 0..1 inside */
const drawSack = (p: Pen, tied: number, k: number) => {
  p.poly(tied ? [[60, 40], [100, 40], [140, 120], [136, 192], [24, 192], [20, 120]] : [[24, 24], [136, 24], [148, 120], [136, 192], [24, 192], [12, 120]], "#c8b48a", 6);
  if (tied) { p.line([[54, 50], [106, 50]], "#8a6a48", 8); p.ell(80, 30, 26, 16, "#c8b48a", 5); }
  else p.ell(80, 26, 56, 14, k > 0 ? `rgba(255,${200 + Math.round(30 * k)},90,1)` : "#5a4a3a", 5);
  p.line([[40, 100], [60, 150]], "#a8946a", 4, false);
};
/** a bucket (140 x 140) with sunshine k inside */
const drawBucket = (p: Pen, k: number) => {
  p.poly([[16, 30], [124, 30], [108, 130], [32, 130]], "#7a8a9a", 6);
  for (const y of [60, 100]) p.line([[24, y], [116, y]], "#4a5a6a", 5, false);
  p.ell(70, 30, 54, 12, k > 0 ? "#ffd85a" : "#3a3a44", 5);
  p.arc(70, 30, 56, 40, 180, 360, 5, "#4a5a6a");
};
/** a mousetrap (200 x 120): wooden board, spring bar, a bit of cheese */
const drawTrap = (p: Pen, k: number) => {
  p.poly([[10, 70], [190, 60], [192, 104], [12, 112]], "#c89a5a", 6);
  p.line([[40, 66], [40, 30], [150, 26], [150, 62]], "#b9bcc4", 7);
  p.poly([[110, 70], [150, 62], [140, 86]], "#f2c84a", 4);
  if (k > 0) p.ell(80, 50, 30, 22, "#ffd85a", 4);
};
/** a ball of sunshine (200 x 200), rays phase n */
const drawSun = (p: Pen, n: number) => {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + n * 0.2;
    p.line([[100 + 56 * Math.cos(a), 100 + 56 * Math.sin(a)], [100 + 90 * Math.cos(a), 100 + 90 * Math.sin(a)]], "#ffe27a", 10);
  }
  p.ell(100, 100, 46, 46, "#ffd84a", 6);
  p.ell(86, 86, 14, 10, "#fff4c0", 0);
};
/** a pair of eyes in the dark (180 x 90): open looking dx, closed, flat (half-lidded) or wide */
const drawEyes = (p: Pen, kind: "open" | "closed" | "flat" | "wide", dx: number) => {
  for (const cx of [50, 130]) {
    if (kind === "closed") { p.line([[cx - 26, 48], [cx + 26, 48]], "#f6f2ea", 7, false); continue; }
    const ry = kind === "wide" ? 36 : kind === "flat" ? 16 : 28, rx = kind === "wide" ? 30 : 26;
    p.ell(cx, 46, rx, ry, "#f6f2ea", 0);
    p.ell(cx + dx * 10, 46 + (kind === "flat" ? 4 : 0), kind === "wide" ? 8 : 11, kind === "flat" ? 10 : kind === "wide" ? 8 : 14, "#1a1626", 0);
    if (kind === "flat") p.line([[cx - 28, 34], [cx + 28, 34]], "#2b2950", 10, false);
  }
};
/** the crack and its beam (360 x 600): a jagged bright slit at the top, a soft shaft down to a pool on the floor */
const drawBeam = (p: Pen, k: number) => {
  p.poly([[180, 20], [330, 560], [250, 590], [150, 40]], `rgba(255,226,140,${0.45 * k})`, 0);
  p.ell(280, 572, 80, 22, `rgba(255,232,160,${0.6 * k})`, 0);
  p.line([[150, 4], [162, 20], [154, 34], [170, 52], [164, 66]], "#fff4c8", 9, false);
};
/** a window knocked into the wall (200 x 240): timber frame, leaded panes, a little sill */
const drawWindow = (p: Pen) => {
  p.poly([[14, 14], [186, 14], [186, 210], [14, 210]], "#5a3a26", 6);
  p.poly([[32, 32], [168, 32], [168, 194], [32, 194]], "#bcd4ec", 4);
  p.line([[100, 32], [100, 194]], "#5a3a26", 8, false); p.line([[32, 112], [168, 112]], "#5a3a26", 8, false);
  p.poly([[6, 210], [194, 210], [194, 232], [6, 232]], "#9a8e7a", 5);
  p.line([[46, 46], [80, 80]], "#eaf4ff", 6, false);
};
/** a snowflake dot (40 x 40) */
const drawSnow = (p: Pen) => p.ell(20, 20, 14, 14, "#f8fbff", 3);
/** a smoke puff (300 x 300), grey */
const drawSmoke = (p: Pen, v: number) => {
  const c = ["rgba(120,112,120,0.85)", "rgba(140,132,140,0.85)", "rgba(104,96,108,0.85)"][v % 3];
  p.ell(150, 170, 120, 100, c, 0); p.ell(100, 120, 70, 60, c, 0); p.ell(200, 110, 76, 64, c, 0);
};
/** a bundle on a stick (200 x 200) */
const drawBundle = (p: Pen) => {
  p.line([[20, 190], [170, 40]], "#6a4a32", 8);
  p.ell(160, 56, 40, 36, "#c25a5a", 6); p.dot(146, 46, 6, "#f2ead8"); p.dot(172, 64, 6, "#f2ead8");
};
/** a pointing hand-arrow from the traveller up to the roof (200 x 200) */
const drawArrow = (p: Pen) => {
  p.line([[30, 180], [150, 60]], "#f6f2ea", 14);
  p.poly([[176, 24], [120, 52], [148, 80]], "#f6f2ea", 5);
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
const puff = (out: Stage, p: V3, t: number, t0: number, size: number, d = 0.5) => {
  const u = (t - t0) / d;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 10);
  out.fx.push({ key: `puff${uq}`, cw: 300, ch: 300, draw: (pn) => fxPuff(pn, uq), x: p[0], y: p[1], z: p[2], w: size, h: size, soft: true });
};
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);
const f12 = (t: number, off = 0) => (Math.round(t * 30) + off) % 12;
/** the fool's cap on a person standing at (x, z) (head top about 2 m up for adults), grown by g */
const cap = (out: Stage, x: number, z: number, g = 1, y = Y, kid = false) => {
  if (g > 0.01) card(out, "cap", 240, 200, drawCap, x, y + (kid ? 1.42 : 1.9) + 0.04 * (1 - g), z + 0.06, (kid ? 0.42 : 0.56) * g, (kid ? 0.35 : 0.47) * g);
};
const crown = (out: Stage, x: number, y: number, z: number, g = 1) => card(out, "crown", 200, 140, drawCrown, x, y, z + 0.06, 0.4 * g, 0.28 * g);
/** eyes in the dark at (x, y, z) for person i */
const eyes = (out: Stage, t: number, i: number, x: number, y: number, kind: "open" | "flat" | "wide", dx = 0, s = 1) => {
  const k = lidAt(t, i) > 0.5 ? "closed" : kind, dq = q(dx, 2);
  card(out, `eyes${k}${dq}`, 180, 90, (pn) => drawEyes(pn, k, dq), x, y, DK[2] + 0.3 * (i % 3) - 0.3, 0.5 * s, 0.25 * s);
};
const windowSpots: [number, number][] = [[-2.2, 3.6], [2.2, 3.6], [0, 4.6]];
const windows = (out: Stage, t: number, id: number) => {
  windowSpots.forEach(([x, y], i) => {
    const g = id === 15 ? grow(t, i === 0 ? T_WIN1 : i === 1 ? T_FORGOT : T_WIN2, 0.3) : 1;
    card(out, "window", 200, 240, drawWindow, x, Y + y, HZ + 0.08, 1.15 * g, 1.38 * g);
  });
};

// ---------------- the square ----------------
const crowdSpots: [number, number][] = [[-1.7, 3.4], [-2.8, 3.0], [-4.1, 3.4], [2.9, 3.1], [-3.5, 4.3], [4.2, 3.6], [3.5, 4.6], [-2.4, 5.2]];
const squareSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (windowsOn(id)) windows(out, t, id);
  const [ex, , ez] = ELDER;
  if (id === 1) {
    // the proud old councillor holds up his book of wisdom; on "foolish" a fool's cap lands on his head
    const fo = by(t, T_FOOLISH), pu = by(t, T_PURPOSE);
    front(cam, t, out, 1, ELDERO, "elder", ex, ez, pu ? "laugh" : fo ? "shock" : by(t, T_CLEVER) ? "grin" : "smile", { facing: -1, wave: fo ? 0 : 0.7 });
    const fall = smooth((t - T_FOOLISH + 0.07) / 0.3);
    card(out, "book", 220, 160, drawBook, ex + 0.42 + 0.15 * fall, Y + 2.15 - 1.75 * fall, ez + 0.1, 0.5, 0.36);
    const drop = 5.5 * (1 - smooth((t - T_FOOLISH + 0.4) / 0.33));
    if (t > T_FOOLISH - 0.45) cap(out, ex, ez + 0.02, 1, Y + drop);
    if (fo) burst(out, [ex, Y + 2.3, ez + 0.1], t, T_FOOLISH - 0.05, 1.1);
    ([[-0.65, 3.6], [-1.35, 4.6], [1.35, 5.0]] as [number, number][]).forEach(([x, z], j) =>
      front(cam, t, out, 10 + j, FOLK[j], `f${j}`, x, z, pu ? "laugh" : fo ? "shock" : "smile", { facing: 1, wave: pu ? wave(t, j) : 0 }));
  } else if (id === 2) {
    // the square of Schilda: townsfolk strolling, the empty plot of the hall
    const t0 = SHOTS[1].a / 30;
    for (let j = 0; j < 4; j++) {
      const dir = j % 2 ? -1 : 1, x = -7 * dir + dir * 1.0 * (t - t0) + (j - 1.5) * 2.2;
      walker(cam, t, out, 1 + j, FOLK[j], `f${j}`, x, 6.4 + (j % 2) * 0.6, dir, 0, t * 1.8 + j * 0.3, by(t, T_SCHILDA) ? "grin" : "smile");
    }
    for (let j = 0; j < 4; j++) front(cam, t, out, 6 + j, FOLK[4 + j], `f${4 + j}`, -4.5 + j * 3.2, 10.2 + (j % 2) * 0.8, by(t, T_PRINTED) ? "laugh" : "smile", { wave: by(t, T_PRINTED) ? wave(t, j) : 0 });
    front(cam, t, out, 12, ELDERO, "elder", 1.2, 2.2, "smile", { facing: -1 });
    card(out, "book", 220, 160, drawBook, 1.62, Y + 2.15, 2.3, 0.5, 0.36);
  } else if (id === 4) {
    // only the wives are left, arms folded, cross
    WOMEN.forEach((o, j) => front(cam, t, out, 1 + j, o, `w${j}`, -0.8 + j * 0.8, 3.6 + (j === 1 ? -0.35 : 0), by(t, T_HOME) ? "stern" : by(t, T_NOMEN) ? "nervous" : "neutral", { facing: j === 0 ? 1 : j === 2 ? -1 : 0 }));
  } else if (id === 6) {
    // the builders hammer, the walls rise, the roof drops on; the townsfolk cheer
    for (let j = 0; j < 2; j++) {
      const ph = q(((t * 2.2 + j * 0.5) % 1), 8);
      front(cam, t, out, 1 + j, BUILDERS[j], `b${j}`, j ? 5.6 : -5.6, 3.0, by(t, T_PROUD) ? "grin" : "stern", { facing: j ? -1 : 1, prop: ["hammer", ph < 0.5 ? ph * 2 : 2 - ph * 2] });
    }
    for (let j = 0; j < 5; j++) {
      const [x, z] = crowdSpots[j + 1];
      front(cam, t, out, 10 + j, FOLK[j], `f${j}`, x * 1.3, z + 3.5, by(t, T_ROOF) ? "laugh" : by(t, T_THREE) ? "grin" : "smile", { wave: by(t, T_ROOF) ? wave(t, j) : 0, facing: x < 0 ? 1 : -1 });
    }
    front(cam, t, out, 20, ELDERO, "elder", 1.8, 6.2, by(t, T_ROOF) ? "laugh" : "grin", { facing: -1, wave: by(t, T_BUILT) ? 0.6 : 0 });
    if (by(t, T_ROOF)) { burst(out, [0, Y + HH + 1.0, HZ], t, T_ROOF - 0.05, 3.4); puff(out, [-3.6, Y + HH, HZ + 0.6], t, T_ROOF, 2.2); puff(out, [3.6, Y + HH, HZ + 0.6], t, T_ROOF + 0.05, 2.2); }
  } else if (id === 7) {
    // opening day: the townsfolk march in from both sides through the door
    const t0 = SHOTS[6].a / 30;
    for (let j = 0; j < 7; j++) {
      const sd = j % 2 ? 1 : -1, start = t0 + 0.35 * j - 0.2, u = clamp01((t - start) / 2.4);
      const x0 = sd * (5.5 + 0.4 * j), z0 = 4.0 + 0.3 * (j % 3), x1 = sd * 0.2, z1 = HZ - 1.2;
      // first across to the door front, then in through it
      const k1 = clamp01(u / 0.75), k2 = clamp01((u - 0.75) / 0.25);
      const x = x0 + (x1 - x0) * k1, z = k1 < 1 ? z0 + (HZ + 0.9 - z0) * k1 : HZ + 0.9 + (z1 - HZ - 0.9) * k2;
      if (u >= 1) continue; // inside, behind the dark doorway
      walker(cam, t, out, 1 + j, FOLK[j], `f${j}`, x, z, k1 < 1 ? x1 - x0 : 0.01 * sd, k1 < 1 ? HZ + 0.9 - z0 : -1, t * 1.8 + j * 0.3, by(t, T_MARCHED) ? "grin" : "smile");
    }
    front(cam, t, out, 20, ELDERO, "elder", 1.7, HZ + 1.2, by(t, T_OPENING) ? "grin" : "smile", { facing: -1, wave: by(t, T_WHOLE) ? 0.7 : 0 });
  } else if (id === 9) {
    // noon: they catch the sunshine in a sack, a bucket and a mousetrap, then run for the door
    const hold: [number, number, string][] = [[-1.05, 5.0, "sack"], [0.1, 5.6, "bucket"], [0.95, 4.9, "trap"]];
    hold.forEach(([x0, z0, kind], j) => {
      const t1 = kind === "sack" ? T_SACKS : kind === "bucket" ? T_BUCKETS : T_MOUSE;
      const caught = by(t, t1 + 0.35), run = by(t, T_RAN) && kind !== "trap";
      const u = smooth((t - T_RAN + 0.07) / 0.8), x = run ? x0 + (0 - x0) * 0.75 * u : x0, z = run ? z0 + (HZ + 1.4 - z0) * u : z0;
      const o = j === 1 ? COUNCIL[1] : FOLK[j * 2];
      if (run) walker(cam, t, out, 1 + j, o, `n${j}`, x, z, -x0 * 0.75, HZ + 1.4 - z0, t * 2.6 + j * 0.3, "grin");
      else front(cam, t, out, 1 + j, o, `n${j}`, x, z, caught ? (kind === "trap" ? "laugh" : "grin") : "smile", { wave: 0.95, facing: x0 < 0 ? 1 : x0 > 1 ? -1 : 0 });
      const hy = run ? Y + 1.25 : Y + 2.45, hx = x + (run ? 0.3 : 0.32);
      const kq = caught ? 1 : 0;
      if (kind === "sack") card(out, `sack${kq}${kq}`, 160, 200, (pn) => drawSack(pn, kq, kq), hx, hy, z + 0.1, 0.46, 0.58);
      else if (kind === "bucket") card(out, `bucket${kq}`, 140, 140, (pn) => drawBucket(pn, kq), hx, hy, z + 0.1, 0.42, 0.42);
      else card(out, `trap${kq}`, 200, 120, (pn) => drawTrap(pn, kq), hx, hy, z + 0.1, 0.52, 0.31);
      // a ball of sunshine drops into each one
      const s0 = by(t, T_CAUGHT) ? clamp01((t - t1 + 0.3) / 0.45) : 0;
      if (s0 > 0 && s0 < 1) { const n = f12(t, j * 3); card(out, `sun${n}`, 200, 200, (pn) => drawSun(pn, n), hx, hy + 2.2 * (1 - s0) + 0.2, z + 0.15, 0.5 * (1 - 0.6 * s0), 0.5 * (1 - 0.6 * s0)); }
      if (by(t, t1 + 0.35)) burst(out, [hx, hy + 0.2, z + 0.2], t, t1 + 0.3, 0.8);
    });
    front(cam, t, out, 20, ELDERO, "elder", -1.4, HZ + 2.2, by(t, T_NOON) ? "grin" : "smile", { facing: 1, wave: by(t, T_CAUGHT) ? 0.6 : 0 });
  } else if (id === 11) {
    // the traveller points at the roof; the builders' ropes lift it away
    const to = by(t, T_TOLD);
    front(cam, t, out, 1, TRAVELLER, "trav", -2.0, 7.0, by(t, T_OFF) ? "grin" : to ? "smile" : "neutral", { facing: 1, wave: to ? 0.95 : 0 });
    card(out, "bundle", 200, 200, drawBundle, -2.55, Y + 1.15, 7.1, 0.6, 0.6);
    const ag = grow(t, T_ROOF2 - 0.4, 0.3) * (1 - grow(t, T_OFF + 0.5, 0.3));
    card(out, "arrow", 200, 200, drawArrow, -1.2, Y + 3.0, 6.6, 1.1 * ag, 1.1 * ag);
    for (let j = 0; j < 4; j++) {
      const [x, z] = crowdSpots[j];
      front(cam, t, out, 10 + j, FOLK[j + 2], `f${j + 2}`, x * 0.9 + 1.2, z + 2.2, by(t, T_OFF) ? "shock" : by(t, T_TRAVELLER) ? "nervous" : "neutral", { facing: x < 0 ? 1 : -1 });
    }
    if (by(t, T_OFF)) burst(out, [0, Y + HH + 1.5, HZ - 1], t, T_OFF - 0.05, 3.0);
  } else if (id === 13) {
    // winter evening: snow falls, the roof comes back down, everyone shivers
    for (let i = 0; i < 46; i++) {
      const sx = ((i * 37) % 23) - 11.5, sz = ((i * 53) % 13) - 2, fall = (t * 0.9 + (i * 0.137) % 1) % 1;
      card(out, "snow", 40, 40, drawSnow, sx * 0.9 + 0.3 * Math.sin(t * 2 + i), Y + 9.5 - 9 * fall, sz + 2, 0.12, 0.12);
    }
    for (let j = 0; j < 5; j++) {
      const [x, z] = crowdSpots[j + 1];
      front(cam, t, out, 10 + j, FOLK[j], `f${j}`, x * 1.1, z + 2.5, by(t, T_DARK3) ? "dazed" : by(t, T_BACK) ? "grin" : "nervous", { facing: x < 0 ? 1 : -1, tilt: Math.sin(t * 40 + j) > 0 ? 2 : -2 });
    }
    if (by(t, T_BACK)) puff(out, [0, Y + HH + 0.5, HZ + 0.5], t, T_BACK, 3.0);
    void T_WINTER;
  } else if (id === 15) {
    // the builders knock windows into the wall, dust flies; the old councillor cheers
    for (let j = 0; j < 2; j++) {
      const ph = q(((t * 2.4 + j * 0.5) % 1), 8);
      front(cam, t, out, 1 + j, BUILDERS[j], `b${j}`, j ? 2.0 : -2.0, HZ + 1.3, "grin", { facing: j ? -1 : 1, prop: ["hammer", ph < 0.5 ? ph * 2 : 2 - ph * 2] });
    }
    front(cam, t, out, 3, ELDERO, "elder", 0.9, HZ + 3.4, by(t, T_WIN2) ? "laugh" : by(t, T_WIN1) ? "shock" : "grin", { facing: -1, wave: by(t, T_WIN1) ? wave(t) : 0 });
    windowSpots.forEach(([x, y], i) => { const t0 = i === 0 ? T_WIN1 : i === 1 ? T_FORGOT : T_WIN2; puff(out, [x, Y + y, HZ + 0.3], t, t0, 2.0, 0.6); });
  } else if (id === 17) {
    // the whole town in fool's caps, laughing and dancing
    const st = by(t, T_STUCK);
    crowdSpots.forEach(([x, z], j) => {
      const hop = 0.12 * Math.max(0, Math.sin(t * 9 + j * 1.3));
      front(cam, t, out, 10 + j, FOLK[j], `f${j}`, x, z, st ? "laugh" : by(t, T_FOOL) ? "grin" : by(t, T_PLAYED) ? "smile" : "neutral", { wave: by(t, T_FOOL) ? wave(t, j, 8) : 0, facing: x < 0 ? 1 : -1 }, Y + (by(t, T_FOOL) ? hop : 0));
      cap(out, x, z, grow(t, T_PLAYED + 0.1 * (j % 4), 0.3), Y + (by(t, T_FOOL) ? hop : 0));
    });
    front(cam, t, out, 1, ELDERO, "elder", 0.3, 2.6, st ? "laugh" : "grin", { facing: 0, wave: wave(t, 3, 8) });
    cap(out, 0.3, 2.6, 1);
    if (st) burst(out, [0.3, Y + 2.4, 2.7], t, T_STUCK - 0.05, 1.6);
    void T_LEGEND;
  } else if (id === 18) {
    // golden evening: grey smoke over the houses behind, the townsfolk walk off with their bundles, caps on
    for (let i = 0; i < 6; i++) {
      const u = (t * 0.18 + i / 6) % 1, sg = grow(t, T_BURNED - 0.4, 0.8);
      const s = (3 + 6 * u) * sg * smooth(u / 0.15) * (1 - smooth((u - 0.85) / 0.15));
      card(out, `smoke${i % 3}`, 300, 300, (pn) => drawSmoke(pn, i % 3), -10 + 4 * i + 2 * u, Y + 10 + 14 * u, -22, s, s, true);
    }
    const t0 = SHOTS[17].a / 30;
    for (let j = 0; j < 5; j++) {
      const x = -6 + 1.15 * (t - t0) + j * 2.0, z = 6.3 + (j % 2) * 0.7;
      walker(cam, t, out, 1 + j, FOLK[j], `f${j}`, x, z, 1, 0, t * 1.8 + j * 0.3, by(t, T_SCATTERED) ? "smile" : "nervous");
      card(out, "bundle", 200, 200, drawBundle, x + 0.15, Y + 1.5, z + 0.1, 0.55, 0.55);
      cap(out, x, z, 1);
    }
    void T_WORLD;
  }
};

// ---------------- the court, the council room, the roofless hall ----------------
const courtSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const [tx, , tz] = THRONE;
  front(cam, t, out, 1, PRINCEO, "prince", tx, tz, by(t, T_ADVICE) ? "laugh" : by(t, T_CALLING) ? "grin" : "smile", { mode: "sit" }, Y + 0.55, false);
  crown(out, tx, Y + 0.55 + 1.12, tz, 1);
  WISE.forEach((o, j) => {
    const x = CT[0] - 1.55 + j * 0.66, z = CT[2] + 0.9 - j * 0.5;
    front(cam, t, out, 2 + j, o, `wise${j}`, x, z, by(t, T_WISE) ? (j === 1 ? "grin" : "smile_closed") : "neutral", { facing: 1, wave: by(t, T_PRINCES) && j !== 1 ? 0.6 : 0 });
    if (j !== 1) card(out, "scroll", 180, 120, drawScroll, x + 0.42, Y + 1.15, z + 0.12, 0.42 * grow(t, T_MEN + 0.2 * j, 0.35), 0.28 * grow(t, T_MEN + 0.2 * j, 0.35));
  });
  if (by(t, T_ADVICE)) burst(out, [tx, Y + 2.4, tz + 0.3], t, T_ADVICE - 0.05, 1.2);
};

const roomSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [tx, , tz] = TABLE;
  if (id === 5) {
    // the council agrees on the plan: a fool's cap drawn on paper
    const ag = by(t, T_AGREED), fo = by(t, T_FOOLISH2);
    front(cam, t, out, 1, ELDERO, "elder", tx - 0.85, tz - 0.95, fo ? "laugh" : ag ? "grin" : "neutral", { facing: 1, wave: fo ? 0.6 : 0 });
    COUNCIL.forEach((o, j) => front(cam, t, out, 2 + j, o, `c${j}`, tx + 0.05 + j * 1.0 - (j === 2 ? 0 : 0), tz - 1.1 + (j === 1 ? -0.15 : 0), fo ? (j === 1 ? "laugh" : "grin") : by(t, T_WISDOM) ? "stern" : "neutral", { facing: j === 2 ? -1 : 0 }));
    const g = grow(t, T_FOOLISH2 - 0.2, 0.4);
    card(out, "plan", 300, 220, drawPlan, tx + 0.05, Y + 1.1, tz + 0.2, 0.74 * g, 0.54 * g);
    if (fo) burst(out, [tx, Y + 1.3, tz + 0.3], t, T_FOOLISH2 - 0.05, 1.1);
    void T_ELDERS; void T_HOME2;
  } else {
    // years later: an old storyteller reads the joke book to two children, who laugh
    const jo = by(t, T_JOKES);
    front(cam, t, out, 1, COUNCIL[0], "c0", tx - 0.4, tz - 0.95, jo ? "grin" : "smile", { facing: 1 });
    card(out, "openBook", 300, 200, drawOpenBook, tx - 0.0, Y + 1.15, tz + 0.1, 0.8, 0.53);
    KIDS.forEach((o, j) => front(cam, t, out, 2 + j, o, `k${j}`, tx + 0.55 + j * 0.55, tz - 0.95, by(t, T_TOWNS) ? "laugh" : jo ? "grin" : "smile", { facing: -1, wave: by(t, T_TOWNS) ? wave(t, j) : 0 }));
    if (by(t, T_TOWNS)) burst(out, [tx + 1.1, Y + 1.5, tz + 0.9], t, T_TOWNS - 0.05, 1.0);
    void T_LIKELY;
  }
};

const openSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  // the roofless hall: the council meets in sunshine, a bird flaps overhead
  const [tx, , tz] = OTABLE;
  front(cam, t, out, 1, ELDERO, "elder", tx - 1.1, tz - 0.95, by(t, T_SKY) ? "laugh" : by(t, T_SUMMER) ? "grin" : "smile", { facing: 1, wave: by(t, T_SUMMER) ? 0.6 : 0 });
  COUNCIL.forEach((o, j) => front(cam, t, out, 2 + j, o, `c${j}`, tx - 0.05 + j * 1.0, tz - 1.1, by(t, T_SKY) ? "grin" : "smile", { facing: j === 2 ? -1 : 0 }));
  if (by(t, T_LIGHT)) burst(out, [tx, Y + 4.2, tz - 1], t, T_LIGHT - 0.05, 3.0, "#fff3b0", 0.6);
  const n = f12(t);
  card(out, `sunbig${n}`, 200, 200, (pn) => drawSun(pn, n), OH[0] - 0.7, Y + 5.5, OH[2] - 3.0, 1.0, 1.0);
};

// ---------------- the dark hall ----------------
const darkSet = (id: number, t: number, _cam: CamInfo, out: Stage) => {
  const [dx] = DK;
  if (id === 8) {
    // pitch dark: pairs of eyes blink, look around
    const sp = by(t, T_SPECK), su = by(t, T_SUNNY);
    const pairs: [number, number][] = [[-0.9, 1.85], [0.05, 2.1], [0.95, 1.8], [-0.45, 1.45], [0.6, 1.5]];
    pairs.forEach(([x, y], i) => {
      const g = grow(t, T_DARK - 0.4 + 0.12 * i, 0.25);
      if (g > 0.02) eyes(out, t, i, dx + x, Y + y, su ? "flat" : sp ? "wide" : "open", Math.sin(t * 2 + i * 1.7), g);
    });
  } else if (id === 10) {
    // they pour the sack out: the sunshine fizzles to nothing; "Still dark"
    const po = by(t, T_POURED), st = by(t, T_STILL);
    const pairs: [number, number][] = [[-0.75, 1.9], [0.25, 2.05], [0.95, 1.7]];
    pairs.forEach(([x, y], i) => eyes(out, t, i, dx + x, Y + y, st ? "flat" : po ? "wide" : "open", -0.6 + 0.6 * i));
    const tip = smooth((t - T_POURED + 0.07) / 0.3), sk = 1 - smooth((t - T_STILL + 0.07) / 0.25);
    card(out, `sackPour${q(tip, 4)}`, 160, 200, (pn) => drawSack(pn, 0, sk), dx - 0.3, Y + 1.25, DK[2] + 0.4, 0.42, 0.52);
    if (po && sk > 0.05) { const n = f12(t); card(out, `sun${n}`, 200, 200, (pn) => drawSun(pn, n), dx - 0.3, Y + 0.95 - 0.4 * tip, DK[2] + 0.45, 0.4 * sk, 0.4 * sk); }
  } else {
    // one councillor alone; a thin beam through a crack, his eyes go wide
    const sa = by(t, T_SAW), bk = grow(t, T_BEAM - 0.3, 0.5), cr = by(t, T_CRACK);
    card(out, `beam${q(bk, 8)}`, 360, 600, (pn) => drawBeam(pn, q(bk, 8)), dx - 0.45, Y + 1.75, DK[2] - 0.8, 2.0, 3.3, true);
    eyes(out, t, 1, dx + 0.45, Y + 1.6, cr ? "wide" : sa ? "open" : "flat", sa ? -1 : 0, 1.15);
    if (cr) burst(out, [dx - 0.85, Y + 3.35, DK[2] - 0.75], t, T_CRACK - 0.05, 1.0, "#fff4c8");
    void T_COUNCILLOR; void T_DARK3;
  }
};

// ---------------- the far-away town ----------------
const farSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  // a newcomer from Schilda, cap on, catches sunshine in a sack; the locals stare, then laugh
  const x0 = SX + 0.2, z0 = 2.2, fe = by(t, T_FEW);
  front(cam, t, out, 1, FOLK[0], "f0", x0, z0, by(t, T_STORY) ? "grin" : "smile", { wave: 0.95, facing: 0 });
  cap(out, x0, z0, 1);
  const caught = by(t, T_EVERY) ? 1 : 0;
  card(out, `sack${caught}${caught}`, 160, 200, (pn) => drawSack(pn, caught, caught), x0 + 0.32, Y + 2.45, z0 + 0.1, 0.46, 0.58);
  const s0 = clamp01((t - T_EVERY + 0.6) / 0.55);
  if (s0 > 0 && s0 < 1) { const n = f12(t); card(out, `sun${n}`, 200, 200, (pn) => drawSun(pn, n), x0 + 0.32, Y + 4.8 - 2.2 * s0, z0 + 0.15, 0.5 * (1 - 0.6 * s0), 0.5 * (1 - 0.6 * s0)); }
  if (caught) burst(out, [x0 + 0.32, Y + 2.65, z0 + 0.2], t, T_EVERY - 0.05, 0.9);
  ([[SX - 1.3, 3.4], [SX + 0.9, 3.0], [SX - 1.9, 2.0], [SX + 1.5, 1.8]] as [number, number][]).forEach(([x, z], j) =>
    front(cam, t, out, 10 + j, FOLK[(j + 3) % 8], `l${j}`, x, z, by(t, T_SCHILDAS) ? "laugh" : fe ? "grin" : by(t, T_EVERY) ? "shock" : "neutral", { facing: x < SX ? 1 : -1, wave: by(t, T_SCHILDAS) ? wave(t, j) : 0 }));
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "square") squareSet(id, t, cam, out);
  else if (s.scene === "court") courtSet(id, t, cam, out);
  else if (s.scene === "room") roomSet(id, t, cam, out);
  else if (s.scene === "open") openSet(id, t, cam, out);
  else if (s.scene === "dark") darkSet(id, t, cam, out);
  else farSet(id, t, cam, out);
  void DOORW; void T_OPENING;
  return out;
};
