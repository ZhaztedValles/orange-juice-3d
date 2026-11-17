// The cast and hand-drawn props of the Suez lighthouse what-if: the sculptor Bartholdi (navy coat, dark hair and
// moustache), the Khedive (dark blue coat with gold buttons, red cap), sailors, Port Said townsfolk, two kids on the
// quay and the New York crowd; the drawings (the robed Egyptian woman with her torch and a little church for scale, the
// copper lady with her crown and tablet), the money bag with its red cross, the postcards of the giant and the glow
// rings that pair the two drawings. Every prop is an unlit ink-outlined drawing; cards that arrive mid-shot grow in
// over a few frames (never pop).
import { Pen, KID, SKINS, Outfit, Expr, FrontOpts, townsfolk } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import {
  D0, SHOTS, TEMPLE, OFFICE, DESK, EASEL, L, NY, smooth, shipAt,
  T_STOOD, T_DREAM, T_GIANTS, T_DREW, T_CHURCH, T_DRAWINGS, T_NO, T_COST, T_OPENED, T_YES, T_GIANT, T_BLAZING,
  T_PICTURE, T_NEVER, T_KEPT, T_NOTHING, T_SISTERS, T_LIT, T_HARBOR, T_WELCOME,
} from "./story";

const BART: Outfit = { jacket: "#2e3a52", pants: "#3a3a44", boots: "#2a2220", hat: "hair", hair: "#3a2a20", moustache: "#3a2a20", skin: SKINS[0] };
const KHEDIVE: Outfit = { jacket: "#1f2c4e", pants: "#2a2e3e", boots: "#1e1a1c", hat: "cap", cap: "#b8302c", moustache: "#2a201a", buttons: "#d9b45a", skin: SKINS[2], build: "stout" };
const SAILORS: Outfit[] = [
  { jacket: "#2e4a7a", pants: "#e8e4da", boots: "#2a2220", hat: "cap", cap: "#2a2e3e", moustache: "#5a3a22", skin: SKINS[1] },
  { jacket: "#e8e4da", pants: "#2e3a52", boots: "#2a2220", hat: "cap", cap: "#2e4a7a", skin: SKINS[3] },
  { jacket: "#3a5a8a", pants: "#d8d2c4", boots: "#2a2220", hat: "hair", hair: "#6a4a2c", moustache: "#6a4a2c", skin: SKINS[0] },
];
const LOCALS: Outfit[] = [
  { jacket: "#e8dcc4", pants: "#c9b48a", boots: "#5a3b2a", hat: "cap", cap: "#b8302c", skin: SKINS[2] },
  { jacket: "#4a6a8a", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#f2ede0", moustache: "#2a201a", skin: SKINS[3] },
  { jacket: "#8a5a3a", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#b8302c", moustache: "#2a201a", skin: SKINS[2] },
];
const KIDA: Outfit = { ...KID, jacket: "#d9a441", cap: "#b8302c", skin: SKINS[2] };
const KIDB: Outfit = { ...KID, jacket: "#5a8fc2", hat: "hair", hair: "#2a1a14", skin: SKINS[3] };
const INKC = "#241726";
const SEPIA = "#6a4428";

// ---------------- drawings ----------------
/** a drawing on cream paper (300 x 400): the robed woman with her raised torch; liberty adds the crown and tablet,
 *  church 0..1 brings in a little church beside her for scale */
const drawSketch = (p: Pen, liberty: boolean, church: number) => {
  p.poly([[10, 14], [290, 8], [292, 390], [8, 392]], "#f6ecd2", 8);
  const g = p.g, cx = liberty ? 150 : 128;
  // the robe and the head
  p.poly([[cx - 52, 360], [cx + 52, 360], [cx + 30, 210], [cx + 34, 160], [cx - 34, 160], [cx - 30, 210]], liberty ? "#9fc6b4" : "#e9d3a4", 5);
  p.line([[cx - 14, 350], [cx - 10, 200]], SEPIA, 3, false); p.line([[cx + 14, 350], [cx + 12, 200]], SEPIA, 3, false);
  p.ell(cx, 140, 20, 23, liberty ? "#9fc6b4" : "#d9a77a", 5);
  if (liberty) for (let k = 0; k < 7; k++) { const a = -1.2 + (k * 2.4) / 6; p.line([[cx + Math.sin(a) * 20, 126 - Math.cos(a) * 12], [cx + Math.sin(a) * 40, 118 - Math.cos(a) * 30]], SEPIA, 4, false); }
  else { p.poly([[cx - 24, 132], [cx, 110], [cx + 24, 132], [cx + 26, 172], [cx + 16, 172], [cx + 14, 140], [cx - 14, 140], [cx - 16, 172], [cx - 26, 172]], "#e9d3a4", 4); p.line([[cx - 22, 130], [cx + 22, 130]], "#2f6a8a", 4, false); }
  // the raised arm and the torch with its flame
  p.line([[cx + 30, 172], [cx + 46, 70]], SEPIA, 9, false);
  p.poly([[cx + 38, 72], [cx + 54, 72], [cx + 50, 52], [cx + 42, 52]], SEPIA, 3);
  p.poly([[cx + 46, 14], [cx + 58, 42], [cx + 46, 54], [cx + 34, 42]], "#f2a03a", 4);
  if (liberty) p.poly([[cx - 52, 230], [cx - 30, 222], [cx - 26, 280], [cx - 48, 286]], "#9fc6b4", 4); // the tablet
  // the pedestal
  p.poly([[cx - 64, 360], [cx + 64, 360], [cx + 64, 384], [cx - 64, 384]], "#d8ccb4", 4);
  if (church > 0.02) { // a little church at the same height
    g.save(); g.globalAlpha = church;
    p.poly([[222, 384], [278, 384], [278, 250], [222, 250]], "#efe6d2", 4);
    p.poly([[232, 250], [268, 250], [250, 140]], "#c9944e", 4);
    p.poly([[244, 384], [256, 384], [256, 352], [244, 352]], SEPIA, 2);
    p.line([[250, 140], [250, 112]], SEPIA, 3, false); p.line([[240, 122], [260, 122]], SEPIA, 3, false);
    g.restore();
  }
};
/** a money bag (240 x 260) with a dollar sign; x 0..1 draws a red cross over it */
const drawMoney = (p: Pen, x: number) => {
  p.poly([[96, 60], [144, 60], [204, 150], [196, 236], [44, 236], [36, 150]], "#c9b48a", 9);
  p.line([[92, 66], [148, 66]], "#6a4224", 10, false);
  p.poly([[100, 20], [140, 20], [146, 58], [94, 58]], "#c9b48a", 8);
  const g = p.g; g.font = "bold 110px Georgia, serif"; g.fillStyle = "#2a5a32"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", 120, 160);
  if (x > 0.02) { const Lx = 90 * x; p.stroke([[120 - Lx, 140 - Lx], [120 + Lx, 140 + Lx]], 22, "#d8342c"); p.stroke([[120 + Lx, 140 - Lx], [120 - Lx, 140 + Lx]], 22, "#d8342c"); }
};
/** a postcard (240 x 170): the giant at the harbour mouth, a sunset sky */
const drawCard = (p: Pen) => {
  p.poly([[8, 10], [232, 6], [234, 162], [6, 164]], "#f6ecd2", 7);
  p.poly([[24, 24], [216, 22], [216, 118], [24, 120]], "#f6c27a", 0);
  p.poly([[24, 100], [216, 98], [216, 120], [24, 120]], "#3a6a9a", 0);
  p.poly([[112, 102], [132, 102], [128, 56], [116, 56]], "#e9d3a4", 3);
  p.ell(122, 48, 7, 8, "#d9a77a", 3);
  p.line([[128, 60], [138, 30]], SEPIA, 4, false);
  p.ell(139, 26, 5, 6, "#fff2b0", 2);
  for (let k = 0; k < 4; k++) p.line([[40, 136 + k * 6], [140 - k * 18, 136 + k * 6]], "#9a8a7a", 2, false);
};
/** a glow ring (256 x 256), s 0..1 */
const drawRing = (p: Pen, s: number) => { p.arc(128, 128, 96 + 10 * s, 116 + 10 * s, 0, 360, 6 + 8 * s, "#ffd56a"); };

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, 1));
  if (shadow) blob(out, x, y, z, o.build === "kid" ? 0.8 : 1);
};
/** a card that grows in from t0 over d seconds (scale 0 -> 1, the drawing never changes, so no frame jumps) */
const grow = (t: number, t0: number, d = 0.25) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number) => {
  if (w > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h });
};
const sketch = (out: Stage, liberty: boolean, church: number, x: number, y: number, z: number, s = 1) => {
  const cq = q(church, 8);
  card(out, `sk${liberty ? "L" : "E"}${cq}`, 300, 400, (p) => drawSketch(p, liberty, cq), x, y, z, 0.78 * s, 1.04 * s);
};
const wave = (t: number, k = 0, sp = 6) => q(0.55 + 0.35 * Math.sin(t * sp + k), 6);

// ---------------- the places ----------------
const harbourSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 1) { // two kids on the quay, the giant behind
    front(cam, t, out, 60, KIDA, "kidA", -9.7, D0 + 0.06, 4.8, t < 1.4 ? "smile" : "shock", t >= 1.4 ? { wave: wave(t) } : {});
    front(cam, t, out, 61, KIDB, "kidB", -8.3, D0 + 0.06, 4.1, t < 1.0 ? "smile" : "laugh");
    return;
  }
  if (id === 6) { // 1869: the crowd on the quay cheering the opening, the plain lighthouse behind
    const cheer = t >= T_OPENED - 0.07;
    const crowd: [Outfit, string, number, number][] = [
      [LOCALS[0], "loc0", -2.6, 4.2], [townsfolk(0), "tf0", -0.9, 3.4], [LOCALS[1], "loc1", 0.8, 4.4], [townsfolk(1), "tf1", 2.4, 3.6],
      [LOCALS[2], "loc2", 4.0, 4.6], [townsfolk(2), "tf2", -4.2, 3.2], [townsfolk(3), "tf3", 5.6, 3.3],
    ];
    crowd.forEach(([o, k, x, z], i) => front(cam, t, out, 70 + i, o, k, x, D0 + 0.06, z, cheer ? (i % 2 ? "laugh" : "grin") : "smile", cheer && i % 2 === 0 ? { wave: wave(t, i, 7) } : {}));
    return;
  }
  if (id === 9) { // sailors on the quay with her picture
    const xs = [L[0] - 2.4, L[0] - 0.7, L[0] + 1.0];
    xs.forEach((x, i) => {
      const z = 7.4 + (i % 2) * 0.5;
      front(cam, t, out, 80 + i, SAILORS[i], `sail${i}`, x, D0 + 0.06, z, t < T_PICTURE - 0.07 ? "smile" : i === 1 ? "laugh" : "grin", { wave: 0.35 });
      const u = grow(t, T_PICTURE + i * 0.15, 0.3);
      card(out, "postcard", 240, 170, drawCard, x + 0.36, D0 + 1.12, z + 0.12, 0.42 * u, 0.3 * u);
    });
    return;
  }
  void id;
};

const templeSet = (t: number, cam: CamInfo, out: Stage) => {
  const [tx, , tz] = TEMPLE;
  let ex: Expr = "smile";
  if (t >= T_STOOD - 0.07) ex = "shock";
  if (t >= T_DREAM - 0.07) ex = "dazed";
  if (t >= T_GIANTS - 0.07) ex = "grin";
  front(cam, t, out, 1, BART, "bart", tx + 1.0, D0, tz + 8.6, ex);
  front(cam, t, out, 62, LOCALS[1], "guide", tx + 3.2, D0, tz + 9.4, t < T_DREAM - 0.07 ? "smile" : "smile_closed");
};

const studioSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [ex, , ez] = EASEL, fy = D0 + 0.08;
  if (id === 3) { // Bartholdi draws the robed woman; the church beside her for scale
    const u = grow(t, T_DREW, 0.3), ch = smooth((t - T_CHURCH + 0.07) / 0.35);
    if (u > 0.01) sketch(out, false, ch, ex, D0 + 1.28 + 0.5 * u, ez + 0.2, u);
    front(cam, t, out, 1, BART, "bart", ex - 1.0, fy, ez + 0.55, t < T_DREW - 0.07 ? "stern" : t < T_CHURCH - 0.07 ? "smile" : "grin", { wave: 0.55 });
    return;
  }
  if (id === 10) { // at ease, the easel empty
    front(cam, t, out, 1, BART, "bart", ex - 1.3, fy, ez + 0.8, t < T_NEVER - 0.07 ? "whistle" : "smile_closed", { mode: "sit" }, false);
    return;
  }
  // id 11: the two drawings on the back wall, Bartholdi in front
  const [ox, , oz] = OFFICE;
  sketch(out, false, 1, ox - 0.35, D0 + 2.15, oz - 3.82, 1.1);
  sketch(out, true, 0, ox + 1.15, D0 + 2.15, oz - 3.82, 1.1);
  const rs = q(smooth((t - T_SISTERS + 0.07) / 0.3), 6);
  if (rs > 0) for (const x of [ox - 0.35, ox + 1.15]) out.fx.push({ key: `ring${rs}`, cw: 256, ch: 256, draw: (p) => drawRing(p, rs), x, y: D0 + 2.15, z: oz - 3.78, w: 1.25 * (0.7 + 0.3 * rs), h: 1.45 * (0.7 + 0.3 * rs), soft: true });
  let e: Expr = "smile";
  if (t >= T_KEPT - 0.07) e = "grin";
  if (t >= T_NOTHING - 0.07) e = "whistle";
  if (t >= T_SISTERS - 0.07) e = "nervous";
  front(cam, t, out, 1, BART, "bart", ox + 0.4, fy, oz - 1.0, e);
};

const palaceSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [dx, , dz] = DESK, fy = D0 + 0.08;
  if (id === 5) {
    front(cam, t, out, 40, KHEDIVE, "khed", dx, fy, dz - 0.8, t < T_DRAWINGS - 0.07 ? "smile" : t < T_NO - 0.07 ? "stern" : "pained");
    front(cam, t, out, 1, BART, "bart", dx - 1.0, fy, dz + 0.95, t < T_NO - 0.07 ? "smile" : "shock", { wave: 0.5 });
    sketch(out, false, 1, dx - 0.55, D0 + 1.3, dz + 1.05, 0.7);
    const u = grow(t, T_COST, 0.3), x = q(smooth((t - T_COST - 0.25) / 0.25), 6);
    card(out, `money${x}`, 240, 260, (p) => drawMoney(p, x), dx + 0.38, D0 + 1.04, dz + 0.05, 0.36 * u, 0.39 * u);
    return;
  }
  // id 7: the Khedive close: what if he said yes
  const yes = t >= T_YES - 0.07;
  front(cam, t, out, 40, KHEDIVE, "khed", dx, fy, dz - 0.8, yes ? "grin" : "stern", yes ? { wave: wave(t, 0, 5) } : {});
};

const deckSet = (t: number, cam: CamInfo, out: Stage) => {
  const p = shipAt(0, 8, t);
  if (!p) return;
  const y = D0 + 2.08, up = t >= T_GIANT - 0.07, blaze = t >= T_BLAZING - 0.07;
  const ps: [number, number][] = [[0.7, 1.4], [-1.0, 0.4], [1.4, -0.9]];
  ps.forEach(([x, z], i) => front(cam, t, out, 80 + i, SAILORS[i], `sail${i}`, p.x + x, y, p.z + z, !up ? "smile" : blaze ? (i === 1 ? "laugh" : "grin") : "shock", up ? { wave: wave(t, i, 6) } : {}));
};

const nySet = (t: number, cam: CamInfo, out: Stage) => {
  const p = shipAt(0, 12, t);
  if (!p) return;
  const y = D0 + 2.08, cheer = t >= T_LIT - 0.07, wel = t >= T_WELCOME - 0.07;
  const ps: [number, number][] = [[-0.9, -2.6], [0.6, -3.1], [1.5, -1.9], [-0.2, -1.6], [-1.6, -2.1]];
  ps.forEach(([x, z], i) => front(cam, t, out, 90 + i, townsfolk(i + 1), `ny${i}`, p.x + x, y, p.z + z, !cheer ? "smile" : wel ? "smile_closed" : i % 2 ? "laugh" : "grin",
    cheer && t >= T_HARBOR - 0.07 && i % 2 === 0 ? { wave: wave(t, i, 6) } : {}));
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.scene === "harbour") harbourSet(id, t, cam, out);
  else if (s.scene === "temple") templeSet(t, cam, out);
  else if (s.scene === "studio") studioSet(id, t, cam, out);
  else if (s.scene === "palace") palaceSet(id, t, cam, out);
  else if (s.scene === "deck") deckSet(t, cam, out);
  else nySet(t, cam, out);
  void NY; void INKC;
  return out;
};
