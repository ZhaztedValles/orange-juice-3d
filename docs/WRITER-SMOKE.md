# Writer smoke test (one-off "Run now")

This is a one-off test of the cloud session, run once before the nightly routine is switched on. The routine prompt
for it is `Follow docs/WRITER-SMOKE.md in the orange-juice-3d repository exactly.` It makes no video, writes no
story, and touches no file outside `smoke/`. Follow the steps in order. If a step fails, record the error and go on
with the next step; always finish with steps 7 and 8.

1. **Start.** `mkdir -p smoke && date -u +%FT%TZ > /tmp/smoke-start`. Time every step below with `time` (or `date +%s`
   before and after) and keep the numbers for the report.
2. **Setup.** Run the setup section of `WRITER.md` (section 2), but name the branch `claude/smoke-<date>` instead of
   `claude/oj-<date>`:
   ```bash
   TZ=Asia/Manila date +%F > /tmp/oj-date
   npm ci
   npx remotion browser ensure
   node scripts/fetch-kenney.mjs
   pip install -r requirements.txt -r requirements-voice.txt
   export REMOTION_TMP=/tmp/remotion-tmp GL=swangle
   git fetch origin && git checkout -b claude/smoke-$(cat /tmp/oj-date) origin/main
   ```
   Time each command separately.
3. **Tonight's plan.** Run `python tools/today.py`. If it fails with a `gh` error, record the error and run
   `OJ_LOCAL_QUEUE=/tmp/oj-no-queue python tools/today.py`. Record both outputs.
4. **Stills.** Render frames 100 and 1000 of the bridge template at 0.5 with software GL:
   ```bash
   GL=swangle REMOTION_TMP=/tmp/remotion-tmp COMPOSITION=oj-000-bridge node scripts/stills.mjs smoke/bridge_ 100,1000 0.5
   ```
   This writes `smoke/bridge_100.jpg` and `smoke/bridge_1000.jpg`. Record the bundle time and the time per still
   that the script prints. These 2 stills are our own renders: they are the only images that go into `smoke/`.
5. **Voice.** On a copy in `/tmp`, never in the repo:
   ```bash
   mkdir -p /tmp/smoke/videos && cp -r videos/000-bridge /tmp/smoke/videos/000-bridge
   python tools/voice.py /tmp/smoke/videos/000-bridge
   ```
   Record its printed line (words, seconds, words/s) and the time it took. If it fails, record the error; if the
   error mentions espeak, also try `sudo apt-get install -y espeak-ng` and run it again.
6. **References.** Check that the refs repo is readable, by count only:
   ```bash
   ls ..
   ls ../orange-juice-refs/frames | wc -l
   ls ../orange-juice-refs/reports | wc -l
   ```
   Record the 2 counts. Never copy a frame, never open one into the report, never write a frame's name or contents in
   `smoke/`. Reference frames never go into `smoke/`. Never name the reference channel.
7. **Report.** Write `smoke/REPORT.md` with:
   - the start time and the total time;
   - a table of every step with its duration and result (ok or the error, first lines only);
   - versions: `node --version`, `npm --version`, `python --version`, `pip --version`, `git --version`,
     `gh --version` (or "not installed"), `ffmpeg -version | head -1` (or "not installed"), `uname -a`, `nproc`,
     `free -g`, `df -h /tmp .`;
   - the `today.py` output, the voice line, the still timings and the 2 reference counts.
8. **Push and clean up.**
   ```bash
   git add smoke/REPORT.md smoke/bridge_100.jpg smoke/bridge_1000.jpg
   git status --short          # only those 3 files, nothing else
   git commit -m "Smoke test $(cat /tmp/oj-date)"
   git push -u origin HEAD
   rm -rf /tmp/remotion-tmp /tmp/smoke
   ```
   The branch is `claude/smoke-<date>`, not `claude/oj-`, so Accept ignores it; the controller reads it and then
   deletes it. Finish with a short summary: the total time and which steps failed.
