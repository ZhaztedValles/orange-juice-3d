"""Posting tests: slot window + guard, approval gate, state, asset cleanup, the post workflow's backup cron.
No network: the queue store and youtube.publish are fakes injected with monkeypatch; common.now is frozen."""
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "autopilot"))
import common  # noqa: E402
import publish  # noqa: E402
import store  # noqa: E402
import youtube  # noqa: E402

MANILA = ZoneInfo("Asia/Manila")
SLOT_TIME = datetime(2026, 11, 9, 19, 5, tzinfo=MANILA)      # 5 min after the 19:00 slot


def base_cfg(**over):
    cfg = {"paused": False, "timezone": "Asia/Manila", "slots": ["19:00"], "slot_window_minutes": 90,
           "require_approval": False,
           "youtube": {"enabled": True, "privacy": "public", "made_for_kids": False, "language": "en",
                       "category_id": "27", "contains_synthetic_media": False, "description_footer": "Footer line."}}
    cfg.update(over)
    return cfg


class FakeStore:
    """in-memory release: names + yml contents; download writes stub files; delete may be made to fail"""

    def __init__(self):
        self.files = {}
        self.deleted = []
        self.downloaded = []
        self.fail_delete = False

    def add(self, vid, meta=None, mp4=True, yml=True):
        meta = {"title": f"Title {vid}", "description": "Desc", "tags": ["a"]} if meta is None else meta
        if mp4:
            self.files[f"{vid}.mp4"] = b"video"
        if yml:
            self.files[f"{vid}.yml"] = yaml.safe_dump(meta).encode()

    def ensure(self):                     # posting and reporting only READ the release; creating it is the render job's work
        raise AssertionError("store.ensure() must not be called while posting or reporting")

    def names(self):
        return sorted(self.files)

    def download(self, pattern, dest):
        from fnmatch import fnmatch
        Path(dest).mkdir(parents=True, exist_ok=True)
        for n, b in self.files.items():
            if fnmatch(n, pattern):
                (Path(dest) / n).write_bytes(b)
                self.downloaded.append(n)

    def delete(self, name):
        if self.fail_delete:
            raise RuntimeError("gh release delete-asset failed")
        del self.files[name]
        self.deleted.append(name)


@pytest.fixture
def env(tmp_path, monkeypatch):
    state = tmp_path / "state"
    (state / "posted").mkdir(parents=True)
    monkeypatch.setattr(common, "STATE", state)
    monkeypatch.setattr(common, "VIDEOS", tmp_path / "videos")
    monkeypatch.setattr(common, "now", lambda: SLOT_TIME.astimezone(timezone.utc))
    for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"):
        monkeypatch.setenv(k, "x")
    calls = []

    def fake_publish(path, meta, cfg):
        assert Path(path).exists() and Path(path).suffix == ".mp4"
        calls.append(meta["title"])
        return {"id": f"YT{len(calls)}", "url": f"https://youtube.com/shorts/YT{len(calls)}"}

    monkeypatch.setattr(youtube, "publish", fake_publish)
    monkeypatch.setattr(youtube, "check_connection", lambda cfg: "Orange Juice Productions")
    st = FakeStore()
    monkeypatch.setattr(publish, "get_store", lambda: st)

    class E:
        pass

    e = E()
    e.state, e.store, e.calls, e.tmp = state, st, calls, tmp_path
    e.at = lambda dt: monkeypatch.setattr(common, "now", lambda: dt.astimezone(timezone.utc))
    e.run = lambda cfg=None, dry=False: publish.run_youtube(cfg or base_cfg(), st, str(tmp_path / "dl"), dry)
    e.posted = lambda: sorted(p.stem for p in (state / "posted").glob("*.json"))
    return e


def approve(env, *ids):
    (env.state / "approved.yml").write_text(yaml.safe_dump({"approved": list(ids)}), encoding="utf-8")


# ------------------------------------------------------------------ slot window and guard
def test_posts_in_window_and_writes_state_with_slot(env):
    env.store.add("001-alpha")
    assert env.run() == 0
    assert env.calls == ["Title 001-alpha"]
    st = json.loads((env.state / "posted" / "001-alpha.json").read_text())
    assert st["id"] == "001-alpha" and st["url"] == "https://youtube.com/shorts/YT1"
    assert st["slot"] == "2026-11-09T19:00"
    assert datetime.fromisoformat(st["posted_at"]) == SLOT_TIME


def test_posting_never_touches_the_queue_assets_cleanup_removes_them_after(env):
    env.store.add("001-alpha")
    env.store.add("002-beta")
    env.run()
    assert env.store.deleted == [] and len(env.store.names()) == 4        # record written, assets still queued
    assert publish.run_cleanup(env.store) == 0
    assert env.store.names() == ["002-beta.mp4", "002-beta.yml"]
    assert sorted(env.store.deleted) == ["001-alpha.mp4", "001-alpha.yml"]


def test_cleanup_only_removes_ids_with_a_posted_record(env):
    env.store.add("001-alpha")
    env.store.files["notes.txt"] = b"x"
    publish.run_cleanup(env.store)
    assert env.store.deleted == [] and "001-alpha.mp4" in env.store.names()
    common.write_posted("001-alpha", {"id": "001-alpha", "url": "u", "slot": "s", "posted_at": "t"})
    env.store.add("001-alpha-two")               # a different id that merely shares a prefix stays
    publish.run_cleanup(env.store)
    assert env.store.names() == ["001-alpha-two.mp4", "001-alpha-two.yml", "notes.txt"]


def test_cleanup_with_an_incomplete_pair_removes_the_leftover(env):
    env.store.add("001-alpha", yml=False)
    common.write_posted("001-alpha", {"id": "001-alpha", "url": "u", "slot": "s", "posted_at": "t"})
    publish.run_cleanup(env.store)
    assert env.store.names() == []


def test_cleanup_delete_failure_is_a_warning_not_a_failure(env, capsys):
    env.store.add("001-alpha")
    common.write_posted("001-alpha", {"id": "001-alpha", "url": "u", "slot": "s", "posted_at": "t"})
    env.store.fail_delete = True
    assert publish.run_cleanup(env.store) == 0
    assert "::warning::" in capsys.readouterr().out and len(env.store.names()) == 2


def test_nothing_outside_the_window(env):
    env.store.add("001-alpha")
    for t in (datetime(2026, 11, 9, 18, 59, tzinfo=MANILA), datetime(2026, 11, 9, 20, 30, tzinfo=MANILA),
              datetime(2026, 11, 9, 3, 0, tzinfo=MANILA)):
        env.at(t)
        assert env.run() == 0
    assert env.calls == [] and env.posted() == [] and env.store.deleted == []


def test_window_end_is_exclusive(env):
    env.store.add("001-alpha")
    env.at(datetime(2026, 11, 9, 20, 29, 59, tzinfo=MANILA))
    env.run()
    assert env.calls == ["Title 001-alpha"]


def test_window_start_exactly_on_the_slot_posts(env):
    env.store.add("001-alpha")
    env.at(datetime(2026, 11, 9, 19, 0, tzinfo=MANILA))
    env.run()
    assert env.posted() == ["001-alpha"]


def test_second_run_in_the_same_slot_does_nothing(env):
    env.store.add("001-alpha")
    env.store.add("002-beta")
    env.run()
    env.at(SLOT_TIME + timedelta(minutes=20))
    assert env.run() == 0
    assert env.calls == ["Title 001-alpha"] and env.posted() == ["001-alpha"]


def test_next_day_slot_posts_again(env):
    env.store.add("001-alpha")
    env.store.add("002-beta")
    env.run()
    env.at(SLOT_TIME + timedelta(days=1))
    env.run()
    assert env.calls == ["Title 001-alpha", "Title 002-beta"]
    assert json.loads((env.state / "posted" / "002-beta.json").read_text())["slot"] == "2026-11-10T19:00"


def test_two_slots_each_get_one_post(env):
    cfg = base_cfg(slots=["12:00", "19:00"])
    for n, name in ((1, "aaa"), (2, "bbb"), (3, "ccc")):
        env.store.add(f"{n:03d}-{name}")
    env.at(datetime(2026, 11, 9, 12, 10, tzinfo=MANILA))
    env.run(cfg)
    env.run(cfg)
    env.at(datetime(2026, 11, 9, 19, 10, tzinfo=MANILA))
    env.run(cfg)
    env.run(cfg)
    slots = sorted(json.loads(p.read_text())["slot"] for p in (env.state / "posted").glob("*.json"))
    assert slots == ["2026-11-09T12:00", "2026-11-09T19:00"]


def test_slot_near_midnight_belongs_to_the_previous_day(env):
    cfg = base_cfg(slots=["23:30"])
    env.store.add("001-alpha")
    env.at(datetime(2026, 11, 10, 0, 45, tzinfo=MANILA))     # 75 min after the 23:30 slot of Nov 9
    env.run(cfg)
    assert json.loads((env.state / "posted" / "001-alpha.json").read_text())["slot"] == "2026-11-09T23:30"


def test_slot_guard_survives_a_late_second_trigger_across_midnight(env):
    cfg = base_cfg(slots=["23:30"])
    env.store.add("001-alpha")
    env.store.add("002-beta")
    env.at(datetime(2026, 11, 9, 23, 35, tzinfo=MANILA))
    env.run(cfg)
    env.at(datetime(2026, 11, 10, 0, 10, tzinfo=MANILA))     # same slot, next calendar day
    env.run(cfg)
    assert env.calls == ["Title 001-alpha"]


def test_run_time_in_utc_is_converted_to_manila(env):
    env.store.add("001-alpha")
    env.at(datetime(2026, 11, 9, 11, 5, tzinfo=timezone.utc))    # 19:05 Manila
    env.run()
    assert env.posted() == ["001-alpha"]


def test_paused_does_nothing(env):
    env.store.add("001-alpha")
    assert env.run(base_cfg(paused=True)) == 0
    assert env.calls == [] and env.posted() == [] and env.store.downloaded == []


def test_youtube_disabled_does_nothing(env):
    env.store.add("001-alpha")
    cfg = base_cfg()
    cfg["youtube"]["enabled"] = False
    assert env.run(cfg) == 0
    assert env.calls == [] and env.posted() == []


def test_empty_queue_is_not_an_error(env, capsys):
    assert env.run() == 0
    assert "queue is empty" in capsys.readouterr().out.lower()
    assert env.posted() == []


# ------------------------------------------------------------------ choosing the video
def test_picks_the_lowest_id(env):
    for vid in ("010-ten", "002-two", "003-three"):
        env.store.add(vid)
    env.run()
    assert env.posted() == ["002-two"]


def test_template_is_never_posted(env):
    env.store.add("000-bridge", {"title": "T", "description": "D", "template": True})
    env.store.add("001-alpha")
    env.run()
    assert env.posted() == ["001-alpha"]
    assert "000-bridge.mp4" in env.store.names()          # left alone, not deleted


def test_already_posted_id_is_not_reposted_and_its_assets_are_left_for_cleanup(env, capsys):
    (env.state / "posted" / "001-alpha.json").write_text(json.dumps(
        {"id": "001-alpha", "url": "u", "slot": "2026-11-08T19:00", "posted_at": "x"}))
    env.store.add("001-alpha")
    env.store.add("002-beta")
    env.run()
    assert env.calls == ["Title 002-beta"]
    assert "001-alpha.mp4" in env.store.names() and env.store.deleted == []
    assert "already posted" in capsys.readouterr().out.lower()


def test_dry_run_leaves_already_posted_leftovers_untouched(env):
    (env.state / "posted" / "001-alpha.json").write_text(json.dumps(
        {"id": "001-alpha", "url": "u", "slot": "2026-11-08T19:00", "posted_at": "x"}))
    env.store.add("001-alpha")
    env.store.add("002-beta")
    assert env.run(dry=True) == 0
    assert env.store.deleted == [] and len(env.store.names()) == 4 and env.calls == []


def test_template_folder_and_template_id_are_never_posted(env):
    (common.VIDEOS / "001-alpha").mkdir(parents=True)
    (common.VIDEOS / "001-alpha" / "meta.yml").write_text("title: T\ntemplate: true\n", encoding="utf-8")
    env.store.add("000-bridge")                                   # no `template` flag in its queue yml at all
    env.store.add("001-alpha")                                    # flagged only in its video folder
    env.store.add("002-beta")
    env.run()
    assert env.posted() == ["002-beta"]
    assert common.is_template("000-bridge") and common.is_template("001-alpha") and not common.is_template("002-beta")


def test_unreadable_video_meta_counts_as_template(env):
    (common.VIDEOS / "001-alpha").mkdir(parents=True)
    (common.VIDEOS / "001-alpha" / "meta.yml").write_text("title: [unclosed\n", encoding="utf-8")
    env.store.add("001-alpha")
    env.run()
    assert env.calls == []


def test_incomplete_and_bad_names_are_skipped_with_a_warning(env, capsys):
    env.store.add("001-alpha", yml=False)
    env.store.files["notes.txt"] = b"x"
    env.store.add("002-beta")
    env.run()
    out = capsys.readouterr().out
    assert env.posted() == ["002-beta"]
    assert "001-alpha" in out and "notes.txt" in out and "::warning::" in out


def test_invalid_meta_is_skipped_with_a_warning(env, capsys):
    env.store.add("001-alpha", {"title": "x" * 101, "description": "D"})
    env.store.add("002-beta")
    env.run()
    assert env.posted() == ["002-beta"]
    assert "001-alpha" in capsys.readouterr().out


# ------------------------------------------------------------------ approval gate
def test_with_approval_unapproved_ids_are_skipped(env):
    cfg = base_cfg(require_approval=True)
    for vid in ("001-alpha", "002-beta", "003-gamma"):
        env.store.add(vid)
    approve(env, "003-gamma", "002-beta")
    env.run(cfg)
    assert env.posted() == ["002-beta"]               # lowest APPROVED id, not the lowest id
    assert "001-alpha.mp4" in env.store.names()


def test_with_approval_and_none_approved_does_nothing_and_says_why(env, capsys):
    cfg = base_cfg(require_approval=True)
    env.store.add("001-alpha")
    assert env.run(cfg) == 0
    out = capsys.readouterr().out
    assert env.calls == [] and "approved" in out.lower() and "approved.yml" in out


def test_with_approval_missing_file_means_none_approved(env):
    env.store.add("001-alpha")
    assert not (env.state / "approved.yml").exists()
    assert env.run(base_cfg(require_approval=True)) == 0
    assert env.calls == []


def test_without_approval_the_list_is_ignored(env):
    env.store.add("001-alpha")
    approve(env, "999-other")
    env.run(base_cfg(require_approval=False))
    assert env.posted() == ["001-alpha"]


def test_malformed_approved_file_fails_closed(env):
    env.store.add("001-alpha")
    (env.state / "approved.yml").write_text("approved: 001-alpha\n", encoding="utf-8")
    with pytest.raises(RuntimeError, match="approved"):
        env.run(base_cfg(require_approval=True))
    assert env.calls == []


# ------------------------------------------------------------------ failure modes
def test_upload_failure_exits_1_and_keeps_everything(env, monkeypatch, capsys):
    def boom(path, meta, cfg):
        raise RuntimeError("quotaExceeded")
    monkeypatch.setattr(youtube, "publish", boom)
    env.store.add("001-alpha")
    assert env.run() == 1
    assert env.posted() == [] and env.store.deleted == []
    assert "quotaExceeded" in capsys.readouterr().out


def test_posted_assets_left_in_the_queue_are_not_reposted_in_a_later_slot(env):
    env.store.add("001-alpha")
    env.run()
    env.at(SLOT_TIME + timedelta(days=1))
    env.run()
    assert env.calls == ["Title 001-alpha"]
    publish.run_cleanup(env.store)
    assert env.store.names() == []


@pytest.mark.parametrize("path,value", [(("paused",), "false"), (("require_approval",), "true"),
                                        (("youtube", "enabled"), "yes"), (("youtube", "made_for_kids"), "false"),
                                        (("youtube", "contains_synthetic_media"), 0), (("paused",), None)])
def test_non_boolean_config_flags_fail_with_a_clear_error(env, capsys, path, value):
    cfg = base_cfg()
    node = cfg
    for k in path[:-1]:
        node = node[k]
    node[path[-1]] = value
    env.store.add("001-alpha")
    assert env.run(cfg) == 1
    out = capsys.readouterr().out
    assert "::error::" in out and ".".join(path) in out and "true or false" in out
    assert env.calls == [] and env.posted() == []
    assert env.run(cfg, dry=True) == 1
    assert publish.run_report(cfg, env.store, str(env.tmp / "r")) == 1


def test_missing_boolean_flag_fails(env):
    cfg = base_cfg()
    del cfg["youtube"]["made_for_kids"]
    assert env.run(cfg) == 1


def test_missing_secrets_fail_a_real_run_before_downloading(env, monkeypatch, capsys):
    monkeypatch.delenv("YT_REFRESH_TOKEN")
    env.store.add("001-alpha")
    assert env.run() == 1
    out = capsys.readouterr().out
    assert "YT_REFRESH_TOKEN" in out and env.store.downloaded == [] and env.posted() == []


def test_missing_secrets_outside_the_window_is_still_a_quiet_exit(env, monkeypatch):
    monkeypatch.delenv("YT_REFRESH_TOKEN")
    env.at(datetime(2026, 11, 9, 3, 0, tzinfo=MANILA))
    assert env.run() == 0


# ------------------------------------------------------------------ dry run
def test_dry_run_writes_nothing_and_prints_the_channel(env, capsys):
    env.store.add("001-alpha")
    assert env.run(dry=True) == 0
    out = capsys.readouterr().out
    assert "Orange Juice Productions" in out and "001-alpha" in out and "Title 001-alpha" in out
    assert env.calls == [] and env.posted() == [] and env.store.deleted == []
    assert list(env.state.iterdir()) == [env.state / "posted"]


def test_dry_run_without_secrets_is_informative_not_red(env, monkeypatch, capsys):
    for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"):
        monkeypatch.delenv(k)
    env.store.add("001-alpha")
    assert env.run(dry=True) == 0
    assert "missing" in capsys.readouterr().out.lower()


def test_dry_run_connection_failure_is_red(env, monkeypatch):
    def bad(cfg):
        raise RuntimeError("invalid_grant")
    monkeypatch.setattr(youtube, "check_connection", bad)
    env.store.add("001-alpha")
    assert env.run(dry=True) == 1


def test_dry_run_outside_the_window_still_shows_the_candidate_and_says_so(env, capsys):
    env.store.add("001-alpha")
    env.at(datetime(2026, 11, 9, 3, 0, tzinfo=MANILA))
    assert env.run(dry=True) == 0
    out = capsys.readouterr().out
    assert "001-alpha" in out and "outside" in out.lower()
    assert env.calls == [] and env.posted() == []


def test_dry_run_names_the_channel_even_with_an_empty_queue(env, capsys):
    assert env.run(dry=True) == 0
    assert "Orange Juice Productions" in capsys.readouterr().out


def test_dry_run_with_approval_and_nothing_approved_says_why(env, capsys):
    env.store.add("001-alpha")
    assert env.run(base_cfg(require_approval=True), dry=True) == 0
    assert "approved" in capsys.readouterr().out.lower() and env.calls == []


# ------------------------------------------------------------------ report
def test_report_counts_queue_held_and_days_left(env, capsys):
    cfg = base_cfg(slots=["12:00", "19:00"])
    for i in range(5):
        env.store.add(f"{i + 1:03d}-vid")
    (env.state / "render").mkdir()
    (env.state / "render" / "007-held.json").write_text(json.dumps({"status": "held"}))
    (env.state / "render" / "008-ok.json").write_text(json.dumps({"status": "queued"}))
    approve(env, "001-vid", "003-vid", "777-gone")
    assert publish.run_report(cfg, env.store, str(env.tmp / "r")) == 0
    out = capsys.readouterr().out
    assert "queued: 5" in out and "held: 1" in out and "2 days left" in out and "1 spare" in out
    assert "approved and queued: 2" in out


def test_release_store_reads_never_create_the_release(monkeypatch):
    calls = []

    class R:
        def __init__(self, rc=0, out="", err=""):
            self.returncode, self.stdout, self.stderr = rc, out, err

    def fake_run(cmd, **kw):
        calls.append(cmd[1:3])
        return R(1, "", "release not found")

    monkeypatch.setattr(store.subprocess, "run", fake_run)
    assert store.ReleaseStore().names() == []                   # no release yet = empty queue, and no `release create`
    assert calls == [["release", "view"]]
    monkeypatch.setattr(store.subprocess, "run", lambda cmd, **kw: R(1, "", "HTTP 401 bad credentials"))
    with pytest.raises(RuntimeError, match="401"):
        store.ReleaseStore().names()


def test_local_store_names_does_not_create_the_folder(tmp_path):
    assert store.LocalStore(tmp_path / "nope").names() == [] and not (tmp_path / "nope").exists()


# ------------------------------------------------------------------ main()
def test_main_runs_youtube_and_report(env, monkeypatch, capsys):
    cfg_file = env.tmp / "config.yml"
    cfg_file.write_text(yaml.safe_dump(base_cfg()), encoding="utf-8")
    monkeypatch.setattr(common, "CONFIG", cfg_file)
    env.store.add("001-alpha")
    monkeypatch.setattr(sys, "argv", ["publish.py", "youtube"])
    assert publish.main() == 0 and env.posted() == ["001-alpha"]
    monkeypatch.setattr(sys, "argv", ["publish.py", "report"])
    assert publish.main() == 0
    assert "queued: 0" in capsys.readouterr().out                 # posted ids never count as queued, cleaned up or not
    monkeypatch.setattr(sys, "argv", ["publish.py", "cleanup"])
    assert publish.main() == 0 and env.store.names() == []


# ------------------------------------------------------------------ ported helpers (FactPop common/store/youtube)
def test_group_assets_pairs_id_files_and_reports_problems():
    items, problems = common.group_assets(["002-b-b.mp4", "002-b-b.yml", "001-aaa.mp4", "001-aaa.yml", "003-ccc.mp4",
                                           "readme.md", "history-001-x.mp4"])
    assert [i.id for i in items] == ["001-aaa", "002-b-b"]
    assert items[0].mp4 == "001-aaa.mp4" and items[0].yml == "001-aaa.yml"
    assert any("003-ccc" in p and ".yml" in p for p in problems)
    assert any("readme.md" in p for p in problems) and any("history-001-x.mp4" in p for p in problems)


def test_validate_meta_limits():
    cfg = base_cfg()
    ok = {"title": "A title", "description": "D"}
    assert common.validate_meta(ok, cfg) == []
    assert common.validate_meta(None, cfg)
    assert common.validate_meta({"title": "x"}, cfg) == ["needs a 'description'"]
    assert any("100" in e for e in common.validate_meta({**ok, "title": "x" * 101}, cfg))
    assert any("< or >" in e for e in common.validate_meta({**ok, "title": "a<b"}, cfg))
    assert any("5,000" in e for e in common.validate_meta({**ok, "description": "d" * 5000}, cfg))
    assert any("tags" in e for e in common.validate_meta({**ok, "tags": ["t" * 100] * 5}, cfg))


def test_youtube_description_appends_the_footer():
    assert common.youtube_description({"description": "  Body text.  \n"}, base_cfg()) == "Body text.\n\nFooter line.\n"


def test_local_store_roundtrip(tmp_path):
    s = store.LocalStore(tmp_path / "q")
    (tmp_path / "x.mp4").write_bytes(b"1")
    s.upload(tmp_path / "x.mp4")
    assert s.names() == ["x.mp4"]
    s.download("*.mp4", tmp_path / "dl")
    assert (tmp_path / "dl" / "x.mp4").read_bytes() == b"1"
    s.delete("x.mp4")
    assert s.names() == []


def test_youtube_publish_builds_a_single_feed_upload(monkeypatch, tmp_path):
    seen = {}

    class Req:
        def next_chunk(self):
            return None, {"id": "VID123"}

    class Videos:
        def insert(self, part, body, media_body):
            seen.update(part=part, body=body)
            return Req()

    class Client:
        def videos(self):
            return Videos()

        def __getattr__(self, name):                       # playlistItems() etc. must never be touched
            raise AssertionError(f"unexpected YouTube call: {name}")

    monkeypatch.setattr(youtube, "_client", lambda: Client())
    monkeypatch.setattr(youtube, "MediaFileUpload", lambda *a, **k: object())
    cfg = yaml.safe_load((ROOT / "config.yml").read_text(encoding="utf-8"))
    res = youtube.publish(tmp_path / "v.mp4", {"title": " T ", "description": "D", "tags": ["a"]}, cfg)
    assert res == {"id": "VID123", "url": "https://youtube.com/shorts/VID123"}
    sn, stt = seen["body"]["snippet"], seen["body"]["status"]
    assert sn["title"] == "T" and sn["categoryId"] == "27" and sn["defaultLanguage"] == "en"
    assert stt == {"privacyStatus": "public", "selfDeclaredMadeForKids": False, "containsSyntheticMedia": False}


def test_youtube_check_connection_returns_only_the_channel_name(monkeypatch):
    class Chans:
        def list(self, part, mine):
            return self

        def execute(self):
            return {"items": [{"id": "C1", "snippet": {"title": "Orange Juice Productions"}}]}

    class Client:
        def channels(self):
            return Chans()

    monkeypatch.setattr(youtube, "_client", lambda: Client())
    assert youtube.check_connection({}) == "Orange Juice Productions"


def test_youtube_client_names_missing_secrets(monkeypatch):
    for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("YT_CLIENT_ID", "x")
    assert youtube.missing_secrets() == ["YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"]
    with pytest.raises(RuntimeError, match="YT_CLIENT_SECRET"):
        youtube._client()


# ------------------------------------------------------------------ config, approval file, workflow
def test_config_has_the_launch_values():
    cfg = yaml.safe_load((ROOT / "config.yml").read_text(encoding="utf-8"))
    assert cfg["paused"] is False and cfg["timezone"] == "Asia/Manila" and cfg["slots"] == ["19:00"]
    assert cfg["slot_window_minutes"] == 90 and cfg["require_approval"] is True
    y = cfg["youtube"]
    assert y["enabled"] is True and y["privacy"] == "public" and y["made_for_kids"] is False and y["language"] == "en"
    assert y["category_id"] == "27" and y["contains_synthetic_media"] is False
    assert "playlists" not in y and "instagram" not in cfg


def test_approved_file_never_lists_the_template():
    data = yaml.safe_load((ROOT / "state" / "approved.yml").read_text(encoding="utf-8"))
    assert "000-bridge" not in (data.get("approved") or [])


def test_posted_dir_is_tracked():
    assert (ROOT / "state" / "posted" / ".gitkeep").exists()


WORKFLOW = ROOT / ".github" / "workflows" / "post.yml"


def _workflow():
    wf = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    if True in wf:                                           # PyYAML reads the key `on` as True
        wf["on"] = wf.pop(True)
    return wf


def test_every_slot_has_a_backup_cron_inside_its_window():
    cfg = yaml.safe_load((ROOT / "config.yml").read_text(encoding="utf-8"))
    crons = [s["cron"].split() for s in _workflow()["on"]["schedule"]]
    covered = set()
    for minute, hour, dom, mon, dow in crons:
        assert dom == mon == dow == "*", "backup crons are daily"
        for h in (int(x) for x in hour.split(",")):
            for m in (int(x) for x in minute.split(",")):
                covered.add(((h * 60 + m) + 8 * 60) % 1440)         # UTC -> Manila (UTC+8, no DST)
    for slot in cfg["slots"]:
        sh, sm = (int(x) for x in slot.split(":"))
        start = sh * 60 + sm
        assert any(0 <= (c - start) % 1440 < cfg["slot_window_minutes"] for c in covered), f"no backup cron for {slot}"
    assert _workflow()["on"]["schedule"][0]["cron"] == "5 11 * * *"


def test_post_workflow_follows_the_repo_security_conventions():
    text = WORKFLOW.read_text(encoding="utf-8")
    wf = _workflow()
    assert wf["permissions"] == {}
    assert wf["concurrency"] == {"group": "oj-post", "cancel-in-progress": False}
    assert wf["on"]["workflow_dispatch"]["inputs"]["dry_run"]["default"] is True
    job = wf["jobs"]["post"]
    assert job["permissions"] == {"contents": "write"}
    checkout = next(s for s in job["steps"] if str(s.get("uses", "")).startswith("actions/checkout"))
    assert checkout["with"]["persist-credentials"] is False and checkout["with"]["ref"] == "main"
    for s in job["steps"]:                                   # no ${{ }} inside any run: script
        assert "${{" not in s.get("run", ""), s
    for s in job["steps"]:                                   # secrets only in the posting step
        has_secret = any("secrets." in str(v) for v in s.get("env", {}).values())
        assert has_secret == (s.get("name") == "Post to YouTube"), s.get("name")
    assert "GH_TOKEN" not in job.get("env", {}) and "GH_TOKEN" not in wf.get("env", {})
    assert "tools/save_state.sh" in text


def test_workflow_cleans_up_only_after_a_successful_save():
    steps = _workflow()["jobs"]["post"]["steps"]
    names = [s.get("name") for s in steps]
    save, clean = steps[names.index("Save progress")], steps[names.index("Cleanup posted assets")]
    assert names.index("Post to YouTube") < names.index("Save progress") < names.index("Cleanup posted assets")
    assert "always()" not in clean["if"] and "failure()" not in clean["if"]    # implicit success(): save must have passed
    assert "dry_run != true" in clean["if"] and "dry_run != true" in save["if"]
    assert clean["run"].strip() == "python autopilot/publish.py cleanup"
    assert "KNOWN RESIDUAL" in WORKFLOW.read_text(encoding="utf-8")


def test_secret_and_write_jobs_never_restore_a_cache():
    # Writer code can plant cache entries on main; a job holding secrets or a write token must not restore one.
    from pathlib import Path
    for wf in ("post.yml", "queue-report.yml"):
        text = (Path(__file__).resolve().parent.parent / ".github" / "workflows" / wf).read_text(encoding="utf-8")
        assert "cache:" not in text.replace("# No cache", ""), wf
        assert "actions/cache" not in text, wf
