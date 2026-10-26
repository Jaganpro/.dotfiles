-- Our editor settings. Loaded before plugins start.
-- LazyVim's defaults (all on unless changed here):
-- https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua

-- TypeScript: use TypeScript 7's own language server (`tsc --lsp`), the fast
-- native one. It picks the project's node_modules/.bin/tsc when that's 7+.
vim.g.lazyvim_ts_lsp = "tsc"
