#!/usr/bin/env bash
# Commit state/ and push it with 3 pull/rebase/push tries (FactPop's loop). Used by render.yml's finish and
# held-on-render-failure jobs, whose checkouts do not persist credentials: the push credential (GH_TOKEN, from the
# step's env) is set on the remote here, right before pushing.
# usage: GH_TOKEN=... GITHUB_REPOSITORY=owner/repo bash tools/save_state.sh "<commit message>"
set -euo pipefail
msg=$1
git config user.name "orange-juice-autopilot"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A state
if git diff --cached --quiet; then echo "Nothing to save"; exit 0; fi
git commit -q -m "$msg"
git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}"
for i in 1 2 3; do
  if git pull --rebase -q && git push -q; then exit 0; fi
  git rebase --abort 2>/dev/null || true
  sleep $((i * 5))
done
echo "::error::Could not save progress after 3 tries"
exit 1
