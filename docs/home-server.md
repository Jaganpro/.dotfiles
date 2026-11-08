# 🏠 Home server

The Mac mini at home runs all the time: Rex, agents, `tailscale serve` apps.
I reach it from the phone over Tailscale, and a GL.iNet Comet KVM is the way
in when macOS isn't up yet. This page is the runbook: what was set, why, and
what to do after a restart.

- [How you get in](#how-you-get-in)
- [Setup](#setup)
- [After a restart: unlock](#after-a-restart-unlock)
- [Test before relying on it](#test-before-relying-on-it)
- [Choices and why](#choices-and-why)
- [Kept out of this repo](#kept-out-of-this-repo)

## How you get in

| Path | Works when | Use it for |
|---|---|---|
| Tailscale + SSH / Screen Sharing / Rex app | macOS is unlocked | Everyday use from the phone or another Mac |
| GL.iNet KVM (web page or GLKVM app) | Always, even at the FileVault screen | Unlocking after a restart, a frozen Mac, a dead network |
| SSH at the FileVault screen | At home only (Tailscale isn't up yet) | Backup unlock without the KVM |

## Setup

Order matters: Remote Login has to be on **before** the first restart.

### 1. Ethernet and a fixed address

- Cable from the Mac mini to the router. Ethernet is first in the network
  order (System Settings > Network); Wi-Fi stays on as a backup.
- In UniFi (Client Devices > the Mac mini > Settings), **Fixed IP Address** on,
  for the Mac's **Ethernet** MAC address. macOS stays on DHCP. The Mac uses its
  real MAC on wired, so the reservation holds. Check with
  `ipconfig getifaddr en0`.
- Same for the KVM, so `glkvm.local` and bookmarks never move.
- No port forwards on the router for SSH, Screen Sharing or the KVM:
  Tailscale covers remote access.

### 2. Run the script

```bash
~/.dotfiles/scripts/home-server.sh
```

Never sleeps (system, display, disk), Power Nap off, wakes for network,
**Start up when power is connected: Always**, macOS updates download but don't
install themselves, firewall on. It ends with a checklist of the steps below.
Rerun it after every macOS upgrade.

### 3. System Settings (by hand)

| Where | Set |
|---|---|
| General > Sharing | **Remote Login** on (Only these users: you); **Screen Sharing** on (you only); **File Sharing** off |
| General > Login Items | **Tailscale** and **Rex Beta** under Open at Login |
| General > Software Update > Automatic updates ⓘ | Download and Security Responses on; Install macOS updates off (the script did this) |
| General > Software Update > Beta updates | Your choice (left on here) |
| Energy | Matches the script: Start up when power is connected = **Always** |

### 4. Tailscale

- Tailscale menu > Settings: start at login.
- Admin console (<https://login.tailscale.com/admin/machines>): **Disable key
  expiry** for the Mac mini **and** the KVM. Otherwise each drops off every 180
  days until someone signs in on it.

### 5. GL.iNet KVM

- Its own Ethernet cable to the router and its own power. Power it on before
  the Mac so the Mac sees its display at boot.
- Console (`http://glkvm.local` at home): Apps Center > **Tailscale** > Bind,
  with the same Tailscale account. Then disable its key expiry (step 4). From
  then on the phone reaches it at its Tailscale address, without GL.iNet's
  cloud.
- Settings > Security: strong admin password, 2FA on. Keep the firmware
  current. It answers SSH and controls the Mac's keyboard: treat it as a key
  to the house.
- Session > Keyboard: **Swap Command and Ctrl** on. Mouse: Absolute for normal
  use, Relative if the pointer gets stuck at the FileVault screen.
- Leave **Mouse Jiggle** off (the Mac never sleeps anyway) and **EDID** alone
  (changing it makes macOS forget the display layout).
- The KVM shows up as a second display named GLKVM. Don't mirror it: that
  drops the main monitor to 1080p.

## After a restart: unlock

FileVault stays on, so after every restart (update, power cut, crash) the Mac
waits at a password screen. Until it's unlocked, Tailscale, SSH, Screen Sharing
and Rex on the Mac are all down.

1. Phone, Tailscale on: open the KVM.
2. Type your Mac password at the FileVault screen.
3. Wait a minute: Tailscale and Rex start by themselves.

**Backup, at home only:** `ssh <you>@<mac-lan-ip>`, enter your password, wait
for the disconnect (the disk is unlocking), then SSH again. This is Apple's
FileVault unlock over SSH (Apple silicon, macOS 26+, `man apple_ssh_and_filevault`).
Only a password works at that stage, not keys, and the host key may differ.

If the KVM shows black or only wallpaper at the FileVault screen, the early
picture went to the main monitor. Make GLKVM the main display (System Settings
> Displays > drag the menu bar onto it) or unplug the monitor's video cable.

## Test before relying on it

1. Restart the Mac. On the phone, open the KVM: the FileVault screen shows.
2. Unlock through the KVM. Rex on the phone connects; `ssh <you>@<mac-name>`
   works over Tailscale.
3. At home: restart again and unlock over SSH (above).
4. Pull the power for 30 seconds, plug it back in: it starts by itself and
   waits at FileVault.

## Choices and why

| Choice | Why |
|---|---|
| FileVault **on** | Mac hosts turn it off because nobody can see their boot screen. The KVM can, and the disk stays protected if the Mac is stolen |
| Display never sleeps | The KVM captures the display; a sleeping display is a black KVM |
| No auto-installed macOS updates | An unplanned restart takes the Mac off the network until someone unlocks it. Install them when you can unlock right after |
| "Always" instead of "After power failure" | Always also boots a Mac that was shut down, as soon as power returns (2024+ Mac mini, macOS 26.5+) |
| No caffeinate or keep-awake app | `pmset` is the setting; apps die at logout and hide it. Add a `caffeinate -d` LaunchDaemon only if the KVM still goes black |
| Same repo as the laptop | Everything else (shell, Rex, agents, Brewfile) is shared; only this script and page are server-only |

## Kept out of this repo

The tailnet name, `100.x.y.z` addresses, MAC addresses, the KVM password and
the UniFi login stay in Tailscale's console, UniFi and 1Password. See also
[tailscale.md](tailscale.md#kept-out-of-this-repo).
