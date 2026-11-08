#!/bin/bash
# Local LLM: sets up the llama.cpp router for Pi and Grok Bot (docs/local-llm.md).
# Creates the router password in the Keychain, the LaunchAgent that starts the
# router at login, Pi's llama.cpp credential, and downloads the model. Run by
# hand; `dot init` never runs it. Safe to run again: keeps the password and a
# finished download, rewrites the LaunchAgent and restarts the router.
set -euo pipefail

model_dir="$HOME/models/qwen3.8-27b-abliterated"
model_name=$(basename "$model_dir")
hf="https://huggingface.co/huihui-ai/Huihui-Qwen3.8-27B-abliterated-GGUF/resolve/main"
files=(Huihui-Qwen3.8-27B-abliterated-UD-Q5_K_XL.gguf mmproj-model-bf16.gguf)
presets="$HOME/models/presets.ini"
label=app.llama.router
plist="$HOME/Library/LaunchAgents/$label.plist"
auth="$HOME/.pi/agent/auth.json"
models_json="$HOME/.pi/agent/models.json"
port=8080

ok() { printf '\033[32m✓\033[0m %s\n' "$*"; }

for cmd in llama pi jq; do
  command -v "$cmd" >/dev/null || { echo "$cmd missing: brew bundle --global (llama.cpp is in the Brewfile), and install Pi" >&2; exit 1; }
done

# 1. Model (about 22 GB; curl -C - resumes an interrupted download)
mkdir -p "$model_dir"
for f in "${files[@]}"; do
  if [[ -f "$model_dir/$f" && ! -f "$model_dir/$f.part" ]]; then continue; fi
  echo "Downloading $f..."
  touch "$model_dir/$f.part"
  curl -fL -C - --progress-bar -o "$model_dir/$f" "$hf/$f"
  rm "$model_dir/$f.part"
done
ok "model in ${model_dir/#$HOME/~}"

# 2. Router password: random, made once, never printed
if ! security find-generic-password -s llama-api-key >/dev/null 2>&1; then
  security add-generic-password -s llama-api-key -a "$USER" -w "$(openssl rand -hex 24)"
fi
ok "password in Keychain (llama-api-key)"

# 3. Presets file: one section per model folder in ~/models. The router lists preset
# models even while unloaded, so Pi always shows them; with the folder scan
# (--models-dir) Pi hid a model after every router restart until something loaded it.
# shortcut: only folders (one model each), not loose .gguf files in ~/models; rerun this
# script after adding a model.
{
  echo "# Written by ~/.dotfiles/scripts/local-llm.sh from the folders in ~/models; edits are overwritten."
  for dir in "$HOME"/models/*/; do
    dir=${dir%/}
    weights=$(find "$dir" -maxdepth 1 -name '*.gguf' ! -name 'mmproj*' ! -name '*.part' | sort | head -1)
    [[ -n $weights ]] || continue   # sorting puts shard 00001 first
    mmproj=$(find "$dir" -maxdepth 1 -name 'mmproj*.gguf' | head -1)
    echo
    echo "[$(basename "$dir")]"
    echo "model = $weights"
    [[ -z $mmproj ]] || echo "mmproj = $mmproj"
  done
} > "$presets"
ok "presets in ${presets/#$HOME/~} ($(grep -c '^\[' "$presets") model(s))"

# 4. LaunchAgent: starts the router at login, restarts it if it crashes.
# Options explained in docs/local-llm.md. The password is read from the Keychain at start,
# so it is never written into this file.
mkdir -p "$(dirname "$plist")"
cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string><string>-c</string>
    <string>exec $(command -v llama) serve --api-key "\$(security find-generic-password -s llama-api-key -w)" "\$@"</string>
    <string>llama</string>
    <string>--models-preset</string><string>$presets</string>
    <string>--models-max</string><string>1</string>
    <string>--host</string><string>127.0.0.1</string>
    <string>--port</string><string>$port</string>
    <string>-ngl</string><string>all</string>
    <string>-c</string><string>65536</string>
    <string>--ctx-checkpoints</string><string>32</string>
    <string>--sleep-idle-seconds</string><string>900</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/llama-router.log</string>
  <key>StandardErrorPath</key><string>/tmp/llama-router.log</string>
</dict>
</plist>
EOF
plutil -lint -s "$plist"
launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
# bootout returns before the old router has exited; bootstrapping too early fails with error 5.
for _ in {1..20}; do launchctl print "gui/$(id -u)/$label" >/dev/null 2>&1 || break; sleep 0.5; done
launchctl bootstrap "gui/$(id -u)" "$plist"
for _ in {1..20}; do curl -sf "127.0.0.1:$port/health" >/dev/null && break; sleep 1; done
curl -sf "127.0.0.1:$port/health" >/dev/null || { echo "Router did not start: tail /tmp/llama-router.log" >&2; exit 1; }
ok "router running on 127.0.0.1:$port (LaunchAgent $label)"

# 5. Pi credential: the same entry /login llama.cpp writes
mkdir -p "$(dirname "$auth")"
[[ -f $auth ]] || echo '{}' > "$auth"
tmp=$(mktemp "$auth.XXXXXX")
jq --arg k "$(security find-generic-password -s llama-api-key -w)" --arg u "http://127.0.0.1:$port" \
  '."llama.cpp" = {type: "api_key", key: $k, env: {LLAMA_BASE_URL: $u}}' "$auth" > "$tmp"
chmod 600 "$tmp"
mv "$tmp" "$auth"
ok "Pi credential in ~/.pi/agent/auth.json (llama.cpp)"

# 6. Thinking: Pi only learns a llama.cpp model can think by asking it while loaded, so
# after a router restart it would run the model without thinking until its first load.
# The override says so up front, with the same levels Pi detects (medium = the model's
# maximum). Merged into models.json, keeping anything else in it.
[[ -f $models_json ]] || echo '{}' > "$models_json"
tmp=$(mktemp "$models_json.XXXXXX")
jq --arg id "$model_name" '.providers."llama.cpp".modelOverrides[$id] = {
    reasoning: true,
    thinkingLevelMap: {off: "off", minimal: null, low: null, medium: "medium", high: null, xhigh: null},
    compat: {thinkingFormat: "qwen-chat-template"}
  }' "$models_json" > "$tmp"
mv "$tmp" "$models_json"
ok "thinking declared in ~/.pi/agent/models.json"

# 7. Pi lists llama.cpp models only after a session has refreshed them
# (pi update --models skips llama.cpp), and `pi -p --model` needs them listed.
# shortcut: an RPC session that just asks for models; replace if Pi gains a refresh command.
(echo '{"type":"get_available_models"}'; sleep 8) | (cd /tmp && pi --mode rpc --no-session) >/dev/null 2>&1 || true
if (cd /tmp && pi --list-models 2>/dev/null) | grep -q "$model_name"; then
  ok "Pi lists llama.cpp/$model_name"
else
  echo "Pi does not list the model yet: open Pi, run /model once" >&2
fi
echo "Done. Grok Bot needs its custom instructions pasted by hand: docs/local-llm.md#grok-bot-instructions"
