// Chapter 4 cast: who stands where in every shot, the chapter's own extras (deputies, Augustin Robespierre, the ragged
// army of Italy, salon guests, Parisians, the wedding official) and the effect cards (cannon smoke, muzzle flashes,
// candle and camp-fire flames, hearts, the thought bubble with the Sultan's domed skyline, the light beam in the cell).
import { Pen, INK, SKINS, Expr, fxBurst, fxSplash, fxPuff } from "../../../src/engine/toon";
import { CamInfo, Stage, setStageLight, hh, q } from "../../../src/engine/cards";
import {
  Char, put, NAP_GENERAL, BARRAS, MURAT, ROBESPIERRE, JOSEPHINE, frenchSoldier, frenchOfficer, royalist, FR_BLUE, FR_WHITE, FR_RED, GOLD,
} from "../shared/cast";
import { horseCard, HORSE_COATS } from "../shared/props";
import {
  FPS, SHOTS, BEAT, V3, CHURCH_Z, STEPS_Z, STREET_GUNS, DECK, BR_HALF, RIVER, WATER_Y, CAMP, PARK,
  muratX, rideZ, walkZ, royalFront, chargeZ, marchX, smooth, clamp01,
} from "./story";
import { stepY } from "./sets";

// ---------------- the chapter's own extras (new identities i >= 300; shared presets are never restyled) ----------------
const C = (i: number, okey: string, o: Char["o"], expr: Expr = "neutral", scale = 1): Char => ({ i, okey, o, expr, scale });
const POWDER = "#e7e2d8", BROWN = "#6a4228", DARK = "#2a1f1c", GREY = "#b9b4ac";
/** deputies of the Convention (1794) and the Directory's men (1795-96): civilian coats, tricolour sashes */
const deputy = (v: number): Char => {
  const k = v % 4;
  return C(300 + k, `ch4dep${k}`, { jacket: ["#3b3f5a", "#5a3a3a", "#3f5a46", "#4a3f2f"][k], pants: ["#e9e3d4", "#3b3f52", "#d8cfb8", "#e9e3d4"][k], boots: INK,
    hat: k === 1 ? "tricorne" : k === 3 ? "bicorne_fa" : "hair", plume: k === 3 ? "#d23a3f" : undefined, hair: [POWDER, BROWN, GREY, DARK][k], locks: [POWDER, BROWN, GREY, DARK][k], lockLen: 0.35,
    sash: "tricolour", lapels: "#e7dcc0", buttons: GOLD, skin: SKINS[k % 4], build: k === 2 ? "stout" : undefined, moustache: k === 1 ? "#3a2a20" : undefined }, k % 2 ? "stern" : "nervous");
};
/** Augustin Robespierre, the younger brother: blue-grey coat, light brown hair, friendly */
const AUGUSTIN = C(310, "ch4augustin", { jacket: "#56688c", pants: "#e9e3d4", boots: INK, hat: "hair", hair: "#8a6a4a", locks: "#8a6a4a", lockLen: 0.4, lapels: "#efe6cc", buttons: GOLD, skin: SKINS[0] }, "smile");
/** the army of Italy in 1796: faded patched coats, no hats or battered ones, bare feet or worn shoes */
const ragged = (v: number): Char => {
  const k = v % 6;
  return C(320 + k, `ch4rag${k}`, { jacket: ["#4f6390", "#5d6a86", "#6a6f80", "#4a5a7a", "#7a6a5a", "#56607a"][k], pants: ["#cfc6ae", "#b8ab90", "#c9bfa6", "#a89b80", "#cfc6ae", "#bdb196"][k],
    boots: k % 2 ? SKINS[(k + 1) % 4] : "#7a5a3a", hat: k === 2 ? "cap" : k === 4 ? "bicorne" : "hair", cap: "#8a3a3a", hair: [BROWN, DARK, BROWN, "#5a4030", DARK, "#8a6a4a"][k],
    locks: [BROWN, DARK, BROWN, "#5a4030", DARK, "#8a6a4a"][k], lockLen: 0.5, belt: "#d8d0bc", lapels: "#d8d0bc", collar: "#9a4a46", rifle: k !== 3, skin: SKINS[k % 4],
    moustache: k === 1 || k === 4 ? "#3a2a20" : undefined, beard: k === 5 ? "#5a4030" : undefined }, (["pained", "nervous", "dazed", "pained", "stern", "nervous"] as Expr[])[k]);
};
/** Paris salon guests (1795): ladies in white muslin with coloured spencers, an incroyable in a striped coat */
const guest = (v: number): Char => {
  const k = v % 4;
  if (k % 2 === 0) return C(330 + k, `ch4guest${k}`, { jacket: k ? "#6a8fc0" : "#c9a24e", dress: "#f4efe4", pants: "#f4efe4", boots: "#c9a46a", hat: "hair", hair: k ? "#c99a5a" : DARK, locks: k ? "#c99a5a" : DARK, lockLen: 0.5, skin: SKINS[k % 4] }, "smile");
  return C(330 + k, `ch4guest${k}`, { jacket: k === 1 ? "#4f7a4a" : "#7a3f5a", pants: "#efe6cc", boots: INK, hat: "bicorne_fa", cockade: null, hatCol: "#2a2630", locks: k === 1 ? BROWN : "#c99a5a", lockLen: 0.6,
    lapels: "#f2ead6", collar: "#f2ead6", buttons: GOLD, skin: SKINS[(k + 1) % 4] }, "grin");
};
/** the official who marries them (civil wedding): black coat, tricolour sash, powdered hair */
const OFFICIAL = C(340, "ch4official", { jacket: "#2a2830", pants: "#2a2830", boots: INK, hat: "hair", hair: POWDER, locks: POWDER, lockLen: 0.3, sash: "tricolour", lapels: "#efe6cc", buttons: GOLD, build: "stout", skin: SKINS[1] }, "smile_closed");
/** Parisians: men with the red liberty cap or a round hat, women in bonnets and dresses */
const parisian = (v: number): Char => {
  const k = v % 6;
  if (k % 3 === 2) return C(350 + k, `ch4par${k}`, { jacket: ["#c9a24e", "#7a9ac0"][k % 2], dress: ["#c25a5a", "#5a7ac2"][k % 2], pants: "#5a4636", boots: "#3a2a20", hat: "bonnet", hair: BROWN, locks: BROWN, lockLen: 0.4, skin: SKINS[k % 4] }, "smile");
  return C(350 + k, `ch4par${k}`, { jacket: ["#5a4a3a", "#3f5a46", "#4a4f66", "#6b4a2e", "#5a3046", "#3b3f5a"][k], pants: ["#d8cfb8", "#c23a3a", "#d8cfb8", "#3b3f52", "#d8cfb8", "#c9b896"][k], boots: "#3a2a20",
    hat: k % 2 ? "cap" : "tricorne", cap: "#c23a3a", lapels: "#efe6cc", locks: [BROWN, DARK, GREY, BROWN, DARK, "#8a6a4a"][k], lockLen: 0.35, skin: SKINS[(k + 1) % 4],
    moustache: k === 3 ? "#3a2a20" : undefined }, (["grin", "laugh", "smile", "grin", "laugh", "smile"] as Expr[])[k]);
};
void FR_BLUE; void FR_WHITE; void FR_RED;

// ---------------- effect drawings ----------------
type P2 = [number, number];
/** cannon smoke: a cumulus of overlapping discs with one ink outline around the union (512 x 512), shade low-right */
const smokeCloud = (p: Pen, seed: number, k: number) => {
  const disc: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) {
    const a = hh(seed, i) * Math.PI * 2, d = 40 + 110 * hh(seed, i + 20) * (0.6 + 0.4 * k), r = (70 + 50 * hh(seed, i + 40)) * (0.75 + 0.25 * k);
    disc.push([256 + d * Math.cos(a), 270 + 0.7 * d * Math.sin(a), r]);
  }
  for (const [x, y, r] of disc) p.ell(x, y, r, r * 0.9, null, 16);
  for (const [x, y, r] of disc) p.ell(x, y, r, r * 0.9, "#cfcbd2", 0);
  for (const [x, y, r] of disc) p.ell(x - 0.18 * r, y - 0.2 * r, r * 0.78, r * 0.7, "#f2efe9", 0);
};
/** soft drifting haze (no outline) */
const haze = (p: Pen, seed: number) => {
  for (let i = 0; i < 7; i++) {
    const x = 256 + (hh(seed, i) - 0.5) * 260, y = 256 + (hh(seed, i + 9) - 0.5) * 120, r = 80 + 60 * hh(seed, i + 3);
    p.ell(x, y, r, r * 0.7, "rgba(236,232,226,0.5)", 0);
  }
};
/** candle flame (128 x 256), t = flicker phase */
const flame = (p: Pen, t: number) => {
  const sw = 6 * Math.sin(t * 6.28);
  const outer: P2[] = [[64, 236], [36, 180], [44, 120], [64 + sw, 30], [84, 120], [92, 180]];
  p.poly(outer, "#ffb347", 5);
  p.poly([[64, 226], [50, 184], [56, 140], [64 + sw * 0.6, 92], [72, 140], [78, 184]], "#fff2a8", 0);
};
/** camp fire (512 x 512): logs and three tongues of flame */
const fire = (p: Pen, t: number) => {
  for (const [a, b] of [[[110, 470], [400, 430]], [[130, 430], [390, 475]]] as [P2, P2][]) p.line([a, b], "#7a4a2e", 34);
  for (let i = 0; i < 3; i++) {
    const cx = 200 + i * 60, h = 220 + 60 * Math.sin(t * 6.28 + i * 2.1) + (i === 1 ? 80 : 0), w = 70 - Math.abs(i - 1) * 12, sw = 18 * Math.sin(t * 6.28 * 1.5 + i);
    p.poly([[cx - w, 440], [cx - w * 0.8, 360], [cx + sw, 440 - h], [cx + w * 0.8, 360], [cx + w, 440]], "#ff8a3a", 8);
    p.poly([[cx - w * 0.55, 440], [cx - w * 0.4, 380], [cx + sw * 0.6, 440 - h * 0.6], [cx + w * 0.4, 380], [cx + w * 0.55, 440]], "#ffd85a", 0);
  }
};
/** heart (256 x 256) */
const heart = (p: Pen) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); pts.push([128 + x * 6.5, 120 - y * 6.5]); }
  p.poly(pts, "#e2455a", 10);
  p.ell(92, 92, 18, 12, "#ff9aa6", 0, 0, 360, -30);
};
/** thought bubble (900 x 640): a cloud with the domes and minarets of Constantinople over the sea, and trailing dots */
const bubble = (p: Pen) => {
  const lobes: [number, number, number][] = [[300, 260, 150], [470, 210, 160], [630, 260, 150], [700, 380, 120], [540, 430, 150], [360, 420, 140], [220, 360, 110]];
  for (const [x, y, r] of lobes) p.ell(x, y, r, r * 0.85, null, 14);
  for (const [x, y, r] of lobes) p.ell(x, y, r, r * 0.85, "#fbf8f2", 0);
  const clip: P2[] = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; clip.push([460 + 250 * Math.cos(a), 330 + 175 * Math.sin(a)]); }
  p.clip(clip, () => {
    const g = p.g, sky = g.createLinearGradient(0, 150, 0, 500); sky.addColorStop(0, "#ffd9a0"); sky.addColorStop(1, "#ffb98a");
    g.fillStyle = sky; g.fillRect(200, 140, 520, 380);
    g.fillStyle = "#4f86c6"; g.fillRect(200, 430, 520, 100);
    const sil = "#7a5a8a";
    // minarets
    for (const [x, h] of [[300, 210], [380, 250], [560, 250], [640, 210]] as const) { p.poly([[x - 9, 432], [x - 9, 432 - h], [x, 432 - h - 40], [x + 9, 432 - h], [x + 9, 432]], sil, 5); p.poly([[x - 15, 432 - h * 0.7], [x + 15, 432 - h * 0.7], [x + 15, 432 - h * 0.7 + 10], [x - 15, 432 - h * 0.7 + 10]], sil, 4); }
    // the great dome on its drum, side half-domes, small domes
    p.poly([[400, 432], [400, 330], [520, 330], [520, 432]], sil, 5);
    p.ell(460, 330, 74, 70, sil, 6, 180, 360);
    p.stroke([[460, 260], [460, 236]], 6, sil);
    for (const x of [372, 548]) { p.poly([[x - 40, 432], [x - 40, 380], [x + 40, 380], [x + 40, 432]], sil, 5); p.ell(x, 380, 40, 36, sil, 5, 180, 360); }
    for (const x of [250, 680]) { p.poly([[x - 50, 432], [x - 50, 400], [x + 50, 400], [x + 50, 432]], "#8a6a98", 4); p.ell(x, 400, 28, 24, "#8a6a98", 4, 180, 360); }
    g.fillStyle = "rgba(255,240,200,0.6)"; for (let i = 0; i < 6; i++) g.fillRect(260 + i * 80, 452 + (i % 2) * 14, 40, 4);
  });
  for (const [x, y, r] of [[160, 520, 34], [100, 580, 22], [60, 620, 14]]) p.ell(x, y, r, r * 0.85, "#fbf8f2", 8);
};
/** light beam through the cell window (256 x 512), soft */
const beam = (p: Pen) => {
  const g = p.g, gr = g.createLinearGradient(180, 0, 60, 512);
  gr.addColorStop(0, "rgba(255,246,214,0.42)"); gr.addColorStop(1, "rgba(255,246,214,0.0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(150, 0); g.lineTo(240, 0); g.lineTo(140, 512); g.lineTo(10, 512); g.closePath(); g.fill();
};

// ---------------- effect staging helpers ----------------
/** cannon smoke from a muzzle at time t after a shot fired at t0: a quick burst that grows, drifts and fades */
export const gunSmoke = (out: Stage, t: number, t0: number, m: V3, dir: [number, number], seed: number, size = 1) => {
  const u = t - t0;
  if (u < 0) return;
  if (u < 5 / FPS) { const k = q(u / (5 / FPS), 30); out.fx.push({ key: `flash${k}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, k, "#ffd36b", 12, 50, 240), x: m[0] + dir[0] * 0.6, y: m[1], z: m[2] + dir[1] * 0.6, w: 2.2 * size, h: 2.2 * size }); }
  for (let j = 0; j < 3; j++) {
    const v = u - j * 0.08;
    if (v < 0 || v > 7) continue;
    const g = 1 - Math.exp(-v * 2.2), k = q(Math.min(1, v / 1.2), 12), s = (1.4 + 2.8 * g + 0.15 * v) * size * (1 - j * 0.15);
    const fade = v > 4 ? Math.max(0, 1 - (v - 4) / 3) : 1;
    if (fade <= 0.05) continue;
    out.fx.push({ key: `smoke${seed + j}|${k}`, cw: 512, ch: 512, draw: (p) => smokeCloud(p, seed + j, k), x: m[0] + dir[0] * (0.8 + 2.4 * g + j * 0.7) + 0.25 * v, y: m[1] + 0.3 * g + 0.12 * v + j * 0.3,
      z: m[2] + dir[1] * (0.8 + 2.4 * g + j * 0.7), w: s * fade ** 0.3, h: s * fade ** 0.3, soft: false });
  }
};
const hazeAt = (out: Stage, x: number, y: number, z: number, s: number, seed: number) =>
  out.fx.push({ key: `haze${seed % 4}`, cw: 512, ch: 512, draw: (p) => haze(p, seed % 4), x, y, z, w: s, h: s * 0.7, soft: true });
const flameAt = (out: Stage, t: number, x: number, y: number, z: number, s = 0.12, i = 0) => {
  const k = q(((t * 2.3 + hh(i)) % 1), 8);
  out.fx.push({ key: `flame${k}`, cw: 128, ch: 256, draw: (p) => flame(p, k), x, y: y + s, z, w: s, h: 2 * s });
};
/** where the shared cast and the Lodi bridge put people: deck / ramps / ground */
const bridgeY = (z: number) => (Math.abs(z) <= BR_HALF ? DECK : Math.max(0, DECK * (1 - (Math.abs(z) - BR_HALF) / 6)));

// ---------------- the shots ----------------
type Ctx = { cam: CamInfo; out: Stage; t: number; f: number };
const blinkFree = (_: Ctx) => 0;
void blinkFree;
const ramp = (t: number, t0: number, dur = 0.33) => q(smooth((t - t0) / dur), 12);
const after = (t: number, b: number) => t >= b;

const shot1 = ({ cam, out, t }: Ctx) => {
  const angry = after(t, BEAT.turned);
  put(cam, out, t, deputy(0), -1.3, 0, 5.5, { fo: { expr: angry ? "stern" : "neutral", facing: 1, wave: angry ? q(Math.sin(t * 7), 4) : undefined } });
  put(cam, out, t, deputy(2), -2.45, 0, 6.3, { fo: { expr: angry ? "shock" : "neutral", facing: 1 } });
  put(cam, out, t, deputy(1), 1.3, 0, 5.5, { fo: { expr: angry ? "stern" : "smile_closed", facing: -1, wave: angry ? q(Math.sin(t * 6 + 2), 4) : undefined } });
  put(cam, out, t, deputy(3), 2.5, 0, 6.2, { fo: { expr: angry ? "shock" : "neutral", facing: -1 } });
  // a few Parisians crossing the square (the wide)
  for (let i = 0; i < 5; i++) { const x = -14 + i * 6 + 0.8 * t * (i % 2 ? 1 : -1), z = 14 + 6 * hh(i, 3); put(cam, out, t, parisian(i), x, 0, z, { walk: { dx: i % 2 ? 1 : -1, dz: 0, phase: (t * 0.5 + hh(i)) % 1 } }); }
};
const shot2 = ({ cam, out, t, f }: Ctx) => {
  const off = f >= 221, dx = off ? 0.9 * (t - 7.37) : 0, ph = (t * 0.56) % 1;
  if (!off) {
    put(cam, out, t, ROBESPIERRE, 0, 0, 4, { fo: { expr: after(t, BEAT.arrested) ? "shock" : "stern" } });
    put(cam, out, t, frenchSoldier(1), -0.95, 0, 4.25, { fo: { facing: 1, expr: "stern" } });
    put(cam, out, t, frenchSoldier(4), 0.95, 0, 4.25, { fo: { facing: -1, expr: "stern" } });
    put(cam, out, t, deputy(1), -2.3, 0, 2.6, { fo: { facing: 1, expr: "stern", wave: after(t, BEAT.arrested) ? 0.5 : undefined } });
  } else {
    put(cam, out, t, ROBESPIERRE, dx, 0, 4, { walk: { dx: 1, dz: 0, phase: ph }, so: { expr: "shock" } });
    put(cam, out, t, frenchSoldier(1), dx - 1.0, 0, 4.4, { walk: { dx: 1, dz: 0, phase: ph }, so: { expr: "stern" } });
    put(cam, out, t, frenchSoldier(4), dx + 1.0, 0, 3.6, { walk: { dx: 1, dz: 0, phase: ph }, so: { expr: "stern" } });
    put(cam, out, t, deputy(1), -1.8, 0, 2.2, { fo: { facing: 1, expr: "grin" } });
    put(cam, out, t, deputy(3), -3.0, 0, 3.0, { fo: { facing: 1, expr: "stern" } });
  }
};
const shot3 = ({ cam, out, t, f }: Ctx) => {
  const arrest = f >= 345;
  put(cam, out, t, AUGUSTIN, -0.75, 0, 48.5, { fo: { facing: arrest ? 1 : 1, expr: arrest ? "nervous" : t > 10.3 ? "laugh" : "smile" } });
  put(cam, out, t, NAP_GENERAL, 0.75, 0, 48.5, { fo: { facing: arrest ? 1 : -1, expr: arrest ? "shock" : t > 10.3 ? "grin" : "smile" } });
  if (arrest) {
    put(cam, out, t, frenchOfficer(1), 2.15, 0, 48.0, { fo: { facing: -1, expr: "stern", wave: 0.8 } });
    put(cam, out, t, frenchSoldier(0), 3.1, 0, 49.1, { fo: { facing: -1, expr: "stern" } });
  }
  for (let i = 0; i < 3; i++) put(cam, out, t, parisian(i + 1), -5.5 + i * 4.5, 0, 40 - i * 3, { fo: { expr: "neutral", facing: 0 } });
};
const shot4 = ({ cam, out, t }: Ctx) => {
  put(cam, out, t, NAP_GENERAL, -0.4, 0.06, -1.25, { fo: { mode: "sit", expr: after(t, BEAT.over) ? "pained" : "nervous", look: after(t, BEAT.over) ? 0 : 1 }, blob: false });
  out.fx.push({ key: "beam", cw: 256, ch: 512, draw: beam, x: 0.35, y: 1.5, z: -1.8, w: 1.6, h: 3.2, soft: true });
};
const shot5 = ({ cam, out, t }: Ctx) => {
  const z = walkZ(t);
  put(cam, out, t, NAP_GENERAL, 0.6, 0, z, { walk: { dx: 0, dz: -1, phase: (t * 0.8) % 1 }, so: { expr: t > 21.2 ? "nervous" : "stern" }, fo: { expr: "stern" } });
  for (let i = 0; i < 4; i++) put(cam, out, t, parisian(i + 2), -3.5 + (i % 2) * 1.2, 0, 70 + i * 6, { fo: { expr: i % 2 ? "grin" : "smile", facing: 1 } });
};
const shot6 = ({ cam, out, t }: Ctx) => {
  const dream = after(t, BEAT.sultan);
  put(cam, out, t, NAP_GENERAL, 0.35, 0, -0.05, { fo: { expr: dream ? "smile_closed" : "neutral", look: 1, facing: 1 } });
  flameAt(out, t, 0.2, 1.0, -0.55, 0.07, 1);
  const k = clamp01((t - BEAT.thought) / 0.45);
  if (k > 0) {
    const s = q(0.25 + 0.75 * smooth(k), 30);
    out.fx.push({ key: "bubble", cw: 900, ch: 640, draw: bubble, x: 1.05, y: 2.1 + 0.15 * s, z: -0.45, w: 1.5 * s, h: 1.07 * s });
  }
};
const shot7 = ({ cam, out, t }: Ctx) => {
  for (let i = 0; i < 8; i++) { const x = -18 + i * 5 + 0.9 * (t - 27) * (i % 2 ? 1 : -1), z = -6 + 9 * hh(i, 5); put(cam, out, t, parisian(i), x, 0, z, { walk: { dx: i % 2 ? 1 : -1, dz: 0, phase: (t * 0.56 + hh(i)) % 1 } }); }
};
/** the royalist column (shot 8): 7 rows x 4 files marching on the government */
const royalCol = ({ cam, out, t }: Ctx) => {
  const F = royalFront(t), ph = (t * 0.94) % 1;
  for (let i = 0; i < 28; i++) {
    const row = i >> 2, x = [-1.9, -0.65, 0.65, 1.9][i & 3] + (hh(i) - 0.5) * 0.2, z = F + row * 1.4 + (hh(i, 2) - 0.5) * 0.3;
    put(cam, out, t, royalist(i % 4), x, 0, z, { walk: { dx: 0, dz: -1, phase: (ph + (row % 2) * 0.5) % 1 }, fo: { expr: (["stern", "grin", "stern", "nervous"] as Expr[])[(i * 3) % 4] } });
  }
};
const shot9 = ({ cam, out, t, f }: Ctx) => {
  const two = f >= 1147;
  put(cam, out, t, BARRAS, two ? -0.8 : 0, 0, -17.5, { fo: { expr: two ? "grin" : "nervous", facing: two ? 1 : 0, wave: two ? q(0.5 + 0.5 * Math.sin(t * 3), 6) : undefined } });
  if (two) put(cam, out, t, NAP_GENERAL, 0.9, 0, -17.5, { fo: { expr: "stern", facing: -1 } });
  put(cam, out, t, deputy(0), -1.9, 0, -20, { fo: { expr: "nervous", facing: 1 } });
  put(cam, out, t, deputy(3), 2.4, 0, -20.4, { fo: { expr: "nervous", facing: -1 } });
};
const shot10 = ({ cam, out, t, f }: Ctx) => {
  if (f < 1287) {
    const k = ramp(t, BEAT.exactly, 0.4);
    put(cam, out, t, NAP_GENERAL, 1.0, 0, -17.5, { fo: { expr: "stern", prop: ["sword", k], facing: 0 } });
    put(cam, out, t, BARRAS, -0.8, 0, -17.5, { fo: { expr: "smile", facing: 1 } });
  } else {
    put(cam, out, t, frenchSoldier(2), 4.1, 0, -5.2, { fo: { expr: "grin", facing: 1 } });
    put(cam, out, t, frenchSoldier(3), 8.1, 0, -7.4, { fo: { expr: "stern", facing: -1 } });
  }
};
const shot11 = ({ cam, out, t, f }: Ctx) => {
  if (f < 1427) {
    const x = muratX(t);
    horseCard(cam, out, t, x, 0, 0, { coat: HORSE_COATS.grey, pose: "gallop", phase: (t * 2.3) % 1, rider: MURAT, riderOpts: { prop: ["sword", 1], expr: "grin" }, cloth: "#3d6fb0", clothTrim: GOLD });
    for (let j = 0; j < 4; j++) { const u = ((t * 2 + j / 4) % 1); const k = q(u, 20); out.fx.push({ key: `puff${k}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, k), x: x - 1.6 - j * 0.9 - u * 0.6, y: 0.35 + u * 0.4, z: 0.2, w: 1.4 + u, h: 1.4 + u }); }
  } else {
    horseCard(cam, out, t, PARK[0] + 3.2, 0, PARK[2] + 3.0, { coat: HORSE_COATS.grey, pose: t > 48.1 ? "rear" : "stand", rider: MURAT, riderOpts: { prop: ["sword", 1], expr: "grin" }, cloth: "#3d6fb0", clothTrim: GOLD }, true);
    for (let i = 0; i < 4; i++) put(cam, out, t, frenchSoldier(i), PARK[0] - 5.5 + i * 3.1, 0, PARK[2] + 0.6, { fo: { expr: t > 48.4 ? "laugh" : "grin", wave: t > 48.4 && i % 2 ? q(Math.sin(t * 8 + i), 4) : undefined } });
    for (let i = 0; i < 3; i++) put(cam, out, t, royalist(i), PARK[0] - 6 + i * 2.2, 0, PARK[2] - 22 - i, { fo: { expr: "shock" } });
  }
};
/** royalists before Saint-Roch: on the steps and in the street; spot i */
const ROY: [number, number][] = Array.from({ length: 22 }, (_, i) => [(-8 + (i % 8) * 2.3 + (hh(i, 4) - 0.5) * 0.8), STEPS_Z - 4.6 + Math.floor(i / 8) * 3.2 + hh(i, 5) * 1.2]);
const shot12 = ({ cam, out, t, f }: Ctx) => {
  if (f < 1642) {
    const adv = Math.max(0, t - 50.6) * 0.45;
    ROY.forEach(([x, z0], i) => { const z = z0 + adv, y = stepY(z); put(cam, out, t, royalist(i % 4), x, y, z, { fo: { expr: f >= 1610 ? "shock" : (["stern", "grin", "stern", "nervous"] as Expr[])[i % 4], wave: i % 5 === 1 && f < 1610 ? q(Math.sin(t * 5 + i), 4) : undefined } }); });
    // gunners at the two guns, then they duck as the guns fire
    STREET_GUNS.forEach(([gx, , gz], j) => {
      const fired = f >= 1610 + 17 * j - 2;
      put(cam, out, t, frenchSoldier(j * 3 + 1), gx + 1.3, 0, gz + 0.6, { fo: { expr: fired ? "shock" : "stern", facing: j ? -1 : 1, tilt: fired ? 6 * (j ? 1 : -1) : 0 } });
    });
    put(cam, out, t, NAP_GENERAL, 0.4, 0, 6.6, { fo: { expr: "stern", prop: ["sword", f >= 1600 ? 1 : 0.4], facing: -1 } });
  } else {
    // they scatter left and right
    ROY.forEach(([x, z0], i) => {
      const s = x < 0 ? -1 : 1, run = 3.0 * (t - 54.75) * (0.8 + 0.4 * hh(i, 7)), z = z0 + 0.45 * (54.75 - 50.6);
      put(cam, out, t, royalist(i % 4), x + s * run, stepY(z), z, { walk: { dx: s, dz: 0, phase: (t * 2.2 + hh(i)) % 1 }, so: { expr: i % 3 ? "shock" : "nervous" } });
    });
  }
  // smoke from the guns (fired at 1610 and 1627)
  STREET_GUNS.forEach(([gx, , gz], j) => gunSmoke(out, t, (1610 + 17 * j) / FPS, [gx, 1.35, gz - 1.4], [0, -1], 11 + j * 5, 1.2));
  if (f >= 1642) for (let i = 0; i < 5; i++) hazeAt(out, -6 + i * 3 + 0.6 * (t - 54.7), 1.6 + (i % 2) * 0.8, -20 + i * 1.5, 7, i);
};
const shot13 = ({ cam, out, t }: Ctx) => {
  const fan = q(Math.sin(t * 9), 4);
  put(cam, out, t, frenchSoldier(1), -2.0, 0, 5.6, { fo: { expr: t > BEAT.whiff ? "grin" : "nervous", wave: fan, facing: -1 } });
  put(cam, out, t, frenchSoldier(5), -4.3, 0, 5.0, { fo: { expr: t > BEAT.whiff ? "laugh" : "smile_closed", facing: 1 } });
  for (let i = 0; i < 7; i++) { const u = ((t - 56.4) * 0.35 + i * 0.37) % 3; hazeAt(out, -6 + i * 1.6 + u, 1.0 + (i % 3) * 0.6, 3.0 - i * 2.8, 4 + i * 0.6, i + 3); }
};
const shot14 = ({ cam, out, t }: Ctx) => {
  const cheer = after(t, BEAT.command);
  for (let row = 0; row < 3; row++) for (let c = 0; c < 7; c++) {
    const i = row * 7 + c, x = -4.5 + c * 1.5 + (row % 2) * 0.75;
    put(cam, out, t, frenchSoldier(i), x, 0, -9.5 - row * 1.4, { fo: { expr: cheer ? (i % 3 ? "grin" : "laugh") : "stern", wave: cheer && i % 2 ? q(Math.sin(t * 7 + i), 4) : undefined } });
  }
  put(cam, out, t, BARRAS, -1.7, 0, -5.4, { fo: { expr: "smile", facing: 1, wave: after(t, BEAT.changed) && !cheer ? 0.6 : undefined } });
  put(cam, out, t, NAP_GENERAL, 0.2, 0, -6, { fo: { expr: cheer ? "grin" : "stern", prop: ["sword", cheer ? ramp(t, BEAT.command, 0.4) : 0] } });
};
const salonGuests = ({ cam, out, t }: Ctx) => {
  put(cam, out, t, guest(0), -3.0, 0, -3.3, { fo: { facing: 1, expr: "smile" } });
  put(cam, out, t, guest(1), -2.1, 0, -3.7, { fo: { facing: -1, expr: "grin" } });
  put(cam, out, t, guest(2), 3.0, 0, -3.6, { fo: { facing: 1, expr: "laugh" } });
  put(cam, out, t, guest(3), 3.9, 0, -3.0, { fo: { facing: -1, expr: "smile" } });
};
const candles = (out: Stage, t: number) => {
  [-3.75, -2.85].forEach((x, i) => flameAt(out, t, x, 1.14, -3.5, 0.06, 10 + i));
  [[-5.0, -4.4], [-1.6, -4.4]].forEach(([x, z], j) => [-0.18, 0, 0.18].forEach((dx, i) => flameAt(out, t, x + dx, 1.88 + (i === 1 ? 0.12 : 0), z, 0.07, 20 + j * 3 + i)));
};
const shot15 = (c: Ctx) => {
  const { cam, out, t } = c;
  salonGuests(c);
  put(cam, out, t, JOSEPHINE, -0.45, 0, -1.8, { fo: { facing: 1, expr: t > BEAT.widow ? "smile_closed" : "smile" } });
  put(cam, out, t, NAP_GENERAL, 1.35, 0, -1.4, { fo: { facing: -1, expr: t > 64.4 ? "smile" : "neutral" } });
  candles(out, t);
};
const shot16 = (c: Ctx) => {
  const { cam, out, t } = c;
  put(cam, out, t, NAP_GENERAL, 1.35, 0, -1.4, { fo: { facing: -1, expr: t > BEAT.hard ? "grin" : "smile", look: -1 } });
  for (let i = 0; i < 4; i++) {
    const u = ((t - 68.6) * 0.8 + i * 0.27) % 1.1;
    if (u < 0 || u > 1) continue;
    const s = 0.16 * Math.min(1, u * 6) * (u > 0.8 ? (1 - u) / 0.2 : 1);
    if (s < 0.01) continue;
    out.fx.push({ key: "heart", cw: 256, ch: 256, draw: heart, x: 1.0 + 0.6 * hh(i) + 0.1 * Math.sin(u * 7 + i), y: 1.75 + 0.7 * u, z: -1.2, w: s, h: s, rot: 0.3 * Math.sin(u * 5 + i) });
  }
  candles(out, t);
};
const shot17 = (c: Ctx) => {
  const { cam, out, t } = c;
  put(cam, out, t, OFFICIAL, -3.3, 0, -4.6, { fo: { expr: "smile_closed" } });
  put(cam, out, t, JOSEPHINE, -4.35, 0, -2.6, { fo: { facing: 1, expr: "smile" } });
  put(cam, out, t, NAP_GENERAL, -2.25, 0, -2.6, { fo: { facing: -1, expr: "smile" } });
  put(cam, out, t, BARRAS, -0.85, 0, -3.0, { fo: { facing: -1, expr: "grin" } });
  put(cam, out, t, guest(2), -5.7, 0, -3.1, { fo: { facing: 1, expr: "smile_closed" } });
  candles(out, t);
};
const shot18 = ({ cam, out, t }: Ctx) => {
  put(cam, out, t, JOSEPHINE, 1.9, 0, 27.6, { fo: { expr: "smile", wave: q(Math.sin(t * 6), 6), facing: -1 } });
  const z = rideZ(t), moving = t > 73.45;
  horseCard(cam, out, t, -0.6, 0, z, { coat: HORSE_COATS.bay, pose: moving ? "gallop" : "stand", phase: (t * 2.1) % 1, rider: NAP_GENERAL, riderOpts: { expr: "grin" }, blaze: true }, true);
  for (let i = 0; i < 3; i++) put(cam, out, t, parisian(i + 3), 4.2 + i * 1.1, 0, 38 + i * 4, { fo: { expr: "smile", wave: i === 1 ? q(Math.sin(t * 7), 4) : undefined, facing: -1 } });
};
const shot19 = ({ cam, out, t, f }: Ctx) => {
  const [cx, , cz] = CAMP;
  // sitting round the dead fire
  [[-2.2, 0.6], [-1.2, -1.9], [1.4, -2.0], [2.3, 0.2], [0.2, 2.0], [-2.6, -0.9]].forEach(([dx, dz], i) =>
    put(cam, out, t, ragged(i), cx + dx, 0, cz + dz, { fo: { mode: "sit", expr: ragged(i).expr }, blob: false }));
  // standing (the boots close-up)
  put(cam, out, t, ragged(1), cx - 2.3, 0, cz + 4.4, { fo: { expr: "nervous", facing: 1 } });
  put(cam, out, t, ragged(3), cx - 1.1, 0, cz + 4.1, { fo: { expr: "pained", facing: -1 } });
  put(cam, out, t, ragged(5), cx - 0.2, 0, cz + 3.3, { fo: { expr: "stern" } });
  if (f >= 2445) put(cam, out, t, NAP_GENERAL, cx + 2.0, 0, cz + 8.4, { fo: { expr: "stern", facing: 0, look: 0 } });
  for (let i = 0; i < 3; i++) { const u = ((t * 0.3 + i / 3) % 1); hazeAt(out, cx + 0.2 * Math.sin(u * 5), 0.4 + 2.2 * u, cz, 0.8 + 1.5 * u, i); }
};
const shot20 = ({ cam, out, t }: Ctx) => {
  const X = marchX(t), ph = t % 1;
  for (let i = 0; i < 40; i++) {
    const row = i >> 2, x = X - row * 1.3 + (hh(i) - 0.5) * 0.1, z = [-1.65, -0.55, 0.55, 1.65][i & 3];
    put(cam, out, t, frenchSoldier(i), x, 0, z, { walk: { dx: 1, dz: 0, phase: ph }, so: { expr: i % 5 === 0 ? "grin" : "stern" } });
  }
  put(cam, out, t, frenchOfficer(2), X + 1.6, 0, 0, { walk: { dx: 1, dz: 0, phase: ph }, so: { expr: "stern", prop: ["sword", 1] } });
  // guns smoking on the far hills
  for (const [k, x0, t0] of [[0, 30, 83.5], [1, 60, 84.2], [2, 15, 84.9]] as const) gunSmoke(out, t, t0, [X + x0, 6 + 4 * k, -70 - 15 * k], [-1, 0], 40 + k * 3, 3);
};
const shot21 = ({ cam, out, t, f }: Ctx) => {
  if (f < 2667) {
    // massing at the near end; Napoleon by the guns
    for (let i = 0; i < 16; i++) put(cam, out, t, frenchSoldier(i), -2 + (i % 4) * 1.3, 0, -BR_HALF - 9 - (i >> 2) * 1.4, { fo: { expr: "stern" } });
    put(cam, out, t, NAP_GENERAL, -9.5, 0, -46.5, { fo: { expr: "stern", prop: ["sword", 1], facing: 1 } });
    for (const [j, x] of [[0, -12], [1, -6], [2, 8]] as const) gunSmoke(out, t, (2600 + 30 * j) / FPS, [x + 0.5, 1.35, -46 + 1.4], [0, 1], 60 + j * 4, 1.5);
    for (const [j, x] of [[0, -18], [1, 10], [2, 26]] as const) gunSmoke(out, t, (2590 + 25 * j) / FPS, [x, 1.6, RIVER + 8], [0, -1], 70 + j * 4, 2.2);
  } else if (f < 2755) {
    const Z = chargeZ(t), ph = (t * 2.6) % 1;
    for (let i = 0; i < 36; i++) {
      const row = i >> 2, z = Z - row * 1.25 + (hh(i, 2) - 0.5) * 0.3, x = [-1.8, -0.6, 0.6, 1.8][i & 3] + (hh(i) - 0.5) * 0.2;
      put(cam, out, t, frenchSoldier(i), x, bridgeY(z), z, { walk: { dx: 0, dz: 1, phase: (ph + hh(i, 3) * 0.2) % 1 }, so: { expr: i % 3 ? "stern" : "shock" } });
    }
    put(cam, out, t, frenchOfficer(2), 0.4, bridgeY(Z + 1.6), Z + 1.6, { walk: { dx: 0, dz: 1, phase: ph }, so: { expr: "stern", prop: ["sword", 1] } });
    // cannonballs splashing in the river beside the bridge; smoke rolling across
    for (const [k, t0, dz, x] of [[0, 89.2, 9, 8], [1, 89.9, 4, -9], [2, 90.6, 12, 7], [3, 91.2, 6, -8]] as const) {
      const u = (t - t0) / 1.1;
      if (u >= 0 && u < 1) { const kk = q(u, 30); out.fx.push({ key: `splash${kk}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, kk), x, y: WATER_Y + 2.6 * 0.8, z: chargeZ(t0) + dz, w: 5.6, h: 5.6 }); }
      void k;
    }
    for (let i = 0; i < 4; i++) hazeAt(out, 3 - i * 2.2, 2.2 + (i % 2), Z + 6 - i * 4 + 0.8 * (t - 89), 6, i + 6);
  } else {
    for (let i = 0; i < 14; i++) {
      const z = BR_HALF - 7 + (i >> 2) * 1.6 + hh(i, 2) * 0.5, x = [-1.9, -0.65, 0.65, 1.9][i & 3];
      put(cam, out, t, frenchSoldier(i + 2), x, bridgeY(z), z, { fo: { expr: i % 3 ? "laugh" : "grin", wave: i % 2 ? q(Math.sin(t * 8 + i), 4) : undefined } });
    }
    put(cam, out, t, frenchOfficer(2), 1.4, bridgeY(BR_HALF + 2.6), BR_HALF + 2.6, { fo: { expr: "grin", prop: ["sword", 1], facing: -1 } });
    for (let i = 0; i < 3; i++) hazeAt(out, -4 + i * 3, 2.5, BR_HALF - 12 - i * 3, 7, i + 2);
  }
};
const shot22 = ({ cam, out, t }: Ctx) => {
  const [cx, , cz] = CAMP, laugh = after(t, BEAT.corporal);
  out.fx.push({ key: `fire${q((t * 2.5) % 1, 10)}`, cw: 512, ch: 512, draw: (p) => fire(p, q((t * 2.5) % 1, 10)), x: cx, y: 0.55, z: cz, w: 1.3, h: 1.3 });
  put(cam, out, t, NAP_GENERAL, cx + 0.5, 0, cz - 1.5, { fo: { expr: laugh ? "laugh" : "smile", facing: 0 } });
  [[-2.0, 0.9], [-1.3, -1.6], [2.0, -0.9], [2.2, 1.1], [-0.6, 2.2], [0.9, 2.1]].forEach(([dx, dz], i) => {
    const sit = i >= 4;
    put(cam, out, t, frenchSoldier(i), cx + dx, 0, cz + dz, { fo: { mode: sit ? "sit" : "stand", expr: laugh ? (i % 2 ? "laugh" : "grin") : "smile", wave: laugh && !sit && i % 2 === 0 ? q(Math.sin(t * 8 + i), 4) : undefined, facing: dx < 0 ? 1 : -1 }, blob: !sit });
  });
};
/** the cheering crowd in the square around the hero (shot 23) */
const CROWD: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < 70 && out.length < 34; i++) {
    const a = hh(i, 1) * Math.PI * 2, d = 2.2 + 8 * hh(i, 2), x = 1.2 + Math.cos(a) * d, z = Math.sin(a) * d * 0.8 - 1;
    if (z > 1.6 && Math.abs(x - 3.5) < 4.5) continue; // the lane toward the camera
    if (z > 4.5) continue;
    out.push([x, z]);
  }
  return out;
})();
const shot23 = ({ cam, out, t, f }: Ctx) => {
  CROWD.forEach(([x, z], i) => {
    const c = i % 4 === 3 ? frenchSoldier(i) : parisian(i), hop = Math.max(0, Math.sin(t * 6 + i * 1.7)) * 0.08;
    put(cam, out, t, c, x, hop, z, { fo: { expr: (["grin", "laugh", "smile", "grin"] as Expr[])[i % 4], wave: i % 3 !== 1 ? q(Math.sin(t * 7 + i), 4) : undefined } });
  });
  put(cam, out, t, NAP_GENERAL, 1.2, 0, 0.4, { fo: { expr: "smile", prop: f < 2943 ? ["sword", 1] : null } });
  if (f >= 2943) {
    const sus = after(t, BEAT.wonder);
    put(cam, out, t, BARRAS, -2.75, 0, 10.4, { fo: { facing: 1, expr: sus ? "stern" : "nervous", look: 1 } });
    put(cam, out, t, deputy(0), -1.6, 0, 9.9, { fo: { facing: -1, expr: "nervous", look: -1 } });
    put(cam, out, t, deputy(3), -0.6, 0, 10.6, { fo: { facing: -1, expr: sus ? "stern" : "nervous", look: 1 } });
  }
};

const BY_ID: Record<number, (c: Ctx) => void> = {
  1: shot1, 2: shot2, 3: shot3, 4: shot4, 5: shot5, 6: shot6, 7: shot7, 8: royalCol, 9: shot9, 10: shot10, 11: shot11, 12: shot12, 13: shot13,
  14: shot14, 15: shot15, 16: shot16, 17: shot17, 18: shot18, 19: shot19, 20: shot20, 21: shot21, 22: shot22, 23: shot23,
};
/** everything with a face (and every effect card) in shot `id` at frame f */
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  setStageLight(cam, SHOTS[id - 1].light);
  BY_ID[id]({ cam, out, t: f / FPS, f });
  return out;
};

// ---------------- flags (3D cloth meshes posed by world.ts) ----------------
export type FlagPose = { kind: "fr" | "white"; x: number; y: number; z: number; h: number; w: number; pole: boolean };
/** the flags in shot id at time t: base of the pole (or the hoist top for fixed flags), pole height, flag width */
export const flagsAt = (id: number, f: number): FlagPose[] => {
  const t = f / FPS, set = SHOTS[id - 1].set, out: FlagPose[] = [];
  if (set === "palace") {
    out.push({ kind: "fr", x: -16, y: 0, z: -20, h: 10, w: 2.4, pole: false }, { kind: "fr", x: 16, y: 0, z: -20, h: 10, w: 2.4, pole: false }, { kind: "fr", x: 0, y: 33, z: -35, h: 4, w: 2.6, pole: false });
    if (id === 23) for (const [x, z] of [[-2.5, -3.5], [4.8, -2.8], [-0.8, -6.5], [6.5, -6]] as const) out.push({ kind: "fr", x, y: 0, z, h: 3.6, w: 1.3, pole: true });
  }
  if (id === 8) out.push({ kind: "white", x: 0.15, y: 0, z: royalFront(t) + 2.9, h: 3.3, w: 1.2, pole: true });
  if (id === 12 && f < 1642) out.push({ kind: "white", x: 0.6, y: stepY(STEPS_Z - 3.4), z: STEPS_Z - 3.4 + Math.max(0, t - 50.6) * 0.45, h: 3.4, w: 1.3, pole: true });
  if (id === 20) out.push({ kind: "fr", x: marchX(t) - 1.0, y: 0, z: 0.05, h: 3.4, w: 1.3, pole: true });
  if (id === 21 && f >= 2667 && f < 2755) out.push({ kind: "fr", x: -1.1, y: bridgeY(chargeZ(t) - 1.3), z: chargeZ(t) - 1.3, h: 3.3, w: 1.3, pole: true });
  if (id === 21 && f >= 2755) out.push({ kind: "fr", x: 2.2, y: bridgeY(BR_HALF + 1.2), z: BR_HALF + 1.2, h: 3.8, w: 1.5, pole: true });
  if (id === 14) for (const x of [-5.3, 5.3]) out.push({ kind: "fr", x, y: 0, z: -9.9, h: 3.6, w: 1.3, pole: true });
  return out;
};
/** guns that fire in shot id: [gun index in the world's list, fire times] */
export { CHURCH_Z };
