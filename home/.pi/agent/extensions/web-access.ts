// web-access: web_search and web_fetch for Pi, free tiers first.
// Search: Brave → Parallel → TinyFish. A missing key is skipped. Quota errors
// try the next provider. A rejected key (401) stops. Every provider gets the
// freshness and country.
// Fetch: direct download first, then Parallel → TinyFish. Pages come back as Markdown.
// The card shows the service, and calls remaining only when that response reported them.
// Keys: macOS Keychain (web-brave, web-parallel, web-tinyfish) or BRAVE_API_KEY,
// PARALLEL_API_KEY, TINYFISH_API_KEY. /web shows which keys are found.
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { type Component, Text, hyperlink } from "@earendil-works/pi-tui";
import { Type } from "typebox";

type Provider = "brave" | "parallel" | "tinyfish";

type Options = { n: number; freshness?: string; country?: string };

type Hit = { title: string; url: string; snippet: string; age?: string };

type Attempt = { via: string; error: string };

const PROVIDERS: Provider[] = ["brave", "parallel", "tinyfish"];

const ENV_KEY: Record<Provider, string> = {
  brave: "BRAVE_API_KEY",
  parallel: "PARALLEL_API_KEY",
  tinyfish: "TINYFISH_API_KEY",
};

const DIRECT_TIMEOUT_MS = 15_000;
const SEARCH_TIMEOUT_MS = 45_000;
const EXTRACT_TIMEOUT_MS = 150_000; // TinyFish asks clients to wait at least this long
const MAX_CHARS = 20_000;
const CONTENT_CHARS = 3_000;
const CONTENT_PAGES = 3;
const MAX_BYTES = 5_000_000;
const PREVIEW_LINES = 12;

// shortcut: 30-day month and 365-day year, upgrade if this must match Brave's windows
const DAYS = new Map([["day", 1], ["week", 7], ["month", 30], ["year", 365]]);
const RANGE = /^(\d{4}-\d{2}-\d{2})to(\d{4}-\d{2}-\d{2})$/;
const validFreshness = (f?: string) => !f || DAYS.has(f) || RANGE.test(f);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

class StopChain extends Error {
  name = "StopChain";
}

function providerOrder(raw = process.env.WEB_SEARCH_ORDER): Provider[] {
  // SAFETY: includes() only compares; TypeScript just won't accept a plain string there.
  const list = (raw ?? PROVIDERS.join(","))
    .split(",")
    .map((p) => p.trim())
    .filter((p): p is Provider => PROVIDERS.includes(p as Provider));

  return list.length ? list : [...PROVIDERS];
}

function cut(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}\n[cut at ${max} of ${s.length} characters]` : s;
}

function cleanSnippet(s: string, max = 300): string {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\|?\s*-{3,}\s*\|?|\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();

  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function shortUrl(url: string, max = 56): string {
  try {
    const u = new URL(url);

    return clip(`${u.host}${u.pathname}`.replace(/\/$/, ""), max);
  } catch {
    return clip(url, max);
  }
}

const within = (ms: number, signal?: AbortSignal) => AbortSignal.any([AbortSignal.timeout(ms), ...(signal ? [signal] : [])]);
const jsonHeaders = (header: string, k: string) => ({ [header]: k, "Content-Type": "application/json", Accept: "application/json" });

// Brave lists one count per window, shortest first; the last is the monthly allowance.
async function call(url: string, init: RequestInit, timeoutMs: number, signal?: AbortSignal): Promise<{ data: any; left?: number }> {
  const res = await fetch(url, { ...init, signal: within(timeoutMs, signal) });

  if (res.status === 401) throw new StopChain("HTTP 401 (key rejected)");

  if (!res.ok) throw new Error(`HTTP ${res.status}${[402, 403, 429].includes(res.status) ? " (quota or rate limit)" : ""}`);
  const left = Number(res.headers.get("x-ratelimit-remaining")?.split(",").at(-1));

  try {
    return { data: await res.json(), left: Number.isFinite(left) ? left : undefined };
  } catch {
    throw new Error("invalid response");
  }
}

const search: Record<Provider, (q: string, o: Options, k: string, s?: AbortSignal) => Promise<{ hits: Hit[]; left?: number }>> = {
  async brave(q, o, k, s) {
    const p = new URLSearchParams({ q, count: String(o.n) });

    if (o.freshness) p.set("freshness", DAYS.has(o.freshness) ? `p${o.freshness[0]}` : o.freshness);

    if (o.country) p.set("country", o.country.toUpperCase());
    const { data, left } = await call(`https://api.search.brave.com/res/v1/web/search?${p}`, { headers: jsonHeaders("X-Subscription-Token", k) }, SEARCH_TIMEOUT_MS, s);
    const hits = (data.web?.results ?? []).map((r: any) => ({ title: r.title ?? r.url, url: r.url, snippet: htmlToMarkdown(r.description ?? ""), age: r.age ?? r.page_age }));

    return { hits, left };
  },
  async parallel(q, o, k, s) {
    // JSON.stringify drops the undefined fields
    const advanced = {
      max_results: o.n,
      location: o.country?.toLowerCase(),
      source_policy: o.freshness ? { after_date: o.freshness.match(RANGE)?.[1] ?? daysAgo(DAYS.get(o.freshness) ?? 0) } : undefined,
    };

    const body = JSON.stringify({ objective: q, search_queries: [q], mode: "fast", advanced_settings: advanced });
    const { data } = await call("https://api.parallel.ai/v1/search", { method: "POST", headers: jsonHeaders("x-api-key", k), body }, SEARCH_TIMEOUT_MS, s);

    return { hits: (data.results ?? []).map((r: any) => ({ title: r.title ?? r.url, url: r.url, snippet: (r.excerpts ?? []).join(" … "), age: r.publish_date })) };
  },
  async tinyfish(q, o, k, s) {
    const p = new URLSearchParams({ query: q });

    if (o.country) p.set("location", o.country.toUpperCase());
    const range = o.freshness?.match(RANGE);

    if (range) {
      p.set("after_date", range[1]);
      p.set("before_date", range[2]);
    } else if (o.freshness) {
      p.set("recency_minutes", String((DAYS.get(o.freshness) ?? 0) * 1440));
    }

    const { data } = await call(`https://api.search.tinyfish.ai?${p}`, { headers: jsonHeaders("X-API-Key", k) }, SEARCH_TIMEOUT_MS, s);

    return { hits: (data.results ?? []).slice(0, o.n).map((r: any) => ({ title: r.title ?? r.url, url: r.url, snippet: r.snippet ?? "", age: r.date })) };
  },
};

// Providers that can read a page for us (Brave can't)
const extract: Partial<Record<Provider, (url: string, k: string, s?: AbortSignal) => Promise<string>>> = {
  async parallel(url, k, s) {
    const body = JSON.stringify({ urls: [url], advanced_settings: { full_content: true } });
    const { data } = await call("https://api.parallel.ai/v1/extract", { method: "POST", headers: jsonHeaders("x-api-key", k), body }, EXTRACT_TIMEOUT_MS, s);

    return data.results?.[0]?.full_content ?? "";
  },
  async tinyfish(url, k, s) {
    const body = JSON.stringify({ urls: [url], format: "markdown" });
    const { data } = await call("https://api.fetch.tinyfish.ai", { method: "POST", headers: jsonHeaders("X-API-Key", k), body }, EXTRACT_TIMEOUT_MS, s);

    if (data.errors?.length) throw new Error(String(data.errors[0].error));

    return data.results?.[0]?.text ?? "";
  },
};

// Only public internet addresses: never localhost or the home network.
// BlockList also matches IPv4-mapped IPv6 (::ffff:127.0.0.1) against the IPv4 rules.
const PRIVATE = new BlockList();

for (const [net, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16], ["100.64.0.0", 10]] as const) {
  PRIVATE.addSubnet(net, bits, "ipv4");
}

PRIVATE.addAddress("::", "ipv6");

PRIVATE.addAddress("::1", "ipv6");

PRIVATE.addSubnet("fc00::", 7, "ipv6");

PRIVATE.addSubnet("fe80::", 10, "ipv6");

function isPrivate(ip: string): boolean {
  const family = isIP(ip);

  return family !== 0 && PRIVATE.check(ip, family === 6 ? "ipv6" : "ipv4");
}

async function checkPublic(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new StopChain("only http and https links are allowed");
  const addresses = await lookup(url.hostname, { all: true });

  if (addresses.some((a) => isPrivate(a.address))) throw new StopChain("local and private network addresses are blocked");
}

const CHALLENGE = /just a moment|enable javascript|cf-browser-verification|checking your browser|attention required/i;

// Length alone is not a challenge. A short real page must not spend an extractor call.
function needsExtractor(text: string): boolean {
  const t = text.trim();

  if (!t) return true;

  return t.length < 2500 && CHALLENGE.test(t);
}

// Leaving the loop early (throw) cancels the stream, so the rest is never downloaded.
async function readCapped(res: Response, max = MAX_BYTES): Promise<string> {
  if (Number(res.headers.get("content-length")) > max) throw new Error("page too large");
  const chunks: Uint8Array[] = [];
  let total = 0;

  for await (const chunk of res.body ?? []) {
    total += chunk.byteLength;

    if (total > max) throw new Error("page too large");
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");

function htmlToMarkdown(html: string): string {
  const main = html.match(/<(main|article)\b[\s\S]*<\/\1>/i)?.[0] ?? html;

  return decode(
    main
      .replace(/<(script|style|noscript|svg|head|nav|header|footer|aside|form|template)\b[\s\S]*?<\/\1>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => `\n\`\`\`\n${code.replace(/<[^>]+>/g, "")}\n\`\`\`\n`)
      .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, t) => `\n\n${"#".repeat(+l)} ${t.replace(/<[^>]+>/g, "").trim()}\n\n`)
      .replace(/<li\b[^>]*>/gi, "\n- ")
      .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
      .replace(/<(br|\/p|\/div|\/tr|\/table|\/ul|\/ol|\/section)\b[^>]*>/gi, "\n")
      .replace(/<\/t[dh]>/gi, " | ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type WebDetails = {
  kind: "search" | "fetch";
  query: string;
  via?: string;
  hits?: Hit[];
  chars?: number;
  preview?: string[];
  moreLines?: number;
  left?: number;
  attempts?: Attempt[];
  failed?: boolean;
};

function previewOf(text: string) {
  const lines = text.split("\n");

  return { preview: lines.slice(0, PREVIEW_LINES), moreLines: Math.max(0, lines.length - PREVIEW_LINES) };
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumSignificantDigits: 2 });

function card(d: WebDetails, expanded: boolean, t: Theme): string {
  const isFetch = d.kind === "fetch";
  const tool = t.fg("toolTitle", t.bold(isFetch ? "web fetch" : "web search"));
  const subject = isFetch ? shortUrl(d.query) : clip(d.query, 80);

  const meta = (bits: string[]) => {
    const text = t.fg("dim", bits.join(" · "));

    return isFetch ? hyperlink(text, d.query) : text;
  };

  if (d.failed) {
    const error = (d.attempts ?? []).map((a) => `${a.via} ${a.error}`).join(" · ") || "failed";

    return [`${tool}  ${t.fg("error", "failed")}`, meta([subject]), t.fg("error", error)].join("\n");
  }

  const left = d.left === undefined ? "" : t.fg(d.left === 0 ? "error" : d.left < 100 ? "warning" : "dim", ` · ${d.left.toLocaleString("en-US")} left`);
  const hits = d.hits ?? [];
  const bits = [subject];

  if (hits.length) bits.push(`${hits.length} result${hits.length === 1 ? "" : "s"}`);

  if (d.chars !== undefined) bits.push(`${compact.format(d.chars)} chars`);
  const lines = [`${tool}  ${d.via ? t.fg("accent", d.via) : t.fg("dim", "…")}${left}`, meta(bits)];

  if (!expanded) return lines.join("\n");
  hits.forEach((h, i) => {
    lines.push(`${t.fg("dim", String(i + 1))}  ${hyperlink(t.fg("accent", h.title || shortUrl(h.url)), h.url)}`);
    lines.push(t.fg("dim", [shortUrl(h.url, 48), h.age].filter(Boolean).join(" · ")));

    if (h.snippet) lines.push(t.fg("muted", cleanSnippet(h.snippet, 140)));
  });

  for (const line of d.preview ?? []) lines.push(t.fg("toolOutput", line));

  if (d.moreLines) lines.push(t.fg("dim", `${d.moreLines} more lines`));

  return lines.join("\n");
}

function searchText(hits: Hit[], via: string, content?: (string | null)[]): string {
  const list = hits.map((h, i) => {
    const age = h.age ? ` (${h.age})` : "";
    const page = content?.[i];
    const body = page ? `\n   Content:\n${page}` : page === null ? "\n   Content: (could not read)" : "";

    return `${i + 1}. ${h.title}${age}\n   ${h.url}\n   ${cleanSnippet(h.snippet)}${body}`;
  });

  return `${list.join("\n\n")}\n\n(via ${via})`;
}

type RunDeps = {
  order: Provider[];
  key: (p: Provider) => Promise<string | null>;
  signal?: AbortSignal;
  onTry?: (via: string) => void;
};

type Failed = { ok: false; message: string; details: WebDetails };

const messageOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause));
const aborted = (cause: unknown, signal?: AbortSignal) => signal?.aborted || (cause instanceof Error && cause.name === "AbortError");

function failure(kind: "search" | "fetch", query: string, attempts: Attempt[]): Failed {
  const list = attempts.map((a) => `${a.via}: ${a.error}`).join("; ");
  let message = kind === "search" ? "Web search failed." : `Could not read ${query}.`;

  if (!attempts.length && kind === "search") message = "No web search key found. Run /web for setup.";

  return { ok: false, message: list ? `${message} ${list}` : message, details: { kind, query, attempts, failed: true } };
}

// Try each provider that has a key, in order. An empty answer moves on; StopChain ends the chain.
async function firstOk<T>(providers: Provider[], deps: RunDeps, attempts: Attempt[], run: (p: Provider, key: string) => Promise<T | undefined>) {
  for (const p of providers) {
    const key = await deps.key(p);

    if (!key) continue;
    deps.onTry?.(p);

    try {
      const value = await run(p, key);

      if (value !== undefined) return { via: p, value };
      attempts.push({ via: p, error: "empty" });
    } catch (e) {
      if (aborted(e, deps.signal)) throw e;
      attempts.push({ via: p, error: messageOf(e) });

      if (e instanceof StopChain) return undefined;
    }
  }

  return undefined;
}

async function runSearch(query: string, o: Options, deps: RunDeps): Promise<{ ok: true; hits: Hit[]; via: Provider; left?: number; attempts: Attempt[] } | Failed> {
  const attempts: Attempt[] = [];

  const found = await firstOk(deps.order, deps, attempts, async (p, key) => {
    const r = await search[p](query, o, key, deps.signal);
    const hits = r.hits.filter((h) => h.url);

    return hits.length ? { hits, left: r.left } : undefined;
  });

  return found ? { ok: true, ...found.value, via: found.via, attempts } : failure("search", query, attempts);
}

async function directFetch(start: string, deps: RunDeps): Promise<string> {
  let url = new URL(start);

  for (let hop = 0; hop < 5; hop++) {
    await checkPublic(url);

    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) pi-web", Accept: "text/html,text/plain,*/*" },
      signal: within(DIRECT_TIMEOUT_MS, deps.signal),
    });

    const next = res.headers.get("location");

    if (res.status >= 300 && res.status < 400 && next) {
      url = new URL(next, url);
      continue;
    }

    if (res.status === 401) throw new StopChain("HTTP 401");

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") ?? "";

    if (!/text|json|xml/.test(type)) throw new Error(`unsupported content type ${type}`);
    const body = await readCapped(res);

    return /html/.test(type) ? htmlToMarkdown(body) : body;
  }

  throw new Error("too many redirects");
}

async function runFetch(url: string, deps: RunDeps): Promise<{ ok: true; page: string; via: string; attempts: Attempt[] } | Failed> {
  const attempts: Attempt[] = [];
  const extractors = deps.order.filter((p) => extract[p]);
  deps.onTry?.("direct");

  try {
    const page = (await directFetch(url, deps)).trim();

    if (page && (!needsExtractor(page) || !extractors.length)) return { ok: true, page, via: "direct", attempts };
    attempts.push({ via: "direct", error: page ? "challenge page" : "empty" });
  } catch (e) {
    if (aborted(e, deps.signal)) throw e;
    attempts.push({ via: "direct", error: messageOf(e) });

    if (e instanceof StopChain) return failure("fetch", url, attempts);
  }

  const found = await firstOk(extractors, deps, attempts, async (p, key) => (await extract[p]!(url, key, deps.signal)).trim() || undefined);

  return found ? { ok: true, page: found.value, via: found.via, attempts } : failure("fetch", url, attempts);
}

const DEFAULT_COUNTRY = process.env.WEB_SEARCH_COUNTRY ?? "US";
const FRESHNESS = "day, week, month, year, or YYYY-MM-DDtoYYYY-MM-DD";

// Promises, not values: parallel page reads share one Keychain lookup per provider.
const keys = new Map<Provider, Promise<string | null>>();
const left = new Map<Provider, number>();

type CallContext = { isPartial: boolean; durationMs?: number; lastComponent?: Component };

type ResultContext = { lastComponent?: Component; isError: boolean };

export default function (pi: ExtensionAPI) {
  async function fromKeychain(p: Provider): Promise<string | null> {
    const env = process.env[ENV_KEY[p]];

    if (env) return env;
    const found = await pi.exec("security", ["find-generic-password", "-s", `web-${p}`, "-w"]).catch(() => null);

    return found?.code === 0 && found.stdout.trim() ? found.stdout.trim() : null;
  }

  function key(p: Provider): Promise<string | null> {
    let k = keys.get(p);

    if (!k) keys.set(p, (k = fromKeychain(p)));

    return k;
  }

  function textOf(last: Component | undefined, value: string) {
    const component = last instanceof Text ? last : new Text("", 0, 0);
    component.setText(value);

    return component;
  }

  function drawCall(label: string, raw: string | undefined, theme: Theme, context: CallContext) {
    if (context.isPartial || context.durationMs !== undefined) return textOf(context.lastComponent, "");
    // oxlint-disable-next-line anti-slop/no-runtime-typeof -- raw model JSON while streaming; Pi's own renderers check the same way
    const subject = typeof raw === "string" && raw ? clip(raw, 80) : "…";

    return textOf(context.lastComponent, `${theme.fg("toolTitle", theme.bold(label))}  ${theme.fg("dim", "…")}\n${theme.fg("dim", subject)}`);
  }

  function drawResult(
    result: { content: Array<{ type: string; text?: string }>; details?: unknown },
    { expanded }: { expanded: boolean },
    theme: Theme,
    context: ResultContext,
  ) {
    // SAFETY: details come from our own execute() (a WebDetails) or are empty when Pi reports a thrown error; the kind check below tells them apart.
    const details = result.details as WebDetails | undefined;

    if (!details?.kind) {
      const raw = result.content.find((c) => c.type === "text")?.text ?? "";
      const shown = expanded ? raw : clip(raw.split("\n").find((line) => line.trim()) ?? "", 120);

      return textOf(context.lastComponent, theme.fg(context.isError ? "error" : "toolOutput", shown));
    }

    return textOf(context.lastComponent, card(details, expanded, theme));
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
