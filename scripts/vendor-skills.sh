#!/bin/bash
# Copy Matt Pocock's agent skills into skills/, unmodified.
#   scripts/vendor-skills.sh            re-copy at the pinned commit
#   scripts/vendor-skills.sh <commit>   update to another commit (e.g. main's latest)
# Then review with `git diff skills/` and commit. License: third_party/mattpocock-skills.LICENSE
set -euo pipefail

REPO=mattpocock/skills
COMMIT=${1:-4ae2317ddb22b046e26455e4f9c9b3aaaf62212d}
SKILLS=(
  grill-me grilling diagnosing-bugs handoff wait-what teach research writing-for-agents
  tdd wayfinder grill-with-docs to-spec to-tickets implement code-review retro
  domain-modeling setup-matt-pocock-skills prototype
  codebase-design triage improve-codebase-architecture ask-matt implement-spec pr
  to-questionnaire wizard
)

dotfiles=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$COMMIT" | tar xz -C "$tmp"
src=$(echo "$tmp"/*/skills)

for name in "${SKILLS[@]}"; do
  from=$(find "$src" -type d -name "$name" -path '*/skills/*/*' | head -1)
  [[ -f $from/SKILL.md ]] || { echo "not found upstream: $name" >&2; exit 1; }
  rm -rf "${dotfiles:?}/skills/$name"
  cp -R "$from" "$dotfiles/skills/$name"
done
cp "$tmp"/*/LICENSE "$dotfiles/third_party/mattpocock-skills.LICENSE"

# Record the commit so a later run without arguments reproduces this copy
sed -i '' "s/^COMMIT=\${1:-[0-9a-f]*}/COMMIT=\${1:-$COMMIT}/" "$dotfiles/scripts/vendor-skills.sh"
echo "Vendored ${#SKILLS[@]} skills from $REPO@${COMMIT:0:7}. Review: git -C $dotfiles diff --stat skills/"
