import sys
from pathlib import Path
from types import SimpleNamespace as T

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import script_md  # noqa: E402
import voice  # noqa: E402


def test_narration_between_markers(tmp_path):
    p = tmp_path / "SCRIPT.md"
    p.write_text("# Facts\n- a\n<!-- narration -->\nIn eighteen fifty,\n  soldiers marched.\n<!-- /narration -->\nnotes", encoding="utf-8")
    assert script_md.narration(p) == "In eighteen fifty, soldiers marched."


def test_narration_rejects_digits(tmp_path):
    p = tmp_path / "SCRIPT.md"
    p.write_text("<!-- narration -->\nIn 1850 they marched.\n<!-- /narration -->", encoding="utf-8")
    with pytest.raises(ValueError, match="digit"):
        script_md.narration(p)


def test_narration_requires_markers(tmp_path):
    p = tmp_path / "SCRIPT.md"
    p.write_text("no markers", encoding="utf-8")
    with pytest.raises(ValueError, match="narration"):
        script_md.narration(p)


def test_timings_offsets_chunks_and_merges_punctuation():
    chunk1 = [T(text="In", start_ts=0.0, end_ts=0.2, whitespace=" "), T(text="Angers", start_ts=0.2, end_ts=0.7, whitespace=""),
              T(text=",", start_ts=0.7, end_ts=0.75, whitespace=" ")]
    chunk2 = [T(text="soldiers", start_ts=0.1, end_ts=0.6, whitespace="")]
    out = voice.timings([(chunk1, 1.0), (chunk2, 0.8)], lead=0.25)
    assert out == [
        {"w": "In", "s": 0.25, "e": 0.45},
        {"w": "Angers,", "s": 0.45, "e": 1.0},
        {"w": "soldiers", "s": 1.35, "e": 1.85},
    ]


def test_timings_skips_tokens_without_times():
    chunk = [T(text="Hi", start_ts=None, end_ts=None, whitespace=" "), T(text="there", start_ts=0.3, end_ts=0.6, whitespace="")]
    assert voice.timings([(chunk, 0.7)], lead=0.0) == [{"w": "there", "s": 0.3, "e": 0.6}]


def test_timings_opening_quote_prepended_to_next_word():
    chunk = [T(text="He", start_ts=0.0, end_ts=0.2, whitespace=" "), T(text="said", start_ts=0.2, end_ts=0.4, whitespace=" "),
             T(text='"', start_ts=0.4, end_ts=0.45, whitespace=""), T(text="hello", start_ts=0.45, end_ts=0.8, whitespace=""),
             T(text='."', start_ts=0.8, end_ts=0.85, whitespace=" ")]
    out = voice.timings([(chunk, 1.0)], lead=0.0)
    assert [w["w"] for w in out] == ["He", "said", '"hello."']
    assert out[2]["s"] == 0.45 and out[2]["e"] == 0.85


def test_timings_standalone_spaced_dash_dropped():
    chunk = [T(text="wait", start_ts=0.0, end_ts=0.3, whitespace=" "), T(text="—", start_ts=0.3, end_ts=0.35, whitespace=" "),
             T(text="now", start_ts=0.35, end_ts=0.6, whitespace="")]
    assert voice.timings([(chunk, 0.7)], lead=0.0) == [
        {"w": "wait", "s": 0.0, "e": 0.3},
        {"w": "now", "s": 0.35, "e": 0.6},
    ]


def test_timings_leading_punctuation_prepended_to_first_word():
    chunk = [T(text="“", start_ts=0.0, end_ts=0.05, whitespace=""), T(text="Go", start_ts=0.05, end_ts=0.3, whitespace="")]
    assert voice.timings([(chunk, 0.4)], lead=0.0) == [{"w": "“Go", "s": 0.05, "e": 0.3}]


def test_check_duration():
    assert voice.check_duration(60.0) is None
    assert voice.check_duration(50.0) is None
    assert voice.check_duration(68.0) is None
    assert "75.6" in voice.check_duration(75.6)
    assert "50" in voice.check_duration(49.9) and "68" in voice.check_duration(49.9)


def test_check_count():
    words = [{"w": "In"}, {"w": "Angers,"}, {"w": "soldiers"}]
    assert voice.check_count(words, "In Angers, soldiers") is None
    assert voice.check_count(words, "In Angers, soldiers — marched.") is not None  # one word lost
    assert voice.check_count(words, "In Angers — soldiers") is None  # standalone dash is not a word
    msg = voice.check_count(words[:2], "In Angers, soldiers")
    assert "2" in msg and "3" in msg and "1" in msg
