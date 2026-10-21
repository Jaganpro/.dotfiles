#!/bin/bash
# git-guard for Claude Code (PreToolUse hook on Bash): blocks commands that
# skip git hooks (--no-verify, git commit -n), so the gitleaks pre-commit check
# can't be bypassed silently. Same rule as ~/.pi/agent/extensions/git-guard.ts.
cmd=$(jq -r '.tool_input.command // ""')

# Ignore text inside quotes (commit messages), then look for hook-skipping flags
if printf '%s' "$cmd" | perl -0777 -ne "
  s/\"[^\"]*\"|'[^']*'/\"\"/g;
  exit((/--no-verify\b/ || /\bgit\s+commit\b[^;&|]*\s-[a-zA-Z]*n[a-zA-Z]*(\s|\$)/) ? 0 : 1)"; then
  jq -n '{hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: "git-guard: skipping git hooks (--no-verify / git commit -n) is not allowed. Fix what the hook reported, or ask the user."
  }}'
fi
exit 0
