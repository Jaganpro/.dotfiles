# 🍏 New Mac setup

The full walkthrough. The short version is in the [README](../README.md#-quick-start).

## Steps

1. **Install Homebrew** from <https://brew.sh>. This also installs Apple's
   Command Line Tools, which include git. Then, in the same terminal:

   ```bash
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

2. **Log in to GitHub and get the dotfiles:**

   ```bash
   brew install gh
   gh auth login --hostname github.com --git-protocol https --web
   gh repo clone Jaganpro/.dotfiles ~/.dotfiles
   ```

3. **Set up everything** (Brewfile, links, git hook, macOS settings):

   ```bash
   ~/.dotfiles/dot init
   ```

   After this, `dot` works from anywhere. Check the result with `dot doctor`.

   Any real file already in the way (e.g. a `~/.zshrc` from an installer) is
   moved to `~/.dotfiles-backup/<date-time>/`, never overwritten.
   Apps already installed by download can't be installed over; hand them to
   Homebrew instead (run in a real terminal; it asks for your password):

   ```bash
   brew install --cask --adopt <app> [<app> ...]
   ```

4. **Open a new terminal** so the shell config loads. Then run `nvim` once:
   LazyVim installs its plugins and Treesitter parsers by itself (about a
   minute); quit with `:qa`. New to Vim? Follow "Start here" in
   [neovim.md](neovim.md): `:Tutor`, then the learning aids teach as you work.

5. **Node** (needed for the Salesforce CLI):

   ```bash
   fnm install --lts
   fnm default lts-latest
   ```

6. **Salesforce CLI:**

   ```bash
   npm install --global --allow-scripts=@salesforce/cli,protobufjs,yarn @salesforce/cli@latest
   sf config set disable-telemetry=true --global
   sf autocomplete --refresh-cache   # Tab completion for sf; rerun after sf updates
   ```

7. **Pi.** The YouTube skill comes from this repo
   (`dot init` installs the skill's dependencies); `pi update --extensions`
   installs the fff package listed in the tracked settings. The Rex MCP server
   (`mcp.json`) needs a browser sign-in once per Mac.

   ```bash
   curl -fsSL https://pi.dev/install.sh | sh
   pi update --extensions
   pi mcp login superlogical
   ```

8. **Web search keys for Pi** (optional; any of the three). Brave's free plan:
   sign up at <https://api-dashboard.search.brave.com>, create a **Free AI**
   subscription (asks for a card, not charged), then create a key. Each command
   below asks for the key in a hidden prompt and stores it in the macOS Keychain:

   ```bash
   security add-generic-password -s web-brave    -a "$USER" -w
   security add-generic-password -s web-parallel -a "$USER" -w
   security add-generic-password -s web-tinyfish -a "$USER" -w
   ```

9. **Claude Code: register fff** (lives in `~/.claude.json`, which isn't tracked):

   ```bash
   claude mcp add --scope user fff -- /opt/homebrew/bin/fff-mcp
   ```

10. **App-installed agent skills** (listed in `packages/app-skills`). Do this
    **after** Claude Code and Pi are installed, so every agent gets a copy:

    - **tldraw offline:** open the app and choose **Install Agent Skills** from
      its menu. It installs the `tldraw-offline` skill for Claude Code
      (`~/.claude/skills`) and Pi (`~/.pi/agent/skills`), plus helper scripts
      in `~/skills/tldraw-offline/`.
    - It also rewrites the SubagentStart hook in `~/.claude/settings.json` to a
      fixed path (`node '/Users/<you>/skills/tldraw-offline/...'`). That's
      expected: accept it and commit the change.
    - These files aren't stored in this repo: tldraw offline is not open source,
      and this repo is public. `dot doctor` checks they exist and prints the fix.

11. **Superwhisper** (voice dictation; the Brewfile installs it). Open it once
    and follow its setup:

    - Sign in (or enter a licence); its settings stay in the app, not in this repo.
    - Click **Allow** for **Microphone** (records you) and **Accessibility**
      (types the text into apps). Skipped one? System Settings → Privacy &
      Security → Microphone / Accessibility.
    - Pick the dictation key: **hold Fn** (the app suggests Right ⌘), speak, let go, and the text
      appears at the cursor. **⌥ Space** starts and stops hands-free.
    - It works in any app, including the terminal, Claude Code and Pi.
    - Our settings (set by hand in Superwhisper's Settings; not tracked, the
      file also holds account data):

      | Setting | Value |
      |---|---|
      | Dictation key | Fn (hold, speak, let go); ⌥ Space for hands-free |
      | Fn key alone (macOS) | Do Nothing, so it doesn't also open emoji or dictation. Set by `scripts/macos-defaults.sh` (System Settings → Keyboard → "Press 🌐 key to"); emoji is still Ctrl-⌘-Space |
      | Mode | Default |
      | Launch at login | On |
      | Show in Dock | Off (menu bar only) |
      | Mini recorder | Always shown |
      | Meeting detection | Ask (prompt) |
      | Sounds | Classic |
      | Microphone | Chosen in the app (an external USB mic here, not the default device) |

    - Guide: <https://superwhisper.com/docs/get-started/quickstart>

12. **Cloudflare** (the Brewfile installs `wrangler` and `cloudflared`). Sign in
    once, with the login kept in the macOS Keychain:

    ```bash
    wrangler login --use-keyring
    wrangler whoami
    ```

    Everyday commands, secrets and tunnels: [cloudflare.md](cloudflare.md).

13. **Grok Bot** (the Brewfile installs it). Open it, sign in and finish its
    setup. Then quit it (Cmd+Q) and apply the general settings:

    ```bash
    ~/.dotfiles/scripts/grokbot-settings.sh
    ```

    The script changes only the general settings (auto-update, tool and network
    permissions, passkeys, Messages off) in `~/.grokbot/settings.json` and keeps
    a backup next to it. `dot doctor` checks the setup is done.

    Work-specific settings are **not** in this public repo; re-add them in the app:

    - **Connectors:** connect Gmail, Google Calendar, Plane and Slack, and give
      each its custom instructions (which account each bot may use, and that
      nothing is sent or posted without approval).
    - **Auto-review:** turn it on and re-add the allow rules (4 of them: local
      watcher scripts, pull requests to the private notes repo, cleaning the
      mail Junk folder).

14. **xAI (Grok API) key** for projects like sf-pi-durable (optional). Create a
    key at <https://console.x.ai> (API Keys), then store it in the Keychain;
    the command asks for it in a hidden prompt:

    ```bash
    security add-generic-password -s xai-api-key -a "$USER" -w
    ```

    Use it without saving it in a file (inside the project folder):

    ```bash
    # Published Worker: copied straight from the Keychain, never shown or saved
    security find-generic-password -s xai-api-key -w | npx wrangler secret put XAI_API_KEY

    # Local `npm run dev`: only for this one run
    XAI_API_KEY="$(security find-generic-password -s xai-api-key -w)" CLOUDFLARE_INCLUDE_PROCESS_ENV=true npm run dev
    ```

    Replace the key later: rerun the first command with `-U` added.
    Delete it: `security delete-generic-password -s xai-api-key`.

15. **Tailscale** (the Brewfile installs it; its installer asks for your
    password, so run `brew bundle --global` in a normal terminal tab). Open
    Tailscale from the menu bar, allow the VPN, **Log in…** with your personal
    login, then check:

    ```bash
    tailscale status   # lists this Mac and your other devices
    ```

    Use the same login on the phone. Phone access, the home-station settings and
    what stays out of this repo: [tailscale.md](tailscale.md).
