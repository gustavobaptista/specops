# Example — Acme (a fictional B2B SaaS)

A worked SpecOps configuration for a made-up product, **Acme** — a B2B team-expense SaaS.
It exists to show what a filled-in `project-profile.md` and `constitution.md` look like on
a stack that is deliberately *different* from where SpecOps was first battle-tested
(a Flutter + Firebase app). Same agents, same pipeline — only the profile changes.

Acme's shape:

| Subproject | Prefix | Stack |
|---|---|---|
| `api` | `A` | NestJS · Node 22 · TypeScript · PostgreSQL (Prisma) |
| `web` | `W` | Next.js 15 · React 19 · TypeScript · TanStack Query |
| `mobile` | `M` | React Native · Expo · TypeScript |

Copy these two files into your repo's `.claude/` and adapt — or just read them to see how
the placeholders in [`../../templates/`](../../templates/) get filled.
