-- ~/.config/nvim/init.lua: a minimal, IDE-style Neovim for reading and reviewing code.
--
-- Layout:  file tree on the left · open files as tabs along the top
--          git change marks beside the line numbers · status bar along the bottom
-- Extras:  fuzzy finder (Space f) · Treesitter syntax colours · key hints popup
--          · faded git blame at the end of the current line
--
-- Needs (all in packages/Brewfile): neovim, fzf, ripgrep, fd, tree-sitter-cli,
-- and Apple's C compiler (xcode-select --install) to build Treesitter parsers.
--
-- Plugins are installed by Neovim's built-in manager, vim.pack (Neovim 0.12+).
-- When a plugin below isn't on disk yet, Neovim asks once whether to install it.
-- Exact versions are pinned in nvim-pack-lock.json next to this file (tracked in
-- git), so every Mac gets the same plugin versions.
--   Update plugins:  :lua vim.pack.update()   (shows what changed; :write accepts, :quit cancels)
--
-- Everyday keys:
--   nvim .        open a folder with the tree showing
--   Space e       show / hide the tree
--   click         tree: open a file or expand a folder · tab bar: switch file
--   g?            in the tree: list every tree key (a = new file, r = rename, d = delete)
--   ]b  [b        next / previous open file (tab)
--   Space x       close the current file's tab
--   ]c  [c        next / previous git change in this file
--   Space f       find a file by name           Space /   search text in all files
--   Space b       switch between open files     Space r   recently opened files
--   Space g       files changed in git          Space ?   search all shortcuts
--   Space         (then wait) popup listing every Space shortcut
--   Ctrl-w w      jump between the tree and the file
--   :w  :qa       save, quit everything

-- ── Settings ────────────────────────────────────────────────────────────────
-- vim.g.* are global variables (plugins read them); vim.o.* are editor options.

vim.g.mapleader = " "            -- the "leader" key starts your own shortcuts; here it's Space

-- Neovim ships an old file browser called netrw. Turning it off stops it
-- fighting with nvim-tree when you open a folder.
vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1

vim.o.number = true              -- line numbers down the left side
vim.o.cursorline = true          -- highlight the line the cursor is on
vim.o.signcolumn = "yes"         -- always keep room for git marks, so text doesn't jump sideways
vim.o.fillchars = "eob: "        -- hide the ~ shown on empty lines past the end of a file
vim.o.scrolloff = 8              -- keep 8 lines visible above/below the cursor when scrolling
vim.o.laststatus = 3             -- one status bar across the whole window, not one per split
vim.o.showmode = false           -- the status bar already shows NORMAL / INSERT
vim.o.mouse = "a"                -- mouse everywhere: click, scroll, drag to resize splits
vim.o.clipboard = "unnamedplus"  -- copy (y) and paste (p) use the macOS clipboard
vim.o.ignorecase = true          -- searching with / ignores case...
vim.o.smartcase = true           -- ...unless your search has a capital letter
vim.o.termguicolors = true       -- full 24-bit colour, needed for Gruvbox to look right

-- ── Plugins ─────────────────────────────────────────────────────────────────
-- Each line is a GitHub repo. vim.pack clones it once into
-- ~/.local/share/nvim/site/pack/core/opt/ and loads it on every start.
-- To remove one: delete its line (and its setup below), restart,
-- then run :lua vim.pack.del({ "name" })

vim.pack.add({
  "https://github.com/ellisonleao/gruvbox.nvim",     -- colour scheme (matches the terminal)
  "https://github.com/nvim-tree/nvim-web-devicons",  -- file-type icons (tree, tabs, status bar)
  "https://github.com/nvim-tree/nvim-tree.lua",      -- the file tree
  "https://github.com/akinsho/bufferline.nvim",      -- open files as clickable tabs along the top
  "https://github.com/nvim-lualine/lualine.nvim",    -- status bar along the bottom
  "https://github.com/lewis6991/gitsigns.nvim",      -- git added/changed/deleted marks per line
  "https://github.com/ibhagwan/fzf-lua",             -- fuzzy finder for files and text (uses fzf + ripgrep)
  "https://github.com/folke/which-key.nvim",         -- popup that lists shortcuts as you type them
  -- Treesitter: the `main` branch is the rewrite for Neovim 0.12
  -- (the old `master` branch is frozen).
  { src = "https://github.com/nvim-treesitter/nvim-treesitter", version = "main" },
})

-- ── Colours ─────────────────────────────────────────────────────────────────
-- setup() must come before colorscheme, or Gruvbox ignores its options.
require("gruvbox").setup()
vim.cmd.colorscheme("gruvbox")

-- ── File tree (left) ────────────────────────────────────────────────────────
require("nvim-tree").setup({
  view = { width = 32 },                   -- tree width in columns

  -- When you switch files, the tree scrolls to and highlights that file.
  update_focused_file = { enable = true },

  renderer = {
    -- Show just the project folder's name at the top (default is ~/full/path/..).
    root_folder_label = ":t",
    highlight_git = "name",                -- colour file names by git status (changed, new…)
    indent_markers = { enable = true },    -- faint guide lines showing folder nesting
  },

  filters = { custom = { "^.git$" } },     -- hide the .git folder (H in the tree toggles hidden files)

  -- on_attach runs each time the tree opens. It sets the tree's keys:
  -- first all the defaults, then the single-click change below.
  on_attach = function(bufnr)
    local api = require("nvim-tree.api")
    api.config.mappings.default_on_attach(bufnr)

    -- The default is double-click; this makes a single click open a file
    -- or expand a folder. { buffer = bufnr } limits it to the tree window.
    vim.keymap.set("n", "<LeftRelease>", api.node.open.edit,
      { buffer = bufnr, desc = "Open file / expand folder" })
  end,
})

-- Space e shows or hides the tree from anywhere.
-- "n" = normal mode (the default mode, when you're not typing text).
vim.keymap.set("n", "<leader>e", "<cmd>NvimTreeToggle<cr>", { desc = "Toggle file tree" })

-- ── Tabs (top) ──────────────────────────────────────────────────────────────
-- Vim calls an open file a "buffer"; bufferline draws each one as a tab.
require("bufferline").setup({
  options = {
    -- Leave a gap above the tree with its own title, so the tabs line up
    -- with the code, not the tree (like VS Code's Explorer header).
    offsets = { { filetype = "NvimTree", text = "Explorer", highlight = "Directory" } },
  },
})

-- Close the current tab (:bdelete unloads the file; unsaved changes make it refuse).
vim.keymap.set("n", "<leader>x", "<cmd>bdelete<cr>", { desc = "Close file tab" })

-- ── Status bar (bottom) ─────────────────────────────────────────────────────
-- Shows mode, git branch, changes, file name, file type and cursor position.
require("lualine").setup({
  options = {
    theme = "gruvbox",
    globalstatus = true,                   -- one bar for everything (matches laststatus = 3)
  },
  extensions = { "nvim-tree" },            -- a tidy bar when the tree has focus
})

-- ── Git marks (beside the line numbers) ─────────────────────────────────────
-- A coloured bar per line: added, changed or deleted since the last commit.
-- ]c / [c jump between changes (Neovim's built-in diff keys, which gitsigns extends).
require("gitsigns").setup({
  -- Faded "author, 3 days ago - commit message" at the end of the line the
  -- cursor is on, after it rests there for half a second.
  current_line_blame = true,
  current_line_blame_opts = { delay = 500 },
  on_attach = function(bufnr)
    local gs = require("gitsigns")
    vim.keymap.set("n", "]c", function() gs.nav_hunk("next") end, { buffer = bufnr, desc = "Next git change" })
    vim.keymap.set("n", "[c", function() gs.nav_hunk("prev") end, { buffer = bufnr, desc = "Previous git change" })
  end,
})

-- ── Fuzzy finder ────────────────────────────────────────────────────────────
-- A search box with a live preview. Type a few letters of what you want
-- (in any order), arrows or Ctrl-j/k to move, Enter to open, Esc to cancel.
require("fzf-lua").setup()

local fzf = require("fzf-lua")
vim.keymap.set("n", "<leader>f", fzf.files,      { desc = "Find file" })
vim.keymap.set("n", "<leader>/", fzf.live_grep,  { desc = "Search text in all files" })
vim.keymap.set("n", "<leader>b", fzf.buffers,    { desc = "Open files" })
vim.keymap.set("n", "<leader>r", fzf.oldfiles,   { desc = "Recent files" })
vim.keymap.set("n", "<leader>g", fzf.git_status, { desc = "Git changed files" })
vim.keymap.set("n", "<leader>?", fzf.keymaps,    { desc = "Search shortcuts" })

-- ── Key hints ───────────────────────────────────────────────────────────────
-- Press Space (or g, ], [ …) and pause: a popup lists what you can press next.
-- It reads the desc = "…" text from each shortcut above.
require("which-key").setup({ preset = "helix" })  -- helix = small box in the corner

-- ── Syntax colours (Treesitter) ─────────────────────────────────────────────
-- Treesitter reads code as a real syntax tree instead of guessing with
-- patterns, so colours are more accurate. Each language needs a "parser",
-- compiled once on your Mac (by tree-sitter-cli and Apple's C compiler).
local languages = {
  "bash", "css", "html", "java", "javascript", "json", "lua", "markdown",
  "python", "toml", "tsx", "typescript", "yaml",
}
-- Installs any missing parsers in the background; does nothing once installed.
-- Add a language name above to get its parser. Update all with :TSUpdate
require("nvim-treesitter").install(languages)

-- Turn Treesitter colours on whenever a file is opened whose language has a
-- parser. pcall = "try it": files without a parser keep Neovim's normal colours.
vim.api.nvim_create_autocmd("FileType", {
  callback = function() pcall(vim.treesitter.start) end,
})

-- ── Open the tree on `nvim <folder>` ────────────────────────────────────────
-- An autocmd runs code when something happens. VimEnter = Neovim finished starting.
-- If you started it on a folder (`nvim .`), open the tree there.
-- `nvim file.txt` opens just the file; press Space e if you want the tree.
vim.api.nvim_create_autocmd("VimEnter", {
  callback = function(ev)
    if vim.fn.isdirectory(ev.file) == 1 then
      vim.cmd.cd(ev.file)                    -- make that folder the working folder
      require("nvim-tree.api").tree.open()
    end
  end,
})
