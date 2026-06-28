# <YourProject> — Constitution

> Project governance principles. Read before any product or technical decision.
> Every agent, skill, and dev session must respect these rules.
> Project-specific facts (stack, paths, conventions) live in `project-profile.md`,
> not here. This file is about *principles and non-negotiables*.

---

## Product Vision

**<YourProject>** is `<one-line description>`.

- **North Star metric:** `<e.g. MAU>`
- **Engagement loop:** `<e.g. CREATE → SHARE → REACT → DISCOVER → CREATE>`
- Every feature must fit one moment of the loop. If it doesn't, question the priority.

---

## Product Principles (non-negotiable)

1. `<principle — e.g. MVP first: ship the minimum that validates value, then iterate>`
2. `<principle>`
3. `<principle>`

## Product Anti-patterns (never build)

- `<e.g. manipulative notifications / artificial FOMO>`
- `<e.g. dark engagement patterns>`

---

## Technical Governance

> Stack details are in `project-profile.md`. Here, capture only the *absolute rules*
> a reviewer must enforce regardless of feature.

### Backend absolutes
- `<e.g. validate all inputs; never hardcode secrets; structured logging only>`

### Frontend absolutes
- `<e.g. all UI strings via i18n; no direct navigation; tests with the agreed framework>`

### Code principles (YAGNI · KISS · DRY)

When the three conflict, use this hierarchy:

1. **YAGNI** — don't build what the spec/tasks didn't ask for. Speculative functionality has real cost.
2. **KISS** — of the least code that solves the problem, pick the most readable.
3. **DRY** — only after working code, remove *real* duplication (not anticipated). "Duplicate once, abstract twice."

**DRY weighs differently per layer:**
- Business rules (validations, thresholds, domain enums): DRY mandatory.
- Infrastructure code (services, queries): DRY on the third occurrence.
- UI code (widgets, components): KISS dominates.

**Anti-patterns that violate the hierarchy (never do):**
- Create a `BaseService`/`GenericRepository` on the first feature.
- Add "for the future" optional params no caller uses.
- Extract a single-caller helper without clear justification.

---

## Recorded Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| `<...>` | `<...>` | `<...>` |

---

## Feature Development Workflow

```
product-discovery → spec-generator → task-generator → implementers (parallel)
                                                            ↓
                                                       qa-validator
                                                            ↓
                                                    human review (PRs)
```

Specs live in `<specs-dir>/YYYY-MM-DD-feature-slug/`:
- `brief.md` — product discovery, business language
- `spec.md` — the what & why, technical
- `tasks.md` — traceable tasks with IDs

**Non-negotiable:** no direct commits to `develop`, `staging`, `main`. All code enters via PR.
