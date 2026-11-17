// The cast and hand-drawn props of the Weston walk: Weston (blue coat, red cap, moustache; white moustache fifty
// years on), his friend Eddy (brown coat, top hat), Lincoln (black coat, tall hat, dark beard), Bostonians, villagers,
// Washingtonians going home, dancers at the ball, and someone trudging over a beach. The drawn props: the ten-day
// tally card, the pocket watch whose hands race, the train ticket, the purse of prize money, mud splashes, the sprain
// ticks, the handshake sparkle and falling snow. Every prop is an unlit ink-outlined drawing; cards that arrive mid-shot
// grow in over a few frames (never pop).
import { Pen, townsfolk, KID, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxCreak, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, BET, SH, ROAD, VIL, BEACH, CAP, BALL, westonX, westonPhase, smooth, clamp01, V3,
  T_WALK, T_SURE, T_NEVER, T_TELLS, T_WINS1, T_TEN, T_SETS, T_HUNDREDS, T_SNOW, T_TOWNS, T_FALLS, T_SPRAINS, T_KEEPS,
  T_BEHIND, T_STEALS, T_SINKS, T_SLIDES, T_TIRES, T_LIMPS, T_SWORN, T_BALL, T_SHOOK, T_TRAIN, T_NO, T_LOST, T_PAID,
} from "./story";

const WES: Outfit = { jacket: "#2f4f86", pants: "#3a3540", boots: "#2a2220", hat: "cap", cap: "#a8322c", moustache: "#5a3b2a", skin: SKINS[1] };
const WES_OLD: Outfit = { ...WES, moustache: "#e6e2da" };
const EDDY: Outfit = { jacket: "#7a4a2c", pants: "#3b3f52", boots: "#3a2a20", hat: "tophat", moustache: "#3a2a20", skin: SKINS[0] };
const LINCOLN: Outfit = { jacket: "#1f1d26", pants: "#24222a", boots: "#151216", hat: "tophat", moustache: "#1e1a1c", skin: SKINS[0] };
const BEACHER: Outfit = { jacket: "#e2683c", pants: "#3b6a9a", boots: "#e8c49a", hat: "hair", hair: "#5a3b2a", skin: SKINS[2] };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map((v) => townsfolk(v));
const KIDS: Outfit[] = [
  { ...KID, skin: SKINS[0] }, { ...KID, jacket: "#3f8f6a", cap: "#f2c14e", skin: SKINS[1] },
  { ...KID, jacket: "#c25a7a", hat: "bonnet", dress: "#d9a441", skin: SKINS[2] }, { ...KID, jacket: "#5a8fc2", hat: "hair", hair: "#5a3b2a", skin: SKINS[3] },
];
const INKC = "#241726";
const PAPER = "#f6ecd2";

// ---------------- drawings ----------------
/** the ten days (260 x 200): a sheet with ten boxes, ticked off one by one (n ticks) */
const drawTally = (p: Pen, n: number) => {
  p.poly([[10, 12], [250, 6], [252, 192], [8, 194]], PAPER, 8);
  for (let i = 0; i < 10; i++) {
    const x = 30 + (i % 5) * 42, y = 40 + Math.floor(i / 5) * 72;
    p.poly([[x, y], [x + 32, y], [x + 32, y + 32], [x, y + 32]], "#ffffff", 4);
    if (i < n) p.stroke([[x + 5, y + 16], [x + 14, y + 27], [x + 30, y + 2]], 7, "#c0353a");
  }
};
/** a pocket watch (240 x 280): the hands at angle a (radians, the minute hand) */
const drawWatch = (p: Pen, a: number) => {
  p.ell(120, 22, 18, 16, null, 7);
  p.poly([[108, 36], [132, 36], [130, 54], [110, 54]], "#d9b45a", 5);
  p.ell(120, 160, 104, 104, "#d9b45a", 9);
  p.ell(120, 160, 86, 86, "#fbf6e8", 5);
  for (let k = 0; k < 12; k++) { const b = (k / 12) * Math.PI * 2; p.stroke([[120 + Math.sin(b) * 70, 160 - Math.cos(b) * 70], [120 + Math.sin(b) * 80, 160 - Math.cos(b) * 80]], 5, INKC); }
  p.stroke([[120, 160], [120 + Math.sin(a / 12) * 44, 160 - Math.cos(a / 12) * 44]], 9, INKC);
  p.stroke([[120, 160], [120 + Math.sin(a) * 68, 160 - Math.cos(a) * 68]], 6, "#c0353a");
  p.dot(120, 160, 8, INKC);
};
/** a train ticket (260 x 150): cream card, a little locomotive, a punched hole */
const drawTicket = (p: Pen) => {
  p.poly([[8, 10], [252, 6], [254, 142], [6, 146]], "#f2e2b0", 7);
  p.poly([[60, 92], [150, 92], [150, 60], [122, 60], [122, 40], [100, 40], [100, 60], [60, 60]], "#2f4a3a", 5);
  p.poly([[150, 92], [176, 92], [176, 72], [150, 72]], "#2f4a3a", 5);
  p.poly([[66, 40], [84, 40], [80, 60], [70, 60]], "#2f4a3a", 4);
  for (const x of [80, 112, 142]) p.ell(x, 100, 13, 13, "#c0353a", 4);
  for (let k = 0; k < 3; k++) p.line([[196, 50 + k * 22], [236, 50 + k * 22]], "#9a8a6a", 4, false);
  p.ell(218, 118, 10, 10, "#c9b48a", 3);
};
/** a purse of prize money (240 x 260) with a dollar sign */
const drawPurse = (p: Pen) => {
  p.poly([[96, 60], [144, 60], [204, 150], [196, 236], [44, 236], [36, 150]], "#c9b48a", 9);
  p.line([[92, 66], [148, 66]], "#6a4224", 10, false);
  p.poly([[100, 20], [140, 20], [146, 58], [94, 58]], "#c9b48a", 8);
  const g = p.g; g.font = "bold 110px Georgia, serif"; g.fillStyle = "#2a5a32"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", 120, 160);
};
/** a splash of mud (300 x 200), u 0..1 through its life */
const drawMud = (p: Pen, u: number) => {
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.15 + (0.7 * i) / 5), d = 40 + 110 * u, x = 150 + Math.cos(a) * d * 1.2, y = 180 - Math.sin(a) * d + 160 * u * u;
    p.ell(x, y, 16 - 8 * u, 14 - 7 * u, "#6a4a30", 4);
  }
  p.ell(150, 186, 70 + 30 * u, 14, "#5e4430", 0);
};
/** a snowflake (64 x 64) */
const drawFlake = (p: Pen) => { p.ell(32, 32, 18, 18, "#ffffff", 0); };

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = D0) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** someone walking along (dx, dz): side or front view picked from the camera, legs in step with the ground speed */
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, phase: number, expr: Expr,
  so: SideOpts = {}, y = D0, fo: FrontOpts = {}) => {
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "march", phase: q(phase, 16), expr, blink: lidAt(t, i), ...fo }, { mode: "march", phase: q(phase, 16), expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs), ...so }, 1));
  blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** a card that grows in from t0 over d seconds (scale 0 -> 1, the drawing never changes, so no frame jumps) */
const grow = (t: number, t0: number, d = 0.25) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) => {
  if (w > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
};
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);
/** falling snow round a point: n flakes in a box, each fading in at the top and out at the bottom (never pops) */
const snow = (out: Stage, c: V3, t: number, n: number, w: number, h: number, size: number) => {
  for (let i = 0; i < n; i++) {
    const h1 = ((i * 0.618) % 1), h2 = ((i * 0.377 + 0.2) % 1), h3 = ((i * 0.851 + 0.5) % 1);
    const u = (t * (0.18 + 0.08 * h3) + h1) % 1, s = size * (0.6 + 0.6 * h2) * smooth(u / 0.1) * smooth((1 - u) / 0.1);
    if (s < 0.004) continue;
    out.fx.push({ key: "flake", cw: 64, ch: 64, draw: drawFlake, x: c[0] + (h2 - 0.5) * w + 0.4 * Math.sin(t * 1.3 + i), y: c[1] + h * (1 - u), z: c[2] + (h3 - 0.5) * w * 0.6, w: s, h: s, soft: true });
  }
};
/** a mud splash at p starting at t0 (0.45 s) */
const splash = (out: Stage, p: V3, t: number, t0: number, s = 0.6) => {
  const u = (t - t0) / 0.45;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 10);
  out.fx.push({ key: `mud${uq}`, cw: 300, ch: 200, draw: (pn) => drawMud(pn, uq), x: p[0], y: p[1] + 0.2 * s, z: p[2], w: s * 1.5, h: s });
};

// ---------------- the places ----------------
const RZ = ROAD[2];
const roadSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const x = westonX(id, t), ph = westonPhase(id, t), y = D0 + 0.07;
  if (id === 1) {
    walker(cam, t, out, 1, WES, "wes", x, RZ - 0.3, 1, 0, ph, t < T_WALK - 0.07 ? "stern" : "pained", {}, y);
    snow(out, [x + 3, D0, RZ], t, 26, 8, 5, 0.07);
    return;
  }
  if (id === 5) {
    walker(cam, t, out, 1, WES, "wes", x, RZ, 1, 0, ph, t < T_SNOW - 0.07 ? "stern" : "pained", {}, y);
    snow(out, [x + 1.2, D0, RZ + 2.5], t, 60, 7, 5, 0.06);
    return;
  }
  if (id === 7) {
    const t1 = T_FALLS - 0.1, t2 = T_KEEPS - 0.1;
    if (t < t1) walker(cam, t, out, 1, WES, "wes", x, RZ, 1, 0, ph, "stern", {}, y);
    else if (t < t2) {
      const sp = t >= T_SPRAINS - 0.07;
      front(cam, t, out, 1, WES, "wes", x, RZ, sp ? "pained" : "shock", sp ? { mode: "sit", headTilt: -8 } : { mode: "fall", tilt: -18 }, y - 0.05);
      if (sp) { const u = q(((t - T_SPRAINS) * 2) % 1, 8); card(out, `creak${u}`, 300, 300, (pn) => fxCreak(pn, u), x + 0.45, D0 + 0.35, RZ + 0.3, 0.45 * grow(t, T_SPRAINS), 0.45 * grow(t, T_SPRAINS)); }
    } else walker(cam, t, out, 1, WES, "wes", x, RZ, 1, 0, ph, t < T_BEHIND - 0.07 ? "pained" : "nervous", {}, y, { tilt: 5 });
    splash(out, [westonX(7, t1) + 0.2, D0 + 0.07, RZ + 0.4], t, t1, 0.9);
    const g = grow(t, T_BEHIND - 0.2, 0.3), a = q((t - T_BEHIND + 0.3) * 9, 24);
    if (g > 0) card(out, `watch${a}`, 240, 280, (pn) => drawWatch(pn, a), x + 0.72, D0 + 1.62, RZ + 0.2, 0.42 * g, 0.49 * g);
    return;
  }
  if (id === 8) {
    walker(cam, t, out, 1, WES, "wes", x, RZ, 1, 0, ph, t < T_STEALS - 0.07 ? "pained" : "nervous", {}, y);
    // a splash at every footfall (phase 0 and 0.5)
    for (let k = 0; k < 8; k++) splash(out, [westonX(8, 33.9 + k * 0.72) + 0.25, D0 + 0.07, RZ + 0.35], t, 33.9 + k * 0.72, 0.4);
    return;
  }
  // id 10: from above: the tiny walker on the long road
  walker(cam, t, out, 1, WES, "wes", x, RZ, 1, 0, ph, "pained", {}, y);
};

const bostonSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [bx, , bz] = BET, py = D0 + 0.18;
  if (id === 2 || id === 3) {
    let we: Expr = "smile", ee: Expr = "stern";
    if (t >= T_SURE - 0.07) we = "grin";
    if (t >= T_NEVER - 0.07) we = "laugh";
    if (t >= T_TELLS - 0.07) { we = "grin"; ee = "smile"; }
    if (t >= T_WINS1 - 0.07) ee = "laugh";
    if (id === 3) { we = "shock"; ee = "laugh"; }
    front(cam, t, out, 1, WES, "wes", bx - 0.55, bz, we, we === "laugh" || (t >= T_WINS1 - 0.07 && t < T_TEN) ? { wave: wave(t, 0, 5) } : {}, py);
    front(cam, t, out, 2, EDDY, "eddy", bx + 0.65, bz + 0.2, ee, id === 3 ? { wave: wave(t, 1, 7) } : {}, py);
    if (id === 2) {
      const g = grow(t, T_TEN - 0.2, 0.3);
      if (g > 0) card(out, "tally0", 260, 200, (pn) => drawTally(pn, 0), bx + 0.05, D0 + 2.55, bz - 0.2, 0.62 * g, 0.48 * g);
    }
    return;
  }
  // id 4: he sets off from the State House steps, the crowd falls in behind him
  const x = westonX(4, t), go = t >= T_SETS - 0.1, z = -2.4;
  if (go) walker(cam, t, out, 1, WES, "wes", x, z, 1, 0, t * 1.0, "stern", {}, D0 + 0.08);
  else front(cam, t, out, 1, WES, "wes", x, z, "stern", {}, D0 + 0.08);
  for (let j = 0; j < 9; j++) {
    const o = FOLK[j % 8], jx = SH[0] - 4 + 1.1 * j, jz = -7.0 - (j % 3) * 0.6;
    const follow = t >= T_HUNDREDS - 0.1 + 0.08 * j;
    const fx = follow ? jx + 1.4 * smooth((t - T_HUNDREDS + 0.1 - 0.08 * j) / 0.6) * (t - T_HUNDREDS + 0.5 - 0.08 * j) : jx;
    if (follow) walker(cam, t, out, 30 + j, o, `f${j}`, fx, jz, 1, 0, t * 0.95 + j * 0.23, j % 2 ? "laugh" : "grin", {}, D0 + 0.18);
    else front(cam, t, out, 30 + j, o, `f${j}`, fx, jz, j % 3 ? "smile" : "grin", t >= T_SETS - 0.07 && j % 2 ? { wave: wave(t, j, 6) } : {}, D0 + 0.18);
  }
  for (let j = 0; j < 4; j++) front(cam, t, out, 45 + j, FOLK[(j + 3) % 8], `p${j}`, SH[0] + 4 + j * 2.1, -6.2 - (j % 2) * 0.7, j % 2 ? "laugh" : "grin", { wave: wave(t, j + 2, 6) }, D0 + 0.18);
};

const villageSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [vx, , vz] = VIL, py = D0 + 0.18, golden = SHOTS[id - 1].light === "golden";
  const cheer = id === 6 ? t >= T_TOWNS - 0.07 : true;
  const spots: [number, number][] = [[-30, -5.0], [-27, -5.6], [-24, -4.9], [-21, -5.5], [-18, -4.9], [-15, -5.6], [-12, -5.0], [-9, -5.5], [-6, -4.9],
    [-29, 5.0], [-25.5, 5.6], [-22, 4.9], [-18.5, 5.5], [-15, 4.9], [-11.5, 5.6], [-8, 5.0], [-4.5, 5.5]];
  spots.forEach(([dx, dz], i) => {
    const o = i % 5 === 4 ? KIDS[i % 4] : FOLK[i % 8], sx = (id === 14 ? -6 : 0) + vx + dx;
    const ex: Expr = !cheer ? (i % 2 ? "smile" : "neutral") : i % 3 === 0 ? "laugh" : i % 3 === 1 ? "grin" : "smile";
    front(cam, t, out, 50 + i, o, `v${i}`, sx, vz + dz, ex, cheer && i % 2 === 0 ? { wave: wave(t, i, 6) } : {}, py);
  });
  const x = westonX(id, t);
  if (id === 6) { walker(cam, t, out, 1, WES, "wes", x, vz - 0.4, 1, 0, westonPhase(6, t), "smile", {}, D0 + 0.08); return; }
  // id 14: fifty years on: the old walker, kids striding after him, a man holding up the purse
  const paid = t >= T_PAID - 0.07, g = grow(t, T_PAID - 0.15, 0.3);
  walker(cam, t, out, 1, WES_OLD, "wesOld", x, vz - 0.2, 1, 0, t * 0.55, t < T_LOST - 0.07 ? "grin" : !paid ? "smile_closed" : "laugh", {}, D0 + 0.08, paid ? { wave: 0.95 } : {});
  if (g > 0) card(out, "purse", 240, 260, drawPurse, x + 0.42, D0 + 2.62, vz - 0.1, 0.42 * g, 0.46 * g);
  for (let k = 0; k < 3; k++) walker(cam, t, out, 70 + k, KIDS[k], `kid${k}`, x - 1.6 - 1.1 * k, vz + 0.6 - 0.6 * k, 1, 0, t * 1.3 + k * 0.3, k % 2 ? "laugh" : "grin", {}, D0 + 0.08);
  void golden;
};

const beachSet = (t: number, cam: CamInfo, out: Stage) => {
  const [bx, , bz] = BEACH;
  const sink = smooth((t - T_SINKS + 0.07) / 0.35), back = smooth((t - T_SLIDES + 0.07) / 0.3);
  const x = bx - 1.4 + 0.42 * (t - 36.67) - 0.25 * back, y = D0 + 0.35 - 0.16 * sink;
  let ex: Expr = "smile";
  if (t >= T_SINKS - 0.07) ex = "nervous";
  if (t >= T_TIRES - 0.07) ex = "pained";
  walker(cam, t, out, 5, BEACHER, "beach", x, bz + 0.5, 1, 0, t * 0.5, ex, {}, y);
};

const capitolSet = (t: number, cam: CamInfo, out: Stage) => {
  const x = westonX(11, t);
  walker(cam, t, out, 1, WES, "wes", x, 0.4, 1, 0, westonPhase(11, t), t < T_LIMPS - 0.07 ? "nervous" : t < T_SWORN - 0.07 ? "pained" : "shock", {}, D0 + 0.08, { tilt: 5 });
  // the crowd already going home: walking away from the Capitol along the pavements
  for (let j = 0; j < 7; j++) {
    const z = j % 2 ? -6.2 : 6.4, jx = CAP[0] - 44 - 2.4 * j - 1.1 * (t - 46.1);
    walker(cam, t, out, 80 + j, FOLK[(j + 2) % 8], `dc${j}`, jx, z, -1, 0, t * 0.75 + j * 0.31, j % 3 ? "smile_closed" : "smile", {}, D0 + 0.18);
  }
};

const ballSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [lx, , lz] = BALL, fy = D0 + 0.08;
  if (id === 12) {
    // three couples turning slowly round the floor
    for (let c = 0; c < 3; c++) {
      const a = t * 0.9 + c * 2.1, cx = lx + [-1.45, 1.6, 2.6][c] + 0.4 * Math.cos(a), cz = lz + [0.6, 0.2, -3.7][c] + 0.3 * Math.sin(a);
      front(cam, t, out, 90 + 2 * c, FOLK[2 * c], `d${2 * c}`, cx - 0.36, cz, "smile_closed", { wave: 0.45 }, fy);
      front(cam, t, out, 91 + 2 * c, FOLK[2 * c + 1], `d${2 * c + 1}`, cx + 0.36, cz + 0.05, "smile", { wave: 0.45 }, fy);
    }
    const arrive = smooth((t - 52.0) / 2.4), wx = lx - 3.2 + 2.6 * arrive;
    if (arrive < 1) walker(cam, t, out, 1, WES, "wes", wx, lz - 2.0, 1, 0, t * 0.7, t < T_BALL - 0.07 ? "nervous" : "grin", {}, fy);
    else front(cam, t, out, 1, WES, "wes", wx, lz - 2.0, t < T_SHOOK - 0.07 ? "grin" : "laugh", t >= T_SHOOK - 0.07 ? { wave: 0.3 } : {}, fy);
    front(cam, t, out, 3, LINCOLN, "abe", lx + 0.7, lz - 2.3, t < T_SHOOK - 0.07 ? "smile" : "grin", t >= T_SHOOK - 0.07 ? { wave: 0.3 } : {}, D0 + 0.34);
    const u = (t - T_SHOOK + 0.07) / 0.5;
    if (u >= 0 && u < 1) { const uq = q(u, 10); card(out, `burst${uq}`, 300, 300, (pn) => fxBurst(pn, uq), lx + 0.1, D0 + 1.35, lz - 1.8, 0.7, 0.7, true); }
    return;
  }
  // id 13: the ticket home, and Weston's no
  const g = grow(t, T_TRAIN - 0.1, 0.3), no = t >= T_NO - 0.07;
  const shake = no && t < T_NO + 0.6 ? q(9 * Math.sin((t - T_NO) * 24), 3) : 0;
  front(cam, t, out, 1, WES, "wes", lx - 0.35, lz - 2.0, no ? "smile_closed" : t < T_TRAIN - 0.07 ? "smile" : "nervous", { headTilt: shake }, fy);
  front(cam, t, out, 3, LINCOLN, "abe", lx + 0.85, lz - 2.3, no ? "laugh" : "smile", t >= T_TRAIN - 0.07 ? { wave: 0.35 } : {}, D0 + 0.34);
  if (g > 0) card(out, "ticket", 260, 150, drawTicket, lx + 0.3, D0 + 1.55, lz - 1.6, 0.5 * g, 0.29 * g);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "road") roadSet(id, t, cam, out);
  else if (s.scene === "boston") bostonSet(id, t, cam, out);
  else if (s.scene === "village") villageSet(id, t, cam, out);
  else if (s.scene === "beach") beachSet(t, cam, out);
  else if (s.scene === "capitol") capitolSet(t, cam, out);
  else ballSet(id, t, cam, out);
  void clamp01;
  return out;
};
