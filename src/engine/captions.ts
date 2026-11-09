// Word-timed one-word captions: the word type and the timing rule (pure, no React / DOM).
/** one spoken word: text and its start / end time in seconds (from videos/<id>/words.json) */
export type Word = { w: string; s: number; e: number };

/** a word that is followed by a pause longer than this (s) disappears early */
const LONG_GAP = 0.4;
/** how long (s) after its end a word stays up before a long pause */
const HOLD_BEFORE_PAUSE = 0.15;
/** how long (s) after its end the last word stays up */
const HOLD_LAST = 0.3;

/**
 * Index of the word to show at time t (seconds), or -1 for none. `words` must be sorted by start `s`.
 * A word shows from its start until the next word's start; if the gap from its end to the next start is over
 * 0.40 s it disappears at e + 0.15 instead; the last word shows until e + 0.30; nothing shows before the first start.
 */
export function wordAt(words: Word[], t: number): number {
  // binary search: last word with s <= t
  let lo = 0;
  let hi = words.length - 1;
  let i = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid].s <= t) {
      i = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (i < 0) return -1;
  const w = words[i];
  const next = words[i + 1];
  if (!next) return t < w.e + HOLD_LAST ? i : -1;
  if (next.s - w.e > LONG_GAP) return t < w.e + HOLD_BEFORE_PAUSE ? i : -1;
  return i;
}

/** the word as shown: leading / trailing punctuation stripped except ' and -, case kept */
export function cleanWord(w: string): string {
  return w.replace(/^[^\p{L}\p{N}'-]+|[^\p{L}\p{N}'-]+$/gu, "");
}
