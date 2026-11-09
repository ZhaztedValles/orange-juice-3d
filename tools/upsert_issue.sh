#!/usr/bin/env bash
# Open or update the one open issue with exactly this title: create it when there is none, edit its body only when the
# body differs (so a scheduled workflow does not spam). Used by accept.yml (tripwire, rejected branches).
# usage: GH_TOKEN=... GH_REPO=owner/repo bash tools/upsert_issue.sh "<title>" <body-file>
set -euo pipefail
title=$1
body=$2
num=$(gh issue list --state open --search "\"$title\" in:title" --json number,title \
        --jq "map(select(.title == \"$title\")) | .[0].number // empty")
if [ -z "$num" ]; then
  gh issue create --title "$title" --body-file "$body"
elif [ "$(gh issue view "$num" --json body --jq .body)" != "$(cat "$body")" ]; then
  gh issue edit "$num" --body-file "$body"
else
  echo "issue #$num is up to date"
fi
