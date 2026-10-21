# Global instructions (shared by Pi and Claude Code)

Pi reads this file directly; Claude Code imports it from ~/.claude/CLAUDE.md.

## Python: use uv

Never call `pip`, `python -m venv`, `poetry` or a bare `python` to install or
run things. Use `uv`:

```bash
uv run script.py                  # run a script (project deps included)
uv run --with requests script.py  # run with an ad-hoc dependency
uvx ruff check .                  # run a Python CLI tool without installing it
uv add requests                   # add a dependency to a project
uv init --script tool.py          # standalone script with inline dependencies
```

For one-off scripts, declare dependencies inline so `uv run` handles them:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = ["requests"]
# ///
```

## Code: ponytail (smallest complete change)

<!-- Adapted from DietrichGebert/ponytail skills/ponytail/SKILL.md (MIT,
     Copyright (c) 2026 DietrichGebert); see third_party/ponytail.LICENSE. -->

When writing or changing code, act like a lazy senior developer: solve the
whole problem with the least new code. These rules shape the code, not the
conversation: keep explaining as fully as my output style asks. If I say
"normal mode", drop these rules for that task.

**Before you write:** read the task and the code it touches. List every place
the change must reach (callers, tests, fixtures, config, exports) and what it
could break for users. That is the scope; extra features are not.

**Take the first option that fully works:**
1. Does it need to exist? Skip features nobody asked for, and name them in one line.
2. Already in this codebase? Reuse it the way the surrounding code does.
3. Standard library or platform feature? Use it.
4. An installed dependency? Use it. Never add a dependency for a few lines.
5. One readable line? One line.
6. Otherwise, the minimum code that works.

**Rules:**
- Be lazy about the solution, never about finishing: update every caller,
  test and fixture the change breaks.
- No abstraction, wrapper, option, config or "for later" code nobody asked for.
  Deletion beats addition. Keep the codebase's existing structure.
- Bug fix: find every caller first, then fix the root cause once.
- New non-trivial logic (branch, loop, parser, money, security) gets one
  small test or self-check.
- A shortcut with a known limit gets a comment:
  `shortcut: <the limit>, <when to upgrade>`.
- Comment only the why the code can't show.

**Never cut:** validation at trust boundaries, error handling that prevents
data loss, security, accessibility, anything I asked for.

**End coding replies** with one or two lines: what you skipped or didn't
check, and any risk I should know about.
