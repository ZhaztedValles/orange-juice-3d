// The cast and hand-drawn props of the shipwreck lock: the finder (a metal detectorist: olive coat, flat cap, grey
// moustache), the curator (plum jacket, fair hair), the conservator (teal jacket), the engineer (white lab coat) and
// museum visitors. The drawings: the brass lock with its four lettered rings (closed or open), gold and silver coins,
// the metal detector, the scan screens (a failed grey scan, the X-ray of the rings with their notches), the four
// letters, the "1,296" tag, a tick, a brush, the question card, a name tag and a key. Every prop is an unlit
// ink-outlined drawing; cards that arrive mid-shot grow in over a few frames (never pop).
import { Pen, KID, SKINS, Outfit, Expr, FrontOpts, SideOpts, townsfolk, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, TABLE, CASE, LAB, DESK, SCAN, smooth, finderX, lockOpen,
  T_PADLOCK, T_CLICKED, T_NOBODY, T_SANK, T_COINS, T_DETECTOR, T_TREASURE, T_DUG, T_LOCK, T_RINGS, T_THOUSAND, T_ONE,
  T_NOBODY2, T_LAB, T_PUT, T_SCANNER, T_FAILED, T_THIRD, T_LINED, T_A, T_N, T_C, T_E, T_SET, T_CLEANED, T_OPENED,
  T_PERFECT, T_FOUND, T_ARK, T_KNOWS, T_OWNER, T_NAME, T_PASSWORD, T_TELL, T_STRIPPED,
} from "./story";

const FINDER: Outfit = { jacket: "#5a6a3a", pants: "#3b3f52", boots: "#3a2a20", hat: "cap", cap: "#6a5a48", moustache: "#cfc8bc", skin: SKINS[0] };
const CURATOR: Outfit = { jacket: "#7a3a5a", pants: "#2e3a52", boots: "#2a2220", hat: "hair", hair: "#c9a06a", skin: SKINS[0] };
const CONSERV: Outfit = { jacket: "#2f6a6a", pants: "#3a3a44", boots: "#2a2220", hat: "hair", hair: "#2a1a14", skin: SKINS[3] };
const ENGINEER: Outfit = { jacket: "#eef1f3", pants: "#3a4a6a", boots: "#2a2220", hat: "hair", hair: "#5a3b2a", moustache: "#5a3b2a", skin: SKINS[1] };
const KIDA: Outfit = { ...KID, jacket: "#d9a441", cap: "#b8302c", skin: SKINS[2] };
const KIDB: Outfit = { ...KID, jacket: "#5a8fc2", hat: "hair", hair: "#2a1a14", skin: SKINS[3] };
const BRASS = "#d1a648", BRASS_D = "#9a7428", PAPER = "#f6ecd2";

// ---------------- drawings ----------------
/** the brass combination lock (300 x 300): a bar of four lettered rings under a shackle; open lifts the shackle */
const drawLock = (p: Pen, code: string, open: boolean) => {
  const sy = open ? -46 : 0;
  // the shackle: a thick arc from the left end into the right end (raised and swung clear when open)
  p.arc(150, 120 + sy, 78, 74, 180, 360, 34, "#241726");
  p.arc(150, 120 + sy, 78, 74, 180, 360, 20, "#b8b2a6");
  p.line([[72, 120 + sy], [72, 160]], "#b8b2a6", 20);
  if (!open) p.line([[228, 120], [228, 160]], "#b8b2a6", 20);
  else p.line([[228, 74], [228, 112]], "#b8b2a6", 20);
  // the body: two end caps and four rings between them
  p.poly([[30, 150], [62, 150], [62, 262], [30, 262]], BRASS_D, 7);
  p.poly([[238, 150], [270, 150], [270, 262], [238, 262]], BRASS_D, 7);
  for (let k = 0; k < 4; k++) {
    const x0 = 62 + k * 44;
    p.poly([[x0, 144], [x0 + 44, 144], [x0 + 44, 268], [x0, 268]], k % 2 ? BRASS : "#dcb658", 6);
    p.stroke([[x0 + 6, 160], [x0 + 38, 160]], 3, BRASS_D); p.stroke([[x0 + 6, 252], [x0 + 38, 252]], 3, BRASS_D);
    const g = p.g; g.font = "bold 46px Georgia, serif"; g.fillStyle = "#3a2410"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(code[k], x0 + 22, 208);
  }
};
const lockCard = (out: Stage, code: string, open: boolean, x: number, y: number, z: number, s: number) => {
  if (s > 0.004) out.fx.push({ key: `lock${code}${open ? 1 : 0}`, cw: 300, ch: 300, draw: (p) => drawLock(p, code, open), x, y, z, w: 0.3 * s, h: 0.3 * s });
};
/** a coin (128 x 128): gold or silver, a cross stamped on it */
const drawCoin = (p: Pen, gold: boolean) => {
  p.ell(64, 64, 52, 52, gold ? "#e2b84a" : "#cfd3d8", 7);
  p.ell(64, 64, 36, 36, null, 4);
  p.stroke([[64, 40], [64, 88]], 6, gold ? "#9a7428" : "#7f8790"); p.stroke([[40, 64], [88, 64]], 6, gold ? "#9a7428" : "#7f8790");
};
/** the metal detector (160 x 400): the grip and armrest at the top, the shaft, the search coil at the bottom */
const drawDetector = (p: Pen) => {
  p.line([[80, 30], [80, 330]], "#3a3640", 12);
  p.poly([[62, 20], [98, 20], [98, 60], [62, 60]], "#2a2628", 6);
  p.poly([[66, 90], [94, 90], [94, 130], [66, 130]], "#d8342c", 5); // the control box
  p.ell(80, 360, 68, 22, "#2a2628", 8);
  p.ell(80, 360, 40, 11, "#5a5660", 0);
};
/** a scan screen (400 x 240): 0 = a failed grey blur, 1 = the X-ray of the rings, their notches lined up (glow 0..1) */
const drawScreen = (p: Pen, kind: number, glow: number) => {
  p.poly([[0, 0], [400, 0], [400, 240], [0, 240]], kind ? "#14304a" : "#7a8088", 0);
  const g = p.g;
  if (!kind) {
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${150 + i * 9},${150 + i * 9},${155 + i * 9},0.5)`; g.fillRect(20 + ((i * 53) % 330), 30 + ((i * 37) % 170), 90, 36); }
    return;
  }
  g.strokeStyle = "#cfe8ff"; g.lineWidth = 5;
  g.strokeRect(60, 80, 280, 110);
  for (let k = 0; k < 4; k++) {
    const x = 95 + k * 70;
    g.beginPath(); g.ellipse(x, 135, 26, 48, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#cfe8ff"; g.fillRect(x - 6, 82, 12, 22); // the notch, all on one line
  }
  if (glow > 0.01) { g.strokeStyle = `rgba(255,214,90,${glow.toFixed(3)})`; g.lineWidth = 8; g.beginPath(); g.moveTo(40, 93); g.lineTo(360, 93); g.stroke(); }
  g.beginPath(); g.arc(200, 60, 40, Math.PI, 0); g.stroke(); // the shackle
};
/** a big red X (200 x 200) */
const drawX = (p: Pen) => { p.stroke([[30, 30], [170, 170]], 30, "#d8342c"); p.stroke([[170, 30], [30, 170]], 30, "#d8342c"); };
/** a yellow screen letter (140 x 160) */
const drawLetter = (p: Pen, ch: string) => {
  const g = p.g; g.font = "bold 130px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 14; g.strokeStyle = "#241726"; g.strokeText(ch, 70, 86); g.fillStyle = "#ffd65a"; g.fillText(ch, 70, 86);
};
/** a paper tag (300 x 150) with a number on it */
const drawTag = (p: Pen, txt: string, col = "#2a5a32") => {
  p.poly([[14, 20], [286, 12], [290, 136], [10, 140]], PAPER, 8);
  const g = p.g; g.font = "bold 84px Georgia, serif"; g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 150, 80);
};
/** a green tick (160 x 160) */
const drawTick = (p: Pen) => { p.line([[30, 90], [66, 128], [134, 34]], "#4caf50", 22); };
/** a question bubble (200 x 240) */
const drawQuestion = (p: Pen) => {
  p.ell(100, 100, 86, 86, "#ffffff", 8);
  const g = p.g; g.font = "bold 130px Georgia, serif"; g.fillStyle = "#7a3a5a"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 100, 108);
  p.ell(60, 200, 16, 16, "#ffffff", 6); p.ell(40, 228, 9, 9, "#ffffff", 5);
};
/** a soft brush (120 x 300) */
const drawBrush = (p: Pen) => { p.line([[60, 20], [60, 200]], "#b07a44", 16); p.poly([[38, 196], [82, 196], [92, 290], [28, 290]], "#e8dcc0", 6); };
/** a name tag (240 x 160) and a key (240 x 120) */
const drawNameTag = (p: Pen) => {
  p.poly([[10, 10], [230, 10], [230, 150], [10, 150]], "#d8342c", 7);
  p.poly([[22, 56], [218, 56], [218, 138], [22, 138]], "#ffffff", 0);
  const g = p.g; g.font = "bold 64px Georgia, serif"; g.fillStyle = "#241726"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ANCE", 120, 98);
};
const drawKey = (p: Pen) => {
  p.ell(50, 60, 38, 38, BRASS, 8); p.ell(50, 60, 14, 14, "#fff7e0", 5);
  p.poly([[86, 50], [226, 50], [226, 70], [86, 70]], BRASS, 7);
  p.poly([[180, 70], [196, 70], [196, 98], [180, 98]], BRASS, 6); p.poly([[206, 70], [222, 70], [222, 90], [206, 90]], BRASS, 6);
};
/** the big code card over the sea (420 x 200) */
const drawCode = (p: Pen) => {
  p.poly([[10, 16], [410, 8], [412, 190], [8, 194]], PAPER, 9);
  const g = p.g; g.font = "bold 120px Georgia, serif"; g.fillStyle = "#3a2410"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ANCE?", 210, 104);
};
/** a glow ring (256 x 256), s 0..1 */
const drawRing = (p: Pen, s: number) => { p.arc(128, 128, 96 + 10 * s, 116 + 10 * s, 0, 360, 6 + 8 * s, "#ffd56a"); };

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** someone walking along (dx, dz): side or front view picked from the camera; 48 poses per step cycle, so even a slow
 *  walk changes pose every frame instead of jumping every few frames */
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, phase: number, expr: Expr,
  so: SideOpts = {}, y = D0) => {
  const v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "march", phase: q(phase, 48), expr, blink: lidAt(t, i) }, { mode: "march", phase: q(phase, 48), expr, blink: lidAt(t, i), stride: Math.max(0.3, v.fs) * 0.6, ...so }, 1));
  blob(out, x, y, z, 1);
};
/** a card that grows in from t0 over d seconds (scale 0 -> 1, the drawing never changes, so no frame jumps) */
const grow = (t: number, t0: number, d = 0.25) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false, rot = 0) => {
  if (w > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft, rot });
};
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);
/** the time of the kick frame for a word at T (story.ts KICKS: floor((T - 2 / 30) * 30)) */
const kickT = (T: number) => Math.floor((T - 2 / 30) * 30 + 1e-6) / 30;
/** a burst of light from t0 (0.5 s), soft; it starts on t0 exactly (a kick frame or a word) */
const burst = (out: Stage, t: number, t0: number, x: number, y: number, z: number, s: number) => {
  const u = (t - t0 + 1e-6) / 0.5;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 15), k = 1 - smooth((u - 0.55) / 0.45); // shrinks away at the end (never vanishes at full size)
  card(out, `burst${uq}`, 500, 500, (pn) => fxBurst(pn, uq), x, y, z, s * k, s * k, true);
};

// ---------------- the places ----------------
const museumSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [tx, , tz] = TABLE, fy = D0 + 0.08, open = lockOpen(id, t);
  if (id === 1 || id === 11) {
    const ly = D0 + 0.86 + 0.15, lz = tz - 0.1;
    const tOpen = id === 1 ? T_CLICKED : T_OPENED;
    const happy = t >= tOpen - 0.07;
    let ce: Expr = "nervous", ke: Expr = "stern";
    if (id === 1 && t >= T_PADLOCK - 0.07) ce = "stern";
    if (happy) { ce = "laugh"; ke = "grin"; }
    if (id === 1 && t >= T_NOBODY - 0.07) { ce = "grin"; ke = "smile"; }
    if (id === 11 && !happy && t >= T_SET - 0.07) ke = "smile";
    front(cam, t, out, 20, CURATOR, "cur", tx - 0.42, fy, tz - 0.8, ce, happy ? { wave: wave(t, 0, 6) } : {});
    front(cam, t, out, 21, CONSERV, "con", tx + 0.44, fy, tz - 0.85, ke, id === 11 && !happy ? { wave: 0.45 } : {});
    if (id === 11) front(cam, t, out, 22, ENGINEER, "eng", tx + 1.45, fy, tz - 0.25, happy ? "laugh" : "smile");
    lockCard(out, "ANCE", open, tx, ly, lz, 1);
    if (id === 11 && t >= T_CLEANED - 0.07 && t < T_OPENED - 0.1) { // the brush sweeping over the rings
      const u = grow(t, T_CLEANED, 0.2) * (1 - smooth((t - T_OPENED + 0.4) / 0.25));
      card(out, "brush", 120, 300, drawBrush, tx + 0.12 + 0.05 * Math.sin(t * 14), ly + 0.12, lz + 0.06, 0.1 * u, 0.25 * u, false, 0.5 + 0.25 * Math.sin(t * 14));
    }
    burst(out, t, tOpen - 2 / 30, tx, ly + 0.05, lz - 0.02, 0.45);
    return;
  }
  const [cx, , cz] = CASE;
  lockCard(out, "ANCE", true, cx, D0 + 1.2, cz, 0.9);
  if (id === 12) {
    const glad = t >= T_PERFECT - 0.07;
    front(cam, t, out, 60, KIDA, "kidA", cx - 0.85, fy, cz + 0.7, glad ? "grin" : "shock", { wave: wave(t, 1, 6) }); // waving the whole shot: an arm raised mid-shot jumps
    front(cam, t, out, 61, KIDB, "kidB", cx + 0.75, fy, cz + 0.75, glad ? "laugh" : "smile");
    front(cam, t, out, 62, townsfolk(1), "tf1", cx - 1.5, fy, cz - 0.15, "smile");
    front(cam, t, out, 63, townsfolk(4), "tf4", cx + 1.35, fy, cz - 0.05, glad ? "grin" : "smile");
    front(cam, t, out, 20, CURATOR, "cur", cx + 0.25, fy, cz - 1.0, "smile_closed");
    return;
  }
  // id 13: the finder beside the case: like opening the Ark
  const ark = t >= kickT(T_ARK) - 1e-6; // on the kick frame (planned); the hand is up the whole shot (an arm raised mid-shot jumps)
  front(cam, t, out, 1, FINDER, "finder", cx - 0.5, fy, cz + 0.95, ark ? "laugh" : t >= T_FOUND - 0.07 ? "grin" : "smile", { wave: ark ? wave(t, 0, 5) : 0.55 });
  front(cam, t, out, 20, CURATOR, "cur", cx + 0.65, fy, cz - 0.55, ark ? "grin" : "smile");
  burst(out, t, kickT(T_ARK), cx, D0 + 1.3, cz + 0.05, 1.1); // starts on the kick frame (planned)
};

const stormSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id !== 3) return;
  // the coins on the wet sand, sinking one after another
  const cs: [number, number, boolean][] = [[-0.5, -2.2, true], [0.0, -2.6, false], [0.45, -2.0, true], [0.85, -2.9, false], [-0.2, -3.3, true], [0.35, -3.6, false], [-0.75, -2.9, false]];
  cs.forEach(([x, z, gold], i) => {
    const sink = smooth((t - T_SANK - i * 0.09) / 0.55);
    const s = 1 - sink, glint = 0.85 + 0.15 * smooth((t - T_COINS + 0.07) / 0.25);
    if (s > 0.01) card(out, gold ? "coinG" : "coinS", 128, 128, (p) => drawCoin(p, gold), x, D0 + 0.06 - 0.05 * sink, z, 0.13 * s * glint, 0.13 * s * glint);
  });
};

const beachSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 4) { // sweeping along the beach; the detector beeps over treasure
    const x = finderX(t), z = -1.0, found = t >= T_TREASURE - 0.07;
    walker(cam, t, out, 1, FINDER, "finder", x, z, 1, 0, (t - 16) * 0.55, found ? "grin" : t >= T_DETECTOR - 0.07 ? "smile" : "neutral");
    card(out, "detector", 160, 400, drawDetector, x + 0.45, D0 + 0.5, z + 0.2, 0.32, 0.8, false, -0.35 + 0.18 * Math.sin(t * 2.2));
    const u = grow(t, T_TREASURE, 0.3);
    if (u > 0) card(out, "coinG", 128, 128, (p) => drawCoin(p, true), x + 0.8, D0 + 0.2 + 0.25 * u, z + 0.3, 0.16 * u, 0.16 * u);
    burst(out, t, kickT(T_TREASURE), x + 0.8, D0 + 0.35, z + 0.28, 0.7); // starts on the kick frame (planned)
    void T_STRIPPED;
    return;
  }
  if (id === 5 || id === 6) { // 1999: he holds up the little brass lock
    const has = grow(t, id === 5 ? T_LOCK : -1, 0.3);
    let e: Expr = "neutral";
    if (t >= T_DUG - 0.07) e = "shock";
    if (t >= T_LOCK - 0.07) e = "grin";
    if (id === 6) e = t >= T_ONE - 0.07 ? "pained" : "dazed";
    front(cam, t, out, 1, FINDER, "finder", 0, D0, -1.0, e, { wave: 0.62 }); // the hand is up the whole shot (an arm raised mid-shot would jump)
    lockCard(out, "BRLT", false, id === 5 ? 0.4 : 0.32, D0 + (id === 5 ? 1.36 : 1.24), -0.62, has);
    if (id === 5) {
      const rs = q(smooth((t - T_RINGS + 0.07) / 0.3), 6);
      if (rs > 0) card(out, `ring${rs}`, 256, 256, (p) => drawRing(p, rs), 0.4, D0 + 1.34, -0.6, 0.42 * rs, 0.32 * rs, true); // grows from nothing
    } else {
      const u = grow(t, T_THOUSAND, 0.3), v = grow(t, T_ONE, 0.25);
      card(out, "tag1296", 300, 150, (p) => drawTag(p, "1,296"), 0.36, D0 + 1.5, -0.5, 0.24 * u, 0.12 * u);
      card(out, "tick", 160, 160, drawTick, 0.18, D0 + 1.1, -0.5, 0.09 * v, 0.09 * v);
    }
    return;
  }
  if (id === 7) { // twenty years: sitting on the sand at sunset, turning the rings
    front(cam, t, out, 1, FINDER, "finder", 2.8, D0, 4.6, t >= T_NOBODY2 - 0.07 ? "pained" : "nervous", { mode: "sit", headTilt: -6 });
    lockCard(out, "QRTB", false, 2.98, D0 + 0.66, 4.82, 0.7);
    const u = grow(t, T_NOBODY2, 0.3);
    card(out, "question", 200, 240, drawQuestion, 3.15, D0 + 1.55, 4.7, 0.3 * u, 0.36 * u);
    return;
  }
  // id 14 (golden): the finder and the curator at the water's edge; the code over the sea, a name? a password?
  const ask = t >= T_TELL - 0.07;
  front(cam, t, out, 1, FINDER, "finder", 0.0, D0, -1.7, t >= T_KNOWS - 0.07 ? (ask ? "smile" : "dazed") : "smile_closed");
  front(cam, t, out, 20, CURATOR, "cur", 1.05, D0, -1.35, t >= T_OWNER - 0.07 ? (ask ? "grin" : "nervous") : "smile");
  const u = grow(t, T_KNOWS, 0.35), a = grow(t, T_NAME, 0.3), b = grow(t, T_PASSWORD, 0.3);
  card(out, "codeCard", 420, 200, drawCode, 0.2, D0 + 3.3, -6.5, 2.1 * u, 1.0 * u);
  card(out, "nameTag", 240, 160, drawNameTag, -1.35, D0 + 2.15, -5.5, 0.9 * a, 0.6 * a);
  card(out, "key", 240, 120, drawKey, 1.9, D0 + 2.2, -5.5, 0.95 * b, 0.48 * b);
};

const labSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const fy = D0 + 0.08, [sx, , sz] = SCAN, [dx, , dz] = DESK;
  if (id === 8) {
    const into = t >= T_SCANNER - 0.07;
    // arms stay as they are the whole shot (an arm raised or dropped mid-shot jumps)
    front(cam, t, out, 22, ENGINEER, "eng", sx - 0.95, fy, sz + 1.25, t >= T_LAB - 0.07 ? (into ? "grin" : "smile") : "neutral");
    front(cam, t, out, 20, CURATOR, "cur", sx - 2.1, fy, sz + 1.55, "smile", { wave: 0.45 });
    // the lock: in the curator's hand, then carried to the cabinet window, then in
    const m = smooth((t - T_PUT + 0.07) / 0.6), k = 1 - smooth((t - T_SCANNER - 0.25) / 0.3);
    const x = sx - 1.75 + (1.75 - 0.0) * m, y = D0 + 1.12 + 0.18 * m, z = sz + 1.75 - 1.0 * m;
    lockCard(out, "BRLT", false, x, y, z, 0.8 * k);
    const rs = q(smooth((t - T_SCANNER - 0.5) / 0.4), 6);
    if (rs > 0) card(out, `ring${rs}`, 256, 256, (p) => drawRing(p, rs), sx, D0 + 1.27, sz + 0.74, 0.6 * rs, 0.48 * rs, true); // grows from nothing
    return;
  }
  // the screen: on the monitor face
  const SX = dx, SY = D0 + 1.21, SZ = dz - 0.14, W = 0.82, H = 0.48; // 5 cm off the monitor: a billboard turned toward the lens must not dip behind it
  const third = grow(t, id === 10 ? -1 : T_THIRD, 0.25);
  card(out, "scan0", 400, 240, (p) => drawScreen(p, 0, 0), SX, SY, SZ, W, H);
  const xs = grow(t, T_FAILED, 0.2) * (1 - smooth((t - T_THIRD + 0.2) / 0.2));
  if (id === 9) card(out, "redX", 200, 200, drawX, SX, SY, SZ + 0.02, 0.3 * xs, 0.3 * xs);
  const gl = q(smooth((t - T_LINED + 0.07) / 0.3), 6);
  card(out, `scan1${gl}`, 400, 240, (p) => drawScreen(p, 1, gl), SX, SY, SZ + 0.01, W * third, H * third);
  if (id === 9) {
    front(cam, t, out, 22, ENGINEER, "eng", dx - 0.55, fy, dz + 0.55, t >= T_THIRD - 0.07 ? "grin" : t >= T_FAILED - 0.07 ? "pained" : "stern");
    return;
  }
  // id 10: the letters, one by one
  ([[T_A, "A"], [T_N, "N"], [T_C, "C"], [T_E, "E"]] as [number, string][]).forEach(([t0, ch], i) => {
    const u = grow(t, t0, 0.18);
    card(out, `let${ch}`, 140, 160, (p) => drawLetter(p, ch), SX - 0.215 + i * 0.1435, SY - 0.02, SZ + 0.03, 0.13 * u, 0.15 * u);
  });
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "museum") museumSet(id, t, cam, out);
  else if (s.scene === "storm") stormSet(id, t, cam, out);
  else if (s.scene === "beach") beachSet(id, t, cam, out);
  else labSet(id, t, cam, out);
  void LAB;
  return out;
};
