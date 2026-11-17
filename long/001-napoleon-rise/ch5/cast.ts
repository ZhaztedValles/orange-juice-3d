// Chapter 5 cast: who stands where in every shot (soldiers on deck, savants, Mamluk horsemen, the hollow square,
// Nelson, the tired column, the diggers at Rosetta, the camp, the beach at night, the Paris crowd, the plotters, the
// lawmakers of Saint-Cloud) and the effect cards (musket and cannon smoke, gun flashes, fire, L'Orient's explosion,
// thrown dirt, gulls, the map, a candle). Shared presets come from ../shared/cast, horses from ../shared/props.
import { Pen, Expr, INK, SKINS } from "../../../src/engine/toon";
import { CamInfo, Stage, hh, q, setStageLight } from "../../../src/engine/cards";
import {
  NAP_GENERAL, NAP_CONSUL, LUCIEN, NELSON, BRITISH_OFFICER, Char, put, frenchSoldier, frenchOfficer, savant, mamluk, lawmaker, britishSoldier, royalist,
} from "../shared/cast";
import { horseCard, HORSE_COATS, HorseOpts } from "../shared/props";
import { drawMap } from "./places";
import {
  SHOTS, FL, FLV, NAP_RAIL, MAP_T, SCOPE, EASEL, NELSON_AT, NAP_SHORE, BEACH, sandY, DIG, STONE2, CAMP, NAP_CAMP, ROOM, HALL, TRIB, BOOM,
  colX, tiredX, rideX, courierX, COURIER_STOP, smallX, SMALL_Z, V3,
} from "./story";

const LEAD = 2 / 30;
const sw = (t: number, ts: number) => t >= ts - LEAD;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const C = (i: number, okey: string, base: Char, o: Partial<Char["o"]>, expr?: Expr): Char => ({ i, okey, o: { ...base.o, ...o }, scale: base.scale, expr: expr ?? base.expr });

// ---------------- extra people (built from the shared presets with new identities) ----------------
const SOL = [0, 1, 2, 3, 4, 5].map((v) => frenchSoldier(v));
const BARE = [0, 1, 3, 4].map((v, k) => C(400 + k, `bare${k}`, frenchSoldier(v), { hat: "hair", hair: ["#3a2a20", "#6a4228", "#2a1f1c", "#8a5a36"][k] }));
const SAV_COATS = ["#5a3d5c", "#2f4f5a", "#6b5a2e", "#4a3a2a", "#3a4a6a", "#5a2e2e", "#556b3a", "#4f4f5f"];
const SAV = [savant(0), savant(1), savant(2), ...SAV_COATS.map((c, k) => C(290 + k, `sav5x${k}`, savant(k % 3), { jacket: c }))];
const LAW = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (k < 4 ? lawmaker(k) : C(330 + k, `law5x${k}`, lawmaker(k), { hair: ["#5a3b2a", "#d9b45c", "#2a1f1c", "#b9b4ac"][k - 4], locks: ["#5a3b2a", "#d9b45c", "#2a1f1c", "#b9b4ac"][k - 4], skin: SKINS[(k + 1) % 4] })));
const CITIZEN = [0, 1, 2, 3, 4, 5].map((k) => C(340 + k, `cit${k}`, royalist(k), { rifle: false, cockade: undefined, jacket: ["#6b4a2e", "#3f5a46", "#5a3046", "#4a4f66", "#8a5a36", "#2f4f6a"][k] }, "grin"));
const WOMAN = [0, 1, 2].map((k) => C(350 + k, `wom${k}`, LUCIEN, { robe: undefined, cloak: undefined, sash: undefined, hat: "hair", jacket: ["#c25a7a", "#3f6fb5", "#d9a441"][k],
  dress: ["#f2e6d0", "#e8d6b4", "#f6efe2"][k], pants: "#f2e6d0", hair: ["#5a3b2a", "#2a1a17", "#b5653f"][k], locks: ["#5a3b2a", "#2a1a17", "#b5653f"][k], lockLen: 0.6, skin: SKINS[k] }, "laugh"));
const SIEYES = C(301, "sieyes", savant(1), { jacket: "#2d2a3a", hat: "hair", hair: "#e7e2d8", locks: "#e7e2d8", lockLen: 0.35, lapels: "#e9e3d4", pants: "#e9e3d4" }, "grin");
const COURIER = C(311, "courier", frenchSoldier(1), { jacket: "#2f6a43", pants: "#c23a3a", hat: "cap", cap: "#c23a3a", rifle: false, belt: "#e8b53e", sword: true });
const GRENADIER = [0, 1].map((k) => C(312 + k, `gren${k}`, frenchSoldier(k * 4), { hat: "bicorne", plume: "#c23a3a" }, "stern"));

// ---------------- effect drawings ----------------
/** a soft round puff of powder smoke on a 400 x 400 canvas; t 0..1 (grows, thins) */
const smokeDraw = (p: Pen, t: number, dark = false) => {
  const g = p.g, base = dark ? [82, 74, 84] : [236, 230, 222], sh = dark ? [52, 46, 58] : [188, 184, 196];
  const a = (1 - t) ** 1.3;
  for (let i = 0; i < 7; i++) {
    const ang = i * 0.9 + 0.4, d = 40 + 60 * t, r = (70 + 22 * (i % 3)) * (0.7 + 0.3 * t);
    const x = 200 + d * Math.cos(ang), y = 210 + d * 0.7 * Math.sin(ang);
    g.fillStyle = `rgba(${sh[0]},${sh[1]},${sh[2]},${(0.8 * a).toFixed(3)})`; g.beginPath(); g.ellipse(x + 8, y + 10, r, r * 0.86, 0, 0, 7); g.fill();
    g.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${(0.9 * a).toFixed(3)})`; g.beginPath(); g.ellipse(x, y, r * 0.92, r * 0.8, 0, 0, 7); g.fill();
  }
};
/** a gun flash star on 300 x 300 */
const flashDraw = (p: Pen, t: number, col = "#fff2b8") => {
  const g = p.g, r = 140 * (0.6 + 0.4 * t);
  g.fillStyle = col; g.beginPath();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.42 : r; g.lineTo(150 + rr * Math.cos(a), 150 + rr * Math.sin(a)); }
  g.closePath(); g.fill();
  g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(150, 150, r * 0.3, r * 0.3, 0, 0, 7); g.fill();
};
/** flame tongues on 300 x 400; ph animates the flicker */
const flameDraw = (p: Pen, ph: number) => {
  const g = p.g;
  for (const [col, s] of [["#e0502a", 1], ["#ff9a2e", 0.72], ["#ffe08a", 0.42]] as const) {
    g.fillStyle = col; g.beginPath(); g.moveTo(150 - 120 * s, 390);
    for (let i = 0; i <= 6; i++) {
      const x = 150 - 120 * s + (240 * s * i) / 6, tip = 390 - (300 + 60 * Math.sin(ph * 6.28 + i * 1.7)) * s * (i % 2 ? 0.75 : 1);
      g.quadraticCurveTo(x - 20 * s, (390 + tip) / 2, x, i === 0 || i === 6 ? 390 : tip);
    }
    g.closePath(); g.fill();
  }
};
/** gull: a little "m" of two arcs on 200 x 100; k = wing beat */
const gullDraw = (p: Pen, k: number) => {
  const g = p.g, y = 50 + 18 * k;
  g.strokeStyle = "#2a2430"; g.lineWidth = 9; g.lineCap = "round";
  g.beginPath(); g.moveTo(20, y); g.quadraticCurveTo(60, 20 - 10 * k, 100, 55); g.quadraticCurveTo(140, 20 - 10 * k, 180, y); g.stroke();
};
/** thrown dirt clods on 200 x 200 */
const dirtDraw = (p: Pen) => { for (const [x, y, r] of [[60, 120, 22], [110, 80, 16], [140, 130, 19], [90, 150, 12]]) p.ell(x, y, r, r * 0.8, "#9a6e42", 4); };
/** a hand-held tricolour on a pole (300 x 420), waving with ph */
const flagDraw = (p: Pen, ph: number) => {
  const g = p.g;
  p.stroke([[40, 410], [40, 20]], 9, "#5a3826");
  const cols = ["#2f52b0", "#f5f2ea", "#d23a3f"];
  for (let k = 0; k < 3; k++) {
    g.fillStyle = cols[k]; g.beginPath();
    const x0 = 44 + k * 80, x1 = x0 + 81, w0 = 14 * Math.sin(ph * 6.28 + k), w1 = 14 * Math.sin(ph * 6.28 + k + 1);
    g.moveTo(x0, 30 + w0); g.lineTo(x1, 30 + w1); g.lineTo(x1, 190 + w1); g.lineTo(x0, 190 + w0); g.closePath(); g.fill();
  }
  g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.moveTo(44, 30); g.lineTo(285, 30 + 14 * Math.sin(ph * 6.28 + 3)); g.lineTo(285, 190 + 14 * Math.sin(ph * 6.28 + 3)); g.lineTo(44, 190); g.stroke();
};
/** papers on the plotters' table: scribbled sheets (no text) */
const papersDraw = (p: Pen) => {
  const g = p.g;
  for (const [x, y, r] of [[120, 120, -0.2], [260, 150, 0.15]] as const) {
    g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = "#f3ead6"; g.fillRect(-90, -110, 180, 220);
    g.strokeStyle = "#5a4a40"; g.lineWidth = 4; for (let k = -80; k < 90; k += 22) { g.beginPath(); g.moveTo(-70, k); g.lineTo(60 - (k % 3) * 8, k + 2); g.stroke(); }
    g.restore();
  }
};
const candleDraw = (p: Pen) => { p.poly([[42, 300], [78, 300], [78, 120], [42, 120]], "#f3ead6", 6); p.poly([[20, 310], [100, 310], [92, 290], [28, 290]], "#c79a3e", 6); };

// ---------------- effect helpers ----------------
/** powder smoke from (x, y, z) fired at time t0 (seconds); size s; drifts up and downwind */
const smoke = (out: Stage, t: number, t0: number, x: number, y: number, z: number, s = 1.6, life = 2.2, dark = false) => {
  const u = (t - t0) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 24), w = s * (0.6 + 1.2 * Math.sqrt(u));
  out.fx.push({ key: `smk${dark ? "d" : "l"}${k}`, cw: 400, ch: 400, draw: (p) => smokeDraw(p, k, dark), x: x + 0.8 * u, y: y + 0.9 * u * s, z, w, h: w, soft: true });
};
const flash = (out: Stage, t: number, t0: number, x: number, y: number, z: number, s = 1, col = "#fff2b8") => {
  const n = (t - t0) * 30;
  if (n < 0 || n >= 4) return;
  const k = [1, 0.8, 0.5, 0.25][Math.floor(n)];
  out.fx.push({ key: `glowFl${col}${k}`, cw: 300, ch: 300, draw: (p) => flashDraw(p, k, col), x, y, z, w: s * k * 1.6, h: s * k * 1.6, rot: n * 0.4 });
};
const gulls = (out: Stage, t: number, n: number, c: V3, r: number) => {
  for (let i = 0; i < n; i++) {
    const a = t * (0.18 + 0.05 * i) + i * 2.1, k = q(0.5 + 0.5 * Math.sin(t * 7 + i * 1.3), 4);
    out.fx.push({ key: `gull${k}`, cw: 200, ch: 100, draw: (p) => gullDraw(p, k), x: c[0] + r * Math.cos(a), y: c[1] + 3 * Math.sin(a * 1.7 + i), z: c[2] + r * 0.5 * Math.sin(a), w: 1.1, h: 0.55 });
  }
};
/** volleys: every muzzle in the list flashes and smokes at time t0 (+ a tiny per-man stagger) */
const volley = (out: Stage, t: number, t0: number, pts: V3[], s = 1.3) =>
  pts.forEach(([x, y, z], i) => { const tt = t0 + hh(i, 41) * 0.25; flash(out, t, tt, x, y, z, 0.5); smoke(out, t, tt, x, y, z, s, 2.4); });

// ---------------- deck crowd (shots 2-4) ----------------
const DECK: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let x = -10; x <= 11.5; x += 1.45) for (let z = -3.9; z <= 3.9; z += 1.3) {
    const jx = x + (hh(out.length, 1) - 0.5) * 0.5, jz = z + (hh(out.length, 2) - 0.5) * 0.4;
    const near = (cx: number, cz: number, r: number) => Math.hypot(jx - cx, jz - cz) < r;
    if (near(0, 0, 1.2) || near(MAP_T[0], MAP_T[2], 1.8) || near(NAP_RAIL[0], NAP_RAIL[2], 1.6) || near(EASEL[0], EASEL[2], 1.3)) continue;
    if ([-8.5, -3.5, 1.5, 2.2, 10.6].some((gx) => Math.abs(jx - gx) < 1.0 && Math.abs(jz) > 1.1)) continue; // deck guns
    if (jx > 3.4 && jz < -1.4) continue; // the savants' corner
    out.push([jx, jz]);
  }
  return out;
})();
const deckCrowd = (cam: CamInfo, out: Stage, t: number, every = 1, savants = false) => {
  DECK.forEach(([x, z], i) => {
    if (i % every) return;
    const sav = savants && i % 3 === 0;
    const c = sav ? SAV[(i >> 1) % SAV.length] : SOL[(i * 7 + 3) % 6];
    const ex: Expr = sav ? "smile" : (["neutral", "grin", "smile", "stern", "smile_closed"] as Expr[])[i % 5];
    put(cam, out, t, c, x, FL, z, { fo: { expr: ex, look: Math.round(Math.sin(t * 0.5 + i) * 1.1), prop: sav ? "book" : null } });
  });
};

// ---------------- the Egyptian battle ----------------
/** riders galloping across at constant speed (they enter and leave the frame; x wraps so none pops) */
const rider = (cam: CamInfo, out: Stage, t: number, v: number, x: number, z: number, dir: number, opts: Partial<HorseOpts> = {}, sword = 1) => {
  const coats = [HORSE_COATS.grey, HORSE_COATS.bay, HORSE_COATS.black, HORSE_COATS.chestnut, HORSE_COATS.dun];
  const ph = q(((t * 2.1 + hh(v, 3)) % 1 + 1) % 1, 12);
  horseCard(cam, out, t, x, sandY(x, z), z, { coat: coats[v % 5], pose: "gallop", phase: ph, cloth: ["#c23a3a", "#2f8a6a", "#e8b53e", "#6a46a8"][v % 4], clothTrim: "#e8b53e",
    rider: mamluk(v), riderOpts: { prop: ["sword", sword], expr: v % 2 ? "stern" : "grin" }, ...opts }, dir < 0);
};
const SQ = 11; // the square's half side
const squareMen = (): { x: number; z: number; v: number; n: [number, number] }[] => {
  const out: { x: number; z: number; v: number; n: [number, number] }[] = [];
  for (const [nx, nz] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as const) for (const rank of [0, 1]) for (let k = 0; k < 14; k++) {
    const s = -SQ + 0.8 + k * 1.55, d = SQ - rank * 0.95;
    out.push({ x: nx ? nx * d : s, z: nz ? nz * d : s, v: (k * 3 + rank + nx * 2 + 6) % 6, n: [nx, nz] });
  }
  return out;
};
const SQUARE = squareMen();
const square = (cam: CamInfo, out: Stage, t: number, cx: number, cz: number, ex: (i: number) => Expr) =>
  SQUARE.forEach((m, i) => put(cam, out, t, SOL[m.v], cx + m.x, 0, cz + m.z, { fo: { expr: ex(i) } }));
const muzzles = (cx: number, cz: number, nx: number, nz: number): V3[] =>
  SQUARE.filter((m) => m.n[0] === nx && m.n[1] === nz && Math.abs(m.x * nx + m.z * nz) > SQ - 0.5).map((m) => [cx + m.x + nx * 0.7, 1.45, cz + m.z + nz * 0.7] as V3);

// ---------------- the stage per shot ----------------
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light);
  const f = t * 30;
  switch (id) {
    case 1: gulls(out, t, 4, [-30, 22, 40], 18); break;
    case 2: {
      put(cam, out, t, NAP_GENERAL, NAP_RAIL[0], FL, NAP_RAIL[2], { fo: { expr: sw(t, 7.21) ? "stern" : "neutral", look: sw(t, 7.21) ? 0 : 1, prop: "tuck" } });
      put(cam, out, t, frenchOfficer(0), 3.9, FL, 2.2, { fo: { expr: "smile", look: 1 } });
      put(cam, out, t, frenchOfficer(2), 8.3, FL, 2.0, { fo: { expr: "stern", look: -1 } });
      deckCrowd(cam, out, t);
      if (f > 253) gulls(out, t, 3, [0, 18, 0], 14);
      break;
    }
    case 3: {
      const k = clamp01((f - 318) / 52), india = clamp01((f - 372) / 22);
      out.fx.push({ key: `map${q(k, 20)}|${q(india, 10)}`, cw: 800, ch: 520, draw: (p) => drawMap(p.g, q(k, 20), q(india, 10)), x: MAP_T[0], y: FL + 0.905, z: MAP_T[2], w: 1.7, h: 1.1, flat: true });
      const point = 0.25 + 0.12 * Math.sin(t * 2.2);
      put(cam, out, t, NAP_GENERAL, MAP_T[0] + 0.15, FL, MAP_T[2] - 1.1, { fo: { expr: f > 370 ? "grin" : "stern", prop: ["sword", q(point, 20)] } });
      put(cam, out, t, frenchOfficer(1), MAP_T[0] - 1.3, FL, MAP_T[2] - 0.75, { fo: { expr: f > 372 ? "shock" : "neutral", look: 1 } });
      put(cam, out, t, frenchOfficer(0), MAP_T[0] + 1.35, FL, MAP_T[2] - 0.8, { fo: { expr: f > 376 ? "grin" : "smile", look: -1 } });
      put(cam, out, t, SOL[3], MAP_T[0] - 2.6, FL, MAP_T[2] - 2.4, { fo: { expr: "neutral" } });
      put(cam, out, t, SOL[0], MAP_T[0] + 2.8, FL, MAP_T[2] - 2.2, { fo: { expr: "smile" } });
      break;
    }
    case 4: {
      put(cam, out, t, SAV[0], SCOPE[0], FL, SCOPE[2], { side: true, so: { expr: f > 455 ? "grin" : "neutral" } });
      put(cam, out, t, SAV[1], 8.9, FL, -2.3, { fo: { expr: "smile", prop: "book", look: -1 } });
      put(cam, out, t, SAV[2], 4.6, FL, -1.7, { fo: { expr: f > 430 ? "grin" : "smile", wave: q(0.5 + 0.5 * Math.sin(t * 3), 8) } });
      put(cam, out, t, SAV[5], 11.4, FL, 2.4, { fo: { expr: "smile_closed", prop: "book" } });
      put(cam, out, t, SAV[3], 12.5, FL, -1.1, { fo: { expr: "grin", look: -1 } });
      // the wide: savants all over the forward deck, soldiers aft
      if (f >= 478 && f < 547) [[2.5, 2.6], [4.5, 1.1], [6.2, 2.7], [3.4, -0.9], [7.6, 0.6], [9.6, 2.9], [10.4, -0.6], [5.6, -3.6], [1.0, -2.6], [-1.6, 2.4], [-2.6, -1.2]].forEach(([x, z], i) =>
        put(cam, out, t, SAV[4 + (i % 7)], x, FL, z, { fo: { expr: (["smile", "grin", "neutral", "smile_closed"] as Expr[])[i % 4], prop: i % 3 === 0 ? "book" : null, look: i % 2 ? 1 : -1, wave: i % 4 === 1 ? q(0.5 + 0.5 * Math.sin(t * 4 + i), 8) : undefined } }));
      DECK.forEach(([x, z], i) => { if (x < -3 && i % 2 === 0) put(cam, out, t, SOL[i % 6], x, FL, z, { fo: { expr: (["neutral", "smile", "grin"] as Expr[])[i % 3] } }); });
      if (f > 478 && f < 547) gulls(out, t, 3, [6, 16, -4], 10);
      break;
    }
    case 5: {
      for (let k = 0; k < 12; k++) {
        const x = -33 + k * 6 + hh(k, 1) * 2, z = -66.5 + hh(k, 2) * 2;
        if (Math.abs(x - 2) < 2.5) continue;
        const rear = (t * 0.6 + hh(k, 3)) % 1 < 0.22;
        horseCard(cam, out, t, x, sandY(x, z), z, { coat: [HORSE_COATS.grey, HORSE_COATS.bay, HORSE_COATS.black, HORSE_COATS.chestnut][k % 4], pose: rear ? "rear" : "stand",
          cloth: ["#c23a3a", "#2f8a6a", "#e8b53e", "#6a46a8"][k % 4], clothTrim: "#e8b53e", rider: mamluk(k), riderOpts: { prop: ["sword", rear ? 1 : 0.6], expr: k % 2 ? "stern" : "grin" } }, k % 3 === 0);
      }
      const rear = f > 742 && f < 780;
      horseCard(cam, out, t, 2, sandY(2, -64.5), -64.5, { coat: HORSE_COATS.grey, pose: rear ? "rear" : "stand", cloth: "#c23a3a", clothTrim: "#e8b53e", rider: mamluk(0),
        riderOpts: { prop: ["sword", f > 738 ? 1 : 0.5], expr: f > 738 ? "grin" : "stern" } }, true);
      break;
    }
    case 6: {
      const X = colX(t), ph = (t * 1.0) % 1;
      for (let r = 0; r < 3; r++) for (let k = 0; k < 16; k++) {
        const x = X - k * 1.45 - r * 0.3, z = r * 1.2;
        put(cam, out, t, SOL[(k * 2 + r) % 6], x, 0, z, { walk: { dx: 1, dz: 0, phase: (ph + (r % 2) * 0.5) % 1 }, so: { expr: (["stern", "neutral", "grin"] as Expr[])[(k + r) % 3] } });
      }
      const fx = X - 4.5, ph2 = q((t * 0.75) % 1, 12);
      horseCard(cam, out, t, fx, 0, 5.5, { coat: HORSE_COATS.grey, pose: "walk", phase: ph2, cloth: "#2c4790", clothTrim: "#e8b53e", rider: NAP_GENERAL, riderOpts: { expr: "stern" } });
      out.fx.push({ key: `flag${q(t % 1, 8)}`, cw: 300, ch: 420, draw: (p) => flagDraw(p, q(t % 1, 8)), x: X - 7 + 0.5, y: 2.6, z: 1.2, w: 1.5, h: 2.1 });
      break;
    }
    case 7: {
      const B = 33.12, aerial = f < 961;
      square(cam, out, t, 0, 0, (i) => (aerial ? (["stern", "neutral", "stern"] as Expr[])[i % 3] : sw(t, B) ? (["grin", "stern", "shock"] as Expr[])[i % 3] : (["stern", "nervous"] as Expr[])[i % 2]));
      if (aerial) {
        square(cam, out, t, -78, -48, (i) => (["stern", "neutral"] as Expr[])[i % 2]);
        horseCard(cam, out, t, 0, 0, 0, { coat: HORSE_COATS.grey, pose: "stand", cloth: "#2c4790", clothTrim: "#e8b53e", rider: NAP_GENERAL, riderOpts: { expr: "stern" } });
        for (let k = 0; k < 7; k++) rider(cam, out, t, k, 75 - ((t - 29) * 8 + k * 9) % 150, 26 + (k % 3) * 2.5, -1);
        for (let k = 0; k < 6; k++) rider(cam, out, t, k + 7, -75 + ((t - 29) * 8 + k * 11) % 150, -27 - (k % 2) * 3, 1);
        volley(out, t, 31.0, muzzles(0, 0, 0, 1)); volley(out, t, 31.1, muzzles(0, 0, 1, 0));
      } else {
        // riders sweep in from the right, rear up short of the bayonets ("broke"), wheel and gallop back out
        for (let k = 0; k < 6; k++) {
          const t0 = 32.05 + k * 0.22, tb = 33.0 + k * 0.17, z = 20.5 + (k % 3) * 1.5;
          if (t < tb) rider(cam, out, t, k, 14 - (t - t0) * 9.5, z, -1);
          else if (t < tb + 0.4) { const x = 14 - (tb - t0) * 9.5; horseCard(cam, out, t, x, 0, z, { coat: [HORSE_COATS.grey, HORSE_COATS.bay, HORSE_COATS.black][k % 3], pose: "rear", cloth: "#c23a3a", rider: mamluk(k), riderOpts: { prop: ["sword", 1], expr: "shock" } }, true); }
          else rider(cam, out, t, k, 14 - (tb - t0) * 9.5 + (t - tb - 0.4) * 9, z + 3.5, 1, {}, 0.6);
        }
        volley(out, t, 32.2, muzzles(0, 0, 0, 1), 0.75); volley(out, t, 33.15, muzzles(0, 0, 0, 1), 0.75); volley(out, t, 33.25, muzzles(0, 0, 1, 0), 0.75);
      }
      break;
    }
    case 8: {
      const rear = f > 1036 && f < 1086;
      horseCard(cam, out, t, 0, 0, -2.5, { coat: HORSE_COATS.grey, pose: rear ? "rear" : "stand", cloth: "#2c4790", clothTrim: "#e8b53e", rider: NAP_GENERAL, riderOpts: { prop: ["sword", f > 1032 ? 1 : 0.4], expr: f > 1066 ? "grin" : "stern" } });
      [[-5.5, 1.5], [-3.8, 3.2], [-2.0, 1.2], [2.4, 1.4], [4.0, 3.0], [5.8, 1.6], [-6.8, 4.2], [7.0, 4.0], [-3.0, 5.0], [3.0, 5.0]].forEach(([x, z], i) =>
        put(cam, out, t, SOL[i % 6], x, 0, z, { fo: { expr: (["laugh", "grin", "laugh", "relief_open"] as Expr[])[i % 4], wave: i % 3 === 2 ? undefined : q(0.5 + 0.5 * Math.sin(t * 8 + i * 1.3), 8) } }));
      out.fx.push({ key: `flag${q(t % 1, 8)}`, cw: 300, ch: 420, draw: (p) => flagDraw(p, q(t % 1, 8)), x: -3.2, y: 2.7, z: 2.4, w: 1.5, h: 2.1 });
      smoke(out, t, 33.6, 12, 1.5, -8, 6, 6); smoke(out, t, 33.9, -14, 1.5, -10, 7, 6);
      break;
    }
    case 9: gulls(out, t, 3, [-150, 14, -20], 12); break;
    case 10: {
      const found = sw(t, 41.35);
      put(cam, out, t, NELSON, NELSON_AT[0], FLV, NELSON_AT[2], { side: true, so: { expr: found ? "grin" : "stern", prop: ["sword", found ? 1 : 0.35] } });
      put(cam, out, t, BRITISH_OFFICER, 38.4, FLV, 203.8, { fo: { expr: found ? "grin" : "neutral", look: -1 } });
      put(cam, out, t, britishSoldier(0), 42.3, FLV, 206.2, { fo: { expr: "stern" } });
      put(cam, out, t, britishSoldier(1), 37.4, FLV, 208.4, { fo: { expr: "neutral" } });
      put(cam, out, t, britishSoldier(2), 41.6, FLV, 212.5, { fo: { expr: "stern" } });
      break;
    }
    case 11: {
      // broadsides: gun flashes along the hulls (both lines), smoke rolling over the water, L'Orient burning, then exploding
      const ships: [number, number, number][] = [];
      for (let k = 0; k < 13; k++) ships.push([-300 + 50 * k, (k % 2) * 6, k % 2 ? 1 : -1]);
      for (const [x, z] of [[-275, 48], [-225, 48], [-175, -46], [-125, 50], [-75, -48], [-25, 52], [25, 50], [75, -46]]) ships.push([x, z, z > 0 ? -1 : 1]);
      ships.forEach(([x, z, side], i) => {
        if (x === 0 && t > BOOM + 0.1) return;
        for (let g = 0; g < 4; g++) {
          const period = 1.1 + hh(i, g) * 0.9, t0 = Math.floor((t - hh(i, g + 7) * period) / period) * period + hh(i, g + 7) * period;
          const gx = x + (g - 1.5) * 7, gz = z + side * 5.5, gy = 2.2 + (g % 2) * 1.4;
          flash(out, t, t0, gx, gy, gz, 1.8, "#ffd27a");
          smoke(out, t, t0, gx, gy, gz + side * 1.5, 6, 3.4, true);
        }
      });
      if (t < BOOM + 0.1) for (let k = 0; k < 4; k++) {
        const ph = q((t * 1.6 + k * 0.27) % 1, 12), grow = 0.6 + 0.6 * clamp01((t - 43.9) / 2.2);
        out.fx.push({ key: `glowFlame${ph}`, cw: 300, ch: 400, draw: (p) => flameDraw(p, ph), x: -12 + k * 8, y: 6 + 3 * grow, z: 0, w: 7 * grow, h: 9.3 * grow });
      }
      const u = (t - BOOM) / 1.6;
      if (u >= 0 && u < 1) {
        const k = q(u, 30);
        out.fx.push({ key: `glowBoom${k}`, cw: 300, ch: 300, draw: (p) => flashDraw(p, 1 - k * 0.5, "#ffe2a0"), x: 0, y: 14 + 20 * u, z: 0, w: 30 + 60 * u, h: 30 + 60 * u, rot: u * 0.6 });
        out.fx.push({ key: `glowFire${k}`, cw: 300, ch: 400, draw: (p) => flameDraw(p, k), x: 0, y: 10 + 10 * u, z: 2, w: 26 * (1 - 0.4 * u), h: 34 * (1 - 0.4 * u) });
      }
      for (let k = 0; k < 5; k++) smoke(out, t, BOOM + 0.2 + k * 0.25, (k - 2) * 8, 20 + k * 3, 0, 26, 4.5, true);
      break;
    }
    case 12: {
      const cu = f >= 1503;
      if (!cu) put(cam, out, t, NAP_GENERAL, NAP_SHORE[0], BEACH, NAP_SHORE[2], { side: true, so: { expr: "stern" } });
      else put(cam, out, t, NAP_GENERAL, NAP_SHORE[0], BEACH, NAP_SHORE[2], { fo: { expr: f > 1516 ? "stern" : "neutral", look: -1 } });
      put(cam, out, t, frenchOfficer(0), 4.5, BEACH, -134.5, { fo: { expr: "nervous" } });
      put(cam, out, t, frenchOfficer(1), 2.8, BEACH, -133.2, { fo: { expr: "pained" } });
      for (let k = 0; k < 6; k++) for (const o of [0, 4]) smoke(out, t, Math.floor((t + k * 1.3 + o) / 8) * 8 - k * 1.3 - o, -250 + k * 95, 5, (k % 2) * 6, 12, 8, true);
      gulls(out, t, 3, [40, 16, -60], 16);
      break;
    }
    case 13: {
      if (f < 1658) {
        const X = tiredX(t), ph = (t * 0.75) % 1;
        for (let r = 0; r < 3; r++) for (let k = 0; k < 12; k++) {
          const x = X - k * 1.7 - r * 0.4 + hh(k, r) * 0.3, z = 298.8 + r * 1.2, bare = (k + r) % 4 === 1;
          const c = bare ? BARE[(k + r) % 4] : SOL[(k * 2 + r) % 6];
          put(cam, out, t, c, x, sandY(x, z), z, { walk: { dx: 1, dz: 0, phase: (ph + hh(k, r + 4) * 0.3) % 1 }, so: { expr: (["dazed", "pained", "nervous", "dazed"] as Expr[])[(k + r) % 4], stomp: 0.3 } });
        }
      } else {
        for (const [i, gx] of [[0, -16], [1, -8], [2, 0]] as const) {
          const tt = 55.5 + i * 0.55 + Math.floor((t - 55.5 - i * 0.55) / 1.7) * 1.7;
          flash(out, t, tt, gx, sandY(gx, 479.6) + 1.15, 479.7, 1.4);
          smoke(out, t, tt, gx, sandY(gx, 480) + 1.2, 480.6, 2.6, 2.4);
          smoke(out, t, tt + 0.55, gx * 2 + 4, 13, 519, 4, 2.2, true);
          put(cam, out, t, SOL[(i * 2) % 6], gx + 1.6, sandY(gx + 1.6, 476.5), 476.5, { fo: { expr: i % 2 ? "nervous" : "stern" } });
        }
        put(cam, out, t, frenchOfficer(2), -21, sandY(-21, 474), 474, { fo: { expr: "stern", prop: ["sword", 1] } });
      }
      break;
    }
    case 14: {
      const found = f >= 1840, ins = f >= 1888;
      if (!ins) {
        const spots: [number, number][] = found ? [[-1.9, 0.4], [-1.0, 1.7], [1.2, 1.9], [2.2, 0.5]] : [[-1.9, 0.6], [-0.5, 1.8], [1.4, 1.6], [2.3, -0.3]];
        spots.forEach(([dx, dz], i) => {
          const dig = !found && (t * 1.6 + i * 0.3) % 1 < 0.5;
          put(cam, out, t, i === 1 ? BARE[0] : SOL[(i * 3) % 6], DIG[0] + dx, 0, DIG[2] + dz, { fo: { expr: found ? (["shock", "grin", "shock", "relief_open"] as Expr[])[i] : "pained", tilt: dig ? (dx > 0 ? -14 : 14) : 0, look: found ? (dx > 0 ? -1 : 1) : 0 } });
          if (!found) {
            const u = ((t * 1.6 + i * 0.3) % 1);
            if (u > 0.45 && u < 0.95) { const k = (u - 0.45) / 0.5; out.fx.push({ key: "dirt", cw: 200, ch: 200, draw: dirtDraw, x: DIG[0] + dx * 0.5 - Math.sign(dx) * 1.6 * k, y: 0.6 + 1.6 * k - 2.2 * k * k, z: DIG[2] + dz * 0.4, w: 0.55, h: 0.55, rot: k * 3 }); }
          }
        });
        put(cam, out, t, frenchOfficer(1), DIG[0] - 3.0, 0, DIG[2] + 2.6, { fo: { expr: found ? "shock" : "stern", look: 1, prop: found ? ["sword", 0.3] : null } });
      }
      break;
    }
    case 15: {
      const read = sw(t, 65.78);
      put(cam, out, t, SAV[0], STONE2[0] - 1.45, 0, STONE2[2] + 0.9, { fo: { expr: read ? "grin" : "shock", prop: "book", look: 1 } });
      put(cam, out, t, SAV[1], STONE2[0] + 1.5, 0, STONE2[2] + 0.75, { fo: { expr: read ? "laugh" : "shock", wave: q(0.4 + 0.3 * Math.sin(t * 3), 8), look: -1 } });
      put(cam, out, t, SAV[2], STONE2[0] - 1.25, 0, STONE2[2] - 1.0, { fo: { expr: read ? "smile_closed" : "shock" } });
      put(cam, out, t, SAV[6], STONE2[0] + 1.4, 0, STONE2[2] - 1.2, { fo: { expr: read ? "grin" : "shock", prop: "book" } });
      put(cam, out, t, frenchOfficer(1), STONE2[0] + 3.0, 0, STONE2[2] - 0.6, { fo: { expr: "smile", look: -1 } });
      break;
    }
    case 16: {
      const stop = t >= COURIER_STOP, cx = courierX(t);
      if (f < 2117) {
        horseCard(cam, out, t, cx, sandY(cx, CAMP[2] + 5), CAMP[2] + 5, { coat: HORSE_COATS.bay, pose: stop ? "stand" : "gallop", phase: q((t * 2.2) % 1, 12), cloth: "#2f6a43", clothTrim: "#e8b53e",
          rider: COURIER, riderOpts: { expr: stop ? "grin" : "stern" } }, true);
        put(cam, out, t, NAP_GENERAL, NAP_CAMP[0], sandY(NAP_CAMP[0], NAP_CAMP[2]), NAP_CAMP[2], { fo: { expr: "stern", prop: "tuck", look: 1 } });
        put(cam, out, t, frenchOfficer(0), CAMP[0] - 4.2, sandY(CAMP[0] - 4.2, CAMP[2] + 4.5), CAMP[2] + 4.5, { fo: { expr: "neutral", look: 1 } });
        put(cam, out, t, SOL[1], CAMP[0] + 7.5, sandY(CAMP[0] + 7.5, CAMP[2] - 2), CAMP[2] - 2, { fo: { expr: "neutral" } });
      } else {
        const ex: Expr = f >= 2247 ? (f >= 2285 ? "grin" : "stern") : f >= 2184 ? "nervous" : f >= 2134 ? "shock" : "neutral";
        put(cam, out, t, NAP_GENERAL, NAP_CAMP[0], sandY(NAP_CAMP[0], NAP_CAMP[2]), NAP_CAMP[2], { fo: { expr: ex, prop: f >= 2247 ? "tuck" : "book" } });
        if (f < 2247) put(cam, out, t, frenchOfficer(0), CAMP[0] - 1.8, sandY(CAMP[0] - 1.8, CAMP[2] + 1.4), CAMP[2] + 1.4, { fo: { expr: f >= 2134 ? "nervous" : "neutral", look: 1 } });
      }
      break;
    }
    case 17: {
      if (f >= 2396 && f < 2433) {
        [[-3.6, -129.4], [-1.9, -128.2], [0, -128.9], [1.8, -128.3], [3.5, -129.6], [-0.9, -130.6]].forEach(([x, z], i) =>
          put(cam, out, t, i === 2 ? frenchOfficer(1) : SOL[(i * 5) % 6], x, BEACH, z, { fo: { expr: (["shock", "nervous", "shock", "dazed", "nervous", "shock"] as Expr[])[i], wave: i === 3 ? q(0.5 + 0.5 * Math.sin(t * 9), 8) : undefined } }));
      }
      // lantern glow on the little ship's stern
      out.fx.push({ key: "glowLamp", cw: 300, ch: 300, draw: (p) => flashDraw(p, 0.3, "#ffd27a"), x: smallX(t) - 12.5, y: 5.2, z: SMALL_Z, w: 0.9, h: 0.9 });
      break;
    }
    case 18: {
      const X = rideX(t);
      horseCard(cam, out, t, X, 0, -0.5, { coat: HORSE_COATS.grey, pose: "walk", phase: q((t * 0.8) % 1, 12), cloth: "#2c4790", clothTrim: "#e8b53e", rider: NAP_GENERAL, riderOpts: { expr: "smile_closed" } });
      for (let k = 0; k < 24; k++) {
        const x = -15 + k * 1.3 + hh(k, 1) * 0.4, z = -5.6 + (k % 2) * 1.0 + hh(k, 2) * 0.3;
        const c = k % 5 === 4 ? SOL[k % 6] : k % 3 === 1 ? WOMAN[k % 3] : CITIZEN[k % 6];
        const hop = Math.max(0, Math.sin(t * 7 + k)) * 0.12 * (k % 2);
        put(cam, out, t, c, x, hop, z, { fo: { expr: (["laugh", "grin", "relief_open", "laugh", "smile_closed"] as Expr[])[k % 5], wave: k % 4 === 3 ? undefined : q(0.5 + 0.5 * Math.sin(t * 8 + k * 1.7), 8), look: X > x ? 1 : -1 } });
      }
      for (const fx of [-10.5, -2.2, 6.4]) out.fx.push({ key: `flag${q((t + fx) % 1, 8)}`, cw: 300, ch: 420, draw: (p) => flagDraw(p, q(((t + fx) % 1 + 1) % 1, 8)), x: fx + 0.6, y: 2.7, z: -4.4, w: 1.3, h: 1.82 });
      break;
    }
    case 19: {
      const [rx, , rz] = ROOM;
      put(cam, out, t, NAP_GENERAL, rx, 0, rz - 1.15, { fo: { expr: f > 2627 ? "grin" : "stern", look: 0 } });
      put(cam, out, t, LUCIEN, rx - 1.2, 0, rz - 0.85, { fo: { expr: "smile_closed", tilt: 6, look: 1 } });
      put(cam, out, t, SIEYES, rx + 1.2, 0, rz - 0.85, { fo: { expr: f > 2636 ? "grin" : "smile", tilt: -6, look: -1 } });
      out.fx.push({ key: "papers", cw: 400, ch: 300, draw: papersDraw, x: rx - 0.3, y: 0.865, z: rz + 0.15, w: 1.1, h: 0.8, flat: true, rot: 0.1 });
      out.fx.push({ key: "candle", cw: 120, ch: 320, draw: candleDraw, x: rx + 0.55, y: 0.86 + 0.13, z: rz + 0.3, w: 0.1, h: 0.27 });
      const ph = q((t * 2.3) % 1, 8);
      out.fx.push({ key: `glowCandle${ph}`, cw: 300, ch: 400, draw: (p) => flameDraw(p, ph), x: rx + 0.55, y: 0.86 + 0.32, z: rz + 0.3, w: 0.09, h: 0.12 });
      break;
    }
    case 20: case 21: {
      const [hx, , hz] = HALL, clear = id === 21 && f >= 2875;
      const rows = [hx - 12.6, hx - 8.1, hx - 3.6, hx + 0.9, hx + 5.4];
      if (!clear) {
        let n = 0;
        rows.forEach((bx, r) => {
          for (const z of [hz - 7.4, hz - 5.6, hz - 3.6, hz + 2.6, hz + 4.6, hz + 6.6, hz + 8.6]) {
            const i = n++, c = LAW[(i * 3 + r) % 8];
            const angry: Expr = (["shock", "stern", "shock", "pained"] as Expr[])[(i + r) % 4];
            put(cam, out, t, c, bx + hh(i, 5) * 0.3, 0, z + hh(i, 6) * 0.4, { fo: { expr: id === 21 ? "nervous" : angry, wave: id === 20 && i % 3 !== 2 ? q(0.5 + 0.5 * Math.sin(t * 9 + i * 1.9), 8) : undefined, look: z > hz ? -1 : 1 } });
          }
        });
      }
      if (id === 20) {
        const cu = f >= 2771;
        if (!cu) put(cam, out, t, NAP_GENERAL, hx - 16, 0, hz - 0.6, { side: true, so: { expr: f > 2760 ? "nervous" : "stern" } });
        else {
          put(cam, out, t, NAP_GENERAL, hx - 16, 0, hz - 0.6, { fo: { expr: "nervous", look: 1, tilt: -4 } });
          [[-13.9, -1.8], [-13.1, -2.9], [-12.4, -0.6]].forEach(([dx, dz], i) => put(cam, out, t, LAW[(i * 5) % 8], hx + dx, 0, hz + dz, { fo: { expr: i % 2 ? "shock" : "stern", wave: q(0.5 + 0.5 * Math.sin(t * 10 + i), 8), look: -1 } }));
        }
        put(cam, out, t, GRENADIER[0], hx - 17.4, 0, hz - 2.4, { fo: { expr: "nervous" } });
        put(cam, out, t, GRENADIER[1], hx - 17.6, 0, hz + 1.6, { fo: { expr: "stern" } });
      } else if (!clear) {
        put(cam, out, t, LUCIEN, hx - 20, TRIB, hz - 4, { fo: { expr: f > 2850 ? "grin" : "stern", prop: ["sword", q(clamp01((f - 2826) / 12), 12)] } });
        put(cam, out, t, NAP_GENERAL, hx - 20.6, TRIB, hz - 1.6, { fo: { expr: "relief", look: -1 } });
        [[-16.6, -6.2], [-15.9, -4.8], [-16.4, -3.2], [-15.6, -7.4], [-14.9, -5.6]].forEach(([dx, dz], i) =>
          put(cam, out, t, i < 2 ? GRENADIER[i] : SOL[i % 6], hx + dx, 0, hz + dz, { fo: { expr: (["grin", "stern", "grin", "laugh", "stern"] as Expr[])[i] } }));
      } else {
        // the soldiers march in from the right, the deputies hurry out to the left (the door is off screen left)
        const u = t - 95.85;
        for (let k = 0; k < 9; k++) {
          const x = hx + 2 - k * 2.1 - u * 2.6, z = hz - 1.2 - (k % 3) * 1.1;
          put(cam, out, t, LAW[k % 8], x, 0, z, { walk: { dx: -1, dz: 0, phase: (t * 1.9 + k * 0.37) % 1 }, so: { expr: k % 2 ? "shock" : "nervous" } });
        }
        for (let k = 0; k < 7; k++) {
          const x = hx + 15 - k * 1.6 - u * 2.2, z = hz - 4.8 - (k % 2) * 1.0;
          put(cam, out, t, k < 2 ? GRENADIER[k] : SOL[k % 6], x, 0, z, { walk: { dx: -1, dz: 0, phase: (t * 1.2) % 1 }, so: { expr: k % 2 ? "grin" : "stern" } });
        }
      }
      break;
    }
    case 22: {
      const [hx, , hz] = HALL;
      put(cam, out, t, NAP_CONSUL, hx - 20, TRIB, hz + 1.6, { fo: { expr: f >= 3042 ? "smile_closed" : "stern", prop: "tuck" } });
      put(cam, out, t, GRENADIER[0], hx - 20.4, TRIB, hz - 3.4, { fo: { expr: "stern" } });
      put(cam, out, t, GRENADIER[1], hx - 20.4, TRIB, hz + 3.4, { fo: { expr: "stern" } });
      break;
    }
  }
  return out;
};
