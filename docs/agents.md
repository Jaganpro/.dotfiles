# 🤖 AI agents

Claude Code and Pi share one setup: skills, prompts, rules and review tools.

## Agents

| Tool | Notes |
|---|---|
| Claude Code | Settings tracked here; fff registered as an MCP server |
| Pi | fff search; **muscle-memory** (`/clear`, `/exit`, `/context`, `/rename`, `/effort`); **footer** (path, branch, context bar, model); **run-stats** (speed and tokens after each run); **tasting-notes** (wine facts while Pi works, `/wine`); **youtube-transcript** skill (`skills/youtube-transcript`, timestamps fixed; also linked into `~/.claude/skills/` for Claude Code) |

fff only works when Claude Code or Pi is started inside a project folder.
It refuses to index the home folder on purpose.

## Review a plan in the terminal

`plannotator-tui` (from [plannotator/plannotator-tui](https://github.com/plannotator/plannotator-tui), MIT)
reads Claude Code's and Pi's saved replies, so it needs no agent plugin.

1. The agent writes a plan (or any reply worth reviewing).
2. Open the review: `/annotate` in Pi (full screen in Pi's terminal), `! annotate` in Claude
   Code (a Rex split beside it); `annotate plan.md` for a file. Elsewhere: `plannotator-tui last`.
3. Select text with the mouse or `v`, then `a` 👍 looks good · `c` 💬 comment · `d` ✗ delete.
4. `S` sends: the review closes and the numbered feedback goes to the agent as your
   next message. (`E` sends a batch without closing; every batch arrives when you close.)

`q` asks before dropping unsent annotations; annotations are saved as you go. Run on its
own, plannotator-tui only saves and copies the feedback (its own sending needs Herdr).

## Review code in the terminal

The agent writes the code; you read and comment. [`tuicr`](https://github.com/agavra/tuicr) (MIT)
shows the changes as a GitHub-style diff with vim keys.

1. Open the review: `/review` in Pi (full screen in Pi's terminal), `! review` in Claude Code
   (a Rex split beside it).
   That shows uncommitted changes; add `-r main..HEAD` for a commit range or `--file src/`
   to comment on any file or folder.
2. `j`/`k` scroll, `{`/`}` jump between files, `c` comments a line, `v` selects a range.
3. `:wq`, then `y`: the review closes and the comments (`src/x.ts:42 - …`) go to the
   agent as your next message.

Quit without comments, or answer `n`, and nothing is sent. Sent comments are cleared from
tuicr's saved session, so the next review starts clean.

Both scripts follow one rule: the review draws on the terminal and prints its feedback
on stdout. Pi hands over its terminal and sends that output; in Claude Code,
`~/.local/bin/beside` opens a Rex split and pastes it into the agent. Another review tool
needs only a small script that follows the rule.

## Prompts (slash commands)

Shared by Claude Code and Pi from `prompts/`.

| Command | Does |
|---|---|
| `/deslop [focus]` | Simplify finished work without changing what it does; defaults to uncommitted changes, asks before bigger removals |
| `/ship [hint]` | Commit this session's work (files staged by name, checks first, never `--no-verify`) and push; reports every git command used with a plain explanation |

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
| `rex` | `rex skill setup` (or **Install Rex for Agents** in Rex's command palette) | `~/.claude/skills/rex`, `~/.agents/skills/rex` (Pi reads it) |

