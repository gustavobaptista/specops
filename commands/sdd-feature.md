---
description: Run the spec-driven feature pipeline end-to-end (spec → tasks → parallel impl → QA → PRs → review loop) for a feature directory.
argument-hint: <feature-slug | path to docs/specs/...>
---

Run the `feature-pipeline` workflow for the feature the user named: `$ARGUMENTS`

## Resolve the spec directory

1. Read `.claude/project-profile.md` to get the specs directory (default `docs/specs`).
2. Resolve `$ARGUMENTS` into a `specDir`:
   - If it's already a path that exists (e.g. `docs/specs/2026-06-27-my-feature`), use it.
   - If it's a bare slug (e.g. `my-feature` or `2026-06-27-my-feature`), `Glob`
     `<specs-dir>/*<slug>*` and match. If exactly one matches, use it.
   - If `$ARGUMENTS` is empty, list the feature directories under `<specs-dir>` that
     have a `brief.md` or `spec.md` and ask the user which one.
   - If the match is ambiguous, show the candidates and ask — never guess.

## Launch

Invoke the workflow with the resolved directory:

```
Workflow({ name: 'feature-pipeline', args: { specDir: '<resolved specDir>' } })
```

The workflow runs in the background and notifies on completion. It takes the feature
from brief → merged-ready PRs, stopping only for the final human approval. Relay its
final summary (subprojects touched, QA attempts, PR URLs, remaining blockers) to the user.
