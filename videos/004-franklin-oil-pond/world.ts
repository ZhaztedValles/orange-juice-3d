// The whole place as one three.js scene: sky, Clapham Common with its pond (a water shader whose wind ripples die
// wherever the oil has spread), villas and trees, a London street, the open sea with three ships (two with smooth wakes),
// a garden table, clouds and the cast. update(id, f, camera) poses everything for shot `id` at frame f (pure function).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, kitClone, setSightLines } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { beam, ctex, planksHD, grassHD, waterNear, waterFar, cloudHD } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, LFB, twoTone, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown, flagTex } from "./town";
import { stage } from "./cast";
import { FPS, D0, SHOTS, camAt, FOREGROUND, ShotDef, POND, PRX, PRZ, WATER_Y, TAB, TABLE_Y, SEA_X0, SEA_Y, shipAt, calmAt, wakesAt, windAt } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lantern", "cart", "stall-red",
  "stall-green", "stall-bench", "banner-red", "banner-green", "windmill", "canoe"];
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

const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 12: { az: 120, el: 18 }, 13: { az: 120, el: 18 } };

type Mats = Record<string, THREE.Material>;
const SHIPZ = -13; // the schooner's own z in its geometry
const SHIP_S = 1.8;

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private ships: { g: THREE.Group; sails: THREE.Mesh[] }[] = [];
  private flag: THREE.Mesh;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
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

    // ---- ground with the pond cut out, the pond's bank, the table (static batch) ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.bank = lam("pondBank2", () => ({ color: "#a08860", side: THREE.BackSide }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.planks = lam("deckPlanks", () => ({ map: planksHD() }));
    M.cloth = lam("tableTop", () => ({ color: "#efe6d2" }));
    const ground = new THREE.Shape([V(-900, 900, 0), V(SEA_X0, 900, 0), V(SEA_X0, -900, 0), V(-900, -900, 0)].map((p) => new THREE.Vector2(p.x, p.y)));
    const hole = new THREE.Path(); hole.absellipse(POND[0], -POND[2], PRX + 0.15, PRZ + 0.15, 0, Math.PI * 2, true, 0);
    ground.holes.push(hole);
    const gg = new THREE.ShapeGeometry(ground, 96);
    gg.rotateX(-Math.PI / 2); gg.translate(0, D0, 0); // shape y -> world -z
    const uv = gg.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
    b.add(gg, M.grass);
    // the bank: an open ellipse wall from below the water up to the grass
    const bankG = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true);
    b.add(bankG, M.bank, new THREE.Matrix4().compose(V(POND[0], (WATER_Y - 0.4 + D0) / 2, POND[2]), new THREE.Quaternion(), V(PRX + 0.15, D0 - WATER_Y + 0.4, PRZ + 0.15)));
    // the garden table: top + four legs
    b.add(boxGeo(V(TAB[0] - 0.9, TABLE_Y - 0.06, TAB[2] - 0.55), V(TAB[0] + 0.9, TABLE_Y, TAB[2] + 0.55), 2), M.cloth);
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.45, 0.45]) b.add(boxGeo(V(TAB[0] + sx - 0.04, D0, TAB[2] + sz - 0.04), V(TAB[0] + sx + 0.04, TABLE_Y - 0.06, TAB[2] + sz + 0.04), 2), M.wood);
    b.build(R);
    buildTown(R, kit, sightLines());
    const flagM = new THREE.MeshBasicMaterial({ map: flagTex(), side: THREE.DoubleSide, toneMapped: false });
    this.flag = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), flagM);
    this.flag.layers.set(NOINK);

    // ---- the schooner template, three of them at sea ----
    const hullM = lam("hullM", () => ({ color: "#5b3a29" })), trimM = lam("trimM2", () => ({ color: "#8a6a3a" })), deckM2 = M.planks;
    const sailM = lam("sailM", () => ({ color: "#f1e8d2", side: THREE.DoubleSide })), mastM = M.wood;
    const tri = (w: number, h: number, hook: number) => {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(w, 0); sh.lineTo(w * hook, h); sh.closePath();
      return new THREE.ShapeGeometry(sh);
    };
    const sailDefs: [number, number, number, number, number][] = [[-2.2, 3.4, 4.9, 6.6, 0.1], [2.4, 3.4, 4.2, 5.9, 0.1], [-2.0, 4.3, 3.0, 4.6, 0.55], [2.6, 4.2, 2.6, 4.2, 0.55]];
    for (let k = 0; k < 3; k++) {
      const g = new THREE.Group(), sails: THREE.Mesh[] = [];
      const sb = new Batch(), z0 = SHIPZ, DECK_Y = 3.0;
      sb.add(boxGeo(V(-6, -0.4, z0 - 2.1), V(5.2, DECK_Y, z0 + 2.1), 2), hullM);
      sb.add(boxGeo(V(-6, DECK_Y, z0 - 2.1), V(5.2, DECK_Y + 0.08, z0 + 2.1), 2), deckM2);
      for (const sz of [-1, 1]) sb.add(boxGeo(V(-6, DECK_Y, z0 + sz * 2.1 - 0.06), V(5.2, DECK_Y + 0.5, z0 + sz * 2.1 + 0.06), 2), hullM);
      for (const sz of [-1, 1]) sb.add(boxGeo(V(-6, DECK_Y + 0.45, z0 + sz * 2.1 - 0.1), V(5.2, DECK_Y + 0.55, z0 + sz * 2.1 + 0.1), 2), trimM);
      sb.add(boxGeo(V(-5.9, DECK_Y + 0.08, z0 - 1.5), V(-4.4, DECK_Y + 1.4, z0 + 1.5), 2), M.wood);
      const bow = new THREE.ConeGeometry(2.6, 5.5, 4); bow.rotateY(Math.PI / 4); bow.rotateZ(-Math.PI / 2); bow.scale(1, 1, 0.85);
      sb.add(bow, hullM, new THREE.Matrix4().makeTranslation(7.9, (DECK_Y - 0.4) / 2 + 0.15, z0));
      for (const mx of [-2.2, 2.4]) sb.add(new THREE.CylinderGeometry(0.1, 0.16, mx < 0 ? 11 : 10, 8), mastM, new THREE.Matrix4().makeTranslation(mx, DECK_Y + (mx < 0 ? 5.5 : 5), z0));
      sb.build(g);
      for (const [mx, y0, w, h, hook] of sailDefs) {
        const m = new THREE.Mesh(tri(w, h, hook), sailM);
        m.position.set(mx + (hook < 0.3 ? -0.15 : 0.1), DECK_Y + y0, z0 + 0.12); m.castShadow = true; m.frustumCulled = false;
        if (hook < 0.3) m.scale.x = -1;
        sails.push(m); g.add(m);
      }
      if (k === 2) { const fl = this.flag.clone(); fl.position.set(-2.2 + 1.35, DECK_Y + 10.2, z0); g.add(fl); }
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.scale.setScalar(SHIP_S);
      this.ships.push({ g, sails }); R.add(g);
    }

    // ---- water: the pond and the sea share one shader (wind ripples, calm patches, smooth wakes) ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wMirror: { value: new THREE.Color() }, wOil: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 }, wWind: { value: 1 },
      wCalm: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) },
      wWake: { value: [0, 1].map(() => new THREE.Vector4(0, 0, 0, 0)) }, wWakeR: { value: 0 },
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
    waterM.customProgramCacheKey = () => "pond1";
    const pondG = new THREE.CircleGeometry(1, 96); pondG.rotateX(-Math.PI / 2);
    const pond = new THREE.Mesh(pondG, waterM);
    pond.position.set(POND[0], WATER_Y, POND[2]); pond.scale.set(PRX + 0.15, 1, PRZ + 0.15); pond.receiveShadow = true;
    R.add(pond);
    const seaG = new THREE.PlaneGeometry(2400, 2400); seaG.rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(seaG, waterM); sea.position.set(SEA_X0 + 1200, SEA_Y, -100); sea.receiveShadow = true;
    R.add(sea);
    // the land ends in a dark wall where the sea starts (never in shot, but no gap)
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(1800, D0 - SEA_Y + 1), lam("landEdge", () => ({ color: "#6f5a44" })));
    edge.rotation.y = Math.PI / 2; edge.position.set(SEA_X0, (D0 + SEA_Y - 1) / 2, 0); R.add(edge);

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
    // ---- water colours, wind, calm patches, wakes ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    untone(K.sky.c[1], W.wMirror.value); untone(s.light === "golden" ? "#f2c98a" : "#d9d48a", W.wOil.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t; W.wWind.value = windAt(id);
    const calm = calmAt(id, t), cv = W.wCalm.value as THREE.Vector4[];
    cv.forEach((v, i) => { const p = calm[i]; if (p) v.set(p[0], p[1], p[2], p[3]); else v.set(0, 0, 0, 0); });
    const wk = wakesAt(t), wv = W.wWake.value as THREE.Vector4[];
    wv.forEach((v, i) => v.set(wk[i][0], wk[i][1], wk[i][2], wk[i][3]));
    W.wWakeR.value = s.scene === "sea" ? wk[0][4] : 0;
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;

    // ---- the ships ----
    this.ships.forEach((sh, k) => {
      const [x, z] = shipAt(k, t);
      sh.g.visible = s.scene === "sea";
      sh.g.position.set(x, SEA_Y + 0.05 * Math.sin(t * 1.4 + k), z - SHIPZ * SHIP_S);
      sh.g.rotation.z = 0.012 * Math.sin(t * 1.1 + k);
      sh.sails.forEach((m, i) => { m.rotation.y = 0.05 * Math.sin(t * 1.7 + i + k); });
    });

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
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade, wMirror, wOil;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime, wWind, wWakeR;
uniform vec4 wCalm[4];
uniform vec4 wWake[2];
float segD(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a; float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0); return length(p - a - ab * h); }`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  // calm: oil patches (radius grows smoothly) and the smooth wakes behind two ships
  float calm = 0.0, oil = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 c = wCalm[i];
    if (c.z > 0.0) { float k = 1.0 - smoothstep(c.z * 0.82 - 0.4, c.z + 0.6, length(vWP.xz - c.xy)); calm = max(calm, k); oil = max(oil, k * c.w); }
  }
  if (wWakeR > 0.0) for (int i = 0; i < 2; i++) {
    float d = segD(vWP.xz, wWake[i].xy, wWake[i].zw), along = clamp(dot(vWP.xz - wWake[i].xy, normalize(wWake[i].zw - wWake[i].xy)) / length(wWake[i].zw - wWake[i].xy), 0.0, 1.0);
    calm = max(calm, (1.0 - smoothstep(wWakeR * (0.6 + 1.4 * along), wWakeR * (0.6 + 1.4 * along) + 2.5, d)) * (1.0 - smoothstep(0.75, 1.0, along)));
  }
  // wind ripples drifting downwind (-x): painted marks plus procedural ripple crests up close
  vec2 wp = vWP.xz + vec2(1.1 * wWind * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 2.6), texture2D(wFarTex, wp / 26.0 + 0.37), smoothstep(25.0, 90.0, wd));
  float rp = sin(wp.x * 2.3 + 1.6 * sin(vWP.z * 0.7)) * sin(vWP.z * 1.15 + wp.x * 0.45 + 0.8 * sin(wp.x * 0.3));
  float near = 1.0 - smoothstep(18.0, 60.0, wd);
  float crest = max(mk.r * 0.8, smoothstep(0.42, 0.62, rp) * 0.75 * near * wWind);
  float trough = max(mk.g * 0.6, smoothstep(-0.4, -0.75, rp) * 0.45 * near * wWind);
  float rough = 1.0 - calm;
  vec3 wr = mix(wc, wTrough, trough * rough);
  wr = mix(wr, wCrest, crest * rough);
  wr = mix(wr, wGlint, mk.b * (0.3 + 0.5 * wf) * rough);
  // smooth water: a looking-glass that shows the sky
  vec3 glass = mix(wc, wMirror, 0.2 + 0.3 * wf);
  wr = mix(wr, glass, calm * 0.85);
  wr = mix(wr, wOil, oil * 0.7);
  diffuseColor.rgb = wr;`;
