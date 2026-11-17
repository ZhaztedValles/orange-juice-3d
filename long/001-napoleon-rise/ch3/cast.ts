// Chapter 3 cast: who stands where in every shot (Paris crowd, fleeing noble officers, the captain on the steps,
// Toulon royalists, bored besiegers, the wounded gunnery officer, Napoleon riding in / at the map / pointing, gunners
// under fire, the night assault, the bayonet, the promotion) and the effect cards (cannon smoke, muzzle flashes,
// dirt bursts, rain sheets, sparkles, a sling and a bandage). Shared presets from ../shared/cast.
import * as THREE from "three";
import { Pen, Expr, Outfit, fxBurst, townsfolk } from "../../../src/engine/toon";
import { CamInfo, Stage, hh, q, setStageLight, lidAt } from "../../../src/engine/cards";
import { NAP_GENERAL, BARRAS, BRITISH_OFFICER, frenchSoldier, frenchOfficer, britishSoldier, royalist, put, Char } from "../shared/cast";
import { horseCard, HORSE_COATS } from "../shared/props";
import { ground, PARIS, CAMP_Y, FORT_C, LAND, QUAY_Z } from "./terrain";
import {
  FPS, SHOTS, TABLE, LOOKOUT, BAT, BREACH, WALL_TOP, OFFICER_SPOT, CEREMONY, LONE, HAUL_Z, RIDE_Z,
  FLAG_UP, SIEGE_SHOT, LOOK_UP, NAP_POINT, BAT_FIRE, INCOMING, DUCK, NIGHT_FLASH, STAB_T, FALL_T, PROMOTE_T,
  climbZ, climbY, rideX, haulX, chargeX, smooth, clamp01, V3,
} from "./story";
import { GUNS_BAT } from "./sets";

const LEAD = 2 / FPS;
const C = (i: number, okey: string, o: Outfit, expr: Expr = "neutral"): Char => ({ i, okey, o, expr, scale: 1 });
/** the 24-year-old captain (before the promotion): the general's look without epaulettes and sash */
export const NAP_CAPTAIN = C(100, "napCaptain", { ...NAP_GENERAL.o, epaulettes: undefined, sash: undefined }, "stern");
/** noble officers of the old royal army: white coats, royal-blue facings, powdered hair, white cockade */
const noble = (v: number): Char => {
  const b = frenchOfficer(v).o;
  return C(300 + v, `noble${v}`, { ...b, jacket: "#f1ede2", lapels: "#2b3f8a", collar: "#2b3f8a", pants: "#f1ede2", sash: undefined, cockade: "#f7f4ec", locks: "#e7e2d8", lockLen: 0.3, plume: undefined }, "nervous");
};
const NOBLES = [0, 1, 2, 3].map(noble);
/** Parisians 1789-93: sans-culottes in red caps, women in bonnets, a few in tricornes */
const parisian = (v: number): Char => {
  const k = v % 6, base = townsfolk(k);
  const coats = ["#6b4a2e", "#3f5a46", "#2f4a7a", "#8a3b3b", "#5a4a6e", "#7a6a3a"];
  const o: Outfit = k % 2
    ? { ...base, jacket: coats[k], dress: ["#d9a441", "#c25a7a", "#5a8fc2"][k % 3], hat: "bonnet" }
    : { ...base, jacket: coats[k], pants: k === 2 ? "#e8e2d2" : "#3b3f52", hat: k === 4 ? "tricorne" : "cap", cap: "#c23a3a" };
  return C(320 + k, `paris${k}`, o, (["grin", "laugh", "smile", "grin", "laugh", "smile_closed"] as Expr[])[k]);
};
const SOLD = [0, 1, 2, 3, 4, 5].map(frenchSoldier);
const GUNNER = [2, 5, 0, 2, 5, 3].map(frenchSoldier);
const BRIT = [0, 1, 2, 3].map(britishSoldier);
const OFFS = [0, 1, 2].map(frenchOfficer);

// ---------------- effect drawings ----------------
/** cannon smoke: a cluster of round puffs that grows and greys (400 x 400) */
const fxSmoke = (p: Pen, t: number, dark = false) => {
  const s = 0.45 + 0.55 * Math.sqrt(t), k = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
  const cols = dark ? ["#6c6f80", "#7d8091", "#5c5f70"] : ["#f3efe6", "#e2ddd3", "#d2ccc2"];
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1 + 0.4, d = 70 * s * (0.5 + 0.5 * (i % 2));
    const r = (70 + 22 * (i % 3)) * s * k;
    if (r > 4) p.ell(200 + d * Math.cos(a) + 40 * t, 220 + d * 0.7 * Math.sin(a) - 60 * t, r, r * 0.86, cols[i % 3], 7);
  }
};
/** dirt burst for incoming shot (400 x 400): brown clods + dust */
const fxDirt = (p: Pen, t: number) => {
  const k = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.45, d = 150 * Math.sqrt(t);
    const r = (46 + 14 * (i % 2)) * k * (0.6 + 0.6 * t);
    if (r > 4) p.ell(200 + d * Math.cos(a), 330 + d * Math.sin(a), r, r * 0.8, i % 2 ? "#c9a878" : "#b18c5e", 6);
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32, d = 60 + 220 * t, y = 330 + d * Math.sin(a) + 260 * t * t;
    if (t < 0.85) p.ell(200 + d * Math.cos(a), y, 12, 10, "#6a4a30", 4);
  }
};
/** rain: thin slanted streaks on a transparent card (soft), offset by phase so it falls */
const fxRain = (p: Pen, ph: number, seed: number) => {
  const g = p.g;
  g.lineCap = "round";
  for (let i = 0; i < 70; i++) {
    const x = hh(i, seed) * 560 - 30, y0 = ((hh(i, seed + 1) + ph) % 1) * 640 - 120, L = 50 + 50 * hh(i, seed + 2);
    g.strokeStyle = `rgba(205,220,245,${(0.35 + 0.35 * hh(i, seed + 3)).toFixed(2)})`;
    g.lineWidth = 2 + 2 * hh(i, seed + 4);
    g.beginPath(); g.moveTo(x, y0); g.lineTo(x - L * 0.18, y0 + L); g.stroke();
  }
};
/** an arm sling across the chest (white cloth, ink edge) */
const fxSling = (p: Pen) => { p.poly([[20, 30], [180, 60], [170, 120], [40, 100]], "#f4f0e6", 7); p.stroke([[30, 40], [180, 70]], 4, "#d9d2c2"); };
/** a bandage wrapped round the thigh */
const fxBandage = (p: Pen) => { p.poly([[10, 20], [190, 30], [186, 82], [14, 74]], "#f4f0e6", 7); p.stroke([[20, 48], [180, 56]], 4, "#d9d2c2"); };

const smokeFx = (out: Stage, key: string, t: number, t0: number, x: number, y: number, z: number, size = 2.6, dark = false, dur = 1.6) => {
  const u = (t - t0) / dur;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 24);
  out.fx.push({ key: `smoke${dark ? "d" : ""}${uq}`, cw: 400, ch: 400, draw: (p) => fxSmoke(p, uq, dark), x, y, z, w: size, h: size });
  if (u < 0.12) {
    const fq = q(u / 0.12, 6);
    out.fx.push({ key: `flash${fq}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, fq, "#ffd36a", 10, 50, 230), x, y, z, w: size * 0.9, h: size * 0.9 });
  }
};
const flashFx = (out: Stage, t: number, t0: number, x: number, y: number, z: number, size = 1.6) => {
  const u = (t - t0) / 0.2;
  if (u < 0 || u >= 1) return;
  const fq = q(u, 6);
  out.fx.push({ key: `nflash${fq}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, fq, "#ffcf5a", 10, 50, 230), x, y, z, w: size, h: size });
};
const dirtFx = (out: Stage, t: number, t0: number, x: number, y: number, z: number, size = 3) => {
  const u = (t - t0) / 0.9;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 24);
  out.fx.push({ key: `dirt${uq}`, cw: 400, ch: 400, draw: (p) => fxDirt(p, uq), x, y: y + size * 0.25, z, w: size, h: size });
};
const sparkle = (out: Stage, t: number, t0: number, x: number, y: number, z: number, size = 1.4) => {
  const u = (t - t0) / 0.5;
  if (u < 0 || u >= 1) return;
  const uq = q(u, 15);
  out.fx.push({ key: `spark${uq}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, uq, "#ffe27a", 12, 40, 230), x, y, z, w: size, h: size });
};

// ---------------- shared story positions ----------------
/** Paris crowd (shot 1): spots in the square, flag bearers flagged */
export const CROWD: { x: number; z: number; flag: boolean }[] = (() => {
  const out: { x: number; z: number; flag: boolean }[] = [];
  for (let i = 0; i < 72; i++) {
    const row = Math.floor(i / 12), col = i % 12;
    out.push({ x: PARIS[0] - 17 + col * 2.9 + (hh(i, 1) - 0.5) * 1.6 + (row % 2) * 1.4, z: 1985 + row * 3.4 + (hh(i, 2) - 0.5) * 1.5, flag: i % 6 === 2 });
  }
  return out;
})();
/** the fleeing nobles (shot 4): x along the east street at time t (they walk +x, some looking back) */
export const noblePos = (k: number, t: number): [number, number] => [24 + k * 2.6 - (k % 2) * 1.2 + 1.45 * (t - 11.3), 1998.8 + (k % 2) * 1.8 + (k === 3 ? -0.6 : 0)];
/** quay royalists (shot 6b) */
const QUAY: [number, number][] = [[24, 75], [26.4, 77.6], [31.5, 76.4], [33.8, 78.2], [22, 79], [29, 80], [35.6, 75.4], [20.2, 76.6]];
/** the camp gun (shot 8) */
export const CAMP_GUN: V3 = [-258, CAMP_Y, -106];
export const MUZZLE = (g: V3, rec = 0): V3 => [g[0] + 1.45 - rec, g[1] + 1.12, g[2]];
/** recoil distance of a gun fired at t0 (0.55 m kick, back to battery in ~1 s) */
export const recoil = (t: number, t0: number) => {
  const u = t - t0;
  if (u < 0 || u > 1.3) return 0;
  return u < 0.08 ? 0.55 * (u / 0.08) : 0.55 * (1 - smooth((u - 0.08) / 1.1));
};
/** battery gun k fires at these times */
export const batFires = (k: number) => BAT_FIRE.filter((_, i) => i % 3 === k);
/** night assault column (shot 15a) */
const runPhase = (t: number, i: number) => ((t * 1.6 + hh(i, 9)) % 1 + 1) % 1;

const bandageAt = (cam: CamInfo, out: Stage, x: number, y: number, z: number, side = -1) => {
  const r = cam.right, tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  out.fx.push({ key: "bandage", cw: 200, ch: 100, draw: fxBandage, x: x + r.x * 0.085 * side + (tx / tl) * 0.06, y: y + 0.66, z: z + r.z * 0.085 * side + (tz / tl) * 0.06, w: 0.2, h: 0.1 });
};

/** everything with a face (and the 2D effects) in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  setStageLight(cam, s.light === "golden" ? "golden" : "day");
  const f = Math.round(t * FPS);
  switch (id) {
    case 1: { // Paris crowd cheering with tricolours
      CROWD.forEach((c, i) => {
        const p = parisian(i), hop = c.flag ? 0 : Math.max(0, Math.sin(t * 6 + i * 1.7)) * 0.12 * (i % 3 === 0 ? 1 : 0);
        put(cam, out, t, i % 7 === 3 ? SOLD[i % 6] : p, c.x, hop, c.z, { fo: { expr: p.expr, wave: c.flag || i % 4 === 1 ? undefined : q(Math.sin(t * 8 + i * 1.3), 20), facing: i % 3 === 0 ? -1 : i % 3 === 1 ? 1 : 0 } });
      });
      break;
    }
    case 4: { // the noble officers hurry away down the street; Parisians watch from the square
      NOBLES.forEach((n, k) => {
        const [x, z] = noblePos(k, t), back = k % 2 === 0 && (t > 14.7 - LEAD && t < 15.6);
        put(cam, out, t, n, x, 0, z, back ? { side: true, mirror: true, so: { expr: "shock" } } : { walk: { dx: 1, dz: 0, phase: (t * 1.9 + k * 0.3) % 1 }, so: { expr: k === 1 ? "shock" : "nervous" }, fo: { expr: "nervous" } });
      });
      for (let i = 0; i < 4; i++) put(cam, out, t, parisian(i + 1), 26 + i * 2.1, 0, 2006.4 + (i % 2) * 0.8, { fo: { expr: i % 2 ? "stern" : "grin", facing: -1 } });
      break;
    }
    case 5: { // the captain climbs the steps
      const z = climbZ(t), y = climbY(t), moving = t > 16.15 && t < 20.45;
      put(cam, out, t, NAP_CAPTAIN, 0, y, z, moving ? { walk: { dx: 0, dz: 1, phase: (t * 1.9) % 1 }, so: { expr: "stern" } } : { side: true, so: { expr: "stern" } });
      for (let i = 0; i < 3; i++) put(cam, out, t, parisian(i + 2), 2.4 + i * 1.6, 0, 2020.6 - i * 1.3, { fo: { expr: (["shock", "smile", "grin"] as Expr[])[i], facing: 1 } });
      break;
    }
    case 6: { // royalists on the quay cheer the white flag
      if (f < 722) break;
      const up = t > FLAG_UP[0] + 0.6;
      QUAY.forEach(([x, z], i) => {
        const r = royalist(i);
        put(cam, out, t, r, x, LAND, z, { fo: { expr: up ? (i % 2 ? "grin" : "laugh") : "smile_closed", wave: up && i % 3 !== 1 ? q(Math.sin(t * 7 + i), 20) : undefined, facing: i % 2 ? -1 : 1 } });
      });
      break;
    }
    case 8: { // bored besiegers; the camp gun fires short
      const after = t > SIEGE_SHOT + 1.1;
      const spots: [number, number][] = [[-262.5, -102.4], [-264.6, -104.2], [-261.6, -108.7], [-266.2, -100.8], [-268.4, -106.1], [-259.6, -101.2]];
      spots.forEach(([x, z], i) => put(cam, out, t, SOLD[i], x, ground(x, z), z, { fo: { mode: "sit", expr: after ? (i % 2 ? "dazed" : "nervous") : i % 3 === 0 ? "dazed" : "neutral", look: after ? 1 : 0 }, blob: false }));
      put(cam, out, t, GUNNER[1], CAMP_GUN[0] - 0.4, CAMP_Y, CAMP_GUN[2] - 1.6, { fo: { expr: t > SIEGE_SHOT + 1.4 ? "dazed" : "stern", facing: 1 } });
      smokeFx(out, "camp", t, SIEGE_SHOT, ...MUZZLE(CAMP_GUN, recoil(t, SIEGE_SHOT)), 3.0);
      dirtFx(out, t, SIEGE_SHOT + 1.25, -190, ground(-190, -112), -112, 6);
      break;
    }
    case 9: {
      if (f < 1255) { // the wounded gunnery officer on his crate
        const o = OFFICER_SPOT;
        put(cam, out, t, OFFS[1], o[0], o[1] + 0.32, o[2] - 0.1, { fo: { mode: "sit", expr: "pained", headTilt: -6 }, blob: false });
        const r = cam.right;
        out.fx.push({ key: "sling", cw: 200, ch: 140, draw: fxSling, x: o[0] + r.x * 0.06, y: o[1] + 0.32 + 0.62, z: o[2] - 0.1 + 0.08, w: 0.42, h: 0.29 });
        put(cam, out, t, SOLD[3], o[0] + 1.05, o[1], o[2] - 0.2, { fo: { expr: "nervous", facing: -1 } });
        put(cam, out, t, SOLD[0], o[0] - 1.2, o[1], o[2] - 1.0, { fo: { expr: t > 41.2 ? "shock" : "nervous", facing: 1 } });
      } else { // the captain rides in
        const x = rideX(t), u = clamp01((t - 41.9) / 2.5), gal = u < 0.75;
        horseCard(cam, out, t, x, ground(x, RIDE_Z), RIDE_Z, { coat: HORSE_COATS.bay, pose: gal ? "gallop" : u < 0.98 ? "walk" : "stand", phase: gal ? (t * 2.1) % 1 : (t * 1.2) % 1, rider: NAP_CAPTAIN, riderOpts: { expr: "stern" } }, false);
        for (let i = 0; i < 4; i++) {
          const sx = -312 + i * 5.5, sz = RIDE_Z - 4 - (i % 2) * 1.5;
          put(cam, out, t, SOLD[i + 1], sx, ground(sx, sz), sz, { fo: { expr: t > 42.6 + i * 0.3 ? "shock" : "neutral", facing: 0 } });
        }
      }
      break;
    }
    case 10: { // Napoleon behind the map table, two officers
      const nz = TABLE[2] - 0.95;
      const ex: Expr = t < LOOK_UP - LEAD ? "stern" : "smile_closed";
      if (f < 1468) {
        put(cam, out, t, NAP_CAPTAIN, TABLE[0], TABLE[1], nz, { fo: { expr: f < 1385 ? "stern" : ex, headTilt: f >= 1385 && t < LOOK_UP ? 8 : 0 } });
        put(cam, out, t, OFFS[0], TABLE[0] - 1.6, TABLE[1], nz + 0.45, { fo: { expr: t > LOOK_UP + 0.4 ? "shock" : "neutral", facing: 1 } });
        put(cam, out, t, OFFS[2], TABLE[0] + 1.6, TABLE[1], nz + 0.35, { fo: { expr: t > LOOK_UP + 0.6 ? "nervous" : "stern", facing: -1 } });
      }
      break;
    }
    case 11: { // redcoats on the west walls
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (0.78 + i * 0.09), r = 16.5;
        put(cam, out, t, BRIT[i % 4], FORT_C[0] + r * Math.cos(a), WALL_TOP, FORT_C[1] + r * Math.sin(a), { fo: { expr: i % 2 ? "stern" : "grin", facing: i % 2 ? 1 : -1 }, blob: false });
      }
      break;
    }
    case 12: {
      if (f < 1817) { // the British officer on the parapet, smug, over the harbour
        put(cam, out, t, BRITISH_OFFICER, -115.6, WALL_TOP, -143.0, { side: true, so: { expr: "grin" }, blob: false });
        put(cam, out, t, BRIT[1], -117.8, WALL_TOP, -139.6, { side: true, so: { expr: "stern" }, blob: false });
      } else { // Napoleon on the lookout points his sabre at the fort
        const k = clamp01((t - (NAP_POINT - 0.25)) / 0.35);
        put(cam, out, t, NAP_CAPTAIN, LOOKOUT[0], LOOKOUT[1], LOOKOUT[2], { side: true, so: { expr: "stern", prop: ["sword", q(0.15 + 0.4 * smooth(k), 12)] } });
        put(cam, out, t, OFFS[0], LOOKOUT[0] - 1.8, ground(LOOKOUT[0] - 1.8, LOOKOUT[2] + 1.6), LOOKOUT[2] + 1.6, { fo: { expr: t > 62.0 ? "grin" : "neutral", facing: 1 } });
        put(cam, out, t, OFFS[1], LOOKOUT[0] - 3.2, ground(LOOKOUT[0] - 3.2, LOOKOUT[2] + 0.4), LOOKOUT[2] + 0.4, { fo: { expr: t > 62.3 ? "smile" : "stern", facing: 1 } });
      }
      break;
    }
    case 13: {
      if (f < 2005) { // hauling: three men behind each gun
        for (let g = 0; g < 2; g++) {
          const gx = haulX(t) - g * 7.5, gz = HAUL_Z - g * 2.2;
          for (let k = 0; k < 3; k++) {
            const x = gx - 3.0 - (k === 1 ? 0.5 : 0), z = gz + (k - 1) * 0.9;
            put(cam, out, t, SOLD[(g * 3 + k) % 6], x, ground(x, z), z, { walk: { dx: 1, dz: 0, phase: (t * 0.9 + k * 0.33) % 1 }, so: { expr: k % 2 ? "grin" : "stern" } });
          }
        }
        put(cam, out, t, NAP_CAPTAIN, haulX(t) + 3.5, ground(haulX(t) + 3.5, HAUL_Z + 2.4), HAUL_Z + 2.4, { side: true, mirror: true, so: { expr: "stern", prop: ["sword", 0.5] } });
      } else { // the battery under the walls: guns fire, shot lands around, gunners duck
        const duck = t > DUCK[0] - LEAD && t < DUCK[1];
        GUNS_BAT.forEach(([gx, gz], k) => {
          for (const sz of [-1.1, 1.1]) {
            const x = gx - 1.2 + (sz > 0 ? -0.4 : 0), z = gz + sz, i = k * 2 + (sz > 0 ? 1 : 0);
            const ex: Expr = duck ? "shock" : i % 3 === 0 ? "grin" : "stern";
            put(cam, out, t, GUNNER[i % 6], x, ground(x, z), z, { fo: { mode: duck && i % 2 === 0 ? "sit" : "stand", expr: ex, facing: sz > 0 ? -1 : 1 }, blob: !(duck && i % 2 === 0) });
          }
          for (const t0 of batFires(k)) smokeFx(out, `b${k}`, t, t0, ...MUZZLE([gx, ground(gx, gz), gz], recoil(t, t0)), 2.8);
        });
        put(cam, out, t, NAP_CAPTAIN, BAT[0] - 4.2, ground(BAT[0] - 4.2, BAT[2] + 2.2), BAT[2] + 2.2, { fo: { expr: duck ? "stern" : "stern", prop: ["sword", 0.55], facing: 1 } });
        INCOMING.forEach((t0, i) => {
          const x = BAT[0] - 2 + (hh(i, 3) - 0.5) * 8 + (i % 2 ? 4.5 : -1), z = BAT[2] + (hh(i, 4) - 0.5) * 12;
          dirtFx(out, t, t0, x, ground(x, z), z, 3.2);
        });
        // the fort's guns answer from the walls
        INCOMING.forEach((t0, i) => flashFx(out, t, t0 - 0.9, -149.5, WALL_TOP + 1.1, -150 + (i % 3 - 1) * 6, 2.2));
      }
      break;
    }
    case 14: { // the men without fear
      const ids = [0, 1, 2, 3, 4];
      ids.forEach((k) => {
        const x = BAT[0] - 1.6 - (k % 2) * 0.6, z = BAT[2] - 3.2 + k * 1.3;
        put(cam, out, t, GUNNER[k], x, ground(x, z), z, { fo: { expr: k % 2 ? "grin" : "laugh", wave: k % 2 === 0 && t > 73.4 ? q(Math.sin(t * 7 + k), 20) : undefined, facing: -1 } });
      });
      put(cam, out, t, NAP_CAPTAIN, BAT[0] - 2.6, ground(BAT[0] - 2.6, BAT[2] + 3.6), BAT[2] + 3.6, { fo: { expr: t > 73.6 ? "smile_closed" : "stern", facing: -1 } });
      for (const t0 of [73.0, 74.4]) smokeFx(out, "b14", t, t0, ...MUZZLE([GUNS_BAT[0][0], ground(GUNS_BAT[0][0], GUNS_BAT[0][1]), GUNS_BAT[0][1]], recoil(t, t0)), 2.8);
      break;
    }
    case 15: {
      rain(cam, out, t);
      NIGHT_FLASH.forEach((t0, i) => {
        const a = Math.PI * (0.8 + (i % 5) * 0.07), r = 18.5;
        flashFx(out, t, t0, FORT_C[0] + r * Math.cos(a), WALL_TOP + 1.2, FORT_C[1] + r * Math.sin(a), 2.4);
        smokeFx(out, "n", t, t0, FORT_C[0] + (r + 1.5) * Math.cos(a), WALL_TOP + 1.6, FORT_C[1] + (r + 1.5) * Math.sin(a), 2.6, true, 1.8);
      });
      if (f < 2408) { // the column storms up the slope
        for (let i = 0; i < 16; i++) {
          const x = -190 + (i % 4) * 1.4 + Math.floor(i / 4) * -2.2 + 2.6 * (t - 76.0), z = -145 - (i % 4) * 1.6 + (hh(i, 2) - 0.5);
          put(cam, out, t, SOLD[i % 6], x, ground(x, z), z, { walk: { dx: 1, dz: 0, phase: runPhase(t, i) }, so: { expr: i % 3 ? "stern" : "grin" } });
        }
      } else if (f < 2451) { // Napoleon charging with the sabre up
        const x = chargeX(t);
        put(cam, out, t, NAP_CAPTAIN, x, ground(x, -150), -150, { side: true, so: { mode: "march", phase: runPhase(t, 0), expr: "stern", prop: ["sword", 1], stride: 1 } });
        for (let i = 0; i < 4; i++) {
          const sx = x - 1.6 - i * 1.3, sz = -150.8 - (i % 2) * 1.3;
          put(cam, out, t, SOLD[i], sx, ground(sx, sz), sz, { side: true, so: { mode: "march", phase: runPhase(t, i + 1), expr: "grin", stride: 1 } });
        }
      } else { // the bayonet
        const hit = t >= STAB_T - LEAD;
        const nx = BREACH[0] - 0.5, nz = BREACH[2];
        put(cam, out, t, NAP_CAPTAIN, nx, BREACH[1], nz, hit ? { fo: { expr: "pained", tilt: -7, prop: ["sword", 0.2], facing: 1 } } : { side: true, so: { expr: "stern", prop: ["sword", 0.9] } });
        const lunge = clamp01((t - (STAB_T - 0.25)) / 0.25) * (1 - clamp01((t - STAB_T - 0.4) / 0.4));
        put(cam, out, t, BRIT[2], nx + 1.25 - 0.25 * lunge, ground(nx + 1.25, nz - 0.2), nz - 0.2, { side: true, mirror: true, so: { expr: hit ? "grin" : "stern", pose: lunge } });
        if (t >= STAB_T - LEAD && t < STAB_T + 0.35) {
          const u = q((t - STAB_T + LEAD) / 0.35, 10);
          out.fx.push({ key: `stab${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff3b0", 8, 40, 200), x: nx + 0.35, y: BREACH[1] + 0.7, z: nz + 0.2, w: 0.75, h: 0.75 });
        }
      }
      break;
    }
    case 16: { // tricolour up; soldiers cheer on the wall
      rain(cam, out, t);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (0.9 + i * 0.05), r = 16.3, x = FORT_C[0] + r * Math.cos(a), z = FORT_C[1] + r * Math.sin(a);
        const c = i === 2 ? NAP_CAPTAIN : SOLD[i];
        put(cam, out, t, c, x, WALL_TOP, z, { fo: { expr: i === 2 ? "smile_closed" : "laugh", wave: i !== 2 ? q(Math.sin(t * 8 + i), 20) : undefined, prop: i === 2 ? ["sword", 1] : null }, blob: false });
      }
      break;
    }
    case 17: { // dawn of the French: soldiers waving from the wall as the fleet leaves
      for (let i = 0; i < 3; i++) {
        const x = -112 + i * 1.1, z = -146.5 - i * 0.9;
        put(cam, out, t, SOLD[i + 2], x, WALL_TOP, z, { side: true, so: { expr: "laugh" }, blob: false });
      }
      break;
    }
    case 18: { // promotion: Barras before the captain, soldiers in a line
      const prom = Math.round(t * FPS) >= 2822;
      const nap = prom ? NAP_GENERAL : NAP_CAPTAIN;
      const salute = t > PROMOTE_T + 0.3;
      put(cam, out, t, nap, CEREMONY[0], CEREMONY[1], CEREMONY[2], { fo: { expr: prom ? (salute ? "smile_closed" : "stern") : "stern", prop: salute ? ["sword", q(clamp01((t - PROMOTE_T - 0.3) / 0.3), 10)] : null, facing: 1 } });
      bandageAt(cam, out, CEREMONY[0], CEREMONY[1], CEREMONY[2]);
      put(cam, out, t, BARRAS, CEREMONY[0] + 1.7, CEREMONY[1], CEREMONY[2] + 0.4, { fo: { expr: "smile", facing: -1 } });
      for (let i = 0; i < 6; i++) {
        const x = CEREMONY[0] - 4.5 + i * 1.7, z = CEREMONY[2] - 3.2 - (i % 2) * 0.4;
        put(cam, out, t, SOLD[i], x, ground(x, z), z, { fo: { expr: salute ? (i % 2 ? "laugh" : "grin") : "neutral", wave: salute && i % 2 === 0 ? q(Math.sin(t * 8 + i), 20) : undefined } });
      }
      sparkle(out, t, PROMOTE_T - 0.05, CEREMONY[0] - 0.33, CEREMONY[1] + 1.55, CEREMONY[2] + 0.1, 0.8);
      sparkle(out, t, PROMOTE_T - 0.05, CEREMONY[0] + 0.33, CEREMONY[1] + 1.55, CEREMONY[2] + 0.1, 0.8);
      break;
    }
    case 19: { // alone on the wall
      put(cam, out, t, NAP_GENERAL, LONE[0], LONE[1], LONE[2], { fo: { expr: t > 97.6 ? "nervous" : "stern", look: t > 97.6 ? -1 : 0 }, blob: false });
      break;
    }
    default: break;
  }
  return out;
};

/** three rain sheets at 2.5 / 5 / 9 m in front of the lens, falling */
const fwd = new THREE.Vector3(), up = new THREE.Vector3();
const rain = (cam: CamInfo, out: Stage, t: number) => {
  const r = cam.right;
  fwd.set(r.z, 0, -r.x); // horizontal forward from the right vector (right = forward x up = (-fz, 0, fx))
  up.set(0, 1, 0);
  [2.5, 5, 9].forEach((d, k) => {
    const ph = q(((t * (1.9 - 0.35 * k)) % 1 + 1) % 1, 12);
    const w = d * 1.6, h = d * 1.1;
    out.fx.push({ key: `rain${k}_${ph}`, cw: 512, ch: 512, draw: (p) => fxRain(p, ph, 11 + k * 7), x: cam.pos.x + fwd.x * d, y: cam.pos.y + 0.0, z: cam.pos.z + fwd.z * d, w, h, soft: true });
  });
};
export { QUAY_Z };
