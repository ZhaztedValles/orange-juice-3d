"""Pass / fail gate on a rendered short, from scripts/short_qa.py's --json numbers.

Usage: python tools/qa_gate.py qa.json FRAMES
Prints `pass`, or one fail reason per line and exits 1.
Planned events (flashes, crossfades, deliberate holds) belong in the video's shots.json `planned` / `flash` / `xfade`,
never in looser limits here.
"""
import json
import sys

WIDTH, HEIGHT, FPS, AUDIO_SR = 1080, 1920, 30, 48000
LUFS_MIN, LUFS_MAX = -15.0, -13.0
TRUE_PEAK_MAX = -1.0
MAX_BLACK, MAX_WHITE, MAX_POPS = 3, 3, 2
FROZEN_MAX_LEN, MAX_LONG_FROZEN = 45, 0


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def verdict(qa, frames):
    """fail reasons for short_qa's JSON `qa` against the planned frame count; empty means pass"""
    out = []
    if qa.get("width") != WIDTH:
        out.append(f"width {qa.get('width')} (want {WIDTH})")
    if qa.get("height") != HEIGHT:
        out.append(f"height {qa.get('height')} (want {HEIGHT})")
    fps = qa.get("fps")
    if not _num(fps) or abs(fps - FPS) > 1e-6:
        out.append(f"fps {fps} (want {FPS})")
    if qa.get("frames") != frames:
        out.append(f"frames {qa.get('frames')} (want {frames})")
    sr = qa.get("audio_sr")
    if sr is None:
        out.append("audio stream missing")
    elif sr != AUDIO_SR:
        out.append(f"audio sample rate {sr} Hz (want {AUDIO_SR})")
    lufs = qa.get("lufs")
    if not _num(lufs) or not LUFS_MIN <= lufs <= LUFS_MAX:
        out.append(f"integrated loudness {lufs} LUFS (want {LUFS_MIN:g} to {LUFS_MAX:g})")
    tp = qa.get("true_peak")
    if not _num(tp) or tp > TRUE_PEAK_MAX:
        out.append(f"true peak {tp} dBTP (want <= {TRUE_PEAK_MAX:g})")
    for key, word, limit in (("black", "black", MAX_BLACK), ("white", "white", MAX_WHITE), ("pops", "pop", MAX_POPS)):
        n = qa.get(key)
        if not isinstance(n, int) or n > limit:
            out.append(f"{n} unplanned {word} frames (max {limit})")
    runs = qa.get("frozen")
    if not isinstance(runs, list):
        out.append(f"frozen runs unreadable: {runs!r}")
    else:
        long_ = [r for r in runs if r[1] - r[0] > FROZEN_MAX_LEN]
        if len(long_) > MAX_LONG_FROZEN:
            out.append(f"frozen runs longer than {FROZEN_MAX_LEN} frames: {long_[:10]}")
    return out


def main(argv):
    if len(argv) != 2:
        print("usage: python tools/qa_gate.py qa.json FRAMES", file=sys.stderr)
        return 2
    with open(argv[0], encoding="utf-8") as f:
        qa = json.load(f)
    reasons = verdict(qa, int(argv[1]))
    print("\n".join(reasons) if reasons else "pass")
    return 1 if reasons else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
