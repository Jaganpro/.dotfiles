#!/bin/bash
# Home server settings for the Mac mini: never sleep, come back after a power
# cut, no surprise macOS restarts, firewall on. Run by hand in a normal
# terminal (asks for your password); `dot init` never runs it. Safe to run
# again, and worth rerunning after every macOS upgrade, which can reset these.
# Steps that need a click (Sharing, Login Items, Tailscale) are in
# docs/home-server.md; this script only checks them.
set -euo pipefail

# A laptop must keep sleeping; --force for another always-on desktop Mac.
if [[ ${1:-} != --force ]] && ! system_profiler SPHardwareDataType | grep -q 'Model Name: Mac mini'; then
  echo "Not a Mac mini: these settings are for the home server. Rerun with --force to apply anyway." >&2
  exit 1
fi

# Power. autorestartatconnect = Energy > "Start up when power is connected: Always"
# (also covers power cuts). It and autorestart are one menu, so setting both fights.
sudo pmset -a sleep 0 displaysleep 0 disksleep 0 standby 0 powernap 0 \
  womp 1 tcpkeepalive 1 autorestartatconnect 1

# Updates download, but macOS never installs and restarts on its own:
# after a restart FileVault waits for a password (see the doc).
sudo defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticallyInstallMacOSUpdates -bool false

sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on >/dev/null

# --- Check: what this script set, plus the clicks it can't make ---
ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*"; }
port() { nc -z -G 2 127.0.0.1 "$1" >/dev/null 2>&1; }

pm=$(pmset -g)
for want in 'sleep 0' 'displaysleep 0' 'disksleep 0' 'autorestartatconnect 1' 'womp 1'; do
  if grep -Eq "^ *${want% *} +${want#* }( |$)" <<<"$pm"; then ok "pmset $want"; else warn "pmset $want did not stick"; fi
done
if port 22; then ok "Remote Login (SSH) on"; else warn "Remote Login off: System Settings > General > Sharing"; fi
if port 5900; then ok "Screen Sharing on"; else warn "Screen Sharing off: System Settings > General > Sharing"; fi
if port 445; then warn "File Sharing on: turn it off unless you need it (Sharing)"; else ok "File Sharing off"; fi
if [[ $(defaults read io.tailscale.ipn.macsys TailscaleStartOnLogin 2>/dev/null) == 1 ]] ||
  sfltool dumpbtm 2>/dev/null | grep -q 'Name: Tailscale.app'; then
  ok "Tailscale starts at login"
else
  warn "Tailscale doesn't start at login: Tailscale menu > Settings, or Login Items"
fi
if fdesetup isactive >/dev/null 2>&1; then
  ok "FileVault on: after every restart, unlock through the KVM (docs/home-server.md)"
fi
