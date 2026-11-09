import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import qa_gate  # noqa: E402

FRAMES = 2025


def good(**kw):
    qa = {"width": 1080, "height": 1920, "fps": 30.0, "frames": FRAMES, "audio_sr": 48000,
          "lufs": -14.0, "true_peak": -1.5, "black": 0, "white": 0, "pops": 0, "frozen": []}
    qa.update(kw)
    return qa


def fails(qa, needle):
    r = qa_gate.verdict(qa, FRAMES)
    return any(needle in x for x in r)


def test_good_passes():
    assert qa_gate.verdict(good(), FRAMES) == []


def test_limits_inclusive():
    assert qa_gate.verdict(good(lufs=-15.0, true_peak=-1.0, black=3, white=3, pops=2, frozen=[[10, 54]]), FRAMES) == []
    assert qa_gate.verdict(good(lufs=-13.0), FRAMES) == []


def test_width():
    assert fails(good(width=720), "width")


def test_height():
    assert fails(good(height=1280), "height")


def test_fps():
    assert fails(good(fps=29.97), "fps")


def test_frame_count():
    assert fails(good(frames=FRAMES - 1), "frames")


def test_audio_missing():
    assert fails(good(audio_sr=None), "audio")


def test_audio_rate():
    assert fails(good(audio_sr=44100), "48000")


def test_loudness_too_quiet():
    assert fails(good(lufs=-15.1), "loudness")


def test_loudness_too_loud():
    assert fails(good(lufs=-12.9), "loudness")


def test_loudness_missing():
    assert fails(good(lufs=None), "loudness")


def test_true_peak():
    assert fails(good(true_peak=-0.9), "true peak")


def test_black():
    assert fails(good(black=4), "black")


def test_white():
    assert fails(good(white=4), "white")


def test_pops():
    assert fails(good(pops=3), "pop")


def test_frozen():
    # [start, end] are frame numbers, both inclusive: [100, 145] is 46 identical frames
    assert fails(good(frozen=[[100, 145]]), "frozen")
    assert not fails(good(frozen=[[100, 144]]), "frozen")
