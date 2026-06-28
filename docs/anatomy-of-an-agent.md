# Anatomy of an agent

Every process agent in this squad follows the same shape. Use `architect.md` as
the canonical reference and this as the checklist.

> Naming: agents are **personas/roles** (`discovery`, `architect`, `planner`,
> `implementer`, `qa`, `reviewer`, `auditor`) — a single namespace of "who".
> Slash commands are the separate "what you do" namespace (`/sdd-init`, `/sdd-run`).

## Frontmatter

```yaml
---
name: architect                # role/persona, kebab-case, unique
description: >                  # this is the ROUTER — be precise about WHEN to activate
  The squad's architect. Turns a feature idea into a spec. Activate when the user asks
  to specify/plan a feature before implementation. Stack-agnostic: reads the profile.
tools: Read, Glob, Grep, Write # least privilege — only what the job needs
model: opus                    # opus for design/judgment, smaller for mechanical work
memory: project                # opt into the per-agent memory directory
---
```

The `description` is not documentation — it's how Claude decides to invoke the agent.
State the trigger ("activate when…") and the boundary ("but NOT…") explicitly.

## Body, in order

1. **Role line.** One sentence: who the agent is and its single job.
2. **Step 0 — Load project context.** *Mandatory and first.* Read
   `.claude/project-profile.md`, then `constitution.md`, then any reference artifact.
   This is what keeps the agent stack-agnostic. Never assert a technology the body —
   defer to "whatever the profile declares".
3. **Pre-flight.** What to inspect/resolve before producing anything (find the brief,
   resolve the directory, scan existing code).
4. **Output format.** The exact template the agent must produce, with the required
   sections called out.
5. **Quality bar.** What "good" looks like — the criteria a reviewer would apply.
6. **Handoff.** What to tell the user and which agent runs next.

## Rules of thumb

- **Generic logic, injected context.** ~70% of a good agent (format, quality bar,
  gates, handoff) is stack-neutral. Only the *context* comes from the profile.
- **Verifiable over vibes.** Gates should be checkable facts, not self-scored
  confidence. "Does it contain these sections?" beats "rate the spec 8/10".
- **One job.** If an agent does two things, split it. The squad composes small agents;
  the pipeline orchestrates them.
- **Least privilege.** Give `tools:` only what the job needs. A spec writer needs
  Read/Glob/Grep/Write — not Bash.
