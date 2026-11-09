// The cast and the hand-drawn props of the fern story: Doctor Ward, the sea captain, townsfolk, the bottle with its fern,
// the dish of soil, the mirror, withered and green pots, glass cases, the captain's letter. Built on the card system
// in src/engine/cards.ts; every prop is an unlit ink-outlined drawing keyed by its quantised state.
import { Pen, townsfolk, KID, SKINS, Outfit, fxPuff, fxStars, Expr, FrontOpts } from "../../src/engine/toon";
import { CamInfo, Stage, Who, hh, q, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import { D0, TABLE, TABLE_H, BOTTLE, BOTTLE_H, GARDEN, MIRROR, STAND, DECK_Y, SHIP_Z, SHOTS, shipX, fernU, POT_T, PUPA_IN, LID_T, DISH_T, V3 } from "./story";

export const WARD: Outfit = { jacket: "#2f5b4a", pants: "#3b3f52", boots: "#2b2220", hat: "hair", hair: "#5a3b2a", skin: SKINS[0] };
export const CAPTAIN: Outfit = { jacket: "#25345e", pants: "#e8e4d8", boots: "#2b2220", hat: "cap", cap: "#1d2a4d", build: "stout", buttons: "#e8c45a", moustache: "#c9c4b4", skin: SKINS[1] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const LEAD = 2 / 30;
const INKC = "#241726";

// ---------------- drawings ----------------
const GREEN = "#43a047", GREEN2 = "#2e7d32", LEAF = "#58b85a";
type BottleState = { soil: number; pupa: number; fern: number; lid: number; cyc: number; ph: number };
/** the sealed bottle on a 400 x 680 canvas: soil, pupa, fern, grass, cork, and the water cycle (steam up, dew on top, drops down) */
const drawBottle = (p: Pen, s: BottleState) => {
  const body: [number, number][] = [[165, 92], [235, 92], [238, 170], [322, 242], [334, 604], [312, 646], [88, 646], [66, 604], [78, 242], [162, 170]];
  p.poly(body, "#d7eef3", 9);
  const floor = 646 - 112 * s.soil, mid = 200;
  if (s.soil > 0) {
    p.clip(body, () => p.poly([[40, floor], [360, floor], [360, 700], [40, 700]], "#6b4a34", 0));
    p.stroke([[72, floor], [330, floor]], 7);
  }
  // pupa: in the soil (buried), or falling in (pupa between 0 and 1 = drop progress)
  const pupaY = s.pupa >= 1 ? floor + 18 : floor - 360 * (1 - s.pupa);
  if (s.pupa > 0) p.ell(mid - 62, pupaY, 24, 15, "#8a5a2b", 6, 0, 360, 0.3);
  // fern: fronds fan out from the soil; their length follows the growth u
  if (s.fern > 0) p.clip(body, () => {
    const u = s.fern, n = 1 + Math.floor(u * 5.99);
    for (let k = 0; k < n; k++) {
      const a = -90 + (n === 1 ? 0 : (k / (n - 1) - 0.5) * 110), len = (60 + 270 * u) * (0.75 + 0.25 * ((k * 7) % 3) / 2) * Math.min(1, u * 3 + 0.2);
      const pts: [number, number][] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, ang = ((a + (t * t * 28 * (k % 2 ? 1 : -1))) * Math.PI) / 180;
        pts.push([mid + 20 + Math.cos(ang) * len * t, floor - 4 + Math.sin(ang) * len * t]);
      }
      p.stroke(pts, 9, INKC); p.stroke(pts, 5, GREEN2);
      const leaves = Math.floor(2 + u * 9);
      for (let i = 1; i <= leaves; i++) {
        const t = i / (leaves + 1), [x, y] = pts[Math.min(10, Math.round(t * 10))], r = (20 + 16 * u) * (1 - t * 0.55);
        p.ell(x - r * 0.5, y, r, r * 0.34, i % 2 ? GREEN : LEAF, 4, 0, 360, -0.5);
        p.ell(x + r * 0.5, y, r, r * 0.34, i % 2 ? LEAF : GREEN, 4, 0, 360, 0.5);
      }
    }
    // grass tuft
    if (u > 0.3) for (let k = 0; k < 6; k++) {
      const h = (50 + 80 * u) * (0.7 + 0.1 * k % 0.5), x = mid - 40 + k * 14;
      p.stroke([[x, floor - 2], [x + (k - 3) * 6, floor - h * 0.5], [x + (k - 3) * 11, floor - h]], 6, "#8bc34a");
    }
  });
  // water cycle: vapour curls rise from the soil, dew gathers on the top glass and runs down the sides
  if (s.cyc > 0) {
    const w = (u: number) => u;
    for (let k = 0; k < 4; k++) {
      const u = (s.ph + k / 4) % 1, x = 120 + k * 52, y = floor - 20 - u * (floor - 210), a = Math.sin(u * Math.PI);
      p.stroke([[x, y + 34], [x + 12, y + 14], [x - 8, y - 6], [x + 6, y - 26]], 8, `rgba(255,255,255,${(0.95 * a).toFixed(2)})`);
      void w(u);
    }
    for (let k = 0; k < 7; k++) p.ell(110 + k * 30, 232 + (k % 2) * 12, 10, 12, "rgba(110,170,230,.95)", 3);
    for (const x of [98, 308]) {
      const u = (s.ph * 1.0 + (x > 200 ? 0.5 : 0)) % 1, y = 250 + u * (floor - 270);
      p.ell(x, y, 9, 13, "rgba(80,140,225,.95)", 3);
      p.stroke([[x, 250], [x, y - 12]], 4, "rgba(120,175,235,.5)");
    }
  }
  p.stroke([[96, 270], [96, 580]], 10, "rgba(255,255,255,.75)"); // glass shine
  if (s.lid > 0) {
    const d = (1 - s.lid) * -70;
    p.poly([[154, 60 + d], [246, 60 + d], [242, 104 + d], [158, 104 + d]], "#c99a5b", 8);
    p.stroke([[170, 72 + d], [230, 72 + d]], 4, "#a47a3d");
  }
};
const bottleFx = (c: BottleState, x: number, y: number, z: number, h = BOTTLE_H) => {
  const k = { soil: q(c.soil, 20), pupa: q(c.pupa, 30), fern: q(c.fern, 60), lid: q(c.lid, 10), cyc: c.cyc ? 1 : 0, ph: q(c.ph, 40) };
  return { key: `bottle|${k.soil}|${k.pupa}|${k.fern}|${k.lid}|${k.cyc}|${k.ph}`, cw: 400, ch: 680, draw: (p: Pen) => drawBottle(p, k), x, y: y + h * 0.5, z, w: (h * 400) / 680, h };
};

const drawDish = (p: Pen, pupaIn: boolean) => {
  p.poly([[20, 100], [280, 100], [250, 190], [50, 190]], "#c4673a", 9);
  p.ell(150, 98, 130, 26, "#6b4a34", 8);
  if (pupaIn) p.ell(170, 82, 26, 16, "#8a5a2b", 6, 0, 360, 0.2);
};
const drawDead = (p: Pen, k: number) => {
  p.poly([[90, 330], [190, 330], [175, 345], [105, 345]], "#4f3825", 6);
  for (let i = 0; i < 5; i++) {
    const a = -90 + (i - 2) * 28 + (k % 3) * 6, len = 150 + ((i * 37 + k * 13) % 80);
    const pts: [number, number][] = [];
    for (let j = 0; j <= 6; j++) { const t = j / 6, ang = ((a + t * 40 * (i % 2 ? 1 : -1)) * Math.PI) / 180; pts.push([140 + Math.cos(ang) * len * t, 330 + Math.sin(ang) * len * t]); }
    p.stroke(pts, 12, INKC); p.stroke(pts, 7, "#d2b062");
    const [x, y] = pts[6];
    p.ell(x, y + 10, 14, 8, "#7a5a2a", 4, 0, 360, 0.8);
  }
};
const drawPot = (p: Pap, alive: boolean, k: number) => {
  p.poly([[40, 140], [160, 140], [145, 250], [55, 250]], "#c4673a", 8);
  p.poly([[34, 130], [166, 130], [166, 148], [34, 148]], "#d97a45", 7);
  if (alive) {
    for (let i = 0; i < 5; i++) {
      const a = -90 + (i - 2) * 30, len = 80 + ((i + k) % 3) * 12, ang = (a * Math.PI) / 180, e: [number, number] = [100 + Math.cos(ang) * len, 132 + Math.sin(ang) * len];
      p.stroke([[100, 132], e], 8, INKC); p.stroke([[100, 132], e], 4, GREEN2);
      p.ell(e[0], e[1], 22, 11, i % 2 ? GREEN : LEAF, 4, 0, 360, a + 90);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * 34, e: [number, number] = [100 + dx, 105 + (i % 2) * 12];
      p.stroke([[100, 132], [100 + dx * 0.4, 112], e], 8, INKC); p.stroke([[100, 132], [100 + dx * 0.4, 112], e], 4, "#8a6a3c");
      p.ell(e[0] + dx * 0.2, e[1] + 14, 13, 7, "#7a5a2a", 4, 0, 360, 1);
    }
  }
};
type Pap = Pen;
const drawMirror = (p: Pen, fog: number, ph: number) => {
  p.poly([[0, 0], [700, 0], [700, 900], [0, 900]], "#a9d3df", 0);
  for (let x = 0; x <= 700; x += 100) p.stroke([[x, 0], [x, 900]], 5, "rgba(36,23,38,.35)");
  for (let y = 0; y <= 900; y += 100) p.stroke([[0, y], [700, y]], 5, "rgba(36,23,38,.35)");
  p.ell(350, 440, 250, 330, "#8a5a2b", 12);
  p.ell(350, 440, 222, 302, "#dbe8ee", 8);
  p.stroke([[190, 300], [250, 220]], 14, "rgba(255,255,255,.85)");
  if (fog > 0) {
    p.clip([[130, 140], [570, 140], [570, 740], [130, 740]], () => {
      p.ell(350, 440, 222 * (0.3 + 0.7 * fog), 302 * (0.3 + 0.7 * fog), `rgba(255,255,255,${(0.93 * Math.min(1, fog * 1.4)).toFixed(2)})`, 0);
    });
    // drops run down the fog
    for (let k = 0; k < 5; k++) {
      const x = 250 + k * 50, u = (ph * 1.3 + k * 0.23) % 1, y = 320 + u * 320;
      if (fog > 0.5) { p.stroke([[x, 320], [x, y]], 6, "rgba(120,170,225,.7)"); p.ell(x, y + 6, 9, 13, "#6fa8e6", 3); }
    }
  }
};
const drawCase = (p: Pen, ph: number) => {
  p.poly([[40, 330], [360, 330], [360, 360], [40, 360]], "#8a5a2b", 8);
  p.poly([[50, 330], [350, 330], [350, 130], [200, 40], [50, 130]], "#cfe8ee", 9);
  p.stroke([[200, 40], [200, 330]], 6, "#8a5a2b"); p.stroke([[50, 130], [350, 130]], 6, "#8a5a2b");
  for (let i = 0; i < 4; i++) {
    const x = 100 + i * 60, e: [number, number] = [x + (i - 1.5) * 12, 190 - 30 * ((i + 1) % 2)];
    p.stroke([[x, 322], e], 8, INKC); p.stroke([[x, 322], e], 4, GREEN2);
    p.ell(e[0] - 14, e[1], 20, 8, GREEN, 4, 0, 360, -0.5); p.ell(e[0] + 14, e[1], 20, 8, LEAF, 4, 0, 360, 0.5);
  }
  p.stroke([[70, 150], [70, 300]], 8, "rgba(255,255,255,.7)");
  void ph;
};
const drawLetter = (p: Pen) => {
  p.poly([[8, 20], [292, 8], [300, 190], [14, 196]], "#f7f1e1", 8);
  for (let i = 0; i < 4; i++) p.stroke([[40, 56 + i * 30], [200 + (i % 2) * 40, 52 + i * 30]], 6, "rgba(36,23,38,.55)");
  p.ell(236, 150, 24, 24, "#c0353a", 5);
};

// ---------------- staging ----------------
const exprWard = (id: number, t: number): Expr => {
  switch (id) {
    case 1: return t < 3.4 ? "smile" : "grin";
    case 2: return "smile";
    case 3: return t < 12.93 ? "neutral" : t < 14.9 ? "smile_closed" : "grin";
    case 4: return t < 17.3 - LEAD ? "neutral" : "shock";
    case 5: return t < 20.9 ? "smile" : "grin";
    case 6: return t < 25.0 ? "pained" : "nervous";
    case 7: return "smile";
    case 8: return t < 30.8 ? "dazed" : t < 33.3 ? "nervous" : "dazed";
    case 15: return "grin";
    default: return "smile";
  }
};
const personAt = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, sc = 1, extra: FrontOpts = {}) => {
  out.places.push(person(cam, { i, o, okey } as Who, x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, sc));
  blob(out, x, y, z, sc);
};

const tableSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const sealed = t >= LID_T - 0.1;
  const dropU = t < PUPA_IN ? 0 : Math.min(1, (t - PUPA_IN) / 0.4);
  const early = t < PUPA_IN; // the bottle starts empty: soil and pupa go in at "drops it in a big glass bottle"
  const st: BottleState = {
    soil: early ? 0 : Math.min(1, 0.5 + (t - PUPA_IN) * 2),
    pupa: early ? 0 : dropU, fern: early ? 0 : fernU(t),
    lid: early ? 0 : t < LID_T - 0.5 ? 0 : Math.min(1, (t - (LID_T - 0.5)) / 0.4), cyc: 0, ph: 0,
  };
  if (id === 1 || id === 15) { st.fern = 1; st.lid = 1; st.soil = 1; st.pupa = 1; }
  void sealed;
  const b = bottleFx(st, BOTTLE[0], BOTTLE[1], BOTTLE[2]);
  out.fx.push(b);
  if ((id === 3 || id === 2) && t < PUPA_IN + 0.1 && t > 9.8) {
    const inDish = t > DISH_T;
    out.fx.push({ key: `dish${inDish ? 1 : 0}`, cw: 300, ch: 200, draw: (p) => drawDish(p, inDish), x: -0.62, y: D0 + TABLE_H + 0.14, z: BOTTLE[2] + 0.1, w: 0.42, h: 0.28 });
  }
  const w = id === 15 ? 0.95 : 0.65;
  personAt(cam, t, out, 1, WARD, "ward", w + 0.15, D0, TABLE[2] + 0.05, exprWard(id, t), 1);
};

const SPOTS = {
  gardenDead: [[-1.3, -0.5], [-0.35, -0.2], [0.6, -0.55], [1.4, -0.15], [-0.8, 0.45], [0.2, 0.6], [1.0, 0.5]] as [number, number][],
};
const gardenSet = (t: number, cam: CamInfo, out: Stage) => {
  SPOTS.gardenDead.forEach(([dx, dz], i) => out.fx.push({ key: `dead${i % 3}`, cw: 280, ch: 360, draw: (p) => drawDead(p, i % 3), x: GARDEN[0] + dx, y: D0 + 0.5, z: GARDEN[2] + dz, w: 0.78, h: 1.0 }));
  personAt(cam, t, out, 1, WARD, "ward", GARDEN[0] + 0.9, D0, GARDEN[2] + 1.0, exprWard(6, t));
  void cam;
};

const mirrorSet = (t: number, out: Stage) => {
  const fog = Math.min(1, Math.max(0, (t - 35.5) / 2.2)), ph = q((t * 0.5) % 1, 30), f = q(fog, 20);
  out.fx.push({ key: `mirror|${f}|${ph}`, cw: 700, ch: 900, draw: (p) => drawMirror(p, f, ph), x: MIRROR[0], y: MIRROR[1], z: MIRROR[2], w: 1.35, h: 1.74 });
  if (fog > 0.1) for (let k = 0; k < 3; k++) {
    const u = q(((t * 0.45 + k / 3) % 1), 24);
    out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: MIRROR[0] - 0.9 + k * 0.9, y: MIRROR[1] - 0.2 + u * 0.7, z: MIRROR[2] + 0.4, w: 0.55, h: 0.55 });
  }
};

const cycleSet = (t: number, cam: CamInfo, out: Stage) => {
  const ph = (t * 0.32) % 1;
  out.fx.push(bottleFx({ soil: 1, pupa: 1, fern: 1, lid: 1, cyc: 1, ph }, BOTTLE[0], BOTTLE[1], BOTTLE[2]));
  personAt(cam, t, out, 1, WARD, "ward", 1.25, D0, TABLE[2] + 0.05, t < 41 ? "nervous" : "smile");
};

const CASES: [number, number][] = [[-1.6, 0.2], [-0.8, -0.6], [0.4, 0.3], [1.3, -0.5]];
const shipSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const x0 = shipX(t), bob = 0.05 * Math.sin(t * 1.4);
  CASES.forEach(([dx, dz], i) => out.fx.push({ key: "case", cw: 400, ch: 400, draw: (p) => drawCase(p, 0), x: x0 + dx, y: DECK_Y + bob + 0.45, z: SHIP_Z + dz, w: 0.9, h: 0.9 }));
  if (id === 12) {
    personAt(cam, t, out, 2, CAPTAIN, "cap", x0 + 0.9, DECK_Y + bob, SHIP_Z, t < 48.9 ? "neutral" : t < 49.9 ? "smile_closed" : "laugh");
    out.fx.push({ key: "letter", cw: 300, ch: 200, draw: drawLetter, x: x0 + 0.9, y: DECK_Y + bob + 0.85, z: SHIP_Z + 0.35, w: 0.42, h: 0.28, rot: 0.1 });
    personAt(cam, t, out, 3, FOLK[2], "f2", x0 - 0.6, DECK_Y + bob, SHIP_Z - 0.2, "smile", 1);
    personAt(cam, t, out, 4, FOLK[4], "f4", x0 + 2.2, DECK_Y + bob, SHIP_Z - 0.4, "grin", 1);
  } else {
    personAt(cam, t, out, 3, FOLK[2], "f2", x0 - 0.6, DECK_Y + bob, SHIP_Z - 0.2, "smile", 1);
    personAt(cam, t, out, 4, FOLK[4], "f4", x0 + 2.2, DECK_Y + bob, SHIP_Z - 0.4, "grin", 1);
    personAt(cam, t, out, 2, CAPTAIN, "cap", x0 + 0.9, DECK_Y + bob, SHIP_Z, "smile");
  }
};

const potsSet = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const after = t >= POT_T - LEAD;
  for (let i = 0; i < 20; i++) {
    const row = Math.floor(i / 5), col = i % 5, alive = after ? i !== 13 : i === 7;
    out.fx.push({ key: `pot${alive ? 1 : 0}${i % 3}`, cw: 200, ch: 260, draw: (p) => drawPot(p, alive, i % 3), x: STAND[0] - 1.0 + col * 0.5, y: D0 + 0.12 + row * 0.55 + 0.285, z: STAND[2], w: 0.44, h: 0.57 });
  }
  personAt(cam, t, out, 1, WARD, "ward", STAND[0] + 1.2, D0, STAND[2] + 1.6, after ? "laugh" : "pained");
  if (after) { personAt(cam, t, out, 5, FOLK[1], "f1", STAND[0] - 1.2, D0, STAND[2] + 1.5, "grin"); personAt(cam, t, out, 6, KID, "kid", STAND[0] - 0.55, D0, STAND[2] + 1.9, "laugh", 0.75); }
  else personAt(cam, t, out, 5, FOLK[3], "f3", STAND[0] - 1.2, D0, STAND[2] + 1.5, "dazed");
  void id;
};

const dockSet = (t: number, cam: CamInfo, out: Stage) => {
  for (let i = 0; i < 9; i++) {
    const x = -14 + i * 3.4 + hh(i) * 1.2, z = -33.2 - hh(i, 2) * 2.5;
    personAt(cam, t, out, 20 + i, FOLK[i % 6], `f${i % 6}`, x, D0, z, (["smile", "neutral", "smile_closed"] as Expr[])[i % 3]);
  }
  void fxStars;
  void TABLE;
  void BOTTLE_H;
  void MIRROR;
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  switch (s.scene) {
    case "table": case "finale": tableSet(id, t, cam, out); break;
    case "dock": dockSet(t, cam, out); if (t > 7.3) tableSet(id, t, cam, out); break;
    case "garden": gardenSet(t, cam, out); break;
    case "mirror": mirrorSet(t, out); break;
    case "cycle": cycleSet(t, cam, out); break;
    case "ship": case "deck": shipSet(id, t, cam, out); break;
    case "pots": potsSet(id, t, cam, out); break;
  }
  return out;
};
export type { V3 };
