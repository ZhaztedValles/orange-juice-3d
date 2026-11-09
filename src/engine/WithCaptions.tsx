import React from "react";
import { AbsoluteFill, getInputProps } from "remotion";
import { Captions } from "./CaptionsOverlay";
import type { Word } from "./captions";

/**
 * Renders `children` with the one-word captions on top. No captions when `words` is null, or when the input props
 * say `{"captions": false}` (writer review stills). `{"__testWords": Word[]}` overrides `words`: test-only, used for
 * visual checks of the overlay on a video that has no words.json.
 */
export const WithCaptions: React.FC<{ words: Word[] | null; children: React.ReactNode }> = ({ words, children }) => {
  const props = getInputProps() as { captions?: boolean; __testWords?: Word[] };
  const shown = props.__testWords ?? words;
  const on = props.captions !== false && shown !== null && shown.length > 0;
  return (
    <>
      {children}
      {on ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <Captions words={shown} />
        </AbsoluteFill>
      ) : null}
    </>
  );
};
