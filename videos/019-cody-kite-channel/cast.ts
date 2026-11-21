// The cast and hand-drawn props of the kite crossing: Samuel Franklin Cody (dark coat, hat, big moustache), the
// newspaper reporter (brown check coat, cap), the man in the kite basket, navy sailors, steamer passengers, folk on the
// Calais quay and on Dover beach, the crowd at the flying field. The drawn props: the lifebelt bubble, wind arrows,
// river leaves and current arrows, surf on the sands, funnel smoke and spray. Every prop is an unlit ink-outlined
// drawing; cards that arrive mid-shot grow in slowly (never pop) or arrive on a cut frame.
import { Pen, SKINS, Outfit, Expr, FrontOpts, townsfolk, fxPuff, fxSplash } from "../../src/engine/toon";
import { CamInfo, Stage, Who, q, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, SHOTS, smooth, boatAt, BoatPose, shipAt, planeAt, basketAt, F_LIKE, F_KITES, F_TOOK, FIELD, CALAIS, QUAY_Z, QUAY_Y,
  RIVER_X, RIVER_Z, SANDS, NAVY_DECK, STEAM_DECK, CODY_BEACH, REPORTER_BEACH, FLAG,
  T_HAT, T_MOUST, T_KITES, T_FAME, T_REPORTER, T_TIED, T_FLIPPED, T_LOOK, T_WENT, T_LIFEBELT, T_TURNED, T_WRONG, T_CALAIS,
  T_PUSHED, T_CLIMBED, T_DIED, T_TIDE, T_GOODWIN, T_STRING, T_HIGH, T_MIDDLE, T_BANKS, T_TOWED, T_LANDED, T_DOVER, T_FIRSTF,
  T_KITEMAN, T_LETGO, T_STRINGEND, T_TESTED,
} from "./story";

const CODY: Outfit = { jacket: "#3a3446", pants: "#4a4038", boots: "#2a1e18", hat: "tophat", belt: "#2a1e18", moustache: "#3a2a20", buttons: "#c9a24a", skin: SKINS[0] };
const REPORTER: Outfit = { jacket: "#9a7650", pants: "#4f4636", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", skin: SKINS[1] };
const SAILOR: Outfit = { jacket: "#26305a", pants: "#26305a", boots: "#1e1a1e", hat: "cap", cap: "#efe9dc", skin: SKINS[2] };
const OFFICER_N: Outfit = { jacket: "#1f2747", pants: "#1f2747", boots: "#1e1a1e", hat: "cap", cap: "#1f2747", buttons: "#e8c45a", moustache: "#6a4a30", skin: SKINS[1] };
const LIFTED: Outfit = { jacket: "#6a7a4a", pants: "#3b3f52", boots: "#3a2a20", hat: "cap", cap: "#4a5a34", skin: SKINS[0] };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);
const INKC = "#241726";

// ---------------- drawings ----------------
/** a speech bubble (360 x 300) holding a small picture */
const bubble = (p: Pen, inner: (p: Pen) => void) => {
  p.ell(180, 130, 164, 116, "#ffffff", 8);
  p.poly([[110, 226], [80, 292], [160, 236]], "#ffffff", 0);
  p.stroke([[112, 234], [80, 292], [156, 242]], 8, INKC);
  inner(p);
};
/** the reporter's thought: a red and white lifebelt */
const drawLifebelt = (p: Pen) => bubble(p, (pn) => {
  pn.ell(180, 130, 84, 84, "#f4f0e6", 0);
  for (let k = 0; k < 4; k++) pn.arc(180, 130, 63, 63, k * 90 + 20, k * 90 + 65, 40, "#c0392f");
  pn.ell(180, 130, 42, 42, "#ffffff", 0);
  pn.ell(180, 130, 84, 84, null, 7);
  pn.ell(180, 130, 42, 42, null, 7);
});
/** a wind arrow (400 x 120), white with ink */
const drawArrow = (p: Pen) => {
  p.poly([[20, 46], [300, 46], [300, 14], [384, 60], [300, 106], [300, 74], [20, 74]], "#ffffff", 7);
};
/** a floating leaf (120 x 80) */
const drawLeaf = (p: Pen) => { p.ell(60, 40, 48, 22, "#d98a2e", 5); p.line([[16, 40], [104, 40]], "#9a5a1e", 3, false); };
/** a current arrow painted flat on the river (400 x 120), pale blue */
const drawCurrent = (p: Pen) => {
  p.poly([[20, 48], [300, 48], [300, 18], [384, 60], [300, 102], [300, 72], [20, 72]], "#dff3ff", 6);
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
/** a looping effect: phase u in 0..1 over `life` seconds, offset per index */
const loop = (t: number, life: number, k: number) => { const u = t / life + k * 0.618; return u - Math.floor(u); };
/** Cody sitting in the boat (on its seat) */
const inBoat = (cam: CamInfo, t: number, out: Stage, b: BoatPose, expr: Expr, extra: FrontOpts = {}) => {
  const c = Math.cos(b.yaw), s = Math.sin(b.yaw), sx = -0.25;
  front(cam, t, out, 1, CODY, "cody", b.p[0] + sx * c, b.p[1] - 0.2, b.p[2] - sx * s, expr, { mode: "sit", ...extra }, false);
};
/** spray at the bow of the moving boat */
const spray = (out: Stage, t: number, b: BoatPose, k = 1) => {
  const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
  for (let i = 0; i < 3; i++) {
    const u = loop(t, 0.9, i), uq = q(u, 15), sz = k * (0.7 + 0.5 * i) * Math.sin(Math.PI * u);
    card(out, `spl${uq}`, 300, 300, (pn) => fxSplash(pn, uq), b.p[0] + 2.3 * c + (i - 1) * 0.2, 0.25, b.p[2] - 2.3 * s + (i - 1) * 0.5, sz, sz, true);
  }
};
/** smoke from a funnel top */
const smoke = (out: Stage, t: number, x: number, y: number, z: number, n = 4) => {
  for (let i = 0; i < n; i++) {
    const u = loop(t, 2.4, i), uq = q(u, 20), sz = (2.2 + 5 * u) * Math.min(1, Math.sin(Math.PI * u) * 3);
    card(out, `puff${uq}`, 300, 300, (pn) => fxPuff(pn, uq), x - 5 * u, y + 1.5 + 4.5 * u, z + 0.6 * i - 1, sz, sz, true);
  }
};

// ---------------- the shots ----------------
const shots = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const f = Math.round(t * 30);
  const b = boatAt(id, t);
  if (id === 1 && b) { inBoat(cam, t, out, b, at(t, 5.6) ? "grin" : "smile"); spray(out, t, b, 0.7); return; }
  if (id === 2) {
    if (f < F_KITES) { // Cody on Dover beach by his boat and kite
      front(cam, t, out, 1, CODY, "cody", CODY_BEACH[0], D0, CODY_BEACH[2], at(t, T_MOUST) ? "grin" : at(t, T_HAT) ? "smile" : "smile_closed", at(t, T_MOUST) ? { wave: 0.8 } : {});
      return;
    }
    // the man-lifting kites: a man in the basket high above the beach, folk watching
    const bk = basketAt(t);
    front(cam, t, out, 7, LIFTED, "lifted", bk[0], bk[1] + 0.15, bk[2] + 0.05, "grin", { mode: "sit", wave: 1 }, false);
    front(cam, t, out, 1, CODY, "cody", -4.2, D0, -11.5, "grin", { wave: 0.9 });
    for (let k = 0; k < 4; k++) front(cam, t, out, 20 + k, FOLK[k], `f${k}`, -1.0 + k * 1.3, D0, -9.6 + (k % 2) * 0.9, k % 2 ? "shock" : "laugh", k === 2 ? { wave: 0.7 } : {});
    void T_KITES;
    return;
  }
  if (id === 3) { // the navy ship flying a Cody kite; Cody at the stern
    const s = shipAt("navy", t), y = NAVY_DECK + 0.06;
    front(cam, t, out, 1, CODY, "cody", s[0] - 15, y, s[2] - 1.6, at(t, T_FAME) ? "laugh" : "grin", { wave: at(t, T_FAME) ? 1 : 0.6 }, false);
    front(cam, t, out, 30, OFFICER_N, "offn", s[0] - 10.5, y, s[2] - 1.8, at(t, T_TESTED) ? "smile" : "stern", {}, false);
    for (let k = 0; k < 3; k++) front(cam, t, out, 31 + k, SAILOR, "sailor", s[0] - 6 + k * 3.2, y, s[2] - 2.0 + (k % 2) * 0.8, k % 2 ? "grin" : "smile", {}, false);
    return;
  }
  if (id === 4) { // the lifelines; the reporter takes one look and goes to buy a lifebelt
    const leave = Math.max(0, t - T_WENT + 0.07);
    front(cam, t, out, 1, CODY, "cody", CODY_BEACH[0], D0, CODY_BEACH[2], at(t, T_WENT) ? "laugh" : at(t, T_TIED) ? "grin" : "smile", at(t, T_TIED) && !at(t, T_FLIPPED) ? { wave: 0.8 } : {});
    const rx = REPORTER_BEACH[0] + 0.35 * leave, rz = REPORTER_BEACH[2] - 1.25 * leave;
    if (leave > 0) walker(cam, t, out, 2, REPORTER, "rep", rx, D0, rz, 0.27, -0.96, "nervous");
    else front(cam, t, out, 2, REPORTER, "rep", rx, D0, rz, at(t, T_LOOK) ? "shock" : at(t, T_FLIPPED) ? "nervous" : at(t, T_REPORTER) ? "smile" : "neutral");
    if (f >= F_TOOK) {
      const g = grow(t, T_LIFEBELT - 0.3, 0.6);
      card(out, "lifebelt", 360, 300, drawLifebelt, rx + 0.5, D0 + 2.75, rz + 0.1, 1.0 * g, 0.83 * g);
    }
    return;
  }
  if (id === 5) { // the wind turns: Cody watches the flag swing round
    front(cam, t, out, 1, CODY, "cody", FLAG[0] - 1.0, D0, FLAG[2] - 0.9, at(t, T_WRONG) ? "nervous" : at(t, T_TURNED) ? "shock" : "neutral");
    return;
  }
  if (id === 6) { // the mail steamer to Calais
    const s = shipAt("steam", t), y = STEAM_DECK + 0.06;
    front(cam, t, out, 1, CODY, "cody", s[0] - 3.8, y, s[2] - 1.6, at(t, T_CALAIS) ? "grin" : "smile", {}, false);
    front(cam, t, out, 24, FOLK[4], "f4", s[0] + 1.5, y, s[2] - 2.2, "smile", {}, false);
    front(cam, t, out, 25, FOLK[5], "f5", s[0] + 7.5, y, s[2] - 1.9, "smile_closed", {}, false);
    front(cam, t, out, 32, SAILOR, "sailor", s[0] - 13.5, y, s[2] - 1.8, "neutral", {}, false);
    for (const x of [0, 3.5]) smoke(out, t, s[0] + x, STEAM_DECK + 6.5, s[2], 4);
    return;
  }
  if (id === 7 && b) { // Calais at dusk: folk on the quay wave him off
    inBoat(cam, t, out, b, at(t, T_CLIMBED) ? "grin" : at(t, T_PUSHED) ? "smile" : "smile_closed", at(t, T_PUSHED) && !at(t, T_CLIMBED) ? { wave: 0.7 } : {});
    for (let k = 0; k < 4; k++) front(cam, t, out, 20 + k, FOLK[(k + 3) % 8], `f${(k + 3) % 8}`, CALAIS - 2.5 + k * 1.6, QUAY_Y, QUAY_Z - 1.0 - (k % 2) * 0.6, at(t, T_PUSHED) ? "laugh" : "smile", at(t, T_PUSHED) ? { wave: 0.5 + 0.4 * (k % 2) } : {});
    return;
  }
  if (id === 8 && b) { // the wind dies; the tide drags him toward the sands
    inBoat(cam, t, out, b, at(t, T_GOODWIN) ? "nervous" : at(t, T_TIDE) ? "dazed" : at(t, T_DIED) ? "shock" : "smile");
    for (let i = 0; i < 9; i++) {
      const a = -1.2 + i * 0.3, u = loop(t, 1.6, i), uq = q(u, 15), sz = (2.4 + (i % 3)) * Math.sin(Math.PI * u);
      card(out, `spl${uq}`, 300, 300, (pn) => fxSplash(pn, uq), SANDS[0] + 34 * Math.cos(a + Math.PI), 0.6, SANDS[2] + 13 * Math.sin(a + Math.PI) * 0.3, sz, sz, true);
    }
    return;
  }
  if (id === 9) {
    if (f < F_LIKE && b) { // the kite is a sail on a long string: slow wind low, fast wind high
      inBoat(cam, t, out, b, "smile");
      const gl = grow(t, T_STRING - 0.2, 0.6), gh = grow(t, T_HIGH - 0.3, 0.6);
      for (let i = 0; i < 4; i++) { // low, short, slow
        const u = loop(t, 2.6, i), env = Math.sin(Math.PI * u) * gl;
        card(out, "arrow", 400, 120, drawArrow, b.p[0] - 4 + i * 3.0 + 2.0 * u, 1.6 + (i % 2) * 1.1, b.p[2] + 4, 2.6 * env, 0.78 * env);
      }
      for (let i = 0; i < 4; i++) { // high, long, fast
        const u = loop(t, 1.4, i), env = Math.sin(Math.PI * u) * gh;
        card(out, "arrow", 400, 120, drawArrow, b.p[0] - 5 + i * 4 + 6.0 * u, 11.5 + (i % 2) * 2.6, b.p[2] + 4, 4.6 * env, 1.38 * env);
      }
      return;
    }
    // the river: fast in the middle, slow at the banks
    const gm = grow(t, T_MIDDLE - 0.3, 0.6), gb = grow(t, T_BANKS - 0.3, 0.6), t0 = F_LIKE / 30, y = D0 + 0.27;
    for (const [dz, v, n] of [[0, 2.6, 4], [-5.2, 0.6, 3], [5.2, 0.6, 3]] as const) for (let i = 0; i < n; i++) {
      const x = RIVER_X - 12 + i * 4.2 + ((i * 1.7) % 2) + v * (t - t0);
      out.fx.push({ key: "leaf", cw: 120, ch: 80, draw: drawLeaf, x, y, z: RIVER_Z + dz + ((i * 0.7) % 1) - 0.5, w: 1.1, h: 0.73, flat: true, rot: 0.4 * i });
    }
    for (let i = 0; i < 3; i++) {
      const u = loop(t, 1.2, i), e = Math.sin(Math.PI * u) * gm;
      out.fx.push({ key: "cur", cw: 400, ch: 120, draw: drawCurrent, x: RIVER_X - 8 + i * 5 + 3 * u, y: y + 0.01, z: RIVER_Z, w: Math.max(0.005, 3.2 * e), h: Math.max(0.005, 0.95 * e), flat: true, rot: 0 });
    }
    for (const dz of [-5, 5]) for (let i = 0; i < 3; i++) {
      const u = loop(t, 2.4, i + 3), e = Math.sin(Math.PI * u) * gb;
      out.fx.push({ key: "cur", cw: 400, ch: 120, draw: drawCurrent, x: RIVER_X - 8 + i * 5 + 0.8 * u, y: y + 0.01, z: RIVER_Z + dz, w: Math.max(0.005, 1.1 * e), h: Math.max(0.005, 0.33 * e), flat: true, rot: 0 });
    }
    return;
  }
  if (id === 10 && b) { inBoat(cam, t, out, b, at(t, T_TOWED) ? "laugh" : "grin", at(t, T_TOWED) ? { wave: 0.9 } : {}); spray(out, t, b, 1.1); return; }
  if (id === 11 && b) { // the next morning: the boat runs up onto Dover beach
    inBoat(cam, t, out, b, at(t, T_DOVER) ? "relief_open" : at(t, T_LANDED) ? "relief" : "dazed", at(t, T_DOVER) ? { wave: 0.6 } : {});
    for (let k = 0; k < 5; k++) front(cam, t, out, 20 + k, FOLK[k + 2], `f${k + 2}`, -5 + k * 2.3, D0, -8.5 - (k % 2) * 1.2, at(t, T_DOVER) ? "laugh" : "smile", at(t, T_DOVER) ? { wave: 0.5 + 0.4 * (k % 2) } : {});
    return;
  }
  if (id === 12) { // five years later: the first official aeroplane flight in Britain
    const pl = planeAt(12, t);
    if (pl) front(cam, t, out, 1, CODY, "cody", pl.p[0] + 0.1, pl.p[1] + 1.35, pl.p[2] + 0.2, at(t, T_FIRSTF) ? "laugh" : "grin", { mode: "sit" }, false);
    for (let k = 0; k < 7; k++) front(cam, t, out, 20 + k, FOLK[k % 8], `f${k % 8}`, FIELD[0] - 22 + k * 1.9, D0, FIELD[2] + 5 + (k % 3) * 0.7, at(t, T_FIRSTF) ? "laugh" : "shock", at(t, T_FIRSTF) ? { wave: 0.5 + 0.4 * (k % 2) } : {});
    return;
  }
  // id 13 (golden): the kite man lets go of the string
  const held = !at(t, T_LETGO);
  front(cam, t, out, 1, CODY, "cody", FIELD[0], D0, FIELD[2] - 8, at(t, T_STRINGEND) ? "grin" : at(t, T_LETGO) ? "smile" : at(t, T_KITEMAN) ? "smile_closed" : "smile", held ? { wave: 1 } : { wave: 0.4 });
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  setStageLight(cam, SHOTS[id - 1].light);
  shots(id, t, cam, out);
  return out;
};
