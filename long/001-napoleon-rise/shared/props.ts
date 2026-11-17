// The Rise of Napoleon: shared props. 3D (ink-outlined by the world ink pass, two-tone shaded, cast shadows):
//   cannon()      an 18th-century field gun on a wooden carriage with two spoked wheels
//   cannonballs() a small pyramid of shot
//   warship()     a three-masted ship of the line (hull with two rows of gun ports, square sails, ensign)
//   fleet()       warship clones in a loose line (geometry and materials shared)
//   flagTex()     French tricolour / British red ensign / Bourbon white flag textures
// 2D (a lit card like the characters):
//   horseCard()   a side-view cartoon horse (stand, walk, gallop cycle, rear), with or without a rider from cast.ts
// Every 3D builder returns a THREE.Group with its origin on the ground (ship: at the waterline), facing +x; place it
// with position / rotation.y / scale and add it to the world root.
import * as THREE from "three";
import { lam } from "../../../src/engine/build";
import { ctex } from "../../../src/engine/paint";
import { twoTone } from "../../../src/engine/shade";
import { Pen, INK, bodySide, RIDE_HIP, SideOpts, headBlob, mul } from "../../../src/engine/toon";
import { CamInfo, Stage, tier, seedOf, light2D, q, blob, lidAt } from "../../../src/engine/cards";
import { Char } from "./cast";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const tmp = new THREE.Vector3();

// ---------------- materials ----------------
const flat = (col: string, side: THREE.Side = THREE.FrontSide) => lam(`oj1_${col}_${side}`, () => ({ color: col, side }));
const metals = new Map<string, THREE.MeshPhongMaterial>();
const metal = (col: string, spec: string, shin: number) => {
  const k = col + spec + shin;
  let m = metals.get(k);
  if (!m) { m = twoTone(new THREE.MeshPhongMaterial({ color: col, specular: spec, shininess: shin }), 0.15); metals.set(k, m); }
  return m;
};
const iron = () => metal("#3d414c", "#8a8a8a", 50);
const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
/** a box of cross-section (h tall, d deep) running from a to b in the x-y plane at depth z */
const plank = (a: P2, b: P2, z: number, h: number, d: number, m: THREE.Material) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), x = mesh(new THREE.BoxGeometry(len, h, d), m);
  x.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z); x.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return x;
};
/** a round rod (radius r) between two points */
const rod = (a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material, r2 = r, seg = 8) => {
  const x = mesh(new THREE.CylinderGeometry(r2, r, a.distanceTo(b), seg), m);
  x.position.copy(a).add(b).multiplyScalar(0.5);
  x.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return x;
};

// ---------------- cannon ----------------
export type CannonOpts = {
  /** carriage + wheel paint (default French Gribeauval olive #7b8443; British guns: "#5d6670" grey-blue) */
  paint?: string;
  /** barrel metal colour (default bronze #b4823e; iron guns "#3d414c") */
  barrel?: string;
  /** barrel elevation in degrees (default 4; negative = depressed) */
  elev?: number;
};
/** 18th-century field gun (an 8-pounder on a Gribeauval carriage), real size: wheels 1.4 m, barrel 2.1 m, trail 2.6 m.
 *  Muzzle toward +x, axle along z, origin on the ground under the axle. The returned group's `userData.muzzle` is the
 *  muzzle point in group space (for smoke / flash cards; transform it with group.localToWorld). */
export const cannon = (o: CannonOpts = {}) => {
  const g = new THREE.Group(), wood = flat(o.paint ?? "#7b8443"), ir = iron(), bronze = metal(o.barrel ?? "#b4823e", "#ffe0a0", 40);
  const R = 0.7, wz = 0.74;
  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(0, R, s * wz);
    w.add(mesh(new THREE.TorusGeometry(R - 0.06, 0.06, 8, 32), wood), mesh(new THREE.TorusGeometry(R - 0.01, 0.028, 6, 32), ir));
    const hub = mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 14), wood); hub.rotation.x = Math.PI / 2; w.add(hub);
    for (let k = 0; k < 12; k++) {
      const pv = new THREE.Group(), sp = mesh(new THREE.BoxGeometry(0.05, R - 0.14, 0.045), wood);
      sp.position.y = (R - 0.14) / 2 + 0.08; pv.add(sp); pv.rotation.z = (k * Math.PI) / 6; w.add(pv);
    }
    g.add(w);
  }
  g.add(rod(new THREE.Vector3(0, R, -wz - 0.12), new THREE.Vector3(0, R, wz + 0.12), 0.055, ir));
  // carriage: two cheeks from the axle down to the trail end, transoms between them
  for (const s of [-1, 1]) g.add(plank([0.5, R + 0.24], [-2.3, 0.14], s * 0.19, 0.3, 0.09, wood));
  for (const [x, y] of [[0.2, R + 0.08], [-0.8, 0.55], [-1.9, 0.25]] as const) { const b = mesh(new THREE.BoxGeometry(0.14, 0.14, 0.4), wood); b.position.set(x, y, 0); g.add(b); }
  const shoe = mesh(new THREE.BoxGeometry(0.36, 0.1, 0.5), ir); shoe.position.set(-2.25, 0.06, 0); g.add(shoe);
  // barrel: lathe from the cascabel knob to the muzzle swell, with a dark bore; trunnions at the origin of `bar`
  const prof: [number, number][] = [[0, -0.86], [0.05, -0.86], [0.062, -0.8], [0.035, -0.75], [0.045, -0.71], [0.165, -0.69], [0.185, -0.62], [0.175, -0.52],
    [0.165, -0.08], [0.175, -0.06], [0.175, 0.02], [0.15, 0.06], [0.125, 1.08], [0.14, 1.12], [0.155, 1.2], [0.155, 1.26], [0.085, 1.27], [0.07, 1.25], [0.07, 1.0], [0, 1.0]];
  const lathe = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 20);
  lathe.rotateZ(-Math.PI / 2);
  const bar = new THREE.Group();
  bar.position.set(0.12, R + 0.36, 0); bar.rotation.z = rad(o.elev ?? 4);
  bar.add(mesh(lathe, bronze));
  const bore = mesh(new THREE.CircleGeometry(0.07, 14), flat("#151318")); bore.rotation.y = Math.PI / 2; bore.position.x = 1.0 + 0.001; bar.add(bore);
  bar.add(rod(new THREE.Vector3(0, 0, -0.3), new THREE.Vector3(0, 0, 0.3), 0.05, bronze));
  g.add(bar);
  bar.updateMatrix();
  g.userData.muzzle = new THREE.Vector3(1.27, 0, 0).applyMatrix4(bar.matrix);
  return g;
};

/** a pyramid of cannonballs (n = layers, 2-4), ball radius 0.1 m, origin on the ground at its centre */
export const cannonballs = (n = 3) => {
  const g = new THREE.Group(), geo = new THREE.SphereGeometry(0.1, 12, 8), m = iron();
  for (let l = 0; l < n; l++) {
    const k = n - l;
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const b = mesh(geo, m);
      b.position.set((i - (k - 1) / 2) * 0.2, 0.1 + l * 0.141, (j - (k - 1) / 2) * 0.2); g.add(b);
    }
  }
  return g;
};

// ---------------- flags ----------------
/** flag textures (512 x 320, hoist on the left): "fr" French tricolour, "uk" British red ensign (pre-1801 union), "white" Bourbon royal white */
export const flagTex = (kind: "fr" | "uk" | "white") => ctex(`ojflag_${kind}`, 512, 320, (g) => {
  if (kind === "fr") { ["#2f52b0", "#f5f2ea", "#d23a3f"].forEach((c, i) => { g.fillStyle = c; g.fillRect((i * 512) / 3, 0, 512 / 3 + 1, 320); }); }
  else if (kind === "white") { g.fillStyle = "#f5f2ea"; g.fillRect(0, 0, 512, 320); g.fillStyle = "#e8b53e"; for (const [x, y] of [[150, 110], [260, 200], [370, 110]]) { g.beginPath(); g.ellipse(x, y, 16, 26, 0, 0, Math.PI * 2); g.fill(); } }
  else {
    g.fillStyle = "#c8372f"; g.fillRect(0, 0, 512, 320);
    const W = 240, H = 160; g.fillStyle = "#1f3c78"; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    g.strokeStyle = "#f5f2ea"; g.lineWidth = 30; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, H); g.moveTo(W, 0); g.lineTo(0, H); g.stroke();
    g.fillStyle = "#f5f2ea"; g.fillRect(W / 2 - 26, 0, 52, H); g.fillRect(0, H / 2 - 26, W, 52);
    g.fillStyle = "#c8372f"; g.fillRect(W / 2 - 15, 0, 30, H); g.fillRect(0, H / 2 - 15, W, 30);
    g.restore();
  }
  g.strokeStyle = "rgba(20,15,25,0.9)"; g.lineWidth = 8; g.strokeRect(4, 4, 504, 312);
});
/** a flag card (unlit, double-sided) of width w, hoist at the local origin, flying toward +x */
const flagMesh = (kind: "fr" | "uk" | "white", w: number) => {
  const geo = new THREE.PlaneGeometry(w, w * 0.625, 8, 1); geo.translate(w / 2, 0, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) / w) * Math.PI * 1.6) * 0.06 * w * (pos.getX(i) / w));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: flagTex(kind), side: THREE.DoubleSide, color: 0xe8e8e8 }));
  return m;
};

// ---------------- warship ----------------
export type ShipOpts = {
  /** hull length in metres (default 40; a real 74-gun ship is ~55 m, cartoon ships read better a bit shorter) */
  length?: number;
  /** stern ensign: "fr" (default), "uk", "white" or null */
  flag?: "fr" | "uk" | "white" | null;
  /** "set" (default): bellied square sails; "furled": rolled on the yards (at anchor, Aboukir Bay) */
  sails?: "set" | "furled";
  /** hull colours: main (dark) and the gun-deck bands (ochre by default) */
  hull?: string; band?: string;
  /** yards braced round from square, degrees (default 30, so the sails show in side views as well as bow / stern views) */
  brace?: number;
};
const hullTex = (L: number, Hv: number, hull: string, band: string) => ctex(`ojhull_${L}_${hull}_${band}`, 2048, 512, (g) => {
  const px = 2048 / L, py = (512 / Hv) * (L / 40); // px per metre along / per "40 m ship" metre down
  g.fillStyle = hull; g.fillRect(0, 0, 2048, 512);
  const strip = (y0: number, y1: number, c: string) => { g.fillStyle = c; g.fillRect(0, y0 * py, 2048, (y1 - y0) * py); };
  strip(0.3, 1.35, band); strip(1.75, 2.85, band);
  for (const [y0, y1] of [[0.45, 1.15], [1.95, 2.65]]) for (let x = 0.12 * L; x < 0.88 * L; x += 2.3 * (L / 40)) {
    const w = 0.68 * px * (L / 40);
    g.fillStyle = "#b8322e"; g.fillRect(x * px - 6, (y0 - 0.32) * py, w + 12, 0.18 * py);           // open port lid
    g.fillStyle = "#17141a"; g.fillRect(x * px, y0 * py, w, (y1 - y0) * py);                       // the port
    g.fillStyle = "#3d414c"; g.fillRect(x * px + 0.26 * w, (y0 + 0.24) * py, 0.48 * w, 0.22 * py); // gun muzzle
  }
  g.strokeStyle = "rgba(15,10,20,0.55)"; g.lineWidth = 3;
  for (const y of [0.3, 1.35, 1.75, 2.85]) { g.beginPath(); g.moveTo(0, y * py); g.lineTo(2048, y * py); g.stroke(); }
});
const sailTex = () => ctex("ojsail", 256, 256, (g) => {
  g.fillStyle = "#f1e8d2"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(150,130,100,0.45)"; g.lineWidth = 2;
  for (let x = 16; x < 256; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.strokeStyle = "rgba(120,100,80,0.6)"; g.lineWidth = 3; for (const y of [40, 70]) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  g.strokeStyle = "rgba(60,45,40,0.9)"; g.lineWidth = 10; g.strokeRect(0, 0, 256, 256);
});
const sternTex = (band: string, hull: string) => ctex(`ojstern_${band}_${hull}`, 256, 256, (g) => {
  g.fillStyle = band; g.fillRect(0, 0, 256, 256);
  g.fillStyle = hull; g.fillRect(0, 0, 256, 20); g.fillRect(0, 110, 256, 16); g.fillRect(0, 200, 256, 56);
  g.fillStyle = "#2a3550";
  for (const y of [40, 135]) for (let x = 30; x < 230; x += 40) g.fillRect(x, y, 24, 46);
  g.strokeStyle = "#7a5a2a"; g.lineWidth = 4; for (const y of [40, 135]) for (let x = 30; x < 230; x += 40) g.strokeRect(x, y, 24, 46);
});

/** a three-masted ship of the line. Bow toward +x, origin at the waterline amidships (sink it a little in your water
 *  plane); length L (default 40 m), beam 0.27 L, mainmast 0.85 L above the deck. Set / furled square sails, two rows of
 *  gun ports with red lids, a stern ensign. Cheap enough to clone for a fleet (see fleet()). */
export const warship = (o: ShipOpts = {}) => {
  const L = o.length ?? 40, B = 0.27 * L, draft = 0.08 * L, hull = o.hull ?? "#25222a", band = o.band ?? "#c9a24a";
  const top = (t: number) => 0.125 * L + 0.04 * L * (1 - smooth01(t / 0.28)) + 0.03 * L * smooth01((t - 0.78) / 0.22);
  // stem raked forward and a slight stern overhang, more at the top (s = 0) than at the keel (s = 1)
  const xAt = (t: number, s: number) => -L / 2 + t * L + 0.07 * L * (1 - s) ** 1.5 * smooth01((t - 0.72) / 0.28) - 0.025 * L * (1 - s) * smooth01((0.12 - t) / 0.12);
  const half = (t: number) => (t < 0.55 ? 0.8 + 0.2 * Math.sin((t / 0.55) * Math.PI / 2) : Math.cos(((t - 0.55) / 0.45) * Math.PI / 2) ** 0.75) * (B / 2);
  const Hv = 0.2 * L + draft, NS = 40, NP = 10;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const width = (s: number, sw: number) => (s < sw ? 0.88 + 0.12 * Math.sin((s / sw) * Math.PI / 2) : 0.22 + 0.78 * Math.cos(((s - sw) / (1 - sw)) * Math.PI / 2) ** 0.7);
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, tp = top(t), sw = tp / (tp + draft);
      for (let j = 0; j <= NP; j++) {
        const s = j / NP, y = tp - s * (tp + draft);
        pos.push(xAt(t, s), y, side * half(t) * width(s, sw)); uv.push(t, 1 - (tp - y) / Hv);
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NP; j++) {
      const a = base + i * (NP + 1) + j, b = a + NP + 1;
      if (side > 0) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const hg = new THREE.BufferGeometry();
  hg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); hg.setIndex(idx);
  hg.computeVertexNormals();
  const g = new THREE.Group();
  g.add(mesh(hg, lam(`ojhullm_${L}_${hull}_${band}`, () => ({ map: hullTex(L, Hv, hull, band), side: THREE.DoubleSide }))));
  // stern transom (a fan over the first section) and the deck
  const sp: number[] = [], suv: number[] = [], sidx: number[] = [], tp0 = top(0);
  for (let j = 0; j <= NP; j++) for (const side of [1, -1]) {
    const s = j / NP, y = tp0 - s * (tp0 + draft), z = side * half(0) * width(s, tp0 / (tp0 + draft));
    sp.push(xAt(0, s), y, z); suv.push(0.5 + z / B, 1 - (tp0 - y) / (tp0 + draft));
  }
  for (let j = 0; j < NP; j++) { const a = 2 * j; sidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute("uv", new THREE.Float32BufferAttribute(suv, 2)); sg.setIndex(sidx); sg.computeVertexNormals();
  g.add(mesh(sg, lam(`ojstern_${band}_${hull}`, () => ({ map: sternTex(band, hull), side: THREE.DoubleSide }))));
  const dp: number[] = [], didx: number[] = [];
  for (let i = 0; i <= NS; i++) { const t = i / NS, x = xAt(t, 0.25), y = top(t) - 0.04 * L, h = half(t) * 0.9; dp.push(x, y, h, x, y, -h); }
  for (let i = 0; i < NS; i++) { const a = 2 * i; didx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3)); dg.setIndex(didx); dg.computeVertexNormals();
  g.add(mesh(dg, flat("#a8845a", THREE.DoubleSide)));
  // masts, yards, sails, tops
  const wood = flat("#6b4a2e"), sailM = lam("ojsailm", () => ({ map: sailTex(), side: THREE.DoubleSide })), furl = flat("#e6dcc4");
  const masts: [number, number, number][] = [[0.24, 0.6, 0.72], [0.5, 0.85, 1], [0.74, 0.76, 0.9]]; // [t, height / L, yard factor]
  const tops: THREE.Vector3[] = [];
  for (const [t, hk, yk] of masts) {
    const x = -L / 2 + t * L, y0 = top(t) - 0.04 * L, H = hk * L;
    g.add(rod(new THREE.Vector3(x, y0, 0), new THREE.Vector3(x, y0 + H, 0), 0.012 * L, wood, 0.006 * L));
    tops.push(new THREE.Vector3(x, y0 + H, 0));
    const top1 = mesh(new THREE.BoxGeometry(0.07 * L, 0.012 * L, 0.09 * L), wood); top1.position.set(x, y0 + 0.42 * H, 0); g.add(top1);
    const yards = [[0.36, 0.5], [0.62, 0.38], [0.84, 0.26]].map(([hy, wy]) => [y0 + hy * H, wy * L * yk] as [number, number]);
    const rig = new THREE.Group(); rig.position.x = x; rig.rotation.y = rad(o.brace ?? 30); g.add(rig);
    yards.forEach(([yy, w], k) => {
      rig.add(rod(new THREE.Vector3(0.008 * L, yy, -w / 2), new THREE.Vector3(0.008 * L, yy, w / 2), 0.005 * L, wood));
      if (o.sails === "furled") { rig.add(rod(new THREE.Vector3(0.016 * L, yy - 0.01 * L, -w * 0.46), new THREE.Vector3(0.016 * L, yy - 0.01 * L, w * 0.46), 0.011 * L, furl)); return; }
      const below = k === 0 ? top(t) + 0.06 * L : yards[k - 1][0] + 0.01 * L, sh = yy - below, wb = k === 0 ? w * 0.98 : (yards[k - 1][1] + w) / 2 * 0.95;
      const geo = new THREE.PlaneGeometry(1, 1, 10, 6); const p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) + 0.5, v = p.getY(i) + 0.5, wz = w * 0.96 + (wb - w * 0.96) * (1 - v);
        p.setXYZ(i, 0.02 * L + 0.07 * sh * Math.sin(Math.PI * v) * (1 - (2 * u - 1) ** 2) + 0.03 * sh * (1 - v), below + v * sh, (u - 0.5) * wz);
      }
      geo.computeVertexNormals();
      rig.add(mesh(geo, sailM));
    });
  }
  // bowsprit, stays and a few shrouds
  const bowT = top(1), bow = new THREE.Vector3(xAt(1, 0) - 0.02 * L, bowT, 0), tip = bow.clone().add(new THREE.Vector3(Math.cos(rad(22)), Math.sin(rad(22)), 0).multiplyScalar(0.3 * L));
  g.add(rod(bow, tip, 0.008 * L, wood, 0.004 * L));
  const rope = flat("#2e2420"), rr = 0.0022 * L;
  g.add(rod(tops[2], tip, rr, rope), rod(tops[1], new THREE.Vector3(tops[2].x, top(0.74) + 0.1 * L, 0), rr, rope), rod(tops[0], new THREE.Vector3(tops[1].x, top(0.5) + 0.3 * L, 0), rr, rope));
  for (const [k, [t]] of masts.entries()) for (const s of [-1, 1]) for (const dx of [-0.03, 0, 0.03]) {
    const x = -L / 2 + t * L;
    g.add(rod(new THREE.Vector3(x, top(t) - 0.04 * L + 0.42 * masts[k][1] * L, 0), new THREE.Vector3(x + dx * L, top(t + dx), s * half(t + dx) * 0.9), rr, rope));
  }
  if (o.sails !== "furled") { // jib: a triangle from the bowsprit tip to the foremast
    const jg = new THREE.BufferGeometry(), f = tops[2];
    jg.setAttribute("position", new THREE.Float32BufferAttribute([tip.x, tip.y, 0, f.x + 0.02 * L, f.y - 0.12 * L, 0, bow.x - 0.02 * L, bow.y + 0.04 * L, 0], 3));
    jg.setAttribute("uv", new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0], 2)); jg.computeVertexNormals();
    g.add(mesh(jg, sailM));
  }
  if (o.flag !== null) {
    const fx = -L / 2 - 0.01 * L, fy = top(0) + 0.02 * L;
    g.add(rod(new THREE.Vector3(fx, top(0) - 0.01 * L, 0), new THREE.Vector3(fx - 0.02 * L, fy + 0.13 * L, 0), 0.003 * L, wood));
    const fl = flagMesh(o.flag ?? "fr", 0.17 * L); fl.position.set(fx - 0.02 * L, fy + 0.07 * L, 0); fl.rotation.y = Math.PI; g.add(fl);
    const pen = flagMesh(o.flag ?? "fr", 0.09 * L); pen.position.set(tops[1].x, tops[1].y + 0.01 * L, 0); pen.rotation.y = Math.PI; g.add(pen);
  }
  return g;
};
const smooth01 = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };

/** n clones of one warship in a loose staggered line along +x (spacing ~1.6 L), each yawed a little; seeded, so the
 *  same call gives the same fleet. The ships share geometry and materials. */
export const fleet = (n: number, o: ShipOpts = {}, seed = 1) => {
  const L = o.length ?? 40, proto = warship(o), g = new THREE.Group();
  let s = seed * 9301 + 49297;
  const r = () => { s = (s * 16807) % 2147483647; return (s % 10000) / 10000; };
  for (let i = 0; i < n; i++) {
    const c = proto.clone();
    c.position.set(i * 1.6 * L + (r() - 0.5) * 0.3 * L, 0, (i % 2) * 0.9 * L + (r() - 0.5) * 0.4 * L); c.rotation.y = (r() - 0.5) * 0.25;
    g.add(c);
  }
  return g;
};

// ---------------- the horse card ----------------
/** a horse card is drawn on the person card (600 x 1000 design units) at 1 / HORSE_SCALE, then placed HORSE_SCALE times
 *  larger: a 2.6 m card, hooves on the card's sole line. */
export const HORSE_SCALE = 2.0;
export const HORSE_COATS = { grey: "#e6e2da", bay: "#8a4f2c", chestnut: "#b0632e", black: "#332a2b", dun: "#c9a46a" } as const;
export type HorsePose = "stand" | "walk" | "gallop" | "rear";
export type HorseOpts = {
  /** coat colour (default bay); mane / tail colour (default dark, light on a grey) */
  coat?: string; mane?: string;
  /** stand (default), walk, gallop (a cycle: phase 0..1 per stride), rear (on the hind legs, forelegs tucked) */
  pose?: HorsePose; phase?: number;
  /** saddle cloth colour and its trim (null = bare back, no saddle); default French green with gold */
  cloth?: string | null; clothTrim?: string;
  /** a rider from cast.ts (drawn seated in profile, holding the reins) and its side-view options (expr, prop ["sword", k] ...) */
  rider?: Char | null; riderOpts?: SideOpts;
  /** white blaze down the face, white socks */
  blaze?: boolean; socks?: boolean;
};
const ellP = (cx: number, cy: number, rx: number, ry: number, rot = 0, n = 36): P2[] => {
  const c = Math.cos(rot), s = Math.sin(rot), out: P2[] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, x = rx * Math.cos(a), y = ry * Math.sin(a); out.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return out;
};
const rotP = (pts: P2[], a: number, c: P2): P2[] => pts.map(([x, y]) => [c[0] + (x - c[0]) * Math.cos(a) - (y - c[1]) * Math.sin(a), c[1] + (x - c[0]) * Math.sin(a) + (y - c[1]) * Math.cos(a)]);
const lumOf = (hex: string) => { const n = parseInt(hex.slice(1), 16); return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };
const HEAD_A: Record<string, number> = { adult: 118, stout: 118, kid: 112, teen: 115 };

/** the horse drawing (facing right) in person-card design units; light = canvas angle of the sun */
export const drawHorse = (p: Pen, o: HorseOpts, light: number, blink = 0) => {
  const g = p.g, coat = o.coat ?? HORSE_COATS.bay, mane = o.mane ?? (lumOf(coat) > 0.6 ? "#a59d93" : "#231a18");
  const far = mul(coat, [0.74, 0.74, 0.8]), hoof = "#2a2224", pose = o.pose ?? "stand", two = Math.PI * 2, ph = o.phase ?? 0;
  const k = 1 / HORSE_SCALE, ol = 10 * k, ol0 = p.ol; // ink width in these units (~ the characters' outline once scaled)
  p.ol = ol;
  // body frame: pitch about the hind hip + bob
  let pitch = 0, bob = 0, neck = 0;
  if (pose === "gallop") { pitch = rad(4 * Math.sin(two * ph)); bob = -16 * Math.abs(Math.sin(two * ph)); neck = rad(14 + 6 * Math.sin(two * ph)); }
  else if (pose === "walk") { bob = -3 * Math.abs(Math.sin(two * ph)); neck = rad(4 * Math.sin(two * ph)); }
  else if (pose === "rear") { pitch = rad(-34); neck = rad(-8); }
  const hip: P2 = [190, 735];
  const B = (pts: P2[]) => rotP(pts, pitch, hip).map(([x, y]) => [x, y + bob] as P2);
  // legs: [x of the top joint, phase offset, fore?, near?]; angles from the vertical, + = forward
  const legs: [number, number, boolean, boolean][] = [[372, 0.4, true, false], [176, 0.0, false, false], [400, 0.5, true, true], [196, 0.1, false, true]];
  const drawLeg = (x0: number, off: number, fore: boolean, near: boolean) => {
    let a1 = 0, bend = 0;
    const c = two * (ph + off);
    if (pose === "gallop") { a1 = 0.55 * Math.sin(c); bend = 1.3 * Math.max(0, Math.cos(c)) ** 1.4; }
    else if (pose === "walk") { a1 = 0.24 * Math.sin(c); bend = 0.8 * Math.max(0, Math.cos(c)) ** 2; }
    else if (pose === "rear") { if (fore) { a1 = near ? 0.7 : 0.45; bend = near ? 1.9 : 1.6; } else { a1 = near ? -0.45 : -0.36; bend = 0.12; } }
    else { a1 = fore ? 0.03 : -0.06; bend = fore ? 0 : -0.08; }
    const a2 = a1 - bend, l1 = 108, l2 = 104;
    const top: P2 = [x0, 742], knee: P2 = [top[0] + Math.sin(a1) * l1, top[1] + Math.cos(a1) * l1], ank: P2 = [knee[0] + Math.sin(a2) * l2, knee[1] + Math.cos(a2) * l2];
    const [T, K, A] = B([top, knee, ank]), col = near ? coat : far;
    g.lineCap = "round"; g.lineJoin = "round";
    p.stroke([T, K], 32 + 2 * ol); p.stroke([K, A], 21 + 2 * ol);
    p.stroke([T, K], 32, col); p.stroke([K, A], 21, col);
    if (o.socks) p.stroke([lerp(K, A, 0.55), A], 21, "#f4f1ea");
    const da = a2 + pitch, dx = Math.sin(da), dy = Math.cos(da), nx = dy, ny = -dx; // hoof: a trapezoid along the cannon bone
    const h0: P2 = [A[0] - dx * 2, A[1] - dy * 2], h1: P2 = [A[0] + dx * 22, A[1] + dy * 22];
    p.poly([[h0[0] - nx * 13, h0[1] - ny * 13], [h0[0] + nx * 13, h0[1] + ny * 13], [h1[0] + nx * 17 + dx * 2, h1[1] + ny * 17 + dy * 2], [h1[0] - nx * 15, h1[1] - ny * 15]], hoof, ol * 0.6);
  };
  for (const [x0, off, fore, near] of legs) if (!near) drawLeg(x0, off, fore, near);
  // tail
  const tailPts: P2[] = pose === "gallop" ? [[120, 700], [70, 708 + 10 * Math.sin(two * ph)], [26, 736 + 14 * Math.sin(two * ph)]]
    : pose === "rear" ? [[122, 716], [104, 800], [128, 900]] : pose === "walk" ? [[120, 702], [96, 760], [100 - 8 * Math.sin(two * ph), 852]] : [[120, 702], [98, 764], [104, 858]];
  p.line(B(tailPts), mane, 30);
  for (const [x0, off, fore, near] of legs) if (near) drawLeg(x0, off, fore, near);
  // body, neck and head: one silhouette (ink pass on every shape, then the fills, so no inner seams)
  const withers: P2 = [372, 690], N = (pts: P2[]) => B(rotP(pts, neck, withers));
  const shapes: P2[][] = [
    B(ellP(290, 734, 140, 54)), B(ellP(396, 718, 58, 60)), B(ellP(180, 714, 64, 60)),
    N([[340, 716], [398, 616], [452, 584], [486, 632], [462, 724]]),
    N(ellP(474, 612, 32, 30)), N([[458, 590], [488, 582], [548, 636], [552, 660], [530, 674], [474, 640]]), N(ellP(536, 656, 21, 18)),
  ];
  const ears: P2[][] = [N([[458, 596], [462, 546], [482, 590]]), N([[472, 592], [482, 544], [496, 590]])];
  p.poly(ears[0], far, ol);
  g.lineJoin = "round";
  for (const s of shapes) { p.path(s, true); g.strokeStyle = INK; g.lineWidth = 2 * ol; g.stroke(); }
  for (const s of shapes) { p.path(s, true); g.fillStyle = coat; g.fill(); }
  p.clip(shapes[0], () => p.ell(...B([[290, 812]])[0], 150, 44, mul(coat, [0.86, 0.86, 0.92]), 0));
  p.poly(ears[1], coat, ol);
  if (o.blaze) p.poly(N([[492, 600], [504, 598], [544, 646], [534, 652]]), "#f4f1ea", 0);
  // mane along the crest, forelock between the ears
  const crest = N([[470, 590], [446, 604], [420, 626], [398, 652], [378, 678], [360, 700]]);
  p.line(crest, mane, 20);
  p.poly(N([[478, 592], [500, 600], [490, 612]]), mane, ol * 0.6);
  // eye, nostril, mouth
  const [ex, ey] = N([[494, 610]])[0], [nx0, ny0] = N([[546, 650]])[0];
  if (blink >= 1) p.stroke([[ex - 9, ey], [ex + 9, ey]], 5); else { p.ell(ex, ey, 9, 10, "#ffffff", 3.2); p.dot(ex + 2.5, ey + 1, 5.2); }
  p.dot(nx0, ny0, 4.2);
  p.stroke(N([[528, 670], [548, 664]]), 3);
  // bridle
  const leather = "#3a2418";
  p.stroke(N([[480, 592], [482, 642], [530, 668]]), 5, leather);
  p.stroke(N([[516, 632], [522, 676]]), 5, leather);
  const bit = N([[530, 668]])[0];
  // saddle cloth + saddle
  if (o.cloth !== null) {
    const cloth = o.cloth ?? "#2f5a3a", tr = o.clothTrim ?? "#e8b53e", cp = B([[226, 676], [352, 680], [358, 764], [342, 776], [236, 772], [220, 760]]);
    p.poly(cp, cloth, ol * 0.8);
    p.clip(cp, () => p.stroke([...cp, cp[0]], 18, tr));
    p.poly(cp, null, ol * 0.8);
    p.poly(B([[244, 680], [260, 662], [318, 664], [336, 682]]), leather, ol * 0.6);
  }
  // rider: bodySide in "ride" mode, seated on the saddle, scaled 1 / HORSE_SCALE, pitched with the body
  let hand: P2 = B([[372, 660]])[0];
  if (o.rider) {
    const r = o.rider, seed = seedOf(r.i), HH = 2 * headBlob(seed, HEAD_A[r.o.build ?? "adult"]).b;
    const [sx, sy] = B([[288, 667]])[0];
    g.save(); g.translate(sx, sy); g.rotate(pitch); g.scale(k, k); g.translate(-300, -RIDE_HIP);
    bodySide(new Pen(g), r.o, { mode: "ride", expr: r.expr, light, seed, blink, ...o.riderOpts });
    g.restore();
    // the far hand on the reins (see bodySide "ride": S + (0.44 HH - 4u, 0.5 HH below the chin))
    const torso = r.o.build === "kid" ? 0.85 : r.o.build === "teen" ? 1.0 : r.o.build === "stout" ? 1.15 : 1.1, chin = RIDE_HIP + 0.12 * HH - torso * HH;
    const lx = 300 + 0.44 * HH - 0.04 * HH + 4, ly = chin + 0.5 * HH, c = Math.cos(pitch), s = Math.sin(pitch), dx = (lx - 300) * k, dy = (ly - RIDE_HIP) * k;
    hand = [sx + dx * c - dy * s, sy + dx * s + dy * c];
  }
  p.stroke([bit, [(bit[0] + hand[0]) / 2, Math.max(bit[1], hand[1]) + 14], hand], 4, leather);
  p.ol = ol0;
};

/** stage a horse (with an optional rider) at (x, y, z): a lit card like the characters, facing right on screen
 *  (mirror = facing left), with two contact blobs. scale 1 = a 1.6 m-at-the-withers horse. */
export const horseCard = (cam: CamInfo, out: Stage, t: number, x: number, y: number, z: number, o: HorseOpts = {}, mirror = false, scale = 1) => {
  const S = HORSE_SCALE * scale, d = cam.pos.distanceTo(tmp.set(x, y + 1.2 * scale, z)) / S;
  const [w, h, kk] = tier(d), light = light2D(cam, mirror), blink = o.rider ? lidAt(t, o.rider.i) : 0;
  const pose = o.pose ?? "stand", ph = pose === "gallop" || pose === "walk" ? q(o.phase ?? 0, 12) : 0, o2: HorseOpts = { ...o, phase: ph };
  const rk = o.rider ? `${o.rider.okey}|${JSON.stringify(o.riderOpts ?? {})}|${blink}` : "-";
  const key = `HORSE|${o.coat}|${o.mane}|${pose}|${ph}|${o.cloth}|${o.clothTrim}|${o.blaze}|${o.socks}|${rk}|${q(light, 8)}`;
  out.places.push({ key, x, y, z, scale: S, mirror, size: [w, h, kk], draw: (p) => drawHorse(p, o2, light, blink) });
  const rx = cam.right.x, rz = cam.right.z, off = 0.6 * scale;
  if (pose !== "gallop") { blob(out, x + rx * off, y, z + rz * off, 1.1 * scale); blob(out, x - rx * off, y, z - rz * off, 1.1 * scale); }
  else blob(out, x, y, z, 1.4 * scale, 0.6);
};
const lerp = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
