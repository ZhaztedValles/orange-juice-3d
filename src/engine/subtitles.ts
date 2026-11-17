// Phrase subtitles for the long videos: group timed words into short 1-2 line phrases (pure, no React / DOM).
import { wordAt, type Word } from "./captions";

/** one subtitle: its lines (at most 2), start / end time in seconds */
export type Phrase = { lines: string[]; s: number; e: number };

export type PhraseOpts = { maxWords?: number; maxLineChars?: number; gap?: number };

/** a phrase ending in , or ; may end early once it has at least this many words */
const MIN_WORDS_AT_COMMA = 6;
const MAX_LINES = 2;

/** greedy wrap of words into lines of at most `max` characters (a longer single word gets its own line) */
function wrap(words: string[], max: number): string[] {
  const lines: string[] = [];
  for (const w of words) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + 1 + w.length <= max) lines[last] += ` ${w}`;
    else lines.push(w);
  }
  return lines;
}

/**
 * Group words (sorted by start) into phrases. A phrase ends after a word ending in . ! ?, before a pause longer than
 * `gap` seconds, at `maxWords`, after a , or ; once it has 6 words, or earlier when it would need a third line.
 */
export function phrases(words: Word[], opts: PhraseOpts = {}): Phrase[] {
  const { maxWords = 10, maxLineChars = 42, gap = 0.4 } = opts;
  const out: Phrase[] = [];
  let cur: Word[] = [];

  const flush = () => {
    if (cur.length === 0) return;
    out.push({ lines: wrap(cur.map((x) => x.w), maxLineChars), s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };

  words.forEach((word, i) => {
    // a third line would be needed: end the phrase before this word
    if (cur.length > 0 && wrap([...cur, word].map((x) => x.w), maxLineChars).length > MAX_LINES) flush();
    cur.push(word);
    const next = words[i + 1];
    const ends =
      !next ||
      /[.!?]["'”’)]*$/.test(word.w) ||
      next.s - word.e > gap ||
      cur.length >= maxWords ||
      (/[,;]$/.test(word.w) && cur.length >= MIN_WORDS_AT_COMMA);
    if (ends) flush();
  });
  return out;
}

/**
 * Index of the phrase to show at time t (seconds), or -1 for none. Same timing rule as the one-word captions
 * (`wordAt`): a phrase shows from its start until the next one's start, or until e + 0.15 before a pause over
 * 0.4 s; the last shows until e + 0.3.
 */
export function phraseAt(ps: Phrase[], t: number): number {
  return wordAt(
    ps.map((p) => ({ w: "", s: p.s, e: p.e })),
    t,
  );
}
