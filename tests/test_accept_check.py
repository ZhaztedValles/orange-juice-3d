import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import accept_check  # noqa: E402

MAIN = {"000-bridge", "001-old-one", "004-queued-one", "005-held-one"}
HELD = {"005-held-one"}


def probs(*changed, held=HELD, main=MAIN):
    return accept_check.path_problems(list(changed), held, main)


def test_new_folder_accepted():
    assert probs(("A", "videos/006-new-story/Video.tsx"), ("A", "videos/006-new-story/meta.yml"),
                 ("A", "videos/006-new-story/voice.wav"), ("A", "videos/006-new-story/cast.ts")) == []


def test_change_to_queued_folder_rejected():
    assert probs(("M", "videos/004-queued-one/Video.tsx"))


def test_change_to_held_folder_accepted():
    assert probs(("M", "videos/005-held-one/Video.tsx"), ("A", "videos/005-held-one/extra.ts")) == []


def test_template_rejected():
    assert probs(("M", "videos/000-bridge/Video.tsx"))
    assert probs(("M", "videos/000-bridge/Video.tsx"), held=HELD | {"000-bridge"})     # even if it were held


@pytest.mark.parametrize("path", ["src/engine/ink.ts", ".github/workflows/x.yml", "tests/test_x.py", "config.yml",
                                  "videos/006-new-story/sub/dir.ts", "videos/006-new-story/evil.sh",
                                  "tools/accept_check.py", "scripts/gen-registry.mjs", "conftest.py", "package.json",
                                  "stories/other.yml", "state/render/005-held-one.json", "videos/README.md",
                                  '"videos/006-new-story/odd\\tname.ts"', "videos/006-new-story/Vidéo.tsx",
                                  "videos/6-x/Video.tsx", "videos/006-New/Video.tsx"])
def test_paths_outside_the_allowed_shapes_rejected(path):
    assert probs(("A", path))
    assert probs(("M", path))


def test_engine_file_rejected():
    assert any("src/engine/ink.ts" in p for p in probs(("M", "src/engine/ink.ts")))


def test_workflow_rejected():
    assert probs(("M", ".github/workflows/x.yml"))


def test_tests_rejected():
    assert probs(("A", "tests/test_x.py"))


def test_config_rejected():
    assert probs(("M", "config.yml"))


def test_subfolder_rejected():
    assert probs(("A", "videos/001-ok/sub/dir.ts"), main={"000-bridge"})


def test_shell_script_rejected():
    assert probs(("A", "videos/001-ok/evil.sh"), main={"000-bridge"})


def test_new_id_lower_than_mains_highest_rejected():
    assert any("003-late-one" in p for p in probs(("A", "videos/003-late-one/Video.tsx")))
    assert probs(("A", "videos/005-other-slug/Video.tsx"))          # same number as an existing folder
    assert probs(("A", "videos/009-gap-is-fine/Video.tsx")) == []


def test_new_id_must_beat_templates_too():
    assert probs(("A", "videos/000-another/Video.tsx"), main={"000-bridge"})


def test_stories_accepted():
    assert probs(("M", "stories/ledger.yml"), ("A", "stories/banned.yml")) == []


def test_stories_delete_rejected():
    assert probs(("D", "stories/ledger.yml"))


def test_posted_folder_rejected():
    held = accept_check.held_ids({"005-held-one": {"status": "held"}, "004-queued-one": {"status": "queued"}},
                                 posted={"005-held-one"})
    assert held == set()
    assert probs(("M", "videos/005-held-one/Video.tsx"), held=held)


def test_held_ids_only_status_held():
    assert accept_check.held_ids({"005-held-one": {"status": "held"}, "004-queued-one": {"status": "queued"},
                                  "001-old-one": {}}, posted=set()) == {"005-held-one"}


def test_delete_inside_new_folder_allowed():
    assert probs(("A", "videos/006-new-story/Video.tsx"), ("D", "videos/006-new-story/old.ts")) == []


def test_delete_inside_held_folder_allowed():
    assert probs(("D", "videos/005-held-one/cast.ts")) == []


def test_delete_inside_queued_folder_rejected():
    assert probs(("D", "videos/004-queued-one/cast.ts"))


def test_unknown_status_rejected():
    assert probs(("C", "videos/006-new-story/Video.tsx"))
    assert probs(("T", "videos/006-new-story/Video.tsx"))


def test_touched_videos():
    assert accept_check.touched_videos([("A", "videos/006-new-story/Video.tsx"), ("M", "videos/005-held-one/a.ts"),
                                        ("M", "stories/ledger.yml")]) == ["005-held-one", "006-new-story"]


@pytest.mark.parametrize("ref,ok", [("claude/oj-2026-11-09", True), ("claude/oj-test-accept", True),
                                    ("claude/oj-", False), ("claude/routine-x", False), ("main", False),
                                    ("claude/oj-a b", False), ("claude/oj-$(id)", False), ("claude/oj-x;rm", False),
                                    ("claude/oj-x/y", False), ("claude/oj-x\n", False)])
def test_branch_name(ref, ok):
    assert accept_check.branch_ok(ref) is ok


def test_cli_branch_name_exit_codes():
    cmd = [sys.executable, str(ROOT / "tools" / "accept_check.py"), "--branch"]
    assert subprocess.run(cmd + ["claude/oj-2026-11-09"], capture_output=True).returncode == 0
    assert subprocess.run(cmd + ["claude/oj-$(id)"], capture_output=True).returncode == 1


def _git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


def test_cli_on_a_repo(tmp_path):
    """end to end on a scratch repo: main has the template, a queued and a held video; the branch adds a new folder
    (copied from the template, so it passes video_check), edits the held one's SCRIPT.md and the queued one"""
    import shutil
    repo = tmp_path / "r"
    repo.mkdir()
    _git(repo, "init", "-q", "-b", "main")
    _git(repo, "config", "user.email", "t@example.com")
    _git(repo, "config", "user.name", "t")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "000-bridge")
    for vid in ("001-queued-one", "002-held-one"):
        shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / vid)
    (repo / "state" / "render").mkdir(parents=True)
    (repo / "state" / "render" / "001-queued-one.json").write_text('{"status": "queued"}')
    (repo / "state" / "render" / "002-held-one.json").write_text('{"status": "held"}')
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "main")
    _git(repo, "checkout", "-q", "-b", "claude/oj-x")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "003-new-one")
    with open(repo / "videos" / "002-held-one" / "SCRIPT.md", "a", encoding="utf-8") as f:
        f.write("\n")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "good")
    cli = [sys.executable, str(ROOT / "tools" / "accept_check.py")]
    r = subprocess.run(cli + ["main", "HEAD", "--videos-out", str(tmp_path / "v.txt")], cwd=repo, capture_output=True,
                       text=True)
    assert r.returncode == 0, r.stdout + r.stderr
    assert r.stdout.startswith("accepted")
    assert (tmp_path / "v.txt").read_text().split() == ["002-held-one", "2025", "003-new-one", "2025"]
    with open(repo / "videos" / "001-queued-one" / "SCRIPT.md", "a", encoding="utf-8") as f:
        f.write("\n")
    (repo / "videos" / "003-new-one" / "evil.sh").write_text("echo")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "bad")
    r = subprocess.run(cli + ["main", "HEAD"], cwd=repo, capture_output=True, text=True)
    assert r.returncode == 1
    assert "001-queued-one" in r.stdout and "evil.sh" in r.stdout
    r = subprocess.run(cli + ["--paths-only", "main", "HEAD"], cwd=repo, capture_output=True, text=True)
    assert r.returncode == 1 and "001-queued-one" in r.stdout
