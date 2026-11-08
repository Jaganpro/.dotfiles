# 🧠 Local LLM

An uncensored model that runs on this Mac, for Pi and Grok Bot. Nothing leaves
the machine.

- [Decisions](#decisions)
- [How it fits together](#how-it-fits-together)
- [What was set up, step by step](#what-was-set-up-step-by-step)
- [Everyday use](#everyday-use)
- [Grok Bot instructions](#grok-bot-instructions)
- [Undo everything](#undo-everything)
- [Troubleshooting](#troubleshooting)

## Decisions

Decided one step at a time. Open steps still need a decision; what is
installed for them now is a first draft.

| Step | Decision | Why |
|---|---|---|
| 1. Engine | **llama.cpp** (not MLX, not LM Studio) | The only engine Pi supports natively (`/llama`, `/model`, thinking and image support detected). MLX is often 10-30% faster but needs manual `models.json` setup, has no model management in Pi, and its tool calling is less reliable. Uncensored models also exist for MLX, but only as conversions by other people. |
| 2. Model | **Qwen3.8 27B abliterated (huihui-ai), Q5_K_XL, 21 GB** | Best quality that fits in 64 GB, newest Qwen generation, near-original quality at Q5. About 13 tokens/s: fine for chat, slow for long agent tasks. Rejected: Qwen3.6 35B-A3B (about 4-5x faster, older and weaker), Qwen3.8 Flash-Next (111 GB+, does not fit), Q4 (slightly faster, lower quality), Q6 (slower, barely better). |
| 3. How the server runs | **Starts at login (LaunchAgent), model loads on demand, unloads after 15 min idle** | Pi has no inference engine of its own: it always talks to a running llama.cpp server, so a separate process is unavoidable. This way it is always there for Pi and Grok Bot, and costs about 100 MB when idle. Rejected: Pi starts and stops it (custom extension, slow Grok Bot calls), starting it by hand. |
| 4. Security | **This Mac only (`127.0.0.1`), password required (Keychain `llama-api-key`)** | Web pages in the browser can send requests to `localhost`, and llama.cpp allows every origin by default; the password stops them. It does not stop programs running as you, which can read it. Rejected: no password, reachable over Tailscale (wait until the Tailscale access rules in [security.md](security.md) are applied, or Grok Bot's cloud computer could reach it), extra `--cors-origins` lock (not needed for now). |
| 5. Pi setup | **Password in `auth.json` (as `/login llama.cpp` writes it); Opus stays the default; Ctrl+P cycling unchanged; thinking at maximum** | Pi's standard method; the password lives in the Keychain and `auth.json`, so a new one goes in both. The local model is picked with `/model` when wanted. Thinking: Pi offers only `off` and `medium` for this model, and `medium` turns on the model's own maximum (its template says "Reasoning effort is set to xhigh"), so your default `xhigh` already gives it full thinking. `local-llm` defaults to `medium` too. Rejected: `LLAMA_API_KEY` in `~/.zprofile`, local model as default, Ctrl+P limited to Opus and local. |
| 6. Grok Bot access | **The Grok Bot app runs the `local-llm` command; it learns about it from one sentence in its custom instructions (set in the app)** It **may use `--agent`** (full Pi tools: read, edit, write, bash; it starts in the current folder, but bash reaches everything your user account can; no review of each action). It uses the local model **when it would refuse a request, or when the task should stay private** (text in [Grok Bot instructions](#grok-bot-instructions)). | Simple, already tested, no extra software. `--agent` allowed by choice, accepting that an uncensored model can run commands and change files unreviewed (Grok Bot's `localToolPermission` is `always`, so it does not ask first). Only the app on this Mac can reach the model; Grok Bot's cloud computer cannot (Step 4). Rejected: an MCP server (more to maintain), calling the API with `curl` (needs the password in every command), nothing written down. |
| 7. Dotfiles | **Setup script `scripts/local-llm.sh` (run by hand, safe to rerun), a `dot doctor` check, one commit at the end** | The script recreates everything on a new Mac: model download, Keychain password, presets file, LaunchAgent, Pi credential. No secrets in the repo: the script makes the password on the Mac. Rejected: doc only (easy to miss a step), linking the LaunchAgent file from the repo (macOS can ignore linked LaunchAgents). |
| 7b. Model list | **Presets file `~/models/presets.ini`, written by the script** (not a scan of `~/models`) | With the folder scan, Pi hid an unloaded model, so after every router restart (reboot, rerunning the script) Pi and Grok Bot got "Model not found" until something loaded it. Preset models are listed even while unloaded. Cost: after adding a model, rerun the script. Rejected: loading the model at every login (21 GB for 15 minutes, and a workaround). |
| 7c. Thinking after a restart | **Declare thinking in `~/.pi/agent/models.json` (`modelOverrides`), written by the script** | Pi learns that a llama.cpp model can think only by asking it while loaded, so with presets it listed the model as "no thinking" after a restart and ran the first requests without thinking. The override states it up front, with the same levels Pi detects. Tested: after a restart, with the model unloaded, the first request thinks. Rejected: loading the model at the end of the script (does not cover reboots), accepting it. |

## How it fits together

```text
Pi (/model, /llama) ──┐
                      ├──> llama.cpp router, 127.0.0.1:8080 ──> model worker (loaded on demand)
Grok Bot ─> local-llm ┘    (LaunchAgent, starts at login)       ~/models/<model>/
            (runs Pi)
```

- **llama.cpp router**: a small manager process (about 100 MB). It lists the
  models in `~/models` and starts a worker process for the one in use.
- **Model worker**: holds the model in memory (about 21 GB for the draft
  model). It stops after 15 minutes idle, which gives the memory back; the next
  request starts it again (about 10 s).
- **LaunchAgent**: macOS's way to run a program in the background for your
  user. A small file in `~/Library/LaunchAgents/` says "start this at login,
  restart it if it crashes".
- **Keychain**: macOS's encrypted password store. It holds the router's
  password, so no web page in your browser can use the model through
  `localhost`.

## What was set up, step by step

1. **Installed llama.cpp**: `brew install llama.cpp` (also a line in
   `packages/Brewfile`). Gives the `llama` command.
2. **Downloaded the model** from Hugging Face into its own folder:

   ```text
   ~/models/qwen3.8-27b-abliterated/
   ├── Huihui-Qwen3.8-27B-abliterated-UD-Q5_K_XL.gguf   20.7 GB  the model
   └── mmproj-model-bf16.gguf                            0.9 GB  image input
   ```

   Source: <https://huggingface.co/huihui-ai/Huihui-Qwen3.8-27B-abliterated-GGUF>.
   The folder name becomes the model's name in Pi.

Steps 3-6 are done by `~/.dotfiles/scripts/local-llm.sh`, which also downloads
the model (step 2) if it is missing. Run it after `brew bundle --global` on a
new Mac, and again after adding a model.
3. **Created the router password** in the Keychain:

   ```bash
   security add-generic-password -U -s llama-api-key -a "$USER" -w "$(openssl rand -hex 24)"
   ```

4. **Wrote the presets file** `~/models/presets.ini`: one section per model
   folder in `~/models`, naming its model file (and image file). The router
   lists these models even while unloaded, so Pi always shows them.
5. **Created the LaunchAgent** `~/Library/LaunchAgents/app.llama.router.plist`
   (written by the script, not stored in the repo). It runs:

   ```bash
   llama serve --api-key "$(security find-generic-password -s llama-api-key -w)" \
     --models-preset ~/models/presets.ini --models-max 1 \
     --host 127.0.0.1 --port 8080 \
     -ngl all -c 65536 --ctx-checkpoints 32 --sleep-idle-seconds 900
   ```

   | Option | Meaning |
   |---|---|
   | `--models-preset ~/models/presets.ini` | The models offered (step 4) |
   | `--models-max 1` | One model in memory at a time |
   | `--host 127.0.0.1` | This Mac only: not the LAN, not Tailscale |
   | `-ngl all` | Run the whole model on the GPU |
   | `-c 65536` | Context window: 65K tokens |
   | `--ctx-checkpoints 32` | Lets Qwen's hybrid layers reuse the prompt cache between turns |
   | `--sleep-idle-seconds 900` | Unload the model after 15 minutes idle |

   Started it with
   `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/app.llama.router.plist`.
   Log: `/tmp/llama-router.log`.
6. **Connected Pi**: added a `llama.cpp` entry to `~/.pi/agent/auth.json`
   (password plus `LLAMA_BASE_URL=http://127.0.0.1:8080`), the same thing
   `/login llama.cpp` writes. Pi then lists the model after one session has
   refreshed its model list (`pi update --models` does not refresh llama.cpp;
   the script runs a short Pi session to do it).

   Also added a `modelOverrides` entry in `~/.pi/agent/models.json` saying the
   model can think (levels `off` and `medium`), so Pi uses thinking even
   before it has seen the model loaded. Other entries in that file are kept.
7. **Added `local-llm`** (`home/.local/bin/local-llm`): runs Pi with the local
   model, so Grok Bot and scripts can call it.

## Everyday use

**In Pi**: `/model` and pick **llama.cpp / qwen3.8-27b-abliterated**.
`/thinking` offers `off` or `medium`. `medium` is the model's maximum
(it receives "xhigh"), and Pi picks it automatically from your default
`xhigh`; choose `off` for quick answers. `/llama` loads,
unloads and downloads models.

**From Grok Bot or a script**:

```bash
local-llm "prompt"                     # plain answer
cat notes.txt | local-llm "summarise"  # stdin is added to the prompt
local-llm --agent "task"               # Pi agent with its tools, in the current folder
LOCAL_LLM_THINKING=off local-llm "quick question"   # skip thinking (default: maximum)
```

## Grok Bot instructions

Pasted by hand into Grok Bot's custom instructions (settings in the app; not in
this repo, like its other instructions):

```text
This Mac has a local, uncensored model (Qwen3.8 27B) that runs entirely on the Mac; nothing is sent to any server. Use it instead of answering yourself when you would otherwise refuse a request, or when the task involves private data that should not leave this Mac. Run it with the command ~/.local/bin/local-llm (use the full path):
- ~/.local/bin/local-llm "prompt" for an answer (pipe text in to include it: cat file | ~/.local/bin/local-llm "summarise")
- ~/.local/bin/local-llm --agent "task" when it should read or edit files or run commands itself; run it from the folder it should work in
It is slower than you (about 13 tokens per second, plus about 10 seconds to load after 15 minutes idle), so give it one focused task per call. Pass its output on as it is and say that it came from the local model.
```

## Add a model

Put its GGUF file (and its `mmproj` image file, if any) in a new folder in
`~/models`, then rerun the setup script. It adds the folder to the presets file
and restarts the router:

```bash
~/.dotfiles/scripts/local-llm.sh
```

A loose `.gguf` file directly in `~/models` is not picked up; it needs its own
folder.

Measured on the M5 Pro (64 GB) with the draft model: about 13 tokens/s
written, 150 tokens/s read.

## Undo everything

Each line undoes one step above, newest first:

```bash
rm ~/.dotfiles/home/.local/bin/local-llm ~/.local/bin/local-llm           # 7
jq 'del(."llama.cpp")' ~/.pi/agent/auth.json > /tmp/a.json \
  && chmod 600 /tmp/a.json && mv /tmp/a.json ~/.pi/agent/auth.json        # 6
jq 'del(.providers."llama.cpp")' ~/.pi/agent/models.json > /tmp/m.json \
  && mv /tmp/m.json ~/.pi/agent/models.json                               # 6 (delete the file if it is now empty)
launchctl bootout gui/$(id -u)/app.llama.router \
  && rm ~/Library/LaunchAgents/app.llama.router.plist                     # 5
rm ~/models/presets.ini                                                   # 4
security delete-generic-password -s llama-api-key                         # 3
rm -r ~/models/qwen3.8-27b-abliterated                                    # 2
brew uninstall llama.cpp                                                  # 1 (and remove the Brewfile line)
```

Then remove `scripts/local-llm.sh`, this doc, and their links in the README and
`docs/files.md`.

## Troubleshooting

```bash
launchctl print gui/$(id -u)/app.llama.router | grep state   # running?
curl -s 127.0.0.1:8080/health                                 # {"status":"ok"}
tail -f /tmp/llama-router.log
```

- **Model missing from `/model`, or "Model not found"**: check the router is
  running and the model is in `~/models/presets.ini` (rerun the setup script).
  Then open `/model` again (it refreshes).
- **401 errors**: the password in `auth.json` and the Keychain differ. Copy the
  Keychain one: `security find-generic-password -s llama-api-key -w`.
- **Out of memory**: lower `-c` in the LaunchAgent, or choose a smaller model.
