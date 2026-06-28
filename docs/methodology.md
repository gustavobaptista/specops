# Methodology

SpecOps turns a fuzzy idea into merged-ready PRs through a **squad of
specialized agents**, each a role with one job and a verifiable handoff. The names
are personas, not phases — the slash commands (verbs) are a separate namespace.

## The squad

| Role | Produces / does | Maps to artifact |
|---|---|---|
| **discovery** | interviews the PO in business language | `brief.md` |
| **architect** | designs the technical spec | `spec.md` |
| **planner** | breaks the spec into atomic tasks | `tasks.md` |
| **implementer** (×N) | builds one subproject | code + tests |
| **qa** | validates every business rule has impl + test | gate verdict |
| **reviewer** | reviews each PR, posts blockers | PR review |
| **auditor** | security audit (deps, rules, secrets) | audit report |

1. **discovery** *(optional)* — interviews the PO 100% in business language
   (never technology) and produces `brief.md`. Use it when the "what" and "why" are
   still fuzzy. Skip it when they're clear and start at the architect.
2. **architect** — translates the brief into a technical `spec.md`: overview,
   scope, user flow, architecture, API contracts, security. The *what & why*, not tasks.
3. **planner** — breaks the spec into atomic, traceable `tasks.md` entries with
   IDs (prefix per subproject), `[P]` parallelism markers, concrete file paths, and
   explicit dependencies.
4. **implementers** (parallel) — one per subproject, each isolated in its own git
   worktree. They mark task status (⬜ → 🔄 → ✅) so the pipeline can resume.
5. **qa** — the gate. Traces every business rule in the spec to its implementation
   *and* a behavior test. Rejections bounce back to only the affected implementer,
   with the exact gap.
6. **reviewer** — runs automatically on each PR (GitHub Action). Detects the
   subproject from the diff, applies that subproject's rules, and posts a structured
   review with machine-readable blockers.
7. **review loop** — the orchestrator reads the review, dispatches surgical fixes to
   the existing branch, and re-checks — up to N cycles.

## Operational roles (outside the linear chain)

Three roles act on demand rather than in the build pipeline. They read the profile's
**Operations** section (observability, analytics, crash reporting, alerting, deploy
targets, thresholds) and reach external systems through whatever MCP servers / CLIs
you have connected — they assume no vendor.

| Role | When to run | What it does |
|---|---|---|
| **auditor** | before staging/prod releases, or when a dep scan flags something | security audit (deps, secrets, datastore rules, CI config); `audit` and `fix` modes |
| **investigator** | during a production incident | read-only root-cause investigation across logs/analytics/crashes/deploys; proposes ranked hypotheses; changes nothing in prod |
| **guardian** | right after a PR deploys | watches CI/CD, monitors the post-deploy window against thresholds, alerts on anomaly, and auto-rolls-back via a hotfix PR if no human responds |

## Two principles that make it work

### Verifiable gates, not vibes
Every phase passes or fails on something checkable: are the required spec sections
present? did the task IDs get detected? did QA approve with zero gaps? No agent grades
its own homework with a confidence score.

### Config over convention
No agent hardcodes a stack. They read `.claude/project-profile.md` at runtime. This is
the single change that makes the same squad work across a Flutter+Firebase monorepo and
a single Rust binary. When you change stacks, you change the profile — not seven agents.

## Deterministic vs. dynamic

The same squad can be driven three ways. They share the agents and the gates; they
differ only in who holds the control flow.

| | Conversational | Dynamic (`/sdd-run`) | Deterministic (`/sdd-feature`) |
|---|---|---|---|
| Control flow | You, ad hoc | The model, adaptively | A JS script, fixed |
| Adapts to feature shape | Fully | Yes (skips/loops as needed) | Only via declared gates |
| Reproducible run | No | Roughly | Yes |
| Resumable after a crash | No | Partially | Yes (cached agent results) |
| Best for | Exploration, one-offs | Irregular features, reacting to results | Regular features, CI, hands-off |

**Why keep the deterministic script at all, if the model can orchestrate dynamically?**
Because predictability is a feature. A script gives you the same phases in the same order
every time, bounded retry loops, and resume-after-crash (re-run and unchanged steps return
cached results). That's what you want in CI or for a feature you'll run the same way twice.

**Why keep the dynamic mode, if the script is reproducible?** Because real features are
irregular. A script can't decide that *this* spec needs a third QA round, or that only the
admin subproject is affected, or that the brief already answers everything so discovery
should be skipped. The model can. Use dynamic when reacting to intermediate results matters
more than reproducing the run.

Rule of thumb: **explore dynamically, ship deterministically.** Many teams use `/sdd-run`
while a feature is taking shape, then `/sdd-feature` once the spec is stable.

## Memory

Each agent has a memory directory. Lessons learned ("this datastore quirk bit us",
"this naming divergence exists") persist across sessions and are committed to the repo
via the `sync-memory` hook, so the whole team's agents benefit.

## Where this came from

Distilled from a multi-agent setup that shipped features on a production Flutter +
Firebase app, then generalized to be stack-agnostic. The [`examples/acme-saas/`](../examples/acme-saas/)
directory ships a synthetic worked example (a B2B SaaS on a Node/Next.js/Postgres stack)
to show the same squad configured for a very different stack.
