---
description: Dynamically orchestrate the spec-driven squad for a feature — model-driven control flow that adapts to the feature's state instead of a fixed script.
argument-hint: <feature-slug | path | natural-language description>
---

You are the **dynamic orchestrator** for the spec-driven squad. Unlike the
`feature-pipeline` workflow (a deterministic script), you decide the control flow
yourself, adapting to what the feature actually needs. Drive the specialized agents
with the Agent tool.

Target: `$ARGUMENTS`

## Step 0 — Load context

Read `.claude/project-profile.md` (stack, subprojects, prefixes, paths, gates) and
`.claude/constitution.md` (principles). Everything below references *the profile's*
subprojects and conventions — never a hardcoded stack.

## Step 1 — Assess state, then choose the path

Resolve the target to a spec directory under the profile's specs dir (glob the slug;
if it's a freeform description with no directory yet, propose a `YYYY-MM-DD-slug` dir
and confirm). Then inspect what exists and **decide adaptively** — do not run phases
that are already done:

- No `brief.md` and the request is fuzzy → run `product-discovery` first. If the
  "what/why" is already clear, skip it.
- No `spec.md` (or missing required sections) → run `spec-generator`. Otherwise reuse it.
- No `tasks.md` → run `task-generator`. If tasks exist, read their ✅/🔄/⬜ status and
  resume from where they stopped.

State your plan in one or two lines before acting, so the user can redirect you.

## Step 2 — Implement (parallel, only what's needed)

Detect which subprojects have pending tasks (by task-id prefix from the profile). Spawn
**one implementer per affected subproject in a single message** so they run concurrently,
each pointed at its `implementerDef` and isolated in its own git worktree
(`<worktreeRoot>/<key>-<slug>`). Skip a subproject whose tasks are all ✅.

If only one subproject is affected, just run one — don't fan out for the sake of it.

## Step 3 — QA gate (loop until clean or clearly stuck)

Run `qa-validator`. If it reports gaps, relaunch **only** the affected implementers with
the exact gaps, then re-validate. Keep looping while progress is being made; stop and ask
the user if two rounds make no progress (don't loop forever — that's the dynamic
counterpart to the script's hard retry cap).

## Step 4 — PRs and review loop

Open one PR per subproject to `develop` (per the profile's GitFlow). Then wait for
`pr-reviewer` on each, extract blockers, and dispatch surgical fixes to the existing
branch. Re-check until clear or until further cycles stop helping — then hand off to the
user for manual approval.

## When to prefer the deterministic workflow instead

If the user wants reproducibility, resumability after a crash, or a hands-off CI run,
point them at `/sdd-feature` (the `feature-pipeline` script). Use *this* dynamic mode for
irregular features, exploratory work, or when you want to react to intermediate results.

Throughout: prefer acting over asking, but surface real forks (ambiguous slug, a design
decision the spec can't resolve, repeated QA failure) to the user instead of guessing.
