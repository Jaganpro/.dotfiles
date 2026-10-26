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
