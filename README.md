# spec-driven-squad

> A **stack-agnostic, multi-agent spec-driven development pipeline** for [Claude Code](https://claude.com/claude-code).
> Not just sequential slash-commands — a real orchestrated squad with parallel
> implementation, verifiable quality gates, a QA retry loop, an automated PR-review
> loop, and persistent per-agent memory.

```
product-discovery → spec-generator → task-generator → implementers (parallel) → qa-validator → PRs → pr-reviewer loop
       brief.md           spec.md          tasks.md      one per subproject       gate (retry)         auto-fix (retry)
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
| **QA retry loop** | `qa-validator` traces every business rule in the spec to its implementation + test. Gaps bounce back to only the affected implementer. |
| **Automated review loop** | After PRs open, it waits for `pr-reviewer`, extracts blockers, and dispatches surgical fixes to the existing branch — up to N cycles. |
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

## Run a feature

```
/product-discovery     # optional — generates docs/specs/<date>-<slug>/brief.md
/sdd-feature <slug>    # runs the whole pipeline for that feature
```

`/sdd-feature` resolves the slug to its spec directory and launches the
`feature-pipeline` workflow for you — no need to hand-write a `Workflow({...})` call.
Pass a bare slug, a full path, or nothing (it lists features and asks). The pipeline
takes it from brief → merged-ready PRs, stopping only for the final human approval.

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

`v0.1.0` — early. The `spec-generator` agent and the `feature-pipeline` workflow are
fully config-driven. Remaining agents (`product-discovery`, `task-generator`,
`qa-validator`, `pr-reviewer`, `security-auditor`, implementers) are being ported
from the original BeerXP system to the same config-driven pattern.

## License

MIT — see [LICENSE](LICENSE).
