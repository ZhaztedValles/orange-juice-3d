"""Server-side gate for the writer's branches (claude/oj-<date>), run by .github/workflows/accept.yml.

Usage:
  python tools/accept_check.py [--paths-only] [--videos-out FILE] <base> <head>
      checks `git diff --name-status --no-renames <base>...<head>` against the path rules below, then (unless
      --paths-only) every touched video folder of the working tree (the merged tree in the workflow) with
      video_check.problems and the story files for valid YAML. Prints `accepted: ...` (exit 0) or the problems (exit 1).
      --videos-out writes "<id> <FRAMES>" per touched video folder, for the smoke stills.
  python tools/accept_check.py --branch REF
      exit 0 when REF is a writer branch name (claude/oj-<[A-Za-z0-9._-]+>), 1 otherwise.
  python tools/accept_check.py --find [--only BRANCH] [--tripwire-out FILE]
      lists origin's writer branches (git ls-remote), fetches each, and prints JSON
      {"branch", "sha", "slug", "tripped": [{"branch", "sha", "paths"}]}: the oldest (commit date) branch to accept,
      "" when none. A branch whose diff vs HEAD (main) touches .github/ is never picked (tripped: the workflow opens an
      issue; --tripwire-out writes its body); a branch that failed at its current sha (state/accept/<slug>.json) is
      skipped until it is pushed again, unless --only names it (a manual re-run).
  python tools/accept_check.py --record-failure BRANCH SHA [REASON]
      a content rejection: parks BRANCH in state/accept/<slug>.json, so --find skips it until its sha changes.
  python tools/accept_check.py --record-infra BRANCH SHA
      a non-content failure: counts one more attempt for this sha (a new sha starts at 1) and parks the branch once
      attempts > 5 ("repeated infrastructure failures (check logs)"); prints the record as JSON.
  python tools/accept_check.py --prune-failures [--rejected-out FILE]
      removes the state/accept records of branches that no longer exist on origin; --rejected-out writes the body of
      the "writer branch rejected" issue from the records that remain ("" when none).

The CODE comes from the copy of this file that is run (CODE_ROOT: the workflow runs main's trusted copy from a git
worktree, never the branch's); the DATA (the diff, the folders, the story files) from the repository in the current
directory, and what is "on main" (folders, render state, posted markers) from <base>.

Path rules: the writer may add or modify only
  videos/<NNN-slug>/<file>.(ts|tsx|json|md|yml|wav)   (no subfolders), in a folder that is new or held, and
  stories/ledger.yml, stories/banned.yml;
deletes only inside a new or held folder; the template 000-bridge never; a new folder's number must be greater than
every number on main (templates included); a held folder is changeable only while it has not been posted.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

CODE_ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(CODE_ROOT), str(CODE_ROOT / "tools")]

TEMPLATE = "000-bridge"
VIDEO_PATH_RE = re.compile(r"videos/(\d{3}-[a-z0-9-]{3,50})/[\w.-]+\.(?:ts|tsx|json|md|yml|wav)", re.ASCII)
VIDEO_DIR_RE = re.compile(r"videos/([^/]+)/", re.ASCII)
STORIES_RE = re.compile(r"stories/(?:ledger|banned)\.yml", re.ASCII)
BRANCH_RE = re.compile(r"claude/oj-[A-Za-z0-9._-]+", re.ASCII)
NO_HISTORY = "no common history with main"
STATUSES = ("A", "M", "D")
WORKFLOW_RE = re.compile(r"\.github(?:/|$)", re.ASCII | re.IGNORECASE)


def branch_ok(ref):
    return bool(BRANCH_RE.fullmatch(ref))


def parse_name_status_z(text):
    """[(status, path)] from `git diff -z --name-status --no-renames` (status NUL path NUL ..., paths unquoted)"""
    parts = text.split("\0")
    if parts and parts[-1] == "":
        parts.pop()
    if len(parts) % 2:
        raise ValueError("malformed git diff -z --name-status output")
    return list(zip(parts[0::2], parts[1::2]))


def workflow_paths(changed):
    """the paths under .github/ (any status, any letter case): such a branch is never processed"""
    return [p for _, p in changed if WORKFLOW_RE.match(p)]


def slug(branch):
    if not branch_ok(branch):
        raise ValueError(f"not a writer branch name: {branch!r}")
    return branch[len("claude/"):]


def pick_branch(branches, failed, tripped, only=None):
    """the oldest ({name, sha, date}) writer branch to accept: not tripped, not failed at its current sha (unless it is
    `only`, a manual re-run), and `only` when given; None when there is none"""
    for b in sorted(branches, key=lambda b: (b["date"], b["name"])):
        name = b["name"]
        if not branch_ok(name) or name in tripped or (only is not None and name != only):
            continue
        if only is None and failed.get(slug(name)) == b["sha"]:
            continue
        return b
    return None


def log_paths_z(text):
    """unique paths, in order, from `git log --format= --name-only -z` (every commit's touched paths)"""
    out = []
    for part in text.split("\0"):
        part = part.strip("\n")
        if part and part not in out:
            out.append(part)
    return out


def _literal(x):
    """x as a JSON string that is inert in GitHub markdown inside a fence: no raw newline, no backtick"""
    return json.dumps(str(x)).replace("`", "\\u0060")


def tripwire_body(tripped):
    lines = ["A writer branch changed files under .github/ (in its diff or in any of its commits), or has no common "
             "history with main. Accept never processes such a branch; check it by hand, then delete it (and review "
             "recent workflow runs).", "", "```"]
    for t in tripped:
        lines.append(f"{_literal(t['branch'])} at {_literal(t['sha'])}:")
        lines += [f"  {_literal(p)}" for p in t["paths"]]
    return "\n".join(lines + ["```"]) + "\n"


def rejected_body(records):
    if not records:
        return ""
    lines = ["Accept rejected these writer branches (content: path rules, merge conflict, video_check, tsc, tests or "
             "smoke stills). Each stays parked until it is pushed again or named in a manual Accept run.", "", "```"]
    lines += [f"{_literal(r.get('branch'))} at {_literal(r.get('sha'))}: {_literal(r.get('reason') or 'rejected')}"
              for r in records]
    return "\n".join(lines + ["```"]) + "\n"


def stale_records(failures, live_branches):
    """slugs of failure records whose branch is gone"""
    return sorted(s for s in failures if f"claude/{s}" not in live_branches)


MAX_INFRA_ATTEMPTS = 5
INFRA_PARKED = "repeated infrastructure failures (check logs)"


def _record_path(state_dir, branch):
    return Path(state_dir) / "accept" / f"{slug(branch)}.json"


def _read_record(state_dir, branch):
    try:
        r = json.loads(_record_path(state_dir, branch).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return r if isinstance(r, dict) else {}


def _attempts_so_far(state_dir, branch, sha):
    r = _read_record(state_dir, branch)
    try:
        return int(r.get("attempts", 0)) if r.get("sha") == sha else 0
    except (TypeError, ValueError):
        return 0


def _write_record(state_dir, branch, sha, attempts, parked, reason):
    rec = {"branch": branch, "sha": sha, "attempts": attempts, "parked": parked, "reason": reason}
    p = _record_path(state_dir, branch)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
    return rec


def record_failure(state_dir, branch, sha, reason=""):
    """a content rejection: park the branch at this sha (counting the attempt)"""
    n = _attempts_so_far(state_dir, branch, sha) + 1
    return _write_record(state_dir, branch, sha, n, True, reason or "rejected")


def record_infra_failure(state_dir, branch, sha):
    """a non-content failure: one more attempt for this sha; parked once attempts > MAX_INFRA_ATTEMPTS"""
    n = _attempts_so_far(state_dir, branch, sha) + 1
    parked = n > MAX_INFRA_ATTEMPTS
    return _write_record(state_dir, branch, sha, n, parked, INFRA_PARKED if parked else "infrastructure failure")


def next_attempt(state_dir, branch, sha):
    """the attempt number a run on (branch, sha) is"""
    return _attempts_so_far(state_dir, branch, sha) + 1


def _is_parked(r):
    return r.get("parked", True) is not False        # records without the flag (older format) count as parked


def parked_records(state_dir):
    return [r for r in load_records(state_dir) if _is_parked(r)]


def load_parked(state_dir):
    """{slug: sha} of the parked records (find skips these branches at that sha)"""
    return {slug(r["branch"]): r.get("sha") for r in parked_records(state_dir)
            if isinstance(r.get("branch"), str) and branch_ok(r["branch"])}


def load_records(state_dir):
    out = []
    for p in sorted((Path(state_dir) / "accept").glob("*.json")):
        try:
            r = json.loads(p.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if isinstance(r, dict):
            out.append(r)
    return out


def load_failures(state_dir):
    """{slug: sha} of the recorded failures"""
    out = {}
    for p in sorted((Path(state_dir) / "accept").glob("*.json")):
        try:
            out[p.stem] = json.loads(p.read_text(encoding="utf-8")).get("sha")
        except (OSError, ValueError, AttributeError):
            pass
    return out


def held_ids(render_states, posted):
    """ids whose render state on main is held and that were never posted: the only existing folders the writer may change"""
    return {vid for vid, st in render_states.items()
            if isinstance(st, dict) and st.get("status") == "held" and vid not in posted}


def touched_videos(changed):
    """sorted ids of the video folders the diff touches"""
    return sorted({m.group(1) for _, p in changed if (m := VIDEO_DIR_RE.match(p))})


def path_problems(changed, held, existing_on_main):
    """problems with the branch's changed paths; changed = [(status, path)] from git diff --name-status --no-renames"""
    errs = []
    top = max((int(v[:3]) for v in existing_on_main if v[:3].isdigit()), default=-1)
    new_numbers = {}
    for st, path in changed:
        if st not in STATUSES:
            errs.append(f"{path}: change type {st!r} not allowed (only add, modify, delete)")
            continue
        if STORIES_RE.fullmatch(path):
            if st == "D":
                errs.append(f"the writer may not delete {path}")
            continue
        m = VIDEO_PATH_RE.fullmatch(path)
        if not m:
            errs.append(f"the writer may not change {path} (only videos/<NNN-slug>/<file>.ts|tsx|json|md|yml|wav "
                        f"and stories/ledger.yml, stories/banned.yml)")
            continue
        vid = m.group(1)
        if vid == TEMPLATE:
            errs.append(f"the writer may not change the template: {path}")
        elif vid in existing_on_main:
            if vid not in held:
                errs.append(f"the writer may not change {path}: {vid} is on main and not held (queued, posted or "
                            f"already rendered)")
        elif int(vid[:3]) <= top:
            errs.append(f"new folder {vid}: its number must be greater than every number on main (highest {top:03d})")
        else:
            new_numbers.setdefault(vid[:3], set()).add(vid)
    for n, vids in sorted(new_numbers.items()):
        if len(vids) > 1:
            errs.append(f"new folders {', '.join(sorted(vids))} share the number {n}")
    return list(dict.fromkeys(errs))


def _git(*args, repo):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True, cwd=str(repo),
                          encoding="utf-8").stdout


def _repo():
    """the repository under inspection: the git work tree of the current directory"""
    return Path(_git("rev-parse", "--show-toplevel", repo=Path.cwd()).strip())


def changes(base, head, repo):
    return parse_name_status_z(_git("diff", "-z", "--name-status", "--no-renames", f"{base}...{head}", repo=repo))


def remote_branches(repo):
    """the writer branch names on origin"""
    out = []
    for ln in _git("ls-remote", "--heads", "origin", repo=repo).splitlines():
        sha, _, ref = ln.partition("\t")
        name = ref[len("refs/heads/"):] if ref.startswith("refs/heads/") else ""
        if branch_ok(name) and re.fullmatch(r"[0-9a-f]{40}", sha):
            out.append(name)
    return out


def find(repo, only=None):
    """{"branch", "sha", "slug", "tripped"} (see the module doc); fetches every writer branch from origin"""
    branches, tripped = [], []
    for name in sorted(remote_branches(repo)):
        _git("fetch", "-q", "--no-tags", "origin", f"+refs/heads/{name}:refs/remotes/origin/{name}", repo=repo)
        sha = _git("rev-parse", f"refs/remotes/origin/{name}^{{commit}}", repo=repo).strip()
        mb = subprocess.run(["git", "merge-base", "HEAD", sha], capture_output=True, text=True, cwd=str(repo))
        if mb.returncode or not mb.stdout.strip():
            paths = [NO_HISTORY]        # unrelated history: never processed (and a three-dot diff would fail)
        else:
            # every commit's paths; a merge commit shows its diff against its first parent, so a workflow added by an
            # evil merge resolution is seen even when a later commit removes it
            log = _git("log", "--format=", "--name-only", "-z", "--diff-merges=first-parent",
                       f"{mb.stdout.strip()}..{sha}", repo=repo)
            touched = [("?", p) for p in log_paths_z(log)]
            paths = list(dict.fromkeys(workflow_paths(changes("HEAD", sha, repo)) + workflow_paths(touched)))
        if paths:
            tripped.append({"branch": name, "sha": sha, "paths": paths})
        date = int(_git("log", "-1", "--format=%ct", sha, repo=repo).strip())
        branches.append({"name": name, "sha": sha, "date": date})
    b = pick_branch(branches, load_parked(repo / "state"), {t["branch"] for t in tripped}, only=only)
    return {"branch": b["name"] if b else "", "sha": b["sha"] if b else "", "slug": slug(b["name"]) if b else "",
            "attempt": next_attempt(repo / "state", b["name"], b["sha"]) if b else 0, "tripped": tripped}


def _ls(base, path, repo, dirs):
    """names directly under `path` at commit `base` (directories or files)"""
    out = _git("ls-tree", "--name-only", *(["-d"] if dirs else []), f"{base}:{path}", repo=repo) \
        if _exists(base, path, repo) else ""
    return [ln for ln in out.splitlines() if ln]


def _exists(base, path, repo):
    return subprocess.run(["git", "cat-file", "-e", f"{base}:{path}"], capture_output=True, cwd=str(repo)).returncode == 0


def main_facts(base, repo):
    """(existing video ids, held ids) on main (= base)"""
    existing = set(_ls(base, "videos", repo, dirs=True))
    states = {}
    for name in _ls(base, "state/render", repo, dirs=False):
        if name.endswith(".json"):
            try:
                states[name[:-5]] = json.loads(_git("show", f"{base}:state/render/{name}", repo=repo))
            except ValueError:
                states[name[:-5]] = None        # unreadable state: not held, so not changeable (fail closed)
    posted = {n[:-5] for n in _ls(base, "state/posted", repo, dirs=False) if n.endswith(".json")}
    return existing, held_ids(states, posted)


def main(argv):
    if argv[:1] == ["--branch"] and len(argv) == 2:
        ok = branch_ok(argv[1])
        print("ok" if ok else f"not a writer branch name: {argv[1]!r} (want claude/oj-[A-Za-z0-9._-]+)")
        return 0 if ok else 1
    if argv[:1] == ["--record-failure"] and len(argv) in (3, 4):
        print(json.dumps(record_failure(_repo() / "state", argv[1], argv[2], argv[3] if len(argv) == 4 else "")))
        return 0
    if argv[:1] == ["--record-infra"] and len(argv) == 3:
        print(json.dumps(record_infra_failure(_repo() / "state", argv[1], argv[2])))
        return 0
    if argv[:1] == ["--prune-failures"] and len(argv) in (1, 3) and argv[1:2] in ([], ["--rejected-out"]):
        state = _repo() / "state"
        for s_ in stale_records(load_failures(state), set(remote_branches(_repo()))):
            (state / "accept" / f"{s_}.json").unlink()
            print(f"pruned state/accept/{s_}.json")
        if len(argv) == 3:
            Path(argv[2]).write_text(rejected_body(parked_records(state)), encoding="utf-8")
        return 0
    if argv[:1] == ["--find"]:
        opts = dict(zip(argv[1::2], argv[2::2]))
        if len(argv) % 2 == 0 or set(opts) - {"--only", "--tripwire-out"}:
            print(__doc__, file=sys.stderr)
            return 2
        res = find(_repo(), only=opts.get("--only") or None)
        if opts.get("--tripwire-out"):
            Path(opts["--tripwire-out"]).write_text(tripwire_body(res["tripped"]) if res["tripped"] else "",
                                                    encoding="utf-8")
        print(json.dumps(res))
        return 0
    paths_only = "--paths-only" in argv
    argv = [a for a in argv if a != "--paths-only"]
    videos_out = None
    if "--videos-out" in argv:
        i = argv.index("--videos-out")
        videos_out = argv[i + 1]
        del argv[i:i + 2]
    if len(argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    base, head = argv
    repo = _repo()
    changed = changes(base, head, repo)
    existing, held = main_facts(base, repo)
    errs = path_problems(changed, held, existing)
    vids = touched_videos(changed)
    if not paths_only:
        import yaml
        import video_check
        from audio import spec
        for vid in vids:
            errs += [f"videos/{vid}: {p}" for p in video_check.problems(repo / "videos" / vid)]
        for st, path in changed:
            if STORIES_RE.fullmatch(path) and st != "D":
                try:
                    yaml.safe_load((repo / path).read_text(encoding="utf-8"))
                except (OSError, ValueError, yaml.YAMLError) as e:
                    errs.append(f"{path} is not valid YAML: {' '.join(str(e).split())}")
        if videos_out and not errs:
            Path(videos_out).write_text("".join(f"{v} {spec.frames(repo / 'videos' / v)}\n" for v in vids),
                                        encoding="utf-8")
    print("\n".join(errs) if errs else f"accepted: {len(changed)} changed file(s), video folder(s): "
          f"{' '.join(vids) or 'none'}")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
