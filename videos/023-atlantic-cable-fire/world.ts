// The whole place as one three.js scene: sky, the land of the cable story (town.ts), the Atlantic (drifting painted
// ripples), the two cable ships and the cable itself, clouds and the cast with its drawn props (cast.ts). update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { V, Kit, Ray, kitClone, setSightLines, Batch, boxGeo, lam } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { ctex, cloudHD, waterNear, waterFar } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, LFB, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown } from "./town";
import { stage } from "./cast";
import { FPS, SHOTS, camAt, FOREGROUND, ShotDef, V3, DECK, SEA, shipAt, sternOf, snapAt, ShipPose } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_fat", "tree_cone", "plant_bush", "lantern", "hedge"];
const [SX0, , SZ0] = SEA;
export const loadKit = () => loadKenney(KENNEY);
/** sun disc (solid, soft rim) and the flat golden halo (lighting.md 6 / depth.md 6.4: r50 13-26 % of the frame width) */
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

const SUN_SHOT: Record<number, { az?: number; el?: number }> = {};

const shadowAll = (o: THREE.Object3D) => o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
/** a sagging line from a to b: n thin segments along a dropped curve (the cable) */
class Line {
  segs: THREE.Mesh[] = [];
  constructor(root: THREE.Object3D, n = 14, r = 0.09) {
    const geo = new THREE.CylinderGeometry(r, r, 1, 6); geo.translate(0, 0.5, 0);
    const mat = lam("cable023", () => ({ color: "#4a3f38" }));
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; m.castShadow = true; this.segs.push(m); root.add(m); }
  }
  hide() { for (const m of this.segs) m.visible = false; }
  set(a: V3, b: V3, sag: number) {
    const n = this.segs.length, L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const pt = (u: number) => V(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 0.12 * L * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u);
    const up = V(0, 1, 0);
    for (let i = 0; i < n; i++) {
      const p0 = pt(i / n), p1 = pt((i + 1) / n), d = p1.clone().sub(p0), len = d.length();
      const m = this.segs[i];
      m.visible = true; m.position.copy(p0); m.scale.set(1, len, 1);
      m.quaternion.setFromUnitVectors(up, d.normalize());
    }
  }
}
/** a steam frigate of 1858 (local: bow along +x, waterline y = 0, deck at DECK): black hull with a pale band, three
 *  masts with yards, one funnel; the Niagara carries the cable drum near her stern */
const makeShip = (kind: "niagara" | "agam") => {
  const g = new THREE.Group(), b = new Batch();
  const L0 = -22, L1 = 18, Wd = 3.6, hull = lam("hull023", () => ({ color: "#2c2a30" }));
  b.add(boxGeo(V(L0, -1.2, -Wd), V(L1, DECK, Wd), 2), hull);
  b.add(boxGeo(V(L0, DECK - 1.1, -Wd - 0.03), V(L1, DECK - 0.6, Wd + 0.03), 2), lam("band" + kind, () => ({ color: kind === "niagara" ? "#e4dcc8" : "#c9a24a" })));
  b.add(boxGeo(V(L0, -1.2, -Wd - 0.02), V(L1, 0.3, Wd + 0.02), 2), lam("boot023", () => ({ color: "#7a3a30" })));
  const bow = new THREE.Shape(); bow.moveTo(L1, -Wd); bow.lineTo(L1 + 6, 0); bow.lineTo(L1, Wd); bow.closePath();
  const bg = new THREE.ExtrudeGeometry(bow, { depth: DECK + 1.2, bevelEnabled: false }); bg.rotateX(-Math.PI / 2); bg.translate(0, -1.2, 0);
  b.add(bg, hull);
  b.add(boxGeo(V(L0, DECK, -Wd), V(L1, DECK + 0.06, Wd), 2), lam("deck023", () => ({ color: "#b08a5e" })));
  for (const s of [-1, 1]) b.add(boxGeo(V(L0, DECK, s * Wd - 0.08), V(L1, DECK + 0.9, s * Wd + 0.08), 2), hull);
  b.add(boxGeo(V(L0 - 0.08, DECK, -Wd), V(L0 + 0.08, DECK + 0.9, Wd), 2), hull);
  const spar = lam("spar023", () => ({ color: "#6b4a2e" }));
  for (const [x, h] of [[-12, 17], [1, 19], [12, 16]] as const) {
    b.add(new THREE.CylinderGeometry(0.16, 0.24, h, 8), spar, new THREE.Matrix4().makeTranslation(x, DECK + h / 2, 0));
    for (const k of [0.55, 0.8]) b.add(boxGeo(V(x - 0.12, DECK + h * k - 0.1, -3.6 * (1.1 - k)), V(x + 0.12, DECK + h * k + 0.1, 3.6 * (1.1 - k)), 0), spar);
  }
  b.add(new THREE.CylinderGeometry(1.0, 1.0, 4.4, 14), lam("funnel023", () => ({ color: "#3a3438" })), new THREE.Matrix4().makeTranslation(-4, DECK + 2.2, 0));
  b.add(new THREE.CylinderGeometry(1.02, 1.02, 0.6, 14), lam("funTop023", () => ({ color: "#1e1a1e" })), new THREE.Matrix4().makeTranslation(-4, DECK + 4.1, 0));
  if (kind === "niagara") {
    const drum = new THREE.CylinderGeometry(1.0, 1.0, 2.2, 18); drum.rotateX(Math.PI / 2);
    b.add(drum, lam("drum023", () => ({ color: "#6a4a30" })), new THREE.Matrix4().makeTranslation(-17, DECK + 1.1, 0));
    for (const s of [-1, 1]) b.add(boxGeo(V(-17.6, DECK, s * 1.15 - 0.1), V(-16.4, DECK + 1.3, s * 1.15 + 0.1), 0), spar);
  }
  b.build(g);
  shadowAll(g);
  return g;
};
const pose = (o: THREE.Object3D, s: ShipPose | null) => { o.visible = !!s; if (s) { o.position.set(...s.p); o.rotation.set(0, s.yaw, 0); } };

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
  private WU: Record<string, THREE.IUniform>;
  private niagara: THREE.Group; private agam: THREE.Group; private cableA: Line; private cableB: Line;
  private domes: { whole: THREE.Group; burnt: THREE.Group };
  private clouds: THREE.Mesh[] = [];
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

    // ---- the land, City Hall, the office, the garden (town.ts) ----
    this.domes = buildTown(R, kit, sightLines());
    // ---- the Atlantic: one painted-ripple sheet in 50 m cells (the land block covers it where it stands) ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "sea023";
    const sg = new THREE.PlaneGeometry(2400, 2400, 48, 48); sg.rotateX(-Math.PI / 2); sg.translate(SX0, 0, SZ0 - 300);
    const sea = new THREE.Mesh(sg, waterM); sea.receiveShadow = true; R.add(sea);
    // ---- the ships and the cable ----
    this.niagara = makeShip("niagara"); this.agam = makeShip("agam"); R.add(this.niagara, this.agam);
    this.cableA = new Line(R); this.cableB = new Line(R);

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
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  private poseProps(id: number, t: number) {
    const n = shipAt("niagara", id, t), a = shipAt("agam", id, t);
    pose(this.niagara, n); pose(this.agam, a);
    this.cableA.hide(); this.cableB.hide();
    if (id === 2 && n) { const st = sternOf(n); this.cableA.set(st, [st[0] - 14, -0.4, st[2]], 0.15); }
    if ((id === 3 || id === 5) && n) {
      const drum: V3 = [SX0 - 17, DECK + 2.05, SZ0], st = sternOf(n);
      if (id === 5 || snapAt(t) < 0.2) this.cableA.set(drum, st, 0.05);
      if (id === 5 || snapAt(t) <= 0) this.cableB.set(st, [st[0] - 12, -0.4, st[2]], 0.1);
    }
    if (id === 14 && a) { const st = sternOf(a); this.cableA.set(st, [st[0] - 12, -0.4, st[2]], 0.1); }
    if (id === 4 && n && a) {
      const p = sternOf(n), q = sternOf(a), L = Math.hypot(p[0] - q[0], p[2] - q[2]) || 1;
      this.cableA.set(p, q, (DECK + 1.6) / (0.12 * L));
    }
    const burnt = id === 13 || id === 15;
    this.domes.whole.visible = !burnt; this.domes.burnt.visible = burnt;
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK); // sky, clouds and sun sprites live on the no-ink layer but are still rendered
    // ---- light rig: camera-relative sun frozen per shot, two-tone uniforms, shadow fit ----
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
    // ---- sky, fog, sun disc + halo, clouds (underwater: green gloom, no sky) ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.background = null;
    scene.fog = this.fog;
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
    // ---- water colours, the ships, the cable, the cupola ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    this.poseProps(id, t);

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
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
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
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}


const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.12 * wTime);  // slow drift with the swell
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
