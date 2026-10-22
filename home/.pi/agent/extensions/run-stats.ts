// After each agent run, shows generation speed and token use in one line, e.g.
// "⚡ 42 tokens/sec · ⏱ 30s · ✍️ 1.3k written · 📖 8.4k read · 💾 95k from cache".
// Speed is written tokens over wall-clock run time, so tool time is included.
// Own work: clean-room rewrite from a behaviour description (2026-10-21).
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// 950 -> "950", 1250 -> "1.3k", 95000 -> "95k", 1200000 -> "1.2M"; round first so 9999 -> "10k"
export const tokens = (n: number) => {
  const tenths = Math.round(n / 100) / 10;
  const thousands = Math.round(n / 1000);

  if (n < 1000) return `${n}`;

  if (tenths < 10) return `${tenths}k`;

  if (thousands < 1000) return `${thousands}k`;

  return `${Math.round(n / 100_000) / 10}M`;
};

// 30 -> "30s", 90 -> "1m 30s", 119.6 -> "2m 0s"
export const duration = (seconds: number) => {
  const s = Math.round(seconds);

  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

export default function (pi: ExtensionAPI) {
  let startedAt: number | undefined;

  pi.on("agent_start", () => {
    startedAt = Date.now();
  });

  pi.on("agent_end", (event, ctx) => {
    const start = startedAt;

    startedAt = undefined;

    if (!ctx.hasUI || start === undefined) return;

    const elapsed = (Date.now() - start) / 1000;
    let written = 0;
    let read = 0;
    let cache = 0;

    for (const message of event.messages) {
      if (message.role !== "assistant" || !message.usage) continue;

      written += message.usage.output ?? 0;
      read += message.usage.input ?? 0;
      cache += message.usage.cacheRead ?? 0;
    }

    if (written === 0 || elapsed <= 0) return;

    const parts = [
      `⚡ ${Math.round(written / elapsed)} tokens/sec`,
      `⏱ ${duration(elapsed)}`,
      `✍️ ${tokens(written)} written`,
      `📖 ${tokens(read)} read`,
    ];

    if (cache > 0) parts.push(`💾 ${tokens(cache)} from cache`);

    ctx.ui.notify(parts.join(" · "), "info");
  });
}
