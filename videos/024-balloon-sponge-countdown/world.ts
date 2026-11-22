// The whole place as one three.js scene: sky, the garden, Paris and the landing field (town.ts), the Montgolfier
// balloon (a round wicker gallery with its rail round the open neck, the iron brazier hanging in the middle, the tall
// blue and gold envelope; moved per shot, and flattened when it collapses after landing), the windmill sails, clouds
// and the cast. update(id, f, camera) poses everything for shot `id` at frame f (pure function).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, kitClone, setSightLines } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { ctex, grassHD, cloudHD, planks } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown, HUBS } from "./town";
import { stage } from "./cast";
import { FPS, D0, SHOTS, camAt, FOREGROUND, ShotDef, balloonAt, collapseAt, ENV_PROFILE, GAL_IN, GAL_OUT, RAIL } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "plant_bushDetailed", "lantern"];
export const loadKit = () => loadKenney(KENNEY);
/** sun disc (solid, soft rim) and the flat golden halo */
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});

/** the envelope's painted cloth: canvas bottom = the neck, top = the crown. An ochre skirt with red swags, a gold
 *  band, a deep-blue body with gold suns, gold garlands and a blue crown with gold ribs; ink-brown seams */
const envTex = () => ctex("montgolfier", 2048, 1024, (g) => {
  const W = 2048, H = 1024, BLUE = "#33508f", GOLD = "#d9a441", RED = "#a8423a", INKB = "#3a2a2a";
  g.fillStyle = BLUE; g.fillRect(0, 0, W, H);
  // the skirt (neck): ochre with red swags
  g.fillStyle = "#b07e48"; g.fillRect(0, H * 0.84, W, H * 0.16);
  g.fillStyle = RED;
  for (let i = 0; i < 16; i++) { g.beginPath(); const x0 = (i * W) / 16; g.moveTo(x0, H * 0.84); g.quadraticCurveTo(x0 + W / 32, H * 0.93, x0 + W / 16, H * 0.84); g.fill(); }
  // gold bands
  g.fillStyle = GOLD; g.fillRect(0, H * 0.8, W, H * 0.035); g.fillRect(0, H * 0.31, W, H * 0.03);
  // eight gold suns round the waist
  for (let i = 0; i < 8; i++) {
    const cx = ((i + 0.5) * W) / 8, cy = H * 0.56;
    g.strokeStyle = GOLD; g.lineWidth = 14;
    for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; g.beginPath(); g.moveTo(cx + 58 * Math.cos(a), cy + 70 * Math.sin(a)); g.lineTo(cx + 96 * Math.cos(a), cy + 116 * Math.sin(a)); g.stroke(); }
    g.fillStyle = GOLD; g.beginPath(); g.ellipse(cx, cy, 50, 60, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INKB; g.lineWidth = 5; g.stroke();
  }
  // gold garlands between the suns
  g.strokeStyle = GOLD; g.lineWidth = 12;
  for (let i = 0; i < 16; i++) { const x0 = (i * W) / 16; g.beginPath(); g.moveTo(x0, H * 0.72); g.quadraticCurveTo(x0 + W / 32, H * 0.78, x0 + W / 16, H * 0.72); g.stroke(); }
  // gold ribs up the crown
  g.lineWidth = 10;
  for (let i = 0; i < 24; i++) { const x = (i * W) / 24; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H * 0.31); g.stroke(); }
  // the seams of the gores
  g.strokeStyle = INKB; g.lineWidth = 3;
  for (let i = 0; i < 24; i++) { const x = (i * W) / 24; g.beginPath(); g.moveTo(x, H * 0.31); g.lineTo(x, H); g.stroke(); }
});

/** every lens position of the film looking at its subject: centre, sides and top of frame (houses there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4], [0, -0.85], [-0.6, -0.85], [0.6, -0.85], [0, -1], [-0.7, -1], [0.7, -1], [-1, -0.5], [1, -0.5], [-1, 0], [1, 0]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 14: { az: 120, el: 14 } }; // the payoff: side-lit so the faces read at sunset

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private balloon = new THREE.Group();
  private env: THREE.Mesh;
  private sails: THREE.Group[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- ground (80 x 80 cells: one huge two-triangle quad lost its texture and fog on single frames in 006) ----
    const b = new Batch();
    const grass = lam("grassHD", () => ({ map: grassHD() }));
    const gg = new THREE.PlaneGeometry(2400, 2400, 80, 80);
    gg.rotateX(-Math.PI / 2); gg.translate(200, D0, -250);
    const uv = gg.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 600, uv.getY(i) * 600);
    b.add(gg, grass);
    b.build(R);
    buildTown(R, kit, sightLines());

    // ---- the balloon (gallery-floor frame) ----
    const MC = (k: string, c: string) => lam(k, () => ({ color: c }));
    const wick = lam("wicker", () => ({ map: planks(), color: "#d9a466", side: THREE.DoubleSide }));
    const rimM = MC("galleryRim", "#7a5434"), iron = MC("brazierIron", "#3a3a44");
    const floor = new THREE.RingGeometry(GAL_IN, GAL_OUT, 48, 1); floor.rotateX(-Math.PI / 2);
    const fl = new THREE.Mesh(floor, wick); fl.receiveShadow = true; fl.castShadow = true; this.balloon.add(fl);
    const under = new THREE.RingGeometry(GAL_IN, GAL_OUT, 48, 1); under.rotateX(Math.PI / 2); under.translate(0, -0.12, 0);
    this.balloon.add(new THREE.Mesh(under, rimM));
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(GAL_OUT, GAL_OUT, 0.12, 48, 1, true), rimM); edge.position.y = -0.06; this.balloon.add(edge);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(GAL_OUT, GAL_OUT, RAIL, 48, 1, true), wick);
    rail.position.y = RAIL / 2; rail.castShadow = true; rail.receiveShadow = true; this.balloon.add(rail);
    const top = new THREE.Mesh(new THREE.TorusGeometry(GAL_OUT, 0.05, 6, 48), rimM); top.rotation.x = Math.PI / 2; top.position.y = RAIL; this.balloon.add(top);
    // the brazier: an iron basket hanging in the middle of the neck on four rods
    const bz = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.35, 0.3, 16, 1, true), iron); bz.position.y = -0.3; this.balloon.add(bz);
    const bzb = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), iron); bzb.rotation.x = Math.PI / 2; bzb.position.y = -0.45; this.balloon.add(bzb);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + 0.4, rod = new THREE.Mesh(boxGeo(V(-0.025, 0, -0.025), V(0.025, 1, 0.025)), iron);
      const p0 = V(0.5 * Math.cos(a), -0.15, 0.5 * Math.sin(a)), p1 = V(GAL_IN * Math.cos(a), 0, GAL_IN * Math.sin(a));
      rod.position.copy(p0); rod.scale.set(1, p0.distanceTo(p1), 1);
      rod.quaternion.setFromUnitVectors(V(0, 1, 0), p1.clone().sub(p0).normalize()); this.balloon.add(rod);
    }
    // the envelope: a lathe from the neck to the crown, both faces (never let the sky show through the open neck)
    const prof = ENV_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
    const envM = lam("montgolfier", () => ({ map: envTex() }));
    envM.side = THREE.DoubleSide;
    this.env = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), envM);
    this.env.castShadow = true; this.env.receiveShadow = true; this.balloon.add(this.env);
    R.add(this.balloon);

    // ---- the windmill sails: four lattice arms on each hub, turning slowly ----
    const sailM = lam("sailLattice", () => ({ map: planks(), color: "#efe0bc" })), arm = MC("sailArm", "#5a3e2a");
    for (const h of HUBS) {
      const g = new THREE.Group(); g.position.set(...h);
      for (let k = 0; k < 4; k++) {
        const a = new THREE.Group(); a.rotation.z = (k * Math.PI) / 2;
        const spar = new THREE.Mesh(boxGeo(V(-0.12, 0, -0.08), V(0.12, 7.2, 0.08)), arm); spar.castShadow = true; a.add(spar);
        const cloth = new THREE.Mesh(boxGeo(V(0.12, 1.4, -0.04), V(1.3, 7.0, 0.04)), sailM); cloth.castShadow = true; a.add(cloth);
        g.add(a);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12), arm); hub.rotation.x = Math.PI / 2; g.add(hub);
      this.sails.push(g); R.add(g);
    }

    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
    setSightLines([]);
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  /** the cloth after landing: squashed down and draped outward into a dome-shaped heap (k 0 standing .. 1 heap) */
  private envK = -1;
  private envBase: Float32Array | null = null;
  private collapse(k: number) {
    if (Math.abs(k - this.envK) < 1e-4) return;
    this.envK = k;
    const g = this.env.geometry, pa = g.getAttribute("position") as THREE.BufferAttribute;
    if (!this.envBase) this.envBase = Float32Array.from(pa.array as Float32Array);
    const B = this.envBase, A = pa.array as Float32Array;
    for (let i = 0; i < pa.count; i++) {
      const x = B[i * 3], y = B[i * 3 + 1], z = B[i * 3 + 2], r = Math.hypot(x, z), m = 1 + 0.15 * k;
      const y1 = Math.max(-0.42, y * (1 - 0.85 * k) - k * 0.35 * Math.max(0, r - 2.5));
      A[i * 3] = x * m; A[i * 3 + 1] = y1; A[i * 3 + 2] = z * m;
    }
    pa.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.position.x = cam.position.x + Math.cos((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.position.z = cam.position.z + Math.sin((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- the balloon, its collapse, the sails ----
    this.balloon.position.set(...balloonAt(id, t));
    const k = collapseAt(id, t);
    this.collapse(k);
    this.sails.forEach((g, i) => { g.rotation.z = -0.35 * t + i * 0.7; });
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, kk] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, kk, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) e3.bind();
    return focus;
  }
}
