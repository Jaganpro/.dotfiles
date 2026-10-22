// /annotate: review Pi's newest reply (or `/annotate plan.md`) with plannotator-tui in a
// Ghostty split next to Pi, via ~/.local/bin/annotate. In the split: annotate, E copies
// the feedback, q closes it; then paste it here.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("annotate", {
    description: "Review Pi's newest reply (or a .md file) in a Ghostty split",
    handler: async (args, ctx) => {
      const file = args.trim();
      const session = ctx.sessionManager.getSessionFile();
      const target = file ? [file] : ["last", "--host", "pi", "--newest", ...(session ? ["--session", session] : [])];
      const result = await pi.exec(`${process.env.HOME}/.local/bin/annotate`, target, { cwd: ctx.cwd });

      if (result.code !== 0) ctx.ui.notify(result.stderr.trim() || "annotate failed", "error");
    },
  });
}
