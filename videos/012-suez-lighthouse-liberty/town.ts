// The places of the Suez lighthouse what-if: the Port Said quay (stone paving, a jetty, palms, the mole at the canal
// mouth that carries either the plain lighthouse or the imagined giant), the cliff of Abu Simbel with four seated stone
// kings and the dark doorway between them, the studio / office (an open-topped room: plank floor, panelled walls, the
// desk, the easel) and New York Harbor far out to sea (the island, the star-shaped fort, the granite pedestal, the
// copper statue and a low skyline behind). The two statues and the lighthouse are their own groups (world.ts shows
// one or the other per shot); their torch flames are HDR emissives for the bloom.
import * as THREE from "three";
import { Batch, V, lam, prop, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, planks, beam, stone, ctex, cobble } from "../../src/engine/paint";
import { D0, SEA_Y, L, PED, TEMPLE, OFFICE, DESK, EASEL, NY, NYPED } from "./story";

/** the cliff's sandstone: horizontal strata of buff, ochre and pale rose */
const strata = (key: string, cols: string[]) => ctex(key, 256, 512, (g, r) => {
  let y = 0, i = 0;
  while (y < 512) { const h = 18 + r() * 46; g.fillStyle = cols[i++ % cols.length]; g.fillRect(0, y, 256, h + 1); y += h; }
  g.fillStyle = "rgba(90,50,30,0.16)";
  for (let k = 0; k < 40; k++) g.fillRect(r() * 256, r() * 512, 2 + r() * 3, 20 + r() * 60); // vertical cracks
});
/** the panelled wall of the room: dark green below a wainscot rail, warm cream above */
const panel = () => ctex("officePanel", 512, 512, (g) => {
  g.fillStyle = "#e8d9b8"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#3f5a46"; g.fillRect(0, 300, 512, 212);
  g.fillStyle = "#2c3f32"; for (let x = 0; x < 512; x += 128) g.fillRect(x, 300, 6, 212);
  g.fillStyle = "#6a4a30"; g.fillRect(0, 292, 512, 12);
});
/** a robe's cloth: vertical folds (darker grooves) on a base colour */
const folds = (key: string, base: string, groove: string) => ctex(key, 256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.fillStyle = groove; for (let x = 8; x < 256; x += 32) g.fillRect(x, 0, 7, 256);
});

export type Statue = { g: THREE.Group; flame: THREE.Mesh; glow: THREE.Mesh };
/** a colossal robed woman with a raised torch, feet at y = 0 (about 27 m to the torch top). liberty: the crown of
 *  rays and the tablet; otherwise the Egyptian head cloth. */
const statue = (liberty: boolean): Statue => {
  const g = new THREE.Group(), b = new Batch();
  const cloth = liberty ? lam("robeCu", () => ({ map: folds("robeCuT", "#b8794e", "#8f5638") })) : lam("robeEg", () => ({ map: folds("robeEgT", "#e3cfa2", "#c2a878") }));
  const skin = liberty ? lam("skinCu", () => ({ color: "#c2845a" })) : lam("skinEg", () => ({ color: "#c9946a" }));
  const trim = liberty ? lam("trimCu", () => ({ color: "#9a6040" })) : lam("trimEg", () => ({ color: "#2f6a8a" }));
  // the robe: a lathe from the hem to the neck
  const prof: [number, number][] = [[0.01, 0], [3.3, 0], [3.1, 2.5], [2.7, 7], [2.3, 11], [2.35, 14.2], [2.7, 16.2], [2.2, 17.0], [1.0, 17.6], [0.7, 18.2], [0.01, 18.3]];
  const robe = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 16);
  b.add(robe, cloth, new THREE.Matrix4().makeScale(1, 1, 0.82));
  // the sash across the chest
  b.add(new THREE.CylinderGeometry(2.42, 2.38, 0.9, 16, 1, true), trim, new THREE.Matrix4().compose(V(0, 13.6, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.22)), V(1, 1, 0.84)));
  // the head
  const head = new THREE.SphereGeometry(1.45, 16, 12); head.scale(0.92, 1.1, 0.95);
  b.add(head, skin, new THREE.Matrix4().makeTranslation(0, 19.7, 0.15));
  if (liberty) { // the crown: a band and seven rays
    b.add(new THREE.CylinderGeometry(1.45, 1.5, 0.55, 16), trim, new THREE.Matrix4().makeTranslation(0, 20.8, 0.1));
    for (let k = 0; k < 7; k++) {
      const a = -1.2 + (k * 2.4) / 6, ray = new THREE.ConeGeometry(0.22, 2.4, 6);
      ray.translate(0, 1.2, 0);
      b.add(ray, skin, new THREE.Matrix4().compose(V(Math.sin(a) * 1.3, 20.9, Math.cos(a) * 1.0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9)), V(1, 1, 1)));
    }
    // the tablet in the left arm
    b.add(boxGeo(V(-3.2, 11.2, -0.4), V(-2.3, 15.4, 1.2), 1), trim, new THREE.Matrix4().makeRotationZ(0.12));
    b.add(new THREE.CylinderGeometry(0.55, 0.6, 5.5, 10), cloth, new THREE.Matrix4().compose(V(-2.55, 13.6, 0.5), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0, -0.15)), V(1, 1, 1)));
  } else { // the Egyptian head cloth: a hood over the crown and two lappets to the shoulders, a blue band
    const hood = new THREE.SphereGeometry(1.62, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55); hood.scale(1, 1.15, 1);
    b.add(hood, cloth, new THREE.Matrix4().makeTranslation(0, 19.9, -0.05));
    b.add(new THREE.CylinderGeometry(1.6, 1.62, 0.4, 16, 1, true), trim, new THREE.Matrix4().makeTranslation(0, 20.4, 0));
    for (const s of [-1, 1]) b.add(boxGeo(V(s * 1.25 - 0.4, 17.4, -0.6), V(s * 1.25 + 0.4, 20.0, 0.6), 1), cloth);
    // the left arm down along the robe
    b.add(new THREE.CylinderGeometry(0.55, 0.6, 6.5, 10), cloth, new THREE.Matrix4().compose(V(-2.55, 13.4, 0.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.1)), V(1, 1, 1)));
  }
  // the raised right arm, the torch, its cup
  b.add(new THREE.CylinderGeometry(0.6, 0.72, 8.6, 10), cloth, new THREE.Matrix4().compose(V(2.6, 20.6, 0.1), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.16)), V(1, 1, 1)));
  b.add(new THREE.SphereGeometry(0.62, 10, 8), skin, new THREE.Matrix4().makeTranslation(3.28, 24.9, 0.1));
  b.add(new THREE.CylinderGeometry(0.42, 0.3, 1.8, 10), trim, new THREE.Matrix4().makeTranslation(3.3, 25.9, 0.1));
  b.add(new THREE.CylinderGeometry(1.0, 0.45, 0.8, 12), trim, new THREE.Matrix4().makeTranslation(3.3, 27.0, 0.1));
  b.build(g);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.2, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(5.5, 3.2, 1.2), fog: false }));
  flame.position.set(3.3, 28.4, 0.1);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.25, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.6, 0.7), transparent: true, opacity: 0.45, depthWrite: false, fog: false }));
  glow.position.set(3.3, 28.3, 0.1);
  g.add(flame, glow);
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh && o !== flame && o !== glow) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, flame, glow };
};

export type Town = { giant: Statue; liberty: Statue; lighthouse: THREE.Group; lamp: THREE.Mesh };

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []): Town => {
  const b = new Batch(), r = rng(91);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const wood = lam("deskWood", () => ({ map: planks() }));
  const post = lam("postWood", () => ({ map: beam() }));
  const quayStone = lam("quayStone", () => ({ map: stone("quayStone", ["#cdbf9f", "#c2b493", "#d6c9aa", "#b9ab8c"]) }));
  const sandstone = lam("abuStone", () => ({ map: strata("abuStrata", ["#d6b07c", "#cc9f6c", "#e0c094", "#c79566", "#dab88a"]) }));
  const dark = lam("doorDark", () => ({ color: "#3a2a26" }));

  // ---- Port Said: the quay wall, the paving, the jetty to the mole, the mole ----
  b.add(boxGeo(V(-150, SEA_Y - 2, -1.2), V(150, D0 + 0.06, 0), 2), quayStone);
  b.add(boxGeo(V(-150, D0 - 0.2, 0), V(150, D0 + 0.06, 14), 2), lam("quayPave", () => ({ map: cobble() })));
  b.add(boxGeo(V(L[0] + 6, SEA_Y - 2, L[2] + 6), V(L[0] + 9, D0 + 0.3, -1.2), 2), quayStone);
  const mole = new THREE.CylinderGeometry(8, 8.6, D0 + 1 - (SEA_Y - 2), 20);
  mole.translate(L[0], (D0 + 1 + SEA_Y - 2) / 2, L[2]);
  b.add(mole, quayStone);
  // the giant's pedestal on the mole (stays in the real shots too: the lighthouse stands on it)
  b.add(boxGeo(V(L[0] - 5, D0 + 1, L[2] - 5), V(L[0] + 5, D0 + 1 + 2.2, L[2] + 5), 2), quayStone);
  setSightLines(rays);
  // palms along the quay: a leaning trunk and a crown of drooping leaves
  const trunk = lam("palmTrunk", () => ({ color: "#8a6a48" })), leaf = lam("palmLeaf", () => ({ color: "#5f8f3e", side: THREE.DoubleSide }));
  for (const [px, pz, ph] of [[-30, 9, 9], [-21, 11, 10.5], [24, 10, 9.5], [33, 8, 8.5], [-46, 10, 10], [44, 11, 9], [-14, 34, 9], [20, 36, 10]] as const) {
    const lean = (px > 0 ? -1 : 1) * 0.08;
    b.add(new THREE.CylinderGeometry(0.22, 0.34, ph, 8), trunk, new THREE.Matrix4().compose(V(px - lean * ph / 2, D0 + ph / 2, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, lean)), V(1, 1, 1)));
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + r(), lf = new THREE.PlaneGeometry(3.4, 0.9);
      lf.translate(1.7, 0, 0);
      b.add(lf, leaf, new THREE.Matrix4().compose(V(px - lean * ph, D0 + ph, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 - 0.1, 0.45, a, "YZX")), V(1, 1, 1)));
    }
  }
  // low white houses with flat roofs behind the quay
  const wall = lam("eqWall", () => ({ map: stone("eqWall", ["#efe6d2", "#e8dcc4", "#f2ead8", "#e2d4ba"]) }));
  for (let k = 0; k < 9; k++) {
    const hx = -70 + k * 17 + r() * 4, hz = 24 + r() * 6, w = 8 + r() * 5, h = 5 + r() * 5;
    if (Math.abs(hx - OFFICE[0]) < 20) continue;
    b.add(boxGeo(V(hx - w / 2, D0, hz), V(hx + w / 2, D0 + h, hz + 7), 2), wall);
    for (let wdw = 0; wdw < 3; wdw++) b.add(boxGeo(V(hx - w / 2 + 1.2 + wdw * (w - 2.4) / 2 - 0.4, D0 + h - 2.6, hz - 0.05), V(hx - w / 2 + 1.2 + wdw * (w - 2.4) / 2 + 0.4, D0 + h - 1.2, hz), 1), dark);
  }

  // ---- Abu Simbel: the cliff, four seated kings, the doorway ----
  const [tx, , tz] = TEMPLE;
  b.add(boxGeo(V(tx - 30, D0 - 0.2, tz - 24), V(tx + 30, D0 + 30, tz - 4), 12), sandstone);
  b.add(boxGeo(V(tx - 2.2, D0, tz - 4.06), V(tx + 2.2, D0 + 8.5, tz - 3.98), 1), dark);
  for (const kx of [-19.5, -6.8, 6.8, 19.5]) {
    const x = tx + kx;
    b.add(boxGeo(V(x - 2.6, D0, tz + 0.4), V(x + 2.6, D0 + 7.2, tz + 2.6), 8), sandstone); // the shins
    b.add(boxGeo(V(x - 2.9, D0 - 0.1, tz + 2.6), V(x + 2.9, D0 + 0.9, tz + 3.8), 1), sandstone); // the feet
    b.add(boxGeo(V(x - 3.1, D0 + 7.2, tz - 4), V(x + 3.1, D0 + 9.2, tz + 2.6), 8), sandstone); // the lap
    b.add(boxGeo(V(x - 2.9, D0 + 9.2, tz - 4), V(x + 2.9, D0 + 16.2, tz - 1.4), 8), sandstone); // the chest
    for (const s of [-1, 1]) b.add(boxGeo(V(x + s * 3.0 - 0.8, D0 + 9.2, tz - 1.6), V(x + s * 3.0 + 0.8, D0 + 9.9, tz + 2.4), 1), sandstone); // forearms on the knees
    b.add(boxGeo(V(x - 2.7, D0 + 15.0, tz - 4), V(x + 2.7, D0 + 19.6, tz - 1.7), 8), sandstone); // the head cloth
    b.add(boxGeo(V(x - 1.6, D0 + 15.6, tz - 1.7), V(x + 1.6, D0 + 19.2, tz - 0.7), 1), sandstone); // the face
    b.add(boxGeo(V(x - 0.3, D0 + 16.6, tz - 0.7), V(x + 0.3, D0 + 17.6, tz - 0.3), 1), sandstone); // the nose
    b.add(boxGeo(V(x - 0.45, D0 + 14.2, tz - 1.4), V(x + 0.45, D0 + 15.6, tz - 0.9), 1), sandstone); // the beard
    const crown = new THREE.CylinderGeometry(0.8, 1.4, 3.2, 10);
    crown.translate(x, D0 + 21.2, tz - 2.6);
    b.add(crown, sandstone);
  }
  for (let i = 0; i < 30; i++) { // boulders and dry bushes on the sand in front
    const x = tx + (r() - 0.5) * 70, z = tz + 6 + r() * 40, s = 0.3 + r() * 0.8;
    if (Math.abs(x - tx - 2) < 5 && z < tz + 30) continue;
    b.add(new THREE.DodecahedronGeometry(s, 0), lam("rockBuff", () => ({ color: "#c4a478" })), new THREE.Matrix4().compose(V(x, D0 + s * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * 3, r())), V(1.3, 0.7, 1)));
  }
  for (let i = 0; i < 24; i++) prop(b, kit, pick(["plant_bush", "plant_bushDetailed"]), tx + (r() - 0.5) * 80, D0, tz + 8 + r() * 40, 0.5 + r() * 0.4, r() * 6);

  // ---- the studio / office: plank floor, panelled back + side walls, the desk, the easel, a lamp table ----
  setSightLines([]);
  const [ox, , oz] = OFFICE, nb = new Batch();
  const pm = lam("officePanel", () => ({ map: panel() }));
  b.add(boxGeo(V(ox - 6, D0 - 0.2, oz - 4.2), V(ox + 6, D0 + 0.08, oz + 7), 2), lam("officeFloor", () => ({ map: planks() })));
  b.add(boxGeo(V(ox - 6, D0, oz - 4.2), V(ox + 6, D0 + 4.2, oz - 3.9), 2), pm);
  b.add(boxGeo(V(ox - 6, D0, oz - 3.9), V(ox - 5.7, D0 + 4.2, oz + 7), 2), pm);
  nb.add(boxGeo(V(ox + 5.7, D0, oz - 3.9), V(ox + 6, D0 + 4.2, oz + 7), 2), pm);
  b.add(boxGeo(V(ox - 6, D0 + 4.2, oz - 4.3), V(ox + 6, D0 + 4.4, oz - 3.8), 1), post); // the cornice
  const [dx0, , dz0] = DESK;
  b.add(boxGeo(V(dx0 - 1.0, D0 + 0.74, dz0 - 0.45), V(dx0 + 1.0, D0 + 0.82, dz0 + 0.45), 1), wood);
  b.add(boxGeo(V(dx0 - 0.95, D0 + 0.08, dz0 - 0.4), V(dx0 - 0.45, D0 + 0.74, dz0 + 0.4), 1), wood);
  b.add(boxGeo(V(dx0 + 0.45, D0 + 0.08, dz0 - 0.4), V(dx0 + 0.95, D0 + 0.74, dz0 + 0.4), 1), wood);
  // the easel: three legs and a ledge
  const [ex, , ez] = EASEL;
  for (const [ddx, ddz] of [[-0.55, 0.15], [0.55, 0.15], [0, -0.35]]) {
    const g = new THREE.BoxGeometry(0.06, 2.1, 0.06);
    b.add(g, post, new THREE.Matrix4().compose(V(ex + ddx * 0.8, D0 + 1.05, ez + ddz * 0.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(-ddz * 0.3, 0, ddx * 0.25)), V(1, 1, 1)));
  }
  b.add(boxGeo(V(ex - 0.62, D0 + 0.66, ez + 0.08), V(ex + 0.62, D0 + 0.72, ez + 0.2), 1), post);
  // a chair by the desk (shot 10)
  const [cx0, cz0] = [ex - 1.3, ez + 0.75];
  b.add(boxGeo(V(cx0 - 0.3, D0 + 0.46, cz0 - 0.3), V(cx0 + 0.3, D0 + 0.52, cz0 + 0.3), 1), wood);
  for (const [lx, lz] of [[-0.28, -0.28], [0.22, -0.28], [-0.28, 0.22], [0.22, 0.22]]) b.add(boxGeo(V(cx0 + lx, D0 + 0.08, cz0 + lz), V(cx0 + lx + 0.06, D0 + 0.46, cz0 + lz + 0.06), 1), post);
  b.add(boxGeo(V(cx0 - 0.3, D0 + 0.52, cz0 - 0.32), V(cx0 + 0.3, D0 + 1.1, cz0 - 0.26), 1), wood);

  // ---- New York Harbor: the island, the star fort, the pedestal, a low skyline ----
  const [nx, , nz] = NY;
  const isl = new THREE.CylinderGeometry(40, 44, D0 - (SEA_Y - 2), 28, 1, true);
  isl.translate(nx, (D0 + SEA_Y - 2) / 2, nz);
  b.add(isl, quayStone);
  const top = new THREE.CircleGeometry(40, 28); top.rotateX(-Math.PI / 2); top.translate(nx, D0, nz);
  b.add(top, lam("islGrass", () => ({ color: "#86a85e" })));
  const sh = new THREE.Shape();
  for (let k = 0; k < 22; k++) { const a = (k / 22) * Math.PI * 2, rr = k % 2 ? 11 : 15; if (k) sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else sh.moveTo(rr, 0); }
  const fort = new THREE.ExtrudeGeometry(sh, { depth: 5, bevelEnabled: false });
  fort.rotateX(-Math.PI / 2); fort.translate(nx, D0, nz);
  b.add(fort, lam("fortStone", () => ({ color: "#c8bca2" })));
  const granite = lam("granite", () => ({ map: stone("granite", ["#c9c2b4", "#bdb6a8", "#d2cbbd", "#b4ad9f"]) }));
  b.add(boxGeo(V(nx - 6, D0 + 5, nz - 6), V(nx + 6, D0 + 5 + NYPED * 0.55, nz + 6), 2), granite);
  b.add(boxGeo(V(nx - 4.6, D0 + 5 + NYPED * 0.55, nz - 4.6), V(nx + 4.6, D0 + 5 + NYPED, nz + 4.6), 2), granite);
  b.add(boxGeo(V(nx - 5.2, D0 + 5 + NYPED - 0.8, nz - 5.2), V(nx + 5.2, D0 + 5 + NYPED, nz + 5.2), 1), granite);
  const bricks = ["#a8624a", "#b88a6a", "#8f5a48", "#c9a27e", "#9a7a62"];
  for (let k = 0; k < 40; k++) {
    const x = nx - 260 + k * 13 + r() * 5, z = nz - 280 - r() * 40, w = 8 + r() * 6, h = 8 + r() * 22;
    b.add(boxGeo(V(x - w / 2, SEA_Y - 1, z - 6), V(x + w / 2, D0 + h, z + 6), 4), lam(`nyB${k % 5}`, () => ({ color: bricks[k % 5] })));
    if (k % 9 === 4) { const sp = new THREE.ConeGeometry(2.2, 16, 4); sp.translate(x, D0 + h + 8, z); b.add(sp, lam("spire", () => ({ color: "#6a6470" }))); }
  }
  b.add(boxGeo(V(nx - 300, SEA_Y - 1, nz - 330), V(nx + 300, D0 + 0.5, nz - 270), 4), lam("nyShore", () => ({ color: "#8a8a6a" })));

  b.build(root);
  nb.build(root, false); // the room's sun-side wall casts no shadow into it
  setSightLines([]);

  // ---- the plain lighthouse (real) and the two statues ----
  const lighthouse = new THREE.Group(), lb = new Batch();
  const tower = new THREE.CylinderGeometry(2.4, 3.4, 30, 8); tower.translate(0, 15, 0);
  lb.add(tower, lam("lhWall", () => ({ color: "#ece2c8" })));
  for (const y of [9, 19]) { const band = new THREE.CylinderGeometry(3.3 - y * 0.03, 3.3 - y * 0.03, 0.6, 8); band.translate(0, y, 0); lb.add(band, lam("lhBand", () => ({ color: "#9a4a3a" }))); }
  const gal = new THREE.CylinderGeometry(3.4, 3.4, 0.5, 12); gal.translate(0, 30.2, 0); lb.add(gal, lam("lhIron", () => ({ color: "#3a3640" })));
  const dome = new THREE.ConeGeometry(2.0, 2.0, 12); dome.translate(0, 34.2, 0); lb.add(dome, lam("lhDome", () => ({ color: "#8a3a30" })));
  lb.build(lighthouse);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.8, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.4, 0.95), fog: false }));
  lamp.position.set(0, 31.8, 0); lighthouse.add(lamp);
  lighthouse.position.set(L[0], D0 + 3.2, L[2]);
  lighthouse.traverse((o) => { if ((o as THREE.Mesh).isMesh && o !== lamp) { o.castShadow = true; o.receiveShadow = true; } });
  root.add(lighthouse);
  const giant = statue(false);
  const pedG = new THREE.Mesh(boxGeo(V(-4.2, -PED + 2.2, -4.2), V(4.2, 0, 4.2), 2), quayStone);
  pedG.castShadow = pedG.receiveShadow = true;
  giant.g.add(pedG);
  giant.g.position.set(L[0], D0 + 1 + PED, L[2]); giant.g.rotation.y = 0.35;
  root.add(giant.g);
  const liberty = statue(true);
  liberty.g.position.set(nx, D0 + 5 + NYPED, nz); liberty.g.rotation.y = 0.2;
  root.add(liberty.g);
  return { giant, liberty, lighthouse, lamp };
};
