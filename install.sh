#!/bin/bash
# Set up this Mac from ~/.dotfiles. Safe to run again.
#   ./install.sh             packages, links, macOS settings
#   ./install.sh --no-macos  skip the macOS settings
set -euo pipefail
cd "$(dirname "$0")"
dotfiles=$PWD

command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh"; exit 1; }

echo "==> Packages (packages/Brewfile)"
brew bundle --file packages/Brewfile --no-upgrade

echo "==> Let zsh trust Homebrew's completion folders"
chmod go-w "$(brew --prefix)/share"
chmod -R go-w "$(brew --prefix)/share/zsh"

echo "==> Links: home/ -> ~"
# A real file where a link should go is moved to a backup folder, not overwritten
backup="$HOME/.dotfiles-backup/$(date +%Y%m%d-%H%M%S)"
(cd home && find . -type f) | while read -r f; do
  target="$HOME/${f#./}"
  if [[ -e $target && ! -L $target ]]; then
    mkdir -p "$backup/$(dirname "${f#./}")"
    mv "$target" "$backup/${f#./}"
    echo "    backed up ~/${f#./}"
  fi
done
# --no-folding: link files only, never whole folders (keeps app data out of the repo)
stow --no-folding --restow --dir "$dotfiles" --target "$HOME" home

echo "==> Git hooks: gitleaks blocks commits containing secrets"
git -C "$dotfiles" config core.hooksPath scripts/hooks

if [[ ${1:-} != --no-macos ]]; then
  echo "==> macOS settings"
  scripts/macos-defaults.sh
fi

echo "Done. Open a new terminal to load the shell config."
