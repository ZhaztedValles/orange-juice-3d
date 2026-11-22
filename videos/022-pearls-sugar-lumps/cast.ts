// The cast and hand-drawn props of the pearl story: Max Mayer (charcoal suit, grey hair and moustache), his Paris
// agent and the buyer, the postmen, the post clerk, the gang (Grizzard in a top hat, two others), the two detectives
// and the constable, Augustus Horne the piano maker, the running man, the boy, the mother and child of the analogy,
// passers-by. Drawn props: the sealed parcel and its lid, the open box, the sugar, the necklace, the matchbox, a pearl,
// the biscuit tin and the crown.
import { Pen, SKINS, Outfit, Expr, FrontOpts, SideOpts, townsfolk, fxBurst } from "../../src/engine/toon";
import { CamInfo, Stage, Who, lidAt, person, blob, setStageLight, viewOf } from "../../src/engine/cards";
import {
  D0, PY, RW, SHOTS, smooth, clamp01, OFF, DESK_Y, MAYER_AT, SHOP, COUNTER, DEN, CAFE, STATION, HIGH, POSTER, CHAIN, PAR, HOME,
  lidOff, swapOut, swapIn, chainX, dropAt, horneX, T_FOUND, T_SUGAR, T_HATTON, T_OWNED, T_MONA, T_SALE, T_FELL, T_POST, T_TIED,
  T_SEALS, T_BUT, T_GONE, T_OPENED2, T_SWAPPED, T_SEALED2, T_BOX, T_HEAVY, T_NOT, T_BISCUIT, T_RATTLES, T_NOONE, T_TEA,
  T_SUGAR2, T_FOOLED, T_CARRIED, T_REWARD, T_SCOTLAND, T_HUNTING, T_GRIZZARD, T_THIEF, T_KING, T_WATCHED, T_WEEKS, T_CAUGHT,
  T_NOTONE, T_HORNE, T_HIGHBURY, T_SAW, T_DROP, T_RUN, T_GAVE, T_BOY, T_MARBLE, T_TOOK, T_POLICE, T_GREAT, T_UNDONE, T_SMALL,
} from "./story";
import { PARY } from "./town";

const MAYER: Outfit = { jacket: "#3a3a48", pants: "#2e2e36", boots: "#1e1a1e", hat: "hair", hair: "#b8b4ac", moustache: "#9a9690", buttons: "#c9a24a", belt: null, skin: SKINS[1], build: "stout" };
const AGENT: Outfit = { jacket: "#6a5038", pants: "#4a4038", boots: "#2a1e18", hat: "hair", hair: "#3a2a20", moustache: "#3a2a20", belt: null, skin: SKINS[0] };
const BUYER: Outfit = { jacket: "#2e3a5e", pants: "#3a3440", boots: "#1e1a1e", hat: "tophat", moustache: "#5a4030", belt: null, skin: SKINS[2] };
const POSTMAN: Outfit = { jacket: "#3a5a9a", pants: "#2c2c34", boots: "#1e1a1e", hat: "cap", cap: "#3a5a9a", belt: "#6a4a2a", skin: SKINS[3] };
const POSTMAN2: Outfit = { ...POSTMAN, moustache: "#4a3426", skin: SKINS[1] };
const POSTMAN3: Outfit = { ...POSTMAN, skin: SKINS[0] };
const CLERK: Outfit = { jacket: "#2a3a6a", pants: "#3a3440", boots: "#1e1a1e", hat: "cap", cap: "#2a3a6a", buttons: "#c9a24a", moustache: "#5a4030", skin: SKINS[1] };
const GRIZ: Outfit = { jacket: "#4a3a5a", pants: "#2e2a34", boots: "#1e1a1e", hat: "tophat", moustache: "#2a1e18", buttons: "#c9a24a", belt: null, skin: SKINS[0], build: "stout" };
const LOCKETT: Outfit = { jacket: "#5a4a3a", pants: "#3a3440", boots: "#2a1e18", hat: "cap", cap: "#3a3440", belt: null, skin: SKINS[2] };
const SILVER: Outfit = { jacket: "#3d5a44", pants: "#3a3440", boots: "#1e1a1e", hat: "hair", hair: "#2a1e18", belt: null, skin: SKINS[1] };
const DET: Outfit = { jacket: "#6a6658", pants: "#3a3a40", boots: "#1e1a1e", hat: "cap", cap: "#4a4a44", belt: null, skin: SKINS[1] };
const DET2: Outfit = { jacket: "#5a5248", pants: "#2e2e36", boots: "#1e1a1e", hat: "cap", cap: "#3a3430", moustache: "#5a4030", belt: null, skin: SKINS[3] };
const COP: Outfit = { jacket: "#1e2a4a", pants: "#1e2a4a", boots: "#141218", hat: "cap", cap: "#1e2a4a", buttons: "#d8dde2", belt: "#141218", skin: SKINS[0] };
const HORNE: Outfit = { jacket: "#8a6a44", pants: "#3b3f52", boots: "#3a2a20", hat: "cap", cap: "#5a4a3a", moustache: "#6a4a30", belt: null, skin: SKINS[1] };
const RUNNER: Outfit = { jacket: "#2c2c34", pants: "#3a3440", boots: "#1e1a1e", hat: "cap", cap: "#2c2c34", belt: null, skin: SKINS[2] };
const BOY: Outfit = { jacket: "#c25a3a", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#5a4a3a", skin: SKINS[0], build: "kid" };
const KID: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#6a4028", skin: SKINS[0], build: "kid" };
const MUM: Outfit = { jacket: "#8a4a5a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#5a3a26", dress: "#5a6a8a", skin: SKINS[0] };
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7].map(townsfolk);
const INKC = "#241726";

// ---------------- drawings ----------------
/** the sealed parcel (400 x 300): brown paper, string both ways, red wax seals */
const drawParcel = (p: Pen) => {
  p.poly([[30, 70], [370, 70], [370, 270], [30, 270]], "#b88a5a", 8);
  p.poly([[30, 70], [90, 30], [400 - 30, 30], [370, 70]], "#c99c6a", 7);
  p.line([[200, 30], [200, 270]], "#e8dcc0", 9);
  p.line([[30, 170], [370, 170]], "#e8dcc0", 9);
  for (const [x, y] of [[200, 170], [90, 120], [310, 120], [90, 230], [310, 230]]) p.ell(x, y, 22, 20, "#b02a2a", 5);
};
/** the opened box (400 x 300): its dark inside, the sides, and (sugar) a heap of white lumps */
const drawBox = (sugar: boolean) => (p: Pen) => {
  p.poly([[40, 110], [360, 110], [340, 280], [60, 280]], "#a87a4a", 8);
  p.poly([[40, 110], [80, 60], [320, 60], [360, 110]], "#4a3022", 7);
  if (sugar) for (let k = 0; k < 11; k++) {
    const x = 105 + (k % 4) * 52 + (k > 7 ? 26 : 0), y = 98 - Math.floor(k / 4) * 22;
    p.poly([[x, y], [x + 40, y - 6], [x + 46, y + 22], [x + 6, y + 28]], k % 2 ? "#f6f4ee" : "#ebe8e0", 5);
  }
};
/** the heap of sugar alone (300 x 160), drawn into the box in the swap */
const drawSugar = (p: Pen) => {
  for (let k = 0; k < 9; k++) {
    const x = 30 + (k % 4) * 60 + (k > 3 ? 30 : 0), y = 110 - Math.floor(k / 4) * 34;
    p.poly([[x, y], [x + 46, y - 6], [x + 52, y + 28], [x + 6, y + 34]], k % 2 ? "#f6f4ee" : "#ebe8e0", 5);
  }
};
/** the necklace (420 x 300): a loop of sixty-one pink pearls with its clasp, on a velvet tray when `tray` */
const drawNecklace = (tray: boolean) => (p: Pen) => {
  if (tray) p.poly([[20, 60], [400, 60], [380, 280], [40, 280]], "#2f3a6a", 8);
  for (let i = 0; i < 31; i++) {
    const a = Math.PI * (0.05 + 0.9 * (i / 30)), x = 210 - 150 * Math.cos(a), y = 110 + 120 * Math.sin(a);
    p.ell(x, y, 13, 13, i % 3 ? "#f8e2dc" : "#f2d4cc", 4);
  }
  p.ell(210, 92, 16, 12, "#e0b040", 4);
};
/** the open matchbox (300 x 260): the drawer pulled out, pearls spilling */
const drawMatchbox = (p: Pen) => {
  p.poly([[40, 120], [230, 120], [230, 230], [40, 230]], "#d8a040", 7);
  p.poly([[60, 135], [210, 135], [210, 215], [60, 215]], "#3a5a9a", 5);
  p.poly([[110, 40], [290, 40], [290, 140], [110, 140]], "#e8d8b0", 7);
  p.poly([[124, 52], [276, 52], [276, 128], [124, 128]], "#c9b48a", 4);
  for (let i = 0; i < 7; i++) p.ell(150 + (i % 4) * 34, 78 + Math.floor(i / 4) * 30, 14, 14, "#f8e2dc", 4);
};
/** the broken string spilling out (360 x 160) */
const drawString = (p: Pen) => {
  for (let i = 0; i < 12; i++) p.ell(30 + i * 27, 80 + 34 * Math.sin(i * 0.7), 12, 12, i % 3 ? "#f8e2dc" : "#f2d4cc", 4);
};
/** one pearl (100 x 100) */
const drawPearl = (p: Pen) => { p.ell(50, 50, 34, 34, "#f8e6e0", 6); p.ell(40, 40, 9, 9, "#ffffff", 0); };
/** the biscuit tin (300 x 240): blue drum, gold bands, a lid */
const drawTin = (p: Pen) => {
  p.poly([[40, 60], [260, 60], [260, 210], [40, 210]], "#3a62a8", 8);
  p.ell(150, 60, 112, 26, "#c9a24a", 7);
  p.line([[40, 120], [260, 120]], "#e0c060", 10);
  p.line([[40, 175], [260, 175]], "#e0c060", 10);
};
/** a cartoon crown (260 x 180) */
const drawCrown = (p: Pen) => {
  p.poly([[20, 160], [240, 160], [250, 40], [190, 100], [130, 20], [70, 100], [10, 40]], "#e8b830", 8);
  for (const x of [70, 130, 190]) p.ell(x, 130, 14, 14, "#b02a2a", 4);
};

// ---------------- staging helpers ----------------
const who = (i: number, o: Outfit, okey: string) => ({ i, o, okey } as Who);
const front = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, expr: Expr, extra: FrontOpts = {}, shadow = true, scale = 1) => {
  out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i), ...extra }, {}, scale));
  if (shadow) blob(out, x, y, z, scale);
};
/** someone walking along x (dir +1 / -1) at v m/s: side view (or front stroll when seen head-on) */
const walk = (cam: CamInfo, t: number, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, dir: number, v: number, expr: Expr) => {
  const vw = viewOf(cam, x, z, dir, 0), phase = (t * v * 1.25) % 1;
  if (vw.side) {
    const so: SideOpts = { mode: "march", phase, expr, blink: lidAt(t, i), stride: Math.max(0.3, vw.fs) * Math.min(1, v / 1.6) };
    out.places.push(person(cam, who(i, o, okey), x, y, z, { side: true, mirror: vw.mirror }, {}, so));
  } else out.places.push(person(cam, who(i, o, okey), x, y, z, { side: false, mirror: false }, { mode: "stroll", phase, expr, blink: lidAt(t, i) }, {}));
  blob(out, x, y, z);
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
const [OX, , OZ] = OFF;

// ---------------- the shots ----------------
const shots = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const [MX, MY, MZ] = MAYER_AT;
  if (id === 1) { // the hook: Mayer and the box of sugar
    front(cam, t, out, 1, MAYER, "mayer", MX, MY, MZ, at(t, T_SUGAR) ? "shock" : at(t, T_FOUND) ? "nervous" : "smile", at(t, T_SUGAR) ? { wave: 1 } : {});
    card(out, "boxSugar", 400, 300, drawBox(true), OX, DESK_Y + 0.16, OZ + 0.05, 0.5, 0.375);
    return;
  }
  if (id === 2) { // Hatton Garden: Mayer proud at his shop door, passers-by
    front(cam, t, out, 1, MAYER, "mayer", SHOP[0], PY, SHOP[2], at(t, T_OWNED) ? "grin" : "smile", at(t, T_HATTON) && !at(t, T_OWNED) ? { wave: 0.7 } : {});
    walk(cam, t, out, 30, FOLK[2], "f2", SHOP[0] - 4 + 1.1 * (t - 5), PY, -4.8, 1, 1.1, "smile");
    walk(cam, t, out, 31, FOLK[5], "f5", SHOP[0] + 9 - 1.0 * (t - 5), PY, 5.0, -1, 1.0, "neutral");
    walk(cam, t, out, 32, FOLK[7], "f7", SHOP[0] - 6 + 1.2 * (t - 5), PY, 5.4, 1, 1.2, "smile_closed");
    return;
  }
  if (id === 3) { // the necklace on its tray; Mayer beams
    front(cam, t, out, 1, MAYER, "mayer", MX, MY, MZ, at(t, T_MONA) ? "laugh" : "grin");
    card(out, "necklaceTray", 420, 300, drawNecklace(true), OX, DESK_Y + 0.12, OZ + 0.1, 0.56, 0.4);
    return;
  }
  if (id === 4) { // Paris: the agent shows the necklace, the buyer says no
    const [AX, , AZ] = PAR;
    const shake = at(t, T_FELL) ? 7 * Math.sin((t - T_FELL) * 14) * Math.max(0, 1 - (t - T_FELL) / 1.2) : 0;
    front(cam, t, out, 2, AGENT, "agent", AX - 0.8, PARY, AZ, at(t, T_FELL) ? "nervous" : "smile");
    front(cam, t, out, 3, BUYER, "buyer", AX + 0.75, PARY, AZ + 0.3, at(t, T_SALE) ? "stern" : "neutral", { headTilt: shake });
    const [cx, cz] = toCam(cam, AX - 0.35, AZ, 0.35);
    card(out, "necklaceCase", 420, 300, drawNecklace(true), cx, PARY + 1.1, cz, 0.48, 0.34);
    return;
  }
  if (id === 5) { // the postman brings the parcel to Mayer's door
    const x = Math.max(SHOP[0] + 1.0, SHOP[0] + 5.5 - 1.3 * (t - 13.0)), moving = x > SHOP[0] + 1.0;
    if (moving) walk(cam, t, out, 10, POSTMAN, "postman", x, PY, -5.2, -1, 1.3, "smile");
    else front(cam, t, out, 10, POSTMAN, "postman", x, PY, -5.2, at(t, T_TIED) ? "grin" : "smile");
    front(cam, t, out, 1, MAYER, "mayer", SHOP[0] - 0.2, PY, SHOP[2], at(t, T_POST) ? "grin" : "smile", at(t, T_TIED) ? { wave: 0.5 } : {});
    const [cx, cz] = toCam(cam, x - 0.3, -5.2, 0.3);
    card(out, "parcel", 400, 300, drawParcel, cx, PY + 1.0, cz, 0.42, 0.32);
    return;
  }
  if (id === 6) { // the desk: the lid comes off; sugar
    front(cam, t, out, 1, MAYER, "mayer", MX, MY, MZ, at(t, T_GONE) ? "shock" : at(t, T_BUT) ? "nervous" : at(t, T_SEALS) ? "grin" : "smile", at(t, T_GONE) ? { wave: 1 } : {});
    card(out, "boxSugar", 400, 300, drawBox(true), OX, DESK_Y + 0.16, OZ + 0.05, 0.5, 0.375);
    const u = lidOff(t);
    if (u < 0.999) card(out, "parcel", 400, 300, drawParcel, OX - 0.9 * u, DESK_Y + 0.17 + 1.1 * u, OZ + 0.12, 0.52, 0.39, { rot: 0.5 * u });
    return;
  }
  if (id === 7) { // dusk: the swap at the gang's table
    front(cam, t, out, 4, GRIZ, "griz", DEN[0] - 0.4, PY, DEN[2] + 0.1, at(t, T_SEALED2) ? "laugh" : at(t, T_SWAPPED) ? "grin" : "smile_closed");
    front(cam, t, out, 5, LOCKETT, "lockett", DEN[0] + 0.75, PY, DEN[2] + 0.2, at(t, T_SEALED2) ? "grin" : at(t, T_OPENED2) ? "whistle" : "neutral", at(t, T_SWAPPED) && !at(t, T_SEALED2) ? { wave: 0.6 } : {});
    const ty = PY + 0.9, tz = DEN[2] - 0.75, [bx, bz] = toCam(cam, DEN[0] + 0.1, tz, 0.05);
    card(out, "boxEmpty", 400, 300, drawBox(false), bx, ty + 0.18, bz, 0.56, 0.42);
    const o = swapOut(t);
    const [gx, gz] = toCam(cam, DEN[0] + 0.75, DEN[2] + 0.2, 0.3), [sx, sz] = toCam(cam, DEN[0] + 0.1, tz, 0.12);
    if (o < 0.999) card(out, "necklace", 420, 300, drawNecklace(false), sx + (gx - sx) * o, ty + 0.34 - 0.6 * o, sz + (gz - sz) * o, 0.4 * (1 - 0.8 * o), 0.29 * (1 - 0.8 * o));
    const s = swapIn(t);
    card(out, "sugar", 300, 160, drawSugar, sx, ty + 0.3 + 0.3 * (1 - s), sz, 0.34 * s, 0.18 * s);
    return;
  }
  if (id === 8) { // the post counter: the clerk weighs the parcel by hand
    front(cam, t, out, 11, CLERK, "clerk", COUNTER[0], PY, COUNTER[2] - 0.8, at(t, T_NOT) ? "smile_closed" : at(t, T_HEAVY) ? "grin" : "smile", { wave: 0.5 });
    front(cam, t, out, 33, FOLK[1], "f1", COUNTER[0] + 1.9, PY, COUNTER[2] + 1.0, at(t, T_HEAVY) ? "smile" : "neutral");
    const heft = at(t, T_HEAVY) ? 0.08 * Math.sin((t - T_HEAVY) * 9) * Math.max(0, 1 - (t - T_HEAVY) / 1.5) : 0;
    card(out, "parcel", 400, 300, drawParcel, COUNTER[0] + 0.3, PY + 1.32 + heft, COUNTER[2] - 0.05, 0.42, 0.32);
    void T_BOX;
    return;
  }
  if (id === 9) { // the analogy: the boy shakes the biscuit tin, his mother laughs
    const [HX, , HZ] = HOME;
    front(cam, t, out, 12, KID, "kid", HX + 0.4, D0, HZ - 1.0, at(t, T_NOONE) ? "grin" : at(t, T_RATTLES) ? "laugh" : "smile", { wave: 0.6 });
    front(cam, t, out, 13, MUM, "mum", HX - 0.6, D0, HZ - 1.3, at(t, T_TEA) ? "smile_closed" : at(t, T_NOONE) ? "grin" : "smile");
    const shake = at(t, T_BISCUIT) && !at(t, T_NOONE) ? 0.22 * Math.sin((t - T_BISCUIT) * 26) : 0;
    const [cx, cz] = toCam(cam, HX + 0.4, HZ - 1.0, 0.45);
    card(out, "tin", 300, 240, drawTin, cx + 0.3 + 0.06 * shake, D0 + 0.98 + 0.04 * Math.abs(shake), cz, 0.3, 0.24, { rot: shake });
    return;
  }
  if (id === 10) { // three postmen pass the parcel along
    const px = chainX(t);
    for (let k = 0; k < 3; k++) {
      const x = CHAIN[0] + 1.15 - 1.15 * k, near = Math.abs(px - x) < 0.4;
      front(cam, t, out, 14 + k, [POSTMAN, POSTMAN2, POSTMAN3][k], `post${k}`, x, PY, CHAIN[2], near ? "grin" : at(t, T_FOOLED) ? "smile" : "smile_closed", near ? { wave: 0.5 } : {});
    }
    const [cx, cz] = toCam(cam, px, CHAIN[2], 0.35);
    card(out, "parcel", 400, 300, drawParcel, cx, PY + 1.05 + 0.12 * Math.abs(Math.sin((px - CHAIN[0]) * 1.31)), cz, 0.4, 0.3);
    void T_SUGAR2; void T_CARRIED;
    return;
  }
  if (id === 11) { // the reward poster; the detectives set off
    if (!at(t, T_HUNTING)) {
      front(cam, t, out, 17, DET, "det", POSTER[0] - 0.9, PY, -5.5, at(t, T_SCOTLAND) ? "stern" : at(t, T_REWARD) ? "shock" : "neutral");
      front(cam, t, out, 18, DET2, "det2", POSTER[0] + 0.6, PY, -5.2, at(t, T_SCOTLAND) ? "grin" : "neutral");
    } else {
      const d = 1.6 * (t - T_HUNTING + 0.07);
      walk(cam, t, out, 17, DET, "det", POSTER[0] - 0.9 - d, PY, -5.5, -1, 1.6, "stern");
      walk(cam, t, out, 18, DET2, "det2", POSTER[0] + 0.6 - d, PY, -5.2, -1, 1.6, "stern");
    }
    return;
  }
  if (id === 12) { // dusk: Grizzard at his door; a crown on "King"
    front(cam, t, out, 4, GRIZ, "griz", DEN[0] + 0.2, PY, DEN[2] + 0.2, at(t, T_KING) ? "laugh" : at(t, T_THIEF) ? "grin" : "smile_closed", at(t, T_GRIZZARD) && !at(t, T_THIEF) ? { wave: 0.6 } : {});
    front(cam, t, out, 5, LOCKETT, "lockett", DEN[0] + 1.3, PY, DEN[2] + 0.5, at(t, T_KING) ? "grin" : "neutral");
    const g = smooth((t - T_KING + 0.1) / 0.35);
    card(out, "crown", 260, 180, drawCrown, DEN[0] + 0.2, PY + 2.25 + 0.03 * Math.sin(t * 4), DEN[2] + 0.25, 0.42 * g, 0.29 * g);
    const b = (t - T_KING + 0.1) / 0.4;
    if (b > 0 && b < 1) { const k = Math.round(b * 24) / 24; card(out, `burst|${k}`, 500, 500, (p) => fxBurst(p, k, "#fff3b0", 8, 30, 200), DEN[0] + 0.2, PY + 2.25, DEN[2] + 0.3, 0.7, 0.7); }
    return;
  }
  if (id === 13) { // a detective watches the gang at the café table
    front(cam, t, out, 4, GRIZ, "griz", CAFE[0] + 0.4, PY, CAFE[2] + 0.35, at(t, T_WEEKS) ? "laugh" : "grin");
    front(cam, t, out, 6, SILVER, "silver", CAFE[0] + 1.25, PY, CAFE[2] + 0.1, at(t, T_WATCHED) ? "smile_closed" : "smile");
    front(cam, t, out, 17, DET, "det", CAFE[0] - 0.9, D0, 3.0, at(t, T_WEEKS) ? "smile_closed" : "stern", { look: 0.4 });
    return;
  }
  if (id === 14) { // the station: caught; but no pearls
    const k = smooth((t - T_CAUGHT + 0.25) / 0.3), shrug = at(t, T_NOTONE);
    const gang: [Outfit, string, number][] = [[GRIZ, "griz", 4], [LOCKETT, "lockett", 5], [SILVER, "silver", 6]];
    gang.forEach(([o, key, i], j) => front(cam, t, out, i, o, key, STATION[0] - 0.9 + 0.9 * j, PY, STATION[2] - 0.6,
      shrug ? (j === 0 ? "smile_closed" : "grin") : at(t, T_CAUGHT) ? "shock" : "smile", shrug ? { wave: 0.9 } : at(t, T_CAUGHT) ? { wave: 1 } : {}));
    front(cam, t, out, 17, DET, "det", STATION[0] - 1.7 + 0.5 * k, PY, STATION[2] + 0.4, shrug ? "dazed" : at(t, T_CAUGHT) ? "stern" : "neutral", at(t, T_CAUGHT) && !shrug ? { wave: 0.8 } : {});
    front(cam, t, out, 18, DET2, "det2", STATION[0] + 1.7 - 0.5 * k, PY, STATION[2] + 0.4, shrug ? "pained" : at(t, T_CAUGHT) ? "stern" : "neutral");
    front(cam, t, out, 19, COP, "cop", STATION[0] + 1.35, PY, STATION[2] + 1.0, shrug ? "dazed" : "stern");
    return;
  }
  if (id === 15) { // two weeks later: Horne strolls through Highbury
    walk(cam, t, out, 20, HORNE, "horne", horneX(t), PY, HIGH[2], 1, 0.55, at(t, T_HIGHBURY) ? "whistle" : at(t, T_HORNE) ? "smile" : "smile_closed");
    return;
  }
  if (id === 16) { // the man drops the matchbox and runs; Horne stares
    const u = dropAt(t), run = at(t, T_RUN - 0.3), rx = HIGH[0] - 1.3 - (run ? 3.2 * (t - T_RUN + 0.37) : 0);
    if (run) walk(cam, t, out, 21, RUNNER, "runner", rx, PY, RW + 0.6, -1, 3.2, "nervous");
    else front(cam, t, out, 21, RUNNER, "runner", rx, PY, RW + 0.6, at(t, T_DROP) ? "nervous" : "neutral");
    front(cam, t, out, 20, HORNE, "horne", HIGH[0] - 0.1, PY, HIGH[2] + 0.4, at(t, T_DROP) ? "shock" : at(t, T_SAW) ? "dazed" : "smile_closed");
    const y = PY + 0.95 - (PY + 0.95 - (D0 + 0.05)) * u * u;
    const x = HIGH[0] - 1.35 - 0.25 * u, z = RW + 0.3 - 0.5 * u;
    card(out, "matchboxShut", 300, 260, drawMatchbox, x, y, z, 0.12, 0.1, { rot: 2.5 * u });
    return;
  }
  if (id === 17) { // the gutter: the open matchbox and the broken string
    card(out, "matchbox", 300, 260, drawMatchbox, HIGH[0] - 1.6, D0 + 0.012, RW - 0.22, 0.24, 0.21, { flat: true, rot: 0.3 });
    card(out, "string", 360, 160, drawString, HIGH[0] - 1.42, D0 + 0.014, RW - 0.35, 0.3, 0.13, { flat: true, rot: -0.2 });
    return;
  }
  if (id === 18) { // Horne gives the boy a pearl, then goes to the constable
    const turn = at(t, T_TOOK);
    front(cam, t, out, 20, HORNE, "horne", HIGH[0] + 0.2, PY, HIGH[2] + 0.1, turn ? "smile" : at(t, T_BOY) ? "grin" : "smile_closed", { wave: 0.5, look: turn ? -0.5 : 0.4 });
    front(cam, t, out, 22, BOY, "boy", HIGH[0] + 0.9, PY, HIGH[2] - 0.1, at(t, T_MARBLE) ? "laugh" : at(t, T_BOY) ? "grin" : "smile", at(t, T_MARBLE) ? { wave: 0.8 } : {});
    front(cam, t, out, 19, COP, "cop", HIGH[0] - 0.55, PY, HIGH[2] + 0.4, at(t, T_POLICE) ? "shock" : "neutral");
    const g = clamp01((t - T_GAVE + 0.1) / 0.6), [cx, cz] = toCam(cam, HIGH[0] + 0.45 + 0.3 * g, HIGH[2], 0.35);
    card(out, "pearl", 100, 100, drawPearl, cx, PY + 1.0 + 0.12 * Math.sin(Math.PI * g) + (at(t, T_MARBLE) ? 0.05 * Math.abs(Math.sin((t - T_MARBLE) * 6)) : 0), cz, 0.07, 0.07);
    const [mx, mz] = toCam(cam, HIGH[0] - 0.15 - (turn ? 0.25 * smooth((t - T_TOOK) / 0.5) : 0), HIGH[2] + 0.1, 0.35);
    card(out, "matchbox", 300, 260, drawMatchbox, mx, PY + 0.98, mz, 0.16, 0.14);
    return;
  }
  // id 19 (golden): the pearls back on the desk beside the matchbox; Mayer laughs
  front(cam, t, out, 1, MAYER, "mayer", MX, MY, MZ, at(t, T_UNDONE) ? "laugh" : at(t, T_GREAT) ? "grin" : "smile", at(t, T_SMALL) ? { wave: 0.8 } : {});
  card(out, "necklaceTray", 420, 300, drawNecklace(true), OX - 0.2, DESK_Y + 0.12, OZ + 0.1, 0.5, 0.36);
  card(out, "matchbox", 300, 260, drawMatchbox, OX + 0.42, DESK_Y + 0.09, OZ + 0.2, 0.24, 0.21);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  setStageLight(cam, SHOTS[id - 1].light);
  shots(id, t, cam, out);
  return out;
};
void T_GONE; void T_HUNTING;
