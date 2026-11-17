// The whole place as one three.js scene: sky, the land (sand), the sea (a water shader with drifting ripples), the
// places of town.ts (the beach, the lab, the museum room), the Ann Francis (a two-masted merchant ship), clouds and the
// cast with its painted props (cast.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function).
import * as THREE from "three";
import { Batch, V, lam, Kit, Ray, kitClone, setSightLines, boxGeo } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { ctex, cloudHD, waterNear, waterFar } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, LFB, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown, Town } from "./town";
import { stage } from "./cast";
import { FPS, D0, SEA_Y, SHOTS, camAt, FOREGROUND, ShotDef, shipAt } from "./story";

// ---------------- assets ----------------
const KENNEY = ["grass_large", "grass", "plant_bush"];
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

/** the desert floor: warm sand with darker grit, pale specks and a few dry cracks (4 m tiles) */
const sandTex = () => ctex("sandHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#d4b483"; g.fillRect(0, 0, 1024, 1024);
  const cols = ["#c9a674", "#dcc08f", "#c19c6a", "#e2c99c", "#b8925f"];
  for (let i = 0; i < 2600; i++) { g.fillStyle = cols[i % 5]; const x = r() * 1024, y = r() * 1024, s = 3 + r() * 14; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * 3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(120,84,50,0.35)"; g.lineWidth = 2;
  for (let i = 0; i < 14; i++) { let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 80; y += (r() - 0.5) * 80; g.lineTo(x, y); } g.stroke(); }
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
/** the deck planks of the ships */
const planksTex = () => ctex("deckPlanks", 256, 256, (g) => {
  g.fillStyle = "#b08a5a"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#3a2618"; for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 256, 3);
});
const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(1.1 * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 2.6), texture2D(wFarTex, wp / 26.0 + 0.37), smoothstep(25.0, 90.0, wd));
  float rp = sin(wp.x * 2.3 + 1.6 * sin(vWP.z * 0.7)) * sin(vWP.z * 1.15 + wp.x * 0.45 + 0.8 * sin(wp.x * 0.3));
  float near = 1.0 - smoothstep(18.0, 60.0, wd);
  float crest = max(mk.r * 0.8, smoothstep(0.42, 0.62, rp) * 0.75 * near);
  float trough = max(mk.g * 0.6, smoothstep(-0.4, -0.75, rp) * 0.45 * near);
  vec3 wr = mix(wc, wTrough, trough);
  wr = mix(wr, wCrest, crest);
  wr = mix(wr, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wr;`;
type Mats = Record<string, THREE.Material>;


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
  private town!: Town;
  private ships: { g: THREE.Group; sails: THREE.Mesh[] }[] = [];
  private WU!: Record<string, { value: unknown }>;
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


    // ---- land (30 x 20 cells: one huge two-triangle quad lost its texture and fog on single frames in 006) ----
    const b = new Batch();
    const sand = lam("sandHD", () => ({ map: sandTex() }));
    const gg = new THREE.PlaneGeometry(300, 200, 30, 20);
    gg.rotateX(-Math.PI / 2); gg.translate(0, D0, 94);
    const uv = gg.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 75, uv.getY(i) * 50);
    b.add(gg, sand);
    b.build(R);
    this.town = buildTown(R, kit, sightLines());

    // ---- the sea: one shader, drifting wind ripples, colour by view depression ----
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
    waterM.customProgramCacheKey = () => "sea014";
    const seaG = new THREE.PlaneGeometry(3000, 3000, 40, 40); seaG.rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(seaG, waterM); sea.position.set(300, SEA_Y, -400); sea.receiveShadow = true;
    R.add(sea);

    // ---- the ships: 0 a steam launch (low cabin, short funnel aft), 1 and 2 schooners ----
    const hullM = lam("hullM", () => ({ color: "#5b3a29" })), trimM = lam("trimM2", () => ({ color: "#8a6a3a" })), deckM = lam("deckM", () => ({ map: planksTex() }));
    const sailM = lam("sailM", () => ({ color: "#f1e8d2", side: THREE.DoubleSide })), mastM = lam("mastM", () => ({ color: "#6a4a30" }));
    const hullW = ["#2f3a4a", "#5b3a29", "#6a2e2a"];
    const tri = (w: number, h: number, hook: number) => {
      const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.lineTo(w, 0); shp.lineTo(w * hook, h); shp.closePath();
      return new THREE.ShapeGeometry(shp);
    };
    const sailDefs: [number, number, number, number, number][] = [[-2.2, 3.4, 4.9, 6.6, 0.1], [2.4, 3.4, 4.2, 5.9, 0.1], [-2.0, 4.3, 3.0, 4.6, 0.55], [2.6, 4.2, 2.6, 4.2, 0.55]];
    for (let k = 1; k < 2; k++) {
      const g = new THREE.Group(), sails: THREE.Mesh[] = [];
      const sb = new Batch(), DY = 3.0, hm = k === 0 ? lam("hullLaunch", () => ({ color: hullW[0] })) : k === 2 ? lam("hullRed", () => ({ color: hullW[2] })) : hullM;
      sb.add(boxGeo(V(-6, -0.4, -2.1), V(5.2, DY, 2.1), 2), hm);
      sb.add(boxGeo(V(-6, DY, -2.1), V(5.2, DY + 0.08, 2.1), 2), deckM);
      for (const sz of [-1, 1]) sb.add(boxGeo(V(-6, DY, sz * 2.1 - 0.06), V(5.2, DY + 0.5, sz * 2.1 + 0.06), 2), hm);
      for (const sz of [-1, 1]) sb.add(boxGeo(V(-6, DY + 0.45, sz * 2.1 - 0.1), V(5.2, DY + 0.55, sz * 2.1 + 0.1), 2), trimM);
      const bow = new THREE.ConeGeometry(2.6, 5.5, 4); bow.rotateY(Math.PI / 4); bow.rotateZ(-Math.PI / 2); bow.scale(1, 1, 0.85);
      sb.add(bow, hm, new THREE.Matrix4().makeTranslation(7.9, (DY - 0.4) / 2 + 0.15, 0));
      if (k === 0) {
        sb.add(boxGeo(V(-5.9, DY + 0.08, -1.5), V(-3.6, DY + 1.3, 1.5), 2), lam("cabinW", () => ({ color: "#e8dcc0" })));
        sb.add(new THREE.CylinderGeometry(0.42, 0.42, 2.6, 12), lam("funnel", () => ({ color: "#2a2628" })), new THREE.Matrix4().makeTranslation(-4.7, DY + 2.6, 0));
      } else {
        sb.add(boxGeo(V(-5.9, DY + 0.08, -1.5), V(-4.4, DY + 1.4, 1.5), 2), trimM);
        for (const mx of [-2.2, 2.4]) sb.add(new THREE.CylinderGeometry(0.1, 0.16, mx < 0 ? 11 : 10, 8), mastM, new THREE.Matrix4().makeTranslation(mx, DY + (mx < 0 ? 5.5 : 5), 0));
      }
      sb.build(g);
      if (k > 0) for (const [mx, y0, w, h, hook] of sailDefs) {
        const m = new THREE.Mesh(tri(w, h, hook), sailM);
        m.position.set(mx + (hook < 0.3 ? -0.15 : 0.1), DY + y0, 0.12); m.castShadow = true; m.frustumCulled = false;
        if (hook < 0.3) m.scale.x = -1;
        sails.push(m); g.add(m);
      }
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.visible = false;
      this.ships.push({ g, sails }); R.add(g);
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
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
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
    // ---- the sea's colours, the ship, the scanner lamp ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value as THREE.Color); untone(wc.mid, W.wMidC.value as THREE.Color); untone(wc.far, W.wFarC.value as THREE.Color);
    untone(wc.crest, W.wCrest.value as THREE.Color); untone(wc.trough, W.wTrough.value as THREE.Color); untone(wc.glint, W.wGlint.value as THREE.Color);
    (W.wShade.value as THREE.Vector3).set(...wc.shade); W.wTime.value = t;
    this.ships.forEach((sh, k) => {
      const p = shipAt(id, t);
      sh.g.visible = !!p;
      if (!p) return;
      sh.g.position.set(p.x, SEA_Y - 0.4 + 0.12 * Math.sin(t * 1.9 + k), p.z); sh.g.rotation.set(p.roll, p.yaw, p.pitch, "YXZ");
      sh.sails.forEach((m, i) => { m.rotation.y = 0.08 * Math.sin(t * 2.3 + i + k); });
    });
    this.town.lamp.visible = s.scene === "lab";
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
