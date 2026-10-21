# Git worktree helpers: a second checkout of the same repo in a sibling folder,
# on its own branch. Useful for parallel branches or an AI agent's sandbox.
#   gwa <branch>  create ../<repo>--<branch> on a new branch and cd into it
#   gwr           remove the worktree you're in and delete its branch
# Note: no variable may be called "path" (in zsh it IS $PATH).

# Folder of the main checkout, even when run from inside a worktree
_gw_main() {
  local common
  common=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || return 1
  print -r -- ${common:h}
}

_gw_step() {   # _gw_step <title> <command shown> [explanation]
  gum style --foreground cyan "$1"
  gum style --foreground 240 --margin "0 3" --padding "0 1" --border normal "$2"
  [[ -n $3 ]] && gum style --foreground 243 --margin "0 3" "↳ $3"
}

gwa() {
  if [[ -z $1 ]]; then
    gum style --foreground 208 "Usage: gwa <branch-name>"
    return 1
  fi

  local branch=$1 main dest
  main=$(_gw_main) || { gum style --foreground 208 "⚠️  Not inside a git repository"; return 1; }
  dest="${main:h}/${main:t}--${branch//\//-}"   # feature/x -> repo--feature-x

  gum style --border rounded --padding "0 1" --border-foreground 212 "🌳 Git Worktree Add"
  echo
  _gw_step "📂 Creating worktree sandbox..." \
    "git worktree add -b \"$branch\" \"../${dest:t}\"" \
    "Creates new branch \"$branch\" and checks it out in a sibling folder"
  git -C "$main" worktree add -b "$branch" "$dest" || return 1
  echo
  cd "$dest" || return 1
  gum style --foreground 46 "✅ Done! You're now in: $PWD"
}

gwr() {
  local top main branch
  top=$(git rev-parse --show-toplevel 2>/dev/null) || { gum style --foreground 208 "⚠️  Not inside a git repository"; return 1; }
  main=$(_gw_main)
  if [[ $top == $main ]]; then
    gum style --foreground 208 "⚠️  This is the main checkout, not a worktree"
    return 1
  fi
  branch=$(git branch --show-current)

  gum style --border rounded --padding "0 1" --border-foreground 196 "🗑️  Git Worktree Remove"
  echo

  # Refuse up front if removing would lose work, so nothing is left half-done
  if [[ -n $(git -C "$top" status --porcelain) ]]; then
    gum style --foreground 208 "⚠️  Uncommitted changes in ${top:t}. Commit or stash them first. Nothing removed."
    return 1
  fi
  if [[ -n $branch ]] && ! git -C "$main" merge-base --is-ancestor "$branch" HEAD; then
    gum style --foreground 208 "⚠️  Branch $branch has commits not merged into $(git -C "$main" branch --show-current). Merge them first. Nothing removed."
    return 1
  fi

  gum style --foreground 214 "⚠️  This will remove:"
  gum style --margin "0 3" "• Worktree: ${top:t}/"
  gum style --margin "0 3" "• Branch: ${branch:-(detached HEAD)}"
  echo
  gum confirm "Remove worktree and branch?" || return 0
  echo

  _gw_step "📂 Returning to main project..." "cd \"$main\""
  cd "$main" || return 1
  echo
  # No --force: git itself refuses if the worktree has uncommitted changes
  _gw_step "🗑️  Removing worktree directory..." \
    "git worktree remove \"$top\"" \
    "Removes the folder and unlinks it from git"
  git worktree remove "$top" || return 1
  if [[ -n $branch ]]; then
    echo
    # -d (not -D): git refuses to delete a branch whose commits aren't merged
    _gw_step "🌿 Deleting branch..." "git branch -d \"$branch\"" \
      "Safe delete: only if its commits are merged"
    git branch -d "$branch"
  fi
  echo
  gum style --foreground 46 "✅ Cleanup complete! Back in: $PWD"
}
