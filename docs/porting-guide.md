# Porting Guide — finishing the extraction

The full squad has now been ported from BeerXP and is config-driven. This guide
documents the recipe that was used — keep it as the reference for porting any
*additional* agents into the same pattern.

> **Renaming map (all ported).** The squad uses a role/persona taxonomy, so each
> BeerXP agent got a new role name:
>
> | BeerXP name | Squad role |
> |---|---|
> | `product-discovery` | `discovery` |
> | `spec-generator` | `architect` |
> | `task-generator` | `planner` |
> | `backend/frontend/admin-implementer` | `implementer` (one generic) |
> | `qa-validator` | `qa` |
> | `pr-reviewer` | `reviewer` |
> | `security-auditor` | `auditor` |
> | `incident-investigator` | `investigator` |
> | `deploy-guardian` | `guardian` |
>
> Operational agents (`investigator`, `guardian`) additionally read the profile's
> **Operations** section and discover external integrations (observability, analytics,
> alerting) at runtime via connected MCP servers — they carry no `mcpServers:`
> frontmatter so the plugin stays vendor-neutral. Update the `name:` frontmatter and
> every cross-reference. The `feature-pipeline` workflow calls the new `agentType`
> names (`architect`, `planner`, `qa`).

## The conversion recipe (per agent)

For each agent in `BeerXP/.claude/agents/` (and the subproject implementers):

1. **Copy** the agent `.md` into `agents/` here.
2. **Add Step 0** — a "Load project context" block that reads
   `.claude/project-profile.md` first (copy it from `architect.md`).
3. **Strip the hardcoded stack.** Find every line that asserts a technology
   ("Flutter 3.x", "Firestore PascalCase", "southamerica-east1", "Riverpod") and
   replace it with a reference to the profile ("the stack the profile declares",
   "the datastore naming the profile defines").
4. **Remove absolute paths.** Anything like `C:/Users/Gus/BeerXP/...` becomes a
   profile field (`repoRoot`, `specsDir`, the subproject's `dir`/`implementerDef`).
5. **Keep the generic ~70%.** Spec format, quality bars, gate definitions, output
   structure — these are already stack-neutral. Don't rewrite them.
6. **Translate** user-facing wording to English (the profile's `Primary language`
   field is what makes the agent respond in the user's language at runtime).

## Agent-by-agent notes

| Role (← BeerXP agent) | Specific bits to extract into the profile |
|---|---|
| `discovery` (← product-discovery) | Product loop, business rules → these belong in the *constitution*, not the agent. The agent itself is already nearly generic. |
| `planner` (← task-generator) | Task ID prefixes (B/F/A) → `subprojects[].prefix`. File-path conventions → per-subproject stack. |
| `qa` (← qa-validator) | "Run locally, don't run lint/build/coverage (that's CI)" is generic. The rule-tracing logic is generic. Only test-framework names move to the profile. |
| `reviewer` (← pr-reviewer) | Per-subproject rule sets → reference the constitution's "absolutes" + profile idioms. Diff-path → subproject detection uses `subprojects[].dir`. |
| `auditor` (← security-auditor) | Firebase-specific checks (Security Rules, App Check) → make them conditional on the profile's datastore/stack. |
| `implementer` (×N) | Biggest win: collapse backend/frontend/admin implementers into **one** generic implementer that reads its target subproject + stack from the profile. The pipeline already passes the right `implementerDef` path per subproject. |

## Validating genericity

The litmus test: clone the engine into a repo with a **different stack** (e.g. a plain
Next.js app), run `/sdd-init`, and run one feature end-to-end. If any agent assumes
Flutter/Firebase, you missed a hardcoded line — grep for it:

```
grep -rIEi 'flutter|firebase|firestore|riverpod|southamerica|C:/Users' agents/ workflows/
```

A clean run = zero hits outside `examples/`.

## CI templates (still to add)

Copy and genericize from BeerXP's `.github/workflows/`:
- `reviewer.yml` — invokes the `reviewer` agent on PR open/update.
  (BeerXP learned: `claude-code-action@beta` broke on `pull_request` events — they call
  the CLI directly via a Python subprocess. Port that working approach.)
- `validate.yml` — analyze + test + diff-aware coverage gate.

Drop them in `templates/ci/` so `/sdd-init` can offer to install them.
