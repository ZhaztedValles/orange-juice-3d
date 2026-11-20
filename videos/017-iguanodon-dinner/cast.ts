// The cast and hand-drawn props of the Iguanodon dinner: Benjamin Waterhouse Hawkins (brown coat, big moustache), the
// anatomist Richard Owen (black coat, grey hair), the dinner guests in dark coats, waiters in white jackets, workmen,
// Victorian visitors in top hats and bonnets, Belgian miners with lamps, and visitors today. The drawn props: dishes on
// the table, the invitation card, the soup tureen, fish, turkey and pie held up by the waiters, wine glasses, music
// notes, the newspaper, the red question mark, the bones, the jigsaw pieces and the empty box, the pointed bone and the
// horn guess, the skeleton in the coal and its hand with the thumb spike. Every prop is an unlit ink-outlined drawing;
// cards that arrive mid-shot grow in slowly (never pop) or arrive on a cut frame.
import { Pen, SKINS, Outfit, Expr, FrontOpts, townsfolk, fxBurst, fxNote } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import {
  D0, SHOTS, TABLE_Y, DECK_Y, PARK, ISLE, MINE, DESK, BENCH, smooth, F_HAND, F_NOSE, BODY_R, BODY_Y,
  T_DINO, T_MONSTERS, T_PRIDE, T_HOLLOW, T_TABLE, T_INVITE, T_OWEN, T_HEAD, T_SOUP, T_FISH, T_TURKEY, T_PIE, T_TOAST,
  T_ROARED, T_PAPERS, T_CROWDS, T_PROBLEM, T_WRONG, T_BONES, T_JIGSAW, T_PICTURE, T_POINTED, T_HORN, T_SPIKE,
  T_SKELETONS, T_HAND, T_THUMB, T_MISTAKE, T_STANDS, T_HORN2, T_FAMOUS,
} from "./story";

const HAWKINS: Outfit = { jacket: "#7a5236", pants: "#3a3530", boots: "#2a1e18", hat: "hair", hair: "#4a3020", moustache: "#4a3020", buttons: "#d9b46a", skin: SKINS[1] };
const OWEN: Outfit = { jacket: "#2e2c3a", pants: "#2a2830", boots: "#1e1a1e", hat: "hair", hair: "#9a9aa4", buttons: "#d9dde0", skin: SKINS[0] };
const GUESTS: Outfit[] = [
  { jacket: "#3a3f5a", pants: "#2a2830", boots: "#1e1a1e", hat: "hair", hair: "#5a3b2a", moustache: "#5a3b2a", skin: SKINS[1] },
  { jacket: "#4a2f36", pants: "#2a2830", boots: "#1e1a1e", hat: "hair", hair: "#2a201a", skin: SKINS[0] },
  { jacket: "#2f4a44", pants: "#2a2830", boots: "#1e1a1e", hat: "hair", hair: "#8a5a3a", moustache: "#8a5a3a", skin: SKINS[2] },
  { jacket: "#4a4038", pants: "#2a2830", boots: "#1e1a1e", hat: "hair", hair: "#e6e2da", moustache: "#e6e2da", skin: SKINS[0] },
  { jacket: "#36304a", pants: "#2a2830", boots: "#1e1a1e", hat: "hair", hair: "#3a2a20", skin: SKINS[3] },
  { jacket: "#5a3a2a", pants: "#2a2830", boots: "#1e1a1e", hat: "hair", hair: "#6a4a2a", moustache: "#2a201a", skin: SKINS[1] },
];
const WAITER: Outfit = { jacket: "#f1ede4", pants: "#2a2830", boots: "#1e1a1e", hat: "hair", hair: "#3a2a20", buttons: "#c9b48a", skin: SKINS[2] };
const WORKMEN: Outfit[] = [
  { jacket: "#8a6a4a", pants: "#4a4038", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", belt: "#3a2a20", skin: SKINS[1] },
  { jacket: "#5a6a7a", pants: "#3a3530", boots: "#3a2a20", hat: "cap", cap: "#3a3f5a", moustache: "#3a2a20", skin: SKINS[3] },
];
const MINERS: Outfit[] = [
  { jacket: "#4a4a52", pants: "#34323a", boots: "#1e1a1e", hat: "cap", cap: "#2a2830", belt: "#5a3b2a", moustache: "#2a201a", skin: SKINS[1] },
  { jacket: "#5a4e44", pants: "#34323a", boots: "#1e1a1e", hat: "cap", cap: "#3a3530", belt: "#5a3b2a", skin: SKINS[0] },
  { jacket: "#3e4a52", pants: "#34323a", boots: "#1e1a1e", hat: "cap", cap: "#2a2830", belt: "#5a3b2a", skin: SKINS[2] },
];
const MODERN: Outfit[] = [
  { jacket: "#e2683c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair: "#5a3b2a", skin: SKINS[2] },
  { jacket: "#3f8f6a", pants: "#2f3a4a", boots: "#3a2a20", hat: "hair", hair: "#2a201a", skin: SKINS[3] },
  { jacket: "#f2c14e", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#2f5f6a", build: "kid", skin: SKINS[0] },
  { jacket: "#c25a7a", pants: "#3b3f52", boots: "#3a2a20", hat: "hair", hair: "#8a5a3a", skin: SKINS[1] },
  { jacket: "#5a8fc2", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: "#e6e2da", moustache: "#e6e2da", skin: SKINS[0] },
  { jacket: "#7b5ac9", pants: "#3b5b9a", boots: "#3a2a20", hat: "cap", cap: "#e2453c", build: "kid", skin: SKINS[2] },
];
const VICT = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);
const INKC = "#241726";
const PAPER = "#f6ecd2";
const BONE = "#e8dcc0";

// ---------------- drawings ----------------
/** a plate with a little dome of food (200 x 120) */
const drawPlate = (p: Pen) => { p.ell(100, 84, 86, 26, "#f4f1ea", 6); p.ell(100, 70, 44, 24, "#b5653f", 5, 180, 360); };
/** a wine glass (100 x 200) */
const drawGlass = (p: Pen) => {
  p.poly([[20, 20], [80, 20], [70, 90], [30, 90]], "#d9e4ee", 5);
  p.poly([[26, 50], [74, 50], [70, 90], [30, 90]], "#9a2a3a", 0);
  p.line([[50, 92], [50, 170]], "#d9e4ee", 8);
  p.ell(50, 176, 30, 9, "#d9e4ee", 5);
};
/** the invitation card (360 x 260): a little Iguanodon with a ladder up its side */
const drawInvite = (p: Pen) => {
  p.poly([[14, 16], [346, 10], [350, 248], [10, 252]], PAPER, 8);
  p.poly([[26, 28], [334, 24], [338, 236], [22, 240]], null, 4);
  p.ell(170, 140, 90, 42, "#9c8770", 6);
  p.poly([[250, 120], [300, 96], [318, 112], [262, 150]], "#9c8770", 6);
  p.poly([[310, 96], [322, 72], [324, 100]], BONE, 4);
  p.poly([[84, 150], [30, 196], [40, 204], [100, 166]], "#9c8770", 6);
  for (const x of [120, 150, 200, 228]) p.line([[x, 172], [x, 210]], "#9c8770", 14);
  p.line([[110, 210], [140, 96]], "#7a5226", 6, false); p.line([[134, 214], [164, 100]], "#7a5226", 6, false);
  for (let k = 0; k < 5; k++) p.line([[113 + k * 6.5, 198 - k * 24], [137 + k * 6.5, 198 - k * 24]], "#7a5226", 5, false);
};
/** a soup tureen (240 x 180) */
const drawTureen = (p: Pen) => {
  p.ell(120, 108, 100, 58, "#f4f1ea", 7, 0, 180); p.ell(120, 108, 100, 22, "#e8e2d4", 6);
  p.ell(120, 82, 70, 30, "#f4f1ea", 6, 180, 360); p.ell(120, 50, 12, 9, "#d9b46a", 4);
  for (let k = 0; k < 3; k++) p.line([[90 + k * 30, 40], [96 + k * 30, 12]], "#ffffff", 5, false);
};
/** a fish on a platter (260 x 140) */
const drawFish = (p: Pen) => {
  p.ell(130, 100, 120, 30, "#f4f1ea", 6);
  p.ell(126, 78, 80, 30, "#c9d4dc", 6); p.poly([[200, 78], [246, 50], [246, 106]], "#c9d4dc", 6); p.dot(74, 72, 6, INKC);
};
/** a roast turkey (260 x 180) */
const drawTurkey = (p: Pen) => {
  p.ell(130, 140, 120, 30, "#f4f1ea", 6);
  p.ell(130, 100, 84, 52, "#c27a3a", 7); p.ell(112, 86, 36, 18, "#d99a5a", 0);
  for (const s of [-1, 1]) { p.line([[130 + s * 70, 82], [130 + s * 108, 48]], "#c27a3a", 18); p.ell(130 + s * 112, 44, 12, 12, "#f4f1ea", 4); }
};
/** a pie (240 x 160) */
const drawPie = (p: Pen) => {
  p.ell(120, 120, 110, 30, "#f4f1ea", 6);
  p.ell(120, 96, 90, 40, "#d9a441", 7);
  for (let k = 0; k < 4; k++) p.line([[60 + k * 36, 80], [78 + k * 36, 112]], "#a8742a", 5, false);
};
/** the newspaper (300 x 360): columns of lines round an engraving of the monster */
const drawPaper = (p: Pen) => {
  p.poly([[14, 12], [286, 16], [290, 350], [10, 346]], "#efe9da", 8);
  p.line([[34, 46], [266, 48]], "#3a3238", 16, false);
  p.poly([[40, 76], [260, 78], [258, 200], [42, 198]], "#d8d0bc", 5);
  p.ell(140, 150, 62, 26, "#7f8a62", 5); p.poly([[196, 138], [236, 116], [244, 130], [204, 160]], "#7f8a62", 5); p.poly([[238, 116], [246, 98], [248, 120]], BONE, 3);
  for (const x of [104, 124, 162, 180]) p.line([[x, 168], [x, 190]], "#7f8a62", 9);
  for (let k = 0; k < 6; k++) { p.line([[38, 226 + k * 20], [140, 226 + k * 20]], "#8a8278", 5, false); p.line([[160, 226 + k * 20], [262, 226 + k * 20]], "#8a8278", 5, false); }
};
/** a big red question mark (200 x 300) */
const drawQuestion = (p: Pen) => {
  const g = p.g; g.font = "bold 260px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 16; g.strokeStyle = INKC; g.strokeText("?", 100, 150); g.fillStyle = "#d6453a"; g.fillText("?", 100, 150);
};
/** three loose bones (360 x 160) */
const drawBones = (p: Pen) => {
  const bone = (x0: number, y0: number, x1: number, y1: number) => {
    p.line([[x0, y0], [x1, y1]], BONE, 22);
    for (const [x, y] of [[x0, y0], [x1, y1]] as const) { p.ell(x - 6, y - 6, 13, 13, BONE, 5); p.ell(x + 6, y + 6, 13, 13, BONE, 5); }
  };
  bone(40, 110, 170, 60); bone(200, 120, 320, 110);
  p.ell(260, 52, 34, 22, BONE, 6);
};
/** jigsaw pieces (320 x 200): four loose pieces in clay colours */
const drawPieces = (p: Pen) => {
  const piece = (x: number, y: number, col: string) => {
    p.poly([[x, y], [x + 34, y], [x + 34, y + 14], [x + 48, y + 14], [x + 48, y + 34], [x + 34, y + 34], [x + 34, y + 70], [x, y + 70], [x, y + 46], [x - 14, y + 46], [x - 14, y + 26], [x, y + 26]], col, 6);
  };
  piece(40, 30, "#c9944a"); piece(140, 60, "#7f8a62"); piece(230, 24, "#b5653f"); piece(90, 110, "#5a8fc2");
};
/** the jigsaw box with no picture on its lid: a blank lid with a question mark (300 x 220) */
const drawBox = (p: Pen) => {
  p.poly([[20, 40], [280, 30], [286, 196], [14, 204]], "#c9b48a", 8);
  p.poly([[40, 58], [262, 50], [266, 180], [36, 186]], "#f4f1ea", 5);
  const g = p.g; g.font = "bold 120px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#8a8278"; g.fillText("?", 150, 122);
};
/** the pointed bone (180 x 260) */
const drawSpikeBone = (p: Pen) => { p.poly([[60, 240], [120, 240], [104, 110], [86, 20], [70, 110]], BONE, 8); p.line([[80, 200], [100, 200]], "#c9bc9e", 5, false); };
/** a thought bubble (360 x 300) with a horned nose: the guess */
const drawHornBubble = (p: Pen) => {
  p.ell(180, 130, 160, 116, "#ffffff", 8);
  p.ell(70, 262, 22, 16, "#ffffff", 6); p.ell(40, 290, 12, 9, "#ffffff", 5);
  p.poly([[60, 190], [70, 120], [180, 96], [280, 130], [296, 178], [240, 200]], "#9c8770", 7);
  p.poly([[240, 128], [262, 40], [276, 136]], BONE, 6);
  p.dot(170, 128, 9, INKC);
};
/** the skeleton in the coal (700 x 560): a standing Iguanodon skeleton, a thumb spike on each hand */
const drawSkeleton = (p: Pen) => {
  const L = (pts: [number, number][], w = 16) => p.line(pts, BONE, w);
  L([[120, 520], [210, 380], [300, 300], [390, 220], [440, 150]], 22); // tail to back
  L([[440, 150], [500, 90], [560, 70]], 20); // neck
  p.poly([[540, 40], [640, 60], [680, 96], [600, 110], [540, 100]], BONE, 8); p.dot(590, 66, 9, INKC);
  for (let k = 0; k < 7; k++) L([[300 + k * 24, 300 - k * 22], [330 + k * 24, 380 - k * 18]], 9); // ribs
  L([[330, 310], [300, 420], [330, 520]], 18); L([[370, 300], [360, 420], [400, 520]], 18); // legs
  p.ell(318, 524, 34, 12, BONE, 5); p.ell(392, 524, 34, 12, BONE, 5);
  L([[450, 170], [500, 250], [540, 300]], 12); // the near arm, down to the hand (the hand card covers it in close-up)
  p.poly([[530, 296], [552, 290], [576, 312], [560, 330], [536, 324]], BONE, 6);
  p.poly([[548, 292], [566, 250], [566, 296]], BONE, 5); // thumb spike
};
/** the hand close up (360 x 360): bony fingers and the cone of the thumb spike */
const drawHand = (p: Pen) => {
  p.line([[70, 330], [150, 210]], BONE, 34);
  p.ell(170, 200, 66, 52, BONE, 7);
  for (let k = 0; k < 3; k++) p.line([[196 + k * 8, 210 + k * 18], [300, 230 + k * 34]], BONE, 20);
  p.poly([[150, 170], [214, 26], [222, 172]], BONE, 8);
  p.line([[164, 150], [212, 150]], "#c9bc9e", 5, false);
};
/** a miner's lamp (120 x 180): a brass lamp with a glowing flame */
const drawLamp = (p: Pen) => {
  p.line([[60, 10], [60, 40]], "#8a6a3a", 6);
  p.poly([[30, 40], [90, 40], [96, 150], [24, 150]], "#c9944a", 6);
  p.ell(60, 98, 22, 34, "#ffe8a0", 4);
  p.poly([[20, 150], [100, 150], [100, 170], [20, 170]], "#8a6a3a", 5);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = D0 + 0.04, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
const seat = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}) =>
  front(cam, t, out, i, o, okey, x, z, expr, { mode: "sit", ...extra }, TABLE_Y - 0.5, false);
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
const kickT = (t: number) => Math.floor((t - 2 / 30) * 30 + 1e-6) / 30;
/** music notes rising from t0, each growing in and fading by shrinking (never pops) */
const notes = (out: Stage, t: number, t0: number, x: number, y: number, z: number, n = 6) => {
  for (let i = 0; i < n; i++) {
    const u = (t - t0 - i * 0.25) / 2.2;
    if (u <= 0 || u >= 1) continue;
    const s = 0.34 * smooth(u / 0.15) * smooth((1 - u) / 0.2), kind = i % 2;
    card(out, `note${kind}`, 220, 240, (p) => fxNote(p, kind, "#3a2a4a"), x + (i % 3 - 1) * 1.2 + 0.3 * Math.sin(u * 6 + i), y + u * 1.8, z + 0.1 * i, s * 0.9, s);
  }
};
const SEATS: [number, number][] = [[-2.7, -0.72], [-1.75, -0.72], [-0.8, -0.72], [0.15, -0.72], [1.1, -0.72], [2.05, -0.72]];
/** the dinner: guests along the far side of the table, Owen at the head end, dishes and glasses on the cloth */
const dinner = (t: number, cam: CamInfo, out: Stage, ex: (j: number) => Expr, waveAll = 0, owenEx: Expr = "smile_closed") => {
  SEATS.forEach(([x, z], j) => seat(cam, t, out, 10 + j, GUESTS[j], `g${j}`, x, z, ex(j), waveAll ? { wave: wave(t, j, 7) } : {}));
  seat(cam, t, out, 9, OWEN, "owen", 2.75, -0.05, owenEx);
  for (let k = 0; k < 6; k++) card(out, "plate", 200, 120, drawPlate, -2.7 + k * 0.95, TABLE_Y + 0.07, -0.18, 0.42, 0.25);
  for (let k = 0; k < 5; k++) card(out, "glass", 100, 200, drawGlass, -2.25 + k * 0.95, TABLE_Y + 0.14, -0.3, 0.11, 0.22);
};

// ---------------- the places ----------------
const [PX, , PZ] = PARK, [MX, , MZ] = MINE;
const HEADX = BODY_R[0] + 1.5;
const yardSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 1) { dinner(t, cam, out, (j) => (t < T_DINO - 0.07 ? "smile" : j % 2 ? "laugh" : "grin")); return; }
  if (id === 14) {
    const late = t >= T_MISTAKE - 0.07;
    dinner(t, cam, out, (j) => (late ? (j % 2 ? "laugh" : "grin") : j % 3 ? "smile" : "laugh"), late ? 1 : 0, late ? "laugh" : "smile");
    void T_FAMOUS;
    return;
  }
  if (id === 2) { // Hawkins in his yard, proud of his monsters
    const proud = t >= T_MONSTERS - 0.07;
    front(cam, t, out, 1, HAWKINS, "hawk", 8.4, 7.2, proud ? "grin" : "smile", proud ? { wave: 0.8 } : {});
    front(cam, t, out, 20, WORKMEN[0], "wk0", 4.0, 4.6, "neutral");
    front(cam, t, out, 21, WORKMEN[1], "wk1", 2.0, 2.6, "whistle", {}, DECK_Y);
    return;
  }
  if (id === 3) { // the hollow mould: Hawkins on the platform, proud
    const pr = t >= T_PRIDE - 0.07;
    front(cam, t, out, 1, HAWKINS, "hawk", 4.6, 2.6, pr ? "grin" : "smile", t >= T_HOLLOW - 0.07 ? { wave: 0.7 } : {}, DECK_Y);
    front(cam, t, out, 21, WORKMEN[1], "wk1", -2.6, 2.6, "neutral", {}, DECK_Y);
    return;
  }
  if (id === 4) { // the table goes in: workmen on the platform, dishes appear on the cloth
    front(cam, t, out, 20, WORKMEN[0], "wk0", -1.4, 2.6, "smile", { wave: 0.5 }, DECK_Y);
    front(cam, t, out, 21, WORKMEN[1], "wk1", 1.2, 2.6, "whistle", {}, DECK_Y);
    front(cam, t, out, 1, HAWKINS, "hawk", -4.6, 2.4, "grin", {}, DECK_Y);
    for (let k = 0; k < 6; k++) { const g = grow(t, T_TABLE - 0.2 + k * 0.12, 0.6); card(out, "plate", 200, 120, drawPlate, -2.7 + k * 0.95, TABLE_Y + 0.07, -0.18, 0.42 * g, 0.25 * g); }
    return;
  }
  if (id === 5) { // Hawkins draws the invitation
    const [dx, , dz] = DESK;
    front(cam, t, out, 1, HAWKINS, "hawk", dx, dz - 1.15, t >= T_INVITE - 0.07 ? "grin" : "smile_closed", { headTilt: 6 });
    const g = grow(t, T_INVITE - 0.35, 0.7);
    card(out, "invite", 360, 260, drawInvite, dx + 0.15, D0 + 1.32, dz - 0.4, 0.62 * g, 0.45 * g);
    return;
  }
  if (id === 6) { // Owen takes the best seat, in the head
    dinner(t, cam, out, () => "smile", 0, t >= T_HEAD - 0.07 ? "grin" : t >= T_OWEN - 0.07 ? "smile_closed" : "neutral");
    return;
  }
  if (id === 7) { // waiters pass up the dishes
    dinner(t, cam, out, (j) => (t >= T_TURKEY - 0.07 && j % 2 ? "grin" : "smile"));
    const W: [number, number, number, (p: Pen) => void, string, number, number][] = [
      [-2.3, T_SOUP, 240, drawTureen, "tureen", 180, 0.7], [-0.8, T_FISH, 260, drawFish, "fish", 140, 0.74],
      [0.8, T_TURKEY, 260, drawTurkey, "turkey", 180, 0.74], [2.3, T_PIE, 240, drawPie, "pie", 160, 0.66],
    ];
    W.forEach(([x, t0, cw, draw, key, ch, w], j) => {
      const up = t >= t0 - 0.07;
      front(cam, t, out, 30 + j, WAITER, "waiter", x, 2.6, up ? "smile" : "neutral", { wave: up ? 1 : 0.3 }, DECK_Y);
      const g = grow(t, t0 - 0.3, 0.5);
      card(out, key, cw, ch, draw, x + 0.35, DECK_Y + 2.15, 2.5, w * g, w * (ch / cw) * g);
    });
    return;
  }
  if (id === 8) { // the toast to the Queen and the roaring song
    const roar = t >= T_ROARED - 0.07;
    dinner(t, cam, out, (j) => (roar ? (j % 2 ? "laugh" : "grin") : "smile"), t >= T_TOAST - 0.07 ? 1 : 0, roar ? "laugh" : "smile");
    notes(out, t, T_ROARED - 0.1, 0.0, TABLE_Y + 1.4, -0.4, 8);
    burst(out, t, kickT(T_ROARED), 0.0, TABLE_Y + 1.2, -0.3, 1.4);
    return;
  }
  if (id === 11) { // a jigsaw with no picture on the box
    const [bx, , bz] = BENCH;
    const puz = t >= T_JIGSAW - 0.07;
    front(cam, t, out, 1, HAWKINS, "hawk", bx - 0.55, bz - 0.85, puz ? "nervous" : "neutral", { headTilt: puz ? -6 : 0 });
    front(cam, t, out, 9, OWEN, "owen", bx + 0.6, bz - 0.85, t >= T_PICTURE - 0.07 ? "dazed" : "stern", { headTilt: 5 });
    const gb = grow(t, T_BONES - 0.35, 0.6);
    card(out, "bones", 360, 160, drawBones, bx - 0.6, D0 + 1.15, bz + 0.1, 0.7 * gb, 0.31 * gb);
    const gp = grow(t, T_JIGSAW - 0.3, 0.6);
    card(out, "pieces", 320, 200, drawPieces, bx + 0.05, D0 + 1.12, bz + 0.3, 0.5 * gp, 0.31 * gp);
    const gx = grow(t, T_PICTURE - 0.3, 0.6);
    card(out, "box", 300, 220, drawBox, bx + 0.75, D0 + 1.26, bz + 0.05, 0.55 * gx, 0.4 * gx);
    return;
  }
  if (id === 12) { // the pointed bone, the horn guess, the spike on the nose
    const nose = t >= F_NOSE / 30;
    front(cam, t, out, 1, HAWKINS, "hawk", 4.6, 2.3, t >= T_SPIKE - 0.07 ? "grin" : "smile", { wave: nose ? 0.9 : 0.4 }, DECK_Y);
    if (!nose) {
      front(cam, t, out, 9, OWEN, "owen", 6.3, 2.7, t >= T_HORN - 0.07 ? "grin" : "stern", { wave: 0.8 }, DECK_Y);
      const gb = grow(t, T_POINTED - 0.3, 0.6);
      card(out, "spikeBone", 180, 260, drawSpikeBone, 6.75, DECK_Y + 2.35, 2.8, 0.3 * gb, 0.43 * gb);
      const gh = grow(t, T_HORN - 0.3, 0.7);
      card(out, "hornBubble", 360, 300, drawHornBubble, 5.6, DECK_Y + 3.0, 3.0, 1.2 * gh, 1.0 * gh);
    }
    return;
  }
};

const parkSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const py = D0 + 0.09, sz = PZ + 7.6;
  if (id === 9) { // crowds on the shore, a newspaper
    const spots: [number, number][] = [[-3.2, 0.4], [-1.9, 1.4], [-0.6, 0.2], [0.9, 1.2], [2.2, 0.0], [3.6, 1.0], [4.2, 1.4], [-4.6, 1.2]];
    spots.forEach(([x, dz], j) => front(cam, t, out, 40 + j, VICT[j], `v${j}`, PX + x, sz + dz, t >= T_CROWDS - 0.07 ? (j % 2 ? "grin" : "smile") : "smile", j === 3 ? { wave: wave(t, j, 5) } : {}, py));
    const g = grow(t, T_PAPERS - 0.3, 0.6);
    card(out, "paper", 300, 360, drawPaper, PX + 4.55, py + 1.2, sz + 1.65, 0.45 * g, 0.54 * g);
    return;
  }
  if (id === 10) { // the head and its horn: something is wrong
    const g = grow(t, T_PROBLEM - 0.2, 0.6);
    card(out, "question", 200, 300, drawQuestion, PX + 6.0, D0 + 5.75, ISLE[2] + 1.0, 0.6 * g, 0.9 * g);
    burst(out, t, kickT(T_WRONG), PX + BODY_R[0] + 2.55, D0 + BODY_Y + 1.6, ISLE[2] + 0.3, 1.2);
    return;
  }
  // id 15: today: visitors on the shore, a kid pointing at the horn
  const spots: [number, number][] = [[-1.6, 0.4], [-0.4, 1.4], [0.8, 0.2], [2.0, 1.2], [3.3, 0.3], [4.6, 1.0]];
  spots.forEach(([x, dz], j) => front(cam, t, out, 70 + j, MODERN[j], `m${j}`, PX + x, sz + dz, t >= T_STANDS - 0.07 ? (j % 2 ? "laugh" : "grin") : "smile", j === 2 || (j === 5 && t >= T_HORN2 - 0.07) ? { wave: 1 } : {}, py));
};

const mineSet = (t: number, cam: CamInfo, out: Stage) => {
  const f = Math.round(t * 30);
  if (f >= F_HAND) { // close on the hand: the spike is a thumb
    card(out, "hand", 360, 360, drawHand, MX + 1.7, D0 + 2.2, MZ - 2.9, 1.3, 1.3);
    burst(out, t, kickT(T_THUMB), MX + 1.6, D0 + 2.7, MZ - 2.85, 0.9);
    return;
  }
  card(out, "skeleton", 700, 560, drawSkeleton, MX + 0.4, D0 + 2.3, MZ - 2.95, 3.6, 2.88);
  const sh = t >= T_SKELETONS - 0.07;
  const spots: [number, number][] = [[-1.6, 0.4], [0.2, 1.2], [1.9, 0.6]];
  spots.forEach(([x, z], j) => {
    front(cam, t, out, 80 + j, MINERS[j], `mi${j}`, MX + x, MZ + z, sh ? (j === 1 ? "shock" : "relief_open") : "neutral", j === 0 ? { wave: 0.9 } : {}, D0 + 0.06);
    card(out, "lamp", 120, 180, drawLamp, MX + x + 0.38, D0 + 1.0, MZ + z + 0.05, 0.2, 0.3);
  });
  void T_HAND;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "yard") yardSet(id, t, cam, out);
  else if (s.scene === "park") parkSet(id, t, cam, out);
  else mineSet(t, cam, out);
  void HEADX;
  return out;
};
