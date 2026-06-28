# Project Profile

> **This file is the single source of truth that decouples the spec-driven engine from your stack.**
> Every agent reads it at runtime instead of hardcoding technology, paths, or conventions.
> Fill it in once (or generate it with `/sdd-init`). When your stack changes, change it here — not in the agents.

---

## Identity

- **Project name:** `<YourProject>`
- **One-line description:** `<what it is, for whom>`
- **North Star metric:** `<e.g. MAU, GMV, retention>`
- **Primary language for agent output:** `<e.g. en-US, pt-BR>`

---

## Repository layout

Is this a monorepo with multiple subprojects, or a single project?

- **Mode:** `monorepo` | `single`
- **Repo root (absolute path):** `<C:/path/to/repo or /path/to/repo>`
- **Specs directory (relative to root):** `docs/specs`
- **Worktree root (for parallel isolation):** `<root>/.worktrees`

### Subprojects

> One row per independently-implementable unit. The **task prefix** is how the
> pipeline routes tasks to the right implementer (e.g. `B0-001` → backend).
> For a single-project repo, declare exactly one subproject.

| Key | Dir (abs path) | Task prefix | Implementer def (abs path) |
|---|---|---|---|
| backend | `<root>/backend` | `B` | `<root>/backend/.claude/agents/backend-implementer.md` |
| frontend | `<root>/app` | `F` | `<root>/app/.claude/agents/frontend-implementer.md` |
| admin | `<root>/admin` | `A` | `<root>/admin/.claude/agents/admin-implementer.md` |

---

## Stack (per subproject)

> Free-form, but be specific — versions, frameworks, the exact idioms you require.
> Agents inject this verbatim into their reasoning. This replaces every hardcoded
> "we use X" line that used to live inside agent prompts.

### backend
- Language/runtime: `<e.g. TypeScript 5, Node 22>`
- Framework: `<e.g. Firebase Cloud Functions v2>`
- Datastore: `<e.g. Firestore, Postgres>`
- Required idioms: `<e.g. Zod safeParse on all inputs; logger not console.log>`

### frontend
- Language/runtime: `<e.g. Flutter 3.x / React 19 + Vite>`
- State management: `<e.g. Riverpod 3 Notifier — never StateNotifier/BLoC>`
- Routing: `<e.g. go_router 17 / React Router v6>`
- Required idioms: `<e.g. all UI strings via i18n; tests with mocktail>`

### admin
- `<...>`

---

## Conventions

- **Datastore naming:** `<e.g. Firestore collections PascalCase: Users, Beers>`
- **Region/locale defaults:** `<e.g. southamerica-east1; exception: us-central1 for embeddings>`
- **Logging:** `<e.g. firebase-functions/logger; never console.log>`
- **Secrets:** `<e.g. defineSecret(); never hardcoded>`
- **Test framework:** `<e.g. mocktail (Flutter), vitest (web)>`

---

## GitFlow & environments

| Branch | Environment | Target |
|---|---|---|
| `develop` | dev | `<project-dev>` |
| `staging` | stg | `<project-stg>` |
| `main` | prod | `<project-prd>` |

- **PRs always target:** `develop`
- **Branch naming:** `feature/<subproject>-<desc>`, `fix/<subproject>-<desc>`, `hotfix/<desc>`
- **Non-negotiable:** no direct commits to `develop`, `staging`, `main`.

---

## Quality gates

- **Required spec sections:** `Overview, Scope, Flow, Architecture, Security, Implementation Order`
- **Coverage target / CI gate:** `<e.g. 80% global goal, 65% diff-aware gate>`
- **QA gate:** every business rule in the spec must be implemented AND covered by a behavior test before a PR opens.
- **Definition of done:** `<your DoD>`

---

## Spec artifact convention

Each feature lives in `<specs-dir>/YYYY-MM-DD-feature-slug/`:

- `brief.md` — product discovery, business language (from `product-discovery`)
- `spec.md` — the what & why, technical (from `spec-generator`)
- `tasks.md` — traceable tasks with IDs (from `task-generator`)

Reference spec to mirror the format: `<path to a good existing spec, if any>`
