# A review split from `annotate` runs its review instead of a shell, before anything
# else loads (no prompt, no plugins, no splash). Unset first so nothing inherits it.
if [[ -n ${ANNOTATE_REVIEW:-} ]]; then
  review=$ANNOTATE_REVIEW
  unset ANNOTATE_REVIEW
  eval "exec $review"
fi

# History: 100k commands, saved immediately, new tabs see everything
HISTFILE=~/.zsh_history
HISTSIZE=100000
SAVEHIST=100000
setopt INC_APPEND_HISTORY    # write each command as soon as it runs
setopt EXTENDED_HISTORY      # record when it ran and how long it took
setopt HIST_IGNORE_ALL_DUPS  # keep only the latest copy of a repeated command
setopt HIST_IGNORE_SPACE     # commands starting with a space aren't saved
setopt HIST_REDUCE_BLANKS    # tidy extra spaces before saving
setopt HIST_VERIFY           # show !! / !$ expansions before running them

# Colours: one Gruvbox Dark theme for files (eza, fd, tree, Tab menu) and bat
export LS_COLORS="$(vivid generate gruvbox-dark)"
export BAT_THEME="gruvbox-dark"
export MANPAGER="sh -c 'col -bx | bat -l man -p'"   # man pages in colour via bat

# fnm: Node version manager, switches Node version per project on cd
eval "$(fnm env --use-on-cd)"

# fzf: Ctrl-R history search, Ctrl-T file picker, Alt-C cd into folder
source <(fzf --zsh)

# eza in place of ls (cat stays plain; use bat directly).
# Only when typing in a real terminal: without one, eza reads file names
# from stdin and lists nothing, which breaks pipes, scripts and AI agents.
# Elsewhere the plain commands run.
_tty() { [[ -t 0 && -t 1 ]] }
ls()   { if _tty; then eza --icons=auto "$@"; else command ls "$@"; fi }
ll()   { if _tty; then eza -la --git --header --icons=auto "$@"; else command ls -la "$@"; fi }
# Two-level tree, skipping .git and gitignored files (e.g. node_modules)
lt()   { if _tty; then eza --tree --level=2 --long --all --header --git-ignore --ignore-glob=.git --icons=auto "$@"; else command tree -a -L 2 -I .git "$@"; fi }
tree() { if _tty; then eza --tree "$@"; else command tree "$@"; fi }   # classic: command tree

# Git worktree helpers: gwa <branch>, gwr
source ~/.config/zsh/worktree.zsh

# Tab completion: my own (dot), Homebrew tools, zsh-completions and the Salesforce CLI
# (after sf updates: sf autocomplete --refresh-cache)
fpath=(~/.config/zsh/completions /opt/homebrew/share/zsh-completions ~/Library/Caches/sf/autocomplete/functions/zsh $fpath)
autoload -Uz compinit
_zcompdump=~/.cache/zsh/zcompdump
[[ -d ${_zcompdump:h} ]] || mkdir -p ${_zcompdump:h}
# Full check at most once a day; otherwise trust the cache for a faster start.
# The glob qualifier (N.mh-24) matches the file only if modified in the last 24h.
_fresh=( $_zcompdump(N.mh-24) )
if (( $#_fresh )); then
  compinit -C -d $_zcompdump
else
  compinit -d $_zcompdump && touch $_zcompdump
fi
unset _zcompdump _fresh

zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'   # case-insensitive
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}         # Gruvbox file colours
zstyle ':completion:*:descriptions' format '[%d]'             # group headings
zstyle ':completion:*' menu no                                # fzf-tab draws the menu

# fzf-tab: Tab opens an fzf list with previews (after compinit, before
# autosuggestions and syntax highlighting)
source /opt/homebrew/opt/fzf-tab/share/fzf-tab/fzf-tab.zsh
zstyle ':fzf-tab:complete:cd:*' fzf-preview 'eza -1 --color=always --icons=always $realpath'
zstyle ':fzf-tab:complete:*:*' fzf-preview 'bat --color=always --style=numbers --line-range=:50 $realpath 2>/dev/null || eza -1 --color=always --icons=always $realpath 2>/dev/null'
zstyle ':fzf-tab:*' fzf-flags --height=40%

# zsh-autosuggestions: grey suggestion from history, press → to accept
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh

# starship: prompt with git branch, Node version, command duration
eval "$(starship init zsh)"

# direnv: loads a folder's .envrc on cd (approve each one with `direnv allow`)
eval "$(direnv hook zsh)"

# fastfetch: system info splash, only in wide top-level terminal windows
if [[ -t 1 ]] && (( SHLVL == 1 && COLUMNS >= 120 )); then
  fastfetch
fi

# zsh-fast-syntax-highlighting: must stay the last plugin loaded
source /opt/homebrew/opt/zsh-fast-syntax-highlighting/share/zsh-fast-syntax-highlighting/fast-syntax-highlighting.plugin.zsh
