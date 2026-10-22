// muscle-memory: the Claude Code commands your fingers know work in Pi too:
// /clear /exit /context /rename /effort
// Inspired by xRyul/pi-aliases (https://github.com/xRyul/pi-aliases).
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Level = Parameters<ExtensionAPI["setThinkingLevel"]>[0];

const LEVELS: Level[] = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];

// 620000 -> "620k", 1000000 -> "1M"
const short = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : `${Math.round(n / 1000)}k`;

export default function (pi: ExtensionAPI) {
  pi.registerCommand("clear", {
    description: "→ /new · Start a new session",
    handler: async (_args, ctx) => {
      await ctx.newSession();
    },
  });

  pi.registerCommand("exit", {
    description: "→ /quit · Exit pi",
    handler: async (_args, ctx) => ctx.shutdown(),
  });

  pi.registerCommand("context", {
    description: "Show how full the context window is",
    handler: async (_args, ctx) => {
      const usage = ctx.getContextUsage();

      if (!usage || usage.tokens === null) {
        return ctx.ui.notify("Context usage isn't known yet. Send a message first.");
      }

      ctx.ui.notify(
        `Context: ${Math.round(usage.percent ?? 0)}% · ${short(usage.tokens)} of ${short(usage.contextWindow)} tokens`,
      );
    },
  });

  pi.registerCommand("rename", {
    description: "→ /name · Rename this session",
    handler: async (args, ctx) => {
      const name = args.trim();

      if (!name) return ctx.ui.notify(`Session name: ${pi.getSessionName() ?? "(none)"}`);
      pi.setSessionName(name);
      ctx.ui.notify(`Session renamed to: ${name}`);
    },
  });

  pi.registerCommand("effort", {
    description: `→ /thinking · Set thinking effort (${LEVELS.join(", ")})`,
    getArgumentCompletions: (prefix) =>
      LEVELS.values().filter((l) => l.startsWith(prefix)).map((l) => ({ value: l, label: l })).toArray(),
    handler: async (args, ctx) => {
      const input = args.trim().toLowerCase();
      const level = LEVELS.find((l) => l === input);

      if (!input) return ctx.ui.notify(`Effort: ${pi.getThinkingLevel()}`);

      if (!level) {
        return ctx.ui.notify(`Unknown level "${input}". Use: ${LEVELS.join(", ")}`, "warning");
      }

      pi.setThinkingLevel(level);
      ctx.ui.notify(`Effort set to ${level}`);
    },
  });
}
