// The cast and hand-drawn props of the Voyager story: the dish operators in Canberra, the mission team in the
// control room (shirt sleeves, a cardigan, one engineer at her desk), the crowd at the 1977 launch, a woman at home
// with a ringing telephone (the analogy), and the team with children at the celebration. Every prop is an unlit
// ink-outlined drawing: the radio rings (hollow, or full of data dots), the rocket flame and its smoke, the gold
// milestone ring, the pale blue Earth, an empty speech bubble, the telephone and its receiver, data packets, a wall
// calendar whose pages flip, a clock, confetti. Cards that arrive mid-shot grow in, and cards that leave shrink away.
import { Pen, SKINS, Outfit, Expr, FrontOpts, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import {
  D0, SHOTS, PROBE, DISH, DISH_H, ROCKET, OPS, DESK, COMP, CAL, SOFA, PHONE, STAGE, CROWD_Z, LX, EARTH_DOT, dishEl, smooth, clamp01, V3,
  T_HELLO, T_REACH, T_77, T_PROUD, T_WORKS, T_FIRST, T_LD, T_LOCK, T_SIGNAL, T_EMPTY, T_CALL, T_NOTHING, T_PHONE, T_RINGS, T_NOBODY, T_RINGING,
  T_FAULT, T_COMP, T_PACKS, T_DATA, T_QUEST, T_ARRIVE, T_ANSWER, T_WEEKS, T_SAVED, T_SILENCE, T_CELEB, T_LATE, T_NEWS, T_LISTEN, T_RINGS2, T_HUGE,
} from "./story";

const Y = D0;
const OP: Outfit[] = [
  { jacket: "#3f6a8a", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#6b4a32", skin: SKINS[0] },
  { jacket: "#c98a3a", pants: "#4a4f5e", boots: "#3a2a20", hat: "hair", hair: "#2a2220", dress: "#8a5a7a", skin: SKINS[2] },
];
const TEAM: Outfit[] = [
  { jacket: "#e8e2d0", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#3a2a20", skin: SKINS[1], buttons: "#8a8f99" },
  { jacket: "#6a4a6e", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#b8b2a8", dress: "#4a6a8a", skin: SKINS[0] },
  { jacket: "#4a6a4a", pants: "#5a4a3a", boots: "#2a2220", hat: "hair", hair: "#d8d0c4", skin: SKINS[3], moustache: "#d8d0c4" },
  { jacket: "#b0553f", pants: "#2c2f3a", boots: "#2a2220", hat: "hair", hair: "#2a2220", dress: "#2f4a6a", skin: SKINS[2] },
  { jacket: "#8fa9c9", pants: "#4a4f5e", boots: "#2a2220", hat: "hair", hair: "#6b4a32", skin: SKINS[0] },
];
const KIDS: Outfit[] = [
  { jacket: "#e0b84a", pants: "#3f6fa0", boots: "#2a2220", hat: "hair", hair: "#6b4a32", skin: SKINS[1], build: "kid" },
  { jacket: "#c25a7a", pants: "#3b3f52", boots: "#2a2220", hat: "hair", hair: "#2a2220", dress: "#d86a8a", skin: SKINS[2], build: "kid" },
  { jacket: "#5a9a6a", pants: "#4a4f5e", boots: "#2a2220", hat: "cap", cap: "#3f6fa0", skin: SKINS[0], build: "kid" },
];
const FOLK: Outfit[] = [
  { jacket: "#d8a441", pants: "#6a5a4a", boots: "#2a2220", hat: "hair", hair: "#6b4a32", dress: "#d86a4a", skin: SKINS[0] },
  { jacket: "#4a7aa0", pants: "#d8cbb0", boots: "#2a2220", hat: "cap", cap: "#e8e2d0", skin: SKINS[2] },
  { jacket: "#8a5a3e", pants: "#4a4f5e", boots: "#3a2a20", hat: "hair", hair: "#3a2a20", skin: SKINS[1], moustache: "#3a2a20" },
  { jacket: "#e8e2d0", pants: "#3f6fa0", boots: "#2a2220", hat: "hair", hair: "#a8743e", dress: "#5a8fc2", skin: SKINS[3] },
  { jacket: "#6a8a4a", pants: "#3b3f52", boots: "#2a2220", hat: "cap", cap: "#c0392b", skin: SKINS[0], build: "kid" },
];
const MOM: Outfit = { jacket: "#c98a5a", pants: "#4a4f5e", boots: "#3a2a20", hat: "hair", hair: "#3a2a20", dress: "#7a9ac0", skin: SKINS[1] };
const SITTER: Outfit = TEAM[1];

// ---------------- drawings ----------------
/** a radio ring (500 x 500): a glowing circle, hollow (empty) or full of little data dashes */
const drawRing = (p: Pen, full: boolean, col: string) => {
  p.ell(250, 250, 220, 220, null, 0);
  const g = p.g;
  g.beginPath(); g.ellipse(250, 250, 214, 214, 0, 0, Math.PI * 2); g.lineWidth = 34; g.strokeStyle = "#241726"; g.stroke();
  g.lineWidth = 20; g.strokeStyle = col; g.stroke();
  if (full) for (let i = 0; i < 14; i++) {
    const a = i * 2.4, d = 40 + ((i * 37) % 120);
    p.poly([[250 + d * Math.cos(a) - 18, 250 + d * Math.sin(a) - 8], [250 + d * Math.cos(a) + 18, 250 + d * Math.sin(a) - 8], [250 + d * Math.cos(a) + 18, 250 + d * Math.sin(a) + 8], [250 + d * Math.cos(a) - 18, 250 + d * Math.sin(a) + 8]], i % 3 ? "#7af0b8" : "#ffe08a", 5);
  }
};
/** the rocket flame (300 x 500), phase n of 12 */
const drawFlame = (p: Pen, n: number) => {
  const w = 1 + 0.06 * Math.sin((n / 12) * Math.PI * 2);
  p.poly([[150 - 110 * w, 10], [150 + 110 * w, 10], [150 + 60 * w, 300], [150, 490], [150 - 60 * w, 300]], "#f07a2a", 8);
  p.poly([[150 - 60 * w, 10], [150 + 60 * w, 10], [150 + 30 * w, 220], [150, 330], [150 - 30 * w, 220]], "#ffd25a", 0);
};
/** a puff of exhaust smoke (400 x 400) */
const drawSmoke = (p: Pen, seed: number) => {
  const r = (k: number) => ((seed * 97 + k * 31) % 17) / 17;
  for (let i = 0; i < 6; i++) p.ell(110 + 180 * r(i), 120 + 160 * r(i + 9), 70 + 40 * r(i + 3), 60 + 30 * r(i + 5), "#e6e0da", 0);
  p.ell(200, 210, 130, 110, "#e6e0da", 0);
};
/** the pale blue Earth (200 x 200) with a soft halo */
const drawEarth = (p: Pen) => {
  p.ell(100, 100, 96, 96, "rgba(140,190,255,0.35)", 0);
  p.ell(100, 100, 46, 46, "#6aa8ee", 6);
  p.poly([[82, 78], [104, 70], [112, 92], [92, 104]], "#7ab86a", 0);
  p.ell(112, 118, 14, 8, "#f4f4f4", 0);
};
/** an empty speech bubble (320 x 260) */
const drawBubble = (p: Pen) => {
  p.ell(160, 110, 140, 96, "#fbf8f0", 9);
  p.poly([[96, 186], [70, 250], [140, 196]], "#fbf8f0", 9);
  p.ell(160, 110, 124, 82, "#fbf8f0", 0);
};
/** a dial telephone seen from the front (300 x 220), receiver on (k 0) or lifted (k 1); ringing jiggles it */
const drawPhone = (p: Pen, k: number) => {
  p.poly([[30, 210], [270, 210], [240, 90], [60, 90]], "#c0392b", 8);
  p.ell(150, 150, 46, 46, "#f3ead2", 6);
  for (let i = 0; i < 8; i++) { const a = i * 0.7 - 2.6; p.dot(150 + 32 * Math.cos(a), 150 + 32 * Math.sin(a), 6, "#3a2a24"); }
  if (!k) { p.poly([[20, 86], [280, 86], [270, 50], [30, 50]], "#c0392b", 8); p.ell(40, 64, 34, 30, "#c0392b", 8); p.ell(260, 64, 34, 30, "#c0392b", 8); }
};
/** the receiver held up (120 x 260) */
const drawReceiver = (p: Pen) => {
  p.poly([[40, 40], [80, 40], [80, 220], [40, 220]], "#c0392b", 7);
  p.ell(60, 34, 46, 30, "#c0392b", 7); p.ell(60, 226, 46, 30, "#c0392b", 7);
};
/** ring ticks around a ringing phone (300 x 300) */
const drawTicks = (p: Pen, u: number) => {
  const j = 6 * Math.sin(u * 40);
  for (const a of [-60, -30, 0, 30, 60]) {
    const b = ((a - 90) * Math.PI) / 180;
    p.stroke([[150 + 80 * Math.cos(b) + j, 220 + 80 * Math.sin(b)], [150 + 125 * Math.cos(b) + j, 220 + 125 * Math.sin(b)]], 12);
  }
};
/** a data packet (160 x 100): a little card of figures (dashes) */
const drawPacket = (p: Pen) => {
  p.poly([[10, 10], [150, 10], [150, 90], [10, 90]], "#fbf8f0", 7);
  for (let i = 0; i < 3; i++) p.line([[28, 32 + i * 20], [132 - (i % 2) * 30, 32 + i * 20]], "#3f6fa0", 6, false);
};
/** a calendar page (240 x 280): coloured header, a grid of days (no text), page k circles one day */
const drawCal = (p: Pen, k: number) => {
  const hc = ["#c0392b", "#3f6fa0", "#d9a441", "#5a9a6a"][k % 4];
  p.poly([[10, 10], [230, 10], [230, 270], [10, 270]], "#fbf8f0", 7);
  p.poly([[10, 10], [230, 10], [230, 66], [10, 66]], hc, 7);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) p.dot(34 + x * 29, 96 + y * 38, 5, "#8d8a86");
  const d = (k * 3) % 35; p.ell(34 + (d % 7) * 29, 96 + Math.floor(d / 7) * 38, 15, 15, null, 6);
};
/** a wall clock (200 x 200), hand angle a */
const drawClock = (p: Pen, a: number) => {
  p.ell(100, 100, 88, 88, "#fbf8f0", 8);
  for (let i = 0; i < 12; i++) { const b = (i / 12) * Math.PI * 2; p.dot(100 + 70 * Math.cos(b), 100 + 70 * Math.sin(b), 4, "#3a2a24"); }
  p.stroke([[100, 100], [100 + 56 * Math.sin(a), 100 - 56 * Math.cos(a)]], 8);
  p.stroke([[100, 100], [100 + 36 * Math.sin(a / 12), 100 - 36 * Math.cos(a / 12)]], 10);
};
/** confetti (400 x 400), phase n */
const drawConfetti = (p: Pen, n: number) => {
  const cols = ["#e0b84a", "#c0392b", "#3f6fa0", "#5a9a6a", "#d86a8a"];
  for (let i = 0; i < 18; i++) {
    const x = (i * 83 + n * 7) % 380 + 10, y = (i * 47 + n * 23) % 380 + 10, a = (i + n) * 0.7;
    p.poly([[x, y], [x + 22 * Math.cos(a), y + 22 * Math.sin(a)], [x + 22 * Math.cos(a) - 8 * Math.sin(a), y + 22 * Math.sin(a) + 8 * Math.cos(a)], [x - 8 * Math.sin(a), y + 8 * Math.cos(a)]], cols[i % 5], 3);
  }
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = Y, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
const seat = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, p: V3, expr: Expr, extra: FrontOpts = {}) =>
  front(cam, t, out, i, o, okey, p[0], p[2], expr, { mode: "sit", ...extra }, p[1], false);
/** before / after a word (2 frames early) */
const by = (t: number, t0: number) => t >= t0 - 0.07;
/** a card that grows in from t0 over d seconds */
const grow = (t: number, t0: number, d = 0.5) => smooth((t - t0 + 0.07) / d);
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
/** a ring travelling from a to b over d seconds from t0, growing from s0 to s1; fades in and out by size */
const ring = (out: Stage, t: number, t0: number, d: number, a: V3, b: V3, s0: number, s1: number, full: boolean, col = "#ffe8a8") => {
  const u = (t - t0) / d;
  if (u < 0 || u >= 1) return;
  const k = smooth(u / 0.12) * (1 - smooth((u - 0.88) / 0.12)), s = (s0 + (s1 - s0) * u) * k;
  card(out, `ring${full ? 1 : 0}${col}`, 500, 500, (pn) => drawRing(pn, full, col), a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, s, s);
};
/** the dish's bowl centre and its pointing axis for shot id at t */
const bowl = (id: number, t: number) => {
  const el = dishEl(id, t), ax: V3 = [0, Math.sin(el), Math.cos(el)];
  const c: V3 = [DISH[0], Y + DISH_H + ax[1] * 1.6, DISH[2] + ax[2] * 1.6];
  return { c, ax };
};
const along = (c: V3, ax: V3, d: number): V3 => [c[0] + ax[0] * d, c[1] + ax[1] * d, c[2] + ax[2] * d];

// ---------------- the places ----------------
const dishSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const { c, ax } = bowl(id, t);
  if (id === 1) {
    // sunset: the dish sends a hello ring up its axis, the operators by their building
    ring(out, t, T_HELLO - 0.1, 1.4, along(c, ax, 6), along(c, ax, 40), 4, 10, true);
    front(cam, t, out, 1, OP[0], "op0", OPS[0], OPS[2], by(t, T_HELLO) ? "grin" : "smile", { facing: -1, wave: by(t, T_HELLO) ? 0.7 : 0 });
    front(cam, t, out, 2, OP[1], "op1", OPS[0] + 1.1, OPS[2] + 0.4, "smile", { facing: -1 });
  } else if (id === 7) {
    // the rings come down to the bowl after it locks on: empty
    for (let i = 0; i < 3; i++) ring(out, t, T_LOCK + 0.1 + i * 0.7, 1.3, along(c, ax, 36), along(c, ax, 5), 8, 4, false);
    const sig = t * 30 >= Math.round(T_SIGNAL * 30) - 3 - 0.5, em = by(t, T_EMPTY);
    front(cam, t, out, 1, OP[0], "op0", OPS[0], OPS[2], em ? "dazed" : sig ? "neutral" : by(t, T_HUGE) ? "smile" : "smile_closed", { facing: -1, headTilt: em ? 8 : 0 });
    front(cam, t, out, 2, OP[1], "op1", OPS[0] + 1.1, OPS[2] + 0.4, em ? "nervous" : "smile", { facing: -1, wave: by(t, T_LOCK) && !em ? 0.6 : 0 });
    if (sig) {
      const g = grow(t, T_EMPTY, 0.4);
      card(out, "bubble", 320, 260, drawBubble, OPS[0] + 0.55, Y + 2.55 + 0.05 * g, OPS[2] + 0.2, 0.95 * g, 0.77 * g);
    }
  } else {
    // sunset again: still listening; one more ring comes down, empty, on "rings"
    ring(out, t, T_RINGS2 - 1.1, 1.3, along(c, ax, 36), along(c, ax, 5), 8, 4, false);
    const l = by(t, T_LISTEN);
    front(cam, t, out, 1, OP[0], "op0", OPS[0], OPS[2], l ? "smile" : "smile_closed", { facing: -1 });
    front(cam, t, out, 2, OP[1], "op1", OPS[0] + 1.1, OPS[2] + 0.4, by(t, T_RINGS2) ? "grin" : "smile", { facing: -1, wave: by(t, T_RINGS2) ? 0.6 : 0 });
  }
};

const spaceSet = (id: number, t: number, _cam: CamInfo, out: Stage) => {
  const P = PROBE;
  const home: V3 = [P[0], P[1] + 0.1, P[2] + 1.6];
  if (id === 2) {
    // the hello ring arrives from Earth (+z) just as "reach" is said
    ring(out, t, T_REACH - 0.9, 0.95, [P[0] + 0.3, P[1] + 0.3, P[2] + 9], [P[0], P[1], P[2] + 1.6], 1.0, 2.4, true);
    burst(out, [P[0], P[1] + 0.1, P[2] + 1.9], t, T_REACH - 0.05, 2.2, "#fff3b0", 0.5);
  } else if (id === 5) {
    // the light-day: a gold ring blooms around the probe
    if (by(t, T_LD)) {
      const g = grow(t, T_LD, 0.6);
      card(out, "ringgold", 500, 500, (pn) => drawRing(pn, false, "#f2c14a"), P[0], P[1] + 0.1, P[2] + 0.2, 5.4 * g, 5.4 * g);
      burst(out, [P[0], P[1] + 0.2, P[2] + 0.4], t, T_LD - 0.05, 4.0, "#ffe08a", 0.6);
    }
    void T_FIRST;
  } else if (id === 6) {
    card(out, "earth", 200, 200, drawEarth, EARTH_DOT[0], EARTH_DOT[1], EARTH_DOT[2], 2.6, 2.6);
  } else if (id === 8) {
    // still calling home: empty rings leave the dish toward Earth, one every 0.8 s
    for (let i = 0; i < 4; i++) ring(out, t, T_CALL - 0.9 + i * 0.75, 2.0, home, [P[0] + 0.2, P[1] + 0.3, P[2] + 6.5], 0.9, 2.2, false);
    void T_NOTHING;
  } else if (id === 12) {
    // 2023: saved, rings full of data again
    for (let i = 0; i < 4; i++) ring(out, t, T_SAVED - 0.3 + i * 0.75, 2.0, home, [P[0] - 0.2, P[1] + 0.4, P[2] + 6.5], 0.9, 2.2, true);
    void T_SILENCE;
  }
};

const padSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const lift = t >= T_77 - 0.07;
  if (lift) {
    const u = t - T_77 + 0.07, h = 3 + 5 * u * u; // the rocket's base above the ground
    const n = Math.round(t * 30) % 12, k = smooth(u / 0.25);
    card(out, `flame${n}`, 300, 500, (pn) => drawFlame(pn, n), ROCKET[0], Y + h - 3.5 * k, ROCKET[2] + 2.2, 4.2 * k, 7.0 * k);
    for (let i = 0; i < 6; i++) {
      const v = clamp01(u / 1.4 - i * 0.08), s = (4 + 9 * v) * smooth(v / 0.15);
      card(out, `smoke${i % 4}`, 400, 400, (pn) => drawSmoke(pn, i % 4), ROCKET[0] + (i % 2 ? 1 : -1) * (3 + 9 * v), Y + 2 + 2 * v, ROCKET[2] + 3 + i * 0.4, s, s * 0.8, true);
    }
  }
  // the crowd behind the fence
  const xs = [-6.5, -4.6, -2.8, -1.0, 1.2, 3.0, 4.8, 6.4];
  xs.forEach((dx, j) => {
    const o = FOLK[j % FOLK.length];
    front(cam, t, out, 1 + j, o, `fk${j}`, ROCKET[0] + 10 + dx, 36.2 + (j % 3) * 0.7, lift ? (j % 2 ? "shock" : "laugh") : "smile", { wave: lift ? wave(t, j) : 0 });
  });
};

const labSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 4) {
    const pr = by(t, T_PROUD), wk = by(t, T_WORKS);
    front(cam, t, out, 1, TEAM[0], "tm0", DESK[0] - 1.0, DESK[2] + 0.9, pr ? "grin" : "smile", { facing: 1 });
    front(cam, t, out, 2, TEAM[1], "tm1", DESK[0] + 0.1, DESK[2] + 1.0, wk ? "laugh" : "smile", { wave: wk ? 0.7 : 0 });
    front(cam, t, out, 3, TEAM[2], "tm2", DESK[0] + 1.2, DESK[2] + 0.8, pr ? "smile" : "smile_closed", { facing: -1 });
    front(cam, t, out, 4, TEAM[3], "tm3", DESK[0] - 2.0, DESK[2] - 1.0, "smile", { facing: 1 });
    front(cam, t, out, 5, TEAM[4], "tm4", DESK[0] + 2.4, DESK[2] - 1.1, wk ? "grin" : "smile", { facing: -1, wave: wk ? wave(t, 1) : 0 });
  } else if (id === 10) {
    // the data computer: packets go in, then on "data" they stop and tumble
    const pk = by(t, T_PACKS), dt = by(t, T_DATA);
    front(cam, t, out, 1, TEAM[0], "tm0", COMP[0] - 1.3, COMP[2] + 1.5, dt ? "nervous" : "stern", { facing: 1, wave: pk ? 0.6 : 0 });
    front(cam, t, out, 2, TEAM[2], "tm2", COMP[0] + 0.1, COMP[2] + 1.9, by(t, T_COMP) ? "nervous" : "neutral", { facing: -1 });
    front(cam, t, out, 3, TEAM[3], "tm3", COMP[0] - 2.4, COMP[2] + 1.2, "stern", { facing: 1 });
    for (let i = 0; i < 4; i++) {
      const u = (t - T_FAULT - i * 0.45) / 1.6;
      if (u < 0 || u >= 1) continue;
      const stop = dt ? clamp01((t - T_DATA) / 0.4) : 0, uu = Math.min(u, 0.55 + 0.1 * i);
      const k = smooth(u / 0.1) * (1 - smooth((u - 0.85) / 0.15));
      card(out, "packet", 160, 100, drawPacket, COMP[0] - 1.6 + 1.8 * uu, Y + 1.7 + 0.25 * Math.sin(i) - 0.8 * stop * stop, COMP[2] + 0.9, 0.32 * k, 0.2 * k);
    }
    if (dt) burst(out, [COMP[0] - 0.1, Y + 1.9, COMP[2] + 0.6], t, T_DATA - 0.05, 0.6, "#e8eef8");
  } else {
    // a day out, a day back: the calendar flips on "arrive" and "answer", then faster and faster to "weeks"
    let pages = (by(t, T_ARRIVE) ? 1 : 0) + (by(t, T_ANSWER) ? 1 : 0);
    if (t > T_ANSWER + 0.6) pages += Math.floor(Math.min(T_WEEKS, t) - T_ANSWER - 0.6) * 2 + Math.floor(clamp01((t - T_ANSWER - 0.6) / (T_WEEKS - T_ANSWER - 0.6)) * 6);
    card(out, `cal${pages % 8}`, 240, 280, (pn) => drawCal(pn, pages % 8), CAL[0] - 0.35, CAL[1], CAL[2] + 0.06, 0.95, 1.1);
    const ca = q((t - 39.5) * (0.6 + Math.max(0, t - T_ANSWER) * 0.9), 24);
    card(out, `clock${ca}`, 200, 200, (pn) => drawClock(pn, ca), CAL[0] + 0.75, CAL[1] + 0.25, CAL[2] + 0.06, 0.55, 0.55);
    const qq = by(t, T_QUEST), wk = by(t, T_WEEKS);
    front(cam, t, out, 1, SITTER, "tm1", CAL[0] - 0.85, -0.6, wk ? "dazed" : qq ? "neutral" : "smile_closed", { facing: 1, headTilt: wk ? 8 : 0 });
    front(cam, t, out, 2, TEAM[4], "tm4", CAL[0] + 0.25, 0.25, wk ? "nervous" : by(t, T_ANSWER) ? "stern" : "smile_closed", { facing: -1 });
  }
};

const homeSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const rings = by(t, T_RINGS) && !by(t, T_NOBODY), up = by(t, T_NOBODY);
  const j = rings ? 0.02 * Math.sin(t * 60) : 0;
  card(out, `phone${up ? 1 : 0}`, 300, 220, (pn) => drawPhone(pn, up ? 1 : 0), PHONE[0] + j, PHONE[1] + 0.11, PHONE[2] + 0.05, 0.36, 0.26);
  if (rings) { const u = q((t * 3) % 1, 12); const tg = grow(t, T_RINGS, 0.15); card(out, `ticks${u}`, 300, 300, (pn) => drawTicks(pn, u), PHONE[0], PHONE[1] + 0.32, PHONE[2] + 0.06, 0.5 * tg, 0.5 * tg); }
  const e: Expr = up ? (by(t, T_RINGING) ? "dazed" : "nervous") : rings ? "shock" : by(t, T_PHONE) ? "smile" : "smile_closed";
  seat(cam, t, out, 1, MOM, "mom", [SOFA[0], Y + 0.0, SOFA[2] + 0.1], e, { facing: 1, headTilt: up ? 10 : 0 });
  if (up) {
    const g = grow(t, T_NOBODY, 0.25);
    if (g > 0.01) out.fx.push({ key: "receiver", cw: 120, ch: 260, draw: drawReceiver, x: SOFA[0] + 0.25, y: Y + 0.95, z: SOFA[2] + 0.25, w: 0.13 * g, h: 0.28 * g, rot: 0.45 });
    const b = grow(t, T_NOBODY + 0.3, 0.4);
    card(out, "bubble", 320, 260, drawBubble, SOFA[0] + 0.72, Y + 1.5, SOFA[2] + 0.1, 0.5 * b, 0.4 * b);
  }
};

const hallSet = (_id: number, t: number, cam: CamInfo, out: Stage) => {
  const c = by(t, T_CELEB), late = by(t, T_LATE), news = by(t, T_NEWS);
  const z = CROWD_Z;
  TEAM.forEach((o, j) => front(cam, t, out, 1 + j, o, `tm${j}`, STAGE[0] - 2.6 + j * 1.3, z - 0.4 - (j % 2) * 0.5, c ? (j % 2 ? "laugh" : "grin") : "smile", { wave: c ? wave(t, j) : 0 }));
  KIDS.forEach((o, j) => front(cam, t, out, 6 + j, o, `kd${j}`, STAGE[0] - 1.6 + j * 1.5, z + 0.6, news ? "laugh" : c ? "grin" : "smile", { wave: c ? wave(t, j + 2, 7) : 0 }));
  if (c) {
    const n = Math.round(t * 15) % 10;
    const cg = grow(t, T_CELEB, 0.35);
    card(out, `conf${n}`, 400, 400, (pn) => drawConfetti(pn, n), STAGE[0] - 0.6, Y + 2.6 - 0.2 * ((t * 2) % 1), z - 1.2, 3.4 * cg, 3.4 * cg);
    burst(out, [STAGE[0] - 1.5, Y + 3.0, z - 1.0], t, T_CELEB - 0.05, 1.4, "#ffe08a", 0.5);
  }
  if (late) burst(out, [STAGE[0] + 1.4, Y + 2.9, z - 1.0], t, T_LATE - 0.05, 1.2, "#e8eef8", 0.5);
  void LX;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "dish") dishSet(id, t, cam, out);
  else if (s.scene === "space") spaceSet(id, t, cam, out);
  else if (s.scene === "pad") padSet(id, t, cam, out);
  else if (s.scene === "lab") labSet(id, t, cam, out);
  else if (s.scene === "home") homeSet(id, t, cam, out);
  else hallSet(id, t, cam, out);
  return out;
};
/** how far the rocket has risen (m) at t, for world.ts */
export const rocketRise = (t: number) => (t >= T_77 - 0.07 ? 5 * (t - T_77 + 0.07) ** 2 : 0);
