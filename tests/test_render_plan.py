import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import render_plan  # noqa: E402
import video_check  # noqa: E402

T0 = datetime(2026, 11, 9, 12, 0, tzinfo=timezone.utc)


def test_chunks_cover_every_frame_once():
    c = render_plan.chunks(2025, 16)
    assert len(c) == 16 and c[0]["from"] == 0 and c[-1]["to"] == 2024
    assert all(a["to"] + 1 == b["from"] for a, b in zip(c, c[1:]))
    assert [x["idx"] for x in c[:2]] == ["000", "001"]


def test_chunks_never_more_than_frames():
    assert len(render_plan.chunks(5, 16)) == 5


def test_chunks_match_the_spike_cuts():
    c = render_plan.chunks(2025, 16)
    assert [x["from"] for x in c] == [round(i * 2025 / 16) for i in range(16)]


# --- next_video ---------------------------------------------------------------------------------

@pytest.fixture
def repo(tmp_path, monkeypatch):
    """videos/ with a template and three ordinary folders; only `ok` ids pass video_check"""
    videos = tmp_path / "videos"
    for name, tpl in (("000-bridge", True), ("001-alpha", False), ("002-beta", False), ("003-gamma", False)):
        (videos / name).mkdir(parents=True)
        (videos / name / "meta.yml").write_text(f"title: x\ntemplate: {'true' if tpl else 'false'}\n", encoding="utf-8")
    ok = {"000-bridge", "001-alpha", "002-beta", "003-gamma"}
    monkeypatch.setattr(video_check, "problems", lambda folder: [] if Path(folder).name in ok else ["x"])
    return videos, ok


def pick(videos, queue=(), states=None, commit=T0):
    return render_plan.next_video(videos, list(queue), states or {}, last_commit=lambda folder: commit)


def held(updated):
    return {"status": "held", "reasons": ["r"], "attempts": 1, "updated": updated.isoformat()}


def test_picks_the_lowest_id_and_skips_templates(repo):
    videos, _ = repo
    assert pick(videos) == "001-alpha"


def test_skips_folders_that_fail_video_check(repo):
    videos, ok = repo
    ok.discard("001-alpha")
    assert pick(videos) == "002-beta"


def test_skips_queued(repo):
    videos, _ = repo
    assert pick(videos, queue=["001-alpha.mp4", "001-alpha.yml"]) == "002-beta"


def test_skips_posted(repo):
    videos, _ = repo
    posted = videos.parent / "state" / "posted"
    posted.mkdir(parents=True)
    (posted / "001-alpha.json").write_text("{}")
    assert pick(videos) == "002-beta"


def test_skips_held_until_recommitted(repo):
    videos, _ = repo
    states = {"001-alpha": held(T0)}
    assert pick(videos, states=states, commit=T0 - timedelta(hours=1)) == "002-beta"
    assert pick(videos, states=states, commit=T0) == "002-beta"
    assert pick(videos, states=states, commit=T0 + timedelta(minutes=1)) == "001-alpha"


def test_held_with_unknown_commit_time_stays_held(repo):
    videos, _ = repo
    assert pick(videos, states={"001-alpha": held(T0)}, commit=None) == "002-beta"


def test_none_when_nothing_to_render(repo):
    videos, _ = repo
    names = [f"{v}.mp4" for v in ("001-alpha", "002-beta")]
    assert pick(videos, queue=names, states={"003-gamma": held(T0)}) is None


def test_load_states_reads_state_render(tmp_path):
    d = tmp_path / "state" / "render"
    d.mkdir(parents=True)
    (d / "001-alpha.json").write_text('{"status": "held", "reasons": [], "attempts": 2, "updated": "2026-11-09T12:00:00+00:00"}')
    (d / ".gitkeep").write_text("")
    assert render_plan.load_states(tmp_path / "state")["001-alpha"]["attempts"] == 2


def test_set_state_counts_attempts_on_hold(tmp_path):
    st = tmp_path / "state"
    a = render_plan.set_state(st, "001-alpha", "held", ["too quiet"], now=T0)
    assert a == {"status": "held", "reasons": ["too quiet"], "attempts": 1, "updated": "2026-11-09T12:00:00+00:00"}
    b = render_plan.set_state(st, "001-alpha", "held", ["still"], now=T0)
    assert b["attempts"] == 2
    c = render_plan.set_state(st, "001-alpha", "queued", [], now=T0)
    assert c["status"] == "queued" and c["attempts"] == 2 and c["reasons"] == []
    assert render_plan.load_states(st)["001-alpha"] == c
