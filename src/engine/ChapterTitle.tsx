import React, { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ensureFont, FAMILY } from "./CaptionsOverlay";

// All sizes are given at 1080 px height and scaled by height / 1080.
const TITLE_PX = 96;
const LABEL_PX = 36;
const STROKE_PX = 5;
const CARD_FRAMES = 90; // 3 s at 30 fps
const FADE_IN_END = 10;
const FADE_OUT_START = 75;

/** Chapter title card over the first 3 s: small "CHAPTER n" above a big title, centred on a soft dark band. */
export const ChapterTitle: React.FC<{ n: number; title: string }> = ({ n, title }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("Loading Poppins Bold for the chapter title"));
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

  if (!ready || frame >= CARD_FRAMES) return null;
  const opacity = interpolate(frame, [0, FADE_IN_END, FADE_OUT_START, CARD_FRAMES], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const k = height / 1080;
  const base: React.CSSProperties = {
    fontFamily: `${FAMILY}, sans-serif`,
    fontWeight: 700,
    color: "#fff",
    textAlign: "center",
    paintOrder: "stroke fill",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        opacity,
        padding: `${90 * k}px ${0.1 * width}px`,
        background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0))",
      }}
    >
      <div style={{ ...base, fontSize: LABEL_PX * k, lineHeight: 1.2, letterSpacing: 6 * k, opacity: 0.85 }}>CHAPTER {n}</div>
      <div
        style={{
          ...base,
          fontSize: TITLE_PX * k,
          lineHeight: 1.15,
          marginTop: 12 * k,
          WebkitTextStroke: `${STROKE_PX * k}px #000`,
        }}
      >
        {title}
      </div>
    </div>
  );
};
