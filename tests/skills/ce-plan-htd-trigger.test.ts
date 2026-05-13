import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"

const SKILL_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-plan/SKILL.md",
)
const SKILL_BODY = readFileSync(SKILL_PATH, "utf8")

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-plan/references/plan-template.md",
)
const TEMPLATE_BODY = readFileSync(TEMPLATE_PATH, "utf8")

// Regression guard for the markdown-side architecture-trigger gap surfaced
// by the cli-printing-press cloak plan. Phase 3.4 ("High-Level Technical
// Design") used to be marked "(Optional)" with soft "decide whether an
// overview would help" framing. Real-world dogfood with three triggers
// firing produced zero sketches because the agent read "Optional" as
// "skippable to save tokens" — same failure mode as the HTML-side diagram
// trigger. The fix is parallel to the HTML-side fix: load-bearing marker,
// per-shape trigger conditions, Phase 5.1 presence audit.
describe("ce-plan Phase 3.4 architecture-trigger is load-bearing", () => {
  test("Phase 3.4 header is marked load-bearing, not (Optional)", () => {
    const phase34Start = SKILL_BODY.indexOf("#### 3.4 High-Level Technical Design")
    expect(phase34Start).toBeGreaterThan(-1)
    const header = SKILL_BODY.slice(phase34Start, phase34Start + 200)
    // Must NOT be marked as plain "(Optional)" — that was the bug. Allowed
    // forms include "(Load-bearing when triggers fire)" or similar.
    expect(
      /\(Optional\)/.test(header),
      "Phase 3.4 must not be marked '(Optional)' — the trigger is load-bearing when fired. The (Optional) marker was the bug that produced zero sketches on the cloak plan despite three triggers firing.",
    ).toBe(false)
    expect(
      /[Ll]oad-?bearing/.test(header),
      "Phase 3.4 header must include the load-bearing marker so agents read the section as required (when triggers fire), not optional.",
    ).toBe(true)
  })

  test("Phase 3.4 names architecture triggers as a load-bearing rule", () => {
    const phase34Start = SKILL_BODY.indexOf("#### 3.4 High-Level Technical Design")
    const phase34Region = SKILL_BODY.slice(phase34Start, phase34Start + 4000)

    expect(
      /[Aa]rchitecture trigger.*\(load-bearing\)|hard rule on the same footing|NOT optional when/i.test(phase34Region),
      "Phase 3.4 must include an 'Architecture triggers (load-bearing)' subsection explicitly marking the rule.",
    ).toBe(true)
    // The trigger conditions must use the "3+ X" threshold structure parallel
    // to the HTML-side architecture trigger.
    expect(
      /3\+ components.*directed/i.test(phase34Region),
      "Phase 3.4 must name '3+ components with directed relationships' as a trigger (parallel to the HTML-side rule).",
    ).toBe(true)
    expect(
      /3\+ named steps|protocol.*3\+/i.test(phase34Region),
      "Phase 3.4 must name '3+ protocol steps' as a trigger.",
    ).toBe(true)
    expect(
      /3\+ states|state machine.*3\+/i.test(phase34Region),
      "Phase 3.4 must name '3+ states' as a trigger.",
    ).toBe(true)
    expect(
      /3\+ decision points|branching.*3\+/i.test(phase34Region),
      "Phase 3.4 must name '3+ decision points' as a trigger.",
    ).toBe(true)
  })

  test("Phase 3.4 explicitly rejects token-economy as a skip reason", () => {
    const phase34Start = SKILL_BODY.indexOf("#### 3.4 High-Level Technical Design")
    const phase34Region = SKILL_BODY.slice(phase34Start, phase34Start + 4000)
    expect(
      /[Tt]oken cost is .*NOT.*valid reason|"I'll skip the sketch to save tokens" is NOT|skipping the sketch is a defect/i.test(phase34Region),
      "Phase 3.4 must explicitly reject 'skip to save tokens' as a justification — this was the actual failure mode observed in dogfood.",
    ).toBe(true)
  })

  test("Phase 3.4 supports multiple sketches when multiple triggers fire", () => {
    const phase34Start = SKILL_BODY.indexOf("#### 3.4 High-Level Technical Design")
    const phase34Region = SKILL_BODY.slice(phase34Start, phase34Start + 4000)
    expect(
      /[Tt]rigger fires per shape|multiple triggers.*multiple sketches|separate sketch for each/i.test(phase34Region),
      "Phase 3.4 must state that multiple firing triggers produce multiple sketches (not one combined). Parallel to the HTML-side per-shape rule.",
    ).toBe(true)
    expect(
      /[Aa]nti-padding|each sketch must add information|redundant/i.test(phase34Region),
      "Phase 3.4 must include an anti-padding rule so agents don't render redundant views to look thorough.",
    ).toBe(true)
  })

  test("Phase 5.1 review checklist includes HTD presence audit", () => {
    const phase51Start = SKILL_BODY.indexOf("#### 5.1 Review Before Writing")
    expect(phase51Start).toBeGreaterThan(-1)
    const phase51Region = SKILL_BODY.slice(phase51Start, phase51Start + 4000)
    expect(
      /High-Level Technical Design presence audit|count the firing triggers.*count the sketches|sketch count must be at least/i.test(phase51Region),
      "Phase 5.1 must include a presence audit for the HTD section: count firing triggers, count sketches, sketches >= firing trigger categories. Parallel to the HTML-side post-compose diagram-presence audit.",
    ).toBe(true)
  })

  test("plan-template.md HTD section comment uses load-bearing framing", () => {
    // The plan template's HTD section comment used to say "Optional: Include
    // this section only when..." which agents read as skippable. The template
    // is what gets cloned into actual plan files, so the comment matters as
    // much as the SKILL.md guidance.
    const htdSectionStart = TEMPLATE_BODY.indexOf("## High-Level Technical Design")
    expect(htdSectionStart).toBeGreaterThan(-1)
    // Walk back to find the preceding HTML comment.
    const preceding = TEMPLATE_BODY.slice(0, htdSectionStart)
    const lastCommentStart = preceding.lastIndexOf("<!--")
    expect(lastCommentStart).toBeGreaterThan(-1)
    const commentBlock = TEMPLATE_BODY.slice(lastCommentStart, htdSectionStart)
    expect(
      /LOAD-BEARING|Load-bearing|load-bearing/i.test(commentBlock),
      "plan-template.md HTD section comment must use load-bearing framing, not 'Optional: Include this section only when...' phrasing.",
    ).toBe(true)
  })
})
