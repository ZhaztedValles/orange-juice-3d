# The Orange Juice 3D nightly writer (Claude routine)

The videos are written every night by a scheduled Claude Code routine on the owner's personal Claude account.
If it is ever deleted, recreate it with exactly these values.

| Setting | Value |
|---|---|
| Name | `Orange Juice 3D writer` |
| Repositories | `ZhaztedValles/orange-juice-3d` and `ZhaztedValles/orange-juice-refs` |
| Schedule | Daily, **2:00 AM Manila** (18:00 UTC) |
| Prompt | `Follow WRITER.md in the orange-juice-3d repository exactly. Tonight is a normal Orange Juice run.` |
| Network | **Full**, set on the routine's cloud environment (claude.ai/code → the environment picker → edit → Network access → Full). "Trusted" is not enough: it blocks remotion.media (the render browser) and kenney.nl (the 3D models). |
| Tools | Web search **on** |
| GitHub access | Push to `claude/*` branches (the default restriction) |

Both repositories must be in the routine: the writer looks for `orange-juice-refs` next to `orange-juice-3d` and stops
if it is missing. The refs repo stays private; the writer only reads it.

## The cloud environment (one time)

The routine runs in a Claude cloud environment. Set it up once so the heavy installs (PyTorch, the Kokoro voice model)
are cached instead of downloaded every night:

1. claude.ai/code → the environment picker → edit the routine's environment.
2. **Network access:** Full.
3. **Environment variables:** add `HF_HOME=/opt/hf-cache`.
4. **Setup script:** paste the whole of [`docs/writer-env-setup.sh`](writer-env-setup.sh). It installs everything
   system-wide; the disk is then snapshotted and reused by later runs (rebuilt when the script changes or after about
   7 days). WRITER.md's own install commands then finish in seconds ("already satisfied").

## Where to create it

claude.ai/code → **Routines** → **New routine** → fill in the values above → **Create**.

Before the first real night, run the one-off smoke test: set the prompt to
`Follow docs/WRITER-SMOKE.md in the orange-juice-3d repository exactly.` and press **Run now**. When its
`claude/smoke-<date>` branch has been read, switch the prompt back to the value above.

## What happens each night

1. The routine follows `WRITER.md`. It checks `paused`, fixes or drops held videos, picks one strange true story,
   fact-checks it on 2 independent sources, writes the script, makes the voice, and codes a new folder `videos/<NNN-slug>/`.
   It checks its own stills against the private references, and its last self-check is `tools/writer_check.py`.
2. It pushes one branch named `claude/oj-<date>`.
3. GitHub's **Accept** workflow re-checks everything with main's trusted copy of the tools (path rules, the folder
   contract, the story ledger, tsc, tests, a smoke still). It then merges the branch into `main` and starts **Render**.
4. Render builds the video (about 31 minutes) into the `queue` release. While `require_approval: true`, a video posts
   only after you add its id to `state/approved.yml`; posting then picks it up at the next slot in `config.yml`.

## If something goes wrong

- The daily **Queue report** opens a GitHub issue when the queue is running low (`Orange Juice: queue low`), the writer
  has gone silent (`Orange Juice: writer silent`), or videos are held (`Orange Juice: videos held`). The writer fixes
  held videos itself (2 attempts, then it drops them).
- **Accept** opens the issue `Orange Juice: writer branch rejected` if a branch could not be accepted, with the
  reasons. The writer does not read issues: a rejected branch stays parked, and the next night starts a fresh branch
  from `main`. A branch that touches `.github/` is never processed and opens `Orange Juice: writer branch touched
  workflows`.
- To stop everything, set `paused: true` in `config.yml`. The writer then stops at its first step and pushes nothing.
