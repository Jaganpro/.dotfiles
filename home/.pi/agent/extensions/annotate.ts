// /annotate: review Pi's newest reply (or `/annotate plan.md`) with plannotator-tui in a
// Ghostty split next to Pi, via ~/.local/bin/annotate. In the split: annotate, then S sends
// the feedback here and closes it. The script prints that hint, shown here on open.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("annotate", {
    description: "Review Pi's newest reply (or a .md file) in a Ghostty split; S sends feedback here",
    handler: async (args, ctx) => {
      const file = args.trim();
      const session = ctx.sessionManager.getSessionFile();
      const target = file ? [file] : session ? ["last", "--host", "pi", "--newest", "--session", session] : undefined;

      // No session file means `pi --no-session`; without --session, plannotator would pick another session's reply.
      if (!target) return ctx.ui.notify("Nothing to annotate: this session isn't saved (--no-session).", "warning");

      const result = await pi.exec(`${process.env.HOME}/.local/bin/annotate`, target, { cwd: ctx.cwd });

      // Exit 2 means there was nothing to review; anything else non-zero is a real failure.
      if (result.code === 0) ctx.ui.notify(result.stdout.trim(), "info");
      else ctx.ui.notify(result.stderr.trim() || "annotate failed", result.code === 2 ? "warning" : "error");
    },
  });
}
