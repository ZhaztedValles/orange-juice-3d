// Chapter 2 cast: who stands where in every shot, plus the one-off effect cards (snowfall, breath, snowballs, thought
// bubble, cannon smoke, the letter, coins). Napoleone and the rich schoolboys come from ../shared/cast; the presets
// below are chapter-local spreads of the shared outfits (new okey, own i), as shared/README.md asks.
import { Pen, Expr, townsfolk, Outfit } from "../../../src/engine/toon";
import { CamInfo, Stage, q, hh, lidAt, setStageLight } from "../../../src/engine/cards";
import { NAP_CHILD, NAP_CADET, NAP_GENERAL, schoolboy, frenchOfficer, savant, put, Char, GOLD, FR_RED, PutOpts } from "../shared/cast";
import {
  FPS, SHOTS, P, PlaceId, V3, clamp01, smooth, napWalkX, NAP_WALK, WALKOFF, FORT0, FORT1, FIRE1, FIRE2, HIT2, LETTER_SAD, FLASH_AT,
} from "./story";

const WHITE_COCKADE = "#f7f4ec"; // the royal army before 1789
const POWDER = "#e7e2d8";
const ch = (c: Char, okey: string, o: Partial<Outfit>, i = c.i, expr: Expr = c.expr): Char => ({ ...c, i, okey, o: { ...c.o, ...o }, expr });
/** Napoleone at Brienne (10-14): the cadet's school coat on the kid build */
export const NAP_KID = ch(NAP_CADET, "napCadetKid", { build: "kid" });
/** second lieutenant of artillery, 1785: blue coat, red collar, one gold epaulette, white royal cockade, sword */
export const NAP_LIEUT = ch(NAP_GENERAL, "napLieut", { sash: undefined, cockade: WHITE_COCKADE, lockLen: 0.7, epaulettes: GOLD, lapels: "#273f7c" });
/** extra Brienne boys (bigger, older): same blue school coat, other hair; kid or teen build */
const boyX = (v: number, teen: boolean): Char => {
  const base = schoolboy(v);
  return ch(base, `boyX${v}${teen ? "t" : "k"}`, { hair: ["#2a1f1c", "#a87a4a", "#7a3a22"][v % 3], build: teen ? "teen" : "kid" }, 113 + (v % 3), (["laugh", "grin", "laugh"] as Expr[])[v % 3]);
};
/** the Autun abbe: black cassock, white bands, grey hair */
const ABBE = ch(savant(2), "abbe", { jacket: "#2b2733", robe: "#2b2733", pants: "#2b2733", boots: "#1f1b22", hat: "hair", hair: "#a9a39a", lapels: "#f2efe6", build: undefined }, 120, "smile");
/** the Brienne master, a Minim friar: brown habit, grey hair */
const FRIAR = ch(savant(1), "friar", { jacket: "#6a4a32", robe: "#6a4a32", pants: "#6a4a32", boots: "#3a2a20", hat: "hair", hair: "#8a8580", lapels: "#5a3e2a", cockade: null }, 121, "neutral");
/** the royal artillery instructor (Ecole Militaire, 1784-85): white royal cockade */
const INSTRUCTOR = ch(frenchOfficer(1), "instructor", { cockade: WHITE_COCKADE }, 125, "stern");
/** a stout noble general and the rich boy, now an officer, he promotes */
const NOBLE = ch(frenchOfficer(2), "nobleGen", { cockade: WHITE_COCKADE, build: "stout", locks: POWDER, epaulettes: GOLD, plume: "#f5f2ea" }, 126, "laugh");
const RICH_OFFICER = ch(schoolboy(0, true), "richOff", { epaulettes: GOLD, hat: "bicorne", hatTrim: GOLD, cockade: WHITE_COCKADE, locks: "#d9b45c", lockLen: 0.3, sword: true }, 110, "grin");
const KIDS = [schoolboy(0), schoolboy(1), schoolboy(2), boyX(0, false), boyX(1, false), boyX(2, false)];
const TEENS = [schoolboy(0, true), schoolboy(1, true), schoolboy(2, true)];
/** Parisians of 1789: townsfolk coats, red caps on some of the men */
const PARIS: Char[] = [0, 1, 2, 3, 4, 5, 6, 7].map((v) => {
  const o = townsfolk(v % 6);
  const red = v % 4 === 2 || v === 6;
  return { i: 300 + v, okey: `paris${v}`, o: red ? { ...o, hat: "cap", cap: "#c23a3a", dress: undefined } : o, scale: 1, expr: (["laugh", "grin", "shock", "laugh"] as Expr[])[v % 4] };
});

const LEAD = 2 / FPS;
type Ctx = { cam: CamInfo; out: Stage; t: number; pl: PlaceId };
const at = (c: Ctx, ch2: Char, x: number, y: number, z: number, o: PutOpts = {}, mirror = false) => {
  const [X, Y, Z] = P(c.pl, x, y, z);
  put(c.cam, c.out, c.t, ch2, X, Y, Z, o);
  if (mirror) { const p = c.out.places[c.out.places.length - 1]; p.mirror = !p.mirror; }
};
/** a walker in profile along +x / -x at speed v (m/s), legs in step */
const walkOpt = (dx: number, t: number, v = 1.3): PutOpts => ({ walk: { dx, dz: 0, phase: ((t * v) / 1.6) % 1 } });
const fxAt = (c: Ctx, key: string, cw: number, chh: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: { rot?: number; flat?: boolean; soft?: boolean } = {}) => {
  const [X, Y, Z] = P(c.pl, x, y, z);
  c.out.fx.push({ key, cw, ch: chh, draw, x: X, y: Y, z: Z, w, h, ...extra });
};

// ---------------- effect drawings ----------------
const flake = (p: Pen) => { p.ell(32, 32, 26, 26, "#ffffff", 0); };
const snowball = (p: Pen) => { p.ell(60, 60, 44, 44, "#f6f8fc", 7); p.ell(48, 46, 14, 10, "#ffffff", 0); };
const snowPuff = (u: number) => (p: Pen) => {
  const a = (1 - u).toFixed(3);
  for (let i = 0; i < 6; i++) { const an = (i / 6) * Math.PI * 2, d = 30 + 90 * u, r = (40 - 18 * u) * (i % 2 ? 0.8 : 1); p.ell(150 + d * Math.cos(an), 150 + d * 0.7 * Math.sin(an), r, r * 0.85, `rgba(250,251,255,${a})`, 0); }
};
const breath = (u: number) => (p: Pen) => {
  const a = (0.75 * Math.sin(Math.PI * u)).toFixed(3);
  for (let i = 0; i < 3; i++) p.ell(80 + i * 45 + 30 * u, 120 - i * 10, 30 + i * 8, 24 + i * 6, `rgba(245,248,255,${a})`, 0);
};
const smoke = (u: number, s: number) => (p: Pen) => {
  const a = Math.max(0, 1 - u) ** 1.2;
  for (let i = 0; i < 7; i++) {
    const an = (i / 7) * Math.PI * 2 + s, d = 60 + 70 * u, r = 70 + 30 * Math.sin(i * 2.1 + s);
    p.ell(250 + d * Math.cos(an), 250 + d * 0.6 * Math.sin(an), r, r * 0.85, `rgba(${i % 2 ? 214 : 196},${i % 2 ? 210 : 192},${i % 2 ? 214 : 200},${(0.92 * a).toFixed(3)})`, 0);
  }
};
const flash = (u: number) => (p: Pen) => {
  const r = 150 * (1 - u * 0.6);
  p.ell(250, 250, r, r * 0.8, "#fff2b8", 0); p.ell(250, 250, r * 0.55, r * 0.45, "#ffffff", 0);
  for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; p.poly([[250 + 60 * Math.cos(an + 0.2), 250 + 60 * Math.sin(an + 0.2)], [250 + (r + 90) * Math.cos(an), 250 + (r + 90) * Math.sin(an)], [250 + 60 * Math.cos(an - 0.2), 250 + 60 * Math.sin(an - 0.2)]], "#ffd76a", 0); }
};
const splinters = (u: number) => (p: Pen) => {
  for (let i = 0; i < 9; i++) {
    const an = (i / 9) * Math.PI * 2 + 0.3, d = 40 + 200 * u, x = 250 + d * Math.cos(an), y = 250 + d * Math.sin(an) + 120 * u * u;
    p.poly([[x - 14, y - 5], [x + 14, y - 3], [x + 12, y + 5], [x - 12, y + 4]], "#c9a46a", 5);
  }
};
/** thought bubble: cloud + trailing dots; inside a crested Greek helmet (k 0) or a laurel wreath (k 1) */
const bubble = (k: number) => (p: Pen) => {
  p.ell(70, 470, 18, 16, "#ffffff", 6); p.ell(120, 420, 28, 24, "#ffffff", 7);
  for (const [x, y, r] of [[250, 250, 150], [150, 230, 90], [350, 230, 90], [210, 140, 90], [310, 150, 85], [250, 330, 110]] as const) p.ell(x, y, r, r * 0.8, "#ffffff", 9);
  for (const [x, y, r] of [[250, 250, 145], [150, 230, 85], [350, 230, 85], [210, 140, 85], [310, 150, 80], [250, 330, 105]] as const) p.ell(x, y, r, r * 0.8, "#ffffff", 0);
  if (k === 0) {
    // Greek helmet in profile: crest on a stalk, dome, cheek guard, neck flare, dark eye slot
    p.poly([[150, 150], [190, 92], [260, 78], [330, 92], [362, 130], [330, 128], [260, 112], [190, 124]], "#c23a3a", 7);
    p.poly([[175, 330], [170, 220], [200, 165], [255, 145], [310, 160], [340, 215], [345, 300], [320, 335], [300, 335], [300, 280], [255, 262], [250, 330]], "#d9a93a", 7);
    p.poly([[260, 225], [330, 228], [330, 248], [270, 250]], "#2a1f2a", 0);
  } else {
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const an = Math.PI / 2 + s * (0.35 + i * 0.36), x = 250 + 95 * Math.cos(an), y = 230 + 80 * Math.sin(an);
      p.ell(x, y, 26, 13, "#4f8a3a", 5, 0, 360, (an * 180) / Math.PI + 90 * s);
    }
    p.ell(250, 315, 18, 10, "#c23a3a", 5);
  }
};
const letterCard = (p: Pen) => {
  p.poly([[20, 20], [280, 12], [290, 370], [28, 380]], "#f6f0de", 8);
  for (let i = 0; i < 9; i++) { const y = 60 + i * 33; const pts: [number, number][] = []; for (let s = 0; s <= 14; s++) pts.push([50 + s * 15, y + (s % 2 ? -6 : 4)]); p.stroke(pts, 4, "#4a4058"); }
  p.ell(220, 330, 26, 20, "#a32a2a", 5);
};
const coin = (p: Pen) => { p.ell(50, 50, 40, 40, "#e2b23e", 7); p.ell(50, 50, 24, 24, null, 4); };

// ---------------- per-shot staging ----------------
/** snowfall: flakes in camera space (2-28 m ahead), wrapping off-frame; falls in world y */
const snowfall = (c: Ctx, look: V3, n: number) => {
  const cp = c.cam.pos, fx = look[0] - cp.x, fy = look[1] - cp.y, fz = look[2] - cp.z, fl = Math.hypot(fx, fy, fz);
  const F = [fx / fl, fy / fl, fz / fl], R = [c.cam.right.x, c.cam.right.y, c.cam.right.z];
  for (let i = 0; i < n; i++) {
    const d = 2 + 26 * hh(i, 1) ** 1.4, half = Math.tan((16 * Math.PI) / 180) * d * 1.25, wide = half * 1.9;
    const lx = (hh(i, 2) * 2 - 1) * wide + 0.25 * d * Math.sin(c.t * 0.6 + i);
    const span = 2 * half, ly = half - (((c.t * (0.55 + 0.35 * hh(i, 3)) + hh(i, 4) * span) % span + span) % span);
    const s = 0.02 + 0.0045 * d;
    c.out.fx.push({ key: "flake", cw: 64, ch: 64, draw: flake, x: cp.x + F[0] * d + R[0] * lx, y: cp.y + F[1] * d + ly, z: cp.z + F[2] * d + R[2] * lx, w: s, h: s, soft: true });
  }
};
/** snowball throws in shot 10: [throw frame, from, to, hit person index or -1] */
const THROWS: [number, V3, V3][] = [
  [1352, [0.5, 1.4, -9.4], [0.4, 1.0, -5.0]], [1364, [-1.4, 1.5, -8.8], [-1.0, 1.2, -4.9]],
  [1380, [1.6, 1.5, -3.8], [2.2, 1.3, -8.6]], [1388, [2.2, 1.5, -8.6], [1.6, 1.25, -3.85]],
  [1396, [0, 2.0, -2.8], [-1.5, 1.2, -8.8]], [1405, [-1.5, 1.4, -8.8], [-1.6, 1.2, -4.95]], [1413, [-1.8, 1.5, -4.0], [0.5, 1.2, -9.4]],
];
const FLIGHT = 14; // frames
const hitAt = (f: number, target: V3) => THROWS.some(([f0, , to]) => f >= f0 + FLIGHT && f < f0 + FLIGHT + 18 && Math.hypot(to[0] - target[0], to[2] - target[2]) < 0.4);

export type Extra = { muzzle: V3[]; crowd?: V3[] };
/** crowd member positions in shot 22 (shared with world.ts for the flags) */
export const crowdAt = (t: number): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < 18; i++) {
    const row = Math.floor(i / 6), col = i % 6, sp = 1.5 + 0.3 * hh(i, 5);
    out.push([-21 + col * 2.0 + (row % 2) * 1.0 + (hh(i, 6) - 0.5) * 0.6, 0, 9 + row * 2.4 + hh(i, 7) - sp * (t - FLASH_AT / FPS)]);
  }
  return out;
};
export const FLAG_BEARERS = [1, 4, 8, 13];

export const stage = (id: number, t: number, cam: CamInfo, ex: Extra): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = t * FPS;
  setStageLight(cam, s.light);
  const c: Ctx = { cam, out, t, pl: s.place };
  const L = LEAD;
  switch (id) {
    case 1: {
      // Autun: two rows of seated boys behind desks, the abbe at the board; Napoleone in the second row, left
      const rows: [number, number][] = [[-3.1, 0.5], [-2.1, 0.5], [-0.5, 0.5], [0.5, 0.5], [2.1, 0.5], [3.1, 0.5], [-3.1, -1.3], [-0.5, -1.3], [0.6, -1.3], [2.6, -1.3]];
      rows.forEach(([x, z], i) => at(c, KIDS[i % 6], x, 0.4, z, { fo: { mode: "sit", expr: (["smile", "neutral", "smile_closed", "grin"] as Expr[])[i % 4], facing: x < 0 ? 1 : -1 }, blob: false }));
      at(c, NAP_CHILD, -2.1, 0.4, -1.3, { fo: { mode: "sit", expr: t < 3.1 - L ? "nervous" : "stern", facing: 1 }, blob: false });
      at(c, ABBE, -2.9, 0, 3.8, { fo: { mode: "stand", wave: q(0.4 + 0.3 * Math.sin(t * 2.2), 20), expr: "smile", facing: -1 } }, true);
      break;
    }
    case 2: {
      const wx = napWalkX(t), walking = t < NAP_WALK.t1;
      if (walking) at(c, NAP_KID, wx, 0, NAP_WALK.z, walkOpt(1, t, 1.4));
      else at(c, NAP_KID, wx, 0, NAP_WALK.z, { fo: { expr: f < 266 ? "neutral" : "nervous", look: 0, headTilt: -4 } });
      if (!walking && f >= 266) {
        const u = ((t * 0.75) % 1);
        fxAt(c, `breath${q(u, 24)}`, 300, 200, breath(q(u, 24)), wx + cam.right.x * 0.3, 0.9 + 0.06 * u, NAP_WALK.z + cam.right.z * 0.3 - 0.15, 0.32, 0.21, { soft: true });
      }
      // other cadets crossing the yard far off
      for (let i = 0; i < 5; i++) at(c, KIDS[i], -6 + i * 3.4 + 0.6 * Math.sin(t * 0.3 + i), 0, 14 + (i % 2) * 3, walkOpt(i % 2 ? 1 : -1, t + i * 0.3, 1.0));
      break;
    }
    case 3: {
      const xs = [2.5, 3.6, 4.7, 5.8, 6.9], who = [KIDS[0], KIDS[1], KIDS[3], KIDS[2], KIDS[4]];
      xs.forEach((x, i) => {
        const proud = f >= 380 - 2 && i === 2;
        at(c, who[i], x, 0, -6 + 0.35 * Math.sin(i * 2.1), { fo: { expr: proud ? "smile_closed" : (["grin", "laugh", "smile", "grin", "laugh"] as Expr[])[i], facing: -1, look: -1, ...(proud ? { prop: "tuck" as const } : {}) } });
      });
      break;
    }
    case 4: {
      const napE: Expr = f < 503 ? "stern" : f < 541 ? "nervous" : "stern";
      at(c, NAP_KID, -1.0, 0, -5.8, { fo: { expr: napE, facing: 1 } });
      at(c, boyX(0, true), 0.15, 0, -6.6, { fo: { expr: f < 541 ? "grin" : "laugh", facing: -1, look: -1 } });
      at(c, boyX(1, true), 1.05, 0, -6.9, { fo: { expr: f < 541 ? "smile" : "laugh", facing: -1, look: -1 } });
      break;
    }
    case 5: {
      [[-3.2, -6.1], [-2.2, -5.7], [-1.2, -6.2], [-0.2, -5.8]].forEach(([x, z], i) => {
        const point = i % 2 === 0;
        at(c, [KIDS[0], KIDS[1], boyX(0, true), KIDS[2]][i], x, 0, z, { fo: { expr: i === 1 ? "grin" : "laugh", facing: 1, look: 1, ...(point ? { wave: q(0.6 + 0.4 * Math.sin(t * 6 + i), 20) } : {}) } });
      });
      if (t < WALKOFF) at(c, NAP_KID, 2.2, 0, -6.4, { fo: { expr: "stern", facing: -1 } });
      else at(c, NAP_KID, 2.2 + 1.1 * (t - WALKOFF), 0, -6.4, walkOpt(1, t, 1.1));
      break;
    }
    case 6: {
      at(c, NAP_KID, -23.7, 0, 6.0, { fo: { expr: f < 830 ? "neutral" : "smile_closed", prop: "book", facing: 0 } });
      if (f >= 855) {
        const u = clamp01((f - 855) / 8), k = f < 884 ? 0 : 1;
        const R = cam.right;
        const [X, Y, Z] = P("brienne", -23.7, 1.72, 6.0);
        out.fx.push({ key: `bubble${k}`, cw: 500, ch: 500, draw: bubble(k), x: X + R.x * 0.5, y: Y + 0.05 * Math.sin(t * 2), z: Z + R.z * 0.5 - 0.1, w: 0.6 * u, h: 0.6 * u });
      }
      break;
    }
    case 7: {
      const good = f >= 996;
      at(c, NAP_KID, -2.0, 0, 3.7, { fo: { expr: good ? "smile_closed" : "stern", wave: q(0.5 + 0.25 * Math.sin(t * 3), 20) } }, true);
      at(c, FRIAR, 3.4, 0, 3.6, { fo: { expr: good ? "grin" : "neutral", facing: 1, look: 1 } });
      [[-4.7, 0.7], [-3.7, 0.7], [3.4, 0.7], [4.4, 0.7], [-4.2, -1.2], [3.9, -1.2]].forEach(([x, z], i) =>
        at(c, KIDS[i % 6], x, 0.4, z, { fo: { mode: "sit", expr: good ? (i % 2 ? "shock" : "nervous") : (["neutral", "smile", "grin"] as Expr[])[i % 3], facing: x < 0 ? 1 : -1 }, blob: false }));
      break;
    }
    case 8: case 9: case 10: case 11: {
      if (id !== 11) snowfall(c, P("brienne", 0, 1.5, -2), id === 8 && f < 1150 ? 170 : 130);
      if (id === 8) {
        const spots: [number, number][] = [[-5.4, -3.0], [5.3, -1.2], [-2.6, -6.4], [2.8, -6.1], [-1.2, 3.3], [3.4, 3.0]];
        spots.forEach(([x, z], i) => at(c, KIDS[i], x, 0, z, { fo: { expr: f > FORT0 * FPS - 2 ? (["grin", "laugh", "smile"] as Expr[])[i % 3] : (["smile", "neutral", "grin"] as Expr[])[i % 3], facing: x < 0 ? 1 : -1,
          ...(i % 3 === 1 && f > FORT0 * FPS ? { wave: q(Math.sin(t * 5 + i), 20) } : {}) } }));
        if (f > (FORT1 - 0.6) * FPS) at(c, NAP_KID, 0, 0.55, -2.8, { fo: { expr: "stern" } });
      }
      if (id === 9) {
        const plan = f >= 1316;
        at(c, NAP_KID, 0, 0.55, -2.8, { fo: { expr: plan ? "grin" : "stern", wave: q(plan ? 0.3 + 0.7 * Math.abs(Math.sin(t * 3)) : 0.9, 20) } });
        at(c, KIDS[0], -2.4, 0, -0.6, { fo: { expr: "grin", facing: 1 } });
        at(c, KIDS[3], 2.5, 0, -0.3, { fo: { expr: "smile", facing: -1 } });
        at(c, KIDS[1], -5.6, 0, -3.4, { fo: { expr: "laugh", facing: 1 } });
        at(c, KIDS[4], 5.5, 0, -2.9, { fo: { expr: "grin", facing: -1 } });
      }
      if (id === 10) {
        const people: [Char, V3, Expr][] = [
          [NAP_KID, [0, 0.55, -2.8], "grin"], [KIDS[0], [-1.8, 0, -4.0], "laugh"], [KIDS[3], [1.6, 0, -3.8], "grin"],
          [KIDS[1], [-1.5, 0, -8.8], "laugh"], [KIDS[2], [0.5, 0, -9.4], "grin"], [KIDS[4], [2.2, 0, -8.6], "laugh"],
        ];
        people.forEach(([who, p], i) => {
          const hit = hitAt(f, p);
          at(c, who, p[0], p[1], p[2], { fo: { expr: hit ? "shock" : people[i][2], facing: p[2] < -6 ? 1 : -1, ...(i === 0 ? { wave: q(0.5 + 0.5 * Math.sin(t * 7), 20) } : {}) } });
        });
        for (const [f0, a, b] of THROWS) {
          const u = (f - f0) / FLIGHT;
          if (u >= 0 && u < 1) {
            const x = a[0] + (b[0] - a[0]) * u, z = a[2] + (b[2] - a[2]) * u, y = a[1] + (b[1] - a[1]) * u + 1.4 * u * (1 - u);
            fxAt(c, "snowball", 120, 120, snowball, x, y, z, 0.2, 0.2);
          } else if (u >= 1 && u < 1 + 12 / FLIGHT) {
            const v = q((f - f0 - FLIGHT) / 12, 12);
            fxAt(c, `spuff${v}`, 300, 300, snowPuff(v), b[0], b[1], b[2] + 0.05, 0.9, 0.9, { soft: true });
          }
        }
      }
      if (id === 11) {
        at(c, NAP_KID, 0, 1.05, -5.0, { fo: { expr: "smile_closed", wave: q(0.8 + 0.1 * Math.sin(t * 1.5), 20) } });
      }
      break;
    }
    case 12: {
      const x = -12 + 1.25 * (t - 1592 / FPS);
      at(c, NAP_CADET, x, 0, 8, walkOpt(1, t, 1.25));
      for (let i = 0; i < 6; i++) at(c, TEENS[i % 3], 10 - 1.15 * (t - 52) - i * 1.4, 0, 20, { walk: { dx: -1, dz: 0, phase: ((t * 1.15) / 1.6) % 1 } });
      break;
    }
    case 13: case 14: {
      const fired = id === 13 && t >= FIRE1 - L;
      if (id === 13 || f < 1871 || f >= 1903) {
        at(c, NAP_CADET, id === 14 && f < 1871 ? 3.7 : id === 14 ? 1.6 : 1.5, 0, id === 14 && f < 1871 ? 1.7 : id === 14 ? -1.2 : 1.0,
          { fo: { expr: id === 13 ? (fired ? (t < FIRE1 + 0.5 ? "shock" : "grin") : "stern") : f < 1871 ? "stern" : t > HIT2 ? "grin" : "stern", facing: id === 14 && f < 1871 ? 0 : -1,
            ...(id === 14 && f < 1871 ? { wave: q(0.35 + 0.2 * Math.sin(t * 2.5), 20) } : {}) } });
        at(c, INSTRUCTOR, id === 14 && f < 1871 ? 1.3 : -2.3, 0, id === 14 && f < 1871 ? 2.0 : -1.6, { fo: { expr: id === 14 && f < 1871 ? "smile" : "stern", facing: 1, prop: ["sword", 0.15] } });
        at(c, TEENS[1], -5.0, 0, 1.4, { fo: { expr: "neutral", facing: 1 } });
        at(c, TEENS[2], 7.2, 0, 1.2, { fo: { expr: "smile", facing: -1 } });
      }
      if (id === 14 && f >= 1871 && f < 1903) {
        at(c, TEENS[0], -8.9, 0, 6.3, { fo: { expr: "whistle", facing: 1 } });
        at(c, TEENS[1], -8.0, 0, 5.8, { fo: { expr: "smile_closed", facing: -1, prop: "tuck" } });
        at(c, TEENS[2], -7.1, 0, 6.5, { fo: { expr: "grin", facing: -1 } });
      }
      // cannon fire: flash + smoke from the middle gun's muzzle
      const fires = id === 13 ? [FIRE1] : [FIRE2];
      for (const tf of fires) {
        const m = ex.muzzle[1], u = t - tf;
        if (u >= 0 && u < 4 / FPS) out.fx.push({ key: `mflash${q(u * FPS / 4, 4)}`, cw: 500, ch: 500, draw: flash(q((u * FPS) / 4, 4)), x: m[0], y: m[1], z: m[2] - 0.4, w: 1.6, h: 1.6 });
        for (let k = 0; k < 4; k++) {
          const v = u / 2.6 - k * 0.04;
          if (v <= 0 || v >= 1) continue;
          const vq = q(v, 30), sz = 1.0 + 3.2 * Math.sqrt(vq) + k * 0.3;
          out.fx.push({ key: `smoke${k}_${vq}`, cw: 500, ch: 500, draw: smoke(vq, k), x: m[0] + 0.6 * k - 0.6 + 1.2 * vq, y: m[1] + 0.2 + 1.4 * vq + 0.2 * k, z: m[2] - 1.0 - 2.5 * Math.sqrt(vq) - k * 0.6, w: sz, h: sz, soft: true });
        }
      }
      if (id === 14) {
        const u = (t - HIT2) / 0.6;
        const [X, Y, Z] = P("paris", 0, 1.7, -44.6);
        if (u >= 0 && u < 1) {
          out.fx.push({ key: `hitb${q(u, 20)}`, cw: 500, ch: 500, draw: flash(Math.min(1, q(u, 20) * 1.5)), x: X, y: Y, z: Z, w: 3.6 * (1 - 0.4 * u), h: 3.6 * (1 - 0.4 * u) });
          out.fx.push({ key: `spl${q(u, 20)}`, cw: 500, ch: 500, draw: splinters(q(u, 20)), x: X, y: Y, z: Z - 0.2, w: 5, h: 5 });
        }
      }
      break;
    }
    case 15: {
      const sad = t >= LETTER_SAD - L;
      at(c, NAP_CADET, 0.4, 0, 1.2, { fo: { expr: sad ? "pained" : f < 2096 ? "neutral" : "nervous", prop: "book", headTilt: sad ? 6 : 0 } });
      fxAt(c, "letter", 300, 400, letterCard, 0.4, 0.88, 1.05, 0.44, 0.56, { rot: 0.04 });
      break;
    }
    case 16: {
      at(c, NAP_CADET, -1.15, 0.44, 2.1, { fo: { mode: "sit", expr: "stern", look: -1, headTilt: 5 }, blob: false });
      break;
    }
    case 17: {
      at(c, NAP_CADET, 0.0, 0, 1.6, { fo: { expr: f < 2420 ? "stern" : "smile_closed", prop: "book", headTilt: 3 } });
      break;
    }
    case 18: {
      const lieut = f >= 2592;
      [[-2.9, 48.4], [-1.35, 48.1], [1.35, 48.2], [2.9, 48.5]].forEach(([x, z], i) =>
        at(c, TEENS[i % 3], x, 0, z, { fo: { expr: lieut ? (i % 2 ? "laugh" : "grin") : "neutral", ...(lieut && i % 2 ? { wave: q(Math.sin(t * 8 + i), 20) } : {}) } }));
      if (!lieut) at(c, NAP_CADET, 0, 0, 47.6, { fo: { expr: "stern" } });
      else at(c, NAP_LIEUT, 0, 0, 47.6, { fo: { expr: "grin", prop: ["sword", q(clamp01((f - 2592) / 10), 10)] } });
      if (!lieut) at(c, INSTRUCTOR, 2.0, 0, 46.2, { fo: { expr: "smile", facing: 1, prop: ["sword", 0.3] } });
      break;
    }
    case 19: {
      at(c, NAP_LIEUT, -2.45, 0.46, 0.45, { fo: { mode: "sit", expr: f < 2712 ? "stern" : "nervous", look: 1 }, blob: false });
      for (let i = 0; i < 3; i++) fxAt(c, "coin", 100, 100, coin, -2.95 + i * 0.12, 0.57, 0.1 + (i % 2) * 0.08, 0.09, 0.09, { flat: true });
      break;
    }
    case 20: {
      at(c, NOBLE, 2.5, 0, 44.4, { fo: { expr: "laugh", facing: 1, wave: q(0.2 + 0.15 * Math.sin(t * 4), 20) } });
      at(c, RICH_OFFICER, 1.0, 0, 44.0, { fo: { expr: "grin", facing: -1 } });
      at(c, NAP_LIEUT, -1.7, 0, 47.4, { fo: { expr: "stern", facing: -1, look: -1 } });
      break;
    }
    case 21: {
      const cu = f >= 2953, shock = t >= 100.06 - L;
      at(c, NAP_LIEUT, 1.35, 0, 2.05, { fo: { expr: !cu ? "neutral" : shock ? "shock" : "stern", facing: cu && !shock ? 1 : 0, look: cu && !shock ? 1 : 0 } });
      break;
    }
    case 22: {
      const ps = crowdAt(t);
      ps.forEach(([x, y, z], i) => {
        const who = PARIS[i % PARIS.length], cheer = i % 3 === 0 && !FLAG_BEARERS.includes(i);
        at(c, who, x, y, z, { walk: { dx: 0, dz: -1, phase: ((t * 1.6) / 1.6 + hh(i, 8)) % 1 }, fo: { expr: who.expr, ...(cheer ? { wave: q(Math.sin(t * 9 + i), 20) } : {}) } });
      });
      break;
    }
  }
  return out;
};
