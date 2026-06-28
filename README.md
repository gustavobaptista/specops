# spec-driven-squad

> A **stack-agnostic, multi-agent spec-driven development pipeline** for [Claude Code](https://claude.com/claude-code).
> Not just sequential slash-commands — a real orchestrated squad with parallel
> implementation, verifiable quality gates, a QA retry loop, an automated PR-review
> loop, and persistent per-agent memory.

```
discovery → architect → planner → implementers (parallel) → qa → PRs → reviewer loop
 brief.md     spec.md     tasks.md    one per subproject       gate         auto-fix (retry)
```

Everything that is project-specific — your stack, paths, naming, branches, gates —
lives in **one file**: [`.claude/project-profile.md`](templates/project-profile.template.md).
The agents and the orchestrator read it at runtime. Point it at a Flutter+Firebase
monorepo or a single Go service; the pipeline doesn't change.

## Why this exists

Most spec-driven setups are a chain of prompts you run by hand. This one adds the
parts that make it hold up on real teams:

| Capability | What it does |
|---|---|
| **Parallel implementers** | One agent per subproject, isolated in its own git worktree — no staging-area collisions. |
| **Verifiable gates** | Each phase has a pass/fail gate (spec sections present, tasks detected, QA approved) — not self-assigned scores. |
| **QA retry loop** | `qa` traces every business rule in the spec to its implementation + test. Gaps bounce back to only the affected implementer. |
| **Automated review loop** | After PRs open, it waits for `reviewer`, extracts blockers, and dispatches surgical fixes to the existing branch — up to N cycles. |
| **Per-agent memory** | Each agent accumulates project-specific lessons across sessions via a sync hook. |
| **Config-driven** | Zero stack assumptions in the agents. One profile file drives everything. |

## Install

### As a Claude Code plugin

```
/plugin marketplace add <your-username>/spec-driven-squad
/plugin install spec-driven-squad
```

Then, inside your target repo:

```
/sdd-init
```

This interviews you, detects your stack, and writes `.claude/project-profile.md`
and `.claude/constitution.md`.

### As a template (the in-repo pieces)

Some pieces must live inside your repo (constitution, profile, CI). Use this repo
as a GitHub template, or copy from [`templates/`](templates/):

- [`templates/project-profile.template.md`](templates/project-profile.template.md) → `.claude/project-profile.md`
- [`templates/constitution.template.md`](templates/constitution.template.md) → `.claude/constitution.md`
- [`templates/ci/`](templates/ci/) → `.github/workflows/`

## Run a feature — three ways

The slash commands are a convenience, **not a requirement**. The squad is just a set of
agents reading a shared profile; you can drive them however you like. Pick by how much
control vs. automation you want:

### 1. Conversational (most independent)
Just describe what you want, in your own words:

> "Spec out a wishlist feature, then build it across backend and app."

Claude reads the profile and invokes the individual agents (`architect`,
`planner`, the implementers…) as needed. No command, no fixed flow — full
flexibility, and you can redirect at any step.

### 2. Dynamic orchestration — `/sdd-run <slug | description>`
A **model-driven** orchestrator: it inspects the feature's current state and *decides*
the control flow — skips discovery if a brief exists, runs one implementer if only one
subproject is affected, loops QA while it's making progress, asks you at real forks.
Adaptive, good for irregular or exploratory features.

### 3. Deterministic workflow — `/sdd-feature <slug>`
Launches the `feature-pipeline` script: fixed gates, bounded retry loops (QA ≤2,
review ≤3), **resumable after a crash**, reproducible. Best for regular features,
hands-off runs, and CI. Under the hood it's
`Workflow({ name: 'feature-pipeline', args: { specDir } })` — the command just resolves
the slug so you never hand-write that call.

> **Deterministic vs. dynamic:** the script trades adaptability for predictability and
> resumability; the orchestrator trades reproducibility for the ability to react to
> intermediate results. Same agents, same gates — different driver. See
> [`docs/methodology.md`](docs/methodology.md#deterministic-vs-dynamic).

All three start from `/discovery` (optional — generates the `brief.md`) and end
at merged-ready PRs, stopping only for the final human approval.

## Anatomy

```
.claude-plugin/        plugin.json + marketplace.json
agents/                stack-agnostic process agents (read the profile at runtime)
workflows/             feature-pipeline.js — the orchestrator
commands/              /sdd-init and friends
hooks/                 cross-platform memory sync
templates/             what gets copied INTO your repo (profile, constitution, CI)
examples/beerxp/       a real, anonymized project this was extracted from
docs/                  methodology & guides
```

See [`docs/methodology.md`](docs/methodology.md) for the philosophy and
[`docs/anatomy-of-an-agent.md`](docs/anatomy-of-an-agent.md) for how to write your own.

## Status

`v0.1.0`. The full squad is ported and config-driven — each agent reads the project
profile at runtime and assumes no stack:

- **Build pipeline:** `discovery` → `architect` → `planner` → `implementer` → `qa` → `reviewer`, orchestrated by the `feature-pipeline` workflow.
- **Operational roles** (on demand): `auditor` (security), `investigator` (incident root-cause, read-only), `guardian` (deploy watch + auto-rollback).

Still to add: the CI templates (`reviewer.yml`, `validate.yml`) under `templates/ci/`,
and broader real-world testing across stacks.

## License

MIT — see [LICENSE](LICENSE).
