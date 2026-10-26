# ✏️ Neovim (LazyVim)

The editor for reading and reviewing code in the terminal. Every shortcut below
was checked against this config.

- [What it is](#what-it-is)
- [Vim in five minutes](#vim-in-five-minutes)
- [A code-review session](#a-code-review-session)
- [Shortcuts](#shortcuts)
- [Looking after it](#looking-after-it)
- [Troubleshooting](#troubleshooting)

## What it is

[Neovim](https://neovim.io) set up as [LazyVim](https://lazyvim.org): a popular,
ready-made setup of about 30 well-known plugins, maintained by someone else.
We only list what differs from LazyVim's defaults.

What you see after `nvim .`:

```
┌─ Explorer ──────┬─ main.ts ─ utils.ts ─ README.md ──────────────┐   ← open files (tabs)
│ ▾ src           │  1  import { x } from "./utils"   You, 2 days │   ← faded git blame
│     main.ts     │▎ 2  const y = x + 1                           │   ← ▎ = changed since last commit
│     utils.ts    │  3                                            │
│   README.md     │                                               │
├─────────────────┴───────────────────────────────────────────────┤
│ NORMAL │  main │ main.ts                         ts │ 2:5      │   ← status bar
└─────────────────────────────────────────────────────────────────┘
```

**Our changes to LazyVim** (in `~/.config/nvim/`, i.e. `home/.config/nvim/` here):

| File | Change |
|---|---|
| `lua/plugins/personal.lua` | Gruvbox colours; faded git blame on the current line; single click opens a file in the tree |
| `lua/config/options.lua` | Plain line numbers (LazyVim counts from the cursor by default) |
| `lua/config/lazy.lua` | LazyVim's loader; Gruvbox while installing; no background update checks |
| `lazy-lock.json` | Exact version of every plugin (commit it after updating) |
| `lazyvim.json` | LazyVim extras you've turned on (none yet) |

Tools it uses (all in `packages/Brewfile`): `neovim`, `lazygit`, `tree-sitter-cli`,
`fzf`, `ripgrep`, `fd`. Neovim is also `$EDITOR` (`~/.zprofile`), so git opens it for
commit messages. Agents set `GIT_EDITOR=true`, so they never get stuck in it.

## Vim in five minutes

Vim is **modal**: keys do different things depending on the mode. The status bar
shows the current one.

| Mode | For | Get in | Get out |
|---|---|---|---|
| **Normal** | Moving around, running commands. The default | `Esc` | n/a |
| **Insert** | Typing text, like any editor | `i` (before cursor), `a` (after), `o` (new line below) | `Esc` |
| **Visual** | Selecting text | `v` (characters), `V` (whole lines) | `Esc` |
| **Command** | Typed commands like `:w` | `:` | `Enter` runs it, `Esc` cancels |

**The rule of thumb:** press `Esc` whenever you're unsure; it always gets you
back to Normal mode. **Stuck?** `Esc` then `:qa!` `Enter` quits without saving.

The ten things to learn first (in Normal mode):

| Keys | Does |
|---|---|
| `h` `j` `k` `l` | Left, down, up, right (arrow keys and the mouse work too) |
| `i` … `Esc` | Type text, then stop typing |
| `u` / `Ctrl-r` | Undo / redo |
| `Ctrl-s` or `:w` | Save |
| `:q` / `:qa` | Close this window / quit Neovim (`!` on the end discards changes) |
| `/word` `Enter`, then `n` / `N` | Find "word" in this file, next / previous match |
| `yy` / `dd` / `p` | Copy line / cut line / paste (uses the macOS clipboard) |
| `v` + move + `y` | Select, then copy |
| `gg` / `G` / `:42` | Top of file / end of file / line 42 |
| `Space` (wait) | Popup listing every shortcut; keep typing to narrow it down |

Vim keys combine: **action + count/motion**. `d` deletes, `w` is "word", so `dw`
deletes a word; `3dd` deletes three lines; `ciw` ("change inside word")
replaces the word under the cursor. Practice: `:Tutor` runs Vim's own 20-minute interactive tutorial.

## A code-review session

1. `cd` into the project and run **`nvim .`**. The file tree opens on the left.
2. **Look around:** click folders and files in the tree (or `j`/`k` and `Enter`).
   `Space e` hides or shows it.
3. **Jump to a file by name:** `Space Space` (or `Space ff`), type part of the
   name, `Enter`.
4. **Search the code:** `Space /`, type the text. Results update as you type,
   with a preview; `Enter` opens the match.
5. **See what changed:** `Space gs` lists changed files. Inside a file, `]h` / `[h`
   jumps to the next / previous change, and `Space ghp` shows the old version of
   that change.
6. **Who wrote this line?** It's shown faded at the end of the line. `Space gb`
   shows the full commit.
7. **Commit or browse history:** `Space gg` opens lazygit full screen; `q` comes back.
8. **Switch between open files:** click the tabs at the top, `Shift-h` / `Shift-l`,
   or `Space ,` for a list.
9. **Quit:** `Space qq` (or `:qa`).

## Shortcuts

`Space` is the **leader** key; `Space ff` means press Space, then f, then f.
Every list below is also in the popup you get by pressing `Space` and waiting.

### Files and the file tree

| Keys | Does |
|---|---|
| `Space e` | Show / hide the file tree (project root) |
| `Space E` | File tree for the current folder instead |
| `Space fn` | New empty file (`:w name` to save it) |
| `Ctrl-s` | Save |

Inside the tree:

| Keys | Does |
|---|---|
| click / `Enter` / `l` | Open the file or folder |
| `h` / `Backspace` | Close the folder / go up a level |
| `a` | New file (end the name with `/` for a folder) |
| `r` / `d` | Rename / delete |
| `c` / `m` | Copy / move |
| `y` then `p` | Copy a file, paste it into another folder |
| `o` | Open with the Mac's default app |
| `H` / `I` | Show / hide hidden files / git-ignored files |
| `Z` | Collapse every folder |
| `]g` / `[g` | Next / previous file with git changes |
| `?` | All tree keys |

### Find and search

| Keys | Does |
|---|---|
| `Space Space` / `Space ff` | Find a file by name |
| `Space fr` | Recently opened files |
| `Space ,` | Open files |
| `Space /` | Search text in the whole project |
| `Space sw` | Search for the word under the cursor |
| `Space sb` | Search lines in this file |
| `Space sr` | Search and replace across files |
| `Space st` | All TODO / FIXME comments |
| `Space sk` | Search all shortcuts |
| `Space sR` | Reopen the last search |

Inside any finder window: type to filter, `Ctrl-j` / `Ctrl-k` or arrows to move,
`Enter` opens, `Esc` closes.

### Open files (tabs) and windows

| Keys | Does |
|---|---|
| `Shift-h` / `Shift-l` | Previous / next open file |
| `Space bb` | Back to the file you were just in |
| `Space bd` / `Space bo` | Close this file / close all the others |
| `Space bp` | Pin a file (kept by `Space bP`, which closes the unpinned ones) |
| `Space \|` / `Space -` | Split the window right / below |
| `Ctrl-h` `Ctrl-j` `Ctrl-k` `Ctrl-l` | Move to the window left / below / above / right |
| `Space wd` | Close this window |
| `Space wm` | Zoom this window full screen and back |

### Moving inside a file

| Keys | Does |
|---|---|
| `w` / `b` | Next / previous word |
| `0` / `$` | Start / end of the line |
| `gg` / `G` / `:42` | Top / end / line 42 |
| `Ctrl-d` / `Ctrl-u` | Half a page down / up |
| `%` | Jump to the matching bracket |
| `]f` / `[f` | Next / previous function |
| `Ctrl-o` / `Ctrl-i` | Jump back / forward to where you were |
| `s` then two letters | Jump to any visible spot that starts with those letters (flash) |

### Editing

| Keys | Does |
|---|---|
| `i` / `a` / `o` / `O` | Type before / after the cursor / on a new line below / above |
| `u` / `Ctrl-r` | Undo / redo |
| `yy` / `dd` / `p` | Copy / cut line, paste |
| `ciw` | Replace the word under the cursor |
| `gcc` | Comment / uncomment the line (`gc` on a selection) |
| `Alt-j` / `Alt-k` | Move the line (or selection) down / up |
| `>` / `<` | Indent / un-indent (in Visual mode) |
| `.` | Repeat the last change |
| `Space su` | Undo history as a tree |

### Git

| Keys | Does |
|---|---|
| `]h` / `[h` | Next / previous change in this file |
| `Space ghp` | Preview the change (old vs new) |
| `Space ghb` / `Space gb` | Blame this line |
| `Space ghB` | Blame for the whole file |
| `Space ghs` / `Space ghr` | Stage / undo this change |
| `Space gs` | Changed files |
| `Space gd` | Every change, as a list |
| `Space gl` / `Space gf` | Project history / this file's history |
| `Space gB` | Open this file on GitHub |
| `Space gg` | **lazygit** (below) |

**lazygit** (`Space gg`, or `lazygit` in any terminal): a full-screen git app.

| Keys | Does |
|---|---|
| `Tab` / `1`–`5` | Switch panel (status, files, branches, commits, stash) |
| `Space` | Stage / unstage the file (or line, in the diff) |
| `a` | Stage everything |
| `c` | Commit (type the message, `Enter`) |
| `P` / `p` | Push / pull |
| `Enter` | Open: a file's diff, a commit's files |
| `n` (branches panel) | New branch |
| `z` / `Z` | Undo / redo the last git action |
| `?` | Every key in this panel |
| `q` / `Esc` | Back to Neovim |

### Code (after turning on a language)

LazyVim has language support (errors as you type, go to definition,
autocomplete) but only Lua is on. Turn on others with `:LazyExtras` (below).
Then:

| Keys | Does |
|---|---|
| `gd` | Go to the definition |
| `gr` | Every place this is used |
| `K` | Docs for the thing under the cursor |
| `Space ca` | Fixes and actions for this line |
| `Space cr` | Rename it everywhere |
| `Space cf` | Format the file |
| `]d` / `[d` | Next / previous error or warning |
| `Space xx` | All errors and warnings in a list |
| `Space ss` | Functions and classes in this file |

### Handy toggles

| Keys | Does |
|---|---|
| `Space uw` | Wrap long lines |
| `Space ul` / `Space uL` | Line numbers / relative line numbers |
| `Space uz` | Zen mode (just the code, centred) |
| `Space uC` | Try other colour schemes (until restart) |
| `Ctrl-/` | Terminal at the bottom (same keys close it) |
| `Space n` | Past notifications |

## Looking after it

| Task | How |
|---|---|
| **First launch** on a new Mac | `nvim`: LazyVim installs everything by itself (about a minute). Restart once |
| **Update plugins** | `Space l`, then `U`. Check nothing broke, then commit `home/.config/nvim/lazy-lock.json` |
| **Undo an update** | `git checkout` the old `lazy-lock.json`, then `Space l` and `R` (restore) |
| **Add a language** (e.g. TypeScript) | `:LazyExtras`, move to `lang.typescript`, press `x`, restart. Commit `lazyvim.json` |
| **Change a setting** | Add a line to `lua/config/options.lua` (LazyVim's defaults are linked at its top) |
| **Change a plugin** | Add a block to `lua/plugins/personal.lua`; only list what differs |
| **Health check** | `:checkhealth` (or `:LazyHealth`); red lines say what's missing |
| **What changed in LazyVim** | `Space L` shows its changelog |

The files live in `~/.dotfiles/home/.config/nvim/` (linked into `~/.config/nvim`).
Plugins download to `~/.local/share/nvim/` and aren't tracked.

## Troubleshooting

| Problem | Fix |
|---|---|
| Icons show as boxes or `?` | The terminal font needs Nerd Font icons. Ghostty's built-in font has them; in Rex, pick a Nerd Font |
| Something broke after an update | Undo the update (above), or `Space l`, find the plugin, `L` for its log |
| No syntax colours in a language | `:TSInstall <language>` (e.g. `:TSInstall go`), then reopen the file |
| `E5108` / red errors at startup | `:checkhealth`; often a missing tool (`brew bundle --global` fixes it) |
| Reset Neovim completely | Quit, then `rm -rf ~/.local/share/nvim ~/.local/state/nvim ~/.cache/nvim` and run `nvim` again. Your config is untouched |
| Stuck in a mode | `Esc` (twice); then `:qa!` to leave without saving |
