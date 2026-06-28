# Project Profile — Acme

> Worked example. Acme is a fictional B2B team-expense SaaS. Every agent reads this file
> at runtime; nothing about the stack is hardcoded in the agents.

---

## Identity

- **Project name:** Acme
- **One-line description:** B2B SaaS for team expense tracking and approvals
- **North Star metric:** weekly active approvers
- **Primary language for agent output:** en-US

---

## Repository layout

- **Mode:** monorepo
- **Repo root (absolute path):** `/home/dev/acme`
- **Specs directory (relative to root):** `docs/specs`
- **Worktree root (for parallel isolation):** `/home/dev/acme/.worktrees`

### Subprojects

| Key | Dir (abs path) | Task prefix | Implementer def (abs path) |
|---|---|---|---|
| api | `/home/dev/acme/api` | `A` | `/home/dev/acme/api/.claude/agents/implementer.md` |
| web | `/home/dev/acme/web` | `W` | `/home/dev/acme/web/.claude/agents/implementer.md` |
| mobile | `/home/dev/acme/mobile` | `M` | `/home/dev/acme/mobile/.claude/agents/implementer.md` |

---

## Stack (per subproject)

### api
- Language/runtime: TypeScript 5, Node 22
- Framework: NestJS 11 (modules / providers / controllers)
- Datastore: PostgreSQL via Prisma ORM
- Required idioms: DTOs validated with `class-validator` (or Zod) on every endpoint; no raw SQL outside repositories; structured logging via the Nest `Logger`, never `console.log`; secrets via env + a config module, never hardcoded.

### web
- Language/runtime: TypeScript 5, Next.js 15 (App Router), React 19
- State management: TanStack Query v5 for server state; React context only for cross-cutting UI — never global mutable singletons
- Routing: Next.js App Router (file-based)
- Required idioms: all user-facing strings via the i18n catalog; data fetching only through typed query/mutation hooks; forms with react-hook-form + Zod; tests with Vitest + Testing Library.

### mobile
- Language/runtime: TypeScript 5, React Native + Expo
- State management: TanStack Query v5; Zustand for local UI state
- Routing: Expo Router
- Required idioms: shared API client package; no inline fetch; tests with Jest + Testing Library.

---

## Conventions

- **Datastore naming:** Postgres tables `snake_case` plural (`expense_reports`); Prisma models PascalCase singular (`ExpenseReport`).
- **Region/locale defaults:** primary region `us-east-1`; locales `en-US`, `pt-BR`.
- **Logging:** Nest `Logger` (api) / a thin `logger` wrapper (web, mobile) — never `console.log` in committed code.
- **Secrets:** environment + config module; never committed.
- **Test framework:** Jest (api), Vitest + Testing Library (web), Jest + Testing Library (mobile).

---

## GitFlow & environments

| Branch | Environment | Target |
|---|---|---|
| `develop` | dev | `acme-dev` |
| `staging` | stg | `acme-stg` |
| `main` | prod | `acme-prod` |

- **PRs always target:** `develop`
- **Branch naming:** `feature/<subproject>-<desc>`, `fix/<subproject>-<desc>`, `hotfix/<desc>`
- **Non-negotiable:** no direct commits to `develop`, `staging`, `main`.

---

## Quality gates

- **Required spec sections:** Overview, Scope, Flow, Architecture, Security, Implementation Order
- **Coverage target / CI gate:** 80% global goal, 65% diff-aware gate
- **QA gate:** every business rule in the spec must be implemented AND covered by a behavior test before a PR opens.
- **Definition of done:** code + tests green, lint clean, spec rules traceable, PR opened to `develop`.

---

## Spec artifact convention

Each feature lives in `docs/specs/YYYY-MM-DD-feature-slug/`:

- `brief.md` — product discovery, business language (from `discovery`)
- `spec.md` — the what & why, technical (from `architect`)
- `tasks.md` — traceable tasks with IDs (from `planner`)

Reference spec to mirror the format: `docs/specs/2026-02-10-receipt-ocr/spec.md`

---

## Operations (optional)

### Observability / logs
- Provider: Datadog
- How to query: Datadog Logs API / MCP — `service:acme-api status:error` over the window
- Error filter: `status:error`

### Analytics
- Provider: PostHog
- Access: PostHog MCP — HogQL via exec
- Critical events to watch: `expense_submitted`, `expense_approved`, `session_start`

### Crash reporting
- Provider: Sentry
- How to query: Sentry MCP / API — issues by release
- Applies to subprojects: web, mobile

### Alerting
- Channel provider: Slack MCP
- Primary channel / fallback: `#deploys` / `#engineering`

### Deploy targets (per subproject)

| Subproject | CI deploy workflow name | Deploy type | Health check URL |
|---|---|---|---|
| api | Deploy API | container service | https://api.acme.example/health |
| web | Deploy Web | static/edge hosting | https://app.acme.example/ |
| mobile | Mobile Release | app store (manual in prod) | n/a |

### Monitoring windows & thresholds (`guardian`)

| Env | Duration | Check interval | Rollback timeout |
|---|---|---|---|
| dev | 20 min | 5 min | 10 min |
| stg | 30 min | 5 min | 15 min |
| prod | 60 min | 5 min | 20 min |

Anomaly thresholds:
- Error rate: current > `max(10, baseline × 5)`
- Critical-event drop: current hour < 60% of previous hour
- Critical-event spike: current hour > 300% of previous hour
- Crashes: > 5 affected devices in a single release
- Health URL: HTTP ≠ 200

### Rollback strategy
- Mechanism: revert the merge commit on a `hotfix/rollback-*` branch → PR to the deploy branch → auto-merge on green CI.
- Hard rules: never silent, never a direct commit, never auto-rollback a mobile store release (alert only).

### Incident reports directory
- `docs/incidents/`

---

## CI / Automation

- **Automation level:** review
- **Review triggers:** base branches `[main, staging]`; skip draft PRs: yes; path-ignore: `[**/*.md, docs/**]`
- **CI agent model:** claude-sonnet-4-6
- **Auto-fix (full only):** severities `[low]`; schedule weekly; max issues/run 3; skip-if-idle: yes
- **Timeouts:** review 10m; fix 25m
