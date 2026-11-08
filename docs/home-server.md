# 🏠 Home server

The Mac mini at home runs all the time: Rex, agents, `tailscale serve` apps.
I reach it from the phone over Tailscale. A GL.iNet Comet KVM is on the
tailnet too, as the way in when macOS isn't fully up. This page is the
runbook: what was set, what was tested, and what to do after a restart.

- [Status](#status)
- [How you get in](#how-you-get-in)
- [Setup](#setup)
- [After a restart: unlock](#after-a-restart-unlock)
- [Still to try](#still-to-try)
- [Choices and why](#choices-and-why)
- [Kept out of this repo](#kept-out-of-this-repo)

## Status

| Part | State |
|---|---|
| Mac: never sleeps, power-on, firewall, no auto-installed macOS | Done |
| Mac: Ethernet, fixed LAN address in UniFi | Done |
| Mac: Remote Login on; File Sharing, Remote Management, AirPlay Receiver off | Done |
| Mac: Screen Sharing | Off since the port cleanup (see [security.md](security.md#mac-mini)) |
| Mac: Tailscale and Rex start at login; Tailscale key expiry off | Done |
| KVM: on the tailnet, key expiry off, admin password + 2FA | Done |
| KVM: USB keyboard/mouse reach the Mac; subnet route approved | Done |
| Unlock after a restart, remotely | **Parked 2026-11-08, not working yet.** First test: the KVM screen stayed black at FileVault, unlocked at the desk. Resume at [Still to try](#still-to-try), step 1 |

## How you get in

| Path | Works when | Use it for |
|---|---|---|
| Rex app, SSH, Screen Sharing over Tailscale | macOS is unlocked | Everyday use from the phone |
| SSH to the Mac's LAN address, through the KVM's subnet route | Mac at the FileVault screen (untested) | Unlocking after a restart from anywhere |
| GL.iNet KVM in Safari | Always, but its screen is black at FileVault while the main monitor is connected | A frozen Mac; typing blind |
| The desk | Always | When nothing else works |

Rex on the phone can't unlock: it talks to the Rex server on the Mac, which
starts only after the unlock.

## Setup

Order matters: Remote Login has to be on **before** the first restart.

### 1. Ethernet and a fixed address

- Cable from the Mac mini to the router. Ethernet is first in the network
  order (System Settings > Network); Wi-Fi stays on as a backup.
- In UniFi (Client Devices > the Mac mini > Settings), **Fixed IP Address** on,
  for the Mac's **Ethernet** MAC address. macOS stays on DHCP. The Mac uses its
  real MAC on wired, so the reservation holds. Check with
  `ipconfig getifaddr en0`. The SSH unlock below depends on this address.
- Same for the KVM, for the connection it actually uses (Wi-Fi here). The
  Tailscale policy keeps Grok Bot off the KVM by its address, so it must not
  move.
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
| Energy | Matches the script: Start up when power is connected = **Always**. Don't also run `pmset autorestart 1`: it's the other choice in the same menu ("After power failure") and switches Always off |

### 4. Tailscale

- Tailscale menu > Settings: start at login.
- Admin console (<https://login.tailscale.com/admin/machines>): **Disable key
  expiry** for the Mac mini **and** the KVM. Otherwise each drops off every 180
  days until someone signs in on it.

### 5. GL.iNet KVM

Two cables to the Mac: **HDMI** for the picture, **USB** for keyboard and mouse.
Plug the USB straight into the Mac mini, not into the monitor's hub, which may
not be up at the FileVault screen. The Mac then lists a "Glinet Composite
Device" (`system_profiler SPUSBHostDataType`).

Console (`https://glkvm.local` at home; accept the self-signed certificate):

| Where | Set | Why |
|---|---|---|
| Apps Center > Tailscale | On, **Bind Device**, same Tailscale account | Reachable from anywhere without GL.iNet's cloud |
| Apps Center > Tailscale > Subnet Routes | **Run**; then approve the home subnet on the KVM in Tailscale's admin console (Edit route settings) | Your tailnet devices reach the Mac's LAN address while the Mac's own Tailscale is down (the SSH unlock) |
| Apps Center > Tailscale > Exit Node | Off | Would route the phone's internet traffic through the KVM |
| Settings > Security | Strong admin password, **2FA** on | It answers SSH and types on the Mac: a key to the house |
| Settings > USB Devices | Mouse and Keyboard on; Microphone, Camera, Virtual Media off; Device Identity: GLKVM Default | Fewer fake devices on the Mac; changing identity changes the EDID |
| Session > Mouse | **Mouse Jiggle off**; Mouse Mode Absolute (Relative if the pointer sticks) | The Mac never sleeps, so jiggle isn't needed |
| Session > Video | Latency Mode **Lowest Latency**; EDID left at default | Snappier input; a new EDID makes macOS forget the display layout |
| Session > Keyboard | **Show Virtual Keyboard** on when using the phone; Swap Command and Ctrl only from a non-Mac keyboard | The phone keyboard has no ⌘, Return, Esc |

The KVM shows up on the Mac as a second display named GLKVM. Don't mirror it:
that drops the main monitor to 1080p. While the main monitor is the primary
display, the KVM shows only an empty desktop.

On the iPhone, open the KVM at its **Tailscale IP** in Safari (`https://100.x.y.z`)
and add it to the Home Screen. Its `*.ts.net` name loaded on the Mac but not on
the phone (likely the phone's Tailscale DNS setting); the IP never changes.

## After a restart: unlock

FileVault stays on, so after every restart (update, power cut, crash) the Mac
waits at a password screen. Until it's unlocked, Tailscale, SSH, Screen Sharing
and Rex on the Mac are all down.

**What happened on the first test:** the FileVault screen went only to the main
monitor (Thunderbolt); the KVM's HDMI stayed black, so the password was typed
at the desk. Services came back by themselves after the unlock.

Until one of the paths below is tested, plan to be at the desk after a restart.

### SSH unlock through the KVM (set up, untested)

Apple silicon on macOS 26+ accepts the account password over SSH at the
FileVault screen (`man apple_ssh_and_filevault`). The Mac's Tailscale isn't up
then, so the phone reaches the Mac's **LAN address** through the KVM's subnet
route.

Phone app: **Moshi** (or Termius), a separate connection just for this:

| Field | Value |
|---|---|
| Host | The Mac's LAN address (the UniFi reservation) |
| Port / user | `22` / your Mac user |
| Authentication | **Password** (keys live on the locked disk) |
| Connection type | **SSH**, not Auto (mosh needs the unlocked disk) |

1. Wait about a minute after the restart. Phone: Tailscale on.
2. Connect. Expect **Host Key Changed** (the pre-boot key differs): accept it
   on this connection only, and only right after a restart you know about.
3. Enter your Mac password. It disconnects: the disk is unlocking.
4. Wait a minute, then use Rex as usual.

## Still to try

**Parked on 2026-11-08.** Everything below is set up; nothing is tested yet.
Pick up at step 1 (no restart needed for its first half). Until then, a
restart means unlocking at the desk.

In this order:

1. **SSH unlock (above):** test the route once while the Mac is unlocked
   (phone on cellular, connect to the LAN address), then for real after a
   restart.
2. **Blind paste through the KVM:** after a restart, KVM > Toolbox >
   Clipboard, paste the password, send it, press Return. The USB keyboard may
   reach the password box even with a black KVM screen.
3. **Get the FileVault screen onto the KVM:** unplug the main monitor's cable
   while the Mac is unattended (certain), or make GLKVM the main display in
   System Settings > Displays (not documented to move the FileVault screen).
4. **Power cut:** pull power for 30 seconds; it should start by itself and wait
   at FileVault.
5. Optional: KVM on Ethernet (it's on Wi-Fi, with a fixed address reserved in
   UniFi). Moving it means a new reservation for the wired MAC and a new KVM
   address in the Tailscale policy. Security items: [security.md](security.md).

## Choices and why

| Choice | Why |
|---|---|
| FileVault **on** | Mac hosts turn it off so the Mac boots unattended. Here the SSH unlock and the KVM are meant to cover that, and the disk stays protected if the Mac is stolen. Revisit if neither unlock path works |
| Display never sleeps | The KVM captures the display; a sleeping display is a black KVM |
| No auto-installed macOS updates | An unplanned restart takes the Mac off the network until someone unlocks it. Install them when you can unlock right after |
| "Always" instead of "After power failure" | Always also boots a Mac that was shut down, as soon as power returns (2024+ Mac mini, macOS 26.5+) |
| Subnet route on the KVM | The only way to reach the Mac's pre-boot SSH from outside. It also exposes the rest of the home network to your own tailnet devices |
| No caffeinate or keep-awake app | `pmset` is the setting; apps die at logout and hide it |
| Same repo as the laptop | Everything else (shell, Rex, agents, Brewfile) is shared; only this script and page are server-only |

## Kept out of this repo

The tailnet name, `100.x.y.z` addresses, LAN addresses, MAC addresses, the KVM
password and the UniFi login stay in Tailscale's console, UniFi and 1Password.
See also [tailscale.md](tailscale.md#kept-out-of-this-repo). Security settings and
what's left to harden: [security.md](security.md).
