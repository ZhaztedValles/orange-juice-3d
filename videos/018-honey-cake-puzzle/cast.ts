// The cast and hand-drawn props of the honey cake puzzle (all invented): Mrs Plum the baker (pink dress, white apron),
// Constable Pike (dark blue coat, top hat), the suspects Otto the ferryman (blue jacket, cap, an oar), Greta the
// painter (cream smock, her picture) and Felix the clockmaker (brown waistcoat; a bee follows him: the bonus clue),
// townsfolk and rowers. The drawn props: the three prize bakes, the empty plate and the crumbs, the clock's rings,
// the question marks, the constable's bubble, Otto's race bubble and Greta's painting. Every prop is an unlit
// ink-outlined drawing; cards that arrive mid-shot grow in slowly (never pop) or arrive on a cut frame.
import { Pen, SKINS, Outfit, Expr, FrontOpts, townsfolk, fxBurst, fxRing } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, SILL_Y, BAKE_Z, BAKE_X, CLOCK, SUS, RIVER_X0, smooth, fr, cakeThere, F_WHOLE,
  T_TWO, T_BAKER, T_PROUD, T_CHERRY, T_TART, T_HONEY, T_RANG, T_EMPTY, T_BACK, T_QUIET, T_NOBODY, T_STOPPED, T_WHERE, T_RANTOO,
  T_ROWING, T_ANYONE, T_LAST, T_HELD, T_BRIDGE2, T_WET, T_YAWNED, T_ASLEEP, T_HONEY2, T_SMILED, T_WALKED, T_WHO, T_TELL,
} from "./story";

const PLUM: Outfit = { jacket: "#c25a7a", dress: "#f4f0e6", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#8a5a3a", build: "stout", skin: SKINS[0] };
const PIKE: Outfit = { jacket: "#26305a", pants: "#22263a", boots: "#1e1a1e", hat: "tophat", buttons: "#e8c45a", belt: "#1e1a1e", moustache: "#3a2a20", skin: SKINS[1] };
const OTTO: Outfit = { jacket: "#3f6fb5", pants: "#4a4038", boots: "#3a2a20", hat: "cap", cap: "#2a3550", belt: "#5a3b2a", moustache: "#8a5a3a", skin: SKINS[2] };
const GRETA: Outfit = { jacket: "#e9dfc6", dress: "#5d7a3a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#b5653f", skin: SKINS[1] };
const FELIX: Outfit = { jacket: "#7a5236", pants: "#3a3530", boots: "#2a1e18", hat: "hair", hair: "#3a2a20", buttons: "#d9b46a", moustache: "#3a2a20", skin: SKINS[3] };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);
const KIDS: Outfit[] = [
  { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#4a3426", hat: "cap", cap: "#e2453c", build: "kid", skin: SKINS[0] },
  { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#e0b04a", build: "kid", skin: SKINS[2] },
];
const INKC = "#241726";
const PLATE = "#f4f1ea";

// ---------------- drawings ----------------
/** a cherry pie (240 x 160): lattice crust, cherries peeking */
const drawPie = (p: Pen) => {
  p.ell(120, 124, 112, 28, PLATE, 6);
  p.ell(120, 98, 92, 40, "#d9a441", 7);
  for (let k = 0; k < 4; k++) p.line([[54 + k * 38, 74], [78 + k * 38, 124]], "#b07a2a", 6, false);
  for (const [x, y] of [[82, 92], [124, 104], [160, 88]] as const) p.dot(x, y, 9, "#b8263a");
};
/** a plum tart (240 x 160): purple plum halves in a ring */
const drawTart = (p: Pen) => {
  p.ell(120, 126, 112, 26, PLATE, 6);
  p.ell(120, 104, 94, 30, "#e2b062", 7);
  for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; p.ell(120 + Math.cos(a) * 58, 102 + Math.sin(a) * 16, 16, 10, "#6a2a6a", 4); }
  p.ell(120, 102, 16, 10, "#6a2a6a", 4);
};
/** the giant honey cake (220 x 260): three golden tiers, honey drips, a honey-pot top */
const drawCake = (p: Pen) => {
  p.ell(110, 238, 104, 18, PLATE, 6);
  p.poly([[20, 232], [200, 232], [196, 160], [24, 160]], "#e0a93e", 7);
  p.poly([[40, 160], [180, 160], [176, 98], [44, 98]], "#e8b84e", 7);
  p.poly([[62, 98], [158, 98], [154, 46], [66, 46]], "#f0c460", 7);
  for (const [x, y, l] of [[40, 160, 26], [80, 160, 18], [130, 160, 30], [172, 160, 16], [62, 98, 20], [110, 98, 26], [150, 98, 14], [84, 46, 18], [130, 46, 22]] as const)
    p.line([[x, y], [x, y + l]], "#c27a1e", 9);
  p.ell(110, 40, 24, 14, "#c27a1e", 5);
};
/** the empty plate (240 x 120) with a few crumbs */
const drawEmpty = (p: Pen) => {
  p.ell(120, 78, 108, 30, PLATE, 6); p.ell(120, 74, 70, 16, "#e9e4d8", 0);
  for (const [x, y] of [[90, 72], [132, 80], [150, 68], [104, 84]] as const) p.dot(x, y, 6, "#d09a3e");
};
/** one crumb (64 x 64), drawn flat on the cobbles */
const drawCrumb = (p: Pen) => { p.ell(32, 32, 18, 14, "#e0a93e", 4); };
/** a big red question mark (200 x 300) */
const drawQuestion = (p: Pen) => {
  const g = p.g; g.font = "bold 260px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 16; g.strokeStyle = INKC; g.strokeText("?", 100, 150); g.fillStyle = "#d6453a"; g.fillText("?", 100, 150);
};
/** a speech bubble (360 x 300) holding small pictures */
const bubble = (p: Pen, inner: (p: Pen) => void) => {
  p.ell(180, 130, 164, 116, "#ffffff", 8);
  p.poly([[110, 226], [80, 292], [160, 236]], "#ffffff", 0);
  p.line([[112, 232], [80, 292], [158, 240]], INKC, 0); p.stroke([[112, 234], [80, 292], [156, 242]], 8, INKC);
  inner(p);
};
/** the constable's bubble: the three bakes under a question mark (which one?) */
const drawWhich = (p: Pen) => bubble(p, (pn) => {
  for (const [x, c] of [[90, "#d9a441"], [180, "#6a2a6a"], [270, "#e0a93e"]] as const) { pn.ell(x, 170, 36, 12, PLATE, 4); pn.ell(x, 156, 28, 14, c, 4); }
  const g = pn.g; g.font = "bold 110px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#d6453a"; g.fillText("?", 180, 82);
});
/** Otto's bubble: three rowing boats, his red one far behind */
const drawRace = (p: Pen) => bubble(p, (pn) => {
  pn.line([[30, 150], [330, 150]], "#7fb6d8", 30, false);
  for (const [x, c] of [[250, "#3f6fb5"], [190, "#e0b04a"], [70, "#b8463c"]] as const) { pn.poly([[x - 38, 132], [x + 38, 132], [x + 26, 150], [x - 26, 150]], c, 5); pn.dot(x, 116, 12, INKC); }
});
/** Greta's painting (320 x 260): a framed picture of the bridge and the boats */
const drawPainting = (p: Pen) => {
  p.poly([[8, 8], [312, 8], [312, 252], [8, 252]], "#9a6a3a", 7);
  p.poly([[28, 28], [292, 28], [292, 232], [28, 232]], "#bcd6ee", 4);
  p.poly([[28, 160], [292, 160], [292, 232], [28, 232]], "#5f9ec8", 0);
  p.poly([[28, 132], [292, 132], [292, 150], [28, 150]], "#c9bda6", 4);
  for (const x of [100, 220]) p.poly([[x - 10, 150], [x + 10, 150], [x + 10, 175], [x - 10, 175]], "#c9bda6", 3);
  for (const [x, y, c] of [[70, 200, "#b8463c"], [170, 214, "#3f6fb5"], [250, 196, "#e0b04a"]] as const) p.poly([[x - 26, y], [x + 26, y], [x + 18, y + 10], [x - 18, y + 10]], c, 3);
};
/** Otto's oar (60 x 320) */
const drawOar = (p: Pen) => { p.line([[30, 20], [30, 250]], "#b08050", 12); p.poly([[14, 230], [46, 230], [42, 312], [18, 312]], "#b08050", 6); };
/** a bee (90 x 70), wings up or down */
const drawBee = (up: number) => (p: Pen) => {
  p.ell(36, up ? 18 : 26, 16, 12, "#ffffff", 4); p.ell(56, up ? 18 : 26, 16, 12, "#ffffff", 4);
  p.ell(46, 44, 26, 16, "#f2c230", 5);
  p.line([[40, 30], [40, 58]], INKC, 6, false); p.line([[54, 30], [54, 58]], INKC, 6, false);
  p.dot(70, 40, 4, INKC);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, expr: Expr, extra: FrontOpts = {}, y = D0 + 0.04, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** someone walking along (dx, dz) at their current spot */
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, z: number, dx: number, dz: number, expr: Expr) => {
  const ph = q(t * 1.0 + i * 0.37, 48), v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, D0 + 0.04, z, { side: v.side, mirror: v.mirror },
    { mode: "stroll", phase: ph, expr, blink: lidAt(t, i) }, { mode: "march", phase: ph, expr, blink: lidAt(t, i), stride: 0.875 * Math.max(0.3, v.fs) }, 1));
  blob(out, x, D0 + 0.04, z, o.build === "kid" ? 0.8 : 1);
};
const grow = (t: number, t0: number, d = 0.8) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
};
/** a glow burst from t0 (0.5 s) that shrinks away */
const burst = (out: Stage, t: number, t0: number, x: number, y: number, z: number, s: number) => {
  const u = (t - t0 + 1e-6) / 0.5;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 15), k = smooth(u / 0.15) * (1 - smooth((u - 0.55) / 0.45));
  card(out, `burst${uq}`, 500, 500, (pn) => fxBurst(pn, uq), x, y, z, s * k, s * k, true);
};
const at = (t: number, t0: number) => t >= t0 - 0.07;

/** the shop window: the pie, the tart, and the honey cake or its empty plate */
const windowSill = (out: Stage, cake: boolean) => {
  card(out, "pie", 240, 160, drawPie, BAKE_X[0], SILL_Y + 0.2, BAKE_Z, 0.6, 0.4);
  card(out, "tart", 240, 160, drawTart, BAKE_X[1], SILL_Y + 0.2, BAKE_Z, 0.6, 0.4);
  if (cake) card(out, "cake", 220, 260, drawCake, BAKE_X[2], SILL_Y + 0.33, BAKE_Z, 0.55, 0.65);
  else card(out, "empty", 240, 120, drawEmpty, BAKE_X[2], SILL_Y + 0.13, BAKE_Z, 0.6, 0.3);
};
/** the crumb trail from the window down the street (east) */
const crumbs = (out: Stage) => {
  for (let k = 0; k < 18; k++) {
    const u = k / 17, x = 0.5 + u * 6.5, z = -3.0 + u * 2.6 + 0.25 * Math.sin(k * 1.9);
    out.fx.push({ key: "crumb", cw: 64, ch: 64, draw: drawCrumb, x, y: D0 + 0.06, z, w: 0.3, h: 0.24, flat: true, rot: k * 0.7 });
  }
};
/** the bee round Felix's head */
const bee = (out: Stage, t: number, x: number, z: number, r = 0.42) => {
  const a = t * 2.4, up = Math.floor(t * 30) % 2;
  card(out, `bee${up}`, 90, 70, drawBee(up), x + r * Math.cos(a), D0 + 1.72 + 0.12 * Math.sin(a * 1.7), z + 0.25 + 0.15 * Math.sin(a), 0.16, 0.124);
};
/** the three suspects where the constable stopped them; Otto's oar, Greta's painting under her arm, Felix's bee */
const suspects = (cam: CamInfo, t: number, out: Stage, ex: [Expr, Expr, Expr], wv: [number, number, number] = [0, 0, 0]) => {
  const O: Outfit[] = [OTTO, GRETA, FELIX], K = ["otto", "greta", "felix"];
  SUS.forEach(([x, z], j) => front(cam, t, out, 3 + j, O[j], K[j], x, z, ex[j], wv[j] ? { wave: wv[j] } : {}));
  card(out, "oar", 60, 320, drawOar, SUS[0][0] - 0.42, D0 + 1.0, SUS[0][1] + 0.05, 0.17, 0.92);
  bee(out, t, SUS[2][0], SUS[2][1]);
};

// ---------------- the shots ----------------
const street = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const f = Math.round(t * 30);
  if (id === 1) { // the hook: the window after the theft; a question over the empty plate
    windowSill(out, false);
    const g = grow(t, T_TWO - 0.3, 0.6);
    card(out, "question", 200, 300, drawQuestion, BAKE_X[2] - 0.2, SILL_Y + 0.85, BAKE_Z + 0.1, 0.36 * g, 0.54 * g);
    return;
  }
  if (id === 2) { // fair day on the street; Mrs Plum proud by her window
    windowSill(out, true);
    const spots: [number, number, number][] = [[-8, 1.5, 0], [-6.6, 2.4, 1], [-4.4, 0.6, 2], [3.6, 1.8, 3], [5.0, 0.9, 4], [7.5, 2.6, 5], [10.5, 1.0, 6], [12, 2.2, 7]];
    spots.forEach(([x, z, k]) => front(cam, t, out, 20 + k, FOLK[k], `f${k}`, x, z, k % 2 ? "smile" : "grin", k === 3 ? { wave: 0.6 } : {}));
    front(cam, t, out, 40, KIDS[0], "k0", -2.6, 2.0, "laugh");
    front(cam, t, out, 41, KIDS[1], "k1", 6.3, 3.2, "grin");
    front(cam, t, out, 1, PLUM, "plum", 0.9, -2.6, at(t, T_PROUD) ? "grin" : at(t, T_BAKER) ? "smile" : "smile_closed", at(t, T_PROUD) ? { wave: 0.8 } : {});
    return;
  }
  if (id === 3) { // the three prize bakes, each glinting on its word
    windowSill(out, true);
    for (const [j, t0] of [[0, T_CHERRY], [1, T_TART], [2, T_HONEY]] as const) burst(out, t, t0 - 0.05, BAKE_X[j] + 0.18, SILL_Y + (j === 2 ? 0.62 : 0.4), BAKE_Z + 0.08, 0.45);
    return;
  }
  if (id === 4) {
    if (f < F_WHOLE) { // the clock at two; two rings from the bell
      for (let k = 0; k < 2; k++) {
        const u = (t - T_RANG - k * 0.6) / 1.1;
        if (u <= 0 || u >= 1) continue;
        const uq = q(u, 20), s = 2.2 + 3.0 * u;
        card(out, `ring${uq}`, 300, 300, (pn) => fxRing(pn, uq), CLOCK[0] + 0.4, D0 + 18.6, CLOCK[2], s, s, true);
      }
      return;
    }
    // the whole town runs down to the bridge; rowers wait on the river
    for (let k = 0; k < 14; k++) {
      const x0 = 7.0 + (k % 7) * 1.5 + Math.floor(k / 7) * 0.7, z = -1.6 + ((k * 0.53) % 1) * 3.2;
      walker(cam, t, out, 20 + k, k % 7 < 6 ? FOLK[k % 8] : KIDS[k % 2], k % 7 < 6 ? `f${k % 8}` : `k${k % 2}`, x0 + (t - F_WHOLE / 30) * 1.7, z, 1, 0, k % 2 ? "grin" : "laugh");
    }
    for (const [x, z, k] of [[40, -9, 0], [45, -13, 1], [49, -6, 2]] as const)
      front(cam, t, out, 60 + k, k === 0 ? OTTO : FOLK[k + 3], k === 0 ? "otto" : `f${k + 3}`, x, z, "grin", { mode: "sit" }, D0 - 0.85, false);
    for (let k = 0; k < 6; k++) front(cam, t, out, 70 + k, FOLK[(k + 2) % 8], `f${(k + 2) % 8}`, RIVER_X0 + 2 + k * 2.6, -1.8 - (k % 2) * 0.4, "laugh", { wave: 0.5 + 0.4 * Math.sin(t * 7 + k) > 0.6 ? 1 : 0.4 }, D0 + 0.55 + 0.04, true);
    return;
  }
  if (id === 5) { // Mrs Plum runs off too; the window is left open
    windowSill(out, true);
    const t0 = 645 / 30, u = t - T_RANTOO + 0.1;
    if (u > 0) walker(cam, t, out, 1, PLUM, "plum", -0.5 + u * 1.4, -2.1 + u * 0.3, 1, 0.2, "grin");
    else front(cam, t, out, 1, PLUM, "plum", -0.5, -2.1, "smile");
    walker(cam, t, out, 28, FOLK[6], "f6", 2.0 + (t - t0) * 1.8, 1.2, 1, 0, "laugh");
    return;
  }
  if (id === 6) { // back at the window: one plate empty; the crumb trail
    windowSill(out, false);
    crumbs(out);
    front(cam, t, out, 1, PLUM, "plum", 0.9, -2.4, at(t, T_EMPTY) ? "shock" : at(t, T_BACK) ? "neutral" : "smile", at(t, T_EMPTY) ? { wave: 1 } : {});
    burst(out, t, T_EMPTY - 2 / 30, BAKE_X[2], SILL_Y + 0.4, BAKE_Z + 0.1, 0.9);
    return;
  }
  if (id === 7) { // the constable: keep quiet; nobody is told which bake is missing
    windowSill(out, false);
    crumbs(out);
    front(cam, t, out, 2, PIKE, "pike", -2.25, -2.1, at(t, T_NOBODY) ? "smile_closed" : "stern", { headTilt: 4 });
    front(cam, t, out, 1, PLUM, "plum", -0.15, -2.45, at(t, T_QUIET) ? "smile_closed" : "nervous");
    const g = grow(t, T_NOBODY - 0.3, 0.6);
    card(out, "which", 360, 300, drawWhich, -1.2, D0 + 2.65, -1.9, 1.05 * g, 0.875 * g);
    return;
  }
  if (id === 8) { // the constable stops three people
    front(cam, t, out, 2, PIKE, "pike", 4.3, 1.0, "stern", at(t, T_WHERE) ? { wave: 0.7 } : {});
    suspects(cam, t, out, at(t, T_WHERE) ? ["dazed", "nervous", "neutral"] : at(t, T_STOPPED) ? ["smile", "smile_closed", "neutral"] : ["smile", "smile", "neutral"]);
    const g = grow(t, T_WHERE - 0.3, 0.6);
    card(out, "question", 200, 300, drawQuestion, 4.35, D0 + 2.45, 1.1, 0.36 * g, 0.54 * g);
    return;
  }
  if (id === 9) { // Otto: in the race, came last again
    suspects(cam, t, out, [at(t, T_LAST) ? "laugh" : at(t, T_ANYONE) ? "grin" : "smile", "smile_closed", "neutral"], [at(t, T_ANYONE) ? 0.9 : 0, 0, 0]);
    const g = grow(t, T_ROWING - 0.3, 0.6);
    card(out, "race", 360, 300, drawRace, SUS[0][0] + 0.2, D0 + 2.4, SUS[0][1] + 0.3, 0.95 * g, 0.79 * g);
    return;
  }
  if (id === 10) { // Greta holds up her picture of the race
    suspects(cam, t, out, ["smile_closed", at(t, T_WET) ? "grin" : at(t, T_BRIDGE2) ? "smile" : "smile_closed", "neutral"], [0, at(t, T_HELD) ? 0.6 : 0, 0]);
    const g = grow(t, T_HELD - 0.25, 0.5);
    card(out, "painting", 320, 260, drawPainting, SUS[1][0] + 0.05, D0 + 0.85 + 0.25 * g, SUS[1][1] + 0.4, 0.62 * Math.max(g, 0.01), 0.5 * Math.max(g, 0.01));
    return;
  }
  if (id === 11) { // Felix yawns: asleep all afternoon... and he doesn't even like honey cake
    const yawn = t >= T_YAWNED - 0.07 && t < T_ASLEEP - 0.3;
    suspects(cam, t, out, ["smile_closed", "smile_closed", yawn ? "whistle" : at(t, T_HONEY2) ? "smile" : at(t, T_ASLEEP) ? "smile_closed" : "neutral"]);
    return;
  }
  if (id === 12) { // the constable smiles and walks over to them
    const u = Math.max(0, t - T_WALKED + 0.07), w = Math.min(u, 1.6);
    const x = 2.7 + w * 1.5, z = 0.8 - w * 0.55;
    if (u > 0 && u < 1.6) walker(cam, t, out, 2, PIKE, "pike", x, z, 0.94, -0.34, "grin");
    else front(cam, t, out, 2, PIKE, "pike", x, z, at(t, T_SMILED) ? "grin" : "stern");
    suspects(cam, t, out, ["smile_closed", "smile_closed", "smile"]);
    return;
  }
  // id 13 (evening): who was the thief? a question over each of them
  suspects(cam, t, out, at(t, T_TELL) ? ["nervous", "nervous", "nervous"] : ["neutral", "smile_closed", "smile"]);
  SUS.forEach(([x, z], j) => {
    const g = grow(t, T_WHO - 0.3 + j * 0.25, 0.6);
    card(out, `q${j}`, 200, 300, drawQuestion, x, D0 + 2.35, z + 0.1, 0.34 * g, 0.51 * g);
  });
  void fr; void cakeThere;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  setStageLight(cam, SHOTS[id - 1].light);
  street(id, t, cam, out);
  return out;
};
