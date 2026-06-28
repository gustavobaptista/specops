export const meta = {
  name: 'feature-pipeline',
  description: 'Stack-agnostic feature pipeline: profile → spec → tasks → parallel impl → QA → PRs → review loop',
  phases: [
    { title: 'Profile',        detail: 'Read project-profile.md → resolve subprojects, paths, prefixes' },
    { title: 'Preflight',      detail: 'Inspect current state of spec & tasks' },
    { title: 'Spec',           detail: 'Generate or validate spec.md' },
    { title: 'Tasks',          detail: 'Generate or validate tasks.md and detect subprojects' },
    { title: 'Implementation', detail: 'Implementers run in parallel (one per subproject)' },
    { title: 'QA',             detail: 'Validate business rules (up to 2 attempts)' },
    { title: 'PR',             detail: 'Open Pull Requests to develop' },
    { title: 'Review',         detail: 'Wait for pr-reviewer and fix blockers (up to 3 cycles)' },
  ],
}

// ─── Input ─────────────────────────────────────────────────────────────────────
// Invoke with: Workflow({ scriptPath: '...', args: { specDir: 'docs/specs/2026-06-27-my-feature' } })
// Everything else — subprojects, dirs, prefixes, implementer defs — comes from the
// project profile, NOT from this file. That is what makes this pipeline reusable.
const specDir = (args && args.specDir)
if (!specDir) throw new Error('Pass args.specDir, e.g. { specDir: "docs/specs/2026-06-27-my-feature" }')

// ─── GATE 0 — Profile ───────────────────────────────────────────────────────────
// Read .claude/project-profile.md and return the machine-readable config the rest
// of the pipeline runs on. This replaces all the hardcoded path/prefix constants.
phase('Profile')

const PROFILE_SCHEMA = {
  type: 'object',
  required: ['repoRoot', 'specsDir', 'worktreeRoot', 'requiredSpecSections', 'subprojects'],
  properties: {
    repoRoot:     { type: 'string' },
    specsDir:     { type: 'string' },
    worktreeRoot: { type: 'string' },
    requiredSpecSections: { type: 'array', items: { type: 'string' } },
    subprojects: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'dir', 'prefix', 'implementerDef'],
        properties: {
          key:            { type: 'string' },  // e.g. "backend"
          dir:            { type: 'string' },  // absolute path
          prefix:         { type: 'string' },  // e.g. "B" — task id prefix
          implementerDef: { type: 'string' },  // absolute path to the implementer .md
        },
      },
    },
  },
}

const profile = await agent(`
Read .claude/project-profile.md and return its configuration as JSON.
Extract: repoRoot, specsDir, worktreeRoot, requiredSpecSections, and the full subprojects
table (key, absolute dir, task prefix, absolute implementer-def path).
`, { label: 'read-profile', phase: 'Profile', schema: PROFILE_SCHEMA })

if (!profile) throw new Error('Could not read .claude/project-profile.md. Run /sdd-init first.')

const REQUIRED_SPEC_SECTIONS = profile.requiredSpecSections
const SP = Object.fromEntries(profile.subprojects.map(s => [s.key, s]))
const ALL_KEYS = profile.subprojects.map(s => s.key)
const featureName = specDir.split('/').pop() || 'feature'
const WORKTREE_ROOT = profile.worktreeRoot

log(`Profile loaded — subprojects: ${ALL_KEYS.join(', ')}`)
log(`Pipeline starting: ${specDir}`)

// ─── GATE 1 — Preflight ─────────────────────────────────────────────────────────
phase('Preflight')

const preflight = await agent(`
You are the pipeline orchestrator. Inspect the current state of ${specDir}.

Do exactly this (use Read/Glob):
1. Try to read ${specDir}/brief.md — extract the feature title if present.
2. Try to read ${specDir}/spec.md — check it has ALL required sections:
   ${REQUIRED_SPEC_SECTIONS.join(', ')}.
3. Try to read ${specDir}/tasks.md:
   a. Check it has tasks with IDs (prefixes: ${ALL_KEYS.map(k => SP[k].prefix).join(', ')}, plus E2E).
   b. For EACH task, read the status emoji at the start of the line:
      ✅ = done | 🔄 = in progress | ⬜ = pending (or no emoji = pending).
   c. Return the IDs grouped by status.

If neither brief.md nor spec.md exists, report hasBrief=false and specExists=false.
`, {
  label: 'preflight',
  phase: 'Preflight',
  schema: {
    type: 'object',
    required: ['hasBrief', 'specExists', 'specComplete', 'tasksExist', 'tasksComplete', 'subprojects'],
    properties: {
      featureTitle:    { type: 'string' },
      hasBrief:        { type: 'boolean' },
      specExists:      { type: 'boolean' },
      specComplete:    { type: 'boolean' },
      specMissing:     { type: 'array', items: { type: 'string' } },
      tasksExist:      { type: 'boolean' },
      tasksComplete:   { type: 'boolean' },
      subprojects:     { type: 'array', items: { type: 'string' } },
      tasksDone:       { type: 'array', items: { type: 'string' } },
      tasksInProgress: { type: 'array', items: { type: 'string' } },
      tasksPending:    { type: 'array', items: { type: 'string' } },
    },
  },
})

if (!preflight) throw new Error('Preflight failed — check the directory exists.')
if (!preflight.hasBrief && !preflight.specExists) {
  throw new Error(
    `No brief.md or spec.md found in ${specDir}.\n` +
    'Run product-discovery first to generate brief.md.'
  )
}

log(`Feature: ${preflight.featureTitle || specDir}`)

// ─── GATE 2 — Spec ───────────────────────────────────────────────────────────────
if (!preflight.specExists || !preflight.specComplete) {
  phase('Spec')
  log('Generating spec.md via spec-generator...')

  const specResult = await agent(
    `Generate the spec for the feature in: ${specDir}/brief.md\nSave spec.md to ${specDir}/spec.md`,
    { label: 'spec-generator', phase: 'Spec', agentType: 'spec-generator' }
  )
  if (!specResult) throw new Error('spec-generator failed — check brief.md.')

  const specCheck = await agent(`
Read ${specDir}/spec.md and verify it contains ALL sections:
${REQUIRED_SPEC_SECTIONS.join(', ')}.
Respond only with JSON.
  `, {
    label: 'validate-spec',
    phase: 'Spec',
    schema: {
      type: 'object',
      required: ['valid', 'missingSections'],
      properties: {
        valid:           { type: 'boolean' },
        missingSections: { type: 'array', items: { type: 'string' } },
      },
    },
  })

  if (!specCheck || !specCheck.valid) {
    const missing = (specCheck && specCheck.missingSections) || ['unknown']
    throw new Error(`spec.md generated but incomplete. Missing sections: ${missing.join(', ')}.`)
  }
  log('✅ spec.md generated and validated')
}

// ─── GATE 3 — Tasks ──────────────────────────────────────────────────────────────
let subprojects = (preflight.subprojects || []).filter(k => ALL_KEYS.includes(k))

if (!preflight.tasksExist || !preflight.tasksComplete) {
  phase('Tasks')
  log('Generating tasks.md via task-generator...')

  const taskResult = await agent(
    `Generate the tasks from the spec: ${specDir}/spec.md`,
    { label: 'task-generator', phase: 'Tasks', agentType: 'task-generator' }
  )
  if (!taskResult) throw new Error('task-generator failed — check spec.md.')

  const prefixList = ALL_KEYS.map(k => `- ${k}: prefix ${SP[k].prefix} (e.g. ${SP[k].prefix}0-001)`).join('\n')
  const tasksCheck = await agent(`
Read ${specDir}/tasks.md and identify which subprojects have tasks:
${prefixList}
Include only subprojects with at least 1 task. Return their keys.
  `, {
    label: 'detect-subprojects',
    phase: 'Tasks',
    schema: {
      type: 'object',
      required: ['subprojects'],
      properties: { subprojects: { type: 'array', items: { type: 'string' } } },
    },
  })

  if (tasksCheck && tasksCheck.subprojects.length > 0) {
    subprojects = tasksCheck.subprojects.filter(k => ALL_KEYS.includes(k))
  }
  if (subprojects.length === 0) throw new Error('No subprojects detected in tasks. Check tasks.md.')
  log(`✅ tasks.md generated — subprojects: ${subprojects.join(', ')}`)
}

// ─── GATE 4 — Implementation (parallel) ──────────────────────────────────────────
phase('Implementation')
log(`Implementing in parallel: ${subprojects.join(' + ')}`)

const runImplementers = async (gapContext) => {
  const done       = preflight.tasksDone       || []
  const inProgress = preflight.tasksInProgress || []
  const pending    = preflight.tasksPending    || []
  const taskStatusNote = done.length > 0 ? `

--- CURRENT TASK STATE (read tasks.md and verify before starting) ---
✅ Done — do NOT reimplement: ${done.join(', ')}
🔄 In progress — resume here: ${inProgress.length ? inProgress.join(', ') : '(none)'}
⬜ Pending — implement in order: ${pending.length ? pending.join(', ') : '(none)'}

MANDATORY: mark 🔄 in tasks.md BEFORE writing code for each task; mark ✅ as soon as
tests pass. Without this marking the pipeline cannot resume correctly.
---` : ''

  const runningSps = subprojects.filter(sp => {
    if (gapContext) return !!gapContext[sp]
    const prefix = SP[sp].prefix
    const hasPendingOrInProgress = [...inProgress, ...pending].some(id => id.startsWith(prefix))
    const hasDone = done.some(id => id.startsWith(prefix))
    if (!hasPendingOrInProgress && hasDone) {
      log(`${sp}: all tasks ✅ — implementer skipped (workflow resume)`)
      return false
    }
    return true
  })

  const thunks = runningSps.map(sp => () => {
    const { dir, implementerDef: defPath, prefix } = SP[sp]
    const wt = `${WORKTREE_ROOT}/${sp}-${featureName}`
    const gapNote = gapContext && gapContext[sp]
      ? `\n\n--- GAPS FOUND BY QA (fix before finishing) ---\n${gapContext[sp]}\n---`
      : ''
    return agent(`
Read ${defPath} and follow ALL its instructions to implement the ${sp} side of the feature.

Input: ${specDir}/tasks.md${taskStatusNote}${gapNote}

━━━ MANDATORY ISOLATION — git worktree ━━━
Instead of "git checkout" directly in ${dir} (which pollutes other agents' staging area),
create an isolated worktree BEFORE writing any code:

  git -C ${dir} worktree remove ${wt} --force 2>/dev/null || true
  git -C ${dir} fetch origin
  git -C ${dir} worktree add ${wt} develop
  cd ${wt}
  git checkout -b feature/${sp}-${featureName}

Do ALL commits, pushes and builds from ${wt}. After pushing the branch:
  git -C ${dir} worktree remove ${wt} --force

━━━ tasks.md — edit ONLY your prefix ━━━
When updating ${specDir}/tasks.md, modify ONLY task lines with prefix ${prefix}
(e.g. ${prefix}0-001). Do not touch other prefixes — line-disjoint edits merge cleanly
between parallel agents.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      { label: `${sp}-implementer`, phase: 'Implementation' })
  })

  const runResults = await parallel(thunks)
  return subprojects.map(sp => {
    const idx = runningSps.indexOf(sp)
    if (idx === -1) return true // skipped = all done = success
    return runResults[idx]
  })
}

const runFixers = async (blockersBySubproject, openedPRs) => {
  const thunks = openedPRs
    .filter(pr => blockersBySubproject[pr.subproject])
    .map(pr => () => {
      const { dir, implementerDef: defPath } = SP[pr.subproject]
      const wt = `${WORKTREE_ROOT}/${pr.subproject}-${featureName}-fix-${pr.number}`
      const blockers = blockersBySubproject[pr.subproject]
      return agent(`
Read ${defPath} for the project's code standards.

Code already exists on the PR branch ${pr.url}.
Your only task is to FIX the following blockers raised by the code reviewer:

${blockers}

━━━ MANDATORY ISOLATION — git worktree ━━━
Do NOT checkout directly in ${dir}. Use an isolated worktree for the existing branch:

  git -C ${dir} worktree remove ${wt} --force 2>/dev/null || true
  git -C ${dir} fetch origin
  BRANCH=$(gh pr view ${pr.number} --repo ${pr.repo} --json headRefName -q ".headRefName")
  git -C ${dir} worktree add ${wt} $BRANCH
  cd ${wt}

Steps:
1. Locate each file/line mentioned and apply the fix
2. Run the relevant tests to confirm nothing broke
3. git commit -m "fix: address code review blockers — cycle ${pr._cycle || '?'}"
4. git push
5. git -C ${dir} worktree remove ${wt} --force

Do NOT create a new branch. Do NOT open a new PR. Just fix, commit and push to the existing branch.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        { label: `fix-${pr.subproject}`, phase: 'Review' })
    })
  return parallel(thunks)
}

let implResults = await runImplementers(null)
const failedFirst = subprojects.filter((_, i) => !implResults[i])
if (failedFirst.length > 0) {
  throw new Error(`Implementers failed: ${failedFirst.join(', ')}. Check agent logs and fix spec/tasks.`)
}
log('✅ First implementation round complete')

// ─── GATE 5 — QA with retry loop ─────────────────────────────────────────────────
phase('QA')

const QA_SCHEMA = {
  type: 'object',
  required: ['approved', 'gapsBySubproject'],
  properties: {
    approved:        { type: 'boolean' },
    summary:         { type: 'string' },
    gapsBySubproject: { type: 'object', additionalProperties: { type: 'string' } },
  },
}

let qaApproved = false
let qaAttempt = 0
const MAX_QA_RETRIES = 2

while (!qaApproved && qaAttempt < MAX_QA_RETRIES) {
  qaAttempt++
  log(`QA — attempt ${qaAttempt}/${MAX_QA_RETRIES}`)

  const qaResult = await agent(
    `Validate the feature delivery: ${specDir}/\n\nReport gaps per subproject in gapsBySubproject (keyed by subproject key). If approved, gapsBySubproject must be empty.`,
    { label: `qa-${qaAttempt}`, phase: 'QA', agentType: 'qa-validator', schema: QA_SCHEMA }
  )

  if (!qaResult) { log('⚠️ qa-validator returned nothing — aborting QA loop'); break }

  if (qaResult.approved) {
    qaApproved = true
    log('✅ QA approved!')
  } else if (qaAttempt < MAX_QA_RETRIES) {
    const gaps = qaResult.gapsBySubproject || {}
    const affectedSps = Object.keys(gaps).filter(sp => gaps[sp] && subprojects.includes(sp))
    log(`❌ QA rejected — relaunching implementers with gaps: ${affectedSps.join(', ')}`)
    await runImplementers(gaps)
  }
}

if (!qaApproved) {
  throw new Error(`QA rejected after ${qaAttempt} attempts. See ${specDir}/qa-report*.md and fix gaps manually.`)
}

// ─── GATE 6 — PRs ─────────────────────────────────────────────────────────────────
phase('PR')
log('Opening Pull Requests...')

const PR_SCHEMA = {
  type: 'object',
  required: ['url', 'number', 'repo', 'subproject'],
  properties: {
    url:        { type: 'string' },
    number:     { type: 'number' },
    repo:       { type: 'string' },
    subproject: { type: 'string' },
  },
}

const prOpenResults = await parallel(subprojects.map(sp => () =>
  agent(`
Open a PR to develop with the ${sp} changes for the feature in ${specDir}/spec.md.

- Use "gh pr create" from the current ${sp} branch
- Title: feat(${sp}): <feature name>
- Body: link to ${specDir}/spec.md plus a change summary
- Target: develop

Return JSON: url (full PR URL), number (integer), repo ("owner/repo"), subproject ("${sp}").
  `, { label: `pr-${sp}`, phase: 'PR', schema: PR_SCHEMA })
))

const openedPRs = prOpenResults.filter(Boolean)
if (openedPRs.length === 0) throw new Error('No PR opened. Check branches were created and pushed.')
log(`✅ ${openedPRs.length}/${subprojects.length} PR(s) opened: ${openedPRs.map(p => p.url).join(', ')}`)

// ─── GATE 7 — Review loop ──────────────────────────────────────────────────────────
phase('Review')

const MAX_REVIEW_CYCLES = 3
const REVIEW_CHECK_SCHEMA = {
  type: 'object',
  required: ['subproject', 'prNumber', 'hasBlockers', 'blockers'],
  properties: {
    subproject:  { type: 'string' },
    prNumber:    { type: 'number' },
    hasBlockers: { type: 'boolean' },
    blockers:    { type: 'array', items: { type: 'string' } },
    reviewState: { type: 'string' },
  },
}

let reviewAllClear = false

for (let cycle = 1; cycle <= MAX_REVIEW_CYCLES; cycle++) {
  log(`Review — waiting for pr-reviewer on ${openedPRs.length} PR(s)... (cycle ${cycle}/${MAX_REVIEW_CYCLES})`)

  const reviewChecks = await parallel(openedPRs.map(pr => () =>
    agent(`
You are monitoring a PR that was just opened.

1. Wait for all checks to finish:
   gh pr checks ${pr.number} --repo ${pr.repo} --watch
2. Read the body of the latest review posted by the bot:
   gh pr view ${pr.number} --repo ${pr.repo} --json reviews --jq '.reviews | sort_by(.submittedAt) | last | .body'
3. Decide if the result requires changes (header marker "CHANGES REQUIRED" or [BLOCKER] entries).
4. Extract each blocker (file, line, suggested fix).
5. Return the structured result.
    `, { label: `review-check-${pr.subproject}-${cycle}`, phase: 'Review', schema: REVIEW_CHECK_SCHEMA })
  ))

  const prsWithBlockers = reviewChecks.filter(Boolean).filter(r => r.hasBlockers)

  if (prsWithBlockers.length === 0) {
    reviewAllClear = true
    log('✅ No blockers on any PR — ready for manual approval')
    break
  }

  prsWithBlockers.forEach(r => {
    log(`❌ ${r.subproject} (PR #${r.prNumber}): ${r.blockers.length} blocker(s)`)
    r.blockers.forEach(b => log(`   • ${b}`))
  })

  if (cycle === MAX_REVIEW_CYCLES) {
    log(`⚠️ Max cycle (${MAX_REVIEW_CYCLES}) reached with blockers still present.`)
    break
  }

  const blockersBySubproject = {}
  prsWithBlockers.forEach(r => { blockersBySubproject[r.subproject] = r.blockers.join('\n') })

  const prsToFix = openedPRs
    .filter(pr => blockersBySubproject[pr.subproject])
    .map(pr => Object.assign({}, pr, { _cycle: cycle }))

  log(`Fixing blockers in: ${prsWithBlockers.map(r => r.subproject).join(', ')}`)
  await runFixers(blockersBySubproject, prsToFix)
  log(`Fixes pushed (cycle ${cycle}) — waiting for next review...`)
}

// ─── Final result ───────────────────────────────────────────────────────────────
log(reviewAllClear ? '✅ Ready for approval — no blockers' : '⚠️ PRs open but blockers remain — manual review needed')

return {
  feature:       preflight.featureTitle || specDir,
  subprojects,
  qaAttempts:    qaAttempt,
  prs:           openedPRs.map(p => p.url),
  reviewAllClear,
  message: reviewAllClear
    ? 'All PRs have no blockers. Review and approve manually to merge to develop.'
    : 'Blockers persisted after the max cycles. Check the PRs manually.',
}
