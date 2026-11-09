import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import status  # noqa: E402

NOW = datetime(2026, 11, 9, 1, 0, tzinfo=timezone.utc)
FRESH = NOW - timedelta(hours=3)
LOW = "Orange Juice: queue low"
SILENT = "Orange Juice: writer silent"
HELD = "Orange Juice: videos held"


def titles(*a, **k):
    return [t for t, _ in status.alerts(*a, **k)]


def test_titles_are_fixed():
    assert status.TITLES == (LOW, SILENT, HELD)


def test_queue_low_triggers_below_two_per_slot():
    assert LOW in titles(1, ["19:00"], FRESH, {}, NOW)
    assert LOW in titles(3, ["12:00", "19:00"], FRESH, {}, NOW)
    body = dict(status.alerts(0, ["19:00"], FRESH, {}, NOW))[LOW]
    assert "Only 0 video" in body and "at least 2" in body


def test_queue_low_does_not_trigger_at_threshold():
    assert titles(2, ["19:00"], FRESH, {}, NOW) == []
    assert titles(4, ["12:00", "19:00"], FRESH, {}, NOW) == []


def test_writer_silent_triggers_after_36_hours():
    assert SILENT in titles(9, ["19:00"], NOW - timedelta(hours=36, minutes=1), {}, NOW)


def test_writer_silent_does_not_trigger_within_36_hours():
    assert titles(9, ["19:00"], NOW - timedelta(hours=36), {}, NOW) == []
    assert titles(9, ["19:00"], NOW - timedelta(hours=1), {}, NOW) == []


def test_writer_silent_not_raised_before_first_accept_ever():
    assert titles(9, ["19:00"], None, {}, NOW) == []


def test_held_triggers_at_two_attempts_and_lists_ids_and_reasons():
    held = {"001-alpha": {"status": "held", "attempts": 2, "reasons": ["too quiet", "frozen frames"]},
            "002-beta": {"status": "held", "attempts": 3, "reasons": ["black frame"]}}
    out = dict(status.alerts(9, ["19:00"], FRESH, held, NOW))
    body = out[HELD]
    for s in ("001-alpha", "002-beta", "too quiet", "frozen frames", "black frame"):
        assert s in body


def test_held_ignores_first_attempt_and_non_held():
    held = {"001-alpha": {"status": "held", "attempts": 1, "reasons": ["x"]},
            "002-beta": {"status": "queued", "attempts": 5, "reasons": []}}
    assert titles(9, ["19:00"], FRESH, held, NOW) == []


def test_all_clear_and_all_raised():
    assert status.alerts(9, ["19:00"], FRESH, {}, NOW) == []
    held = {"001-a": {"status": "held", "attempts": 2, "reasons": ["r"]}}
    assert titles(0, ["19:00"], NOW - timedelta(days=3), held, NOW) == list(status.TITLES)


def test_queued_count_counts_mp4_only():
    assert status.queued_count(["001-a.mp4", "001-a.yml", "002-b.yml", "003-c.mp4"]) == 2


def test_newest_accept_picks_latest_matching_subject():
    log = ("2026-11-08T10:00:00+00:00\tAccept claude/oj-2026-11-08\n"
           "2026-11-09T09:00:00+00:00\tAccepted something else\n"
           "2026-11-07T10:00:00+00:00\tAccept claude/oj-2026-11-07\n"
           "2026-11-09T08:00:00+00:00\tPost: state\n")
    assert status.newest_accept(log) == datetime(2026, 11, 8, 10, 0, tzinfo=timezone.utc)
    assert status.newest_accept("") is None
