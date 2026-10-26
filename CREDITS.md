# 🙏 Credits

This setup builds on other people's work. License texts for every piece of
copied code are in [`third_party/`](third_party/).

## Copied code

| Project | Used for | How | License |
|---|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills) | 19 engineering and productivity skills in `skills/` | Vendored, unmodified | MIT |
| [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) | `install-anti-slop` skill (Oxlint rules) | Vendored, unmodified | MIT |
| [badlogic/pi-skills](https://github.com/badlogic/pi-skills) | YouTube transcript skill | Adapted (timestamps fixed) | MIT |
| [earendil-works/pi](https://github.com/earendil-works/pi) | `/deslop` and `/ship` prompts | Adapted | MIT |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | Coding rules in `AGENTS.md` | Adapted | MIT |
| [mbadolato/iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) | Rex's Gruvbox Dark theme file | Unmodified apart from a header | MIT |
| [LazyVim/starter](https://github.com/LazyVim/starter) | Neovim config (`init.lua`, `lua/config/`) | Adapted (comments, Gruvbox, no background update checks) | Apache-2.0 |

## Ideas and inspiration

| Project | Inspired |
|---|---|
| [dmmulroy/.dotfiles](https://github.com/dmmulroy/.dotfiles) by Dillon Mulroy | Repo layout and the `dot` command |
| dmmulroy's git-interceptor | git-guard (written from scratch) |
| dmmulroy's whimsical.ts | `tasting-notes.ts` (written clean-room from a description of what it does) |
| [xRyul/pi-aliases](https://github.com/xRyul/pi-aliases) | Pi command aliases (`muscle-memory.ts`) |
| [badlogic/pi-skills](https://github.com/badlogic/pi-skills) brave-search, [tian.zuo/pi-web-search](https://www.npmjs.com/package/@tian.zuo/pi-web-search), [dmmulroy/pi-web-tools](https://github.com/dmmulroy/pi-web-tools), [pi-lab/websearch](https://www.npmjs.com/package/@pi-lab/websearch) | `web-access.ts` (written from scratch) |

## Tools this setup relies on

| Project | Role |
|---|---|
| [fff](https://github.com/dmtrKovalenko/fff.nvim) | File search for Claude Code and Pi |
| [plannotator/plannotator-tui](https://github.com/plannotator/plannotator-tui) | Plan review in the terminal (MIT) |
| [agavra/tuicr](https://github.com/agavra/tuicr) | Code review in the terminal (MIT) |
| [earendil-works/pi-claude-code](https://github.com/earendil-works/pi-claude-code) | Claude models in Pi through a Claude Code login |
| [GNU Stow](https://www.gnu.org/software/stow/) | Links `home/` into `~` |
| [LazyVim](https://github.com/LazyVim/LazyVim) | Neovim setup, loaded as a plugin (Apache-2.0) |
