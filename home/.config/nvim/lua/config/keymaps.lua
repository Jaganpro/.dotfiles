-- Our extra shortcuts. Loaded after plugins start.
-- LazyVim's defaults: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add one like: vim.keymap.set("n", "<leader>xx", "<cmd>SomeCommand<cr>", { desc = "Shown in the key popup" })

-- Space h: open our Neovim guide (shortcuts, Vim intro) in a new tab, read-only.
-- :tabclose or Space Tab d closes it.
vim.keymap.set("n", "<leader>h", function()
  vim.cmd.tabedit(vim.fn.expand("~/.dotfiles/docs/neovim.md"))
  vim.bo.modifiable = false
end, { desc = "Neovim guide (docs/neovim.md)" })
