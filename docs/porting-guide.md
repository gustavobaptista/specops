# Extending the squad — adding or porting your own agents

SpecOps ships a full squad (`discovery`, `architect`, `planner`, `implementer`, `qa`,
`reviewer`, `auditor`, plus the operational `investigator` and `guardian`). If you want
to add a new role — or bring an existing agent of your own into the same config-driven
pattern — this is the recipe.

## The naming taxonomy

Agents are **roles/personas** (a single noun describing *who*): `architect`, `planner`,
`reviewer`, `auditor`… Slash commands are the separate *what-you-do* namespace
(`/sdd-init`, `/sdd-run`). When you add an agent, give it a role name, not a phase name.

## The conversion recipe (per agent)

1. **Start from the canonical shape.** Copy the structure of [`agents/architect.md`](../agents/architect.md):
   frontmatter (`name`, `description`, `tools`, `model`, `memory`), then a mandatory
   "Step 0 — Load project context" block, then the body.
2. **Add Step 0 first.** It reads `.claude/project-profile.md` (stack, paths, subprojects,
   conventions, gates) and `.claude/constitution.md` (principles) before doing anything.
3. **Assume no stack.** Never assert a technology in the body. Wherever you'd write
   "we use X", write "the stack/datastore/test-framework the profile declares". Concrete
   technologies may appear only as clearly-labelled *examples* ("e.g. …") that apply when
   the profile's stack matches.
4. **No absolute paths.** Use profile fields: `repoRoot`, `specsDir`, `worktreeRoot`, and
   each subproject's `dir` / `prefix` / `implementerDef`.
5. **Keep the generic core.** Output formats, quality bars, gate definitions, and handoff
   steps are stack-neutral — write them once, plainly.
6. **Respond in the user's language at runtime** via the profile's `Primary language`
   field; keep the agent file itself in English so it's contributable.

## Where project-specific knowledge belongs

| Kind of knowledge | Home |
|---|---|
| Stack, paths, prefixes, conventions, gates | `project-profile.md` |
| Product vision, principles, non-negotiables / "absolutes" | `constitution.md` |
| Observability / analytics / alerting / deploy targets | profile `## Operations` |
| How much to automate in CI (+ cost levers) | profile `## CI / Automation` |

A reviewer, for example, enforces the constitution's "absolutes" + the profile's
per-subproject idioms — it carries no hardcoded rules of its own. Operational agents
(`investigator`, `guardian`) discover connected integrations (logs, analytics, Slack…)
at runtime and carry **no `mcpServers:` frontmatter**, so the plugin stays vendor-neutral.

## Wiring an agent into the pipeline

The deterministic `feature-pipeline` workflow calls agents by `agentType` (`architect`,
`planner`, `qa`). If you add a pipeline stage, call your new agent the same way and give
it a phase in the workflow's `meta`. On-demand agents (like `auditor`) need no wiring —
they're invoked directly or by `/sdd-run`.

## Validating genericity

The litmus test: configure SpecOps in a repo with a **different stack** than you developed
against, run `/sdd-init`, and take one feature end-to-end. If any agent assumes a specific
technology, you missed a hardcoded line — grep for the telltales of *your* original stack
across `agents/` and `workflows/`. A clean run = zero stack assumptions outside `examples/`.
