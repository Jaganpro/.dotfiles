import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import {
  card,
  checkPublic,
  htmlToMarkdown,
  isPrivate,
  needsExtractor,
  readCapped,
  runFetch,
  runSearch,
  StopChain,
  validFreshness,
  type Provider,
} from "./lib.ts";

const key = async () => "test-key";
const plain = { fg: (_: string, s: string) => s, bold: (s: string) => s, link: (s: string) => s };
const stubFetch = (impl: (input: string | URL | Request, init?: RequestInit) => Promise<Response>) => mock.method(globalThis, "fetch", impl);

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

afterEach(() => {
  mock.restoreAll();
  mock.timers.reset();
});

test("html keeps the article and drops chrome", () => {
  const html = "<html><head><script>evil()</script></head><body><nav>Home</nav><article><h1>Hello</h1><p>World</p></article></body></html>";
  assert.equal(htmlToMarkdown(html), "# Hello\n\nWorld");
});

test("private addresses are refused and public ones are not", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "169.254.169.254", "192.168.0.8", "172.31.0.1", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1"]) {
    assert.equal(isPrivate(ip), true, ip);
  }

  for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700::1111", "public.test"]) assert.equal(isPrivate(ip), false, ip);
});

test("a short real page is kept; a challenge page is not", () => {
  assert.equal(needsExtractor(""), true);
  assert.equal(needsExtractor("OK"), false);
  assert.equal(needsExtractor("Just a moment..."), true);
  assert.equal(needsExtractor(`${"enable javascript ".repeat(200)}and then a long article`), false);
});

test("freshness and country reach every provider", async () => {
  mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-22T12:00:00Z") });
  const seen: { url: string; body?: any }[] = [];
  stubFetch(async (input, init) => {
    seen.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : undefined });

    return new Response("slow down", { status: 429 });
  });
  await runSearch("q", { n: 3, freshness: "day", country: "gb" }, { order: ["brave", "parallel", "tinyfish"], key });
  assert.match(seen[0].url, /freshness=pd/);
  assert.match(seen[0].url, /country=GB/);
  assert.equal(seen[1].body.advanced_settings.location, "gb");
  assert.equal(seen[1].body.advanced_settings.source_policy.after_date, "2026-10-21");
  assert.match(seen[2].url, /location=GB/);
  assert.match(seen[2].url, /recency_minutes=1440/);

  seen.length = 0;
  await runSearch("q", { n: 1, freshness: "2026-01-01to2026-06-01" }, { order: ["tinyfish"], key });
  assert.match(seen[0].url, /after_date=2026-01-01&before_date=2026-06-01/);

  assert.equal(validFreshness("week"), true);
  assert.equal(validFreshness("2026-01-01to2026-06-01"), true);
  assert.equal(validFreshness("hour"), false);
});

test("chunked bodies stop at the size cap", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(100));
      controller.enqueue(new Uint8Array(100));
      controller.close();
    },
  });

  await assert.rejects(() => readCapped(new Response(stream), 150), /page too large/);
  assert.equal(await readCapped(new Response("ok"), 10), "ok");
});

test("a rejected key stops the chain; a quota error tries the next provider", async () => {
  const seen: string[] = [];
  stubFetch(async (input) => {
    seen.push(String(input));

    return new Response("no", { status: 401 });
  });
  const rejected = await runSearch("q", { n: 1 }, { order: ["brave", "parallel"], key });
  assert.equal(rejected.ok, false);
  assert.equal(seen.length, 1);

  if (!rejected.ok) assert.match(rejected.message, /key rejected/);

  seen.length = 0;
  stubFetch(async (input) => {
    seen.push(String(input));

    if (String(input).includes("brave")) return new Response("slow down", { status: 429 });

    return json({ results: [{ title: "Hit", url: "https://example.com/a", excerpts: ["snippet"] }] });
  });
  const fell = await runSearch("q", { n: 1 }, { order: ["brave", "parallel"], key });
  assert.equal(fell.ok && fell.via, "parallel");
  assert.equal(seen.length, 2);
});

test("recorded Brave response maps hits and the monthly remaining count", async () => {
  stubFetch(async () =>
    json(
      { web: { results: [{ title: "Tool rendering", url: "https://docs.example/extensions", description: "A tool's <b>renderCall</b>", age: "2 days ago" }] } },
      200,
      { "x-ratelimit-remaining": "0, 14523" },
    ),
  );
  const result = await runSearch("pi", { n: 2 }, { order: ["brave"], key });
  assert.equal(result.ok, true);

  if (!result.ok) return;
  assert.equal(result.hits[0].snippet, "A tool's renderCall");
  assert.equal(result.left, 14523);
});

test("the card names the service and remaining calls; a failure lists attempts", () => {
  const hits = [{ title: "Tool rendering", url: "https://docs.example/extensions", snippet: "draw its calls", age: "2d" }];
  assert.equal(card({ kind: "search", query: "pi tool rendering", via: "brave", hits, left: 14523 }, false, plain), "web search  brave · 14,523 left\npi tool rendering · 1 result");
  assert.equal(
    card({ kind: "search", query: "pi tool rendering", via: "parallel", hits }, true, plain),
    "web search  parallel\npi tool rendering · 1 result\n1  Tool rendering\ndocs.example/extensions · 2d\ndraw its calls",
  );
  const failed = { kind: "fetch" as const, query: "https://example.invalid/missing", failed: true, attempts: [{ via: "direct", error: "HTTP 404" }, { via: "tinyfish", error: "page_not_found" }] };
  assert.equal(card(failed, false, plain), "web fetch  failed\nexample.invalid/missing\ndirect HTTP 404 · tinyfish page_not_found");
});

test("a short page is not sent to an extractor; a challenge page is", async () => {
  let extracts = 0;
  stubFetch(async (input) => {
    if (String(input).includes("parallel")) extracts++;

    return new Response("<html><body><p>OK</p></body></html>", { headers: { "content-type": "text/html" } });
  });
  const ok = await runFetch("https://example.com/short", { order: ["parallel"], key, assertPublic: async () => {} });
  assert.equal(ok.ok && ok.via, "direct");
  assert.equal(extracts, 0);

  stubFetch(async (input) => {
    if (String(input).includes("parallel")) {
      extracts++;

      return json({ results: [{ full_content: "The real article text." }] });
    }

    return new Response("<html><title>Just a moment...</title><body>Checking your browser</body></html>", { headers: { "content-type": "text/html" } });
  });
  const challenged = await runFetch("https://example.com/wall", { order: ["parallel"], key, assertPublic: async () => {} });
  assert.equal(challenged.ok && challenged.via, "parallel");

  if (challenged.ok) assert.match(challenged.page, /real article/);
  assert.equal(extracts, 1);
});

test("a redirect onto a private address is refused before the body is read", async () => {
  const seen: string[] = [];
  stubFetch(async () => new Response(null, { status: 302, headers: { location: "http://127.0.0.1/secret" } }));

  const result = await runFetch("http://public.test/start", {
    order: ["tinyfish"],
    key,
    assertPublic: async (url) => {
      seen.push(url.hostname);

      if (isPrivate(url.hostname)) throw new StopChain("local and private network addresses are blocked");
    },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(seen, ["public.test", "127.0.0.1"]);

  if (!result.ok) {
    assert.match(result.message, /private/);
    assert.equal(result.message.includes("tinyfish"), false);
  }
});

test("login walls and local addresses do not spend an extractor call", async () => {
  let calls = 0;
  stubFetch(async () => {
    calls++;

    return new Response("no", { status: 401, headers: { "content-type": "text/html" } });
  });
  const login = await runFetch("https://example.com/private", { order: ["tinyfish"], key, assertPublic: async () => {} });
  assert.equal(login.ok, false);
  assert.equal(calls, 1);

  if (!login.ok) assert.match(login.message, /HTTP 401/);

  calls = 0;
  const local = await runFetch("http://127.0.0.1/", { order: ["parallel", "tinyfish"], key });
  assert.equal(local.ok, false);
  assert.equal(calls, 0);

  if (!local.ok) assert.match(local.message, /private/);
});

test("checkPublic refuses a file URL", async () => {
  await assert.rejects(() => checkPublic(new URL("file:///etc/passwd")), /only http/);
});

test("live corpus", { skip: process.env.WEB_LIVE !== "1", timeout: 400_000 }, async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);

  const liveKey = async (p: Provider) => {
    try {
      const { stdout } = await run("security", ["find-generic-password", "-s", `web-${p}`, "-w"]);

      return stdout.trim() || null;
    } catch {
      return null;
    }
  };

  const real = globalThis.fetch;
  let providerCalls = 0;
  stubFetch(async (input, init) => {
    if (/api\.search\.brave\.com|api\.parallel\.ai|api\.(search|fetch)\.tinyfish\.ai/.test(String(input)) && ++providerCalls > 8) throw new Error("live budget exceeded");

    return real(input, init);
  });
  const order: Provider[] = ["brave", "parallel", "tinyfish"];
  const search = await runSearch("pi coding agent extensions", { n: 2, country: "us" }, { order, key: liveKey });
  assert.equal(search.ok, true, search.ok ? "" : search.message);

  if (search.ok && search.via === "brave") assert.equal(typeof search.left, "number");
  const fresh = await runSearch("web search api", { n: 1, freshness: "day", country: "gb" }, { order, key: liveKey });
  assert.equal(fresh.ok, true, fresh.ok ? "" : fresh.message);
  const page = await runFetch("https://example.com", { order, key: liveKey });
  assert.equal(page.ok && page.via, "direct");
  const gh = await runFetch("https://api.github.com/repos/nodejs/node", { order, key: liveKey });

  if (gh.ok) assert.match(gh.page, /"full_name"/);
  else assert.fail(gh.message);
  const docs = await runFetch("https://docs.parallel.ai/getting-started/rate-limits", { order, key: liveKey });
  assert.equal(docs.ok, true, docs.ok ? "" : docs.message);
  assert.ok(providerCalls <= 8, `spent ${providerCalls} provider calls`);
});
