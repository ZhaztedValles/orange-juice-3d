import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import status  # noqa: E402
import today  # noqa: E402


def plan(paused=False, queue=(), render=None, posted=(), videos=("000-bridge",), entries=()):
    return today.plan(paused, list(queue), render or {}, set(posted), list(videos), list(entries))


def test_paused_makes_nothing():
    p = plan(paused=True)
    assert p["paused"] is True and p["make"] == 0


def test_not_paused_makes_one():
    p = plan()
    assert p["paused"] is False and p["make"] == 1


def test_held_attempts_decide_fix_or_drop():
    p = plan(render={
        "001-a-story": {"status": "held", "reasons": ["too long"], "attempts": 1},
        "002-b-story": {"status": "held", "reasons": ["bad", "worse"], "attempts": 2},
        "003-c-story": {"status": "queued", "reasons": [], "attempts": 0},
    })
    assert p["held"] == [
        {"id": "001-a-story", "reasons": ["too long"], "attempts": 1, "action": "fix"},
        {"id": "002-b-story", "reasons": ["bad", "worse"], "attempts": 2, "action": "drop"},
    ]


def test_next_id_skips_existing_including_template():
    assert plan(videos=["000-bridge"])["next_id"] == "001"
    assert plan(videos=["000-bridge", "012-x"])["next_id"] == "013"
    assert plan(videos=[])["next_id"] == "001"


def test_next_id_does_not_reuse_a_ledger_number():
    e = [{"id": "007-gone", "status": "dropped"}, {"id": "idea-x"}, "junk"]
    assert plan(videos=["000-bridge", "003-x"], entries=e)["next_id"] == "008"


def test_counts():
    p = plan(queue=["001-a-story", "002-b-story"], posted={"000-old-one"})
    assert p["queue_count"] == 2 and p["posted_count"] == 1


def test_queued_ids_from_asset_names():
    names = ["001-a-story.mp4", "001-a-story.yml", "002-b-story.yml"]
    assert status.queued_ids(names) == ["001-a-story"]
    assert status.queued_count(names) == 1


def test_summary_and_json_are_serialisable():
    p = plan(render={"001-a-story": {"status": "held", "reasons": ["r"], "attempts": 0}})
    json.dumps(p)
    text = today.summary(p)
    assert "make tonight: 1" in text and "001-a-story: fix" in text and "- r" in text
