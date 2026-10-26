-- Loads lazy.nvim (the plugin manager), then LazyVim and our own plugin files.
-- From the LazyVim starter (Apache-2.0, LazyVim/starter@803bc18), see
-- third_party/lazyvim-starter.LICENSE. Changed: comments rewritten; the start
-- colour scheme is Gruvbox; the update checker no longer runs in the background; :Tutor stays on.

-- First launch: download lazy.nvim itself into ~/.local/share/nvim/lazy/.
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out, "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  spec = {
    -- LazyVim and all of its plugins
    { "LazyVim/LazyVim", import = "lazyvim.plugins" },
    -- then every file in lua/plugins/ (our tweaks; these win over LazyVim's)
    { import = "plugins" },
  },
  defaults = {
    lazy = false,    -- our own plugins load at startup (LazyVim's load when needed)
    version = false, -- use each plugin's latest commit; lazy-lock.json pins what's installed
  },
  -- Colour scheme shown while plugins install on first launch.
  install = { colorscheme = { "gruvbox", "habamax" } },
  -- No background update checks: we update on purpose with :Lazy update,
  -- review, and commit lazy-lock.json.
  checker = { enabled = false },
  performance = {
    rtp = {
      -- Built-in plugins nobody here uses (opening .gz/.tar/.zip files, HTML export).
      disabled_plugins = {
        "gzip",
        "tarPlugin",
        "tohtml",
        "zipPlugin",
      },
    },
  },
})
