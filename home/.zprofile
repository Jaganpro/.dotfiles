# Homebrew (Apple Silicon): puts brew, gh, fnm and other tools on PATH
eval "$(/opt/homebrew/bin/brew shellenv)"

# User executables
export PATH="$HOME/.local/bin:$PATH"

# Java (Temurin 21): looked up at login, no hard-coded path
export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null)"

# Brewfile lives in the dotfiles repo; `brew bundle --global` uses it from anywhere
export HOMEBREW_BUNDLE_FILE_GLOBAL="$HOME/.dotfiles/packages/Brewfile"

# Editor for git commit messages, crontab, `fc` etc. (agents set GIT_EDITOR=true, so they never open it)
export EDITOR=nvim
export VISUAL=nvim

# Cloudflare Wrangler: no anonymous usage data
export WRANGLER_SEND_METRICS=false

# ripgrep reads its default options from here
export RIPGREP_CONFIG_PATH="$HOME/.config/ripgrep/config"
