// /annotate and /review: review Pi's newest reply (plannotator-tui) or code changes (tuicr)
// in a Ghostty split next to Pi, via ~/.local/bin/annotate and review (both use beside).
// The feedback is typed back into Pi when the split closes. Each script prints the keys to
// use as a hint, shown here when the split opens.
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Exit 0 means the split opened, 2 means there was nothing to review, anything else failed.
  const run = async (script: string, args: string[], ctx: ExtensionContext) => {
    const result = await pi.exec(`${process.env.HOME}/.local/bin/${script}`, args, { cwd: ctx.cwd });

    if (result.code === 0) ctx.ui.notify(result.stdout.trim(), "info");
    else ctx.ui.notify(result.stderr.trim() || `${script} failed`, result.code === 2 ? "warning" : "error");
  };

  pi.registerCommand("annotate", {
    description: "Review Pi's newest reply (or a .md file) in a Ghostty split; S sends feedback here",
    handler: async (args, ctx) => {
      const file = args.trim();
      const session = ctx.sessionManager.getSessionFile();
      const target = file ? [file] : session ? ["last", "--host", "pi", "--newest", "--session", session] : undefined;

      // No session file means `pi --no-session`; without --session, plannotator would pick another session's reply.
      if (!target) return ctx.ui.notify("Nothing to annotate: this session isn't saved (--no-session).", "warning");

      await run("annotate", target, ctx);
    },
  });

  pi.registerCommand("review", {
    description: "Review uncommitted changes with tuicr in a Ghostty split (or tuicr args: -r main..HEAD, --file src/)",
    // shortcut: splits on spaces, so a path with spaces won't work; add quoting if that comes up
    handler: (args, ctx) => run("review", args.split(/\s+/).filter(Boolean), ctx),
  });
}
