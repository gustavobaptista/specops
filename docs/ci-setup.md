# CI / Automation setup

The squad runs locally with zero setup. This guide is for the **optional** layer that
runs agents **automatically in GitHub Actions** — and therefore costs money in two
places: **GitHub Actions minutes** and **Claude tokens**. It's opt-in and tiered, so you
decide how much to automate and how much to spend.

> A workflow `.yml` is useless without the GitHub configuration around it (a secret,
> permissions, sometimes labels and a repo setting). That configuration is the real work
> — this guide is it. The yamls live in [`templates/ci/`](../templates/ci/).

## Choose your level

Set `Automation level` in your `.claude/project-profile.md` (`## CI / Automation`).
Default: **`review`**.

| Level | Installs | What runs | Cost driver |
|---|---|---|---|
| `off` | nothing | run the squad locally (`/sdd-run`, `/sdd-feature`) | **zero** CI cost |
| **`review`** *(default)* | `reviewer.yml` | review on each PR push | ~1 Claude run per push |
| `review+capture` | + `followup-capture.yml` | open issues for unapplied suggestions on merge | +1 run per merged PR |
| `full` | + `followup-fix.yml` | scheduled auto-fix PRs for low/med issues | + scheduled fix runs |

Each level is additive — `full` includes everything below it. Plain `validate.yml` (lint/
build/test) is separate and carries no token cost; install it at any level.

---

## Prerequisites (every agentic level)

### 1. Commit `.claude/` to the repo
The CI runner checks out your repo and the agents read `.claude/agents/*.md`,
`.claude/project-profile.md`, and `.claude/constitution.md`. They must be committed.

### 2. Add the Anthropic auth secret
Generate a long-lived token locally, then store it as a repo secret:

```bash
claude setup-token                       # prints a CLAUDE_CODE_OAUTH_TOKEN
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "<paste the token>" --repo <owner>/<repo>
```

> Alternative: use an API key instead — `gh secret set ANTHROPIC_API_KEY ...` and swap the
> env var name in the yaml. OAuth token is recommended (works with a Claude subscription).

### 3. Know the `claude-code-action` gotcha
`anthropics/claude-code-action@beta` **does not fire on `pull_request` events** — it
returns "No trigger found". That's why these templates **call the Claude Code CLI
directly** (`npm i -g @anthropic-ai/claude-code` + a small `python3` runner) instead of
the action. Don't "simplify" them back to the action on PR triggers; it won't run.

---

## Level: `review`

1. Copy [`templates/ci/reviewer.yml`](../templates/ci/reviewer.yml) → `.github/workflows/reviewer.yml`.
2. The workflow already declares `permissions: pull-requests: write` (needed to post the
   review). No extra repo setting required for `review`.
3. Tune the cost levers at the top of the yaml to match your profile:
   - `branches:` — which base branches trigger a review (fewer = cheaper).
   - `paths-ignore:` — skip docs-only PRs.
   - `CI_AGENT_MODEL` — a smaller model is cheaper per review.
   - draft-skip + `cancel-in-progress` are on by default (don't pay for drafts or
     superseded pushes).

That's it — open a PR to a watched branch and the `reviewer` posts a verdict.

---

## Level: `review+capture`

Adds: unapplied suggestions become tracked issues when a PR merges.

1. Copy [`followup-capture.yml`](../templates/ci/followup-capture.yml) → `.github/workflows/`.
2. Create the labels it uses (one-time):

```bash
gh label create pr-followup --color BFD4F2 --description "Suggestion from PR review, not yet applied" --repo <owner>/<repo>
gh label create sev:low     --color C2E0C6 --repo <owner>/<repo>
gh label create sev:medium  --color FBCA04 --repo <owner>/<repo>
gh label create sev:high    --color D93F0B --repo <owner>/<repo>
```

---

## Level: `full`

Adds: a scheduled job that auto-fixes low/med follow-up issues and opens a PR.

1. Copy [`followup-fix.yml`](../templates/ci/followup-fix.yml) → `.github/workflows/`.
2. Create the extra labels:

```bash
gh label create automated-fix  --color 5319E7 --description "PR opened by the auto-fixer" --repo <owner>/<repo>
gh label create fix-attempted  --color E99695 --description "Auto-fix tried (done or skipped)" --repo <owner>/<repo>
```

3. **Allow Actions to open PRs** (easy to miss): Settings → Actions → General →
   Workflow permissions → enable **"Allow GitHub Actions to create and approve pull
   requests"**. Without this, `gh pr create` from the runner fails.
4. **Branch protection** (recommended, needs GitHub Pro on private repos): require green
   CI + 1 human approval on `develop`. The auto-fixer's PRs are labeled `automated-fix`
   and must never merge themselves.
5. Tune cost levers in the yaml:
   - `cron:` — weekly by default; nightly costs ~5× more.
   - `FIX_SEVERITIES` — `sev:low` only by default; add `sev:medium` for more coverage.
   - The job exits doing nothing when the backlog is empty, so an idle cron is cheap.

---

## Plain CI — `validate.yml` (not agentic)

[`templates/ci/validate.yml`](../templates/ci/validate.yml) is ordinary lint/build/test.
No Claude, no token cost. Fill in your stack's commands per subproject (the commented
examples show Node and Flutter), or let `/sdd-init` generate it from your profile.

---

## Cost-control cheat sheet

| Lever | Where | Effect |
|---|---|---|
| Automation level | profile + which yamls you install | the biggest switch |
| Trigger branches | `reviewer.yml` `branches:` | fewer PRs reviewed |
| `paths-ignore` | `reviewer.yml` | skip docs/config-only PRs |
| Draft skip | `reviewer.yml` `if:` | no review on draft PRs |
| `cancel-in-progress` | concurrency block | no paying for superseded pushes |
| `CI_AGENT_MODEL` | env in each agentic yaml | cheaper model = fewer tokens |
| `timeout-minutes` | each job | hard ceiling on a runaway run |
| Auto-fix `cron` | `followup-fix.yml` | weekly vs nightly |
| `FIX_SEVERITIES` | `followup-fix.yml` | how many issues qualify |

## Turning it off

Set `Automation level: off` in the profile and delete the agentic workflows from
`.github/workflows/`. The squad keeps working locally — you just stop paying for CI.
