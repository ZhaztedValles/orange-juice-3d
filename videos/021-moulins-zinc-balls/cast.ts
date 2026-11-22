// The cast and hand-drawn props of the zinc-ball story: Delort (brown coat, top hat, grey moustache), Robert (navy
// coat; a farmer's blue smock upstream), Vonoven (bottle-green coat, dark hair, moustache) and his helper, the post
// clerk and the queue in Moulins, the soldiers on the banks (no weapons), the Parisians on the quay, the crowd at the
// parade rope, the fisherman, the postman, the grandmother and her grandson. Drawn props: the stack of letters that
// goes into the ball, the franc, the splash and its rings, the old letter.
import { Pen, SKINS, Outfit, Expr, FrontOpts, townsfolk, fxSplash, fxRing, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, lidAt, person, blob, setStageLight } from "../../src/engine/cards";
import {
  D0, WY, RW, NET_X, SHOTS, smooth, TABLE, POST, JETTY, ROPE, UP, VON, BOAT, DOOR, BALL_R, F_SO, F_SLOW, ropeLeanAt, ropeTipAt,
  T_PRUSSIAN, T_NO, T_THREE, T_DELORT, T_ROBERT, T_VONOVEN, T_STRANGE, T_PLAN, T_PAID, T_FRANC, T_ONE, T_HUNDREDS, T_SEALED,
  T_ZINC, T_SPIN, T_FARMER, T_SLIPPED, T_UPSTREAM, T_SOLDIERS, T_NOTHING, T_STRETCHED, T_NET, T_WAITED, T_DAY, T_EMPTY,
  T_TORN, T_POSTS, T_COLD, T_ICE, T_BUT, T_PUSHES, T_CROWD, T_ROPE, T_GAVE, T_STUCK, T_SIEGE, T_ENDED, T_ARRIVED, T_KEPT,
  T_CENTURY, T_EIGHTY, T_FINALLY, T_REACHED, T_GRAND, T_WRITTEN,
} from "./story";

const DELORT: Outfit = { jacket: "#6a5038", pants: "#4a4038", boots: "#2a1e18", hat: "tophat", moustache: "#9a9690", belt: null, skin: SKINS[1], build: "stout" };
const ROBERT: Outfit = { jacket: "#2e3a5e", pants: "#3a3440", boots: "#1e1a1e", hat: "cap", cap: "#3a3440", moustache: "#4a3424", skin: SKINS[0] };
const FARMER: Outfit = { jacket: "#4f78b0", pants: "#5a4a3a", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", moustache: "#4a3424", belt: null, skin: SKINS[0] };
const VONOVEN: Outfit = { jacket: "#3d5a44", pants: "#3a3440", boots: "#1e1a1e", hat: "hair", hair: "#3a2a20", moustache: "#3a2a20", buttons: "#c9a24a", skin: SKINS[2] };
const HELPER: Outfit = { jacket: "#8a6a44", pants: "#3b3f52", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", skin: SKINS[3] };
const CLERK: Outfit = { jacket: "#2a3a6a", pants: "#3a3440", boots: "#1e1a1e", hat: "cap", cap: "#2a3a6a", buttons: "#c9a24a", moustache: "#5a4030", skin: SKINS[1] };
const SOLDIER: Outfit = { jacket: "#30395a", pants: "#2c2c34", boots: "#1e1a1e", hat: "cap", cap: "#30395a", belt: "#e8e2d2", buttons: "#c9a24a", skin: SKINS[0] };
const SOLDIER2: Outfit = { ...SOLDIER, moustache: "#4a3426", skin: SKINS[2] };
const FISHER: Outfit = { jacket: "#b5653f", pants: "#3b3f52", boots: "#3a2a20", hat: "cap", cap: "#3a4a5a", skin: SKINS[1] };
const POSTMAN: Outfit = { jacket: "#3a5a9a", pants: "#2c2c34", boots: "#1e1a1e", hat: "cap", cap: "#3a5a9a", belt: "#6a4a2a", skin: SKINS[3] };
const GRAN: Outfit = { jacket: "#6a4a6a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#d8d4cc", dress: "#5a6a8a", skin: SKINS[0] };
const KIDO: Outfit = { jacket: "#c25a3a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#6a4028", skin: SKINS[0], build: "kid" };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);
const INKC = "#241726";

// ---------------- drawings ----------------
/** a fan of letters (300 x 240) */
const drawLetters = (p: Pen) => {
  for (let k = 0; k < 4; k++) {
    p.rot = [(-12 + k * 8) * Math.PI / 180, 150, 200];
    p.poly([[40, 60 + k * 6], [260, 60 + k * 6], [260, 200 + k * 6], [40, 200 + k * 6]], ["#f4ecd6", "#ead9b4", "#f0e2c2", "#e6d2a8"][k], 7);
    p.line([[40, 60 + k * 6], [150, 140 + k * 6], [260, 60 + k * 6]], INKC, 5, false);
  }
  p.rot = null;
};
/** one old letter (240 x 170): yellowed envelope, a red stamp */
const drawLetter = (p: Pen) => {
  p.poly([[10, 10], [230, 10], [230, 160], [10, 160]], "#ead9b0", 7);
  p.line([[10, 10], [120, 92], [230, 10]], INKC, 5, false);
  p.poly([[176, 22], [214, 22], [214, 62], [176, 62]], "#c0443a", 4);
  p.line([[40, 120], [150, 120]], "#7a6a54", 5, false);
  p.line([[40, 138], [120, 138]], "#7a6a54", 5, false);
};
/** a franc (200 x 200): a silver coin */
const drawCoin = (p: Pen) => {
  p.ell(100, 100, 84, 84, "#d8dde2", 8);
  p.ell(100, 100, 60, 60, "#c3c9cf", 5);
  p.ell(100, 100, 14, 14, "#9aa2aa", 0);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true, scale = 1) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, scale));
  if (shadow) blob(out, x, y, z, scale);
};
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false, flat = false) => {
  if (w > 0.004 && h > 0.004) out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft, ...(flat ? { flat: true } : {}) });
};
const at = (t: number, t0: number) => t >= t0 - 0.07;
const q24 = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 24) / 24;
/** the splash where a ball goes in at (x, z), starting at t0 */
const splash = (out: Stage, t: number, t0: number, x: number, z: number, s = 1) => {
  const u = (t - t0) / 0.8;
  if (u > 0 && u < 1) { const k = q24(u); card(out, `splash|${k}`, 800, 800, (p) => fxSplash(p, k), x, WY + 0.32 * s, z, 0.9 * s, 0.9 * s); }
  const v = (t - t0) / 1.6;
  if (v > 0 && v < 1) { const k = q24(v); card(out, `ring|${k}`, 600, 600, (p) => fxRing(p, k), x, WY + 0.02, z, 1.6 * s, 1.6 * s, false, true); }
};
/** Vonoven and his helper on the south bank by the net post */
const keepers = (cam: CamInfo, t: number, out: Stage, ev: Expr, eh: Expr, extra: FrontOpts = {}, hx = 1.2) => {
  front(cam, t, out, 3, VONOVEN, "vonoven", VON[0], D0, VON[2], ev, extra);
  front(cam, t, out, 7, HELPER, "helper", VON[0] + hx, D0, VON[2] + 0.5, eh);
};

// ---------------- the shots ----------------
const shots = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const f = Math.round(t * 30);
  if (id === 1) return; // the riverbed: only the ball
  if (id === 2) { // Paris across the river; soldiers posted along the south bank
    for (let k = 0; k < 7; k++) front(cam, t, out, 20 + k, k % 2 ? SOLDIER2 : SOLDIER, k % 2 ? "sold2" : "sold", 14 + k * 1.0, D0, RW + 2.5 + (k % 2) * 0.5, at(t, T_NO) ? "stern" : "neutral");
    void T_PRUSSIAN;
    return;
  }
  if (id === 3) { // the three men round the ball on the table in Moulins
    const [TX, , TZ] = TABLE;
    front(cam, t, out, 1, DELORT, "delort", TX - 0.95, D0, TZ - 0.85, at(t, T_PLAN) ? "grin" : at(t, T_DELORT) ? "smile" : "smile_closed", at(t, T_DELORT) && !at(t, T_ROBERT) ? { wave: 0.7 } : {});
    front(cam, t, out, 2, ROBERT, "robert", TX, D0, TZ - 1.0, at(t, T_STRANGE) ? "grin" : at(t, T_ROBERT) ? "smile" : "neutral", at(t, T_ROBERT) && !at(t, T_VONOVEN) ? { wave: 0.7 } : {});
    front(cam, t, out, 3, VONOVEN, "vonoven", TX + 0.95, D0, TZ - 0.85, at(t, T_STRANGE) ? "laugh" : at(t, T_VONOVEN) ? "grin" : "smile_closed", at(t, T_VONOVEN) && !at(t, T_STRANGE) ? { wave: 0.7 } : {});
    void T_THREE;
    return;
  }
  if (id === 4) { // the queue at the Moulins post office: a whole franc for one letter
    front(cam, t, out, 4, CLERK, "clerk", POST[0], D0, POST[2] - 2.4, at(t, T_ONE) ? "smile" : at(t, T_FRANC) ? "grin" : "neutral");
    for (let k = 0; k < 7; k++) {
      const o = FOLK[(k * 3) % 8];
      front(cam, t, out, 30 + k, o, `f${(k * 3) % 8}`, POST[0] + 1.3 + k * 1.05, D0, POST[2] - 1.9 + k * 0.28, k === 0 ? (at(t, T_ONE) ? "nervous" : at(t, T_PAID) ? "grin" : "smile") : k % 3 ? "smile" : "neutral",
        k === 0 && at(t, T_PAID) ? { wave: 0.8 } : {});
    }
    const g = smooth((t - T_FRANC + 0.15) / 0.4);
    card(out, "coin", 200, 200, drawCoin, POST[0] + 1.0, D0 + 1.75 + 0.1 * Math.sin(t * 3), POST[2] - 1.6, 0.34 * g, 0.34 * g);
    return;
  }
  if (id === 5) { // the letters go into the ball; it is sealed and spins
    const [TX, , TZ] = TABLE;
    front(cam, t, out, 1, DELORT, "delort", TX - 0.25, D0, TZ - 1.05, at(t, T_SPIN) ? "laugh" : at(t, T_SEALED) ? "grin" : "smile", at(t, T_SEALED) && !at(t, T_ZINC) ? { wave: 0.6 } : {});
    const u = smooth((t - T_HUNDREDS + 0.1) / (T_SEALED - T_HUNDREDS));
    if (u < 0.98) card(out, "letters", 300, 240, drawLetters, TX + 0.05, D0 + 0.9 + BALL_R + 0.5 * (1 - u) + 0.05, TABLE[2] + 0.02, 0.36 * (1 - 0.9 * u), 0.29 * (1 - 0.9 * u));
    const b = (t - T_SEALED + 0.05) / 0.35;
    if (b > 0 && b < 1) { const k = q24(b); card(out, `burst|${k}`, 500, 500, (p) => fxBurst(p, k, "#fff3b0", 8, 30, 200), TX + 0.05, D0 + 0.9 + BALL_R, TZ + 0.1, 0.3, 0.3); }
    return;
  }
  if (id === 6) { // far upstream: Robert in a farmer's smock slips the ball into the Seine
    front(cam, t, out, 2, FARMER, "farmer", JETTY[0] - 0.05, JETTY[1], JETTY[2] - 0.3, at(t, T_UPSTREAM) ? "smile_closed" : at(t, T_SLIPPED) ? "nervous" : at(t, T_FARMER) ? "smile" : "neutral",
      at(t, T_SLIPPED) && !at(t, T_SLIPPED + 0.5) ? { wave: 0.4 } : {});
    splash(out, t, T_SLIPPED + 0.32, JETTY[0] - 0.55, JETTY[2] - 1.0, 0.8);
    for (let k = 0; k < 2; k++) front(cam, t, out, 20 + k, k ? SOLDIER2 : SOLDIER, k ? "sold2" : "sold", UP[0] - 7 - k * 1.4, D0, -RW - 2.6 - k * 0.3, "neutral");
    return;
  }
  if (id === 7) {
    if (f < F_SO) return; // the riverbed: only the ball
    // the soldiers stare at the empty water
    front(cam, t, out, 20, SOLDIER, "sold", UP[0] - 3, D0, -RW - 2.6, at(t, T_NOTHING) ? "whistle" : "neutral", { look: 0.3 });
    front(cam, t, out, 21, SOLDIER2, "sold2", UP[0] - 4.4, D0, -RW - 2.9, at(t, T_NOTHING) ? "dazed" : "neutral");
    void T_SOLDIERS;
    return;
  }
  if (id === 8) { // Vonoven by his net at Paris, waiting
    keepers(cam, t, out, at(t, T_WAITED) ? "smile_closed" : at(t, T_NET) ? "grin" : "smile", "neutral", at(t, T_STRETCHED) && !at(t, T_WAITED) ? { wave: 0.8 } : {});
    return;
  }
  if (id === 9) { // morning: the net comes up empty
    front(cam, t, out, 3, VONOVEN, "vonoven", NET_X + 1.2, D0, RW + 0.7, at(t, T_EMPTY) ? "nervous" : "neutral", { wave: 0.5 });
    front(cam, t, out, 7, HELPER, "helper", NET_X + 2.5, D0, RW + 1.0, at(t, T_EMPTY) ? "dazed" : "pained");
    void T_DAY;
    return;
  }
  if (id === 10) { // dusk: the ice rams the net, the posts tear out
    keepers(cam, t, out, at(t, T_TORN) ? "shock" : "nervous", at(t, T_POSTS) ? "shock" : "nervous", at(t, T_TORN) ? { wave: 1 } : {});
    return;
  }
  if (id === 11) { // the river full of ice; the two men shiver on the quay
    keepers(cam, t, out, at(t, T_ICE) ? "pained" : at(t, T_COLD) ? "nervous" : "neutral", "pained", {}, 0.9);
    return;
  }
  if (id === 12) { // the analogy: a crowd leans on a parade rope until the posts tip
    const lean = ropeLeanAt(t), tip = ropeTipAt(t);
    for (let k = 0; k < 9; k++) {
      const x = ROPE[0] - 2.6 + k * 0.65, z = ROPE[2] + 0.75 + (k % 3) * 0.55 - 0.45 * tip, o = FOLK[(k * 5 + 1) % 8];
      const e: Expr = at(t, T_ROPE) ? (k % 2 ? "shock" : "laugh") : at(t, T_CROWD) ? (k % 2 ? "grin" : "pained") : at(t, T_PUSHES) ? "grin" : "smile";
      front(cam, t, out, 40 + k, o, `r${(k * 5 + 1) % 8}`, x, D0, z, e, { tilt: -(4 + 6 * lean) * (k % 2 ? 1 : 0.8), ...(at(t, T_BUT) && k % 3 === 0 ? { wave: 0.7 } : {}) });
    }
    return;
  }
  if (id === 13) {
    if (f >= F_SLOW) return; // the riverbed: the balls in the mud
    keepers(cam, t, out, at(t, T_GAVE) ? "shock" : "nervous", at(t, T_GAVE) ? "shock" : "pained", at(t, T_GAVE) ? { wave: 1 } : {});
    void T_STUCK;
    return;
  }
  if (id === 14) { // the siege ends: Paris cheers; Vonoven alone at his empty net
    for (let k = 0; k < 8; k++) front(cam, t, out, 50 + k, FOLK[(k * 3 + 2) % 8], `p${(k * 3 + 2) % 8}`, NET_X - 4.2 + k * 0.62, D0, RW + 3.0 + (k % 2) * 0.7,
      at(t, T_ENDED) ? (k % 2 ? "laugh" : "grin") : "smile", at(t, T_ENDED) ? { wave: 0.6 + 0.4 * (k % 2) } : {});
    front(cam, t, out, 3, VONOVEN, "vonoven", VON[0], D0, VON[2], at(t, T_ARRIVED) ? "nervous" : at(t, T_SIEGE) ? "smile" : "smile_closed", at(t, T_ARRIVED) ? { wave: 0.3 } : {});
    return;
  }
  if (id === 15) { // years later: a fisherman lifts a muddy ball out of the river
    const lift = smooth((t - T_KEPT + 0.1) / 1.0);
    front(cam, t, out, 9, FISHER, "fisher", BOAT[0] - 0.2, WY + 0.1, BOAT[2] - 0.1, at(t, T_EIGHTY) ? "laugh" : at(t, T_CENTURY) ? "shock" : lift > 0.5 ? "grin" : "neutral", lift > 0.3 ? { wave: 0.9 } : {}, false);
    return;
  }
  if (id === 16) { // the postman hands the old letter to the grandmother and her grandson
    front(cam, t, out, 10, POSTMAN, "postman", DOOR[0] - 0.6, D0, DOOR[2] + 1.2, at(t, T_REACHED) ? "grin" : "smile", at(t, T_FINALLY) ? { wave: 0.4 } : {});
    front(cam, t, out, 11, GRAN, "gran", DOOR[0] + 0.25, D0, DOOR[2] + 0.55, at(t, T_WRITTEN) ? "relief" : at(t, T_GRAND) ? "shock" : "smile_closed");
    front(cam, t, out, 12, KIDO, "kid", DOOR[0] + 1.0, D0, DOOR[2] + 0.75, at(t, T_GRAND) ? "grin" : "smile");
    const u = smooth((t - T_REACHED + 0.1) / 0.8);
    card(out, "letter", 240, 170, drawLetter, DOOR[0] - 0.55 + 0.55 * u, D0 + 1.25, DOOR[2] + 1.05 - 0.3 * u, 0.32, 0.23);
    return;
  }
  // id 17: the riverbed
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  setStageLight(cam, SHOTS[id - 1].light);
  shots(id, t, cam, out);
  return out;
};
void F_SLOW; void T_ICE; void T_PLAN; void ROPE;
