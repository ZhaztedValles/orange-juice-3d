import React from "react";
import { AbsoluteFill, getInputProps } from "remotion";
import { Subtitles } from "./SubtitlesOverlay";
import { ChapterTitle } from "./ChapterTitle";
import type { Word } from "./captions";

/**
 * Renders `children` (a long-video chapter) with phrase subtitles, then the chapter title card, on top. No subtitles
 * when `words` is null, or when the input props say `{"captions": false}` (writer review stills). The title card shows
 * regardless. `{"__testWords": Word[]}` overrides `words`: test-only, as in `WithCaptions`.
 */
export const WithLongOverlay: React.FC<{
  words: Word[] | null;
  chapter: { n: number; title: string };
  children: React.ReactNode;
}> = ({ words, chapter, children }) => {
  const props = getInputProps() as { captions?: boolean; __testWords?: Word[] };
  const shown = props.__testWords ?? words;
  const on = props.captions !== false && shown !== null && shown.length > 0;
  return (
    <>
      {children}
      {on ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <Subtitles words={shown} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <ChapterTitle n={chapter.n} title={chapter.title} />
      </AbsoluteFill>
    </>
  );
};
