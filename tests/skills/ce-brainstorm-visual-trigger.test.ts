import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"

const CAPTURE_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-brainstorm/references/requirements-capture.md",
)
const CAPTURE_BODY = readFileSync(CAPTURE_PATH, "utf8")

const VISUAL_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-brainstorm/references/visual-communication.md",
)
const VISUAL_BODY = readFileSync(VISUAL_PATH, "utf8")

// Mirror of the ce-plan Phase 3.4 architecture-trigger fix, applied to
// the ce-brainstorm side. Requirements docs have different content shapes
// than plans (user flows, actors, acceptance examples vs. components,
// protocols, state machines) but the structural risk is identical: a
// soft "include when significantly easier" framing reads as skippable
// to a token-pressured agent.
describe("ce-brainstorm visual-communication trigger is load-bearing", () => {
  test("visual-communication.md trigger table is marked load-bearing", () => {
    expect(
      /Triggers \(load-bearing\)|load-bearing.*not a soft recommendation|hard rule.*not a soft recommendation/i.test(VISUAL_BODY),
      "visual-communication.md must mark the trigger table as load-bearing, parallel to the ce-plan Phase 3.4 fix.",
    ).toBe(true)
    expect(
      /[Tt]oken cost is .*NOT.*valid reason|token cost is not a valid reason|skipping the rendering is a defect/i.test(VISUAL_BODY),
      "visual-communication.md must explicitly reject token-economy as a skip reason.",
    ).toBe(true)
  })

  test("visual-communication.md trigger table uses concrete thresholds", () => {
    // The fix promotes vague "multi-step user workflow" to "Key Flow with
    // 3+ steps", same shape as the ce-plan side. Concrete thresholds make
    // the trigger non-debatable.
    expect(
      /Key Flow.*3\+ steps|flow.*3\+ steps/i.test(VISUAL_BODY),
      "visual-communication.md trigger table must use 'Key Flow with 3+ steps' (concrete threshold), not vague 'multi-step user workflow'.",
    ).toBe(true)
    expect(
      /2\+ actors handing off|2\+ actors.*handoff/i.test(VISUAL_BODY),
      "visual-communication.md must include the 2+ actors handing off trigger for sequence diagrams.",
    ).toBe(true)
    expect(
      /3\+ behavioral modes|3\+ states/i.test(VISUAL_BODY),
      "visual-communication.md must include the 3+ behavioral modes / 3+ states trigger.",
    ).toBe(true)
    expect(
      /3\+ interacting participants/i.test(VISUAL_BODY),
      "visual-communication.md must include the 3+ interacting participants trigger.",
    ).toBe(true)
    expect(
      /[Ee]ntity lifecycle.*3\+ states/i.test(VISUAL_BODY),
      "visual-communication.md must include the entity-lifecycle-with-3+-states trigger.",
    ).toBe(true)
  })

  test("visual-communication.md states per-shape and anti-padding rules", () => {
    expect(
      /[Tt]rigger fires per shape|multiple triggers.*multiple visuals|separate visual for each/i.test(VISUAL_BODY),
      "visual-communication.md must state the per-shape rule (multiple firing triggers → multiple visuals).",
    ).toBe(true)
    expect(
      /[Aa]nti-padding|each visual must add information|redundant views/i.test(VISUAL_BODY),
      "visual-communication.md must include the anti-padding rule (don't render redundant views to look thorough).",
    ).toBe(true)
  })

  test("requirements-capture.md Visual communication section uses load-bearing framing", () => {
    // The section in requirements-capture.md is the agent's first encounter
    // with the visual rule at plan-write time. Soft framing here defeats the
    // detailed trigger table in visual-communication.md.
    const visualSectionStart = CAPTURE_BODY.indexOf("## Visual communication")
    expect(visualSectionStart).toBeGreaterThan(-1)
    const sectionRegion = CAPTURE_BODY.slice(visualSectionStart, visualSectionStart + 1500)
    expect(
      /[Ll]oad-bearing when content triggers fire|load-bearing.*triggers fire/i.test(sectionRegion),
      "requirements-capture.md Visual communication section must use load-bearing framing, not 'when significantly easier to understand'.",
    ).toBe(true)
    expect(
      /[Tt]oken cost is not.*valid reason/i.test(sectionRegion),
      "requirements-capture.md Visual communication section must explicitly reject token-economy as a skip reason.",
    ).toBe(true)
  })

  test("requirements-capture.md Finalization checklist includes visual-presence audit", () => {
    expect(
      /[Vv]isual-aid presence audit|Count the firing triggers.*count the visuals|visual count must be at least/i.test(CAPTURE_BODY),
      "requirements-capture.md Finalization checklist must include a visual-aid presence audit: count firing triggers, count visuals, visuals >= firing trigger categories.",
    ).toBe(true)
  })
})
