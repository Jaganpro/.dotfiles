// git-guard: keeps git safe when the agent runs it.
//  1. Blocks commands that skip git hooks (--no-verify, git commit -n), so the
//     gitleaks pre-commit check can't be bypassed silently.
//  2. Stops git from opening an editor (commit without -m, rebase -i), which
//     would leave the agent waiting forever.
// Same rule as ~/.claude/hooks/git-guard.sh. Idea from dmmulroy's
// git-interceptor; written from scratch.
import { isToolCallEventType, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

const QUOTED = /"[^"]*"|'[^']*'/g; // ignore text inside quotes, e.g. commit messages
const SKIPS_HOOKS = [/--no-verify\b/, /\bgit\s+commit\b[^;&|]*\s-[a-zA-Z]*n[a-zA-Z]*(\s|$)/];
const NO_EDITOR = "export GIT_EDITOR=true GIT_SEQUENCE_EDITOR=true GIT_MERGE_AUTOEDIT=no; ";

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", (event) => {
    if (!isToolCallEventType("bash", event)) return;
    const bare = event.input.command.replace(QUOTED, '""');

    if (SKIPS_HOOKS.some((rule) => rule.test(bare))) {
      return {
        block: true,
        reason:
          "git-guard: skipping git hooks (--no-verify / git commit -n) is not allowed. " +
          "Fix what the hook reported, or ask the user.",
      };
    }

    if (/\bgit\b/.test(bare)) event.input.command = NO_EDITOR + event.input.command;
  });
}
