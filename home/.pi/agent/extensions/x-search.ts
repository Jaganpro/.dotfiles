// x-search: x_search for Pi, Grok searching X with your SuperGrok / X Premium login.
// Auth comes from Pi's own xai login (/login xai → Use a subscription) or XAI_API_KEY;
// this file never reads auth.json. One POST to xAI's Responses API per call.
// Model: X_SEARCH_MODEL, default grok-4.7. /x shows login and model.
// Clean-room: written from docs.x.ai (X Search) and Pi's extension docs.
import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { type Component, Text, hyperlink } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const URL_ = "https://api.x.ai/v1/responses";
const MODEL = process.env.X_SEARCH_MODEL ?? "grok-4.7";
const TIMEOUT_MS = 180_000;
const MAX_HANDLES = 20;
const LOGIN_HINT = "Run /login xai → Use a subscription (or set XAI_API_KEY).";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type XDetails = { query: string; model: string; posts: string[]; failed?: boolean };

type Answer = { text: string; posts: string[] };

const handles = (list?: string[]) => [...new Set((list ?? []).map((h) => h.trim().replace(/^@/, "")).filter(Boolean))];

// Checks the request before spending a call. Returns an error message or undefined.
export function invalid(a: { handles?: string[]; exclude_handles?: string[]; from?: string; to?: string }): string | undefined {
  const inc = handles(a.handles);
  const exc = handles(a.exclude_handles);

  if (inc.length && exc.length) return "Use handles or exclude_handles, not both.";

  if (inc.length > MAX_HANDLES || exc.length > MAX_HANDLES) return `At most ${MAX_HANDLES} handles.`;

  for (const [name, d] of [["from", a.from], ["to", a.to]] as const) {
    if (d && (!DATE.test(d) || new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) !== d)) return `${name} must be a real date in YYYY-MM-DD.`;
  }

  if (a.from && a.to && a.from >= a.to) return "from must be before to (to is not included).";

  return undefined;
}

// Answer text and cited links from a Responses API payload.
export function parse(data: any): Answer {
  const parts: string[] = [];
  const urls: string[] = [];

  for (const item of data?.output ?? []) {
    if (item?.type !== "message") continue;

    for (const c of item.content ?? []) {
      if (c?.type === "output_text" && c.text) parts.push(c.text);

      for (const a of c?.annotations ?? []) if (a?.type === "url_citation" && a.url) urls.push(a.url);
    }
  }

  // Top-level citations are plain URL strings in xAI's docs; accept { url } too.
  for (const c of data?.citations ?? []) urls.push(c?.url ?? c);

  return { text: parts.join("\n\n").trim(), posts: [...new Set(urls.filter(Boolean))] };
}

function card(d: XDetails, expanded: boolean, t: Theme): string {
  const head = `${t.fg("toolTitle", t.bold("x search"))}  ${t.fg(d.failed ? "error" : "accent", d.failed ? "failed" : d.model)}`;
  const n = d.posts.length;
  const meta = t.fg("dim", [d.query.replace(/\s+/g, " ").slice(0, 80), d.failed ? "" : `${n} post${n === 1 ? "" : "s"} cited`].filter(Boolean).join(" · "));
  const lines = [head, meta];

  if (expanded) d.posts.forEach((u, i) => lines.push(`${t.fg("dim", String(i + 1))}  ${hyperlink(t.fg("accent", u.replace(/^https?:\/\/(www\.)?/, "")), u)}`));

  return lines.join("\n");
}

function textOf(last: Component | undefined, value: string) {
  const c = last instanceof Text ? last : new Text("", 0, 0);
  c.setText(value);

  return c;
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "x_search",
    label: "X search",
    description:
      "Search X (Twitter) with Grok: posts, people, threads, reactions. Returns Grok's answer with links to the posts it cited. Uses the user's xAI subscription.",
    parameters: Type.Object({
      query: Type.String({ description: "What to find or ask about on X" }),
      handles: Type.Optional(Type.Array(Type.String(), { description: `Only posts from these handles (max ${MAX_HANDLES})` })),
      exclude_handles: Type.Optional(Type.Array(Type.String(), { description: `Skip posts from these handles (max ${MAX_HANDLES}); not with handles` })),
      from: Type.Optional(Type.String({ description: "Start date YYYY-MM-DD (included)" })),
      to: Type.Optional(Type.String({ description: "End date YYYY-MM-DD (NOT included: for one day, use the next day)" })),
      media: Type.Optional(Type.Boolean({ description: "Also look at images and videos in posts (slower, costs more)" })),
    }),
    renderCall: (args, theme, context) =>
      textOf(context.lastComponent, context.isPartial || context.durationMs !== undefined ? "" : `${theme.fg("toolTitle", theme.bold("x search"))}  ${theme.fg("dim", "…")}\n${theme.fg("dim", String(args?.query ?? "…").slice(0, 80))}`),
    renderResult: (result, { expanded }, theme, context) => {
      // SAFETY: details come from execute() below, or are empty when Pi reports a thrown error.
      const d = result.details as XDetails | undefined;
      const raw = result.content.find((c) => c.type === "text")?.text ?? "";

      return textOf(context.lastComponent, d?.query ? card(d, expanded, theme) : theme.fg("error", raw));
    },
    async execute(_id, args, signal, _onUpdate, ctx) {
      const fail = (text: string) => ({ content: [{ type: "text" as const, text }], details: { query: args.query, model: MODEL, posts: [], failed: true }, isError: true });
      const bad = invalid(args);

      if (bad) return fail(bad);

      const key = (await ctx.modelRegistry.getProviderAuth("xai"))?.auth.apiKey ?? process.env.XAI_API_KEY;

      if (!key) return fail(`Not logged in to xAI. ${LOGIN_HINT}`);

      const inc = handles(args.handles);
      const exc = handles(args.exclude_handles);

      // JSON.stringify drops the undefined fields
      const tool = {
        type: "x_search",
        allowed_x_handles: inc.length ? inc : undefined,
        excluded_x_handles: exc.length ? exc : undefined,
        from_date: args.from,
        to_date: args.to,
        enable_image_understanding: args.media || undefined,
        enable_video_understanding: args.media || undefined,
      };

      const res = await fetch(URL_, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, input: [{ role: "user", content: args.query }], tools: [tool], store: false }),
        signal: AbortSignal.any([AbortSignal.timeout(TIMEOUT_MS), ...(signal ? [signal] : [])]),
      });

      const data: any = await res.json().catch(() => ({}));

      if (!res.ok) {
        const why = data?.error?.message ?? data?.error ?? data?.message ?? "";
        const hint = res.status === 401 || res.status === 403 ? ` ${LOGIN_HINT} Some plans can't use the API.` : "";

        return fail(`xAI HTTP ${res.status}${why ? `: ${String(why).slice(0, 300)}` : ""}.${hint}`);
      }

      const { text, posts } = parse(data);
      const sources = posts.length ? `\n\nSources:\n${posts.map((u, i) => `${i + 1}. ${u}`).join("\n")}` : "\n\n(No posts cited: treat this answer as unverified.)";

      return { content: [{ type: "text", text: `${text || "(empty answer)"}${sources}` }], details: { query: args.query, model: MODEL, posts } };
    },
  });

  pi.registerCommand("x", {
    description: "Show X search login and model",
    handler: async (_args, ctx) => {
      const status = ctx.modelRegistry.getProviderAuthStatus("xai");
      const env = Boolean(process.env.XAI_API_KEY);
      const login = status.configured ? `logged in (${status.label ?? status.source ?? "xai"})` : env ? "XAI_API_KEY" : `not logged in. ${LOGIN_HINT}`;

      ctx.ui.notify(`login  ${login}\nmodel  ${MODEL}${process.env.X_SEARCH_MODEL ? " (X_SEARCH_MODEL)" : ""}`);
    },
  });
}
