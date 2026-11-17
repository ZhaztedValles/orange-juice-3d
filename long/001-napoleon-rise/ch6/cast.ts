// Chapter 6 cast: who stands where in every shot, plus the one-off effect cards (flying papers, sacks, dust, ballots,
// smoke and muzzle flashes, snow, the crown's sparkle, the campfire sparks). Shared presets come from ../shared/cast;
// chapter-only people (citizens, jurists, printers, police, senators, Russian-winter soldiers, the London cartoonist,
// coronation guests) are built here from the engine Outfit fields.
import { Pen, INK, SKINS, Expr, Outfit, FrontOpts, fxPuff, townsfolk } from "../../../src/engine/toon";
import { CamInfo, Stage, hh, q, lidAt, person, blob, setStageLight } from "../../../src/engine/cards";
import {
  Char, put, who, NAP_CADET, NAP_CONSUL, NAP_EMPEROR, NAP_EMPEROR_CROWN, NAP_ICON, NAP_GENERAL, NAP_CHILD, JOSEPHINE_EMPRESS, POPE, schoolboy,
  frenchSoldier, frenchOfficer, britishSoldier, savant, lawmaker, GOLD, FR_RED, FR_WHITE,
} from "../shared/cast";
import { horseCard, HORSE_COATS } from "../shared/props";
import { ND_SPOTS } from "../shared/notredame";
import {
  FPS, SHOTS, EXT, INT, at, crownK, CROWN_ON, BOOK_LAND, PRESS_STOP, TEAR, stepY, Sd, Pr, Sn, St, Pa, S, F, W, napHel, WAT_X, BOY, smooth, clamp01, V3,
} from "./story";
import { SEN_ROW } from "./sets";

const C = (i: number, okey: string, o: Outfit, expr: Expr = "neutral", scale = 1): Char => ({ i, okey, o, expr, scale });
const POWDER = "#e7e2d8", NAP_HAIR = "#2b1f1c";

// ---------------- chapter people ----------------
/** Napoleon at his desk, hat off */
const NAP_DESK = C(NAP_CONSUL.i, "napDesk", { ...NAP_CONSUL.o, hat: "hair", hair: NAP_HAIR }, "stern");
/** Josephine at the altar before her own crowning: the empress's mantle, no crown yet */
const JOSEPHINE_CORONATION = C(JOSEPHINE_EMPRESS.i, "josephineCor", { ...JOSEPHINE_EMPRESS.o, hat: "hair", hair: "#2a1a17" }, "smile_closed");
/** jurists drafting the Code: black gowns, white bands, powdered or grey hair */
const jurist = (v: number): Char => { const k = v % 3; return C(900 + k, `jur${k}`, { jacket: "#24222c", robe: "#24222c", pants: "#24222c", boots: INK, hat: "hair", hair: [POWDER, "#9a948c", "#5a3a22"][k], locks: [POWDER, "#9a948c", "#5a3a22"][k], lockLen: 0.35, lapels: "#f4f0e6", skin: SKINS[k], build: k === 1 ? "stout" : undefined }, "neutral"); };
/** Parisians of every rank (v 0..7): noble, peasant, baker, merchant, washerwoman, soldier's wife, clerk, old man */
const citizen = (v: number): Char => {
  const k = v % 8;
  const o: Outfit[] = [
    { jacket: "#c25a7a", pants: "#efe6d2", boots: INK, hat: "tricorne", cockade: null, hatTrim: GOLD, locks: POWDER, lockLen: 0.35, lapels: "#f2e3c0", buttons: GOLD, skin: SKINS[0] },
    { jacket: "#a8916a", pants: "#6a5a42", boots: "#4a3426", hat: "cap", cap: "#5a4636", beard: "#5a3b2a", skin: SKINS[1] },
    { jacket: "#f1ece0", pants: "#e2dac8", boots: "#4a3426", hat: "cap", cap: "#f6f2e8", moustache: "#3a2a20", skin: SKINS[2] },
    { jacket: "#3f5a46", pants: "#d8cfb8", boots: INK, hat: "tophat", lapels: "#e7dcc0", buttons: GOLD, build: "stout", skin: SKINS[0] },
    { jacket: "#e8dcc0", dress: "#5a8fc2", pants: "#5a8fc2", boots: "#4a3426", hat: "bonnet", skin: SKINS[1] },
    { jacket: "#d07a8a", dress: "#efe6d2", pants: "#efe6d2", boots: "#4a3426", hat: "hair", hair: "#3a2418", locks: "#3a2418", lockLen: 0.5, skin: SKINS[3] },
    { jacket: "#4a4f66", pants: "#d8cfb8", boots: INK, hat: "tophat", lapels: "#efe6cc", skin: SKINS[0] },
    { jacket: "#6b4a2e", pants: "#3b3f52", boots: "#4a3426", hat: "tricorne", cockade: null, locks: "#c9c4bc", lockLen: 0.3, skin: SKINS[2] },
  ];
  return C(910 + k, `cit${k}`, o[k], (["smile", "grin", "smile_closed", "smile", "grin", "smile_closed", "neutral", "smile"] as Expr[])[k]);
};
const SHOPKEEPER = C(920, "shopkeeper", { jacket: "#b5653f", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#5a3a22", lapels: "#efe6cc", buttons: GOLD, build: "stout", skin: SKINS[1], moustache: "#5a3a22" }, "grin");
const PRINTER = C(921, "printer", { jacket: "#ece2c8", pants: "#5a4636", boots: "#4a3426", hat: "cap", cap: "#f2ead8", lapels: "#8a6a4a", skin: SKINS[0], moustache: "#3a2a20" }, "smile");
const APPRENTICE = C(922, "apprentice", { jacket: "#d9c29a", pants: "#4a3a2a", boots: "#4a3426", hat: "hair", hair: "#b5653f", build: "teen", skin: SKINS[0] }, "smile_closed");
/** a police commissioner: black coat, tricolour sash, black fore-and-aft bicorne */
const POLICE = C(923, "police", { jacket: "#24222a", pants: "#2e2c36", boots: INK, hat: "bicorne_fa", hatCol: "#1d1b22", sash: "tricolour", lapels: "#24222a", collar: "#3a3644", buttons: "#c9c4bc", skin: SKINS[0], moustache: "#1f1715" }, "stern");
const SPY = C(924, "spy", { jacket: "#4a4650", pants: "#3b3f52", boots: INK, hat: "tophat", lapels: "#3a3644", skin: SKINS[2], moustache: "#2a1f1c" }, "stern");
const CRITIC = C(925, "critic", { jacket: "#2f5f6a", pants: "#d8cfb8", boots: INK, hat: "tophat", lapels: "#efe6cc", buttons: GOLD, skin: SKINS[0], locks: "#5a3a22", lockLen: 0.4 }, "stern");
const HUSBAND = C(926, "husband", { jacket: "#5a3f6e", pants: "#3b3f52", boots: INK, hat: "hair", hair: "#3a2418", lapels: "#eadbb4", buttons: GOLD, skin: SKINS[1], moustache: "#3a2418" }, "stern");
const WIFE = C(927, "wife", { jacket: "#2f8a6a", dress: "#f1e3c6", pants: "#f1e3c6", boots: "#4a3426", hat: "hair", hair: "#5a3a22", locks: "#5a3a22", lockLen: 0.6, skin: SKINS[0] }, "stern");
/** senators: dark blue coats with gold collars and lapels, white breeches, powdered or grey hair */
const senator = (v: number): Char => { const k = v % 4; return C(930 + k, `sen${k}`, { jacket: "#2c3a78", pants: FR_WHITE, boots: INK, hat: "hair", hair: [POWDER, "#9a948c", "#5a3a22", "#d9d4cc"][k], locks: [POWDER, "#9a948c", "#5a3a22", "#d9d4cc"][k], lockLen: 0.35, collar: GOLD, lapels: GOLD, buttons: GOLD, skin: SKINS[k], build: k === 2 ? "stout" : undefined }, (["neutral", "smile", "stern", "smile_closed"] as Expr[])[k]); };
/** prefects leaving the palace: blue coats with gold collars, fore-and-aft bicorne */
const prefect = (v: number): Char => { const k = v % 3; return C(940 + k, `pref${k}`, { ...senator(k).o, hat: "bicorne_fa", hatTrim: GOLD, sash: FR_RED }, "stern"); };
/** the retreat from Russia: grey-blue greatcoats, scarves (collar), forage caps or bicornes */
const frozen = (v: number): Char => { const k = v % 5; return C(950 + k, `frz${k}`, { jacket: ["#5f6a86", "#6a6a74", "#56607c", "#707688", "#5a5f70"][k], robe: ["#5f6a86", "#6a6a74", "#56607c", "#707688", "#5a5f70"][k], pants: "#d8d4c8", boots: INK, hat: k % 2 ? "cap" : "bicorne", cap: "#8c2f2f", collar: ["#b8483c", "#c9a24a", "#3f6fb5", "#b8483c", "#efe6d2"][k], rifle: k !== 2, skin: SKINS[k % 4], moustache: k === 1 || k === 3 ? "#3a2a20" : undefined, beard: k === 4 ? "#5a3b2a" : undefined }, k % 2 ? "pained" : "nervous"); };
/** the London cartoonist and two gentlemen laughing at his prints */
const CARTOONIST = C(960, "cartoonist", { jacket: "#5a3a2a", pants: "#d8cfb8", boots: INK, hat: "hair", hair: "#b5653f", locks: "#b5653f", lockLen: 0.4, lapels: "#d9b04a", buttons: GOLD, skin: SKINS[0] }, "laugh");
const gent = (v: number): Char => { const k = v % 2; return C(961 + k, `gent${k}`, { jacket: ["#2f3f5a", "#6a4a2e"][k], pants: ["#d8cfb8", "#3b3f52"][k], boots: INK, hat: "tophat", lapels: "#efe6cc", buttons: GOLD, build: k ? "stout" : undefined, skin: SKINS[k], moustache: k ? "#6a4228" : undefined }, "laugh"); };
/** coronation ladies, as chapter 1 */
const lady = (v: number): Char => {
  const k = v % 4;
  return C(350 + k, `lady${k}`, { jacket: ["#c25a7a", "#5a8fc2", "#e8b53e", "#7b5ac9"][k], dress: ["#f6f1e6", "#efe6d2", "#f6f1e6", "#e9e2f0"][k], pants: "#f6f1e6", boots: "#c9a46a",
    hat: "hair", hair: ["#2a1a17", "#d9b45c", "#5a3a22", "#1f1715"][k], locks: ["#2a1a17", "#d9b45c", "#5a3a22", "#1f1715"][k], lockLen: 0.6, skin: SKINS[[0, 0, 2, 1][k]] }, "smile_closed");
};
const GUESTS: Char[] = [frenchOfficer(0), lady(0), lawmaker(1), lady(1), frenchOfficer(1), lady(2), lawmaker(3), frenchOfficer(2), lady(3), lawmaker(0)];

// ---------------- effect drawings ----------------
const flake = (p: Pen) => p.ell(32, 32, 26, 26, "#ffffff", 0);
const sheet = (p: Pen) => {
  p.poly([[20, 30], [150, 30], [150, 200], [20, 200]], "#f4ecd8", 6);
  for (let y = 56; y < 184; y += 16) p.stroke([[36, y], [134, y + (y % 32 ? 2 : -2)]], 3, "rgba(60,50,70,0.7)");
};
const sack = (p: Pen) => {
  p.poly([[60, 70], [140, 70], [170, 180], [30, 180]], "#c9a46a", 6);
  p.stroke([[60, 70], [80, 46], [120, 46], [140, 70]], 6);
  p.ell(100, 128, 16, 16, GOLD, 4);
};
const keyCard = (p: Pen) => { p.ell(60, 60, 34, 34, null, 12); p.line([[88, 82], [180, 170]], GOLD, 14); p.line([[150, 140], [130, 160]], GOLD, 10); p.line([[170, 160], [152, 178]], GOLD, 10); };
const ballot = (p: Pen) => { p.poly([[20, 20], [108, 20], [108, 80], [20, 80]], "#f4ecd8", 5); p.stroke([[34, 40], [94, 40]], 3, "rgba(60,50,70,0.7)"); p.stroke([[34, 58], [80, 58]], 3, "rgba(60,50,70,0.7)"); };
const cushion = (p: Pen) => {
  p.poly([[30, 60], [370, 60], [390, 150], [10, 150]], "#a8213a", 7);
  p.stroke([[30, 66], [370, 66]], 7, GOLD);
  for (const x of [14, 386]) p.ell(x, 156, 12, 18, GOLD, 4);
};
const flash = (p: Pen, t: number) => {
  const r = 120 * (1 - t) + 30;
  p.poly([[250, 250 - r], [250 + r * 0.35, 250 - r * 0.25], [250 + r * 1.3, 250], [250 + r * 0.35, 250 + r * 0.25], [250, 250 + r], [250 - r * 0.3, 250 + r * 0.2], [250 - r * 0.8, 250], [250 - r * 0.3, 250 - r * 0.2]], "#fff1a8", 0);
};
const spark = (p: Pen) => p.ell(32, 32, 14, 20, "#ffd27a", 0);
const sparkle = (p: Pen, t: number) => {
  const a = 1 - t;
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + t, d = 60 + 150 * t, x = 250 + Math.cos(ang) * d, y = 250 + Math.sin(ang) * d * 0.7, r = 26 * a + 6;
    p.poly([[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], "#ffe58a", 0);
  }
};

// ---------------- helpers ----------------
type Out = Stage;
const fxAt = (out: Out, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, rot = 0, soft = false, flat = false) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h, rot, soft, flat });
/** a smoke puff growing and fading over `dur` s after t0, with a short flash at the start */
const puff = (out: Out, t: number, t0: number, x: number, y: number, z: number, dir: number, size = 2.4, dur = 1.6, withFlash = false) => {
  const u = (t - t0) / dur;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 30), sz = 0.3 + size * Math.sqrt(Math.min(1, u * 3)) + 0.4 * u;
  fxAt(out, `puff${uq}`, 300, 300, (p) => fxPuff(p, uq), x + dir * (0.6 + 0.9 * u), y + 0.25 * u, z, sz, sz, 0, true);
  if (withFlash && u < 0.12) { const fq = q(u / 0.12, 4); fxAt(out, `flash${fq}`, 500, 500, (p) => flash(p, fq), x + dir * 0.3, y, z + 0.05, 1.4, 1.4); }
};
/** a smoke bank that stays all shot: a soft puff frozen at a mid frame of its drawing, drifting slowly */
const smokeBank = (out: Out, t: number, x: number, y: number, z: number, s: number, i: number) => {
  const uq = q(0.55 + 0.1 * hh(i, 2), 30);
  fxAt(out, `puff${uq}`, 300, 300, (p) => fxPuff(p, uq), x + 0.25 * t * (0.5 + hh(i, 3)), y + 0.06 * Math.sin(t * 0.7 + i), z, s, s, 0, true);
};
const snowfall = (out: Out, t: number, cx: number, cy: number, cz: number, n: number, sx: number, sy: number, sz: number, speed = 1.0, size = 0.17) => {
  for (let i = 0; i < n; i++) {
    const fy = ((hh(i, 1) * sy - t * speed * (1.0 + 0.6 * hh(i, 2))) % sy + sy) % sy;
    const s = size * (0.8 + 0.9 * hh(i, 7));
    fxAt(out, "flake", 64, 64, flake, cx + (hh(i, 5) - 0.5) * sx + Math.sin(t * 0.7 + i) * 0.5, cy + fy, cz + (hh(i, 6) - 0.5) * sz, s, s, 0, true);
  }
};
/** a Place with an extra drawing on top of the character */
const withExtra = (pl: ReturnType<typeof person>, tag: string, extra: (p: Pen) => void) => {
  const d = pl.draw; pl.key += tag; pl.draw = (p) => { d(p); extra(p); }; return pl;
};
const pv = (c: Char, i: number): Char => ({ ...c, i });

// ---------------- per set ----------------
const study = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  if (id === 1) {
    // writing at a furious pace: sheets fly off over the desk and land on the floor in front of it (and stay)
    const scrib = q(Math.sin(t * 9) * 2.5, 2);
    put(cam, out, t, NAP_DESK, ...Sd(0.05, 0, -2.75), { fo: { expr: f >= 70 ? "stern" : "neutral", prop: "book", tilt: f >= 30 ? scrib : 0, headTilt: -3 } });
    for (let k = 0; k < 9; k++) {
      const f0 = 30 + 8 * k, u = (f - f0) / 14;
      if (u < 0) continue;
      const lx = -0.9 + 1.9 * hh(k, 3), lz = -0.75 + 0.4 * hh(k, 4), uu = Math.min(1, u);
      const x = 0.1 + (lx - 0.1) * uu, z = -2.85 + (lz + 2.85) * uu, y = 1.25 + 1.0 * Math.sin(Math.PI * uu) * (1 - 0.4 * uu) - 1.2 * uu * uu;
      const [wx, wy, wz] = Sd(x, Math.max(0.02, y), z);
      if (u < 1) fxAt(out, "sheet", 170, 230, sheet, wx, wy, wz, 0.26, 0.35, q(u * 5 + k, 8));
      else fxAt(out, "sheet", 170, 230, sheet, wx, 0.012 + 0.002 * k, wz, 0.26, 0.35, hh(k, 9) * 6, false, true);
    }
  }
  if (id === 5) {
    const ordering = f >= 286, home = f >= 341;
    put(cam, out, t, NAP_DESK, ...Sd(0.25, 0, -2.75), { fo: { expr: home ? "grin" : ordering ? "stern" : "neutral", wave: ordering ? q(0.75 + 0.25 * Math.sin((f - 286) * 0.25), 6) : undefined, look: f < 296 ? -1 : 0 } });
    put(cam, out, t, jurist(0), ...Sd(-1.75, 0, -1.7), { fo: { prop: "book", facing: 1, expr: home ? "smile" : "neutral", tilt: q(Math.sin(t * 7) * 2, 2) } });
    put(cam, out, t, jurist(1), ...Sd(1.75, 0, -1.55), { fo: { prop: "book", facing: -1, expr: ordering ? "nervous" : "neutral", tilt: q(Math.sin(t * 6 + 1) * 2, 2) } });
    put(cam, out, t, jurist(2), ...Sd(-1.05, 0, -3.35), { fo: { prop: "book", expr: home ? "smile_closed" : "stern" } });
  }
  if (id === 6) {
    put(cam, out, t, NAP_DESK, ...Sd(0.05, 0, -2.75), { fo: { expr: f >= BOOK_LAND + 2 ? "grin" : "stern", look: f < BOOK_LAND ? 0 : 0, headTilt: f >= BOOK_LAND + 2 ? 4 : 0 } });
    // dust puffs where the book lands
    for (const [dx, dz, s] of [[-0.45, 0.25, 1.0], [0.45, 0.2, 0.9], [0.0, 0.32, 0.8]] as const) {
      const u = (f - BOOK_LAND) / 22;
      if (u >= 0 && u < 1) { const uq = q(u, 22), [x, y, z] = Sd(dx * (1 + u), 0.9 + 0.15 * u, -1.65 + dz); fxAt(out, `puff${uq}`, 300, 300, (p) => fxPuff(p, uq), x, y, z, 0.3 * s + 0.4 * u, 0.3 * s + 0.4 * u, 0, true); }
    }
  }
  if (id === 10) {
    const smug = f >= 737, wives = f >= 760;
    put(cam, out, t, HUSBAND, ...Sd(-3.1, 0, -1.05), { fo: { prop: "book", facing: 1, expr: smug ? "grin" : "stern", tilt: smug ? -3 : 0 } });
    put(cam, out, t, WIFE, ...Sd(-2.1, 0, -0.75), { fo: { facing: -1, expr: wives ? "stern" : f >= 715 ? "nervous" : "neutral", look: -1, headTilt: wives ? -6 : 0 } });
  }
};

const paris = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  if (id === 2) {
    // the bank: a banker on the podium, two guards, people carrying sacks in from both sides
    put(cam, out, t, citizen(3), ...Pa(-50.7, 0.75, -6.95), { fo: { expr: "grin" } });
    for (const x of [-53.2, -46.8]) put(cam, out, t, pv(frenchSoldier(x < -50 ? 0 : 3), 970 + (x < -50 ? 0 : 1)), ...Pa(x, 0.75, -6.95), { fo: { expr: "stern" } });
    const tt = t - 104 / FPS;
    ([[-58 + 1.3 * tt, -1.5, 1, 6], [-42 - 1.25 * tt, 0.8, -1, 1], [-61 + 1.2 * tt, 2.6, 1, 7]] as const).forEach(([x, z, dir, v], i) => {
      const [wx, wy, wz] = Pa(x, 0, z);
      put(cam, out, t, pv(citizen(v), 975 + i), wx, wy, wz, { walk: { dx: dir, dz: 0, phase: (tt * 0.9 + i * 0.3) % 1 } });
      fxAt(out, "sack", 200, 200, sack, wx + dir * 0.32, 0.72 + 0.03 * Math.sin(tt * 11 + i), wz + 0.08, 0.42, 0.42);
    });
  }
  if (id === 3) {
    // the lycee: pupils marching out behind their master
    const tt = t - 155 / FPS, v = 1.15;
    const [mx, my, mz] = Pa(-9.0 + v * tt, 0, -6.0);
    put(cam, out, t, pv(savant(2), 980), mx, my, mz, { walk: { dx: 1, dz: 0, phase: (tt * 1.4) % 1 }, so: { prop: "book", expr: "smile" } });
    for (let k = 0; k < 7; k++) {
      const [x, y, z] = Pa(-10.6 - 1.05 * k + v * tt, 0, -6.0 + (k % 2 ? 0.35 : -0.15));
      put(cam, out, t, pv(schoolboy(k % 3, true), 981 + k), x, y, z, { walk: { dx: 1, dz: 0, phase: (tt * 1.4 + 0.5 * (k % 2)) % 1 }, so: { expr: (["smile", "grin", "smile_closed"] as Expr[])[k % 3] } });
    }
  }
  if (id === 4) {
    // the government palace: guards, prefects coming down the steps to every corner of France, a squad marching past
    for (const x of [38.5, 51.5]) put(cam, out, t, pv(frenchSoldier(x < 45 ? 1 : 4), 990 + (x < 45 ? 0 : 1)), ...Pa(x, 0, -6.8), { fo: { expr: "stern" } });
    const tt = t - 206 / FPS;
    ([[-1.6, -0.35], [0, 0], [1.6, 0.35]] as const).forEach(([dx, sp], i) => {
      const z = -9.2 + 1.15 * tt, x = 45 + dx + sp * tt * 1.4;
      put(cam, out, t, prefect(i), ...Pa(x, stepY(z), z), { walk: { dx: sp, dz: 1, phase: (tt * 1.3 + i * 0.33) % 1 }, fo: { expr: "stern" } });
    });
    for (let k = 0; k < 8; k++) {
      const x = 30 + 1.0 * k + 1.25 * tt, z = -1.5 + (k % 2) * 0.9;
      put(cam, out, t, pv(frenchSoldier(k % 6), 993 + k), ...Pa(x, 0, z), { walk: { dx: 1, dz: 0, phase: (tt * 1.6) % 1 } });
    }
  }
  if (id === 7) {
    if (f < 481) {
      // every man equal before the law: a line of Parisians of every rank, all on the same footing
      for (let k = 0; k < 8; k++) put(cam, out, t, pv(citizen(k), 1000 + k), ...Pa(2.6 + 1.12 * k, 0, 2 + (k % 2) * 0.2), { fo: { expr: f >= 446 ? (k % 2 ? "grin" : "smile") : citizen(k).expr, look: k < 4 ? 1 : -1 } });
    } else {
      // protected property: the proud shopkeeper with his key, his wife in the doorway
      const [x, y, z] = Pa(20, 0, 12.7);
      put(cam, out, t, SHOPKEEPER, x, y, z, { fo: { expr: "grin", wave: q(0.85 + 0.1 * Math.sin(t * 3), 10) } });
      fxAt(out, "key", 220, 220, keyCard, x + 0.4, 1.66 + 0.03 * Math.sin(t * 3), z + 0.08, 0.26, 0.26, 0.4);
      put(cam, out, t, pv(citizen(5), 1010), ...Pa(18.7, 0, 13.0), { fo: { expr: "smile_closed", facing: 1 } });
    }
  }
  if (id === 9) {
    // the cafe corner: a critic holding forth; a police spy peeks from behind the column
    const talk = q(0.55 + 0.4 * Math.sin(t * 5), 6);
    put(cam, out, t, CRITIC, ...Pa(-80.4, 0, -1.0), { fo: { expr: f >= 668 ? "grin" : "stern", wave: talk, facing: 1 } });
    put(cam, out, t, pv(citizen(6), 1011), ...Pa(-81.6, 0, -1.9), { fo: { expr: "smile", facing: 1 } });
    put(cam, out, t, pv(citizen(3), 1012), ...Pa(-79.1, 0, -2.1), { fo: { expr: "grin", facing: -1 } });
    put(cam, out, t, SPY, ...Pa(-76.65, 0, -1.25), { fo: { expr: f >= 652 ? "stern" : "neutral", look: -1, tilt: q(-4 - 2 * Math.sin(t * 2), 2), facing: -1 } });
  }
  if (id === 11) {
    if (f < 884) {
      // First Consul for life: the crowd cheers him on the palace steps
      put(cam, out, t, NAP_CONSUL, ...Pa(45, stepY(-8.9), -8.9), { fo: { expr: f >= 860 ? "grin" : "smile", wave: q(0.6 + 0.35 * Math.sin(t * 4), 8) } });
      for (const x of [41.6, 48.4]) put(cam, out, t, pv(frenchSoldier(x < 45 ? 0 : 3), 1020 + (x < 45 ? 0 : 1)), ...Pa(x, stepY(-9.3), -9.3), { fo: { expr: "stern" } });
      for (let k = 0; k < 16; k++) {
        const x = 38.4 + (k % 8) * 1.25 + (k >= 8 ? 0.6 : 0) - (k % 8 > 3 ? 0 : 0), z = -5.6 + (k >= 8 ? 1.3 : 0), c = citizen(k);
        if (x > 42.6 && x < 48.2) continue;
        const cheer = Math.sin(t * 6 + k * 1.3);
        put(cam, out, t, pv(c, 1030 + k), ...Pa(x, 0, z), { fo: { expr: k % 3 ? "grin" : "laugh", wave: k % 2 ? q(0.5 + 0.5 * cheer, 6) : undefined, look: x < 45 ? 1 : -1, tilt: q(2 * cheer, 2) } });
      }
    } else {
      // "one step further": low on the steps, he climbs one step
      const u = smooth((f - 924) / 12), z = -8.9 - 0.45 * u, y = stepY(-8.9) + 0.2 * u + 0.08 * Math.sin(Math.PI * u);
      put(cam, out, t, NAP_CONSUL, ...Pa(45, y, z), { fo: { expr: f >= 935 ? "grin" : "stern", look: -1 }, blob: false });
      for (const x of [41.6, 48.4]) put(cam, out, t, pv(frenchSoldier(x < 45 ? 0 : 3), 1020 + (x < 45 ? 0 : 1)), ...Pa(x, stepY(-9.3), -9.3), { fo: { expr: "stern" } });
    }
  }
  if (id === 13) {
    // the public vote: a clerk at the table, voters in a queue, ballots into the box; cheers on "approved it"
    const yes = f >= 1036;
    put(cam, out, t, pv(prefect(1), 1050), ...Pa(-30.3, 0, 0.35), { fo: { expr: yes ? "smile" : "neutral" } });
    for (let k = 0; k < 4; k++) {
      const c = citizen([0, 3, 4, 7][k]);
      put(cam, out, t, pv(c, 1051 + k), ...Pa(-31.6 - 1.05 * k, 0, 2.35 + (k % 2) * 0.2), { fo: { expr: yes ? "grin" : c.expr, wave: yes && k % 2 === 0 ? q(0.8 + 0.2 * Math.sin(t * 6 + k), 6) : undefined, facing: 1 } });
    }
    for (const [f0, dx] of [[1022, 0.05], [1044, -0.05]] as const) {
      const u = (f - f0) / 12;
      if (u < 0) continue;
      const [x, , z] = Pa(-30.1 + dx, 0, 1.4), y = 1.62 - 0.6 * Math.min(1, u) ** 2;
      if (y > 1.02) fxAt(out, "ballot", 128, 100, ballot, x, y, z, 0.2, 0.16, 0);
    }
  }
};

const press = (f: number, t: number, cam: CamInfo, out: Out) => {
  const stopped = f >= PRESS_STOP, bars = f >= 630;
  const pull = stopped ? 0 : Math.sin(((f - 524) / 22) * Math.PI * 2);
  put(cam, out, t, PRINTER, ...Pr(1.25, 0, -1.25), { fo: { expr: stopped ? (bars ? "pained" : "shock") : "smile", facing: -1, tilt: q(stopped ? 0 : 5 * pull, 2), wave: stopped ? undefined : q(0.4 + 0.3 * pull, 6) } });
  put(cam, out, t, APPRENTICE, ...Pr(-1.5, 0, -1.0), { fo: { expr: stopped ? "nervous" : "smile_closed", prop: stopped ? null : "book", facing: 1 } });
  if (stopped) put(cam, out, t, POLICE, ...Pr(-0.15, 0, -0.65), { fo: { expr: "stern", wave: 1, facing: 1, look: 1 } });
};

const senate = (f: number, t: number, cam: CamInfo, out: Out) => {
  let i = 0;
  for (let r = 0; r < 5; r++) {
    const { z, y } = SEN_ROW(r);
    for (let k = 0; k < 11; k++, i++) {
      const x = -8.5 + 1.7 * k + (r % 2 ? 0.85 : 0);
      if (x > 9.2) continue;
      const up = f >= 966 + ((k * 3 + r * 5) % 9);
      put(cam, out, t, pv(senator(k + r), 1101 + i), ...Sn(x, y, z - 0.1), { fo: { expr: up ? (k % 3 ? "grin" : "smile") : senator(k + r).expr, wave: up ? q(0.95 + 0.05 * Math.sin(t * 4 + i), 10) : undefined, look: Math.round(Math.sin(i * 1.7)) }, blob: r === 0 });
    }
  }
};

const parvis = (cam: CamInfo, t: number, out: Out) => {
  const E = (x: number, z: number): [number, number, number] => at(EXT, x, 0, z);
  for (let z = 8; z <= 44; z += 6) for (const s of [-1, 1]) { const [x, y, zz] = E(s * 4.2, z); put(cam, out, t, frenchSoldier((z / 6 + (s > 0 ? 1 : 0)) % 6), x, y, zz); }
  for (let i = 0; i < 26; i++) {
    const s = i % 2 ? 1 : -1, [x, y, z] = E(s * (6.5 + hh(i, 3) * 4), 10 + hh(i, 4) * 40);
    const o = townsfolk(i % 6);
    out.places.push(person(cam, { i: 400 + i, o, okey: `tf${i % 6}` }, x, y, z, { side: false, mirror: false }, { mode: "stand", expr: (["smile", "neutral", "grin"] as Expr[])[i % 3], blink: lidAt(t, 400 + i) }, {}));
    blob(out, x, y, z);
  }
  const [cx, , cz] = E(0, 79);
  snowfall(out, t, cx, 0, cz, 90, 50, 34, 58, 1.0, 0.25);
};

const nave = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  const I = (x: number, y: number, z: number) => at(INT, x, y, z);
  // guests: nave rows + aisles
  const spots = [...ND_SPOTS.guests];
  for (let row = 0; row < 8; row++) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) spots.push([s * (8.8 + k * 1.3), -9 - row * 3.6]);
  spots.forEach(([gx, gz], i) => {
    const c = GUESTS[i % GUESTS.length];
    let expr: Expr = (["neutral", "smile_closed", "smile", "neutral"] as Expr[])[i % 4];
    if (id === 16 && f >= 1290) expr = i % 3 === 0 ? "shock" : i % 3 === 1 ? "nervous" : "neutral";
    if (id === 17 && f >= CROWN_ON - 2) expr = i % 2 ? "shock" : "nervous";
    if (id === 18 || id === 20) expr = i % 2 ? "smile" : "smile_closed";
    const [x, y, z] = I(gx, 0, gz);
    put(cam, out, t, { ...c, i: 500 + i }, x, y, z, { fo: { expr, look: Math.round(Math.sin(i * 1.7) * 1.2), tilt: id === 16 ? q(2 * Math.sin(t * 3 + i), 2) : 0 } });
  });
  ND_SPOTS.guards.forEach(([gx, gz], i) => { const [x, y, z] = I(gx, 0, gz); put(cam, out, t, { ...frenchSoldier(i % 6), i: 600 + i }, x, y, z, { fo: { expr: "stern" } }); });
  // the Pope in front of his throne
  const [px, py, pz] = ND_SPOTS.popeThrone;
  const pe: Expr = id === 15 ? (f >= 1214 ? "nervous" : "neutral") : id === 17 && f >= CROWN_ON ? "shock" : "neutral";
  put(cam, out, t, POPE, ...I(px, py, pz + 1.75), { fo: { expr: pe, look: id === 15 && f >= 1214 ? 1 : 0 } });
  const [nx, ny, nz] = ND_SPOTS.napoleon;
  if (id === 15 || id === 16 || id === 17) {
    // before the crowning: Josephine beside him; the self-crowning in shot 17
    const [jx, jy, jz] = ND_SPOTS.josephine;
    put(cam, out, t, JOSEPHINE_CORONATION, ...I(jx + 0.4, jy, jz), { fo: { expr: id === 17 && f >= CROWN_ON ? "shock" : "smile_closed" } });
    const crowned = id === 17 && f >= CROWN_ON;
    const fo: FrontOpts = { expr: id === 17 && f >= 1385 ? "stern" : "neutral" };
    if (id === 17 && !crowned) fo.prop = ["crown", q(crownK(f), 60)];
    if (crowned) fo.expr = "stern";
    put(cam, out, t, crowned ? NAP_EMPEROR_CROWN : NAP_EMPEROR, ...I(nx, ny, nz), { fo });
    if (crowned && f < CROWN_ON + 14) {
      const u = q((f - CROWN_ON) / 14, 14);
      fxAt(out, `spark${u}`, 500, 500, (p) => sparkle(p, u), ...I(nx + 0.02, ny + 1.98, nz + 0.15), 1.1, 1.1);
    }
  }
  if (id === 18) {
    // he turns and crowns the kneeling Josephine (her card sunk into the platform, a cushion in front)
    const KNEEL = 0.55, [jx, jz] = [0.24, -44.3];
    if (f < 1495) {
      const turned = f >= 1441;
      put(cam, out, t, NAP_EMPEROR_CROWN, ...I(0.42, ny, -45.0), turned
        ? { fo: { expr: f >= 1468 ? "smile_closed" : "stern", prop: ["crown", 0], facing: 1, look: 1 } }
        : { side: true, mirror: true, so: { expr: "stern" } });
      put(cam, out, t, JOSEPHINE_CORONATION, ...I(jx, ny - KNEEL, jz), { fo: { expr: "smile_closed", headTilt: -6, facing: -1 }, blob: false });
    } else {
      put(cam, out, t, NAP_EMPEROR_CROWN, ...I(0.42, ny, -45.0), { fo: { expr: "smile_closed", facing: 1, look: 1 } });
      put(cam, out, t, JOSEPHINE_EMPRESS, ...I(jx, ny - KNEEL, jz), { fo: { expr: "smile_closed", headTilt: -3, facing: -1 }, blob: false });
      if (f < 1495 + 14) {
        const u = q((f - 1495) / 14, 14);
        fxAt(out, `spark${u}`, 500, 500, (p) => sparkle(p, u), ...I(jx, ny - KNEEL + 1.72, jz + 0.12), 0.9, 0.9);
      }
    }
    fxAt(out, "cushion", 400, 200, cushion, ...I(jx, ny + 0.07, jz + 0.12), 0.95, 0.48);
  }
  if (id === 20) {
    // the emperor before his throne, the empress beside him
    const [tx, ty, tz] = ND_SPOTS.imperialThrone;
    put(cam, out, t, NAP_EMPEROR_CROWN, ...I(tx, ty, tz + 0.95), { fo: { expr: f >= 1626 ? "stern" : "smile_closed" } });
    put(cam, out, t, JOSEPHINE_EMPRESS, ...I(tx - 1.6, ty, tz + 1.6), { fo: { expr: "smile_closed", facing: 1 } });
  }
};

const school = (f: number, t: number, cam: CamInfo, out: Out) => {
  const Sx = (x: number, z: number) => S(x, 0, z);
  put(cam, out, t, NAP_CADET, ...Sx(0, 0), { fo: { expr: "pained", look: -1, headTilt: -4 } });
  ([[-1.55, 0.7], [1.5, 0.55], [-2.7, -1.3], [2.5, -1.5], [0.95, -2.5], [-0.9, -2.7]] as const).forEach(([x, z], i) => {
    const c = schoolboy(i % 3, true), shake = Math.sin(t * 9 + i * 1.3);
    put(cam, out, t, { ...c, i: 700 + i }, ...Sx(x, z), { fo: { expr: (["laugh", "grin", "laugh"] as Expr[])[i % 3], tilt: q(3 * shake, 4), wave: i === 0 || i === 3 ? q(0.5 + 0.5 * shake, 6) : undefined, facing: (x < 0 ? 1 : -1) as 1 | -1 } });
  });
};

const field = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  if (id === 21) {
    // the wars: two ranks of blue infantry advancing through the smoke, an officer with his sabre up, the guns firing
    const tt = t - 1686 / FPS;
    for (let k = 0; k < 18; k++) {
      const rank = k % 2, x = -11 + 1.05 * Math.floor(k / 2) + 0.9 * tt + rank * 0.5, z = 0.2 + rank * 1.1;
      put(cam, out, t, pv(frenchSoldier(k % 6), 1200 + k), ...F(x, 0, z), { walk: { dx: 1, dz: 0, phase: (tt * 1.2 + rank * 0.5) % 1 }, so: { expr: k % 3 ? "stern" : "nervous" } });
    }
    put(cam, out, t, pv(frenchOfficer(2), 1220), ...F(-1.5 + 0.9 * tt, 0, 2.6), { walk: { dx: 1, dz: 0, phase: (tt * 1.2) % 1 }, so: { expr: "stern", prop: ["sword", 1] } });
    for (const [gx, gz, f0] of [[-7, -4, 1700], [-3.5, -7, 1712], [-7, -4, 1738], [-3.5, -7, 1752]] as const) puff(out, t, f0 / FPS, ...F(gx + 1.9, 1.05, gz), 1, 2.6, 1.8, true);
    for (let i = 0; i < 10; i++) smokeBank(out, t - 1686 / FPS, ...F(-24 + i * 4.5 + 2 * hh(i, 1), 2.2 + 1.5 * hh(i, 4), -9 - 5 * hh(i, 5)), 8 + 4 * hh(i, 6), i);
  }
  if (id === 23) {
    // Waterloo: Napoleon on his grey horse in the smoke; redcoats on the ridge; he turns his horse away after "beaten"
    const x = WAT_X(f), riding = f >= 1893, sad = f >= 1888;
    horseCard(cam, out, t, ...F(x, 0, 0), { coat: HORSE_COATS.grey, pose: riding ? "walk" : "stand", phase: riding ? ((f - 1893) / FPS * 0.9) % 1 : 0, rider: NAP_ICON,
      riderOpts: { expr: sad ? "nervous" : "stern" } }, true);
    for (let k = 0; k < 12; k++) {
      const bx = 128 + 3.6 * k, bz = -41 + (k % 2) * 1.2, hy = 9 * Math.sqrt(Math.max(0, 1 - ((bx - 150) / 120) ** 2 - ((bz + 60) / 26) ** 2)) - 0.4;
      put(cam, out, t, pv(britishSoldier(k % 4), 1240 + k), ...F(bx, hy, bz), { fo: { expr: "stern" } });
    }
    for (let k = 0; k < 3; k++) {
      const tt = t - 1867 / FPS;
      put(cam, out, t, pv(frenchSoldier(k + 1), 1260 + k), ...F(146 + 2.4 * k - 0.8 * tt, 0, -5 - k * 1.3), { walk: { dx: -1, dz: 0, phase: (tt * 1.1 + k * 0.3) % 1 }, so: { expr: "pained" } });
    }
    puff(out, t, 1880 / FPS, ...F(143 + 1.9, 1.05, -14), 1, 3.0, 2.0, true);
    for (let i = 0; i < 10; i++) smokeBank(out, t - 1867 / FPS, ...F(126 + i * 4.5 + 2 * hh(i, 1), 2.4 + 1.6 * hh(i, 4), -14 - 10 * hh(i, 5)), 8 + 4 * hh(i, 6), i + 20);
  }
  if (id === 26) {
    // five foot seven: Napoleon in a line of his soldiers, all about the same height
    for (let k = 0; k < 9; k++) {
      const x = -150 + (k - 4) * 1.05;
      if (k === 4) put(cam, out, t, NAP_ICON, ...F(x, 0, 0), { fo: { expr: f >= 2244 ? "smile" : "stern", prop: "tuck" } });
      else put(cam, out, t, pv(frenchSoldier(k % 6), 1280 + k), ...F(x, 0, 0.1 * (k % 2)), { fo: { expr: f >= 2250 ? (k % 2 ? "smile" : "grin") : "neutral", look: k < 4 ? 1 : -1 } });
    }
  }
  if (id === 28) {
    // the little corporal: his soldiers cheering him round the campfire
    const cheer = f >= 2455;
    put(cam, out, t, NAP_GENERAL, ...F(-150, 0, 18.1), { fo: { expr: cheer ? "grin" : "smile", wave: cheer ? q(0.6 + 0.3 * Math.sin(t * 4), 6) : undefined } });
    ([[-152.1, 18.6, 1], [-147.9, 18.7, -1], [-153.0, 20.6, 1], [-147.2, 20.8, -1], [-151.2, 17.2, 1], [-148.6, 17.1, -1]] as const).forEach(([x, z, fc], k) => {
      const s = Math.sin(t * 7 + k);
      put(cam, out, t, pv(frenchSoldier(k), 1300 + k), ...F(x, 0, z), { fo: { expr: cheer ? (k % 2 ? "laugh" : "grin") : "smile", facing: fc as 1 | -1, look: fc, wave: cheer || k % 3 === 0 ? q(0.7 + 0.3 * s, 6) : undefined, tilt: q(2 * s, 2) } });
    });
    for (let i = 0; i < 10; i++) {
      const u = ((t * 0.7 + hh(i, 2)) % 1);
      const [x, y, z] = F(-150 + (hh(i, 3) - 0.5) * 0.5 + 0.2 * Math.sin(t * 3 + i), 0.5 + 2.2 * u, 19.4 + (hh(i, 4) - 0.5) * 0.4);
      fxAt(out, "spark", 64, 64, spark, x, y, z, 0.06 * (1 - u) + 0.02, 0.06 * (1 - u) + 0.02, 0, true);
    }
  }
};

const snowField = (f: number, t: number, cam: CamInfo, out: Out) => {
  // the retreat: a column trudging through deep snow (cards sunk 0.3 m into the drifts), the snow driving sideways
  const tt = t - 1776 / FPS, SINK = 0.32;
  for (let k = 0; k < 10; k++) {
    const x = -1.2 + (k % 3) * 1.2 + 0.25 * Math.sin(k * 2.1) + 0.12 * tt, z = -13 + 1.7 * Math.floor(k / 3) * 1.2 + (k % 3) * 0.5 + 0.55 * tt;
    put(cam, out, t, pv(frozen(k), 1320 + k), ...W(x, -SINK, z), { walk: { dx: 0.2, dz: 1, phase: (tt * 0.8 + k * 0.37) % 1 }, fo: { headTilt: -5 + (k % 3) * 2 }, blob: false });
  }
  const [cx, , cz] = W(0, 0, -2);
  snowfall(out, t, cx - 3 * ((t * 1.3) % 6), 0, cz, 140, 34, 14, 26, 1.6, 0.13);
};

const helena = (f: number, t: number, cam: CamInfo, out: Out) => {
  if (f < 2033) return;
  const [x, y, z] = napHel();
  put(cam, out, t, NAP_ICON, x, y, z, { side: true, mirror: true, so: { expr: "neutral", prop: "tuck" } });
};

const studio = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  if (id === 25) {
    // the real man stands behind the caricature; revealed when it tears
    put(cam, out, t, NAP_ICON, ...St(0, 0, -1.45), { fo: { expr: f >= TEAR + 8 ? "smile_closed" : "stern", prop: "tuck" } });
  }
  if (id === 27 && f < 2380) {
    const s = Math.sin(t * 8);
    put(cam, out, t, CARTOONIST, ...St(-3.1, 0, -3.5), { fo: { expr: "laugh", wave: q(0.35 + 0.15 * s, 8), tilt: q(3 * s, 2) } });
    put(cam, out, t, gent(0), ...St(-4.1, 0, -0.95), { fo: { expr: "laugh", look: -1, tilt: q(3 * Math.sin(t * 9), 2), facing: -1 } });
    put(cam, out, t, gent(1), ...St(-3.4, 0, -0.35), { fo: { expr: "grin", look: -1, tilt: q(2 * Math.sin(t * 9 + 1), 2), facing: -1 } });
  }
};

const quay = (f: number, t: number, cam: CamInfo, out: Out) => {
  put(cam, out, t, NAP_CHILD, BOY[0], BOY[1], BOY[2], { side: true, so: { expr: f >= 2745 ? "smile" : "stern" } });
};

/** everything with a face in shot `id` at frame f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] }, t = f / FPS, s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (s.set === "study") study(id, f, t, cam, out);
  if (s.set === "paris") paris(id, f, t, cam, out);
  if (s.set === "press") press(f, t, cam, out);
  if (s.set === "senate") senate(f, t, cam, out);
  if (s.set === "ext") parvis(cam, t, out);
  if (s.set === "int") nave(id, f, t, cam, out);
  if (s.set === "school") school(f, t, cam, out);
  if (s.set === "field") field(id, f, t, cam, out);
  if (s.set === "snow") snowField(f, t, cam, out);
  if (s.set === "helena") helena(f, t, cam, out);
  if (s.set === "studio") studio(id, f, t, cam, out);
  if (s.set === "corsica") quay(f, t, cam, out);
  return out;
};
export { clamp01 };
export type { V3 };
