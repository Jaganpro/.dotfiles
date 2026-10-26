# ☁️ Cloudflare

Workers (code that runs on Cloudflare's network), Durable Objects (a Worker
with its own storage) and Tunnels (put a local app on a public URL).

- [What's installed](#whats-installed)
- [Sign in (once per Mac)](#sign-in-once-per-mac)
- [Everyday commands](#everyday-commands)
- [Secrets](#secrets)
- [Start a new project](#start-a-new-project)
- [Tunnels: share a local app](#tunnels-share-a-local-app)
- [Editing TypeScript in Neovim](#editing-typescript-in-neovim)
- [Troubleshooting](#troubleshooting)

## What's installed

| Piece | Where | Why |
|---|---|---|
| `wrangler` in each project | `package.json` (exact version) | **Use this one** (`npx wrangler …` or `npm run …`): the version is pinned and reviewed with the code |
| `wrangler` on the Mac | `packages/Brewfile` (`cloudflare-wrangler`) | Outside a project: `wrangler whoami`, `wrangler login`, quick checks. It can be a different version from a project's |
| `cloudflared` | `packages/Brewfile` | Tunnels ([below](#tunnels-share-a-local-app)) |
| `WRANGLER_SEND_METRICS=false` | `~/.zprofile` | Wrangler sends no anonymous usage data |
| `.dev.vars`, `.dev.vars.*` | `~/.config/git/ignore` | Local secrets can't be committed by accident, in any repo |

Homebrew's `wrangler` brings Homebrew's own Node. Your shell still uses fnm's
Node (`node -v`); only the Mac-wide `wrangler` runs on Homebrew's.

## Sign in (once per Mac)

```bash
wrangler login --use-keyring   # opens the browser; the login is kept in the macOS Keychain
wrangler whoami                # check: shows your account
```

`--use-keyring` keeps the login encrypted with a key in the Keychain instead of
a plain file in `~/Library/Preferences/.wrangler/`, and Wrangler remembers the
choice. Either way it's never in this repo. `wrangler logout` signs out.

For scripts or CI, use an API token instead (`CLOUDFLARE_API_TOKEN`), stored in
the Keychain like the Pi web-search keys, never in a file.

## Everyday commands

Run inside the project folder. sf-pi-durable wraps most of them in npm scripts.

| Command | Does |
|---|---|
| `npm run dev` (`npx wrangler dev`) | Run the Worker on your Mac at <http://localhost:8787>; reloads on save |
| `npm run types` (`npx wrangler types`) | Regenerate TypeScript types after changing `wrangler.jsonc` |
| `npm run build` | Bundle without uploading (`deploy --dry-run`), to check it builds |
| `npx wrangler deploy` | Publish to Cloudflare; prints the `*.workers.dev` URL |
| `npx wrangler tail` | Live logs from the published Worker (Ctrl-C stops) |
| `npx wrangler deployments list` | Recent deploys |
| `npx wrangler rollback` | Go back to the previous deploy |

## Secrets

API keys (e.g. `XAI_API_KEY`) never go in `wrangler.jsonc` or the code.

| Where it runs | How |
|---|---|
| On your Mac (`wrangler dev`) | A `.dev.vars` file next to `wrangler.jsonc`, one `NAME=value` per line. Git ignores it everywhere (global ignore) |
| On Cloudflare | `npx wrangler secret put XAI_API_KEY` (asks for the value; deploys it straight away). `npx wrangler secret list` shows the names |

In the Worker, a secret is `env.XAI_API_KEY`. To list required secret names in
`wrangler.jsonc` (so a missing one fails early), see Cloudflare's
[secrets guide](https://developers.cloudflare.com/workers/configuration/secrets/).

## Start a new project

```bash
cd ~/projects
npm create cloudflare@latest -- my-worker   # asks: template, TypeScript, git, deploy now
cd my-worker && npm run dev
```

Then copy what makes sf-pi-durable safe to hand to agents: exact versions and a
3-day wait for new releases (`.npmrc`), the strict `oxlint.config.ts` with the
anti-slop rules (the `install-anti-slop` skill sets these up), the pre-commit
hook, and its `AGENTS.md`.

## Tunnels: share a local app

`cloudflared` gives an app running on your Mac a temporary public `https` URL,
e.g. so Salesforce or a phone can reach `wrangler dev`. No account needed.

```bash
npm run dev                                         # terminal 1: the app on :8787
cloudflared tunnel --url http://localhost:8787      # terminal 2: prints https://….trycloudflare.com
```

- **Anyone with the URL can reach your app** while it runs. Add
  `--allowed-mail you@example.com` to require an emailed one-time PIN first.
- The URL changes every time and stops when you press Ctrl-C. No uptime
  guarantee; for a fixed hostname, create a named tunnel
  ([Cloudflare docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)).

## Editing TypeScript in Neovim

The LazyVim TypeScript extras are on (`lazyvim.json`), so in a project:

- **Errors as you type** come from the project's own TypeScript 7 (`tsc --lsp`)
  and its own oxlint with its rules, so Neovim agrees with `npm run check`.
- `gd` go to definition, `gr` usages, `K` docs, `Space ca` fixes,
  `Space cr` rename, `]d` next error. Full list: [neovim.md](neovim.md#code-after-turning-on-a-language).
- The first TypeScript file you open on a new Mac downloads the language
  servers (Mason, about a minute). After that they start by themselves.

## Troubleshooting

| Problem | Fix |
|---|---|
| `wrangler` says you're not logged in | `wrangler login --use-keyring`, then `wrangler whoami` |
| A different Wrangler version than expected | Use `npx wrangler` inside the project (the pinned one); plain `wrangler` is the Mac-wide one |
| Secret missing in `wrangler dev` | Check `.dev.vars` is next to `wrangler.jsonc` and restart `npm run dev` |
| Types out of date after editing `wrangler.jsonc` | `npm run types` |
| No errors / `gd` does nothing in Neovim | `:LspInfo`; then `:Mason` to check `tsc` and `oxlint` are installed. The project needs `npm install` first |
