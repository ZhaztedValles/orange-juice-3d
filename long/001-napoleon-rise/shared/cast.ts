// The Rise of Napoleon: the shared cast. Every chapter draws its people from these presets so faces, clothes and
// hats stay identical across the six chapters. A preset is a Char: the engine outfit, a fixed identity number `i`
// (it picks the head shape and the blink timing, so the same `i` = the same face everywhere), a drawing-cache key, a
// card scale and a default expression. Stage them with put() (or the engine's person() / blob() with who(c)).
// Horses and riders are in props.ts (horseCard), the 3D cannon and warships too.
import { INK, SKINS, Outfit, Expr, FrontOpts, SideOpts } from "../../../src/engine/toon";
import { CamInfo, Stage, Who, person, blob, lidAt, viewOf } from "../../../src/engine/cards";

export type Char = { i: number; okey: string; o: Outfit; scale: number; expr: Expr };
const C = (i: number, okey: string, o: Outfit, expr: Expr = "neutral", scale = 1): Char => ({ i, okey, o, expr, scale });

// ---------------- palette ----------------
export const FR_BLUE = "#2c4790";      // French infantry coat
export const FR_WHITE = "#f2efe6";     // lapels, breeches, crossbelts
export const FR_RED = "#c23a3a";       // collars, facings
export const GOLD = "#e8b53e";
export const BR_RED = "#c8372f";       // British redcoat
const NAP_HAIR = "#2b1f1c", NAP_SKIN = "#f6d7b4";
const DARK = "#2a1f1c", BROWN = "#6a4228", BLOND = "#d9b45c", POWDER = "#e7e2d8", GREY = "#b9b4ac";

// ---------------- Napoleon at five ages (one face: i = 100, dark hair, heavy serious brows) ----------------
const NAP_FACE = { skin: NAP_SKIN, brow: 1.35 } as const;
/** Napoleone at ~9 on Corsica (1778): plain tan waistcoat, white shirt sleeves read as the coat, short dark hair, kid build */
export const NAP_CHILD = C(100, "napChild", { ...NAP_FACE, jacket: "#c79a5a", pants: "#5b4636", boots: "#3a2a20", hat: "hair", hair: NAP_HAIR, lapels: "#f2ebdc", build: "kid" }, "stern");
/** the cadet at ~15-16 (Brienne / Ecole Militaire 1784-85): blue school coat, red collar and lapels, white buttons, teen build */
export const NAP_CADET = C(100, "napCadet", { ...NAP_FACE, jacket: "#2d4683", pants: "#e9e3d4", boots: INK, hat: "hair", hair: NAP_HAIR, lapels: FR_RED, collar: FR_RED, buttons: "#eeeae0", build: "teen" }, "stern");
/** the young officer / general 1793-1799 (Toulon, Paris, Italy, Egypt): blue coat, red collar, gold epaulettes, tricolour sash,
 *  white breeches, black boots, sabre, sideways bicorne with the cockade, long lank dark hair to the collar */
export const NAP_GENERAL = C(100, "napGeneral", { ...NAP_FACE, jacket: "#273f7c", pants: FR_WHITE, boots: INK, hat: "bicorne", locks: NAP_HAIR, lockLen: 1,
  collar: FR_RED, lapels: "#273f7c", epaulettes: GOLD, sash: "tricolour", buttons: GOLD, sword: true }, "stern");
/** First Consul 1799-1804: the red consul's coat with gold facings, bicorne with a tricolour-cockade, short hair with a forelock */
export const NAP_CONSUL = C(100, "napConsul", { ...NAP_FACE, jacket: "#a92c34", pants: FR_WHITE, boots: INK, hat: "bicorne", hatTrim: GOLD, locks: NAP_HAIR, lockLen: 0.25, forelock: true,
  lapels: "#d9b04a", collar: "#d9b04a", buttons: GOLD, sword: true }, "stern");
/** the coronation, 2 December 1804: white satin robe, crimson mantle with ermine and golden bees, golden laurel wreath */
export const NAP_EMPEROR = C(100, "napEmperor", { ...NAP_FACE, jacket: "#f3ecdc", robe: "#f3ecdc", pants: "#f3ecdc", boots: "#e8d6a8", hat: "laurel", locks: NAP_HAIR, lockLen: 0.25, forelock: true,
  cloak: "#a8213a", trim: "ermine", lapels: GOLD }, "stern");
/** the same, crowned: the gold crown in place of the laurel (after he lifts it onto his head) */
export const NAP_EMPEROR_CROWN = C(100, "napEmperorCrown", { ...NAP_EMPEROR.o, hat: "crown" }, "stern");
/** the iconic later look (epilogue, cartoons): green chasseur coat, white waistcoat, sideways bicorne; pose it with prop "tuck" */
export const NAP_ICON = C(100, "napIcon", { ...NAP_FACE, jacket: "#2f5a3a", pants: FR_WHITE, boots: INK, hat: "bicorne", locks: NAP_HAIR, lockLen: 0.25, forelock: true,
  lapels: FR_WHITE, collar: FR_RED, epaulettes: GOLD, buttons: GOLD }, "stern");

// ---------------- the family ----------------
/** Carlo Buonaparte, the father (1770s lawyer and minor noble): plum coat, cream waistcoat, tricorne, powdered hair */
export const CARLO = C(101, "carlo", { jacket: "#5a3f6e", pants: "#3b3f52", boots: "#3a2a20", hat: "tricorne", cockade: null, hatTrim: "#d9b04a", locks: POWDER, lockLen: 0.35, lapels: "#eadbb4", buttons: GOLD, skin: SKINS[1] }, "smile");
/** Letizia, the mother: dark green dress, cream bodice, black hair; strict */
export const LETIZIA = C(102, "letizia", { jacket: "#e8dcc0", dress: "#2f5446", pants: "#2f5446", boots: "#3a2a20", hat: "hair", hair: "#1f1715", locks: "#1f1715", lockLen: 0.55, skin: SKINS[1] }, "stern");
/** Lucien Bonaparte, the brother (1799): deputy of the Five Hundred: white robe, blue sash, scarlet mantle, dark hair */
export const LUCIEN = C(103, "lucien", { jacket: "#f2ede0", robe: "#f2ede0", pants: "#f2ede0", boots: INK, cloak: "#b3263a", sash: "#2f52b0", hat: "hair", hair: "#3a2418", locks: "#3a2418", lockLen: 0.5, skin: NAP_SKIN }, "stern");
/** Josephine de Beauharnais (1795-96): white Empire muslin dress, rose bodice, dark curls */
export const JOSEPHINE = C(104, "josephine", { jacket: "#d8768a", dress: "#f6f1e6", pants: "#f6f1e6", boots: "#c9a46a", hat: "hair", hair: "#2a1a17", locks: "#2a1a17", lockLen: 0.6, skin: SKINS[2] }, "smile");
/** Empress Josephine at the coronation: white dress, crimson ermine mantle, small gold crown */
export const JOSEPHINE_EMPRESS = C(104, "josephineEmpress", { jacket: "#f6f1e6", dress: "#f6f1e6", pants: "#f6f1e6", boots: "#e8d6a8", hat: "crown", locks: "#2a1a17", lockLen: 0.6,
  cloak: "#a8213a", trim: "ermine", skin: SKINS[2] }, "smile_closed");

// ---------------- school ----------------
/** rich schoolboys (v = 0, 1, 2): the same blue school coat as Napoleon, better buttons, fair / ginger / brown hair.
 *  Brienne (ch2, age 10-14): kid build; teen = true for the Ecole Militaire. Default expression: mocking grin. */
export const schoolboy = (v: number, teen = false): Char => {
  const hair = [BLOND, "#b5653f", BROWN][v % 3], skin = [SKINS[0], SKINS[2], SKINS[0]][v % 3];
  return C(110 + (v % 3), `boy${v % 3}${teen ? "t" : "k"}`, { jacket: "#2d4683", pants: "#e9e3d4", boots: INK, hat: "hair", hair, lapels: FR_RED, collar: FR_RED,
    buttons: GOLD, build: teen ? "teen" : "kid", skin }, (["grin", "laugh", "smile"] as Expr[])[v % 3]);
};

// ---------------- armies ----------------
/** French revolutionary infantry (v = 0..5): blue coat, white lapels, red collar, white breeches, black gaiters, white
 *  crossbelts, musket; sideways bicorne with the tricolour cockade (v % 3 === 2: a red forage cap instead) */
export const frenchSoldier = (v: number): Char => {
  const k = v % 6;
  const o: Outfit = { jacket: FR_BLUE, pants: FR_WHITE, boots: INK, hat: k % 3 === 2 ? "cap" : "bicorne", cap: "#b8323a", belt: FR_WHITE, buttons: "#e6e2d8",
    lapels: FR_WHITE, collar: FR_RED, rifle: true, skin: SKINS[k % 4], moustache: k === 1 ? "#3a2a20" : k === 4 ? "#5a3b2a" : undefined, locks: k === 3 ? BROWN : undefined };
  return C(200 + k, `frs${k}`, o, (["neutral", "stern", "grin", "neutral", "stern", "smile"] as Expr[])[k]);
};
/** French officers (v = 0..2): blue coat, gold epaulettes, red sash, sabre, fore-and-aft bicorne with gold lace (v 2: white plume) */
export const frenchOfficer = (v: number): Char => {
  const k = v % 3;
  return C(210 + k, `fro${k}`, { jacket: "#273f7c", pants: FR_WHITE, boots: INK, hat: "bicorne_fa", hatTrim: GOLD, plume: k === 2 ? "#f5f2ea" : undefined, epaulettes: GOLD,
    lapels: "#273f7c", collar: FR_RED, sash: "#c23a3a", buttons: GOLD, sword: true, moustache: k === 1 ? "#3a2a20" : undefined, skin: SKINS[(k + 1) % 4], locks: k === 0 ? DARK : BROWN, lockLen: 0.3 }, "stern");
};
/** Joachim Murat, the flamboyant cavalry officer (ch4: fetches the guns; rides in props.horseCard): sky-blue coat, gold, plumed bicorne, black curls */
export const MURAT = C(220, "murat", { jacket: "#3d6fb0", pants: "#f0e6cf", boots: INK, hat: "bicorne_fa", hatTrim: GOLD, plume: "#f5f2ea", epaulettes: GOLD,
  lapels: GOLD, collar: GOLD, sash: "#c23a3a", buttons: GOLD, sword: true, locks: "#24160f", lockLen: 0.7, skin: SKINS[1] }, "grin");
/** Paul Barras, the Director who calls Napoleon in (ch4): dark blue coat, tricolour sash, plumed bicorne */
export const BARRAS = C(221, "barras", { jacket: "#30366e", pants: FR_WHITE, boots: INK, hat: "bicorne_fa", hatTrim: GOLD, plume: "#d23a3f", sash: "tricolour",
  lapels: "#30366e", collar: GOLD, buttons: GOLD, locks: POWDER, lockLen: 0.3, build: "stout", skin: SKINS[0] }, "smile");
/** Maximilien Robespierre (ch4): striped green coat, powdered hair, no hat */
export const ROBESPIERRE = C(222, "robespierre", { jacket: "#5f7d4a", pants: "#e9e3d4", boots: INK, hat: "hair", hair: POWDER, locks: POWDER, lockLen: 0.3, lapels: "#efe6cc", skin: SKINS[0] }, "stern");
/** British redcoats (v = 0..3): red coat, white crossbelts, grey trousers, musket, black-cockade bicorne */
export const britishSoldier = (v: number): Char => {
  const k = v % 4;
  return C(230 + k, `brs${k}`, { jacket: BR_RED, pants: "#d8d4c8", boots: INK, hat: "bicorne", cockade: "#1d1b22", belt: FR_WHITE, buttons: "#e6e2d8", lapels: "#1f3c78", collar: "#1f3c78",
    rifle: true, skin: SKINS[k], moustache: k === 2 ? "#6a4228" : undefined }, k % 2 ? "stern" : "neutral");
};
/** a British officer: red coat, gold epaulettes, crimson sash, sabre, fore-and-aft bicorne */
export const BRITISH_OFFICER = C(234, "bro", { jacket: BR_RED, pants: "#f0ece0", boots: INK, hat: "bicorne_fa", hatTrim: GOLD, cockade: "#1d1b22", epaulettes: GOLD, sash: "#8c1f2c",
  lapels: "#1f3c78", collar: "#1f3c78", buttons: GOLD, sword: true, locks: POWDER, lockLen: 0.3, build: "stout" }, "stern");
/** Horatio Nelson (ch5): dark navy coat, white facings, gold epaulettes, fore-and-aft bicorne, grey hair */
export const NELSON = C(235, "nelson", { jacket: "#1f2a4e", pants: "#f0ece0", boots: INK, hat: "bicorne_fa", hatTrim: GOLD, cockade: "#1d1b22", epaulettes: GOLD, lapels: FR_WHITE,
  collar: FR_WHITE, buttons: GOLD, sword: true, locks: GREY, lockLen: 0.3, skin: SKINS[0] }, "stern");
/** royalist insurgents of Paris 1795 (v = 0..3): civilian coats, tricornes with the white royal cockade, muskets */
export const royalist = (v: number): Char => {
  const k = v % 4, coats = ["#6b4a2e", "#3f5a46", "#5a3046", "#4a4f66"];
  return C(240 + k, `roy${k}`, { jacket: coats[k], pants: ["#d8cfb8", "#3b3f52", "#c9b896", "#3b3f52"][k], boots: "#3a2a20", hat: "tricorne", cockade: "#f7f4ec",
    lapels: "#e3d6b8", rifle: true, skin: SKINS[(k + 2) % 4], moustache: k === 1 ? "#3a2a20" : undefined, locks: [POWDER, BROWN, DARK, GREY][k], lockLen: 0.3 }, k % 2 ? "stern" : "nervous");
};

// ---------------- Egypt ----------------
/** Mamluk horsemen (v = 0..3): coloured turbans over red caps, bright kaftans (robe on foot), baggy trousers, gold sash,
 *  black beard and moustache, curved sabre. On a horse: props.horseCard({ rider: mamluk(v) }). */
export const mamluk = (v: number): Char => {
  const k = v % 4, coat = ["#d9822b", "#2f8a6a", "#c23a3a", "#6a46a8"][k], wrap = ["#f4ecd8", "#f1c94a", "#f4ecd8", "#7cc0d8"][k];
  return C(250 + k, `mam${k}`, { jacket: coat, robe: coat, pants: ["#e6c24a", "#c23a3a", "#2f5aa8", "#e6c24a"][k], boots: ["#c23a3a", "#e6c24a", "#e6c24a", "#c23a3a"][k],
    hat: "turban", hatCol: wrap, hatTrim: ["#c23a3a", "#2f8a6a", "#2f8a6a", "#c23a3a"][k], plume: k === 0 ? "#f5f2ea" : undefined, sash: GOLD, sword: true,
    beard: "#1f1715", moustache: "#1f1715", skin: SKINS[3 - (k % 2)] }, "stern");
};
/** French scholars, the savants (v = 0..2): civilian coats, waistcoats, round top hat or tricorne, grey or powdered hair; pose with prop "book" */
export const savant = (v: number): Char => {
  const k = v % 3;
  return C(260 + k, `sav${k}`, { jacket: ["#3d3a4a", "#4a5a3a", "#6a4a3a"][k], pants: ["#d8cfb8", "#3b3f52", "#c9b896"][k], boots: "#3a2a20", hat: k === 1 ? "tricorne" : k === 2 ? null : "tophat",
    cockade: k === 1 ? undefined : null, lapels: ["#e7dcc0", "#efe6cc", "#d9c9a0"][k], locks: [GREY, POWDER, "#8a8580"][k], lockLen: 0.35, skin: SKINS[k], build: k === 2 ? "stout" : undefined }, "smile");
};

// ---------------- Church and lawmakers ----------------
/** Pope Pius VII (ch1, ch6): white robe with a gold front band, gold cope over the shoulders, white-and-gold mitre, white hair */
export const POPE = C(270, "pope", { jacket: "#e9cf7e", robe: "#f6f2e8", pants: "#f6f2e8", boots: "#b3263a", hat: "mitre", lapels: GOLD, locks: "#efece6", lockLen: 0.2, skin: SKINS[0] }, "neutral");
/** deputies of the Council of Five Hundred (v = 0..3, ch5 Brumaire): white robes, blue sashes, scarlet mantles; angry by default */
export const lawmaker = (v: number): Char => {
  const k = v % 4;
  return C(280 + k, `law${k}`, { jacket: "#f2ede0", robe: "#f2ede0", pants: "#f2ede0", boots: INK, cloak: "#b3263a", sash: "#2f52b0", hat: "hair", hair: [GREY, BROWN, DARK, POWDER][k],
    locks: [GREY, BROWN, DARK, POWDER][k], lockLen: 0.4, moustache: k === 2 ? "#3a2a20" : undefined, skin: SKINS[k], build: k === 1 ? "stout" : undefined }, (["shock", "stern", "nervous", "stern"] as Expr[])[k]);
};

/** every preset, for lineups and lookups by name */
export const ALL: Record<string, Char> = {
  NAP_CHILD, NAP_CADET, NAP_GENERAL, NAP_CONSUL, NAP_EMPEROR, NAP_EMPEROR_CROWN, NAP_ICON, CARLO, LETIZIA, LUCIEN, JOSEPHINE, JOSEPHINE_EMPRESS,
  MURAT, BARRAS, ROBESPIERRE, BRITISH_OFFICER, NELSON, POPE,
  ...Object.fromEntries([0, 1, 2].map((v) => [`schoolboy${v}`, schoolboy(v)])),
  ...Object.fromEntries([0, 1, 2, 3, 4, 5].map((v) => [`frenchSoldier${v}`, frenchSoldier(v)])),
  ...Object.fromEntries([0, 1, 2].map((v) => [`frenchOfficer${v}`, frenchOfficer(v)])),
  ...Object.fromEntries([0, 1, 2, 3].map((v) => [`britishSoldier${v}`, britishSoldier(v)])),
  ...Object.fromEntries([0, 1, 2, 3].map((v) => [`royalist${v}`, royalist(v)])),
  ...Object.fromEntries([0, 1, 2, 3].map((v) => [`mamluk${v}`, mamluk(v)])),
  ...Object.fromEntries([0, 1, 2].map((v) => [`savant${v}`, savant(v)])),
  ...Object.fromEntries([0, 1, 2, 3].map((v) => [`lawmaker${v}`, lawmaker(v)])),
};

// ---------------- staging ----------------
export const who = (c: Char): Who => ({ i: c.i, o: c.o, okey: c.okey });
export type PutOpts = {
  /** front-view options (mode, expr, prop, facing, look, tilt, wave ...); defaults: stand, the preset's expression, blinks */
  fo?: FrontOpts;
  /** side-view options; defaults: stand, the preset's expression, blinks */
  so?: SideOpts;
  /** draw the profile (facing screen-right; mirror = facing left) instead of the front view */
  side?: boolean; mirror?: boolean;
  /** walking along (dx, dz) at march phase `phase`: picks front / side and mirroring from the camera, legs in step */
  walk?: { dx: number; dz: number; phase: number };
  /** contact blob under the feet (default true) */
  blob?: boolean;
};
/** stage one character at (x, y, z) for camera `cam` at time t (seconds, for blinks) */
export const put = (cam: CamInfo, out: Stage, t: number, c: Char, x: number, y: number, z: number, opt: PutOpts = {}) => {
  const lid = lidAt(t, c.i);
  let view = { side: !!opt.side, mirror: !!opt.mirror }, fo: FrontOpts = { mode: "stand", expr: c.expr, blink: lid, ...opt.fo }, so: SideOpts = { mode: "stand", expr: c.expr, blink: lid, ...opt.so };
  if (opt.walk) {
    const v = viewOf(cam, x, z, opt.walk.dx, opt.walk.dz), ph = Math.round(opt.walk.phase * 16) / 16;
    view = { side: v.side, mirror: v.mirror };
    fo = { ...fo, mode: "march", phase: ph }; so = { ...so, mode: "march", phase: ph, stride: Math.max(0.3, v.fs) };
  }
  out.places.push(person(cam, who(c), x, y, z, view, fo, so, c.scale));
  if (opt.blob !== false) blob(out, x, y, z, c.scale * (c.o.build === "kid" ? 0.8 : 1));
};
