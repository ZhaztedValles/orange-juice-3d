"""Where queued videos live.

Videos are files attached to a GitHub Release named "queue" (the render workflow uploads <id>.mp4 + <id>.yml there).
Posting downloads only the video it is about to post and deletes its two assets once the post is recorded.

Set OJ_LOCAL_QUEUE=/some/folder to use a plain folder instead (for testing).
"""
import json
import os
import shutil
import subprocess
from pathlib import Path

TAG = "queue"
NOTES = "Render queue: <id>.mp4 + <id>.yml per short. Posted automatically, then removed."


class ReleaseStore:
    def _gh(self, *args, check=True):
        r = subprocess.run(["gh", *args], capture_output=True, text=True)
        if check and r.returncode:
            raise RuntimeError(f"gh {' '.join(args[:3])} failed: {r.stderr.strip()[:300]}")
        return r

    def ensure(self):
        if self._gh("release", "view", TAG, check=False).returncode:
            self._gh("release", "create", TAG, "--prerelease", "--title", TAG, "--notes", NOTES)
            print("Created the 'queue' release")

    def names(self):
        r = self._gh("release", "view", TAG, "--json", "assets")
        return [a["name"] for a in json.loads(r.stdout)["assets"]]

    def download(self, pattern, dest):
        Path(dest).mkdir(parents=True, exist_ok=True)
        self._gh("release", "download", TAG, "--pattern", pattern, "--dir", str(dest), "--clobber")

    def delete(self, name):
        self._gh("release", "delete-asset", TAG, name, "--yes")

    def upload(self, path):
        self.ensure()
        self._gh("release", "upload", TAG, str(path), "--clobber")


class LocalStore:
    def __init__(self, folder):
        self.dir = Path(folder)

    def ensure(self):
        self.dir.mkdir(parents=True, exist_ok=True)

    def names(self):
        self.ensure()
        return sorted(p.name for p in self.dir.iterdir() if p.is_file())

    def download(self, pattern, dest):
        Path(dest).mkdir(parents=True, exist_ok=True)
        for p in self.dir.glob(pattern):
            shutil.copy(p, Path(dest) / p.name)

    def delete(self, name):
        (self.dir / name).unlink(missing_ok=True)

    def upload(self, path):
        self.ensure()
        shutil.copy(path, self.dir / Path(path).name)


def get_store():
    local = os.environ.get("OJ_LOCAL_QUEUE")
    return LocalStore(local) if local else ReleaseStore()
