// Pure web search/fetch logic. No Pi imports, so the tests can run outside the app.
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

export type Provider = "brave" | "parallel" | "tinyfish";

export type Options = { n: number; freshness?: string; country?: string };

type Hit = { title: string; url: string; snippet: string; age?: string };

type Attempt = { via: string; error: string };

const PROVIDERS: Provider[] = ["brave", "parallel", "tinyfish"];

export const ENV_KEY: Record<Provider, string> = {
  brave: "BRAVE_API_KEY",
  parallel: "PARALLEL_API_KEY",
  tinyfish: "TINYFISH_API_KEY",
};

const DIRECT_TIMEOUT_MS = 15_000;
const SEARCH_TIMEOUT_MS = 45_000;
const EXTRACT_TIMEOUT_MS = 150_000; // TinyFish asks clients to wait at least this long
export const MAX_CHARS = 20_000;
export const CONTENT_CHARS = 3_000;
export const CONTENT_PAGES = 3;
const MAX_BYTES = 5_000_000;
const PREVIEW_LINES = 12;

// shortcut: 30-day month and 365-day year, upgrade if this must match Brave's windows
const DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };
const RANGE = /^(\d{4}-\d{2}-\d{2})to(\d{4}-\d{2}-\d{2})$/;
export const validFreshness = (f?: string) => !f || f in DAYS || RANGE.test(f);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

export class StopChain extends Error {
  name = "StopChain";
}

export function providerOrder(raw = process.env.WEB_SEARCH_ORDER): Provider[] {
  const list = (raw ?? PROVIDERS.join(","))
    .split(",")
    .map((p) => p.trim())
    .filter((p): p is Provider => PROVIDERS.includes(p as Provider));

  return list.length ? list : [...PROVIDERS];
}

export function cut(s: string, max: number): string {
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

export function clip(s: string, max: number): string {
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

    if (o.freshness) p.set("freshness", DAYS[o.freshness] ? `p${o.freshness[0]}` : o.freshness);

    if (o.country) p.set("country", o.country.toUpperCase());
    const { data, left } = await call(`https://api.search.brave.com/res/v1/web/search?${p}`, { headers: jsonHeaders("X-Subscription-Token", k) }, SEARCH_TIMEOUT_MS, s);
    const hits = (data.web?.results ?? []).map((r: any) => ({ title: r.title ?? r.url, url: r.url, snippet: htmlToMarkdown(r.description ?? ""), age: r.age ?? r.page_age }));

    return { hits, left };
  },
  async parallel(q, o, k, s) {
    const advanced: Record<string, unknown> = { max_results: o.n };

    if (o.country) advanced.location = o.country.toLowerCase();

    if (o.freshness) advanced.source_policy = { after_date: o.freshness.match(RANGE)?.[1] ?? daysAgo(DAYS[o.freshness]) };
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
      p.set("recency_minutes", String(DAYS[o.freshness] * 1440));
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

export function isPrivate(ip: string): boolean {
  const family = isIP(ip);

  return family !== 0 && PRIVATE.check(ip, family === 6 ? "ipv6" : "ipv4");
}

export async function checkPublic(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new StopChain("only http and https links are allowed");
  const addresses = await lookup(url.hostname, { all: true });

  if (addresses.some((a) => isPrivate(a.address))) throw new StopChain("local and private network addresses are blocked");
}

const CHALLENGE = /just a moment|enable javascript|cf-browser-verification|checking your browser|attention required/i;

// Length alone is not a challenge. A short real page must not spend an extractor call.
export function needsExtractor(text: string): boolean {
  const t = text.trim();

  if (!t) return true;

  return t.length < 2500 && CHALLENGE.test(t);
}

// Leaving the loop early (throw) cancels the stream, so the rest is never downloaded.
export async function readCapped(res: Response, max = MAX_BYTES): Promise<string> {
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

export function htmlToMarkdown(html: string): string {
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

export type WebDetails = {
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

export function previewOf(text: string): { preview: string[]; moreLines: number } {
  const lines = text.split("\n");

  return { preview: lines.slice(0, PREVIEW_LINES), moreLines: Math.max(0, lines.length - PREVIEW_LINES) };
}

// Pi's theme in the app; identity functions in tests.
export type Paint = { fg(color: string, s: string): string; bold(s: string): string; link(s: string, url: string): string };

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumSignificantDigits: 2 });

export function card(d: WebDetails, expanded: boolean, t: Paint): string {
  const isFetch = d.kind === "fetch";
  const tool = t.fg("toolTitle", t.bold(isFetch ? "web fetch" : "web search"));
  const subject = isFetch ? shortUrl(d.query) : clip(d.query, 80);

  const meta = (bits: string[]) => {
    const text = t.fg("dim", bits.join(" · "));

    return isFetch ? t.link(text, d.query) : text;
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
    lines.push(`${t.fg("dim", String(i + 1))}  ${t.link(t.fg("accent", h.title || shortUrl(h.url)), h.url)}`);
    lines.push(t.fg("dim", [shortUrl(h.url, 48), h.age].filter(Boolean).join(" · ")));

    if (h.snippet) lines.push(t.fg("muted", cleanSnippet(h.snippet, 140)));
  });

  for (const line of d.preview ?? []) lines.push(t.fg("toolOutput", line));

  if (d.moreLines) lines.push(t.fg("dim", `${d.moreLines} more lines`));

  return lines.join("\n");
}

export function searchText(hits: Hit[], via: string, content?: (string | null)[]): string {
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
  assertPublic?: (url: URL) => Promise<void>;
};

type Failed = { ok: false; message: string; details: WebDetails };

const aborted = (e: unknown, signal?: AbortSignal) => signal?.aborted || (e instanceof Error && e.name === "AbortError");

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
      attempts.push({ via: p, error: (e as Error).message });

      if (e instanceof StopChain) return undefined;
    }
  }

  return undefined;
}

export async function runSearch(query: string, o: Options, deps: RunDeps): Promise<{ ok: true; hits: Hit[]; via: Provider; left?: number; attempts: Attempt[] } | Failed> {
  const attempts: Attempt[] = [];

  const found = await firstOk(deps.order, deps, attempts, async (p, key) => {
    const r = await search[p](query, o, key, deps.signal);
    const hits = r.hits.filter((h) => h.url);

    return hits.length ? { hits, left: r.left } : undefined;
  });

  return found ? { ok: true, ...found.value, via: found.via, attempts } : failure("search", query, attempts);
}

async function directFetch(start: string, deps: RunDeps): Promise<string> {
  const assertPublic = deps.assertPublic ?? checkPublic;
  let url = new URL(start);

  for (let hop = 0; hop < 5; hop++) {
    await assertPublic(url);

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

export async function runFetch(url: string, deps: RunDeps): Promise<{ ok: true; page: string; via: string; attempts: Attempt[] } | Failed> {
  const attempts: Attempt[] = [];
  const extractors = deps.order.filter((p) => extract[p]);
  deps.onTry?.("direct");

  try {
    const page = (await directFetch(url, deps)).trim();

    if (page && (!needsExtractor(page) || !extractors.length)) return { ok: true, page, via: "direct", attempts };
    attempts.push({ via: "direct", error: page ? "challenge page" : "empty" });
  } catch (e) {
    if (aborted(e, deps.signal)) throw e;
    attempts.push({ via: "direct", error: (e as Error).message });

    if (e instanceof StopChain) return failure("fetch", url, attempts);
  }

  const found = await firstOk(extractors, deps, attempts, async (p, key) => (await extract[p]!(url, key, deps.signal)).trim() || undefined);

  return found ? { ok: true, page: found.value, via: found.via, attempts } : failure("fetch", url, attempts);
}
