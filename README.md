<div align="center">

# .dotfiles

**My macOS setup for Apple Silicon: zsh, Rex, Claude Code and Pi, Gruvbox Dark everywhere.**

![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)
![zsh](https://img.shields.io/badge/shell-zsh-89b482?style=flat-square&logo=gnubash&logoColor=white)
![Homebrew](https://img.shields.io/badge/Homebrew-Brewfile-fbb040?style=flat-square&logo=homebrew&logoColor=black)
![GNU Stow](https://img.shields.io/badge/links-GNU_Stow-d79921?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude_Code-ready-d97757?style=flat-square&logo=claude&logoColor=white)
![Pi](https://img.shields.io/badge/Pi-ready-7daea3?style=flat-square)
![Theme](https://img.shields.io/badge/theme-Gruvbox_Dark-282828?style=flat-square)

</div>

Config files live in `home/`, which mirrors `~` with real file names. [GNU Stow](https://www.gnu.org/software/stow/)
links each one into place. Built from scratch in October 2026, one tool at a time.

## ✨ Highlights

- 🚀 **One command:** `dot init` installs the Brewfile, links every config, and sets macOS and Rex preferences
- 🩺 **Checks itself:** `dot doctor` finds broken links, missing packages and unpushed work
- 🤖 **One setup for two agents:** Claude Code and Pi share skills, prompts and rules
- 📝 **Reviews in the terminal:** `/annotate` for plans and `/review` for diffs; your feedback becomes the agent's next message
- 🔒 **Checked commits:** shellcheck, lint and a gitleaks scan run on every commit, and agents can't skip them
- 🎨 **One theme:** Gruvbox Dark in Rex, Ghostty, starship, Neovim, bat, delta, eza and `man`

## 🚀 Quick start

```bash
# 1. Homebrew (also installs git), from https://brew.sh, then:
eval "$(/opt/homebrew/bin/brew shellenv)"

# 2. Log in to GitHub and clone
brew install gh
gh auth login --hostname github.com --git-protocol https --web
gh repo clone Jaganpro/.dotfiles ~/.dotfiles

# 3. Set up everything, then open a new terminal
~/.dotfiles/dot init
dot doctor
```

Node, the Salesforce CLI, Pi, web-search keys and app-installed skills come next: see
**[docs/setup.md](docs/setup.md)** for the full walkthrough.

## 📁 Structure

```
~/.dotfiles/
├── dot              the `dot` command: init, doctor, update, stow, add
├── home/            mirrors ~ (linked by Stow; editing ~/.zshrc edits the repo)
├── packages/        Brewfile (every tool and app) and app-skills (skills installed by apps)
├── scripts/         macOS defaults, Rex settings, skill vendoring, the pre-commit hook
├── skills/          agent skills for Pi and Claude Code
├── prompts/         slash commands for Pi and Claude Code
├── tools/oxlint/    vendored anti-slop lint rules (`npm run lint`)
├── docs/            the detailed guides linked below
├── third_party/     licenses for code taken from other repos
└── AGENTS.md        how AI agents should work in this repo (CLAUDE.md points here)
```

Every folder and script in detail: [docs/files.md](docs/files.md#repo-layout).

## 🛠️ The `dot` command

| Command | Does |
|---|---|
| `dot init [--no-macos]` | Full setup on a new Mac (`--no-macos` skips the macOS and Rex settings) |
| `dot doctor` | Read-only health check: every file linked, no broken links, no link replaced by a plain file, Brewfile installed, pre-commit checks on, nothing uncommitted or unpushed |
| `dot add <file>...` | Moves files from `~` into `home/` and links them back (start tracking a file) |
| `dot stow` | Relinks `home/` into `~`; a real file in the way is backed up to `~/.dotfiles-backup/` |
| `dot update` | `git pull`, `brew upgrade`, relink |

<details>
<summary><b>What <code>dot init</code> does</b></summary>

1. Installs everything in `packages/Brewfile`
2. Lets zsh trust Homebrew's completion folders
3. Links `home/` into `~` and puts `dot` in `~/.local/bin`
4. Installs the npm dependencies of skills and lint tools
5. Turns on the pre-commit checks (`core.hooksPath`)
6. Applies `scripts/macos-defaults.sh` and, when Rex is installed, `scripts/rex-settings.sh`
7. Reminds you of the skills that apps install themselves

Any real file already in the way is moved to `~/.dotfiles-backup/<date-time>/`, never overwritten.

</details>

## 🧰 What's inside

| Area | Highlights | Details |
|---|---|---|
| 🐚 **Shell** | zsh, starship prompt, fzf + fzf-tab, autosuggestions, syntax highlighting, 100k history | [terminal.md](docs/terminal.md) |
| 🖥️ **Terminal** | Rex (main, private beta), Ghostty (backup and Quick Terminal) | [terminal.md](docs/terminal.md#rex) |
| ✏️ **Editor** | Neovim as LazyVim (Gruvbox, single-click file tree, git blame) + lazygit | [neovim.md](docs/neovim.md) |
| 🔧 **CLI tools** | ripgrep, fd, bat, eza, delta, jq, yq, ast-grep, gitleaks, uv, fnm, gh | [terminal.md](docs/terminal.md#command-line-tools) |
| 🤖 **AI agents** | Claude Code and Pi: skills, prompts, review tools, Pi extensions | [agents.md](docs/agents.md) |
| 📄 **Every tracked file** | What each file in `~` holds | [files.md](docs/files.md) |
| 🍏 **macOS** | Finder, Dock, key repeat, screenshots | [terminal.md](docs/terminal.md#macos-settings) |

## ⌨️ Everyday shortcuts

| Keys / command | Does |
|---|---|
| <kbd>Ctrl</kbd>+<kbd>R</kbd> | Fuzzy-search command history |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> | Pick a file and paste its path |
| <kbd>Alt</kbd>+<kbd>C</kbd> | Jump into a folder |
| <kbd>Tab</kbd> | Completion in an fzf list with previews |
| <kbd>→</kbd> | Accept the grey autosuggestion |
| `ll` / `lt` | Detailed list / two-level tree (eza) |
| `gwa <branch>` / `gwr` | Create / remove a git worktree next to the repo |
| `nvim .` | Open a project in Neovim (LazyVim). Then `Space e` tree, `Space Space` find file, `Space /` search, `Space gg` lazygit, `Space h` the guide |

Full lists: [docs/terminal.md](docs/terminal.md#shortcuts-and-aliases) (shell), [docs/neovim.md](docs/neovim.md#shortcuts) (Neovim).

## 🤖 Working with agents

| In Pi | In Claude Code | Does |
|---|---|---|
| `/annotate` | `! annotate` | Review the agent's plan or last reply; comments go back as your next message |
| `/review` | `! review` | Review code changes as a diff and comment on lines |
| `/ship` | `/ship` | Run the checks, commit this session's work, push |
| `/deslop` | `/deslop` | Simplify finished work without changing what it does |

Also included: 19 skills from Matt Pocock, the anti-slop lint installer, and Pi extensions for web search,
the footer, run stats and git-guard. See [docs/agents.md](docs/agents.md).

## 🔄 Day to day

Files in `~` are links into the repo, so editing `~/.zshrc` edits `~/.dotfiles/home/.zshrc`.
Apps that save their own settings (Claude Code, Pi) write through the links too.

```bash
dot add ~/.config/foo/config   # start tracking a file
cd ~/.dotfiles && git status   # what changed
git commit -am "..." && git push
dot doctor                     # all good?
```

**Installing something new with Homebrew:** `brew install <tool>`, then add a line to
`packages/Brewfile`. `brew bundle check --global --no-upgrade` confirms everything in it is installed.

Every commit runs `scripts/hooks/pre-commit`: zsh syntax, shellcheck, Rex's `init.lua` (when Rex is
installed), a fresh login shell, `npm run lint` and a gitleaks secret scan. If one fails, the
commit is refused. Agents can't skip these checks: git-guard blocks `--no-verify` and `git commit -n`
in both Claude Code and Pi.

## 🩺 Troubleshooting

| Problem | Fix |
|---|---|
| Something looks off | `dot doctor` names the problem and the fix |
| A link was replaced by a plain file | `dot stow` (the file is backed up first) |
| Brew can't install over an app you downloaded | `brew install --cask --adopt <app>` in a real terminal |
| Rex settings not applied | Quit Rex (<kbd>Cmd</kbd>+<kbd>Q</kbd>), then run `scripts/rex-settings.sh` from Ghostty |
| `ls` / `ll` print plain output | Expected in pipes and agent shells; eza is used only in a real terminal |
| fff finds nothing | Start Claude Code or Pi inside a project folder; fff won't index `~` |

## 🙏 Credits

Built on the work of many others. Dillon Mulroy's [.dotfiles](https://github.com/dmmulroy/.dotfiles)
inspired the layout and the `dot` command. See **[CREDITS.md](CREDITS.md)** for every project used.
