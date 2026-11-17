// Chapter 1 cast: who stands where in every shot, plus the one-off effect cards (snow, musket smoke, the baby, the
// letter, the empty purse, the crown's sparkle). Shared presets come from ../shared/cast; the chapter-only people
// (white-coated royal troops of 1768, Corsican fighters and townsfolk, the governor, the siblings, coronation guests)
// are built here from the engine Outfit fields.
import { Pen, INK, SKINS, Expr, Outfit, FrontOpts, fxPuff, townsfolk } from "../../../src/engine/toon";
import { CamInfo, Stage, hh, q, lidAt, person, blob, setStageLight, SU } from "../../../src/engine/cards";
import {
  Char, put, who, NAP_CHILD, NAP_CADET, NAP_EMPEROR, NAP_EMPEROR_CROWN, CARLO, LETIZIA, JOSEPHINE_EMPRESS, POPE, schoolboy, frenchSoldier,
  frenchOfficer, lawmaker, GOLD, FR_RED, FR_BLUE,
} from "../shared/cast";
import { ND_SPOTS } from "../shared/notredame";
import { FPS, SHOTS, G, INT, EXT, SCH, HOME, PALACE_DOOR, CASA, at, crownK, CROWN_ON, doorOpen, shipPt, arrivePose, DECK, smooth, clamp01, V3 } from "./story";

const C = (i: number, okey: string, o: Outfit, expr: Expr = "neutral", scale = 1): Char => ({ i, okey, o, expr, scale });
const LEAD = 2 / FPS;
const POWDER = "#e7e2d8";

// ---------------- chapter people ----------------
/** French royal infantry, 1768: white coats with blue or red facings, black tricorne with white lace and the white cockade */
const whiteCoat = (v: number): Char => {
  const k = v % 4, fac = k % 2 ? FR_BLUE : FR_RED;
  return C(300 + k, `wc${k}`, { jacket: "#eeeadf", pants: "#eeeadf", boots: INK, hat: "tricorne", hatTrim: "#f2efe6", cockade: "#f7f4ec", lapels: fac, collar: fac,
    belt: "#d9cfa8", buttons: GOLD, rifle: true, skin: SKINS[k], moustache: k === 2 ? "#3a2a20" : undefined, locks: POWDER, lockLen: 0.25 }, k % 2 ? "stern" : "neutral");
};
/** Corsican fighters / townsmen (v 0..5): brown and green jackets, the Corsican cap (barretta), beards; armed = musket */
const corsican = (v: number, armed = true): Char => {
  const k = v % 6;
  return C(310 + k, `cor${k}${armed ? "a" : ""}`, {
    jacket: ["#6b4a2e", "#4a5a3a", "#5a3a2a", "#3d3a4a", "#7a5a38", "#4f4636"][k], pants: ["#3b3f52", "#8a7458", "#3b3f52", "#6f5f48", "#3b3f52", "#8a7458"][k],
    boots: "#3a2a20", hat: k === 4 ? "tricorne" : "cap", cockade: null, cap: ["#3a2a20", "#2a2226", "#8c2f2f", "#3a2a20", "#2a2226", "#5a3046"][k],
    beard: k % 3 === 0 ? "#2a1f1c" : undefined, moustache: k % 3 === 1 ? "#2a1f1c" : undefined, skin: SKINS[[1, 3, 1, 2, 3, 1][k]], rifle: armed, belt: armed ? "#8a6a4a" : undefined,
  }, k % 2 ? "stern" : "neutral");
};
/** Corsican women in the street */
const corsicanWoman = (v: number): Char => {
  const k = v % 3;
  return C(320 + k, `corw${k}`, { jacket: ["#e8dcc0", "#d9c29a", "#efe6d2"][k], dress: ["#2f3f5a", "#5a2e2e", "#3f5a3a"][k], pants: "#2f3f5a", boots: "#3a2a20", hat: "hair",
    hair: ["#1f1715", "#3a2418", "#2a1f1c"][k], locks: ["#1f1715", "#3a2418", "#2a1f1c"][k], lockLen: 0.5, skin: SKINS[[1, 2, 3][k]] }, "smile");
};
/** the Comte de Marbeuf, French governor of Corsica: stout, white coat with gold, gold-laced tricorne, powdered hair */
const GOVERNOR = C(330, "governor", { jacket: "#f0ebdf", pants: "#f0ebdf", boots: INK, hat: "tricorne", hatTrim: GOLD, cockade: "#f7f4ec", lapels: "#2c4790", collar: "#2c4790",
  epaulettes: GOLD, sash: FR_RED, buttons: GOLD, sword: true, locks: POWDER, lockLen: 0.35, build: "stout", skin: SKINS[0] }, "smile");
const CARLO_ARMED = C(CARLO.i, "carloArmed", { ...CARLO.o, rifle: true, belt: "#8a6a4a" }, "stern");
/** Josephine at the altar before her own crowning: the empress's mantle, no crown yet */
const JOSEPHINE_CORONATION = C(JOSEPHINE_EMPRESS.i, "josephineCor", { ...JOSEPHINE_EMPRESS.o, hat: "hair", hair: "#2a1a17" }, "smile_closed");
/** Napoleone's brothers and sisters (seven; with him the eight who grew up), oldest first */
const SIBS: Char[] = [
  C(340, "sibJoseph", { jacket: "#5a7a9a", pants: "#4a3a2a", boots: "#3a2a20", hat: "hair", hair: "#3a2418", lapels: "#efe6cc", build: "kid", skin: SKINS[1] }, "smile", 1.08),
  C(341, "sibElisa", { jacket: "#e8dcc0", dress: "#8c3b4a", pants: "#8c3b4a", boots: "#3a2a20", hat: "hair", hair: "#2a1a17", locks: "#2a1a17", lockLen: 0.5, build: "kid", skin: SKINS[1] }, "neutral", 0.95),
  C(342, "sibLucien", { jacket: "#4a6a3a", pants: "#4a3a2a", boots: "#3a2a20", hat: "hair", hair: "#3a2418", lapels: "#efe6cc", build: "kid", skin: SKINS[1] }, "grin", 0.92),
  C(343, "sibLouis", { jacket: "#b5653f", pants: "#4a3a2a", boots: "#3a2a20", hat: "hair", hair: "#2b1f1c", build: "kid", skin: SKINS[2] }, "smile_closed", 0.85),
  C(344, "sibPauline", { jacket: "#f1e3c6", dress: "#d07a8a", pants: "#d07a8a", boots: "#3a2a20", hat: "hair", hair: "#3a2418", locks: "#3a2418", lockLen: 0.6, build: "kid", skin: SKINS[0] }, "smile", 0.8),
  C(345, "sibCaroline", { jacket: "#f1e3c6", dress: "#5a8fc2", pants: "#5a8fc2", boots: "#3a2a20", hat: "hair", hair: "#5a3a22", locks: "#5a3a22", lockLen: 0.5, build: "kid", skin: SKINS[0] }, "grin", 0.74),
  C(346, "sibJerome", { jacket: "#d9a441", pants: "#4a3a2a", boots: "#3a2a20", hat: "hair", hair: "#2b1f1c", build: "kid", skin: SKINS[1] }, "laugh", 0.66),
];
/** coronation ladies: Empire dresses (white / cream / pale) with coloured bodices, dark or fair curls */
const lady = (v: number): Char => {
  const k = v % 4;
  return C(350 + k, `lady${k}`, { jacket: ["#c25a7a", "#5a8fc2", "#e8b53e", "#7b5ac9"][k], dress: ["#f6f1e6", "#efe6d2", "#f6f1e6", "#e9e2f0"][k], pants: "#f6f1e6", boots: "#c9a46a",
    hat: "hair", hair: ["#2a1a17", "#d9b45c", "#5a3a22", "#1f1715"][k], locks: ["#2a1a17", "#d9b45c", "#5a3a22", "#1f1715"][k], lockLen: 0.6, skin: SKINS[[0, 0, 2, 1][k]] }, "smile_closed");
};
/** the guest mix in the nave (officers, deputies, ladies) */
const GUESTS: Char[] = [frenchOfficer(0), lady(0), lawmaker(1), lady(1), frenchOfficer(1), lady(2), lawmaker(3), frenchOfficer(2), lady(3), lawmaker(0)];

// ---------------- effect drawings ----------------
const flake = (p: Pen) => p.ell(32, 32, 26, 26, "#ffffff", 0);
const baby = (p: Pen, x: number, y: number) => {
  p.ell(x, y, 66, 44, "#f6f0e2", 6, 0, 360, -0.18);          // swaddling
  p.ell(x - 4, y + 10, 50, 26, "#ece2cc", 0, 0, 360, -0.18);
  p.ell(x - 30, y - 12, 26, 24, "#ffd9b8", 5);                // face
  p.arc(x - 39, y - 14, 5, 3, 200, 340, 3); p.arc(x - 24, y - 15, 5, 3, 200, 340, 3); // sleeping eyes
  p.arc(x - 31, y - 3, 5, 3, 20, 160, 3);
  p.ell(x - 30, y - 34, 24, 10, "#f6f0e2", 5, 180, 360);     // little bonnet
};
const letter = (p: Pen) => {
  p.poly([[20, 30], [180, 30], [180, 130], [20, 130]], "#f4ecd8", 6);
  p.stroke([[20, 30], [100, 88], [180, 30]], 5);
  p.ell(100, 92, 20, 20, "#b8262e", 5);
  p.ell(100, 92, 9, 9, "#8c1a22", 0);
};
const purse = (p: Pen) => {
  p.poly([[60, 60], [140, 60], [170, 170], [30, 170]], "#8a5a36", 6);
  p.stroke([[60, 60], [80, 40], [120, 40], [140, 60]], 6);
  p.ell(100, 182, 14, 9, GOLD, 4);                         // one lonely coin
  p.stroke([[150, 80], [170, 64]], 4); p.stroke([[160, 96], [184, 92]], 4); // a moth's flutter
  p.ell(176, 72, 10, 6, "#c9bfae", 3);
};
const sparkle = (p: Pen, t: number) => {
  const a = 1 - t;
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + t, d = 60 + 150 * t, x = 250 + Math.cos(ang) * d, y = 250 + Math.sin(ang) * d * 0.7, r = 26 * a + 6;
    p.poly([[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], "#ffe58a", 0);
  }
};

// ---------------- helpers ----------------
type Out = Stage;
const fxAt = (out: Out, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, rot = 0, soft = false) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h, rot, soft });
/** muzzle smoke: a puff growing and fading for 1.6 s after t0, a short flash at the start */
const volley = (out: Out, t: number, t0: number, x: number, y: number, z: number, dir: number) => {
  const u = (t - t0) / 1.6;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 30);
  const sz = 0.3 + 2.4 * Math.sqrt(Math.min(1, u * 3)) + 0.4 * u;
  fxAt(out, `puff${uq}`, 300, 300, (p) => fxPuff(p, uq), x + dir * (0.6 + 0.9 * u), y + 0.25 * u, z, sz, sz, 0, true);
};
/** a Place with an extra drawing on top of the character (baby in arms, letter in hand) */
const withExtra = (pl: ReturnType<typeof person>, tag: string, extra: (p: Pen) => void) => {
  const d = pl.draw; pl.key += tag; pl.draw = (p) => { d(p); extra(p); }; return pl;
};

// ---------------- per set ----------------
const parvis = (cam: CamInfo, t: number, out: Out) => {
  const E = (x: number, z: number): [number, number, number] => at(EXT, x, 0, z);
  for (let z = 8; z <= 44; z += 6) for (const s of [-1, 1]) { const [x, y, zz] = E(s * 4.2, z); put(cam, out, t, frenchSoldier((z / 6 + (s > 0 ? 1 : 0)) % 6), x, y, zz); }
  for (let i = 0; i < 26; i++) {
    const s = i % 2 ? 1 : -1, [x, y, z] = E(s * (6.5 + hh(i, 3) * 4), 10 + hh(i, 4) * 40);
    const o = townsfolk(i % 6);
    out.places.push(person(cam, { i: 400 + i, o, okey: `tf${i % 6}` }, x, y, z, { side: false, mirror: false }, { mode: "stand", expr: (["smile", "neutral", "grin"] as Expr[])[i % 3], blink: lidAt(t, 400 + i) }, {}));
    blob(out, x, y, z);
  }
  // snow: a box of flakes in front of the lens, falling and drifting
  for (let i = 0; i < 90; i++) {
    const fy = ((hh(i, 1) * 34 - t * (1.0 + 0.6 * hh(i, 2))) % 34 + 34) % 34;
    const [x, , z] = E((hh(i, 5) - 0.5) * 50 + Math.sin(t * 0.7 + i) * 0.6, 50 + hh(i, 6) * 58);
    const s = 0.16 + 0.18 * hh(i, 7);
    fxAt(out, "flake", 64, 64, flake, x, fy, z, s, s, 0, true);
  }
};

const nave = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  const I = (x: number, y: number, z: number) => at(INT, x, y, z);
  const crowned = (id === 3 && f >= CROWN_ON) || id === 4 || id === 8;
  // guests: nave rows + aisles; reactions to the crowning (gasp) and to the name (smiles)
  const spots = [...ND_SPOTS.guests];
  for (let row = 0; row < 8; row++) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) spots.push([s * (8.8 + k * 1.3), -9 - row * 3.6]);
  spots.forEach(([gx, gz], i) => {
    const c = GUESTS[i % GUESTS.length];
    let expr: Expr = (["neutral", "smile_closed", "smile", "neutral"] as Expr[])[i % 4];
    if (id === 3 && f >= CROWN_ON - 2) expr = i % 3 === 0 ? "shock" : i % 3 === 1 ? "nervous" : "shock";
    if (id === 4 && f >= 558) expr = i % 2 ? "grin" : "smile";
    const [x, y, z] = I(gx, 0, gz);
    put(cam, out, t, { ...c, i: 500 + i }, x, y, z, { fo: { expr, look: Math.round(Math.sin(i * 1.7) * 1.2) } });
  });
  ND_SPOTS.guards.forEach(([gx, gz], i) => { const [x, y, z] = I(gx, 0, gz); put(cam, out, t, { ...frenchSoldier(i % 6), i: 600 + i }, x, y, z, { fo: { expr: "stern" } }); });
  // the Pope in front of his throne (blessing on "the Pope himself"), Josephine, Napoleon at the altar
  const [px, py, pz] = ND_SPOTS.popeThrone;
  const bless = id === 2 && f >= 199 ? q(Math.sin((f - 199) * 0.12) * 0.6, 20) : undefined;
  const pe: Expr = id === 3 && f >= CROWN_ON ? "shock" : id === 2 ? "smile_closed" : "neutral";
  put(cam, out, t, POPE, ...I(px, py, pz + 1.75), { fo: { expr: pe, wave: bless } });
  if (id !== 2) {
    const [jx, jy, jz] = ND_SPOTS.josephine;
    put(cam, out, t, JOSEPHINE_CORONATION, ...I(jx + 0.4, jy, jz), { fo: { expr: id === 3 && f >= CROWN_ON ? "shock" : "smile_closed" } });
    const [nx, ny, nz] = id === 8 ? [ND_SPOTS.imperialThrone[0], ND_SPOTS.imperialThrone[1], ND_SPOTS.imperialThrone[2] + 0.95] : ND_SPOTS.napoleon;
    const c = crowned ? NAP_EMPEROR_CROWN : NAP_EMPEROR;
    const fo: FrontOpts = { expr: "stern" };
    if (id === 3 && f < CROWN_ON) fo.prop = ["crown", q(crownK(f), 60)];
    if (id === 3 && f >= CROWN_ON) fo.expr = "stern";
    if (id === 4) fo.expr = f < 560 - 2 ? "stern" : "smile_closed";
    if (id === 8) fo.expr = f < 1020 ? "stern" : "smile_closed";
    put(cam, out, t, c, ...I(nx, ny, nz), { fo });
    // the crown's sparkle at the moment it is on
    if (id === 3 && f >= CROWN_ON && f < CROWN_ON + 14) {
      const u = q((f - CROWN_ON) / 14, 14);
      fxAt(out, `spark${u}`, 500, 500, (p) => sparkle(p, u), ...I(nx + 0.02, ny + 1.98, nz + 0.15), 1.1, 1.1);
    }
  }
};

const school = (f: number, t: number, cam: CamInfo, out: Out) => {
  const S = (x: number, z: number) => at(SCH, x, 0, z);
  const laughed = f >= 739;
  put(cam, out, t, NAP_CADET, ...S(0, 0), { fo: { expr: laughed ? "pained" : f >= 672 ? "nervous" : "stern", look: laughed ? -1 : 0, headTilt: laughed ? -4 : 0 } });
  ([[-1.55, 0.7], [1.5, 0.55], [-2.7, -1.3], [2.5, -1.5], [0.95, -2.5], [-0.9, -2.7]] as const).forEach(([x, z], i) => {
    const c = schoolboy(i % 3, true), shake = Math.sin(t * 9 + i * 1.3);
    const expr: Expr = (["laugh", "grin", "laugh"] as Expr[])[i % 3];
    put(cam, out, t, { ...c, i: 700 + i }, ...S(x, z), { fo: { expr, tilt: q(3 * shake, 4), wave: i === 0 || i === 3 ? q(0.5 + 0.5 * shake, 6) : undefined, facing: (x < 0 ? 1 : -1) as 1 | -1 } });
  });
};

const harbour = (t: number, cam: CamInfo, out: Out) => {
  // two fishermen sitting in their boats
  ([[-45, -24, 0], [-6, -17, 3]] as const).forEach(([x, z, v], i) => {
    const bob = 0.06 * Math.sin(t * 1.6 + (i ? 1.7 * 2 : 1.7));
    out.places.push(person(cam, { i: 800 + i, o: corsican(v, false).o, okey: `cor${v}` }, x - 0.4, 0.42 + bob, z, { side: false, mirror: false }, { mode: "sit", expr: i ? "smile_closed" : "neutral", blink: lidAt(t, 800 + i) }, {}));
  });
};

const arrival = (f: number, t: number, cam: CamInfo, out: Out) => {
  const s = arrivePose(f), bob = 0.12 * Math.sin(t * 1.3);
  [-4, -1, 2, 5].forEach((lx, i) => {
    const c = Math.cos(s.yaw), n = Math.sin(s.yaw), lz = i % 2 ? 1.2 : -1.0;
    put(cam, out, t, whiteCoat(i), s.x + lx * c + lz * n, -0.8 + 0.085 * 30 + bob, s.z - lx * n + lz * c, { blob: false });
  });
};

const CORS_POS: [number, number][] = [[230.5, 99.2], [228.2, 100.8], [231.8, 101.6], [229.0, 97.4], [226.6, 99.6], [227.6, 102.8]];
const WC_POS: [number, number][] = [[244.5, 98.8], [246.4, 100.6], [245.2, 102.4], [247.4, 97.6], [248.6, 101.2], [246.8, 103.6], [249.6, 99.0]];
/** the standoff (shot 12) and Carlo's fight (shot 16) */
const field = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  const close = (id === 12 && f >= 1510) || (id === 16 && f >= 2181);
  const lost = (id === 12 && f >= 1512) || (id === 16 && f >= 2161);
  const shots = id === 12 ? [1440, 1468, 1492] : [2100, 2124, 2142], lostF = id === 12 ? 1500 : 2150;
  CORS_POS.forEach(([x, z], i) => {
    const carlo = id === 16 && i === 0, c = carlo ? CARLO_ARMED : corsican(i);
    let expr: Expr = lost ? (i % 2 ? "pained" : "nervous") : i % 2 ? "stern" : "neutral";
    if (carlo) expr = f >= 2181 ? "grin" : lost ? "nervous" : "stern";
    if (close || id === 16) put(cam, out, t, c, x, G, z, { fo: { expr, headTilt: lost && !carlo ? -5 : 0, facing: 1 } });
    else put(cam, out, t, c, x, G, z, { side: true, mirror: false, so: { expr, mode: "stand" } });
    for (const [k, s0] of shots.entries()) if (!close && (i + k) % 2 === 0 && s0 + i * 3 < lostF) volley(out, t, (s0 + i * 3) / FPS, x, G + 1.75, z, 1);
  });
  WC_POS.forEach(([x, z], i) => {
    put(cam, out, t, whiteCoat(i), x, G, z, close ? { fo: { expr: "stern" } } : { side: true, mirror: true, so: { expr: lost ? "grin" : "stern", mode: "stand" } });
    for (const [k, s0] of shots.entries()) if ((i + k) % 2 === 1) volley(out, t, (s0 + 10 + i * 2) / FPS, x, G + 1.75, z, -1);
  });
};

const street = (t: number, cam: CamInfo, out: Out) => {
  // townsfolk passing in front of the Buonaparte house
  const tt = t - 1553 / FPS;
  put(cam, out, t, corsicanWoman(0), CASA[0] + 6 - 0.9 * tt, G, 22.2, { walk: { dx: -1, dz: 0, phase: (tt * 0.9) % 1 } });
  put(cam, out, t, corsican(1, false), CASA[0] - 7 + 0.8 * tt, G, 23.4, { walk: { dx: 1, dz: 0, phase: (tt * 0.85 + 0.3) % 1 } });
  put(cam, out, t, corsicanWoman(2), CASA[0] - 3.4, G, 24.6, { fo: { expr: "smile" } });
  put(cam, out, t, corsican(4, false), CASA[0] - 2.4, G, 24.9, { fo: { expr: "grin" } });
};

const home = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  const H = (x: number, z: number) => at(HOME, x, 0, z);
  if (id === 14) {
    // Letizia with the baby in her arms, Carlo proud beside her
    const [lx, ly, lz] = H(-0.45, -1.2);
    const pl = person(cam, who(LETIZIA), lx, ly, lz, { side: false, mirror: false }, { mode: "stand", expr: "smile_closed", blink: lidAt(t, LETIZIA.i) }, {});
    out.places.push(withExtra(pl, "|baby", (p) => baby(p, 300, 528)));
    blob(out, lx, ly, lz);
    put(cam, out, t, CARLO, ...H(0.75, -0.95), { fo: { expr: f >= 1733 ? "grin" : "smile", facing: -1 } });
  }
  if (id === 15) {
    if (f < 1943) {
      // Carlo the lawyer at his desk: the book, proud on "proud of the name", then the empty purse
      const purseOn = f >= 1906;
      const expr: Expr = purseOn ? "nervous" : f >= 1885 ? "grin" : "smile";
      put(cam, out, t, CARLO, ...H(2.15, -1.3), { fo: { expr, prop: purseOn ? null : "book", tilt: f >= 1885 && !purseOn ? 3 : 0 } });
      if (purseOn) { const [x, , z] = H(2.48, -1.05); fxAt(out, "purse", 200, 200, purse, x, 1.0 + 0.02 * Math.sin(t * 5), z, 0.36, 0.36, -0.15); }
    } else if (f < 2055) {
      // Letizia's strict house: eight children in a row by age, Letizia at the end
      put(cam, out, t, LETIZIA, ...H(-3.25, -0.25), { fo: { expr: "stern", facing: 1 } });
      const row = [SIBS[0], NAP_CHILD, ...SIBS.slice(1)];
      row.forEach((c, k) => {
        const fidget = k === 7 ? q(Math.sin(t * 6) * 4, 4) : 0;
        put(cam, out, t, c, ...H(-2.45 + k * 0.72, -0.5 + (k % 2) * 0.08), { fo: { expr: k === 1 ? "stern" : c.expr, tilt: fidget, look: k === 1 ? 1 : 0 } });
      });
    } else {
      put(cam, out, t, CARLO, ...H(2.15, -1.3), { fo: { expr: "grin", facing: -1, look: -1 } });
    }
  }
  if (id === 18) {
    // Carlo shows the boy the letter; surprise on "his boy", joy on "got one"
    const [cx, cy, cz] = H(0.75, -1.05);
    const pl = person(cam, who(CARLO), cx, cy, cz, { side: false, mirror: false }, { mode: "stand", expr: "grin", prop: "book", facing: -1, blink: lidAt(t, CARLO.i) }, {});
    out.places.push(withExtra(pl, "|letter", (p) => { p.rot = null; letterInHands(p); }));
    blob(out, cx, cy, cz);
    const bexpr: Expr = f < 2602 ? "neutral" : f < 2616 ? "shock" : "grin";
    const hop = f >= 2616 ? Math.max(0, Math.sin((f - 2616) * 0.42)) * 0.12 : 0;
    put(cam, out, t, NAP_CHILD, ...H(-0.25, -0.85 + 0), { fo: { expr: bexpr, facing: 1, look: f < 2602 ? 1 : 0 } });
    if (hop > 0) out.places[out.places.length - 1].y += hop;
  }
};
/** the letter held open in both hands (over the "book" pose's open book, chest height of an adult card) */
const letterInHands = (p: Pen) => {
  p.poly([[218, 462], [384, 462], [384, 580], [218, 580]], "#f4ecd8", 6);
  for (let y = 486; y < 556; y += 13) p.stroke([[236, y], [366, y + (y % 26 ? 2 : -2)]], 3, "rgba(60,50,70,0.7)");
  p.ell(356, 562, 14, 14, "#b8262e", 4);
};

const square = (f: number, t: number, cam: CamInfo, out: Out) => {
  const [dx, , dz] = PALACE_DOOR;
  put(cam, out, t, whiteCoat(0), dx - 3.4, G, dz - 0.5, { fo: { expr: "stern" } });
  put(cam, out, t, whiteCoat(1), dx + 3.4, G, dz - 0.5, { fo: { expr: "stern" } });
  if (f < 2327) {
    // they walk up to each other, then shake hands (side views, hands meeting between them)
    const u = smooth((f - 2225) / 36), cx = 56.5 + (59.5 - 56.5) * u, gx = 63.5 + (60.5 - 63.5) * u;
    if (f < 2262) {
      const ph = ((f - 2225) / FPS) * 1.1 % 1;
      put(cam, out, t, CARLO, cx, G, 31, { walk: { dx: 1, dz: 0, phase: ph }, so: { expr: "smile" } });
      put(cam, out, t, GOVERNOR, gx, G, 31, { walk: { dx: -1, dz: 0, phase: (ph + 0.5) % 1 }, so: { expr: "smile" } });
    } else {
      const k = smooth((f - 2262) / 10), shake = q(Math.sin((f - 2272) * 0.6) * 14 * clamp01((f - 2272) / 6), 2);
      const hand: [number, number] = [300 + 0.5 / SU, 975 - 1.02 / SU + shake];
      put(cam, out, t, CARLO, 59.5, G, 31, { side: true, so: { mode: "push", pose: q(0.55 * k, 20), hand, expr: "grin" } });
      put(cam, out, t, GOVERNOR, 60.5, G, 31, { side: true, mirror: true, so: { mode: "push", pose: q(0.55 * k, 20), hand, expr: "grin" } });
    }
  } else if (f < 2420) {
    // the door opens behind them; they step aside and turn to look
    const o = doorOpen(f), e: Expr = f < 2350 ? "smile" : f < 2380 ? "shock" : "grin";
    put(cam, out, t, CARLO, 58.0, G, 31.4, { fo: { expr: e, facing: 1, look: f >= 2350 ? 1 : 0 } });
    put(cam, out, t, GOVERNOR, 62.0, G, 31.4, { fo: { expr: f < 2350 ? "smile" : "grin", facing: -1, look: f >= 2350 ? -1 : 0 } });
    if (o > 0.05) for (let i = 0; i < 10; i++) { // motes in the light
      const u = (t * 0.25 + hh(i, 3)) % 1, s = 0.06 + 0.05 * hh(i, 4);
      fxAt(out, "mote", 64, 64, flake, dx + (hh(i, 5) - 0.5) * 2.2, G + 0.5 + 3 * hh(i, 6) + 0.6 * u, dz - 0.6 - 3.5 * hh(i, 7), s * o, s * o, 0, true);
    }
  } else {
    // the governor offers the letter (free school places); Carlo takes it on "and Carlo made sure"
    const give = f >= 2548, k = smooth((f - 2440) / 14), reach = smooth((f - 2522) / 16) * (1 - smooth((f - 2556) / 14));
    const hand: [number, number] = [300 + 0.52 / SU, 975 - 1.06 / SU];
    put(cam, out, t, GOVERNOR, 60.5, G, 31.4, { side: true, mirror: true, so: { mode: give ? "stand" : "push", pose: q(0.5 * k, 20), hand, expr: "smile" } });
    put(cam, out, t, CARLO, 59.4, G, 31.4, { side: true, so: { mode: give ? "stand" : "push", pose: q(0.5 * reach, 20), hand, expr: f >= 2510 ? "grin" : "smile" } });
    // the letter: in the governor's hand, then Carlo's, then held up to the light
    const lx = give ? 59.5 + 0.25 * smooth((f - 2548) / 10) : 60.5 - 0.52 * k, ly = give ? G + 1.15 + 0.5 * smooth((f - 2548) / 12) : G + 1.06;
    fxAt(out, "letter", 200, 160, letter, lx, ly, 31.15, 0.34, 0.27, give ? 0.1 : -0.1);
  }
  // a couple of townsfolk crossing the far side of the square
  const tt = t - 2225 / FPS;
  put(cam, out, t, corsicanWoman(1), 47 + 0.9 * tt, G, 35.2, { walk: { dx: 1, dz: 0, phase: (tt * 0.9) % 1 } });
  put(cam, out, t, corsican(5, false), 76 - 0.8 * tt, G, 34.4, { walk: { dx: -1, dz: 0, phase: (tt * 0.85) % 1 } });
};

/** golden departure: the family on the quay, the boy and Carlo aboard */
const departure = (id: number, f: number, t: number, cam: CamInfo, out: Out) => {
  const bob = 0.1 * Math.sin(t * 1.2), wave = q(Math.sin(t * 7), 8);
  const boyExpr: Expr = id === 19 ? (f < 2748 ? "smile_closed" : "smile") : id === 20 ? (f < 2898 ? "neutral" : "nervous") : "nervous";
  const boyAt = id === 19 ? shipPt(19, f, 1.4, DECK, 2.1) : shipPt(id, f, -9.6, DECK, 0);
  const carloAt = id === 19 ? shipPt(19, f, 2.7, DECK, 1.9) : shipPt(id, f, -8.3, DECK, 1.2);
  put(cam, out, t, NAP_CHILD, boyAt[0], boyAt[1] + bob, boyAt[2], { blob: false, fo: { expr: boyExpr, wave: id === 21 ? undefined : wave, facing: (id === 19 ? 1 : 0) as 0 | 1 } });
  put(cam, out, t, CARLO, carloAt[0], carloAt[1] + bob, carloAt[2], { blob: false, fo: { expr: id === 21 ? "smile_closed" : "smile", facing: -1 } });
  if (id === 19) {
    put(cam, out, t, LETIZIA, -15.6, G, 2.4, { fo: { expr: "nervous", facing: -1 } });
    SIBS.slice(0, 6).forEach((c, k) => {
      const [x, z] = [[-13.8, 3.2], [-17.2, 2.9], [-18.6, 3.6], [-12.6, 2.2], [-16.6, 1.5], [-14.4, 1.4]][k];
      put(cam, out, t, c, x, G, z, { fo: { expr: k % 2 ? "smile" : "nervous", wave: k === 2 ? undefined : q(Math.sin(t * 7 + k), 8), facing: -1 } });
    });
  }
};

/** everything with a face in shot `id` at frame f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] }, t = f / FPS, s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  if (id === 1) parvis(cam, t, out);
  if (id === 2 || id === 3 || id === 4 || id === 8) nave(id, f, t, cam, out);
  if (id === 5) school(f, t, cam, out);
  if (id === 7) harbour(t, cam, out);
  if (id === 11) arrival(f, t, cam, out);
  if (id === 12 || id === 16) field(id, f, t, cam, out);
  if (id === 13) street(t, cam, out);
  if (id === 14 || id === 15 || id === 18) home(id, f, t, cam, out);
  if (id === 17) square(f, t, cam, out);
  if (id >= 19) departure(id, f, t, cam, out);
  return out;
};
export type { V3 };
export { LEAD };
