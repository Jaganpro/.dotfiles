# 📄 Tracked files

Every file below lives in `home/` and is linked into `~` by `dot stow`.

| File (in `~`, linked from `home/`) | What it holds |
|---|---|
| `~/.zprofile` | Homebrew and `~/.local/bin` on PATH; `JAVA_HOME`; points `brew bundle --global` at `packages/Brewfile`; `EDITOR` / `VISUAL` = nvim; `WRANGLER_SEND_METRICS=false`; `RIPGREP_CONFIG_PATH` |
| `~/.hushlogin` | Empty on purpose: its existence hides macOS's "Last login: …" line in new terminals and review splits |
| `~/.zshrc` | History, Gruvbox colours, fnm, fzf, eza shortcuts, direnv, autosuggestions, starship, fastfetch, syntax highlighting |
| `~/.config/fastfetch/config.jsonc` | Compact, private fastfetch layout |
| `~/.config/starship.toml` | Gruvbox powerline prompt |
| `~/.config/starship/sf-org.sh` | Finds the Salesforce target org for the prompt |
| `~/.config/zsh/worktree.zsh` | `gwa` / `gwr` git worktree helpers (loaded by `.zshrc`) |
| `~/.config/ripgrep/config` | ripgrep defaults: search hidden files, skip `.git/` and files over 5 MB |
| `~/.config/git/ignore` | Global git ignore for every repo: `.DS_Store`, personal Claude files, `.env*` / `.envrc` (except `.env.example`), Wrangler's `.dev.vars*` |
| `~/.config/ghostty/config.ghostty` | Ghostty (fallback terminal, and its Quick Terminal): Gruvbox Dark, font 14, Option-as-Alt, Quick Terminal, shortcuts, SSH terminfo, balanced padding, medium split dimming |
| `~/.config/nvim/init.lua` | Neovim = LazyVim: loads `lua/config/lazy.lua` (from the LazyVim starter). Header lists where everything lives and the keys worth knowing |
| `~/.config/nvim/lua/config/*.lua` | `lazy.lua` (loads lazy.nvim + LazyVim; Gruvbox while installing; no background update checks; `:Tutor` kept), `options.lua` (TypeScript server = TS 7 `tsc`), `keymaps.lua` (`Space h` opens docs/neovim.md), `autocmds.lua` (starts the tips window); both link to LazyVim's defaults |
| `~/.config/nvim/lua/config/coach.lua` | Tips window (our own): a top-right box with the Vim keys for the current mode, cursor position, file tree or finder, plus moving-around keys; `Space uk`. Started from `autocmds.lua` |
| `~/.config/nvim/lua/plugins/learning.lua` | Learning aids: hardtime (habit coach, hints only, mouse kept), screenkey (`:Screenkey`). Delete when no longer needed |
| `~/.config/nvim/lua/plugins/personal.lua` | Our only plugin changes: Gruvbox, single-click in the file tree, pop-up messages bottom right, finders include dotfolders |
| `~/.config/nvim/lazy-lock.json` | Exact plugin versions (lazy.nvim writes it); commit after `:Lazy update` |
| `~/.config/nvim/lazyvim.json` | LazyVim extras turned on with `:LazyExtras`: TypeScript (TS 7 `tsc --lsp`) and oxc (the project's oxlint) |
| `~/.config/rex/init.lua` | Rex behaviour: shortcuts, key modes, custom actions (empty for now). `rex config reload` after editing; the pre-commit hook runs `rex config check` |
| `~/.config/rex/themes/Gruvbox Dark` | Rex: the Gruvbox Dark theme file (Ghostty format), so importing it doesn't need Ghostty. See [Rex](terminal.md#rex) |
| `~/.npmrc` | npm installs only versions at least 3 days old (supply-chain cooldown) |
| `~/.pi/agent/npm/.npmrc` | No cooldown for Pi extensions (they all install in this folder) |
| `~/.claude/statusline.sh` | Claude Code status line (one line): ✨ model (effort) ⚡ │ 📁 path 🌿 git │ gradient context bar + tokens │ 💰 cost │ 🔥/❄️ prompt cache │ 🏷️ session │ 📦 version |
| `~/.gitconfig` | Name/email (GitHub noreply), `gh` login, delta pager, pull = rebase, prune on fetch, newest branches first, rerere, `git fomo`, `git nuke` |
| `~/.claude/CLAUDE.md` | Instructions for every Claude Code session: prefer fff for file search |
| `~/.claude/settings.json` | Claude Code preferences, hooks, status line; no commit/PR attribution. The SessionStart hook is Rex's (`rex skill setup`): it tells Claude which Rex session and pane it runs in, and to name the session after its task (session naming, on) |
| `~/.pi/agent/settings.json` | Pi default model, the fff package, pi-claude-code (Claude models through your Claude Code login; pinned to a reviewed commit, update with `pi install …@<commit>`), and the path to `skills/youtube-transcript` |
| `~/.pi/agent/mcp.json` | Pi MCP servers: `superlogical` (Rex community MCP, HTTP). Sign in once per Mac with `pi mcp login superlogical`; the token stays in `~/.pi/agent/mcp-auth.json` (not tracked) |
| `~/.pi/agent/extensions/web-access.ts` | Pi `web_search` (Brave → Parallel → TinyFish; freshness and country passed through; falls back on quota) and `web_fetch` (direct download first, then extractors). The card shows the service and, only when the provider reports it, calls remaining. Keys in the macOS Keychain. `/web` shows status |
| `~/.pi/agent/extensions/git-guard.ts` | Pi: blocks commands that skip git hooks (`--no-verify`, `git commit -n`) and stops git opening an editor |
| `~/.claude/hooks/git-guard.sh` | Claude Code: the same hook-skipping block, as a PreToolUse hook (registered in `settings.json`, which also sets `GIT_EDITOR=true`) |
| `~/.pi/agent/extensions/muscle-memory.ts` | Claude Code command names work in Pi too: `/clear`, `/exit`, `/context`, `/rename`, `/effort` (our own, inspired by xRyul/pi-aliases) |
| `~/.pi/agent/extensions/footer.ts` | Pi's footer: `~/path ⎇ branch · session` and a context bar with %, window size and model (written with Pi) |
| `~/.pi/agent/extensions/run-stats.ts` | After each Pi run: `⚡ tokens/sec · ⏱ time · ✍️ written · 📖 read · 💾 from cache` (our own; clean-room rewrite) |
| `~/.pi/agent/extensions/tasting-notes.ts` | While Pi works: a winemaking phrase (🍾 Uncorking…) in the working line and a French or Italian wine fact above the input box, every 7 seconds; 100 facts checked against sources; `/wine` for one on demand (our own; clean-room) |
| `~/.pi/agent/extensions/review.ts` | `/annotate` (Pi's newest reply, or `/annotate plan.md`) and `/review` (code changes) full screen in Pi's terminal, via the scripts below; the feedback becomes your next message |
| `~/.local/bin/annotate` | plannotator-tui review; in Claude Code run `! annotate` (opens through `beside`) |
| `~/.local/bin/review` | tuicr review; in Claude Code run `! review` (opens through `beside`) |
| `~/.local/bin/beside` | Claude Code only: runs a review in a Rex split to the right (`rex split`) and pastes what it prints into the agent |
| `~/.pi/agent/AGENTS.md` | Global instructions shared by Pi and Claude Code (Claude imports it from `~/.claude/CLAUDE.md`): use `uv` for Python; ponytail rules for code (smallest complete change, reuse, no slop) |

Never tracked: logins, tokens and app state (`~/.config/gh/hosts.yml`,
`~/.pi/agent/auth.json`, `~/.pi/agent/mcp-auth.json`, `~/.claude.json`, shell history, caches).

## Repo layout

```
~/.dotfiles/
├── home/                 mirrors ~ (linked by Stow; edit ~/.zshrc = edit the repo)
├── packages/Brewfile     every Homebrew tool and app
├── packages/app-skills   agent skills installed by apps (checked by dot doctor, not stored here)
├── scripts/macos-defaults.sh
├── scripts/rex-settings.sh   Rex app settings + theme import (run by hand, Rex quit)
├── scripts/grokbot-settings.sh  Grok Bot general settings (run by hand, Grok Bot quit; work-specific ones stay in the app)
├── scripts/hooks/pre-commit   checks every commit: lint, shellcheck, shell start-up, secrets
├── skills/               agent skills for Pi (via its settings) and Claude Code (linked into ~/.claude/skills)
├── scripts/vendor-skills.sh   copies Matt Pocock's skills into skills/ at a pinned commit
├── prompts/              slash commands for Pi (via its settings) and Claude Code (linked into ~/.claude/commands)
├── docs/                 detailed guides (setup, files, terminal, agents)
├── third_party/          licenses for code taken from other repos
├── tools/oxlint/         anti-slop lint rules (vendored); `npm run lint`, config in oxlint.config.ts
├── dot                   the `dot` command: init, doctor, update, stow, add
├── AGENTS.md             how AI agents (Claude Code, Pi) should work in this repo
├── CLAUDE.md             points Claude Code at AGENTS.md
├── CREDITS.md            projects this setup builds on
└── README.md
```
