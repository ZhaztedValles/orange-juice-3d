"""short_qa --json on a synthetic clip: 1 s of moving test pattern, then a 2 s still hold (frames 29-89 identical)."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="needs ffmpeg")


@pytest.fixture(scope="module")
def clip(tmp_path_factory):
    d = tmp_path_factory.mktemp("clip")
    mp4 = d / "hold.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=180x320:r=30:d=1",
                    "-vf", "tpad=stop_mode=clone:stop_duration=2", "-c:v", "libx264", "-qp", "0", "-pix_fmt", "yuv420p",
                    str(mp4)], check=True)
    return mp4


def qa(clip, tmp_path, shots):
    sj = tmp_path / "shots.json"
    sj.write_text(json.dumps(shots))
    out = tmp_path / "qa.json"
    subprocess.run([sys.executable, str(ROOT / "scripts" / "short_qa.py"), str(clip), str(tmp_path / "qa"), str(sj),
                    "--json", str(out)], check=True, capture_output=True)
    return json.loads(out.read_text())


def test_trailing_hold_counts_as_frozen(clip, tmp_path):
    r = qa(clip, tmp_path, {"shots": []})
    assert r["frames"] == 90 and r["audio_sr"] is None and r["lufs"] is None
    assert r["frozen"] == [[29, 89]]


def test_planned_hold_is_not_frozen(clip, tmp_path):
    assert qa(clip, tmp_path, {"shots": [], "planned": [[29, 89]]})["frozen"] == []
