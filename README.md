# .dotfiles

My macOS setup (Apple Silicon). Config files live in `home/`, which mirrors
`~` with real file names; [GNU Stow](https://www.gnu.org/software/stow/) links
each one into place. Built from scratch in October 2026, one tool at a time.

## Layout

```
~/.dotfiles/
├── home/                 mirrors ~ (linked by Stow; edit ~/.zshrc = edit the repo)
├── packages/Brewfile     every Homebrew tool and app
├── packages/app-skills   agent skills installed by apps (checked by dot doctor, not stored here)
├── scripts/macos-defaults.sh
├── scripts/hooks/pre-commit   checks every commit: lint, shellcheck, shell start-up, secrets
├── skills/               agent skills for Pi (via its settings) and Claude Code (linked into ~/.claude/skills)
├── scripts/vendor-skills.sh   copies Matt Pocock's skills into skills/ at a pinned commit
├── prompts/              slash commands for Pi (via its settings) and Claude Code (linked into ~/.claude/commands)
├── third_party/          licenses for code taken from other repos
├── tools/oxlint/         anti-slop lint rules (vendored); `npm run lint`, config in oxlint.config.ts
├── dot                   the `dot` command: init, doctor, update, stow, add
├── AGENTS.md             how AI agents (Claude Code, Pi) should work in this repo
├── CLAUDE.md             points Claude Code at AGENTS.md
└── README.md
```

## What's tracked

| File (in `~`, linked from `home/`) | What it holds |
|---|---|
| `~/.zprofile` | Homebrew and `~/.local/bin` on PATH; `JAVA_HOME`; points `brew bundle --global` at `packages/Brewfile`; `RIPGREP_CONFIG_PATH` |
| `~/.hushlogin` | Empty on purpose: its existence hides macOS's "Last login: …" line in new terminals and review splits |
| `~/.zshrc` | History, Gruvbox colours, fnm, fzf, eza shortcuts, direnv, autosuggestions, starship, fastfetch, syntax highlighting |
| `~/.config/fastfetch/config.jsonc` | Compact, private fastfetch layout |
| `~/.config/starship.toml` | Gruvbox powerline prompt |
| `~/.config/starship/sf-org.sh` | Finds the Salesforce target org for the prompt |
| `~/.config/zsh/worktree.zsh` | `gwa` / `gwr` git worktree helpers (loaded by `.zshrc`) |
| `~/.config/ripgrep/config` | ripgrep defaults: search hidden files, skip `.git/` and files over 5 MB |
| `~/.config/git/ignore` | Global git ignore for every repo: `.DS_Store`, personal Claude files, `.env*` / `.envrc` (except `.env.example`) |
| `~/.config/ghostty/config.ghostty` | Ghostty: Gruvbox Dark, font 14, Option-as-Alt, Quick Terminal, shortcuts, SSH terminfo, balanced padding, medium split dimming |
| `~/.npmrc` | npm installs only versions at least 3 days old (supply-chain cooldown) |
| `~/.pi/agent/npm/.npmrc` | No cooldown for Pi extensions (they all install in this folder) |
| `~/.claude/statusline.sh` | Claude Code status line (one line): ✨ model (effort) ⚡ │ 📁 path 🌿 git │ gradient context bar + tokens │ 💰 cost │ 🔥/❄️ prompt cache │ 🏷️ session │ 📦 version |
| `~/.gitconfig` | Name/email (GitHub noreply), `gh` login, delta pager, pull = rebase, prune on fetch, newest branches first, rerere, `git fomo`, `git nuke` |
| `~/.claude/CLAUDE.md` | Instructions for every Claude Code session: prefer fff for file search |
| `~/.claude/settings.json` | Claude Code preferences, hooks, status line; no commit/PR attribution |
| `~/.pi/agent/settings.json` | Pi default model, the fff package, and the path to `skills/youtube-transcript` |
| `~/.pi/agent/extensions/web-access.ts` | Pi `web_search` (Brave → Parallel → TinyFish; freshness and country passed through; falls back on quota) and `web_fetch` (direct download first, then extractors). The card shows the service and, only when the provider reports it, calls remaining. Keys in the macOS Keychain. `/web` shows status |
| `~/.pi/agent/extensions/git-guard.ts` | Pi: blocks commands that skip git hooks (`--no-verify`, `git commit -n`) and stops git opening an editor |
| `~/.claude/hooks/git-guard.sh` | Claude Code: the same hook-skipping block, as a PreToolUse hook (registered in `settings.json`, which also sets `GIT_EDITOR=true`) |
| `~/.pi/agent/extensions/muscle-memory.ts` | Claude Code command names work in Pi too: `/clear`, `/exit`, `/context`, `/rename`, `/effort` (our own, inspired by xRyul/pi-aliases) |
| `~/.pi/agent/extensions/footer.ts` | Pi's footer: `~/path ⎇ branch · session` and a context bar with %, window size and model (written with Pi) |
| `~/.pi/agent/extensions/run-stats.ts` | After each Pi run: `⚡ tokens/sec · ⏱ time · ✍️ written · 📖 read · 💾 from cache` (our own; clean-room rewrite) |
| `~/.pi/agent/extensions/tasting-notes.ts` | While Pi works: a winemaking phrase (🍾 Uncorking…) in the working line and a French or Italian wine fact above the input box, every 7 seconds; 100 facts checked against sources; `/wine` for one on demand (our own; clean-room) |
| `~/.pi/agent/extensions/beside.ts` | `/annotate` (Pi's newest reply, or `/annotate plan.md`) and `/review` (code changes) in a Ghostty split, via the scripts below |
| `~/.local/bin/beside` | Runs a review TUI in a Ghostty split to the right (AppleScript) and types what it prints into the agent |
| `~/.local/bin/annotate` | plannotator-tui through `beside`; in Claude Code run `! annotate` |
| `~/.local/bin/review` | tuicr through `beside`; in Claude Code run `! review` |
| `~/.pi/agent/AGENTS.md` | Global instructions shared by Pi and Claude Code (Claude imports it from `~/.claude/CLAUDE.md`): use `uv` for Python; ponytail rules for code (smallest complete change, reuse, no slop) |

Never tracked: logins, tokens and app state (`~/.config/gh/hosts.yml`,
`~/.pi/agent/auth.json`, `~/.claude.json`, shell history, caches).

## Tools

### Command line

| Tool | Use | Try |
|---|---|---|
| stow | Links `~/.dotfiles/home` into `~` (driven by `dot`) | `dot stow` |
| gh | GitHub from the terminal; also handles git login | `gh repo list` |
| fnm | Node version manager; switches version per project | `fnm list` |
| Java (Temurin 21) | JDK for Salesforce tooling (Apex language server, Code Analyzer) | `java -version` |
| uv | Python versions, packages and tools | `uvx <tool>`, `uv run script.py` |
| ripgrep | Fast search through file contents | `rg "TODO"` |
| jq | Read and edit JSON (newer than macOS's built-in) | `jq '.name' package.json` |
| yq | Read and edit YAML, XML and TOML | `yq -p xml '.Package.types[].members' manifest/package.xml` |
| fd | Fast, simple `find` | `fd zshrc ~` |
| fzf | Fuzzy finder for history, files and folders | Ctrl-R, Ctrl-T |
| bat | `cat` with syntax colours and line numbers | `bat ~/.zshrc` |
| eza | Modern `ls` with git status and icons | `ll`, `tree` |
| tree | Classic folder tree | `command tree` |
| vivid | Generates `LS_COLORS` (Gruvbox Dark) for eza, fd, tree and Tab completion | `vivid themes` |
| git-delta | Readable git diffs (git's pager) | `git show` |
| gitleaks | Scans a repo's history for committed secrets | `gitleaks git --redact` |
| gum | Styled output and prompts for `gwa` / `gwr` | `gum confirm "OK?"` |
| plannotator-tui | Annotate an agent's plan or reply in the terminal (third-party tap `plannotator/tap`) | `plannotator-tui last` |
| tuicr | Review an agent's code changes as a diff and comment, in the terminal | `tuicr -w` |
| ffmpeg | Convert, trim and compress audio and video | `ffmpeg -i in.mov out.mp4` |
| direnv | Loads a folder's `.envrc` (e.g. `export SF_TARGET_ORG=dev`) on `cd`, unloads on leave | `direnv allow` |
| ast-grep | Search code by structure, not text | `sg -p 'console.log($A)'` |
| btop | CPU, memory, disk and process monitor | `btop` |
| shellcheck | Finds bugs in shell scripts | `shellcheck ~/.dotfiles/dot` |
| fff-mcp | Fast file search for Claude Code (MCP server) | used by Claude automatically |

### Shell

| Tool | Use |
|---|---|
| starship | Gruvbox prompt: Apple icon, folder, git, Node/Python/Java, Salesforce org (red ⚠ if the alias contains "prod"), slow-command time, clock |
| fzf-tab | Tab opens an fzf list with previews (folder contents, first 50 lines of files) |
| zsh-completions | Extra Tab-completion definitions; Homebrew tools and `sf` bring their own |
| zsh-autosuggestions | Grey suggestion from history as you type; → accepts |
| zsh-fast-syntax-highlighting | Colours commands green (valid) or red (typo) before you press Enter |
| fastfetch | System info splash in new wide terminal windows; no username, hostname or IP |

### Apps (Homebrew casks)

1Password, Claude, CleanShot, Ghostty, Google Chrome, Granola, Grok Bot, Notion, Slack, Temurin 21 (Java), tldraw (offline),
Vorssaint (menu bar: keep-awake, system monitor, volume mixer).

Installed outside the Brewfile: Figma (by choice) and work-managed software.
GitHub is used through `gh` only.

### AI agents

| Tool | Notes |
|---|---|
| Claude Code | Settings tracked here; fff registered as an MCP server |
| Pi | fff search; **muscle-memory** (`/clear`, `/exit`, `/context`, `/rename`, `/effort`); **footer** (path, branch, context bar, model); **run-stats** (speed and tokens after each run); **tasting-notes** (wine facts while Pi works, `/wine`); **youtube-transcript** skill (`skills/youtube-transcript`, timestamps fixed; also linked into `~/.claude/skills/` for Claude Code) |

fff only works when Claude Code or Pi is started inside a project folder.
It refuses to index the home folder on purpose.

## Shortcuts and aliases

| Keys / command | Does |
|---|---|
| Ctrl-R | Fuzzy-search command history |
| Ctrl-T | Pick a file and paste its path |
| Tab | Completion in fzf: type to filter, Enter picks. Case-insensitive (`cd desk` → `Desktop`) |
| Alt-C | Jump into a folder (needs Ghostty's Option-as-Alt setting) |
| `**` + Tab | Fuzzy completion, e.g. `cd **<Tab>` |
| → | Accept the grey autosuggestion |
| `ls` | `eza` with icons |
| `ll` | Detailed list: hidden files, git status, header |
| `lt` | Two-level tree with details; skips `.git` and gitignored files |
| `tree` | `eza --tree` (`command tree` for the classic one) |
| `cat` | Plain macOS `cat`; use `bat` for colours |

`ls`, `ll`, `lt` and `tree` use eza only when typed in a real terminal. In
pipes, scripts, Claude Code and Pi they run the plain commands, because eza
lists nothing when it has no terminal (it reads file names from stdin).

## Git worktree helpers

A worktree is a second checkout of the same repo in a sibling folder, on its
own branch: work on two branches at once, or give an AI agent a sandbox.
(Claude Code can also do this itself: `claude -w <name>`.)

| Command | Does |
|---|---|
| `gwa <branch>` | Creates `../<repo>--<branch>` on a new branch and moves you into it |
| `gwr` | From inside a worktree: removes it and deletes its branch, after a yes/no prompt |

`gwr` refuses, before changing anything, if the worktree has uncommitted
changes (including new files) or the branch has commits not merged into the
main checkout's current branch.

## Review a plan in the terminal

`plannotator-tui` (from [plannotator/plannotator-tui](https://github.com/plannotator/plannotator-tui), MIT)
reads Claude Code's and Pi's saved replies, so it needs no agent plugin.

1. The agent writes a plan (or any reply worth reviewing).
2. Open the review in a split next to it: `/annotate` in Pi, `! annotate` in Claude Code
   (`annotate plan.md` for a file). Elsewhere: `plannotator-tui last` in a split you open.
3. Select text with the mouse or `v`, then `a` 👍 looks good · `c` 💬 comment · `d` ✗ delete.
4. `S` sends: the numbered feedback is pasted into the agent and submitted, and the
   split closes. (`E` sends a batch without closing; every batch arrives when you close.)

`q` asks before dropping unsent annotations; annotations are saved as you go. Outside a
Ghostty split, plannotator-tui only saves and copies the feedback (its own sending needs Herdr).

## Review code in the terminal

The agent writes the code; you read and comment. [`tuicr`](https://github.com/agavra/tuicr) (MIT)
shows the changes as a GitHub-style diff with vim keys.

1. Open the review in a split next to the agent: `/review` in Pi, `! review` in Claude Code.
   That shows uncommitted changes; add `-r main..HEAD` for a commit range or `--file src/`
   to comment on any file or folder.
2. `j`/`k` scroll, `{`/`}` jump between files, `c` comments a line, `v` selects a range.
3. `:wq`, then `y`: the comments (`src/x.ts:42 - …`) are pasted into the agent and
   submitted, and the split closes.

Quit without comments, or answer `n`, and nothing is sent. Sent comments are cleared from
tuicr's saved session, so the next review starts clean.

Both reviews run through `~/.local/bin/beside`: it opens the split and types whatever the
review prints into the agent. Another review tool needs only a small script that prints
its feedback.

## Prompts (slash commands)

Shared by Claude Code and Pi from `prompts/`.

| Command | Does |
|---|---|
| `/deslop [focus]` | Simplify finished work without changing what it does; defaults to uncommitted changes, asks before bigger removals |
| `/ship [hint]` | Commit this session's work (files staged by name, checks first, never `--no-verify`) and push; reports every git command used with a plain explanation |

## History and colours

- **History:** 100,000 commands in `~/.zsh_history`, saved as soon as each
  runs, with timestamps (`history -i`). Repeats keep only the latest copy.
  Start a command with a space to keep it out of history.
- **Colours:** one theme, **Gruvbox Dark**, across Ghostty, starship, vivid
  (`LS_COLORS`), bat (`BAT_THEME`), `man` pages (shown through bat) and delta.

## Ghostty

| Keys | Does |
|---|---|
| Cmd+` | Quick Terminal from any app (first use: allow Ghostty in System Settings → Privacy & Security → Accessibility) |
| Cmd+T / Cmd+1–9 | New tab / jump to tab |
| Cmd+D / Cmd+Shift+D | Split right / split down |
| Cmd+K | Clear screen and scrollback |
| Ctrl+C | Copy when text is selected, otherwise interrupt |
| Cmd+Shift+, | Reload the config |

Left Option acts as Alt (for fzf's Alt-C); right Option still types é, ü and
other special characters.

## macOS settings

`scripts/macos-defaults.sh` sets these with `defaults write`. `dot init`
runs it; it's safe to run again on its own after editing a line.

| Area | Setting |
|---|---|
| Global | Show all file extensions; fast key repeat (after next login) |
| Finder | Path bar, column view, search the current folder, show hidden files |
| Dock | Icon size 67, magnification up to 128 |
| Screenshots | PNG, saved to `~/Pictures/Screenshots` |

## New Mac setup

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

4. **Open a new terminal** so the shell config loads.

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
   installs the fff package listed in the tracked settings.

   ```bash
   curl -fsSL https://pi.dev/install.sh | sh
   pi update --extensions
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

## Matt Pocock's skills (vendored)

19 skills from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT),
copied unmodified into `skills/` and shared with Claude Code and Pi. The commit
and the list live in `scripts/vendor-skills.sh`; `skills/` holds the copies.

| Skill | Type | Use |
|---|---|---|
| `grill-me` (+ `grilling`) | you type `/grill-me` | Get interviewed about a plan before building |
| `diagnosing-bugs` | auto | Structured loop for hard bugs and slow code |
| `handoff` | `/handoff` | Compact a long session for a fresh agent |
| `wait-what` | `/wait-what` | An answer didn't land: re-pitch it |
| `teach` | `/teach` | Learn a concept inside your own project |
| `research` | auto | Primary-source research saved as Markdown |
| `writing-for-agents` | auto | Writing skills, AGENTS.md and CLAUDE.md well |
| `tdd` | auto | Test-first, red-green-refactor |
| `prototype` | auto | Throwaway prototype to answer a design question |
| `domain-modeling` | auto | Glossary and decision records (ADRs) |
| `wayfinder`, `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `code-review`, `retro` | mostly `/name` | Matt's full flow for big features (run `/setup-matt-pocock-skills` once per repo first) |

- **Update:** `scripts/vendor-skills.sh <commit>` (e.g. main's latest), then
  `git diff skills/` to review. Running it without a commit re-copies the pinned one.
- **Never edit these copies by hand**: the next update overwrites them.
- **In Claude Code,** the built-in `/code-review` takes precedence over Matt's
  `code-review` (same name); Pi uses Matt's.

## anti-slop (vendored)

`skills/install-anti-slop` from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop)
(MIT), copied unmodified at commit `13909c9`. In any JS/TS repo, ask Claude or Pi to
"install anti-slop": it copies Dillon's Oxlint rules into that repo (`tools/oxlint/anti-slop/`),
adds `oxlint` as a dev dependency there and enables the rules. Nothing is installed globally.

- **Update:** re-copy `skills/install-anti-slop/` from a newer upstream commit and
  change the commit above. Never edit the copy by hand.
- `~/.npmrc` has `min-release-age=3`: if the skill picks an `oxlint` release
  younger than 3 days, npm refuses it; pin the previous version instead.
- **This repo uses it** on our own Pi extensions: `npm install` once, then
  `npm run lint`. Config in `oxlint.config.ts`; provenance in
  `tools/oxlint/anti-slop/UPSTREAM.md`.

## Installed by apps

Some agent skills come from the apps themselves. This repo records **which**
skills to expect and **how** to install them (`packages/app-skills`), not the
files. `dot init` reminds you; `dot doctor` warns when one is missing.

| Skill | Installed by | Where |
|---|---|---|
| `tldraw-offline` | tldraw offline → **Install Agent Skills** | `~/.claude/skills`, `~/.pi/agent/skills`, `~/skills/tldraw-offline` |

## Everyday use

Files in `~` are links into the repo, so editing `~/.zshrc` edits
`~/.dotfiles/home/.zshrc` directly. Apps that save their own settings (Claude
Code, Pi) write through the links too.

Every commit runs `scripts/hooks/pre-commit`: zsh syntax, shellcheck, a fresh
login shell, `npm run lint` and a gitleaks secret scan.
If one fails, the commit is refused. Agents can't skip these checks: git-guard
blocks `--no-verify` and `git commit -n` in both Claude Code and Pi.

### The `dot` command

| Command | Does |
|---|---|
| `dot doctor` | Read-only health check: every file linked, no broken links, no link replaced by a plain file, Brewfile installed, pre-commit checks on, nothing uncommitted or unpushed |
| `dot add <file>...` | Moves files from `~` into `home/` and links them back (start tracking a file) |
| `dot stow` | Relinks `home/` into `~`; a real file in the way is backed up to `~/.dotfiles-backup/` |
| `dot update` | `git pull`, `brew upgrade`, relink |
| `dot init [--no-macos]` | Full setup on a new Mac |

```bash
dot add ~/.config/foo/config   # start tracking a file
cd ~/.dotfiles && git status   # what changed
git commit -am "..." && git push
dot doctor                     # all good?
```

**Installing something new with Homebrew:** `brew install <tool>`, then add a
line to `packages/Brewfile`. `brew bundle check --global --no-upgrade` confirms
everything in it is installed.

## Credits

- Repo layout and the `dot` command are inspired by
  [dmmulroy/.dotfiles](https://github.com/dmmulroy/.dotfiles) by Dillon Mulroy.
- File search for Claude Code and Pi: [fff](https://github.com/dmtrKovalenko/fff.nvim).
- 19 engineering and productivity skills: [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), vendored unmodified.
- `install-anti-slop` skill (Oxlint rules): [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) (MIT), vendored unmodified.
- YouTube transcript skill: [badlogic/pi-skills](https://github.com/badlogic/pi-skills) (MIT).
- git-guard idea: dmmulroy's git-interceptor (written from scratch).
- `web-access.ts` ideas: [badlogic/pi-skills](https://github.com/badlogic/pi-skills) brave-search, [tian.zuo/pi-web-search](https://www.npmjs.com/package/@tian.zuo/pi-web-search), [dmmulroy/pi-web-tools](https://github.com/dmmulroy/pi-web-tools), [pi-lab/websearch](https://www.npmjs.com/package/@pi-lab/websearch) (written from scratch).
- `tasting-notes.ts` idea: dmmulroy's whimsical.ts (written clean-room from a behaviour description).
- Pi command aliases idea: [xRyul/pi-aliases](https://github.com/xRyul/pi-aliases).
- `/deslop` and `/ship` prompts: adapted from [earendil-works/pi](https://github.com/earendil-works/pi) (MIT).
- Coding rules in `AGENTS.md`: adapted from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT).

License texts for the copied code are in `third_party/`.
