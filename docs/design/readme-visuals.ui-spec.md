# SpecOps README Visuals — UI Spec
**Date:** 2026-07-04
**Assets:** [`../../assets/hero.svg`](../../assets/hero.svg) · [`../../assets/structure.svg`](../../assets/structure.svg)
**Embedded in:** [`../../README.md`](../../README.md) (hero at top; structure under "How it's organized")
**Surfaces:** two static SVG cards, `viewBox 1200×600` (2:1), rendered at `width="900"` in README, and reused as GitHub social-preview / LinkedIn card.

This is a design **contract**, not code. It fixes hierarchy, grid, type scale, and a prioritized change list so an implementer places every element deterministically and QA can verify pass/fail.

---

## Design tokens (source of truth)

Do not introduce a color or font outside this table. Max **2 color ramps**: a neutral gray ramp (backgrounds/text/borders) and one blue accent; **green is a single semantic spot color** (success/highlight only), not a ramp.

| Token | Value | Use |
|---|---|---|
| `bg` | `#0D1117` | card background (self-contained, theme-proof) |
| `surface` | `#161B22` | chip / node fill |
| `surface-alt` | `#11161F` | operational chips, parallel-stack ghosts (one step darker than surface) |
| `border` | `#30363D` | card + chip borders |
| `rule` | `#21262D` | footer hairline |
| `text` | `#E6EDF3` | primary labels, wordmark |
| `secondary-text` | `#C9D1D9` | chip node titles in tree, operational chip text |
| `muted` | `#8B949E` | tagline, subtitles, annotations, section labels |
| `accent` | `#58A6FF` | flow: connectors, wordmark "Ops", active node, dir names |
| `success` | `#3FB950` | terminal `✓ PR`, the one highlighted config line |
| `success-bg` | `#102A1B` / `#10261A` | success fills (highlight band, terminal chip) |
| `success-border` | `#1F6F3F` | success outline |
| `mono-tag` | `#79C0FF` | artifact tags under pipeline chips (`brief.md`, etc.) |
| `tree-connector` | `#484F58` | tree glyphs `├── │ └──` |

**Type families:** sans = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (labels); mono = `ui-monospace, SFMono-Regular, Menlo, monospace` (paths, artifacts, code, URLs).

---

# Image 1 — hero.svg

**Objective (1 line):** in ~2s a developer grasps *this is an orchestrated squad that carries a feature from spec to a merged PR, with parallelism, gates and loops.*

## 1. Visual hierarchy (reading order)

1. **Wordmark `SpecOps`** — largest element (52px, 800). Blue "Ops" is the single accent anchor top-left. Establishes brand instantly.
2. **The pipeline row** — 7 nodes on one baseline, connected by blue arrows, ending in the green `✓ PR`. The eye rides left→right along the arrow flow; the **green terminal is the payoff** and the second-strongest point on the canvas.
3. **The `implementer ×N` node** — the only accent-bordered chip + its stacked "ghost" cards behind it. This is the one node that must read as *different* (parallel), so it earns emphasis mid-row.
4. **The dashed loop arc + its label** — muted, deliberately below the flow; reads as "there's an automatic feedback loop" without competing with the main line.
5. **`ON DEMAND` operational row** — muted, smaller, clearly a secondary tier of roles.
6. **Footer** (tagline right, url left, flow summary) — quietest; reference/metadata only.

Enforcement: size (52 → 18 → 15 → 13), weight (800 → 600 → 400), and color (accent/text for the spine; muted for everything supporting).

## 2. Layout & spacing tokens

Canvas `1200×600`. **Content margin = 60px** (left/right); nothing crosses `x<60` or `x>1140`.

**Card:** `rect x6 y6 w1188 h588 rx18`, `stroke border 1.5`.

**Header band:**
- Wordmark baseline `y=84`, `x=60`.
- Tagline baseline `y=116`, `x=60` (align exactly to wordmark left — see change #1).

**PIPELINE section label:** dot `cx64 cy214`, text baseline `y=219 x=78`.

**Pipeline row (the spine):**
- Chip box: `w138 h72 rx12`, top `y=248`, so chip vertical center `= 284` (this is the **row baseline** for connectors).
- Chip pitch (left x of each): `60, 225, 390, 555, 720, 885` → step **165px** (138 chip + 27 gap).
- Connectors: blue lines on `y=284`, drawn in the 27px gaps (`x1` = chip right +3, `x2` = next chip left −3), `marker-end` arrow.
- Terminal `✓ PR`: `x1050 w90 h72` (narrower, intentional — it's an endpoint, not a role).
- Artifact tag baseline `y=345` (mono, `mono-tag`), centered under each chip.
- Chip title baseline `y=280`; subtitle baseline `y=300` (see change #3 for the +2px retune).

**Parallel ghost stack** (behind implementer, center `x=624`): two offset cards `surface-alt`, offsets `(+12,−12)` and `(+6,−6)` from the front chip, same `rx12`, `border` stroke, no text.

**Loop arc:** dashed `muted`, apex around `y=400`, springing from under `qa` (`x954`) back to under `implementer` (`x624`); label centered `x789 y392`.

**ON DEMAND row:** dot `cx64 cy452`, label `y457 x78`. Chips: top `y=470 h44 rx10`, `surface-alt` fill. Re-spaced to an even pitch (change #6): three chips, equal **190px** boxes, **16px** gaps → x = `60, 266, 472`.

**Footer:** hairline `rule` at `y=548` from `x60→x1140`. Below it, url (mono, left `x60 y572`) and flow summary (sans, right `x1140 y572`). Tagline block sits above-right: `stack-agnostic · config-driven` `y498` + `runs in Claude Code` `y520`, right-aligned `x1140`.

## 3. Type scale

| Element | Size | Weight | Family | Fill |
|---|---|---|---|---|
| Wordmark | 52 | 800 | sans | text / accent |
| Tagline | 19 | 400 | sans | muted |
| Section label (`PIPELINE`, `ON DEMAND`) | 13 | 700, letter-spacing 2 | sans | muted |
| Chip title | 18 | 600 | sans | text |
| Chip subtitle | 12.5 | 400 | sans | muted |
| Artifact tag | 13 | 400 | mono | mono-tag |
| Terminal `✓ PR` | 18 | 700 | sans | success |
| Loop label | 13 | 400 | sans | muted |
| Operational chip text | 15 | 400 | sans | secondary-text |
| Footer tagline | 14 | 400 | sans | secondary-text |
| Footer sub / url / flow | 13 | 400 | mono (url) / sans (flow) | muted |

## 4. Concrete adjustments (prioritized)

1. **Align tagline to wordmark left.** Tagline is at `x=63`, wordmark at `x=60`. Set tagline `x=60`. A 3px hang is visible at this size and reads as sloppy. *(P0, alignment)*
2. **Balance the header-to-pipeline gap.** There is dead space between tagline (`y116`) and the PIPELINE label (`y214`) — ~98px of nothing, while the operational row and footer are cramped at the bottom. Pull the whole pipeline block up ~16px (label `y198`, chips `y232`, tags `y329`, connectors/center `268`) to buy breathing room below and center the composition vertically. *(P0, vertical rhythm)*
3. **Fix chip title/subtitle baselines.** Title `y282` + subtitle `y302` inside a box that ends at `y320` leaves the subtitle 18px from the top edge but only 18px above the artifact zone — vertically it sits low. Retune to title `y280`, subtitle `y300` so the pair is optically centered in the top ~40px of the chip, with the 72px box reading as title-block over a quiet base. *(P1, balance)*
4. **Make the parallel-stack ghosts clearly read as a stack.** Current offsets (`+12,+6` on x, both nudged down) overlap ambiguously and one ghost pokes out the *bottom* near the artifact tag. Use two ghosts offset up-and-right only (`+6,−6` and `+12,−12`), so the stack fans toward the top-right and never collides with the `code · tests` tag below. This is the single most important "systems" signal — it must be unmistakable. *(P1, emphasis)*
5. **Strengthen the `✓ PR` payoff.** It's the reading-order climax but currently the same 72px height as roles while being visually lighter (just text). Keep the narrower width but add nothing new — instead ensure the last connector points *into* it and the green fill/border contrast is the strongest non-blue moment. Confirm the arrow gap before it matches the others (27px). *(P1, emphasis)*
6. **Even out the ON DEMAND row.** The three chips have different widths (178/208/236) sized to their text, producing ragged gaps. Standardize to **equal 190px boxes** on a 16px pitch (x = 60, 266, 472) and center each label; if `guardian · deploy + rollback` overflows 190px, drop to `guardian · deploy` (the "+ rollback" nuance lives in README Status). Equal chips read as "a set of peers," which is the intent. *(P1, consistency)*
7. **De-duplicate the footer flow summary.** The bottom-right `discovery → … → merge` string restates the pipeline row verbatim — redundant with the hero's whole point. Either cut it (preferred — let the visual speak) or demote it to a single quiet token. Keep url + tagline. *(P2, cut redundancy)*
8. **Loop label line length.** `auto QA + review loop · fixes on the existing branch` is long; at 900px width it's fine but tight under the arc. Keep, but ensure it clears the `qa`/`reviewer` artifact tags above it by ≥12px. *(P2, spacing)*

## 5. Visual acceptance checklist (hero)

- [ ] No element crosses the 60px margin; nothing clipped by the card edge.
- [ ] All 7 pipeline chips share one vertical center (connector baseline); arrows sit exactly on it.
- [ ] Connector gaps between chips are uniform (27px); every arrow terminates just inside the next chip.
- [ ] `implementer` is the only accent-bordered chip; its two ghost cards fan up-right and never overlap the artifact tag below.
- [ ] `✓ PR` is the only green element in the pipeline row and is the strongest non-blue point.
- [ ] Tagline left edge aligns to wordmark left edge (both `x=60`).
- [ ] ON DEMAND chips are equal width on a uniform pitch; labels centered; none overflow their box.
- [ ] ≤2 color ramps (gray + blue) plus the single green spot; no gradients/glows/shadows.
- [ ] Vertical composition is balanced — header gap ≈ footer gap, no large dead band.
- [ ] Text contrast ≥ 4.5:1 on `#0D1117` for all text ≥13px (muted `#8B949E` = 5.2:1 ✓).
- [ ] Renders legibly at 900px README width; artifact tags and subtitles still readable.
- [ ] `role="img"` with `<title>`/`<desc>` present and accurate.
- [ ] No footer element restates the pipeline row verbatim.

---

# Image 2 — structure.svg

**Objective (1 line):** show the repo is a clean, legible system where **one config file drives the whole squad** — the highlighted `project-profile.md` is the takeaway.

## 1. Visual hierarchy (reading order)

1. **Wordmark `SpecOps`** — 34px/800, top-left; smaller than hero (this is a secondary image), still the brand anchor.
2. **The highlighted `project-profile.md` row** — the green band + bold text + green annotation `← the one config that drives it all`. This is the *thesis* of the image and must win attention over the rest of the tree. It is the 2nd thing the eye lands on despite being mid-list, because it is the only colored/filled row.
3. **The `agents/` block** (the squad — one role per file, 9 roles across 3 lines) — the largest labeled group; blue dir name draws the eye.
4. **The remaining dir names** (`workflows/`, `commands/`, `templates/`, `hooks/`, `examples/`, `docs/`) — blue, scannable left column.
5. **Right-column annotations** — muted plain-English gloss per row; supportive, read second within each line.
6. **Footer** — url + summary stat line, quietest.

Enforcement: only two rows carry non-muted emphasis (the `specops/` root name in blue, and the green profile row). Everything else is a calm monospace tree so the one highlight pops.

## 2. Layout & spacing tokens

Canvas `1200×600`. Margin 60px. Card identical to hero.

**Header:** wordmark baseline `y=78 x=60`; sub-tagline `Repository map — one config drives the whole squad.` baseline `y=106`, **`x=60`** (fix the current `x=62`, change #1).

**Tree block (mono, 16px):**
- Left text `x=70`.
- **Line-height = 26px**, first row baseline `y=156`, running `156, 182, 208, … 520` (14 rows).
- Tree glyphs (`├──`, `│`, `└──`) in `tree-connector`; indentation via leading glyph tspans.
- **Annotation column x = 540** (right-column gloss on every row), muted, same baseline as its row.

**Highlight band:** `rect x60 y=377 w1080 h26 rx6`, fill `success-bg`, stroke `success-border`. Must be **vertically centered on the `project-profile.md` row** (baseline `y390`): for a 26px band and 16px mono text, top = `390 − 26 + 6 = 370`… see change #2 — retune to `y=377` so the cap-height of the row sits centered in the band.

**Footer:** hairline `y=548` `x60→x1140`; url mono left `x60 y572`; summary sans right `x1140 y572`.

## 3. Type scale

| Element | Size | Weight | Family | Fill |
|---|---|---|---|---|
| Wordmark | 34 | 800 | sans | text / accent |
| Sub-tagline | 16 | 400 | sans | muted |
| Root dir `specops/` | 16 | 400 | mono | accent |
| Dir names (`agents/` …) | 16 | 400 | mono | accent |
| Leaf role/file lists | 16 | 400 | mono | secondary-text |
| `project-profile.md` (highlight) | 16 | 700 | mono | text |
| Profile annotation | 16 | 700 | mono | success |
| Tree glyphs | 16 | 400 | mono | tree-connector |
| Annotations (right col) | 16 | 400 | mono | muted |
| Footer url / summary | 13 | 400 | mono / sans | muted |

## 4. Concrete adjustments (prioritized)

1. **Align sub-tagline to wordmark left** — `x=62` → `x=60`, matching the hero fix. *(P0, alignment)*
2. **Center the highlight band on its row.** With text baseline `y=390` and a 26px band, the band must vertically bracket the glyph cap-to-baseline. Set band `y=377` (so it spans ~`377→403`, centering the 16px text whose visual center ≈ `385`). Verify optically: equal green above and below the letters. Currently `y=373` sits slightly high. *(P0, the thesis element must be pixel-clean)*
3. **Tighten the annotation column consistency.** All annotations start at `x=540`; confirm none wrap or collide with the card's 1140 right margin. Longest is `← the one config that drives it all` (green) and `/sdd-init · /sdd-run · /sdd-feature` — both must end before `x=1140`. At 16px mono, `x540` + ~44 chars ≈ 1090, safe. Keep `x=540`. *(P1, verify)*
4. **Make the two blue emphasis levels distinct from the green one.** Dir names and the root are both `accent` blue; the profile row is the *only* green. Good — but ensure no other row accidentally uses bold or green. Audit: only `project-profile.md` line carries `font-weight=700` + green. *(P1, protect the single highlight)*
5. **Vertical fit.** 14 rows at 26px from `y156` end at `y520`; footer hairline at `y548`. Gap below last row (`520→548` = 28px) roughly matches header gap (wordmark `78` → first row `156` minus header block). Acceptable; do **not** add rows without recomputing. If a row is ever added, reduce line-height to keep the last row ≤ `y520`. *(P2, guardrail)*
6. **Footer summary parallelism with hero.** `9 agents · 3 ways to run · tiered CI · zero stack assumptions` is a strong stat line — keep it. Ensure it visually mirrors the hero footer (same size 13, same right alignment, same muted). *(P2, cross-image consistency)*

## 5. Visual acceptance checklist (structure)

- [ ] No element crosses the 60px margin; no annotation reaches `x>1140`.
- [ ] All 14 tree rows share a uniform 26px line-height; baselines land on the `156 + 26k` grid.
- [ ] Highlight band is vertically centered on the `project-profile.md` row (equal green above/below the glyphs).
- [ ] `project-profile.md` is the **only** row with bold weight and the only green text/band — nothing else competes.
- [ ] Left column: only dir names and root are blue; leaf lists are `secondary-text`; glyphs are `tree-connector`.
- [ ] Right-column annotations all start at `x=540` and are muted.
- [ ] Sub-tagline left edge aligns to wordmark (`x=60`).
- [ ] ≤2 color ramps (gray + blue) plus the single green spot; no gradients/glows.
- [ ] Text contrast ≥ 4.5:1 on `#0D1117` for all rows (incl. `tree-connector #484F58` used only for decorative glyphs, not information-bearing text).
- [ ] Renders legibly at 900px README width; 16px mono still crisp, tree indentation still parseable.
- [ ] `role="img"` with `<title>`/`<desc>` present and accurate.
- [ ] Footer mirrors hero footer treatment (position, size, color).

---

## Cross-image consistency contract

- [ ] Identical card treatment (bg `#0D1117`, border `#30363D`, `rx18`, 60px margin).
- [ ] Identical wordmark construction (`Spec` text + `Ops` accent), scaled per image (52 hero / 34 structure).
- [ ] Identical footer system (hairline `y548`, mono url left, summary right, size 13, muted).
- [ ] Shared token table only — zero one-off colors across the two files.
- [ ] Both read correctly embedded at `width=900` in GitHub light **and** dark themes (self-contained dark card proves this).
