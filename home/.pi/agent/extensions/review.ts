// /annotate and /review: review Pi's newest reply (plannotator-tui) or code changes (tuicr)
// full screen in Pi's own terminal, via ~/.local/bin/annotate and review. Pi hands the
// terminal over (as Ctrl+G does for the editor), takes it back when the review ends, and
// sends the feedback the script printed as your next message.
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const run = async (script: string, args: string[], ctx: ExtensionContext) => {
    // The review blocks Pi until it ends, so don't pause a run halfway.
    if (!ctx.isIdle()) return ctx.ui.notify("Pi is working; review when it's done.", "warning");

    const result = await ctx.ui.custom<SpawnSyncReturns<string>>((tui, _theme, _keybindings, done) => {
      tui.stop();

      // The review draws on the terminal (/dev/tty) and prints its feedback on stdout.
      const review = spawnSync(`${process.env.HOME}/.local/bin/${script}`, ["--feedback", ...args], {
        cwd: ctx.cwd,
        stdio: ["inherit", "pipe", "pipe"],
        encoding: "utf8",
      });

      tui.start();
      tui.requestRender(true);
      done(review);

      return { render: () => [], invalidate: () => {} };
    });

    // Exit 2 means there was nothing to review; anything else non-zero is a real failure.
    if (result.status !== 0) {
      return ctx.ui.notify(result.stderr.trim() || `${script} failed`, result.status === 2 ? "warning" : "error");
    }

    const feedback = result.stdout.trim();

    if (feedback) pi.sendUserMessage(feedback);
  };

  pi.registerCommand("annotate", {
    description: "Review Pi's newest reply (or a .md file) full screen; S sends the feedback",
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
    description: "Review uncommitted changes with tuicr full screen (or tuicr args: -r main..HEAD, --file src/)",
    // shortcut: splits on spaces, so a path with spaces won't work; add quoting if that comes up
    handler: (args, ctx) => run("review", args.split(/\s+/).filter(Boolean), ctx),
  });
}
