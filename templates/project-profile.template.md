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

- `brief.md` — product discovery, business language (from `discovery`)
- `spec.md` — the what & why, technical (from `architect`)
- `tasks.md` — traceable tasks with IDs (from `planner`)

Reference spec to mirror the format: `<path to a good existing spec, if any>`

---

## Operations (for the `investigator` & `guardian` roles)

> **Optional.** Only fill this in if you use the operational agents. The build
> pipeline (discovery → … → reviewer) does not need it. These agents reach external
> systems through whatever MCP servers / CLIs you have connected — name them here so
> the agents know what to use; they never assume a vendor.

### Observability / logs
- Provider: `<e.g. Google Cloud Logging, Datadog, CloudWatch, Loki>`
- How to query (CLI or MCP + example): `<e.g. gcloud logging read '<filter>' --project=<proj> --freshness=5m>`
- Error filter: `<e.g. severity>=ERROR; resource.type="cloud_run_revision">`

### Analytics
- Provider: `<e.g. PostHog, Amplitude, GA4>`
- Access (MCP/CLI + query language): `<e.g. PostHog MCP — HogQL via exec>`
- Critical events to watch (blast-radius signals): `<e.g. checkout_completed, session_start>`

### Crash reporting
- Provider: `<e.g. Firebase Crashlytics via BigQuery export, Sentry>`
- How to query: `<e.g. bq query ... firebase_crashlytics.crashes_*>`
- Applies to subprojects: `<e.g. the mobile app only>`

### Alerting
- Channel provider: `<e.g. Slack MCP, PagerDuty>`
- Primary channel / fallback: `<e.g. #deploys / #general>`

### Deploy targets (per subproject)

| Subproject | CI deploy workflow name | Deploy type | Health check URL |
|---|---|---|---|
| backend | `<e.g. Deploy>` | serverless functions | `<endpoint or n/a>` |
| admin | `<e.g. Web Deploy>` | static hosting | `<https://...>` |
| app | `<e.g. Android Deploy>` | app store (manual in prod) | n/a |

### Monitoring windows & thresholds (`guardian`)

| Env | Duration | Check interval | Rollback timeout |
|---|---|---|---|
| dev | 20 min | 5 min | 10 min |
| stg | 30 min | 5 min | 15 min |
| prod | 60 min | 5 min | 20 min |

Anomaly thresholds (tune per project):
- **Error rate:** current > `max(10, baseline × 5)`
- **Critical-event drop:** current hour < 60% of previous hour
- **Critical-event spike:** current hour > 300% of previous hour
- **Crashes:** > 5 affected devices in a single app version
- **Health URL:** HTTP ≠ 200

### Rollback strategy
- Mechanism: `<e.g. revert the merge commit on a hotfix/rollback-* branch → PR to the deploy branch → auto-merge on green CI>`
- Hard rules: never silent (announce before & after), never a direct commit, never auto-rollback an app-store release (alert only — requires human action).

### Incident reports directory
- `<e.g. docs/incidents/>`

---

## CI / Automation (optional)

> How much of the squad runs **automatically in GitHub Actions** — and therefore how
> much you spend (Actions minutes + Claude tokens). Opt-in and tiered. Default: `review`.
> Full setup steps per level live in [`docs/ci-setup.md`](../docs/ci-setup.md).

- **Automation level:** `review`   <!-- off | review | review+capture | full -->
- **Review triggers:** base branches `[main, staging]`; skip draft PRs: `yes`; path-ignore: `[**/*.md, docs/**]`
- **CI agent model:** `<e.g. claude-sonnet-4-6>`   <!-- cost lever: smaller = cheaper tokens -->
- **Auto-fix (full only):** severities `[low]`; schedule `weekly`; max issues/run `3`; skip-if-idle: `yes`
- **Timeouts:** review `10m`; fix `25m`

| Level | Installs | Cost driver |
|---|---|---|
| `off` | nothing (run the squad locally) | zero CI cost |
| `review` *(default)* | `reviewer.yml` | ~1 Claude run per PR push |
| `review+capture` | + `followup-capture.yml` | +1 run per merged PR |
| `full` | + `followup-fix.yml` | + scheduled fix runs |
