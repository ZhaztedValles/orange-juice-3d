import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import render_plan  # noqa: E402
import video_check  # noqa: E402

SHA_A, SHA_B = "a" * 40, "b" * 40


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


def pick(videos, queue=(), states=None, sha=SHA_A):
    return render_plan.next_video(videos, list(queue), states or {}, folder_sha=lambda folder: sha)


def held(source=SHA_A):
    st = {"status": "held", "reasons": ["r"], "attempts": 1, "updated": "2026-11-09T12:00:00+00:00"}
    if source is not None:
        st["source"] = source
    return st


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


def test_held_same_source_is_skipped(repo):
    videos, _ = repo
    assert pick(videos, states={"001-alpha": held(SHA_A)}, sha=SHA_A) == "002-beta"


def test_held_different_source_is_eligible(repo):
    videos, _ = repo
    assert pick(videos, states={"001-alpha": held(SHA_A)}, sha=SHA_B) == "001-alpha"


def test_held_without_source_is_eligible(repo):
    videos, _ = repo
    assert pick(videos, states={"001-alpha": held(None)}, sha=SHA_A) == "001-alpha"


def test_held_with_unknown_current_sha_stays_held(repo):
    videos, _ = repo
    assert pick(videos, states={"001-alpha": held(SHA_A)}, sha=None) == "002-beta"


def test_none_when_nothing_to_render(repo):
    videos, _ = repo
    names = [f"{v}.mp4" for v in ("001-alpha", "002-beta")]
    assert pick(videos, queue=names, states={"003-gamma": held(SHA_A)}) is None


# --- plan() and the CLI ---------------------------------------------------------------------------

@pytest.fixture
def cli(repo, monkeypatch):
    videos, ok = repo
    monkeypatch.setattr(render_plan, "VIDEOS", videos)
    monkeypatch.setattr(render_plan, "STATE", videos.parent / "state")
    monkeypatch.setattr(render_plan, "queue_names", lambda: [])
    monkeypatch.setattr(render_plan, "folder_sha", lambda folder: SHA_A)
    for v in videos.iterdir():
        (v / "Video.tsx").write_text("export const FRAMES = 1800;\n", encoding="utf-8")
    return videos, ok


def test_plan_empty(cli):
    videos, ok = cli
    ok.clear()
    assert render_plan.plan() == {"video": None, "frames": 0, "template": False, "source": None,
                                  "matrix": {"include": []}}


def test_plan_picks_with_source_and_matrix(cli):
    p = render_plan.plan()
    assert p["video"] == "001-alpha" and p["frames"] == 1800 and p["source"] == SHA_A and p["template"] is False
    assert len(p["matrix"]["include"]) == 16


def test_cli_video_template_skips_eligibility(cli, capsys):
    assert render_plan.main(["--video", "000-bridge"]) == 0
    out = json.loads(capsys.readouterr().out)
    assert out["video"] == "000-bridge" and out["template"] is True


def test_cli_video_failing_check_exits_1_with_problems(cli, capsys, monkeypatch):
    monkeypatch.setattr(video_check, "problems", lambda folder: ["Video.tsx: bad thing"])
    assert render_plan.main(["--video", "001-alpha"]) == 1
    err = capsys.readouterr().err
    assert "001-alpha fails video_check" in err and "Video.tsx: bad thing" in err


def test_cli_rejects_non_ids(cli):
    with pytest.raises(SystemExit):
        render_plan.main(["--video", "../etc"])


# --- piece checks ---------------------------------------------------------------------------------

def probe(fmt="mov,mp4,m4a,3gp,3g2,mj2", streams=None, frames=127):
    return {"format": {"format_name": fmt},
            "streams": streams if streams is not None else
            [{"codec_type": "video", "codec_name": "h264", "width": 1080, "height": 1920, "nb_read_frames": str(frames)}]}


def test_piece_ok():
    assert render_plan.piece_problems(probe(), 127) == []


def test_piece_wrong_container():
    assert render_plan.piece_problems(probe(fmt="matroska,webm"), 127)


def test_piece_wrong_codec_size_frames():
    s = [{"codec_type": "video", "codec_name": "hevc", "width": 720, "height": 1280, "nb_read_frames": "120"}]
    ps = render_plan.piece_problems(probe(streams=s), 127)
    assert any("hevc" in p for p in ps) and any("720x1280" in p for p in ps) and any("120" in p for p in ps)


def test_piece_extra_stream():
    s = probe()["streams"] + [{"codec_type": "audio", "codec_name": "aac"}]
    assert render_plan.piece_problems(probe(streams=s), 127)


def test_check_pieces_missing_and_extra_files(tmp_path, monkeypatch):
    monkeypatch.setattr(render_plan, "probe_piece", lambda path: probe(frames=3))
    cs = render_plan.chunks(6, 2)
    (tmp_path / "piece_000.mp4").write_bytes(b"")
    (tmp_path / "piece_009.mp4").write_bytes(b"")
    ps = render_plan.check_pieces(tmp_path, cs)
    assert any("piece_001.mp4 missing" in p for p in ps) and any("piece_009.mp4" in p and "unexpected" in p for p in ps)
