#!/bin/bash
# Rex app settings, applied with `defaults write`, then the Gruvbox Dark theme
# imported. Run by hand from another terminal (Ghostty) with Rex quit;
# safe to run again. Edit a line here and rerun to change one.
#
# shortcut: Rex can't set app settings from init.lua yet (accepted request,
#           "settings in config files"), and these key names are undocumented.
#           Replace this with Rex's settings export / Lua settings when they ship.
set -euo pipefail

app="Rex Beta"
theme="$(cd "$(dirname "$0")/.." && pwd)/home/.config/rex/themes/Gruvbox Dark"

# Rex rewrites its preferences while open, which would undo these writes.
if pgrep -f "$app.app/Contents/MacOS/" >/dev/null; then
  echo "Quit Rex first (Cmd+Q), then run this from another terminal, such as Ghostty." >&2
  exit 1
fi

d="defaults write com.superlogical.rex"
$d Workspace.appearance -string dark                      # always dark, even when macOS is light
$d Workspace.terminalFontPointSize -float 14              # same size as Ghostty
$d Workspace.terminalFontSmoothing -bool false            # thin text, like Ghostty
$d Workspace.terminalCopyOnSelect -bool true              # releasing a selection copies it
$d Workspace.inactivePaneFadeMode -string both            # dim inactive panes
$d Workspace.showsActivePaneBorder -bool true             # border around the focused pane
$d Workspace.tabIconTintMode -string off                  # tab icons keep their own colours
$d Workspace.usesStandardInactiveWindowPaneStyles -bool true
$d rex.agents.names-sessions -bool true                   # agents name sessions after their task
$d rex.client.remoteControl -bool true                    # lets `rex do` drive the app (needed below)
echo "Rex settings written."

# The theme import needs the app running. `rex` is only on PATH inside Rex,
# so fall back to the copy the app installs.
rex=$(command -v rex || echo "$HOME/Library/Application Support/com.superlogical.rex/RexServer/Versions/Current/Rex Server.app/Contents/MacOS/rex")
open -a "$app"
for _ in $(seq 30); do
  # --autostart=false: wait for the app's own server instead of starting another.
  if "$rex" --autostart=false "do" client.theme.import path="$theme" 2>/dev/null; then
    echo "Gruvbox Dark imported."
    exit 0
  fi
  sleep 1
done
echo "Rex didn't answer in 30 s. Import the theme by hand:" >&2
echo "  rex do client.theme.import path=\"$theme\"" >&2
exit 1
