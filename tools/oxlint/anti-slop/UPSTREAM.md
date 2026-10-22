# anti-slop provenance

- Source: https://github.com/dmmulroy/anti-slop (MIT, see `third_party/dmmulroy-anti-slop.LICENSE`)
- Commit: `13909c9e07590f5a85d93c62712259fe14a883f7` (2026-10-14)
- Copied from the vendored skill `skills/install-anti-slop/assets/anti-slop/` at that
  commit by its `scripts/install.mjs`. Plugin files are unmodified.
- Entry point: `tools/oxlint/anti-slop/index.ts` (generic rules only; the `effect/`
  plugin is copied but not registered).
- Oxlint and `@oxlint/plugins` pinned to 1.88.0: 1.89.0 was under the 3-day
  `min-release-age` in `~/.npmrc` at install time.

## Intentional deviations (configuration, not plugin code)

- `npm run lint` checks only `home/.pi/agent/extensions/`. The upstream agent-folder
  ignores (`.claude/**`, `.pi/**`, ...) are not used: in this repo those folders are
  our own source.
- Vendored code is ignored instead: `skills/**`, this plugin, `todos.ts`, `speed.ts`.
