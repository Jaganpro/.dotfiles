# 🔐 Security checklist

What protects the home server (Mac mini), the GL.iNet KVM and the accounts
behind them. `[x]` is done, `[ ]` is still to do; open items stay here on purpose until
they're done or dropped. **Checked** says how it was
confirmed: *scan* = checked from the Mac with the commands at the bottom,
*by hand* = done in an app or web console, not visible from the Mac.

Last full review: 2026-11-08. Repeat it after macOS upgrades, KVM firmware
updates, or a new device on the tailnet.

- [The model](#the-model)
- [Accounts](#accounts)
- [Tailscale](#tailscale)
- [Mac mini](#mac-mini)
- [GL.iNet KVM](#glinet-kvm)
- [This repo](#this-repo)
- [Tailnet Lock steps](#tailnet-lock-steps)
- [Recheck](#recheck)

## The model

Nothing is reachable from the internet: no router port forwards. Everything
remote goes through Tailscale.

Two Grok Bots: the **app** on the Mac mini (already local, Tailscale rules don't
apply to it) and Grok Bot's **cloud computer**, a Linux machine at Cursor that
its Tailscale plugin puts on the tailnet. Decided: the cloud computer may SSH
to the Mac and reach the home LAN, but never the KVM (it would type on the
Mac). So the real keys are:

1. **The account you sign in to Tailscale with (GitHub).** It can add a device
   to the tailnet, and the tailnet reaches the Mac, the KVM and (through the
   KVM's subnet route) the whole home network.
2. **The KVM admin login.** The KVM is a keyboard plugged into the Mac.
3. **The Mac password.** Login, FileVault unlock and SSH.
4. **1Password,** which holds all of the above.

## Accounts

| Done | Item | Checked |
|---|---|---|
| [x] | GitHub: 2FA on | by hand |
| [x] | GitHub: recovery codes saved in 1Password | by hand |
| [x] | 1Password: 2FA on | by hand |
| [x] | Tailscale: you are the only user | by hand |
| [ ] | GitHub: a passkey or security key as a 2FA method (stronger than an app code) | by hand |

## Tailscale

| Done | Item | Checked |
|---|---|---|
| [x] | No router port forwards; remote access only over Tailscale | by hand (UniFi) |
| [x] | Key expiry off for the Mac and the KVM | scan |
| [x] | KVM subnet route approved (home LAN reachable from the tailnet; needed for the SSH unlock) | scan |
| [x] | KVM is not an exit node | scan |
| [x] | **Access rules (grants):** your own devices reach everything; Grok Bot's cloud computer (`tag:grokbot`) reaches only the Mac's SSH and the home LAN, **not the KVM**. Applied; its built-in tests passed on save. It holds addresses: kept in the admin console, not here | scan |
| [x] | Grok Bot's cloud computer rejoined and tagged `tag:grokbot` (the plugin joined untagged; tagged by hand in Machines > Edit ACL tags). The Mac accepts only port 22 from it | scan |
| [x] | Old untagged Grok Bot device removed from Machines | scan |
| [ ] | After any Grok Bot computer reset or image update: check Machines. The plugin rejoined **untagged** last time (full access) and had to be tagged by hand | by hand |
| [ ] | If the KVM's LAN address changes (e.g. moved to Ethernet), update the address it's excluded by in the policy | by hand |
| [ ] | Review the device list now and then; remove anything you don't recognise | by hand |
| [ ] | **Tailnet Lock:** a new device can't talk to the others until a trusted device signs it, so a stolen GitHub login alone can't add one. Signing devices: Mac mini and iPhone. Its 10 disablement secrets go in 1Password (never here, never in a chat). After it's on, every new or reset device (Grok Bot's cloud computer after a reset, Rex's node, a new phone) must be signed before it connects | scan |

## Mac mini

| Done | Item | Checked |
|---|---|---|
| [x] | FileVault on | scan |
| [x] | System Integrity Protection on | scan |
| [x] | Gatekeeper on | scan |
| [x] | Firewall on | scan |
| [x] | One user (admin), no guest login | scan |
| [x] | Security responses and system files install automatically | scan |
| [x] | Remote Login (SSH) on, only for your user | scan |
| [x] | Remote Management (Apple Remote Desktop, 3283) off | scan |
| [x] | AirPlay Receiver (5000, 7000) off | scan |
| [x] | File Sharing (SMB, 445) off | scan |
| [ ] | Screen Sharing (5900) is **off** since the port cleanup. Fine if intended (Rex and SSH cover remote use); turn it back on if you want the desktop from the phone | scan |
| [x] | Firewall stealth mode on (System Settings > Network > Firewall > Options) | scan |
| [x] | Firewall allow list: `/usr/bin/python3` and `/usr/bin/ruby` removed (approved during old projects) | scan |
| [x] | Media Sharing / Home Sharing off (3689) | scan |
| [x] | Public folder share removed (no share points left), so turning File Sharing on later doesn't bring back guest access | scan |
| [x] | Mac password: long and unique, in 1Password | by hand |
| [ ] | SSH key for everyday logins (phone app key in `~/.ssh/authorized_keys`). Keep password login: the FileVault SSH unlock needs it | scan |

Port 88 (Kerberos, `kdc`) stays open; it's part of macOS sharing logins.

## GL.iNet KVM

| Done | Item | Checked |
|---|---|---|
| [x] | Firmware updated (its SSH server went from a 2019 to a 2025 build) | scan |
| [x] | Admin password: strong, in 1Password | by hand |
| [x] | 2FA on the admin login | by hand |
| [x] | GL.iNet Cloud off; reached over Tailscale only | by hand |
| [x] | Not on the internet; no port forwards | by hand |
| [x] | Mouse Jiggle off; Microphone, Camera, Virtual Media off | by hand |
| [ ] | SSH (port 22) still answers. The console has no switch for it (its Toolbox > Terminal uses it too), so the Tailscale access rules above are what limit who can reach it | scan |
| [ ] | Firmware: check for updates monthly (version at the top right of the console) | by hand |
| [x] | Fixed address in UniFi for its **Wi-Fi** connection (the same address the Tailscale policy excludes) | by hand |
| [ ] | Optional: on Ethernet instead of Wi-Fi. The wired port has its own MAC, so it needs a new UniFi reservation, and the policy's KVM address must change to match | by hand |

## This repo

| Done | Item | Checked |
|---|---|---|
| [x] | Public repo holds no tailnet name, `100.x` addresses, LAN or MAC addresses, passwords or the ACL file | by hand |
| [x] | `gitleaks` scans every commit (pre-commit hook) | scan |
| [x] | Keys and tokens live in the macOS Keychain or 1Password, not in files | by hand |

## Tailnet Lock steps

**Pending, parked 2026-11-08.** Not enabled yet. When you pick it up:

1. Have 1Password open, ready for a new item. Tailscale shows **10 disablement
   secrets once**; without one, Tailnet Lock can't be turned off normally. Never
   paste them into a chat or this repo.
2. Admin console > Settings > Device management > **Enable Tailnet Lock**.
3. Signing nodes: the **Mac mini** and the **iPhone** (at least two).
4. Leave "Send disablement secret to Tailscale support" **off**: a copy at
   Tailscale is a second way to switch the lock off. Last resort if every
   secret is lost: `tailscale lock local-disable` on each device.
5. Copy the `tailscale lock init …` command and run it on the Mac, replacing
   `tailscale` with `/Applications/Tailscale.app/Contents/MacOS/Tailscale`
   (the CLI isn't on PATH).
6. Save all 10 secrets in one 1Password item straight away.
7. Check: `tailscale lock status` on each device lists the same signing keys,
   and no device in Machines shows **Locked out**.

Afterwards, a new or reset device stays **Locked out** until signed: Machines >
the device > **Sign machine** > *Sign this node* on the Mac, or scan the QR with
the iPhone. For Grok Bot's cloud computer, sign it **and** check its tag.

## Recheck

Run on the Mac mini. None of these need `sudo`.

```bash
# Ports answering on the Mac (LAN and Tailscale address)
for p in 22 88 445 3283 3689 5000 5900 7000; do nc -z -G 1 "$(ipconfig getifaddr en0)" $p 2>/dev/null && echo "$p open"; done
lsof -nP -iTCP -sTCP:LISTEN | awk 'NR>1 {print $1, $9}' | sort -u

fdesetup status; csrutil status; spctl --status
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate --getstealthmode
/usr/libexec/ApplicationFirewall/socketfilterfw --listapps
sharing -l

# Tailscale devices, key expiry and routes
/Applications/Tailscale.app/Contents/MacOS/Tailscale status --json |
  jq -c '.Peer[] | {HostName, OS, KeyExpiry, PrimaryRoutes}'

# KVM: ports and SSH server version (use its LAN or Tailscale address)
for p in 22 80 443; do nc -z -G 2 <kvm-address> $p && echo "$p open"; done
nc -G 3 <kvm-address> 22 </dev/null | head -1
```

See also [home-server.md](home-server.md) and
[tailscale.md](tailscale.md#kept-out-of-this-repo).
