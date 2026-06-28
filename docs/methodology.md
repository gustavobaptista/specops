# Methodology

spec-driven-squad turns a fuzzy idea into merged-ready PRs through a chain of
specialized agents, each with one job and a verifiable handoff.

## The chain

1. **product-discovery** *(optional)* — interviews the PO 100% in business language
   (never technology) and produces `brief.md`. Use it when the "what" and "why" are
   still fuzzy. Skip it when they're clear and start at the spec.
2. **spec-generator** — translates the brief into a technical `spec.md`: overview,
   scope, user flow, architecture, API contracts, security. The *what & why*, not tasks.
3. **task-generator** — breaks the spec into atomic, traceable `tasks.md` entries with
   IDs (prefix per subproject), `[P]` parallelism markers, concrete file paths, and
   explicit dependencies.
4. **implementers** (parallel) — one per subproject, each isolated in its own git
   worktree. They mark task status (⬜ → 🔄 → ✅) so the pipeline can resume.
5. **qa-validator** — the gate. Traces every business rule in the spec to its
   implementation *and* a behavior test. Rejections bounce back to only the affected
   implementer, with the exact gap.
6. **pr-reviewer** — runs automatically on each PR (GitHub Action). Detects the
   subproject from the diff, applies that subproject's rules, and posts a structured
   review with machine-readable blockers.
7. **review loop** — the orchestrator reads the review, dispatches surgical fixes to
   the existing branch, and re-checks — up to N cycles.

## Two principles that make it work

### Verifiable gates, not vibes
Every phase passes or fails on something checkable: are the required spec sections
present? did the task IDs get detected? did QA approve with zero gaps? No agent grades
its own homework with a confidence score.

### Config over convention
No agent hardcodes a stack. They read `.claude/project-profile.md` at runtime. This is
the single change that makes the same squad work across a Flutter+Firebase monorepo and
a single Rust binary. When you change stacks, you change the profile — not seven agents.

## Memory

Each agent has a memory directory. Lessons learned ("this datastore quirk bit us",
"this naming divergence exists") persist across sessions and are committed to the repo
via the `sync-memory` hook, so the whole team's agents benefit.

## Where this came from

Extracted from **BeerXP**, a production Flutter + Firebase social app. The
`examples/beerxp/` directory keeps the original (anonymized) constitution and a sample
spec as a living reference of the system running on a real codebase.
