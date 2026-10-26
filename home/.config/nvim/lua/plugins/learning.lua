-- Learning aids while you get used to Vim. Delete this file (then :Lazy clean)
-- when you no longer need them. Guide: docs/neovim.md#learning-aids
return {
  -- precognition: faint hints showing where keys would jump. Above the current
  -- line: w b e (words), 0 ^ $ (line start/end), % (matching bracket).
  -- Beside the line numbers: gg G (top/end of file), { } (blank-line jumps).
  -- Space uP turns them off and on.
  {
    "tris203/precognition.nvim",
    event = "VeryLazy",
    opts = {
      -- Off: an f/t hint under almost every letter, too busy while learning.
      targetedMotionHints = { enabled = false },
    },
    keys = {
      { "<leader>uP", function() require("precognition").toggle() end, desc = "Toggle Motion Hints (precognition)" },
    },
  },

  -- hardtime: a coach. Spots slow habits (j j j j) and suggests the faster
  -- key (4j) in a notification. Set to hints only: it never blocks a key,
  -- and the mouse and arrow keys keep working.
  -- :Hardtime report lists your most common habits; :Hardtime toggle turns it off.
  {
    "m4xshen/hardtime.nvim",
    event = "VeryLazy",
    dependencies = { "MunifTanjim/nui.nvim" },
    opts = {
      restriction_mode = "hint", -- default "block" stops the key; we only suggest
      disable_mouse = false,     -- default true turns the mouse off
      disabled_keys = {          -- default blocks the arrow keys
        ["<Up>"] = false, ["<Down>"] = false, ["<Left>"] = false, ["<Right>"] = false,
      },
    },
  },

  -- screenkey: a small box listing each key you press. Off until you run
  -- :Screenkey (same to hide it). Handy when a key did something unexpected.
  {
    "NStefan002/screenkey.nvim",
    version = "*", -- its README asks for tagged releases
    cmd = "Screenkey",
  },
}
