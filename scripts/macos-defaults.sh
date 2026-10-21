#!/bin/bash
# macOS preferences, applied with `defaults write`. Run by `dot init` (or on its
# own any time); safe to run again. Edit a line here and rerun to change one.
set -euo pipefail

# --- Global ---
defaults write NSGlobalDomain AppleShowAllExtensions -bool true   # report.pdf, not report
defaults write NSGlobalDomain KeyRepeat -int 2                    # fast key repeat
defaults write NSGlobalDomain InitialKeyRepeat -int 15            # short delay before repeat

# --- Finder ---
defaults write com.apple.finder ShowPathbar -bool true            # path bar at the bottom
defaults write com.apple.finder FXPreferredViewStyle -string clmv # column view
defaults write com.apple.finder FXDefaultSearchScope -string SCcf # search the current folder
defaults write com.apple.finder AppleShowAllFiles -bool true      # show hidden files (.zshrc, ...)

# --- Dock ---
defaults write com.apple.dock tilesize -int 67                    # icon size
defaults write com.apple.dock magnification -bool true            # grow icons on hover
defaults write com.apple.dock largesize -int 128                  # ... up to this size

# --- Screenshots ---
mkdir -p "$HOME/Pictures/Screenshots"
defaults write com.apple.screencapture type -string png
defaults write com.apple.screencapture location -string "$HOME/Pictures/Screenshots"

# Restart the apps that read these so changes show now.
# Key repeat takes effect after logging out and back in.
killall Finder Dock SystemUIServer 2>/dev/null || true
echo "macOS preferences applied (key repeat: after next login)."
