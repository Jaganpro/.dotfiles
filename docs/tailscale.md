# 🔒 Tailscale

A private network between your own devices. Your phone can reach this Mac (and
later the home Mac) from anywhere, without opening anything to the internet.

- [What's installed](#whats-installed)
- [Sign in (once per device)](#sign-in-once-per-device)
- [Two machines per Mac: the app and Rex](#two-machines-per-mac-the-app-and-rex)
- [Use the Mac from your phone](#use-the-mac-from-your-phone)
- [Home station](#home-station)
- [Kept out of this repo](#kept-out-of-this-repo)
- [Troubleshooting](#troubleshooting)

## What's installed

| Piece | Where | Why |
|---|---|---|
| Tailscale app (menu bar) | `packages/Brewfile` (`tailscale-app`) | The standalone app, Tailscale's recommended macOS version; `brew upgrade` and its own auto-update keep it current |
| `tailscale` command | `/usr/local/bin/tailscale`, put there by the app's installer | `tailscale status`, `tailscale serve`, scripts |
| `dot doctor` check | `dot` ("Apps that need a sign-in") | Warns until the app is signed in |

There are no config files: the account and device list live on Tailscale's
servers, and the app keeps its sign-in in its own settings.

## Sign in (once per device)

1. Open **Tailscale** (menu bar icon), allow the VPN configuration, then
   **Log in…**. The browser opens.
2. Sign in with your **personal** login. The browser may pick a work Google
   account on its own: choose "Use another account", or paste the page into a
   private window (Cmd+Shift+N).
3. Check: `tailscale status` lists this Mac with its `100.x.y.z` address.

Use the **same login on every device** (Mac, phone, home Mac): devices only see
each other inside one account's network. A login on a company domain creates a
network shared with that whole domain, so keep this one personal.

On the phone: install Tailscale from the App Store or Play Store, sign in with
the same login, switch it on.

## Two machines per Mac: the app and Rex

Rex has its own copy of Tailscale built in (it keeps its state in
`~/Library/Application Support/rex/tsnet/`). Once Rex is signed in, the admin
console lists **two machines for one Mac**:

| Machine | Is | Used for |
|---|---|---|
| The Mac's name (e.g. `my-macbook-pro`) | The Tailscale app | The whole Mac: SSH, Screen Sharing, web servers |
| The name set in Rex | Rex's built-in copy | Only Rex: the Rex phone app connects to your terminals through it |

Both are expected. Rex's shows "offline" whenever Rex isn't serving.
Rename it in Rex's Tailscale settings.

## Use the Mac from your phone

The phone reaches the Mac by name (`<mac-name>`, from `tailscale status`) while
both are switched on in Tailscale.

**A web app you're running.** Most dev servers listen on `localhost` only, which
the phone can't reach. Publish it to your own devices with Tailscale Serve:

```bash
tailscale serve 8787          # https://<mac-name>.<tailnet>.ts.net -> localhost:8787; Ctrl-C stops
```

The first time, it asks you to turn on HTTPS for your network in the admin
console. Only your devices can open the address; to share an app with anyone,
use a Cloudflare tunnel instead ([cloudflare.md](cloudflare.md#tunnels-share-a-local-app)).

**Quick connection test:** `uv run python -m http.server 8000` on the Mac, then
open `http://<mac-name>:8000` on the phone. This one listens on every network,
including the local Wi-Fi, so stop it (Ctrl-C) afterwards.

**A terminal.**

- **Rex app (iOS beta):** pairs with Rex on the Mac over Tailscale. Your real Rex
  sessions, not a separate shell.
- **SSH:** turn on System Settings > General > Sharing > **Remote Login**, then
  connect with an SSH app (Termius, Blink) to `<your-user>@<mac-name>`.

**The screen:** turn on **Screen Sharing** in the same Sharing pane, then use a
VNC app on the phone with `vnc://<mac-name>`.

## Home station

For a Mac that stays at home (the M5 Pro), after the normal sign-in:

1. **Never ask to sign in again:** admin console
   (<https://login.tailscale.com/admin/machines>) > the Mac's `…` menu >
   **Disable key expiry**. Otherwise it drops off every 180 days until someone
   signs in at the Mac.
2. **Start with the Mac:** turn on the start-at-login option in Tailscale's settings.
3. **Stay awake:** System Settings > Energy > **Prevent automatic sleeping when
   the display is off** and **Wake for network access** on.
4. **Remote Login** and/or **Screen Sharing** on, as above.

## Kept out of this repo

This repo is public. None of these go in it, not even in docs or examples:

| What | Lives in |
|---|---|
| Your login and account | Tailscale's servers; the app's sign-in on each device |
| The network name (`<tailnet>.ts.net`) and `100.x.y.z` addresses | Admin console |
| Device names (they may contain work names) | Admin console; Rex's settings for Rex's machine |
| Access rules, key expiry, HTTPS setting | Admin console. With one person the default rules (all your devices reach each other) are fine; a rules file would contain your email |
| The app's settings file (`io.tailscale.ipn.macsys`) | `~/Library/Preferences`: it caches your account profile, so `dot add` must never take it |

## Troubleshooting

| Problem | Fix |
|---|---|
| `brew install` stops at "a terminal is required to read the password" | The installer needs your password through `sudo`. Run it in a normal terminal tab, not from an agent's shell |
| Tailscale was installed earlier from the website or App Store | Quit it, move it to the Trash, then `brew bundle --global`. Two copies fight over the VPN |
| The phone doesn't list the Mac | Phone and Mac signed in with different logins: compare the account shown in each app |
| `tailscale: command not found` | The installer puts it in `/usr/local/bin`: `brew reinstall --cask tailscale-app` (in a normal terminal tab), then open a new terminal |
| A web page works on the Mac but not the phone | The server listens on `localhost` only: use `tailscale serve` (above) |
