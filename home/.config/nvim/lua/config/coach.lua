-- Tips window: a small box in the top-right corner listing the Vim keys that
-- fit what you're doing right now: the mode (Normal, Insert, Visual, ...),
-- what's under the cursor (a word, a bracket, a blank line, a search match),
-- or the file tree / a finder. Plus moving-around keys and a few always-useful ones.
--
-- Our own code, not a plugin. Started from config/autocmds.lua.
-- Space uk shows / hides it. Remove it: delete this file and its line in autocmds.lua.
-- To change a tip, edit the TIPS / NAV / ALWAYS lists; the code below only picks
-- which list to show.
local M = {}

local WIDTH = 34        -- box width in columns, border included
local KEY_COL = 10      -- width of the key column
local MIN_COLUMNS = 100 -- hide the box when Neovim is narrower than this

-- Each list: a title (shown in the box's border), then { keys, what they do }.
local TIPS = {
  word = { "on a word",
    { "w  b", "next / prev word" },
    { "e", "end of word" },
    { "ciw", "change this word" },
    { "dw", "delete to next word" },
    { "*", "find this word" },
  },
  bracket = { "on a bracket",
    { "%", "jump to its match" },
    { "ci(", "change inside ( )" },
    { "di{", "delete inside { }" },
    { "va{", "select the { } block" },
  },
  blank = { "on a blank line",
    { "o  O", "new line below/above" },
    { "{  }", "prev / next block" },
    { "dd", "delete this line" },
    { "p", "paste below" },
  },
  search = { "after a search",
    { "n  N", "next / prev match" },
    { "*  #", "this word fwd/back" },
    { "cgn", "change, then . next" },
    { "Esc", "clear highlight" },
  },
  -- After d, c or y, Vim waits for "on what?" (a motion or text object).
  operator = { "d / c / y on what?",
    { "w", "to next word" },
    { "iw", "whole word" },
    { "$", "to end of line" },
    { "ip", "paragraph" },
    { 'i"  i(', "inside quotes / ( )" },
    { "d c y", "again: whole line" },
    { "Esc", "cancel" },
  },
  insert = { "typing",
    { "Esc", "back to Normal" },
    { "Ctrl-w", "delete last word" },
    { "Ctrl-u", "delete to line start" },
    { "Ctrl-o", "one Normal command" },
    { "Ctrl-s", "save" },
  },
  visual = { "selecting",
    { "y  d", "copy / cut" },
    { "c", "change selection" },
    { ">  <", "indent / unindent" },
    { "gc", "comment" },
    { "o", "other end" },
    { "Esc", "cancel" },
  },
  cmdline = { "command line",
    { "Tab", "complete" },
    { "↑  ↓", "history" },
    { "Enter", "run" },
    { "Esc", "cancel" },
    { ":w  :qa", "save / quit all" },
  },
  tree = { "file tree",
    { "Enter  l", "open" },
    { "h", "close folder" },
    { "a", "new file (dir/)" },
    { "r  d", "rename / delete" },
    { "H  I", "hidden / ignored" },
    { "Ctrl-l", "to the code" },
    { "?", "all tree keys" },
  },
  finder = { "finder",
    { "type", "filter the list" },
    { "Ctrl-j/k", "down / up" },
    { "Enter", "open" },
    { "Ctrl-v", "open in a split" },
    { "Alt-h", "hidden files" },
    { "Esc", "close" },
  },
}

-- Shown under the Normal-mode tips: getting around files, tabs and windows.
local NAV = { "move",
  { "Shift-h/l", "prev / next tab" },
  { "Ctrl-h/l", "window left / right" },
  { "Ctrl-d/u", "half page down / up" },
  { "gg  G", "top / end of file" },
  { "Ctrl-o", "jump back" },
}

-- Shown last in Normal mode.
local ALWAYS = { "always",
  { "i  a  o", "start typing" },
  { "u  Ctrl-r", "undo / redo" },
  { "Space", "all shortcuts" },
}

local ns = vim.api.nvim_create_namespace("coach")
local state = { enabled = true, buf = nil, win = nil, key = nil }

-- The picker (file tree or finder) whose list or input window is `win`, if any.
local function picker_for(win)
  if not (_G.Snacks and Snacks.picker) then return end
  for _, p in ipairs(Snacks.picker.get()) do
    if (p.list and p.list.win and p.list.win.win == win) or (p.input and p.input.win and p.input.win.win == win) then
      return p
    end
  end
end

-- Returns the mode label and the TIPS list to show, or nil to hide the box.
local function context()
  local mode = vim.api.nvim_get_mode().mode
  if mode:sub(1, 1) == "c" then return "COMMAND", "cmdline" end

  local win = vim.api.nvim_get_current_win()
  local buf = vim.api.nvim_win_get_buf(win)
  local p = picker_for(win)
  if p then
    if p.opts.source == "explorer" and vim.bo[buf].filetype == "snacks_picker_list" then return "TREE", "tree" end
    return "FINDER", "finder"
  end
  -- Hide in other pop-ups (lazygit, plugin manager, ...), terminals and the start screen.
  if vim.api.nvim_win_get_config(win).relative ~= "" then return end
  local bt = vim.bo[buf].buftype
  if not (bt == "" or bt == "help") or vim.bo[buf].filetype == "snacks_dashboard" then return end

  if mode:sub(1, 2) == "no" then return "PENDING", "operator" end
  local m = mode:sub(1, 1)
  if m == "i" or m == "R" then return "INSERT", "insert" end
  if m == "v" or m == "V" or m == "\22" then return "VISUAL", "visual" end
  if m ~= "n" then return end

  -- Normal mode: look at what's under the cursor.
  if vim.v.hlsearch == 1 and vim.fn.getreg("/") ~= "" then return "NORMAL", "search" end
  local line = vim.api.nvim_get_current_line()
  if line:match("^%s*$") then return "NORMAL", "blank" end
  local col = vim.api.nvim_win_get_cursor(win)[2]
  if line:sub(col + 1, col + 1):match("[%(%)%[%]{}]") then return "NORMAL", "bracket" end
  return "NORMAL", "word"
end

-- Turns tip lists into the box's text lines plus highlights.
local function build(kind, mode_label)
  local lines, marks = {}, {}
  local desc_width = WIDTH - 3 - KEY_COL -- 2 border columns + 1 leading space
  local function add(list)
    for i = 2, #list do
      local keys, desc = list[i][1], list[i][2]
      if vim.fn.strdisplaywidth(desc) > desc_width then desc = vim.fn.strcharpart(desc, 0, desc_width) end
      local pad = math.max(1, KEY_COL - vim.fn.strdisplaywidth(keys))
      lines[#lines + 1] = " " .. keys .. string.rep(" ", pad) .. desc
      marks[#marks + 1] = { row = #lines - 1, col = 1, end_col = 1 + #keys, hl = "Special" }
    end
  end
  local function rule(name)
    local text = "── " .. name .. " "
    lines[#lines + 1] = text .. string.rep("─", WIDTH - 2 - vim.fn.strdisplaywidth(text))
    marks[#marks + 1] = { row = #lines - 1, line_hl = "Comment" }
  end

  add(TIPS[kind])
  if mode_label == "NORMAL" then
    rule(NAV[1]); add(NAV)
    rule(ALWAYS[1]); add(ALWAYS)
  end
  return lines, marks, " " .. mode_label .. " · " .. TIPS[kind][1] .. " "
end

local function close()
  if state.win and vim.api.nvim_win_is_valid(state.win) then vim.api.nvim_win_close(state.win, true) end
  state.win, state.key = nil, nil
end

local function render(mode_label, kind)
  local tab = vim.api.nvim_get_current_tabpage()
  local key = mode_label .. kind .. vim.o.columns
  local open = state.win and vim.api.nvim_win_is_valid(state.win)
  if open and vim.api.nvim_win_get_tabpage(state.win) ~= tab then close(); open = false end
  if open and state.key == key then return end -- nothing changed

  local lines, marks, title = build(kind, mode_label)
  if not (state.buf and vim.api.nvim_buf_is_valid(state.buf)) then
    state.buf = vim.api.nvim_create_buf(false, true)
  end
  vim.bo[state.buf].modifiable = true
  vim.api.nvim_buf_set_lines(state.buf, 0, -1, false, lines)
  vim.bo[state.buf].modifiable = false
  vim.api.nvim_buf_clear_namespace(state.buf, ns, 0, -1)
  for _, mk in ipairs(marks) do
    if mk.line_hl then
      vim.api.nvim_buf_set_extmark(state.buf, ns, mk.row, 0, { line_hl_group = mk.line_hl })
    else
      vim.api.nvim_buf_set_extmark(state.buf, ns, mk.row, mk.col, { end_col = mk.end_col, hl_group = mk.hl })
    end
  end

  local cfg = {
    relative = "editor", anchor = "NE", row = 1, col = vim.o.columns, -- top right, below the tabs
    width = WIDTH - 2, height = #lines,
    border = "rounded", title = title, title_pos = "left",
    footer = " Space uk ", footer_pos = "right",
    focusable = false, mouse = false, -- clicks go through to the code underneath
    zindex = 90,                      -- above finders (50), below notifications (100)
  }
  if open then
    vim.api.nvim_win_set_config(state.win, cfg)
  else
    cfg.style, cfg.noautocmd = "minimal", true
    state.win = vim.api.nvim_open_win(state.buf, false, cfg)
    vim.wo[state.win].winhighlight = "Normal:NormalFloat,FloatBorder:FloatBorder,FloatTitle:FloatTitle,FloatFooter:Comment"
    vim.wo[state.win].wrap = false
  end
  state.key = key
end

local function update()
  if not state.enabled or vim.o.columns < MIN_COLUMNS then return close() end
  local mode_label, kind = context()
  if not mode_label then return close() end
  render(mode_label, kind)
end

function M.setup()
  vim.api.nvim_create_autocmd(
    { "CursorMoved", "ModeChanged", "BufEnter", "WinEnter", "TabEnter", "VimResized" },
    { group = vim.api.nvim_create_augroup("coach", { clear = true }), callback = function() vim.schedule(update) end }
  )
  vim.keymap.set("n", "<leader>uk", function()
    state.enabled = not state.enabled
    update()
    vim.notify("Tips window " .. (state.enabled and "on" or "off"))
  end, { desc = "Toggle Tips Window" })
  update()
end

M._context = context -- for tests
return M
