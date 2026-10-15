#!/usr/bin/env bash
# Create the tickets in tickets/*.md as GitHub issues, labelled Sandcastle,
# with native "blocked by" links. Forks don't copy issues, so run this once
# in your own fork or copy.
#
# Usage: npm run tickets [-- owner/repo]   (default: the origin remote)
#    or: scripts/seed-issues.sh [owner/repo]
#
# Auth: GH_TOKEN from the environment, else GH_TOKEN from .sandcastle/.env,
# else gh's own login.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${GH_TOKEN:-}" ] && [ -f .sandcastle/.env ]; then
  GH_TOKEN=$(sed -n 's/^[[:space:]]*\(export[[:space:]]\{1,\}\)\{0,1\}GH_TOKEN=//p' .sandcastle/.env | tail -n1 | tr -d "\"'[:space:]")
  if [ -n "$GH_TOKEN" ]; then
    export GH_TOKEN
    echo "Using GH_TOKEN from .sandcastle/.env"
  else
    unset GH_TOKEN
  fi
fi

# Target origin explicitly: in a fork, gh would otherwise default to the upstream repo.
repo=${1:-$(git remote get-url origin | sed -E 's#^(git@github\.com:|https://github\.com/)##; s#\.git$##')}
echo "Seeding issues in $repo"

if [ "$(gh api "repos/$repo" --jq .has_issues)" != "true" ]; then
  echo "Issues are disabled on $repo (the default for forks)." >&2
  echo "Enable them: Settings → General → Features → Issues, or: gh repo edit $repo --enable-issues" >&2
  exit 1
fi

if [ -n "$(gh issue list -R "$repo" --label Sandcastle --state all --limit 1 --json number --jq '.[].number')" ]; then
  echo "$repo already has Sandcastle issues; not seeding twice." >&2
  exit 1
fi

gh label create Sandcastle -R "$repo" --color f9d0c4 --description "Picked up by Sandcastle" 2>/dev/null || true

nums=() # ticket number (01, 02, ...) -> created issue number
for file in tickets/[0-9][0-9]-*.md; do
  nn=$(basename "$file" | cut -c1-2)
  title=$(head -n1 "$file" | sed 's/^# //')
  body=$(tail -n +2 "$file")
  blockers=$(printf '%s\n' "$body" | sed -n 's/^- #{{\([0-9][0-9]\)}}$/\1/p')
  for b in $blockers; do
    body=$(printf '%s\n' "$body" | sed "s/{{$b}}/${nums[10#$b]}/")
  done

  url=$(gh issue create -R "$repo" --title "$title" --label Sandcastle --body "$body")
  num=${url##*/}
  nums[10#$nn]=$num
  echo "#$num $title"

  for b in $blockers; do
    id=$(gh api "repos/$repo/issues/${nums[10#$b]}" --jq .id)
    gh api --method POST "repos/$repo/issues/$num/dependencies/blocked_by" -F issue_id="$id" >/dev/null \
      || echo "  (could not add native blocked-by #${nums[10#$b]}; it is still listed in the body)" >&2
  done
done
