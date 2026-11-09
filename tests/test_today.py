import json
import sys
from datetime import datetime, timedelta, timezone
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
    }, videos=["000-bridge", "001-a-story", "002-b-story", "003-c-story"])
    assert p["held"] == [
        {"id": "001-a-story", "reasons": ["too long"], "attempts": 1, "action": "fix"},
        {"id": "002-b-story", "reasons": ["bad", "worse"], "attempts": 2, "action": "drop"},
    ]


def test_held_video_stuck_at_one_attempt_is_dropped_after_three_days():
    now = datetime(2026, 11, 9, 1, 0, tzinfo=timezone.utc)

    def held(updated, attempts=1):
        st = {"status": "held", "reasons": ["r"], "attempts": attempts}
        if updated is not None:
            st["updated"] = updated if isinstance(updated, str) else updated.isoformat(timespec="seconds")
        return today.plan(False, [], {"001-a-story": st}, set(), ["000-bridge", "001-a-story"], [], now=now)["held"][0]["action"]
    assert held(now - timedelta(days=3, minutes=1)) == "drop"
    assert held(now - timedelta(days=3)) == "fix"           # exactly 3 days is not more than 3 days
    assert held(now - timedelta(hours=5)) == "fix"
    assert held(None) == "fix"                              # no time recorded: not stale
    assert held("not a time") == "fix"
    assert held(now - timedelta(days=10), attempts=2) == "drop"


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
    p = plan(render={"001-a-story": {"status": "held", "reasons": ["r"], "attempts": 0}},
             videos=["000-bridge", "001-a-story"])
    json.dumps(p)
    text = today.summary(p)
    assert "make tonight: 1" in text and "001-a-story: fix" in text and "- r" in text


def test_templates_are_never_held_or_queued():
    held = {"status": "held", "reasons": ["r"], "attempts": 1}
    p = today.plan(False, ["000-bridge", "005-tpl-two", "006-real-one"],
                   {"000-bridge": held, "005-tpl-two": held, "006-real-one": held}, set(),
                   ["000-bridge", "005-tpl-two", "006-real-one"], [], templates=["005-tpl-two"])
    assert [h["id"] for h in p["held"]] == ["006-real-one"]
    assert p["queue_count"] == 1
    assert p["next_id"] == "007"
    # 000-bridge is a template even when the caller does not say so
    assert today.plan(False, ["000-bridge"], {"000-bridge": held}, set(), ["000-bridge"], [])["held"] == []


def test_ledger_owns_the_template_id():
    import accept_check
    import ledger
    import writer_check
    assert ledger.TEMPLATE == "000-bridge" == accept_check.TEMPLATE
    assert not hasattr(writer_check, "TEMPLATE")


def test_held_id_without_a_folder_is_skipped():
    # dropped last night: the folder is gone but state/render still says held; it must not be dropped again
    held = {"status": "held", "reasons": ["r"], "attempts": 2}
    p = plan(render={"004-gone-one": held, "005-still-here": held}, videos=["000-bridge", "005-still-here"])
    assert [h["id"] for h in p["held"]] == ["005-still-here"]


class _BrokenStore:
    def names(self):
        raise RuntimeError("gh release view failed: Failed to log in using token")


def test_queue_names_falls_back_to_public_api():
    from tools import today
    data = {"assets": [{"name": "001-a.mp4"}, {"name": "001-a.yml"}]}
    assert today.queue_names(_BrokenStore(), fetch=lambda url: data) == ["001-a.mp4", "001-a.yml"]


def test_queue_names_public_404_is_empty():
    import urllib.error
    from tools import today

    def nf(url):
        raise urllib.error.HTTPError(url, 404, "Not Found", None, None)
    assert today.queue_names(_BrokenStore(), fetch=nf) == []
