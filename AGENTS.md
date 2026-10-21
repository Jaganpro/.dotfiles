# .dotfiles: notes for AI agents

macOS (Apple Silicon) setup. Shell is zsh, terminal is Ghostty, theme is
Gruvbox Dark everywhere. README.md is the human guide; keep it in sync.

## Layout

```
home/                    mirrors ~ ; GNU Stow links each file into ~ (--no-folding)
packages/Brewfile        every Homebrew tool and app (brew bundle --global reads it)
scripts/macos-defaults.sh
install.sh               brew bundle -> stow -> macOS settings; safe to rerun
```

## Editing rules

- **Edit files under `home/`, never the links in `~`.** `~/.zshrc` is a link to
  `home/.zshrc`; writing a new file over the link breaks it. Same file, so
  edit `~/.dotfiles/home/<path>`.
- **New config file:** move it into the same path under `home/`, then run
  `./install.sh --no-macos` to link it. Never stow without `--no-folding`, or
  whole folders like `~/.claude` (sessions, history) end up in git.
- **New Homebrew tool:** add a commented line to `packages/Brewfile` and a row
  to the matching README table.
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

```bash
zsh -n home/.zshrc                       # syntax
shellcheck install.sh scripts/*.sh home/.claude/statusline.sh home/.config/starship/*.sh
env -i HOME="$HOME" USER="$USER" TERM=xterm-256color zsh -lic exit   # fresh login shell
gitleaks dir --redact .                  # no secrets (the pre-commit hook also checks)
```

This repo is **public**: never add work paths, internal hostnames, company
names or employer tooling, even when gitleaks wouldn't flag them.

Commit messages: short, imperative, no Co-Authored-By or "Generated with" lines.
Ask before installing anything; the owner decides each tool one at a time.
