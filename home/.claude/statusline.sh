#!/bin/bash
# Claude Code status line, one line, most important first (a narrow window cuts the end):
#   ✨ model (effort) ⚡ │ 📁 path 🌿 branch *changed ↑ahead ↓behind │ Context bar % tokens
#   │ 💰 cost │ 🔥/❄️ prompt cache │ 🏷️ session name │ 📦 version
# Claude Code passes session details as JSON on stdin.

input=$(cat)

# Read every field in one jq call. Fields are joined with \x1f (unit separator)
# because tabs would collapse when a field is empty.
IFS=$'\x1f' read -r model id effort fast dir pct cost tokens ctx_size \
  session version cache_seen cache_warm cache_expires cache_hit < <(
  jq -r '[
    .model.display_name // "?", .model.id // "", .effort.level // "",
    (.fast_mode // false), .workspace.current_dir // "",
    (.context_window.used_percentage // 0 | floor),
    (.cost.total_cost_usd // 0),
    ((.context_window.total_input_tokens // 0) + (.context_window.total_output_tokens // 0)),
    (.context_window.context_window_size // 0),
    .session_name // "", .version // "",
    (.prompt_cache.caching_observed // false), (.prompt_cache.warm // false),
    (.prompt_cache.expires_at // 0),
    (.prompt_cache.hit_ratio // null | if . == null then "" else (. * 100 | round) end)
  ] | map(tostring) | join("\u001f")' <<<"$input")

sep=$'\033[90m │ \033[0m'   # dim grey divider

# 1234567 -> 1.2M, 620000 -> 620k
fmt_tokens() {
  local n=$1
  if (( n >= 1000000 )); then
    local tenths=$(( (n % 1000000) / 100000 ))
    if (( tenths )); then printf '%d.%dM' $(( n / 1000000 )) "$tenths"; else printf '%dM' $(( n / 1000000 )); fi
  elif (( n >= 1000 )); then printf '%dk' $(( n / 1000 ))
  else printf '%d' "$n"
  fi
}

# --- Model: display_name is just "Opus"; take the version from the id (claude-opus-5-5 -> 5.5)
if [[ $model != *[0-9]* && $id =~ ^claude-[a-z]+-([0-9]+)-([0-9]+) ]]; then
  model+=" ${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"
fi
[[ -n $effort ]] && model+=" ($effort)"
[[ $fast == true ]] && model+=" ⚡"

# --- Path (home as ~) and git: branch, changed files, commits ahead/behind
path_shown=${dir/#$HOME/\~}
line="✨ $model${sep}📁 $path_shown"
if git_status=$(git --no-optional-locks -C "$dir" status --porcelain=v2 --branch 2>/dev/null); then
  # One pass: branch name, number of changed files, commits ahead and behind
  read -r branch changed ahead behind < <(awk '
    /^# branch.head / { b = $3 }
    /^# branch.ab /   { a = substr($3, 2); d = substr($4, 2) }
    !/^#/             { n++ }
    END { print b, n + 0, a + 0, d + 0 }' <<<"$git_status")
  line+=" 🌿 $branch"
  (( changed > 0 )) && line+=" *$changed"
  (( ${ahead:-0} > 0 )) && line+=" ↑$ahead"
  (( ${behind:-0} > 0 )) && line+=" ↓$behind"
fi

# --- Context bar: 10 cells filled in eighths (80 steps), each cell coloured by
# position along a Gruvbox green -> yellow -> red gradient.
gradient=("184;187;38" "197;187;40" "210;188;42" "224;188;43" "237;189;45"
          "250;189;47" "250;160;48" "251;131;49" "251;102;51" "251;73;52")
partial=("" "▏" "▎" "▍" "▌" "▋" "▊" "▉")
eighths=$(( (pct * 80 + 50) / 100 )); (( eighths > 80 )) && eighths=80
full=$(( eighths / 8 )); rem=$(( eighths % 8 ))
bar=""
for (( i = 0; i < 10; i++ )); do
  if (( i < full )); then
    bar+=$'\033[38;2;'"${gradient[i]}m█"
  elif (( i == full && rem > 0 )); then
    bar+=$'\033[38;2;'"${gradient[i]}m${partial[rem]}"
  else
    bar+=$'\033[38;2;80;73;69m░'   # empty cell, Gruvbox dark grey
  fi
done
bar+=$'\033[0m'
# Percentage text: green under 50%, yellow under 80%, red above
if (( pct < 50 )); then colour="184;187;38"; elif (( pct < 80 )); then colour="250;189;47"; else colour="251;73;52"; fi
line+="${sep}Context ${bar} "$'\033[38;2;'"${colour}m${pct}%"$'\033[0m'
(( tokens > 0 && ctx_size > 0 )) && line+=" $(fmt_tokens "$tokens")/$(fmt_tokens "$ctx_size")"

# --- Cost (an estimate at list prices): hidden at $0.00
if [[ $(printf '%.2f' "$cost") != 0.00 ]]; then
  line+="${sep}💰 \$$(printf '%.2f' "$cost")"
fi

# --- Prompt cache: 🔥 minutes until it goes cold + hit rate, or ❄️ cold
if [[ $cache_seen == true ]]; then
  left=$(( (cache_expires - $(date +%s)) / 60 ))
  if [[ $cache_warm == true ]] && (( left >= 0 )); then
    cache="🔥 ${left}m"
  else
    cache="❄️ cold"
  fi
  [[ -n $cache_hit ]] && cache+=" ${cache_hit}%"
  line+="${sep}$cache"
fi

# --- Session name (first 20 characters) and Claude Code version (dim), last
# because they matter least if a narrow window cuts the line
if [[ -n $session ]]; then
  (( ${#session} > 20 )) && session="${session:0:19}…"
  line+="${sep}🏷️ $session"
fi
[[ -n $version ]] && line+="${sep}"$'\033[90m'"📦 $version"$'\033[0m'

printf '%s\n' "$line"
exit 0
