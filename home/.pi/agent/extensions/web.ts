// web: web_search and web_fetch tools for Pi, with free tiers first.
//   Search: Brave → Parallel → TinyFish (override with WEB_SEARCH_ORDER). Providers
//           without a key are skipped; a failure or quota error moves to the next.
//           Options: freshness (day/week/month/year or a date range), country
//           (default US, or WEB_SEARCH_COUNTRY), and
//           content (also read the top pages).
//   Fetch:  a direct download first (free), then Parallel → TinyFish for pages that
//           block plain requests or need JavaScript. Pages come back as Markdown.
// Keys: macOS Keychain (web-brave, web-parallel, web-tinyfish) or BRAVE_API_KEY,
// PARALLEL_API_KEY, TINYFISH_API_KEY. /web shows which keys are found.
// Ideas from badlogic/pi-skills (brave-search), tian.zuo/pi-web-search,
// dmmulroy/pi-web-tools and pi-lab/websearch.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type Provider = "brave" | "parallel" | "tinyfish";
type Hit = { title: string; url: string; snippet: string; age?: string };
type Options = { n: number; freshness?: string; country?: string };

const PROVIDERS: Provider[] = ["brave", "parallel", "tinyfish"];
const ENV_KEY: Record<Provider, string> = { brave: "BRAVE_API_KEY", parallel: "PARALLEL_API_KEY", tinyfish: "TINYFISH_API_KEY" };
const FRESHNESS: Record<string, string> = { day: "pd", week: "pw", month: "pm", year: "py" };
const DEFAULT_COUNTRY = process.env.WEB_SEARCH_COUNTRY ?? "US";
const TIMEOUT_MS = 15_000; // direct page downloads
const PROVIDER_TIMEOUT_MS = 45_000; // provider APIs (page extraction can be slow)
const MAX_CHARS = 20_000; // page text returned by web_fetch
const CONTENT_CHARS = 3_000; // per page when web_search reads the top results
const CONTENT_PAGES = 3;
const MAX_BYTES = 5_000_000; // largest page downloaded directly

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }], details: {} });
const cut = (s: string, max: number) => (s.length > max ? `${s.slice(0, max)}\n[cut at ${max} of ${s.length} characters]` : s);

// Order from WEB_SEARCH_ORDER, e.g. "brave,parallel,tinyfish"
const order = (): Provider[] =>
  (process.env.WEB_SEARCH_ORDER ?? PROVIDERS.join(","))
    .split(",")
    .map((p) => p.trim())
    .filter((p): p is Provider => PROVIDERS.includes(p as Provider));

async function call(url: string, init: RequestInit, signal?: AbortSignal): Promise<any> {
  const timeout = AbortSignal.timeout(PROVIDER_TIMEOUT_MS);
  const res = await fetch(url, { ...init, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!res.ok) throw new Error(`HTTP ${res.status}${[402, 403, 429].includes(res.status) ? " (quota or rate limit)" : ""}`);
  return res.json();
}

const headers = (header: string, k: string) => ({ [header]: k, "Content-Type": "application/json", Accept: "application/json" });

// Freshness and country are Brave features; the others search without them
const search: Record<Provider, (q: string, o: Options, k: string, s?: AbortSignal) => Promise<Hit[]>> = {
  async brave(q, o, k, s) {
    const p = new URLSearchParams({ q, count: String(o.n) });
    if (o.freshness) p.set("freshness", FRESHNESS[o.freshness] ?? o.freshness);
    if (o.country) p.set("country", o.country.toUpperCase());
    const data = await call(`https://api.search.brave.com/res/v1/web/search?${p}`, { headers: headers("X-Subscription-Token", k) }, s);
    return (data.web?.results ?? []).map((r: any) => ({ title: r.title, url: r.url, snippet: htmlToMarkdown(r.description ?? ""), age: r.age ?? r.page_age }));
  },
  async parallel(q, o, k, s) {
    const body = JSON.stringify({ objective: q, search_queries: [q], mode: "fast", advanced_settings: { max_results: o.n } });
    const data = await call("https://api.parallel.ai/v1/search", { method: "POST", headers: headers("x-api-key", k), body }, s);
    return (data.results ?? []).map((r: any) => ({ title: r.title ?? r.url, url: r.url, snippet: (r.excerpts ?? []).join(" … "), age: r.publish_date }));
  },
  async tinyfish(q, o, k, s) {
    const data = await call(`https://api.search.tinyfish.ai?query=${encodeURIComponent(q)}`, { headers: headers("X-API-Key", k) }, s);
    return (data.results ?? []).slice(0, o.n).map((r: any) => ({ title: r.title ?? r.url, url: r.url, snippet: r.snippet ?? "" }));
  },
};

// Providers that can read a page for us (Brave can't)
const extract: Partial<Record<Provider, (url: string, k: string, s?: AbortSignal) => Promise<string>>> = {
  async parallel(url, k, s) {
    const body = JSON.stringify({ urls: [url], advanced_settings: { full_content: true } });
    const data = await call("https://api.parallel.ai/v1/extract", { method: "POST", headers: headers("x-api-key", k), body }, s);
    return data.results?.[0]?.full_content ?? "";
  },
  async tinyfish(url, k, s) {
    const data = await call("https://api.fetch.tinyfish.ai", { method: "POST", headers: headers("X-API-Key", k), body: JSON.stringify({ urls: [url], format: "markdown" }) }, s);
    if (data.errors?.length) throw new Error(data.errors[0].error);
    return data.results?.[0]?.text ?? "";
  },
};

// Only public internet addresses: never localhost or the home network
function isPrivate(ip: string): boolean {
  if (isIP(ip) === 6) return /^(::1?$|f[cd]|fe80|::ffff:(127|10|192\.168|169\.254)\.)/i.test(ip);
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

async function checkPublic(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("only http and https links are allowed");
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some((a) => isPrivate(a.address))) throw new Error("local and private network addresses are blocked");
}

// Download a page ourselves, checking every redirect hop
async function directFetch(start: string, signal?: AbortSignal): Promise<string> {
  let url = new URL(start);
  for (let hop = 0; hop < 5; hop++) {
    await checkPublic(url);
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) pi-web", Accept: "text/html,text/plain,*/*" },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    const next = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && next) { url = new URL(next, url); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("page too large");
    const type = res.headers.get("content-type") ?? "";
    if (!/text|json|xml/.test(type)) throw new Error(`unsupported content type ${type}`);
    const body = await res.text();
    return /html/.test(type) ? htmlToMarkdown(body) : body;
  }
  throw new Error("too many redirects");
}

const decode = (s: string) =>
  s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, "&");

// Good-enough HTML to Markdown without dependencies: keep the main content,
// drop page chrome, keep headings, lists and code blocks
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

export default function (pi: ExtensionAPI) {
  // A key from the environment, else the macOS Keychain (never stored in files)
  async function key(p: Provider): Promise<string | null> {
    if (process.env[ENV_KEY[p]]) return process.env[ENV_KEY[p]]!;
    const r = await pi.exec("security", ["find-generic-password", "-s", `web-${p}`, "-w"]).catch(() => null);
    return r?.code === 0 && r.stdout.trim() ? r.stdout.trim() : null;
  }

  // Read a page: direct download first, then the providers that can extract pages
  async function readPage(url: string, signal?: AbortSignal): Promise<{ page: string; via: string }> {
    const failures: string[] = [];
    const attempts: [string, () => Promise<string>][] = [["direct", () => directFetch(url, signal)]];
    for (const p of order()) {
      const run = extract[p];
      const k = run ? await key(p) : null;
      if (run && k) attempts.push([p, () => run(url, k, signal)]);
    }
    for (const [via, run] of attempts) {
      try {
        const page = (await run()).trim();
        // Very little text usually means the page needs JavaScript; try a provider
        if (page.length < 200 && via === "direct" && attempts.length > 1) { failures.push("direct: too little text"); continue; }
        if (page) return { page, via };
        failures.push(`${via}: empty`);
      } catch (e) {
        failures.push(`${via}: ${(e as Error).message}`);
        if (/blocked|only http/.test((e as Error).message)) break; // never retry a refused address elsewhere
      }
    }
    throw new Error(`Could not read ${url}. ${failures.join("; ")}`);
  }

  pi.registerTool({
    name: "web_search",
    label: "Web search",
    description: "Search the web; returns titles, URLs, snippets and age, optionally with page text.",
    parameters: Type.Object({
      query: Type.String({ description: "What to search for" }),
      count: Type.Optional(Type.Number({ description: "Number of results, 1-10 (default 5)" })),
      freshness: Type.Optional(Type.String({ description: "day, week, month, year, or YYYY-MM-DDtoYYYY-MM-DD" })),
      country: Type.Optional(Type.String({ description: "Two-letter country code (default US)" })),
      content: Type.Optional(Type.Boolean({ description: "Also read the top 3 pages (slower)" })),
    }),
    async execute(_id, { query, count, freshness, country, content }, signal) {
      const o: Options = { n: Math.min(Math.max(Math.round(count ?? 5), 1), 10), freshness, country: country ?? DEFAULT_COUNTRY };
      const failures: string[] = [];
      for (const p of order()) {
        const k = await key(p);
        if (!k) continue;
        let hits: Hit[];
        try {
          hits = (await search[p](query, o, k, signal)).filter((h) => h.url);
        } catch (e) {
          failures.push(`${p}: ${(e as Error).message}`);
          continue;
        }
        if (hits.length === 0) { failures.push(`${p}: no results`); continue; }

        const pages = content
          ? await Promise.allSettled(hits.slice(0, CONTENT_PAGES).map((h) => readPage(h.url, signal)))
          : [];
        const list = hits.map((h, i) => {
          const page = pages[i];
          const body = !page ? "" : page.status === "fulfilled" ? `\n   Content:\n${cut(page.value.page, CONTENT_CHARS)}` : "\n   Content: (could not read)";
          // One clean line per result: link text instead of [text](url), no table markup
          const snippet = h.snippet.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\|?\s*-{3,}\s*\|?|\|/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
          return `${i + 1}. ${h.title}${h.age ? ` (${h.age})` : ""}\n   ${h.url}\n   ${snippet}${body}`;
        });
        const note = p !== "brave" && (freshness || country) ? ", freshness/country not applied" : "";
        return text(`${list.join("\n\n")}\n\n(via ${p}${note})`);
      }
      throw new Error(failures.length ? `Web search failed. ${failures.join("; ")}` : "No web search key found. Run /web for setup.");
    },
  });

  pi.registerTool({
    name: "web_fetch",
    label: "Web fetch",
    description: "Read a public web page and return its main text as Markdown.",
    parameters: Type.Object({ url: Type.String({ description: "http or https URL" }) }),
    async execute(_id, { url }, signal) {
      const { page, via } = await readPage(url, signal);
      return text(`${cut(page, MAX_CHARS)}\n\n(via ${via})`);
    },
  });

  pi.registerCommand("web", {
    description: "Show web search keys and provider order",
    handler: async (_args, ctx) => {
      const status = [];
      for (const p of order()) status.push(`${(await key(p)) ? "✓" : "✗"} ${p}`);
      ctx.ui.notify(
        `Search order: ${status.join("  ")}\n` +
          `Add a key (hidden prompt): security add-generic-password -s web-<provider> -a "$USER" -w`,
      );
    },
  });
}
