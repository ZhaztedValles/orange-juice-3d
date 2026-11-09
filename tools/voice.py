"""SCRIPT.md narration -> voice.wav + words.json (Kokoro am_michael, with word timings).

Usage: python tools/voice.py videos/<NNN-slug> [--keep]
(--keep writes voice.wav/words.json even when a check fails, for listening; still exits 1)
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from script_md import narration  # noqa: E402

VOICE = "am_michael"
SPEED = 1.2  # am_michael at 1.0 runs ~2.9 words/s; Shorts need ~3.7
LEAD = 0.25  # seconds of silence before the first word
TAIL = 0.6  # seconds of silence after the last word
SR = 24000
MIN_SECONDS, MAX_SECONDS = 50.0, 68.0


def timings(chunks, lead):
    """chunks: [(tokens, chunk_audio_seconds)] -> [{"w","s","e"}] in seconds.

    Each chunk is offset by the audio length of the chunks before it, and every
    time is shifted by `lead`. Tokens without timestamps are skipped. A token with
    no letters/digits (punctuation) is handled by its whitespace:
    - the previous token had no trailing whitespace: attach to the previous word
      (and extend its end);
    - otherwise, if this token has no trailing whitespace (an opening quote or
      bracket): prepend it to the next word;
    - otherwise (a standalone spaced dash): drop it.
    """
    out = []
    offset = 0.0
    prev_ws = None  # trailing whitespace of the previous token; None at the very start
    prev_in_out = False  # the previous token ended up in out[-1]
    prefix = ""  # punctuation waiting to be prepended to the next word
    for tokens, seconds in chunks:
        for t in tokens:
            text = t.text
            has_time = t.start_ts is not None and t.end_ts is not None
            ws = t.whitespace or ""
            if not re.search(r"\w", text):
                if out and prev_in_out and prev_ws == "":
                    out[-1]["w"] += text
                    if has_time:
                        out[-1]["e"] = round(max(out[-1]["e"], offset + t.end_ts + lead), 3)
                else:
                    prev_in_out = False
                    if ws == "":
                        prefix += text
                prev_ws = ws
                continue
            prev_ws = ws
            if not has_time:
                prev_in_out = False
                continue
            out.append({
                "w": prefix + text,
                "s": round(offset + t.start_ts + lead, 3),
                "e": round(offset + t.end_ts + lead, 3),
            })
            prefix = ""
            prev_in_out = True
        offset += seconds
    return out


def check_duration(seconds):
    """Error message if the voice length is outside the allowed range, else None."""
    if MIN_SECONDS <= seconds <= MAX_SECONDS:
        return None
    return (f"voice is {seconds:.1f} s, allowed range is {MIN_SECONDS:.0f}-{MAX_SECONDS:.0f} s "
            f"(the video is 55-70 s); edit the narration")


def check_count(words, narration_text):
    """Error message if words.json would not have one entry per narration word, else None."""
    expected = len([w for w in narration_text.split() if re.search(r"\w", w)])
    if len(words) == expected:
        return None
    return (f"word count mismatch: narration has {expected} words, timings have {len(words)} "
            f"(difference {len(words) - expected:+d}); a word was lost or split")


def main(folder, keep=False):
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    folder = Path(folder)
    text = narration(folder / "SCRIPT.md")
    pipeline = KPipeline(lang_code="a")

    parts = [np.zeros(int(LEAD * SR), dtype=np.float32)]
    chunks = []
    # Kokoro splits the text into sentence-sized chunks internally.
    for result in pipeline(text, voice=VOICE, speed=SPEED):
        if result.audio is None:
            continue
        audio = result.audio
        if hasattr(audio, "detach"):
            audio = audio.detach().cpu().numpy()
        audio = np.asarray(audio, dtype=np.float32).reshape(-1)
        parts.append(audio)
        chunks.append((result.tokens or [], len(audio) / SR))
    parts.append(np.zeros(int(TAIL * SR), dtype=np.float32))
    wav = np.concatenate(parts)

    words = timings(chunks, LEAD)
    duration = len(wav) / SR
    print(f"{len(words)} words, {duration:.2f} s, {len(words) / duration:.2f} words/s")

    errors = [e for e in (check_duration(duration), check_count(words, text)) if e]
    if not errors or keep:
        sf.write(str(folder / "voice.wav"), wav, SR, subtype="PCM_16")
        (folder / "words.json").write_text(json.dumps(words, indent=1) + "\n", encoding="utf-8")
    if errors:
        sys.exit("ERROR: " + "; ".join(errors) + (" (files written because of --keep)" if keep else " (nothing written; use --keep to write anyway)"))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--keep"]
    if len(args) != 1:
        sys.exit("usage: python tools/voice.py videos/<NNN-slug> [--keep]")
    main(args[0], keep="--keep" in sys.argv[1:])
