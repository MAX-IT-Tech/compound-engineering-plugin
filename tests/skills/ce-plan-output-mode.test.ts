import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"
import { load as parseYaml } from "js-yaml"

const SKILL_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-plan/SKILL.md",
)
const SKILL_BODY = readFileSync(SKILL_PATH, "utf8")

const HANDOFF_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-plan/references/plan-handoff.md",
)
const HANDOFF_BODY = readFileSync(HANDOFF_PATH, "utf8")

const HTML_OUTPUT_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-plan/references/html-output.md",
)

// Regression guard for the `output:html` / `output:md` argument introduced to
// ce-plan. Mirrors the conventions established by `mode:headless` parsing in
// ce-doc-review and ce-compound: literal-prefix flag token, stripped from
// `$ARGUMENTS` before the remainder is treated as the feature description.
//
// The actual HTML composition rules live in references/html-output.md (loaded
// only when OUTPUT_FORMAT=html). The skill body must carry the load-bearing
// surface: the argument-hint advertises the flag, the resolution prose is
// inline (not deferred to a reference), and the pipeline-mode override
// guarantees ce-work always has its markdown.
describe("ce-plan output:html mode", () => {
  test("argument-hint advertises output:html", () => {
    // argument-hint is in the frontmatter. Extract and parse to confirm
    // the token is visible to humans discovering the flag, not just buried
    // in skill prose.
    const frontmatterMatch = SKILL_BODY.match(/^---\n([\s\S]*?)\n---/)
    expect(frontmatterMatch).not.toBeNull()
    const frontmatter = parseYaml(frontmatterMatch![1]) as Record<string, unknown>
    const hint = frontmatter["argument-hint"]
    expect(
      typeof hint === "string" && hint.includes("output:html"),
      `ce-plan argument-hint must mention 'output:html' so humans discover the flag. Current value: ${JSON.stringify(hint)}`,
    ).toBe(true)
  })

  test("SKILL.md describes the Output Mode resolution inline (not solely in a reference)", () => {
    // The resolution is load-bearing — it determines whether HTML emits at all.
    // Per the AGENTS.md skill design principle ("SKILL.md content caches at
    // session start; references load on demand"), load-bearing rules must live
    // inline. References can describe the HTML composition mechanics, but the
    // arg/config/default precedence and pipeline override must be reachable
    // from the cached skill body.
    expect(
      /Output Mode|OUTPUT_FORMAT/i.test(SKILL_BODY),
      "SKILL.md must contain an Output Mode resolution section that establishes OUTPUT_FORMAT before downstream phases reference it.",
    ).toBe(true)

    // Precedence must be stated: CLI arg > config > default, with a pipeline
    // override. All three signals must be named so an agent reading the file
    // resolves correctly without consulting a reference.
    const phaseStart = SKILL_BODY.indexOf("#### 0.0")
    expect(
      phaseStart,
      "ce-plan SKILL.md no longer contains the Phase 0.0 anchor — Output Mode resolution was removed or moved without updating the test.",
    ).toBeGreaterThan(-1)
    const phaseRegion = SKILL_BODY.slice(phaseStart, phaseStart + 3000)

    expect(
      /output:/.test(phaseRegion),
      "Phase 0.0 must name the `output:` argument prefix.",
    ).toBe(true)
    expect(
      /plan_output/.test(phaseRegion),
      "Phase 0.0 must name the `plan_output` config key.",
    ).toBe(true)
    expect(
      /pipeline|disable-model-invocation/i.test(phaseRegion),
      "Phase 0.0 must describe the pipeline-mode override that forces markdown.",
    ).toBe(true)
    expect(
      /literal[\s-]prefix|literal prefix/i.test(phaseRegion),
      "Phase 0.0 must state the literal-prefix token-parsing convention so `feat:`/`fix:`/`chore:` in feature descriptions pass through verbatim.",
    ).toBe(true)
  })

  test("token-parsing convention names both mode: and output: as flag prefixes", () => {
    // The convention is shared across `mode:`, `output:`, and any future
    // flag-token. Both names must appear together in the parsing prose so a
    // future implementer doesn't generalize to "any <word>:<word> token" and
    // accidentally consume conventional commit prefixes.
    const phaseStart = SKILL_BODY.indexOf("#### 0.0")
    const phaseRegion = SKILL_BODY.slice(phaseStart, phaseStart + 3000)
    expect(
      /mode:/.test(phaseRegion) && /output:/.test(phaseRegion),
      "Phase 0.0 token-parsing convention must name both `mode:` and `output:` as literal-prefix flags so the rule generalizes correctly.",
    ).toBe(true)
  })

  test("Phase 5.2 defers HTML emission to Phase 5.3.9 (after safe_auto)", () => {
    // Composition timing rule: HTML composes AFTER ce-doc-review's safe_auto
    // fixes land on the markdown. Phase 5.2 writes the markdown; Phase 5.3.9
    // writes the HTML. The deferral note must be inline at the write phase so
    // an agent doesn't compose HTML eagerly and ship pre-fix output.
    const phase52Start = SKILL_BODY.indexOf("#### 5.2 Write Plan File")
    expect(phase52Start).toBeGreaterThan(-1)
    const phase52Region = SKILL_BODY.slice(phase52Start, phase52Start + 2000)
    expect(
      /safe_auto|Phase 5\.3\.9|after.*ce-doc-review/i.test(phase52Region),
      "Phase 5.2 must state that HTML emission is deferred until after ce-doc-review's safe_auto fixes apply (Phase 5.3.9), so the first HTML emission reflects autofixes.",
    ).toBe(true)
  })

  test("Phase 5.3.9 contains HTML composition instructions in plan-handoff.md", () => {
    // The actual HTML composition runs after safe_auto. Reference for the
    // composition rules is html-output.md, loaded on demand only when
    // OUTPUT_FORMAT=html.
    const phaseStart = HANDOFF_BODY.indexOf("## 5.3.9")
    expect(phaseStart).toBeGreaterThan(-1)
    const phaseRegion = HANDOFF_BODY.slice(phaseStart, phaseStart + 3000)
    expect(
      /OUTPUT_FORMAT[=\s]*html|when.*html/i.test(phaseRegion),
      "Phase 5.3.9 in plan-handoff.md must include conditional HTML composition for OUTPUT_FORMAT=html.",
    ).toBe(true)
    expect(
      /references\/html-output\.md|html-output\.md/i.test(phaseRegion),
      "Phase 5.3.9 must point at references/html-output.md for the composition rules.",
    ).toBe(true)
  })

  test("post-generation menu offers Open in browser when OUTPUT_FORMAT=html", () => {
    // Mutual exclusion: Open in Proof is replaced by Open in browser in HTML
    // mode (keeps the 5-option menu within the AGENTS.md narrow exception cap).
    // The menu entry, the mutual-exclusion rule, and the routing all live in
    // SKILL.md inline (load-bearing) AND in plan-handoff.md.
    const phaseStart = SKILL_BODY.indexOf("##### 5.3.8")
    expect(phaseStart).toBeGreaterThan(-1)
    const phaseRegion = SKILL_BODY.slice(phaseStart)

    expect(
      /Open in browser/.test(phaseRegion),
      "SKILL.md Phase 5.4 menu must include 'Open in browser' option for HTML mode.",
    ).toBe(true)
    expect(
      /mutual exclusion|replaces|OUTPUT_FORMAT=html/i.test(phaseRegion),
      "SKILL.md must state the mutual-exclusion rule (Open in browser replaces Open in Proof in HTML mode).",
    ).toBe(true)
  })

  test("menu gate predicate for Open in browser matches HTML composition gate", () => {
    // The composition gate (Phase 5.3.9) fires when OUTPUT_FORMAT=html OR
    // Phase 0.1 marked an existing .html sibling for re-render. The menu gate
    // for "Open in browser" must match exactly — otherwise a resume run that
    // regenerated the HTML would still surface Proof and hide the fresh HTML
    // output the user just implicitly requested via sibling re-render.
    const phaseStart = SKILL_BODY.indexOf("##### 5.3.8")
    const phaseRegion = SKILL_BODY.slice(phaseStart)

    // The Open-in-browser rendering condition must mention BOTH parts of the
    // composition predicate: explicit HTML wanted AND sibling re-render.
    // Acceptable framings: "HTML emitted this run", "HTML artifact was produced",
    // or naming both sides of the OR.
    const browserGateRegion = phaseRegion.match(/Open in browser[\s\S]{0,600}/)
    expect(browserGateRegion).not.toBeNull()
    const text = browserGateRegion![0]
    expect(
      /sibling.*re-render|HTML.*emitted|HTML artifact.*produced|Phase 0\.1.*marked/i.test(text),
      "The 'Open in browser' menu gate must use the same predicate as the Phase 5.3.9 composition gate (HTML wanted OR sibling-marked re-render), not just OUTPUT_FORMAT=html. A resume run that regenerates HTML must surface 'Open in browser', not 'Open in Proof'.",
    ).toBe(true)
  })

  test("html-output.md reference exists and is loadable", () => {
    // The reference holds the HTML composition rules: invariants, precedence
    // stack, content-shape questions, affordance idioms, fallback CSS,
    // agent-consumability rules, and post-compose audit. Skill body points at
    // this reference; it must exist.
    const body = readFileSync(HTML_OUTPUT_PATH, "utf8")
    expect(body.length).toBeGreaterThan(0)
    // Spot-check that the major sections we promise the agent are present.
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
