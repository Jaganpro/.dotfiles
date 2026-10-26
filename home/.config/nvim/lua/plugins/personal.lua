-- Our changes to LazyVim's plugins. Each { "owner/repo", opts = { ... } } block
-- is merged into LazyVim's own settings for that plugin, so only the
-- differences are listed here. Delete a block to get LazyVim's default back.
return {
  -- Gruvbox Dark, to match the terminal (LazyVim's default is Tokyo Night).
  { "ellisonleao/gruvbox.nvim" },
  { "LazyVim/LazyVim", opts = { colorscheme = "gruvbox" } },

  -- Faded "author, 3 days ago - message" at the end of the current line.
  { "lewis6991/gitsigns.nvim", opts = { current_line_blame = true } },

  {
    "folke/snacks.nvim",
    opts = {
      picker = {
        -- Finders (Space Space, Space /, ...) include dotfiles like .config/ and
        -- .zshrc, the same as our ripgrep config. .git/ stays excluded.
        -- Alt-h inside a finder toggles them. (Each finder has its own default,
        -- so it's set per finder.)
        sources = {
          files = { hidden = true },
          grep = { hidden = true },
          -- File tree (Space e): a single click opens a file or folder
          -- (default is double-click).
          explorer = {
            win = { list = { keys = { ["<LeftRelease>"] = "confirm" } } },
          },
        },
      },
    },
  },
}
