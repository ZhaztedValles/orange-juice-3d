import React, { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { fitText } from "@remotion/layout-utils";
import { cleanWord, wordAt, type Word } from "./captions";

const FAMILY = "Poppins";
// Poppins hhea metrics (units per em): ascender 1050, descender 350. With line-height 1em the baseline sits at
// (1 - (1.05 + 0.35)) / 2 + 1.05 = 0.85 em below the top of the line box.
const BASELINE_IN_LINE = 0.85;

// All sizes are given at 1920 px height and scaled by height / 1920.
const FONT_PX = 92;
const STROKE_PX = 7;
const BASELINE_AT = 0.74; // fraction of the height
const MAX_WIDTH = 0.9; // fraction of the width

let fontPromise: Promise<void> | null = null;
/** load Poppins Bold once (browser only: called from an effect, never at module scope) */
const ensureFont = (): Promise<void> =>
  (fontPromise ??= loadFont({ family: FAMILY, url: staticFile("fonts/Poppins-Bold.ttf"), weight: "700" }));

/** One word at a time, white Poppins Bold with a thin black outline, lower middle; hard swap, no animation. */
export const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("Loading Poppins Bold for captions"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    ensureFont().then(
      () => {
        setReady(true);
        continueRender(handle);
      },
      (err) => cancelRender(err),
    );
  }, [handle]);

  if (!ready) return null;
  const i = wordAt(words, frame / fps);
  const text = i < 0 ? "" : cleanWord(words[i].w);
  if (!text) return null;

  const k = height / 1920;
  const stroke = STROKE_PX * k;
  // shrink to fit: the outline adds stroke / 2 on each side of the glyphs
  const fit = fitText({ text, withinWidth: MAX_WIDTH * width - stroke, fontFamily: FAMILY, fontWeight: 700 }).fontSize;
  const size = Math.min(FONT_PX * k, fit);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        // line box top = baseline y - baseline offset inside the line box
        top: BASELINE_AT * height - BASELINE_IN_LINE * size,
        textAlign: "center",
        fontFamily: `${FAMILY}, sans-serif`,
        fontWeight: 700,
        fontSize: size,
        lineHeight: `${size}px`,
        whiteSpace: "nowrap",
        color: "#fff",
        WebkitTextStroke: `${stroke}px #000`,
        paintOrder: "stroke fill",
      }}
    >
      {text}
    </div>
  );
};
