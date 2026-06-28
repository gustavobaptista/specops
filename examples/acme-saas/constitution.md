# Acme — Constitution

> Governance principles for the (fictional) Acme product. Read before any product or
> technical decision. Stack details live in `project-profile.md`; this file is about
> principles and non-negotiables.

---

## Product Vision

**Acme** is a B2B SaaS for team expense tracking and approvals.

- **North Star metric:** weekly active approvers
- **Core loop:** SUBMIT → REVIEW → APPROVE/REJECT → REIMBURSE → REPORT
- Every feature must serve one moment of the loop. If it doesn't, question the priority.

---

## Product Principles (non-negotiable)

1. **Approver time is sacred** — anything that adds clicks to an approval must justify itself.
2. **Auditability over speed** — every money-affecting action is logged and reversible.
3. **MVP first** — ship the minimum that validates value, then iterate.

## Product Anti-patterns (never build)

- Hiding fees or totals from approvers.
- Auto-approving expenses without an explicit policy rule.
- Dark patterns that nudge over-spending.

---

## Technical Governance

### Backend (api) absolutes
- Validate every endpoint's input (DTO + class-validator/Zod). No unvalidated bodies.
- All money is stored in integer minor units (cents) — never floats.
- No raw SQL outside repositories; all access through Prisma.
- Structured logging only; never `console.log`. Secrets via config module.

### Frontend (web/mobile) absolutes
- All user-facing strings via i18n — never hardcoded.
- Server state only through typed TanStack Query hooks; no ad-hoc fetch in components.
- Forms validated with Zod schemas shared with the api where possible.

### Code principles (YAGNI · KISS · DRY)
1. **YAGNI** — don't build what the spec didn't ask for.
2. **KISS** — least code that solves it, most readable.
3. **DRY** — remove *real* duplication after it works; "duplicate once, abstract twice".

Business rules (validations, money math, policy thresholds): DRY mandatory.
Infrastructure: DRY on the third occurrence. UI: KISS dominates.

---

## Recorded Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Money representation | integer cents | float rounding is unacceptable for finance |
| ORM | Prisma | type-safe access; migrations in-repo |
| Server state | TanStack Query | cache + invalidation without global stores |

---

## Feature Development Workflow

```
discovery → architect → planner → implementers (parallel)
                                        ↓
                                       qa
                                        ↓
                                human review (PRs)
```

Specs live in `docs/specs/YYYY-MM-DD-feature-slug/` (`brief.md` → `spec.md` → `tasks.md`).

**Non-negotiable:** no direct commits to `develop`, `staging`, `main`. All code enters via PR.
