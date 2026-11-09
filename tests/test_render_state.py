import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import render_state  # noqa: E402

T0 = datetime(2026, 11, 9, 12, 0, tzinfo=timezone.utc)


def test_set_counts_attempts_on_hold_and_keeps_source(tmp_path):
    a = render_state.set_state(tmp_path, "001-alpha", "held", ["too quiet"], source="abc", now=T0)
    assert a == {"status": "held", "reasons": ["too quiet"], "attempts": 1, "updated": "2026-11-09T12:00:00+00:00",
                 "source": "abc"}
    assert render_state.set_state(tmp_path, "001-alpha", "held", ["still"], source="abc", now=T0)["attempts"] == 2
    c = render_state.set_state(tmp_path, "001-alpha", "queued", [], source="def", now=T0)
    assert c["status"] == "queued" and c["attempts"] == 2 and c["reasons"] == [] and c["source"] == "def"
    assert render_state.load(tmp_path)["001-alpha"] == c


def test_load_ignores_gitkeep(tmp_path):
    (tmp_path / "render").mkdir()
    (tmp_path / "render" / ".gitkeep").write_text("")
    assert render_state.load(tmp_path) == {}


def test_rejects_bad_status_and_ids(tmp_path):
    with pytest.raises(ValueError):
        render_state.set_state(tmp_path, "001-alpha", "posted", [])
    with pytest.raises(ValueError):
        render_state.set_state(tmp_path, "../x", "held", [])


def test_cli_set_with_reasons_and_file(tmp_path):
    f = tmp_path / "reasons.txt"
    f.write_text("width 720 (want 1080)\n\n-starts with a dash\n", encoding="utf-8")
    r = subprocess.run([sys.executable, str(ROOT / "tools" / "render_state.py"), "--state-dir", str(tmp_path / "state"),
                        "set", "001-alpha", "held", "--source", "abc", "--reasons-file", str(f), "--reason", "render failed"],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    st = json.loads((tmp_path / "state" / "render" / "001-alpha.json").read_text())
    assert st["reasons"] == ["render failed", "width 720 (want 1080)", "-starts with a dash"]
    assert st["attempts"] == 1 and st["source"] == "abc"
