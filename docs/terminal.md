# 🖥️ Terminal, shell and macOS

## Command-line tools

| Tool | Use | Try |
|---|---|---|
| stow | Links `~/.dotfiles/home` into `~` (driven by `dot`) | `dot stow` |
| gh | GitHub from the terminal; also handles git login | `gh repo list` |
| fnm | Node version manager; switches version per project | `fnm list` |
| Java (Temurin 21) | JDK for Salesforce tooling (Apex language server, Code Analyzer) | `java -version` |
| uv | Python versions, packages and tools | `uvx <tool>`, `uv run script.py` |
| ripgrep | Fast search through file contents | `rg "TODO"` |
| jq | Read and edit JSON (newer than macOS's built-in) | `jq '.name' package.json` |
| neovim | Editor, set up as [LazyVim](#neovim): file tree, tabs, fuzzy finder, git, Treesitter. Also `$EDITOR` | `nvim .` |
| lazygit | Full-screen git: stage, commit, push, branches, history (also Space gg in Neovim) | `lazygit` |
| tree-sitter-cli | Builds the Treesitter parsers Neovim uses for syntax colours | `:TSUpdate` in Neovim |
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

## Shell plugins

| Tool | Use |
|---|---|
| starship | Gruvbox prompt: Apple icon, folder, git, Node/Python/Java, Salesforce org (red ⚠ if the alias contains "prod"), slow-command time, clock |
| fzf-tab | Tab opens an fzf list with previews (folder contents, first 50 lines of files) |
| zsh-completions | Extra Tab-completion definitions; Homebrew tools and `sf` bring their own |
| zsh-autosuggestions | Grey suggestion from history as you type; → accepts |
| zsh-fast-syntax-highlighting | Colours commands green (valid) or red (typo) before you press Enter |
| fastfetch | System info splash in new wide terminal windows; no username, hostname or IP |

## Apps (Homebrew casks)

1Password, Claude, CleanShot, Ghostty, Google Chrome, Granola, Grok Bot, Notion, Slack, Temurin 21 (Java), tldraw (offline),
Vorssaint (menu bar: keep-awake, system monitor, volume mixer).

Installed outside the Brewfile: Figma (by choice), Rex (private beta; download after a Discord
login: https://www.superlogical.com/rex/docs/installation) and work-managed software.
GitHub is used through `gh` only.

## Shortcuts and aliases

| Keys / command | Does |
|---|---|
| Ctrl-R | Fuzzy-search command history |
| Ctrl-T | Pick a file and paste its path |
| Tab | Completion in fzf: type to filter, Enter picks. Case-insensitive (`cd desk` → `Desktop`) |
| Alt-C | Jump into a folder (needs Option to act as Alt: Rex's automatic Option-key setting, or Ghostty's Option-as-Alt) |
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
- **Colours:** one theme, **Gruvbox Dark**, across Rex, Ghostty, starship, vivid
  (`LS_COLORS`), bat (`BAT_THEME`), `man` pages (shown through bat), delta and Neovim.

## Neovim

[LazyVim](https://lazyvim.org): a popular, ready-made Neovim setup, so we
don't maintain our own. `nvim .` opens a folder: file tree, file tabs, status
bar, fuzzy finder, git marks, Treesitter colours, key-hint popup, lazygit. It's
also `$EDITOR` (git commit messages etc.); agents set `GIT_EDITOR=true`, so
they never open it.

Our only changes are Gruvbox, plain line numbers, git blame on the current line
and single-click in the file tree: `lua/config/options.lua` and
`lua/plugins/personal.lua` in `~/.config/nvim/`. Everything else is LazyVim's
default. Its own guide: <https://lazyvim.org/keymaps>.

| Keys | Does |
|---|---|
| Space (pause) | Popup listing every shortcut |
| Space e | File tree (click a file to open it, `?` for tree keys) |
| Space ff / Space / | Find a file by name / search text in all files |
| Space , / Space fr | Open files / recent files |
| Shift-h / Shift-l · Space bd | Previous / next file tab · close the tab |
| Space gg | lazygit: full-screen git (stage, commit, push, branches) |
| Space gb · ]h [h | Git blame for the line · next / previous git change |
| Space l · Space x | Plugin manager · LazyVim extras (e.g. TypeScript support) |

- **First launch on a new Mac:** LazyVim installs its plugins and Treesitter
  parsers by itself (no prompt, about a minute). Restart Neovim afterwards.
- **Update:** `Space l` then `U` (or `:Lazy update`), then commit the changed
  `lazy-lock.json`. To undo an update: `git checkout` the old
  `lazy-lock.json`, then `:Lazy restore`.
- **Language support** (go-to-definition, errors as you type): off apart from
  Lua. Turn on a language with `:LazyExtras` (e.g. `lang.typescript`); that
  writes `lazyvim.json`, so commit it.

## Ghostty

The fallback terminal while Rex is in beta: use it when Rex is down or being
updated, to run `scripts/rex-settings.sh` (which needs Rex quit), and for the
Quick Terminal (Rex has none yet). Remove it once Rex no longer needs a backup.

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

## Rex

The main terminal. Rex (private beta) keeps its look in the app's preferences, not in a file, and
can't set them from `init.lua` yet. `scripts/rex-settings.sh` writes them with
`defaults write` (font 14, font smoothing off, always dark, tabs in a left sidebar, Remote Control on,
session naming on, ...) and imports the Gruvbox Dark theme. On a new Mac, after
installing Rex:

1. `dot init` runs `~/.dotfiles/scripts/rex-settings.sh` when Rex is installed.
   It refuses while Rex is open, because Rex would overwrite the settings; then
   quit Rex (Cmd+Q) and run it yourself from another terminal (Ghostty). Safe
   to run again.
2. Padding colour: leave it on **Background**, not Extend (Extend has open bugs).
3. `rex skill setup` (see [Installed by apps](agents.md#installed-by-apps)).

Behaviour (shortcuts, key modes, custom actions) lives in
`~/.config/rex/init.lua`, which Stow links like any other file. Rex doesn't
watch it: run `rex config reload` after editing, and `rex keymap` to see what
loaded.

The setting names are undocumented, so a Rex update may rename them; change a
setting in the app and compare with `defaults read com.superlogical.rex`.

## macOS settings

`scripts/macos-defaults.sh` sets these with `defaults write`. `dot init`
runs it; it's safe to run again on its own after editing a line.

| Area | Setting |
|---|---|
| Global | Show all file extensions; fast key repeat (after next login) |
| Finder | Path bar, column view, search the current folder, show hidden files |
| Dock | Icon size 67, magnification up to 128 |
| Screenshots | PNG, saved to `~/Pictures/Screenshots` |

