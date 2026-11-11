// The cast and hand-drawn props of the submarine story: Wilhelm Bauer (navy coat, peaked cap), his helpers Witt (the
// big, strong one) and Thomsen, the people of Kiel on the quay, two rowers; the treadwheels that drive the propeller,
// the pump, jets of sea spraying through the seams, the crack in the hull, bubbles, mud puffs, fish, grappling hooks,
// the pressure arrows (the sea pushing in, the squeezed air pushing back) and Bauer's freezer-door thought.
// Every prop is an unlit ink-outlined drawing.
import { Pen, townsfolk, SKINS, Outfit, Expr, FrontOpts, SideOpts, fxBurst, fxPuff, fxSplash } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import {
  D0, SHOTS, SEA_Y, BED_Y, DIVE, WRECK, BAUER_Q, CUT, FLOOR_Y, HATCH_X, WITT_X, THOMSEN_X, BAUER_X, MEN_Z, PLINTH,
  T_DIVE, T_TIP, T_SLID, T_CRUSH, T_SNAP, T_HIT, T_RISE0, T_RISE1, T_FLEW, Scene, V3, subAt, cutAt, smooth, clamp01,
} from "./story";

export const BAUER: Outfit = { jacket: "#2f3f63", pants: "#3a3530", boots: "#2b2220", hat: "cap", cap: "#27324d", buttons: "#d9b45a", moustache: "#5a3b2a", skin: SKINS[1] };
const WITT: Outfit = { jacket: "#8a5a35", pants: "#4a4038", boots: "#2b2220", hat: "hair", hair: "#7a4a2a", build: "stout", skin: SKINS[0] };
const THOMSEN: Outfit = { jacket: "#4f6e3c", pants: "#3b3f52", boots: "#2b2220", hat: "hair", hair: "#d7b46a", skin: SKINS[2] };
const ROWER: Outfit = { jacket: "#9a4436", pants: "#3b3f52", boots: "#2b2220", hat: "cap", cap: "#3a3f52", skin: SKINS[3] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const LEAD = 2 / 30;
const INKC = "#241726";

// ---------------- drawings ----------------
/** a treadwheel (500 x 500): rim, six thin spokes, hub; ang in radians; broken = one side of the rim snapped open */
const drawWheel = (p: Pen, ang: number, broken: boolean) => {
  p.rot = [ang, 250, 250];
  const pts: [number, number][] = [];
  const a0 = broken ? 0.5 : 0, a1 = broken ? Math.PI * 2 - 0.5 : Math.PI * 2;
  for (let i = 0; i <= 40; i++) { const a = a0 + ((a1 - a0) * i) / 40; pts.push([250 + 232 * Math.cos(a), 250 + 232 * Math.sin(a)]); }
  p.line(pts, "#a87a46", 22);
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    if (broken && k === 0) { p.line([[250, 250], [250 + 150 * Math.cos(a + 0.3), 250 + 150 * Math.sin(a + 0.3)]], "#a87a46", 9); continue; }
    p.line([[250, 250], [250 + 225 * Math.cos(a), 250 + 225 * Math.sin(a)]], "#a87a46", 9);
  }
  p.ell(250, 250, 26, 26, "#5b4030", 6);
  p.rot = null;
  if (broken) for (const [x, y] of [[470, 150], [488, 330]] as const) p.poly([[x - 14, y - 6], [x + 10, y - 16], [x + 14, y + 8], [x - 8, y + 14]], "#a87a46", 5);
};
/** a jet of sea spraying from a seam (300 x 160), pointing right; t animates the droplets */
const drawJet = (p: Pen, t: number) => {
  for (const [dy, w] of [[-16, 12], [0, 18], [16, 12]] as const) p.line([[14, 80], [110, 74 + dy * 0.6], [220, 80 + dy * 1.6 + 18], [280, 96 + dy * 2.2 + 34]], "#bfe6ec", w);
  for (let i = 0; i < 6; i++) { const x = 150 + ((i * 47 + t * 400) % 130), y = 70 + ((i * 37) % 60) + (x - 150) * 0.35; p.ell(x, y, 8, 8, "#dff4f4", 4); }
};
/** a dent and crack in the iron (300 x 300) */
const drawCrack = (p: Pen) => {
  p.ell(150, 150, 110, 76, "rgba(30,36,42,0.3)", 0);
  p.stroke([[60, 120], [110, 150], [96, 180], [150, 168], [188, 210], [214, 176], [252, 190]], 10, INKC);
  p.stroke([[150, 168], [160, 110], [196, 96]], 8, INKC);
};
/** a cluster of bubbles (240 x 360); seed shuffles them */
const drawBubbles = (p: Pen, seed: number) => {
  for (let i = 0; i < 9; i++) {
    const a = Math.sin(seed * 12.9 + i * 78.2) * 43758.5, u = a - Math.floor(a), b = Math.sin(seed * 4.1 + i * 19.3) * 9631.7, v = b - Math.floor(b);
    const r = 12 + 26 * u;
    p.ell(40 + 160 * v, 330 - i * 36, r, r, "rgba(205,240,238,0.55)", 5);
    p.ell(40 + 160 * v - r * 0.35, 330 - i * 36 - r * 0.35, r * 0.22, r * 0.22, "#f2fbfa", 0);
  }
};
/** one big air bubble (400 x 400) with a wobbling rim */
const drawBigBubble = (p: Pen, w: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2, r = 180 + 12 * Math.sin(a * 3 + w) + 8 * Math.sin(a * 5 - w); pts.push([200 + r * Math.cos(a), 200 + r * 0.86 * Math.sin(a)]); }
  p.poly(pts, "rgba(214,244,240,0.45)", 8);
  p.ell(140, 140, 40, 28, "rgba(250,255,255,0.8)", 0);
};
/** a small fish (200 x 120), facing right */
const drawFish = (p: Pen, col: string) => {
  p.poly([[20, 30], [60, 60], [20, 90]], col, 6);
  p.ell(110, 60, 64, 34, col, 6);
  p.ell(146, 52, 6, 6, INKC, 0);
};
/** a grappling hook on its chain (120 x 800) */
const drawHook = (p: Pen) => {
  for (let y = 10; y < 600; y += 44) p.ell(60, y + 20, 14, 26, null, 7);
  p.line([[60, 610], [60, 700]], "#4a4f55", 18);
  p.poly([[60, 700], [10, 660], [4, 690], [50, 745], [70, 745], [116, 690], [110, 660]], "#4a4f55", 7);
};
/** a fat arrow (160 x 360) pointing down; col = fill */
const drawArrow = (p: Pen, col: string) => {
  p.poly([[50, 10], [110, 10], [110, 220], [150, 220], [80, 350], [10, 220], [50, 220]], col, 9);
};
/** a thought bubble (460 x 420) with a freezer: a hand tugs the handle, but the door stays shut */
const drawFreezer = (p: Pen, tug: number) => {
  p.ell(230, 175, 210, 165, "#fbf7ee", 9); p.ell(120, 360, 26, 20, "#fbf7ee", 6); p.ell(80, 400, 15, 12, "#fbf7ee", 5);
  p.poly([[130, 60], [330, 60], [330, 300], [130, 300]], "#e9eef2", 8);
  p.stroke([[130, 130], [330, 130]], 6, INKC);
  p.poly([[300, 150], [316, 150], [316, 240], [300, 240]], "#9aa4ad", 5);
  const hx = 330 + 30 * tug;
  p.line([[316, 195], [hx + 40, 200]], SKINS[1], 26);
  p.poly([[hx + 34, 170], [hx + 110, 176], [hx + 112, 228], [hx + 34, 230]], "#2f3f63", 6);
  for (let i = 0; i < 3; i++) p.arc(150 + 60 * i, 210, 18, 12, 200, 340, 5, "#7fa9c6");
  if (tug > 0.3) for (const y of [150, 250]) p.stroke([[350, y], [380, y + (y < 200 ? -18 : 18)]], 6, INKC);
};
/** a wall of the hull lamp (90 x 140): a small oil lamp hanging */
const drawLamp = (p: Pen) => {
  p.stroke([[45, 4], [45, 40]], 5, INKC);
  p.poly([[25, 40], [65, 40], [70, 110], [20, 110]], "#ffd36a", 6);
  p.poly([[18, 110], [72, 110], [64, 132], [26, 132]], "#5b4030", 5);
};

/** the two rowing boats near the spot where the men come up, u 0..1 how far they have pulled in */
export const boatAt = (k: number, u: number): [number, number] => k ? [DIVE[0] + 0.6, DIVE[2] - 4.6 + 2.0 * u] : [DIVE[0] + 4.4 - 2.0 * u, DIVE[2] - 1.2];

// ---------------- staging ----------------
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, sc = 1, extra: FrontOpts = {}, shadow = true) => {
  out.places.push(person(cam, { i, o, okey } as Who, x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, sc));
  if (shadow) blob(out, x, y, z, sc);
};
const side = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, so: SideOpts, mirror = false) => {
  out.places.push(person(cam, { i, o, okey } as Who, x, y, z, { side: true, mirror }, {}, { blink: lidAt(t, i), ...so }));
};
/** a point in the cut-open hull (local x, y from the axis, z) in world space, with the hull's tilt */
const inHull = (x: number, y: number, z: number, tilt: number): V3 => {
  const c = Math.cos(tilt), s = Math.sin(tilt);
  return [CUT[0] + x * c - y * s, CUT[1] + x * s + y * c, CUT[2] + z];
};
const FY = FLOOR_Y - CUT[1];
const bubbles = (out: Stage, key: string, x: number, y: number, z: number, t: number, sc = 1, n = 3) => {
  for (let k = 0; k < n; k++) {
    const rise = ((t * 0.9 + k * 0.37) % 1), seed = (Math.floor(t * 0.9 + k * 0.37) * 7 + k) % 5;
    const g = Math.sin(Math.PI * rise); // grows from nothing and shrinks away, so the loop never pops
    if (g < 0.05) continue;
    out.fx.push({ key: `bub${seed}`, cw: 240, ch: 360, draw: (p) => drawBubbles(p, seed), x: x + 0.3 * (k - 1) * sc, y: y + rise * 3.2 * sc, z, w: 0.8 * sc * g, h: 1.2 * sc * g, soft: true });
  }
  void key;
};

/** the men inside the cut-open hull */
const insideSet = (id: number, t: number, cam: CamInfo, out: Stage, f: number) => {
  const ct = cutAt(id, t), tl = ct.tilt;
  const at = (x: number, z = MEN_Z) => inHull(x, FY, z, tl);
  const lampP = inHull(-0.6, 1.05, -1.05, tl);
  out.fx.push({ key: "lamp", cw: 90, ch: 140, draw: drawLamp, x: lampP[0], y: lampP[1], z: lampP[2], w: 0.22, h: 0.34 });
  const wheel = (x: number, ang: number, broken = false) => {
    const a = q(((ang % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3), 48 / Math.PI);
    const [wx, wy, wz] = inHull(x, FY + 1.0, MEN_Z + 0.32, tl);
    out.fx.push({ key: `wheel${broken ? "b" : a}`, cw: 500, ch: 500, draw: (p) => drawWheel(p, broken ? 0.4 : a, broken), x: wx, y: wy, z: wz, w: 2.0, h: 2.0 });
  };
  const jets = (n: number, k: number) => {
    const spots: [number, number][] = [[-2.9, 0.9], [-1.2, 1.15], [0.7, -0.55], [2.2, 0.95]];
    for (let i = 0; i < n; i++) {
      const [x, y] = spots[i], [jx, jy, jz] = inHull(x, y, -1.0, tl), ph = q((t * 2 + i * 0.3) % 1, 6);
      out.fx.push({ key: `jet${ph}`, cw: 300, ch: 160, draw: (p) => drawJet(p, ph), x: jx + 0.3, y: jy, z: jz, w: 0.75 * k, h: 0.4 * k, rot: -0.2 - 0.2 * (i % 2) });
    }
  };
  const walk = (t2: number) => q((t2 * 1.4) % 1, 24);
  if (id === 1) { // the hook: sea spraying in
    jets(3, 1);
    front(cam, t, out, 1, BAUER, "bauer", ...at(BAUER_X - 0.3), "shock");
    front(cam, t, out, 2, WITT, "witt", ...at(WITT_X), "nervous");
    front(cam, t, out, 3, THOMSEN, "thom", ...at(THOMSEN_X + 0.4), "shock");
  } else if (id === 3) { // the treadwheels
    wheel(WITT_X, -t * 1.3); wheel(THOMSEN_X, -t * 1.3 + 0.4);
    side(cam, t, out, 2, WITT, "witt", ...at(WITT_X), { mode: "march", phase: walk(t), expr: t < 12.0 ? "grin" : "smile" });
    side(cam, t, out, 3, THOMSEN, "thom", ...at(THOMSEN_X), { mode: "march", phase: walk(t + 0.3), expr: t < 12.2 ? "smile" : "grin" });
    front(cam, t, out, 1, BAUER, "bauer", ...at(BAUER_X + 0.3), t < 13.2 ? "smile" : "grin");
  } else if (id === 5) { // the tilt: everyone staggers; the ballast slides
    const k = smooth((t - (T_SLID - 1.6)) / 1.0);
    wheel(WITT_X, -t * 1.3 * (1 - k)); wheel(THOMSEN_X, -t * 1.3 * (1 - k) + 0.4);
    side(cam, t, out, 2, WITT, "witt", ...at(WITT_X), { mode: k > 0.4 ? "stand" : "march", phase: walk(t), expr: k > 0.3 ? "shock" : "smile" });
    side(cam, t, out, 3, THOMSEN, "thom", ...at(THOMSEN_X), { mode: k > 0.4 ? "stand" : "march", phase: walk(t + 0.3), expr: k > 0.3 ? "shock" : "neutral" });
    front(cam, t, out, 1, BAUER, "bauer", ...at(BAUER_X - 0.2 * k), t < T_SLID - LEAD ? "nervous" : "shock", 1, k > 0.5 ? { mode: "fall" } : {});
  } else if (id === 6) { // the drive wheel snaps
    const snap = f >= 752; // the kick frame of "snapped"
    wheel(WITT_X, 0.5, snap);
    front(cam, t, out, 2, WITT, "witt", ...at(WITT_X), snap ? "dazed" : "shock", 1, snap ? { mode: "fall" } : {});
    if (snap && t < T_SNAP + 0.5) { const [x, y, z] = inHull(WITT_X + 0.9, FY + 1.1, MEN_Z + 0.5, tl), u = q(clamp01((t - T_SNAP) / 0.5), 12); out.fx.push({ key: `snap${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u), x, y, z, w: 1.0 * (1 - u * u), h: 1.0 * (1 - u * u) }); }
  } else if (id === 7) { // water through the seams
    jets(4, 0.9 + 0.2 * smooth((t - 29.4) / 0.6));
    wheel(WITT_X, 0.5, true);
    front(cam, t, out, 2, WITT, "witt", ...at(WITT_X + 0.3), "nervous");
    front(cam, t, out, 3, THOMSEN, "thom", ...at(THOMSEN_X + 0.2), "shock");
    front(cam, t, out, 1, BAUER, "bauer", ...at(BAUER_X), "stern");
  } else if (id === 8) { // pumping, plugging, the hatch that will not budge
    jets(2, 0.8);
    side(cam, t, out, 3, THOMSEN, "thom", ...at(-2.75), { mode: "push", pose: q(0.5 + 0.5 * Math.sin(t * 7), 8), expr: "pained" }, true);
    front(cam, t, out, 2, WITT, "witt", ...at(-0.9), "nervous", 1, { wave: q(0.5 + 0.5 * Math.sin(t * 3), 6) });
    const budge = t >= 33.7 - LEAD;
    front(cam, t, out, 1, BAUER, "bauer", ...at(HATCH_X - 0.1), budge ? "stern" : "pained", 1, { mode: "fall" });
  } else if (id === 9) { // stop: let the water in
    front(cam, t, out, 1, BAUER, "bauer", ...at(BAUER_X), t < 35.3 - LEAD ? "stern" : "neutral", 1, { wave: q(0.5 + 0.5 * Math.sin(t * 5), 6) });
    front(cam, t, out, 2, WITT, "witt", ...at(-0.15), t < 36.25 ? "nervous" : "shock");
    front(cam, t, out, 3, THOMSEN, "thom", ...at(-0.85), t < 36.3 ? "neutral" : "shock");
  } else if (id === 10) { // the freezer thought
    front(cam, t, out, 1, BAUER, "bauer", ...at(BAUER_X - 0.4), t < 40.5 ? "neutral" : "smile");
    front(cam, t, out, 2, WITT, "witt", ...at(-0.9), "nervous");
    const tug = q(0.5 + 0.5 * Math.sin(t * 6), 6), [bx, by, bz] = inHull(BAUER_X - 0.05, FY + 2.15, MEN_Z + 0.25, tl);
    out.fx.push({ key: `freezer${tug}`, cw: 460, ch: 420, draw: (p) => drawFreezer(p, tug), x: bx, y: by, z: bz, w: 1.05, h: 0.96 });
  } else if (id === 11) { // the water rises; the air pushes back
    const k = smooth((t - T_RISE0) / (T_RISE1 - T_RISE0));
    front(cam, t, out, 1, BAUER, "bauer", ...at(BAUER_X), t < 45.3 ? "neutral" : "smile");
    front(cam, t, out, 2, WITT, "witt", ...at(0.15), t < 45.6 ? "nervous" : "relief");
    front(cam, t, out, 3, THOMSEN, "thom", ...at(-0.75), t < 45.8 ? "nervous" : "relief_open");
    for (let i = 0; i < 3; i++) { // the sea, pushing down on the hull from outside
      const [x, y, z] = inHull(-1.6 + 1.6 * i, 2.15, 0.2, tl);
      out.fx.push({ key: "arrowSea", cw: 160, ch: 360, draw: (p) => drawArrow(p, "#3a7fc4"), x, y, z, w: 0.36, h: 0.8 });
    }
    const ak = q(0.25 + 0.75 * k, 12);
    for (let i = 0; i < 2; i++) { // the trapped air, squeezed, pushing back
      const [x, y, z] = inHull(-0.8 + 1.6 * i, 1.0, 0.3, tl);
      out.fx.push({ key: `arrowAir${ak}`, cw: 160, ch: 360, draw: (p) => drawArrow(p, "#f4e7b0"), x, y, z, w: 0.36 * ak, h: 0.8 * ak, rot: Math.PI });
    }
  } else if (id === 12) { // hours in the dark
    front(cam, t, out, 1, BAUER, "bauer", ...at(1.75), "neutral");
    front(cam, t, out, 2, WITT, "witt", ...at(1.0), "nervous");
    front(cam, t, out, 3, THOMSEN, "thom", ...at(0.4), t < 48.9 ? "dazed" : "nervous");
  } else if (id === 13) { // the strongest man under the hatch: it flies open
    const open = f >= 1626; // the kick frame of "flew"
    front(cam, t, out, 2, WITT, "witt", ...at(HATCH_X), open ? "shock" : "pained", 1, { mode: "fall", headTilt: open ? 0 : 0.15 });
    front(cam, t, out, 1, BAUER, "bauer", ...at(HATCH_X - 0.75), open ? "shock" : "nervous");
    front(cam, t, out, 3, THOMSEN, "thom", ...at(HATCH_X - 1.45), open ? "shock" : "nervous");
    if (open && t < T_FLEW + 0.6) { const [x, y, z] = inHull(HATCH_X, 1.9, 0.2, tl), u = q(clamp01((t - T_FLEW) / 0.6), 12); out.fx.push({ key: `burst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#e8fbf8"), x, y, z, w: 1.6 * (1 - u * u), h: 1.6 * (1 - u * u) }); }
  }
  void f;
};

/** under the sea: bubbles, puffs, the crack, the hooks, the arrows, the men rising, fish */
const underSet = (id: number, t: number, cam: CamInfo, out: Stage, f: number) => {
  const sp = subAt(id, t), [sx, sy, sz] = sp.p;
  const towerTop = (): V3 => [sx + 1.5 * Math.cos(sp.pitch) - 1.85 * Math.sin(sp.pitch), sy + 1.5 * Math.sin(sp.pitch) + 1.85 * Math.cos(sp.pitch), sz];
  const puff = (t0: number) => {
    if (t < t0 || t > t0 + 1.2) return;
    const u = q((t - t0) / 1.2, 24);
    for (const dx of [-3, 0, 3]) out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: sx + dx, y: BED_Y + 0.35, z: sz + 1.3, w: 1.9, h: 1.9, soft: true });
  };
  if (id === 1) { bubbles(out, "b1", sx + 1.5, sy + 1.6, sz + 0.3, t, 1.2); puff(3.75); }
  else if (id === 5 || id === 6) {
    bubbles(out, "b5", sx - 2.5, sy + 1.0, sz + 0.4, t, 1.1);
    if (id === 6 && f >= Math.floor(T_CRUSH * 30 + 1e-6)) { // on the kick frame
      out.fx.push({ key: "crack", cw: 300, ch: 300, draw: drawCrack, x: sx - 0.6, y: sy + 0.1, z: sz + 1.08, w: 1.1, h: 1.1 });
      bubbles(out, "b6", sx - 0.6, sy + 0.3, sz + 1.3, t, 0.9, 4);
    }
  } else if (id === 7) { puff(T_HIT); if (f >= Math.floor(T_HIT * 30 + 1e-6)) bubbles(out, "b7", sx - 1, sy + 1, sz + 1.2, t, 1.0, 2); }
  else if (id === 10) { // the sea squeezing the hatch shut
    const [hx, hy, hz] = towerTop(), pulse = q(0.5 + 0.5 * Math.sin(t * 6), 4);
    for (const [dx, dz] of [[-0.75, 0.5], [0, 0.6], [0.75, 0.5]] as const)
      out.fx.push({ key: "arrowSea", cw: 160, ch: 360, draw: (p) => drawArrow(p, "#3a7fc4"), x: hx + dx, y: hy + 1.0 - 0.12 * pulse, z: hz + dz, w: 0.42, h: 0.95 });
  } else if (id === 12) { // grappling hooks drag across the hull
    for (let k = 0; k < 2; k++) {
      const x = sx - 2.6 + 1.5 * (t - 49.4) + 1.9 * k, y = sy + 1.5 + 3.4 + 0.15 * Math.sin(t * 3 + k);
      out.fx.push({ key: "hook", cw: 120, ch: 800, draw: drawHook, x, y, z: sz + 0.4 + 0.5 * k, w: 0.5, h: 3.4, rot: 0.15 * Math.sin(t * 1.6 + k) });
    }
  } else if (id === 14) { // the air bursts out and carries the three men up
    const [hx, hy, hz] = towerTop(), u = clamp01((t - 55.1) / 2.45), lift = 12 * u * u + 3 * u;
    const w = q((t * 4) % (Math.PI * 2), 4);
    out.fx.push({ key: `big${w}`, cw: 400, ch: 400, draw: (p) => drawBigBubble(p, w), x: hx, y: hy + 1.6 + lift, z: hz + 0.6, w: 3.4, h: 3.0, soft: true });
    const men: [number, Outfit, string, number][] = [[2, WITT, "witt", 0.2], [1, BAUER, "bauer", -0.9], [3, THOMSEN, "thom", 1.0]];
    men.forEach(([i, o, k, dx], n) => front(cam, t, out, i, o, k, hx + dx, hy + 0.6 + lift - 0.7 * n, hz + 0.9, n === 0 ? "shock" : "nervous", 1, { mode: "fall" }, false));
    bubbles(out, "b14", hx, hy + lift, hz + 0.5, t, 1.6, 4);
  } else if (id === 15) {
    for (let k = 0; k < 3; k++) {
      const x = WRECK[0] - 6 + ((t * 0.8 + k * 3.1) % 12), col = ["#e0a040", "#d77a3a", "#c9b45a"][k];
      out.fx.push({ key: `fish${k}`, cw: 200, ch: 120, draw: (p) => drawFish(p, col), x, y: BED_Y + 2.4 + 0.8 * k, z: WRECK[2] + 2.2 + k, w: 0.55, h: 0.33 });
    }
  }
};

/** on the quay and the harbour surface */
const quaySet = (id: number, t: number, cam: CamInfo, out: Stage, f: number) => {
  if (id === 1) { // the tower slips under: bubbles boil up
    const u = q(0.5 + 0.5 * Math.sin(t * 5), 8);
    out.fx.push({ key: `spl${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, 0.2 + 0.2 * u), x: DIVE[0] + 0.5, y: SEA_Y + 0.9, z: DIVE[2], w: 3.4, h: 3.4 });
  } else if (id === 2) {
    if (f < 268) {
      front(cam, t, out, 1, BAUER, "bauer", ...BAUER_Q, t < 7.3 ? "smile" : "grin");
      front(cam, t, out, 20, FOLK[0], "f0", -4.2, D0, 1.0, "smile");
      front(cam, t, out, 21, FOLK[1], "f1", -5.4, D0, -1.2, "neutral");
      front(cam, t, out, 22, FOLK[2], "f2", -3.0, D0, -3.6, "smile");
    }
  } else if (id === 4) { // the town watches the dive
    const gone = t > T_DIVE + 0.2;
    // along the line from the lens to the dive, on the quay: [distance from the lens, sideways, outfit]
    const crowd: [number, number, number][] = [[6.6, -1.05, 0], [7.0, 0.35, 1], [7.5, -0.35, 2], [7.8, 1.1, 3], [6.9, 1.6, 4]];
    crowd.forEach(([d, l, k]) => { const x = -9 + 0.91 * d - 0.414 * l, z = -9 + 0.414 * d + 0.91 * l; front(cam, t, out, 20 + k, FOLK[k], `f${k}`, x, D0, z, gone ? (k % 2 ? "shock" : "nervous") : (k % 3 ? "smile" : "grin")); });
    if (t > T_DIVE - 0.2) { const u = q(clamp01((t - T_DIVE + 0.2) / 1.2), 12); out.fx.push({ key: `spl${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, u), x: DIVE[0] + 0.5, y: SEA_Y + 1.0, z: DIVE[2], w: 4.2, h: 4.2 }); }
  } else if (id === 14) { // three heads come up; the boats pull them in
    const u = clamp01((t - 57.55) / 0.5), y = SEA_Y - 1.75 + 0.55 * u + 0.05 * Math.sin(t * 3);
    const heads: [number, Outfit, string, number, number][] = [[2, WITT, "witt", -0.8, 0.4], [1, BAUER, "bauer", 0.4, -0.6], [3, THOMSEN, "thom", 1.4, 0.9]];
    heads.forEach(([i, o, k, dx, dz]) => front(cam, t, out, i, o, k, DIVE[0] + dx, y, DIVE[2] + dz, t < 58.8 ? "relief_open" : "laugh", 1, {}, false));
    const s = q(clamp01((t - 57.5) / 0.9), 12);
    if (s < 1) out.fx.push({ key: `spl${s}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, s), x: DIVE[0] + 0.3, y: SEA_Y + 0.9, z: DIVE[2] + 0.4, w: 4.4, h: 4.4 });
    const bu = Math.min(1, Math.max(0, (t - 57.6) / 1.6));
    for (const k of [0, 1]) {
      const [bx, bz] = boatAt(k, bu);
      out.places.push(person(cam, { i: 40 + k, o: ROWER, okey: "rower" } as Who, bx, SEA_Y + 0.05, bz, { side: false, mirror: false }, { mode: "sit", expr: t < 59.0 ? "stern" : "grin", blink: lidAt(t, 40 + k), wave: k ? q(0.5 + 0.5 * Math.sin(t * 4), 6) : undefined }, {}, 0.95));
    }
  } else if (id === 16) { // today: on show
    const vis: [number, number, number, Expr][] = [[PLINTH[0] + 2.6, PLINTH[2] + 2.3, 0, "smile"], [PLINTH[0] + 0.9, PLINTH[2] + 2.5, 1, "grin"], [PLINTH[0] - 1.6, PLINTH[2] + 2.2, 2, "smile_closed"], [PLINTH[0] + 4.9, PLINTH[2] - 0.6, 3, "laugh"]];
    vis.forEach(([x, z, k, e]) => front(cam, t, out, 20 + k, FOLK[k], `f${k}`, x, D0, z, t > 63.5 && k === 1 ? "laugh" : e));
  }
};

export const stage = (id: number, t: number, cam: CamInfo, where: Scene): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  const f = Math.round(t * 30);
  if (where === "inside") insideSet(id, t, cam, out, f);
  else if (where === "under") underSet(id, t, cam, out, f);
  else quaySet(id, t, cam, out, f);
  void T_TIP; void WRECK; void D0;
  return out;
};
