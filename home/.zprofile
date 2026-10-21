# Homebrew (Apple Silicon): puts brew, gh, fnm and other tools on PATH
eval "$(/opt/homebrew/bin/brew shellenv)"

# User executables
export PATH="$HOME/.local/bin:$PATH"

# Java (Temurin 21): looked up at login, no hard-coded path
export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null)"

# Brewfile lives in the dotfiles repo; `brew bundle --global` uses it from anywhere
export HOMEBREW_BUNDLE_FILE_GLOBAL="$HOME/.dotfiles/packages/Brewfile"
