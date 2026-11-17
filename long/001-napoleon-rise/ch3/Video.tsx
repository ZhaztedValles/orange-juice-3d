// Chapter 3 of "The Rise of Napoleon": "The Guns of Toulon" (1789-1793). Same post chain as the sample chapter
// (long/000-sample/ch1): InkPass -> lens blur pre + main -> [bloom + NEUTRAL tone map + grade], MSAA 4. Place and time
// jumps crossfade by stacking a second canvas. The night assault uses a cooled, darker grade of its own (no crushed
// blacks: the curve keeps the darks lifted).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "../../../src/engine/ink";
import { LensBlur, GrainEffect } from "../../../src/engine/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, GradeParams, gradeFor } from "../../../src/engine/grade";
import { Kit } from "../../../src/engine/build";
import { TOTAL, FLASH_AT, SHOTS, layersAt, dofAt } from "./story";

// A number literal: audio/spec.py reads it with a regex. Must equal the story length.
export const FRAMES = 3039;
if (FRAMES !== TOTAL) throw new Error(`FRAMES ${FRAMES} != story TOTAL ${TOTAL}`);

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain is sized for a fixed 1080-px short side (it starts
 *  at 960x540 for 16:9) whatever the output size, so the glow keeps the Shorts' size relative to the short side.
 *  ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1080 * w) / Math.max(h, 1)), 1080);
  return b;
};

/** rainy night: cool split tone, gentle S that keeps the darks lifted, stronger vignette */
const GRADE_NIGHT: GradeParams = {
  ky: [0.02, 0.11, 0.27, 0.55, 0.8, 0.93, 1],
  sat: [0.85, 0.9, 0.95],
  tintS: [0.035, -0.012], tintM: [0.025, -0.01], tintH: [0.01, 0],
  vig: [0.3, 0.38],
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("napoleon ch3 kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => {
    // EffectComposer's children type is Element | Element[] (no nulls), so build the pass list and filter it.
    const passes = [
      on.ink && <primitive key="ink" object={fx.ink} dispose={null} />,
      on.lens && on.pre && <primitive key="pre" object={fx.lens.pre} dispose={null} />,
      on.lens && <primitive key="lens" object={fx.lens.main} dispose={null} />,
      on.bloom && <primitive key="bloom" object={fx.bloom} dispose={null} />,
      <primitive key="tone" object={fx.tone} dispose={null} />,
      on.grade && <primitive key="grade" object={fx.grade} dispose={null} />,
      on.grain && <primitive key="grain" object={fx.grain} dispose={null} />,
    ].filter((e): e is React.JSX.Element => !!e);
    return <EffectComposer multisampling={4}>{passes}</EffectComposer>;
  }, [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  const light = SHOTS[id - 1].light;
  if (light === "night") { const tag = fx.grade as unknown as { _light?: string }; if (tag._light !== "night") { fx.grade.set(GRADE_NIGHT); tag._light = "night"; } fx.grade.amount = 1; }
  else gradeFor(fx.grade, light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1920} height={1080} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 23, near: 0.2, far: 1500 }}>
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

const NapoleonCh3: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  return (
    <AbsoluteFill style={{ background: "#cfd9e6" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
    </AbsoluteFill>
  );
};

export default NapoleonCh3;
