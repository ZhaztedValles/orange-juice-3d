from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

def test_writer_md_mentions_every_tool_and_rule():
    w = (ROOT / "WRITER.md").read_text(encoding="utf-8")
    for s in ("tools/today.py", "tools/ledger.py check", "tools/voice.py", "tools/writer_check.py",
              "scripts/stills.mjs", "scripts/sbs_sheet.py", "git branch --show-current", "orange-juice-refs", "/tmp/oj-sheets",
              "You see,", "0-3 frames", "2 independent", "3 hours", "git rebase origin/main", "never merge",
              ".github", "src/engine", "stories/ledger.yml", "stories/banned.yml", "docs/video-format.md",
              "Readability traps", "paused"):
        assert s in w, s

def test_no_reference_images_tracked():
    # reference frames must never enter this public repo: the only tracked images are our own (public/, smoke/)
    import subprocess
    files = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    imgs = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif"))
            and not f.startswith(("public/", "smoke/"))]
    assert imgs == []

def test_writer_md_forbids_copying_refs():
    w = (ROOT / "WRITER.md").read_text(encoding="utf-8")
    assert "Never copy reference frames" in w and "never name" in w.lower()

def test_setup_values():
    s = (ROOT / "docs" / "WRITER-SETUP.md").read_text(encoding="utf-8")
    for v in ("Orange Juice 3D writer", "ZhaztedValles/orange-juice-3d", "ZhaztedValles/orange-juice-refs",
              "2:00 AM", "Follow WRITER.md", "Full"):
        assert v in s, v
