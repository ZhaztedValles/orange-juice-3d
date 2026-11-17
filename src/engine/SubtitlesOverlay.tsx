import React, { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { ensureFont, FAMILY } from "./CaptionsOverlay";
import { phraseAt, phrases } from "./subtitles";
import type { Word } from "./captions";

// All sizes are given at 1080 px height and scaled by height / 1080.
const FONT_PX = 48;
const STROKE_PX = 4;
const BOTTOM = 0.08; // bottom edge of the text, fraction of the height
const MAX_WIDTH = 0.8; // fraction of the width

/** Phrase subtitles (1-2 lines), white Poppins Bold with a dark outline, bottom centre; hard swap, no animation. */
export const Subtitles: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("Loading Poppins Bold for subtitles"));
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
  const ps = React.useMemo(() => phrases(words), [words]);

  if (!ready) return null;
  const i = phraseAt(ps, frame / fps);
  if (i < 0) return null;
  const lines = ps[i].lines;

  const k = height / 1080;
  const stroke = STROKE_PX * k;
  // shrink to fit the widest line within the max width (the outline adds stroke / 2 on each side)
  const widest = lines.reduce((a, b) => (b.length > a.length ? b : a), "");
  const fit = fitText({ text: widest, withinWidth: MAX_WIDTH * width - stroke, fontFamily: FAMILY, fontWeight: 700 }).fontSize;
  const size = Math.min(FONT_PX * k, fit);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: BOTTOM * height,
        textAlign: "center",
        fontFamily: `${FAMILY}, sans-serif`,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.25,
        color: "#fff",
        WebkitTextStroke: `${stroke}px #000`,
        paintOrder: "stroke fill",
        textShadow: `0 ${2 * k}px ${8 * k}px rgba(0,0,0,0.6)`,
      }}
    >
      {lines.map((l, n) => (
        <div key={n} style={{ whiteSpace: "nowrap" }}>
          {l}
        </div>
      ))}
    </div>
  );
};
