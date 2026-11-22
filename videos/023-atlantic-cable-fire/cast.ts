// The cast and hand-drawn props of the cable story: Cyrus Field (dark coat, top hat, beard-brown moustache), the
// sailors of the cable ships, the telegraph operator, Wildman Whitehouse (grey coat, top hat), the New York crowd,
// the newsboy, the gardener and the child of the hose analogy. Drawn props and effects: fireworks, sparks, smoke and
// flames on the cupola, the message tape, the office clock, the clicks, the lever and its spark, the garden hose with
// its crack, the water, the newspaper.
import { Pen, SKINS, Outfit, Expr, FrontOpts, townsfolk, fxBurst, fxSplash } from "../../src/engine/toon";
import { CamInfo, Stage, Who, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import {
  D0, SHOTS, smooth, clamp01, OFF, DESK_Y, HALL, DOME, HOME, DECK, SEA, FIELD_AT, FIELD3, OPER_AT, BATT, shipAt, sternOf, snapAt, tapAt, burstAt, fireAt,
  T_CHEERED, T_SET, T_FIRE, T_IRELAND, T_SNAP, T_SINK, T_TIED, T_THIS, T_HELD, T_QUEEN, T_WORDS, T_SIXTEEN, T_HOURS,
  T_NOBODY, T_FIREWORKS, T_BURST, T_SPARKS, T_ROOF, T_DOME, T_FLAMES, T_SIGNAL, T_FADING, T_CLICK, T_WEAKER, T_LAST,
  T_WILDMAN, T_PUSHED, T_VOLTS, T_HOSE, T_CRACK, T_TURN, T_NOT, T_BURSTS, T_DEAD, T_PAPERS, T_WONDERED, T_ALL,
  T_FIELD2, T_WORKED, T_BURNED, T_CHAT, T_WEEKS, T_CYRUS,
} from "./story";

const FIELD: Outfit = { jacket: "#2e2a3a", pants: "#3a3440", boots: "#1e1a1e", hat: "tophat", moustache: "#5a3a26", buttons: "#c9a24a", belt: null, skin: SKINS[0] };
const SAILOR: Outfit = { jacket: "#2a3a6a", pants: "#e8e2d4", boots: "#1e1a1e", hat: "cap", cap: "#2a3a6a", belt: null, skin: SKINS[1] };
const SAILOR2: Outfit = { ...SAILOR, moustache: "#4a3426", skin: SKINS[3] };
const OPER: Outfit = { jacket: "#6a5038", pants: "#3a3440", boots: "#2a1e18", hat: "hair", hair: "#3a2a20", buttons: "#c9a24a", belt: null, skin: SKINS[1] };
const WHITE: Outfit = { jacket: "#5e5e66", pants: "#2e2e36", boots: "#1e1a1e", hat: "tophat", moustache: "#8a6a4a", belt: null, skin: SKINS[0], build: "stout" };
const NEWSBOY: Outfit = { jacket: "#b5653f", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#5a4a3a", skin: SKINS[2], build: "kid" };
const GARD: Outfit = { jacket: "#5d7a3a", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#6a5a3a", moustache: "#6a4a30", belt: "#5a3a26", skin: SKINS[1] };
const KID: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#6a4028", skin: SKINS[0], build: "kid" };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);

// ---------------- drawings ----------------
/** flames (300 x 400): tongues of red, orange and yellow, flickering by variant k */
const drawFlame = (k: number) => (p: Pen) => {
  const tongues = (col: string, s: number, w: number) => {
    const pts: [number, number][] = [[150 - 130 * w, 390]];
    for (let i = 0; i < 5; i++) {
      const x = 150 - 130 * w + (260 * w * (i + 0.5)) / 5, h = s * (220 + 110 * Math.sin(i * 2.1 + k * 1.7));
      pts.push([x - 22 * w, 390 - h * 0.45], [x + 6 * Math.sin(k + i), 390 - h], [x + 22 * w, 390 - h * 0.45]);
    }
    pts.push([150 + 130 * w, 390]);
    p.poly(pts, col, 6);
  };
  tongues("#d8452c", 1.0, 1.0); tongues("#f08a2a", 0.72, 0.8); tongues("#ffd45a", 0.42, 0.55);
};
/** soft smoke (300 x 300): grey puffs */
const drawSmoke = (k: number, dark = 0.5) => (p: Pen) => {
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1 + k * 0.3, r = 46 + 18 * (i % 3);
    p.ell(150 + 70 * Math.cos(a), 170 + 50 * Math.sin(a) - i * 10, r, r * 0.85, `rgba(${Math.round(90 + 60 * (1 - dark))},${Math.round(84 + 60 * (1 - dark))},${Math.round(90 + 60 * (1 - dark))},0.85)`, 0);
  }
};
/** falling sparks (300 x 300) */
const drawSparks = (k: number) => (p: Pen) => {
  for (let i = 0; i < 14; i++) {
    const x = 30 + ((i * 97 + k * 13) % 240), y = 20 + ((i * 53 + k * 41) % 260);
    p.ell(x, y, 7, 7, i % 2 ? "#ffe07a" : "#ffb04a", 3);
  }
};
/** a firework burst (500 x 500) at time k in 0..1: coloured rays with bright tips, fading out */
const drawFirework = (k: number, col: string) => (p: Pen) => {
  const e = 1 - (1 - k) ** 3, a = Math.max(0, 1 - k * 1.1);
  for (let i = 0; i < 14; i++) {
    const r = (i / 14) * Math.PI * 2 + 0.2 * (i % 2), r0 = 20 + 100 * e, r1 = 50 + 200 * e;
    p.g.globalAlpha = a;
    p.line([[250 + r0 * Math.cos(r), 250 + r0 * Math.sin(r) + 30 * k * k], [250 + r1 * Math.cos(r), 250 + r1 * Math.sin(r) + 40 * k * k]], col, 16, false);
    p.dot(250 + r1 * Math.cos(r), 250 + r1 * Math.sin(r) + 40 * k * k, 13, "#ffffff");
  }
  if (k < 0.25) p.dot(250, 250, 40 * (1 - 4 * k), "#ffffff");
  p.g.globalAlpha = 1;
};
/** the message tape (600 x 80): a paper strip with dots and dashes */
const drawTape = (p: Pen) => {
  p.poly([[0, 20], [600, 20], [600, 60], [0, 60]], "#f4ecd8", 5);
  for (let i = 0; i < 18; i++) { const x = 20 + i * 32; if (i % 3 === 1) p.poly([[x, 36], [x + 20, 36], [x + 20, 44], [x, 44]], "#2a2228", 0); else p.ell(x + 6, 40, 5, 5, "#2a2228", 0); }
};
/** the office clock (240 x 240): white face, hands at angles a (minute) and b (hour) */
const drawClock = (a: number, b: number) => (p: Pen) => {
  p.ell(120, 120, 100, 100, "#6a4630", 8); p.ell(120, 120, 82, 82, "#f8f4ea", 5);
  for (let i = 0; i < 12; i++) { const r = (i / 12) * Math.PI * 2; p.dot(120 + 70 * Math.cos(r), 120 + 70 * Math.sin(r), 5); }
  p.stroke([[120, 120], [120 + 64 * Math.sin(a), 120 - 64 * Math.cos(a)]], 8);
  p.stroke([[120, 120], [120 + 42 * Math.sin(b), 120 - 42 * Math.cos(b)]], 12);
};
/** the big lever on the battery bench (200 x 300): a brass handle on a dark base, tilted by u */
const drawLever = (u: number) => (p: Pen) => {
  const a = -0.7 + 1.4 * u;
  p.poly([[40, 250], [160, 250], [170, 290], [30, 290]], "#3a2a22", 6);
  p.line([[100, 260], [100 + 170 * Math.sin(a), 260 - 170 * Math.cos(a)]], "#c9a24a", 18);
  p.ell(100 + 170 * Math.sin(a), 260 - 170 * Math.cos(a), 24, 24, "#b02a2a", 6);
};
/** the hose (900 x 300), drawn flat on the grass: a green tube from the tap (left) to the nozzle (right), the crack */
const drawHose = (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([20 + 860 * u, 150 + 70 * Math.sin(u * Math.PI * 2.2)]); }
  p.line(pts, "#3f8a3a", 26);
  p.poly([[440, 100], [470, 130], [452, 136], [478, 166], [446, 150], [430, 120]], "#2a3a2a", 4);
};
/** a water jet (400 x 200): a blue arc from the left edge, length u */
const drawJet = (u: number) => (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const x = 10 + 380 * u * (i / 12), y = 60 + 120 * ((i / 12) ** 2) * u; pts.push([x, y]); }
  p.line(pts, "#6cc0f0", 22);
  for (let i = 0; i < 5; i++) p.ell(10 + 380 * u * (0.3 + i * 0.16), 90 + 100 * u * (0.3 + i * 0.2), 10, 13, "#9fd8f4", 4);
};
/** the newspaper (260 x 200): a folded sheet with a big black headline bar and column lines */
const drawPaper = (p: Pen) => {
  p.poly([[20, 20], [240, 30], [235, 185], [15, 175]], "#f2ead8", 6);
  p.poly([[34, 40], [224, 48], [222, 74], [32, 66]], "#2a2228", 0);
  for (let i = 0; i < 5; i++) p.stroke([[34, 92 + i * 16], [222, 99 + i * 16]], 5, "#8a8478");
  p.ell(200, 150, 22, 22, "#2a2228", 0);
};
/** a question mark (200 x 300), text-free as a drawn curl and dot */
const drawQ = (p: Pen) => {
  p.arc(100, 100, 60, 60, 180, 405, 26, "#f6f2e6");
  p.stroke([[142, 143], [100, 175], [100, 205]], 26, "#f6f2e6");
  p.dot(100, 255, 16, "#f6f2e6");
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true, scale = 1) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, scale));
  if (shadow) blob(out, x, y, z, scale);
};
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: { soft?: boolean; flat?: boolean; rot?: number } = {}) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, ...extra });
};
const at = (t: number, t0: number) => t >= t0 - 0.07;
/** the point d metres from (x, z) toward the camera (props held in front of a character card) */
const toCam = (cam: CamInfo, x: number, z: number, d: number): [number, number] => {
  const dx = cam.pos.x - x, dz = cam.pos.z - z, l = Math.hypot(dx, dz) || 1;
  return [x + (dx / l) * d, z + (dz / l) * d];
};
const [HX, , HZ] = HALL, [OX, , OZ] = OFF, [GX, , GZ] = HOME, [SX0, , SZ0] = SEA;
const GY = D0 + 0.05;
const FW_COLS = ["#ffd45a", "#ff7a6a", "#9fe0ff", "#c8a0ff", "#ffffff"];
/** one firework: bursts at t0 at (x, y, z), size s */
const firework = (out: Stage, t: number, t0: number, x: number, y: number, z: number, s: number, c: number) => {
  const u = (t - t0) / 1.4;
  if (u < 0 || u >= 1) return;
  const k = Math.round(u * 24) / 24;
  card(out, `fw${c}|${k}`, 500, 500, drawFirework(k, FW_COLS[c % 5]), x, y - s / 2 - 1.5 * u, z, s, s);
};
/** a crowd on the lawn: rows of townsfolk facing the hall's lawn camera, all cheering when `cheer` */
const crowd = (cam: CamInfo, t: number, out: Stage, n: number, cheer: number, mood: Expr, z0 = HZ + 12) => {
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 6), x = HX - 9 + (i % 6) * 3.4 + (row % 2) * 1.6 + 0.6 * Math.sin(i * 3.1), z = z0 + row * 3.2 + 0.7 * Math.cos(i * 1.7);
    const hop = cheer > 0 ? 0.08 * Math.abs(Math.sin(t * 6 + i)) : 0;
    front(cam, t, out, 40 + i, FOLK[i % 8], `f${i % 8}`, x, GY + hop, z, cheer > 0 ? (i % 3 ? "laugh" : "grin") : mood, cheer > 0 && i % 2 ? { wave: 0.9 } : {});
  }
};
const flames = (out: Stage, t: number, u: number, big = 1) => {
  if (u <= 0.01) return;
  const k = Math.floor(t * 10) % 6, [x, y, z] = DOME;
  card(out, `flame|${k}`, 300, 400, drawFlame(k), x - 0.4, y - 1.6 + 2.2 * u * big, z + 2.6, 4.2 * u * big, 5.6 * u * big);
  card(out, `flame|${(k + 3) % 6}`, 300, 400, drawFlame((k + 3) % 6), x + 1.6, y - 2.6 + 1.6 * u * big, z + 2.0, 2.8 * u * big, 3.8 * u * big);
  card(out, `smoke|${k}`, 300, 300, drawSmoke(k), x - 0.8, y + 3.2 + 3.5 * u + 0.4 * Math.sin(t), z - 0.5, 6.5 * u, 6.5 * u, { soft: true });
};

// ---------------- the shots ----------------
const shots = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 1) { // the hook (golden): the crowd cheers under fireworks; the cupola catches fire
    crowd(cam, t, out, 12, at(t, T_CHEERED) ? 1 : 0, "smile");
    [0.2, 0.9, 1.7, 2.5, 3.2].forEach((t0, i) => firework(out, t, t0, HX + [-11, 9, -6, 12, -13][i], D0 + 22 + 3 * (i % 2), HZ + 3, 13, i));
    if (at(t, T_SET)) card(out, `sparks|${Math.floor(t * 8) % 4}`, 300, 300, drawSparks(Math.floor(t * 8) % 4), DOME[0], DOME[1] + 3.5, DOME[2] + 2.8, 4, 4);
    flames(out, t, fireAt(1, t));
    void T_FIRE;
    return;
  }
  if (id === 2) { // the sea: two sailors at the Niagara's stern as the cable runs out into the water
    const s = shipAt("niagara", 2, t)!, st = sternOf(s);
    front(cam, t, out, 2, SAILOR, "sailor", st[0] + 4.5, DECK + 0.06, SZ0 + 1.6, at(t, T_IRELAND) ? "grin" : "smile");
    front(cam, t, out, 3, SAILOR2, "sailor2", st[0] + 6.5, DECK + 0.06, SZ0 - 1.4, "smile_closed");
    return;
  }
  if (id === 3) { // the deck: Field watches the cable run out; it snaps and the end flies off
    const [FX, FY, FZ] = FIELD3, u = snapAt(t);
    front(cam, t, out, 1, FIELD, "field", FX, FY, FZ, at(t, T_SINK) ? "pained" : at(t, T_SNAP) ? "shock" : at(t, T_CYRUS) ? "smile" : "neutral", at(t, T_SNAP) && !at(t, T_SINK) ? { wave: 1 } : {});
    if (u > 0 && u < 1) {
      const st = sternOf(shipAt("niagara", 3, t)!), k = Math.round(u * 24) / 24;
      card(out, `snap|${k}`, 500, 500, (p) => fxBurst(p, k, "#fff3b0", 10, 40, 220), st[0] + 1.2, DECK + 0.4, st[2], 2.0, 2.0);
    }
    if (u > 0.2) { const k = Math.round(clamp01((t - T_SNAP) / 0.9) * 24) / 24; if (k < 1) card(out, `splash|${k}`, 800, 800, (p) => fxSplash(p, k), SX0 - 25.5, 0.0, SZ0 + 1.5, 3.2, 3.2); }
    return;
  }
  if (id === 4) { // from above: the two ships; a spark where the ends are joined
    const b = (t - T_TIED + 0.1) / 0.5;
    if (b > 0 && b < 1) { const k = Math.round(b * 24) / 24; card(out, `join|${k}`, 500, 500, (p) => fxBurst(p, k, "#fff3b0", 10, 40, 200), SX0, DECK, SZ0 + 1, 3.5, 3.5); }
    return;
  }
  if (id === 5) { // the deck: the line holds; Field and the sailors cheer
    const [FX, FY, FZ] = FIELD_AT, held = at(t, T_HELD);
    front(cam, t, out, 1, FIELD, "field", FX, FY, FZ, held ? "laugh" : at(t, T_THIS) ? "nervous" : "neutral", held ? { wave: 1 } : {});
    front(cam, t, out, 2, SAILOR, "sailor", FX + 2.4, FY, FZ + 3.0, held ? "laugh" : "nervous", held ? { wave: 0.8 } : {});
    front(cam, t, out, 3, SAILOR2, "sailor2", FX + 4.0, FY, FZ + 1.2, held ? "grin" : "neutral");
    return;
  }
  if (id === 6) { // the office: the Queen's message creeps out on the tape; the clock spins; the operator yawns
    const [PX, PY, PZ] = OPER_AT;
    front(cam, t, out, 4, OPER, "oper", PX, PY, PZ, at(t, T_HOURS) ? "dazed" : at(t, T_SIXTEEN) ? "pained" : at(t, T_QUEEN) ? "grin" : "smile");
    const L = 0.25 + 0.9 * clamp01((t - T_WORDS + 0.1) / 3.0);
    card(out, `tape`, 600, 80, drawTape, OX - 0.1 - L / 2, DESK_Y + 0.02, OZ + 0.25, L, 0.14, { flat: true });
    const spin = clamp01((t - T_SIXTEEN + 0.1) / 1.6), a = 2 * Math.PI * 16 * spin, b2 = a / 12;
    card(out, `clock|${Math.round(a * 8)}`, 240, 240, drawClock(a, b2 + 1.2), OX + 0.6, D0 + 2.45, OZ - 2.5, 0.5, 0.5);
    return;
  }
  if (id === 7) { // golden: the crowd under the fireworks over City Hall
    crowd(cam, t, out, 12, at(t, T_NOBODY) ? 1 : 0, "smile", HZ + 14);
    [T_FIREWORKS - 0.1, T_FIREWORKS + 0.5, T_BURST, T_BURST + 0.6].forEach((t0, i) => firework(out, t, t0, HX + [-10, 8, -4, 12][i], D0 + 21 + 3 * (i % 2), HZ + 3, 14, i + 1));
    firework(out, t, T_NOBODY - 0.5, HX + 6, D0 + 23, HZ + 3, 9, 4);
    return;
  }
  if (id === 8) { // golden: the cupola: sparks fall onto it, smoke, then flames
    if (at(t, T_SPARKS)) { const k = Math.floor(t * 8) % 4; card(out, `sparks|${k}`, 300, 300, drawSparks(k), DOME[0] + 0.3, DOME[1] + 2.2 - 0.6 * ((t * 2) % 1), DOME[2] + 2.8, 3.6, 3.6); }
    firework(out, t, T_SPARKS - 0.9, DOME[0] - 3, DOME[1] + 9, DOME[2] - 4, 9, 2);
    firework(out, t, T_SPARKS + 0.2, DOME[0] + 4, DOME[1] + 11, DOME[2] - 6, 8, 3);
    flames(out, t, fireAt(8, t));
    void T_ROOF; void T_DOME; void T_FLAMES;
    return;
  }
  if (id === 9) { // the office: the operator listens for the clicks; each one smaller
    const [PX, PY, PZ] = OPER_AT;
    front(cam, t, out, 4, OPER, "oper", PX, PY, PZ, at(t, T_LAST) ? "pained" : at(t, T_WEAKER) ? "nervous" : at(t, T_FADING) ? "stern" : "neutral", { look: -0.3 });
    [T_SIGNAL, T_FADING, T_CLICK, T_WEAKER, T_LAST].forEach((t0, i) => {
      const u = (t - t0 + 0.05) / 0.45;
      if (u > 0 && u < 1) { const k = Math.round(u * 12) / 12, s = 0.75 * (1 - i * 0.16); card(out, `click|${k}`, 500, 500, (p) => fxBurst(p, k, "#ffd45a", 8, 30, 200), OX - 0.25, DESK_Y + 0.4, OZ + 0.05, s, s); }
    });
    return;
  }
  if (id === 10) { // Whitehouse at his battery bench: he pushes the lever; a big spark on "volts"
    const [BX, BY, BZ] = BATT, u = smooth((t - T_PUSHED + 0.1) / 0.5);
    front(cam, t, out, 5, WHITE, "white", BX - 0.7, BY, BZ + 0.35, at(t, T_VOLTS) ? "shock" : at(t, T_PUSHED) ? "stern" : at(t, T_WILDMAN) ? "grin" : "neutral", at(t, T_PUSHED) && !at(t, T_VOLTS) ? { wave: 0.7 } : {});
    const [lx, lz] = toCam(cam, BX + 0.4, BZ - 0.3, 0.3);
    card(out, `lever|${Math.round(u * 16)}`, 200, 300, drawLever(u), lx, D0 + 0.12 + 0.85 + 0.3, lz, 0.4, 0.6);
    const b = (t - T_VOLTS + 0.1) / 0.6;
    if (b > 0 && b < 1) { const k = Math.round(b * 24) / 24; card(out, `volt|${k}`, 500, 500, (p) => fxBurst(p, k, "#cfe8ff", 12, 40, 240), BX + 0.2, D0 + 1.3, BZ - 0.2, 1.6, 1.6); }
    return;
  }
  if (id === 11) { // the analogy: the gardener holds the nozzle; the child turns the tap up; the crack bursts
    const tap = tapAt(t), bu = burstAt(t);
    front(cam, t, out, 6, GARD, "gard", GX + 1.1, D0, GZ + 0.1, at(t, T_BURSTS) ? "shock" : at(t, T_NOT) ? "nervous" : at(t, T_HOSE) ? "smile" : "neutral", { wave: 0.4 });
    front(cam, t, out, 7, KID, "kid", GX - 1.25, D0, GZ - 0.1, at(t, T_BURSTS) ? "laugh" : at(t, T_TURN) ? "grin" : "smile", at(t, T_TURN) && !at(t, T_BURSTS) ? { wave: 0.6 } : {});
    card(out, "hose", 900, 300, drawHose, GX - 0.1, D0 + 0.02, GZ + 0.3, 3.2, 1.07, { flat: true });
    const jet = 0.5 * (1 - 0.7 * bu), [jx, jz] = toCam(cam, GX + 1.0, GZ + 0.1, 0.25);
    card(out, `jet|${Math.round(jet * 20)}`, 400, 200, drawJet(jet), jx + 0.45, D0 + 0.5, jz, 0.9, 0.45);
    const d = clamp01((t - T_CRACK + 0.1) / 0.4) * (0.25 + 0.75 * tap);
    if (d > 0.05 && bu <= 0) { const k = Math.floor(t * 8) % 4; card(out, `drip|${k}`, 800, 800, (p) => fxSplash(p, 0.15 + 0.05 * k), GX - 0.1, D0 + 0.18, GZ + 0.25, 0.4 * d, 0.4 * d); }
    if (bu > 0) { const k = Math.round(Math.min(0.95, bu) * 24) / 24; card(out, `burst|${k}`, 800, 800, (p) => fxSplash(p, k), GX - 0.1, D0 + 0.45, GZ + 0.25, 1.6, 1.6); }
    return;
  }
  if (id === 12) { // the office: the line is dead; the operator slumps, Whitehouse stares
    const [PX, PY, PZ] = OPER_AT;
    front(cam, t, out, 4, OPER, "oper", PX, PY, PZ, at(t, T_DEAD) ? "dazed" : "nervous", at(t, T_DEAD) ? { headTilt: 12 } : {});
    front(cam, t, out, 5, WHITE, "white", OX + 1.5, PY, OZ - 0.7, at(t, T_DEAD) ? "shock" : "stern");
    return;
  }
  if (id === 13) { // day: the newsboy waves the paper; people wonder; question marks
    const nb: [number, number] = [HX + 3.0, HZ + 18.5];
    front(cam, t, out, 8, NEWSBOY, "newsboy", nb[0], GY, nb[1], at(t, T_PAPERS) ? "laugh" : "grin", { wave: 0.8 });
    const [px, pz] = toCam(cam, nb[0] + 0.35, nb[1], 0.3);
    card(out, "paper", 260, 200, drawPaper, px, GY + 1.25 + 0.05 * Math.sin(t * 8), pz, 0.42, 0.32, { rot: 0.1 * Math.sin(t * 5) });
    front(cam, t, out, 9, FOLK[0], "f0", HX + 0.6, GY, HZ + 16.5, at(t, T_WONDERED) ? "dazed" : "neutral", { headTilt: at(t, T_WONDERED) ? -10 : 0 });
    front(cam, t, out, 10, FOLK[3], "f3", HX + 5.3, GY, HZ + 16.0, at(t, T_ALL) ? "nervous" : at(t, T_WONDERED) ? "dazed" : "neutral", { headTilt: at(t, T_WONDERED) ? 10 : 0 });
    const q = smooth((t - T_WONDERED + 0.1) / 0.4);
    card(out, "q", 200, 300, drawQ, HX + 0.6, GY + 2.6 + 0.05 * Math.sin(t * 3), HZ + 16.5, 0.55 * q, 0.82 * q);
    card(out, "q", 200, 300, drawQ, HX + 5.3, GY + 2.6 + 0.05 * Math.cos(t * 3), HZ + 16.0, 0.55 * q, 0.82 * q);
    return;
  }
  if (id === 14) { // eight years later: Field on the new ship's deck; it works
    const [FX, FY, FZ] = FIELD_AT, ok = at(t, T_WORKED);
    front(cam, t, out, 1, FIELD, "field", FX, FY, FZ, ok ? "laugh" : at(t, T_FIELD2) ? "grin" : "smile", ok ? { wave: 1 } : {});
    front(cam, t, out, 2, SAILOR, "sailor", FX - 1.5, FY, FZ + 1.2, ok ? "grin" : "smile");
    return;
  }
  // id 15 (golden): the burnt cupola smokes; two citizens look at it and shrug
  const k = Math.floor(t * 4) % 6;
  card(out, `smoke|${k}`, 300, 300, drawSmoke(k, 0.3), DOME[0] - 0.5, DOME[1] + 1.2 + 0.3 * Math.sin(t), DOME[2], 5.5, 5.5, { soft: true });
  const shrug = at(t, T_CHAT);
  front(cam, t, out, 11, FOLK[2], "f2", HX - 3.6, GY, HZ + 14, shrug ? "smile_closed" : at(t, T_BURNED) ? "pained" : "neutral", shrug ? { wave: 0.9 } : {});
  front(cam, t, out, 12, FOLK[5], "f5", HX - 1.0, GY, HZ + 15, at(t, T_WEEKS) ? "laugh" : shrug ? "grin" : "neutral", shrug ? { wave: 0.7 } : {});
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  setStageLight(cam, SHOTS[id - 1].light);
  shots(id, t, cam, out);
  return out;
};
void DECK;
