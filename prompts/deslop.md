---
description: "Deslop: simplify finished work without changing what it does"
argument-hint: "[files, folder or focus]"
---
<!-- Adapted from earendil-works/pi .pi/prompts/deslop.md (MIT, Copyright (c) 2025 Mario Zechner); see third_party/earendil-works-pi.LICENSE. -->

Deslop the work: make it simpler, keep it doing exactly the same thing.

Focus: $ARGUMENTS
If no focus is given, use the uncommitted changes (`git diff HEAD`) plus the
code they touch. Leave everything else alone.

## Before editing

Read the affected files in full. Understand the call sites, tests, invariants
and public interfaces first. Aim for a clear design, not the smallest diff.

## Cut or simplify

- Abstractions, wrappers and helpers that don't earn their keep: inline them.
- Duplicated logic: keep one copy, in the layer where it belongs.
- Options, config and extension points nobody needs yet.
- Defensive checks inside trusted code. Validate at real boundaries (user
  input, network, files) and trust your types and invariants elsewhere.
- Fallbacks for states that should be impossible: fix the model instead.
- Extra flags, branches and state: rework the data so special cases vanish.
- Loose types: make invalid states impossible to represent.
- Comments that repeat the code. Keep the ones that explain *why*.

## Ask first, one decision at a time

Small, behavior-preserving tidying needs no approval. Anything bigger does:
removing or changing behavior people rely on, public APIs, stored formats,
validation, security, error handling, retries, deliberate extension points,
tested or documented functionality, or code whose purpose is unclear.

For each one, say what you'd remove, why it looks unnecessary, what could
break, the simpler replacement, and your recommendation. Then wait for a yes.

## Never

- Change behavior without approval.
- Weaken or delete tests to make simplification pass.
- Add a new abstraction just to save lines.

## When done

Run the project's checks and tests. Re-read the final diff for leftover
complexity or accidental behavior changes. Report briefly:

1. What got simpler
2. What the code now relies on (invariants)
3. Bigger removals you held back, waiting for approval
4. Checks run and their results
