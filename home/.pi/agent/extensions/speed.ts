// After each Pi run, show speed and token use in one readable line:
//   ⚡ 42 tokens/sec · ⏱ 30s · ✍️ 1.3k written · 📖 8.4k read · 💾 95k from cache
// Speed covers the whole run, including time spent running tools.
// Adapted from earendil-works/pi .pi/extensions/tps.ts (MIT, Copyright (c) 2025
// Mario Zechner); see third_party/earendil-works-pi.LICENSE.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// 950 -> "950", 1250 -> "1.3k", 95000 -> "95k", 1200000 -> "1.2M"
const short = (n: number) => {
  if (n < 1000) return `${n}`;
  if (n < 10_000) return `${+(n / 1000).toFixed(1)}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${+(n / 1_000_000).toFixed(1)}M`;
};

// 30 -> "30s", 90 -> "1m 30s"
const duration = (s: number) =>
  s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;

export default function (pi: ExtensionAPI) {
  let startedAt = 0;

  pi.on("agent_start", () => {
    startedAt = Date.now();
  });

  pi.on("agent_end", (event, ctx) => {
    if (!ctx.hasUI || !startedAt) return;
    const seconds = (Date.now() - startedAt) / 1000;
    startedAt = 0;

    let written = 0, read = 0, cached = 0;
    for (const m of event.messages as any[]) {
      if (m?.role !== "assistant" || !m.usage) continue;
      written += m.usage.output || 0;
      read += m.usage.input || 0;
      cached += m.usage.cacheRead || 0;
    }
    if (written === 0 || seconds <= 0) return;

    const parts = [
      `⚡ ${Math.round(written / seconds)} tokens/sec`,
      `⏱ ${duration(seconds)}`,
      `✍️ ${short(written)} written`,
      `📖 ${short(read)} read`,
    ];
    if (cached > 0) parts.push(`💾 ${short(cached)} from cache`);
    ctx.ui.notify(parts.join(" · "), "info");
  });
}
