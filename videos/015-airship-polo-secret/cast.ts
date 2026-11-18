// The cast and hand-drawn props of the airship story: Aida (cream blouse, navy skirt, bonnet; grey-haired and in plum
// thirty years on), her mother (plum dress, bonnet) and father (top hat, grey moustache), Santos-Dumont (dark suit,
// straw cap, black moustache), Parisians, polo players in white with red or blue caps, the crowd at Bagatelle, her
// husband and a young navy officer at dinner. The drawn props: the "Shh!" card, her name tag, a coffee cup, the three
// lessons, his bicycle, the shout, the polo horses and mallets, the "first" rosette, the newspaper, the cradle, the ring
// and the lily, the photo with its locked delete button, the crossed-out ring, her name blacked out, the "thirty years"
// card, the officer's airship bubble and her memory bubble. Every prop is an unlit ink-outlined drawing; cards that
// arrive mid-shot grow in over a few frames (never pop); arms keep one pose for the whole shot (a raised arm jumps).
import { Pen, townsfolk, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, CAFE, FLD, POLO, PARL, DIN, smooth, shipAt, chaseX, strollX, kickT,
  T_NOBODY, T_AIDA, T_LOVES, T_LUNCH, T_THREE, T_SHOUTING, T_MIDDLE, T_CHEERS, T_FIRST, T_HEAR, T_PRINTED, T_BORN,
  T_MARRIED, T_DIED, T_PHOTO, T_DELETE, T_MARRY, T_SAY, T_NAME, T_THIRTY, T_BRAGGED, T_TOLD, T_FIRST2, T_FEARED,
} from "./story";

const AIDA: Outfit = { jacket: "#efe4cc", pants: "#2f4a7a", boots: "#3a2a20", hat: "bonnet", dress: "#2f4a7a", skin: SKINS[1] };
const AIDA_OLD: Outfit = { jacket: "#7a4a7a", pants: "#4a3a5a", boots: "#2a2220", hat: "hair", hair: "#d8d3cc", dress: "#5a3a6a", skin: SKINS[1] };
const MOTHER: Outfit = { jacket: "#7a3a5a", pants: "#5a2a44", boots: "#2a2220", hat: "bonnet", dress: "#6a2e4c", skin: SKINS[0] };
const FATHER: Outfit = { jacket: "#2e2a36", pants: "#3a3640", boots: "#1e1a1c", hat: "tophat", moustache: "#bdb6ae", skin: SKINS[0] };
const SANTOS: Outfit = { jacket: "#34343e", pants: "#2e2e36", boots: "#1e1a1c", hat: "cap", cap: "#d8c48e", moustache: "#1e1a1c", skin: SKINS[1] };
const HUSBAND: Outfit = { jacket: "#2a2a30", pants: "#2a2a30", boots: "#1e1a1c", hat: "hair", hair: "#a8a39c", moustache: "#a8a39c", skin: SKINS[0] };
const OFFICER: Outfit = { jacket: "#1f2c4a", pants: "#1f2c4a", boots: "#151216", hat: "cap", cap: "#f2f0ea", buttons: "#e8c45a", skin: SKINS[2] };
const PLAYER = (v: number): Outfit => ({ jacket: "#f2efe6", pants: "#e8e0cc", boots: "#3a2a20", hat: "cap", cap: v % 2 ? "#2f5fa0" : "#b8302c", skin: SKINS[v % 4] });
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map((v) => townsfolk(v));
const INKC = "#241726", PAPER = "#f6ecd2";

// ---------------- drawings ----------------
const txt = (p: Pen, s: string, x: number, y: number, px: number, col = INKC) => {
  const g = p.g; g.font = `bold ${px}px Georgia, serif`; g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s, x, y);
};
/** a speech card (300 x 220): a white bubble with words in it */
const drawSay = (p: Pen, s: string, px = 90, col = INKC) => {
  p.ell(150, 96, 136, 84, "#ffffff", 8);
  p.poly([[110, 160], [150, 172], [96, 214]], "#ffffff", 7);
  p.ell(150, 96, 128, 76, "#ffffff", 0);
  txt(p, s, 150, 100, px, col);
};
/** a paper tag (300 x 140) with words */
const drawTag = (p: Pen, s: string, col = "#2f4a7a", px = 72) => {
  p.poly([[14, 18], [286, 10], [290, 128], [10, 132]], PAPER, 8);
  txt(p, s, 150, 72, px, col);
};
/** a coffee cup on its saucer (200 x 160) */
const drawCup = (p: Pen) => {
  p.ell(100, 132, 86, 18, "#ffffff", 7);
  p.poly([[44, 44], [156, 44], [140, 124], [60, 124]], "#ffffff", 7);
  p.arc(160, 80, 26, 24, -80, 90, 9, "#ffffff"); p.arc(160, 80, 26, 24, -80, 90, 3);
  p.ell(100, 46, 54, 9, "#6a4228", 4);
};
/** three lessons (300 x 140): three boxes ticked off one by one (n ticks, 0..3) */
const drawLessons = (p: Pen, n: number) => {
  p.poly([[10, 14], [290, 8], [292, 132], [8, 134]], PAPER, 8);
  for (let i = 0; i < 3; i++) {
    const x = 34 + i * 88, y = 34;
    p.poly([[x, y], [x + 70, y], [x + 70, y + 70], [x, y + 70]], "#ffffff", 5);
    if (i < n) p.stroke([[x + 10, y + 36], [x + 28, y + 58], [x + 64, y + 6]], 11, "#2f8a4a");
  }
};
/** a bicycle seen from the side (400 x 240), wheels turned by a */
const drawBike = (p: Pen, a: number) => {
  for (const cx of [86, 314]) {
    p.ell(cx, 160, 72, 72, null, 9);
    for (let k = 0; k < 3; k++) { const b = a + (k * Math.PI) / 3; p.stroke([[cx - Math.cos(b) * 66, 160 - Math.sin(b) * 66], [cx + Math.cos(b) * 66, 160 + Math.sin(b) * 66]], 3, "#5a5660"); }
  }
  p.line([[86, 160], [170, 160], [250, 70], [150, 70], [86, 160]], "#2f4a3a", 9);
  p.line([[170, 160], [150, 70]], "#2f4a3a", 9);
  p.line([[250, 70], [314, 160]], "#2f4a3a", 9);
  p.line([[244, 70], [236, 36], [270, 30]], "#2f4a3a", 8);
  p.poly([[132, 58], [176, 58], [170, 70], [138, 70]], "#3a2a20", 4);
};
/** a polo horse standing, seen from the side (420 x 360), facing right */
const drawHorse = (p: Pen, col: string) => {
  for (const x of [120, 150, 290, 318]) p.line([[x, 200], [x - 4, 340]], col, 22);
  for (const x of [120, 150, 290, 318]) p.poly([[x - 16, 332], [x + 10, 332], [x + 10, 350], [x - 16, 350]], INKC, 0);
  p.ell(220, 180, 130, 62, col, 9);
  p.poly([[310, 150], [350, 60], [392, 60], [404, 96], [372, 110], [346, 186]], col, 9);
  p.dot(378, 80, 7);
  p.line([[96, 160], [60, 250]], "#3a2a20", 16);
  p.poly([[330, 70], [312, 120], [300, 112]], "#3a2a20", 4);
  p.poly([[170, 130], [250, 130], [244, 158], [176, 158]], "#8a3a2c", 6); // the saddle cloth
};
/** a polo mallet (100 x 400) */
const drawMallet = (p: Pen) => { p.line([[56, 20], [48, 360]], "#b58a4c", 9); p.poly([[10, 352], [92, 352], [92, 386], [10, 386]], "#e8dcc0", 6); };
/** a rosette (240 x 300): blue ribbons, a gold centre with "1st" */
const drawRosette = (p: Pen) => {
  p.poly([[96, 150], [70, 290], [100, 270], [118, 296], [126, 160]], "#2f5fa0", 6);
  p.poly([[144, 150], [170, 290], [140, 270], [122, 296], [114, 160]], "#2f5fa0", 6);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; p.ell(120 + Math.cos(a) * 66, 120 + Math.sin(a) * 66, 30, 30, "#3f78c0", 5); }
  p.ell(120, 120, 72, 72, "#e8c45a", 7);
  txt(p, "1st", 120, 124, 64);
};
/** the newspaper (360 x 440): a masthead, columns of grey lines, a small airship picture */
const drawPaper = (p: Pen) => {
  p.poly([[10, 10], [350, 4], [354, 432], [6, 436]], "#f4efe2", 8);
  txt(p, "NEWS", 180, 54, 64);
  p.line([[24, 92], [336, 92]], INKC, 4, false);
  for (let r = 0; r < 12; r++) for (const c of [0, 1]) p.line([[30 + c * 160, 120 + r * 24], [160 + c * 160 - (r % 3) * 14, 120 + r * 24]], "#9a958a", 6, false);
  p.poly([[196, 300], [336, 300], [336, 410], [196, 410]], "#dcd6c6", 4);
  p.ell(266, 340, 52, 16, "#ecdcaa", 4); p.poly([[258, 368], [274, 368], [274, 380], [258, 380]], "#b5874c", 3);
};
/** a cradle (240 x 200) */
const drawCradle = (p: Pen) => {
  p.arc(120, 70, 100, 100, 20, 160, 12, "#b58a4c");
  p.poly([[30, 100], [210, 100], [190, 160], [50, 160]], "#c9965a", 8);
  p.ell(120, 92, 34, 26, "#ffe2c2", 6); p.ell(120, 112, 70, 18, "#f4f1ea", 5);
};
/** a wedding ring (220 x 220) with a sparkle */
const drawRing = (p: Pen) => {
  p.ell(110, 130, 74, 70, null, 30, 0, 360); p.ell(110, 130, 74, 70, null, 18, 0, 360);
  p.arc(110, 130, 74, 70, 0, 360, 14, "#e8c45a");
  p.poly([[110, 18], [124, 50], [110, 62], [96, 50]], "#cfe8ff", 6);
};
/** a lily (200 x 260) */
const drawLily = (p: Pen) => {
  p.line([[100, 250], [104, 110]], "#3f7a3a", 9);
  p.poly([[104, 160], [150, 130], [160, 150]], "#4a8a42", 5);
  for (const a of [-0.9, 0, 0.9]) p.poly([[100, 110], [100 + 70 * Math.sin(a) - 24, 40 - 10 * Math.abs(a)], [100 + 70 * Math.sin(a) + 24, 40 - 10 * Math.abs(a)]], "#ffffff", 6);
  p.ell(100, 100, 14, 14, "#f2c14e", 4);
};
/** the photo (300 x 360): a snapshot of the girl in the airship, its delete button locked (lock 0..1) */
const drawPhoto = (p: Pen, lock: number) => {
  p.poly([[10, 10], [290, 6], [294, 300], [6, 304]], "#ffffff", 8);
  p.poly([[30, 30], [270, 28], [272, 240], [28, 242]], "#8fc0e8", 4);
  p.ell(150, 110, 100, 34, "#ecdcaa", 6);
  p.line([[90, 150], [210, 150]], "#7a5a3a", 6);
  p.poly([[134, 170], [166, 170], [166, 196], [134, 196]], "#b5874c", 4);
  p.ell(150, 166, 12, 14, "#ffe2c2", 4);
  p.poly([[96, 318], [204, 318], [204, 354], [96, 354]], "#c0353a", 6);
  txt(p, "DELETE", 150, 337, 26, "#ffffff");
  if (lock > 0.01) {
    p.arc(240, 300, 20, 24, 180, 360, 9, "#5a5660");
    p.poly([[212, 300], [268, 300], [268, 346], [212, 346]], "#e8c45a", 6);
  }
};
/** a red X (200 x 200) */
const drawX = (p: Pen) => { p.stroke([[30, 30], [170, 170]], 30, "#d8342c"); p.stroke([[170, 30], [30, 170]], 30, "#d8342c"); };
/** her name card (340 x 140) */
const drawName = (p: Pen) => { p.poly([[12, 16], [328, 8], [332, 128], [8, 132]], PAPER, 8); txt(p, "AIDA", 170, 72, 92, "#2f4a7a"); };
/** a black bar (300 x 80) */
const drawBar = (p: Pen) => { p.poly([[6, 10], [294, 4], [296, 74], [4, 78]], "#1c1a20", 0); };
/** a thought bubble (360 x 300) with the airship in it; kid = the girl in its basket */
const drawBubble = (p: Pen, kid: boolean) => {
  p.ell(180, 130, 168, 118, "#ffffff", 8);
  p.ell(60, 262, 22, 18, "#ffffff", 6); p.ell(30, 290, 12, 10, "#ffffff", 5);
  p.ell(180, 98, 112, 38, "#ecdcaa", 7);
  p.line([[110, 144], [250, 144]], "#7a5a3a", 6);
  p.poly([[162, 168], [198, 168], [198, 200], [162, 200]], "#b5874c", 5);
  p.line([[166, 168], [166, 144]], "#7a5a3a", 3); p.line([[194, 168], [194, 144]], "#7a5a3a", 3);
  if (kid) { p.ell(180, 160, 13, 15, "#ffe2c2", 4); p.arc(180, 152, 20, 7, 180, 360, 6, "#f4f1ea"); }
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = D0, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, 1);
};
/** someone walking along (dx, dz): side or front view picked from the camera, 48 poses per step cycle */
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, phase: number, expr: Expr,
  so: SideOpts = {}, y = D0, shadow = true) => {
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "march", phase: q(phase, 48), expr, blink: lidAt(t, i) }, { mode: "march", phase: q(phase, 48), expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs), ...so }, 1));
  if (shadow) blob(out, x, y, z, 1);
};
/** a card that grows in from t0 over d seconds (scale 0 -> 1, the drawing never changes, so no frame jumps) */
const grow = (t: number, t0: number, d = 0.25) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false, rot = 0) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft, rot });
};
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);
/** a burst of light from t0 (0.5 s, a kick frame), shrinking away at the end (never vanishes at full size) */
const burst = (out: Stage, t: number, t0: number, x: number, y: number, z: number, s: number) => {
  const u = (t - t0 + 1e-6) / 0.5;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 15), k = 1 - smooth((u - 0.55) / 0.45);
  card(out, `burst${uq}`, 500, 500, (pn) => fxBurst(pn, uq), x, y, z, s * k, s * k, true);
};
/** the pilot in the basket of the airship (if it is in the shot) */
const pilot = (cam: CamInfo, t: number, out: Stage, id: number, expr: Expr, extra: FrontOpts = {}) => {
  const s = shipAt(id, t);
  if (s) front(cam, t, out, 1, AIDA, "aida", s.x, s.z, expr, extra, s.y + 0.02, false);
};

// ---------------- the places ----------------
const parisSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const fy = D0 + 0.18;
  if (id === 1) { // the airship over the street; people on the far pavement look up and wave
    pilot(cam, t, out, 1, "grin", { wave: wave(t, 0, 5) });
    front(cam, t, out, 40, FOLK[0], "f0", -7.0, -6.4, "shock", { wave: 0.6 }, fy);
    front(cam, t, out, 41, FOLK[1], "f1", -5.6, -6.8, "laugh", { wave: wave(t, 1, 6) }, fy);
    front(cam, t, out, 42, FOLK[4], "f4", 3.5, -6.6, "shock", {}, fy);
    return;
  }
  if (id === 3) { // Aida and her mother stroll along the pavement
    const x = strollX(t), ph = t * 1.1;
    walker(cam, t, out, 1, AIDA, "aida", x, 6.6, 1, 0, ph, t >= T_AIDA - 0.07 ? "grin" : "smile", {}, fy);
    walker(cam, t, out, 2, MOTHER, "mom", x - 0.85, 7.25, 1, 0, ph + 0.3, "smile_closed", {}, fy);
    front(cam, t, out, 43, FOLK[2], "f2", 4.2, 7.6, "smile", {}, fy);
    front(cam, t, out, 44, FOLK[5], "f5", 6.2, 7.2, "smile_closed", {}, fy);
    const g = grow(t, T_AIDA, 0.3);
    card(out, "tagAida", 300, 140, (p) => drawTag(p, "Aida, 19"), x + 0.25, D0 + 2.35, 6.5, 0.62 * g, 0.29 * g);
    return;
  }
  // 4 and 14: the cafe; Santos-Dumont at his table, the airship tied up above the street
  const [cx, , cz] = CAFE;
  front(cam, t, out, 10, SANTOS, "santos", cx + 0.6, cz + 1.15, id === 4 ? (t >= T_LOVES - 0.07 ? "grin" : "smile") : t >= T_NAME - 0.07 ? "smile_closed" : "smile", { mode: "sit" }, D0 + 0.42, false);
  if (id === 4) {
    front(cam, t, out, 45, FOLK[3], "f3", cx - 3.0, cz + 0.8, "laugh", { wave: wave(t, 2, 5) }, fy);
    front(cam, t, out, 46, FOLK[6], "f6", cx + 3.1, cz + 0.9, "grin", { wave: 0.5 }, fy);
    front(cam, t, out, 47, FOLK[7], "f7", cx - 6.0, -6.5, "smile", { wave: wave(t, 3, 6) }, fy);
    front(cam, t, out, 48, FOLK[0], "f0", cx - 1.6, cz + 1.4, "smile", { mode: "sit" }, D0 + 0.42, false);
    const g = grow(t, T_LUNCH, 0.3);
    card(out, "cup", 200, 160, drawCup, cx + 0.45, D0 + 1.08, cz + 0.55, 0.22 * g, 0.18 * g);
    return;
  }
  // 14: her name, blacked out
  const g = grow(t, T_SAY - 0.1, 0.3), bar = smooth((t - T_NAME + 0.07) / 0.3);
  card(out, "name", 340, 140, drawName, cx + 0.15, D0 + 2.3, cz + 0.6, 0.85 * g, 0.35 * g);
  if (bar > 0) card(out, "bar", 300, 80, drawBar, cx + 0.15 - 0.4 * (1 - bar), D0 + 2.3, cz + 0.55, 0.8 * bar + 0.005, 0.2);
  front(cam, t, out, 48, FOLK[2], "f2b", cx - 1.5, cz + 1.4, "smile", { mode: "sit" }, D0 + 0.42, false);
};

const fieldSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [fx, , fz] = FLD;
  if (id === 5) { // she asks; three lessons
    front(cam, t, out, 1, AIDA, "aida", fx - 0.75, fz + 2.4, t >= T_THREE - 0.07 ? "grin" : "smile", { wave: 0.4 });
    front(cam, t, out, 10, SANTOS, "santos", fx + 0.75, fz + 2.5, t >= T_THREE - 0.07 ? "laugh" : "smile");
    const n = t >= T_THREE + 0.5 ? (t >= T_THREE + 0.9 ? 3 : 2) : 1, g = grow(t, T_THREE, 0.3);
    card(out, `lessons${n}`, 300, 140, (p) => drawLessons(p, n), fx, D0 + 3.0, fz + 2.6, 1.0 * g, 0.47 * g);
    return;
  }
  if (id === 6) { // up she goes, alone; he waves from the grass
    pilot(cam, t, out, 6, "laugh", { wave: wave(t, 0, 6) });
    front(cam, t, out, 10, SANTOS, "santos", fx + 1.6, fz + 3.2, "laugh", { wave: wave(t, 1, 7) });
    return;
  }
  // 7: he pedals after her along the road, shouting advice
  pilot(cam, t, out, 7, "grin", { wave: 0.5 });
  const bx = chaseX(t) - 1.0, bz = fz + 22.6;
  walker(cam, t, out, 10, SANTOS, "santos", bx, bz, 1, 0, t * 1.6, t >= T_SHOUTING - 0.07 ? "laugh" : "grin", {}, D0 + 0.5, false);
  card(out, `bike${q((t * 7) % (Math.PI / 3), 12)}`, 400, 240, (p) => drawBike(p, q((t * 7) % (Math.PI / 3), 12)), bx + 0.05, D0 + 0.62, bz - 0.06, 1.75, 1.05);
  blob(out, bx, D0 + 0.06, bz, 1.2);
  const g = grow(t, T_SHOUTING, 0.25);
  card(out, "shout", 300, 220, (p) => drawSay(p, "!!", 110, "#b8302c"), bx + 0.9, D0 + 2.9, bz, 0.9 * g, 0.66 * g);
};

const poloSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [ox, , oz] = POLO;
  if (id === 8) { pilot(cam, t, out, 8, "grin", { wave: 0.5 }); return; }
  // the crowd on the stand, the players and their horses
  const happy = t >= T_CHEERS - 0.07 || id === 10;
  for (let i = 0; i < 9; i++) front(cam, t, out, 60 + i, FOLK[i % 8], `st${i}`, ox - 9 + i * 2.1, oz - 23.4 + (i % 2) * 0.8, happy ? "laugh" : "shock", { wave: i % 2 ? wave(t, i, 6) : 0.55 }, D0 + 0.5, false);
  const pl: [number, number, number][] = id === 9 ? [[3.6, 4.6, 0], [-4.4, 3.2, 1], [-1.2, 7.4, 2], [1.4, 1.2, 3]] : [[2.8, 0.2, 0], [-0.6, 0.4, 1], [0.6, -1.4, 2]];
  for (const [x, z, v] of pl) {
    front(cam, t, out, 70 + v, PLAYER(v), `pl${v}`, ox + x, oz + z, happy ? (v % 2 ? "laugh" : "grin") : "shock", { wave: id === 10 ? wave(t, v, 6) : 0.35 });
    card(out, "mallet", 100, 400, drawMallet, ox + x + 0.32, D0 + 0.8, oz + z + 0.05, 0.22, 0.88, false, 0.25);
  }
  if (id === 9) {
    card(out, "horseB", 420, 360, (p) => drawHorse(p, "#8a5a3a"), ox - 8.5, D0 + 0.82, oz + 5.5, 1.95, 1.67);
    card(out, "horseG", 420, 360, (p) => drawHorse(p, "#c9c2b4"), ox + 8.2, D0 + 0.82, oz + 2.0, 1.95, 1.67);
    pilot(cam, t, out, 9, happy ? "laugh" : "grin", { wave: wave(t, 0, 5) });
    burst(out, t, kickT(T_MIDDLE), ox, D0 + 0.5, oz + 0.7, 1.6);
    return;
  }
  // 10: Aida beside the basket, the crowd round her; the first woman to pilot a powered aircraft
  front(cam, t, out, 1, AIDA, "aida", ox + 1.3, oz + 1.4, t >= T_FIRST - 0.07 ? "laugh" : "grin", { wave: wave(t, 0, 5) });
  front(cam, t, out, 80, FOLK[1], "c1", ox + 2.6, oz - 0.4, "laugh", { wave: wave(t, 2, 6) });
  front(cam, t, out, 81, FOLK[2], "c2", ox - 0.4, oz + 0.2, "grin");
  const g = grow(t, T_FIRST, 0.3);
  card(out, "rosette", 240, 300, drawRosette, ox + 1.95, D0 + 2.25, oz + 1.5, 0.42 * g, 0.52 * g);
};

const parlourSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [lx, , lz] = PARL, fy = D0 + 0.08;
  if (id === 2) { // the hook: her parents, a finger to the lips
    front(cam, t, out, 20, FATHER, "dad", lx - 0.45, lz - 1.5, "stern", {}, fy);
    front(cam, t, out, 21, MOTHER, "mom", lx + 0.45, lz - 1.45, "stern", { wave: 0.25 }, fy);
    const g = grow(t, T_NOBODY, 0.3);
    card(out, "shh", 300, 220, (p) => drawSay(p, "Shh!", 96), lx + 0.62, D0 + 2.3, lz - 1.3, 0.75 * g, 0.55 * g);
    return;
  }
  if (id === 11) { // they hear about it
    const shock = t >= kickT(T_HEAR) - 1e-6;
    front(cam, t, out, 20, FATHER, "dad", lx - 0.45, lz - 1.5, shock ? "shock" : "neutral", {}, fy);
    front(cam, t, out, 21, MOTHER, "mom", lx + 0.45, lz - 1.45, shock ? "shock" : "smile_closed", {}, fy);
    card(out, "paper", 360, 440, drawPaper, lx - 0.3, D0 + 1.3, lz - 1.15, 0.5, 0.61);
    burst(out, t, kickT(T_HEAR), lx, D0 + 2.2, lz - 1.3, 1.1);
    return;
  }
  if (id === 12) { // you see: three times in the papers
    front(cam, t, out, 20, FATHER, "dad", lx - 0.45, lz - 1.5, t >= T_DIED - 0.07 ? "pained" : "stern", {}, fy);
    card(out, "paper", 360, 440, drawPaper, lx - 0.38, D0 + 1.3, lz - 1.15, 0.5, 0.61);
    const gp = grow(t, T_PRINTED, 0.3);
    card(out, "tag3", 300, 140, (p) => drawTag(p, "3 times", "#8a2e28"), lx + 0.45, D0 + 1.35, lz - 1.1, 0.6 * gp, 0.28 * gp);
    ([[T_BORN, "cradle", drawCradle, 240, 200, 0.44, 0.37], [T_MARRIED, "ringW", drawRing, 220, 220, 0.36, 0.36], [T_DIED, "lily", drawLily, 200, 260, 0.3, 0.39]] as const)
      .forEach(([t0, key, draw, cw, ch, w, h], i) => {
        const g = grow(t, t0, 0.25);
        card(out, key, cw, ch, draw as (p: Pen) => void, lx - 1.15 + i * 0.6, D0 + 2.45, lz - 1.2, w * g, h * g);
      });
    return;
  }
  // 13: the photo you can never delete; no man would marry her
  front(cam, t, out, 21, MOTHER, "mom", lx + 0.5, lz - 1.45, t >= T_FEARED - 0.07 ? "pained" : "nervous", {}, fy);
  front(cam, t, out, 20, FATHER, "dad", lx - 0.55, lz - 1.6, t >= T_MARRY - 0.07 ? "pained" : "stern", {}, fy);
  const g = grow(t, T_PHOTO, 0.3), lk = grow(t, T_DELETE, 0.25);
  card(out, `photo${lk > 0.5 ? 1 : 0}`, 300, 360, (p) => drawPhoto(p, lk > 0.5 ? 1 : 0), lx + 0.95, D0 + 1.85, lz - 1.1, 0.5 * g, 0.6 * g);
  const gr = grow(t, T_MARRY - 0.2, 0.3), gx = grow(t, T_MARRY + 0.15, 0.2);
  card(out, "ringM", 220, 220, drawRing, lx - 0.1, D0 + 2.5, lz - 1.2, 0.36 * gr, 0.36 * gr);
  card(out, "xM", 200, 200, drawX, lx - 0.1, D0 + 2.5, lz - 1.15, 0.36 * gx, 0.36 * gx);
};

const dinnerSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [dx, , dz] = DIN, sy = D0 + 0.42;
  const told = t >= T_TOLD - 0.07;
  front(cam, t, out, 30, AIDA_OLD, "aidaOld", dx - 1.0, dz - 1.0, id === 16 ? (told ? "grin" : "smile_closed") : "smile_closed", { mode: "sit" }, sy, false);
  front(cam, t, out, 31, HUSBAND, "husband", dx - 0.05, dz - 1.1, id === 16 && t >= kickT(T_FIRST2) - 1e-6 ? "shock" : "smile", { mode: "sit" }, sy, false);
  front(cam, t, out, 32, OFFICER, "officer", dx + 1.0, dz - 1.0, id === 16 && t >= kickT(T_FIRST2) - 1e-6 ? "shock" : "laugh", { mode: "sit", wave: id === 15 ? wave(t, 0, 5) : 0.3 }, sy, false);
  if (id === 15) {
    const g = grow(t, T_THIRTY, 0.3), b = grow(t, T_BRAGGED, 0.3);
    card(out, "tag30", 300, 140, (p) => drawTag(p, "30 years", "#7a4a7a", 64), dx - 0.8, D0 + 2.35, dz - 0.9, 0.7 * g, 0.33 * g);
    card(out, "bubbleO", 360, 300, (p) => drawBubble(p, false), dx + 0.9, D0 + 2.4, dz - 0.9, 0.85 * b, 0.71 * b);
    return;
  }
  const g = grow(t, T_TOLD, 0.9);
  card(out, "bubbleA", 360, 300, (p) => drawBubble(p, true), dx - 0.55, D0 + 2.05, dz - 0.85, 0.7 * g, 0.58 * g);
  burst(out, t, kickT(T_FIRST2), dx - 0.55, D0 + 2.05, dz - 0.8, 1.0);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "paris") parisSet(id, t, cam, out);
  else if (s.scene === "field") fieldSet(id, t, cam, out);
  else if (s.scene === "polo") poloSet(id, t, cam, out);
  else if (s.scene === "parlour") parlourSet(id, t, cam, out);
  else dinnerSet(id, t, cam, out);
  return out;
};
