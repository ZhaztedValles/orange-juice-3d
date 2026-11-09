"""Story ledger and banned list: every story ever considered, so no fact repeats.

  python tools/ledger.py check "<claim>" --topics a,b,c   exit 0 prints `ok`; exit 1 prints why the claim can't be used
  python tools/ledger.py validate                          exit 0 (`ok`) or 1 with the problems in stories/*.yml

stories/ledger.yml is a YAML list of entries (every key required):
  id        "<NNN>-<slug>" for a coded story, "idea-<slug>" for an idea that never got a video
  claim     one sentence, the strange true fact
  topics    1-8 lower-case words
  sources   >= 2 distinct http(s) URLs on different domains
  scores    {strange, obscurity, people, visual, provable}, integers 1-5 (a coded story needs strange >= 4,
            obscurity >= 4, people >= 3)
  status    idea | coded | dropped
  reason    non-empty when dropped
  video     the videos/ folder id when coded, else ""
  date      YYYY-MM-DD
The posted/held state is NOT here: it is read from state/, so the ledger never needs syncing.
stories/banned.yml is a YAML list of {claim, keywords}: a claim is blocked when it contains ALL the keywords of an
entry, or is worded very like the entry's claim.

The matching code (_STOP, _stem, words, similarity) is the FactPop algorithm, copied verbatim.
"""
import argparse
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import yaml

ROOT = Path(__file__).resolve().parent.parent
STATUSES = ("idea", "coded", "dropped")
SCORE_KEYS = ("strange", "obscurity", "people", "visual", "provable")
MIN_STRANGE = MIN_OBSCURITY = 4
MIN_PEOPLE = 3
SHARED_TOPICS = 3          # two stories sharing this many topics are the same story
ID_RE = re.compile(r"(?:\d{3}|idea)-[a-z0-9]+(?:-[a-z0-9]+)*", re.ASCII)
VIDEO_RE = re.compile(r"\d{3}-[a-z0-9-]{3,50}", re.ASCII)
TOPIC_RE = re.compile(r"[a-z0-9]+(?:[ -][a-z0-9]+)*", re.ASCII)
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}", re.ASCII)
KEYS = ("id", "claim", "topics", "sources", "scores", "status", "reason", "video", "date")

SIMILAR = 0.6  # share of the shorter claim's content words found in the other
MIN_SIMILAR_WORDS = 4  # shorter claim needs this many content words before the similarity rule applies
_STOP = frozenset("""a an the of in on at to for and or but is are was were be been being it its this that these those
with by from as than then so very can could has have had do does did not no into over under about after before more
most less one two their they them there which who what when where while also just only even ever
through times faster around every each many much other some such like make made use used cannot""".split())


def _stem(w):
    """Light English stemmer: plurals and -ed/-ing forms map to a shared base word. Used on both sides, so it only has to be consistent."""
    if len(w) > 4 and w.endswith("ies"):
        w = w[:-3] + "y"  # berries, butterflies, mummies
    elif len(w) > 4 and w.endswith("es") and w[:-2].endswith(("s", "x", "z", "ch", "sh", "us")):
        w = w[:-2]  # foxes, churches, octopuses
    elif len(w) > 3 and w.endswith("s") and not w.endswith(("ss", "is")) and (len(w) == 4 or not w.endswith("us")):
        w = w[:-1]  # honeybees, cubes, bees, emus (but keep octopus, virus, cactus)
    else:
        for suffix in ("ing", "ed"):
            if len(w) > len(suffix) + 3 and w.endswith(suffix):
                w = w[: -len(suffix)]
                if len(w) > 2 and w[-1] == w[-2] and w[-1] not in "lsz":
                    w = w[:-1]  # stopped -> stop
                break
    if len(w) > 3 and w.endswith("e") and not w.endswith("ee"):
        w = w[:-1]  # freeze, house
    if len(w) > 3 and w.endswith("i"):
        w = w[:-1] + "y"  # cookie, cookies -> cooky
    return w


def words(text):
    """Content words of a claim, lower-cased and stemmed, for rough same-fact matching."""
    return {_stem(w) for w in re.findall(r"[a-z0-9]+", str(text).lower()) if w not in _STOP and len(w) > 2}


def similarity(a, b):
    wa, wb = words(a), words(b)
    shorter = min(len(wa), len(wb))
    if not shorter:
        return 0.0
    if shorter >= MIN_SIMILAR_WORDS:
        return len(wa & wb) / shorter
    return len(wa & wb) / len(wa | wb)  # short claims: compare the whole word sets, so near-identical ones still match


def banned_hit(claim, banned):
    """the claim of the first banned entry that blocks `claim` (it contains ALL the entry's keywords, or is worded very
    like the entry's claim), else None"""
    cw = words(claim)
    for b in banned:
        if not isinstance(b, dict):
            continue
        kw = set().union(*(words(k) for k in (b.get("keywords") or []) if isinstance(k, str)))
        if (kw and kw <= cw) or similarity(claim, b.get("claim", "")) >= SIMILAR:
            return str(b.get("claim"))
    return None


def _load_list(path):
    path = Path(path)
    if not path.exists():
        return []
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as e:
        raise ValueError(f"{path.name} is not valid YAML: {' '.join(str(e).split())}") from e
    if data is None:
        return []
    if not isinstance(data, list):
        raise ValueError(f"{path.name} must be a YAML list")
    return data


def load(root=ROOT):
    """(entries, banned) from <root>/stories/ledger.yml and banned.yml; a missing or empty file counts as [];
    raises ValueError for invalid YAML or a file that is not a list"""
    root = Path(root)
    return _load_list(root / "stories" / "ledger.yml"), _load_list(root / "stories" / "banned.yml")


def _iso(x):
    """YYYY-MM-DD as a string, or a date (YAML parses an unquoted 2026-11-10 as one)"""
    if isinstance(x, date):
        return True
    if not (isinstance(x, str) and DATE_RE.fullmatch(x)):
        return False
    try:
        date.fromisoformat(x)
    except ValueError:
        return False
    return True


def _domain(url):
    p = urlparse(url)
    return (p.hostname or "").lower().removeprefix("www.") if p.scheme in ("http", "https") else ""


def _int(x):
    return isinstance(x, int) and not isinstance(x, bool)


def _entry_problems(e):
    if not isinstance(e, dict):
        return ["ledger entry must be a mapping"]
    label = f"ledger '{e['id']}'" if isinstance(e.get("id"), str) and e["id"].strip() else "ledger entry"
    errs = [f"{label}: missing key '{k}'" for k in KEYS if k not in e]
    errs += [f"{label}: unknown key '{k}'" for k in e if k not in KEYS]
    if "id" in e and not (isinstance(e["id"], str) and ID_RE.fullmatch(e["id"])):
        errs.append(f"{label}: id must be '<NNN>-<slug>' or 'idea-<slug>'")
    if "claim" in e and not (isinstance(e["claim"], str) and e["claim"].strip()):
        errs.append(f"{label}: 'claim' must be a non-empty sentence")
    t = e.get("topics")
    if "topics" in e and not (isinstance(t, list) and 1 <= len(t) <= 8
                              and all(isinstance(x, str) and TOPIC_RE.fullmatch(x) for x in t)):
        errs.append(f"{label}: 'topics' must be 1-8 lower-case words")
    s = e.get("sources")
    if "sources" in e:
        if not (isinstance(s, list) and all(isinstance(u, str) for u in s)):
            errs.append(f"{label}: 'sources' must be a list of URLs")
        else:
            doms = [_domain(u) for u in s]
            if not all(doms):
                errs.append(f"{label}: every source must be an http(s) URL")
            elif len(set(s)) < 2 or len(set(doms)) < 2:
                errs.append(f"{label}: 'sources' needs at least 2 distinct URLs on different domains")
    sc = e.get("scores")
    if "scores" in e:
        if not isinstance(sc, dict) or set(sc) != set(SCORE_KEYS):
            errs.append(f"{label}: 'scores' needs exactly {', '.join(SCORE_KEYS)}")
        else:
            for k in SCORE_KEYS:
                if not _int(sc[k]) or not 1 <= sc[k] <= 5:
                    errs.append(f"{label}: score '{k}' must be a whole number 1-5")
    status = e.get("status")
    if "status" in e and status not in STATUSES:
        errs.append(f"{label}: status must be one of {', '.join(STATUSES)}")
    if "reason" in e and not isinstance(e["reason"], str):
        errs.append(f"{label}: 'reason' must be a string")
    elif status == "dropped" and not str(e.get("reason") or "").strip():
        errs.append(f"{label}: a dropped entry needs a 'reason'")
    v = e.get("video")
    if "video" in e:
        if status == "coded" and not (isinstance(v, str) and VIDEO_RE.fullmatch(v)):
            errs.append(f"{label}: a coded entry needs 'video' (the videos/ folder id, <NNN>-<slug>)")
        elif status in ("idea", "dropped") and v != "":
            errs.append(f"{label}: 'video' must be \"\" unless the status is coded")
    if status == "coded" and isinstance(sc, dict) and all(_int(sc.get(k)) for k in SCORE_KEYS):
        for k, lo in (("strange", MIN_STRANGE), ("obscurity", MIN_OBSCURITY), ("people", MIN_PEOPLE)):
            if sc[k] < lo:
                errs.append(f"{label}: a coded story needs {k} >= {lo} (has {sc[k]})")
    if "date" in e and not _iso(e["date"]):
        errs.append(f"{label}: 'date' must be YYYY-MM-DD")
    return errs


def _banned_problems(i, b):
    label = f"banned entry {i}"
    if not isinstance(b, dict):
        return [f"{label}: must be a mapping"]
    errs, c, kw = [], b.get("claim"), b.get("keywords")
    if not (isinstance(c, str) and c.strip()):
        errs.append(f"{label}: needs a 'claim'")
    if not (isinstance(kw, list) and kw and all(isinstance(k, str) and words(k) for k in kw)):
        errs.append(f"{label}: 'keywords' must be a non-empty list of words")
    extra = sorted(map(str, set(b) - {"claim", "keywords"}))
    if extra:
        errs.append(f"{label}: unknown key(s) {', '.join(extra)}")
    return errs


def problems(entries, banned):
    """schema problems with the ledger entries and the banned list (empty when both are valid)"""
    errs = []
    for e in entries:
        errs += _entry_problems(e)
    ids = [e["id"] for e in entries if isinstance(e, dict) and isinstance(e.get("id"), str)]
    errs += [f"duplicate ledger id '{i}'" for i in dict.fromkeys(ids) if ids.count(i) > 1]
    vids = [e["video"] for e in entries if isinstance(e, dict) and e.get("status") == "coded"
            and isinstance(e.get("video"), str)]
    errs += [f"duplicate ledger video '{v}'" for v in dict.fromkeys(vids) if vids.count(v) > 1]
    for i, b in enumerate(banned):
        errs += _banned_problems(i, b)
    return errs


def check(claim, topics, entries, banned):
    """the reasons `claim` (with its `topics`) cannot be used: banned, the same story as a ledger entry (similar claim)
    or sharing 3+ topics with one; [] when it is usable. Scores are checked by problems() when an entry is added."""
    errs = []
    hit = banned_hit(claim, banned)
    if hit:
        errs.append(f"banned: {hit}")
    mine = {str(t).strip().lower() for t in topics if str(t).strip()}
    for e in entries:
        if not isinstance(e, dict):
            continue
        eid = e.get("id")
        if similarity(claim, e.get("claim", "")) >= SIMILAR:
            errs.append(f"same story as {eid}: {e.get('claim')}")
        theirs = e.get("topics") if isinstance(e.get("topics"), list) else []
        shared = sorted(mine & {str(t).strip().lower() for t in theirs})
        if len(shared) >= SHARED_TOPICS:
            errs.append(f"shares {len(shared)} topics ({', '.join(shared)}) with {eid}")
    return errs


def video_problems(vid, entries):
    """a (non-template) video needs exactly one ledger entry with video == vid and status coded"""
    n = sum(1 for e in entries if isinstance(e, dict) and e.get("video") == vid and e.get("status") == "coded")
    if n == 1:
        return []
    if n == 0:
        return [f"no coded entry in stories/ledger.yml for video {vid}"]
    return [f"{n} coded entries in stories/ledger.yml for video {vid} (need exactly one)"]


def main(argv):
    ap = argparse.ArgumentParser(prog="ledger.py", description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check", help="exit 0 and print ok when the claim is usable, else exit 1 with the reasons")
    c.add_argument("claim")
    c.add_argument("--topics", default="", help="comma-separated topic words")
    sub.add_parser("validate", help="exit 0 when stories/ledger.yml and stories/banned.yml are valid, else 1")
    args = ap.parse_args(argv)
    try:
        entries, banned = load(ROOT)
    except ValueError as e:
        print(f"stories: {e}")
        return 1
    if args.cmd == "validate":
        errs = problems(entries, banned)
    else:
        errs = check(args.claim, [t for t in args.topics.split(",") if t.strip()], entries, banned)
    print("\n".join(errs) if errs else "ok")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
