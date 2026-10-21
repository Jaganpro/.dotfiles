---
description: "Ship it: commit this session's work and push, explaining every git command"
argument-hint: "[commit message hint, files, or issue #]"
---
<!-- Inspired by the /wr prompt in earendil-works/pi (MIT, Copyright (c) 2025 Mario Zechner); see third_party/earendil-works-pi.LICENSE. -->

Ship the work from this session: commit it and push it.

Extra instructions: $ARGUMENTS

## 1. Look before touching anything

Run `git status`, `git diff --stat` and `git branch --show-current`.
Work out which changes belong to this session's task. If any file is unclear,
ask before including it.

## 2. Check

If code changed, run the project's checks and tests (lint, types, tests, as
the repo defines them). If anything fails, stop and report. Don't ship broken work.

## 3. Commit

- Stage files **by name** (`git add <file>...`). Never `git add -A` or `git add .`.
- Message: one short imperative line (under 72 characters), plus a short body
  only if the why isn't obvious.
- If the work is for exactly one GitHub issue, add `closes #<number>`.
  If it's for several, ask which one.
- No Co-Authored-By, sign-offs or "Generated with" lines.
- Never skip hooks (`--no-verify`). If a hook blocks the commit, stop and
  explain what it found.

## 4. Push

- If the current branch isn't the repo's main branch, stop and ask before pushing.
- `git fetch`, then if the remote has new commits, `git pull --rebase` first.
  If that hits conflicts, stop and explain.
- `git push`.

## 5. Report

- What shipped: commit hash, message and files.
- **Git commands used**: every git command you ran, in order, each with a
  one-line plain-English explanation, for example:

  ```
  git status                  # see what changed
  git add dot README.md       # stage just these two files
  git commit -m "Add /ship"   # save them as one commit
  git push                    # send the commit to GitHub
  ```
