#!/bin/bash
# Grok Bot app settings: writes only the general (non-personal) keys into
# ~/.grokbot/settings.json and leaves everything else in that file untouched
# (sign-in, connectors, connector instructions, auto-review rules).
# Run with Grok Bot quit, after signing in to it once; safe to run again.
# Edit a value here and rerun to change one.
#
# shortcut: Grok Bot has no settings export or config file of its own, and
#           these key names are undocumented. Replace this when it gets one.
set -euo pipefail

file="$HOME/.grokbot/settings.json"

if [[ ! -f $file ]]; then
  echo "No $file yet: open Grok Bot, sign in and finish its setup, quit it, then rerun." >&2
  exit 1
fi
# Grok Bot rewrites this file while open, which would undo these writes.
if pgrep -f "Grok Bot.app/Contents/MacOS/" >/dev/null; then
  echo "Quit Grok Bot first (Cmd+Q), then rerun." >&2
  exit 1
fi

cp "$file" "$file.bak"   # undo: mv ~/.grokbot/settings.json.bak ~/.grokbot/settings.json

tmp=$(mktemp "$file.XXXXXX")
jq '
  .autoUpdateWhenIdle    = true      # install updates when idle
  | .localToolPermission = "always"  # local tools run without asking each time
  | .localEgressAllowed  = true      # local tools may use the network
  | .egressTunnelEnabled = false     # no egress tunnel
  | .webauthnProxyEnabled = true     # passkeys / security keys work in its browser
  | .messagesEnabled     = false     # Messages integration off
  | .botColorInChatEnabled = false   # plain chat, no per-bot colours
' "$file" > "$tmp"
chmod 600 "$tmp"   # same as the app's own file: it holds account data
mv "$tmp" "$file"
echo "Grok Bot settings written (backup: $file.bak). Open Grok Bot to use them."
