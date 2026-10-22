# .dotfiles: notes for AI agents

macOS (Apple Silicon) setup. Shell is zsh, terminal is Ghostty, theme is
Gruvbox Dark everywhere. README.md is the human guide; keep it in sync.

## Layout

```
home/                    mirrors ~ ; GNU Stow links each file into ~ (--no-folding)
packages/Brewfile        every Homebrew tool and app (brew bundle --global reads it)
scripts/macos-defaults.sh
dot                      the `dot` command: init, doctor, update, stow, add
skills/                  agent skills with npm deps (not stowed; Pi settings point here)
third_party/             licenses of code taken from other repos
tools/oxlint/anti-slop/  vendored Oxlint rules; `npm run lint` (oxlint.config.ts) checks our Pi extensions
```

## Editing rules

- **Edit files under `home/`, never the links in `~`.** `~/.zshrc` is a link to
  `home/.zshrc`; writing a new file over the link breaks it. Same file, so
  edit `~/.dotfiles/home/<path>`.
- **New config file:** `dot add <file>` moves it into `home/` and links it.
  `dot doctor` checks every link afterwards. Never stow without `--no-folding`, or
  whole folders like `~/.claude` (sessions, history) end up in git.
- **New Homebrew tool:** add a commented line to `packages/Brewfile` and a row
  to the matching README table.
- **Code from other repos:** only from openly licensed repos. Keep the
  original notice in a header comment, say what was changed, and add the
  license text to `third_party/`.
- **Vendored skills** in `skills/` (Matt Pocock's 19, listed in `scripts/vendor-skills.sh`)
  are unmodified copies: update them with that script, never edit them by hand.
  Same for `skills/install-anti-slop` (dmmulroy/anti-slop, commit in README):
  update by re-copying it from upstream.
- **App-installed skills** (e.g. tldraw's `tldraw-offline`) are not open source:
  never copy them into this repo. List them in `packages/app-skills` instead.
- **Never track secrets or app state:** tokens, `auth.json`, `~/.claude.json`,
  `~/.config/gh/hosts.yml`, history, caches. Keys belong in the macOS Keychain.

## Gotchas

- Nerd Font icons (starship.toml) are private-use Unicode and get dropped by
  some writers. Insert them by code point (e.g. perl `\x{E0B0}`) and check the
  file's code points afterwards.
- `ls`, `ll`, `lt`, `tree` are zsh functions that use eza only in a real
  terminal; in pipes and agent shells they run the plain commands.
- Shell startup order matters in `home/.zshrc`: compinit before fzf-tab;
  zsh-fast-syntax-highlighting stays last.
- Scripts target macOS's `/bin/bash` 3.2 (no `${var^}`, no associative arrays).

## Before committing

`scripts/hooks/pre-commit` runs these on every commit and refuses it if one fails.
Never skip it (`--no-verify` is blocked anyway); fix the problem instead.

```bash
zsh -n home/.zshrc                       # syntax
shellcheck dot scripts/*.sh scripts/hooks/pre-commit home/.claude/statusline.sh home/.claude/hooks/*.sh home/.config/starship/*.sh
env -i HOME="$HOME" USER="$USER" TERM=xterm-256color zsh -lic exit   # fresh login shell
npm run lint                             # anti-slop rules on our Pi extensions
gitleaks git --pre-commit --staged --redact .   # no secrets
```

Run `dot doctor` yourself after changing links or the Brewfile: it checks this
Mac (links, packages, hook), not the code, so it is not in the hook.

This repo is **public**: never add work paths, internal hostnames, company
names or employer tooling, even when gitleaks wouldn't flag them.

Commit messages: short, imperative, no Co-Authored-By or "Generated with" lines.
Ask before installing anything; the owner decides each tool one at a time.
