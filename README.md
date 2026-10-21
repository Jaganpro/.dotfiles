# .dotfiles

My macOS setup (Apple Silicon). Config files live in `home/`, which mirrors
`~` with real file names; [GNU Stow](https://www.gnu.org/software/stow/) links
each one into place. Built from scratch in October 2026, one tool at a time.

## Layout

```
~/.dotfiles/
├── home/                 mirrors ~ (linked by Stow; edit ~/.zshrc = edit the repo)
├── packages/Brewfile     every Homebrew tool and app
├── scripts/macos-defaults.sh
├── scripts/hooks/pre-commit   gitleaks blocks commits containing secrets
├── install.sh            packages -> links -> macOS settings (safe to rerun)
├── AGENTS.md             how AI agents (Claude Code, Pi) should work in this repo
├── CLAUDE.md             points Claude Code at AGENTS.md
└── README.md
```

## What's tracked

| File (in `~`, linked from `home/`) | What it holds |
|---|---|
| `~/.zprofile` | Homebrew and `~/.local/bin` on PATH; `JAVA_HOME`; points `brew bundle --global` at `packages/Brewfile`; `RIPGREP_CONFIG_PATH` |
| `~/.zshrc` | History, Gruvbox colours, fnm, fzf, eza shortcuts, direnv, autosuggestions, starship, fastfetch, syntax highlighting |
| `~/.config/fastfetch/config.jsonc` | Compact, private fastfetch layout |
| `~/.config/starship.toml` | Gruvbox powerline prompt |
| `~/.config/starship/sf-org.sh` | Finds the Salesforce target org for the prompt |
| `~/.config/zsh/worktree.zsh` | `gwa` / `gwr` git worktree helpers (loaded by `.zshrc`) |
| `~/.config/ripgrep/config` | ripgrep defaults: search hidden files, skip `.git/` and files over 5 MB |
| `~/.config/git/ignore` | Global git ignore for every repo: `.DS_Store`, personal Claude files, `.env*` / `.envrc` (except `.env.example`) |
| `~/.config/ghostty/config.ghostty` | Ghostty: Gruvbox Dark, font 14, Option-as-Alt, Quick Terminal, shortcuts, SSH terminfo, balanced padding |
| `~/.npmrc` | npm installs only versions at least 3 days old (supply-chain cooldown) |
| `~/.pi/agent/npm/.npmrc` | No cooldown for Pi extensions (they all install in this folder) |
| `~/.claude/statusline.sh` | Claude Code status line (one line): ✨ model (effort) ⚡ │ 📁 path 🌿 git │ gradient context bar + tokens │ 💰 cost │ 🔥/❄️ prompt cache │ 🏷️ session │ 📦 version |
| `~/.gitconfig` | Name/email (GitHub noreply), `gh` login, delta pager, pull = rebase, prune on fetch, newest branches first, rerere, `git fomo`, `git nuke` |
| `~/.claude/CLAUDE.md` | Instructions for every Claude Code session: prefer fff for file search |
| `~/.claude/settings.json` | Claude Code preferences, hooks, status line; no commit/PR attribution |
| `~/.pi/agent/settings.json` | Pi default model and packages |

Never tracked: logins, tokens and app state (`~/.config/gh/hosts.yml`,
`~/.pi/agent/auth.json`, `~/.claude.json`, shell history, caches).

## Tools

### Command line

| Tool | Use | Try |
|---|---|---|
| stow | Links `~/.dotfiles/home` into `~` | `./install.sh` |
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
| ffmpeg | Convert, trim and compress audio and video | `ffmpeg -i in.mov out.mp4` |
| direnv | Loads a folder's `.envrc` (e.g. `export SF_TARGET_ORG=dev`) on `cd`, unloads on leave | `direnv allow` |
| ast-grep | Search code by structure, not text | `sg -p 'console.log($A)'` |
| btop | CPU, memory, disk and process monitor | `btop` |
| shellcheck | Finds bugs in shell scripts | `shellcheck install.sh` |
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
| Pi | Settings tracked here; `pi-fff` extension listed in its packages |

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

`scripts/macos-defaults.sh` sets these with `defaults write`. `install.sh`
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

3. **Run the installer** (Brewfile, links, macOS settings):

   ```bash
   ~/.dotfiles/install.sh
   ```

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

7. **Pi** and its fff extension:

   ```bash
   curl -fsSL https://pi.dev/install.sh | sh
   pi install npm:@ff-labs/pi-fff
   ```

8. **Claude Code: register fff** (lives in `~/.claude.json`, which isn't tracked):

   ```bash
   claude mcp add --scope user fff -- /opt/homebrew/bin/fff-mcp
   ```

## Everyday use

Files in `~` are links into the repo, so editing `~/.zshrc` edits
`~/.dotfiles/home/.zshrc` directly. Apps that save their own settings (Claude
Code, Pi) write through the links too. Every commit is scanned by gitleaks
(`scripts/hooks/pre-commit`); a commit containing a secret is refused.

```bash
cd ~/.dotfiles
git status                     # what changed
git commit -am "..." && git push

git pull                       # changes made on another Mac
```

**Tracking a new file:** move it into the same place under `home/`, then link it:

```bash
mkdir -p ~/.dotfiles/home/.config/foo
mv ~/.config/foo/config ~/.dotfiles/home/.config/foo/
~/.dotfiles/install.sh --no-macos      # or: stow --no-folding -d ~/.dotfiles -t ~ home
```

**Installing something new with Homebrew:** `brew install <tool>`, then add a
line to `packages/Brewfile`. `brew bundle check --global --no-upgrade` confirms
everything in it is installed.

**Checking the links:** `find ~ -maxdepth 4 -type l -lname '*dotfiles*'` lists
them; a link that turned into a plain file means an app replaced it, so move
the file back into `home/` and rerun `install.sh`.
