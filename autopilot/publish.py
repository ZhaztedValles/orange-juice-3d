"""Orange Juice Productions: posting.

  python autopilot/publish.py youtube [--dry-run]   # post the next queued Short if a slot is open
  python autopilot/publish.py report                # queue depth, held count, days of videos left

One feed, no playlists. `youtube` is triggered by cron-job.org at each slot (GitHub's own cron is the backup) and never
by hand. A run posts only when it is inside a slot's window (slot <= now < slot + slot_window_minutes, Manila time) and
no post is logged for that slot yet (state/posted/*.json, field `slot`), so two triggers for one slot never double-post.
It posts the lowest queued id (with require_approval: the lowest id listed in state/approved.yml), records
state/posted/<id>.json = {id, url, slot, posted_at} and deletes the two assets from the queue release.
Template videos (`template: true`) and ids that already have a posted record are never posted.
--dry-run changes nothing: it prints the window, the pick and (with secrets) the channel name.
"""
import argparse
import sys
import tempfile
from datetime import datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

import common
import youtube
from common import summary
from store import get_store

TIMEZONE_DEFAULT = "Asia/Manila"


def slot_cfg(cfg):
    """(tz, slots as ["HH:MM"], window as timedelta); raises on a config that cannot work"""
    slots = cfg.get("slots")
    if not isinstance(slots, list) or not slots:
        raise RuntimeError("config.yml: `slots` must be a non-empty list like [\"19:00\"]")
    for s in slots:
        try:
            time.fromisoformat(str(s))
        except ValueError:
            raise RuntimeError(f"config.yml: slot {s!r} is not HH:MM") from None
    window = int(cfg.get("slot_window_minutes", 0))
    if window <= 0:
        raise RuntimeError("config.yml: `slot_window_minutes` must be a positive number")
    return ZoneInfo(cfg.get("timezone", TIMEZONE_DEFAULT)), [str(s) for s in slots], timedelta(minutes=window)


def current_slot(cfg, t):
    """The slot (local time) whose window contains t, or None. Yesterday's slots count too, so a slot near midnight
    still covers the first minutes of the next day. The latest matching slot wins."""
    tz, slots, window = slot_cfg(cfg)
    local = t.astimezone(tz)
    best = None
    for day in (local.date() - timedelta(days=1), local.date()):
        for s in slots:
            start = datetime.combine(day, time.fromisoformat(s), tzinfo=tz)
            if start <= local < start + window and (best is None or start > best):
                best = start
    return best


def slot_key(start):
    return start.strftime("%Y-%m-%dT%H:%M")


def load_queue(store, tmp, cfg):
    """(good items with .meta, problems). Templates are marked item.template; invalid ones are reported and dropped."""
    store.ensure()
    items, problems = common.group_assets(store.names())
    if items:
        store.download("*.yml", tmp)
    good = []
    for it in items:
        try:
            it.meta = yaml.safe_load((Path(tmp) / it.yml).read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            problems.append(f"{it.yml} isn't valid YAML: {e}")
            continue
        it.template = isinstance(it.meta, dict) and it.meta.get("template") is True
        errs = [] if it.template else common.validate_meta(it.meta, cfg)
        if errs:
            problems += [f"{it.id}: {e}" for e in errs]
        else:
            good.append(it)
    for p in problems:
        print(f"::warning::Queue problem: {p}")
    return good, problems


def _delete_assets(store, it):
    """delete the item's two assets; a failure is a warning (returns False), never fatal"""
    ok = True
    for name in (it.mp4, it.yml):
        try:
            store.delete(name)
        except Exception as e:  # noqa: BLE001
            ok = False
            print(f"::warning::Could not delete {name} from the queue release: {e}")
    return ok


def _dry_connection_check(cfg):
    """dry run: name the channel when the secrets exist (read-only); a failed sign-in is red, missing secrets are not"""
    missing = youtube.missing_secrets()
    if missing:
        summary(f"YouTube connection not checked: secret(s) missing: {', '.join(missing)}")
        return 0
    try:
        summary(f"Signed in to YouTube as {youtube.check_connection(cfg)}")
        return 0
    except Exception as e:  # noqa: BLE001
        summary(f"YouTube connection check failed: {e}")
        print(f"::error::YouTube connection check failed: {e}")
        return 1


def run_youtube(cfg, store, tmp, dry):
    yc = cfg.get("youtube") or {}
    if cfg.get("paused"):
        summary("Paused (`paused: true` in config.yml). Nothing was done.")
        return 0
    if not yc.get("enabled"):
        summary("YouTube posting is turned off in config.yml")
        return 0

    t = common.now()
    slot = current_slot(cfg, t)
    key = slot_key(slot) if slot else None
    posted = common.load_posted()
    guard = next((p for p in posted.values() if key and p.get("slot") == key), None)
    if dry:
        if slot is None:
            summary("Dry run: the current time is outside every slot window, so a real run would not post now.")
        elif guard:
            summary(f"Dry run: slot {key} already has a post ({guard.get('id')}), a real run would do nothing.")
    else:
        if slot is None:
            summary("Outside every slot window: nothing to do.")
            return 0
        if guard:
            summary(f"Slot {key} already has a post ({guard.get('id')}): one Short per slot, nothing to do.")
            return 0
        missing = youtube.missing_secrets()
        if missing:
            summary(f"Missing GitHub secret(s): {', '.join(missing)}")
            print(f"::error::Missing GitHub secret(s): {', '.join(missing)}")
            return 1

    rc_dry = _dry_connection_check(cfg) if dry else 0
    items, _ = load_queue(store, tmp, cfg)
    candidates = []
    for it in items:
        if it.id in posted:                       # posted earlier but the assets were left behind: never re-post
            print(f"::warning::{it.id} is already posted ({posted[it.id].get('url')}); "
                  + ("would remove" if dry else "removing") + " its leftover queue assets")
            if not dry:
                _delete_assets(store, it)
        elif it.template:
            print(f"::warning::{it.id} is a template: never posted")
        else:
            candidates.append(it)

    if not candidates:
        summary("Queue is empty: nothing to post.")
        print("::warning::Queue is empty")
        return rc_dry
    if cfg.get("require_approval"):
        approved = set(common.load_approved())
        waiting = candidates
        candidates = [it for it in candidates if it.id in approved]
        if not candidates:
            summary(f"{len(waiting)} video(s) queued ({', '.join(i.id for i in waiting)}) but none is approved: "
                    "list an id under `approved:` in state/approved.yml to let it post.")
            return rc_dry
    it = min(candidates, key=lambda i: i.id)
    summary(f"Next: {it.id} - {str(it.meta['title']).strip()}" + (f" (slot {key})" if key else ""))

    if dry:
        summary(f"Dry run: would post {it.id}.\n---\n{common.youtube_description(it.meta, cfg)}---")
        return rc_dry

    try:
        store.download(it.mp4, tmp)
        res = youtube.publish(Path(tmp) / it.mp4, it.meta, cfg)
    except Exception as e:  # noqa: BLE001
        summary(f"Upload of {it.id} failed: {e}")
        print(f"::error::Upload of {it.id} failed: {e}")
        return 1
    # the upload happened: record it first, so nothing below can ever cause a second post
    common.write_posted(it.id, {"id": it.id, "url": res["url"], "slot": key, "posted_at": common.iso()})
    summary(f"Posted {it.id}: {res['url']}")
    if not _delete_assets(store, it):
        summary("The post is recorded, but its assets are still in the queue release (they are never re-posted).")
    return 0


def run_report(cfg, store, tmp):
    posted = common.load_posted()
    items, _ = load_queue(store, tmp, cfg)
    queued = [i for i in items if not i.template and i.id not in posted]
    held = sum(1 for s in common.load_render_states().values() if s.get("status") == "held")
    per_day = len(slot_cfg(cfg)[1])
    days, spare = divmod(len(queued), per_day)
    approved = set(common.load_approved())
    lines = [f"queued: {len(queued)}",
             f"held: {held}",
             f"approved and queued: {sum(1 for i in queued if i.id in approved)}",
             f"{days} days left at {per_day}/day" + (f" (+ {spare} spare)" if spare else "")]
    summary("Queue report\n" + "\n".join(lines))
    if days < 2:
        print(f"::warning::Less than 2 days of videos queued ({days} days left)")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["youtube", "report"])
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    cfg = common.load_config()
    with tempfile.TemporaryDirectory() as tmp:
        if a.mode == "youtube":
            return run_youtube(cfg, get_store(), tmp, a.dry_run)
        return run_report(cfg, get_store(), tmp)


if __name__ == "__main__":
    sys.exit(main())
