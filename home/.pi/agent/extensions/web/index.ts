// web: web_search and web_fetch for Pi, free tiers first.
// Search: Brave → Parallel → TinyFish. A missing key is skipped. Quota errors
// try the next provider. A rejected key (401) stops. Every provider gets the
// freshness and country.
// Fetch: direct download first, then Parallel → TinyFish. Pages come back as Markdown.
// The card shows the service, and calls remaining only when that response reported them.
// Keys: macOS Keychain (web-brave, web-parallel, web-tinyfish) or BRAVE_API_KEY,
// PARALLEL_API_KEY, TINYFISH_API_KEY. /web shows which keys are found.
import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { Text, hyperlink } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import {
  CONTENT_CHARS,
  CONTENT_PAGES,
  ENV_KEY,
  MAX_CHARS,
  type Provider,
  type WebDetails,
  card,
  clip,
  cut,
  previewOf,
  providerOrder,
  runFetch,
  runSearch,
  searchText,
  validFreshness,
} from "./lib.ts";

const DEFAULT_COUNTRY = process.env.WEB_SEARCH_COUNTRY ?? "US";
const FRESHNESS = "day, week, month, year, or YYYY-MM-DDtoYYYY-MM-DD";
// Promises, not values: parallel page reads share one Keychain lookup per provider.
const keys = new Map<Provider, Promise<string | null>>();
const left = new Map<Provider, number>();

type CallContext = { isPartial: boolean; durationMs?: number; lastComponent?: unknown };
type ResultContext = { lastComponent?: unknown; isError: boolean };

export default function (pi: ExtensionAPI) {
  async function lookup(p: Provider): Promise<string | null> {
    const env = process.env[ENV_KEY[p]];
    if (env) return env;
    const found = await pi.exec("security", ["find-generic-password", "-s", `web-${p}`, "-w"]).catch(() => null);
    return found?.code === 0 && found.stdout.trim() ? found.stdout.trim() : null;
  }

  function key(p: Provider): Promise<string | null> {
    let k = keys.get(p);
    if (!k) keys.set(p, (k = lookup(p)));
    return k;
  }

  const paint = (theme: Theme) => ({
    fg: (color: string, s: string) => theme.fg(color as Parameters<Theme["fg"]>[0], s),
    bold: (s: string) => theme.bold(s),
    link: hyperlink,
  });

  function textOf(last: unknown, value: string) {
    const component = last instanceof Text ? last : new Text("", 0, 0);
    component.setText(value);
    return component;
  }

  function drawCall(label: string, raw: unknown, theme: Theme, context: CallContext) {
    if (context.isPartial || context.durationMs !== undefined) return textOf(context.lastComponent, "");
    const subject = typeof raw === "string" && raw ? clip(raw, 80) : "…";
    return textOf(context.lastComponent, `${theme.fg("toolTitle", theme.bold(label))}  ${theme.fg("dim", "…")}\n${theme.fg("dim", subject)}`);
  }

  function drawResult(
    result: { content: Array<{ type: string; text?: string }>; details?: unknown },
    { expanded }: { expanded: boolean },
    theme: Theme,
    context: ResultContext,
  ) {
    const details = result.details as WebDetails | undefined;
    if (!details?.kind) {
      const raw = result.content.find((c) => c.type === "text")?.text ?? "";
      const shown = expanded ? raw : clip(raw.split("\n").find((line) => line.trim()) ?? "", 120);
      return textOf(context.lastComponent, theme.fg(context.isError ? "error" : "toolOutput", shown));
    }
    return textOf(context.lastComponent, card(details, expanded, paint(theme)));
  }

  const blank = [{ type: "text" as const, text: "" }];

  pi.registerTool({
    name: "web_search",
    label: "Web search",
    description: "Search the web; returns titles, URLs, snippets and age, optionally with page text.",
    parameters: Type.Object({
      query: Type.String({ description: "What to search for" }),
      count: Type.Optional(Type.Number({ description: "Number of results, 1-10 (default 5)" })),
      freshness: Type.Optional(Type.String({ description: FRESHNESS })),
      country: Type.Optional(Type.String({ description: "Two-letter country code (default US)" })),
      content: Type.Optional(Type.Boolean({ description: "Also read the top 3 pages (slower)" })),
    }),
    renderCall: (args, theme, context) => drawCall("web search", args?.query, theme, context),
    renderResult: drawResult,
    async execute(_id, { query, count, freshness, country, content }, signal, onUpdate) {
      if (!validFreshness(freshness)) return { content: [{ type: "text", text: `freshness must be ${FRESHNESS}` }], details: {}, isError: true };
      const o = { n: Math.min(Math.max(Math.round(count ?? 5), 1), 10), freshness, country: country ?? DEFAULT_COUNTRY };
      const found = await runSearch(query, o, { order: providerOrder(), key, signal, onTry: (via) => onUpdate?.({ content: blank, details: { kind: "search", query, via } }) });
      if (!found.ok) return { content: [{ type: "text", text: found.message }], details: found.details, isError: true };
      if (found.left !== undefined) left.set(found.via, found.left);
      const pages = content
        ? await Promise.all(
            found.hits.slice(0, CONTENT_PAGES).map(async (hit) => {
              const read = await runFetch(hit.url, { order: providerOrder(), key, signal });
              return read.ok ? cut(read.page, CONTENT_CHARS) : null;
            }),
          )
        : undefined;
      const details: WebDetails = { kind: "search", query, via: found.via, hits: found.hits, left: found.left, attempts: found.attempts };
      return { content: [{ type: "text", text: searchText(found.hits, found.via, pages) }], details };
    },
  });

  pi.registerTool({
    name: "web_fetch",
    label: "Web fetch",
    description: "Read a public web page and return its main text as Markdown.",
    parameters: Type.Object({ url: Type.String({ description: "http or https URL" }) }),
    renderCall: (args, theme, context) => drawCall("web fetch", args?.url, theme, context),
    renderResult: drawResult,
    async execute(_id, { url }, signal, onUpdate) {
      const found = await runFetch(url, { order: providerOrder(), key, signal, onTry: (via) => onUpdate?.({ content: blank, details: { kind: "fetch", query: url, via } }) });
      if (!found.ok) return { content: [{ type: "text", text: found.message }], details: found.details, isError: true };
      const text = cut(found.page, MAX_CHARS);
      const details: WebDetails = { kind: "fetch", query: url, via: found.via, chars: found.page.length, attempts: found.attempts, ...previewOf(text) };
      return { content: [{ type: "text", text: `${text}\n\n(via ${found.via})` }], details };
    },
  });

  pi.registerCommand("web", {
    description: "Show web search keys and provider order",
    handler: async (_args, ctx) => {
      const order = providerOrder();
      const found = await Promise.all(order.map(key));
      const lines = order.map((p, i) => {
        const n = left.get(p);
        return `${p.padEnd(10)}${found[i] ? "key" : "no key"}${n === undefined ? "" : ` · ${n.toLocaleString("en-US")} left`}`;
      });
      lines.push(`order     ${order.join(" → ")}`);
      ctx.ui.notify(lines.join("\n"));
    },
  });
}
