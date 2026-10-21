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
