"""SCRIPT.md narration -> voice.wav + words.json (Kokoro am_michael, with word timings).

Usage: python tools/voice.py videos/<NNN-slug>
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from script_md import narration  # noqa: E402

VOICE = "am_michael"
SPEED = 1.0
LEAD = 0.25  # seconds of silence before the first word
TAIL = 0.6  # seconds of silence after the last word
SR = 24000
MIN_SECONDS, MAX_SECONDS = 50.0, 68.0


def timings(chunks, lead):
    """chunks: [(tokens, chunk_audio_seconds)] -> [{"w","s","e"}] in seconds.

    Each chunk is offset by the audio length of the chunks before it, and every
    time is shifted by `lead`. Tokens without timestamps are skipped; tokens with
    no letters/digits (punctuation) are merged into the previous word.
    """
    out = []
    offset = 0.0
    for tokens, seconds in chunks:
        for t in tokens:
            text = t.text
            has_time = t.start_ts is not None and t.end_ts is not None
            if not re.search(r"\w", text):
                if out:
                    out[-1]["w"] += text
                    if has_time:
                        out[-1]["e"] = round(max(out[-1]["e"], offset + t.end_ts + lead), 3)
                continue
            if not has_time:
                continue
            out.append({
                "w": text,
                "s": round(offset + t.start_ts + lead, 3),
                "e": round(offset + t.end_ts + lead, 3),
            })
        offset += seconds
    return out


def main(folder):
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    folder = Path(folder)
    text = narration(folder / "SCRIPT.md")
    pipeline = KPipeline(lang_code="a")

    parts = [np.zeros(int(LEAD * SR), dtype=np.float32)]
    chunks = []
    for result in pipeline(text, voice=VOICE, speed=SPEED, split_pattern=r"\n+"):
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

    sf.write(str(folder / "voice.wav"), wav, SR, subtype="PCM_16")
    (folder / "words.json").write_text(json.dumps(words, indent=1) + "\n", encoding="utf-8")
    print(f"{len(words)} words, {duration:.2f} s, {len(words) / duration:.2f} words/s")

    if not MIN_SECONDS <= duration <= MAX_SECONDS:
        sys.exit(f"ERROR: voice is {duration:.1f} s, allowed range is {MIN_SECONDS:.0f}-{MAX_SECONDS:.0f} s "
                 f"(the video is 55-70 s). Edit the narration in {folder / 'SCRIPT.md'}.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python tools/voice.py videos/<NNN-slug>")
    main(sys.argv[1])
