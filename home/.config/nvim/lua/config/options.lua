-- Our editor settings. Loaded before plugins start.
-- LazyVim's defaults (all on unless changed here):
-- https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua

-- Plain line numbers. LazyVim counts lines relative to the cursor by default,
-- which helps vim jumps (5j) but is confusing when reading code.
vim.opt.relativenumber = false
