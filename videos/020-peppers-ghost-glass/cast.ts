// The cast and hand-drawn props of the ghost story: John Henry Pepper (navy coat, dark hair, side whiskers), Henry
// Dircks (brown coat, top hat, grey moustache), the stage actor (a scholar in a plum gown), the hidden actor in his pale
// robe, two stagehands, two theatre owners, the glazier, the woman in the kitchen, the audience on the benches and the
// queue on Regent Street. The ghost is a see-through unlit card of the hidden actor (alpha fades in, never pops);
// the reflection in the kitchen window and Dircks's fade at the end use the same card. Drawn props: the thought bubble,
// the plan, the floor marks, the money bag, the lamp glow.
import { Pen, SKINS, Outfit, Expr, FrontOpts, townsfolk, bodyFront } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf, SU, light2D } from "../../src/engine/cards";
import {
  D0, SHOTS, smooth, SY, PY, ROWS, SEAT_Y, ACTOR, PIT_ACTOR, LAMP, ST, POLY_Z, CART, KIT, OFF, DIRCKS_O, OWNERS_O, TABLE_O,
  DIRCKS_SEAT, ghostAt, ghostPos, lampAt, F_NOBODY, F_PLAN, F_THEY, F_SOON,
  T_GHOST, T_HOW, T_PEPPER, T_CROWD, T_BUT, T_NOT, T_DIRCKS, T_DREAMED, T_THEATRE, T_REBUILD, T_FOUND, T_CHEAPER, T_HID,
  T_PIT, T_LIT, T_BLAZING, T_STOOD, T_TILTED, T_SEATS, T_PALE, T_ACTORS, T_SEE, T_FOLLOWED, T_FIVE, T_STARED, T_THERE,
  T_WINDOW, T_KITCHEN, T_YOURSELF, T_FLOATING, T_LIGHT, T_BOTH, T_SOLD, T_SHORT, T_PLATE, T_GAVE, T_MONEY, T_CROWDS,
  T_ONE, T_PEPPERS, T_GHOSTW, T_BECAME, T_NOBODYE, T_SEEE, T_DIMMED,
} from "./story";

const PEPPER: Outfit = { jacket: "#2e3a5e", pants: "#3a3440", boots: "#1e1a1e", hat: "hair", hair: "#4a3424", moustache: "#4a3424", buttons: "#c9a24a", skin: SKINS[0] };
const DIRCKS: Outfit = { jacket: "#6a5038", pants: "#4a4038", boots: "#2a1e18", hat: "tophat", moustache: "#9a9690", belt: null, skin: SKINS[1], build: "stout" };
const SCHOLAR: Outfit = { jacket: "#6a2e4a", pants: "#3a2a30", boots: "#2a1e18", hat: "hair", hair: "#7a7470", skin: SKINS[2] };
const ROBE: Outfit = { jacket: "#e4e8ee", pants: "#d8dde6", boots: "#c8ced8", hat: "hair", hair: "#eef0f2", dress: "#e4e8ee", skin: "#efe8de" };
const HAND: Outfit = { jacket: "#8a6a44", pants: "#3b3f52", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", skin: SKINS[3] };
const OWNER: Outfit = { jacket: "#2a2a34", pants: "#3a3440", boots: "#1e1a1e", hat: "tophat", moustache: "#3a2a20", buttons: "#c9a24a", skin: SKINS[0], build: "stout" };
const GLAZIER: Outfit = { jacket: "#5a7a8a", pants: "#4f4636", boots: "#3a2a20", hat: "cap", cap: "#3a4a5a", belt: "#e8e2d2", skin: SKINS[2] };
const COOK: Outfit = { jacket: "#c25a3a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#6a4028", dress: "#5a86b8", skin: SKINS[1] };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);
const INKC = "#241726";

// ---------------- drawings ----------------
/** a see-through unlit copy of a character: drawn solid, washed cool by `tint`, then its alpha scaled to `a` */
const ghostDraw = (o: Outfit, opts: FrontOpts, a: number, tint: number) => (p: Pen) => {
  const g = p.g;
  g.save(); g.scale(1.5, 1.5); bodyFront(p, o, opts); g.restore();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (tint > 0) { g.globalCompositeOperation = "source-atop"; g.fillStyle = `rgba(196,226,255,${0.5 * tint})`; g.fillRect(0, 0, 900, 1500); }
  g.globalCompositeOperation = "destination-in"; g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, 900, 1500);
  g.restore();
};
/** a speech bubble (360 x 300) holding a small picture */
const bubble = (p: Pen, inner: (p: Pen) => void) => {
  p.ell(180, 130, 164, 116, "#ffffff", 8);
  p.poly([[110, 226], [80, 292], [160, 236]], "#ffffff", 0);
  p.stroke([[112, 234], [80, 292], [156, 242]], 8, INKC);
  inner(p);
};
/** Dircks's idea: a little stage with a pale ghost on it */
const drawIdea = (p: Pen) => bubble(p, (pn) => {
  pn.poly([[80, 70], [280, 70], [280, 200], [80, 200]], "#3f5a4c", 6);
  pn.poly([[70, 196], [290, 196], [290, 214], [70, 214]], "#a87a4a", 5);
  pn.poly([[70, 60], [100, 60], [100, 200], [70, 200]], "#b32a30", 5);
  pn.poly([[260, 60], [290, 60], [290, 200], [260, 200]], "#b32a30", 5);
  pn.g.globalAlpha = 0.75;
  pn.ell(180, 112, 26, 30, "#e8f2ff", 5);
  pn.poly([[156, 130], [204, 130], [214, 196], [146, 196]], "#e8f2ff", 5);
  pn.g.globalAlpha = 1;
  pn.ell(170, 108, 4, 6, INKC, 0); pn.ell(190, 108, 4, 6, INKC, 0);
});
/** Dircks's plan (520 x 380): the theatre cut through, with a whole new room dug under the seats in red */
const drawPlan = (p: Pen) => {
  p.poly([[10, 10], [510, 10], [510, 370], [10, 370]], "#f2ead6", 7);
  p.g.strokeStyle = "#3a5a8a"; p.g.lineWidth = 6;
  p.g.strokeRect(50, 70, 420, 170); // the hall
  p.g.beginPath(); p.g.moveTo(50, 70); p.g.lineTo(260, 30); p.g.lineTo(470, 70); p.g.stroke(); // the roof
  p.g.strokeRect(70, 180, 120, 60); // the stage
  for (let i = 0; i < 5; i++) { p.g.beginPath(); p.g.moveTo(240 + i * 44, 240 - i * 10); p.g.lineTo(270 + i * 44, 240 - i * 10); p.g.stroke(); } // the seats
  p.poly([[60, 252], [460, 252], [460, 340], [60, 340]], "#e07a6a", 6); // the new room under it all
  p.g.strokeStyle = "#b02a2a"; p.g.lineWidth = 9;
  for (let x = 90; x < 450; x += 60) { p.g.beginPath(); p.g.moveTo(x, 262); p.g.lineTo(x + 30, 330); p.g.stroke(); }
};
/** a chalk cross on the boards (160 x 160) */
const drawMark = (p: Pen) => { p.line([[30, 30], [130, 130]], "#f4f0e4", 16, false); p.line([[130, 30], [30, 130]], "#f4f0e4", 16, false); };
/** a money bag (200 x 220) */
const drawBag = (p: Pen) => {
  p.poly([[60, 70], [140, 70], [180, 150], [160, 205], [40, 205], [20, 150]], "#b88a4a", 8);
  p.poly([[70, 40], [130, 40], [120, 74], [80, 74]], "#a87a3e", 7);
  p.ell(100, 145, 30, 30, "#e8c45a", 6);
  p.line([[100, 124], [100, 166]], "#9a7a2a", 6, false);
};
/** the lamp's glow (256 x 256): a soft warm disc */
const drawGlow = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,236,170,0.95)"); gr.addColorStop(0.35, "rgba(255,206,120,0.5)"); gr.addColorStop(1, "rgba(255,190,100,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true, scale = 1) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, scale));
  if (shadow) blob(out, x, y, z, scale);
};
const walker = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, dx: number, dz: number, expr: Expr) => {
  const ph = q(t * 1.0 + i * 0.37, 48), v = viewOf(cam, x, z, dx, dz);
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: v.side, mirror: v.mirror },
    { mode: "stroll", phase: ph, expr, blink: lidAt(t, i) }, { mode: "march", phase: ph, expr, blink: lidAt(t, i), stride: 0.875 * Math.max(0.3, v.fs) }, 1));
  blob(out, x, y, z, 1);
};
const grow = (t: number, t0: number, d = 0.8) => smooth((t - t0 + 0.07) / d);
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
};
const at = (t: number, t0: number) => t >= t0 - 0.07;
/** the see-through card of a character standing (feet) at x, y, z; a = opacity, tint = cool wash */
const ghost = (cam: CamInfo, out: Stage, okey: string, o: Outfit, x: number, y: number, z: number, a: number, expr: Expr, tint = 1, extra: FrontOpts = {}) => {
  const aq = q(a, 24), tq = q(tint, 10);
  if (aq <= 0.01) return;
  const opts: FrontOpts = { mode: "stand", expr, blink: 0, light: light2D(cam, false), seed: 3, ...extra };
  out.fx.push({ key: `ghost|${okey}|${aq}|${tq}|${expr}|${JSON.stringify(extra)}|${opts.light}`, cw: 900, ch: 1500, draw: ghostDraw(o, opts, aq, tq),
    x, y: y + (975 - 500) * SU, z, w: 600 * SU, h: 1000 * SU, soft: true });
};
/** the audience on the benches: everyone except those too close to the lens */
const audience = (cam: CamInfo, t: number, out: Stage, expr: (k: number) => Expr, wave = 0, rows = ROWS.length) => {
  let k = 0;
  for (let r = 0; r < rows; r++) for (let x = -7.0 + (r % 2) * 0.5; x <= 7.0; x += 1.2) {
    k++;
    if (Math.abs(x) < 1.0) continue;
    const z = ROWS[r];
    if (cam.pos.distanceTo({ x, y: SEAT_Y + 0.8, z } as never) < 2.2) continue;
    const o = FOLK[(k * 3 + r) % 8];
    front(cam, t, out, 40 + k, o, `a${(k * 3 + r) % 8}`, x, SEAT_Y - 0.12, z - 0.02, expr(k), { mode: "sit", ...(wave && k % 3 === 0 ? { wave } : {}) }, false);
  }
};
const queue = (cam: CamInfo, t: number, out: Stage, x0: number, n: number, expr: (k: number) => Expr) => {
  for (let k = 0; k < n; k++) front(cam, t, out, 20 + k, FOLK[k % 8], `f${k % 8}`, x0 + k * 1.05, D0 + 0.18, POLY_Z + 6.8 + (k % 2) * 0.35, expr(k), k % 4 === 1 ? { wave: 0.5 } : {});
};

// ---------------- the shots ----------------
const shots = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const f = Math.round(t * 30);
  const ga = ghostAt(id, t), gp = ghostPos(id, t);
  if (id === 1) { // the ghost appears beside the actor; the audience gasps
    front(cam, t, out, 2, SCHOLAR, "scholar", ACTOR[0], SY, ACTOR[2], at(t, T_HOW) ? "nervous" : "neutral", { look: -0.6 });
    ghost(cam, out, "robe", ROBE, gp[0], gp[1], gp[2], ga, "neutral");
    audience(cam, t, out, (k) => (f >= F_NOBODY ? (k % 3 ? "shock" : "nervous") : at(t, T_GHOST) ? "shock" : "neutral"));
    return;
  }
  if (id === 2) { // Regent Street: the queue at the Polytechnic
    queue(cam, t, out, ST[0] - 12, 18, (k) => (k % 3 ? "smile" : "grin"));
    walker(cam, t, out, 9, FOLK[6], "f6", ST[0] + 6 - 1.1 * (t - 5.9), D0 + 0.18, 3.8, -1, 0, "smile");
    return;
  }
  if (id === 3) { // Pepper, the star, on the stage; "but the idea was not his"
    const sly = at(t, T_BUT);
    front(cam, t, out, 1, PEPPER, "pepper", 0, SY, -3.2, at(t, T_NOT) ? "nervous" : sly ? "smile_closed" : at(t, T_CROWD) ? "laugh" : at(t, T_PEPPER) ? "grin" : "smile",
      !sly && at(t, T_PEPPER) ? { wave: 1 } : {});
    audience(cam, t, out, (k) => (sly ? (k % 2 ? "smile" : "neutral") : k % 2 ? "laugh" : "grin"), sly ? 0 : 0.8, 2);
    return;
  }
  if (id === 4) {
    if (f < F_PLAN) { // Dircks in his office with the model; the idea in a bubble
      front(cam, t, out, 3, DIRCKS, "dircks", DIRCKS_O[0], D0 + 0.05, DIRCKS_O[2], at(t, T_DREAMED) ? "grin" : at(t, T_DIRCKS) ? "smile" : "smile_closed", at(t, T_DREAMED) ? { wave: 0.6 } : {});
      const g = grow(t, T_DREAMED - 0.2, 0.6);
      card(out, "idea", 360, 300, drawIdea, DIRCKS_O[0] + 0.55, D0 + 2.55, DIRCKS_O[2] + 0.1, 0.95 * g, 0.8 * g);
      return;
    }
    // the plan before the two owners: a whole new room under the theatre
    front(cam, t, out, 3, DIRCKS, "dircks", DIRCKS_O[0], D0 + 0.05, DIRCKS_O[2] + 0.4, at(t, T_THEATRE) ? "nervous" : "grin", { wave: 0.7 });
    for (let k = 0; k < 2; k++) front(cam, t, out, 4 + k, OWNER, "owner", OWNERS_O[0] + k * 0.9, D0 + 0.05, OWNERS_O[2] - k * 0.5, at(t, T_THEATRE) ? (k ? "shock" : "stern") : at(t, T_REBUILD) ? "stern" : "neutral");
    const g = grow(t, 17.2, 0.5);
    card(out, "plan", 520, 380, drawPlan, DIRCKS_O[0] + 0.9, D0 + 1.45, DIRCKS_O[2] + 0.6, 1.1 * g, 0.8 * g);
    return;
  }
  if (id === 5) { // Pepper hides an actor in the pit and lights him with a blazing lamp
    front(cam, t, out, 1, PEPPER, "pepper", -1.25, PY, -0.35, at(t, T_LIT) ? "grin" : at(t, T_HID) ? "smile" : at(t, T_CHEAPER) ? "grin" : "smile_closed", at(t, T_PIT) ? { wave: 0.6 } : {});
    front(cam, t, out, 6, ROBE, "robe", PIT_ACTOR[0], PY, PIT_ACTOR[2], at(t, T_BLAZING) ? "shock" : at(t, T_HID) ? "smile" : "neutral");
    const lk = lampAt(5, t);
    card(out, "glow", 256, 256, drawGlow, LAMP[0], LAMP[1], LAMP[2] + 0.1, 2.2 * lk, 2.2 * lk, true);
    void T_FOUND;
    return;
  }
  if (id === 6) { // the stagehands stand the glass up, then tilt it
    for (const [k, x] of [[0, -2.9], [1, 2.9]] as const) front(cam, t, out, 7 + k, HAND, "hand", x, SY, -1.2, at(t, T_TILTED) ? "grin" : at(t, T_STOOD) ? "pained" : "neutral", {}, true);
    front(cam, t, out, 1, PEPPER, "pepper", 1.0, SY, -3.6, at(t, T_SEATS) ? "laugh" : at(t, T_TILTED) ? "grin" : "smile", at(t, T_TILTED) ? { wave: 0.8 } : {});
    front(cam, t, out, 6, ROBE, "robe", PIT_ACTOR[0], PY, PIT_ACTOR[2], "smile");
    card(out, "glow", 256, 256, drawGlow, LAMP[0], LAMP[1], LAMP[2] + 0.1, 2.0, 2.0, true);
    return;
  }
  if (id === 7) {
    if (f < F_THEY) { // the stage dims; the ghost drifts beside the actor
      front(cam, t, out, 2, SCHOLAR, "scholar", ACTOR[0], SY, ACTOR[2], at(t, T_ACTORS) ? "nervous" : "neutral", { look: -0.6 });
      ghost(cam, out, "robe", ROBE, gp[0], gp[1], gp[2], ga, at(t, T_ACTORS) ? "smile" : "neutral", 1, at(t, T_ACTORS) ? { wave: 0.5 } : {});
      audience(cam, t, out, (k) => (at(t, T_PALE) ? (k % 2 ? "shock" : "nervous") : "neutral"), 0, 2);
      void T_DIMMED;
      return;
    }
    // they could not see it: the actor follows the chalk marks
    for (const x of [-2.2, -1.4, -0.6]) out.fx.push({ key: "mark", cw: 160, ch: 160, draw: drawMark, x, y: SY + 0.012, z: -4.45, w: 0.36, h: 0.36, flat: true, rot: 0.2 });
    const u = Math.max(0, t - T_FOLLOWED + 0.1), x = -2.6 + Math.min(2.0, 0.8 * u);
    if (u > 0 && u < 2.5) walker(cam, t, out, 2, SCHOLAR, "scholar", x, SY, -4.5, 1, 0, "nervous");
    else front(cam, t, out, 2, SCHOLAR, "scholar", x, SY, -4.5, at(t, T_SEE) ? "nervous" : "neutral");
    return;
  }
  if (id === 8) { // five hundred people stare at a ghost that is not there
    audience(cam, t, out, (k) => (at(t, T_THERE) ? (k % 3 ? "shock" : "dazed") : at(t, T_STARED) ? "shock" : k % 2 ? "nervous" : "neutral"));
    void T_FIVE;
    return;
  }
  if (id === 9) { // the kitchen window at night: she sees herself floating in the dark garden
    const kz = KIT[2];
    front(cam, t, out, 10, COOK, "cook", KIT[0] + 0.45, D0 + 0.05, kz - 1.2, at(t, T_FLOATING) ? "shock" : at(t, T_KITCHEN) ? "smile" : "smile_closed");
    const a = 0.55 * smooth((t - T_YOURSELF + 0.1) / 0.9);
    ghost(cam, out, "cook", COOK, KIT[0] - 0.45, D0 + 0.25 + 0.06 * Math.sin(t * 1.6), kz + 2.2, a, at(t, T_FLOATING) ? "shock" : "smile", 0.6);
    void T_WINDOW;
    return;
  }
  if (id === 10) { // the cut-away: the lit hidden actor, the glass, the ghost behind it
    front(cam, t, out, 6, ROBE, "robe", PIT_ACTOR[0], PY, PIT_ACTOR[2], at(t, T_BOTH) ? "grin" : "smile");
    front(cam, t, out, 2, SCHOLAR, "scholar", ACTOR[0], SY, ACTOR[2], "neutral", { look: -0.6 });
    ghost(cam, out, "robe", ROBE, gp[0], gp[1], gp[2], ga, "neutral");
    const lk = lampAt(10, t);
    card(out, "glow", 256, 256, drawGlow, LAMP[0], LAMP[1], LAMP[2] + 0.1, 2.4 * lk, 2.4 * lk, true);
    void T_LIGHT;
    return;
  }
  if (id === 11) {
    if (f < F_SOON) { // sold out for fifteen months: the queue all down Regent Street
      queue(cam, t, out, ST[0] - 30, 30, (k) => (at(t, T_SOLD) ? (k % 3 ? "grin" : "laugh") : "smile"));
      return;
    }
    // London runs short of plate glass: the glazier's cart is empty, the managers wave their money
    front(cam, t, out, 11, GLAZIER, "glazier", CART[0] - 0.1, D0 + 0.18, CART[2] + 0.9, at(t, T_PLATE) ? "nervous" : at(t, T_SHORT) ? "dazed" : "neutral", at(t, T_SHORT) ? { wave: 0.5 } : {});
    for (let k = 0; k < 3; k++) front(cam, t, out, 12 + k, OWNER, "owner", CART[0] - 1.5 - k * 0.8, D0 + 0.18, CART[2] + 1.4 + (k % 2) * 0.5, k === 1 ? "shock" : "grin", { wave: 0.7 + 0.3 * (k % 2) });
    card(out, "bag", 200, 220, drawBag, CART[0] - 1.85, D0 + 2.2, CART[2] + 1.95, 0.4, 0.44);
    return;
  }
  if (id === 12) { // the patent table: Dircks pushes the money to Pepper
    front(cam, t, out, 3, DIRCKS, "dircks", TABLE_O[0] - 0.75, D0 + 0.05, TABLE_O[2] - 1.0, at(t, T_CROWDS) ? "smile_closed" : at(t, T_GAVE) ? "smile" : "neutral");
    front(cam, t, out, 1, PEPPER, "pepper", TABLE_O[0] + 0.75, D0 + 0.05, TABLE_O[2] - 1.0, at(t, T_ONE) ? "laugh" : at(t, T_MONEY) ? "grin" : "smile", at(t, T_ONE) ? { wave: 0.9 } : {});
    const u = smooth((t - T_GAVE + 0.1) / 0.9);
    card(out, "bag", 200, 220, drawBag, TABLE_O[0] - 0.45 + 0.9 * u, D0 + 1.1, TABLE_O[2] + 0.1, 0.36, 0.4);
    void OFF;
    return;
  }
  if (id === 13) { // Pepper's ghost: Pepper bows beside it, the crowd cheers
    front(cam, t, out, 1, PEPPER, "pepper", -0.6, SY, -3.6, at(t, T_GHOSTW) ? "laugh" : "grin", { wave: 1 });
    ghost(cam, out, "robe", ROBE, 1.1, SY, -4.4, ga, "smile");
    audience(cam, t, out, (k) => (k % 2 ? "laugh" : "grin"), 0.9);
    void T_PEPPERS;
    return;
  }
  // id 14 (golden): the man who dreamed it up fades on the back bench
  const fade = smooth((t - T_BECAME + 0.1) / (T_NOBODYE + 0.5 - T_BECAME));
  ghost(cam, out, "dircks", DIRCKS, DIRCKS_SEAT[0], DIRCKS_SEAT[1] - 0.12, DIRCKS_SEAT[2] - 0.02, 1 - 0.72 * fade, at(t, T_SEEE) ? "smile_closed" : at(t, T_NOBODYE) ? "neutral" : "smile_closed", fade, { mode: "sit" });
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  setStageLight(cam, SHOTS[id - 1].light);
  shots(id, t, cam, out);
  return out;
};
