import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"
import { load as parseYaml } from "js-yaml"

const SKILL_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-brainstorm/SKILL.md",
)
const SKILL_BODY = readFileSync(SKILL_PATH, "utf8")

const HANDOFF_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-brainstorm/references/handoff.md",
)
const HANDOFF_BODY = readFileSync(HANDOFF_PATH, "utf8")

const HTML_OUTPUT_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-brainstorm/references/html-output.md",
)

// Mirror of the ce-plan output-mode tests. ce-brainstorm gains the same
// `output:html` / `output:md` argument with a parallel resolution path
// (config key `brainstorm_output` instead of `plan_output`) and the same
// pipeline-mode force-`md` rule. The HTML composition reference is duplicated
// byte-for-byte from ce-plan (enforced by tests/compound-support-files.test.ts).
describe("ce-brainstorm output:html mode", () => {
  test("argument-hint advertises output:html", () => {
    const frontmatterMatch = SKILL_BODY.match(/^---\n([\s\S]*?)\n---/)
    expect(frontmatterMatch).not.toBeNull()
    const frontmatter = parseYaml(frontmatterMatch![1]) as Record<string, unknown>
    const hint = frontmatter["argument-hint"]
    expect(
      typeof hint === "string" && hint.includes("output:html"),
      `ce-brainstorm argument-hint must mention 'output:html' so humans discover the flag. Current value: ${JSON.stringify(hint)}`,
    ).toBe(true)
  })

  test("SKILL.md describes the Output Mode resolution inline", () => {
    const phaseStart = SKILL_BODY.indexOf("#### 0.0")
    expect(
      phaseStart,
      "ce-brainstorm SKILL.md is missing the Phase 0.0 Output Mode resolution section.",
    ).toBeGreaterThan(-1)
    const phaseRegion = SKILL_BODY.slice(phaseStart, phaseStart + 3000)

    expect(
      /output:/.test(phaseRegion),
      "Phase 0.0 must name the `output:` argument prefix.",
    ).toBe(true)
    expect(
      /brainstorm_output/.test(phaseRegion),
      "Phase 0.0 must name the `brainstorm_output` config key (the ce-brainstorm parallel to ce-plan's `plan_output`).",
    ).toBe(true)
    expect(
      /pipeline|disable-model-invocation/i.test(phaseRegion),
      "Phase 0.0 must describe the pipeline-mode override that forces markdown.",
    ).toBe(true)
    expect(
      /literal[\s-]prefix|literal prefix/i.test(phaseRegion),
      "Phase 0.0 must state the literal-prefix token-parsing convention.",
    ).toBe(true)
    expect(
      /mode:/.test(phaseRegion) && /output:/.test(phaseRegion),
      "Phase 0.0 token-parsing convention must name both `mode:` and `output:` as literal-prefix flags.",
    ).toBe(true)
  })

  test("brainstorm-to-plan handoff does NOT auto-propagate output:", () => {
    // Asymmetric output is acceptable. ce-plan re-resolves its own
    // `plan_output` config independently. The SKILL.md should make this
    // explicit so users with mismatched config aren't surprised.
    const phaseStart = SKILL_BODY.indexOf("#### 0.0")
    const phaseRegion = SKILL_BODY.slice(phaseStart, phaseStart + 3000)
    expect(
      /does NOT auto-propagate|does not auto-propagate|re-resolves its own/i.test(phaseRegion),
      "ce-brainstorm SKILL.md must state that the output: preference does not auto-propagate to ce-plan on handoff (ce-plan re-resolves its own plan_output independently).",
    ).toBe(true)
  })

  test("Phase 3 includes HTML emission instruction", () => {
    const phase3Start = SKILL_BODY.indexOf("### Phase 3:")
    expect(phase3Start).toBeGreaterThan(-1)
    const phase3Region = SKILL_BODY.slice(phase3Start, phase3Start + 2500)
    expect(
      /OUTPUT_FORMAT[=\s]*html|HTML emission/i.test(phase3Region),
      "Phase 3 must include conditional HTML emission for OUTPUT_FORMAT=html.",
    ).toBe(true)
    expect(
      /references\/html-output\.md|html-output\.md/i.test(phase3Region),
      "Phase 3 must point at references/html-output.md for the composition rules.",
    ).toBe(true)
  })

  test("handoff.md offers Open in browser as mutual-exclusion replacement for Open in Proof", () => {
    expect(
      /Open in browser/.test(HANDOFF_BODY),
      "handoff.md must include the 'Open in browser' option for HTML mode.",
    ).toBe(true)
    expect(
      /mutual exclusion|replaced by|OUTPUT_FORMAT=html/i.test(HANDOFF_BODY),
      "handoff.md must state the mutual-exclusion rule (Open in browser replaces Open in Proof in HTML mode) to keep the 6-option cap honored.",
    ).toBe(true)
  })

  test("handoff.md menu gate predicate matches Phase 3 HTML composition gate", () => {
    // Same fix as ce-plan: the menu gate must match the composition gate.
    // A resume run with a .html sibling but OUTPUT_FORMAT=md (default-source)
    // regenerates the HTML in Phase 3 but a OUTPUT_FORMAT-only menu gate would
    // hide "Open in browser" — leaving the user with fresh HTML and no menu
    // option to open it.
    const browserGateRegion = HANDOFF_BODY.match(/Open in browser[\s\S]{0,600}/)
    expect(browserGateRegion).not.toBeNull()
    const text = browserGateRegion![0]
    expect(
      /sibling.*re-render|HTML.*emitted|HTML artifact.*produced|Phase 0\.1.*marked/i.test(text),
      "handoff.md 'Open in browser' menu gate must use Phase 3's HTML emission predicate (OUTPUT_FORMAT=html OR sibling-marked re-render), not just OUTPUT_FORMAT=html.",
    ).toBe(true)
  })

  test("html-output.md reference exists at parallel path", () => {
    const body = readFileSync(HTML_OUTPUT_PATH, "utf8")
    expect(body.length).toBeGreaterThan(0)
    // Spot-check that the same major sections we promise in ce-plan are present.
    expect(/Precedence stack/i.test(body)).toBe(true)
    expect(/Active-recall instruction/i.test(body)).toBe(true)
    expect(/Hard invariants/i.test(body)).toBe(true)
    expect(/Composition timing/i.test(body)).toBe(true)
    expect(/Content-shape questions/i.test(body)).toBe(true)
    expect(/Affordance idioms/i.test(body)).toBe(true)
    expect(/Fallback default style/i.test(body)).toBe(true)
    expect(/Agent-consumability rules/i.test(body)).toBe(true)
    expect(/Post-compose audit/i.test(body)).toBe(true)
  })
})
